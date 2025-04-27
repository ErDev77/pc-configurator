'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Trash2, Eye } from 'lucide-react'

async function deleteConfiguration(id: string) {
	try {
		const res = await fetch(`/api/configurations/${id}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
			},
		})

		const data = await res.json()

		if (data.message === 'Configuration deleted') {
			return true // Возвращаем true, если удаление прошло успешно
		} else {
			console.error('Ошибка при удалении конфигурации:', data.error)
			return false
		}
	} catch (error) {
		console.error(
			'Ошибка при отправке запроса на удаление конфигурации:',
			error
		)
		return false
	}
}

export default function ConfigurationsPage() {
	const [configurations, setConfigurations] = useState<any[]>([])

	useEffect(() => {
		const fetchConfigurations = async () => {
			const res = await fetch('/api/configurations')
			if (res.ok) {
				const data = await res.json()
				setConfigurations(data)
			}
		}

		fetchConfigurations()
	}, [])

	const handleDeleteConfiguration = async (id: string) => {
		const success = await deleteConfiguration(id)

		if (success) {
			// Если удаление прошло успешно, обновляем состояние
			setConfigurations(configurations.filter(config => config.id !== id))
		} else {
			console.error('Не удалось удалить конфигурацию')
		}
	}

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

							{/* Кнопка удаления */}
							<button
								onClick={() => handleDeleteConfiguration(config.id)}
								className='flex items-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600'
							>
								<Trash2 className='w-4 h-4 mr-2' /> Удалить
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
