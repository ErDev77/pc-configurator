'use client'

import { AuthProvider } from '@/context/AuthContext'
import { Provider } from 'react-redux'
import { store } from '@/redux/store'
import { ThemeProvider } from '@/context/ThemeContext'

export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider>
			<AuthProvider>
				<Provider store={store}>{children}</Provider>
			</AuthProvider>
		</ThemeProvider>
	)
}
