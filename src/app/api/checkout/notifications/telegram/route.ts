// src/app/api/notifications/telegram/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const { message } = body

		if (!message) {
			return NextResponse.json(
				{ success: false, error: 'Message is required' },
				{ status: 400 }
			)
		}

		const botToken = process.env.TELEGRAM_BOT_TOKEN
		const chatId = process.env.TELEGRAM_CHAT_ID

		if (!botToken || !chatId) {
			console.warn('Telegram bot token or chat ID not configured')
			// Return success even if not configured to avoid blocking checkout
			return NextResponse.json({
				success: true,
				warning: 'Telegram not configured',
			})
		}

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
					parse_mode: 'HTML',
				}),
			}
		)

		const data = await response.json()

		if (!data.ok) {
			throw new Error(data.description || 'Failed to send Telegram message')
		}

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Telegram sending error:', error)
		return NextResponse.json(
			{ success: false, error: 'Failed to send Telegram notification' },
			{ status: 500 }
		)
	}
}
