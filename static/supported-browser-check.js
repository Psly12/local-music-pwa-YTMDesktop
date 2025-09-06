// IMPORTANT. This file must be imported as separate entry point
// and it cannot use any modern JS syntax.

// Add polyfills for missing APIs before other scripts load
if (!('randomUUID' in crypto)) {
	crypto.randomUUID = function() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random() * 16 | 0
			var v = c == 'x' ? r : (r & 0x3 | 0x8)
			return v.toString(16)
		})
	}
}

if (!('locks' in navigator)) {
	navigator.locks = {
		request: function(name, callback) {
			return callback()
		}
	}
}

if (!('timeout' in AbortSignal)) {
	AbortSignal.timeout = function(delay) {
		var controller = new AbortController()
		setTimeout(function() { controller.abort() }, delay)
		return controller.signal
	}
}

// Check for essential features required for basic functionality
var hasEssentialFeatures =
	'noModule' in HTMLScriptElement.prototype &&
	CSS &&
	CSS.supports &&
	'fetch' in window

// Check for advanced features (optional for basic functionality)
var hasAdvancedFeatures =
	navigator.locks &&
	'timeout' in AbortSignal &&
	CSS.supports('color: color-mix(in oklab, black, black)') &&
	// Container queries
	'container' in document.documentElement.style

var isSupportedBrowser = hasEssentialFeatures

// Show warning for browsers missing advanced features but still allow access
if (hasEssentialFeatures && !hasAdvancedFeatures) {
	console.warn('Some advanced features may not work properly on this browser')
}

if (!isSupportedBrowser) {
	document.getElementById('unsupported-browser').removeAttribute('hidden')
	document.getElementById('app').style.display = 'none'
}
