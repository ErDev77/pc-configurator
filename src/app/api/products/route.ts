import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(req: NextRequest) {
	try {
		// Получение данных
		const resCategories = await pool.query('SELECT * FROM category')
		const resComponents = await pool.query('SELECT * FROM products LIMIT 10')

		// Проверьте, что ответ приходит правильно
		console.log('Fetched categories:', resCategories.rows)
		console.log('Fetched components:', resComponents.rows)

		return NextResponse.json({
			categories: resCategories.rows, // Должно быть categories
			components: resComponents.rows, // Должно быть components
		})
	} catch (error) {
		console.error('Error fetching data:', error)
		return NextResponse.json({ error: 'Server error' }, { status: 500 })
	}
}


export async function POST(req: NextRequest) {
	console.log('POST request received to /api/products')

	try {
		// Parse request body
		const body = await req.json()
		console.log('Request body:', body)

		const { name, price, brand, image_url, category_id, hidden } = body

		// Validate required fields
		if (!name) {
			return NextResponse.json({ error: 'Name is required' }, { status: 400 })
		}

		// Execute database query
		console.log('Executing database query with values:', {
			name,
			price,
			brand,
			image_url,
			category_id,
			hidden,
		})

		// First, let's alter the table to make the id column auto-increment if it's not already
		await pool.query(`
			DO $$
			BEGIN
				-- Check if the column exists and is not already a serial
				IF EXISTS (
					SELECT 1 FROM information_schema.columns 
					WHERE table_name = 'products' AND column_name = 'id' 
					AND column_default NOT LIKE 'nextval%'
				) THEN
					-- Create a sequence if it doesn't exist
					IF NOT EXISTS (
						SELECT 1 FROM pg_sequences WHERE sequencename = 'products_id_seq'
					) THEN
						CREATE SEQUENCE products_id_seq;
					END IF;

					-- Set the default value of the id column to use the sequence
					ALTER TABLE products ALTER COLUMN id SET DEFAULT nextval('products_id_seq');
					-- Make the sequence owned by the column to ensure proper deletion
					ALTER SEQUENCE products_id_seq OWNED BY products.id;
				END IF;
			END
			$$;
		`)

		// Now insert the product, letting the database handle the ID
		const query = `
			INSERT INTO products (name, price, brand, image_url, category_id, hidden) 
			VALUES ($1, $2, $3, $4, $5, $6) 
			RETURNING *
		`
		const values = [
			name,
			Number(price),
			brand,
			image_url,
			Number(category_id),
			Boolean(hidden),
		]

		const result = await pool.query(query, values)
		const insertedProduct = result.rows[0]

		console.log('Product inserted successfully:', insertedProduct)

		return NextResponse.json(
			{
				success: true,
				message: 'Product added successfully',
				product: insertedProduct,
			},
			{ status: 201 }
		)
	} catch (error) {
		console.error('Error inserting product:', error)
		return NextResponse.json(
			{
				error: 'Database error',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		)
	}
}
