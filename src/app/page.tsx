'use client'

import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import {
	ChevronDown,
	Filter,
	Star,
	Cpu,
	Monitor,
	Gamepad2,
	Laptop,
	Server,
	ShoppingCart,
	Heart,
	X,
} from 'lucide-react'

interface Category {
	id: string
	name: string
	name_en?: string
	name_ru?: string
	name_am?: string
}

interface Product {
	id: string
	name: string
	brand: string
	price: number
	image_url: string
}

interface Configuration {
	id: number
	name: string
	description?: string
	price: number
	components: string[]
	image_url: string
	hidden: boolean
	rating?: number
	reviewCount?: number
}

const HomePage = () => {
	const [configurations, setConfigurations] = useState<Configuration[]>([])
	const [products, setProducts] = useState<Product[]>([])
	const [filteredConfigurations, setFilteredConfigurations] = useState<
		Configuration[]
	>([])
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
	const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000])
	const [categories, setCategories] = useState<Category[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [sortBy, setSortBy] = useState<'price' | 'rating' | 'name'>('name')
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
	const [showFilters, setShowFilters] = useState(true)
	const [favorites, setFavorites] = useState<number[]>([])
	const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({})

	const router = useRouter()
	const { t, language } = useLanguage()

	// Icons for categories
	const categoryIcons: Record<string, any> = {
		'Gaming PCs': Gamepad2,
		Workstations: Server,
		Laptops: Laptop,
		Monitors: Monitor,
		CPU: Cpu,
	}

	useEffect(() => {
		async function fetchData() {
			setIsLoading(true)
			try {
				// Fetch configurations
				const configRes = await fetch('/api/configurations')
				const configurationsData = await configRes.json()

				// Enhance configurations with fake ratings for demo
				const enhancedConfigs = configurationsData.map(
					(config: Configuration) => ({
						...config,
						rating: Math.floor(Math.random() * 2) + 3.5, // Random rating between 3.5-5
						reviewCount: Math.floor(Math.random() * 50) + 10, // Random reviews 10-60
					})
				)

				setConfigurations(enhancedConfigs)

				// Fetch products and categories
				const productRes = await fetch('/api/products')
				const productsData = await productRes.json()

				if (Array.isArray(productsData.components)) {
					setProducts(productsData.components as Product[])
				}

				if (Array.isArray(productsData.categories)) {
					setCategories(productsData.categories)
				}
			} catch (error) {
				console.error('Error loading data:', error)
			} finally {
				setIsLoading(false)
			}
		}

		fetchData()
	}, [])

	useEffect(() => {
		let filtered = configurations.filter(config => !config.hidden)

		// Category filter
		if (selectedCategory) {
			filtered = filtered.filter(config =>
				config.components?.some(component => component === selectedCategory)
			)
		}

		// Price filter
		filtered = filtered.filter(
			config => config.price >= priceRange[0] && config.price <= priceRange[1]
		)

		// Sorting
		filtered.sort((a, b) => {
			let comparison = 0
			switch (sortBy) {
				case 'price':
					comparison = a.price - b.price
					break
				case 'rating':
					comparison = (b.rating || 0) - (a.rating || 0)
					break
				case 'name':
					comparison = a.name.localeCompare(b.name)
					break
			}
			return sortOrder === 'asc' ? comparison : -comparison
		})

		setFilteredConfigurations(filtered)
	}, [configurations, selectedCategory, priceRange, sortBy, sortOrder])

	const getCategoryName = (category: Category) => {
		switch (language) {
			case 'ru':
				return category.name_ru || category.name
			case 'am':
				return category.name_am || category.name
			default:
				return category.name_en || category.name
		}
	}

	const toggleFavorite = (id: number) => {
		setFavorites(prev =>
			prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
		)
	}

	const renderStars = (rating: number = 0) => {
		return Array.from({ length: 5 }).map((_, index) => (
			<Star
				key={index}
				className={`h-4 w-4 ${
					index < Math.floor(rating)
						? 'text-yellow-400 fill-yellow-400'
						: 'text-gray-600'
				}`}
			/>
		))
	}

	const handleImageError = (configId: number) => {
		setImageErrors(prev => ({
			...prev,
			[configId]: true,
		}))
	}
	return (
		<div className='min-h-screen bg-[#222227]'>
			<Header />

			{/* Hero Section */}
			<div className='relative h-[400px] bg-gradient-to-r from-blue-600 to-purple-600 overflow-hidden'>
				<div className='absolute inset-0 bg-[#222227] bg-opacity-40' />
				<div className='relative h-full flex items-center justify-center text-center px-4'>
					<div>
						<h1 className='text-5xl font-bold text-white mb-4'>
							{t('home.title', { defaultValue: 'Build Your Dream PC' })}
						</h1>
						<p className='text-xl text-gray-200 mb-8 max-w-2xl mx-auto'>
							{t('home.subtitle', {
								defaultValue:
									'Choose from our pre-built configurations or customize your own gaming powerhouse',
							})}
						</p>
						<button
							onClick={() => setShowFilters(!showFilters)}
							className='bg-white text-gray-900 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2 mx-auto'
						>
							<Filter className='h-5 w-5' />
							{t('home.exploreConfigs', {
								defaultValue: 'Explore Configurations',
							})}
						</button>
					</div>
				</div>
			</div>

			<div className='max-w-7xl mx-auto px-4 py-8'>
				<div className='flex flex-col lg:flex-row gap-8'>
					{/* Filters Sidebar */}
					<aside
						className={`lg:w-1/4 ${showFilters ? 'block' : 'hidden lg:block'}`}
					>
						<div className='bg-[#202529] rounded-xl p-6 sticky top-24'>
							<div className='flex items-center justify-between mb-6'>
								<h2 className='text-xl font-semibold text-white flex items-center gap-2'>
									<Filter className='h-5 w-5' />
									{t('home.filters', { defaultValue: 'Filters' })}
								</h2>
								<button
									onClick={() => setShowFilters(false)}
									className='lg:hidden text-gray-400 hover:text-white'
								>
									<X className='h-5 w-5' />
								</button>
							</div>

							{/* Category Filter */}
							<div className='mb-6'>
								<h3 className='text-lg font-medium mb-3 text-white'>
									{t('home.category', { defaultValue: 'Category' })}
								</h3>
								<div className='space-y-2'>
									<button
										onClick={() => setSelectedCategory(null)}
										className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
											!selectedCategory
												? 'bg-blue-600 text-white'
												: 'bg-gray-700 text-gray-300 hover:bg-gray-600'
										}`}
									>
										{t('home.allCategories', {
											defaultValue: 'All Categories',
										})}
									</button>
									{categories.map(category => {
										const Icon = categoryIcons[category.name] || Cpu
										return (
											<button
												key={category.id}
												onClick={() => setSelectedCategory(category.name)}
												className={`w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
													selectedCategory === category.name
														? 'bg-blue-600 text-white'
														: 'bg-gray-700 text-gray-300 hover:bg-gray-600'
												}`}
											>
												<Icon className='h-4 w-4' />
												{getCategoryName(category)}
											</button>
										)
									})}
								</div>
							</div>

							{/* Price Range Filter */}
							<div className='mb-6'>
								<h3 className='text-lg font-medium mb-3 text-white'>
									{t('home.priceRange', { defaultValue: 'Price Range' })}
								</h3>
								<div className='space-y-4'>
									<div>
										<label className='text-sm text-gray-400'>
											{t('home.minPrice', { defaultValue: 'Min Price' })}: $
											{priceRange[0]}
										</label>
										<input
											type='range'
											min={0}
											max={5000}
											step={100}
											value={priceRange[0]}
											onChange={e =>
												setPriceRange([+e.target.value, priceRange[1]])
											}
											className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer'
										/>
									</div>
									<div>
										<label className='text-sm text-gray-400'>
											{t('home.maxPrice', { defaultValue: 'Max Price' })}: $
											{priceRange[1]}
										</label>
										<input
											type='range'
											min={0}
											max={5000}
											step={100}
											value={priceRange[1]}
											onChange={e =>
												setPriceRange([priceRange[0], +e.target.value])
											}
											className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer'
										/>
									</div>
								</div>
							</div>

							{/* Sort Options */}
							<div>
								<h3 className='text-lg font-medium mb-3 text-white'>
									{t('home.sortBy', { defaultValue: 'Sort By' })}
								</h3>
								<select
									value={`${sortBy}-${sortOrder}`}
									onChange={e => {
										const [newSortBy, newSortOrder] = e.target.value.split(
											'-'
										) as [typeof sortBy, typeof sortOrder]
										setSortBy(newSortBy)
										setSortOrder(newSortOrder)
									}}
									className='w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
								>
									<option value='name-asc'>
										{t('home.nameAZ', { defaultValue: 'Name (A-Z)' })}
									</option>
									<option value='name-desc'>
										{t('home.nameZA', { defaultValue: 'Name (Z-A)' })}
									</option>
									<option value='price-asc'>
										{t('home.priceLowHigh', {
											defaultValue: 'Price (Low to High)',
										})}
									</option>
									<option value='price-desc'>
										{t('home.priceHighLow', {
											defaultValue: 'Price (High to Low)',
										})}
									</option>
									<option value='rating-desc'>
										{t('home.ratingHighLow', {
											defaultValue: 'Rating (High to Low)',
										})}
									</option>
								</select>
							</div>
						</div>
					</aside>

					{/* Main Content */}
					<main className='lg:w-3/4'>
						{/* Results Header */}
						<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4'>
							<h2 className='text-2xl font-bold text-white'>
								{t('home.configurations', {
									defaultValue: 'PC Configurations',
								})}
								<span className='text-gray-400 text-lg ml-2'>
									({filteredConfigurations.length}{' '}
									{t('home.results', { defaultValue: 'results' })})
								</span>
							</h2>
							<button
								onClick={() => setShowFilters(!showFilters)}
								className='lg:hidden flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors'
							>
								<Filter className='h-4 w-4' />
								{showFilters
									? t('home.hideFilters', { defaultValue: 'Hide Filters' })
									: t('home.showFilters', { defaultValue: 'Show Filters' })}
							</button>
						</div>

						{/* Loading State */}
						{isLoading && (
							<div className='flex items-center justify-center h-64'>
								<div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500'></div>
							</div>
						)}

						{/* No Results */}
						{!isLoading && filteredConfigurations.length === 0 && (
							<div className='text-center py-12 bg-[#202529] rounded-xl'>
								<div className='text-gray-400 mb-4'>
									<Monitor className='h-16 w-16 mx-auto opacity-50' />
								</div>
								<h3 className='text-xl font-semibold text-white mb-2'>
									{t('home.noResults', {
										defaultValue: 'No configurations found',
									})}
								</h3>
								<p className='text-gray-400'>
									{t('home.tryAdjusting', {
										defaultValue:
											'Try adjusting your filters to see more results',
									})}
								</p>
							</div>
						)}

						{/* Configuration Grid */}
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
							{filteredConfigurations.map(config => (
								<div
									key={config.id}
									className='bg-[#202529] rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group'
									onClick={() => router.push(`/config/${config.id}`)}
								>
									{/* Image Container */}
									<div className='relative w-full h-0 pb-[56.25%] overflow-hidden bg-gray-800'>
										{' '}
										{/* 16:9 Aspect Ratio */}
										{config.image_url ? (
											<>
												<img
													src={config.image_url}
													alt={config.name}
													className='absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
													onError={e => {
														console.error(
															'Image failed to load:',
															config.image_url
														)
														e.currentTarget.style.display = 'none'
														e.currentTarget.parentElement
															?.querySelector('.fallback-icon')
															?.classList.remove('hidden')
													}}
												/>
												<div className='fallback-icon hidden absolute inset-0 flex items-center justify-center'>
													<Monitor className='h-16 w-16 text-gray-400' />
												</div>
											</>
										) : (
											<div className='absolute inset-0 flex items-center justify-center'>
												<Monitor className='h-16 w-16 text-gray-400' />
											</div>
										)}

										<div className='absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity'>
											<button
												onClick={e => {
													e.stopPropagation()
													toggleFavorite(config.id)
												}}
												className='p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors pointer-events-auto'
											>
												<Heart
													className={`h-5 w-5 ${
														favorites.includes(config.id)
															? 'text-red-500 fill-red-500'
															: 'text-gray-700'
													}`}
												/>
											</button>
										</div>
									</div>

									{/* Content */}
									<div className='p-6'>
										<h3 className='text-xl font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors'>
											{config.name}
										</h3>

										{/* Rating */}
										{config.rating && (
											<div className='flex items-center gap-2 mb-3'>
												<div className='flex'>{renderStars(config.rating)}</div>
												<span className='text-sm text-gray-400'>
													({config.reviewCount}{' '}
													{t('home.reviews', { defaultValue: 'reviews' })})
												</span>
											</div>
										)}

										{/* Description */}
										{config.description && (
											<p className='text-gray-400 text-sm mb-4 line-clamp-2'>
												{config.description}
											</p>
										)}

										{/* Price and CTA */}
										<div className='flex items-center justify-between mt-4'>
											<div>
												<span className='text-2xl font-bold text-white'>
													${config.price.toLocaleString()}
												</span>
											</div>
											<button
												onClick={e => {
													e.stopPropagation()
													router.push(`/config/${config.id}`)
												}}
												className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2'
											>
												{t('home.customize', { defaultValue: 'Customize' })}
												<ChevronDown className='h-4 w-4 rotate-270' />
											</button>
										</div>
									</div>
								</div>
							))}
						</div>
					</main>
				</div>
			</div>

			<Footer />
		</div>
	)
}

export default HomePage
