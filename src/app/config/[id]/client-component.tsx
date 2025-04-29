'use client'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
// import LoadingOverlay from '@/app/admin/components/LoadingOverlay'
import React from 'react'
// import Header from '@/app/_components/Header'
// import Footer from '@/app/_components/Footer'
import { useRouter } from 'next/navigation'
// import { useLanguage } from '@/context/LanguageContext'
import { useAppDispatch } from '@/redux/hooks/hook'
import { addToCart } from '@/redux/slices/cartSlice'
import { toast } from 'react-toastify'
import { fetchCompatibilityMap } from '@/services/compatibilityService'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface Component {
	id: number
	name: string
	price: number
	brand: string
	image_url?: string
	specs_en: Array<string>
	specs_ru: Array<string>
	specs_am: Array<string>
	category_id: number
	discount?: number
	hidden?: boolean
}

interface Category {
	id: number
	name: string
	components: Component[]
}

interface Configuration {
	id: number
	name: string
	description: string
	image_url?: string
	price: number
	hidden: boolean
}

export default function ClientConfiguration({
	configuration,
}: {
	configuration: Configuration
}) {
	const dispatch = useAppDispatch()
	const [configurations, setConfigurations] = useState<Configuration[]>([])
	const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null)
	const [categories, setCategories] = useState<Category[]>([])
	const [selectedComponents, setSelectedComponents] = useState<{
		[key: string]: Component | null
	}>({})
	const [defaultComponents, setDefaultComponents] = useState<{
		[key: string]: Component | null
	}>({})
	const [totalPrice, setTotalPrice] = useState(0)
	const [openCategory, setOpenCategory] = useState<number | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [compatibilityMap, setCompatibilityMap] = useState<
		Map<number, Set<number>>
	>(new Map())
	const [isSelecting, setIsSelecting] = useState(false)
	const [notifications, setNotifications] = useState<
		{
			id: number
			message: string
			componentNames: string[]
			visible: boolean
			timestamp: number
		}[]
	>([])
	const [notificationCounter, setNotificationCounter] = useState(0)
	const [configCustomized, setConfigCustomized] = useState(false)
	// const { language, setLanguage } = useLanguage()
	const router = useRouter()

	useEffect(() => {
		const fetchConfigurations = async () => {
			setIsLoading(true)
			try {
				const response = await fetch(
					`${process.env.NEXT_PUBLIC_SITE_URL}/api/configurations?hidden=false`,
					{
						cache: 'no-store',
					}
				)

				if (!response.ok) {
					console.error('Error fetching configurations:', response.statusText)
					return
				}

				const configurationsData = await response.json()
				if (!configurationsData) {
					return
				}

				// Filter out hidden configurations
				const visibleConfigurations = configurationsData.filter(
					(config: Configuration) => !config.hidden
				)

				setConfigurations(visibleConfigurations || [])
				setIsLoading(false)
			} catch (error) {
				console.error('Error in fetchConfigurations:', error)
				setIsLoading(false)
			}
		}

		fetchConfigurations()
	}, [])

	useEffect(() => {
		if (configuration) {
			setSelectedConfigId(configuration.id)
			setConfigurations(prev => {
				if (!prev.some(conf => conf.id === configuration.id)) {
					return [configuration, ...prev]
				}
				return prev
			})
		}
	}, [configuration])

	useEffect(() => {
		if (selectedConfigId === null) return

		const fetchConfigurationDetails = async () => {
			setIsLoading(true)
			try {
				console.log('Fetching config ID:', selectedConfigId)

				// Fetch the configuration with its products
				const configResponse = await fetch(
					`${process.env.NEXT_PUBLIC_SITE_URL}/api/configurations/${selectedConfigId}`,
					{ cache: 'no-store' }
				)

				if (!configResponse.ok) {
					console.error(
						'Error fetching configuration:',
						configResponse.statusText
					)
					return
				}

				const configData = await configResponse.json()
				console.log('Config data:', configData)

				// Fetch all products and categories
				const productsResponse = await fetch(
					`${process.env.NEXT_PUBLIC_SITE_URL}/api/products`,
					{ cache: 'no-store' }
				)

				if (!productsResponse.ok) {
					console.error('Error fetching products:', productsResponse.statusText)
					return
				}

				const { categories, components } = await productsResponse.json()

				// Format categories with their components
				const formattedCategories = categories.map(
					(category: { id: number; name: string }) => ({
						id: category.id,
						name: category.name,
						components: components.filter(
							(product: Component) => product.category_id === category.id
						),
					})
				)

				setCategories(formattedCategories)

				// Get compatibility data
				const compatibility = await fetchCompatibilityMap()
				setCompatibilityMap(compatibility)

				// Process configuration products
				const defaultComponentsMap: { [key: number]: Component | null } = {}
				const selectedComponentsMap: { [key: number]: Component | null } = {}

				if (configData.products && Array.isArray(configData.products)) {
					configData.products.forEach((product: Component) => {
						if (product && product.category_id) {
							defaultComponentsMap[product.category_id] = product
							selectedComponentsMap[product.category_id] = product
						}
					})
				}


				console.log('Default components:', defaultComponentsMap)
				console.log('Selected components:', selectedComponentsMap)

				setDefaultComponents(defaultComponentsMap)
				setSelectedComponents(selectedComponentsMap)

				// Calculate total price
				const newTotalPrice = Object.values(selectedComponentsMap)
					.filter(item => item !== null)
					.reduce((sum, item) => (item ? sum + item.price : sum), 0)

				setTotalPrice(newTotalPrice)

				setIsLoading(false)
				setConfigCustomized(false)
			} catch (error) {
				console.error('Error in fetchConfigurationDetails:', error)
				setIsLoading(false)
			}
		}

		fetchConfigurationDetails()
	}, [selectedConfigId])

	const isCompatibleWithSelected = (component: Component): boolean => {
		const selectedInCategory = selectedComponents[component.category_id]
		if (selectedInCategory?.id === component.id) {
			return true
		}

		for (const key in selectedComponents) {
			const selectedComponent = selectedComponents[key]
			if (!selectedComponent) continue
			if (Number(key) === component.category_id) continue

			const compatibleSet = compatibilityMap.get(selectedComponent.id)
			if (!compatibleSet || !compatibleSet.has(component.id)) {
				return false
			}
		}

		return true
	}

	function formatSpecs(
		specs: Record<string, string | number | boolean> | string[]
	): string {
		if (!specs || typeof specs !== 'object') return 'No data available'
		if (Array.isArray(specs)) {
			return specs.join(' | ')
		}
		return Object.entries(specs)
			.map(([key, value]) => {
				const formattedKey = key
					.replace(/_/g, ' ')
					.replace(/\b\w/g, c => c.toUpperCase())
				return `${formattedKey}: ${value}`
			})
			.join(' | ')
	}

	const handleAddToCart = () => {
		if (!selectedConfigId) return

		// Format components for cart
		const componentsForCart = Object.entries(selectedComponents)
			.filter(([_, component]) => component !== null)
			.map(([categoryId, component]) => {
				const category = categories.find(cat => cat.id === parseInt(categoryId))
				return {
					id: component!.id,
					categoryId: parseInt(categoryId),
					categoryName: category?.name || 'Unknown Category',
					name: component!.name,
					price: component!.price,
					image_url: component!.image_url,
					discount: component!.discount || 0,
				}
			})

		const selectedConfig = configurations.find(
			conf => conf.id === selectedConfigId
		)

		// Create cart item
		const cartItem = {
			id: selectedConfigId,
			name: selectedConfig?.name || 'Custom Configuration',
			image_url: selectedConfig?.image_url || selectedComponents['1']?.image_url, // Case image or fallback
			price: totalPrice,
			configId: selectedConfigId,
			configName: selectedConfig?.name || 'Custom Configuration',
			imageUrl: selectedConfig?.image_url || selectedComponents['1']?.image_url,
			totalPrice,
			components: componentsForCart,
			quantity: 1
		}

		// Dispatch to Redux store
		dispatch(addToCart(cartItem))

		// Show success message
		toast.success('Configuration added to cart!')
	}

	const findIncompatibleComponents = (component: Component) => {
		const incompatibleIds = new Set<number>()

		for (const selectedComponent of Object.values(selectedComponents)) {
			if (!selectedComponent) continue

			const compatibleSet = compatibilityMap.get(selectedComponent.id)

			if (!compatibleSet || !compatibleSet.has(component.id)) {
				incompatibleIds.add(selectedComponent.id)
			}
		}

		return incompatibleIds
	}

	const addNotification = (componentName: string) => {
		const currentTime = Date.now()

		setNotifications(prev => {
			const recentNotification = prev.find(
				n => n.visible && currentTime - n.timestamp < 1000
			)

			if (recentNotification) {
				return prev.map(n => {
					if (
						n.id === recentNotification.id &&
						!n.componentNames.includes(componentName)
					) {
						return {
							...n,
							componentNames: [...n.componentNames, componentName],
						}
					}
					return n
				})
			} else {
				const newId = notificationCounter
				setNotificationCounter(c => c + 1)

				const newNotification = {
					id: newId,
					message:
						'Some components were removed due to incompatibility. The following components were removed from your build:',
					componentNames: [componentName],
					visible: true,
					timestamp: currentTime,
				}

				setTimeout(() => {
					setNotifications(prev =>
						prev.map(notif =>
							notif.id === newId ? { ...notif, visible: false } : notif
						)
					)

					setTimeout(() => {
						setNotifications(prev => prev.filter(notif => notif.id !== newId))
					}, 500)
				}, 5000)

				return [...prev, newNotification]
			}
		})
	}

	const handleSelect = (category: Category, component: Component) => {
		if (isSelecting) return

		setIsSelecting(true)
		setConfigCustomized(true)

		setTimeout(() => {
			setSelectedComponents(prev => {
				let updated = { ...prev }

				const incompatibleIds = findIncompatibleComponents(component)

				for (const categoryId in updated) {
					const selectedComponent = updated[categoryId]
					if (selectedComponent && incompatibleIds.has(selectedComponent.id)) {
						addNotification(selectedComponent.name)
						updated[categoryId] = null
					}
				}

				updated[category.id] = component

				const newTotalPrice = Object.values(updated)
					.filter((item): item is Component => item !== null)
					.reduce((sum, item) => sum + item.price, 0)
				setTotalPrice(newTotalPrice)

				return updated
			})

			setIsSelecting(false)
		}, 500)
	}

	const getPriceDifference = (
		category: Category,
		component: Component,
		discount: number = 0
	) => {
		const selected = selectedComponents[category.id]

		const originalPrice = component.price
		const discountedPrice = Math.max(0, originalPrice - discount)

		if (!selected) {
			return (
				<>
					<div className='flex items-center gap-1'>
						<s className='text-gray-400 mr-2'>${originalPrice.toFixed(2)}</s>
						<span className='text-[#EC943F] mr-2'>
							${discountedPrice.toFixed(2)}
						</span>
						<span className='text-white font-inter text-xs font-normal leading-[17px] bg-[#FF9E40] rounded-full w-[65px] text-center'>
							Save ${discount}
						</span>
					</div>
				</>
			)
		}

		const selectedOriginalPrice = selected.price
		const selectedDiscount = selected.discount || 0
		const selectedDiscountedPrice = Math.max(
			0,
			selectedOriginalPrice - selectedDiscount
		)

		const priceDifferenceOriginal = originalPrice - selectedOriginalPrice
		const priceDifferenceDiscounted = discountedPrice - selectedDiscountedPrice

		return (
			<>
				<div className='flex items-center gap-1'>
					<s className='text-gray-400 mr-2'>
						${priceDifferenceOriginal > 0 ? '+' : ''}
						{Math.abs(priceDifferenceOriginal).toFixed(2)}
					</s>
					<br />
					<span className='text-[#EC943F] mr-2'>
						${priceDifferenceDiscounted > 0 ? '+' : ''}
						{Math.abs(priceDifferenceDiscounted).toFixed(2)}
					</span>
					<span className='text-white font-inter text-xs font-normal leading-[17px] bg-[#FF9E40] rounded-full w-[65px] text-center'>
						Save ${discount}
					</span>
				</div>
			</>
		)
	}

	const toggleCategory = (categoryId: number) => {
		setOpenCategory(prev => (prev === categoryId ? null : categoryId))
	}

	const categoryRefs = useRef<{
		[key: string]: React.RefObject<HTMLDivElement | null>
	}>({})

	const handleConfigComponentClick = (categoryId: string) => {
		const categoryElement = categoryRefs.current[categoryId]?.current

		if (categoryElement) {
			categoryElement.scrollIntoView({
				behavior: 'smooth',
				block: 'start',
				inline: 'nearest',
			})

			window.scrollBy({
				top: -80,
				behavior: 'smooth',
			})
		}

		setOpenCategory(prev =>
			prev === parseInt(categoryId) ? null : parseInt(categoryId)
		)
	}

	useEffect(() => {
		categories.forEach(category => {
			if (!categoryRefs.current[category.id]) {
				categoryRefs.current[category.id] = React.createRef<HTMLDivElement>()
			}
		})
	}, [categories])

	const getPopupClass = (index: number) => {
		if (index % 2 === 0) {
			return 'absolute left-[100%] top-0 w-64 p-3 bg-black shadow-lg rounded-md border text-white opacity-0 scale-95 transition-all duration-300 peer-hover:opacity-100 peer-hover:scale-100 z-50 pointer-events-none'
		} else {
			return 'absolute right-[100%] top-0 w-64 p-3 bg-black shadow-lg rounded-md border text-white opacity-0 scale-95 transition-all duration-300 peer-hover:opacity-100 peer-hover:scale-100 z-50 pointer-events-none'
		}
	}

	const handleResetCustomization = () => {
		setSelectedComponents({ ...defaultComponents })
		const newTotalPrice = Object.values(defaultComponents)
			.filter((item): item is Component => item !== null)
			.reduce((sum, item) => sum + item.price, 0)
		setTotalPrice(newTotalPrice)
		setConfigCustomized(false)
	}

	const selectedConfiguration = configurations.find(
		conf => conf.id === selectedConfigId
	)

	// if (!configuration) {
	// 	return <LoadingOverlay />
	// }

	return (
		<>
			<Header />
			<div className='flex p-4 w-[1391px] mx-32 gap-8'>
				{isLoading ? (
					<div>Loading...</div>
				) : (
					<>
						<div className='fixed right-8 top-24 z-50 w-80 space-y-4 rounded-2xl'>
							{notifications.map(notification => (
								<div
									key={`notification-${notification.id}`}
									className={`bg-[#2B2B33] border-l-4 border-yellow-500 p-4 rounded shadow-lg flex items-start transition-all duration-300 transform ${
										notification.visible
											? 'translate-x-0 opacity-100'
											: 'translate-x-full opacity-0'
									}`}
								>
									<div className='flex-shrink-0 mr-3'>
										<svg
											className='w-6 h-6 text-yellow-500'
											fill='currentColor'
											viewBox='0 0 20 20'
											xmlns='http://www.w3.org/2000/svg'
										>
											<path
												fillRule='evenodd'
												d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
												clipRule='evenodd'
											/>
										</svg>
									</div>
									<div>
										{(() => {
											const [firstSentence, ...rest] =
												notification.message.split('.')
											const restMessage = rest.join('.').trim()

											return (
												<>
													<p className='text-sm font-medium text-white'>
														{firstSentence}.
													</p>
													{restMessage && (
														<p className='text-sm text-white mt-1'>
															{restMessage}
														</p>
													)}
													<div className='mt-2'>
														{notification.componentNames.map((name, index) => (
															<p
																key={`component-${notification.id}-${index}`}
																className='text-xs text-white mb-1'
															>
																• {name}
															</p>
														))}
													</div>
												</>
											)
										})()}
									</div>
								</div>
							))}
						</div>

						<div className='max-w-xl mx-0 p-8 bg-[#222227] text-white font-sans'>
							{(selectedConfiguration || configuration) && (
								<>
									<h1 className='text-4xl font-bold mb-2 text-white uppercase'>
										{selectedConfiguration?.name || configuration.name}
									</h1>
									<p className='text-xl text-white mb-6'>
										{selectedConfiguration?.description ||
											configuration.description}
									</p>
								</>
							)}

							<div className=''>
								{categories
									.filter(category => category.name === 'Case')
									.map(category => (
										<div
											className='mt-8 mb-6 flex justify-center cursor-pointer'
											key={category.id}
										>
											{category.id !== null &&
											selectedComponents[category.id] !== null &&
											selectedComponents[category.id]?.image_url ? (
												<Image
													src={
														selectedComponents[category.id]!.image_url as string
													}
													alt={category.name}
													width={600}
													height={400}
													layout='responsive'
												/>
											) : selectedConfiguration?.image_url ? (
												<Image
													src={selectedConfiguration.image_url}
													alt={selectedConfiguration.name}
													width={600}
													height={400}
													layout='responsive'
												/>
											) : (
												<div
													className='w-[600px] h-[400px] p-[1%] rounded-[3px] border border-[#3a3a3f] 
        bg-gradient-to-br from-[rgba(255,255,255,0.05)] to-transparent 
        flex items-center justify-center'
												>
													<span className='text-gray-500'>
														No image available
													</span>
												</div>
											)}
										</div>
									))}

								{categories
									.filter(category => category.name === 'Case')
									.map(category => (
										<div
											className='mt-8 ml-60 mb-6 flex justify-center rounded-lg border-2 border-white w-[60px] h-[60px] cursor-pointer'
											key={category.id}
										>
											{category.id !== null &&
											selectedComponents[category.id] !== null &&
											selectedComponents[category.id]?.image_url ? (
												<Image
													src={
														selectedComponents[category.id]!.image_url as string
													}
													alt={category.name}
													width={60}
													height={60}
													layout='intrinsic'
												/>
											) : selectedConfiguration?.image_url ? (
												<Image
													src={selectedConfiguration.image_url}
													alt={selectedConfiguration.name}
													width={600}
													height={400}
													layout='responsive'
												/>
											) : (
												<div
													className='w-[60px] h-[60px] p-[1%] rounded-[3px] border border-[#3a3a3f] 
        bg-gradient-to-br from-[rgba(255,255,255,0.05)] to-transparent 
        flex items-center justify-center backdrop-blur-lg opacity-50'
												></div>
											)}
										</div>
									))}
							</div>

							<p className='text-sm font-medium leading-7 text-gray-400 text-center'>
								Customize your {selectedConfiguration?.name || 'PC'} with
								components and aesthetic options. System appearance may differ
								based on configuration.
							</p>

							<div className='flex flex-col p-4 w-[600px] mx-auto gap-2 mt-8'>
								<h2 className='text-xl text-white font-semibold'>
									Your Configuration
								</h2>
								<div className='grid grid-cols-2 -ml-4'>
									{Object.keys(selectedComponents).map(categoryId => {
										const selectedComponent = selectedComponents[categoryId]
										const categoryName =
											categories.find(cat => cat.id === Number(categoryId))
												?.name || 'Unknown Category'
										return selectedComponent ? (
											<div
												key={categoryId}
												className='flex items-center bg-[#222227] p-4 rounded-lg cursor-pointer'
												onClick={() => handleConfigComponentClick(categoryId)}
											>
												<svg
													stroke='currentColor'
													fill='currentColor'
													strokeWidth='0'
													viewBox='0 0 512 512'
													className='text-blue-500 w-5 h-5 mr-4'
													xmlns='http://www.w3.org/2000/svg'
												>
													<path d='M256 8C119.033 8 8 119.033 8 256s111.033 248 248 248 248-111.033 248-248S392.967 8 256 8zm0 48c110.532 0 200 89.451 200 200 0 110.532-89.451 200-200 200-110.532 0-200-89.451-200-200 0-110.532 89.451-200 200-200m140.204 130.267l-22.536-22.718c-4.667-4.705-12.265-4.736-16.97-.068L215.346 303.697l-59.792-60.277c-4.667-4.705-12.265-4.736-16.97-.069l-22.719 22.536c-4.705 4.667-4.736 12.265-.068 16.971l90.781 91.516c4.667 4.705 12.265 4.736 16.97.068l172.589-171.204c4.704-4.668 4.734-12.266.067-16.971z'></path>
												</svg>
												<div>
													<p className='text-white text-base font-medium'>
														{selectedComponent.name}
													</p>
													<p className='text-sm text-gray-400'>
														{categoryName}
													</p>
												</div>
											</div>
										) : null
									})}
								</div>

								{configCustomized && (
									<button
										onClick={handleResetCustomization}
										className='mt-4 py-2 px-4 bg-[#3a3a3f] text-white rounded hover:bg-[#4a4a4f] transition-colors'
									>
										Reset to Default Configuration
									</button>
								)}
							</div>
						</div>

						<div className='w-[43%] ml-0'>
							<div className='mt-6 p-4 text-4xl font-semibold text-white flex justify-evenly gap-16 items-center w-[600px]'>
								<div className='text-white font-inter text-[10px] font-medium leading-[19.2px] inline-block py-[6px] px-[30px] pr-[20px] rounded-[15px] border-0 my-[28px] mb-[27px] relative flex items-center'>
									<span className='w-2 h-2 bg-white rounded-full mr-2'></span>
									Estimated to ship in 3-4 weeks
								</div>
								${totalPrice}
								<button
									onClick={handleAddToCart}
									className='bg-[#00b5ed] rounded-[25px] py-[15px] px-[30px] border-0 text-white font-inter text-[16px] font-medium leading-[15px] capitalize cursor-pointer'
								>
									Add To Cart
								</button>
							</div>

							{categories.map(category => (
								<div
									key={category.id}
									className='relative group'
									ref={categoryRefs.current[category.id]}
								>
									<div
										onClick={() => toggleCategory(category.id)}
										className='flex justify-between items-center p-4 bg-[#222227] cursor-pointer mt-4 border-t border-gray-700 relative z-20'
									>
										<div
											className={`absolute left-1/2 top-1/2 w-[80%] h-[30px] 
        -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-transparent 
        via-[#D1D5DB]/30 to-transparent blur-2xl z-10 pointer-events-none 
        transition-opacity duration-500 ${
					openCategory === category.id ? 'opacity-100' : 'opacity-0'
				}`}
										></div>
										<div className='flex items-center gap-4'>
											<div className='w-[60px] h-[60px] p-[1%] rounded-[3px] border border-[#3a3a3f] bg-gradient-to-br from-[rgba(255,255,255,0.05)] to-transparent flex items-center justify-center'>
												{category.id !== null &&
												selectedComponents[category.id] !== null &&
												selectedComponents[category.id]?.image_url ? (
													<Image
														src={
															selectedComponents[category.id]!
																.image_url as string
														}
														alt={category.name}
														width={60}
														height={60}
														layout='intrinsic'
													/>
												) : (
													<span className='text-white text-xs'></span>
												)}
											</div>

											<span className='text-xl font-medium text-white'>
												{category.name}
											</span>
										</div>
										<svg
											xmlns='http://www.w3.org/2000/svg'
											width='24'
											height='24'
											fill='none'
											stroke='white'
											strokeWidth='2'
											strokeLinecap='round'
											strokeLinejoin='round'
											className={`transition-transform duration-500 ${
												openCategory === category.id ? 'rotate-180' : ''
											}`}
										>
											<path d='M6 9l6 6 6-6' />
										</svg>
									</div>

									<div
										className={`overflow-hidden transition-[max-height] duration-500 ease-in-out transform origin-top ${
											openCategory === category.id
												? 'max-h-screen scale-y-100 py-4'
												: 'max-h-0 scale-y-0'
										}`}
									>
										<div className='grid grid-cols-2 gap-4 mt-4'>
											{category.components
												.filter(component => !component.hidden)
												.map((component, index) => {
													const isSelected =
														selectedComponents[category.id]?.id === component.id
													const isDisabled =
														!isCompatibleWithSelected(component)
													const discount = component.discount || 10
													return (
														<div
															key={component.id}
															onClick={() =>
																!isSelecting &&
																handleSelect(category, component)
															}
															className={`p-2 border border-[#454545] rounded-sm cursor-pointer flex items-center gap-4 h-[150px] transition-all duration-500 ${
																isSelected ? 'bg-[#303A50]' : 'bg-[#2E2E35]'
															} ${
																isDisabled && !isSelected
																	? 'opacity-70 hover:border-yellow-400'
																	: 'hover:bg-[#303A50]'
															} ${
																isSelecting
																	? 'opacity-50 cursor-not-allowed'
																	: ''
															}`}
														>
															{isSelecting ? (
																<div className='w-6 h-6 border-4 border-blue-500 border-dotted rounded-full animate-spin'></div>
															) : (
																<>
																	<Image
																		src={
																			component.image_url ||
																			'/category-icon.png'
																		}
																		alt={component.name}
																		width={60}
																		height={60}
																	/>
																	<div className='flex-1'>
																		<h3 className='text-sm font-medium text-white'>
																			{component.name}
																		</h3>

																		{/* <div className='relative w-fit'>
																		<p className='text-sm font-medium text-gray-500 overflow-hidden max-h-[3em] line-clamp-2 cursor-pointer peer'>
																			{formatSpecs(
																				language === 'ru'
																					? component.specs_ru
																					: language === 'am'
																					? component.specs_am
																					: component.specs_en
																			)}
																		</p>

																		<div className={getPopupClass(index)}>
																			{formatSpecs(
																				language === 'ru'
																					? component.specs_ru
																					: language === 'am'
																					? component.specs_am
																					: component.specs_en
																			)}
																		</div>
																	</div> */}

																		{!isDisabled && !isSelected && (
																			<div className='text-white text-[12px] mt-3'>
																				{getPriceDifference(
																					category,
																					component,
																					discount
																				)}
																			</div>
																		)}

																		{isDisabled && !isSelected && (
																			<h3 className='text-sm font-normal text-yellow-200'>
																				Not compatible with your other
																				components
																			</h3>
																		)}

																		<div className='flex items-center gap-2'>
																			{isSelected && (
																				<h4 className='mt-3 text-white font-inter text-xs font-normal leading-[17px] bg-[#02B5ED] rounded-full w-[63px] text-center'>
																					Selected
																				</h4>
																			)}
																			{isSelected && (
																				<span className='mt-3 text-white font-inter text-xs font-normal leading-[17px] bg-[#FF9E40] rounded-full w-[75px] text-center'>
																					Saving ${discount}
																				</span>
																			)}
																		</div>
																	</div>
																</>
															)}
														</div>
													)
												})}
										</div>
									</div>
								</div>
							))}
						</div>
					</>
				)}
			</div>
			<Footer />
		</>
	)
}
