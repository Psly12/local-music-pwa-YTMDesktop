import { extractColorFromImageUrl } from '$lib/helpers/extract-artwork-color.ts'
import type { YTMPlaylist, YTMSearchResponse, YTMTrack } from '$lib/services/ytm-api'
import { ytmStore } from '$lib/services/ytm-api'

export type PlayerRepeat = 'none' | 'one' | 'all'

// Utility function to get the highest quality thumbnail from YTM thumbnails array
function getHighestQualityThumbnail(
	thumbnails?: Array<{ url: string; width?: number; height?: number }>,
): string {
	if (!thumbnails || thumbnails.length === 0) {
		return ''
	}

	const highestQuality = thumbnails.reduce((best, current) => {
		const bestSize = (best.width || 0) * (best.height || 0)
		const currentSize = (current.width || 0) * (current.height || 0)
		return currentSize > bestSize ? current : best
	}, thumbnails[0])

	return highestQuality.url
}

export class YTMPlayerStore {
	#volume = $state(100)
	#volumeBeforeMute = $state(100) // Store volume before muting for restoration
	#shuffleState = $state(false) // Track shuffle state client-side since API doesn't provide it
	#currentTrackWithColor = $state<YTMTrack | null>(null) // Cache current track with extracted color
	#muted = $state(false) // Track mute state client-side
	#seeking = $state(false) // Track if we're currently seeking to prevent play state flickering
	#lastStablePlayingState = $state(false) // Store last stable playing state during seeks

	get volume() {
		// When muted, display volume as 0
		return this.#muted ? 0 : this.#volume
	}

	set volume(value: number) {
		// Auto-unmute when slider is moved and volume > 0
		if (this.#muted && value > 0) {
			this.#muted = false
			// Send unmute command to YTM
			if (ytmStore.isConnected) {
				ytmStore.unmute().catch((error) => {
					console.warn('Failed to unmute:', error)
				})
			}
		}

		this.#volume = value
		// Sync with YTM
		if (ytmStore.isConnected) {
			ytmStore.setVolume(value).catch((error) => {
				console.warn('Failed to sync volume to YTM:', error)
			})
		}
	}

	get muted(): boolean {
		return this.#muted
	}

	set muted(value: boolean) {
		this.#muted = value
	}

	// YTM-derived properties
	get playing(): boolean {
		const currentPlaying = ytmStore.state?.player?.trackState === 1

		// If we're seeking, return the last stable state to prevent flickering
		if (this.#seeking) {
			return this.#lastStablePlayingState
		}

		return currentPlaying
	}

	get currentTime(): number {
		return ytmStore.state?.player?.videoProgress || 0
	}

	get duration(): number {
		return ytmStore.state?.video?.durationSeconds || 0
	}

	get activeTrack(): YTMTrack | null {
		const state = ytmStore.state
		if (!state?.video) {
			return null
		}

		const thumbnailUrl = getHighestQualityThumbnail(state.video.thumbnails)
		const basicTrack: YTMTrack = {
			title: state.video.title,
			artists: [state.video.author],
			album: state.video.album,
			duration: state.video.durationSeconds,
			thumbnail: thumbnailUrl,
			id: state.video.id,
			url: `https://music.youtube.com/watch?v=${state.video.id}`,
		}

		// If we have a cached track with the same ID and thumbnail, return it (with color)
		if (
			this.#currentTrackWithColor?.id === basicTrack.id &&
			this.#currentTrackWithColor?.thumbnail === basicTrack.thumbnail
		) {
			return this.#currentTrackWithColor
		}

		// Otherwise, start color extraction in the background and return basic track for now
		this.#extractColorForTrack(basicTrack)
		return basicTrack
	}

	async #extractColorForTrack(track: YTMTrack): Promise<void> {
		if (!track.thumbnail) {
			return
		}

