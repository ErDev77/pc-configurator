'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import {
	Trash,
	ChevronDown,
	ChevronUp,
	Search,
	CheckCircle,
	AlertCircle,
	PlusCircle,
} from 'lucide-react'

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
	name_en?: string
	name_ru?: string
	name_am?: string
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
			// Fetch products with pagination to get all products
			const productsRes = await fetch('/api/products?page=1&pageSize=1000')
			const { categories: fetchedCategories, components: fetchedComponents } =
				await productsRes.json()

			console.log('Fetched categories:', fetchedCategories)
			console.log('Fetched components:', fetchedComponents)

			// Format categories properly
			const formattedCategories = fetchedCategories.map((category: any) => ({
				id: category.id,
				name: category.name,
				name_en: category.name_en || category.name,
				name_ru: category.name_ru === '[null]' ? '' : category.name_ru || '',
				name_am: category.name_am === '[null]' ? '' : category.name_am || '',
			}))

			setCategories(formattedCategories || [])

			// Filter out hidden components and the current component
			const filteredComponents =
				fetchedComponents?.filter(
					(comp: Component) => comp.id !== componentId && !comp.hidden
				) || []

			setComponents(filteredComponents)

			// Fetch existing compatibilities
			const compatRes = await fetch(
				`/api/compatibility?componentId=${componentId}`
			)
			const compatData = await compatRes.json()
			setCompatibilities(compatData || [])

			// Initialize category open states as closed
			const initialCategoryState: { [key: number]: boolean } = {}
			formattedCategories?.forEach((cat: Category) => {
				initialCategoryState[cat.id] = false
			})
			setCategoryOpenState(initialCategoryState)

			console.log('Components set:', filteredComponents)
			console.log('Categories set:', formattedCategories)
		} catch (error) {
			console.error('Error loading data:', error)
			toast.error('Error loading compatibility data')
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
			toast.warning('Please save the component first')
			return
		}

		try {
			// Show loading toast
			const loadingToastId = toast.loading('Adding compatibility...')

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
				toast.success('Compatibility added successfully!')
				fetchData() // reload data
			} else {
				const errorData = await res.json()
				toast.error(errorData.message || 'Error adding compatibility!')
			}
		} catch (error) {
			console.error('Error:', error)
			toast.error('An error occurred while adding compatibility!')
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
		? components.filter(
				comp =>
					comp.name.toLowerCase().includes(searchText.toLowerCase()) ||
					comp.brand?.toLowerCase().includes(searchText.toLowerCase())
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

	// Get category name (prioritizing English)
	const getCategoryName = (category: Category): string => {
		return category.name_en || category.name || `Category ${category.id}`
	}

	// Add debug logging for categories
	useEffect(() => {
		console.log('Current categories:', categories)
		console.log('Components by category:', componentsByCategory)
	}, [categories, componentsByCategory])

	return (
		<div className='bg-[#202529] p-6 rounded-2xl border border-gray-700 shadow-lg'>
			<h3 className='text-xl text-white mb-4 font-bold flex items-center'>
				<CheckCircle className='h-5 w-5 mr-2 text-blue-400' />
				Добавить совместимость
			</h3>

			{/* Search */}
			<div className='relative mb-4'>
				<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
					<Search className='h-5 w-5 text-gray-400' />
				</div>
				<input
					type='text'
					value={searchText}
					onChange={e => setSearchText(e.target.value)}
					className='bg-[#2C3136] text-white pl-10 pr-4 py-2 rounded-xl w-full border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all'
					placeholder='Поиск комплектующих...'
				/>
			</div>

			{/* Categories list */}
			<div className='space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar'>
				{loading ? (
					<div className='flex justify-center items-center p-6'>
						<div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500'></div>
						<span className='ml-3 text-blue-400'>Загрузка комплектующих...</span>
					</div>
				) : categories.length > 0 ? (
					categories.map(category => {
						const categoryComponents = componentsByCategory[category.id] || []

						return (
							<div
								key={category.id}
								className='bg-[#1A1D21] rounded-xl overflow-hidden'
							>
								<button
									onClick={() => handleCategoryToggle(category.id)}
									className='bg-[#252A30] text-white p-3 w-full flex justify-between items-center hover:bg-gray-700 transition-colors'
								>
									<span className='font-medium'>
										{getCategoryName(category)}
										<span className='text-gray-400 text-sm ml-2'>
											({categoryComponents.length})
										</span>
									</span>
									{categoryOpenState[category.id] ? (
										<ChevronUp className='h-5 w-5 text-gray-400' />
									) : (
										<ChevronDown className='h-5 w-5 text-gray-400' />
									)}
								</button>

								{/* Products inside category */}
								{categoryOpenState[category.id] && (
									<div className='divide-y divide-gray-700'>
										{categoryComponents.length > 0 ? (
											categoryComponents.map(comp => (
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
															<PlusCircle className='h-4 w-4 mr-1' />
															<span>Добавить</span>
														</button>
													)}
												</div>
											))
										) : (
											<div className='p-3 text-gray-400 text-center italic'>
												Нет комплектующих в этой категории
											</div>
										)}
									</div>
								)}
							</div>
						)
					})
				) : (
					<div className='text-center p-4'>
						<AlertCircle className='h-6 w-6 text-yellow-500 mx-auto mb-2' />
						<p className='text-gray-300'>Категории не найдены</p>
					</div>
				)}
			</div>

			{!loading && components.length === 0 && (
				<div className='text-center p-4 mt-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg'>
					<AlertCircle className='h-6 w-6 text-yellow-500 mx-auto mb-2' />
					<p className='text-yellow-400'>
						Нет комплектующих для добавления совместимости
					</p>
					<p className='text-gray-400 text-sm'>
						Убедитесь, что в системе есть другие комплектующие	
					</p>
				</div>
			)}
		</div>
	)
}

export default AddCompatibility
