'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
	Trash2,
	Eye,
	Plus,
	Filter,
	Search,
	AlertCircle,
	RefreshCw,
	ChevronDown,
	ChevronUp,
	X,
	Clock,
	DollarSign,
	Star,
	StarOff,
	Edit,
} from 'lucide-react'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Sidebar from '../_components/Sidebar'
import { useAuth } from '@/context/AuthContext'

interface Configuration {
	id: string
	name: string
	price: number
	createdAt: string
	description?: string
	isFavorite?: boolean
	components?: string[]
	custom_id?: string
}

export interface Favorite {
	id: number
	admin_id: string
	configuration_id?: string | null
	product_id?: number | null
	order_id?: number | null
	created_at: string
}

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
			return true // Return true if deletion was successful
		} else {
			console.error('Error deleting configuration:', data.error)
			return false
		}
	} catch (error) {
		console.error('Error sending deletion request:', error)
		return false
	}
}

export default function ConfigurationsPage() {
	const { user, loading } = useAuth()
	const [configurations, setConfigurations] = useState<Configuration[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [searchQuery, setSearchQuery] = useState('')
	const [showFilters, setShowFilters] = useState(false)
	const [minPrice, setMinPrice] = useState<string>('')
	const [maxPrice, setMaxPrice] = useState<string>('')
	const [sortBy, setSortBy] = useState<'name' | 'price' | 'date'>('date')
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
	const [favorites, setFavorites] = useState<Record<string, boolean>>({})
	const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
	const [deleteInProgress, setDeleteInProgress] = useState<
		Record<string, boolean>
	>({})

	useEffect(() => {
		const fetchConfigurations = async () => {
			setIsLoading(true)
			setError(null)

			try {
				const res = await fetch('/api/configurations')
				if (!res.ok) {
					throw new Error(`Error fetching configurations: ${res.status}`)
				}

				const data = await res.json()
				setConfigurations(data)

				// Initialize favorites from localStorage if available
				const savedFavorites = localStorage.getItem('configFavorites')
				if (savedFavorites) {
					setFavorites(JSON.parse(savedFavorites))
				}
			} catch (error) {
				setError('Failed to load configurations')
				console.error('Error fetching configurations:', error)
			} finally {
				setIsLoading(false)
			}
		}

		fetchConfigurations()
	}, [])

	

	const updateFavoriteStatus = async (id: string, isFavorite: boolean) => {
		if (loading || !user) {
			toast.error('Please login first')
			return false
		}

		try {
			if (!isFavorite) {
				// Добавляем в избранное
				const res = await fetch('/api/favorites', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						admin_id: user.id,
						configuration_id: id,
						product_id: null,
						order_id: null,
					}),
				})

				const data = await res.json()

				if (!res.ok) {
					console.error('Error response:', data.error)
					toast.error(data.error || 'Failed to add to favorites')
					return false
				}
			} else {
				// Находим ID записи в избранном для удаления
				const getFavoritesRes = await fetch(`/api/favorites?adminId=${user.id}`)
				const favoritesData = await getFavoritesRes.json()

				const favoriteToDelete = favoritesData.find(
					(fav: Favorite) => fav.configuration_id === id
				)

				if (!favoriteToDelete) {
					console.error('Favorite record not found')
					return false
				}

				// Удаляем из избранного
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
					return false
				}
			}

			// Обновляем локальное состояние
			setFavorites(prevFavorites => ({
				...prevFavorites,
				[id]: !prevFavorites[id],
			}))

			// Сохраняем в localStorage
			const updatedFavorites = {
				...favorites,
				[id]: !favorites[id],
			}
			localStorage.setItem('configFavorites', JSON.stringify(updatedFavorites))

			return true
		} catch (error) {
			console.error('Error:', error)
			toast.error('Failed to update favorite status')
			return false
		}
	}

	useEffect(() => {
		const fetchFavorites = async () => {
			if (!user) return

			try {
				const res = await fetch(`/api/favorites?adminId=${user.id}`)
				if (!res.ok) throw new Error('Failed to fetch favorites')

				const data = await res.json()

				// Создаем мапу избранных конфигураций
				const favoritesMap = data.reduce(
					(acc: Record<string, boolean>, fav: Favorite) => {
						if (fav.configuration_id) {
							acc[fav.configuration_id] = true
						}
						return acc
					},
					{}
				)

				setFavorites(favoritesMap)
			} catch (error) {
				console.error('Error fetching favorites:', error)
			}
		}

		fetchFavorites()
	}, [user])




	const toggleFavorite = async (id: string) => {
		const currentStatus = favorites[id]
		const success = await updateFavoriteStatus(id, currentStatus)

		if (!success) {
			toast.error('Failed to update favorite status')
		}
	}



	

	// Save favorites to localStorage when they change
	useEffect(() => {
		localStorage.setItem('configFavorites', JSON.stringify(favorites))
	}, [favorites])

	const handleDeleteConfiguration = async (id: string) => {
		setDeleteInProgress(prev => ({ ...prev, [id]: true }))

		try {
			const success = await deleteConfiguration(id)

			if (success) {
				setConfigurations(configurations.filter(config => config.id !== id))
				// Remove from favorites if it was favorited
				if (favorites[id]) {
					const newFavorites = { ...favorites }
					delete newFavorites[id]
					setFavorites(newFavorites)
				}
				toast.success('Configuration deleted successfully')
			} else {
				toast.error('Failed to delete configuration')
			}
		} catch (error) {
			toast.error('An error occurred')
		} finally {
			setDeleteInProgress(prev => ({ ...prev, [id]: false }))
		}
	}

	// Removed duplicate toggleFavorite function

	const toggleSort = (field: 'name' | 'price' | 'date') => {
		if (sortBy === field) {
			setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
		} else {
			setSortBy(field)
			setSortOrder('asc')
		}
	}

	const resetFilters = () => {
		setSearchQuery('')
		setMinPrice('')
		setMaxPrice('')
		setShowFavoritesOnly(false)
		setSortBy('date')
		setSortOrder('desc')
	}

	const filteredAndSortedConfigurations = useMemo(() => {
		let filtered = configurations.filter(config => {
			const matchesSearch = config.name
				.toLowerCase()
				.includes(searchQuery.toLowerCase())
			const matchesMinPrice = !minPrice || config.price >= Number(minPrice)
			const matchesMaxPrice = !maxPrice || config.price <= Number(maxPrice)
			const matchesFavorites = !showFavoritesOnly || favorites[config.id]

			return (
				matchesSearch && matchesMinPrice && matchesMaxPrice && matchesFavorites
			)
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
	}, [
		configurations,
		searchQuery,
		minPrice,
		maxPrice,
		sortBy,
		sortOrder,
		favorites,
		showFavoritesOnly,
	])

	const formatPrice = (price: number) => {
		return new Intl.NumberFormat('ru-RU', {
			style: 'currency',
			currency: 'RUB',
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

	if (error) {
		return (
			<div className='flex items-center justify-center min-h-screen bg-gradient-to-b from-[#f8fafc] to-[#e2e8f0]'>
				<div className='bg-white p-8 rounded-xl shadow-lg max-w-md w-full'>
					<div className='flex flex-col items-center text-center'>
						<AlertCircle className='h-16 w-16 text-red-500 mb-4' />
						<h2 className='text-2xl font-bold text-gray-800 mb-2'>
							Error Loading Configurations
						</h2>
						<p className='text-gray-600 mb-6'>{error}</p>
						<button
							onClick={() => window.location.reload()}
							className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
						>
							Try Again
						</button>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className='min-h-screen bg-[#14181B] text-gray-800'>
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
				theme='light'
			/>

			<div className='container mx-auto p-6 max-w-6xl'>
				<div className='mb-8'>
					<div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6'>
						<h1 className='text-3xl font-bold text-white'>Configurations</h1>

						<div className='flex items-center gap-2'>
							<Link
								href='/admin/add-config'
								className='flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
							>
								<Plus className='w-5 h-5 mr-2' />
								Create New
							</Link>

							<button
								onClick={() => setShowFilters(!showFilters)}
								className='flex items-center px-4 py-2 bg-[#202529] border border-gray-300 text-white rounded-lg hover:bg-gray-600 transition-colors'
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

					{showFilters && (
						<div className='bg-[#202529] p-4 rounded-xl shadow-md mb-6 animate-fadeIn'>
							<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
								<div className='relative'>
									<Search
										className='absolute left-3 top-3 text-white'
										size={18}
									/>
									<input
										type='text'
										placeholder='Search configurations...'
										value={searchQuery}
										onChange={e => setSearchQuery(e.target.value)}
										className='pl-10 p-2 border border-gray-300 text-white rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none'
									/>
								</div>

								<div className='flex gap-2'>
									<input
										type='number'
										placeholder='Min price'
										value={minPrice}
										onChange={e => setMinPrice(e.target.value)}
										className='p-2 border border-gray-300 text-white rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none'
									/>
									<input
										type='number'
										placeholder='Max price'
										value={maxPrice}
										onChange={e => setMaxPrice(e.target.value)}
										className='p-2 border border-gray-300 text-white rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none'
									/>
								</div>

								<div className='flex items-center'>
									<label className='flex items-center cursor-pointer'>
										<input
											type='checkbox'
											checked={showFavoritesOnly}
											onChange={() => setShowFavoritesOnly(!showFavoritesOnly)}
											className='sr-only'
										/>
										<div
											className={`w-10 h-6 ${
												showFavoritesOnly ? 'bg-blue-600' : 'bg-gray-200'
											} rounded-full p-1 transition-colors duration-200 ease-in-out`}
										>
											<div
												className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ease-in-out ${
													showFavoritesOnly ? 'translate-x-4' : 'translate-x-0'
												}`}
											></div>
										</div>
										<span className='ml-3 text-white'>Show favorites only</span>
									</label>

									<button
										onClick={resetFilters}
										className='ml-auto flex items-center text-white hover:text-gray-700'
									>
										<X className='w-4 h-4 mr-1' />
										Reset
									</button>
								</div>
							</div>
						</div>
					)}

					<div className='flex justify-between items-center mb-4'>
						<div className='text-white'>
							Showing {filteredAndSortedConfigurations.length} of{' '}
							{configurations.length} configurations
						</div>

						<div className='flex items-center gap-4 '>
							<span className='text-white'>Sort by:</span>
							<button
								onClick={() => toggleSort('name')}
								className={`flex items-center ${
									sortBy === 'name' ? 'text-blue-600 font-medium' : 'text-white'
								}`}
							>
								<span>Name</span>
								{sortBy === 'name' &&
									(sortOrder === 'asc' ? (
										<ChevronUp size={16} className='ml-1' />
									) : (
										<ChevronDown size={16} className='ml-1' />
									))}
							</button>

							<button
								onClick={() => toggleSort('price')}
								className={`flex items-center  ${
									sortBy === 'price'
										? 'text-blue-600 font-medium'
										: 'text-white'
								}`}
							>
								<span>Price</span>
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
									sortBy === 'date' ? 'text-blue-600 font-medium' : 'text-white'
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

				<div className='grid gap-4'>
					{filteredAndSortedConfigurations.length === 0 ? (
						<div className='bg-[#202529] rounded-xl shadow-lg p-8 text-center'>
							<div className='flex flex-col items-center'>
								<AlertCircle className='h-12 w-12 text-white mb-4' />
								<h3 className='text-xl font-semibold text-white mb-2'>
									No configurations found
								</h3>
								<p className='text-white'>
									Try adjusting your search or create a new configuration
								</p>
							</div>
						</div>
					) : (
						filteredAndSortedConfigurations.map(config => (
							<div
								key={config.id}
								className='bg-white p-5 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'
							>
								<div className='flex flex-1 min-w-0'>
									<button
										onClick={() => toggleFavorite(config.id)}
										className='mr-3 text-gray-400 hover:text-yellow-500 focus:outline-none transition-colors'
									>
										{favorites[config.id] ? (
											<Star className='w-5 h-5 fill-yellow-400 text-yellow-400' />
										) : (
											<StarOff className='w-5 h-5' />
										)}
									</button>

									<div className='min-w-0'>
										<h2 className='text-xl font-semibold text-gray-800 truncate'>
											{config.name}
										</h2>
										<div className='flex items-center mt-1 text-gray-600 text-sm'>
											<Clock className='w-4 h-4 mr-1' />
											<span>
												Created:{' '}
												{new Date(config.createdAt).toLocaleDateString()}
											</span>
											<DollarSign className='w-4 h-4 ml-4 mr-1' />
											<span className='font-medium text-gray-800'>
												{formatPrice(config.price)}
											</span>
										</div>
										{config.custom_id && (
											<div className='mt-1 text-sm text-gray-500'>
												<span className='bg-gray-100 px-2 py-0.5 rounded text-xs'>
													Custom URL: /config/{config.custom_id}
												</span>
											</div>
										)}
										{config.description && (
											<p className='text-gray-600 mt-2 line-clamp-2'>
												{config.description}
											</p>
										)}
										{config.components && (
											<div className='mt-2 flex flex-wrap gap-1'>
												{config.components.map((component, index) => (
													<span
														key={index}
														className='bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded'
													>
														{component}
													</span>
												))}
											</div>
										)}
									</div>
								</div>

								<div className='flex space-x-1'>
									<Link
										href={`/config/${config.id}`}
										className='p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700'
										title='View Configuration'
									>
										<Eye size={16} />
									</Link>
									<Link href={`/admin/edit-config/${config.id}`}>
										<button
											className='p-1.5 bg-amber-600 text-white rounded hover:bg-amber-700'
											title='Edit Configuration'
										>
											<Edit size={16} />
										</button>
									</Link>
									<button
										onClick={() => handleDeleteConfiguration(config.id)}
										disabled={deleteInProgress[config.id]}
										title='Delete Configuration'
										className={`p-1.5 bg-red-600 text-white rounded hover:bg-red-700
                      ${
												deleteInProgress[config.id]
													? 'bg-gray-300 text-gray-500 cursor-not-allowed'
													: 'bg-red-500 text-white hover:bg-red-600'
											}`}
									>
										{deleteInProgress[config.id] ? (
											<>
												<RefreshCw className='w-4 h-4 mr-2 animate-spin' />{' '}
												Wait...
											</>
										) : (
											<>
												<Trash2 className='w-4 h-4 mr-2' />
											</>
										)}
									</button>
								</div>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	)
}
