'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import useConfirmation from '@/hooks/useConfirmation'
import { toast, ToastContainer } from 'react-toastify'
import Link from 'next/link'
import Sidebar from '../_components/Sidebar'
import { Bar } from 'react-chartjs-2'
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
} from 'chart.js'
import { ChartOptions } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

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
	const [components, setComponents] = useState<Component[]>([])
	const { confirmDelete } = useConfirmation()
	const [selectedBrand, setSelectedBrand] = useState<string | null>(null)
	const router = useRouter()
	const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
	const [currentPage, setCurrentPage] = useState(1)
	const [pageSize, setPageSize] = useState(10)
	const [totalComponentsCount, setTotalComponentsCount] = useState(0)

	// Добавляем состояние для totalCategories
	const [totalCategories, setTotalCategories] = useState<number>(0)

	useEffect(() => {
		const fetchConfigurations = async () => {
			try {
				const res = await fetch('/api/configurations', { method: 'GET' })

				if (!res.ok) {
					throw new Error(`Ошибка: ${res.status} ${res.statusText}`)
				}

				const data = await res.json()
				setConfigurations(data)
			} catch (error) {
				console.error('Ошибка при загрузке конфигураций:', error)
			}
		}

		const fetchData = async () => {
			try {
				const res = await fetch('/api/products', { method: 'GET' })

				if (!res.ok) {
					throw new Error(`Ошибка: ${res.status} ${res.statusText}`)
				}

				const data = await res.json()

				if (data.categories) {
					setCategories(data.categories)
					setTotalCategories(data.categories.length) // Сохраняем количество категорий
				}

				if (data.components) {
					setComponents(data.components)
					setTotalComponentsCount(data.components.length) // Сохраняем количество категорий
				}
				setIsLoading(false)
			} catch (error) {
				console.error('Ошибка при загрузке данных:', error)
			}
		}

		fetchData()
		fetchConfigurations()
	}, [])

	const totalConfigurations = configurations?.length || 0
	const totalComponents = components?.length || 0
	const totalOrders = orders?.length || 0

	const lastComponent = components.sort((a, b) => {
		return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
	})[0]

	// Статистика
	const hiddenComponentsCount = components.filter(
		component => component.hidden
	).length

	// Готовим данные для графика
	const componentsByCategory = categories.map(category => ({
		name: category.name,
		count: components.filter(component => component.category_id === category.id)
			.length,
	}))

	const data = {
		labels: componentsByCategory.map(item => item.name),
		datasets: [
			{
				label: 'Количество товаров',
				data: componentsByCategory.map(item => item.count),
				backgroundColor: '#4A90E2',
				borderColor: '#357ABD',
				borderWidth: 1,
				hoverBackgroundColor: '#357ABD',
				hoverBorderColor: '#2F6A91',
			},
		],
	}

	const options: ChartOptions<"bar"> = {
		responsive: true,
		plugins: {
			tooltip: {
				callbacks: {
					label: (tooltipItem: any) => `${tooltipItem.raw} товаров`,
				},
			},
			legend: {
				position: 'top' as const,
			},
		},
		animation: {
			duration: 1000, // длительность анимации
			easing: 'easeInOutCubic' as const, // одно из разрешенных значений
		},
	}


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

					{/* Новые карточки для скрытых компонентов и категорий */}
					<div className='bg-[#202529] p-6 rounded-lg shadow-lg text-white'>
						<h3 className='text-xl font-bold'>Скрытых компонентов</h3>
						<p className='text-3xl'>{hiddenComponentsCount}</p>
						<p>Общее количество</p>
					</div>
					<div className='bg-[#202529] p-6 rounded-lg shadow-lg text-white'>
						<h3 className='text-xl font-bold'>Категорий</h3>
						<p className='text-3xl'>{totalCategories}</p>
						<p>Общее количество</p>
					</div>
				</div>

				<div className='bg-[#202529] p-6 rounded-lg shadow-lg'>
					<h3 className='text-xl font-bold text-white'>
						Количество товаров по категориям
					</h3>
					<div className='mt-6'>
						<Bar data={data} options={options} />
					</div>
				</div>

				<div className='bg-[#202529] p-6 rounded-lg shadow-lg mt-6'>
					<h3 className='text-xl font-bold text-white'>
						Последние конфигурации
					</h3>
					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4'>
						{configurations?.length ? (
							configurations.map(config => (
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
									<h4 className='text-lg font-bold text-white'>
										{config.name}
									</h4>
									<p className='text-sm text-gray-400'>{config.created_at}</p>
								</Link>
							))
						) : (
							<p className='text-white'>Загружаются конфигурации...</p>
						)}
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
			</div>
		</div>
	)
}

export default Admin
