<script lang="ts">
	import Button from '$lib/components/Button.svelte'
	import Icon from '$lib/components/icon/Icon.svelte'
	import type { YTMSearchResult } from '$lib/services/ytm-api'
	import { usePlayer } from '$lib/stores/player/use-store.ts'

	const player = usePlayer()

	let searchQuery = $state('')
	let searchResults = $state<YTMSearchResult[]>([])
	let searching = $state(false)
	let error = $state<string | null>(null)

	const performSearch = async () => {
		if (!searchQuery.trim()) {
			return
		}

		searching = true
		error = null

		try {
			const response = await player.searchVideos(searchQuery.trim())

			if (response?.results) {
				searchResults = response.results
			} else {
				searchResults = []
				error = 'No results found'
			}
		} catch (err) {
			console.error('Search error:', err)
			error = 'Search failed. Please try again.'
			searchResults = []
		} finally {
			searching = false
		}
	}

	const handleKeydown = (e: KeyboardEvent) => {
		if (e.key === 'Enter') {
			void performSearch()
		}
	}

	const playVideo = async (videoId: string) => {
		if (!videoId) {
			return
		}

		try {
			await player.playVideoById(videoId)
		} catch (err) {
			console.error('Failed to play video:', err)
		}
	}

	// Get highest quality thumbnail
	const getThumbnail = (thumbnails?: Array<{ url: string; width?: number; height?: number }>) => {
		if (!thumbnails || thumbnails.length === 0) {
			return ''
		}

		const highest = thumbnails.reduce((best, current) => {
			const bestSize = (best?.width || 0) * (best?.height || 0)
			const currentSize = (current.width || 0) * (current.height || 0)
			return currentSize > bestSize ? current : best
		}, thumbnails[0])

		return highest?.url || ''
	}
</script>

<div class="flex h-full w-full flex-col gap-4">
	<!-- Search Input -->
	<div class="flex gap-2 rounded-xl bg-surfaceContainer p-2">
		<div class="relative flex-1">
			<input
				bind:value={searchQuery}
				onkeydown={handleKeydown}
				placeholder="Search YouTube Music..."
				class="w-full rounded-lg border-0 bg-surface px-4 py-3 text-onSurface placeholder-onSurfaceVariant focus:ring-2 focus:ring-primary focus:outline-none"
			/>
			{#if searching}
				<div class="absolute top-1/2 right-3 -translate-y-1/2 transform">
					<div
						class="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"
					></div>
				</div>
			{/if}
		</div>
		<Button
			onclick={performSearch}
			disabled={!searchQuery.trim() || searching}
			class="rounded-lg bg-primary px-4 py-3 text-onPrimary hover:bg-primary/90 disabled:opacity-50"
		>
			<Icon type="search" />
		</Button>
	</div>

	{#if error}
		<div class="flex flex-col items-center py-8 text-center">
			<Icon type="alert" class="mb-4 h-12 w-12 text-error" />
			<p class="text-error">{error}</p>
		</div>
	{:else if searchResults.length > 0}
		<!-- Search Results -->
		{#if !player.isConnected}
			<div class="mb-4 rounded-xl border-l-4 border-l-error bg-surfaceContainer p-3">
				<div class="flex items-center gap-2">
					<Icon type="wifiOff" class="h-5 w-5 text-error" />
					<p class="text-sm text-onSurface">
						<strong>Not connected to YTM Desktop</strong> - You can search, but need to connect to play
						music
					</p>
				</div>
			</div>
		{/if}
		<div class="flex-1 overflow-y-auto">
			<div class="space-y-2">
				{#each searchResults as result}
					<div
						class="flex items-center gap-3 rounded-xl bg-surfaceContainer p-3 transition-colors hover:bg-surfaceContainerHigh"
					>
						<!-- Thumbnail -->
						<div
							class="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-surfaceContainerHighest"
						>
							{#if getThumbnail(result.thumbnails)}
								<img
									src={getThumbnail(result.thumbnails)}
									alt={result.title}
									class="h-full w-full object-cover"
								/>
							{:else}
								<div class="flex h-full w-full items-center justify-center">
									<Icon type="music" class="h-6 w-6 text-onSurfaceVariant" />
								</div>
							{/if}
						</div>

						<!-- Info -->
						<div class="min-w-0 flex-1">
							<h3 class="truncate font-medium text-onSurface">{result.title}</h3>
							{#if result.artist}
								<p class="text-sm truncate text-onSurfaceVariant">{result.artist}</p>
							{/if}
							<!-- Album info not available in YTM search results -->
							<div class="mt-1 flex items-center gap-2">
								<span
									class="text-xs rounded-full bg-primaryContainer px-2 py-1 text-onPrimaryContainer"
								>
									{result.type}
								</span>
								{#if result.duration}
									<span class="text-xs text-onSurfaceVariant">{result.duration}</span>
								{/if}
							</div>
						</div>

						<!-- Actions -->
						<div class="flex flex-shrink-0 gap-1">
							{#if result.videoId}
								<button
									onclick={() => playVideo(result.videoId!)}
									disabled={!player.isConnected}
									class="rounded-full bg-primary/5 p-3 transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
									title={player.isConnected ? 'Play now' : 'Connect to YTM Desktop to play'}
								>
									<Icon type="play" class="h-6 w-6 text-primary" />
								</button>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{:else if searchQuery.trim()}
		<div class="flex flex-col items-center py-8 text-center">
			<Icon type="search" class="mb-4 h-12 w-12 text-onSurfaceVariant" />
			<p class="text-onSurfaceVariant">Enter a search term and press Enter or click Search</p>
		</div>
	{:else}
		<div class="flex flex-col items-center py-8 text-center">
			<Icon type="search" class="mb-4 h-12 w-12 text-onSurfaceVariant" />
			<p class="text-onSurfaceVariant">Search YouTube Music</p>
			<p class="text-sm mt-2 text-onSurfaceVariant">Find songs, albums, and artists</p>
		</div>
	{/if}
</div>
