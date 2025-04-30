// src/app/admin/_components/OrderListener.tsx
'use client'

import { useEffect, useState } from 'react'
import { useNotifications } from '@/context/NotificationContext'
import { useAuth } from '@/context/AuthContext'

/**
 * This component listens for new orders and adds notifications
 * It should be included in the admin layout so it's always active
 */
export default function OrderListener() {
	const { addNotification, browserNotificationsEnabled } = useNotifications()
	const { user } = useAuth()
	const [lastOrderId, setLastOrderId] = useState<number | null>(null)

	// Poll for new orders
	useEffect(() => {
		// Only run if user is logged in
		if (!user) return

		// Get the latest orders first to establish a baseline
		const initializeLastOrder = async () => {
			try {
				const response = await fetch('/api/orders?limit=1')
				if (response.ok) {
					const orders = await response.json()
					if (orders && orders.length > 0) {
						setLastOrderId(orders[0].id)
					}
				}
			} catch (error) {
				console.error('Error initializing order listener:', error)
			}
		}

		initializeLastOrder()

		// Set up polling interval
		const intervalId = setInterval(async () => {
			if (!lastOrderId) return

			try {
				const response = await fetch(`/api/orders?since=${lastOrderId}&limit=5`)
				if (response.ok) {
					const newOrders = await response.json()

					if (newOrders && newOrders.length > 0) {
						// Update the last order ID
						const maxId = Math.max(...newOrders.map((order: any) => order.id))
						setLastOrderId(maxId)

						// Create notifications for each new order
						newOrders.forEach((order: any) => {
							addNotification(
								`New order received #${order.generated_order_number}`
							)
						})
					}
				}
			} catch (error) {
				console.error('Error checking for new orders:', error)
			}
		}, 30000) // Check every 30 seconds

		return () => clearInterval(intervalId)
	}, [user, lastOrderId, addNotification])

	// This component doesn't render anything
	return null
}
