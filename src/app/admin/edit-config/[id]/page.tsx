'use client'

import { useEffect, useState } from 'react'
import Sidebar from '../../_components/Sidebar'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'react-toastify'
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

export default function EditConfigurationPage() {
	const { id } = useParams<{ id: string }>()
	const router = useRouter()

	const [categories, setCategories] = useState<Category[]>([])
	const [components, setComponents] = useState<Product[]>([])
	const [configName, setConfigName] = useState('')
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

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [productsRes, configRes] = await Promise.all([
					fetch('/api/products'),
					fetch(`/api/configurations/${id}`),
				])

				const productsData = await productsRes.json()
				const configData = await configRes.json()

				if (!productsRes.ok || !configRes.ok) {
					throw new Error('Ошибка загрузки данных')
				}

				setCategories(productsData.categories)
				setComponents(productsData.components)

				setConfigName(configData.name)
				setDescription(configData.description)
				setImageUrl(configData.image_url)
				setCustomPrice(configData.price)

				const selected: Record<number, SelectedProduct[]> = {}

				for (const prod of configData.products) {
					if (!selected[prod.category_id]) {
						selected[prod.category_id] = []
					}
					selected[prod.category_id].push({
						product_id: prod.id,
						quantity: 1, // Пока по умолчанию 1
					})
				}
				setSelectedProducts(selected)

				setIsLoading(false)
			} catch (error) {
				toast.error('Ошибка при загрузке данных')
				setIsLoading(false)
			}
		}
		fetchData()
	}, [id])

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

				const formData = new FormData()
				formData.append('file', file)
				formData.append('upload_preset', uploadPreset as string)
				formData.append('folder', 'configurations')

				const res = await fetch(
					`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
					{
						method: 'POST',
						body: formData,
					}
				)

				const data = await res.json()
				setIsUploading(false)

				if (!res.ok) {
					throw new Error('Ошибка загрузки изображения')
				}

				return data.secure_url
			} catch (error) {
				toast.error('Ошибка загрузки изображения')
				setIsUploading(false)
				return null
			}
		}
		return imageUrl
	}

	const handleSubmitConfig = async () => {
		try {
			if (!configName) {
				toast.error('Введите название конфигурации')
				return
			}

			const image = await uploadConfigImage()

			const configPayload = {
				name: configName,
				description,
				image_url: image,
				price:
					typeof customPrice === 'number' ? customPrice : calculatedTotalPrice,
				products: Object.values(selectedProducts)
					.flat()
					.map(p => ({ id: p.product_id })),
				hidden: false,
			}

			const response = await fetch(`/api/configurations/${id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(configPayload),
			})

			if (!response.ok) {
				throw new Error('Ошибка при обновлении конфигурации')
			}

			toast.success('Конфигурация обновлена!')
			router.push('/admin/configurations')
		} catch (error) {
			toast.error('Ошибка при обновлении')
		}
	}

	if (isLoading) {
		return <div className='p-6 text-white'>Загрузка...</div>
	}

	return (
		<div className='p-6 bg-[#171C1F] min-h-screen'>
			<Sidebar />
			<h1 className='text-3xl text-white mb-6 ml-72 font-bold'>
				Редактировать конфигурацию
			</h1>
			<div className='bg-[#202529] p-6 rounded-lg shadow-lg w-full max-w-4xl mx-auto'>
				{/* Инпуты название/описание */}
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

				{/* Категории и продукты */}
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
										{components
											.filter(p => p.category_id === category.id)
											.map(product => {
												const isSelected = selectedProducts[category.id]?.some(
													p => p.product_id === product.id
												)
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
									</div>
								</div>
							)}
						</div>
					</div>
				))}

				{/* Картинка */}
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

				{/* Кнопка сохранения */}
				<button
					onClick={handleSubmitConfig}
					className='w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded mt-6 font-bold transition-all'
				>
					Сохранить изменения
				</button>
			</div>
		</div>
	)
}
