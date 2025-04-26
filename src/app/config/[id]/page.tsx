import type { PageProps } from './$types'
import ClientConfiguration from './client-component'
import { Metadata } from 'next'

export default async function Page(props: PageProps) {
	const params = await props.params
	const searchParams = await props.searchParams

	const { id } = params || {}

	if (!id) {
		return <div>Некорректный ID конфигурации</div>
	}

	const res = await fetch(
		`${process.env.NEXT_PUBLIC_SITE_URL}/api/configurations/${id}`,
		{
			cache: 'no-store',
		}
	)

	if (!res.ok) {
		console.error('Ошибка загрузки конфигурации')
		return <div>Ошибка загрузки конфигурации</div>
	}

	const data = await res.json()

	if (!data) {
		return <div>Конфигурация не найдена</div>
	}

	return <ClientConfiguration configuration={data} />
}

export async function generateMetadata({
	params,
}: Pick<PageProps, 'params'>): Promise<Metadata> {
	const resolvedParams = await params

	return {
		title: `Конфигурация ${resolvedParams?.id}`,
		description: 'Управление конфигурацией',
	}
}
