<script lang="ts">
	import { formatArtists } from '$lib/helpers/utils/text.ts'
	import Button from './Button.svelte'
	import Icon from './icon/Icon.svelte'
	import IconButton from './IconButton.svelte'
	import LikeButton from './player/buttons/LikeButton.svelte'
	import PlayNextButton from './player/buttons/PlayNextButton.svelte'
	import PlayToggleButton from './player/buttons/PlayToggleButton.svelte'
	import MainControls from './player/MainControls.svelte'
	import PlayerArtwork from './player/PlayerArtwork.svelte'
	import Timeline from './player/Timeline.svelte'
	import VolumeSlider from './player/VolumeSlider.svelte'

	const { class: className }: { class?: ClassValue } = $props()

	const mainStore = useMainStore()
	const player = usePlayer()

	const track = $derived(player.activeTrack)
</script>

<div
	id="mini-player"
	class={[
		'pointer-events-auto mx-auto max-w-225 justify-between overflow-hidden rounded-2xl border border-primary/10 bg-secondaryContainer text-onSecondaryContainer contain-content view-name-[pl-card] sm:h-auto sm:rounded-3xl active-view-player:border-transparent',
		className,
	]}
>
	<div
		class="flex h-full w-full flex-col items-center justify-between gap-2 sm:gap-4 sm:px-4 sm:pt-2 sm:pb-4"
	>
		<Timeline class="max-sm:hidden" />
		
		<!-- Main content row -->
		<div class="flex h-min w-full grow items-center sm:grid sm:grid-cols-[1fr_max-content_1fr]">
			<div class="flex grow items-center min-w-0">
				<Button
					as="a"
					href="/player"
					kind="blank"
					tooltip={m.playerOpenFullPlayer()}
					class="max-sm:rounded-r-4 group flex grow items-center rounded-lg pr-2 max-sm:p-2 sm:p-2 sm:h-11 sm:max-w-45 touch-manipulation min-h-12 sm:min-h-auto"
				>
					<div
						class="relative -z-1 size-11 shrink-0 overflow-hidden rounded-lg bg-onSecondary active-view-player:view-name-[pl-artwork]"
					>
						{#if track}
							<PlayerArtwork class="size-full" />
						{/if}

						<Icon
							type="chevronUp"
							class={[
								'absolute inset-0 m-auto shrink-0 active-view-player:view-name-[pl-chevron-up]',
								track &&
									'scale-0 rounded-full bg-tertiary text-onTertiary transition-[transform,opacity] duration-200 [.group:hover_&]:scale-100',
							]}
						/>
					</div>

					{#if track}
						<div class="mr-1 ml-4 grid min-w-0">
							<div class="truncate text-body-md">
								{track.name}
							</div>
							<div class="truncate text-body-sm">{formatArtists(track.artists)}</div>
						</div>
					{/if}
				</Button>

				<LikeButton class="touch-manipulation min-h-12 min-w-12 sm:min-h-11 sm:min-w-11" />
			</div>

			<div class="ml-auto flex gap-2 pr-2 sm:hidden">
				<PlayToggleButton class="touch-manipulation min-h-12 min-w-12 sm:min-h-11 sm:min-w-11" />

				<PlayNextButton class="max-xss:hidden touch-manipulation min-h-12 min-w-12 sm:min-h-11 sm:min-w-11" />
			</div>

			<MainControls class="max-sm:hidden" />

			<div class="ml-auto flex items-center gap-2 pr-2 max-sm:hidden">
				{#if mainStore.volumeSliderEnabled}
					<VolumeSlider />
				{/if}
			</div>
		</div>
		
		<!-- Mobile volume controls - separate row -->
		{#if mainStore.volumeSliderEnabled}
			<div class="flex items-center gap-4 px-4 py-2 w-full sm:hidden">
				<button 
					class="flex items-center justify-center min-h-10 min-w-10 rounded-full text-onSecondaryContainer hover:bg-onSecondaryContainer/10 active:bg-onSecondaryContainer/20 transition-colors touch-manipulation"
					onclick={() => {
						const newVolume = Math.max(0, player.volume - 10)
						player.setVolume(newVolume)
					}}
					title="Decrease volume"
				>
					<Icon type="volumeMid" class="text-lg" />
				</button>
				<div class="flex-1 min-w-0 py-1">
					<VolumeSlider />
				</div>
				<button 
					class="flex items-center justify-center min-h-10 min-w-10 rounded-full text-onSecondaryContainer hover:bg-onSecondaryContainer/10 active:bg-onSecondaryContainer/20 transition-colors touch-manipulation"
					onclick={() => {
						const newVolume = Math.min(100, player.volume + 10)
						player.setVolume(newVolume)
					}}
					title="Increase volume"
				>
					<Icon type="volumeHigh" class="text-lg" />
				</button>
			</div>
		{/if}
	</div>
</div>

<style lang="postcss">
	@reference '../../app.css';

	.controls {
		grid-template-columns: 1fr max-content 1fr;
	}

	::view-transition-old(pl-chevron-up) {
		display: none;
	}

	@keyframes -global-view-pl-chevron-up-fade-in {
		from {
			opacity: 0;
			transform: scale(0);
		}
	}

	::view-transition-new(pl-chevron-up) {
		animation: view-pl-chevron-up-fade-in 125ms 225ms linear backwards;
	}
</style>
