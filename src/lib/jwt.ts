// src/lib/jwt.ts
import { jwtVerify, SignJWT } from 'jose'
import { JWTPayload as JoseJWTPayload } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET as string

if (!JWT_SECRET) {
	throw new Error('JWT_SECRET is not defined in environment variables.')
}

interface JWTPayload {
	id: number
	email: string
	twoFactorVerified?: boolean
	twoFactorEnabled?: boolean
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
	try {
		const { payload } = await jwtVerify(
			token,
			new TextEncoder().encode(JWT_SECRET),
			{
				maxTokenAge: '1d', // Enforce max token age
			}
		)

		// Validate that the payload has the required fields
		if (!payload.id || !payload.email) {
			throw new Error('Invalid token payload - missing required fields')
		}

		return payload as unknown as JWTPayload
	} catch (error) {
		console.error('JWT verification error:', error)
		throw error
	}
}

// Helper function that doesn't query the database directly
export async function requireTwoFactorVerification(
	token: string
): Promise<boolean> {
	try {
		const decoded = await verifyToken(token)

		// If the token has a twoFactorVerified flag, use it
		if ('twoFactorVerified' in decoded) {
			return decoded.twoFactorVerified === true
		}

		// If the token has twoFactorEnabled flag, check it
		if ('twoFactorEnabled' in decoded) {
			return !decoded.twoFactorEnabled // If 2FA is enabled but not verified, return false
		}

		// If we don't have the information in the token, default to no 2FA required
		return true
	} catch (error) {
		console.error('Error checking 2FA requirement:', error)
		return false
	}
}
