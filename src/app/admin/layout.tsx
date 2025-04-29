// src/app/admin/layout.tsx
'use client'

import { useTheme } from '@/context/ThemeContext'

export default function AdminLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const { theme } = useTheme()

	return (
		<div className='admin-page flex min-h-screen'>
			<div className='flex-1 admin-content'>{children}</div>
		</div>
	)
}
