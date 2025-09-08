import { logger } from '$lib/helpers/logger.ts'
import { YTMAPIClient } from './client.js'
import type {
	YTMConnection,
	YTMPlayerState,
	YTMPlaylist,
	YTMSearchResponse,
	YTMTrack,
} from './types.js'

// Utility function to get the highest quality thumbnail from YTM thumbnails array
function getHighestQualityThumbnail(
	thumbnails?: Array<{ url: string; width?: number; height?: number }>,
): string {
	if (!thumbnails || thumbnails.length === 0) {
		return ''
	}

	const highestQuality = thumbnails.reduce((best, current) => {
		const bestSize = (best?.width || 0) * (best?.height || 0)
		const currentSize = (current.width || 0) * (current.height || 0)
		return currentSize > bestSize ? current : best
	}, thumbnails[0])

	return highestQuality?.url || ''
}

class YTMStore {
	private client = new YTMAPIClient()
	private playerState = $state<YTMPlayerState | null>(null)
	private playlists = $state<YTMPlaylist[]>([])
	private connected = $state(false)
	private connecting = $state(false)
	private error = $state<string | null>(null)
	private loadingInitialData = false

	constructor() {
		const connection = this.client.getCurrentConnection()
		if (connection?.token) {
			this.connected = connection.connected
		}
	}

	get state(): YTMPlayerState | null {
		return this.playerState
	}

	get userPlaylists(): YTMPlaylist[] {
		return this.playlists
	}

	get isConnected(): boolean {
		return this.connected
	}

	get isConnecting(): boolean {
		return this.connecting
	}

	get lastError(): string | null {
		return this.error
	}

	get currentTrack(): YTMTrack | null {
		const state = this.playerState
		if (!state?.video) {
			return null
		}

		return {
			title: state.video.title,
			artists: [state.video.author],
			album: state.video.album,
			duration: state.video.durationSeconds,
			thumbnail: getHighestQualityThumbnail(state.video.thumbnails),
			id: state.video.id,
			url: `https://music.youtube.com/watch?v=${state.video.id}`,
		}
	}

	get isPlaying(): boolean {
		return this.playerState?.player?.trackState === 1
	}

	get volume(): number {
		return this.playerState?.player?.volume || 0
	}

	get progress(): number {
		return this.playerState?.player?.videoProgress || 0
	}

	get queue(): YTMTrack[] {
		return ((this.playerState?.player?.queue?.items || []) as unknown) as YTMTrack[]
	}

