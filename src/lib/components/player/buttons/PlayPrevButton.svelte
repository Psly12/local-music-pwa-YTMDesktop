<script lang="ts">
	import type { ClassValue } from 'clsx'
	import { usePlayer } from '$lib/stores/player/use-store.ts'
	import * as m from '$paraglide/messages.js'
	import PlayPreviousNextIcon from '../../animated-icons/PlayPreviousNextIcon.svelte'
	import IconButton from '../../IconButton.svelte'

	const player = usePlayer()

	const { class: className }: { class?: ClassValue } = $props()
</script>

<IconButton
	tooltip={m.playerPlayPreviousTrack()}
	disabled={player.isQueueEmpty}
	class={className}
	onclick={player.playPrev}
>
	<PlayPreviousNextIcon type="previous" />
</IconButton>
