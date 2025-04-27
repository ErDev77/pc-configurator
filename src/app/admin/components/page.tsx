// componentsPage.tsx
'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { toast, ToastContainer } from 'react-toastify'
import { useRouter } from 'next/navigation'
import DashboardActions from '../_components/DashboardActions'

interface Component {
	id: number
	name: string
	price: number
	brand: string
	image_url?: string
	category_id: number
	created_at: string
	hidden?: boolean
}

interface Category {
	id: number
	name: string
}

const ComponentsPage = () => {
	const [categories, setCategories] = useState<Category[]>([])
	const [components, setComponents] = useState<Component[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState<string>('')
	const [minPrice, setMinPrice] = useState<number | string>('')
	const [maxPrice, setMaxPrice] = useState<number | string>('')
	const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
	const [selectedBrand, setSelectedBrand] = useState<string | null>(null)
	const [currentPage, setCurrentPage] = useState(1)
	const [pageSize, setPageSize] = useState(10)
	useEffect(() => {
		const fetchData = async () => {
			try {
				const res = await fetch('/api/products', { method: 'GET' })

				if (!res.ok) {
					throw new Error(`Ошибка: ${res.status} ${res.statusText}`)
				}

				const data = await res.json()
				setCategories(data.categories)
				setComponents(prevComponents => [...prevComponents, ...data.components])
				setIsLoading(false)
			} catch (error) {
				console.error('Ошибка при загрузке данных:', error)
			}
		}

		fetchData()
	}, [currentPage])

	const filteredComponents = components.filter(component => {
		const matchesSearch = component.name
			.toLowerCase()
			.includes(searchQuery.toLowerCase())
		const matchesCategory = selectedCategory
			? component.category_id === selectedCategory
			: true
		const matchesBrand = selectedBrand
			? component.brand === selectedBrand
			: true
		const matchesMinPrice =
			minPrice === '' || component.price >= Number(minPrice)
		const matchesMaxPrice =
			maxPrice === '' || component.price <= Number(maxPrice)

		return (
			matchesSearch &&
			matchesCategory &&
			matchesMinPrice &&
			matchesMaxPrice &&
			matchesBrand
		)
	})

	const brands = Array.from(
		new Set(components.map(component => component.brand))
	)

	const handleDelete = async (componentId: number) => {
		try {
			const res = await fetch(`/api/products/${componentId}`, {
				method: 'DELETE',
			})

			if (!res.ok) {
				throw new Error(`Ошибка: ${res.status} ${res.statusText}`)
			}

			setComponents(prevComponents =>
				prevComponents.filter(comp => comp.id !== componentId)
			)
			toast.success('Компонент удалён!')
		} catch (err) {
			console.error('Ошибка удаления:', err)
			toast.error('Ошибка при удалении компонента.')
		}
	}

	if (isLoading) {
		return <div>Загрузка...</div>
	}

	return (
		<div className='px-4 py-6 w-full max-w-screen-lg mx-auto flex flex-col'>
			<ToastContainer />

			<div className='mb-6 flex items-center space-x-4'>
				<input
					type='text'
					placeholder='Поиск...'
					value={searchQuery}
					onChange={e => setSearchQuery(e.target.value)}
					className='bg-[#202529] text-white p-2 rounded-lg w-[350px]'
				/>
				<input
					type='number'
					placeholder='Мин. цена'
					value={minPrice}
					onChange={e => setMinPrice(e.target.value)}
					className='bg-[#202529] text-white p-2 rounded-lg w-[220px]'
				/>
				<input
					type='number'
					placeholder='Макс. цена'
					value={maxPrice}
					onChange={e => setMaxPrice(e.target.value)}
					className='bg-[#202529] text-white p-2 rounded-lg w-[220px]'
				/>
				<select
					value={selectedCategory ?? ''}
					onChange={e =>
						setSelectedCategory(e.target.value ? Number(e.target.value) : null)
					}
					className='bg-[#202529] text-white p-2 rounded-lg w-[200px]'
				>
					<option value=''>Все категории</option>
					{categories.map(category => (
						<option key={category.id} value={category.id}>
							{category.name}
						</option>
					))}
				</select>
				<select
					value={selectedBrand ?? ''}
					onChange={e => setSelectedBrand(e.target.value || null)}
					className='bg-[#202529] text-white p-2 rounded-lg w-[200px]'
				>
					<option value=''>Все бренды</option>
					{brands.map(brand => (
						<option key={brand} value={brand}>
							{brand}
						</option>
					))}
				</select>
			</div>

			<div className='bg-[#202529] rounded-lg p-4 shadow-lg w-full max-w-5xl mx-auto'>
				<div className='grid grid-cols-5 gap-6 border-b border-gray-600 pb-2 text-white font-semibold text-lg text-center'>
					<div>Изображение</div>
					<div>Название</div>
					<div>Бренд</div>
					<div>Цена</div>
					<div>Действия</div>
				</div>
				<div className='divide-y divide-gray-600'>
					{filteredComponents.map(component => (
						<div
							key={component.id}
							className='grid grid-cols-5 gap-6 py-4 items-center text-white text-center'
						>
							<div className='flex justify-center'>
								<Image
									src={
										component.image_url &&
										component.image_url.startsWith('http')
											? component.image_url
											: '/placeholder-image.png'
									}
									alt={component.name}
									width={50}
									height={50}
								/>
							</div>
							<div>{component.name}</div>
							<div className='text-gray-400'>{component.brand}</div>
							<div className='text-lg font-bold'>{component.price}$</div>
							<div className='flex justify-center'>
								<DashboardActions
									componentId={component.id}
									onDelete={() => handleDelete(component.id)}
								/>
							</div>
						</div>
					))}
				</div>
			</div>
			<button
				onClick={() => setCurrentPage(prevPage => prevPage + 1)}
				className='bg-blue-500 text-white p-2 rounded-lg'
			>
				Загрузить еще
			</button>
		</div>
	)
}

export default ComponentsPage
