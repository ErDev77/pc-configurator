'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { toast, ToastContainer } from 'react-toastify'
import { useRouter } from 'next/navigation'
import 'react-toastify/dist/ReactToastify.css'
import {
	AlertCircle,
	ChevronDown,
	ChevronUp,
	Trash,
	Globe,
	Layout,
} from 'lucide-react'
import AddCompatibility from '../edit-component/_components/AddCompatibility'
import CompatibilitiesList from '../edit-component/_components/CompatibilitiesList'
import SpecificationsTab from '../_components/SpecificationsTab'
import Sidebar from '../_components/Sidebar'
import DefaultSpecsTab from '../_components/DefaultSpecsTab'

interface Component {
	name: string
	price: number
	brand: string
	image_url: string
	hidden: boolean
	category_id?: number
	specs_en?: string[]
	specs_ru?: string[]
	specs_am?: string[]
}

interface Category {
	id: number
	name: string
	name_en?: string
	name_ru?: string
	name_am?: string
}

const textToJson = (
	text: string
): Record<string, string | number | boolean | object> | undefined => {
	try {
		const lines = text.split('\n')
		const json: Record<string, string | number | boolean | object> = {}
		lines.forEach(line => {
			const [key, value] = line.split(': ')
			if (key && value) {
				try {
					const parsedValue = JSON.parse(value)
					if (
						typeof parsedValue === 'string' ||
						typeof parsedValue === 'number' ||
						typeof parsedValue === 'boolean' ||
						typeof parsedValue === 'object'
					) {
						json[key] = parsedValue
					} else {
						json[key] = value
					}
				} catch {
					json[key] = value
				}
			}
		})
		return json
	} catch (e) {
		console.error('Ошибка при преобразовании текста в JSON:', e)
		return undefined
	}
}

