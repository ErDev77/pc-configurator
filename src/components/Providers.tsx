'use client'

import { AuthProvider } from '@/context/AuthContext'
import { Provider } from 'react-redux'
import { store } from '@/redux/store'
import { ThemeProvider } from '@/context/ThemeContext'
import { NotificationProvider } from '@/context/NotificationContext'
import { LanguageProvider } from '@/context/LanguageContext'

export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider>
			<LanguageProvider>
				<AuthProvider>
					<Provider store={store}>
						<NotificationProvider>{children}</NotificationProvider>
					</Provider>
				</AuthProvider>
			</LanguageProvider>
		</ThemeProvider>
	)
}
