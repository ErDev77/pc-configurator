"use client"

import { useEffect, useState } from 'react'

interface Order {
	id: number
	generated_order_number: string
	status: string
	created_at: string
}

const OrdersPage = () => {
	const [orders, setOrders] = useState<Order[]>([])
	const [loading, setLoading] = useState<boolean>(true)

	useEffect(() => {
		async function fetchOrders() {
			try {
				const response = await fetch('/api/orders')
				const data = await response.json()
				setOrders(data)
			} catch (error) {
				console.error('Ошибка при загрузке заказов:', error)
			} finally {
				setLoading(false)
			}
		}

		fetchOrders()
	}, [])

	if (loading) {
		return <div>Загрузка...</div>
	}

	return (
		<div>
			<h1>Заказы</h1>
			<table className='min-w-full border-collapse'>
				<thead>
					<tr>
						<th className='border p-2'>ID</th>
						<th className='border p-2'>Номер заказа</th>
						<th className='border p-2'>Статус</th>
						<th className='border p-2'>Дата создания</th>
					</tr>
				</thead>
				<tbody>
					{orders.map(order => (
						<tr key={order.id}>
							<td className='border p-2'>{order.id}</td>
							<td className='border p-2'>{order.generated_order_number}</td>
							<td className='border p-2'>{order.status}</td>
							<td className='border p-2'>
								{new Date(order.created_at).toLocaleString()}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}

export default OrdersPage
