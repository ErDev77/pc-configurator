export interface SegmentParams {
	[key: string]: string | number | boolean
}

export interface PageProps {
	params?: Promise<SegmentParams>
	searchParams?: Promise<any>
}
