'use client'

import React, { useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { toast, ToastContainer } from 'react-toastify'
import { useRouter } from 'next/navigation'
import {
	Trash,
	ChevronDown,
	ChevronUp,
	Search,
	CheckCircle,
	AlertCircle,
} from 'lucide-react'
import 'react-toastify/dist/ReactToastify.css'

// Interfaces
interface Component {
	id?: number
	name: string
	price: number
	brand: string
	image_url: string
	hidden: boolean
	category_id?: number
}

interface Category {
	id: number
	name: string
}

interface Compatibility {
	id: number
	component1_id: number
	component2_id: number
}

// Enhanced AddCompatibility Component
const AddCompatibility = ({ componentId }: { componentId: number }) => {
	const [categories, setCategories] = useState<Category[]>([])
	const [components, setComponents] = useState<Component[]>([])
	const [compatibilities, setCompatibilities] = useState<Compatibility[]>([])
	const [searchText, setSearchText] = useState<string>('')
	const [loading, setLoading] = useState<boolean>(true)
	const [categoryOpenState, setCategoryOpenState] = useState<{
		[key: number]: boolean
	}>({})

	useEffect(() => {
		if (componentId) {
			fetchData()
		}
	}, [componentId])

	const fetchData = async () => {
		setLoading(true)
		try {
			const productsRes = await fetch('/api/products')
			const { categories, components } = await productsRes.json()

			setCategories(categories || [])
			setComponents(
				components?.filter((comp: Component) => comp.id !== componentId) || []
			)

			const compatRes = await fetch(
				`/api/compatibility?componentId=${componentId}`
			)
			const compatData = await compatRes.json()
			setCompatibilities(compatData || [])

			// Initialize all categories as closed
			const initialCategoryState: { [key: number]: boolean } = {}
			categories?.forEach((cat: Category) => {
				initialCategoryState[cat.id] = false
			})
			setCategoryOpenState(initialCategoryState)
		} catch (error) {
			console.error('Ошибка при загрузке данных:', error)
			toast.error('Ошибка при загрузке данных совместимости')
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
		if (!componentId) {
			toast.warning('Сначала сохраните компонент')
			return
		}

		try {
			// Show loading toast
			const loadingToastId = toast.loading('Добавление совместимости...')

			const res = await fetch('/api/compatibility', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					component1_id: componentId,
					component2_id: compId,
				}),
			})

			// Dismiss loading toast
			toast.dismiss(loadingToastId)

			if (res.ok) {
				toast.success('Совместимость успешно добавлена!')
				fetchData() // перезагрузка данных
			} else {
				const errorData = await res.json()
				toast.error(errorData.message || 'Ошибка при добавлении совместимости!')
			}
		} catch (error) {
			console.error('Ошибка:', error)
			toast.error('Произошла ошибка при добавлении совместимости!')
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

	// Group components by category
	const componentsByCategory: { [key: number]: Component[] } = {}
	filteredComponents.forEach(comp => {
		if (comp.category_id) {
			if (!componentsByCategory[comp.category_id]) {
				componentsByCategory[comp.category_id] = []
			}
			componentsByCategory[comp.category_id].push(comp)
		}
	})

	return (
		<div className='bg-[#202529] p-6 rounded-2xl border border-gray-700 shadow-lg'>
			<h3 className='text-xl text-white mb-4 font-bold flex items-center'>
				<CheckCircle className='h-5 w-5 mr-2 text-blue-400' />
				Добавить совместимость
			</h3>

			{/* Поиск */}
			<div className='relative mb-4'>
				<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
					<Search className='h-5 w-5 text-gray-400' />
				</div>
				<input
					type='text'
					value={searchText}
					onChange={e => setSearchText(e.target.value)}
					className='bg-[#2C3136] text-white pl-10 pr-4 py-2 rounded-xl w-full border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all'
					placeholder='Поиск по компонентам...'
				/>
			</div>

			{/* Список категорий */}
			<div className='space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar'>
				{loading ? (
					<div className='flex justify-center items-center p-6'>
						<div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500'></div>
						<span className='ml-3 text-blue-400'>
							Загрузка списка компонентов...
						</span>
					</div>
				) : categories.length > 0 ? (
					categories.map(category => (
						<div
							key={category.id}
							className='bg-[#1A1D21] rounded-xl overflow-hidden'
						>
							<button
								onClick={() => handleCategoryToggle(category.id)}
								className='bg-[#252A30] text-white p-3 w-full flex justify-between items-center hover:bg-gray-700 transition-colors'
							>
								<span className='font-medium'>{category.name}</span>
								{categoryOpenState[category.id] ? (
									<ChevronUp className='h-5 w-5 text-gray-400' />
								) : (
									<ChevronDown className='h-5 w-5 text-gray-400' />
								)}
							</button>

							{/* Продукты внутри категории */}
							{categoryOpenState[category.id] &&
								componentsByCategory[category.id] && (
									<div className='divide-y divide-gray-700'>
										{componentsByCategory[category.id].length > 0 ? (
											componentsByCategory[category.id].map(comp => (
												<div
													key={comp.id}
													className='flex justify-between items-center p-3 hover:bg-[#252A30] transition-colors'
												>
													<div className='flex items-center'>
														<span className='text-white'>{comp.name}</span>
														<span className='text-gray-400 text-sm ml-2'>
															{comp.brand && `(${comp.brand})`}
														</span>
													</div>
													{alreadyCompatible(comp.id!) ? (
														<span className='text-green-400 flex items-center'>
															<CheckCircle className='h-4 w-4 mr-1' />
															Совместимо
														</span>
													) : (
														<button
															onClick={() => handleAddCompatibility(comp.id!)}
															className='bg-[#0C6FFC] hover:bg-blue-600 text-white py-1 px-3 rounded-lg transition-colors flex items-center'
														>
															<span>Добавить</span>
														</button>
													)}
												</div>
											))
										) : (
											<div className='p-3 text-gray-400 text-center italic'>
												Нет компонентов в этой категории
											</div>
										)}
									</div>
								)}
						</div>
					))
				) : (
					<div className='text-center p-4'>
						<AlertCircle className='h-6 w-6 text-yellow-500 mx-auto mb-2' />
						<p className='text-gray-300'>Категории не найдены</p>
					</div>
				)}
			</div>
		</div>
	)
}

export default AddCompatibility
