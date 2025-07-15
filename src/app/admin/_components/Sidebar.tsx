'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useNotifications } from '@/context/NotificationContext'
import {
	CircleUserRound,
	Home,
	LogOut,
	Cpu,
	PcCase,
	ChevronRight,
	Settings,
	Bell,
	Moon,
	Sun,
	ShoppingCart,
	Star,
	Layers,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/context/ThemeContext'

const Sidebar = () => {
	const { user, loading, logout } = useAuth()
	const { theme, toggleTheme } = useTheme()
	const [isOpen, setIsOpen] = useState(false)

	const {
		notifications,
		unreadCount,
		markAllAsRead,
		deleteNotification,
		browserNotificationsEnabled,
	} = useNotifications()

	const [showNotifications, setShowNotifications] = useState(false)
	const notificationRef = useRef<HTMLDivElement>(null)
	const router = useRouter()
	const pathname = usePathname()

	useEffect(() => {
		if (!loading && user === null) {
			router.push('/admin/login')
		}
	}, [user, loading, router])

	useEffect(() => {
		// Close notification panel when clicking outside
		const handleClickOutside = (event: MouseEvent) => {
			if (
				notificationRef.current &&
				!notificationRef.current.contains(event.target as Node)
			) {
				setShowNotifications(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [])

	const handleLogout = async () => {
		await logout()
		router.push('/admin/login')
	}

	// Format the timestamp to a readable format
	const formatTimestamp = (timestamp: string) => {
		const date = new Date(timestamp)
		const now = new Date()
		const diffMs = now.getTime() - date.getTime()
		const diffMin = Math.round(diffMs / 60000)
		const diffHrs = Math.round(diffMs / 3600000)
		const diffDays = Math.round(diffMs / 86400000)

		if (diffMin < 1) return 'Just now'
		if (diffMin < 60) return `${diffMin} min ago`
		if (diffHrs < 24) return `${diffHrs} hr ago`
		if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

		return date.toLocaleDateString()
	}

	// Navigation links grouped by category
	const navigationLinks = [
		{
			category: 'Панель управления',
			links: [
				{
					name: 'Главная',
					icon: <Home className='w-5 h-5' />,
					href: '/admin/dashboard',
				},
				{
					name: 'Избранное',
					icon: <Star className='w-5 h-5' />,
					href: '/admin/favorites',
				},
			],
		},
		{
			category: 'Продукты',
			links: [
				{
					name: 'Компоненты',
					icon: <Cpu className='w-5 h-5' />,
					href: '/admin/components',
				},
				{
					name: 'Конфигурации',
					icon: <PcCase className='w-5 h-5' />,
					href: '/admin/configurations',
				},
				{
					name: 'Категории',
					icon: <Layers className='w-5 h-5' />,
					href: '/admin/categories',
				},
			],
		},
		{
			category: 'Заказы',
			links: [
				{
					name: 'Управление заказами',
					icon: <ShoppingCart className='w-5 h-5' />,
					href: '/admin/orders',
				},
			],
		},
		{
			category: 'Система',
			links: [
				{
					name: 'Настройки',
					icon: <Settings className='w-5 h-5' />,
					href: '/admin/settings',
				},
			],
		},
	]

	const isActive = (href: string) => {
		return pathname === href
	}

	return (
		<div className='relative'>
			<div
				className={`fixed top-0 left-0 h-full transition-all duration-300 z-30 ${
					isOpen ? 'w-64' : 'w-20'
				} bg-[color:var(--bg-secondary)] border-r border-[color:var(--border-color)] shadow-lg flex flex-col`}
				onMouseEnter={() => setIsOpen(true)}
				onMouseLeave={() => setIsOpen(false)}
			>
				{/* Logo section */}
				<div className='p-4 border-b border-[color:var(--border-color)] flex items-center justify-center h-16 flex-shrink-0'>
					{isOpen ? (
						<div className='flex items-center'>
							<div className='w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold mr-2'>
								PC
							</div>
							<span className='text-[color:var(--text-primary)] font-bold'>
								Admin Panel
							</span>
						</div>
					) : (
						<div className='w-10 h-10 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold'>
							PC
						</div>
					)}
				</div>

				{/* User profile section */}
				<div className='px-4 py-5 border-b border-[color:var(--border-color)] flex items-center flex-shrink-0'>
					<div className='relative'>
						<div className='w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden'>
							<CircleUserRound size={32} className='text-gray-300' />
						</div>
						<div className='absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-[color:var(--bg-secondary)]'></div>
					</div>

					{isOpen && (
						<div className='ml-3 overflow-hidden'>
							<p className='text-[color:var(--text-primary)] font-semibold truncate'>
								{user?.name || user?.email || 'Admin User'}
							</p>
							<p className='text-[color:var(--text-secondary)] text-xs'>
								{user?.role || 'Administrator'}
							</p>
						</div>
					)}
				</div>

				{/* Navigation section */}
				<div className='p-4 flex-1 flex flex-col justify-between'>
					{/* Navigation links */}
					<div>
						{navigationLinks.map((group, groupIndex) => (
							<div key={groupIndex} className={`${isOpen ? 'mb-5' : 'mb-8'}`}>
								{isOpen && (
									<p className='text-[color:var(--text-secondary)] text-xs uppercase tracking-wider mb-2 pl-2'>
										{group.category}
									</p>
								)}

								{group.links.map((link, linkIndex) => (
									<Link
										href={link.href}
										key={linkIndex}
										className={`flex items-center justify-center ${
											isOpen ? 'justify-start' : ''
										} ${isOpen ? 'py-2' : 'py-3'} px-3 rounded-lg ${
											isOpen ? 'mb-1' : 'mb-4'
										} group transition-colors ${
											isActive(link.href)
												? 'bg-blue-600 text-white'
												: 'text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-tertiary)] hover:text-[color:var(--text-primary)]'
										}`}
									>
										<div
											className={`${
												isActive(link.href)
													? 'text-white'
													: 'text-[color:var(--text-secondary)] group-hover:text-[color:var(--text-primary)]'
											}`}
										>
											{link.icon}
										</div>

										{isOpen && (
											<span className='ml-3 truncate'>{link.name}</span>
										)}

										{isOpen && isActive(link.href) && (
											<div className='ml-auto'>
												<ChevronRight size={16} />
											</div>
										)}
									</Link>
								))}
							</div>
						))}
					</div>

					{/* Bottom actions section */}
					<div className='border-t border-[color:var(--border-color)] pt-4 mt-auto'>
						{isOpen ? (
							<div className='space-y-2'>
								<button
									onClick={toggleTheme}
									className='flex items-center w-full py-2 px-3 rounded-lg text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-tertiary)] hover:text-[color:var(--text-primary)] transition-colors'
								>
									{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
									<span className='ml-3'>
										{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
									</span>
								</button>

								<button
									onClick={handleLogout}
									className='flex items-center w-full py-2 px-3 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors'
								>
									<LogOut size={20} />
									<span className='ml-3'>Выйти</span>
								</button>
							</div>
						) : (
							<div className='flex flex-col items-center space-y-6'>
								<button
									onClick={toggleTheme}
									className='p-2 rounded-lg text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-tertiary)] hover:text-[color:var(--text-primary)] transition-colors'
									title={
										theme === 'dark'
											? 'Switch to Light Mode'
											: 'Switch to Dark Mode'
									}
								>
									{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
								</button>

								<button
									onClick={handleLogout}
									className='p-2 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors'
									title='Log Out'
								>
									<LogOut size={20} />
								</button>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Notifications button */}
			<div className='fixed top-5 right-5 z-40'>
				<button
					className='relative rounded-full p-2 bg-[color:var(--bg-tertiary)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors'
					onClick={() => setShowNotifications(!showNotifications)}
				>
					<Bell size={20} />
					{browserNotificationsEnabled && unreadCount > 0 && (
						<span className='absolute top-0 right-0 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full'>
							{unreadCount}
						</span>
					)}
				</button>

				{/* Notifications panel */}
				{showNotifications && (
					<div
						ref={notificationRef}
						className='absolute top-full right-0 mt-2 w-80 bg-[color:var(--bg-tertiary)] rounded-lg shadow-lg overflow-hidden'
					>
						<div className='p-3 border-b border-[color:var(--border-color)] flex justify-between items-center'>
							<h3 className='font-medium text-[color:var(--text-primary)]'>
								Notifications
							</h3>
							{unreadCount > 0 && (
								<button
									onClick={markAllAsRead}
									className='text-xs text-blue-400 hover:text-blue-300'
								>
									Mark all as read
								</button>
							)}
						</div>

						<div className='max-h-96 overflow-y-auto'>
							{notifications.length > 0 ? (
								notifications.map(notification => (
									<div
										key={notification.id}
										className={`p-3 border-b border-[color:var(--border-color)] hover:bg-[color:var(--bg-primary)] transition-colors flex items-start ${
											notification.read ? 'opacity-70' : ''
										}`}
									>
										<div
											className={`w-2 h-2 rounded-full mt-2 mr-2 flex-shrink-0 ${
												notification.read ? 'bg-gray-500' : 'bg-blue-500'
											}`}
										></div>
										<div className='flex-grow'>
											<p className='text-sm text-[color:var(--text-primary)]'>
												{notification.message}
											</p>
											<p className='text-xs text-[color:var(--text-secondary)] mt-1'>
												{formatTimestamp(notification.timestamp)}
											</p>
										</div>
										<button
											onClick={() => deleteNotification(notification.id)}
											className='text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]'
										>
											&times;
										</button>
									</div>
								))
							) : (
								<div className='p-4 text-center text-[color:var(--text-secondary)]'>
									<p>No notifications</p>
								</div>
							)}
						</div>

						{notifications.length > 0 && (
							<div className='p-2 border-t border-[color:var(--border-color)] text-center'>
								<Link
									href='/admin/orders'
									className='text-xs text-blue-400 hover:text-blue-300'
									onClick={() => setShowNotifications(false)}
								>
									View all
								</Link>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	)
}

export default Sidebar
