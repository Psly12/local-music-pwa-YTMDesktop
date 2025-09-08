import { io, type Socket } from 'socket.io-client'
import type {
	YTMAuthRequest,
	YTMAuthResponse,
	YTMCommandData,
	YTMConnection,
	YTMPlayerState,
	YTMPlaylist,
	YTMTokenRequest,
	YTMTokenResponse,
} from './types.js'

export class YTMAPIClient {
	private socket: Socket | null = null
	private connection: YTMConnection | null = null
	private onStateUpdate?: (state: YTMPlayerState) => void
	private onConnectionChange?: (connected: boolean) => void
	private reconnectAttempts = 0
	private maxReconnectAttempts = 5
	private reconnectDelay = 1000 // Start with 1 second
	private healthCheckInterval: NodeJS.Timeout | null = null
	private tokenExpiryTime: number | null = null

	constructor() {
		// Restore connection from localStorage if available
		this.loadConnection()
		this.startHealthCheck()
	}

	private getBaseUrl(host = '127.0.0.1', port = 9863): string {
		// YTM Desktop API always runs on HTTP, regardless of the host page protocol
		const protocol = 'http'

		return `${protocol}://${host}:${port}/api/v1`
	}

	private async fetchAPI<T>(
		endpoint: string,
		options?: RequestInit,
		host?: string,
		port?: number,
		retryCount = 0,
	): Promise<T> {
		const baseUrl = this.getBaseUrl(host, port)
		const url = `${baseUrl}${endpoint}`

		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			...(options?.headers as Record<string, string>),
		}

		if (this.connection?.token) {
			headers.Authorization = this.connection.token
		}

