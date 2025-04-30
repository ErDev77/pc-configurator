import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(req: NextRequest) {
	try {
		const products = await pool.query(`
			SELECT column_name, data_type, is_nullable
			FROM information_schema.columns
			WHERE table_name = 'products'
		`)

		const configurations = await pool.query(`
			SELECT column_name, data_type, is_nullable
			FROM information_schema.columns
			WHERE table_name = 'configurations'
		`)

		const settings = await pool.query(`
			SELECT column_name, data_type, is_nullable
			FROM information_schema.columns
			WHERE table_name = 'settings'
		`)

		const orders = await pool.query(`
			SELECT column_name, data_type, is_nullable
			FROM information_schema.columns
			WHERE table_name = 'orders'
		`)

		const favorites = await pool.query(`
			SELECT column_name, data_type, is_nullable
			FROM information_schema.columns
			WHERE table_name = 'favorites'
		`)

		const admins = await pool.query(`
			SELECT column_name, data_type, is_nullable
			FROM information_schema.columns
			WHERE table_name = 'admins'
		`)

		return NextResponse.json({
			message: 'Database debug info',
			tables: {
				products: products.rows,
				configurations: configurations.rows,
				settings: settings.rows,
				orders: orders.rows,
				favorites: favorites.rows,
				admins: admins.rows,
			},
		})
	} catch (error) {
		console.error('Debug error:', error)
		return NextResponse.json(
			{ error: 'Debug error', message: (error as Error).message },
			{ status: 500 }
		)
	}
}
