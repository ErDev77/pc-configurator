'use client'

import { AuthProvider } from '@/context/AuthContext'
import { Provider } from 'react-redux'
import { store } from '@/redux/store'

export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<AuthProvider>
			<Provider store={store}>{children}</Provider>
		</AuthProvider>
	)
}