		try {
			const primaryColor = await extractColorFromImageUrl(track.thumbnail)

			// Only update if this is still the current track
			if (ytmStore.state?.video?.id === track.id) {
				this.#currentTrackWithColor = {
					...track,
					primaryColor,
				}
			}
		} catch (error) {
			console.warn('Failed to extract color for track:', track.title, error)
		}
	}

	get queue(): YTMTrack[] {
		const queueItems = ytmStore.state?.player?.queue?.items || []
		return queueItems.map((item) => ({
			title: item.title,
			artists: [item.author],
			album: '', // Queue items don't have album info
			duration: 0, // Duration is string format, would need parsing
			thumbnail: getHighestQualityThumbnail(item.thumbnails),
			id: item.videoId,
			url: `https://music.youtube.com/watch?v=${item.videoId}`,
		}))
	}

	get shuffle(): boolean {
		// Use client-side tracked state since YTM API doesn't provide shuffle state
		return this.#shuffleState
	}

	get repeat(): PlayerRepeat {
		const ytmRepeatMode = ytmStore.state?.player?.queue?.repeatMode
		switch (ytmRepeatMode) {
			case 0:
				return 'none' // No repeat
			case 1:
				return 'all' // Repeat all
			case 2:
				return 'one' // Repeat one
			default:
				return 'none'
		}
	}

	get isQueueEmpty(): boolean {
		return this.queue.length === 0
	}

	get activeTrackIndex(): number {
		return ytmStore.state?.player?.queue?.selectedItemIndex || 0
	}

	get artworkSrc(): string | undefined {
		const thumbnailUrl = getHighestQualityThumbnail(ytmStore.state?.video?.thumbnails)
		return thumbnailUrl || undefined
	}

	get isConnected(): boolean {
		return ytmStore.isConnected
	}

	get connectionError(): string | null {
		return ytmStore.lastError
	}

	get userPlaylists(): YTMPlaylist[] {
		return ytmStore.userPlaylists
	}

	constructor() {
		// Auto-connect to YTM Desktop on startup
		this.autoConnect()

		// Track playing state changes to store stable state when not seeking
		$effect(() => {
			const currentPlaying = ytmStore.state?.player?.trackState === 1
			if (!this.#seeking) {
				this.#lastStablePlayingState = currentPlaying
			}
		})

		// Set up Media Session API
		const ms = window.navigator.mediaSession

		$effect(() => {
			const track = this.activeTrack

			if (!track) {
				ms.metadata = null
				return
			}

			ms.metadata = new MediaMetadata({
				title: track.title,
				artist: track.artists.join(', '),
				album: track.album || 'Unknown Album',
				artwork: track.thumbnail
					? [
							{
								src: track.thumbnail,
								sizes: '512x512',
								type: 'image/jpeg',
							},
						]
					: [
							{
								src: new URL('/artwork.svg', location.origin).toString(),
								sizes: '512x512',
								type: 'image/svg+xml',
							},
						],
			})
		})

		// Media session handlers
		const setActionHandler = ms.setActionHandler.bind(ms)
		setActionHandler('play', () => this.togglePlay(true))
		setActionHandler('pause', () => this.togglePlay(false))
		setActionHandler('previoustrack', this.playPrev)
		setActionHandler('nexttrack', this.playNext)
		setActionHandler('seekbackward', () => {
			const newPosition = Math.max(this.currentTime - 10, 0)
			this.seek(newPosition)
		})
		setActionHandler('seekforward', () => {
			const newPosition = Math.min(this.currentTime + 10, this.duration)
			this.seek(newPosition)
		})

		// Sync volume changes
		$effect(() => {
			const ytmVolume = ytmStore.state?.player?.volume
			if (ytmVolume !== undefined && ytmVolume !== this.#volume) {
				this.#volume = ytmVolume
			}
		})
	}

	togglePlay = async (force?: boolean): Promise<void> => {
		if (!ytmStore.isConnected) {
			console.warn('Not connected to YouTube Music Desktop')
			return
		}

		// If force is specified, we need to check current state
		if (force !== undefined) {
			const shouldPlay = force
			const isCurrentlyPlaying = this.playing

			// Only toggle if the desired state is different from current state
			if (shouldPlay !== isCurrentlyPlaying) {
				await ytmStore.togglePlayPause()
			}
		} else {
			// No force specified, just toggle
			await ytmStore.togglePlayPause()
		}
	}

	playNext = async (): Promise<void> => {
		if (!ytmStore.isConnected) {
			return
		}
		await ytmStore.next()
	}

	playPrev = async (): Promise<void> => {
		if (!ytmStore.isConnected) {
			return
		}
		await ytmStore.previous()
	}

	seek = async (time: number): Promise<void> => {
		if (!ytmStore.isConnected) {
			return
		}

		// Store current stable state before seeking
		this.#lastStablePlayingState = ytmStore.state?.player?.trackState === 1
		this.#seeking = true

		try {
			await ytmStore.seek(time)

			// Clear seeking state after a brief delay to allow YTM to stabilize
			setTimeout(() => {
				this.#seeking = false
			}, 300)
		} catch (error) {
			this.#seeking = false
			throw error
		}
	}

	playTrackAtIndex = async (index: number): Promise<void> => {
		if (!ytmStore.isConnected) {
			return
		}
		await ytmStore.playTrackAtIndex(index)
	}

	toggleRepeat = async (): Promise<void> => {
		if (!ytmStore.isConnected) {
			return
		}
		await ytmStore.toggleRepeat()
	}

	toggleShuffle = async (): Promise<void> => {
		if (!ytmStore.isConnected) {
			return
		}
		// Toggle client-side state first for immediate UI feedback
		this.#shuffleState = !this.#shuffleState
		// Then send command to YTM
		await ytmStore.toggleShuffle()
	}

	setVolume = async (volume: number): Promise<void> => {
		this.volume = volume
	}

	volumeUp = async (increment = 10): Promise<void> => {
		if (this.#muted) {
			// Volume up while muted: unmute and increase from zero
			this.#muted = false
			// Send unmute command to YTM
			if (ytmStore.isConnected) {
				ytmStore.unmute().catch((error) => {
					console.warn('Failed to unmute:', error)
				})
			}
			// Increase from zero
			this.volume = Math.min(increment, 100)
		} else {
			// Normal volume increase
			this.volume = Math.min(this.#volume + increment, 100)
		}
	}

	volumeDown = async (decrement = 10): Promise<void> => {
		if (this.#muted) {
			// Volume down while muted: toggle mute (unmute to restore volume)
			await this.toggleMute()
		} else {
			// Normal volume decrease
			this.volume = Math.max(this.#volume - decrement, 0)
		}
	}

	toggleMute = async (): Promise<void> => {
		if (!ytmStore.isConnected) {
			console.warn('Not connected to YouTube Music Desktop')
			return
		}

		// Toggle mute state
		if (this.#muted) {
			// Unmute: restore previous volume
			await ytmStore.unmute()
			this.#muted = false
			// Restore previous volume
			this.#volume = this.#volumeBeforeMute
			// Sync with YTM
			ytmStore.setVolume(this.#volume).catch((error) => {
				console.warn('Failed to restore volume:', error)
			})
		} else {
			// Mute: store current volume
			this.#volumeBeforeMute = this.#volume
			await ytmStore.mute()
			this.#muted = true
		}
	}

	mute = async (): Promise<void> => {
		if (!ytmStore.isConnected) {
			return
		}
		await ytmStore.mute()
		this.#muted = true
	}

	unmute = async (): Promise<void> => {
		if (!ytmStore.isConnected) {
			return
		}
		await ytmStore.unmute()
		this.#muted = false
	}

	likeTrack = async (): Promise<void> => {
		if (!ytmStore.isConnected) {
			return
		}
		await ytmStore.likeTrack()
	}

	loadPlaylist = async (playlistId: string): Promise<void> => {
		if (!ytmStore.isConnected) {
			return
		}
		await ytmStore.loadPlaylist(playlistId)
	}

	get isLiked(): boolean {
		// Get like status from current track (2 = liked, 1 = disliked, 0 = neutral)
		return ytmStore.state?.video?.likeStatus === 2
	}

	// Auto-connect on startup - only restore existing valid connections
	private async autoConnect(): Promise<void> {
		// Check if there's an existing connection stored
		const existingConnection = ytmStore.getCurrentConnection()

		if (existingConnection?.token && ytmStore.isTokenValid()) {
			try {
				// Use the store's connect method which will handle the auto-reconnect path
				const success = await ytmStore.connect(
					existingConnection.host,
					existingConnection.port,
				)
				if (success) {
				} else {
					console.warn('[YTMPlayer] Auto-reconnect failed')
				}
			} catch (error) {
				console.warn('[YTMPlayer] Auto-reconnect error:', error)
			}
		} else {
			// Don't automatically attempt new auth flows - require explicit user action
		}
	}

	// Connection management
	async connect(host = '127.0.0.1', port = 9863): Promise<boolean> {
		return ytmStore.connect(host, port)
	}

	async disconnect(): Promise<void> {
		return ytmStore.disconnect()
	}

	resetConnection(): void {
		ytmStore.resetConnection()
	}

	async forceReconnect(): Promise<boolean> {
		return ytmStore.forceReconnect()
	}

	// Legacy compatibility methods (for existing UI)
	playTrack = (): void => {
		console.warn(
			'playTrack not implemented for YTM - use YTM Desktop interface to select tracks',
		)
	}

	addToQueue = (): void => {
		console.warn(
			'addToQueue not implemented for YTM - use YTM Desktop interface to manage queue',
		)
	}

	clearQueue = (): void => {
		console.warn(
			'clearQueue not implemented for YTM - use YTM Desktop interface to manage queue',
		)
	}

	reset = (): void => {
		// Nothing to reset for YTM player
	}

	// Search and video playback functionality
	async searchVideos(query: string): Promise<YTMSearchResponse | null> {
		return await ytmStore.searchVideos(query)
	}

	async playVideoById(videoId: string): Promise<void> {
		await ytmStore.playVideoById(videoId)
	}

	async addVideoToQueue(videoId: string, position?: number): Promise<void> {
		await ytmStore.addVideoToQueue(videoId, position)
	}
}
