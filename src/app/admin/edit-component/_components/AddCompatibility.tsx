'use client'

import { useEffect, useState } from 'react'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

interface Category {
	id: number
	name: string
}

interface ComponentItem {
	id: number
	name: string
	price: number
	category_id: number
}

interface Compatibility {
	id: number
	component1_id: number
	component2_id: number
}

const AddCompatibility = ({ componentId }: { componentId: number }) => {
	const [categories, setCategories] = useState<Category[]>([])
	const [components, setComponents] = useState<ComponentItem[]>([])
	const [compatibilities, setCompatibilities] = useState<Compatibility[]>([])
	const [searchText, setSearchText] = useState<string>('')
	const [loading, setLoading] = useState<boolean>(true)

	const [categoryOpenState, setCategoryOpenState] = useState<{
		[key: number]: boolean
	}>({})

	useEffect(() => {
		fetchData()
	}, [])

	const fetchData = async () => {
		setLoading(true)
		try {
			const productsRes = await fetch('/api/products')
			const { categories, components } = await productsRes.json()

			console.log('Fetched categories:', categories) // Добавьте это для отладки
			setCategories(categories || [])
			setComponents(components || [])

			const compatRes = await fetch(
				`/api/compatibility?componentId=${componentId}`
			)
			const compatData = await compatRes.json()
			console.log('Fetched compatibilities:', compatData) // Добавьте это для отладки
			setCompatibilities(compatData || [])
		} catch (error) {
			console.error('Ошибка при загрузке данных:', error)
			toast.error('Ошибка при загрузке данных')
		}
		setLoading(false)
	}


	const handleCategoryToggle = (categoryId: number) => {
		setCategoryOpenState(prevState => ({
			...prevState,
			[categoryId]: !prevState[categoryId],
		}))
	}

	const handleAddCompatibility = async (compId: number) => {
		const isConfirmed = window.confirm(
			`Вы уверены, что хотите добавить совместимость с компонентом ${compId}?`
		)

		if (!isConfirmed) return

		try {
			const res = await fetch('/api/compatibility', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					component1_id: componentId,
					component2_id: compId,
				}),
			})

			if (res.ok) {
				toast.success('Совместимость успешно добавлена!')
				fetchData() // перезагрузка данных
			} else {
				toast.error('Ошибка при добавлении совместимости!')
			}
		} catch (error) {
			console.error('Ошибка:', error)
			toast.error('Произошла ошибка!')
		}
	}

	const alreadyCompatible = (compId: number) => {
		return compatibilities.some(
			c =>
				(c.component1_id === componentId && c.component2_id === compId) ||
				(c.component2_id === componentId && c.component1_id === compId)
		)
	}

	const filteredComponents = searchText
		? components.filter(comp =>
				comp.name.toLowerCase().includes(searchText.toLowerCase())
		  )
		: components

	return (
		<div className='bg-[#202529] p-6 rounded-lg'>
			<h3 className='text-xl text-white mb-4 font-bold'>
				Добавить совместимость
			</h3>

			{/* Поиск */}
			<input
				type='text'
				value={searchText}
				onChange={e => setSearchText(e.target.value)}
				className='bg-gray-700 text-white p-2 rounded-lg w-full mb-4'
				placeholder='Поиск по компонентам'
			/>

			{/* Список категорий */}
			<div className='space-y-4'>
				{categories.length > 0 ? (
					categories.map(category => (
						<div key={category.id}>
							<button
								onClick={() => handleCategoryToggle(category.id)}
								className='bg-gray-700 text-white p-2 rounded-lg w-full mb-2 flex justify-between items-center'
							>
								<span>{category.name}</span>
								<span>{categoryOpenState[category.id] ? '-' : '+'}</span>
							</button>

							{/* Продукты внутри категории */}
							{categoryOpenState[category.id] && (
								<div className='space-y-2'>
									{filteredComponents
										.filter(comp => comp.category_id === category.id)
										.map(comp => (
											<div
												key={comp.id}
												className='flex justify-between items-center bg-gray-700 p-2 rounded-lg'
											>
												<span className='text-white'>{comp.name}</span>
												{alreadyCompatible(comp.id) ? (
													<span className='text-green-400'>Уже добавлено</span>
												) : (
													<button
														onClick={() => handleAddCompatibility(comp.id)}
														className='bg-[#0C6FFC] text-white py-1 px-4 rounded-lg'
													>
														Добавить
													</button>
												)}
											</div>
										))}
								</div>
							)}
						</div>
					))
				) : (
					<p className='text-white'>Нет категорий</p>
				)}
			</div>

			{/* Индикатор загрузки */}
			{loading && (
				<div className='text-white text-center mt-4'>Загрузка данных...</div>
			)}

			<ToastContainer />
		</div>
	)
}

export default AddCompatibility
