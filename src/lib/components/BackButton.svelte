<script lang="ts">
	import type { ClassValue } from 'svelte/elements'
	import { goto } from '$app/navigation'
	import { base } from '$app/paths'
	import { page } from '$app/state'
	import * as m from '$paraglide/messages.js'
	import IconButton from './IconButton.svelte'

	interface Props {
		class?: ClassValue
	}

	const { class: className }: Props = $props()

	const canGoBack = () => {
		if (window.navigation !== undefined) {
			return window.navigation.canGoBack
		}

		// This will not handle
		return window.history.length > 1
	}

	const handleBackClick = () => {
		// If we're in settings, always go to player
		if (page.url.pathname.includes('/settings')) {
			void goto(`${base}/player`)
			return
		}

		if (canGoBack()) {
			window.history.back()
		} else {
			void goto(`${base}/`)
		}
	}
</script>

<IconButton tooltip={m.goBack()} icon="backArrow" class={className} onclick={handleBackClick} />
