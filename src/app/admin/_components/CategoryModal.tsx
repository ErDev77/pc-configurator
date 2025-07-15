'use client'

import React, { useState, useEffect } from 'react'
import { X, Save, Globe, AlertTriangle } from 'lucide-react'
import { toast } from 'react-toastify'
import { useLanguage } from '@/context/LanguageContext'

interface CategoryModalProps {
	isOpen: boolean
	onClose: () => void
	onSave: (category: CategoryData) => Promise<void>
	mode: 'create' | 'edit'
	initialData?: CategoryData
	title?: string
}

interface CategoryData {
	id?: number
	name: string
	name_en: string
	name_ru: string
	name_am: string
}

const CategoryModal: React.FC<CategoryModalProps> = ({
	isOpen,
	onClose,
	onSave,
	mode = 'create',
	initialData = { name: '', name_en: '', name_ru: '', name_am: '' },
	title,
}) => {
	const [category, setCategory] = useState<CategoryData>(initialData)
	const [isSaving, setIsSaving] = useState(false)
	const [errors, setErrors] = useState<{ [key: string]: string }>({})
	const [activeTab, setActiveTab] = useState<'en' | 'ru' | 'am'>('en')
	const { t } = useLanguage()

	// Reset form when modal opens/closes or mode changes
	useEffect(() => {
		if (isOpen) {
			setCategory(initialData)
			setErrors({})
		}
	}, [isOpen, initialData, mode])

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target
		setCategory(prev => ({
			...prev,
			[name]: value,
		}))

		// Clear error for this field if value is not empty
		if (value.trim() && errors[name]) {
			setErrors(prev => {
				const newErrors = { ...prev }
				delete newErrors[name]
				return newErrors
			})
		}
	}

	const validateForm = () => {
		const newErrors: { [key: string]: string } = {}

		// English name is required
		if (!category.name_en.trim()) {
			newErrors.name_en = t('categories.nameRequired', {
				defaultValue: 'English name is required',
			})
		}

		// Default name is required
		if (!category.name.trim()) {
			newErrors.name = t('categories.nameRequired', {
				defaultValue: 'Primary name is required',
			})
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!validateForm()) {
			return
		}

		setIsSaving(true)
		try {
			await onSave(category)
			onClose()
			toast.success(
				mode === 'create'
					? t('notification.categoryAdded', {
							defaultValue: 'Category successfully added',
					  })
					: t('notification.categoryUpdated', {
							defaultValue: 'Category successfully updated',
					  })
			)
		} catch (error) {
			console.error('Error saving category:', error)
			toast.error(
				error instanceof Error
					? error.message
					: t('common.error', {
							defaultValue: 'An error occurred while saving',
					  })
			)
		} finally {
			setIsSaving(false)
		}
	}

	if (!isOpen) return null

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xs overflow-y-auto'>
			<div className='bg-[#202529] rounded-xl shadow-xl w-full max-w-md mx-4 md:mx-auto'>
				{/* Header */}
				<div className='flex items-center justify-between border-b border-gray-700 p-4'>
					<h2 className='text-xl font-semibold text-white'>
						{title ||
							(mode === 'create'
								? 'Добавить категорию'
								: 'Редактировать категорию')}
					</h2>
					<button
						onClick={onClose}
						className='p-1 rounded-full hover:bg-gray-700 transition-colors text-gray-400 hover:text-white'
						aria-label='Close'
					>
						<X size={20} />
					</button>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className='p-6'>
					{/* Primary name field */}
					<div className='mb-6'>
						<label className='block text-sm font-medium text-gray-300 mb-2'>
							{'Название категории'} <span className='text-red-500'>*</span>
						</label>
						<input
							type='text'
							name='name'
							value={category.name}
							onChange={handleChange}
							className={`w-full bg-[#2C3136] text-white p-3 rounded-lg border ${
								errors.name ? 'border-red-500' : 'border-gray-600'
							} focus:outline-none focus:ring-2 focus:ring-blue-500`}
							placeholder='Название категории'
						/>
						{errors.name && (
							<p className='mt-1 text-sm text-red-500'>{errors.name}</p>
						)}
					</div>

					{/* Language tabs */}
					<div className='mb-6'>
						<h3 className='flex items-center gap-2 mb-3 text-base font-medium text-gray-300'>
							<Globe className='w-4 h-4 text-blue-400' />
							{'Языковые переводы'}
						</h3>

						<div className='flex border-b border-gray-700 mb-4'>
							<button
								type='button'
								onClick={() => setActiveTab('en')}
								className={`py-2 px-4 font-medium ${
									activeTab === 'en'
										? 'border-b-2 border-blue-500 text-blue-400'
										: 'text-gray-400 hover:text-gray-300'
								}`}
							>
								🇺🇸 Английский
							</button>
							<button
								type='button'
								onClick={() => setActiveTab('ru')}
								className={`py-2 px-4 font-medium ${
									activeTab === 'ru'
										? 'border-b-2 border-blue-500 text-blue-400'
										: 'text-gray-400 hover:text-gray-300'
								}`}
							>
								🇷🇺 Русский
							</button>
							<button
								type='button'
								onClick={() => setActiveTab('am')}
								className={`py-2 px-4 font-medium ${
									activeTab === 'am'
										? 'border-b-2 border-blue-500 text-blue-400'
										: 'text-gray-400 hover:text-gray-300'
								}`}
							>
								🇦🇲 Армянский
							</button>
						</div>

						{/* English field */}
						{activeTab === 'en' && (
							<div>
								<label className='block text-sm font-medium text-gray-300 mb-2'>
									{'Название на английском'}{' '}
									<span className='text-red-500'>*</span>
								</label>
								<input
									type='text'
									name='name_en'
									value={category.name_en}
									onChange={handleChange}
									className={`w-full bg-[#2C3136] text-white p-3 rounded-lg border ${
										errors.name_en ? 'border-red-500' : 'border-gray-600'
									} focus:outline-none focus:ring-2 focus:ring-blue-500`}
								/>
								{errors.name_en && (
									<p className='mt-1 text-sm text-red-500'>{errors.name_en}</p>
								)}
							</div>
						)}

						{/* Russian field */}
						{activeTab === 'ru' && (
							<div>
								<label className='block text-sm font-medium text-gray-300 mb-2'>
									{'Название на русском'}{' '}
									<span className='text-red-500'>*</span>
								</label>
								<input
									type='text'
									name='name_ru'
									value={category.name_ru}
									onChange={handleChange}
									className='w-full bg-[#2C3136] text-white p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500'
								/>
							</div>
						)}

						{/* Armenian field */}
						{activeTab === 'am' && (
							<div>
								<label className='block text-sm font-medium text-gray-300 mb-2'>
									{'Название на армянском'}{' '}
									<span className='text-red-500'>*</span>
								</label>
								<input
									type='text'
									name='name_am'
									value={category.name_am}
									onChange={handleChange}
									className='w-full bg-[#2C3136] text-white p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500'
									
								/>
							</div>
						)}
					</div>

					{/* Action buttons */}
					<div className='flex justify-end gap-3 mt-8'>
						<button
							type='button'
							onClick={onClose}
							className='px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors'
						>
							{t('common.cancel', { defaultValue: 'Cancel' })}
						</button>
						<button
							type='submit'
							disabled={isSaving}
							className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
						>
							<Save className='w-4 h-4' />
							{isSaving
								? t('common.saving', { defaultValue: 'Saving...' })
								: t('common.save', { defaultValue: 'Save' })}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}

export default CategoryModal
