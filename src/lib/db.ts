// src/lib/db.ts
import { Pool } from 'pg'
import dotenv from 'dotenv'

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: {
		rejectUnauthorized: false,
	},
})

// Test the connection
pool.on('error', err => {
	console.error('Unexpected error on idle client', err)
})

// Test the connection when the server starts
async function testConnection() {
	try {
		const client = await pool.connect()
		console.log('Database connection successful')
		client.release()
	} catch (err) {
		console.error('Database connection error:', err)
	}
}

testConnection()

export default pool
