import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

function parseSpecs(specs: any): string[] {
	if (Array.isArray(specs)) {
		return specs
	}

	if (typeof specs === 'string') {
		try {
			const parsed = JSON.parse(specs)
			return Array.isArray(parsed) ? parsed : []
		} catch (e) {
			return []
		}
	}

	return []
}

// Получение категорий и компонентов
export async function GET(req: NextRequest) {
	try {
		const url = new URL(req.url)
		const page = parseInt(url.searchParams.get('page') || '1')
		const pageSize = parseInt(url.searchParams.get('pageSize') || '10')

		// Validate pageSize to prevent excessive loads
		const validPageSize = Math.min(pageSize, 1000) // Maximum 1000 items per page

		const offset = (page - 1) * validPageSize

		// Get total count
		const totalCountResult = await pool.query('SELECT COUNT(*) FROM products')
		const totalCount = parseInt(totalCountResult.rows[0].count)

		// Get categories with proper handling of null values
		const resCategories = await pool.query(`
      SELECT 
        id,
        name,
        COALESCE(name_en, name) as name_en,
        COALESCE(NULLIF(name_ru, '[null]'), '') as name_ru,
        COALESCE(NULLIF(name_am, '[null]'), '') as name_am
      FROM category
      ORDER BY id
    `)

		// Get products
		const resComponents = await pool.query(
			'SELECT * FROM products ORDER BY id LIMIT $1 OFFSET $2',
			[validPageSize, offset]
		)

		// Parse the specs from JSON strings to arrays
		const components = resComponents.rows.map(product => ({
			...product,
			specs_en: parseSpecs(product.specs_en),
			specs_ru: parseSpecs(product.specs_ru),
			specs_am: parseSpecs(product.specs_am),
		}))

		console.log(
			`Returning ${components.length} products of ${totalCount} total`
		)

		return NextResponse.json({
			categories: resCategories.rows,
			components: components,
			pagination: {
				currentPage: page,
				pageSize: validPageSize,
				totalCount: totalCount,
				totalPages: Math.ceil(totalCount / validPageSize),
			},
		})
	} catch (error) {
		console.error('Error fetching data:', error)
		return NextResponse.json({ error: 'Server error' }, { status: 500 })
	}
}

// Добавление категории или продукта
export async function POST(req: NextRequest) {
	try {
		const body = await req.json()

		// Проверка на добавление категории
		if (body.category_name || body.name_en || body.name_ru || body.name_am) {
			// Handle category creation
			const name = body.category_name || body.name_en || ''
			const name_en = body.name_en || name
			const name_ru = body.name_ru || ''
			const name_am = body.name_am || ''

			if (!name_en) {
				return NextResponse.json(
					{ error: 'Category name in English is required' },
					{ status: 400 }
				)
			}

			const queryCategory =
				'INSERT INTO category (name, name_en, name_ru, name_am) VALUES ($1, $2, $3, $4) RETURNING *'
			const valuesCategory = [name, name_en, name_ru, name_am]
			const resultCategory = await pool.query(queryCategory, valuesCategory)
			const newCategory = resultCategory.rows[0]

			return NextResponse.json(
				{
					success: true,
					message: 'Category added successfully',
					category: newCategory,
				},
				{ status: 201 }
			)
		}

		// Добавление продукта
		const {
			name,
			price,
			brand,
			image_url,
			category_id,
			hidden,
			specs_en,
			specs_ru,
			specs_am,
		} = body

		if (!name) {
			return NextResponse.json(
				{ error: 'Product name is required' },
				{ status: 400 }
			)
		}

		// Проверка на корректность числовых значений только для продуктов
		const validPrice = Number(price)
		const validCategoryId = Number(category_id)

		if (isNaN(validPrice) || isNaN(validCategoryId)) {
			return NextResponse.json(
				{ error: 'Price and Category ID must be valid numbers' },
				{ status: 400 }
			)
		}

		const queryProduct = `
      INSERT INTO products (
        name, 
        price, 
        brand, 
        image_url, 
        category_id, 
        hidden,
        specs_en,
        specs_ru,
        specs_am
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *
    `
		const valuesProduct = [
			name,
			validPrice,
			brand,
			image_url,
			validCategoryId,
			Boolean(hidden),
			JSON.stringify(specs_en || []),
			JSON.stringify(specs_ru || []),
			JSON.stringify(specs_am || []),
		]

		const resultProduct = await pool.query(queryProduct, valuesProduct)
		const insertedProduct = resultProduct.rows[0]

		return NextResponse.json(
			{
				success: true,
				message: 'Product added successfully',
				product: insertedProduct,
			},
			{ status: 201 }
		)
	} catch (error) {
		console.error('Error inserting category or product:', error)
		return NextResponse.json(
			{
				error: 'Database error',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		)
	}
}

// Редактирование категории
export async function PUT(req: NextRequest) {
	try {
		const { id, name, name_en, name_ru, name_am } = await req.json()

		if (!id || (!name && !name_en)) {
			return NextResponse.json(
				{ error: 'ID and at least English name are required' },
				{ status: 400 }
			)
		}

		const query =
			'UPDATE category SET name = $1, name_en = $2, name_ru = $3, name_am = $4 WHERE id = $5 RETURNING *'
		const result = await pool.query(query, [
			name || name_en, // Default "name" field gets the English name if no primary name provided
			name_en || name, // Default English name gets the primary name if not provided
			name_ru || '',
			name_am || '',
			id,
		])

		if (result.rowCount === 0) {
			return NextResponse.json({ error: 'Category not found' }, { status: 404 })
		}

		const updatedCategory = result.rows[0]
		return NextResponse.json({
			success: true,
			message: 'Category updated successfully',
			category: updatedCategory,
		})
	} catch (error) {
		console.error('Error updating category:', error)
		return NextResponse.json({ error: 'Server error' }, { status: 500 })
	}
}

// Удаление категории
export async function DELETE(req: NextRequest) {
	try {
		const { id } = await req.json()

		if (!id) {
			return NextResponse.json({ error: 'ID is required' }, { status: 400 })
		}

		const query = 'DELETE FROM category WHERE id = $1 RETURNING *'
		const result = await pool.query(query, [id])

		if (result.rowCount === 0) {
			return NextResponse.json({ error: 'Category not found' }, { status: 404 })
		}

		return NextResponse.json({
			success: true,
			message: 'Category deleted successfully',
			category: result.rows[0],
		})
	} catch (error) {
		console.error('Error deleting category:', error)
		return NextResponse.json({ error: 'Server error' }, { status: 500 })
	}
}
