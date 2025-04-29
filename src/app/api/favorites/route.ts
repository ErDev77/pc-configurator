import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export interface Favorite {
	id: number
	admin_id: string
	configuration_id?: string | null
	product_id?: number | null
	order_id?: number | null
	created_at: string
}

// Получить все избранные для админа
export async function GET(req: NextRequest) {
	const adminId = req.nextUrl.searchParams.get('adminId')

	if (!adminId) {
		return NextResponse.json({ error: 'adminId is required' }, { status: 400 })
	}

	try {
		const result = await pool.query(
			`SELECT * FROM favorites WHERE admin_id = $1 ORDER BY created_at DESC`,
			[adminId]
		)
		return NextResponse.json(result.rows)
	} catch (error) {
		console.error('GET /favorites error:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch favorites' },
			{ status: 500 }
		)
	}
}

// Добавить в избранное
export async function POST(req: NextRequest) {
	const { admin_id, configuration_id, product_id, order_id } = await req.json()

	if (!admin_id) {
		return NextResponse.json({ error: 'admin_id is required' }, { status: 400 })
	}

	if (!configuration_id && !product_id && !order_id) {
		return NextResponse.json(
			{
				error:
					'At least one of configuration_id, product_id, or order_id is required',
			},
			{ status: 400 }
		)
	}

	try {
		// Check if the favorite already exists
		const existingFavorite = await pool.query(
			`SELECT * FROM favorites WHERE admin_id = $1 AND configuration_id = $2`,
			[admin_id, configuration_id]
		)

		if (existingFavorite.rowCount && existingFavorite.rowCount > 0) {
			return NextResponse.json(
				{ message: 'Favorite already exists' },
				{ status: 400 }
			)
		}

		// Insert the new favorite
		const result = await pool.query(
			`
            INSERT INTO favorites (admin_id, configuration_id, product_id, order_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *
            `,
			[admin_id, configuration_id, product_id, order_id]
		)

		return NextResponse.json(result.rows[0])
	} catch (error) {
		console.error('POST /favorites error:', error)
		return NextResponse.json(
			{ error: 'Failed to add favorite' },
			{ status: 500 }
		)
	}
}

// Удалить из избранного
export async function DELETE(req: NextRequest) {
	const id = req.nextUrl.searchParams.get('id')

	if (!id) {
		return NextResponse.json({ error: 'id is required' }, { status: 400 })
	}
	const checkResult = await pool.query(
		'SELECT 1 FROM favorites WHERE id = $1',
		[id]
	)
	if (checkResult.rowCount === 0) {
		return NextResponse.json({ error: 'Favorite not found' }, { status: 404 })
	}

	try {
		const result = await pool.query(
			'DELETE FROM favorites WHERE id = $1 RETURNING *',
			[id]
		)

		if (result.rowCount === 0) {
			return NextResponse.json({ error: 'Favorite not found' }, { status: 404 })
		}

		return NextResponse.json({ message: 'Favorite deleted' })
	} catch (error) {
		console.error('DELETE /favorites error:', error)
		return NextResponse.json(
			{ error: 'Failed to delete favorite' },
			{ status: 500 }
		)
	}
}
