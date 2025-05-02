'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useParams } from 'next/navigation'
import AddCompatibility from '../_components/AddCompatibility'
import CompatibilitiesList from '../_components/CompatibilitiesList'
import SpecificationsTab from '../../_components/SpecificationsTab'
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
	Globe,
	Layout,
} from 'lucide-react'
import Sidebar from '../../_components/Sidebar'
import DefaultSpecsTab from '../../_components/DefaultSpecsTab'

interface Component {
	name: string
	price: number
	brand: string
	image_url: string
	hidden: boolean
	category_id: number
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

interface HistoryItem {
	date: string
	action: string
}

export default function EditComponentPage() {
	const params = useParams()
	const componentId = Number(params.id)

	const [categories, setCategories] = useState<Category[]>([])
	const [useDefaultSpecs, setUseDefaultSpecs] = useState<boolean>(true)

	const [componentData, setComponentData] = useState<Component>({
		name: '',
		price: 0,
		brand: '',
		image_url: '',
		hidden: false,
		category_id: 1,
		specs_en: [],
		specs_ru: [],
		specs_am: [],
	})
	const [originalData, setOriginalData] = useState<Component | null>(null)
	const [file, setFile] = useState<File | null>(null)
	const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [isUploading, setIsUploading] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [showCompatibility, setShowCompatibility] = useState(true)
	const [activeTab, setActiveTab] = useState<'general' | 'specs'>('general')
	const [changeHistory, setChangeHistory] = useState<HistoryItem[]>([
		{ date: '24 Apr 2025', action: 'Product created' },
		{ date: '25 Apr 2025', action: 'Price changed' },
	])
	const [showHistory, setShowHistory] = useState(false)
	const router = useRouter()

	useEffect(() => {
		const fetchData = async () => {
			try {
				const res = await fetch(`/api/products/${componentId}`)
				const data = await res.json()

				if (data.product) {
					// Set default empty arrays for specs if they're missing
					const productWithSpecs = {
						...data.product,
						specs_en: data.product.specs_en || [],
						specs_ru: data.product.specs_ru || [],
						specs_am: data.product.specs_am || [],
					}

					setComponentData(productWithSpecs)
					setOriginalData(productWithSpecs)
					setPreviewImageUrl(data.product.image_url)
				} else {
					toast.error('Component not found')
				}
			} catch (error) {
				console.error('Error fetching data:', error)
				toast.error('Error loading data')
			}
			setIsLoading(false)
		}

		const fetchCategories = async () => {
			try {
				// Fetch with pagination to get all categories
				const res = await fetch('/api/products?page=1&pageSize=1000')
				const data = await res.json()

				// Format categories properly
				const formattedCategories = data.categories.map((category: any) => ({
					id: category.id,
					name: category.name,
					name_en: category.name_en || category.name,
					name_ru: category.name_ru === '[null]' ? '' : category.name_ru || '',
					name_am: category.name_am === '[null]' ? '' : category.name_am || '',
				}))

				setCategories(formattedCategories || [])
				console.log('Loaded categories:', formattedCategories)
			} catch (error) {
				console.error('Error loading categories:', error)
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

	const handleSpecsChange = useCallback(
		(field: keyof Component, value: string[]) => {
			// Check if the value actually changed before updating state
			if (JSON.stringify(componentData[field]) !== JSON.stringify(value)) {
				setComponentData(prev => ({
					...prev,
					[field]: value,
				}))
			}
		},
		[componentData]
	)

	const handleDrop = (acceptedFiles: File[]) => {
		if (acceptedFiles.length === 0) return

		const file = acceptedFiles[0]
		setFile(file)
		setPreviewImageUrl(URL.createObjectURL(file))
		toast.info('Image selected')
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
					console.error('Upload error:', errorData)
					throw new Error(`Error uploading image. Status: ${res.status}`)
				}

				const data = await res.json()

				if (!data.secure_url) {
					throw new Error('Failed to get image URL')
				}

				setIsUploading(false)
				return data.secure_url
			} catch (error) {
				console.error('Image upload error:', error)
				setIsUploading(false)
				toast.error('Image upload error!')
				return null
			}
		}
		return null
	}

	const handleSubmit = async () => {
		try {
			// Validate required fields
			if (!componentData.name) {
				toast.error('Please enter the product name')
				return
			}

			if (componentData.price <= 0) {
				toast.error('Price must be greater than zero')
				return
			}

			setIsSaving(true)
			// Show loading toast
			const loadingToastId = toast.loading('Updating product...')

			// Upload image only if we have a new file
			let imageUrl = componentData.image_url
			if (file) {
				const uploadedImageUrl = await uploadImage()
				if (!uploadedImageUrl) {
					toast.dismiss(loadingToastId)
					toast.error('Failed to upload image')
					setIsSaving(false)
					return
				}
				imageUrl = uploadedImageUrl
				if (!imageUrl) {
					toast.dismiss(loadingToastId)
					toast.error('Failed to upload image')
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
				specs_en: componentData.specs_en || [],
				specs_ru: componentData.specs_ru || [],
				specs_am: componentData.specs_am || [],
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
				throw new Error(errorData.error || 'Product update error')
			}

			// Update history
			setChangeHistory(prev => [
				{
					date: new Date().toLocaleDateString('en-US'),
					action: 'Product updated',
				},
				...prev,
			])

			// Update original data
			setOriginalData(updatedData)

			// Clear file selection since it's already uploaded
			setFile(null)

			toast.success('Product updated successfully!')
		} catch (error) {
			console.error('Update error:', error)
			toast.error(error instanceof Error ? error.message : 'Update error!')
			setIsSaving(false)
		}
	}

	const resetForm = () => {
		if (originalData) {
			setComponentData(originalData)
			setPreviewImageUrl(originalData.image_url)
			setFile(null)
			toast.info('Changes canceled')
		}
	}

	// Get category name (prioritizing English)
	const getCategoryName = (category: Category): string => {
		return category.name_en || category.name || `Category ${category.id}`
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
				<div className='flex justify-between items-center mb-8'>
					<div className='flex items-center'>
						<button
							onClick={() => router.back()}
							className='mr-4 p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors'
							title='Go back'
						>
							<ArrowLeft className='h-5 w-5 text-white' />
						</button>
						<h1 className='text-3xl text-white font-bold flex items-center'>
							<span className='mr-3 p-1.5 bg-blue-500 rounded-lg'>
								<Tag className='h-6 w-6 text-white' />
							</span>
							Edit Product
						</h1>
					</div>
					<div className='flex items-center'>
						<button
							onClick={() => setShowHistory(!showHistory)}
							className='bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg mr-3 flex items-center'
						>
							<History className='h-4 w-4 mr-2' />
							History
						</button>
						<button
							onClick={resetForm}
							className='bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg mr-3'
						>
							Cancel Changes
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
									Saving...
								</>
							) : (
								<>
									<Save className='h-4 w-4 mr-2' />
									Save
								</>
							)}
						</button>
					</div>
				</div>

				{showHistory && (
					<div className='bg-[#202529] mb-6 p-4 rounded-xl border border-gray-700 shadow-lg'>
						<h3 className='text-lg text-white mb-3 font-bold flex items-center'>
							<History className='h-5 w-5 mr-2 text-blue-400' />
							Change History
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

				{/* Tabs */}
				<div className='flex mb-6 border-b border-gray-700'>
					<button
						onClick={() => setActiveTab('general')}
						className={`px-5 py-3 rounded-t-lg flex items-center ${
							activeTab === 'general'
								? 'bg-[#202529] text-white border-b-2 border-blue-500'
								: 'text-gray-400 hover:bg-[#1A1D21] hover:text-white'
						}`}
					>
						<Layout className='h-5 w-5 mr-2' />
						<span>General Information</span>
					</button>
					<button
						onClick={() => setActiveTab('specs')}
						className={`px-5 py-3 rounded-t-lg flex items-center ${
							activeTab === 'specs'
								? 'bg-[#202529] text-white border-b-2 border-blue-500'
								: 'text-gray-400 hover:bg-[#1A1D21] hover:text-white'
						}`}
					>
						<Globe className='h-5 w-5 mr-2' />
						<span>Specifications</span>
					</button>
				</div>

				<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
					{/* Left column - Product Form */}
					<div>
						{activeTab === 'general' && (
							<div className='bg-[#202529] p-8 rounded-2xl shadow-2xl border border-gray-700'>
								<h2 className='text-xl text-white mb-6 font-bold flex items-center'>
									<Tag className='h-5 w-5 mr-2 text-blue-400' />
									Product Information
								</h2>

								<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
									{/* Left column - Form Fields */}
									<div>
										<div className='mb-6'>
											<label className='text-white text-sm font-medium flex mb-2'>
												<Tag className='h-4 w-4 mr-2 text-blue-400' />
												Category:
											</label>
											<select
												name='category_id'
												value={componentData.category_id}
												onChange={handleChange}
												className='bg-[#2C3136] text-white p-3 rounded-xl w-full border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all'
											>
												{categories.map(category => (
													<option key={category.id} value={category.id}>
														{getCategoryName(category)}
													</option>
												))}
											</select>
										</div>

										<div className='mb-6'>
											<label className='text-white text-sm font-medium flex mb-2'>
												<Tag className='h-4 w-4 mr-2 text-blue-400' />
												Product Name:
											</label>
											<input
												type='text'
												name='name'
												value={componentData.name}
												onChange={handleChange}
												placeholder='Enter product name'
												className='bg-[#2C3136] text-white p-3 rounded-xl w-full border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all'
											/>
										</div>

										<div className='mb-6'>
											<label className='text-white text-sm font-medium flex mb-2'>
												<DollarSign className='h-4 w-4 mr-2 text-blue-400' />
												Price:
											</label>
											<input
												type='number'
												name='price'
												value={componentData.price}
												onChange={handleChange}
												placeholder='Product price'
												className='bg-[#2C3136] text-white p-3 rounded-xl w-full border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all'
											/>
										</div>

										<div className='mb-6'>
											<label className='text-white text-sm font-medium flex mb-2'>
												<Briefcase className='h-4 w-4 mr-2 text-blue-400' />
												Brand:
											</label>
											<input
												type='text'
												name='brand'
												value={componentData.brand}
												onChange={handleChange}
												placeholder='Enter product brand'
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
													Hide product
												</span>
											</label>
										</div>
									</div>

									{/* Right column - Image Upload */}
									<div>
										<label className='text-white text-sm font-medium flex mb-2'>
											<ImageIcon className='h-4 w-4 mr-2 text-blue-400' />
											Product Image:
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
														alt='Preview'
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
														title='Delete'
													>
														<Trash size={16} />
													</button>
												</div>
											) : (
												<div className='text-center'>
													<ImageIcon className='mx-auto h-12 w-12 text-gray-400' />
													<p className='mt-2 text-sm text-gray-300'>
														Drag and drop an image here or click to select
													</p>
													<p className='mt-1 text-xs text-gray-400'>
														PNG, JPG, WEBP up to 5MB
													</p>
												</div>
											)}
										</div>

										<div className='mt-4 bg-[#2C3136] p-4 rounded-lg border border-gray-700'>
											<h4 className='text-white text-sm font-medium mb-2'>
												Component Preview:
											</h4>
											<div className='bg-[#1A1D21] p-4 rounded-lg flex items-center'>
												<div className='w-16 h-16 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0'>
													{componentData.image_url && (
														<img
															src={previewImageUrl || componentData.image_url}
															alt='Preview'
															className='w-full h-full object-cover'
														/>
													)}
												</div>
												<div className='ml-4'>
													<h3 className='text-white font-medium'>
														{componentData.name || 'Product Name'}
													</h3>
													<div className='flex items-center mt-1'>
														<span className='text-gray-400 text-xs mr-2'>
															{componentData.brand || 'Brand'}
														</span>
														<span className='text-blue-400 font-bold'>
															${componentData.price}
														</span>
													</div>
													{componentData.hidden && (
														<span className='text-yellow-500 text-xs flex items-center mt-1'>
															<EyeOff className='h-3 w-3 mr-1' />
															Hidden
														</span>
													)}
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						)}

						{activeTab === 'specs' && (
							<div>
								<div className='bg-[#202529] p-4 rounded-lg mb-4 border border-gray-700'>
									<div className='flex items-center justify-between mb-2'>
										<h3 className='text-white font-medium'>
											Specification Format
										</h3>
										<div className='flex items-center'>
											<label className='mr-2 text-gray-400 text-sm cursor-pointer'>
												<input
													type='radio'
													checked={useDefaultSpecs}
													onChange={() => setUseDefaultSpecs(true)}
													className='mr-1'
												/>
												Template Parameters
											</label>
											<label className='text-gray-400 text-sm cursor-pointer'>
												<input
													type='radio'
													checked={!useDefaultSpecs}
													onChange={() => setUseDefaultSpecs(false)}
													className='mr-1'
												/>
												Free Input
											</label>
										</div>
									</div>
									<p className='text-gray-400 text-sm'>
										Choose template parameters for the category or free input to
										create custom specifications.
									</p>
								</div>

								{useDefaultSpecs ? (
									<DefaultSpecsTab
										categoryId={componentData.category_id}
										specs_en={componentData.specs_en || []}
										specs_ru={componentData.specs_ru || []}
										specs_am={componentData.specs_am || []}
										onChange={(field, value) =>
											handleSpecsChange(field as keyof Component, value)
										}
									/>
								) : (
									<SpecificationsTab
										specs_en={componentData.specs_en || []}
										specs_ru={componentData.specs_ru || []}
										specs_am={componentData.specs_am || []}
										onChange={(field, value) =>
											handleSpecsChange(field as keyof Component, value)
										}
									/>
								)}
							</div>
						)}
					</div>

					{/* Right column - Compatibility Section */}
					<div className='space-y-6'>
						<button
							onClick={() => setShowCompatibility(!showCompatibility)}
							className='bg-[#202529] text-white p-4 rounded-xl w-full flex justify-between items-center hover:bg-[#252A30] transition-colors border border-gray-700 shadow-lg'
						>
							<span className='font-medium text-lg flex items-center'>
								<CheckCircle className='h-5 w-5 mr-2 text-blue-400' />
								Manage Compatibility
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
