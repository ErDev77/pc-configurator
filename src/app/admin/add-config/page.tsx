'use client'

import { useEffect, useState } from 'react'
import Sidebar from '../_components/Sidebar'
import { toast } from 'react-toastify'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useDropzone } from 'react-dropzone'
import {
	Trash2,
	Info,
	PlusCircle,
	MinusCircle,
	ChevronDown,
	ChevronUp,
	Upload,
	X,
	Eye,
	EyeOff,
} from 'lucide-react'

interface Category {
	id: number
	name: string
	name_en: string
	name_ru: string
	name_am: string
}

interface Product {
	id: number
	name: string
	image_url: string
	category_id: number
	price: number
}

interface SelectedProduct {
	product_id: number
	quantity: number
}

export default function AddConfigurationPage() {
	const [categories, setCategories] = useState<Category[]>([])
	const [components, setComponents] = useState<Product[]>([])
	const [configName, setConfigName] = useState('')
	const [customId, setCustomId] = useState('')
	const [description, setDescription] = useState('')
	const [selectedProducts, setSelectedProducts] = useState<
		Record<number, SelectedProduct[]>
	>({})
	const [expandedCategories, setExpandedCategories] = useState<number[]>([])
	const [file, setFile] = useState<File | null>(null)
	const [imageUrl, setImageUrl] = useState<string | null>(null)
	const [isUploading, setIsUploading] = useState(false)
	const [isLoading, setIsLoading] = useState(true)
	const [customPrice, setCustomPrice] = useState<number | ''>('')
	const [isHidden, setIsHidden] = useState(false)
	const [activeStep, setActiveStep] = useState(1)
	const router = useRouter()

	useEffect(() => {
		const fetchData = async () => {
			try {
				// Fix: Add pagination parameters to get all products
				const res = await fetch('/api/products?page=1&pageSize=100')
				const data = await res.json()

				if (res.ok) {
					// Format categories properly (same as edit page)
					const formattedCategories = data.categories.map((category: any) => ({
						id: category.id,
						name: category.name,
						name_en: category.name_en || category.name,
						name_ru:
							category.name_ru === '[null]' ? '' : category.name_ru || '',
						name_am:
							category.name_am === '[null]' ? '' : category.name_am || '',
					}))
					setCategories(formattedCategories)
					setComponents(data.components)

					// Add debug logging to verify data
					console.log('Total components fetched:', data.components.length)
					console.log('Categories:', formattedCategories)
					console.log('Components by category:')
					formattedCategories.forEach((category: Category) => {
						const count = data.components.filter(
							(p: Product) => p.category_id === category.id
						).length
						console.log(`${category.name}: ${count} components`)
					})
				} else {
					throw new Error(data.error || 'Не удалось получить данные с сервера')
				}

				setIsLoading(false)
			} catch (error) {
				toast.error(
					(error instanceof Error ? error.message : 'Неизвестная ошибка') ||
						'Ошибка при получении данных с сервера'
				)
				setIsLoading(false)
			}
		}
		fetchData()
	}, [])

	const handleToggleCategory = (categoryId: number) => {
		setExpandedCategories(prev =>
			prev.includes(categoryId)
				? prev.filter(id => id !== categoryId)
				: [...prev, categoryId]
		)
	}

	const handleSelectProduct = (categoryId: number, product: Product) => {
		setSelectedProducts(prev => {
			const current = prev[categoryId] || []
			if (current.find(p => p.product_id === product.id)) return prev

			return {
				...prev,
				[categoryId]: [...current, { product_id: product.id, quantity: 1 }],
			}
		})
	}

	const calculatedTotalPrice = Object.entries(selectedProducts).reduce(
		(total, [_, items]) => {
			for (const item of items) {
				const product = components.find(p => p.id === item.product_id)
				if (product) {
					total += (product.price || 0) * (item.quantity || 1)
				}
			}
			return total
		},
		0
	)

	const handleRemoveProduct = (categoryId: number, productId: number) => {
		setSelectedProducts(prev => {
			const current = prev[categoryId] || []
			const updated = current.filter(p => p.product_id !== productId)

			if (updated.length === 0) {
				const { [categoryId]: _, ...rest } = prev
				return rest
			}

			return {
				...prev,
				[categoryId]: updated,
			}
		})
	}

	const handleQuantityChange = (
		categoryId: number,
		productId: number,
		quantity: number
	) => {
		if (quantity < 1) return

		setSelectedProducts(prev => {
			const current = prev[categoryId] || []
			return {
				...prev,
				[categoryId]: current.map(p =>
					p.product_id === productId ? { ...p, quantity } : p
				),
			}
		})
	}

	const handleDrop = (acceptedFiles: File[]) => {
		const file = acceptedFiles[0]
		setFile(file)
		setImageUrl(URL.createObjectURL(file))
	}

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop: handleDrop,
		accept: {
			'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
		},
		maxFiles: 1,
	})

	const uploadConfigImage = async (): Promise<string | null> => {
		if (file) {
			setIsUploading(true)
			try {
				const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
				const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

				if (!cloudName || !uploadPreset) {
					throw new Error('Cloudinary configuration missing')
				}

				const formData = new FormData()
				formData.append('file', file)
				formData.append('upload_preset', uploadPreset)
				formData.append('folder', 'configurations')

				const res = await fetch(
					`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
					{
						method: 'POST',
						body: formData,
					}
				)

				if (!res.ok) {
					const errorData = await res.json()
					console.error('Ошибка загрузки:', errorData)
					throw new Error(
						`Ошибка при загрузке изображения. Статус: ${res.status}`
					)
				}

				const data = await res.json()
				if (!data.secure_url) {
					throw new Error('Не удалось получить ссылку на изображение')
				}

				setIsUploading(false)
				return data.secure_url
			} catch (error) {
				console.error('Ошибка загрузки изображения:', error)
				setIsUploading(false)
				toast.error('Ошибка загрузки изображения!')
				return null
			}
		}
		return null
	}

	const handleSubmitConfig = async () => {
		try {
			// Валидация обязательных полей
			if (!configName) {
				toast.error('Пожалуйста, введите название конфигурации')
				return
			}

			if (Object.keys(selectedProducts).length === 0) {
				toast.error('Добавьте хотя бы один компонент в конфигурацию')
				return
			}

			if (!file) {
				toast.error('Пожалуйста, загрузите изображение конфигурации')
				return
			}

			// Check if custom_id is already taken
			if (customId) {
				const checkResponse = await fetch(
					`/api/configurations/custom/${customId}`
				)
				if (checkResponse.ok) {
					toast.error(
						'Такой Custom ID уже используется. Пожалуйста, выберите другой.'
					)
					return
				}
			}

			// Загружаем изображение
			const image = await uploadConfigImage()
			if (!image) {
				toast.error('Не удалось загрузить изображение')
				return
			}

			// Подготовка данных
			const configPayload = {
				name: configName,
				description,
				custom_id: customId || undefined, // Only include if not empty
				image_url: image,
				price:
					typeof customPrice === 'number' && customPrice > 0
						? customPrice
						: calculatedTotalPrice,
				products: Object.values(selectedProducts)
					.flat()
					.map(p => ({ id: p.product_id, quantity: p.quantity })),
				hidden: isHidden,
			}

			console.log('Sending config data to API:', configPayload)

			const response = await fetch('/api/configurations', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(configPayload),
			})

			const configData = await response.json()

			if (!response.ok || !configData) {
				toast.error('Ошибка создания конфигурации')
				return
			}

			toast.success('Конфигурация успешно создана!')
			router.push('/admin/configurations')
		} catch (error) {
			console.error('Ошибка при добавлении конфигурации:', error)
			toast.error(
				error instanceof Error
					? error.message
					: 'Ошибка при добавлении конфигурации!'
			)
		}
	}

	const resetForm = () => {
		setSelectedProducts({})
		setConfigName('')
		setCustomId('')
		setDescription('')
		setCustomPrice('')
		setFile(null)
		setImageUrl(null)
		setExpandedCategories([])
		setIsHidden(false)
		setActiveStep(1)
	}

	const renderStepIndicator = () => (
		<div className='flex justify-center mb-8'>
			<div className='flex items-center gap-2'>
				{[1, 2, 3].map(step => (
					<div key={step} className='flex items-center'>
						<button
							onClick={() => setActiveStep(step)}
							className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all
                ${
									activeStep >= step
										? 'bg-blue-600 text-white'
										: 'bg-gray-700 text-gray-400'
								}`}
						>
							{step}
						</button>
						{step < 3 && (
							<div
								className={`w-8 h-1 ${
									activeStep > step ? 'bg-blue-600' : 'bg-gray-700'
								}`}
							/>
						)}
					</div>
				))}
			</div>
		</div>
	)

	const renderStep1 = () => (
		<div className='space-y-6 animate-fadeIn'>
			<div className='bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-6 shadow-lg border border-blue-600/30'>
				<h2 className='text-xl text-blue-300 font-bold mb-4'>
					Основная информация
				</h2>

				<div className='space-y-4'>
					<div className='flex flex-col'>
						<label className='text-gray-300 mb-1 font-medium'>
							Название конфигурации*
						</label>
						<input
							type='text'
							placeholder='Введите название'
							className='p-3 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none'
							value={configName}
							onChange={e => setConfigName(e.target.value)}
						/>
					</div>

					{/* Add the custom ID field */}
					<div className='flex flex-col'>
						<label className='text-gray-300 mb-1 font-medium'>
							Custom ID (для URL)
						</label>
						<div className='relative'>
							<input
								type='text'
								placeholder='my-awesome-pc'
								className='p-3 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none w-full'
								value={customId}
								onChange={e =>
									setCustomId(e.target.value.replace(/\s+/g, '-').toLowerCase())
								}
							/>
							<div className='absolute right-3 top-3 text-gray-400 text-sm'>
								/config/
								<span className='text-blue-400'>{customId || 'custom-id'}</span>
							</div>
						</div>
						<p className='text-gray-500 text-xs mt-1'>
							Используется в URL вместо ID. Оставьте пустым для автоматического
							ID.
						</p>
					</div>

					<div className='flex flex-col'>
						<label className='text-gray-300 mb-1 font-medium'>Описание</label>
						<textarea
							placeholder='Введите описание конфигурации'
							className='p-3 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none min-h-32'
							value={description}
							onChange={e => setDescription(e.target.value)}
						/>
					</div>

					<div className='flex items-center gap-2'>
						<input
							type='checkbox'
							id='hidden'
							checked={isHidden}
							onChange={() => setIsHidden(!isHidden)}
							className='w-5 h-5 rounded bg-gray-800 border-gray-700 text-blue-600 focus:ring-blue-500'
						/>
						<label
							htmlFor='hidden'
							className='text-gray-300 cursor-pointer flex items-center gap-2'
						>
							{isHidden ? <EyeOff size={18} /> : <Eye size={18} />}
							{isHidden ? 'Скрыть конфигурацию' : 'Показывать конфигурацию'}
						</label>
						<div className='group relative ml-1'>
							<Info size={16} className='text-gray-400 cursor-help' />
							<div className='absolute bottom-full mb-2 left-0 bg-gray-900 p-2 rounded text-xs w-48 hidden group-hover:block shadow-lg text-gray-300 border border-gray-700'>
								Скрытые конфигурации не отображаются в каталоге, но доступны по
								прямой ссылке
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className='bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-6 shadow-lg border border-blue-600/30'>
				<h2 className='text-xl text-blue-300 font-bold mb-4'>
					Изображение конфигурации*
				</h2>

				<div
					{...getRootProps({
						className: `dropzone border-2 ${
							isDragActive
								? 'border-blue-500 bg-blue-900/20'
								: 'border-gray-600'
						} border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-gray-800/70 transition-all`,
					})}
				>
					<input {...getInputProps()} />

					{imageUrl ? (
						<div className='flex flex-col items-center'>
							<div className='relative group'>
								<Image
									src={imageUrl}
									alt='Превью'
									width={200}
									height={200}
									className='rounded-lg shadow-lg object-cover'
								/>
								<button
									onClick={e => {
										e.stopPropagation()
										setFile(null)
										setImageUrl(null)
									}}
									className='absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity'
								>
									<X size={16} />
								</button>
							</div>
							<p className='text-gray-400 mt-3'>
								Нажмите или перетащите, чтобы заменить
							</p>
						</div>
					) : (
						<div className='flex flex-col items-center'>
							<Upload className='text-blue-500 mb-2' size={40} />
							<p className='text-gray-300'>
								Перетащите изображение или нажмите для выбора
							</p>
							<p className='text-gray-500 text-sm mt-2'>
								JPG, PNG, WEBP (макс. 5MB)
							</p>
						</div>
					)}
				</div>
			</div>

			<div className='flex justify-between mt-6'>
				<button
					onClick={resetForm}
					className='px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-md font-medium transition-all flex items-center gap-2'
				>
					<Trash2 size={18} />
					Сбросить форму
				</button>

				<button
					onClick={() => setActiveStep(2)}
					disabled={!configName || !file}
					className={`px-8 py-3 rounded-md font-medium transition-all flex items-center gap-2
            ${
							!configName || !file
								? 'bg-gray-700 text-gray-400 cursor-not-allowed'
								: 'bg-blue-600 hover:bg-blue-700 text-white'
						}`}
				>
					Далее
					<ChevronDown className='transform rotate-270' size={18} />
				</button>
			</div>
		</div>
	)

	const renderStep2 = () => (
		<div className='space-y-6 animate-fadeIn'>
			<div className='bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-6 shadow-lg border border-blue-600/30'>
				<h2 className='text-xl text-blue-300 font-bold mb-4'>
					Выбор комплектующих
				</h2>

				{categories.map(category => (
					<div key={category.id} className='mb-4'>
						<button
							onClick={() => handleToggleCategory(category.id)}
							className='w-full text-left p-3 bg-gray-800 text-white font-bold rounded flex justify-between items-center hover:bg-gray-700 transition-all border border-gray-700'
						>
							<span>{category.name_en || category.name}</span>{' '}
							<span>
								{expandedCategories.includes(category.id) ? (
									<ChevronUp size={20} className='text-blue-400' />
								) : (
									<ChevronDown size={20} className='text-blue-400' />
								)}
							</span>
						</button>

						<div
							className={`overflow-hidden transition-all duration-300 ease-in-out ${
								expandedCategories.includes(category.id)
									? 'max-h-[500px] opacity-100'
									: 'max-h-0 opacity-0'
							}`}
						>
							{expandedCategories.includes(category.id) && (
								<div className='pl-4 mt-2 bg-gray-800/50 rounded p-3 border-l-2 border-blue-600'>
									<h4 className='text-gray-300 mb-2 font-semibold flex items-center gap-2'>
										<PlusCircle size={16} className='text-blue-400' />
										Доступные комплектующие:
									</h4>
									<div className='grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar'>
										{Array.isArray(components) &&
											components
												.filter(p => p.category_id === category.id)
												.map(product => {
													const isSelected = selectedProducts[
														category.id
													]?.some(p => p.product_id === product.id)
													return (
														<button
															key={product.id}
															disabled={isSelected}
															onClick={() =>
																handleSelectProduct(category.id, product)
															}
															className={`text-left p-3 rounded flex justify-between items-center ${
																isSelected
																	? 'bg-blue-900/30 text-gray-400 cursor-not-allowed border border-blue-600/30'
																	: 'bg-gray-700 text-white hover:bg-gray-600 border border-gray-600'
															}`}
														>
															<span>{product.name}</span>
															<span className='text-gray-400'>
																${product.price}
															</span>
														</button>
													)
												})}
									</div>
								</div>
							)}
						</div>
					</div>
				))}
			</div>

			{Object.keys(selectedProducts).length > 0 && (
				<div className='bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-6 shadow-lg border border-blue-600/30'>
					<h2 className='text-xl text-blue-300 font-bold mb-4'>
						Выбранные комплектующие
					</h2>

					<div className='space-y-4'>
						{categories.map(category => {
							const items = selectedProducts[category.id]
							if (!items || items.length === 0) return null

							return (
								<div
									key={category.id}
									className='bg-gray-800/50 p-4 rounded-lg border-l-2 border-blue-600'
								>
									<h3 className='text-gray-300 font-semibold mb-3'>
										{category.name}
									</h3>
									<ul className='space-y-2'>
										{items.map(item => {
											const product = components.find(
												p => p.id === item.product_id
											)
											if (!product) return null
											return (
												<li
													key={item.product_id}
													className='flex justify-between items-center bg-gray-700 p-3 rounded border border-gray-600'
												>
													<div className='flex-1'>
														<p className='text-white'>{product.name}</p>
														<p className='text-gray-400 text-sm'>
															${product.price} за единицу
														</p>
													</div>

													<div className='flex items-center gap-3'>
														<div className='flex items-center bg-gray-800 rounded-md'>
															<button
																onClick={() =>
																	handleQuantityChange(
																		category.id,
																		item.product_id,
																		item.quantity - 1
																	)
																}
																className='p-1 text-gray-400 hover:text-white'
																disabled={item.quantity <= 1}
															>
																<MinusCircle
																	size={18}
																	className={
																		item.quantity <= 1 ? 'opacity-50' : ''
																	}
																/>
															</button>

															<span className='px-3 text-white'>
																{item.quantity}
															</span>

															<button
																onClick={() =>
																	handleQuantityChange(
																		category.id,
																		item.product_id,
																		item.quantity + 1
																	)
																}
																className='p-1 text-gray-400 hover:text-white'
															>
																<PlusCircle size={18} />
															</button>
														</div>

														<span className='text-white font-medium min-w-24 text-right'>
															${product.price * item.quantity}
														</span>

														<button
															onClick={() =>
																handleRemoveProduct(
																	category.id,
																	item.product_id
																)
															}
															className='p-1 text-red-400 hover:text-red-300'
														>
															<Trash2 size={18} />
														</button>
													</div>
												</li>
											)
										})}
									</ul>
								</div>
							)
						})}
					</div>
				</div>
			)}

			<div className='flex justify-between mt-6'>
				<button
					onClick={() => setActiveStep(1)}
					className='px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-md font-medium transition-all flex items-center gap-2'
				>
					<ChevronUp className='transform rotate-270' size={18} />
					Назад
				</button>

				<button
					onClick={() => setActiveStep(3)}
					disabled={Object.keys(selectedProducts).length === 0}
					className={`px-8 py-3 rounded-md font-medium transition-all flex items-center gap-2
            ${
							Object.keys(selectedProducts).length === 0
								? 'bg-gray-700 text-gray-400 cursor-not-allowed'
								: 'bg-blue-600 hover:bg-blue-700 text-white'
						}`}
				>
					Далее
					<ChevronDown className='transform rotate-270' size={18} />
				</button>
			</div>
		</div>
	)

	const renderStep3 = () => (
		<div className='space-y-6 animate-fadeIn'>
			<div className='bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-6 shadow-lg border border-blue-600/30'>
				<h2 className='text-xl text-blue-300 font-bold mb-4'>Обзор и цена</h2>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
					<div className='bg-gray-800/50 p-4 rounded-lg border border-gray-700'>
						<h3 className='text-white font-semibold mb-3 flex items-center gap-2'>
							<Info size={18} className='text-blue-400' />
							Информация о конфигурации
						</h3>

						<div className='space-y-3'>
							<div>
								<p className='text-gray-400'>Название:</p>
								<p className='text-white font-medium'>{configName}</p>
							</div>

							{customId && (
								<div>
									<p className='text-gray-400'>Custom ID:</p>
									<p className='text-white font-medium'>/config/{customId}</p>
								</div>
							)}

							{description && (
								<div>
									<p className='text-gray-400'>Описание:</p>
									<p className='text-white'>{description}</p>
								</div>
							)}

							<div>
								<p className='text-gray-400'>Статус:</p>
								<p className='flex items-center gap-2'>
									{isHidden ? (
										<>
											<EyeOff size={16} className='text-orange-400' />
											<span className='text-orange-400'>
												Скрытая конфигурация
											</span>
										</>
									) : (
										<>
											<Eye size={16} className='text-green-400' />
											<span className='text-green-400'>
												Публичная конфигурация
											</span>
										</>
									)}
								</p>
							</div>

							{imageUrl && (
								<div className='mt-4'>
									<p className='text-gray-400 mb-2'>Изображение:</p>
									<Image
										src={imageUrl}
										alt='Превью'
										width={150}
										height={150}
										className='rounded-lg border border-gray-700 object-cover'
									/>
								</div>
							)}
						</div>
					</div>

					<div className='bg-gray-800/50 p-4 rounded-lg border border-gray-700'>
						<h3 className='text-white font-semibold mb-3 flex items-center gap-2'>
							<Info size={18} className='text-blue-400' />
							Ценообразование
						</h3>

						<div className='space-y-3'>
							<div className='bg-blue-900/20 border border-blue-600/30 p-3 rounded-lg'>
								<div className='flex justify-between items-center'>
									<span className='text-gray-300'>Себестоимость:</span>
									<span className='text-white font-bold'>
										${calculatedTotalPrice}
									</span>
								</div>
							</div>

							<div className='mt-4'>
								<label className='text-gray-300 mb-2 block'>
									Установите цену продажи:
								</label>
								<div className='flex items-center gap-2'>
									<span className='text-xl text-white'>$</span>
									<input
										type='number'
										value={customPrice === '' ? '' : customPrice}
										onChange={e => {
											const value =
												e.target.value === '' ? '' : Number(e.target.value)
											setCustomPrice(value)
										}}
										placeholder={calculatedTotalPrice.toString()}
										className='p-3 bg-gray-800 text-white rounded w-full border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none'
									/>
								</div>
								<p className='text-gray-400 text-sm mt-2'>
									Оставьте пустым для использования себестоимости
								</p>
							</div>

							<div className='bg-gradient-to-r from-green-900/30 to-green-800/20 border border-green-600/30 p-3 rounded-lg mt-4'>
								<div className='flex justify-between items-center'>
									<span className='text-gray-300'>Итоговая цена:</span>
									<span className='text-green-300 font-bold text-xl'>
										$
										{typeof customPrice === 'number' && customPrice > 0
											? customPrice
											: calculatedTotalPrice}
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className='flex justify-between mt-6'>
				<button
					onClick={() => setActiveStep(2)}
					className='px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-md font-medium transition-all flex items-center gap-2'
				>
					<ChevronUp className='transform rotate-270' size={18} />
					Назад
				</button>

				<button
					onClick={handleSubmitConfig}
					disabled={isUploading}
					className='px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md font-bold transition-all flex items-center gap-2'
				>
					{isUploading ? 'Загрузка...' : 'Создать конфигурацию'}
					{!isUploading && <PlusCircle size={18} />}
				</button>
			</div>
		</div>
	)

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
		<div className='p-6 bg-gradient-to-br bg-[#171C1F] min-h-screen'>
			<Sidebar />

			<div className='ml-0 md:ml-72 transition-all max-w-4xl mx-auto'>
				<h1 className='text-3xl text-white mb-2 font-bold text-center'>
					Создание новой конфигурации
				</h1>
				<p className='text-gray-400 mb-8 text-center'>
					Создайте новую сборку компьютера, указав комплектующие и детали
				</p>

				{renderStepIndicator()}

				<div className='bg-[#202529] rounded-xl shadow-xl p-6 border border-gray-800'>
					{activeStep === 1 && renderStep1()}
					{activeStep === 2 && renderStep2()}
					{activeStep === 3 && renderStep3()}
				</div>
			</div>

			<style jsx global>{`
				.animate-fadeIn {
					animation: fadeIn 0.3s ease-in-out;
				}

				@keyframes fadeIn {
					from {
						opacity: 0;
						transform: translateY(10px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}
			`}</style>
		</div>
	)
}
