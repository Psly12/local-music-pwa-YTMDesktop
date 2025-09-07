import { readFileSync } from 'fs'
import { join } from 'path'

export const prerender = true

export const GET = () => {
	// Read the PNG file from the build directory
	const iconPath = join(process.cwd(), 'build', 'icons', 'pwa-512x512.png')
	const iconBuffer = readFileSync(iconPath)

	return new Response(iconBuffer, {
		headers: {
			'Content-Type': 'image/png',
			'Cache-Control': 'public, max-age=31536000',
		},
	})
}