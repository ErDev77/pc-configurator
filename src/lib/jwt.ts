import { jwtVerify, SignJWT } from 'jose'
import { JWTPayload as JoseJWTPayload } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET as string

if (!JWT_SECRET) {
	throw new Error('JWT_SECRET is not defined in environment variables.')
}

interface JWTPayload {
	id: number
	email: string
}

export async function signToken(payload: JWTPayload) {
	const josePayload: JoseJWTPayload = {
		...payload,
	}

	return new SignJWT(josePayload)
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime('1d')
		.sign(new TextEncoder().encode(JWT_SECRET))
}

export async function verifyToken(token: string): Promise<JWTPayload> {
	const { payload } = await jwtVerify(
		token,
		new TextEncoder().encode(JWT_SECRET)
	)
	console.log('Decoded token payload:', payload) // Логируем декодированный payload

	return payload as unknown as JWTPayload
}
