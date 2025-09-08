interface LoadResult {
	title: string
}

export interface DirectoryWithCount {
	id: number
	handle: FileSystemDirectoryHandle
	count?: number
	legacy?: boolean
}

export const load = (): LoadResult => {
	return {
		title: 'Settings',
	}
}
