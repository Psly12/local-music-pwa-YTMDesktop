#!/usr/bin/env node

console.log('🎯 Final PWA Installation Readiness Test')
console.log('=========================================\n')

const BASE_URL = 'http://localhost:4174'

// Helper function to make HTTP requests
async function fetchUrl(url) {
    try {
        const response = await fetch(url)
        return {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            text: await response.text()
        }
    } catch (error) {
        return { error: error.message }
    }
}

// Test all critical paths for PWA installation
async function runFinalTest() {
    let allPassed = true
    
    console.log('🌐 Testing Base URL')
    const indexResponse = await fetchUrl(BASE_URL)
    if (indexResponse.status === 200) {
        console.log('✅ Base URL accessible')
        
        // Check if HTML includes manifest link
        if (indexResponse.text.includes('rel="manifest"')) {
            console.log('✅ HTML includes manifest link')
        } else {
            console.log('❌ HTML missing manifest link')
            allPassed = false
        }
        
        // Check if HTML includes service worker registration
        if (indexResponse.text.includes('serviceWorker') && indexResponse.text.includes('register')) {
            console.log('✅ HTML includes service worker registration')
        } else {
            console.log('❌ HTML missing service worker registration')
            allPassed = false
        }
    } else {
        console.log('❌ Base URL not accessible')
        allPassed = false
    }
    
    console.log('\n📋 Testing Manifest')
    const manifestResponse = await fetchUrl(`${BASE_URL}/manifest.webmanifest`)
    if (manifestResponse.status === 200) {
        console.log('✅ Manifest accessible')
        
        try {
            const manifest = JSON.parse(manifestResponse.text)
            
            // Critical PWA manifest checks
            const checks = [
                { field: 'name', value: manifest.name, required: true },
                { field: 'short_name', value: manifest.short_name, required: true },
                { field: 'start_url', value: manifest.start_url, required: true },
                { field: 'display', value: manifest.display, required: true, expectedValues: ['standalone', 'fullscreen', 'minimal-ui'] },
                { field: 'icons', value: manifest.icons, required: true, isArray: true }
            ]
            
            for (const check of checks) {
                if (check.required && !check.value) {
                    console.log(`❌ Missing required field: ${check.field}`)
                    allPassed = false
                } else if (check.expectedValues && !check.expectedValues.includes(check.value)) {
                    console.log(`❌ Invalid ${check.field}: ${check.value}`)
                    allPassed = false
                } else if (check.isArray && (!Array.isArray(check.value) || check.value.length === 0)) {
                    console.log(`❌ Empty or invalid array: ${check.field}`)
                    allPassed = false
                } else {
                    console.log(`✅ Valid ${check.field}: ${check.value || 'present'}`)
                }
            }
            
            // Check for required icon sizes
            if (manifest.icons) {
                const has192 = manifest.icons.some(icon => 
                    icon.sizes === '192x192' && icon.type === 'image/png'
                )
                const has512 = manifest.icons.some(icon => 
                    icon.sizes === '512x512' && icon.type === 'image/png'
                )
                
                if (has192 && has512) {
                    console.log('✅ Required PNG icon sizes present (192x192, 512x512)')
                } else {
                    console.log('❌ Missing required PNG icon sizes')
                    allPassed = false
                }
            }
            
        } catch (error) {
            console.log('❌ Manifest JSON parsing failed:', error.message)
            allPassed = false
        }
    } else {
        console.log('❌ Manifest not accessible')
        allPassed = false
    }
    
    console.log('\n⚙️  Testing Service Worker')
    const swResponse = await fetchUrl(`${BASE_URL}/service-worker.js`)
    if (swResponse.status === 200) {
        console.log('✅ Service Worker accessible')
        
        const swCode = swResponse.text
        const swChecks = [
            { name: 'install event', pattern: 'addEventListener("install"' },
            { name: 'activate event', pattern: 'addEventListener("activate"' },
            { name: 'fetch event', pattern: 'addEventListener("fetch"' },
            { name: 'caching implementation', pattern: 'caches.open' }
        ]
        
        for (const check of swChecks) {
            if (swCode.includes(check.pattern)) {
                console.log(`✅ Service Worker has ${check.name}`)
            } else {
                console.log(`❌ Service Worker missing ${check.name}`)
                allPassed = false
            }
        }
    } else {
        console.log('❌ Service Worker not accessible')
        allPassed = false
    }
    
    console.log('\n🖼️  Testing Icon Accessibility')
    const iconTests = [
        { name: '192x192 PNG icon', url: `${BASE_URL}/icons/pwa-192x192.png`, contentType: 'image/png' },
        { name: '512x512 PNG icon', url: `${BASE_URL}/icons/pwa-512x512.png`, contentType: 'image/png' }
    ]
    
    for (const iconTest of iconTests) {
        const iconResponse = await fetchUrl(iconTest.url)
        if (iconResponse.status === 200) {
            if (iconResponse.headers['content-type'] === iconTest.contentType) {
                console.log(`✅ ${iconTest.name} accessible with correct content-type`)
            } else {
                console.log(`⚠️  ${iconTest.name} accessible but wrong content-type: ${iconResponse.headers['content-type']}`)
            }
        } else {
            console.log(`❌ ${iconTest.name} not accessible (HTTP ${iconResponse.status})`)
            allPassed = false
        }
    }
    
    console.log('\n🏆 Final Assessment')
    console.log('===================')
    
    if (allPassed) {
        console.log('🎉 ALL PWA INSTALLATION REQUIREMENTS PASSED!')
        console.log('✨ Your PWA is ready for installation on Android Chrome')
        console.log('')
        console.log('📱 Installation Instructions:')
        console.log('1. Connect Android device to same WiFi network')
        console.log('2. Open Chrome and go to: http://10.20.143.11:4174')
        console.log('3. Interact with the page (tap, scroll, navigate)')
        console.log('4. Wait for install prompt or use Chrome menu → "Add to Home screen"')
        console.log('5. The app will be installed and work offline!')
    } else {
        console.log('❌ Some PWA requirements failed')
        console.log('⚠️  Review the failed checks above and fix them before testing installation')
    }
    
    console.log('')
    console.log('🔗 Test URLs:')
    console.log(`  Local: ${BASE_URL}`)
    console.log('  Network: http://10.20.143.11:4174')
}

runFinalTest().catch(console.error)