		try {
			const response = await fetch(url, {
				...options,
				headers,
				timeout: 10000, // 10 second timeout
			})

			if (!response.ok) {
				// Handle token expiry or invalid token
				if (response.status === 401 || response.status === 403) {
					console.warn('[YTM Client] Token may have expired, clearing connection')
					this.clearConnection()
					throw new Error(
						'Authentication failed. Please reconnect to YouTube Music Desktop.',
					)
				}

				// Handle server errors with retry
				if (response.status >= 500 && retryCount < 3) {
					console.warn(
						`[YTM Client] Server error ${response.status}, retrying... (${retryCount + 1}/3)`,
					)
					await this.delay(1000 * (retryCount + 1))
					return this.fetchAPI(endpoint, options, host, port, retryCount + 1)
				}

				throw new Error(`YTM API request failed: ${response.status} ${response.statusText}`)
			}

			// Reset reconnect attempts on successful request
			this.reconnectAttempts = 0
			this.reconnectDelay = 1000

			// Handle empty responses gracefully
			const text = await response.text()
			if (!text.trim()) {
				return null // Empty response is OK for some commands
			}

			try {
				return JSON.parse(text)
			} catch (jsonError) {
				console.warn('[YTM Client] Failed to parse JSON response:', text)
				throw new Error(`Invalid JSON response: ${jsonError.message}`)
			}
		} catch (error) {
			// Handle network errors with retry
			if (retryCount < 3 && (error instanceof TypeError || error.message.includes('fetch'))) {
				console.warn(
					`[YTM Client] Network error, retrying... (${retryCount + 1}/3)`,
					error.message,
				)
				await this.delay(1000 * (retryCount + 1))
				return this.fetchAPI(endpoint, options, host, port, retryCount + 1)
			}
			throw error
		}
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms))
	}

	async requestAuthCode(
		request: YTMAuthRequest,
		host = '127.0.0.1',
		port = 9863,
	): Promise<string> {
		const response = await this.fetchAPI<YTMAuthResponse>(
			'/auth/requestcode',
			{
				method: 'POST',
				body: JSON.stringify(request),
			},
			host,
			port,
		)

		return response.code
	}

	async exchangeToken(
		request: YTMTokenRequest,
		host = '127.0.0.1',
		port = 9863,
	): Promise<string> {
		const response = await this.fetchAPI<YTMTokenResponse>(
			'/auth/request',
			{
				method: 'POST',
				body: JSON.stringify(request),
			},
			host,
			port,
		)

		// Set token expiry time (YTM Desktop tokens typically last 24 hours)
		this.tokenExpiryTime = Date.now() + 24 * 60 * 60 * 1000 // 24 hours from now

		this.connection = {
			host,
			port,
			token: response.token,
			connected: false,
			tokenExpiryTime: this.tokenExpiryTime,
		}

		this.saveConnection()
		return response.token
	}

	getPlayerState(): Promise<YTMPlayerState | null> {
		if (!this.connection?.token) {
			throw new Error('Not authenticated')
		}

		return this.fetchAPI<YTMPlayerState>(
			'/state',
			undefined,
			this.connection.host,
			this.connection.port,
		)
	}

	getPlaylists(): Promise<YTMPlaylist[]> {
		if (!this.connection?.token) {
			throw new Error('Not authenticated')
		}

		return this.fetchAPI<YTMPlaylist[]>(
			'/playlists',
			undefined,
			this.connection.host,
			this.connection.port,
		)
	}

	async sendCommand(command: string, data?: YTMCommandData): Promise<void> {
		if (!this.connection?.token) {
			throw new Error('Not authenticated')
		}

		const body = data !== undefined ? { command, data } : { command }

		await this.fetchAPI(
			'/command',
			{
				method: 'POST',
				body: JSON.stringify(body),
			},
			this.connection.host,
			this.connection.port,
		)
	}

	connectSocket(
		onStateUpdate?: (state: YTMPlayerState) => void,
		onConnectionChange?: (connected: boolean) => void,
	): void {
		if (!this.connection?.token) {
			throw new Error('Not authenticated')
		}

		// YTM Desktop API always runs on HTTP, regardless of the host page protocol
		const httpProtocol = 'http'

		const socketUrl = `${httpProtocol}://${this.connection.host}:${this.connection.port}/api/v1/realtime`

		this.onStateUpdate = onStateUpdate
		this.onConnectionChange = onConnectionChange

		this.socket = io(socketUrl, {
			auth: {
				token: this.connection.token,
			},
			transports: ['websocket'],
			forceNew: true,
			timeout: 20000, // 20 second connection timeout
			reconnection: true,
			reconnectionAttempts: this.maxReconnectAttempts,
			reconnectionDelay: this.reconnectDelay,
			reconnectionDelayMax: 10000, // Max 10 seconds between attempts
		})

		this.socket.on('connect', () => {
			if (this.connection) {
				this.connection.connected = true
				this.saveConnection()
			}
			this.reconnectAttempts = 0
			this.reconnectDelay = 1000 // Reset delay on successful connection
			this.onConnectionChange?.(true)
			this.requestCurrentState()
		})

		this.socket.on('disconnect', (reason) => {
			if (this.connection) {
				this.connection.connected = false
				this.saveConnection()
			}
			this.onConnectionChange?.(false)

			// Auto-reconnect for certain disconnect reasons
			if (reason === 'io server disconnect' || reason === 'transport close') {
				void this.attemptReconnect()
			}
		})

		this.socket.on('state-update', (state: YTMPlayerState) => {
			this.onStateUpdate?.(state)
		})

		this.socket.on('connect_error', (error) => {
			console.error('[YTM Client] Socket connection error:', error)
			this.onConnectionChange?.(false)
			this.handleConnectionError(error)
		})

		this.socket.on('reconnect_attempt', (_attemptNumber) => {})

		this.socket.on('reconnect_error', (error) => {
			console.error('[YTM Client] Reconnection failed:', error)
		})

		this.socket.on('reconnect_failed', () => {
			console.error('[YTM Client] All reconnection attempts failed')
			this.onConnectionChange?.(false)
		})
	}

	requestCurrentState(): void {
		if (this.socket?.connected) {
			this.socket.emit('get-state')
		}
	}

	disconnect(): void {
		if (this.socket) {
			this.socket.disconnect()
			this.socket = null
		}

		if (this.connection) {
			this.connection.connected = false
			this.saveConnection()
		}

		this.onConnectionChange?.(false)
	}

	isConnected(): boolean {
		return this.socket?.connected
	}

	getCurrentConnection(): YTMConnection | null {
		return this.connection
	}

	private saveConnection(): void {
		if (this.connection) {
			localStorage.setItem('ytm-connection', JSON.stringify(this.connection))
		}
	}

	private loadConnection(): void {
		const saved = localStorage.getItem('ytm-connection')
		if (saved) {
			try {
				this.connection = JSON.parse(saved)
				this.tokenExpiryTime = this.connection?.tokenExpiryTime || null

				// Check if loaded token is expired
				if (this.connection?.token && !this.isTokenValid()) {
					console.warn('[YTM Client] Loaded token is expired, clearing connection')
					this.clearConnection()
				}
			} catch (e) {
				console.error('Failed to load YTM connection:', e)
				localStorage.removeItem('ytm-connection')
			}
		}
	}

	setConnection(connection: YTMConnection): void {
		this.connection = connection
		this.saveConnection()
	}

	clearConnection(): void {
		this.connection = null
		this.tokenExpiryTime = null
		localStorage.removeItem('ytm-connection')
		if (this.socket) {
			this.socket.disconnect()
			this.socket = null
		}
		this.stopHealthCheck()
	}

	private async attemptReconnect(): Promise<void> {
		if (this.reconnectAttempts >= this.maxReconnectAttempts) {
			console.error('[YTM Client] Max reconnection attempts reached')
			return
		}

		this.reconnectAttempts++
		const delay = Math.min(this.reconnectDelay * 2 ** (this.reconnectAttempts - 1), 10000)

		await this.delay(delay)

		if (this.connection?.token) {
			try {
				// Test token validity before attempting socket reconnection
				await this.getPlayerState()
				this.connectSocket(this.onStateUpdate, this.onConnectionChange)
			} catch (_error) {
				console.warn('[YTM Client] Token invalid during reconnect, clearing connection')
				this.clearConnection()
				this.onConnectionChange?.(false)
			}
		}
	}

	private handleConnectionError(error: unknown): void {
		console.error('[YTM Client] Connection error:', error)

		// Handle specific error types
		if (
			error instanceof Error &&
			(error.message?.includes('unauthorized') || error.message?.includes('forbidden'))
		) {
			console.warn('[YTM Client] Authentication error, clearing token')
			this.clearConnection()
		}
	}

	private startHealthCheck(): void {
		// Health check every 5 minutes
		this.healthCheckInterval = setInterval(
			() => {
				void this.performHealthCheck()
			},
			5 * 60 * 1000,
		)
	}

	private stopHealthCheck(): void {
		if (this.healthCheckInterval) {
			clearInterval(this.healthCheckInterval)
			this.healthCheckInterval = null
		}
	}

	private async performHealthCheck(): Promise<void> {
		if (!this.connection?.token) {
			return
		}

		// Check if token is nearing expiry (within 1 hour)
		if (this.tokenExpiryTime && Date.now() + 60 * 60 * 1000 >= this.tokenExpiryTime) {
			console.warn('[YTM Client] Token expires soon, clearing connection for renewal')
			this.clearConnection()
			this.onConnectionChange?.(false)
			return
		}

		// Test connection health
		try {
			await this.getPlayerState()
		} catch (error) {
			console.warn('[YTM Client] Health check failed:', error)
			if (error.message?.includes('Authentication failed')) {
				this.clearConnection()
				this.onConnectionChange?.(false)
			}
		}
	}

	isTokenValid(): boolean {
		if (!this.connection?.token) {
			return false
		}
		if (!this.tokenExpiryTime) {
			return true // Assume valid if no expiry set
		}
		return Date.now() < this.tokenExpiryTime
	}

	getTokenExpiryTime(): number | null {
		return this.tokenExpiryTime
	}
}
