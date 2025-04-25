import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import db from '@/lib/db'
import { NextApiRequest, NextApiResponse } from 'next/types'

export async function GET(req: NextRequest) {
	try {
		const resCategories = await pool.query('SELECT * FROM category')
		const resComponents = await pool.query('SELECT * FROM products LIMIT 10')

		return NextResponse.json({
			categories: resCategories.rows,
			components: resComponents.rows,
		})
	} catch (error) {
		console.error('Ошибка при запросе данных:', error)
		return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
	}
}

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	if (req.method === 'POST') {
		const { name, price, brand, image_url, category_id } = req.body
		try {
			// Insert the product into the database
			const query =
				'INSERT INTO products (name, price, brand, image_url, category_id) VALUES ($1, $2, $3, $4, $5)'
			const values = [name, price, brand, image_url, category_id]
			await db.query(query, values)
			res.status(201).json({ message: 'Product added successfully' })
		} catch (error) {
			console.error('Error adding product:', error)
			res.status(500).json({ message: 'Database error', error: (error as Error).message })
		}
	} else {
		res.status(405).json({ message: 'Method Not Allowed' })
	}
}

