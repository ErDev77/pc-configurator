'use client'

import React, { useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { use } from 'react'
import AddCompatibility from '../_components/AddCompatibility'
import { useParams } from 'next/navigation'
import CompatibilitiesList from '../_components/CompatibilitiesList'

interface Component {
	name: string
	price: number
	brand: string
	image_url: string
	hidden: boolean
	category_id: number
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
	const [file, setFile] = useState<File | null>(null)
	const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [isUploading, setIsUploading] = useState(false)
	const router = useRouter()

	useEffect(() => {
		const fetchData = async () => {
			try {
				const res = await fetch(`/api/products/${componentId}`)
				const data = await res.json()

				if (data.product) {
					setComponentData(data.product)
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
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target
		setComponentData(prev => ({
			...prev,
			[name]: value,
		}))
	}

	const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { checked } = e.target
		setComponentData(prev => ({
			...prev,
			hidden: checked,
		}))
	}

	const handleDrop = (acceptedFiles: File[]) => {
		const file = acceptedFiles[0]
		setFile(file)
		setPreviewImageUrl(URL.createObjectURL(file))
	}

	const { getRootProps, getInputProps } = useDropzone({
		onDrop: handleDrop,
	})

	const uploadImage = async (): Promise<string | null> => {
		if (file) {
			setIsUploading(true)

			try {
				const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
				const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

				if (!cloudName || !uploadPreset) {
					throw new Error('Cloudinary config missing')
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

				const data = await res.json()

				if (!data.secure_url) {
					throw new Error('Не удалось получить ссылку на изображение')
				}

				setIsUploading(false)
				return data.secure_url
			} catch (error) {
				console.error('Ошибка загрузки изображения:', error)
				setIsUploading(false)
				toast.error('Ошибка загрузки изображения')
				return null
			}
		}
		return null
	}

	const handleSubmit = async () => {
		try {
			if (!componentData.name || componentData.price <= 0) {
				toast.error('Пожалуйста, заполните обязательные поля')
				return
			}

			let imageUrl = componentData.image_url

			if (file) {
				const uploadedUrl = await uploadImage()
				if (!uploadedUrl) {
					toast.error('Не удалось загрузить изображение')
					return
				}
				imageUrl = uploadedUrl
			}

			const updatedData = {
				...componentData,
				price: Number(componentData.price),
				image_url: imageUrl,
				category_id: Number(componentData.category_id),
			}

			const response = await fetch(`/api/products/${componentId}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(updatedData),
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.error || 'Ошибка обновления продукта')
			}

			toast.success('Продукт успешно обновлен!')
			router.push('/admin/dashboard') // редирект обратно после успешного сохранения
		} catch (error) {
			console.error('Ошибка при обновлении:', error)
			toast.error(
				error instanceof Error ? error.message : 'Ошибка при обновлении!'
			)
		}
	}

	if (isLoading) return <div className='text-white p-6'>Загрузка...</div>

	return (
		<div className='p-6 bg-[#171C1F] min-h-screen'>
			<h1 className='text-3xl text-white mb-6 ml-72 font-bold'>
				Редактировать продукт
			</h1>
			<div className='bg-[#202529] p-6 rounded-lg shadow-lg w-full max-w-4xl mx-auto'>
				{/* Категории */}
				<div className='mb-4'>
					<label className='text-white text-sm font-bold flex mb-2'>
						Категория:
					</label>
					<select
						value={componentData.category_id}
						onChange={e =>
							setComponentData(prev => ({
								...prev,
								category_id: Number(e.target.value),
							}))
						}
						className='bg-gray-600 text-white p-2 rounded-lg w-full text-sm mb-6'
					>
						{categories.map(category => (
							<option key={category.id} value={category.id}>
								{category.name}
							</option>
						))}
					</select>
				</div>

				{/* Поля формы */}
				<div className='grid grid-rows-6 gap-4 mb-6'>
					<input
						type='text'
						name='name'
						value={componentData.name}
						onChange={handleChange}
						placeholder='Название продукта'
						className='bg-gray-600 text-white p-2 rounded-lg text-sm'
					/>
					<input
						type='number'
						name='price'
						value={componentData.price}
						onChange={handleChange}
						placeholder='Цена'
						className='bg-gray-600 text-white p-2 rounded-lg text-sm'
					/>
					<input
						type='text'
						name='brand'
						value={componentData.brand}
						onChange={handleChange}
						placeholder='Бренд'
						className='bg-gray-600 text-white p-2 rounded-lg text-sm'
					/>
					<div className='flex items-center space-x-2'>
						<input
							type='checkbox'
							id='hidden'
							checked={componentData.hidden}
							onChange={handleCheckboxChange}
							className='w-4 h-4'
						/>
						<label htmlFor='hidden' className='text-white text-sm'>
							Скрыть продукт
						</label>
					</div>
				</div>

				{/* Upload */}
				<div className='mb-10'>
					<label className='text-white text-sm flex mb-2 font-bold'>
						Изображение:
					</label>
					<div
						{...getRootProps({
							className:
								'dropzone p-20 border-4 border-dashed border-blue-500 text-center bg-gray-800 rounded-lg hover:bg-gray-700 transition-all',
						})}
					>
						<input {...getInputProps()} />
						<p className='text-white'>Перетащите файл или нажмите для выбора</p>
					</div>
					{previewImageUrl && !isUploading && (
						<div className='mt-4'>
							<Image
								src={previewImageUrl}
								width={100}
								height={100}
								alt='Предпросмотр'
								className='rounded-lg'
							/>
						</div>
					)}
				</div>

				{/* Кнопки */}
				<div className='flex space-x-4 mt-6'>
					<button
						onClick={handleSubmit}
						className='bg-[#0C6FFC] text-white py-2 px-6 rounded-lg w-full font-bold'
					>
						Сохранить изменения
					</button>
					<button
						onClick={() => router.back()}
						className='bg-slate-700 text-white py-2 px-6 rounded-lg w-full font-bold'
					>
						Отмена
					</button>
				</div>
				<AddCompatibility componentId={componentId} />
                			<CompatibilitiesList componentId={componentId} />

			</div>
		</div>
	)
}
