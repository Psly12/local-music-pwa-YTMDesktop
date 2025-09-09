<script lang="ts">
	import { usePlayer } from '$lib/stores/player/use-store.ts'

	const player = usePlayer()

	const handleTrackClick = async (index: number) => {
		try {
			await player.playTrackAtIndex(index)
		} catch (error) {
			console.error('Failed to play track at index:', index, error)
		}
	}
</script>

<div class="p-4">
	<h1 class="mb-4 text-title-lg">Queue</h1>

	{#if player.queue.length === 0}
		<div class="py-8 text-center text-onSurfaceVariant">
			<p>No tracks in queue</p>
		</div>
	{:else}
		<div class="space-y-2">
			{#each player.queue as track, index (track.id)}
				<button
					class="w-full rounded-lg p-3 text-left transition-colors hover:bg-surfaceContainer active:bg-surfaceContainerHigh"
					class:bg-primaryContainer={player.activeTrackIndex === index}
					class:text-onPrimaryContainer={player.activeTrackIndex === index}
					onclick={() => handleTrackClick(index)}
				>
					<div class="flex items-center gap-3">
						{#if track.thumbnail}
							<img src={track.thumbnail} alt={track.title} class="h-12 w-12 rounded object-cover" />
						{:else}
							<div
								class="flex h-12 w-12 items-center justify-center rounded bg-surfaceContainerHigh"
							>
								<span class="text-onSurface opacity-50">♪</span>
							</div>
						{/if}
						<div class="min-w-0 flex-1">
							<p class="truncate font-medium">{track.title}</p>
							{#if track.artists?.length > 0}
								<p class="text-sm truncate opacity-70">{track.artists.join(', ')}</p>
							{/if}
						</div>
						{#if player.activeTrackIndex === index}
							<div class="text-primary">
								{#if player.playing}
									<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
										<path d="M8 5v14l11-7z" />
									</svg>
								{:else}
									<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
										<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
									</svg>
								{/if}
							</div>
						{/if}
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>
