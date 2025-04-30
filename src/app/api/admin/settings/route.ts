import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'


// GET: Получение настроек
export async function GET(req: NextRequest) {
	try {
		
		// Проверка существования таблицы
		const checkTableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'settings'
      );
    `)

		if (!checkTableResult.rows[0].exists) {
			await pool.query(`
        CREATE TABLE settings (
          id SERIAL PRIMARY KEY,
          key VARCHAR(255) UNIQUE NOT NULL,
          value JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `)
		}

		// Получение настроек
		const result = await pool.query(
			`SELECT value FROM settings WHERE key = 'notifications';`
		)

		if (result.rows.length === 0) {
			// Вставка дефолтных настроек
			const defaultSettings = { email: true, telegram: true }
			await pool.query(
				`INSERT INTO settings (key, value) VALUES ('notifications', $1);`,
				[JSON.stringify(defaultSettings)]
			)
			return NextResponse.json({ notifications: defaultSettings })
		}

		return NextResponse.json({ notifications: result.rows[0].value })
	} catch (error) {
		console.error('Error retrieving settings:', error)
		return NextResponse.json(
			{ error: 'Failed to retrieve settings' },
			{ status: 500 }
		)
	}
}

// POST: Обновление настроек
export async function POST(req: NextRequest) {
	try {
		const body = await req.json()
		const { notifications } = body

		if (!notifications) {
			return NextResponse.json(
				{ error: 'Notification settings are required' },
				{ status: 400 }
			)
		}

		// Убедимся, что существует уникальный индекс по key
		await pool.query(
			`CREATE UNIQUE INDEX IF NOT EXISTS settings_key_unique ON settings(key);`
		)

		// Обновление или вставка
		await pool.query(
			`
  INSERT INTO settings (key, value, updated_at) 
  VALUES ('notifications', $1, CURRENT_TIMESTAMP)
  ON CONFLICT (key) 
  DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
  `,
			[JSON.stringify(notifications)]
		)

		return NextResponse.json({
			success: true,
			message: 'Settings updated successfully',
		})
	} catch (error) {
		console.error('Error updating settings:', error)
		return NextResponse.json(
			{ error: 'Failed to update settings' },
			{ status: 500 }
		)
	}
}
