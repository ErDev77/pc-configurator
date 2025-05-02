// src/app/api/admin/change-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import bcrypt from 'bcrypt'
import { verifyToken } from '@/lib/jwt'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
	try {
		// Get the auth token
		const cookieStore = await cookies()
		const token = cookieStore.get('admin_auth')?.value

		if (!token) {
			return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
		}

		// Verify the token to get user info
		const decoded = await verifyToken(token)
		const adminId = decoded.id

		// Get the request body
		const { currentPassword, newPassword } = await req.json()

		// Validate input
		if (!currentPassword || !newPassword) {
			return NextResponse.json(
				{ error: 'Current password and new password are required' },
				{ status: 400 }
			)
		}

		if (newPassword.length < 8) {
			return NextResponse.json(
				{ error: 'New password must be at least 8 characters long' },
				{ status: 400 }
			)
		}

		// Get the admin's current password hash
		const result = await pool.query(
			'SELECT password FROM admins WHERE id = $1',
			[adminId]
		)

		if (result.rows.length === 0) {
			return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
		}

		const admin = result.rows[0]

		// Verify current password
		const isValid = await bcrypt.compare(currentPassword, admin.password)
		if (!isValid) {
			return NextResponse.json(
				{ error: 'Current password is incorrect' },
				{ status: 400 }
			)
		}

		// Hash the new password
		const saltRounds = 10
		const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

		// Update the password in the database
		await pool.query(
			'UPDATE admins SET password = $1, updated_at = NOW() WHERE id = $2',
			[hashedPassword, adminId]
		)

		return NextResponse.json({
			success: true,
			message: 'Password changed successfully',
		})
	} catch (error) {
		console.error('Error changing password:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}
