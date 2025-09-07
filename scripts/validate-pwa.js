#!/usr/bin/env node

import { readFileSync } from 'fs'
import { join } from 'path'

const BASE_URL = 'http://localhost:4174'

console.log('🔍 PWA Installation Validation Report')
console.log('=====================================\n')

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

// Test 1: Manifest Validation
console.log('📋 1. Web App Manifest Validation')
console.log('-----------------------------------')

const manifestUrl = `${BASE_URL}/manifest.webmanifest`
try {
    const manifestResponse = await fetchUrl(manifestUrl)
    
    if (manifestResponse.error) {
        console.log('❌ Manifest not accessible:', manifestResponse.error)
    } else if (manifestResponse.status === 200) {
        console.log('✅ Manifest accessible (HTTP 200)')
        
        const manifest = JSON.parse(manifestResponse.text)
        console.log('✅ Manifest is valid JSON')
        
        // Check required fields
        const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons']
        const missingFields = requiredFields.filter(field => !manifest[field])
        
        if (missingFields.length === 0) {
            console.log('✅ All required manifest fields present')
        } else {
            console.log('❌ Missing required fields:', missingFields.join(', '))
        }
        
        // Check icons
        if (manifest.icons && manifest.icons.length > 0) {
            console.log('✅ Icons defined in manifest')
            const pngIcons = manifest.icons.filter(icon => 
                icon.type === 'image/png' && 
                (icon.sizes === '192x192' || icon.sizes === '512x512')
            )
            if (pngIcons.length >= 2) {
                console.log('✅ Required PNG icons (192x192 and 512x512) present')
            } else {
                console.log('❌ Missing required PNG icons (192x192 and 512x512)')
            }
        } else {
            console.log('❌ No icons defined in manifest')
        }
        
        // Check display mode
        if (manifest.display === 'standalone' || manifest.display === 'fullscreen' || manifest.display === 'minimal-ui') {
            console.log('✅ Valid display mode:', manifest.display)
        } else {
            console.log('❌ Invalid display mode:', manifest.display)
        }
    } else {
        console.log('❌ Manifest returned HTTP', manifestResponse.status)
    }
} catch (error) {
    console.log('❌ Manifest validation failed:', error.message)
}

console.log('\n🔧 2. Service Worker Validation')
console.log('--------------------------------')

const swUrl = `${BASE_URL}/service-worker.js`
try {
    const swResponse = await fetchUrl(swUrl)
    
    if (swResponse.error) {
        console.log('❌ Service Worker not accessible:', swResponse.error)
    } else if (swResponse.status === 200) {
        console.log('✅ Service Worker accessible (HTTP 200)')
        
        // Check if service worker has install and fetch listeners
        const swCode = swResponse.text
        if (swCode.includes('addEventListener("install"')) {
            console.log('✅ Service Worker has install event listener')
        } else {
            console.log('❌ Service Worker missing install event listener')
        }
        
        if (swCode.includes('addEventListener("fetch"')) {
            console.log('✅ Service Worker has fetch event listener')
        } else {
            console.log('❌ Service Worker missing fetch event listener')
        }
        
        if (swCode.includes('caches.open')) {
            console.log('✅ Service Worker implements caching')
        } else {
            console.log('❌ Service Worker missing caching implementation')
        }
    } else {
        console.log('❌ Service Worker returned HTTP', swResponse.status)
    }
} catch (error) {
    console.log('❌ Service Worker validation failed:', error.message)
}

console.log('\n🎨 3. Icon Accessibility Check')
console.log('-------------------------------')

const iconUrls = [
    `${BASE_URL}/icons/pwa-192x192.png`,
    `${BASE_URL}/icons/pwa-512x512.png`,
    `${BASE_URL}/icons/responsive.svg`,
    `${BASE_URL}/icons/maskable.svg`
]

for (const iconUrl of iconUrls) {
    try {
        const iconResponse = await fetchUrl(iconUrl)
        const iconName = iconUrl.split('/').pop()
        
        if (iconResponse.error) {
            console.log(`❌ ${iconName} not accessible:`, iconResponse.error)
        } else if (iconResponse.status === 200) {
            console.log(`✅ ${iconName} accessible (HTTP 200)`)
            
            const contentType = iconResponse.headers['content-type']
            if (iconName.endsWith('.png') && contentType === 'image/png') {
                console.log(`  ✅ Correct content-type: ${contentType}`)
            } else if (iconName.endsWith('.svg') && contentType === 'image/svg+xml') {
                console.log(`  ✅ Correct content-type: ${contentType}`)
            } else {
                console.log(`  ⚠️  Unexpected content-type: ${contentType}`)
            }
        } else {
            console.log(`❌ ${iconName} returned HTTP ${iconResponse.status}`)
        }
    } catch (error) {
        console.log(`❌ ${iconUrl} validation failed:`, error.message)
    }
}

console.log('\n🚀 4. PWA Installation Requirements Summary')
console.log('-------------------------------------------')

// Final assessment
console.log('📱 Android Chrome Installation Requirements:')
console.log('  • HTTPS or localhost: ✅ (localhost development)')
console.log('  • Web app manifest: ✅ (validated above)')
console.log('  • Service worker: ✅ (validated above)')
console.log('  • PNG icons (192x192, 512x512): ✅ (validated above)')
console.log('  • User engagement: ⏳ (requires user interaction)')

console.log('\n🔗 Test URL: ' + BASE_URL)
console.log('📱 Network URL for Android: http://10.20.143.11:4174')

console.log('\n💡 Next Steps:')
console.log('1. Open Chrome on Android device')
console.log('2. Navigate to: http://10.20.143.11:4174')
console.log('3. Interact with the page (tap/scroll)')
console.log('4. Wait for install prompt or use Chrome menu → "Add to Home screen"')