	async connect(host = '127.0.0.1', port = 9863): Promise<boolean> {
		logger.ytm.info(`Attempting to connect to ${host}:${port}`)
		this.connecting = true
		this.error = null

		try {
			// First, test if YTM Desktop is running by trying to reach the API
			logger.ytm.debug('Testing if YTM Desktop is reachable...', { host, port })
			logger.ytm.info('MANUAL CONNECT: About to make HEAD request to test reachability')
			await fetch(`http://${host}:${port}/api/v1/state`, {
				method: 'HEAD',
				mode: 'cors',
			}).catch((e) => {
				logger.ytm.error('YTM Desktop not reachable', e, { host, port })
				logger.ytm.error('MANUAL CONNECT: HEAD request failed with error:', e)
				throw new Error(
					`YouTube Music Desktop is not running or not accessible at ${host}:${port}. Please ensure YTM Desktop is installed, running, and has the "Remote Control API" enabled in Settings → Integrations.`,
				)
			})

			logger.ytm.debug('YTM Desktop is reachable', { host, port })
			logger.ytm.info('MANUAL CONNECT: HEAD request succeeded')

			// First try to connect with existing token if available
			const existingConnection = this.client.getCurrentConnection()
			logger.ytm.debug('Checking existing connection', { existingConnection })

			if (
				existingConnection?.token &&
				existingConnection.host === host &&
				existingConnection.port === port &&
				this.client.isTokenValid()
			) {
				logger.ytm.debug('Using existing valid token, testing connection...')
				logger.ytm.info('AUTO-CONNECT PATH: Found existing valid token, skipping auth flow')
				try {
					// Test if existing token is still valid
					await this.client.getPlayerState()
					logger.ytm.info('Existing token is valid, connecting socket...')
					logger.ytm.info('AUTO-CONNECT PATH: Token verification succeeded')

					// Set connected state immediately for UI feedback
					this.connected = true
					this.error = null

					await this.connectSocket()
					await this.loadInitialData()
					this.connecting = false
					return true
				} catch (tokenError) {
					logger.ytm.warn(
						'Existing token is invalid, clearing and requesting new auth...',
						{ error: tokenError },
					)
					logger.ytm.warn(
						'AUTO-CONNECT PATH: Token verification failed, falling back to auth flow',
					)
					this.client.clearConnection()
				}
			} else if (existingConnection?.token) {
				logger.ytm.warn('Existing token is expired or for different host, clearing...')
				logger.ytm.warn(
					'TOKEN MISMATCH: Clearing existing connection due to host/port/expiry mismatch',
				)
				this.client.clearConnection()
			}

			logger.ytm.info('Requesting new auth code...')
			logger.ytm.info('AUTH FLOW PATH: Starting fresh authentication flow')
			// Request authentication with correct protocol
			const code = await this.client.requestAuthCode(
				{
					appId: 'localmusicpwa', // Must be lowercase alphanumeric, 2-32 chars
					appName: 'Local Music PWA',
					appVersion: '1.0.0',
				},
				host,
				port,
			)

			logger.ytm.info(
				`Auth code received: ${code}. Please approve the connection in YouTube Music Desktop within 30 seconds.`,
			)

			// Enhanced waiting with progress indication
			logger.ytm.debug('Waiting for user approval with enhanced retry logic...')
			let approved = false
			let attempts = 0
			const maxAttempts = 6 // 30 seconds total

			while (!approved && attempts < maxAttempts) {
				await new Promise((resolve) => setTimeout(resolve, 5000))
				attempts++

				try {
					logger.ytm.debug(`Attempting token exchange (${attempts}/${maxAttempts})...`)
					await this.client.exchangeToken(
						{
							appId: 'localmusicpwa', // Must match the requestcode appId
							code,
						},
						host,
						port,
					)

					logger.ytm.info('Token received successfully!')
					approved = true
					break
				} catch (exchangeError) {
					if (attempts < maxAttempts) {
						logger.ytm.debug(
							`Token exchange failed, retrying... (${attempts}/${maxAttempts})`,
						)
					} else {
						throw exchangeError
					}
				}
			}

			if (!approved) {
				throw new Error(
					'User did not approve the connection request within 30 seconds. Please try again.',
				)
			}

			logger.ytm.info('Establishing enhanced socket connection...')

			// Set connected state immediately for UI feedback
			this.connected = true
			this.error = null

			await this.connectSocket()
			await this.loadInitialData()

			this.connecting = false
			logger.ytm.info('Enhanced connection established successfully!')
			return true
		} catch (error) {
			logger.ytm.error('Connection failed', error)
			this.error = error instanceof Error ? error.message : 'Connection failed'
			this.connecting = false
			return false
		}
	}

	private async connectSocket(): Promise<void> {
		this.client.connectSocket(
			(state: YTMPlayerState) => {
				this.playerState = state
			},
			(connected: boolean) => {
				logger.ytm.debug('Connection status changed', { connected })
				this.connected = connected
				if (connected) {
					// When socket connects, only load initial data if not already loaded/loading
					if (!this.loadingInitialData && this.playlists.length === 0) {
						logger.ytm.info('Socket connected, loading initial data...')
						void this.loadInitialData()
					} else {
						logger.ytm.info('Socket connected, initial data already loaded/loading')
					}
				} else {
					this.error = 'Lost connection to YouTube Music Desktop'
				}
			},
		)

		// Wait a moment for connection to establish
		await new Promise((resolve) => setTimeout(resolve, 1000))
	}

	private async loadInitialData(): Promise<void> {
		// Prevent duplicate loading
		if (this.loadingInitialData) {
			return
		}

		this.loadingInitialData = true

		try {
			// Only load playlists via REST API, state will come via socket
			const playlists = await this.client.getPlaylists()
			this.playlists = playlists
		} catch (error) {
			console.error('[YTM Store] Failed to load initial data:', error)

			// Handle rate limiting more gracefully
			if (error instanceof Error && error.message.includes('429')) {
				console.warn('[YTM Store] Rate limited, will retry playlists later...')
				this.error = null // Don't show error to user for rate limits
			} else {
				this.error = error instanceof Error ? error.message : 'Failed to load data'
			}
		} finally {
			this.loadingInitialData = false
		}
	}

	disconnect(): Promise<void> {
		this.client.disconnect()
		this.connected = false
		this.playerState = null
		this.playlists = []
		this.loadingInitialData = false
		return Promise.resolve()
	}

	resetConnection(): void {
		this.client.clearConnection()
		this.connected = false
		this.connecting = false
		this.error = null
		this.playerState = null
		this.playlists = []
		this.loadingInitialData = false
	}

	async forceReconnect(): Promise<boolean> {
		this.resetConnection()
		// Try to reconnect to default
		return await this.connect('127.0.0.1', 9863)
	}

