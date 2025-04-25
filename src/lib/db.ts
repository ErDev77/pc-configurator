import { Pool } from 'pg'

const pool = new Pool({
	user: 'postgres',
	host: 'localhost',
	database: 'pc_configurator',
	password: 'Pg!2025_SecureDB*',
	port: 5432,
})

export default pool
