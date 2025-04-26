import React, { useEffect, useState } from 'react'
import { Trash } from 'lucide-react'
import { toast } from 'react-toastify'

interface Component {
	id: number
	name?: string
}

interface Compatibility {
	id: number
	component1_id: number
	component2_id: number
}

interface Props {
	componentId: number
}

const CompatibilitiesList: React.FC<Props> = ({ componentId }) => {
	const [compatibilities, setCompatibilities] = useState<Compatibility[]>([])
	const [componentsMap, setComponentsMap] = useState<Map<number, string>>(
		new Map()
	)
	const [isLoading, setIsLoading] = useState(true)

	// Функция для загрузки совместимостей
const fetchCompatibilities = async () => {
	try {
		const res = await fetch(`/api/compatibility/?componentId=${componentId}`)
		const data = await res.json()

		if (res.ok) {
			setCompatibilities(data)

			// Загружаем компоненты
			const componentsRes = await fetch(`/api/products`)
			const componentsData = await componentsRes.json()

			// Логируем ответ, чтобы понять структуру
			console.log('Fetched components:', componentsData)

			// Получаем список компонентов
			const componentsList = componentsData.components

			// Проверка на массив
			if (Array.isArray(componentsList)) {
				const newComponentsMap = new Map<number, string>()
				componentsList.forEach((component: Component) => {
					if (component.name) {
						newComponentsMap.set(component.id, component.name)
					}
				})
				setComponentsMap(newComponentsMap)
			} else {
				console.error('Ответ API не является массивом компонентов.')
			}
		} else {
			toast.error(data.error || 'Нет совместимостей для этого комплектующего.')
		}
	} catch (error) {
		console.error('Ошибка при загрузке совместимостей:', error)
		toast.error('Ошибка при загрузке совместимостей.')
	}
	setIsLoading(false)
}





	// Функция для удаления совместимости
	const handleRemoveCompatibility = async (compatibilityId: number) => {
		try {
			const res = await fetch(`/api/compatibility/${compatibilityId}/`, {
				method: 'DELETE',
			})
			const data = await res.json()

			if (res.ok) {
				// Убираем удаленную совместимость из списка
				setCompatibilities(prev =>
					prev.filter(item => item.id !== compatibilityId)
				)
				toast.success('Совместимость успешно удалена.')
			} else {
				toast.error(data.error || 'Ошибка при удалении совместимости.')
			}
		} catch (error) {
			console.error('Ошибка при удалении совместимости:', error)
			toast.error('Ошибка при удалении совместимости.')
		}
	}

	// Загружаем совместимости при изменении componentId
	useEffect(() => {
		fetchCompatibilities()
	}, [componentId])

	if (isLoading)
		return <div className='text-white p-6'>Загрузка совместимостей...</div>

	return (
		<div className='bg-[#202529] p-6 rounded-2xl w-full max-w-3xl'>
			<h3 className='text-xl text-white font-bold mb-4'>
				Совместимости с компонентом
			</h3>
			<table className='text-white w-full'>
				<tbody>
					{compatibilities.map(comp => {
						const component1Name = componentsMap.get(comp.component1_id)
						const component2Name = componentsMap.get(comp.component2_id)
						const firstComponent =
							componentId === comp.component1_id
								? component1Name
								: component2Name
						const secondComponent =
							componentId === comp.component1_id
								? component2Name
								: component1Name
						return (
							<tr key={comp.id}>
								<td className='flex items-center w-full'>
									<span className='whitespace-nowrap w-[180px] text-left'>
										{firstComponent || 'Неизвестный компонент'}
									</span>
									<div className='line'></div>
									<span className='whitespace-nowrap w-[60px] text-right'>
										{secondComponent || 'Неизвестный компонент'}
									</span>
								</td>

								<td className='text-right'>
									<button
										className='bg-red-500 text-white py-1 px-3 rounded-lg'
										onClick={() => handleRemoveCompatibility(comp.id)}
									>
										<Trash size={17} />
									</button>
								</td>
							</tr>
						)
					})}
				</tbody>
			</table>
		</div>
	)
}

export default CompatibilitiesList
