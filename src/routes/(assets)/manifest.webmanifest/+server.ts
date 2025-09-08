import * as m from '$paraglide/messages.js'
import { THEME_PALLETTE_DARK } from '../../../server/theme-colors.ts'

export const prerender = true

const manifest = {
	short_name: m.appNameShort(),
	name: m.appName(),
	start_url: '/',
	scope: '/',
	theme_color: THEME_PALLETTE_DARK.surface,
	background_color: THEME_PALLETTE_DARK.surface,
	display: 'standalone',
	display_override: ['window-controls-overlay', 'standalone'],
	description: 'Lightweight on device music player right in your browser.',
	categories: ['music', 'entertainment'],
	launch_handler: {
		client_mode: 'focus-existing',
	},
	edge_side_panel: {
		preferred_width: 400,
	},
	shortcuts: [
		{
			name: 'Play Music',
			short_name: 'Play',
			description: 'Start playing music',
			url: '/?action=play',
			icons: [{ src: '/icons/play-shortcut.png', sizes: '96x96' }],
		},
	],
	prefer_related_applications: false,
	start_behavior: 'standalone',
	orientation: 'portrait-primary',
	screen_orientation: 'portrait-primary',
	lang: 'en',
	dir: 'ltr',
	id: '/?source=pwa',
	icons: [
		{
			src: '/icons/responsive.svg',
			type: 'image/svg+xml',
			sizes: 'any',
			purpose: 'any',
		},
		{
			src: '/icons/maskable.svg',
			type: 'image/svg+xml',
			sizes: 'any',
			purpose: 'maskable',
		},
		{
			src: '/icons/pwa-192x192.png',
			type: 'image/png',
			sizes: '192x192',
			purpose: 'any',
		},
		{
			src: '/icons/pwa-512x512.png',
			type: 'image/png',
			sizes: '512x512',
			purpose: 'any',
		},
	],
}

export const GET = () => {
	return new Response(JSON.stringify(manifest), {
		headers: {
			'Content-Type': 'application/manifest+json',
		},
	})
}
