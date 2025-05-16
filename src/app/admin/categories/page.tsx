'use client'

import React, { useState, useEffect } from 'react'
import {
	PlusCircle,
	Search,
	Edit2,
	Trash2,
	Globe,
	ChevronRight,
	AlertCircle,
	Clock,
	Loader2,
	RefreshCw,
	X,
} from 'lucide-react'
import { toast } from 'react-toastify'
import { useLanguage } from '@/context/LanguageContext'
import Sidebar from '../_components/Sidebar'
import CategoryModal from '../_components/CategoryModal'
import useConfirmation from '@/hooks/useConfirmation'

interface Category {
	id: number
	name: string
	name_en?: string
	name_ru?: string | null
	name_am?: string | null
	created_at: string
	product_count?: number
}

interface CategoryData {
	id?: number
	name: string
	name_en: string
	name_ru: string
	name_am: string
}

export default function CategoriesPage() {
	// State variables
	const [categories, setCategories] = useState<Category[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [searchTerm, setSearchTerm] = useState('')
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
	const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(
		null
	)
	const [isDeleting, setIsDeleting] = useState<{ [key: number]: boolean }>({})

	// Hooks
	const { t, language } = useLanguage()
	const { confirmDelete } = useConfirmation()

	// Fetch categories
	useEffect(() => {
		fetchCategories()
	}, [])

	const fetchCategories = async () => {
		setIsLoading(true)
		try {
			const res = await fetch('/api/products', {
				cache: 'no-store',
			})

			if (!res.ok) {
				throw new Error('Failed to fetch categories')
			}

			const data = await res.json()

			// Format categories and add product count
			let formattedCategories = data.categories.map((category: any) => ({
				id: category.id,
				name: category.name,
				name_en: category.name_en || category.name,
				name_ru: category.name_ru === '[null]' ? '' : category.name_ru || '',
				name_am: category.name_am === '[null]' ? '' : category.name_am || '',
				created_at: category.created_at || new Date().toISOString(),
				product_count: data.components.filter(
					(p: any) => p.category_id === category.id
				).length,
			}))

			setCategories(formattedCategories)
		} catch (error) {
			console.error('Error fetching categories:', error)
			toast.error('Failed to load categories')
		} finally {
			setIsLoading(false)
		}
	}

	// Filter categories based on search term
	const filteredCategories = categories.filter(category => {
		const searchLower = searchTerm.toLowerCase()
		return (
			category.name.toLowerCase().includes(searchLower) ||
			(category.name_en &&
				category.name_en.toLowerCase().includes(searchLower)) ||
			(category.name_ru &&
				category.name_ru.toLowerCase().includes(searchLower)) ||
			(category.name_am && category.name_am.toLowerCase().includes(searchLower))
		)
	})

	// Add a new category
	const handleAddCategory = () => {
		setModalMode('create')
		setSelectedCategory({
			name: '',
			name_en: '',
			name_ru: '',
			name_am: '',
		})
		setIsModalOpen(true)
	}

	// Edit an existing category
	const handleEditCategory = (category: Category) => {
		setModalMode('edit')
		setSelectedCategory({
			id: category.id,
			name: category.name,
			name_en: category.name_en || '',
			name_ru: category.name_ru || '',
			name_am: category.name_am || '',
		})
		setIsModalOpen(true)
	}

	// Delete a category
	const handleDeleteCategory = (id: number) => {
		confirmDelete(
			t('categories.confirmDelete', {
				defaultValue:
					'Are you sure you want to delete this category? This action cannot be undone.',
			}),
			async () => {
				setIsDeleting(prev => ({ ...prev, [id]: true }))
				try {
					const res = await fetch('/api/products', {
						method: 'DELETE',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({ id }),
					})

					if (!res.ok) {
						throw new Error('Failed to delete category')
					}

					setCategories(prev => prev.filter(category => category.id !== id))
					toast.success(
						t('notification.categoryDeleted', {
							defaultValue: 'Category successfully deleted',
						})
					)
				} catch (error) {
					console.error('Error deleting category:', error)
					toast.error('Failed to delete category')
				} finally {
					setIsDeleting(prev => ({ ...prev, [id]: false }))
				}
			}
		)
	}

	// Save a category (create or update)
	const handleSaveCategory = async (categoryData: CategoryData) => {
		try {
			if (modalMode === 'create') {
				// Create new category
				const res = await fetch('/api/products', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						category_name: categoryData.name,
						name_en: categoryData.name_en,
						name_ru: categoryData.name_ru,
						name_am: categoryData.name_am,
					}),
				})

				if (!res.ok) {
					throw new Error('Failed to create category')
				}

				const data = await res.json()
				setCategories(prev => [
					...prev,
					{
						...data.category,
						product_count: 0,
					},
				])
			} else {
				// Update existing category
				const res = await fetch('/api/products', {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						id: categoryData.id,
						name: categoryData.name,
						name_en: categoryData.name_en,
						name_ru: categoryData.name_ru,
						name_am: categoryData.name_am,
					}),
				})

				if (!res.ok) {
					throw new Error('Failed to update category')
				}

				setCategories(prev =>
					prev.map(category =>
						category.id === categoryData.id
							? { ...category, ...categoryData }
							: category
					)
				)
			}
		} catch (error) {
			console.error('Error saving category:', error)
			throw error // Re-throw to handle in the modal
		}
	}

	// Get category name based on current language
	const getCategoryName = (category: Category) => {
		switch (language) {
			case 'ru':
				return category.name_ru || category.name_en || category.name
			case 'am':
				return category.name_am || category.name_en || category.name
			default:
				return category.name_en || category.name
		}
	}

	// Format date to readable format
	const formatDate = (dateString: string) => {
		try {
			const date = new Date(dateString)
			return new Intl.DateTimeFormat(
				language === 'en' ? 'en-US' : language === 'ru' ? 'ru-RU' : 'hy-AM',
				{
					year: 'numeric',
					month: 'short',
					day: 'numeric',
				}
			).format(date)
		} catch (e) {
			return dateString
		}
	}

	return (
		<div className='min-h-screen bg-[#171C1F]'>
			<Sidebar />

			<div className='p-6 ml-0 md:ml-72'>
				{/* Header */}
				<div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4'>
					<h1 className='text-3xl font-bold text-white'>
						{t('categories.title', { defaultValue: 'Category Management' })}
					</h1>

					<button
						onClick={handleAddCategory}
						className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2'
					>
						<PlusCircle size={18} />
						{t('categories.add', { defaultValue: 'Add Category' })}
					</button>
				</div>

				{/* Search and filter */}
				<div className='bg-[#202529] rounded-xl p-4 mb-6'>
					<div className='relative'>
						<Search className='absolute left-3 top-3 text-gray-400' size={18} />
						<input
							type='text'
							placeholder={t('categories.search', {
								defaultValue: 'Search categories...',
							})}
							value={searchTerm}
							onChange={e => setSearchTerm(e.target.value)}
							className='w-full bg-[#2A2F35] text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
						/>
						{searchTerm && (
							<button
								onClick={() => setSearchTerm('')}
								className='absolute right-3 top-3 text-gray-400 hover:text-white'
							>
								<X size={18} />
							</button>
						)}
					</div>
				</div>

				{/* Loading state */}
				{isLoading && (
					<div className='flex flex-col items-center justify-center py-12'>
						<Loader2 className='w-12 h-12 text-blue-500 animate-spin mb-4' />
						<p className='text-gray-400'>
							{t('common.loading', { defaultValue: 'Loading categories...' })}
						</p>
					</div>
				)}

				{/* Empty state */}
				{!isLoading && categories.length === 0 && (
					<div className='bg-[#202529] rounded-xl p-8 text-center'>
						<div className='w-16 h-16 bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4'>
							<Globe className='w-8 h-8 text-blue-400' />
						</div>
						<h2 className='text-xl font-bold text-white mb-2'>
							{t('categories.empty', { defaultValue: 'No categories' })}
						</h2>
						<p className='text-gray-400 mb-6 max-w-md mx-auto'>
							{t('categories.emptyDescription', {
								defaultValue:
									'Add your first category by clicking the "Add" button',
							})}
						</p>
						<button
							onClick={handleAddCategory}
							className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2'
						>
							<PlusCircle size={18} />
							{t('categories.add', { defaultValue: 'Add Category' })}
						</button>
					</div>
				)}

				{/* No search results */}
				{!isLoading &&
					categories.length > 0 &&
					filteredCategories.length === 0 && (
						<div className='bg-[#202529] rounded-xl p-8 text-center'>
							<div className='w-16 h-16 bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4'>
								<AlertCircle className='w-8 h-8 text-yellow-400' />
							</div>
							<h2 className='text-xl font-bold text-white mb-2'>
								{t('categories.noResults', {
									defaultValue: 'No categories found',
								})}
							</h2>
							<p className='text-gray-400 mb-6 max-w-md mx-auto'>
								{t('categories.noResultsDescription', {
									defaultValue:
										'No categories found matching "{searchTerm}". Try changing your search query.',
									searchTerm,
								})}
							</p>
							<button
								onClick={() => setSearchTerm('')}
								className='bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2'
							>
								<RefreshCw size={18} />
								{t('categories.clearSearch', { defaultValue: 'Clear Search' })}
							</button>
						</div>
					)}

				{/* Categories list */}
				{!isLoading && filteredCategories.length > 0 && (
					<div className='grid gap-4'>
						{filteredCategories.map(category => (
							<div
								key={category.id}
								className='bg-[#202529] rounded-xl border border-gray-700 overflow-hidden hover:shadow-lg transition-all'
							>
								<div className='flex flex-col md:flex-row justify-between p-4 md:p-6'>
									{/* Category info */}
									<div className='flex-grow mb-4 md:mb-0'>
										<h2 className='text-xl font-semibold text-white mb-2'>
											{getCategoryName(category)}
										</h2>

										<div className='flex flex-wrap gap-2 mb-3'>
											{/* Category ID badge */}
											<div className='bg-gray-700 text-gray-300 text-xs py-1 px-2 rounded-full'>
												ID: {category.id}
											</div>

											{/* Product count badge */}
											<div className='bg-blue-900/30 text-blue-300 text-xs py-1 px-2 rounded-full flex items-center'>
												<span className='mr-1'>
													{category.product_count || 0}
												</span>
												<span>
													{t('categories.products', {
														defaultValue: 'products',
													})}
												</span>
											</div>

											{/* Created date */}
											<div className='bg-gray-700 text-gray-300 text-xs py-1 px-2 rounded-full flex items-center'>
												<Clock size={12} className='mr-1' />
												<span>
													{t('categories.created', { defaultValue: 'Created' })}
													: {formatDate(category.created_at)}
												</span>
											</div>
										</div>

										{/* Language badges */}
										<div className='flex flex-wrap gap-2'>
											<div className='bg-green-900/30 text-green-300 text-xs py-1 px-2 rounded-full flex items-center'>
												<span>🇺🇸 {category.name_en}</span>
											</div>

											{category.name_ru && (
												<div className='bg-blue-900/30 text-blue-300 text-xs py-1 px-2 rounded-full flex items-center'>
													<span>🇷🇺 {category.name_ru}</span>
												</div>
											)}

											{category.name_am && (
												<div className='bg-purple-900/30 text-purple-300 text-xs py-1 px-2 rounded-full flex items-center'>
													<span>🇦🇲 {category.name_am}</span>
												</div>
											)}
										</div>
									</div>

									{/* Actions */}
									<div className='flex md:flex-col items-center md:items-end gap-3'>
										<button
											onClick={() => handleEditCategory(category)}
											className='bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm'
										>
											<Edit2 size={16} />
											<span>
												{t('categories.edit', { defaultValue: 'Edit' })}
											</span>
										</button>

										<button
											onClick={() => handleDeleteCategory(category.id)}
											disabled={isDeleting[category.id]}
											className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm ${
												isDeleting[category.id]
													? 'bg-gray-600 cursor-not-allowed text-gray-300'
													: 'bg-red-600 hover:bg-red-700 text-white'
											}`}
										>
											{isDeleting[category.id] ? (
												<Loader2 size={16} className='animate-spin' />
											) : (
												<Trash2 size={16} />
											)}
											<span>
												{t('categories.delete', { defaultValue: 'Delete' })}
											</span>
										</button>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Modal for creating/editing categories */}
			{isModalOpen && selectedCategory && (
				<CategoryModal
					isOpen={isModalOpen}
					onClose={() => setIsModalOpen(false)}
					onSave={handleSaveCategory}	
					mode={modalMode}
					initialData={selectedCategory}
				/>
			)}
		</div>
	)
}
