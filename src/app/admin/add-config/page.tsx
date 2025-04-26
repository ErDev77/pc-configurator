'use client'

import { useEffect, useState } from 'react'
import Sidebar from '../_components/Sidebar'
import { toast } from 'react-toastify'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useDropzone } from 'react-dropzone'

interface Category {
	id: number
	name: string
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
	const [components, setComponents] = useState<Product[]>([]) // Используем components вместо products
	const [configName, setConfigName] = useState('')
	const [description, setDescription] = useState('')
	const [selectedProducts, setSelectedProducts] = useState<
		Record<number, SelectedProduct[]>
	>({})
	const [expandedCategories, setExpandedCategories] = useState<number[]>([])
	const [file, setFile] = useState<File | null>(null)
	const [imageUrl, setImageUrl] = useState<string | null>(null)
	const [isUploading, setIsUploading] = useState(false)
	const router = useRouter()
	const [isLoading, setIsLoading] = useState(true)
	const [customPrice, setCustomPrice] = useState<number | ''>('')

	useEffect(() => {
		const fetchData = async () => {
			try {
				const res = await fetch('/api/products')
				const data = await res.json()

				if (res.ok) {
					setCategories(data.categories) // Получаем категории
					setComponents(data.components) // Заменили products на components
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
			prev.includes(categoryId) ? [] : [categoryId]
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
				const product = components.find(p => p.id === item.product_id) // Заменили products на components
				if (product) {
					total += (product.price || 0) * (item.quantity || 1)
				}
			}
			return total
		},
		0
	)

	const handleQuantityChange = (
		categoryId: number,
		productId: number,
		quantity: number
	) => {
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

	const { getRootProps, getInputProps } = useDropzone({ onDrop: handleDrop })

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
				formData.append('folder', 'configurations') // Папка для конфигураций

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
				image_url: image, // Используем изображение, если оно есть
				price:
					typeof customPrice === 'number' ? customPrice : calculatedTotalPrice,

				products: Object.values(selectedProducts)
					.flat()
					.map(p => ({ id: p.product_id })),

				hidden: false,
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
			router.push('/admin/config-list')
		} catch (error) {
			console.error('Ошибка при добавлении конфигурации:', error)
			toast.error(
				error instanceof Error
					? error.message
					: 'Ошибка при добавлении конфигурации!'
			)
		}
	}

	return (
		<div className='p-6 bg-[#171C1F] min-h-screen'>
			<Sidebar />
			<h1 className='text-3xl text-white mb-6 ml-72 font-bold'>
				Добавить конфигурацию
			</h1>
			<div className='bg-[#202529] p-6 rounded-lg shadow-lg w-full max-w-4xl mx-auto'>
				{/* Two inputs in one row */}
				<div className='flex gap-4 mb-4'>
					<input
						type='text'
						placeholder='Название конфигурации'
						className='w-1/2 p-2 bg-gray-700 text-white rounded'
						value={configName}
						onChange={e => setConfigName(e.target.value)}
					/>
					<textarea
						placeholder='Описание'
						className='w-1/2 p-2 bg-gray-700 text-white rounded'
						value={description}
						onChange={e => setDescription(e.target.value)}
					/>
				</div>

				{categories.map(category => (
					<div key={category.id} className='mb-4'>
						<button
							onClick={() => handleToggleCategory(category.id)}
							className='w-full text-left p-3 bg-gray-700 text-white font-bold rounded flex justify-between items-center hover:bg-gray-600 transition-all'
						>
							<span>{category.name}</span>
							<span>
								{expandedCategories.includes(category.id) ? '▲' : '▼'}
							</span>
						</button>

						{/* Выпадающий список продуктов */}
						<div
							className={`overflow-hidden transition-all duration-500 ease-in-out ${
								expandedCategories.includes(category.id)
									? 'max-h-[1000px] opacity-100'
									: 'max-h-0 opacity-0'
							}`}
						>
							{expandedCategories.includes(category.id) && (
								<div className='pl-4 mt-2 bg-gray-800 rounded p-3'>
									<h4 className='text-gray-300 mb-2 font-semibold'>
										Выберите продукт:
									</h4>
									<div className='flex flex-col gap-2 max-h-60 overflow-y-auto'>
										{Array.isArray(components) && (
											<>
												{components
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
																className={`text-left p-2 rounded ${
																	isSelected
																		? 'bg-gray-600 text-gray-400 cursor-not-allowed'
																		: 'bg-gray-700 text-white hover:bg-gray-600'
																}`}
															>
																{product.name}
															</button>
														)
													})}
											</>
										)}
									</div>
								</div>
							)}
						</div>
					</div>
				))}

				<div className='mb-6'>
					<label className='text-white font-bold mb-2 block'>
						Изображение конфигурации
					</label>
					<div
						{...getRootProps({
							className:
								'dropzone p-10 border-4 border-dashed border-blue-500 text-center bg-gray-800 rounded-lg hover:bg-gray-700 transition-all',
						})}
					>
						<input {...getInputProps()} />
						<p className='text-white'>
							Перетащите изображение или нажмите для выбора
						</p>
					</div>
					{imageUrl && (
						<div className='mt-4'>
							<Image
								src={imageUrl}
								alt='Превью'
								width={200}
								height={200}
								className='rounded'
							/>
						</div>
					)}
				</div>

				{Object.keys(selectedProducts).length > 0 && (
					<div className='mt-6'>
						<h2 className='text-white text-xl font-bold mb-4'>
							Полная конфигурация
						</h2>
						<div className='bg-gray-800 p-4 rounded-lg space-y-4'>
							{categories.map(category => {
								const items = selectedProducts[category.id]
								if (!items || items.length === 0) return null

								return (
									<div key={category.id}>
										<h3 className='text-gray-300 font-semibold mb-2'>
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
														className='flex justify-between items-center bg-gray-700 p-2 rounded'
													>
														<span className='text-white'>{product.name}</span>
														<span className='text-gray-300'>
															{item.quantity} × {product.price}$ ={' '}
															<span className='text-white font-bold'>
																{product.price * item.quantity}$
															</span>
														</span>
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

				<button
					onClick={() => {
						setSelectedProducts({})
						setConfigName('')
						setDescription('')
						setCustomPrice('')
						setFile(null)
						setImageUrl(null)
						setExpandedCategories([])
					}}
					className='w-full bg-red-600 hover:bg-red-700 text-white p-3 rounded font-bold mt-4 transition-all'
				>
					Сбросить все
				</button>

				<div className='p-4 rounded mt-6'>
					<h2 className='text-white text-lg font-bold mb-2'>
						Цена конфигурации
					</h2>
					<div className='flex items-center gap-4'>
						<div className='flex flex-col w-1/2'>
							<label className='text-gray-300 mb-1'>Укажите цену</label>
						</div>
						<div className='w-1/2 text-gray-400 text-lg'>
							<p>
								💡 Себестоимость конфигурации:{' '}
								<span className='text-white font-semibold'>
									{calculatedTotalPrice}$
								</span>
							</p>
						</div>
					</div>
				</div>

				<button
					onClick={handleSubmitConfig}
					className='w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded mt-6 font-bold transition-all'
				>
					Создать конфигурацию
				</button>
			</div>
		</div>
	)
}
