import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST() {
	try {
		// Get notification settings
		const settingsResult = await pool.query(
			'SELECT * FROM notification_settings WHERE is_active = true LIMIT 1'
		)

		if (
			settingsResult.rows.length === 0 ||
			!settingsResult.rows[0].telegram_enabled
		) {
			return NextResponse.json(
				{ error: 'Telegram notifications are disabled' },
				{ status: 400 }
			)
		}

		const botToken = process.env.TELEGRAM_BOT_TOKEN
		const chatId = process.env.TELEGRAM_CHAT_ID

		if (!botToken || !chatId) {
			return NextResponse.json(
				{ error: 'Telegram bot token or chat ID not configured' },
				{ status: 400 }
			)
		}

		// Send test message
		const message = `
🧪 TEST MESSAGE
      
This is a test message from your PC Store admin panel.
If you're seeing this, your Telegram notification system is working correctly!
      
Time sent: ${new Date().toLocaleString()}
    `

		const response = await fetch(
			`https://api.telegram.org/bot${botToken}/sendMessage`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					chat_id: chatId,
					text: message,
				}),
			}
		)

		const data = await response.json()

		if (!data.ok) {
			throw new Error(data.description || 'Failed to send Telegram message')
		}

		return NextResponse.json({
			success: true,
			message: 'Test Telegram message sent successfully',
		})
	} catch (error) {
		console.error('Error sending test Telegram message:', error)
		return NextResponse.json(
			{
				error: 'Failed to send test Telegram message',
				details: (error as Error).message,
			},
			{ status: 500 }
		)
	}
}
