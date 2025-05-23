'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import {
	ChevronDown,
	Grid,
	List,
	RefreshCw,
	Search,
	Filter,
	X,
	ChevronUp,
	Edit,
	Eye,
	Trash2,
	Star,
	StarOff,
	AlertCircle,
	Plus,
} from 'lucide-react'
import Sidebar from '../_components/Sidebar'
import { useAuth } from '@/context/AuthContext'

interface Component {
	id: number
	name: string
	price: number
	brand: string
	image_url?: string
	category_id: number
	created_at: string
	hidden?: boolean
}

interface Category {
	id: number
	name: string
	name_en: string
	name_ru: string
	name_am: string
}

export interface Favorite {
	id: number
	admin_id: string
	configuration_id?: string | null
	product_id?: number | null
	order_id?: number | null
	created_at: string
}

const ComponentsPage = () => {
	const { user } = useAuth()
	const [categories, setCategories] = useState<Category[]>([])
	const [components, setComponents] = useState<Component[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState<string>('')
	const [minPrice, setMinPrice] = useState<number | string>('')
	const [maxPrice, setMaxPrice] = useState<number | string>('')
	const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
	const [selectedBrand, setSelectedBrand] = useState<string | null>(null)
	const [currentPage, setCurrentPage] = useState(1)
	const [pageSize, setPageSize] = useState(10)
	const [isLoadingMore, setIsLoadingMore] = useState(false)
	const [sortBy, setSortBy] = useState<string>('name')
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
	const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid')
	const [showFilters, setShowFilters] = useState(true)
	const [imageError, setImageError] = useState<Record<number, boolean>>({})
	const [totalCount, setTotalCount] = useState(0)

	// Favorites state
	const [favoriteComponents, setFavoriteComponents] = useState<
		Record<number, boolean>
	>({})
	const [favoriteLoading, setFavoriteLoading] = useState<
		Record<number, boolean>
	>({})
	const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

	// View component modal state
	const [viewComponent, setViewComponent] = useState<Component | null>(null)
	const [viewModalOpen, setViewModalOpen] = useState(false)

	// Delete confirmation state
	const [deleteModalOpen, setDeleteModalOpen] = useState(false)
	const [componentToDelete, setComponentToDelete] = useState<number | null>(
		null
	)

	useEffect(() => {
		const fetchData = async () => {
			try {
				setIsLoading(true)
				const res = await fetch('/api/products?page=1&pageSize=' + pageSize)

				if (!res.ok) {
					throw new Error(`Error: ${res.status} ${res.statusText}`)
				}

				const data = await res.json()
				setCategories(data.categories)
				setComponents(data.components)

				// Store the total count from pagination metadata
				if (data.pagination) {
					setTotalCount(data.pagination.totalCount)
				}

				setIsLoading(false)
			} catch (error) {
				console.error('Error loading data:', error)
				toast.error('Failed to load components')
				setIsLoading(false)
			}
		}

		fetchData()
		fetchFavorites()
	}, [pageSize])

	const fetchFavorites = async () => {
		if (!user) return

		try {
			const response = await fetch(`/api/favorites?adminId=${user.id}`)
			if (!response.ok) throw new Error('Failed to fetch favorites')

			const favorites = await response.json()

			// Create a map of component IDs to favorite status
			const favMap: Record<number, boolean> = {}
			favorites.forEach((fav: Favorite) => {
				if (fav.product_id) {
					favMap[fav.product_id] = true
				}
			})

			setFavoriteComponents(favMap)
		} catch (error) {
			console.error('Error fetching favorites:', error)
		}
	}

	const loadMoreData = async () => {
		try {
			setIsLoadingMore(true)
			const nextPage = currentPage + 1
			const res = await fetch(
				`/api/products?page=${nextPage}&pageSize=${pageSize}`,
				{ method: 'GET' }
			)

			if (!res.ok) {
				throw new Error(`Error: ${res.status} ${res.statusText}`)
			}

			const data = await res.json()

			if (data.components && data.components.length > 0) {
				setComponents(prevComponents => [...prevComponents, ...data.components])
				setCurrentPage(nextPage)

				// Update total count in case it changed
				if (data.pagination) {
					setTotalCount(data.pagination.totalCount)
				}
			} else {
				toast.info('No more components to load')
			}

			setIsLoadingMore(false)
		} catch (error) {
			console.error('Error loading more data:', error)
			toast.error('Failed to load more components')
			setIsLoadingMore(false)
		}
	}

	const toggleFavorite = async (componentId: number) => {
		if (!user) {
			toast.error('Please log in to add favorites')
			return
		}

		setFavoriteLoading(prev => ({ ...prev, [componentId]: true }))

		try {
			const isFavorite = favoriteComponents[componentId]

			if (!isFavorite) {
				// Add to favorites
				const response = await fetch('/api/favorites', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						admin_id: user.id,
						configuration_id: null,
						product_id: componentId,
						order_id: null,
					}),
				})

				if (!response.ok) {
					const data = await response.json()
					throw new Error(data.error || 'Failed to add to favorites')
				}

				setFavoriteComponents(prev => ({ ...prev, [componentId]: true }))
				toast.success('Added to favorites')
			} else {
				// Remove from favorites
				// First, find the favorite record
				const getFavoritesRes = await fetch(`/api/favorites?adminId=${user.id}`)
				const favoritesData = await getFavoritesRes.json()

				const favoriteToDelete = favoritesData.find(
					(fav: Favorite) => fav.product_id === componentId
				)

				if (!favoriteToDelete) {
					throw new Error('Favorite record not found')
				}

				// Delete the favorite
				const deleteRes = await fetch(
					`/api/favorites?id=${favoriteToDelete.id}`,
					{
						method: 'DELETE',
					}
				)

				if (!deleteRes.ok) {
					const data = await deleteRes.json()
					throw new Error(data.error || 'Failed to remove from favorites')
				}

				const newFavorites = { ...favoriteComponents }
				delete newFavorites[componentId]
				setFavoriteComponents(newFavorites)
				toast.success('Удалено из избранного')
			}
		} catch (error) {
			console.error('Error toggling favorite:', error)
			toast.error(
				error instanceof Error ? error.message : 'Error updating favorites'
			)
		} finally {
			setFavoriteLoading(prev => ({ ...prev, [componentId]: false }))
		}
	}

	const handleViewComponent = (component: Component) => {
		setViewComponent(component)
		setViewModalOpen(true)
	}

	const handleConfirmDelete = (componentId: number) => {
		setComponentToDelete(componentId)
		setDeleteModalOpen(true)
	}

	const handleDelete = async (componentId: number) => {
		try {
			const res = await fetch(`/api/products/${componentId}`, {
				method: 'DELETE',
			})

			if (!res.ok) {
				throw new Error(`Error: ${res.status} ${res.statusText}`)
			}

			setComponents(prevComponents =>
				prevComponents.filter(comp => comp.id !== componentId)
			)

			// If the component was favorited, update the favorites state
			if (favoriteComponents[componentId]) {
				const newFavorites = { ...favoriteComponents }
				delete newFavorites[componentId]
				setFavoriteComponents(newFavorites)
			}

			toast.success('Комплектующее удалено!')
			setDeleteModalOpen(false)
			setComponentToDelete(null)
		} catch (err) {
			console.error('Error during deletion:', err)
			toast.error('Error deleting component.')
		}
	}

	const handleSort = (field: string) => {
		if (sortBy === field) {
			setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
		} else {
			setSortBy(field)
			setSortOrder('asc')
		}
	}

	const handleImageError = (componentId: number) => {
		setImageError(prev => ({ ...prev, [componentId]: true }))
	}

	const resetFilters = () => {
		setSearchQuery('')
		setMinPrice('')
		setMaxPrice('')
		setSelectedCategory(null)
		setSelectedBrand(null)
		setShowFavoritesOnly(false)
	}

	const toggleFilters = () => {
		setShowFilters(!showFilters)
	}

	// Filtered components with favorites filter
	const filteredComponents = components.filter(component => {
		const matchesSearch = component.name
			.toLowerCase()
			.includes(searchQuery.toLowerCase())
		const matchesCategory = selectedCategory
			? component.category_id === selectedCategory
			: true
		const matchesBrand = selectedBrand
			? component.brand === selectedBrand
			: true
		const matchesMinPrice =
			minPrice === '' || component.price >= Number(minPrice)
		const matchesMaxPrice =
			maxPrice === '' || component.price <= Number(maxPrice)
		const matchesFavorites = showFavoritesOnly
			? favoriteComponents[component.id]
			: true

		return (
			matchesSearch &&
			matchesCategory &&
			matchesMinPrice &&
			matchesMaxPrice &&
			matchesBrand &&
			matchesFavorites
		)
	})

	// Sort components
	const sortedComponents = [...filteredComponents].sort((a, b) => {
		if (sortBy === 'price') {
			return sortOrder === 'asc' ? a.price - b.price : b.price - a.price
		} else if (sortBy === 'name') {
			return sortOrder === 'asc'
				? a.name.localeCompare(b.name)
				: b.name.localeCompare(a.name)
		} else if (sortBy === 'brand') {
			return sortOrder === 'asc'
				? a.brand.localeCompare(b.brand)
				: b.brand.localeCompare(a.brand)
		}
		return 0
	})

	const brands = Array.from(
		new Set(components.map(component => component.brand))
	)

	const getCategoryName = (categoryId: number) => {
		const category = categories.find(cat => cat.id === categoryId)
		if (!category) return 'Unknown Category'

		// Handle all possible cases of category name
		return category.name_en || category.name || 'Unknown Category'
	}

	// Format price
	const formatPrice = (price: number) => {
		return new Intl.NumberFormat('en-EN', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0,
		}).format(price)
	}

	if (isLoading) {
		return (
			<div className='flex min-h-screen bg-[#171C1F]'>
				<div className='flex-1 p-8 ml-16'>
					<div className='flex items-center justify-center h-full'>
						<div className='animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500'></div>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className='min-h-screen bg-gradient-to-b from-[#161a1d] to-[#0f1215] text-white'>
			<Sidebar />
			<div className='px-4 py-6 w-full max-w-screen-xl mx-auto flex flex-col'>
				<ToastContainer
					position='top-right'
					autoClose={3000}
					hideProgressBar={false}
					newestOnTop
					closeOnClick
					rtl={false}
					pauseOnFocusLoss
					draggable
					pauseOnHover
					theme='dark'
				/>

				<div className='mb-8'>
					<div className='flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4'>
						<h1 className='text-3xl font-bold text-white'>Комплектующие</h1>
						<div className='flex items-center space-x-3'>
							<Link href='/admin/add-component'>
								<button className='flex items-center space-x-1 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors'>
									<Plus size={18} />
									<span>Добавить комплектующее</span>
								</button>
							</Link>
							<button
								onClick={() => setViewMode('list')}
								className={`p-2 rounded-lg ${
									viewMode === 'list'
										? 'bg-blue-600'
										: 'bg-[#202529] hover:bg-[#2a3035]'
								}`}
							>
								<List size={20} />
							</button>
							<button
								onClick={() => setViewMode('grid')}
								className={`p-2 rounded-lg ${
									viewMode === 'grid'
										? 'bg-blue-600'
										: 'bg-[#202529] hover:bg-[#2a3035]'
								}`}
							>
								<Grid size={20} />
							</button>
							<button
								onClick={toggleFilters}
								className='flex items-center space-x-2 bg-[#202529] hover:bg-[#2a3035] p-2 rounded-lg'
							>
								<Filter size={18} />
								<span className='hidden sm:inline'>
									{showFilters ? 'Скрыть фильтры' : 'Показывать фильтры'}
								</span>
								{showFilters ? (
									<ChevronUp size={18} />
								) : (
									<ChevronDown size={18} />
								)}
							</button>
						</div>
					</div>

					{showFilters && (
						<div className='bg-[#202529] p-4 rounded-xl shadow-lg mb-6 transition-all duration-300 ease-in-out'>
							<div className='flex flex-wrap gap-4'>
								<div className='flex-1 min-w-[240px]'>
									<div className='relative'>
										<Search
											className='absolute left-3 top-3 text-gray-400'
											size={18}
										/>
										<input
											type='text'
											placeholder='Искать комплектующее...'
											value={searchQuery}
											onChange={e => setSearchQuery(e.target.value)}
											className='bg-[#1a1f23] text-white p-2 pl-10 rounded-lg w-full border border-gray-700 focus:border-blue-500 focus:outline-none'
										/>
									</div>
								</div>

								<div className='flex-1 min-w-[180px]'>
									<input
										type='number'
										placeholder='Мин.цена'
										value={minPrice}
										onChange={e => setMinPrice(e.target.value)}
										className='bg-[#1a1f23] text-white p-2 rounded-lg w-full border border-gray-700 focus:border-blue-500 focus:outline-none'
									/>
								</div>

								<div className='flex-1 min-w-[180px]'>
									<input
										type='number'
										placeholder='Макс.цена'
										value={maxPrice}
										onChange={e => setMaxPrice(e.target.value)}
										className='bg-[#1a1f23] text-white p-2 rounded-lg w-full border border-gray-700 focus:border-blue-500 focus:outline-none'
									/>
								</div>

								<div className='flex-1 min-w-[200px]'>
									<select
										value={selectedCategory ?? ''}
										onChange={e =>
											setSelectedCategory(
												e.target.value ? Number(e.target.value) : null
											)
										}
										className='bg-[#1a1f23] text-white p-2 rounded-lg w-full border border-gray-700 focus:border-blue-500 focus:outline-none appearance-none'
										style={{
											backgroundImage:
												"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
											backgroundRepeat: 'no-repeat',
											backgroundPosition: 'right 0.5rem center',
										}}
									>
										<option value=''>Все категории</option>
										{categories.map(category => (
											<option key={category.id} value={category.id}>
												{category.name}
											</option>
										))}
									</select>
								</div>

								<div className='flex-1 min-w-[200px]'>
									<select
										value={selectedBrand ?? ''}
										onChange={e => setSelectedBrand(e.target.value || null)}
										className='bg-[#1a1f23] text-white p-2 rounded-lg w-full border border-gray-700 focus:border-blue-500 focus:outline-none appearance-none'
										style={{
											backgroundImage:
												"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
											backgroundRepeat: 'no-repeat',
											backgroundPosition: 'right 0.5rem center',
										}}
									>
										<option value=''>All brands</option>
										{brands.map(brand => (
											<option key={brand} value={brand}>
												{brand}
											</option>
										))}
									</select>
								</div>

								<div className='flex items-center flex-1 min-w-[200px]'>
									<label className='flex items-center cursor-pointer'>
										<input
											type='checkbox'
											checked={showFavoritesOnly}
											onChange={() => setShowFavoritesOnly(!showFavoritesOnly)}
											className='sr-only'
										/>
										<div
											className={`w-10 h-6 ${
												showFavoritesOnly ? 'bg-blue-600' : 'bg-gray-600'
											} rounded-full p-1 transition-colors duration-200 ease-in-out`}
										>
											<div
												className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ease-in-out ${
													showFavoritesOnly ? 'translate-x-4' : 'translate-x-0'
												}`}
											></div>
										</div>
										<span className='ml-3 text-white'>Только избранное</span>
									</label>
								</div>

								<button
									onClick={resetFilters}
									className='bg-[#1a1f23] hover:bg-[#2a3035] text-gray-400 hover:text-white p-2 rounded-lg flex items-center justify-center border border-gray-700'
								>
									<X size={18} className='mr-1' />
									Сбросить
								</button>
							</div>
						</div>
					)}

					<div className='flex justify-between items-center mb-4'>
						<div className='text-gray-400'>
							Showing {sortedComponents.length} of {components.length}{' '}
							components
						</div>
						<div className='flex items-center space-x-4 overflow-x-auto'>
							<span className='text-gray-400 whitespace-nowrap'>Сортировать по:</span>
							<button
								onClick={() => handleSort('name')}
								className={`flex items-center whitespace-nowrap ${
									sortBy === 'name' ? 'text-blue-500' : 'text-gray-300'
								}`}
							>
								<span>Название</span>
								{sortBy === 'name' &&
									(sortOrder === 'asc' ? (
										<ChevronUp size={16} className='ml-1' />
									) : (
										<ChevronDown size={16} className='ml-1' />
									))}
							</button>

							<button
								onClick={() => handleSort('price')}
								className={`flex items-center whitespace-nowrap ${
									sortBy === 'price' ? 'text-blue-500' : 'text-gray-300'
								}`}
							>
								<span>Цена</span>
								{sortBy === 'price' &&
									(sortOrder === 'asc' ? (
										<ChevronUp size={16} className='ml-1' />
									) : (
										<ChevronDown size={16} className='ml-1' />
									))}
							</button>

							<button
								onClick={() => handleSort('brand')}
								className={`flex items-center whitespace-nowrap ${
									sortBy === 'brand' ? 'text-blue-500' : 'text-gray-300'
								}`}
							>
								<span>Бренд</span>
								{sortBy === 'brand' &&
									(sortOrder === 'asc' ? (
										<ChevronUp size={16} className='ml-1' />
									) : (
										<ChevronDown size={16} className='ml-1' />
									))}
							</button>
						</div>
					</div>
				</div>

				{sortedComponents.length === 0 ? (
					<div className='bg-[#202529] rounded-xl p-12 shadow-lg w-full text-center'>
						<div className='flex flex-col items-center justify-center'>
							<Search className='w-16 h-16 text-gray-500 mb-4' />
							<h3 className='text-xl font-semibold mb-2'>
								Не найдено комплектующих
							</h3>
							<p className='text-gray-400 mb-4'>
								Попробуйте изменить фильтры или добавить новые комплектующие.
							</p>
							<button
								onClick={resetFilters}
								className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg'
							>
								Сбросить фильтры
							</button>
						</div>
					</div>
				) : viewMode === 'list' ? (
					<div className='bg-[#202529] rounded-xl shadow-lg w-full overflow-hidden'>
						<div className='grid grid-cols-6 gap-4 p-4 border-b border-gray-700 text-white font-semibold text-sm'>
							<div className='text-center'>Изображение</div>
							<div className='text-center col-span-2'>Название</div>
							<div className='text-center'>Бренд</div>
							<div className='text-center'>Цена</div>
							<div className='text-center'>Действия</div>
						</div>
						<div className='divide-y divide-gray-700'>
							{sortedComponents.map((component, index) => (
								<div
									key={`component-${component.id}-${index}`}
									className='grid grid-cols-6 gap-4 p-4 items-center text-white text-center hover:bg-[#282e34] transition-colors duration-200'
								>
									<div className='flex justify-center'>
										{imageError[component.id] ? (
											<div className='w-14 h-14 bg-gray-800 rounded-lg flex items-center justify-center text-gray-500'>
												Нет изображения
											</div>
										) : (
											<div className='relative w-14 h-14 bg-gray-800 rounded-lg overflow-hidden'>
												<Image
													src={
														component.image_url &&
														component.image_url.startsWith('http')
															? component.image_url
															: '/placeholder-image.png'
													}
													alt={component.name}
													fill
													style={{ objectFit: 'contain' }}
													className='p-1'
													onError={() => handleImageError(component.id)}
												/>
											</div>
										)}
									</div>
									<div className='font-medium text-left col-span-2'>
										<div className='flex items-center'>
											<button
												onClick={() => toggleFavorite(component.id)}
												disabled={favoriteLoading[component.id]}
												className={`mr-2 flex-shrink-0 focus:outline-none ${
													favoriteLoading[component.id] ? 'opacity-50' : ''
												}`}
												title={
													favoriteComponents[component.id]
														? 'Удалить из избранного'
														: 'Добавить в избранное'
												}
											>
												{favoriteLoading[component.id] ? (
													<RefreshCw className='h-4 w-4 text-yellow-500 animate-spin' />
												) : favoriteComponents[component.id] ? (
													<Star className='h-4 w-4 text-yellow-500 fill-yellow-500' />
												) : (
													<StarOff className='h-4 w-4 text-gray-500 hover:text-yellow-500' />
												)}
											</button>
											<span className='truncate'>{component.name}</span>
										</div>
										<div className='text-xs text-gray-500 mt-1'>
											Категория: {getCategoryName(component.category_id)}
										</div>
									</div>
									<div className='text-gray-400'>{component.brand}</div>
									<div className='text-lg font-bold text-green-400'>
										{formatPrice(component.price)}
									</div>
									<div className='flex justify-center space-x-2'>
										<button
											onClick={() => handleViewComponent(component)}
											className='p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700'
											title='Посмотреть детали'
										>
											<Eye size={16} />
										</button>
										<Link href={`/admin/edit-component/${component.id}`}>
											<button
												className='p-1.5 bg-amber-600 text-white rounded hover:bg-amber-700'
												title='Редактировать комплектующее'
											>
												<Edit size={16} />
											</button>
										</Link>
										<button
											onClick={() => handleConfirmDelete(component.id)}
											className='p-1.5 bg-red-600 text-white rounded hover:bg-red-700'
											title='Удалить комплектующее'
										>
											<Trash2 size={16} />
										</button>
									</div>
								</div>
							))}
						</div>
					</div>
				) : (
					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
						{sortedComponents.map((component, index) => (
							<div
								key={`grid-component-${component.id}-${index}`}
								className='bg-[#202529] rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:translate-y-[-4px]'
							>
								<div className='h-48 bg-gray-800 relative'>
									<button
										onClick={() => toggleFavorite(component.id)}
										disabled={favoriteLoading[component.id]}
										className={`absolute top-2 right-2 z-10 p-1.5 bg-gray-900 bg-opacity-70 rounded-full ${
											favoriteLoading[component.id]
												? 'opacity-50'
												: 'hover:bg-opacity-90'
										}`}
										title={
											favoriteComponents[component.id]
												? 'Удалить из избранного'
												: 'Добавить в избранное'
										}
									>
										{favoriteLoading[component.id] ? (
											<RefreshCw className='h-5 w-5 text-yellow-500 animate-spin' />
										) : favoriteComponents[component.id] ? (
											<Star className='h-5 w-5 text-yellow-500 fill-yellow-500' />
										) : (
											<StarOff className='h-5 w-5 text-gray-400 hover:text-yellow-500' />
										)}
									</button>
									{imageError[component.id] ? (
										<div className='w-full h-full flex items-center justify-center text-gray-500'>
											Нет изображения
										</div>
									) : (
										<Image
											src={
												component.image_url &&
												component.image_url.startsWith('http')
													? component.image_url
													: '/placeholder-image.png'
											}
											alt={component.name}
											fill
											style={{ objectFit: 'contain' }}
											className='p-3'
											onError={() => handleImageError(component.id)}
										/>
									)}
								</div>
								<div className='p-4'>
									<div className='flex items-center mb-1'>
										<span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-200'>
											Категория: {getCategoryName(component.category_id)}
										</span>
									</div>
									<h3 className='font-semibold text-lg mb-1 truncate'>
										{component.name}
									</h3>
									<p className='text-gray-400 text-sm'>{component.brand}</p>
									<div className='flex items-center justify-between mt-4'>
										<span className='text-green-400 font-bold text-xl'>
											{formatPrice(component.price)}
										</span>
										<div className='flex space-x-1'>
											<button
												onClick={() => handleViewComponent(component)}
												className='p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700'
												title='Посмотреть детали'
											>
												<Eye size={16} />
											</button>
											<Link href={`/admin/edit-component/${component.id}`}>
												<button
													className='p-1.5 bg-amber-600 text-white rounded hover:bg-amber-700'
													title='Редактировать комплектующее'
												>
													<Edit size={16} />
												</button>
											</Link>
											<button
												onClick={() => handleConfirmDelete(component.id)}
												className='p-1.5 bg-red-600 text-white rounded hover:bg-red-700'
												title='Удалить комплектующее'
											>
												<Trash2 size={16} />
											</button>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				)}

				{components.length > 0 && components.length < totalCount && (
					<div className='mt-8 text-center'>
						<button
							onClick={loadMoreData}
							disabled={isLoadingMore}
							className={`px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg transform transition-all duration-200 ${
								isLoadingMore
									? 'opacity-70 cursor-not-allowed'
									: 'hover:scale-105'
							}`}
						>
							{isLoadingMore ? (
								<div className='flex items-center justify-center'>
									<RefreshCw className='animate-spin mr-2 h-5 w-5' />
									<span>Загрузка...</span>
								</div>
							) : (
								'Загрузить больше'
							)}
						</button>
					</div>
				)}
			</div>

			{/* View Component Modal */}
			{viewModalOpen && viewComponent && (
				<div className='fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4'>
					<div className='bg-[#202529] rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
						<div className='sticky top-0 bg-[#202529] px-6 py-4 border-b border-gray-700 flex justify-between items-center'>
							<h2 className='text-xl font-bold text-white'>
								Детали комплектующего
							</h2>
							<button
								onClick={() => setViewModalOpen(false)}
								className='text-gray-400 hover:text-white'
							>
								<X size={24} />
							</button>
						</div>

						<div className='p-6'>
							<div className='flex flex-col md:flex-row gap-6'>
								<div className='md:w-1/3'>
									<div className='bg-gray-800 rounded-lg p-2 h-48 md:h-64 relative'>
										{imageError[viewComponent.id] ? (
											<div className='w-full h-full flex items-center justify-center text-gray-500'>
												Нет изображения
											</div>
										) : (
											<Image
												src={
													viewComponent.image_url &&
													viewComponent.image_url.startsWith('http')
														? viewComponent.image_url
														: '/placeholder-image.png'
												}
												alt={viewComponent.name}
												fill
												style={{ objectFit: 'contain' }}
												className='p-3'
												onError={() => handleImageError(viewComponent.id)}
											/>
										)}
									</div>

									<div className='mt-4 flex justify-center'>
										<button
											onClick={() => toggleFavorite(viewComponent.id)}
											disabled={favoriteLoading[viewComponent.id]}
											className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
												favoriteComponents[viewComponent.id]
													? 'bg-yellow-600 hover:bg-yellow-700 text-white'
													: 'bg-gray-700 hover:bg-gray-600 text-white'
											}`}
										>
											{favoriteLoading[viewComponent.id] ? (
												<>
													<RefreshCw size={16} className='animate-spin' />
													<span>Обработка...</span>
												</>
											) : favoriteComponents[viewComponent.id] ? (
												<>
													<Star size={16} className='fill-white' />
													<span>Удалить из избранного</span>
												</>
											) : (
												<>
													<Star size={16} />
													<span>Добавить в избранное</span>
												</>
											)}
										</button>
									</div>
								</div>

								<div className='md:w-2/3'>
									<h3 className='text-2xl font-bold text-white mb-2'>
										{viewComponent.name}
									</h3>

									<div className='mb-4'>
										<span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-200'>
											{getCategoryName(viewComponent.category_id)}
										</span>
									</div>

									<div className='text-3xl font-bold text-green-400 mb-6'>
										{formatPrice(viewComponent.price)}
									</div>

									<div className='space-y-3 text-gray-300'>
										<div className='flex justify-between py-2 border-b border-gray-700'>
											<span className='text-gray-400'>Бренд:</span>
											<span className='font-medium'>{viewComponent.brand}</span>
										</div>

										<div className='flex justify-between py-2 border-b border-gray-700'>
											<span className='text-gray-400'>Категория:</span>
											<span className='font-medium'>
												{getCategoryName(viewComponent.category_id)}
											</span>
										</div>

										<div className='flex justify-between py-2 border-b border-gray-700'>
											<span className='text-gray-400'>ID:</span>
											<span className='font-medium'>{viewComponent.id}</span>
										</div>

										<div className='flex justify-between py-2 border-b border-gray-700'>
											<span className='text-gray-400'>Создано:</span>
											<span className='font-medium'>
												{new Date(
													viewComponent.created_at
												).toLocaleDateString()}
											</span>
										</div>

										<div className='flex justify-between py-2 border-b border-gray-700'>
											<span className='text-gray-400'>Видимость:</span>
											<span
												className={`font-medium ${
													viewComponent.hidden
														? 'text-red-400'
														: 'text-green-400'
												}`}
											>
												{viewComponent.hidden ? 'Скрыто' : 'Видимо'}
											</span>
										</div>
									</div>

									<div className='mt-6 flex justify-end space-x-3'>
										<button
											onClick={() => {
												setViewModalOpen(false)
												handleConfirmDelete(viewComponent.id)
											}}
											className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors'
										>
											Удалить
										</button>

										<Link href={`/admin/edit-component/${viewComponent.id}`}>
											<button className='px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors'>
												Редактировать
											</button>
										</Link>

										<button
											onClick={() => setViewModalOpen(false)}
											className='px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors'
										>
											Закрыть
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Delete Confirmation Modal */}
			{deleteModalOpen && (
				<div className='fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4'>
					<div className='bg-[#202529] rounded-lg shadow-xl max-w-md w-full p-6'>
						<div className='flex items-center justify-center mb-4'>
							<div className='bg-red-900 rounded-full p-3'>
								<AlertCircle size={24} className='text-red-300' />
							</div>
						</div>
						<h3 className='text-xl font-bold text-white text-center mb-2'>
							Подтверждение удаления
						</h3>
						<p className='text-gray-300 text-center mb-6'>
							Вы уверены, что хотите удалить это комплектующее? Это действие
							необратимо.
						</p>
						<div className='flex justify-center space-x-4'>
							<button
								onClick={() => setDeleteModalOpen(false)}
								className='px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600'
							>
								Отмена
							</button>
							<button
								onClick={() =>
									componentToDelete !== null && handleDelete(componentToDelete)
								}
								className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700'
							>
								Удалить
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default ComponentsPage
