'use client'

import React, { useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useParams } from 'next/navigation'
import AddCompatibility from '../_components/AddCompatibility'
import CompatibilitiesList from '../_components/CompatibilitiesList'
import {
	Trash,
	ChevronDown,
	ChevronUp,
	Loader2,
	Save,
	ArrowLeft,
	Image as ImageIcon,
	Tag,
	DollarSign,
	Briefcase,
	EyeOff,
	CheckCircle,
	History,
} from 'lucide-react'
import Sidebar from '../../_components/Sidebar'

interface Component {
	name: string
	price: number
	brand: string
	image_url: string
	hidden: boolean
	category_id: number
}

interface HistoryItem {
	date: string
	action: string
}

export default function EditComponentPage() {
	const params = useParams()
	const componentId = Number(params.id)

	const [categories, setCategories] = useState<{ id: number; name: string }[]>(
		[]
	)
	const [componentData, setComponentData] = useState<Component>({
		name: '',
		price: 0,
		brand: '',
		image_url: '',
		hidden: false,
		category_id: 1,
	})
	const [originalData, setOriginalData] = useState<Component | null>(null)
	const [file, setFile] = useState<File | null>(null)
	const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [isUploading, setIsUploading] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [showCompatibility, setShowCompatibility] = useState(true)
	const [changeHistory, setChangeHistory] = useState<HistoryItem[]>([
		{ date: '24 Apr 2025', action: 'Продукт создан' },
		{ date: '25 Apr 2025', action: 'Изменена цена' },
	])
	const [showHistory, setShowHistory] = useState(false)
	const router = useRouter()

	useEffect(() => {
		const fetchData = async () => {
			try {
				const res = await fetch(`/api/products/${componentId}`)
				const data = await res.json()

				if (data.product) {
					setComponentData(data.product)
					setOriginalData(data.product)
					setPreviewImageUrl(data.product.image_url)
				} else {
					toast.error('Компонент не найден')
				}
			} catch (error) {
				console.error('Ошибка при получении данных:', error)
				toast.error('Ошибка при загрузке данных')
			}
			setIsLoading(false)
		}

		const fetchCategories = async () => {
			try {
				const res = await fetch('/api/products')
				const data = await res.json()
				setCategories(data.categories || [])
			} catch (error) {
				console.error('Ошибка при загрузке категорий:', error)
			}
		}

		fetchData()
		fetchCategories()
	}, [componentId])

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
			// Validate required fields
			if (!componentData.name) {
				toast.error('Пожалуйста, введите название продукта')
				return
			}

			if (componentData.price <= 0) {
				toast.error('Цена должна быть больше нуля')
				return
			}

			setIsSaving(true)
			// Show loading toast
			const loadingToastId = toast.loading('Обновление продукта...')

			// Upload image only if we have a new file
			let imageUrl = componentData.image_url
			if (file) {
				const uploadedImageUrl = await uploadImage()
				if (!uploadedImageUrl) {
					toast.dismiss(loadingToastId)
					toast.error('Не удалось загрузить изображение')
					setIsSaving(false)
					return
				}
				imageUrl = uploadedImageUrl
				if (!imageUrl) {
					toast.dismiss(loadingToastId)
					toast.error('Не удалось загрузить изображение')
					setIsSaving(false)
					return
				}
			}

			// Prepare data with proper types
			const updatedData = {
				...componentData,
				price: Number(componentData.price),
				image_url: imageUrl,
				category_id: Number(componentData.category_id),
			}

			console.log('Sending data to API:', updatedData)

			const response = await fetch(`/api/products/${componentId}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(updatedData),
			})

			// Dismiss loading toast
			toast.dismiss(loadingToastId)
			setIsSaving(false)

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.error || 'Ошибка обновления продукта')
			}

			// Update history
			setChangeHistory(prev => [
				{
					date: new Date().toLocaleDateString('ru-RU'),
					action: 'Продукт обновлен',
				},
				...prev,
			])

			// Update original data
			setOriginalData(updatedData)

			// Clear file selection since it's already uploaded
			setFile(null)

			toast.success('Продукт успешно обновлен!')
		} catch (error) {
			console.error('Ошибка при обновлении:', error)
			toast.error(
				error instanceof Error ? error.message : 'Ошибка при обновлении!'
			)
			setIsSaving(false)
		}
	}

	const resetForm = () => {
		if (originalData) {
			setComponentData(originalData)
			setPreviewImageUrl(originalData.image_url)
			setFile(null)
			toast.info('Изменения отменены')
		}
	}

	if (isLoading) {
		return (
			<div className='fixed inset-0 bg-[#171C1F] bg-opacity-75 flex items-center justify-center z-50'>
				<div className='animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500'></div>
				<span className='ml-4 text-white text-xl'>
					Загрузка данных компонента...
				</span>
			</div>
		)
	}

	return (
		<div className='p-6 bg-gradient-to-b from-[#171C1F] to-[#13161A] min-h-screen'>
			<Sidebar />
			<div className='max-w-7xl mx-auto'>
				<div className='flex justify-between items-center mb-8'>
					<div className='flex items-center'>
						<button
							onClick={() => router.back()}
							className='mr-4 p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors'
							title='Вернуться назад'
						>
							<ArrowLeft className='h-5 w-5 text-white' />
						</button>
						<h1 className='text-3xl text-white font-bold flex items-center'>
							<span className='mr-3 p-1.5 bg-blue-500 rounded-lg'>
								<Tag className='h-6 w-6 text-white' />
							</span>
							Редактирование продукта
						</h1>
					</div>
					<div className='flex items-center'>
						<button
							onClick={() => setShowHistory(!showHistory)}
							className='bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg mr-3 flex items-center'
						>
							<History className='h-4 w-4 mr-2' />
							История
						</button>
						<button
							onClick={resetForm}
							className='bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg mr-3'
						>
							Отменить изменения
						</button>
						<button
							onClick={handleSubmit}
							disabled={isSaving}
							className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors flex items-center ${
								isSaving ? 'opacity-70 cursor-not-allowed' : ''
							}`}
						>
							{isSaving ? (
								<>
									<Loader2 className='h-4 w-4 mr-2 animate-spin' />
									Сохранение...
								</>
							) : (
								<>
									<Save className='h-4 w-4 mr-2' />
									Сохранить
								</>
							)}
						</button>
					</div>
				</div>

				{showHistory && (
					<div className='bg-[#202529] mb-6 p-4 rounded-xl border border-gray-700 shadow-lg'>
						<h3 className='text-lg text-white mb-3 font-bold flex items-center'>
							<History className='h-5 w-5 mr-2 text-blue-400' />
							История изменений
						</h3>
						<div className='max-h-48 overflow-y-auto pr-2 custom-scrollbar'>
							<div className='border-l-2 border-gray-600 pl-4 space-y-3'>
								{changeHistory.map((item, index) => (
									<div key={index} className='relative'>
										<div className='absolute -left-6 top-1 w-2 h-2 rounded-full bg-blue-500'></div>
										<div className='flex items-start'>
											<span className='text-gray-400 text-sm min-w-24'>
												{item.date}
											</span>
											<span className='text-white ml-4'>{item.action}</span>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				)}

				<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
					{/* Left column - Product Form */}
					<div className='bg-[#202529] p-8 rounded-2xl shadow-2xl border border-gray-700'>
						<h2 className='text-xl text-white mb-6 font-bold flex items-center'>
							<Tag className='h-5 w-5 mr-2 text-blue-400' />
							Информация о продукте
						</h2>

						<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
							{/* Left column - Form Fields */}
							<div>
								<div className='mb-6'>
									<label className='text-white text-sm font-medium flex mb-2'>
										<Tag className='h-4 w-4 mr-2 text-blue-400' />
										Категория:
									</label>
									<select
										name='category_id'
										value={componentData.category_id}
										onChange={handleChange}
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
									<label className='text-white text-sm font-medium flex mb-2'>
										<Tag className='h-4 w-4 mr-2 text-blue-400' />
										Название продукта:
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
									<label className='text-white text-sm font-medium flex mb-2'>
										<DollarSign className='h-4 w-4 mr-2 text-blue-400' />
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
									<label className='text-white text-sm font-medium flex mb-2'>
										<Briefcase className='h-4 w-4 mr-2 text-blue-400' />
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
									<label className='flex items-center space-x-2 cursor-pointer'>
										<input
											type='checkbox'
											name='hidden'
											checked={componentData.hidden}
											onChange={handleChange}
											className='form-checkbox h-5 w-5 text-blue-500 rounded border-gray-500 focus:ring-blue-500'
										/>
										<span className='text-white text-sm flex items-center'>
											<EyeOff className='h-4 w-4 mr-2 text-blue-400' />
											Скрыть товар
										</span>
									</label>
								</div>
							</div>

							{/* Right column - Image Upload */}
							<div>
								<label className='text-white text-sm font-medium flex mb-2'>
									<ImageIcon className='h-4 w-4 mr-2 text-blue-400' />
									Изображение продукта:
								</label>
								<div
									{...getRootProps()}
									className={`mt-2 p-6 border-2 border-dashed rounded-xl cursor-pointer flex flex-col items-center justify-center transition-all ${
										isDragActive
											? 'border-blue-500 bg-blue-500 bg-opacity-10'
											: 'border-gray-600 hover:border-blue-400 hover:bg-blue-500 hover:bg-opacity-5'
									}`}
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
													setPreviewImageUrl(componentData.image_url)
												}}
												className='absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors'
												title='Удалить'
											>
												<Trash size={16} />
											</button>
										</div>
									) : (
										<div className='text-center'>
											<ImageIcon className='mx-auto h-12 w-12 text-gray-400' />
											<p className='mt-2 text-sm text-gray-300'>
												Перетащите изображение сюда или кликните для выбора
											</p>
											<p className='mt-1 text-xs text-gray-400'>
												PNG, JPG, WEBP до 5MB
											</p>
										</div>
									)}
								</div>

								<div className='mt-4 bg-[#2C3136] p-4 rounded-lg border border-gray-700'>
									<h4 className='text-white text-sm font-medium mb-2'>
										Предпросмотр компонента:
									</h4>
									<div className='bg-[#1A1D21] p-4 rounded-lg flex items-center'>
										<div className='w-16 h-16 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0'>
											{componentData.image_url && (
												<img
													src={previewImageUrl || componentData.image_url}
													alt='Превью'
													className='w-full h-full object-cover'
												/>
											)}
										</div>
										<div className='ml-4'>
											<h3 className='text-white font-medium'>
												{componentData.name || 'Название продукта'}
											</h3>
											<div className='flex items-center mt-1'>
												<span className='text-gray-400 text-xs mr-2'>
													{componentData.brand || 'Бренд'}
												</span>
												<span className='text-blue-400 font-bold'>
													{componentData.price} ₽
												</span>
											</div>
											{componentData.hidden && (
												<span className='text-yellow-500 text-xs flex items-center mt-1'>
													<EyeOff className='h-3 w-3 mr-1' />
													Скрыт
												</span>
											)}
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Right column - Compatibility Section */}
					<div className='space-y-6'>
						<button
							onClick={() => setShowCompatibility(!showCompatibility)}
							className='bg-[#202529] text-white p-4 rounded-xl w-full flex justify-between items-center hover:bg-[#252A30] transition-colors border border-gray-700 shadow-lg'
						>
							<span className='font-medium text-lg flex items-center'>
								<CheckCircle className='h-5 w-5 mr-2 text-blue-400' />
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
								<AddCompatibility componentId={componentId} />
								<CompatibilitiesList componentId={componentId} />
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
