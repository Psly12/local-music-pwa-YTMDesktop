import { redirect } from '@sveltejs/kit'
import { base } from '$app/paths'

export function load() {
	// Redirect directly to player on app load
	throw redirect(307, `${base}/player`)
}
