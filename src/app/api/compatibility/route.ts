// /app/api/compatibility/route.ts

import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url)
		const componentId = searchParams.get('componentId')

		if (!componentId) {
			return NextResponse.json(
				{ error: 'Component ID is required' },
				{ status: 400 }
			)
		}

		const result = await pool.query(
			`SELECT * FROM compatibility WHERE component1_id = $1 OR component2_id = $1`,
			[componentId]
		)

		return NextResponse.json(result.rows)
	} catch (error) {
		console.error('Error fetching compatibility:', error)
		return NextResponse.json({ error: 'Server error' }, { status: 500 })
	}
}

export async function POST(req: NextRequest) {
	try {
		const body = await req.json()
		const { component1_id, component2_id } = body

		if (!component1_id || !component2_id) {
			return NextResponse.json(
				{ error: 'Component IDs are required' },
				{ status: 400 }
			)
		}

		const result = await pool.query(
			`INSERT INTO compatibility (component1_id, component2_id) VALUES ($1, $2) RETURNING *`,
			[component1_id, component2_id]
		)

		return NextResponse.json({ success: true, compatibility: result.rows[0] })
	} catch (error) {
		console.error('Error adding compatibility:', error)
		return NextResponse.json({ error: 'Server error' }, { status: 500 })
	}
}
