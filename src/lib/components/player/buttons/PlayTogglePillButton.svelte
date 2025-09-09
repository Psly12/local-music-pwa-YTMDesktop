<script lang="ts">
	import { usePlayer } from '$lib/stores/player/use-store.ts'
	import * as m from '$paraglide/messages'
	import PlayPauseIcon from '../../animated-icons/PlayPauseIcon.svelte'
	import Button from '../../Button.svelte'

	interface Props {
		class?: string
	}

	let { class: className }: Props = $props()

	const player = usePlayer()
</script>

<Button
	tooltip={player.playing ? m.playerPause() : m.playerPlay()}
	class={["w-18 !p-0", className]}
	disabled={!player.activeTrack}
	onclick={() => player.togglePlay()}
>
	<PlayPauseIcon playing={player.playing} />
</Button>
