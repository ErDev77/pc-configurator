import { NextResponse } from 'next/server'

export async function POST(request: Request) {
	try {
		const body = await request.json()
		const { message } = body

		const botToken = process.env.TELEGRAM_BOT_TOKEN
		const chatId = process.env.TELEGRAM_CHAT_ID

		if (!botToken || !chatId) {
			throw new Error('Telegram bot token or chat ID not configured')
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
