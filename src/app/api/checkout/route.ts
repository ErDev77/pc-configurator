// src/app/api/checkout/route.ts
import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import nodemailer from 'nodemailer'

export async function POST(request: { json: () => any }) {
	try {
		const body = await request.json()
		console.log('Received order data:', body)

		// Basic validation
		if (!body.customer || !body.items || !body.totals) {
			throw new Error('Missing required fields in the order data')
		}

		// Extract data from the request body
		const {
			orderNumber,
			customer,
			shipping,
			payment,
			items,
			totals,
			notifications,
		} = body

		// Insert the order into the database with all the additional information
		const query = `
      INSERT INTO orders (
        generated_order_number, 
        status, 
        configuration_id,
        customer_first_name,
        customer_last_name,
        customer_email,
        customer_phone,
        shipping_address,
        shipping_city,
        shipping_state,
        shipping_zip,
        shipping_country,
        payment_method,
        subtotal,
        shipping_cost,
        tax,
        total,
        items,
        created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
      ) RETURNING id, generated_order_number
    `

		// Get the configuration ID if available (some orders might not have a specific configuration)
		const configId = items[0]?.configId || null

		const values = [
			orderNumber,
			'pending', // Default status
			configId,
			customer.firstName,
			customer.lastName,
			customer.email,
			customer.phone,
			shipping?.address || '',
			shipping?.city || '',
			shipping?.state || '',
			shipping?.zipCode || '',
			shipping?.country || '',
			payment?.method || '',
			totals.subtotal,
			totals.shipping,
			totals.tax,
			totals.total,
			JSON.stringify(items), // Store items as JSON
			new Date().toISOString(),
		]

		const result = await pool.query(query, values)
		const insertedOrder = result.rows[0]

		// After storing the order, process notifications
		let notificationResults = { email: false, telegram: false }

		if (notifications) {
			// Check admin notification settings
			const settingsResult = await pool.query(
				`SELECT value FROM settings WHERE key = 'notifications'`
			)

			let adminNotificationSettings = {
				email: true,
				telegram: true,
			}

			if (settingsResult.rows.length > 0) {
				adminNotificationSettings = settingsResult.rows[0].value
			}

			// Process email notification if both user and admin settings allow it
			if (notifications.email && adminNotificationSettings.email) {
				try {
					// Send email notification directly
					notificationResults.email = await sendEmailNotification({
						orderNumber,
						customer,
						shipping,
						payment,
						items,
						totals,
					})
				} catch (emailError) {
					console.error('Error sending email notification:', emailError)
				}
			}

			// Process Telegram notification if both user and admin settings allow it
			if (notifications.telegram && adminNotificationSettings.telegram) {
				try {
					// Send Telegram notification directly
					notificationResults.telegram = await sendTelegramNotification({
						orderNumber,
						customer,
						items,
						totals,
					})
				} catch (telegramError) {
					console.error('Error sending Telegram notification:', telegramError)
				}
			}
		}

		// Return success response
		return NextResponse.json({
			success: true,
			orderNumber: insertedOrder.generated_order_number,
			orderId: insertedOrder.id,
			notifications: notificationResults,
		})
	} catch (error) {
		console.error('Error in /api/checkout:', error)
		const errorMessage =
			error instanceof Error ? error.message : 'Unknown error'
		return NextResponse.json(
			{ success: false, error: errorMessage },
			{ status: 500 }
		)
	}
}

// Helper function to send email notification
async function sendEmailNotification(orderData: any) {
	try {
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

		// Create the email content
		const itemsList = orderData.items
			.map(
				(item: any) =>
					`${item.name} x ${item.quantity} - $${(
						item.price * item.quantity
					).toFixed(2)}`
			)
			.join('\n')

		const emailContent = `
      <h1>New Order Notification</h1>
      <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
      <p><strong>Customer:</strong> ${orderData.customer.firstName} ${
			orderData.customer.lastName
		}</p>
      <p><strong>Email:</strong> ${orderData.customer.email}</p>
      <p><strong>Phone:</strong> ${orderData.customer.phone}</p>
      <h2>Order Details</h2>
      <p><strong>Items:</strong></p>
      <pre>${itemsList}</pre>
      <p><strong>Subtotal:</strong> $${orderData.totals.subtotal.toFixed(2)}</p>
      <p><strong>Shipping:</strong> $${orderData.totals.shipping.toFixed(2)}</p>
      <p><strong>Tax:</strong> $${orderData.totals.tax.toFixed(2)}</p>
      <p><strong>Total:</strong> $${orderData.totals.total.toFixed(2)}</p>
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
			subject: `New Order #${orderData.orderNumber}`,
			html: emailContent,
		})

		console.log(`Email notification sent for order ${orderData.orderNumber}`)
		return true
	} catch (error) {
		console.error('Email sending error:', error)
		return false
	}
}

// Helper function to send Telegram notification
async function sendTelegramNotification(orderData: any) {
	try {
		const botToken = process.env.TELEGRAM_BOT_TOKEN
		const chatId = process.env.TELEGRAM_CHAT_ID

		if (!botToken || !chatId) {
			console.warn('Telegram bot token or chat ID not configured')
			return false
		}

		const message = `
      🛒 NEW ORDER #${orderData.orderNumber}

      Customer: ${orderData.customer.firstName} ${orderData.customer.lastName}
      Email: ${orderData.customer.email}
      Phone: ${orderData.customer.phone}
      Total: $${orderData.totals.total.toFixed(2)}
      Items: ${orderData.items.length}

      View details in admin panel: /admin/orders/${orderData.orderNumber}
    `

		// Use Telegram API directly
		const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`
		const response = await fetch(telegramUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				chat_id: chatId,
				text: message,
				parse_mode: 'HTML',
			}),
		})

		const data = await response.json()

		if (!data.ok) {
			throw new Error(data.description || 'Failed to send Telegram message')
		}

		console.log('Telegram notification sent successfully')
		return true
	} catch (error) {
		console.error('Telegram sending error:', error)
		return false
	}
}
