// src/app/admin/layout.tsx
'use client'

import { useTheme } from '@/context/ThemeContext'
import OrderListener from './_components/OrderListener'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export default function AdminLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const { theme } = useTheme()

	return (
		<div className='admin-page flex min-h-screen'>
			{/* Order listener component to catch new orders */}
			<OrderListener />

			<div className='flex-1 admin-content'>{children}</div>

			{/* Toast container for notifications */}
			<ToastContainer
				position='top-right'
				autoClose={3000}
				hideProgressBar={false}
				newestOnTop={true}
				closeOnClick
				rtl={false}
				pauseOnFocusLoss
				draggable
				pauseOnHover
				theme={theme === 'dark' ? 'dark' : 'light'}
			/>
		</div>
	)
}
