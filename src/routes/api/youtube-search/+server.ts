import { json } from '@sveltejs/kit'
import youtubesearchapi from 'youtube-search-api'
import type { RequestHandler } from './$types'

interface YouTubeSearchItem {
	id: string
	title: string
	channelTitle?: string
	duration?: {
		text?: string
	}
	thumbnail?: {
		thumbnails?: Array<{
			url: string
			width?: number
			height?: number
		}>
	}
	type: 'video' | 'playlist' | 'channel'
	isLive?: boolean
	lengthText?: string
	viewCountText?: string
}

interface YouTubeSearchResponse {
	items: YouTubeSearchItem[]
	nextPage?: {
		nextPageToken: string
		nextPageContext: unknown
	}
}

export const GET: RequestHandler = async ({ url }) => {
	const query = url.searchParams.get('q')
	const limit = Number.parseInt(url.searchParams.get('limit') || '20', 10)

	if (!query) {
		return json({ error: 'Query parameter "q" is required' }, { status: 400 })
	}

	try {
		// Search for videos and playlists
		const results = (await youtubesearchapi.GetListByKeyword(
			query,
			false, // not playlist search
			limit,
			[{ type: 'video' }], // filter for videos only
		)) as YouTubeSearchResponse

		// Transform results to match our expected format
		const transformedResults =
			results.items?.map((item) => ({
				type: item.type,
				videoId: item.id,
				title: item.title,
				artist: item.channelTitle,
				duration: item.lengthText || item.duration?.text,
				thumbnails: item.thumbnail?.thumbnails || [],
				isLive: item.isLive,
				viewCount: item.viewCountText,
			})) || []

		return json({
			results: transformedResults,
			continuation: results.nextPage?.nextPageToken,
		})
	} catch (error) {
		console.error('[YouTube Search API] Search failed:', error)
		return json(
			{
				error: 'Search failed',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 },
		)
	}
}
