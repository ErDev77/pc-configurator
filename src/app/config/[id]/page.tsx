import type { PageProps } from './$types'
import ClientConfiguration from './client-component'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

export default async function Page(props: PageProps) {
	const params = await props.params
	const searchParams = await props.searchParams

	const { id } = params || {}

	if (!id) {
		return <div>Invalid configuration ID</div>
	}

	// Fetch the configuration from your backend
	const res = await fetch(
		`${process.env.NEXT_PUBLIC_SITE_URL}/api/configurations/${id}`,
		{
			cache: 'no-store',
		}
	)

	if (!res.ok) {
		console.error('Failed to load configuration')
		if (res.status === 404) {
			return notFound()
		}
		return <div>Error loading configuration</div>
	}

	const configuration = await res.json()

	if (!configuration) {
		return notFound()
	}

	// Fix: Correctly fetch configuration products with proper endpoint path
	const productsRes = await fetch(
		`${process.env.NEXT_PUBLIC_SITE_URL}/api/configuration_products/${id}`,
		{
			cache: 'no-store',
		}
	)

	let products = []
	if (productsRes.ok) {
		const productsData = await productsRes.json()
		products = productsData.products || []
	} else {
		console.error(
			'Error fetching configuration products:',
			productsRes.statusText
		)
	}

	// Pass both configuration and products to the client component
	return <ClientConfiguration configuration={{ ...configuration, products }} />
}

export async function generateMetadata({
	params,
}: Pick<PageProps, 'params'>): Promise<Metadata> {
	const resolvedParams = await params
	const { id } = resolvedParams || {}

	if (!id) {
		return {
			title: 'Configuration',
			description: 'PC Configuration',
		}
	}

	try {
		// Fetch configuration for metadata
		const res = await fetch(
			`${process.env.NEXT_PUBLIC_SITE_URL}/api/configurations/${id}`,
			{
				cache: 'no-store',
			}
		)

		if (!res.ok) {
			return {
				title: 'Configuration',
				description: 'PC Configuration',
			}
		}

		const configuration = await res.json()

		return {
			title: `${configuration.name} | PC Configuration`,
			description: configuration.description || 'Custom PC Configuration',
		}
	} catch (error) {
		console.error('Error fetching metadata:', error)
		return {
			title: 'Configuration',
			description: 'PC Configuration',
		}
	}
}
