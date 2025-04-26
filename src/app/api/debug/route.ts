// Add this to src/app/api/debug/route.ts
import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(req: NextRequest) {
	try {
		// Get table structure for products table
		const tableStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'products'
    `)

		return NextResponse.json({
			message: 'Database debug info',
			tableStructure: tableStructure.rows,
		})
	} catch (error) {
		console.error('Debug error:', error)
		return NextResponse.json(
			{ error: 'Debug error', message: (error as Error).message },
			{ status: 500 }
		)
	}
}
