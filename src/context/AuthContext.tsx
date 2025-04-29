'use client'

import {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from 'react'
import { useRouter, usePathname } from 'next/navigation'

type User = {
	[x: string]: any
	email?: string
}

type AuthContextType = {
	user: User | null
	loading: boolean
	logout: () => Promise<void>
	refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
	user: null,
	loading: true,
	logout: async () => {},
	refreshUser: async () => {},
})

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [user, setUser] = useState<User | null>(null)
	const [loading, setLoading] = useState(true)
	const router = useRouter()
	const pathname = usePathname()

	// Function to fetch user data
	const fetchUser = async (): Promise<User | null> => {
		try {
			console.log('Fetching user data...')
			const res = await fetch('/api/admin/me', {
				method: 'GET',
				credentials: 'include',
				cache: 'no-store', // Important: Don't cache this request
				headers: {
					'Cache-Control': 'no-cache',
				},
			})

			if (res.ok) {
				const data = await res.json()
				console.log('User data fetched successfully:', data)
				return data
			} else {
				console.log('Failed to fetch user, status:', res.status)
				return null
			}
		} catch (error) {
			console.error('Error fetching user:', error)
			return null
		}
	}

	// Public method to refresh user data
	const refreshUser = async () => {
		const userData = await fetchUser()
		setUser(userData)
	}

	// Check authentication on component mount and pathname changes
	useEffect(() => {
		const checkAuth = async () => {
			console.log('Checking authentication, current pathname:', pathname)
			setLoading(true)

			// Only do auth check if on admin pages
			if (pathname?.startsWith('/admin') && pathname !== '/admin/login') {
				const userData = await fetchUser()

				if (!userData) {
					console.log('No user data, redirecting to login')
					router.push('/admin/login')
				} else {
					console.log('User authenticated:', userData.email)
					setUser(userData)
				}
			}

			setLoading(false)
		}

		checkAuth()
	}, [pathname, router])

	const logout = async () => {
		try {
			setLoading(true)
			const res = await fetch('/api/admin/logout', {
				method: 'POST',
				credentials: 'include',
			})

			if (res.ok) {
				setUser(null)
				// Use router.replace instead of push for a cleaner navigation
				router.replace('/admin/login')
			}
		} catch (error) {
			console.error('Logout error:', error)
		} finally {
			setLoading(false)
		}
	}

	return (
		<AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
			{children}
		</AuthContext.Provider>
	)
}

export const useAuth = () => useContext(AuthContext)
