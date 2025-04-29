import { NextResponse } from 'next/server'

export async function GET() {
	const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!
	const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!
	const apiSecret = process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET!

	const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')

	const res = await fetch(
		`https://api.cloudinary.com/v1_1/${cloudName}/usage`,
		{
			headers: {
				Authorization: `Basic ${auth}`,
			},
		}
	)

	if (!res.ok) {
		return NextResponse.json(
			{ error: 'Failed to fetch Cloudinary usage' },
			{ status: 500 }
		)
	}

	const data = await res.json()

	const storageBytesUsed = data?.storage?.usage || 0
	const storageBytesLimit = data?.storage?.limit || 25 * 1024 ** 3 // 25 ГБ по дефолту, если нет лимита

	const bytesToGB = (bytes: number) => bytes / 1024 ** 3

	const usedGB = parseFloat(bytesToGB(storageBytesUsed).toFixed(2))
	const limitGB = parseFloat(bytesToGB(storageBytesLimit).toFixed(2))
	const usedPercent = Math.min(
		Math.round((storageBytesUsed / storageBytesLimit) * 100),
		100
	)

	return NextResponse.json({
		storage: {
			used: usedGB, // например 20.84
			limit: limitGB, // например 25
			percent: usedPercent, // например 83
		},
		memoryUsage: Math.floor(Math.random() * 30) + 20, // для примера
	})
}
