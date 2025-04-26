'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type User = {
	email?: string
}

type AuthContextType = {
	user: User | null
	loading: boolean
	logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
	user: null,
	loading: true,
	logout: async () => {},
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
	const [user, setUser] = useState<User | null>(null)
	const [loading, setLoading] = useState(true)
	const router = useRouter()

	useEffect(() => {
		const fetchUser = async () => {
			try {
				const res = await fetch('/api/admin/me', {
					method: 'GET',
					credentials: 'include',
				})
				if (res.ok) {
					const data = await res.json()
					setUser(data)
				} else {
					setUser(null)
				}
			} catch (error) {
				console.error('Error fetching user:', error)
				setUser(null)
			} finally {
				setLoading(false)
			}
		}
		fetchUser()
	}, [])

const logout = async () => {
	try {
		const res = await fetch('/api/admin/logout', {
			method: 'POST',
			credentials: 'include',
		})
		if (res.ok) {
			setUser(null) // Обновляем состояние сразу
			router.push('/admin/login')
		}
	} catch (error) {
		console.error('Logout error:', error)
	}
}



	return (
		<AuthContext.Provider value={{ user, loading, logout }}>
			{children}
		</AuthContext.Provider>
	)
}

export const useAuth = () => useContext(AuthContext)