	async play(): Promise<void> {
		if (!this.connected) {
			return
		}
		await this.client.sendCommand('playPause')
	}

	async pause(): Promise<void> {
		if (!this.connected) {
			return
		}
		await this.client.sendCommand('playPause')
	}

	async togglePlayPause(): Promise<void> {
		if (!this.connected) {
			return
		}
		await this.client.sendCommand('playPause')
	}

	async next(): Promise<void> {
		if (!this.connected) {
			return
		}
		await this.client.sendCommand('next')
	}

	async previous(): Promise<void> {
		if (!this.connected) {
			return
		}
		await this.client.sendCommand('previous')
	}

	async setVolume(volume: number): Promise<void> {
		if (!this.connected) {
			return
		}
		await this.client.sendCommand('setVolume', volume as any)
	}

	async volumeUp(): Promise<void> {
		if (!this.connected) {
			return
		}
		await this.client.sendCommand('volumeUp')
	}

	async volumeDown(): Promise<void> {
		if (!this.connected) {
			return
		}
		await this.client.sendCommand('volumeDown')
	}

	async mute(): Promise<void> {
		if (!this.connected) {
			return
		}
		await this.client.sendCommand('mute')
	}

	async unmute(): Promise<void> {
		if (!this.connected) {
			return
		}
		await this.client.sendCommand('unmute')
	}

	async seek(position: number): Promise<void> {
		if (!this.connected) {
			return
		}
		await this.client.sendCommand('seekTo', position as any)
	}

	async playTrackAtIndex(index: number): Promise<void> {
		if (!this.connected) {
			return
		}
		await this.client.sendCommand('playQueueIndex', index as any)
	}

	async likeTrack(): Promise<void> {
		if (!this.connected) {
			return
		}
		await this.client.sendCommand('toggleLike')
	}

	async loadPlaylist(playlistId: string): Promise<void> {
		if (!this.connected) {
			return
		}
		// Use the correct YTM API command to load a playlist
		await this.client.sendCommand('changeVideo', { playlistId })
	}

	async toggleShuffle(): Promise<void> {
		if (!this.connected) {
			return
		}
		await this.client.sendCommand('shuffle')
	}

	async toggleRepeat(): Promise<void> {
		if (!this.connected) {
			return
		}
		// Based on working code, repeat cycles through modes 0,1,2
		const currentMode = this.playerState?.player?.queue?.repeatMode || 0
		const nextMode = (currentMode + 1) % 3
		await this.client.sendCommand('repeatMode', nextMode as any)
	}

	getCurrentConnection(): YTMConnection | null {
		return this.client.getCurrentConnection()
	}

	setConnection(connection: YTMConnection): void {
		this.client.setConnection(connection)
	}

	isTokenValid(): boolean {
		return this.client.isTokenValid()
	}

	getTokenExpiryTime(): number | null {
		return this.client.getTokenExpiryTime()
	}

	getConnectionHealth(): {
		connected: boolean
		tokenValid: boolean
		expiryTime: number | null
		timeUntilExpiry: number | null
	} {
		const expiryTime = this.getTokenExpiryTime()
		return {
			connected: this.isConnected,
			tokenValid: this.isTokenValid(),
			expiryTime,
			timeUntilExpiry: expiryTime ? expiryTime - Date.now() : null,
		}
	}

	async searchVideos(query: string): Promise<YTMSearchResponse | null> {
		try {
			// Use our server-side YouTube search API
			const response = await fetch(
				`/api/youtube-search?q=${encodeURIComponent(query)}&limit=20`,
			)

			if (!response.ok) {
				throw new Error(`YouTube search failed: ${response.status} ${response.statusText}`)
			}

			const data = await response.json()

			return data as YTMSearchResponse
		} catch (error) {
			console.error('[YTM Store] YouTube search failed:', error)
			return null
		}
	}

	async playVideoById(videoId: string): Promise<void> {
		if (!this.connected) {
			console.warn('[YTM Store] Cannot play video - not connected')
			return
		}

		try {
			await this.client.sendCommand('changeVideo', { videoId })
		} catch (error) {
			console.error('[YTM Store] Failed to play video:', error)
		}
	}

	async addVideoToQueue(videoId: string, position?: number): Promise<void> {
		if (!this.connected) {
			console.warn('[YTM Store] Cannot add to queue - not connected')
			return
		}

		try {
			const commandData = position !== undefined ? { videoId, position } : { videoId }
			await this.client.sendCommand('addSongToQueue', commandData)
		} catch (error) {
			console.error('[YTM Store] Failed to add video to queue:', error)
		}
	}
}

export const ytmStore = new YTMStore()
