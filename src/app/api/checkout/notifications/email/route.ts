// Update src/app/api/checkout/notifications/email/route.ts

import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import pool from '@/lib/db'

// Define the shape of cart items
interface CartItem {
	name: string
	quantity: number
	totalPrice: number
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

export async function POST(request: Request) {
	try {
		const body = await request.json()
		const { subject, orderData, adminId } = body

		// If adminId was provided, check this specific admin's settings
		// Otherwise fallback to a default admin (for backward compatibility)
		const id = adminId || 1

		// Check if this admin has email notifications enabled
		const settingsResult = await pool.query(
			`SELECT value->>'email' as email_enabled 
       FROM settings 
       WHERE admin_id = $1 AND key = 'notifications'`,
			[id]
		)

		// If settings exist and email is explicitly disabled, don't send notification
		if (settingsResult.rows.length > 0) {
			const emailEnabled = settingsResult.rows[0].email_enabled === 'true'
			if (!emailEnabled) {
				return NextResponse.json({
					success: false,
					message: 'Email notifications disabled for this admin',
				})
			}
		}

		// Get the admin's email from the database
		const adminResult = await pool.query(
			'SELECT email FROM admins WHERE id = $1',
			[id]
		)

		// Use the admin's email if available, otherwise fall back to environment variable
		const to =
			adminResult.rows.length > 0
				? adminResult.rows[0].email
				: process.env.EMAIL_TO

		if (!to) {
			throw new Error('No recipient email address found')
		}

		const transporter = nodemailer.createTransport({
			host: process.env.EMAIL_HOST || 'smtp.gmail.com',
			port: parseInt(process.env.EMAIL_PORT || '587'),
			secure: process.env.EMAIL_SECURE === 'true',
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASSWORD,
			},
		})

		const itemsList = orderData.items
			.map(
				(item: CartItem) =>
					`${item.name} x ${item.quantity} - $${(
						item.totalPrice * item.quantity
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

		await transporter.sendMail({
			from: process.env.EMAIL_FROM || 'yourstore@example.com',
			to,
			subject,
			html: emailContent,
		})

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Email sending error:', error)
		return NextResponse.json(
			{ success: false, error: 'Failed to send email' },
			{ status: 500 }
		)
	}
}
// src/app/api/notifications/email/route.ts
// import { NextRequest, NextResponse } from 'next/server'
// import nodemailer from 'nodemailer'

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json()
//     const { to, subject, html } = body
    
//     if (!to || !subject || !html) {
//       return NextResponse.json(
//         { success: false, error: 'Missing required fields' },
//         { status: 400 }
//       )
//     }

//     const transporter = nodemailer.createTransport({
//       host: process.env.EMAIL_HOST || 'smtp.gmail.com',
//       port: parseInt(process.env.EMAIL_PORT || '587'),
//       secure: process.env.EMAIL_SECURE === 'true',
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASSWORD,
//       },
//     })

//     await transporter.sendMail({
//       from: process.env.EMAIL_FROM || 'store@example.com',
//       to,
//       subject,
//       html,
//     })

//     return NextResponse.json({ success: true })
//   } catch (error) {
//     console.error('Email sending error:', error)
//     return NextResponse.json(
//       { success: false, error: 'Failed to send email' },
//       { status: 500 }
//     )
//   }
// }