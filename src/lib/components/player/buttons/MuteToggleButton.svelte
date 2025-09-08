<script lang="ts">
	import Icon from '$lib/components/icon/Icon.svelte'
	import { usePlayer } from '$lib/stores/player/use-store.ts'
	import IconButton from '../../IconButton.svelte'

	const { class: className }: { class?: string } = $props()

	const player = usePlayer()

	// Determine which volume icon to show based on mute state and volume level
	function getVolumeIcon(
		muted: boolean,
		volume: number,
	): 'volumeOff' | 'volumeLow' | 'volumeMid' | 'volumeHigh' {
		if (muted) {
			return 'volumeOff'
		}
		if (volume === 0) {
			return 'volumeOff'
		}
		if (volume < 30) {
			return 'volumeLow'
		}
		if (volume < 70) {
			return 'volumeMid'
		}
		return 'volumeHigh'
	}

	// Use Svelte 5 runes syntax
	let volumeIcon = $derived(getVolumeIcon(player.muted, player.volume))
	let tooltipText = $derived(player.muted ? 'Unmute' : 'Mute')
</script>

<IconButton tooltip={tooltipText} class={className} onclick={player.toggleMute}>
	<Icon type={volumeIcon} />
</IconButton>
