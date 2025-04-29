// app/api/configurations/[id]/route.ts
import pool from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	const { id } = await params
	console.log('API: Fetching configuration ID:', id)

	try {
		// Get the configuration
		const configResult = await pool.query(
			'SELECT * FROM configurations WHERE id = $1',
			[id]
		)

		if (configResult.rows.length === 0) {
			console.log('API: Configuration not found')
			return NextResponse.json(
				{ error: 'Configuration not found' },
				{ status: 404 }
			)
		}

		const configuration = configResult.rows[0]
		console.log('API: Configuration found:', configuration)

		// Get the associated products
		const productsResult = await pool.query(
			`
      SELECT p.*
      FROM configuration_products cp
      JOIN products p ON cp.product_id = p.id
      WHERE cp.configuration_id = $1
      `,
			[id]
		)

		const products = productsResult.rows
		console.log('API: Products found:', products.length)

		// Combine configuration with products
		const fullConfiguration = {
			...configuration,
			products,
		}

		return NextResponse.json(fullConfiguration)
	} catch (error) {
		console.error('API Error getting configuration:', error)
		return NextResponse.json({ error: 'Server error' }, { status: 500 })
	}
}
export async function DELETE(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	const { id } = await params
	console.log('API: Deleting configuration ID:', id)
	
	try {
		// Удаляем все связи с продуктами
		await pool.query(
			'DELETE FROM configuration_products WHERE configuration_id = $1',
			[id]
		)

		// Удаляем саму конфигурацию
		await pool.query('DELETE FROM configurations WHERE id = $1', [id])

		console.log('API: Configuration deleted successfully')

		return NextResponse.json({ message: 'Configuration deleted' })
	} catch (error) {
		console.error('API Error deleting configuration:', error)
		return NextResponse.json({ error: 'Server error' }, { status: 500 })
	}
}

// Обновление конфигурации
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params
  console.log('API: Updating configuration ID:', id)

  try {
    // Получаем тело запроса (новые данные конфигурации)
    const body = await req.json()

    // Проверка на обязательные параметры
    const { name, description, price, image_url, hidden, isfavorite } = body
    if (!name || !description || !price || !image_url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Создаем объект для обновления только тех полей, которые были переданы в запросе
    const updateFields: any = {
      name,
      description,
      price,
      image_url,
      hidden: hidden !== undefined ? hidden : null, // Если поле hidden не передано, ставим null
      isfavorite: isfavorite !== undefined ? isfavorite : null, // Если поле isfavorite не передано, ставим null
    }

    // Обновляем конфигурацию в базе данных
    const updateConfigResult = await pool.query(
      `
      UPDATE configurations
      SET name = $1, description = $2, price = $3, image_url = $4, hidden = $5, isfavorite = $6
      WHERE id = $7
      RETURNING *
      `,
      [updateFields.name, updateFields.description, updateFields.price, updateFields.image_url, updateFields.hidden, updateFields.isfavorite, id]
    )

    if (updateConfigResult.rows.length === 0) {
      console.log('API: Configuration not found for update')
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      )
    }

    const updatedConfiguration = updateConfigResult.rows[0]
    console.log('API: Configuration updated:', updatedConfiguration)

    return NextResponse.json(updatedConfiguration)
  } catch (error) {
    console.error('API Error updating configuration:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
