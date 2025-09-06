// Browser polyfills for older mobile browsers

// Web Locks API polyfill for browsers that don't support it
if (!('locks' in navigator)) {
	// Simple polyfill that just executes the callback immediately
	// This won't provide actual locking but prevents crashes
	;(navigator as any).locks = {
		request: (name: string, callback: () => Promise<any>) => {
			return callback()
		}
	}
}

// AbortSignal.timeout polyfill for older browsers
if (!('timeout' in AbortSignal)) {
	;(AbortSignal as any).timeout = (delay: number) => {
		const controller = new AbortController()
		setTimeout(() => controller.abort(), delay)
		return controller.signal
	}
}

// crypto.randomUUID polyfill for older browsers
if (!('randomUUID' in crypto)) {
	;(crypto as any).randomUUID = function() {
		// Simple UUID v4 implementation
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			const r = Math.random() * 16 | 0
			const v = c == 'x' ? r : (r & 0x3 | 0x8)
			return v.toString(16)
		})
	}
}

export {}