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
			console.log('Searching for:', searchQuery)
			const response = await player.searchVideos(searchQuery.trim())
			
			if (response?.results) {
				searchResults = response.results
				console.log('Search results:', searchResults)
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
			performSearch()
		}
	}

	const playVideo = async (videoId: string) => {
		if (!videoId) return
		
		try {
			await player.playVideoById(videoId)
		} catch (err) {
			console.error('Failed to play video:', err)
		}
	}


	// Get highest quality thumbnail
	const getThumbnail = (thumbnails?: Array<{ url: string; width?: number; height?: number }>) => {
		if (!thumbnails || thumbnails.length === 0) return ''
		
		const highest = thumbnails.reduce((best, current) => {
			const bestSize = (best.width || 0) * (best.height || 0)
			const currentSize = (current.width || 0) * (current.height || 0)
			return currentSize > bestSize ? current : best
		}, thumbnails[0])
		
		return highest.url
	}
</script>

<div class="flex flex-col gap-4 w-full h-full">
	<!-- Search Input -->
	<div class="flex gap-2 p-2 bg-surfaceContainer rounded-xl">
		<div class="flex-1 relative">
			<input
				bind:value={searchQuery}
				onkeydown={handleKeydown}
				placeholder="Search YouTube Music..."
				class="w-full px-4 py-3 bg-surface rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary text-onSurface placeholder-onSurfaceVariant"
			/>
			{#if searching}
				<div class="absolute right-3 top-1/2 transform -translate-y-1/2">
					<div class="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
				</div>
			{/if}
		</div>
		<Button
			onclick={performSearch}
			disabled={!searchQuery.trim() || searching}
			class="px-4 py-3 bg-primary text-onPrimary rounded-lg hover:bg-primary/90 disabled:opacity-50"
		>
			<Icon type="search" />
		</Button>
	</div>

	{#if error}
		<div class="flex flex-col items-center text-center py-8">
			<Icon type="alert" class="w-12 h-12 text-error mb-4" />
			<p class="text-error">{error}</p>
		</div>
	{:else if searchResults.length > 0}
		<!-- Search Results -->
		{#if !player.isConnected}
			<div class="mb-4 p-3 bg-surfaceContainer rounded-xl border-l-4 border-l-error">
				<div class="flex items-center gap-2">
					<Icon type="wifiOff" class="w-5 h-5 text-error" />
					<p class="text-onSurface text-sm">
						<strong>Not connected to YTM Desktop</strong> - You can search, but need to connect to play music
					</p>
				</div>
			</div>
		{/if}
		<div class="flex-1 overflow-y-auto">
			<div class="space-y-2">
				{#each searchResults as result}
					<div class="flex items-center gap-3 p-3 bg-surfaceContainer rounded-xl hover:bg-surfaceContainerHigh transition-colors">
						<!-- Thumbnail -->
						<div class="w-12 h-12 rounded-lg overflow-hidden bg-surfaceContainerHighest flex-shrink-0">
							{#if getThumbnail(result.thumbnails)}
								<img 
									src={getThumbnail(result.thumbnails)} 
									alt={result.title}
									class="w-full h-full object-cover"
								/>
							{:else}
								<div class="w-full h-full flex items-center justify-center">
									<Icon type="music" class="w-6 h-6 text-onSurfaceVariant" />
								</div>
							{/if}
						</div>

						<!-- Info -->
						<div class="flex-1 min-w-0">
							<h3 class="text-onSurface font-medium truncate">{result.title}</h3>
							{#if result.artist}
								<p class="text-onSurfaceVariant text-sm truncate">{result.artist}</p>
							{/if}
							{#if result.album}
								<p class="text-onSurfaceVariant text-xs truncate">{result.album}</p>
							{/if}
							<div class="flex items-center gap-2 mt-1">
								<span class="text-xs bg-primaryContainer text-onPrimaryContainer px-2 py-1 rounded-full">
									{result.type}
								</span>
								{#if result.duration}
									<span class="text-xs text-onSurfaceVariant">{result.duration}</span>
								{/if}
							</div>
						</div>

						<!-- Actions -->
						<div class="flex gap-1 flex-shrink-0">
							{#if result.videoId}
								<button
									onclick={() => playVideo(result.videoId!)}
									disabled={!player.isConnected}
									class="p-3 rounded-full hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-primary/5"
									title={player.isConnected ? "Play now" : "Connect to YTM Desktop to play"}
								>
									<Icon type="play" class="w-6 h-6 text-primary" />
								</button>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{:else if searchQuery.trim()}
		<div class="flex flex-col items-center text-center py-8">
			<Icon type="search" class="w-12 h-12 text-onSurfaceVariant mb-4" />
			<p class="text-onSurfaceVariant">Enter a search term and press Enter or click Search</p>
		</div>
	{:else}
		<div class="flex flex-col items-center text-center py-8">
			<Icon type="search" class="w-12 h-12 text-onSurfaceVariant mb-4" />
			<p class="text-onSurfaceVariant">Search YouTube Music</p>
			<p class="text-onSurfaceVariant text-sm mt-2">Find songs, albums, and artists</p>
		</div>
	{/if}
</div>