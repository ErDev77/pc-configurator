// src/app/api/checkout/notifications/email/route.ts
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import pool from '@/lib/db'

// Define the shape of cart items
interface CartItem {
	name: string
	quantity: number
	price: number
	totalPrice: number
	components?: any[]
	configName?: string
}

// Define the shape of order data for better type safety
interface OrderData {
	orderNumber: string
	customer: {
		firstName: string
		lastName: string
		email: string
		phone: string
	}
	shipping: {
		address: string
		city: string
		state: string
		zipCode: string
		country: string
	}
	payment: {
		method: string
	}
	items: CartItem[]
	totals: {
		subtotal: number
		shipping: number
		tax: number
		total: number
	}
}

// Helper function to format prices consistently
function formatPrice(price: any): number {
	if (typeof price === 'object' && price !== null) {
		return price.value || price.price || 0
	}

	if (typeof price === 'string') {
		const parsed = parseFloat(price)
		return isNaN(parsed) ? 0 : parsed
	}

	return typeof price === 'number' ? price : 0
}

export async function POST(request: Request) {
	try {
		const body = await request.json()
		const { subject, orderData } = body

		// Check if email notifications are enabled in global settings
		const settingsResult = await pool.query(
			`SELECT value->>'email' as email_enabled 
       FROM settings 
       WHERE key = 'notifications'`
		)

		if (settingsResult.rows.length > 0) {
			const emailEnabled = settingsResult.rows[0].email_enabled === 'true'
			if (!emailEnabled) {
				console.log('Email notifications are disabled in admin settings')
				return NextResponse.json({
					success: false,
					message: 'Email notifications are disabled',
				})
			}
		}

		// Get admin email (or use from .env)
		const adminResult = await pool.query(
			'SELECT email FROM admins ORDER BY id ASC LIMIT 1'
		)

		const to =
			adminResult.rows.length > 0
				? adminResult.rows[0].email
				: process.env.EMAIL_TO

		if (!to) {
			throw new Error('No recipient email address found')
		}

		// Configure email transport
		const transporter = nodemailer.createTransport({
			host: process.env.EMAIL_HOST || 'smtp.gmail.com',
			port: parseInt(process.env.EMAIL_PORT || '587'),
			secure: process.env.EMAIL_SECURE === 'true',
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASSWORD,
			},
		})

		// Create the email content with detailed item and component information
		const itemsList = orderData.items
			.map((item: CartItem) => {
				const itemDetails = `<div style="margin-bottom: 15px;">
					<h3 style="margin-bottom: 5px;">${item.name || item.configName} - ${
					item.quantity
				} × ${formatPrice(item.price).toFixed(2)} = $${(
					formatPrice(item.price) * item.quantity
				).toFixed(2)}</h3>`

				// Add components if they exist
				let componentsHtml = ''
				if (item.components && item.components.length > 0) {
					componentsHtml = `
						<ul style="margin-left: 20px; padding-left: 10px;">
							${item.components
								.map(
									comp => `
								<li style="margin-bottom: 5px;">
									${comp.name} - $${formatPrice(comp.price).toFixed(2)}
								</li>
							`
								)
								.join('')}
						</ul>
					`
				}

				return `${itemDetails}${componentsHtml}</div>`
			})
			.join('')

		const emailContent = `
      <h1>New Order Notification</h1>
      <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
      <p><strong>Customer:</strong> ${orderData.customer.firstName} ${
			orderData.customer.lastName
		}</p>
      <p><strong>Email:</strong> ${orderData.customer.email}</p>
      <p><strong>Phone:</strong> ${orderData.customer.phone}</p>
      <h2>Order Details</h2>
      <div>
        ${itemsList}
      </div>
      <p><strong>Subtotal:</strong> $${formatPrice(
				orderData.totals.subtotal
			).toFixed(2)}</p>
      <p><strong>Shipping:</strong> $${formatPrice(
				orderData.totals.shipping
			).toFixed(2)}</p>
      <p><strong>Tax:</strong> $${formatPrice(orderData.totals.tax).toFixed(
				2
			)}</p>
      <p><strong>Total:</strong> $${formatPrice(orderData.totals.total).toFixed(
				2
			)}</p>
      <h2>Shipping Address</h2>
      <p>${orderData.shipping.address}</p>
      <p>${orderData.shipping.city}, ${orderData.shipping.state} ${
			orderData.shipping.zipCode
		}</p>
      <p>${orderData.shipping.country}</p>
      <p>Payment Method: ${
				orderData.payment.method === 'credit-card' ? 'Credit Card' : 'PayPal'
			}</p>
    `

		// Send the email
		await transporter.sendMail({
			from: process.env.EMAIL_FROM || 'yourstore@example.com',
			to,
			subject,
			html: emailContent,
		})

		console.log(`Email notification sent for order ${orderData.orderNumber}`)
		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Email sending error:', error)
		return NextResponse.json(
			{ success: false, error: 'Failed to send email' },
			{ status: 500 }
		)
	}
}
