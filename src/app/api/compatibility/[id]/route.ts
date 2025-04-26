import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

// Получить информацию о совместимости
// /api/compatibility/route.ts

// Получить информацию о совместимости
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

    // Запрос для получения совместимости с именами компонентов
    const result = await pool.query(
      `SELECT c.id, 
              p1.id AS component1_id, p1.name AS component1_name, p1.image_url AS component1_image_url, 
              p2.id AS component2_id, p2.name AS component2_name, p2.image_url AS component2_image_url
       FROM compatibility c
       LEFT JOIN products p1 ON c.component1_id = p1.id
       LEFT JOIN products p2 ON c.component2_id = p2.id
       WHERE c.component1_id = $1 OR c.component2_id = $1`,
      [componentId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'No compatibilities found for this component' },
        { status: 404 }
      )
    }

    // Возвращаем совместимости с именами и изображениями компонентов
    return NextResponse.json(result.rows, { status: 200 })
  } catch (error) {
    console.error('Error fetching compatibility:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


// Обновить информацию о совместимости
export async function PATCH(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const compatibilityId = parseInt(params.id)

		if (isNaN(compatibilityId)) {
			return NextResponse.json(
				{ error: 'Invalid compatibility ID' },
				{ status: 400 }
			)
		}

		const body = await req.json()
		const { component1_id, component2_id } = body

		if (!component1_id || !component2_id) {
			return NextResponse.json(
				{ error: 'Component IDs are required' },
				{ status: 400 }
			)
		}

		// Обновляем совместимость
		const result = await pool.query(
			`UPDATE compatibility 
       SET component1_id = $1, component2_id = $2
       WHERE id = $3 RETURNING *`,
			[component1_id, component2_id, compatibilityId]
		)

		if (result.rows.length === 0) {
			return NextResponse.json(
				{ error: 'Compatibility not found for update' },
				{ status: 404 }
			)
		}

		return NextResponse.json(
			{ success: true, updatedCompatibility: result.rows[0] },
			{ status: 200 }
		)
	} catch (error) {
		console.error('Error updating compatibility:', error)
		return NextResponse.json({ error: 'Server error' }, { status: 500 })
	}
}

// Удалить совместимость по ID
export async function DELETE(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const compatibilityId = parseInt(params.id)

		if (isNaN(compatibilityId)) {
			return NextResponse.json(
				{ error: 'Invalid compatibility ID' },
				{ status: 400 }
			)
		}

		// Удаление совместимости
		const result = await pool.query(
			`DELETE FROM compatibility WHERE id = $1 RETURNING *`,
			[compatibilityId]
		)

		if (result.rows.length === 0) {
			return NextResponse.json(
				{ error: 'Compatibility not found for deletion' },
				{ status: 404 }
			)
		}

		return NextResponse.json(
			{ success: true, message: 'Compatibility successfully deleted' },
			{ status: 200 }
		)
	} catch (error) {
		console.error('Error deleting compatibility:', error)
		return NextResponse.json({ error: 'Server error' }, { status: 500 })
	}
}
