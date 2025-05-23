'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast, ToastContainer } from 'react-toastify'
import Sidebar from '../_components/Sidebar'
import { injectThemeClasses } from '@/lib/themeInjection'
import { useNotifications } from '@/context/NotificationContext'

import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	ArcElement,
	Title,
	Tooltip,
	Legend,
	PointElement,
	LineElement,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import {
	PlusCircle,
	Layers,
	TrendingUp,
	AlertCircle,
	DollarSign,
	ShoppingCart,
	Package,
	Clock,
	Cpu,
	PcCase,
	Bell,
} from 'lucide-react'

// Register ChartJS components
ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	ArcElement,
	Title,
	Tooltip,
	Legend,
	PointElement,
	LineElement
)

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
	status: string
	generated_order_number: string
	total: any // Could be number, string, or object
	subtotal: any
	tax: any
	shipping_cost: any
	customer_first_name: string
	customer_last_name: string
}

interface StatsCard {
	title: string
	value: number
	icon: React.ReactNode
	trend?: number
	color: string
}

// Helper function to ensure all price values are properly formatted as numbers
function ensureNumberPrice(price: any): number {
	// If it's null or undefined, return 0
	if (price === null || price === undefined) {
		return 0
	}

	// If it's an object (like {value: 123}), extract the value
	if (typeof price === 'object') {
		return ensureNumberPrice(price.value || price.price || 0)
	}

	// If it's a string, convert to number
	if (typeof price === 'string') {
		const parsed = parseFloat(price)
		return isNaN(parsed) ? 0 : parsed
	}

	// If it's a number but NaN, return 0
	if (typeof price === 'number' && isNaN(price)) {
		return 0
	}

	// If it's already a valid number, return it
	return typeof price === 'number' ? price : 0
}

