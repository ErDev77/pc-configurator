import { notFound } from 'next/navigation'

async function getConfiguration(id: string) {
	const res = await fetch(
		`${process.env.NEXT_PUBLIC_SITE_URL}/api/configurations/${id}`,
		{
			cache: 'no-store',
		}
	)

	if (!res.ok) {
		return null
	}

	return res.json()
}

export default function ClientConfiguration({
	configuration,
}: {
	configuration: {
		id: string
		name: string
		description: string
		image_url: string
		price: number
		hidden: boolean
	}
}) {
	return (
		<div className='p-6'>
			<h1 className='text-3xl font-bold mb-4'>{configuration.name}</h1>

			<img
				src={configuration.image_url}
				alt={configuration.name}
				className='w-full max-w-md rounded-2xl mb-6 shadow-lg'
			/>

			<p className='text-lg mb-2'>{configuration.description}</p>
			<p className='text-2xl font-semibold text-primary mb-4'>
				{configuration.price}
			</p>
		</div>
	)
}

