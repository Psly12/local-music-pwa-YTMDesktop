// Service Worker Registration
console.log('SW Registration script loaded');
console.log('Navigator object:', navigator);
console.log('Has serviceWorker property:', 'serviceWorker' in navigator);
console.log('ServiceWorker value:', navigator.serviceWorker);
console.log('Location protocol:', location.protocol);
console.log('Location hostname:', location.hostname);

if ('serviceWorker' in navigator) {
	console.log('✅ ServiceWorker supported');
	
	// Check if we're on HTTPS or localhost
	if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
		console.warn('⚠️ Service Workers require HTTPS or localhost');
	}
	
	window.addEventListener('load', function() {
		console.log('🔄 Window loaded, attempting SW registration');
		
		navigator.serviceWorker.register('/service-worker.js', { 
			scope: '/' 
		})
		.then(function(registration) {
			console.log('✅ SW registered successfully:', registration);
			console.log('📍 SW scope:', registration.scope);
			console.log('🏃 SW state:', registration.active ? registration.active.state : 'no active worker');
		})
		.catch(function(error) {
			console.error('❌ SW registration failed:', error);
		});
		
		// Check for existing service worker
		navigator.serviceWorker.ready.then(function(registration) {
			console.log('🎯 SW ready:', registration);
		}).catch(function(error) {
			console.error('❌ SW ready failed:', error);
		});
	});
} else {
	console.log('❌ ServiceWorker not supported');
	console.log('User Agent:', navigator.userAgent);
}