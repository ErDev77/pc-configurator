'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import useConfirmation from '@/hooks/useConfirmation'
import { toast, ToastContainer } from 'react-toastify'
import Link from 'next/link'
import DashboardActions from '../_components/DashboardActions'
import Sidebar from '../_components/Sidebar'

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

interface Order {
	id: number
	created_at: string
}

const Admin = () => {
	const [categories, setCategories] = useState<Category[]>([])
	const [configurations, setConfigurations] = useState<any[]>([])
	const [orders, setOrders] = useState<Order[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState<string>('')
	const [minPrice, setMinPrice] = useState<number | string>('')
	const [maxPrice, setMaxPrice] = useState<number | string>('')
	const [components, setComponents] = useState<Component[]>([])
	const { confirmDelete } = useConfirmation()
	const [selectedBrand, setSelectedBrand] = useState<string | null>(null)
	const router = useRouter()
	const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
	const [currentPage, setCurrentPage] = useState(1)
	const [pageSize, setPageSize] = useState(10)
	const [totalComponentsCount, setTotalComponentsCount] = useState(0)

	useEffect(() => {
		const fetchData = async () => {
			try {
				const res = await fetch('/api/products', { method: 'GET' })

				if (!res.ok) {
					throw new Error(`Ошибка: ${res.status} ${res.statusText}`)
				}

				const data = await res.json()
				setCategories(data.categories)
				setComponents(data.components)
				setIsLoading(false)
			} catch (error) {
				console.error('Ошибка при загрузке данных:', error)
			}
		}


		fetchData()
	}, [])

    
	const handleDelete = async (componentId: number) => {
		confirmDelete(
			'Вы уверены, что хотите удалить этот компонент?',
			async () => {
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
		)
	}


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


	const totalConfigurations = configurations.length
	const totalComponents = components.length
	const totalOrders = orders.length

	const lastComponent = components.sort((a, b) => {
		return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
	})[0]

	

	if (isLoading) {
		return <div>Загрузка...</div>
	}

	return (
		<div className='flex bg-[#171C1F] min-h-screen'>
			<Sidebar />
			<div className='px-4 py-6 w-full max-w-screen-lg mx-auto flex flex-col'>
				<ToastContainer />

				<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6'>
					<div className='bg-[#202529] p-6 rounded-lg shadow-lg text-white'>
						<h3 className='text-xl font-bold'>Конфигураций</h3>
						<p className='text-3xl'>{totalConfigurations}</p>
						<p>Общее количество</p>
					</div>
					<div className='bg-[#202529] p-6 rounded-lg shadow-lg text-white'>
						<h3 className='text-xl font-bold'>Комплектующих</h3>
						<p className='text-3xl'>{totalComponentsCount}</p>
						<p>Общее количество</p>
					</div>
					<div className='bg-[#202529] p-6 rounded-lg shadow-lg text-white'>
						<h3 className='text-xl font-bold'>Заказов</h3>
						<p className='text-3xl'>{totalOrders}</p>
						<p>Общее количество</p>
					</div>
				</div>

				<div className='bg-[#202529] p-6 rounded-lg shadow-lg'>
					<h3 className='text-xl font-bold text-white'>
						Последние конфигурации
					</h3>
					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4'>
						{configurations.map(config => (
							<Link
								href={`/config/${config.id}`}
								key={config.id}
								className='bg-[#303636] rounded-lg p-4'
							>
								<Image
									src={config.image_url || '/default-image.jpg'}
									alt={config.name}
									width={400}
									height={250}
									className='rounded-lg mb-4 object-cover'
								/>
								<h4 className='text-lg font-bold text-white'>{config.name}</h4>
								<p className='text-sm text-gray-400'>{config.created_at}</p>
							</Link>
						))}
					</div>
				</div>

				{lastComponent && (
					<div className='bg-[#202529] p-6 rounded-lg shadow-lg mt-6'>
						<h3 className='text-xl font-bold text-white'>
							Последний комплектующий
						</h3>
						<div className='flex items-center mt-4'>
							<Image
								src={lastComponent.image_url || '/placeholder-image.png'}
								alt={lastComponent.name}
								width={50}
								height={50}
								className='rounded object-cover mr-4'
							/>
							<div>
								<h4 className='text-lg font-bold text-white'>
									{lastComponent.name}
								</h4>
								<p className='text-sm text-gray-400'>
									{lastComponent.created_at}
								</p>
							</div>
						</div>
					</div>
				)}

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
								setSelectedCategory(
									e.target.value ? Number(e.target.value) : null
								)
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
			</div>
		</div>
	)
}

export default Admin
