'use client'

import { JSX, useEffect, useState } from 'react'
import {
  Search,
  Filter,
  Download,
  Trash2,
  RefreshCw,
  Eye,
  Edit,
  X,
  Check,
  Star,
  StarOff,
  AlertCircle,
  Info,
  Bell,
} from 'lucide-react'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Sidebar from '../_components/Sidebar'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'

interface OrderItem {
	name: string
	quantity: number
	price: number
	totalPrice: number
}

interface Order {
	id: number
	generated_order_number: string
	status: string
	created_at: string
	configuration_id: number
	customer_first_name: string
	customer_last_name: string
	customer_email: string
	customer_phone: string
	shipping_address: string
	shipping_city: string
	shipping_state: string
	shipping_zip: string
	shipping_country: string
	payment_method: string
	subtotal: number
	shipping_cost: number
	tax: number
	total: number
	items: OrderItem[] | string // Items can be an array or a JSON string
	// For backward compatibility with your UI code
	customer_name?: string
	email?: string
	phone?: string
	address?: string
	total_amount?: number
}

interface Favorite {
  id: number;
  admin_id: string;
  configuration_id?: string | null;
  product_id?: number | null;
  order_id?: number | null;
  created_at: string;
}

const OrdersPage = () => {
	const { user } = useAuth()
	const [orders, setOrders] = useState<Order[]>([])
	const [loading, setLoading] = useState<boolean>(true)
	const [searchTerm, setSearchTerm] = useState<string>('')
	const [statusFilter, setStatusFilter] = useState<string>('all')
	const [sortField, setSortField] = useState<string>('created_at')
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
	const [selectedOrders, setSelectedOrders] = useState<number[]>([])
	const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
	const [pageSize, setPageSize] = useState<number>(10)
	const [currentPage, setCurrentPage] = useState<number>(1)
	const [isLoading, setIsLoading] = useState(true)

	// State for favorites
	const [favoriteOrders, setFavoriteOrders] = useState<Record<number, boolean>>(
		{}
	)
	const [favoriteLoading, setFavoriteLoading] = useState<
		Record<number, boolean>
	>({})

	// State for view modal
	const [viewOrder, setViewOrder] = useState<Order | null>(null)
	const [viewModalOpen, setViewModalOpen] = useState<boolean>(false)

	// State for edit modal
	const [editOrder, setEditOrder] = useState<Order | null>(null)

	// State for confirm delete modal
	const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false)
	const [orderToDelete, setOrderToDelete] = useState<number | null>(null)

	const fetchOrders = async () => {
		try {
			setLoading(true)
			setIsRefreshing(true)

			const response = await fetch('/api/orders')
			if (!response.ok) {
				throw new Error('Failed to fetch orders')
			}

			const data = await response.json()

			// Process the data to add backward compatibility fields and fix price values
			const processedData = data.map((order: Order) => {
				// Parse items if they're a string
				let parsedItems = order.items
				if (typeof order.items === 'string') {
					try {
						parsedItems = JSON.parse(order.items)

						// Ensure prices in items are numbers
						if (Array.isArray(parsedItems)) {
							parsedItems = parsedItems.map(item => ({
								...item,
								price: ensureNumberPrice(item.price),
								totalPrice: ensureNumberPrice(item.totalPrice),
							}))
						}
					} catch (e) {
						console.error('Error parsing order items:', e)
						parsedItems = []
					}
				}

				// Ensure all price fields are numbers
				return {
					...order,
					items: parsedItems,
					subtotal: ensureNumberPrice(order.subtotal),
					shipping_cost: ensureNumberPrice(order.shipping_cost),
					tax: ensureNumberPrice(order.tax),
					total: ensureNumberPrice(order.total),
					customer_name: `${order.customer_first_name} ${order.customer_last_name}`,
					email: order.customer_email,
					phone: order.customer_phone,
					address: `${order.shipping_address}, ${order.shipping_city}, ${order.shipping_state} ${order.shipping_zip}`,
					total_amount: ensureNumberPrice(order.total),
				}
			})

			setOrders(processedData)
		} catch (error) {
			console.error('Error loading orders:', error)
			toast.error('Failed to load orders')
		} finally {
			setLoading(false)
			setIsRefreshing(false)
		}
	}

	function ensureNumberPrice(price: any): number {
		if (typeof price === 'object' && price !== null) {
			// If it's an object, try to extract the value
			return price.value || price.price || 0
		}

		if (typeof price === 'string') {
			// If it's a string, try to parse it
			const parsed = parseFloat(price)
			return isNaN(parsed) ? 0 : parsed
		}

		// If it's already a number, just return it
		return typeof price === 'number' ? price : 0
	}

	// Updated version of the formatCurrency function
	// Removed duplicate declaration of formatCurrency

	const handleUpdateStatus = async (orderId: number, newStatus: string) => {
		try {
			const response = await fetch(`/api/orders/${orderId}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ status: newStatus }),
			})

			if (!response.ok) {
				throw new Error('Failed to update order status')
			}

			// Update order in state
			setOrders(prevOrders =>
				prevOrders.map(order =>
					order.id === orderId ? { ...order, status: newStatus } : order
				)
			)

			toast.success(`Order status updated to ${newStatus}`)
		} catch (error) {
			console.error('Error updating order status:', error)
			toast.error('Failed to update order status')
		}
	}

	const fetchFavorites = async () => {
		if (!user) return

		try {
			const response = await fetch(`/api/favorites?adminId=${user.id}`)
			if (!response.ok) throw new Error('Failed to fetch favorites')

			const favorites = await response.json()

			// Create a map of order IDs to favorite status
			const favMap: Record<number, boolean> = {}
			favorites.forEach((fav: Favorite) => {
				if (fav.order_id) {
					favMap[fav.order_id] = true
				}
			})

			setFavoriteOrders(favMap)
		} catch (error) {
			console.error('Error fetching favorites:', error)
		}
	}

	useEffect(() => {
		fetchOrders()
		fetchFavorites()
	}, [user])

	const handleRefresh = () => {
		fetchOrders()
		fetchFavorites()
	}

	const handleSort = (field: string) => {
		if (sortField === field) {
			setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
		} else {
			setSortField(field)
			setSortDirection('asc')
		}
	}

	const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.checked) {
			setSelectedOrders(filteredOrders.map(order => order.id))
		} else {
			setSelectedOrders([])
		}
	}

	const handleSelectOrder = (id: number) => {
		if (selectedOrders.includes(id)) {
			setSelectedOrders(selectedOrders.filter(orderId => orderId !== id))
		} else {
			setSelectedOrders([...selectedOrders, id])
		}
	}

	const handleViewOrder = (order: Order) => {
		setViewOrder(order)
		setViewModalOpen(true)
	}



	const handleSaveEditOrder = async () => {
		if (!editOrder) return

		try {
			const response = await fetch(`/api/orders/${editOrder.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					status: editOrder.status,
					// Only sending status for now as that's what our API supports
					// Add more fields if you expand the API
				}),
			})

			if (!response.ok) {
				throw new Error('Failed to update order')
			}

			// Update the order in local state
			setOrders(
				orders.map(order =>
					order.id === editOrder.id
						? {
								...order,
								status: editOrder.status,
								// Add other fields here if your API supports updating them
						  }
						: order
				)
			)

			toast.success('Order updated successfully')
		} catch (error) {
			console.error('Error updating order:', error)
			toast.error('Failed to update order')
		}
	}

	const handleConfirmDelete = (id: number) => {
		setOrderToDelete(id)
		setDeleteModalOpen(true)
	}

	const handleDeleteOrder = async () => {
		if (orderToDelete === null) return

		try {
			const response = await fetch(`/api/orders/${orderToDelete}`, {
				method: 'DELETE',
			})

			if (!response.ok) {
				throw new Error('Failed to delete order')
			}

			// Update local state
			setOrders(orders.filter(order => order.id !== orderToDelete))

			// If the deleted order was in favorites, remove it
			if (favoriteOrders[orderToDelete]) {
				const newFavorites = { ...favoriteOrders }
				delete newFavorites[orderToDelete]
				setFavoriteOrders(newFavorites)
			}

			toast.success('Order deleted successfully')
			setDeleteModalOpen(false)
			setOrderToDelete(null)
		} catch (error) {
			console.error('Error deleting order:', error)
			toast.error('Failed to delete order')
		}
	}

	const handleDeleteSelected = async () => {
		if (selectedOrders.length === 0) return

		try {
			// Delete each selected order one by one
			const deletePromises = selectedOrders.map(id =>
				fetch(`/api/orders/${id}`, { method: 'DELETE' })
			)

			await Promise.all(deletePromises)

			// Update local state
			setOrders(orders.filter(order => !selectedOrders.includes(order.id)))

			// Remove deleted orders from favorites
			const newFavorites = { ...favoriteOrders }
			selectedOrders.forEach(id => {
				if (newFavorites[id]) {
					delete newFavorites[id]
				}
			})
			setFavoriteOrders(newFavorites)

			toast.success(`${selectedOrders.length} orders deleted successfully`)
			setSelectedOrders([])
		} catch (error) {
			console.error('Error deleting orders:', error)
			toast.error('Failed to delete orders')
		}
	}

	const toggleFavorite = async (orderId: number) => {
		if (!user) {
			toast.error('Please log in to add favorites')
			return
		}

		setFavoriteLoading(prev => ({ ...prev, [orderId]: true }))

		try {
			const isFavorite = favoriteOrders[orderId]

			if (!isFavorite) {
				// Add to favorites
				const response = await fetch('/api/favorites', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						admin_id: user.id,
						configuration_id: null,
						product_id: null,
						order_id: orderId,
					}),
				})

				if (!response.ok) {
					const data = await response.json()
					throw new Error(data.error || 'Failed to add to favorites')
				}

				setFavoriteOrders(prev => ({ ...prev, [orderId]: true }))
				toast.success('Added to favorites')
			} else {
				// Remove from favorites
				// First, find the favorite record
				const getFavoritesRes = await fetch(`/api/favorites?adminId=${user.id}`)
				const favoritesData = await getFavoritesRes.json()

				const favoriteToDelete = favoritesData.find(
					(fav: Favorite) => fav.order_id === orderId
				)

				if (!favoriteToDelete) {
					throw new Error('Favorite record not found')
				}

				// Delete the favorite
				const deleteRes = await fetch(
					`/api/favorites?id=${favoriteToDelete.id}`,
					{
						method: 'DELETE',
					}
				)

				if (!deleteRes.ok) {
					const data = await deleteRes.json()
					throw new Error(data.error || 'Failed to remove from favorites')
				}

				const newFavorites = { ...favoriteOrders }
				delete newFavorites[orderId]
				setFavoriteOrders(newFavorites)
				toast.success('Removed from favorites')
			}
		} catch (error) {
			console.error('Error toggling favorite:', error)
			toast.error(
				error instanceof Error ? error.message : 'Error updating favorites'
			)
		} finally {
			setFavoriteLoading(prev => ({ ...prev, [orderId]: false }))
		}
	}

	const exportToCsv = () => {
		// Implement CSV export
		const headers = [
			'ID',
			'Order Number',
			'Customer',
			'Status',
			'Total',
			'Date Created',
		]
		const dataToExport = filteredOrders.map(order => [
			order.id,
			order.generated_order_number,
			`${order.customer_first_name} ${order.customer_last_name}`,
			order.status,
			(order.total || 0).toLocaleString('ru-RU') + ' ₽',
			new Date(order.created_at).toLocaleString(),
		])

		const csvContent = [
			headers.join(','),
			...dataToExport.map(row => row.join(',')),
		].join('\n')

		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
		const url = URL.createObjectURL(blob)
		const link = document.createElement('a')
		link.setAttribute('href', url)
		link.setAttribute(
			'download',
			`orders_export_${new Date().toISOString()}.csv`
		)
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
	}

	// Filter and sort orders
	let filteredOrders = [...orders]

	// Apply status filter
	if (statusFilter !== 'all') {
		filteredOrders = filteredOrders.filter(
			order => order.status === statusFilter
		)
	}

	// Apply search filter
	if (searchTerm) {
		filteredOrders = filteredOrders.filter(
			order =>
				order.generated_order_number
					.toLowerCase()
					.includes(searchTerm.toLowerCase()) ||
				order.id.toString().includes(searchTerm) ||
				`${order.customer_first_name} ${order.customer_last_name}`
					.toLowerCase()
					.includes(searchTerm.toLowerCase()) ||
				order.customer_email.toLowerCase().includes(searchTerm.toLowerCase())
		)
	}

	// Apply sorting
	filteredOrders.sort((a, b) => {
		if (sortField === 'id') {
			return sortDirection === 'asc' ? a.id - b.id : b.id - a.id
		} else if (sortField === 'created_at') {
			return sortDirection === 'asc'
				? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
				: new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
		} else {
			const aValue = a[sortField as keyof Order] || ''
			const bValue = b[sortField as keyof Order] || ''
			return sortDirection === 'asc'
				? aValue.toString().localeCompare(bValue.toString())
				: bValue.toString().localeCompare(aValue.toString())
		}
	})

	// Pagination
	const totalPages = Math.ceil(filteredOrders.length / pageSize)
	const paginatedOrders = filteredOrders.slice(
		(currentPage - 1) * pageSize,
		currentPage * pageSize
	)

	const getStatusBadgeClass = (status: string) => {
		switch (status.toLowerCase()) {
			case 'pending':
				return 'bg-yellow-100 text-yellow-800'
			case 'processing':
				return 'bg-blue-100 text-blue-800'
			case 'shipped':
				return 'bg-purple-100 text-purple-800'
			case 'delivered':
				return 'bg-green-100 text-green-800'
			case 'cancelled':
				return 'bg-red-100 text-red-800'
			default:
				return 'bg-gray-100 text-gray-800'
		}
	}

	// Function to format currency
	const formatCurrency = (amount: any) => {
		const numberAmount = ensureNumberPrice(amount)
		return new Intl.NumberFormat('en-EN', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0,
		}).format(numberAmount)
	}

	// This is the updated renderOrderItems function for the OrdersPage component

	const renderOrderItems = (items: any) => {
		// Handle items based on their type
		if (Array.isArray(items)) {
			let rows: JSX.Element[] = []

			items.forEach((item, index) => {
				// Add main item row
				rows.push(
					<tr key={`item-${index}`} className='hover:bg-gray-850'>
						<td className='px-4 py-3 text-sm font-medium text-gray-200'>
							{item.name || item.configName}
						</td>
						<td className='px-4 py-3 text-sm text-gray-300 text-right'>
							{formatCurrency(item.price)}
						</td>
						<td className='px-4 py-3 text-sm text-gray-300 text-right'>
							{item.quantity}
						</td>
						<td className='px-4 py-3 text-sm font-medium text-gray-200 text-right'>
							{formatCurrency(
								ensureNumberPrice(item.price) * ensureNumberPrice(item.quantity)
							)}
						</td>
					</tr>
				)

				// Add component rows if they exist
				if (item.components && item.components.length > 0) {
					item.components.forEach((comp: any, compIndex: number) => {
						rows.push(
							<tr
								key={`item-${index}-comp-${compIndex}`}
								className='bg-gray-900'
							>
								<td className='px-4 py-2 text-xs text-gray-400 pl-8'>
									└ {comp.name}
								</td>
								<td className='px-4 py-2 text-xs text-gray-400 text-right'>
									{formatCurrency(comp.price)}
								</td>
								<td className='px-4 py-2 text-xs text-gray-400 text-right'>
									{comp.quantity || 1}
								</td>
								<td className='px-4 py-2 text-xs text-gray-400 text-right'>
									{formatCurrency(
										ensureNumberPrice(comp.price) *
											ensureNumberPrice(comp.quantity || 1)
									)}
								</td>
							</tr>
						)
					})
				}
			})

			return rows
		} else if (typeof items === 'string') {
			try {
				const parsedItems = JSON.parse(items)

				let rows: JSX.Element[] = []

				parsedItems.forEach((item: any, index: number) => {
					// Add main item row
					rows.push(
						<tr key={`item-${index}`} className='hover:bg-gray-850'>
							<td className='px-4 py-3 text-sm font-medium text-gray-200'>
								{item.name || item.configName}
							</td>
							<td className='px-4 py-3 text-sm text-gray-300 text-right'>
								{formatCurrency(item.price)}
							</td>
							<td className='px-4 py-3 text-sm text-gray-300 text-right'>
								{item.quantity}
							</td>
							<td className='px-4 py-3 text-sm font-medium text-gray-200 text-right'>
								{formatCurrency(
									ensureNumberPrice(item.price) *
										ensureNumberPrice(item.quantity)
								)}
							</td>
						</tr>
					)

					// Add component rows if they exist
					if (item.components && item.components.length > 0) {
						item.components.forEach((comp: any, compIndex: number) => {
							rows.push(
								<tr
									key={`item-${index}-comp-${compIndex}`}
									className='bg-gray-900'
								>
									<td className='px-4 py-2 text-xs text-gray-400 pl-8'>
										└ {comp.name}
									</td>
									<td className='px-4 py-2 text-xs text-gray-400 text-right'>
										{formatCurrency(comp.price)}
									</td>
									<td className='px-4 py-2 text-xs text-gray-400 text-right'>
										{comp.quantity || 1}
									</td>
									<td className='px-4 py-2 text-xs text-gray-400 text-right'>
										{formatCurrency(
											ensureNumberPrice(comp.price) *
												ensureNumberPrice(comp.quantity || 1)
										)}
									</td>
								</tr>
							)
						})
					}
				})

				return rows
			} catch (e) {
				console.error('Error parsing order items:', e)
				return (
					<tr>
						<td
							colSpan={4}
							className='px-4 py-3 text-sm text-gray-400 text-center'
						>
							Error parsing order items
						</td>
					</tr>
				)
			}
		} else {
			return (
				<tr>
					<td
						colSpan={4}
						className='px-4 py-3 text-sm text-gray-400 text-center'
					>
						No items found for this order
					</td>
				</tr>
			)
		}
	}

	if (loading) {
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
		<div className='min-h-screen bg-[#14181B] text-gray-100'>
			<Sidebar />
			<ToastContainer
				position='top-right'
				autoClose={3000}
				hideProgressBar={false}
				newestOnTop
				closeOnClick
				rtl={false}
				pauseOnFocusLoss
				draggable
				pauseOnHover
				theme='dark'
			/>

			<div className='p-6 max-w-7xl mx-auto'>
				{/* Header */}
				<div className='mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
					<h1 className='text-3xl font-bold text-white'>Управление заказами</h1>
					<div className='flex items-center gap-3'>
						<button
							onClick={handleRefresh}
							className='flex items-center gap-2 bg-[#202529] border border-gray-700 rounded-md px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-700'
						>
							<RefreshCw
								size={16}
								className={`${isRefreshing ? 'animate-spin' : ''}`}
							/>
							Обновить
						</button>

						<button
							onClick={exportToCsv}
							className='flex items-center gap-2 bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700'
						>
							<Download size={16} />
							Экспорт
						</button>

						{selectedOrders.length > 0 && (
							<button
								onClick={handleDeleteSelected}
								className='flex items-center gap-2 bg-red-600 rounded-md px-4 py-2 text-sm font-medium text-white hover:bg-red-700'
							>
								<Trash2 size={16} />
								Удалить ({selectedOrders.length})
							</button>
						)}
					</div>
				</div>

				{/* Filters and Search */}
				<div className='mb-6 flex flex-col sm:flex-row gap-4'>
					<div className='flex-1 relative'>
						<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
							<Search size={18} className='text-gray-400' />
						</div>
						<input
							type='text'
							placeholder='Поиск по номеру заказа, ID или клиенту...'
							value={searchTerm}
							onChange={e => setSearchTerm(e.target.value)}
							className='block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-md bg-[#202529] text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
						/>
					</div>

					<div className='flex items-center gap-2'>
						<Filter size={18} className='text-gray-400' />
						<select
							value={statusFilter}
							onChange={e => setStatusFilter(e.target.value)}
							className='block w-full py-2 px-3 border border-gray-700 bg-[#202529] rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm text-white'
						>
							<option value='all'>Все статусы</option>
							<option value='pending'>В ожидании</option>
							<option value='processing'>В обработке</option>
							<option value='shipped'>Отправлено</option>
							<option value='delivered'>Доставлено</option>
							<option value='cancelled'>Отменено</option>
						</select>
					</div>

					<div className='flex items-center gap-2'>
						<select
							value={pageSize}
							onChange={e => {
								setPageSize(Number(e.target.value))
								setCurrentPage(1) // Reset to first page when changing page size
							}}
							className='block w-full py-2 px-3 border border-gray-700 bg-[#202529] rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm text-white'
						>
							<option value={10}>10 на странице</option>
							<option value={25}>25 на странице</option>
							<option value={50}>50 на странице</option>
							<option value={100}>100 на странице</option>
						</select>
					</div>
				</div>

				{/* Orders Table */}
				<div className='bg-[#202529] overflow-hidden shadow rounded-lg border border-gray-700'>
					{loading ? (
						<div className='p-12 flex items-center justify-center'>
							<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500'></div>
						</div>
					) : paginatedOrders.length === 0 ? (
						<div className='p-12 text-center'>
							<div className='flex flex-col items-center justify-center'>
								<AlertCircle size={48} className='text-gray-500 mb-4' />
								<div className='text-gray-300 text-lg font-medium'>
									Не найдено заказов
								</div>
								<p className='text-gray-500 mt-2'>
									Попробуйте изменить параметры поиска или фильтрации
								</p>
							</div>
						</div>
					) : (
						<div className='overflow-x-auto'>
							<table className='min-w-full divide-y divide-gray-700'>
								<thead className='bg-gray-900'>
									<tr>
										<th
											scope='col'
											className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'
										>
											<div className='flex items-center'>
												<input
													type='checkbox'
													checked={
														selectedOrders.length === paginatedOrders.length
													}
													onChange={handleSelectAll}
													className='focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-700 rounded bg-gray-700'
												/>
											</div>
										</th>
										<th
											scope='col'
											className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer'
											onClick={() => handleSort('id')}
										>
											<div className='flex items-center'>
												ID
												{sortField === 'id' && (
													<span className='ml-1'>
														{sortDirection === 'asc' ? '↑' : '↓'}
													</span>
												)}
											</div>
										</th>
										<th
											scope='col'
											className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer'
											onClick={() => handleSort('generated_order_number')}
										>
											<div className='flex items-center'>
												Номер заказа
												{sortField === 'generated_order_number' && (
													<span className='ml-1'>
														{sortDirection === 'asc' ? '↑' : '↓'}
													</span>
												)}
											</div>
										</th>
										<th
											scope='col'
											className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer'
										>
											<div className='flex items-center'>Клиент</div>
										</th>
										<th
											scope='col'
											className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer'
											onClick={() => handleSort('status')}
										>
											<div className='flex items-center'>
												Статус
												{sortField === 'status' && (
													<span className='ml-1'>
														{sortDirection === 'asc' ? '↑' : '↓'}
													</span>
												)}
											</div>
										</th>
										<th
											scope='col'
											className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer'
										>
											<div className='flex items-center'>Итого</div>
										</th>
										<th
											scope='col'
											className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer'
											onClick={() => handleSort('created_at')}
										>
											<div className='flex items-center'>
												Дата создания
												{sortField === 'created_at' && (
													<span className='ml-1'>
														{sortDirection === 'asc' ? '↑' : '↓'}
													</span>
												)}
											</div>
										</th>
										<th
											scope='col'
											className='px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider'
										>
											Действия
										</th>
									</tr>
								</thead>
								<tbody className='bg-gray-800 divide-y divide-gray-700'>
									{paginatedOrders.map((order, index) => (
										<tr
											key={`order-${order.id}-${index}`}
											className='hover:bg-gray-750'
										>
											<td className='px-6 py-4 whitespace-nowrap'>
												<input
													type='checkbox'
													checked={selectedOrders.includes(order.id)}
													onChange={() => handleSelectOrder(order.id)}
													className='focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-700 rounded bg-gray-700'
												/>
											</td>
											<td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-100'>
												{order.id}
											</td>
											<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-300'>
												{order.generated_order_number}
											</td>
											<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-300'>
												{`${order.customer_first_name} ${order.customer_last_name}`}
											</td>
											<td className='px-6 py-4 whitespace-nowrap'>
												<span
													className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
														order.status
													)}`}
												>
													{order.status}
												</span>
											</td>
											<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-300'>
												{order.total ? formatCurrency(order.total) : 'N/A'}
											</td>
											<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-400'>
												{new Date(order.created_at).toLocaleString()}
											</td>
											<td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
												<div className='flex items-center justify-end space-x-2'>
													<button
														onClick={() => toggleFavorite(order.id)}
														disabled={favoriteLoading[order.id]}
														className={`text-gray-400 hover:text-yellow-500 ${
															favoriteOrders[order.id] ? 'text-yellow-500' : ''
														}`}
														title={
															favoriteOrders[order.id]
																? 'Удалить из Избранного'
																: 'Добавить в Избранное'
														}
													>
														{favoriteLoading[order.id] ? (
															<RefreshCw size={18} className='animate-spin' />
														) : favoriteOrders[order.id] ? (
															<Star
																size={18}
																className='fill-yellow-500 text-yellow-500'
															/>
														) : (
															<StarOff size={18} />
														)}
													</button>
													<button
														onClick={() => handleViewOrder(order)}
														className='text-blue-500 hover:text-blue-400'
														title='Просмотр заказа'
													>
														<Eye size={18} />
													</button>
													<Link
														href={`/admin/edit-order/${order.generated_order_number}`}
														className='text-amber-500 hover:text-amber-400'
														title='Редактировать заказ'
													>
														<Edit size={18} />
													</Link>
													<button
														onClick={() => handleConfirmDelete(order.id)}
														className='text-red-500 hover:text-red-400'
														title='Удалить заказ'
													>
														<Trash2 size={18} />
													</button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}

					{/* Pagination */}
					{!loading && filteredOrders.length > 0 && (
						<div className='bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-700 sm:px-6'>
							<div className='flex-1 flex justify-between sm:hidden'>
								<button
									onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
									disabled={currentPage === 1}
									className={`relative inline-flex items-center px-4 py-2 border border-gray-700 text-sm font-medium rounded-md ${
										currentPage === 1
											? 'bg-gray-800 text-gray-500 cursor-not-allowed'
											: 'bg-gray-700 text-gray-200 hover:bg-gray-600'
									}`}
								>
									Предыдущая
								</button>
								<button
									onClick={() =>
										setCurrentPage(prev => Math.min(prev + 1, totalPages))
									}
									disabled={currentPage === totalPages}
									className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-700 text-sm font-medium rounded-md ${
										currentPage === totalPages
											? 'bg-gray-800 text-gray-500 cursor-not-allowed'
											: 'bg-gray-700 text-gray-200 hover:bg-gray-600'
									}`}
								>
									Следующая
								</button>
							</div>
							<div className='hidden sm:flex-1 sm:flex sm:items-center sm:justify-between'>
								<div>
									<p className='text-sm text-gray-400'>
										Показано{' '}
										<span className='font-medium text-gray-200'>
											{(currentPage - 1) * pageSize + 1}
										</span>{' '}
										по{' '}
										<span className='font-medium text-gray-200'>
											{Math.min(currentPage * pageSize, filteredOrders.length)}
										</span>{' '}
										из{' '}
										<span className='font-medium text-gray-200'>
											{filteredOrders.length}
										</span>{' '}
										результатов
									</p>
								</div>
								<div>
									<nav
										className='relative z-0 inline-flex rounded-md shadow-sm -space-x-px'
										aria-label='Pagination'
									>
										<button
											onClick={() => setCurrentPage(1)}
											disabled={currentPage === 1}
											className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-700 bg-gray-800 text-sm font-medium ${
												currentPage === 1
													? 'text-gray-500 cursor-not-allowed'
													: 'text-gray-400 hover:bg-gray-700'
											}`}
										>
											<span className='sr-only'>Первый</span>
											{'<<'}
										</button>
										<button
											onClick={() =>
												setCurrentPage(prev => Math.max(prev - 1, 1))
											}
											disabled={currentPage === 1}
											className={`relative inline-flex items-center px-2 py-2 border border-gray-700 bg-gray-800 text-sm font-medium ${
												currentPage === 1
													? 'text-gray-500 cursor-not-allowed'
													: 'text-gray-400 hover:bg-gray-700'
											}`}
										>
											<span className='sr-only'>Предыдущая</span>
											{'<'}
										</button>

										{/* Page numbers */}
										{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
											let pageNumber
											if (totalPages <= 5) {
												pageNumber = i + 1
											} else if (currentPage <= 3) {
												pageNumber = i + 1
											} else if (currentPage >= totalPages - 2) {
												pageNumber = totalPages - 4 + i
											} else {
												pageNumber = currentPage - 2 + i
											}

											return (
												<button
													key={pageNumber}
													onClick={() => setCurrentPage(pageNumber)}
													className={`relative inline-flex items-center px-4 py-2 border ${
														currentPage === pageNumber
															? 'z-10 bg-blue-900 border-blue-800 text-blue-300'
															: 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
													} text-sm font-medium`}
												>
													{pageNumber}
												</button>
											)
										})}

										<button
											onClick={() =>
												setCurrentPage(prev => Math.min(prev + 1, totalPages))
											}
											disabled={currentPage === totalPages}
											className={`relative inline-flex items-center px-2 py-2 border border-gray-700 bg-gray-800 text-sm font-medium ${
												currentPage === totalPages
													? 'text-gray-500 cursor-not-allowed'
													: 'text-gray-400 hover:bg-gray-700'
											}`}
										>
											<span className='sr-only'>Следующая</span>
											{'>'}
										</button>
										<button
											onClick={() => setCurrentPage(totalPages)}
											disabled={currentPage === totalPages}
											className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-700 bg-gray-800 text-sm font-medium ${
												currentPage === totalPages
													? 'text-gray-500 cursor-not-allowed'
													: 'text-gray-400 hover:bg-gray-700'
											}`}
										>
											<span className='sr-only'>Последняя</span>
											{'>>'}
										</button>
									</nav>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* View Order Modal */}
			{viewModalOpen && viewOrder && (
				<div className='fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4'>
					<div className='bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto'>
						<div className='sticky top-0 bg-gray-800 px-6 py-4 border-b border-gray-700 flex justify-between items-center'>
							<h2 className='text-xl font-bold text-white'>
								Детали заказа: {viewOrder.generated_order_number}
							</h2>
							<button
								onClick={() => setViewModalOpen(false)}
								className='text-gray-400 hover:text-white'
							>
								<X size={24} />
							</button>
						</div>

						<div className='p-6'>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
								<div>
									<h3 className='text-lg font-medium text-gray-300 mb-3'>
										Информация о заказе
									</h3>
									<div className='bg-gray-900 rounded-lg p-4 space-y-3'>
										<div className='flex justify-between'>
											<span className='text-gray-400'>ID заказа:</span>
											<span className='text-gray-200 font-medium'>
												{viewOrder.id}
											</span>
										</div>
										<div className='flex justify-between'>
											<span className='text-gray-400'>Номер заказа:</span>
											<span className='text-gray-200 font-medium'>
												{viewOrder.generated_order_number}
											</span>
										</div>
										<div className='flex justify-between'>
											<span className='text-gray-400'>Статус:</span>
											<span
												className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
													viewOrder.status
												)}`}
											>
												{viewOrder.status}
											</span>
										</div>
										<div className='flex justify-between'>
											<span className='text-gray-400'>Дата:</span>
											<span className='text-gray-200'>
												{new Date(viewOrder.created_at).toLocaleString()}
											</span>
										</div>
										<div className='flex justify-between'>
											<span className='text-gray-400'>Сумма:</span>
											<span className='text-green-400 font-bold'>
												{viewOrder.total
													? formatCurrency(viewOrder.total)
													: 'N/A'}
											</span>
										</div>
										<div className='flex justify-between'>
											<span className='text-gray-400'>Способ оплаты:</span>
											<span className='text-gray-200'>
												{viewOrder.payment_method || 'N/A'}
											</span>
										</div>
									</div>
								</div>

								<div>
									<h3 className='text-lg font-medium text-gray-300 mb-3'>
										Информация о клиенте
									</h3>
									<div className='bg-gray-900 rounded-lg p-4 space-y-3'>
										<div className='flex justify-between'>
											<span className='text-gray-400'>Имя:</span>
											<span className='text-gray-200 font-medium'>
												{`${viewOrder.customer_first_name} ${viewOrder.customer_last_name}`}
											</span>
										</div>
										<div className='flex justify-between'>
											<span className='text-gray-400'>Email:</span>
											<span className='text-gray-200'>
												{viewOrder.customer_email || 'N/A'}
											</span>
										</div>
										<div className='flex justify-between'>
											<span className='text-gray-400'>Телефон:</span>
											<span className='text-gray-200'>
												{viewOrder.customer_phone || 'N/A'}
											</span>
										</div>
									</div>
								</div>
							</div>

							<div className='mb-6'>
								<h3 className='text-lg font-medium text-gray-300 mb-3'>
									Адрес доставки
								</h3>
								<div className='bg-gray-900 rounded-lg p-4'>
									<p className='text-gray-200'>
										{viewOrder.shipping_address || 'N/A'}
									</p>
									<p className='text-gray-200'>
										{viewOrder.shipping_city}
										{viewOrder.shipping_state
											? `, ${viewOrder.shipping_state}`
											: ''}
										{viewOrder.shipping_zip}
									</p>
									<p className='text-gray-200'>
										{viewOrder.shipping_country || 'N/A'}
									</p>
								</div>
							</div>

							<h3 className='text-lg font-medium text-gray-300 mb-3'>
								Товары в заказе
							</h3>
							{viewOrder.items && viewOrder.items.length > 0 ? (
								<div className='bg-gray-900 rounded-lg overflow-hidden'>
									<table className='min-w-full divide-y divide-gray-800'>
										<thead>
											<tr>
												<th className='px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase'>
													Товар
												</th>
												<th className='px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase'>
													Цена
												</th>
												<th className='px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase'>
													Количество
												</th>
												<th className='px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase'>
													Итого
												</th>
											</tr>
										</thead>
										<tbody className='divide-y divide-gray-800'>
											{renderOrderItems(viewOrder.items)}
											{/* Add more rows as needed */}

											{/* Total row */}
											<tr className='bg-gray-850'>
												<td
													colSpan={3}
													className='px-4 py-3 text-right text-sm font-medium text-gray-300'
												>
													Подитог:
												</td>
												<td className='px-4 py-3 text-right text-gray-200 font-bold'>
													{formatCurrency(viewOrder.subtotal || 0)}
												</td>
											</tr>
											<tr className='bg-gray-850'>
												<td
													colSpan={3}
													className='px-4 py-3 text-right text-sm font-medium text-gray-300'
												>
													Доставка:
												</td>
												<td className='px-4 py-3 text-right text-gray-200'>
													{formatCurrency(viewOrder.shipping_cost || 0)}
												</td>
											</tr>
											<tr className='bg-gray-850'>
												<td
													colSpan={3}
													className='px-4 py-3 text-right text-sm font-medium text-gray-300'
												>
													Налог:
												</td>
												<td className='px-4 py-3 text-right text-gray-200'>
													{formatCurrency(viewOrder.tax || 0)}
												</td>
											</tr>
											<tr className='bg-gray-850'>
												<td
													colSpan={3}
													className='px-4 py-3 text-right text-sm font-medium text-gray-300'
												>
													Итого:
												</td>
												<td className='px-4 py-3 text-right text-green-400 font-bold'>
													{formatCurrency(viewOrder.total || 0)}
												</td>
											</tr>
										</tbody>
									</table>
								</div>
							) : (
								<div className='bg-gray-900 rounded-lg p-6 text-center'>
									<Info className='h-12 w-12 text-gray-600 mx-auto mb-4' />
									<p className='text-gray-400'>
										Товары не найдены для этого заказа
									</p>
								</div>
							)}

							<div className='mt-6'>
								<h3 className='text-lg font-medium text-gray-300 mb-3'>
									Обновить статус
								</h3>
								<div className='flex flex-wrap gap-2 mb-6'>
									<button
										onClick={() => handleUpdateStatus(viewOrder.id, 'pending')}
										className={`px-3 py-1 rounded text-sm font-medium ${
											viewOrder.status === 'pending'
												? 'bg-yellow-700 text-yellow-100'
												: 'bg-yellow-600 hover:bg-yellow-700 text-white'
										}`}
									>
										Ожидает
									</button>
									<button
										onClick={() =>
											handleUpdateStatus(viewOrder.id, 'processing')
										}
										className={`px-3 py-1 rounded text-sm font-medium ${
											viewOrder.status === 'processing'
												? 'bg-blue-700 text-blue-100'
												: 'bg-blue-600 hover:bg-blue-700 text-white'
										}`}
									>
										Обработка
									</button>
									<button
										onClick={() => handleUpdateStatus(viewOrder.id, 'shipped')}
										className={`px-3 py-1 rounded text-sm font-medium ${
											viewOrder.status === 'shipped'
												? 'bg-indigo-700 text-indigo-100'
												: 'bg-indigo-600 hover:bg-indigo-700 text-white'
										}`}
									>
										Shipped
									</button>
									<button
										onClick={() =>
											handleUpdateStatus(viewOrder.id, 'delivered')
										}
										className={`px-3 py-1 rounded text-sm font-medium ${
											viewOrder.status === 'delivered'
												? 'bg-green-700 text-green-100'
												: 'bg-green-600 hover:bg-green-700 text-white'
										}`}
									>
										Delivered
									</button>
									<button
										onClick={() =>
											handleUpdateStatus(viewOrder.id, 'cancelled')
										}
										className={`px-3 py-1 rounded text-sm font-medium ${
											viewOrder.status === 'cancelled'
												? 'bg-red-700 text-red-100'
												: 'bg-red-600 hover:bg-red-700 text-white'
										}`}
									>
										Отменен
									</button>
								</div>
							</div>

							<div className='flex justify-end space-x-3'>
								<button
									onClick={() => setViewModalOpen(false)}
									className='px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600'
								>
									Закрыть
								</button>
								<Link
									href={`/admin/edit-order/${viewOrder.generated_order_number}`}
									className='px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700'
								>
									Редактировать заказ
								</Link>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* {editModalOpen && editOrder && (
				<div className='fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4'>
					<div className='bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto'>
						<div className='sticky top-0 bg-gray-800 px-6 py-4 border-b border-gray-700 flex justify-between items-center'>
							<h2 className='text-xl font-bold text-white'>
								Edit Order: {editOrder.generated_order_number}
							</h2>
							<button
								onClick={handleCloseEditModal}
								className='text-gray-400 hover:text-white'
							>
								<X size={24} />
							</button>
						</div>

						<div className='p-6'>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
								<div>
									<h3 className='text-lg font-medium text-gray-300 mb-3'>
										Order Information
									</h3>
									<div className='space-y-4'>
										<div>
											<label className='block text-sm font-medium text-gray-400 mb-1'>
												Order Number
											</label>
											<input
												type='text'
												value={editOrder.generated_order_number}
												onChange={e =>
													setEditOrder({
														...editOrder,
														generated_order_number: e.target.value,
													})
												}
												className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white'
												disabled
											/>
										</div>

										<div>
											<label className='block text-sm font-medium text-gray-400 mb-1'>
												Status
											</label>
											<select
												value={editOrder.status}
												onChange={e =>
													setEditOrder({ ...editOrder, status: e.target.value })
												}
												className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white'
											>
												<option value='pending'>Pending</option>
												<option value='processing'>Processing</option>
												<option value='shipped'>Shipped</option>
												<option value='delivered'>Delivered</option>
												<option value='cancelled'>Cancelled</option>
											</select>
										</div>
									</div>
								</div>

								<div>
									<h3 className='text-lg font-medium text-gray-300 mb-3'>
										Customer Information
									</h3>
									<div className='space-y-4'>
										<div>
											<label className='block text-sm font-medium text-gray-400 mb-1'>
												Customer Name
											</label>
											<div className='flex gap-2'>
												<input
													type='text'
													value={editOrder.customer_first_name}
													onChange={e =>
														setEditOrder({
															...editOrder,
															customer_first_name: e.target.value,
														})
													}
													className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white'
													placeholder='First Name'
													disabled
												/>
												<input
													type='text'
													value={editOrder.customer_last_name}
													onChange={e =>
														setEditOrder({
															...editOrder,
															customer_last_name: e.target.value,
														})
													}
													className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white'
													placeholder='Last Name'
													disabled
												/>
											</div>
										</div>

										<div>
											<label className='block text-sm font-medium text-gray-400 mb-1'>
												Email
											</label>
											<input
												type='email'
												value={editOrder.customer_email}
												onChange={e =>
													setEditOrder({
														...editOrder,
														customer_email: e.target.value,
													})
												}
												className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white'
												disabled
											/>
										</div>
									</div>
								</div>
							</div>

							<div className='mt-6 flex justify-end space-x-3'>
								<button
									onClick={handleCloseEditModal}
									className='px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600'
								>
									Cancel
								</button>
								<button
									onClick={handleSaveEditOrder}
									className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700'
								>
									Save Changes
								</button>
							</div>
						</div>
					</div>
				</div>
			)} */}

			{/* Delete Confirmation Modal */}
			{deleteModalOpen && (
				<div className='fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4'>
					<div className='bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6'>
						<div className='flex items-center justify-center mb-4'>
							<div className='bg-red-900 rounded-full p-3'>
								<AlertCircle size={24} className='text-red-300' />
							</div>
						</div>
						<h3 className='text-xl font-bold text-white text-center mb-2'>
							Подтвердите удаление
						</h3>
						<p className='text-gray-300 text-center mb-6'>
							Вы уверены, что хотите удалить этот заказ? Это действие нельзя
							отменить.
						</p>
						<div className='flex justify-center space-x-4'>
							<button
								onClick={() => setDeleteModalOpen(false)}
								className='px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600'
							>
								Отменить
							</button>
							<button
								onClick={handleDeleteOrder}
								className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700'
							>
								Удалить
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default OrdersPage