const Admin = () => {
	const [categories, setCategories] = useState<Category[]>([])
	const [configurations, setConfigurations] = useState<any[]>([])
	const [orders, setOrders] = useState<Order[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [components, setComponents] = useState<Component[]>([])
	const [recentOrders, setRecentOrders] = useState<Order[]>([])
	const [salesByMonth, setSalesByMonth] = useState<number[]>([])
	const [orderStatusCounts, setOrderStatusCounts] = useState<{
		[key: string]: number
	}>({})
	const router = useRouter()
	const { addNotification } = useNotifications()

	// For performance tracking
	const [pageLoadTime, setPageLoadTime] = useState<number | null>(null)
	const [resourcesLoaded, setResourcesLoaded] = useState<boolean>(false)

	useEffect(() => {
		injectThemeClasses()
	}, [])

	useEffect(() => {
		const startTime = performance.now()

		const fetchAllData = async () => {
			try {
				// Fetch configurations, products, and orders in parallel
				const [configRes, productsRes, ordersRes] = await Promise.all([
					fetch('/api/configurations', { method: 'GET' }),
					fetch('/api/products', { method: 'GET' }),
					fetch('/api/orders', { method: 'GET' }),
				])

				if (!configRes.ok || !productsRes.ok) {
					throw new Error(
						`Error fetching data: ${
							!configRes.ok ? 'Configurations' : 'Products'
						}`
					)
				}

				const [configData, productsData, ordersData] = await Promise.all([
					configRes.json(),
					productsRes.json(),
					ordersRes.json(),
				])

				// Set state with fetched data
				setConfigurations(configData || [])

				if (productsData.categories) {
					setCategories(productsData.categories)
				}

				if (productsData.components) {
					setComponents(productsData.components)
				}

				if (ordersData) {
					// Process order data to ensure numerical values
					const processedOrders = ordersData.map((order: Order) => ({
						...order,
						total: ensureNumberPrice(order.total),
						subtotal: ensureNumberPrice(order.subtotal),
						tax: ensureNumberPrice(order.tax),
						shipping_cost: ensureNumberPrice(order.shipping_cost),
					}))

					setOrders(processedOrders)
					// Get recent orders (last 5)
					setRecentOrders(processedOrders.slice(0, 5))

					// Process order statuses for the chart
					const statusCounts: { [key: string]: number } = {}
					processedOrders.forEach((order: Order) => {
						const status = order.status || 'pending' // Default to pending if no status
						statusCounts[status] = (statusCounts[status] || 0) + 1
					})
					setOrderStatusCounts(statusCounts)

					// Generate real monthly revenue data from orders
					generateMonthlyRevenueData(processedOrders)
				}

				const endTime = performance.now()
				setPageLoadTime(endTime - startTime)
				setResourcesLoaded(true)
			} catch (error) {
				console.error('Error fetching dashboard data:', error)
				toast.error('Failed to load dashboard data')
			} finally {
				setIsLoading(false)
			}
		}

		fetchAllData()
	}, [])

	// Function to generate real monthly revenue data
	const generateMonthlyRevenueData = (ordersData: Order[]) => {
		// Initialize array with zeros for all 12 months
		const monthlyRevenue = Array(12).fill(0)

		// Current year
		const currentYear = new Date().getFullYear()

		// Process each order
		ordersData.forEach(order => {
			const orderDate = new Date(order.created_at)
			// Only include orders from current year
			if (orderDate.getFullYear() === currentYear) {
				const month = orderDate.getMonth() // 0-11
				monthlyRevenue[month] += ensureNumberPrice(order.total)
			}
		})

		setSalesByMonth(monthlyRevenue)
	}

	// Stats for dashboard
	const totalConfigurations = configurations?.length || 0
	const totalComponents = components?.length || 0
	const totalOrders = orders?.length || 0
	const totalCategories = categories?.length || 0
	const hiddenComponentsCount = components.filter(
		component => component.hidden
	).length

	// Properly calculate total revenue
	function calculateTotalRevenue(orders: Order[]): number {
		return orders.reduce((total, order) => {
			return total + ensureNumberPrice(order.total)
		}, 0)
	}

	const totalRevenue = calculateTotalRevenue(orders)

	const statsCards: StatsCard[] = [
		{
			title: 'Общий доход',
			value: totalRevenue,
			icon: <DollarSign size={24} />,
			trend: 18.2,
			color: 'bg-gradient-to-r from-green-600 to-green-400',
		},
		{
			title: 'Заказы',
			value: totalOrders,
			icon: <ShoppingCart size={24} />,
			trend: 5.3,
			color: 'bg-gradient-to-r from-blue-600 to-blue-400',
		},
		{
			title: 'Конфигурации',
			value: totalConfigurations,
			icon: <Layers size={24} />,
			trend: 12.1,
			color: 'bg-gradient-to-r from-indigo-600 to-indigo-400',
		},
		{
			title: 'Комплектующие',
			value: totalComponents,
			icon: <Package size={24} />,
			trend: -2.4,
			color: 'bg-gradient-to-r from-purple-600 to-purple-400',
		},
		{
			title: 'Категории',
			value: totalCategories,
			icon: <Layers size={24} />,
			trend: 0,
			color: 'bg-gradient-to-r from-yellow-500 to-yellow-300',
		},
		{
			title: 'Скрытые комплектующие',
			value: hiddenComponentsCount,
			icon: <AlertCircle size={24} />,
			trend: 8.5,
			color: 'bg-gradient-to-r from-red-600 to-red-400',
		},
	]

	// Chart data for component distribution
	const componentsByCategory = categories.map(category => ({
		name: category.name,
		count: components.filter(component => component.category_id === category.id)
			.length,
	}))

	const categoryChartData = {
		labels: componentsByCategory.map(item => item.name),
		datasets: [
			{
				label: 'Components',
				data: componentsByCategory.map(item => item.count),
				backgroundColor: [
					'rgba(54, 162, 235, 0.8)',
					'rgba(255, 99, 132, 0.8)',
					'rgba(75, 192, 192, 0.8)',
					'rgba(255, 206, 86, 0.8)',
					'rgba(153, 102, 255, 0.8)',
					'rgba(255, 159, 64, 0.8)',
				],
				borderColor: [
					'rgba(54, 162, 235, 1)',
					'rgba(255, 99, 132, 1)',
					'rgba(75, 192, 192, 1)',
					'rgba(255, 206, 86, 1)',
					'rgba(153, 102, 255, 1)',
					'rgba(255, 159, 64, 1)',
				],
				borderWidth: 1,
			},
		],
	}

	const months = [
		'Янв',
		'Фев',
		'Мар',
		'Апр',
		'Май',
		'Июн',
		'Июл',
		'Авг',
		'Сен',
		'Окт',
		'Ноя',
		'Дек',
	]

	const salesChartData = {
		labels: months,
		datasets: [
			{
				label: 'Доход ($)',
				data: salesByMonth,
				backgroundColor: 'rgba(75, 192, 192, 0.6)',
				borderColor: 'rgba(75, 192, 192, 1)',
				borderWidth: 1,
			},
		],
	}

	// Order status chart data (uses real data now)
	const getOrderStatusChartData = () => {
		// Define standard statuses and colors (even if some have 0 orders)
		const statusLabels = [
			'В ожидании',
			'Обрабатывается',
			'Отправлено',
			'Доставлено',
			'Отменено',
		]
		const backgroundColors = [
			'rgba(255, 206, 86, 0.8)', // pending - yellow
			'rgba(54, 162, 235, 0.8)', // processing - blue
			'rgba(153, 102, 255, 0.8)', // shipped - purple
			'rgba(75, 192, 192, 0.8)', // delivered - green
			'rgba(255, 99, 132, 0.8)', // cancelled - red
		]
		const borderColors = [
			'rgba(255, 206, 86, 1)',
			'rgba(54, 162, 235, 1)',
			'rgba(153, 102, 255, 1)',
			'rgba(75, 192, 192, 1)',
			'rgba(255, 99, 132, 1)',
		]

		// Map actual data to these standard statuses
		const statusData = statusLabels.map(
			status => orderStatusCounts[status] || 0
		)

		// Create proper chart data
		return {
			labels: statusLabels.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
			datasets: [
				{
					data: statusData,
					backgroundColor: backgroundColors,
					borderColor: borderColors,
					borderWidth: 1,
				},
			],
		}
	}

	const orderStatusChartData = getOrderStatusChartData()

	const quickActions = [
		{
			name: 'Добавить комплектующую',
			icon: <Cpu size={20} />,
			href: '/admin/add-component',
		},
		{
			name: 'Добавить конфигурацию',
			icon: <PcCase size={20} />,
			href: '/admin/add-config',
		},
		{
			name: 'Посмотреть заказы',
			icon: <ShoppingCart size={20} />,
			href: '/admin/orders',
		},
		{
			name: 'Управление категориями',
			icon: <Layers size={20} />,
			href: '/admin/categories',
		},
	]

	// Function to test notifications
	const testNotification = () => {
		addNotification(
			`New order received #ORD${Math.floor(Math.random() * 10000)
				.toString()
				.padStart(4, '0')}`
		)
		toast.success('Test notification sent')
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
		<div className='flex bg-[#171C1F] min-h-screen'>
			<Sidebar />
			<div className='flex-1 p-6 ml-16 overflow-auto'>
				<ToastContainer />

				{/* Header section */}
				<div className='flex justify-between items-center mb-8'>
					<div>
						<h1 className='text-3xl font-bold text-white'>Админ-панель</h1>
						<p className='text-gray-400'>Добро пожаловать в админ-панель</p>
					</div>
					<div className='flex gap-4'>
						{quickActions.map((action, i) => (
							<Link
								key={i}
								href={action.href}
								className='flex items-center gap-2 px-4 py-2 bg-[#202529] rounded-lg hover:bg-[#2a3038] transition-colors text-white text-sm'
							>
								{action.icon}
								<span className='hidden md:inline'>{action.name}</span>
							</Link>
						))}
					</div>
				</div>

				{/* Stats cards */}
				<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'>
					{statsCards.map((stat, i) => (
						<div
							key={i}
							className={`${stat.color} rounded-xl shadow-lg overflow-hidden`}
						>
							<div className='p-6 text-white'>
								<div className='flex justify-between items-center mb-4'>
									<h3 className='font-medium text-lg'>{stat.title}</h3>
									<div className='bg-white/20 rounded-lg p-2'>{stat.icon}</div>
								</div>
								<div className='flex items-end gap-3'>
									<p className='text-3xl font-bold'>
										{stat.title === 'Total Revenue'
											? `$${stat.value.toFixed(2)}`
											: stat.value.toLocaleString()}
									</p>
									{stat.trend !== undefined && (
										<div
											className={`flex items-center text-sm ${
												stat.trend >= 0 ? 'text-green-200' : 'text-red-200'
											}`}
										>
											{stat.trend >= 0 ? '↑' : '↓'} {Math.abs(stat.trend)}%
										</div>
									)}
								</div>
							</div>
						</div>
					))}
				</div>

				{/* Charts section */}
				<div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
					{/* Sales Chart */}
					<div className='bg-[#202529] rounded-xl shadow-lg p-6'>
						<h2 className='text-xl font-bold text-white mb-4'>
							Обзор доходов
						</h2>
						<div className='h-80'>
							<Bar
								data={salesChartData}
								options={{
									responsive: true,
									maintainAspectRatio: false,
									plugins: {
										legend: {
											display: false,
										},
										tooltip: {
											backgroundColor: '#22282e',
											titleFont: { size: 14 },
											bodyFont: { size: 13 },
											callbacks: {
												label: function (context) {
													return `Revenue: $${context.raw}`
												},
											},
										},
									},
									scales: {
										y: {
											grid: {
												color: 'rgba(255, 255, 255, 0.1)',
											},
											ticks: {
												color: 'rgba(255, 255, 255, 0.7)',
												callback: function (value) {
													return '$' + value
												},
											},
										},
										x: {
											grid: {
												display: false,
											},
											ticks: {
												color: 'rgba(255, 255, 255, 0.7)',
											},
										},
									},
								}}
							/>
						</div>
					</div>

					{/* Order Status Chart */}
					<div className='bg-[#202529] rounded-xl shadow-lg p-6'>
						<h2 className='text-xl font-bold text-white mb-4'>Статус заказа</h2>
						<div className='flex justify-center items-center h-80'>
							<div className='w-3/4'>
								<Doughnut
									data={orderStatusChartData}
									options={{
										responsive: true,
										maintainAspectRatio: false,
										plugins: {
											legend: {
												position: 'right',
												labels: {
													color: 'white',
													padding: 20,
													font: {
														size: 14,
													},
												},
											},
											tooltip: {
												backgroundColor: '#22282e',
												titleFont: { size: 14 },
												bodyFont: { size: 13 },
												callbacks: {
													label: function (context) {
														const label = context.label || ''
														const value = context.raw

														// Safe type checking
														if (typeof value !== 'number') {
															return `${label}: 0 (0%)`
														}

														// Calculate total - safely
														const datasetData =
															context.chart.data.datasets[0].data
														let total = 0

														for (let i = 0; i < datasetData.length; i++) {
															const currentValue = datasetData[i]
															if (typeof currentValue === 'number') {
																total += currentValue
															}
														}

														const percentage =
															total > 0 ? Math.round((value / total) * 100) : 0
														return `${label}: ${value} (${percentage}%)`
													},
												},
											},
										},
										cutout: '70%',
									}}
								/>
							</div>
						</div>
					</div>
				</div>

				{/* Components distribution */}
				<div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'>
					<div className='bg-[#202529] rounded-xl shadow-lg p-6 lg:col-span-2'>
						<h2 className='text-xl font-bold text-white mb-4'>
							Распределение комплектующих по категориям
						</h2>
						<div className='h-80'>
							<Bar
								data={categoryChartData}
								options={{
									responsive: true,
									maintainAspectRatio: false,
									indexAxis: 'y' as const,
									plugins: {
										legend: {
											display: false,
										},
										tooltip: {
											backgroundColor: '#22282e',
											titleFont: { size: 14 },
											bodyFont: { size: 13 },
										},
									},
									scales: {
										y: {
											grid: {
												display: false,
											},
											ticks: {
												color: 'rgba(255, 255, 255, 0.7)',
											},
										},
										x: {
											grid: {
												color: 'rgba(255, 255, 255, 0.1)',
											},
											ticks: {
												color: 'rgba(255, 255, 255, 0.7)',
											},
										},
									},
								}}
							/>
						</div>
					</div>

					<div className='bg-[#202529] rounded-xl shadow-lg p-6'>
						<h2 className='text-xl font-bold text-white mb-4'>Последние заказы</h2>
						<div className='overflow-y-auto max-h-80'>
							{recentOrders.length > 0 ? (
								<ul className='space-y-4'>
									{recentOrders.map(order => (
										<li
											key={order.id}
											className='bg-[#262a30] p-3 rounded-lg flex justify-between items-center'
										>
											<div>
												<p className='text-white font-medium'>
													#{order.generated_order_number}
												</p>
												<p className='text-gray-400 text-sm'>
													{new Date(order.created_at).toLocaleDateString()}
												</p>
											</div>
											<div>
												<span
													className={`px-3 py-1 rounded-full text-xs font-medium ${
														order.status === 'delivered'
															? 'bg-green-900 text-green-200'
															: order.status === 'pending'
															? 'bg-yellow-900 text-yellow-200'
															: order.status === 'cancelled'
															? 'bg-red-900 text-red-200'
															: order.status === 'shipped'
															? 'bg-purple-900 text-purple-200'
															: 'bg-blue-900 text-blue-200'
													}`}
												>
													{order.status}
												</span>
											</div>
										</li>
									))}
								</ul>
							) : (
								<div className='flex flex-col items-center justify-center h-64 text-gray-400'>
									<ShoppingCart size={48} className='mb-4 opacity-50' />
									<p>Пока нет заказов</p>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Recent configurations */}
				<div className='bg-[#202529] rounded-xl shadow-lg p-6 mb-8'>
					<div className='flex justify-between items-center mb-6'>
						<h2 className='text-xl font-bold text-white'>
							Последние конфигурации
						</h2>
						<Link
							href='/admin/configurations'
							className='text-blue-400 text-sm hover:underline'
						>
							Посмотреть все
						</Link>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
						{configurations.slice(0, 3).map(config => (
							<Link
								href={`/config/${config.id}`}
								key={config.id}
								className='bg-[#2a2e35] rounded-lg overflow-hidden transition-transform hover:scale-[1.02] focus:scale-[1.02]'
							>
								<div className='h-40 relative'>
									<Image
										src={config.image_url || '/default-image.jpg'}
										alt={config.name}
										fill
										className='object-cover'
									/>
								</div>
								<div className='p-4'>
									<h4 className='text-lg font-bold text-white truncate'>
										{config.name}
									</h4>
									<p className='text-gray-400 text-sm mt-1 truncate'>
										{config.description || 'No description available'}
									</p>
									<div className='flex justify-between items-center mt-3'>
										<p className='text-blue-400 font-bold'>
											${config.price?.toFixed(2) || '0.00'}
										</p>
										<p className='text-xs text-gray-500'>
											{new Date(config.created_at).toLocaleDateString()}
										</p>
									</div>
								</div>
							</Link>
						))}
					</div>
				</div>

				{/* Performance stats */}
				{resourcesLoaded && (
					<div className='bg-[#202529] rounded-xl shadow-lg p-6'>
						<h2 className='text-xl font-bold text-white mb-4'>
							Статистика производительности
						</h2>
						<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
							<div className='bg-[#262a30] p-4 rounded-lg'>
								<p className='text-gray-400 mb-1'>Page Load Time</p>
								<div className='flex items-end gap-2'>
									<p className='text-2xl font-bold text-white'>
										{pageLoadTime ? (pageLoadTime / 1000).toFixed(2) : '-'} sec
									</p>
									<Clock size={18} className='text-gray-400 mb-1' />
								</div>
							</div>
							<div className='bg-[#262a30] p-4 rounded-lg'>
								<p className='text-gray-400 mb-1'>Resources Loaded</p>
								<p className='text-2xl font-bold text-white'>3 APIs</p>
							</div>
							<div className='bg-[#262a30] p-4 rounded-lg'>
								<p className='text-gray-400 mb-1'>Last Updated</p>
								<p className='text-2xl font-bold text-white'>
									{new Date().toLocaleTimeString()}
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
