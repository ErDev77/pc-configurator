'use client'
import React from 'react'
import { useState, useEffect } from 'react'
import {
	Plus,
	Pencil,
	Trash2,
	Search,
	ArrowUpDown,
	X,
	Check,
	AlertCircle,
	Loader2,
} from 'lucide-react'
import Sidebar from '../_components/Sidebar'

interface Category {
	id: string
	name: string
	productCount?: number
	createdAt?: string
}

const CategoryManagement = () => {
	const [categories, setCategories] = useState<Category[]>([])
	const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
	const [newCategory, setNewCategory] = useState<string>('')
	const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
	const [editCategoryId, setEditCategoryId] = useState<string | null>(null)
	const [editCategoryName, setEditCategoryName] = useState<string>('')
	const [searchTerm, setSearchTerm] = useState<string>('')
	const [isLoading, setIsLoading] = useState<boolean>(true)
	const [error, setError] = useState<string | null>(null)
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
	const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
	const [notification, setNotification] = useState<{
		type: 'success' | 'error'
		message: string
	} | null>(null)

	// Функция для загрузки категорий с API
	const fetchCategories = async () => {
		setIsLoading(true)
		setError(null)
		try {
			const res = await fetch('/api/products')
			const data = await res.json()
			if (data.categories) {
				// Simulate additional data for demo purposes
				const enhancedCategories = data.categories.map((cat: Category) => ({
					...cat,
					productCount: Math.floor(Math.random() * 50),
					createdAt: new Date(
						Date.now() - Math.floor(Math.random() * 10000000000)
					).toISOString(),
				}))
				setCategories(enhancedCategories)
				setFilteredCategories(enhancedCategories)
			} else {
				setError(
					'Ошибка получения категорий: ' + (data.error || 'Неизвестная ошибка')
				)
			}
		} catch (error) {
			setError('Ошибка при загрузке категорий')
			console.error('Ошибка при загрузке категорий:', error)
		} finally {
			setIsLoading(false)
		}
	}

	// Загрузка категорий при монтировании компонента
	useEffect(() => {
		fetchCategories()
	}, [])

	// Фильтрация категорий по поисковому запросу
	useEffect(() => {
		if (searchTerm) {
			const filtered = categories.filter(category =>
				category.name.toLowerCase().includes(searchTerm.toLowerCase())
			)
			setFilteredCategories(filtered)
		} else {
			setFilteredCategories(categories)
		}
	}, [searchTerm, categories])

	// Сортировка категорий
	const handleSort = () => {
		const newOrder = sortOrder === 'asc' ? 'desc' : 'asc'
		setSortOrder(newOrder)

		const sorted = [...filteredCategories].sort((a, b) => {
			return newOrder === 'asc'
				? a.name.localeCompare(b.name)
				: b.name.localeCompare(a.name)
		})

		setFilteredCategories(sorted)
	}

	// Функция для добавления новой категории
	const handleAddCategory = async () => {
		if (newCategory) {
			try {
				setIsLoading(true)
				const res = await fetch('/api/products', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ category_name: newCategory }),
				})
				const data = await res.json()
				if (data.success) {
					const newCat = {
						id: Date.now().toString(),
						name: newCategory,
						productCount: 0,
						createdAt: new Date().toISOString(),
					}
					setCategories([...categories, newCat])
					setNewCategory('')
					setIsModalOpen(false)
					showNotification('success', 'Категория успешно добавлена')
				} else {
					showNotification('error', 'Ошибка при добавлении категории')
					console.error('Ошибка при добавлении категории:', data.error)
				}
			} catch (error) {
				showNotification('error', 'Ошибка при добавлении категории')
				console.error(
					'Ошибка при отправке запроса на добавление категории:',
					error
				)
			} finally {
				setIsLoading(false)
			}
		}
	}

	// Функция для редактирования категории
	const handleEditCategory = async () => {
		if (editCategoryName && editCategoryId) {
			try {
				setIsLoading(true)
				const res = await fetch('/api/products', {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						id: editCategoryId,
						name: editCategoryName,
					}),
				})
				const data = await res.json()
				if (data.success) {
					setCategories(
						categories.map(category =>
							category.id === editCategoryId
								? { ...category, name: editCategoryName }
								: category
						)
					)
					setEditCategoryId(null)
					setEditCategoryName('')
					showNotification('success', 'Категория успешно обновлена')
				} else {
					showNotification('error', 'Ошибка при редактировании категории')
					console.error('Ошибка при редактировании категории:', data.error)
				}
			} catch (error) {
				showNotification('error', 'Ошибка при редактировании категории')
				console.error(
					'Ошибка при отправке запроса на редактирование категории:',
					error
				)
			} finally {
				setIsLoading(false)
			}
		}
	}

	// Функция для удаления категории
	const handleDeleteCategory = async (id: string) => {
		try {
			setIsLoading(true)
			const res = await fetch('/api/products', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ id }),
			})
			const data = await res.json()
			if (data.success) {
				setCategories(categories.filter(category => category.id !== id))
				setConfirmDelete(null)
				showNotification('success', 'Категория успешно удалена')
			} else {
				showNotification('error', 'Ошибка при удалении категории')
				console.error('Ошибка при удалении категории:', data.error)
			}
		} catch (error) {
			showNotification('error', 'Ошибка при удалении категории')
			console.error('Ошибка при отправке запроса на удаление категории:', error)
		} finally {
			setIsLoading(false)
		}
	}

	// Показ уведомления
	const showNotification = (type: 'success' | 'error', message: string) => {
		setNotification({ type, message })
		setTimeout(() => setNotification(null), 3000)
	}

	// Форматирование даты
	const formatDate = (dateString: string | undefined) => {
		if (!dateString) return ''
		const date = new Date(dateString)
		return new Intl.DateTimeFormat('ru-RU', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		}).format(date)
	}

	return (
		<div className='min-h-screen  bg-[#14181B] p-6'>
			<Sidebar />
			<div className='max-w-7xl mx-auto bg-[#202529] rounded-lg shadow-md p-6'>
				<div className='flex flex-col md:flex-row md:items-center justify-between mb-8'>
					<h1 className='text-3xl font-bold text-gray-800 dark:text-white mb-4 md:mb-0'>
						Управление категориями
					</h1>
					<div className='flex space-x-2'>
						<div className='relative'>
							<input
								type='text'
								placeholder='Поиск категорий...'
								value={searchTerm}
								onChange={e => setSearchTerm(e.target.value)}
								className='pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
							/>
							<Search className='absolute left-3 top-2.5 h-5 w-5 text-gray-400' />
							{searchTerm && (
								<button
									onClick={() => setSearchTerm('')}
									className='absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
								>
									<X className='h-4 w-4' />
								</button>
							)}
						</div>
						<button
							onClick={handleSort}
							className='flex items-center space-x-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition'
						>
							<span>{sortOrder === 'asc' ? 'А-Я' : 'Я-А'}</span>
							<ArrowUpDown className='h-4 w-4' />
						</button>
						<button
							onClick={() => setIsModalOpen(true)}
							className='flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition'
						>
							<Plus className='h-5 w-5' />
							<span>Добавить</span>
						</button>
					</div>
				</div>

				{/* Notification */}
				{notification && (
					<div
						className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
							notification.type === 'success'
								? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
								: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
						}`}
					>
						{notification.type === 'success' ? (
							<Check className='h-5 w-5' />
						) : (
							<AlertCircle className='h-5 w-5' />
						)}
						<span>{notification.message}</span>
					</div>
				)}

				{/* Error State */}
				{error && (
					<div className='mb-6 p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 rounded-lg flex items-center space-x-2'>
						<AlertCircle className='h-5 w-5' />
						<span>{error}</span>
					</div>
				)}

				{/* Loading State */}
				{isLoading && (
					<div className='flex justify-center items-center py-20'>
						<Loader2 className='h-10 w-10 text-blue-600 animate-spin' />
					</div>
				)}

				{/* Empty State */}
				{!isLoading && filteredCategories.length === 0 && (
					<div className='flex flex-col items-center justify-center py-16 text-center'>
						<div className='bg-gray-100 dark:bg-gray-700 p-4 rounded-full mb-4'>
							<AlertCircle className='h-8 w-8 text-gray-500 dark:text-gray-400' />
						</div>
						<h3 className='text-xl font-medium text-gray-800 dark:text-gray-200 mb-2'>
							{searchTerm ? 'Категории не найдены' : 'Нет категорий'}
						</h3>
						<p className='text-gray-500 dark:text-gray-400 max-w-md mb-4'>
							{searchTerm
								? `По запросу "${searchTerm}" не найдено ни одной категории. Попробуйте изменить поисковый запрос.`
								: 'Добавьте вашу первую категорию, нажав на кнопку "Добавить"'}
						</p>
						{searchTerm && (
							<button
								onClick={() => setSearchTerm('')}
								className='text-blue-600 hover:text-blue-700 font-medium'
							>
								Сбросить поиск
							</button>
						)}
					</div>
				)}

				{/* Category Grid */}
				{!isLoading && filteredCategories.length > 0 && (
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
						{filteredCategories.map(category => (
							<div
								key={category.id}
								className='bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition overflow-hidden'
							>
								<div className='p-5 border-b border-gray-200 dark:border-gray-700'>
									<h3 className='text-xl font-semibold text-gray-800 dark:text-white'>
										{category.name}
									</h3>
									<div className='mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400'>
										<span className='bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-2 py-0.5 rounded-full text-xs font-medium'>
											{category.productCount} товаров
										</span>
										<span className='mx-2'>•</span>
										<span>Создано: {formatDate(category.createdAt)}</span>
									</div>
								</div>
								<div className='p-4 flex justify-between'>
									<button
										onClick={() => {
											setEditCategoryId(category.id)
											setEditCategoryName(category.name)
										}}
										className='flex items-center space-x-1 py-2 px-3 bg-amber-500 text-white rounded hover:bg-amber-600 transition'
									>
										<Pencil className='h-4 w-4' />
										<span>Изменить</span>
									</button>
									{confirmDelete === category.id ? (
										<div className='flex space-x-2'>
											<button
												onClick={() => handleDeleteCategory(category.id)}
												className='py-2 px-3 bg-red-600 text-white rounded hover:bg-red-700'
											>
												<Check className='h-4 w-4' />
											</button>
											<button
												onClick={() => setConfirmDelete(null)}
												className='py-2 px-3 bg-gray-500 text-white rounded hover:bg-gray-600'
											>
												<X className='h-4 w-4' />
											</button>
										</div>
									) : (
										<button
											onClick={() => setConfirmDelete(category.id)}
											className='flex items-center space-x-1 py-2 px-3 bg-red-600 text-white rounded hover:bg-red-700 transition'
										>
											<Trash2 className='h-4 w-4' />
											<span>Удалить</span>
										</button>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Модальное окно для добавления категории */}
			{isModalOpen && (
				<div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50'>
					<div className='bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md mx-4'>
						<div className='flex justify-between items-center mb-4'>
							<h2 className='text-xl font-semibold text-gray-800 dark:text-white'>
								Добавить категорию
							</h2>
							<button
								onClick={() => setIsModalOpen(false)}
								className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
							>
								<X className='h-5 w-5' />
							</button>
						</div>
						<div className='mb-6'>
							<label className='block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300'>
								Название категории
							</label>
							<input
								type='text'
								value={newCategory}
								onChange={e => setNewCategory(e.target.value)}
								className='w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
								placeholder='Введите название категории'
								autoFocus
							/>
						</div>
						<div className='flex justify-end space-x-3'>
							<button
								onClick={() => setIsModalOpen(false)}
								className='py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition'
							>
								Отмена
							</button>
							<button
								onClick={handleAddCategory}
								disabled={!newCategory || isLoading}
								className={`py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2 ${
									!newCategory || isLoading
										? 'opacity-50 cursor-not-allowed'
										: ''
								}`}
							>
								{isLoading ? (
									<>
										<Loader2 className='h-4 w-4 animate-spin' />
										<span>Сохранение...</span>
									</>
								) : (
									<>
										<Plus className='h-4 w-4' />
										<span>Добавить</span>
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Модальное окно для редактирования категории */}
			{editCategoryId && (
				<div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50'>
					<div className='bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md mx-4'>
						<div className='flex justify-between items-center mb-4'>
							<h2 className='text-xl font-semibold text-gray-800 dark:text-white'>
								Редактировать категорию
							</h2>
							<button
								onClick={() => {
									setEditCategoryId(null)
									setEditCategoryName('')
								}}
								className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
							>
								<X className='h-5 w-5' />
							</button>
						</div>
						<div className='mb-6'>
							<label className='block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300'>
								Название категории
							</label>
							<input
								type='text'
								value={editCategoryName}
								onChange={e => setEditCategoryName(e.target.value)}
								className='w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
								placeholder='Введите новое название категории'
								autoFocus
							/>
						</div>
						<div className='flex justify-end space-x-3'>
							<button
								onClick={() => {
									setEditCategoryId(null)
									setEditCategoryName('')
								}}
								className='py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition'
							>
								Отмена
							</button>
							<button
								onClick={handleEditCategory}
								disabled={!editCategoryName || isLoading}
								className={`py-2 px-4 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition flex items-center space-x-2 ${
									!editCategoryName || isLoading
										? 'opacity-50 cursor-not-allowed'
										: ''
								}`}
							>
								{isLoading ? (
									<>
										<Loader2 className='h-4 w-4 animate-spin' />
										<span>Сохранение...</span>
									</>
								) : (
									<>
										<Check className='h-4 w-4' />
										<span>Сохранить</span>
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default CategoryManagement
