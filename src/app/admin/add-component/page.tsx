'use client'

import React, { useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
// import Sidebar from '../components/Sidebar'
// import LoadingOverlay from '../components/LoadingOverlay'
import Image from 'next/image'
import { toast } from 'react-toastify'
import { useRouter } from 'next/navigation'
import 'react-toastify/dist/ReactToastify.css'

interface Component {
	name: string
	price: number
	brand: string
	image_url: string
    hidden?: boolean
    category_id?: number
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
	const [categories, setCategories] = useState<{ id: number; name: string }[]>(
		[]
	)
	const [isUploading, setIsUploading] = useState<boolean>(false)
	const [isLoading, setIsLoading] = useState(true)
	const [selectedCategory, setSelectedCategory] = useState<number>(1)
	const [componentData, setComponentData] = useState<Component>({
		name: '',
		price: 0,
		brand: '',
		image_url: '',
        hidden: false,
	})
	const [file, setFile] = useState<File | null>(null)
	const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
	const router = useRouter()

	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const res = await fetch('/api/products')
				const data = await res.json()
				setCategories(data.categories || [])
			} catch (error) {
				console.error('Ошибка при загрузке категорий:', error)
			}
			setIsLoading(false)
		}
		fetchCategories()
	}, [])

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target
		setComponentData(prev => ({
			...prev,
			[name]: value,
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
					throw new Error('Cloudinary configuration missing')
				}

				const formData = new FormData()
				formData.append('file', file)
				formData.append('upload_preset', uploadPreset) // Use the actual environment variable
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
				console.log('Upload response:', data) // Add logging to see the response

				if (!data.secure_url) {
					throw new Error('Не удалось получить ссылку на изображение')
				}

				setIsUploading(false)
				return data.secure_url
			} catch (error) {
				console.error('Ошибка загрузки изображения:', error)
				setIsUploading(false)
				toast.error('Ошибка загрузки изображения!') // Add toast notification for upload errors
				return null
			}
		}
		return null
	}

const handleSubmit = async () => {
	try {
		// Validate required fields first
		if (!componentData.name || componentData.price <= 0) {
			toast.error('Пожалуйста, заполните все обязательные поля')
			return
		}

		// Upload image and handle potential errors
		const imageUrl = await uploadImage()
		if (!imageUrl) {
			toast.error('Не удалось загрузить изображение')
			return
		}

		// Prepare data with proper types
		const productData = {
			name: componentData.name,
			price: Number(componentData.price), // Ensure price is a number
			brand: componentData.brand || '', // Provide default for brand
			image_url: imageUrl,
			category_id: Number(selectedCategory), // Ensure category_id is a number
			hidden: componentData.hidden || false, // Provide default for hidden
		}

		console.log('Sending data to API:', productData)

		const res = await fetch('/api/products', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(productData),
		})

		// Check if the response is valid before attempting to parse JSON
		if (!res.ok) {
			const responseText = await res.text() // Read response body as text
			throw new Error(responseText || 'Ошибка при сохранении')
		}

		const responseData = await res.json()

		toast.success('Продукт успешно добавлен!')

		// Clear form
		setComponentData({
			name: '',
			price: 0,
			brand: '',
			image_url: '',
			hidden: false,
		})
		setFile(null)
		setPreviewImageUrl(null)
	} catch (error) {
		console.error('Ошибка при добавлении продукта:', error)
		toast.error(
			(error instanceof Error ? error.message : 'Ошибка при добавлении продукта!')
		)
	}
}




	// if (isLoading) return <LoadingOverlay />

	return (
		<div className='p-6 bg-[#171C1F] min-h-screen'>
			{/* <Sidebar /> */}
			<h1 className='text-3xl text-white mb-6 ml-72 font-bold'>
				Добавить продукт
			</h1>
			<div className='bg-[#202529] p-6 rounded-lg shadow-lg w-full max-w-4xl mx-auto'>
				{/* Категории */}
				<div className='mb-4'>
					<label className='text-white text-sm font-bold flex mb-2'>
						Категория:
					</label>
					<select
						value={selectedCategory}
						onChange={e => setSelectedCategory(Number(e.target.value))}
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
				</div>



				{/* Upload */}
				<div className='mb-10'>
					<label className='text-white text-sm flex mb-2 font-bold'>
						Загрузите изображение:
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
					{/* {isUploading && <LoadingOverlay />} */}
				</div>

				{/* Кнопки */}
				<div className='flex space-x-4 mt-6'>
					<button
						onClick={handleSubmit}
						className='bg-[#0C6FFC] text-white py-2 px-6 rounded-lg w-full font-bold'
					>
						Добавить
					</button>
					<button
						onClick={() => window.history.back()}
						className='bg-slate-700 text-white py-2 px-6 rounded-lg w-full font-bold'
					>
						Отмена
					</button>
				</div>
			</div>
		</div>
	)
}
