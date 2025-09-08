interface LoadResult {
	title: string
}

export const load = (): LoadResult => {
	return {
		title: 'Settings',
	}
}
