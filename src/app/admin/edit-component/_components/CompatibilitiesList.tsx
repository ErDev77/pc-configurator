import React, { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle, Trash } from 'lucide-react'
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
	const [isEmpty, setIsEmpty] = useState(false)

	// Функция для загрузки совместимостей
	const fetchCompatibilities = async () => {
		if (!componentId) {
			setIsLoading(false)
			setIsEmpty(true)
			return
		}

		setIsLoading(true)
		try {
			const res = await fetch(`/api/compatibility/?componentId=${componentId}`)
			const data = await res.json()

			if (res.ok) {
				setCompatibilities(data)
				setIsEmpty(data.length === 0)

				// Загружаем компоненты
				const componentsRes = await fetch(`/api/products`)
				const componentsData = await componentsRes.json()

				// Получаем список компонентов
				const componentsList = componentsData.components

				// Проверка на массив
				if (Array.isArray(componentsList)) {
					const newComponentsMap = new Map<number, string>()
					componentsList.forEach((component: Component) => {
						if (component.name && component.id) {
							newComponentsMap.set(component.id, component.name)
						}
					})
					setComponentsMap(newComponentsMap)
				} else {
					console.error('Ответ API не является массивом компонентов.')
				}
			} else {
				setIsEmpty(true)
				console.error(
					data.error || 'Нет совместимостей для этого комплектующего.'
				)
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
			const loadingToastId = toast.loading('Удаление совместимости...')

			const res = await fetch(`/api/compatibility/${compatibilityId}/`, {
				method: 'DELETE',
			})

			toast.dismiss(loadingToastId)

			if (res.ok) {
				// Убираем удаленную совместимость из списка
				setCompatibilities(prev =>
					prev.filter(item => item.id !== compatibilityId)
				)
				if (compatibilities.length === 1) {
					setIsEmpty(true)
				}
				toast.success('Совместимость успешно удалена.')
			} else {
				const data = await res.json()
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

	return (
		<div className='bg-[#202529] p-6 rounded-2xl border border-gray-700 shadow-lg'>
			<h3 className='text-xl text-white font-bold mb-4 flex items-center'>
				<CheckCircle className='h-5 w-5 mr-2 text-blue-400' />
				Совместимые компоненты
			</h3>

			{isLoading ? (
				<div className='flex justify-center items-center p-8'>
					<div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500'></div>
					<span className='ml-3 text-blue-400'>Загрузка совместимостей...</span>
				</div>
			) : isEmpty || compatibilities.length === 0 ? (
				<div className='text-center py-8 px-4'>
					<AlertCircle className='h-10 w-10 text-yellow-500 mx-auto mb-3' />
					<p className='text-gray-300 mb-2'>Совместимости не найдены</p>
					<p className='text-gray-400 text-sm'>
						Добавьте совместимые компоненты в разделе выше
					</p>
				</div>
			) : (
				<div className='max-h-[350px] overflow-y-auto pr-1 custom-scrollbar'>
					<table className='text-white w-full border-separate border-spacing-0'>
						<tbody className='divide-y divide-gray-700'>
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
									<tr
										key={comp.id}
										className='hover:bg-[#252A30] transition-colors'
									>
										<td className='py-3 px-2 flex items-center w-full'>
											<div className='flex items-center w-full justify-between'>
												<div className='flex items-center space-x-2'>
													<span className='text-blue-400'>•</span>
													<span className='text-gray-300'>
														{firstComponent || 'Неизвестный компонент'}
													</span>
												</div>
												<div className='border-t border-dashed border-gray-600 flex-grow mx-4'></div>
												<span className='text-gray-300'>
													{secondComponent || 'Неизвестный компонент'}
												</span>
											</div>
										</td>
										<td className='py-2 px-2 w-12'>
											<button
												className='bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-lg transition-colors'
												onClick={() => handleRemoveCompatibility(comp.id)}
												title='Удалить совместимость'
											>
												<Trash size={16} />
											</button>
										</td>
									</tr>
								)
							})}
						</tbody>
					</table>
				</div>
			)}

			<button
				onClick={fetchCompatibilities}
				className='mt-4 text-blue-400 hover:text-blue-300 text-sm flex items-center'
			>
				<svg
					className='w-4 h-4 mr-1'
					fill='none'
					stroke='currentColor'
					viewBox='0 0 24 24'
				>
					<path
						strokeLinecap='round'
						strokeLinejoin='round'
						strokeWidth='2'
						d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
					></path>
				</svg>
				Обновить список
			</button>
		</div>
	)
}
export default CompatibilitiesList
