'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
	Trash2,
	Eye,
	RefreshCw,
	AlertCircle,
	Star,
	Clock,
	DollarSign,
	ChevronDown,
	ChevronUp,
	Filter,
	Search,
	X,
	ShoppingCart,
	ChevronRight,
	StarOff,
	PcCase,
	Cpu,
} from 'lucide-react'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Sidebar from '../_components/Sidebar'
import { useAuth } from '@/context/AuthContext'

// Define interfaces for different favorite types
interface Configuration {
	id: string
	name: string
	price: number
	createdAt: string
	description?: string
	components?: string[]
}

interface Category {
	id: number
	name: string
}

interface Component {
	id: number
	name: string
	price: number
	category_id: number
	brand: string
	image_url?: string
	created_at: string
	hidden?: boolean
}

interface OrderItem {
	id: number
	order_id: number
	product_id: number
	name: string
	quantity: number
	price: number
}

interface Order {
	id: number
	generated_order_number: string
	status: string
	created_at: string
	customer_name?: string
	email?: string
	phone?: string
	address?: string
	total_amount?: number
	items?: OrderItem[]
}

export interface Favorite {
	id: number
	admin_id: string
	configuration_id?: string | null
	product_id?: number | null
	order_id?: number | null
	created_at: string
}

export default function FavoritesPage() {
	const { user, loading } = useAuth()

	// State for active tab
	const [activeTab, setActiveTab] = useState<
		'configurations' | 'components' | 'orders'
	>('configurations')

	// State for items
	const [configurations, setConfigurations] = useState<Configuration[]>([])
	const [components, setComponents] = useState<Component[]>([])
	const [orders, setOrders] = useState<Order[]>([])
	const [categories, setCategories] = useState<Category[]>([])

	// Loading and error states
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// Favorites state
	const [favoritedConfigIds, setFavoritedConfigIds] = useState<
		Record<string, boolean>
	>({})
	const [favoritedComponentIds, setFavoritedComponentIds] = useState<
		Record<string, boolean>
	>({})
	const [favoritedOrderIds, setFavoritedOrderIds] = useState<
		Record<string, boolean>
	>({})

	// Filter and sort states
	const [searchQuery, setSearchQuery] = useState('')
	const [showFilters, setShowFilters] = useState(false)
	const [sortBy, setSortBy] = useState<'name' | 'price' | 'date'>('date')
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
	const [minPrice, setMinPrice] = useState<string>('')
	const [maxPrice, setMaxPrice] = useState<string>('')

	// Delete in progress tracking
	const [deleteInProgress, setDeleteInProgress] = useState<
		Record<string, boolean>
	>({})

	// Function to get category name by ID
	const getCategoryName = (categoryId: number) => {
		const category = categories.find(cat => cat.id === categoryId)
		return category ? category.name : 'Unknown Category'
	}

	// Placeholder function for removing from favorites (used for all item types)
	const removeFromFavorites = async (
		id: string,
		type: 'configuration' | 'component' | 'order'
	) => {
		setDeleteInProgress(prev => ({ ...prev, [id]: true }))

		try {
			if (!user) {
				toast.error('Please login first')
				return
			}

			// Find the favorite ID based on the item type
			const getFavoritesRes = await fetch(`/api/favorites?adminId=${user.id}`)
			const favoritesData = await getFavoritesRes.json()

			let favoriteToDelete

			if (type === 'configuration') {
				favoriteToDelete = favoritesData.find(
					(fav: Favorite) => fav.configuration_id === id
				)
			} else if (type === 'component') {
				favoriteToDelete = favoritesData.find(
					(fav: Favorite) => fav.product_id === parseInt(id)
				)
			} else {
				favoriteToDelete = favoritesData.find(
					(fav: Favorite) => fav.order_id === parseInt(id)
				)
			}

			if (!favoriteToDelete) {
				console.error('Favorite record not found')
				toast.error('Favorite record not found')
				return
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
				console.error('Error response:', data.error)
				toast.error(data.error || 'Failed to remove from favorites')
				return
			}

			// Update local state based on item type
			if (type === 'configuration') {
				const newFavorites = { ...favoritedConfigIds }
				delete newFavorites[id]
				setFavoritedConfigIds(newFavorites)
				setConfigurations(prev => prev.filter(item => item.id !== id))
			} else if (type === 'component') {
				const newFavorites = { ...favoritedComponentIds }
				delete newFavorites[id]
				setFavoritedComponentIds(newFavorites)
				setComponents(prev => prev.filter(item => item.id !== Number(id)))
			} else {
				const newFavorites = { ...favoritedOrderIds }
				delete newFavorites[id]
				setFavoritedOrderIds(newFavorites)
				setOrders(prev => prev.filter(item => item.id !== Number(id)))
			}

			toast.success('Removed from favorites')
		} catch (error) {
			console.error('Error removing from favorites:', error)
			toast.error('Failed to remove from favorites')
		} finally {
			setDeleteInProgress(prev => ({ ...prev, [id]: false }))
		}
	}

	const fetchOrdersData = async (favorites: Favorite[]) => {
		try {
			const response = await fetch('/api/orders')

			if (!response.ok) {
				throw new Error(`Error fetching orders: ${response.status}`)
			}

			const allOrders = await response.json()

			// Extract order IDs from favorites
			const favoritedOrderIds = favorites
				.filter(fav => fav.order_id)
				.map(fav => fav.order_id)

			// Filter orders that are in favorites
			const favoritedOrders = allOrders.filter((order: Order) =>
				favoritedOrderIds.includes(order.id)
			)

			return favoritedOrders
		} catch (error) {
			console.error('Error fetching orders data:', error)
			return []
		}
	}

	// Function to fetch components data
	const fetchComponentsData = async () => {
		try {
			const response = await fetch('/api/products')

			if (!response.ok) {
				throw new Error(`Error fetching components: ${response.status}`)
			}

			const data = await response.json()

			// Also store categories for later use
			if (data.categories) {
				setCategories(data.categories)
			}

			return data.components || []
		} catch (error) {
			console.error('Error fetching components data:', error)
			return []
		}
	}

	useEffect(() => {
		const fetchData = async () => {
			setIsLoading(true)
			setError(null)

			try {
				if (!user) {
					setIsLoading(false)
					return
				}

				// Fetch favorites data first
				const favoritesRes = await fetch(`/api/favorites?adminId=${user.id}`)
				if (!favoritesRes.ok) {
					throw new Error(`Error fetching favorites: ${favoritesRes.status}`)
				}

				const favoritesData = await favoritesRes.json()

				// Create maps for favorited items
				const configFavs: Record<string, boolean> = {}
				const componentFavs: Record<string, boolean> = {}
				const orderFavs: Record<string, boolean> = {}

				favoritesData.forEach((favorite: Favorite) => {
					if (favorite.configuration_id) {
						configFavs[favorite.configuration_id] = true
					} else if (favorite.product_id) {
						componentFavs[favorite.product_id.toString()] = true
					} else if (favorite.order_id) {
						orderFavs[favorite.order_id.toString()] = true
					}
				})

				setFavoritedConfigIds(configFavs)
				setFavoritedComponentIds(componentFavs)
				setFavoritedOrderIds(orderFavs)

				// Fetch all components and categories in one request
				const allComponents = await fetchComponentsData()

				// Filter only favorited components
				const favoritedComponentsList = allComponents.filter(
					(comp: Component) => componentFavs[comp.id.toString()]
				)
				setComponents(favoritedComponentsList)

				// Fetch configurations that are in favorites
				const configIds = Object.keys(configFavs)
				if (configIds.length > 0) {
					const configsRes = await fetch('/api/configurations')
					const allConfigs = await configsRes.json()

					// Filter only favorited configurations
					const favoritedConfigs = allConfigs.filter(
						(config: Configuration) => configFavs[config.id]
					)

					setConfigurations(favoritedConfigs)
				} else if (configIds.length === 0) {
					// If no favorite configurations, add some examples (optional)
					const configsRes = await fetch('/api/configurations')
					const allConfigs = await configsRes.json()

					if (allConfigs && allConfigs.length > 0) {
						setConfigurations(allConfigs.slice(0, 2))
					}
				}

				// Fetch orders data
				const favoritedOrders = await fetchOrdersData(favoritesData)
				setOrders(favoritedOrders)
			} catch (error) {
				console.error('Error fetching favorites data:', error)
				setError('Failed to load favorite items')
			} finally {
				setIsLoading(false)
			}
		}

		fetchData()
	}, [user])

	const resetFilters = () => {
		setSearchQuery('')
		setMinPrice('')
		setMaxPrice('')
		setSortBy('date')
		setSortOrder('desc')
	}

	const toggleSort = (field: 'name' | 'price' | 'date') => {
		if (sortBy === field) {
			setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
		} else {
			setSortBy(field)
			setSortOrder('asc')
		}
	}

	// Format currency
	const formatPrice = (price: number) => {
		return new Intl.NumberFormat('ru-RU', {
			style: 'currency',
			currency: 'RUB',
			maximumFractionDigits: 0,
		}).format(price)
	}

	// Filter and sort configurations
	const filteredConfigurations = useMemo(() => {
		let filtered = configurations.filter(config => {
			const matchesSearch = config.name
				.toLowerCase()
				.includes(searchQuery.toLowerCase())
			const matchesMinPrice = !minPrice || config.price >= Number(minPrice)
			const matchesMaxPrice = !maxPrice || config.price <= Number(maxPrice)

			return matchesSearch && matchesMinPrice && matchesMaxPrice
		})

		return filtered.sort((a, b) => {
			if (sortBy === 'name') {
				return sortOrder === 'asc'
					? a.name.localeCompare(b.name)
					: b.name.localeCompare(a.name)
			} else if (sortBy === 'price') {
				return sortOrder === 'asc' ? a.price - b.price : b.price - a.price
			} else {
				// date
				return sortOrder === 'asc'
					? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
					: new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			}
		})
	}, [configurations, searchQuery, minPrice, maxPrice, sortBy, sortOrder])

	// Filter and sort components
	const filteredComponents = useMemo(() => {
		let filtered = components.filter(component => {
			const matchesSearch = component.name
				.toLowerCase()
				.includes(searchQuery.toLowerCase())
			const matchesMinPrice = !minPrice || component.price >= Number(minPrice)
			const matchesMaxPrice = !maxPrice || component.price <= Number(maxPrice)

			return matchesSearch && matchesMinPrice && matchesMaxPrice
		})

		return filtered.sort((a, b) => {
			if (sortBy === 'name') {
				return sortOrder === 'asc'
					? a.name.localeCompare(b.name)
					: b.name.localeCompare(a.name)
			} else if (sortBy === 'price') {
				return sortOrder === 'asc' ? a.price - b.price : b.price - a.price
			} else {
				// date
				return sortOrder === 'asc'
					? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
					: new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
			}
		})
	}, [components, searchQuery, minPrice, maxPrice, sortBy, sortOrder])

	// Filter and sort orders
	const filteredOrders = useMemo(() => {
		let filtered = orders.filter(order => {
			const matchesSearch =
				order.generated_order_number
					.toLowerCase()
					.includes(searchQuery.toLowerCase()) ||
				(order.customer_name ?? '')
					.toLowerCase()
					.includes(searchQuery.toLowerCase())
			const matchesMinPrice =
				!minPrice || (order.total_amount ?? 0) >= Number(minPrice)
			const matchesMaxPrice =
				!maxPrice || (order.total_amount ?? 0) <= Number(maxPrice)

			return matchesSearch && matchesMinPrice && matchesMaxPrice
		})

		return filtered.sort((a, b) => {
			if (sortBy === 'name') {
				return sortOrder === 'asc'
					? a.generated_order_number.localeCompare(b.generated_order_number)
					: b.generated_order_number.localeCompare(a.generated_order_number)
			} else if (sortBy === 'price') {
				return sortOrder === 'asc'
					? (a.total_amount ?? 0) - (b.total_amount ?? 0)
					: (b.total_amount ?? 0) - (a.total_amount ?? 0)
			} else {
				// date
				return sortOrder === 'asc'
					? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
					: new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
			}
		})
	}, [orders, searchQuery, minPrice, maxPrice, sortBy, sortOrder])

	// Get filtered items based on active tab
	const getFilteredItems = () => {
		switch (activeTab) {
			case 'configurations':
				return filteredConfigurations
			case 'components':
				return filteredComponents
			case 'orders':
				return filteredOrders
			default:
				return []
		}
	}

	// Get total count based on active tab
	const getTotalCount = () => {
		switch (activeTab) {
			case 'configurations':
				return configurations.length
			case 'components':
				return components.length
			case 'orders':
				return orders.length
			default:
				return 0
		}
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

	if (error) {
		return (
			<div className='flex items-center justify-center min-h-screen bg-gray-900'>
				<div className='bg-gray-800 p-8 rounded-xl shadow-lg max-w-md w-full'>
					<div className='flex flex-col items-center text-center'>
						<AlertCircle className='h-16 w-16 text-red-500 mb-4' />
						<h2 className='text-2xl font-bold text-white mb-2'>
							Error Loading Favorites
						</h2>
						<p className='text-gray-400 mb-6'>{error}</p>
						<button
							onClick={() => window.location.reload()}
							className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
						>
							Try Again
						</button>
					</div>
				</div>
			</div>
		)
	}

	if (!user) {
		return (
			<div className='flex items-center justify-center min-h-screen bg-gray-900'>
				<div className='bg-gray-800 p-8 rounded-xl shadow-lg max-w-md w-full'>
					<div className='flex flex-col items-center text-center'>
						<AlertCircle className='h-16 w-16 text-amber-500 mb-4' />
						<h2 className='text-2xl font-bold text-white mb-2'>
							Authentication Required
						</h2>
						<p className='text-gray-400 mb-6'>
							Please log in to view your favorites
						</p>
						<Link href='/login'>
							<button className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'>
								Log In
							</button>
						</Link>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className='min-h-screen bg-gray-900 text-white'>
			<Sidebar />
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

			<div className='container mx-auto p-6 max-w-6xl'>
				<div className='mb-8'>
					<div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6'>
						<div className='flex items-center'>
							<Star className='w-8 h-8 text-yellow-400 mr-3' />
							<h1 className='text-3xl font-bold text-white'>My Favorites</h1>
						</div>

						<div className='flex items-center gap-2'>
							<button
								onClick={() => setShowFilters(!showFilters)}
								className='flex items-center px-4 py-2 bg-gray-800 border border-gray-700 text-gray-200 rounded-lg hover:bg-gray-700 transition-colors'
							>
								<Filter className='w-5 h-5 mr-2' />
								Filters
								{showFilters ? (
									<ChevronUp className='ml-2 w-4 h-4' />
								) : (
									<ChevronDown className='ml-2 w-4 h-4' />
								)}
							</button>
						</div>
					</div>

					{/* Tabs Navigation */}
					<div className='flex border-b border-gray-700 mb-6'>
						<button
							onClick={() => setActiveTab('configurations')}
							className={`flex items-center px-6 py-3 font-medium transition-colors ${
								activeTab === 'configurations'
									? 'text-blue-400 border-b-2 border-blue-400'
									: 'text-gray-400 hover:text-gray-300'
							}`}
						>
							<PcCase className='w-5 h-5 mr-2' />
							Configurations
							{configurations.length > 0 && (
								<span className='ml-2 bg-blue-900 text-blue-200 text-xs rounded-full px-2 py-0.5'>
									{configurations.length}
								</span>
							)}
						</button>

						<button
							onClick={() => setActiveTab('components')}
							className={`flex items-center px-6 py-3 font-medium transition-colors ${
								activeTab === 'components'
									? 'text-blue-400 border-b-2 border-blue-400'
									: 'text-gray-400 hover:text-gray-300'
							}`}
						>
							<Cpu className='w-5 h-5 mr-2' />
							Components
							{components.length > 0 && (
								<span className='ml-2 bg-blue-900 text-blue-200 text-xs rounded-full px-2 py-0.5'>
									{components.length}
								</span>
							)}
						</button>

						<button
							onClick={() => setActiveTab('orders')}
							className={`flex items-center px-6 py-3 font-medium transition-colors ${
								activeTab === 'orders'
									? 'text-blue-400 border-b-2 border-blue-400'
									: 'text-gray-400 hover:text-gray-300'
							}`}
						>
							<ShoppingCart className='w-5 h-5 mr-2' />
							Orders
							{orders.length > 0 && (
								<span className='ml-2 bg-blue-900 text-blue-200 text-xs rounded-full px-2 py-0.5'>
									{orders.length}
								</span>
							)}
						</button>
					</div>

					{/* Filter Panel */}
					{showFilters && (
						<div className='bg-gray-800 p-4 rounded-xl border border-gray-700 mb-6 animate-fadeIn'>
							<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
								<div className='relative'>
									<Search
										className='absolute left-3 top-3 text-gray-400'
										size={18}
									/>
									<input
										type='text'
										placeholder={`Search ${activeTab}...`}
										value={searchQuery}
										onChange={e => setSearchQuery(e.target.value)}
										className='pl-10 p-2 bg-gray-700 border border-gray-600 text-white rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none'
									/>
								</div>

								<div className='flex gap-2'>
									<input
										type='number'
										placeholder='Min price'
										value={minPrice}
										onChange={e => setMinPrice(e.target.value)}
										className='p-2 bg-gray-700 border border-gray-600 text-white rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none'
									/>
									<input
										type='number'
										placeholder='Max price'
										value={maxPrice}
										onChange={e => setMaxPrice(e.target.value)}
										className='p-2 bg-gray-700 border border-gray-600 text-white rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none'
									/>
								</div>

								<div className='flex items-center'>
									<button
										onClick={resetFilters}
										className='ml-auto flex items-center text-gray-400 hover:text-gray-200'
									>
										<X className='w-4 h-4 mr-1' />
										Reset Filters
									</button>
								</div>
							</div>
						</div>
					)}

					{/* Sort Controls */}
					<div className='flex justify-between items-center mb-6'>
						<div className='text-gray-400'>
							Showing {getFilteredItems().length} of {getTotalCount()} favorited{' '}
							{activeTab}
						</div>

						<div className='flex items-center gap-4'>
							<span className='text-gray-400'>Sort by:</span>
							<button
								onClick={() => toggleSort('name')}
								className={`flex items-center ${
									sortBy === 'name'
										? 'text-blue-400 font-medium'
										: 'text-gray-400'
								}`}
							>
								<span>{activeTab === 'orders' ? 'Order #' : 'Name'}</span>
								{sortBy === 'name' &&
									(sortOrder === 'asc' ? (
										<ChevronUp size={16} className='ml-1' />
									) : (
										<ChevronDown size={16} className='ml-1' />
									))}
							</button>

							<button
								onClick={() => toggleSort('price')}
								className={`flex items-center ${
									sortBy === 'price'
										? 'text-blue-400 font-medium'
										: 'text-gray-400'
								}`}
							>
								<span>{activeTab === 'orders' ? 'Amount' : 'Price'}</span>
								{sortBy === 'price' &&
									(sortOrder === 'asc' ? (
										<ChevronUp size={16} className='ml-1' />
									) : (
										<ChevronDown size={16} className='ml-1' />
									))}
							</button>

							<button
								onClick={() => toggleSort('date')}
								className={`flex items-center ${
									sortBy === 'date'
										? 'text-blue-400 font-medium'
										: 'text-gray-400'
								}`}
							>
								<span>Date</span>
								{sortBy === 'date' &&
									(sortOrder === 'asc' ? (
										<ChevronUp size={16} className='ml-1' />
									) : (
										<ChevronDown size={16} className='ml-1' />
									))}
							</button>
						</div>
					</div>
				</div>

				{/* Content based on active tab */}
				<div className='grid gap-4'>
					{/* Empty State */}
					{getFilteredItems().length === 0 && (
						<div className='bg-gray-800 rounded-xl border border-gray-700 p-8 text-center'>
							<div className='flex flex-col items-center'>
								<StarOff className='h-12 w-12 text-gray-500 mb-4' />
								<h3 className='text-xl font-semibold text-white mb-2'>
									No favorited {activeTab} found
								</h3>
								<p className='text-gray-400 mb-6'>
									{searchQuery || minPrice || maxPrice
										? 'Try adjusting your search filters'
										: `You haven't added any ${activeTab} to your favorites yet`}
								</p>
								{searchQuery || minPrice || maxPrice ? (
									<button
										onClick={resetFilters}
										className='px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors'
									>
										Reset Filters
									</button>
								) : (
									<Link
										href={
											activeTab === 'configurations'
												? '/admin/configurations'
												: activeTab === 'components'
												? '/admin/products'
												: '/admin/orders'
										}
										className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center'
									>
										<span>Browse {activeTab}</span>
										<ChevronRight className='ml-1 w-5 h-5' />
									</Link>
								)}
							</div>
						</div>
					)}

					{/* Configuration Items */}
					{activeTab === 'configurations' &&
						filteredConfigurations.length > 0 &&
						filteredConfigurations.map((config, index) => (
							<div
								key={`config-${config.id}-${index}`}
								className='bg-gray-800 p-5 border border-gray-700 rounded-xl hover:shadow-lg transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'
							>
								<div className='flex flex-1 min-w-0'>
									<div className='mr-3 text-yellow-400'>
										<Star className='w-5 h-5 fill-yellow-400' />
									</div>

									<div className='min-w-0'>
										<h2 className='text-xl font-semibold text-white truncate'>
											{config.name}
										</h2>
										<div className='flex items-center mt-1 text-gray-400 text-sm'>
											<Clock className='w-4 h-4 mr-1' />
											<span>
												Created:{' '}
												{new Date(config.createdAt).toLocaleDateString()}
											</span>
											<DollarSign className='w-4 h-4 ml-4 mr-1' />
											<span className='font-medium text-gray-300'>
												{formatPrice(config.price)}
											</span>
										</div>
										{config.description && (
											<p className='text-gray-400 mt-2 line-clamp-2'>
												{config.description}
											</p>
										)}
										{config.components && (
											<div className='mt-2 flex flex-wrap gap-1'>
												{config.components.map((component, index) => (
													<span
														key={index}
														className='bg-blue-900 text-blue-200 text-xs px-2 py-1 rounded'
													>
														{component}
													</span>
												))}
											</div>
										)}
									</div>
								</div>

								<div className='flex items-center gap-2 self-end sm:self-center'>
									<Link href={`/config/${config.id}`}>
										<button className='flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'>
											<Eye className='w-4 h-4 mr-2' /> View
										</button>
									</Link>

									<button
										onClick={() =>
											removeFromFavorites(config.id, 'configuration')
										}
										disabled={deleteInProgress[config.id]}
										className={`flex items-center px-4 py-2 rounded-md transition-colors
                      ${
												deleteInProgress[config.id]
													? 'bg-gray-700 text-gray-500 cursor-not-allowed'
													: 'bg-gray-700 text-gray-200 hover:bg-gray-600'
											}`}
									>
										{deleteInProgress[config.id] ? (
											<>
												<RefreshCw className='w-4 h-4 mr-2 animate-spin' />{' '}
												Wait...
											</>
										) : (
											<>
												<Trash2 className='w-4 h-4 mr-2' /> Remove
											</>
										)}
									</button>
								</div>
							</div>
						))}

					{/* Component Items */}
					{activeTab === 'components' &&
						filteredComponents.length > 0 &&
						filteredComponents.map((component, index) => (
							<div
								key={`component-${component.id}-${index}`}
								className='bg-gray-800 p-5 border border-gray-700 rounded-xl hover:shadow-lg transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'
							>
								<div className='flex flex-1 min-w-0'>
									<div className='mr-3 text-yellow-400'>
										<Star className='w-5 h-5 fill-yellow-400' />
									</div>

									<div className='min-w-0'>
										<h2 className='text-xl font-semibold text-white truncate'>
											{component.name}
										</h2>
										<div className='flex items-center mt-1 text-gray-400 text-sm'>
											<span className='bg-blue-900 text-blue-200 text-xs px-2 py-1 rounded mr-3'>
												{getCategoryName(component.category_id)}
											</span>
											<Clock className='w-4 h-4 mr-1' />
											<span>
												Added:{' '}
												{new Date(component.created_at).toLocaleDateString()}
											</span>
											<DollarSign className='w-4 h-4 ml-4 mr-1' />
											<span className='font-medium text-gray-300'>
												{formatPrice(component.price)}
											</span>
										</div>

										<p className='text-gray-400 mt-2'>
											Brand: {component.brand}
										</p>
									</div>
								</div>

								<div className='flex items-center gap-2 self-end sm:self-center'>
									<Link href={`/product/${component.id}`}>
										<button className='flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'>
											<Eye className='w-4 h-4 mr-2' /> View
										</button>
									</Link>

									<button
										onClick={() =>
											removeFromFavorites(component.id.toString(), 'component')
										}
										disabled={deleteInProgress[component.id]}
										className={`flex items-center px-4 py-2 rounded-md transition-colors
                      ${
												deleteInProgress[component.id]
													? 'bg-gray-700 text-gray-500 cursor-not-allowed'
													: 'bg-gray-700 text-gray-200 hover:bg-gray-600'
											}`}
									>
										{deleteInProgress[component.id] ? (
											<>
												<RefreshCw className='w-4 h-4 mr-2 animate-spin' />{' '}
												Wait...
											</>
										) : (
											<>
												<Trash2 className='w-4 h-4 mr-2' /> Remove
											</>
										)}
									</button>
								</div>
							</div>
						))}

					{/* Order Items */}
					{activeTab === 'orders' &&
						filteredOrders.length > 0 &&
						filteredOrders.map((order, index) => (
							<div
								key={`order-${order.id}-${index}`}
								className='bg-gray-800 p-5 border border-gray-700 rounded-xl hover:shadow-lg transition-all flex flex-col gap-4'
							>
								<div className='flex flex-col sm:flex-row items-start sm:items-center justify-between'>
									<div className='flex flex-1 min-w-0'>
										<div className='mr-3 text-yellow-400'>
											<Star className='w-5 h-5 fill-yellow-400' />
										</div>

										<div className='min-w-0'>
											<div className='flex flex-wrap items-center gap-2'>
												<h2 className='text-xl font-semibold text-white'>
													{order.generated_order_number}
												</h2>
												<span
													className={`text-xs px-2.5 py-1 rounded-full ${
														order.status === 'Completed'
															? 'bg-green-900 text-green-200'
															: order.status === 'Processing'
															? 'bg-blue-900 text-blue-200'
															: 'bg-yellow-900 text-yellow-200'
													}`}
												>
													{order.status}
												</span>
											</div>

											<div className='flex items-center mt-1 text-gray-400 text-sm'>
												<Clock className='w-4 h-4 mr-1' />
												<span>
													{new Date(order.created_at).toLocaleDateString()}
												</span>
												<DollarSign className='w-4 h-4 ml-4 mr-1' />
												<span className='font-medium text-gray-300'>
													{order.total_amount
														? formatPrice(order.total_amount)
														: 'N/A'}
												</span>
											</div>

											<p className='text-gray-300 mt-1'>
												Customer:{' '}
												<span className='font-medium'>
													{order.customer_name || 'N/A'}
												</span>
											</p>
										</div>
									</div>

									<div className='flex items-center gap-2 self-end sm:self-center mt-4 sm:mt-0'>
										<Link href={`/order/${order.id}`}>
											<button className='flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'>
												<Eye className='w-4 h-4 mr-2' /> View
											</button>
										</Link>

										<button
											onClick={() =>
												removeFromFavorites(order.id.toString(), 'order')
											}
											disabled={deleteInProgress[order.id]}
											className={`flex items-center px-4 py-2 rounded-md transition-colors
                        ${
													deleteInProgress[order.id]
														? 'bg-gray-700 text-gray-500 cursor-not-allowed'
														: 'bg-gray-700 text-gray-200 hover:bg-gray-600'
												}`}
										>
											{deleteInProgress[order.id] ? (
												<>
													<RefreshCw className='w-4 h-4 mr-2 animate-spin' />{' '}
													Wait...
												</>
											) : (
												<>
													<Trash2 className='w-4 h-4 mr-2' /> Remove
												</>
											)}
										</button>
									</div>
								</div>

								{/* Order items */}
								{order.items && order.items.length > 0 && (
									<div className='mt-2 border-t border-gray-700 pt-3'>
										<h3 className='text-sm font-medium text-gray-400 mb-2'>
											Order Items
										</h3>
										<div className='space-y-2'>
											{order.items.map((item, itemIndex) => (
												<div
													key={itemIndex}
													className='flex justify-between text-sm'
												>
													<div className='flex items-center'>
														<span className='text-gray-300'>{item.name}</span>
														<span className='text-gray-500 mx-2'>×</span>
														<span className='text-gray-400'>
															{item.quantity}
														</span>
													</div>
													<span className='text-gray-300'>
														{formatPrice(item.price * item.quantity)}
													</span>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						))}
				</div>
			</div>
		</div>
	)
}
