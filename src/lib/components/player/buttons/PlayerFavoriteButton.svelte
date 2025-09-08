<script lang="ts">
	import FavoriteButton from '$lib/components/FavoriteButton.svelte'

	const player = usePlayer()

	const track = $derived(player.activeTrack)
</script>

{#if track && typeof track.id === 'number' && 'favorite' in track}
	<FavoriteButton trackId={track.id} favorite={(track as any).favorite} />
{:else}
	<!-- Favorites not supported for YTM tracks -->
{/if}
