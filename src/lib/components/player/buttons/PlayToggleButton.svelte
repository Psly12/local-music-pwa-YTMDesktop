<script lang="ts">
	import PlayPauseIcon from '$lib/components/animated-icons/PlayPauseIcon.svelte'
	import { usePlayer } from '$lib/stores/player/use-store.ts'
	import * as m from '$paraglide/messages.js'
	import IconButton from '../../IconButton.svelte'

	interface Props {
		class?: string
	}

	let { class: className }: Props = $props()

	const player = usePlayer()
</script>

<IconButton
	tooltip={player.playing ? m.playerPause() : m.playerPlay()}
	disabled={!player.activeTrack}
	onclick={() => player.togglePlay()}
	class={className}
>
	<PlayPauseIcon playing={player.playing} />
</IconButton>
