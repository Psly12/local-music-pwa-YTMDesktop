<script lang="ts">
	import Artwork from '../Artwork.svelte'
	import type { IconType } from '../icon/Icon.svelte'

	interface Props {
		fallbackIcon?: IconType | null
		class?: ClassValue
		children?: Snippet
	}

	const { fallbackIcon, ...props }: Props = $props()

	const player = usePlayer()
</script>

<Artwork
	src={player.artworkSrc}
	alt={(player.activeTrack as any)?.name || (player.activeTrack as any)?.title}
	fallbackIcon={player.activeTrack ? undefined : false}
	noFallbackBg
	{...props}
/>
