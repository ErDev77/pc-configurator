import Link from 'next/link'
// import { Button } from '@/components/ui/button' // если у тебя подключены shadcn/ui
import { Trash2, Eye } from 'lucide-react'

async function getConfigurations() {
	const res = await fetch(
		`${process.env.NEXT_PUBLIC_SITE_URL}/api/configurations`,
		{
			cache: 'no-store',
		}
	)

	if (!res.ok) {
		throw new Error('Не удалось получить конфигурации')
	}

	return res.json()
}

export default async function ConfigurationsPage() {
	const configurations = await getConfigurations()

	return (
		<div className='p-6'>
			<h1 className='text-2xl font-bold mb-6'>Конфигурации</h1>

			<div className='grid gap-4'>
				{configurations.map((config: any) => (
					<div
						key={config.id}
						className='p-4 border rounded-2xl shadow-sm flex items-center justify-between'
					>
						<div>
							<h2 className='text-xl font-semibold'>{config.name}</h2>
							<p className='text-muted-foreground'>{config.price} ₽</p>
						</div>

						<div className='flex items-center gap-2'>
							<Link href={`/config/${config.id}`}>
								<button className='flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600'>
									<Eye className='w-4 h-4 mr-2' /> Открыть
								</button>
							</Link>

							<form
								action={`/api/configurations/${config.id}`}
								method='POST'
								className='inline'
							>
								<button className='flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600'>
									<Eye className='w-4 h-4 mr-2' /> Удалить
								</button>
							</form>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
