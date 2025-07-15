'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Sidebar from '../../_components/Sidebar'
import {
	ArrowLeft,
	Save,
	Trash2,
	RefreshCw,
	AlertCircle,
	Info,
} from 'lucide-react'

// Define OrderItem interface
interface OrderItem {
	name: string
	quantity: number
	price: number
	totalPrice: number
}

// Define Order interface
interface Order {
	id: number
	generated_order_number: string
	status: string
	created_at: string
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
	items: OrderItem[] | string
}

// Helper function to ensure price values are properly formatted
function ensureNumberPrice(price: any): number {
	if (typeof price === 'object' && price !== null) {
		return price.value || price.price || 0
	}

	if (typeof price === 'string') {
		const parsed = parseFloat(price)
		return isNaN(parsed) ? 0 : parsed
	}

	return typeof price === 'number' ? price : 0
}

// Format currency in RUB
const formatCurrency = (amount: any) => {
	const numberAmount = ensureNumberPrice(amount)
	return new Intl.NumberFormat('ru-RU', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0,
	}).format(numberAmount)
}

// Client component that receives props directly
export default function EditOrderClient({
	orderNumber,
}: {
	orderNumber: string
}) {
	const router = useRouter()

	const [order, setOrder] = useState<Order | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [saving, setSaving] = useState(false)
	const [items, setItems] = useState<OrderItem[]>([])
	const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

	console.log('Rendering EditOrderClient with order number:', orderNumber)

	// Fetch order data using order number
	useEffect(() => {
		const fetchOrder = async () => {
			if (!orderNumber) {
				console.error('No order number provided')
				setError('No order number provided')
				setLoading(false)
				return
			}

			setLoading(true)
			setError(null)

			console.log('Fetching order with number:', orderNumber)

			try {
				// First, get all orders
				const ordersResponse = await fetch('/api/orders')

				if (!ordersResponse.ok) {
					throw new Error(
						`Failed to fetch orders: ${ordersResponse.statusText}`
					)
				}

				const ordersData = await ordersResponse.json()
				console.log(`Received ${ordersData.length} orders`)

				// Find the order with matching order number
				const matchingOrder = ordersData.find(
					(o: Order) => o.generated_order_number === orderNumber
				)

				if (!matchingOrder) {
					console.error('No matching order found for:', orderNumber)
					setError(`Order with number ${orderNumber} not found`)
					setLoading(false)
					return
				}

				console.log('Found matching order with ID:', matchingOrder.id)

				// Get the specific order details
				const response = await fetch(`/api/orders/${matchingOrder.id}`)

				if (!response.ok) {
					throw new Error(
						`Failed to fetch order details: ${response.statusText}`
					)
				}

				const data = await response.json()
				console.log('Received order details:', data)

				// Process order items
				let processedItems: OrderItem[] = []

				if (typeof data.items === 'string' && data.items) {
					try {
						processedItems = JSON.parse(data.items)
						processedItems = processedItems.map((item: OrderItem) => ({
							...item,
							price: ensureNumberPrice(item.price),
							totalPrice: ensureNumberPrice(item.totalPrice),
						}))
					} catch (e) {
						console.error('Error parsing order items:', e)
						processedItems = []
					}
				} else if (Array.isArray(data.items)) {
					processedItems = data.items.map((item: OrderItem) => ({
						...item,
						price: ensureNumberPrice(item.price),
						totalPrice: ensureNumberPrice(item.totalPrice),
					}))
				}

				setItems(processedItems)

				// Update the order with ensured number prices
				setOrder({
					...data,
					subtotal: ensureNumberPrice(data.subtotal),
					shipping_cost: ensureNumberPrice(data.shipping_cost),
					tax: ensureNumberPrice(data.tax),
					total: ensureNumberPrice(data.total),
					items: processedItems,
				})
			} catch (error) {
				console.error('Error fetching order:', error)
				setError(
					error instanceof Error ? error.message : 'An unknown error occurred'
				)
				toast.error('Failed to load order')
			} finally {
				setLoading(false)
			}
		}

		fetchOrder()
	}, [orderNumber])

	// Handle form field changes
	const handleChange = (field: string, value: string) => {
		if (!order) return
		setOrder({ ...order, [field]: value })
	}

	// Handle order save
	const handleSave = async () => {
		if (!order) return

		setSaving(true)
		try {
			const response = await fetch(`/api/orders/${order.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					status: order.status,
					customer_first_name: order.customer_first_name,
					customer_last_name: order.customer_last_name,
					customer_email: order.customer_email,
					customer_phone: order.customer_phone,
					shipping_address: order.shipping_address,
					shipping_city: order.shipping_city,
					shipping_state: order.shipping_state,
					shipping_zip: order.shipping_zip,
					shipping_country: order.shipping_country,
					payment_method: order.payment_method,
				}),
			})

			if (!response.ok) {
				throw new Error('Failed to update order')
			}

			toast.success('Order updated successfully')
		} catch (error) {
			console.error('Error updating order:', error)
			toast.error('Failed to update order')
		} finally {
			setSaving(false)
		}
	}

	// Handle delete order
	const handleDelete = async () => {
		if (!order) return

		try {
			const response = await fetch(`/api/orders/${order.id}`, {
				method: 'DELETE',
			})

			if (!response.ok) {
				throw new Error('Failed to delete order')
			}

			toast.success('Order deleted successfully')
			setConfirmDeleteOpen(false)

			// Navigate back to orders list
			setTimeout(() => {
				router.push('/admin/orders')
			}, 1500)
		} catch (error) {
			console.error('Error deleting order:', error)
			toast.error('Failed to delete order')
		}
	}

	if (loading) {
		return (
			<div className='flex min-h-screen bg-[#171C1F]'>
				<Sidebar />
				<div className='flex-1 p-8 ml-16'>
					<div className='flex items-center justify-center h-full'>
						<div className='animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500'></div>
					</div>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className='flex min-h-screen bg-[#171C1F]'>
				<Sidebar />
				<div className='flex-1 p-8 ml-16'>
					<div className='flex flex-col items-center justify-center h-full'>
						<AlertCircle size={48} className='text-red-500 mb-4' />
						<h2 className='text-xl font-semibold text-white mb-2'>
							Error Loading Order
						</h2>
						<p className='text-gray-400 mb-4'>{error}</p>
						<button
							onClick={() => router.push('/admin/orders')}
							className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
						>
							Return to Orders
						</button>
					</div>
				</div>
			</div>
		)
	}

	if (!order) {
		return (
			<div className='flex min-h-screen bg-[#171C1F]'>
				<Sidebar />
				<div className='flex-1 p-8 ml-16'>
					<div className='flex flex-col items-center justify-center h-full'>
						<AlertCircle size={48} className='text-red-500 mb-4' />
						<h2 className='text-xl font-semibold text-white mb-2'>
							Order Not Found
						</h2>
						<p className='text-gray-400 mb-4'>
							The order you're looking for doesn't exist or has been deleted.
						</p>
						<button
							onClick={() => router.push('/admin/orders')}
							className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
						>
							Return to Orders
						</button>
					</div>
				</div>
			</div>
		)
	}

	// Rest of component remains the same...
	return (
		<div className='min-h-screen bg-[#171C1F] text-gray-100'>
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

			<div className='p-6 max-w-7xl mx-auto ml-24'>
				{/* Header with back button */}
				<div className='mb-8 flex justify-between items-center'>
					<div className='flex items-center gap-3'>
						<button
							onClick={() => router.push('/admin/orders')}
							className='flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors'
						>
							<ArrowLeft size={20} />
						</button>
						<div>
							<h1 className='text-2xl font-bold text-white'>Редактировать заказ</h1>
							<p className='text-gray-400'>{order.generated_order_number}</p>
						</div>
					</div>

					<div className='flex items-center gap-3'>
						<button
							onClick={() => setConfirmDeleteOpen(true)}
							className='flex items-center gap-2 bg-red-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-red-700'
						>
							<Trash2 size={16} />
							Удалить
						</button>

						<button
							onClick={handleSave}
							disabled={saving}
							className={`flex items-center gap-2 ${
								saving
									? 'bg-blue-700 opacity-75 cursor-not-allowed'
									: 'bg-blue-600 hover:bg-blue-700'
							} text-white rounded-md px-4 py-2 text-sm font-medium transition-colors`}
						>
							{saving ? (
								<RefreshCw className='animate-spin' size={16} />
							) : (
								<Save size={16} />
							)}
							<span>{saving ? 'Сохранение...' : 'Сохранить изменения'}</span>
						</button>
					</div>
				</div>

				{/* Order content grid - form fields, summary, etc. */}
				<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
					{/* Order Information */}
					<div className='lg:col-span-2'>
						<div className='bg-[#202529] rounded-lg shadow-md overflow-hidden mb-6'>
							<div className='p-5 border-b border-gray-700'>
								<h2 className='text-lg font-semibold text-white'>
									Информация о заказе
								</h2>
							</div>

							<div className='p-5 space-y-5'>
								<div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
									<div>
										<label className='block text-sm font-medium text-gray-400 mb-2'>
											Номер заказа
										</label>
										<input
											type='text'
											value={order.generated_order_number}
											className='w-full bg-[#2A2F35] border border-gray-700 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
											disabled
										/>
									</div>

									<div>
										<label className='block text-sm font-medium text-gray-400 mb-2'>
											Дата размещения
										</label>
										<input
											type='text'
											value={new Date(order.created_at).toLocaleString()}
											className='w-full bg-[#2A2F35] border border-gray-700 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
											disabled
										/>
									</div>
								</div>

								<div>
									<label className='block text-sm font-medium text-gray-400 mb-2'>
										Статус
									</label>
									<select
										value={order.status}
										onChange={e => handleChange('status', e.target.value)}
										className='w-full bg-[#2A2F35] border border-gray-700 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
									>
										<option value='pending'>В ожидании</option>
										<option value='processing'>В обработке</option>
										<option value='shipped'>Отправлено</option>
										<option value='delivered'>Доставлено</option>
										<option value='cancelled'>Отменено</option>
									</select>
								</div>

								<div>
									<label className='block text-sm font-medium text-gray-400 mb-2'>
										Способ оплаты
									</label>
									<input
										type='text'
										value={order.payment_method || ''}
										onChange={e =>
											handleChange('payment_method', e.target.value)
										}
										className='w-full bg-[#2A2F35] border border-gray-700 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
									/>
								</div>
							</div>
						</div>

						{/* Customer Information */}
						<div className='bg-[#202529] rounded-lg shadow-md overflow-hidden mb-6'>
							<div className='p-5 border-b border-gray-700'>
								<h2 className='text-lg font-semibold text-white'>
									Информация о клиенте
								</h2>
							</div>

							<div className='p-5 space-y-5'>
								<div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
									<div>
										<label className='block text-sm font-medium text-gray-400 mb-2'>
											Имя
										</label>
										<input
											type='text'
											value={order.customer_first_name || ''}
											onChange={e =>
												handleChange('customer_first_name', e.target.value)
											}
											className='w-full bg-[#2A2F35] border border-gray-700 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
										/>
									</div>

									<div>
										<label className='block text-sm font-medium text-gray-400 mb-2'>
											Фамилия
										</label>
										<input
											type='text'
											value={order.customer_last_name || ''}
											onChange={e =>
												handleChange('customer_last_name', e.target.value)
											}
											className='w-full bg-[#2A2F35] border border-gray-700 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
										/>
									</div>
								</div>

								<div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
									<div>
										<label className='block text-sm font-medium text-gray-400 mb-2'>
											Email
										</label>
										<input
											type='email'
											value={order.customer_email || ''}
											onChange={e =>
												handleChange('customer_email', e.target.value)
											}
											className='w-full bg-[#2A2F35] border border-gray-700 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
										/>
									</div>

									<div>
										<label className='block text-sm font-medium text-gray-400 mb-2'>
											Телефон
										</label>
										<input
											type='text'
											value={order.customer_phone || ''}
											onChange={e =>
												handleChange('customer_phone', e.target.value)
											}
											className='w-full bg-[#2A2F35] border border-gray-700 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
										/>
									</div>
								</div>
							</div>
						</div>

						{/* Shipping Address */}
						<div className='bg-[#202529] rounded-lg shadow-md overflow-hidden mb-6'>
							<div className='p-5 border-b border-gray-700'>
								<h2 className='text-lg font-semibold text-white'>
									Адрес доставки
								</h2>
							</div>

							<div className='p-5 space-y-5'>
								<div>
									<label className='block text-sm font-medium text-gray-400 mb-2'>
										Улица
									</label>
									<input
										type='text'
										value={order.shipping_address || ''}
										onChange={e =>
											handleChange('shipping_address', e.target.value)
										}
										className='w-full bg-[#2A2F35] border border-gray-700 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
									/>
								</div>

								<div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
									<div>
										<label className='block text-sm font-medium text-gray-400 mb-2'>
											Город
										</label>
										<input
											type='text'
											value={order.shipping_city || ''}
											onChange={e =>
												handleChange('shipping_city', e.target.value)
											}
											className='w-full bg-[#2A2F35] border border-gray-700 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
										/>
									</div>

									<div>
										<label className='block text-sm font-medium text-gray-400 mb-2'>
											Штат
										</label>
										<input
											type='text'
											value={order.shipping_state || ''}
											onChange={e =>
												handleChange('shipping_state', e.target.value)
											}
											className='w-full bg-[#2A2F35] border border-gray-700 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
										/>
									</div>

									<div>
										<label className='block text-sm font-medium text-gray-400 mb-2'>
											Почтовый индекс
										</label>
										<input
											type='text'
											value={order.shipping_zip || ''}
											onChange={e =>
												handleChange('shipping_zip', e.target.value)
											}
											className='w-full bg-[#2A2F35] border border-gray-700 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
										/>
									</div>
								</div>

								<div>
									<label className='block text-sm font-medium text-gray-400 mb-2'>
										Страна
									</label>
									<input
										type='text'
										value={order.shipping_country || ''}
										onChange={e =>
											handleChange('shipping_country', e.target.value)
										}
										className='w-full bg-[#2A2F35] border border-gray-700 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
									/>
								</div>
							</div>
						</div>
					</div>

					{/* Order Summary and Items */}
					<div>
						{/* Order Summary */}
						<div className='bg-[#202529] rounded-lg shadow-md overflow-hidden mb-6'>
							<div className='p-5 border-b border-gray-700'>
								<h2 className='text-lg font-semibold text-white'>
									Сводка заказа
								</h2>
							</div>

							<div className='p-5'>
								<div className='space-y-4'>
									<div className='flex justify-between'>
										<span className='text-gray-400'>Промежуточный итог:</span>
										<span className='text-gray-200'>
											{formatCurrency(order.subtotal)}
										</span>
									</div>

									<div className='flex justify-between'>
										<span className='text-gray-400'>Доставка:</span>
										<span className='text-gray-200'>
											{formatCurrency(order.shipping_cost)}
										</span>
									</div>

									<div className='flex justify-between'>
										<span className='text-gray-400'>Налог:</span>
										<span className='text-gray-200'>
											{formatCurrency(order.tax)}
										</span>
									</div>

									<div className='pt-4 border-t border-gray-700 flex justify-between font-bold'>
										<span className='text-white'>Итого:</span>
										<span className='text-green-400'>
											{formatCurrency(order.total)}
										</span>
									</div>
								</div>
							</div>
						</div>

						{/* Order Items */}
						<div className='bg-[#202529] rounded-lg shadow-md overflow-hidden'>
							<div className='p-5 border-b border-gray-700'>
								<h2 className='text-lg font-semibold text-white'>
									Товары в заказе
								</h2>
							</div>

							<div className='p-5'>
								{items.length > 0 ? (
									<div className='space-y-4'>
										{items.map((item, index) => (
											<div
												key={index}
												className='flex justify-between items-center p-3 bg-[#2A2F35] rounded-md'
											>
												<div>
													<p className='font-medium text-white'>{item.name}</p>
													<p className='text-sm text-gray-400'>
														Количество: {item.quantity} × {formatCurrency(item.price)}
													</p>
												</div>
												<span className='font-medium text-white'>
													{formatCurrency(item.price * item.quantity)}
												</span>
											</div>
										))}
									</div>
								) : (
									<div className='flex flex-col items-center justify-center p-8 text-center'>
										<Info size={36} className='text-gray-500 mb-3' />
										<p className='text-gray-400'>
											Нет товаров для этого заказа
										</p>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Confirm Delete Modal */}
			{confirmDeleteOpen && (
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
								onClick={() => setConfirmDeleteOpen(false)}
								className='px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600'
							>
								Отмена
							</button>
							<button
								onClick={handleDelete}
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
