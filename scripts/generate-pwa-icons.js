#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { Resvg } from '@resvg/resvg-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

console.log('🎨 Generating PWA icons for Android installation...')

// Read the SVG source
const svgPath = join(projectRoot, 'build', 'icons', 'responsive.svg')
if (!existsSync(svgPath)) {
    console.error('❌ SVG icon not found at:', svgPath)
    console.error('   Please build the project first with: pnpm run build')
    process.exit(1)
}

const svgBuffer = readFileSync(svgPath)
console.log('✅ Loaded SVG icon')

// Icon sizes required for PWA installation on Android
const iconSizes = [
    { size: 192, filename: 'pwa-192x192.png' },
    { size: 512, filename: 'pwa-512x512.png' }
]

// Ensure build/icons directory exists
const iconsDir = join(projectRoot, 'build', 'icons')
if (!existsSync(iconsDir)) {
    mkdirSync(iconsDir, { recursive: true })
}

// Generate PNG icons
for (const { size, filename } of iconSizes) {
    console.log(`🔧 Generating ${size}x${size} PNG icon...`)
    
    try {
        const resvg = new Resvg(svgBuffer, {
            width: size,
            height: size,
            fitTo: {
                mode: 'width',
                value: size
            }
        })
        
        const pngData = resvg.render()
        const pngBuffer = pngData.asPng()
        
        const outputPath = join(iconsDir, filename)
        writeFileSync(outputPath, pngBuffer)
        
        console.log(`✅ Created ${filename} (${pngBuffer.length} bytes)`)
    } catch (error) {
        console.error(`❌ Failed to generate ${filename}:`, error.message)
        process.exit(1)
    }
}

console.log('🎉 PWA icons generated successfully!')
console.log('')
console.log('Generated files:')
iconSizes.forEach(({ filename }) => {
    console.log(`  📁 build/icons/${filename}`)
})
console.log('')
console.log('Next steps:')
console.log('1. Update your web app manifest to include these PNG icons')
console.log('2. Test PWA installability on Android Chrome')