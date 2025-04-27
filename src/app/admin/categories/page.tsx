'use client'
import { useState, useEffect } from 'react'

interface Category {
	id: string
	name: string
}

const CategoryManagement = () => {
	const [categories, setCategories] = useState<Category[]>([])
	const [newCategory, setNewCategory] = useState<string>('')
	const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
	const [editCategoryId, setEditCategoryId] = useState<string | null>(null)
	const [editCategoryName, setEditCategoryName] = useState<string>('')

	// Функция для загрузки категорий с API
	const fetchCategories = async () => {
		try {
			const res = await fetch('/api/products')
			const data = await res.json()
			if (data.categories) {
				setCategories(data.categories)
			} else {
				console.error('Ошибка получения категорий:', data.error)
			}
		} catch (error) {
			console.error('Ошибка при загрузке категорий:', error)
		}
	}

	// Загрузка категорий при монтировании компонента
	useEffect(() => {
		fetchCategories()
	}, [])

	// Функция для добавления новой категории
	const handleAddCategory = async () => {
		if (newCategory) {
			try {
				const res = await fetch('/api/products', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ category_name: newCategory }),
				})
				const data = await res.json()
				if (data.success) {
					setCategories([
						...categories,
						{ id: Date.now().toString(), name: newCategory },
					])
					setNewCategory('')
					setIsModalOpen(false)
				} else {
					console.error('Ошибка при добавлении категории:', data.error)
				}
			} catch (error) {
				console.error(
					'Ошибка при отправке запроса на добавление категории:',
					error
				)
			}
		}
	}

	// Функция для редактирования категории
	const handleEditCategory = async () => {
		if (editCategoryName && editCategoryId) {
			try {
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
				} else {
					console.error('Ошибка при редактировании категории:', data.error)
				}
			} catch (error) {
				console.error(
					'Ошибка при отправке запроса на редактирование категории:',
					error
				)
			}
		}
	}

	// Функция для удаления категории
	const handleDeleteCategory = async (id: string) => {
		try {
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
			} else {
				console.error('Ошибка при удалении категории:', data.error)
			}
		} catch (error) {
			console.error('Ошибка при отправке запроса на удаление категории:', error)
		}
	}

	return (
		<div className='p-8'>
			<h1 className='text-2xl font-bold mb-6'>Управление категориями</h1>
			<div className='grid grid-cols-3 gap-6'>
				{categories.map(category => (
					<div key={category.id} className='p-4 border rounded shadow'>
						<h3 className='text-lg font-semibold'>{category.name}</h3>
						<div className='mt-4 flex justify-between'>
							<button
								onClick={() => {
									setEditCategoryId(category.id)
									setEditCategoryName(category.name)
								}}
								className='py-1 px-2 bg-yellow-500 text-white rounded hover:bg-yellow-600'
							>
								Редактировать
							</button>
							<button
								onClick={() => handleDeleteCategory(category.id)}
								className='py-1 px-2 bg-red-600 text-white rounded hover:bg-red-700'
							>
								Удалить
							</button>
						</div>
					</div>
				))}
			</div>

			<button
				onClick={() => setIsModalOpen(true)}
				className='mt-6 w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition'
			>
				Добавить категорию
			</button>

			{/* Модальное окно для добавления категории */}
			{isModalOpen && (
				<div className='fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center'>
					<div className='bg-[#222227] p-6 rounded shadow-lg w-1/3'>
						<h2 className='text-xl font-semibold mb-4'>Добавить категорию</h2>
						<input
							type='text'
							value={newCategory}
							onChange={e => setNewCategory(e.target.value)}
							className='w-full p-2 border rounded mb-4'
							placeholder='Введите название категории'
						/>
						<div className='flex justify-end'>
							<button
								onClick={() => setIsModalOpen(false)}
								className='mr-4 py-2 px-4 bg-gray-300 rounded hover:bg-gray-400'
							>
								Отмена
							</button>
							<button
								onClick={handleAddCategory}
								className='py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700'
							>
								Добавить
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Модальное окно для редактирования категории */}
			{editCategoryId && (
				<div className='fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center'>
					<div className='bg-white p-6 rounded shadow-lg w-1/3'>
						<h2 className='text-xl font-semibold mb-4'>
							Редактировать категорию
						</h2>
						<input
							type='text'
							value={editCategoryName}
							onChange={e => setEditCategoryName(e.target.value)}
							className='w-full p-2 border rounded mb-4'
							placeholder='Введите новое название категории'
						/>
						<div className='flex justify-end'>
							<button
								onClick={() => {
									setEditCategoryId(null)
									setEditCategoryName('')
								}}
								className='mr-4 py-2 px-4 bg-gray-300 rounded hover:bg-gray-400'
							>
								Отмена
							</button>
							<button
								onClick={handleEditCategory}
								className='py-2 px-4 bg-yellow-500 text-white rounded hover:bg-yellow-600'
							>
								Сохранить
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default CategoryManagement