export default function AddComponentPage() {
	const [categories, setCategories] = useState<Category[]>([])
	const [isUploading, setIsUploading] = useState<boolean>(false)
	const [isLoading, setIsLoading] = useState(true)
	const [selectedCategory, setSelectedCategory] = useState<number>(1)
	const [activeTab, setActiveTab] = useState<'general' | 'specs'>('general')
	const [useDefaultSpecs, setUseDefaultSpecs] = useState<boolean>(true)

	const [componentData, setComponentData] = useState<Component>({
		name: '',
		price: 0,
		brand: '',
		image_url: '',
		hidden: false,
		specs_en: [],
		specs_ru: [],
		specs_am: [],
	})
	const [file, setFile] = useState<File | null>(null)
	const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
	const [savedComponentId, setSavedComponentId] = useState<number | null>(null)
	const [showCompatibility, setShowCompatibility] = useState<boolean>(false)
	const router = useRouter()

	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const res = await fetch('/api/products')
				const data = await res.json()
				setCategories(data.categories || [])
			} catch (error) {
				console.error('Ошибка при загрузке категорий:', error)
				toast.error('Не удалось загрузить категории')
			}
			setIsLoading(false)
		}
		fetchCategories()
	}, [])

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>
	) => {
		const { name, value, type } = e.target as HTMLInputElement

		if (type === 'checkbox') {
			const checked = (e.target as HTMLInputElement).checked
			setComponentData(prev => ({
				...prev,
				[name]: checked,
			}))
		} else {
			setComponentData(prev => ({
				...prev,
				[name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
			}))
		}
	}

	const handleSpecsChange = useCallback((field: string, value: string[]) => {
		setComponentData(prev => ({
			...prev,
			[field]: value,
		}))
	}, [])

	const handleDrop = (acceptedFiles: File[]) => {
		if (acceptedFiles.length === 0) return

		const file = acceptedFiles[0]
		setFile(file)
		setPreviewImageUrl(URL.createObjectURL(file))
		toast.info('Изображение выбрано')
	}

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop: handleDrop,
		accept: {
			'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
		},
		maxFiles: 1,
	})

	const uploadImage = async (): Promise<string | null> => {
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
				formData.append('folder', 'pc-components')

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
				console.log('Upload response:', data)

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

	const handleSubmit = async () => {
		try {
			// Validate required fields first
			if (!componentData.name) {
				toast.error('Пожалуйста, введите название комплектующего')
				return
			}

			if (componentData.price <= 0) {
				toast.error('Цена должна быть больше нуля')
				return
			}

			if (!file && !savedComponentId) {
				toast.error('Пожалуйста, загрузите изображение комплектующего')
				return
			}

			// Show loading toast
			const loadingToastId = toast.loading(
				savedComponentId
					? 'Обновление комплектующего...'
					: 'Создание комплектующего...'
			)

			// Upload image only if we have a new file
			let imageUrl = componentData.image_url
			if (file) {
				const uploadedImageUrl = await uploadImage()
				if (!uploadedImageUrl) {
					toast.dismiss(loadingToastId)
					toast.error('Не удалось загрузить изображение')
					return
				}
				imageUrl = uploadedImageUrl
				if (!imageUrl) {
					toast.dismiss(loadingToastId)
					toast.error('Не удалось загрузить изображение')
					return
				}
			}

			// Prepare data with proper types
			const productData = {
				...(savedComponentId && { id: savedComponentId }),
				name: componentData.name,
				price: Number(componentData.price),
				brand: componentData.brand || '',
				image_url: imageUrl,
				category_id: Number(selectedCategory),
				hidden: componentData.hidden,
				specs_en: componentData.specs_en || [],
				specs_ru: componentData.specs_ru || [],
				specs_am: componentData.specs_am || [],
			}

			console.log('Sending data to API:', productData)

			// Send request to API - POST for new, PUT for update
			const method = savedComponentId ? 'PUT' : 'POST'
			const endpoint = savedComponentId
				? `/api/products/${savedComponentId}`
				: '/api/products'

			const response = await fetch(endpoint, {
				method,
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(productData),
			})

			// Dismiss loading toast
			toast.dismiss(loadingToastId)

			// Get full response text for debugging
			const responseText = await response.text()
			console.log('API Response Status:', response.status)
			console.log('API Response Text:', responseText)

			// Try to parse JSON response
			let responseData
			try {
				responseData = JSON.parse(responseText)
			} catch (e) {
				console.error('Failed to parse response as JSON:', e)
				toast.error('Неверный формат ответа от сервера')
				return
			}

			// Check if response is successful
			if (!response.ok) {
				throw new Error(
					responseData.message || 'Ошибка при сохранении комплектующего'
				)
			}

			// Update the component ID if we created a new one
			if (!savedComponentId && responseData.id) {
				setSavedComponentId(responseData.id)
				setShowCompatibility(true)
				toast.success(
					'Комплектующее успешно создано! Теперь вы можете добавить совместимости.'
				)
			} else {
				toast.success('Комплектующее успешно обновлено!')
			}

			// Clear file selection since it's already uploaded
			setFile(null)
		} catch (error) {
			console.error('Ошибка при добавлении комплектующего:', error)
			toast.error(
				error instanceof Error
					? error.message
					: 'Ошибка при добавлении комплектующего!'
			)
		}
	}

	const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const newCategoryId = Number(e.target.value)
		setSelectedCategory(newCategoryId)
		// Reset specs when changing category if using default specs
		if (useDefaultSpecs) {
			setComponentData(prev => ({
				...prev,
				category_id: newCategoryId,
				specs_en: [],
				specs_ru: [],
				specs_am: [],
			}))
		} else {
			setComponentData(prev => ({
				...prev,
				category_id: newCategoryId,
			}))
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

	return (
		<div className='p-6 bg-gradient-to-b from-[#171C1F] to-[#13161A] min-h-screen'>
			<Sidebar />
			<div className='max-w-7xl mx-auto'>
				<h1 className='text-3xl text-white mb-8 font-bold flex items-center'>
					<svg
						xmlns='http://www.w3.org/2000/svg'
						className='h-8 w-8 mr-3 text-blue-500'
						fill='none'
						viewBox='0 0 24 24'
						stroke='currentColor'
					>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M12 6v6m0 0v6m0-6h6m-6 0H6'
						/>
					</svg>
					{savedComponentId
						? 'Редактирование комплектующего'
						: 'Добавление комплектующего'}
				</h1>

				{/* Tabs */}
				<div className='flex mb-6 border-b border-gray-700'>
					<button
						onClick={() => setActiveTab('general')}
						className={`px-5 py-3 rounded-t-lg ${
							activeTab === 'general'
								? 'bg-[#202529] text-white border-b-2 border-blue-500'
								: 'text-gray-400 hover:bg-[#1A1D21] hover:text-white'
						}`}
					>
						<div className='flex items-center'>
							<Layout className='h-5 w-5 mr-2' />
							<span>Общая информация</span>
						</div>
					</button>
					<button
						onClick={() => setActiveTab('specs')}
						className={`px-5 py-3 rounded-t-lg ${
							activeTab === 'specs'
								? 'bg-[#202529] text-white border-b-2 border-blue-500'
								: 'text-gray-400 hover:bg-[#1A1D21] hover:text-white'
						}`}
					>
						<div className='flex items-center'>
							<Globe className='h-5 w-5 mr-2' />
							<span>Спецификации</span>
						</div>
					</button>
				</div>

				<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
					{/* Left column */}
					<div>
						{activeTab === 'general' && (
							<div className='bg-[#202529] p-8 rounded-2xl shadow-2xl border border-gray-700'>
								<h2 className='text-xl text-white mb-6 font-bold flex items-center'>
									<svg
										xmlns='http://www.w3.org/2000/svg'
										className='h-5 w-5 mr-2 text-blue-400'
										fill='none'
										viewBox='0 0 24 24'
										stroke='currentColor'
									>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											strokeWidth={2}
											d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
										/>
									</svg>
									Основная информация
								</h2>

								<div className='mb-6'>
									<label className='text-white text-sm font-bold flex mb-2'>
										<svg
											xmlns='http://www.w3.org/2000/svg'
											className='h-5 w-5 mr-2 text-blue-400'
											fill='none'
											viewBox='0 0 24 24'
											stroke='currentColor'
										>
											<path
												strokeLinecap='round'
												strokeLinejoin='round'
												strokeWidth={2}
												d='M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'
											/>
										</svg>
										Категория:
									</label>
									<select
										value={selectedCategory}
										onChange={e => setSelectedCategory(Number(e.target.value))}
										className='bg-[#2C3136] text-white p-3 rounded-xl w-full border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all'
									>
										{categories.map(category => (
											<option key={category.id} value={category.id}>
												{category.name}
											</option>
										))}
									</select>
								</div>

								<div className='mb-6'>
									<label className='text-white text-sm font-bold flex mb-2'>
										<svg
											xmlns='http://www.w3.org/2000/svg'
											className='h-5 w-5 mr-2 text-blue-400'
											fill='none'
											viewBox='0 0 24 24'
											stroke='currentColor'
										>
											<path
												strokeLinecap='round'
												strokeLinejoin='round'
												strokeWidth={2}
												d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
											/>
										</svg>
										Название комплектующего:
									</label>
									<input
										type='text'
										name='name'
										value={componentData.name}
										onChange={handleChange}
										placeholder='Введите название продукта'
										className='bg-[#2C3136] text-white p-3 rounded-xl w-full border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all'
									/>
								</div>

								<div className='mb-6'>
									<label className='text-white text-sm font-bold flex mb-2'>
										<svg
											xmlns='http://www.w3.org/2000/svg'
											className='h-5 w-5 mr-2 text-blue-400'
											fill='none'
											viewBox='0 0 24 24'
											stroke='currentColor'
										>
											<path
												strokeLinecap='round'
												strokeLinejoin='round'
												strokeWidth={2}
												d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
											/>
										</svg>
										Цена:
									</label>
									<input
										type='number'
										name='price'
										value={componentData.price}
										onChange={handleChange}
										placeholder='Цена продукта'
										className='bg-[#2C3136] text-white p-3 rounded-xl w-full border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all'
									/>
								</div>

								<div className='mb-6'>
									<label className='text-white text-sm font-bold flex mb-2'>
										<svg
											xmlns='http://www.w3.org/2000/svg'
											className='h-5 w-5 mr-2 text-blue-400'
											fill='none'
											viewBox='0 0 24 24'
											stroke='currentColor'
										>
											<path
												strokeLinecap='round'
												strokeLinejoin='round'
												strokeWidth={2}
												d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
											/>
										</svg>
										Бренд:
									</label>
									<input
										type='text'
										name='brand'
										value={componentData.brand}
										onChange={handleChange}
										placeholder='Введите бренд продукта'
										className='bg-[#2C3136] text-white p-3 rounded-xl w-full border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all'
									/>
								</div>

								<div className='mb-6'>
									<label className='flex items-center cursor-pointer'>
										<input
											type='checkbox'
											name='hidden'
											checked={componentData.hidden}
											onChange={handleChange}
											className='form-checkbox h-5 w-5 text-blue-500 rounded border-gray-500 focus:ring-blue-500'
										/>
										<span className='ml-2 text-white text-sm'>
											Скрыть товар
										</span>
									</label>
								</div>

								<div>
									<label className='text-white text-sm font-bold flex mb-2'>
										<svg
											xmlns='http://www.w3.org/2000/svg'
											className='h-5 w-5 mr-2 text-blue-400'
											fill='none'
											viewBox='0 0 24 24'
											stroke='currentColor'
										>
											<path
												strokeLinecap='round'
												strokeLinejoin='round'
												strokeWidth={2}
												d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
											/>
										</svg>
										Изображение комплектующее:
									</label>
									<div
										{...getRootProps()}
										className={`mt-2 p-6 border-2 border-dashed rounded-xl cursor-pointer flex flex-col items-center justify-center ${
											isDragActive
												? 'border-blue-500 bg-blue-500 bg-opacity-10'
												: 'border-gray-600 hover:border-blue-400 hover:bg-blue-500 hover:bg-opacity-5'
										} transition-all`}
									>
										<input {...getInputProps()} />
										{previewImageUrl ? (
											<div className='relative w-full'>
												<img
													src={previewImageUrl}
													alt='Предпросмотр'
													className='object-contain max-h-48 mx-auto rounded-lg'
												/>
												<button
													type='button'
													onClick={e => {
														e.stopPropagation()
														setFile(null)
														setPreviewImageUrl(null)
													}}
													className='absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors'
												>
													<Trash size={16} />
												</button>
											</div>
										) : componentData.image_url ? (
											<div className='relative w-full'>
												<img
													src={componentData.image_url}
													alt='Текущее изображение'
													className='object-contain max-h-48 mx-auto rounded-lg'
												/>
												<p className='text-xs text-center mt-2 text-gray-400'>
													Перетащите новое изображение, чтобы заменить
												</p>
											</div>
										) : (
											<div className='text-center'>
												<svg
													className='mx-auto h-12 w-12 text-gray-400'
													stroke='currentColor'
													fill='none'
													viewBox='0 0 48 48'
													aria-hidden='true'
												>
													<path
														d='M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02'
														strokeWidth={2}
														strokeLinecap='round'
														strokeLinejoin='round'
													/>
												</svg>
												<p className='mt-2 text-sm text-gray-300'>
													Перетащите изображение сюда или кликните для выбора
												</p>
												<p className='mt-1 text-xs text-gray-400'>
													PNG, JPG, WEBP до 5MB
												</p>
											</div>
										)}
									</div>
								</div>
							</div>
						)}

						{activeTab === 'specs' && (
							<div>
								<div className='bg-[#202529] p-4 rounded-lg mb-4 border border-gray-700'>
									<div className='flex items-center justify-between mb-2'>
										<h3 className='text-white font-medium'>
											Формат спецификаций
										</h3>
										<div className='flex items-center'>
											<label className='mr-2 text-gray-400 text-sm cursor-pointer'>
												<input
													type='radio'
													checked={useDefaultSpecs}
													onChange={() => setUseDefaultSpecs(true)}
													className='mr-1'
												/>
												Шаблонные параметры
											</label>
											<label className='text-gray-400 text-sm cursor-pointer'>
												<input
													type='radio'
													checked={!useDefaultSpecs}
													onChange={() => setUseDefaultSpecs(false)}
													className='mr-1'
												/>
												Свободный ввод
											</label>
										</div>
									</div>
									<p className='text-gray-400 text-sm'>
										Выберите шаблонные параметры для категории или свободный
										ввод для создания собственных спецификаций.
									</p>
								</div>

								{useDefaultSpecs ? (
									<DefaultSpecsTab
										categoryId={selectedCategory}
										specs_en={componentData.specs_en || []}
										specs_ru={componentData.specs_ru || []}
										specs_am={componentData.specs_am || []}
										onChange={handleSpecsChange}
									/>
								) : (
									<SpecificationsTab
										specs_en={componentData.specs_en || []}
										specs_ru={componentData.specs_ru || []}
										specs_am={componentData.specs_am || []}
										onChange={handleSpecsChange}
									/>
								)}
							</div>
						)}

						{/* Buttons */}
						<div className='mt-8 flex flex-col sm:flex-row justify-between gap-4'>
							<button
								onClick={() => router.back()}
								className='px-6 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors flex items-center justify-center'
							>
								<svg
									xmlns='http://www.w3.org/2000/svg'
									className='h-5 w-5 mr-2'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M10 19l-7-7m0 0l7-7m-7 7h18'
									/>
								</svg>
								Назад
							</button>

							<button
								onClick={handleSubmit}
								disabled={isUploading}
								className={`px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors flex items-center justify-center ${
									isUploading ? 'opacity-70 cursor-not-allowed' : ''
								}`}
							>
								{isUploading ? (
									<>
										<div className='animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2'></div>
										Загрузка...
									</>
								) : (
									<>
										<svg
											xmlns='http://www.w3.org/2000/svg'
											className='h-5 w-5 mr-2'
											fill='none'
											viewBox='0 0 24 24'
											stroke='currentColor'
										>
											<path
												strokeLinecap='round'
												strokeLinejoin='round'
												strokeWidth={2}
												d='M5 13l4 4L19 7'
											/>
										</svg>
										{savedComponentId ? 'Обновить продукт' : 'Создать продукт'}
									</>
								)}
							</button>
						</div>
					</div>

					{/* Right column - Compatibility Section */}
					<div className='space-y-6'>
						{savedComponentId ? (
							<>
								<button
									onClick={() => setShowCompatibility(!showCompatibility)}
									className='bg-[#202529] text-white p-4 rounded-xl w-full flex justify-between items-center hover:bg-[#252A30] transition-colors border border-gray-700 shadow-lg'
								>
									<span className='font-medium text-lg flex items-center'>
										<svg
											xmlns='http://www.w3.org/2000/svg'
											className='h-5 w-5 mr-2 text-blue-400'
											fill='none'
											viewBox='0 0 24 24'
											stroke='currentColor'
										>
											<path
												strokeLinecap='round'
												strokeLinejoin='round'
												strokeWidth={2}
												d='M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z'
											/>
										</svg>
										Управление совместимостью
									</span>
									{showCompatibility ? (
										<ChevronUp className='h-5 w-5' />
									) : (
										<ChevronDown className='h-5 w-5' />
									)}
								</button>

								{showCompatibility && (
									<div className='space-y-6'>
										<AddCompatibility componentId={savedComponentId} />
										<CompatibilitiesList componentId={savedComponentId} />
									</div>
								)}
							</>
						) : (
							<div className='bg-[#202529] p-6 rounded-2xl border border-gray-700 shadow-lg'>
								<div className='text-center py-10'>
									<AlertCircle className='h-12 w-12 text-yellow-500 mx-auto mb-4' />
									<h3 className='text-xl text-white font-medium mb-2'>
										Сначала сохраните компонент
									</h3>
									<p className='text-gray-400'>
										После создания комплектующего вы сможете добавить информацию
										о совместимости с другими комплектующими
									</p>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Toast Container */}
			<ToastContainer
				position='bottom-right'
				autoClose={5000}
				hideProgressBar={false}
				newestOnTop
				closeOnClick
				rtl={false}
				pauseOnFocusLoss
				draggable
				pauseOnHover
				theme='dark'
			/>
		</div>
	)
}
