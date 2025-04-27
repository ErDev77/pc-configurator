import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

// Получение категорий и компонентов
export async function GET(req: NextRequest) {
	try {
		const resCategories = await pool.query('SELECT * FROM category')
		const resComponents = await pool.query('SELECT * FROM products LIMIT 10')

		console.log('Fetched categories:', resCategories.rows)
		console.log('Fetched components:', resComponents.rows)

		return NextResponse.json({
			categories: resCategories.rows,
			components: resComponents.rows,
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
    if (body.category_name) {
      const { category_name } = body
      if (!category_name) {
        return NextResponse.json(
          { error: 'Category name is required' },
          { status: 400 }
        )
      }

      const queryCategory =
        'INSERT INTO category (name) VALUES ($1) RETURNING *'
      const valuesCategory = [category_name]
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
    const { name, price, brand, image_url, category_id, hidden } = body

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
      INSERT INTO products (name, price, brand, image_url, category_id, hidden) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *
    `
    const valuesProduct = [
      name,
      validPrice,
      brand,
      image_url,
      validCategoryId,
      Boolean(hidden),
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
		const { id, name } = await req.json()

		if (!id || !name) {
			return NextResponse.json(
				{ error: 'ID and new name are required' },
				{ status: 400 }
			)
		}

		const query = 'UPDATE category SET name = $1 WHERE id = $2 RETURNING *'
		const result = await pool.query(query, [name, id])

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

// Редактирование продукта
export async function PUT_PRODUCT(req: NextRequest) {
	try {
		const { id, name, price, brand, image_url, category_id, hidden } =
			await req.json()

		if (!id || !name) {
			return NextResponse.json(
				{ error: 'ID and new name are required' },
				{ status: 400 }
			)
		}

		const query = `
      UPDATE products 
      SET name = $1, price = $2, brand = $3, image_url = $4, category_id = $5, hidden = $6 
      WHERE id = $7 RETURNING *
    `
		const result = await pool.query(query, [
			name,
			price,
			brand,
			image_url,
			category_id,
			hidden,
			id,
		])

		if (result.rowCount === 0) {
			return NextResponse.json({ error: 'Product not found' }, { status: 404 })
		}

		const updatedProduct = result.rows[0]
		return NextResponse.json({
			success: true,
			message: 'Product updated successfully',
			product: updatedProduct,
		})
	} catch (error) {
		console.error('Error updating product:', error)
		return NextResponse.json({ error: 'Server error' }, { status: 500 })
	}
}

// Удаление продукта
export async function DELETE_PRODUCT(req: NextRequest) {
	try {
		const { id } = await req.json()

		if (!id) {
			return NextResponse.json({ error: 'ID is required' }, { status: 400 })
		}

		const query = 'DELETE FROM products WHERE id = $1 RETURNING *'
		const result = await pool.query(query, [id])

		if (result.rowCount === 0) {
			return NextResponse.json({ error: 'Product not found' }, { status: 404 })
		}

		return NextResponse.json({
			success: true,
			message: 'Product deleted successfully',
			product: result.rows[0],
		})
	} catch (error) {
		console.error('Error deleting product:', error)
		return NextResponse.json({ error: 'Server error' }, { status: 500 })
	}
}
