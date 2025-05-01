'use client'

import React, { useState, useEffect } from 'react'
import { Globe, Save, X } from 'lucide-react'
import { toast } from 'react-toastify'

interface CategoryLanguageFormProps {
	categoryId: number
	initialNames: {
		name: string
		name_en?: string
		name_ru?: string
		name_am?: string
	}
	onSave: (categoryId: number, names: Record<string, string>) => Promise<void>
	onCancel: () => void
}

const CategoryLanguageForm: React.FC<CategoryLanguageFormProps> = ({
	categoryId,
	initialNames,
	onSave,
	onCancel,
}) => {
	const [categoryNames, setCategoryNames] = useState({
		name_en: initialNames.name_en || initialNames.name || '',
		name_ru: initialNames.name_ru || '',
		name_am: initialNames.name_am || '',
	})
	const [isSaving, setIsSaving] = useState(false)

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target
		setCategoryNames(prev => ({
			...prev,
			[name]: value,
		}))
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		// Validate that at least English name is provided
		if (!categoryNames.name_en) {
			toast.error('English category name is required')
			return
		}

		setIsSaving(true)
		try {
			await onSave(categoryId, categoryNames)
			toast.success('Category names updated successfully')
		} catch (error) {
			console.error('Error updating category names:', error)
			toast.error('Failed to update category names')
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<div className='bg-[#2A2F35] p-4 rounded-lg border border-gray-700 mt-2'>
			<h4 className='text-white text-lg mb-3 flex items-center'>
				<Globe className='mr-2 h-5 w-5 text-blue-400' />
				Category Translations
			</h4>

			<form onSubmit={handleSubmit} className='space-y-3'>
				<div>
					<label className='block text-sm font-medium text-gray-300 mb-1'>
						English Name (Default) <span className='text-red-500'>*</span>
					</label>
					<input
						type='text'
						name='name_en'
						value={categoryNames.name_en}
						onChange={handleChange}
						className='w-full bg-[#1A1D21] border border-gray-600 text-white px-3 py-2 rounded-lg focus:ring-blue-500 focus:border-blue-500'
						required
					/>
				</div>

				<div>
					<label className='block text-sm font-medium text-gray-300 mb-1'>
						Russian Name
					</label>
					<input
						type='text'
						name='name_ru'
						value={categoryNames.name_ru}
						onChange={handleChange}
						className='w-full bg-[#1A1D21] border border-gray-600 text-white px-3 py-2 rounded-lg focus:ring-blue-500 focus:border-blue-500'
					/>
				</div>

				<div>
					<label className='block text-sm font-medium text-gray-300 mb-1'>
						Armenian Name
					</label>
					<input
						type='text'
						name='name_am'
						value={categoryNames.name_am}
						onChange={handleChange}
						className='w-full bg-[#1A1D21] border border-gray-600 text-white px-3 py-2 rounded-lg focus:ring-blue-500 focus:border-blue-500'
					/>
				</div>

				<div className='flex space-x-3 pt-2'>
					<button
						type='submit'
						disabled={isSaving}
						className={`flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors ${
							isSaving ? 'opacity-70 cursor-not-allowed' : ''
						}`}
					>
						{isSaving ? (
							<>
								<span className='animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full mr-2'></span>
								Saving...
							</>
						) : (
							<>
								<Save className='h-4 w-4 mr-2' />
								Save Names
							</>
						)}
					</button>

					<button
						type='button'
						onClick={onCancel}
						className='flex items-center bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors'
					>
						<X className='h-4 w-4 mr-2' />
						Cancel
					</button>
				</div>
			</form>
		</div>
	)
}

export default CategoryLanguageForm
