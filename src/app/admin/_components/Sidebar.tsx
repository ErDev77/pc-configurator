'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import {
	CircleUserRound,
	Home,
	LogOut,
	Plus,
	SunMoon,
	User,
	Cpu,
	PcCase,
	Box,
	ListFilterPlus,
	ScrollText,
	ChevronRight,
	Settings,
	BarChart3,
	HelpCircle,
	Bell,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

type User = {
	email?: string
	name?: string
	role?: string
}

const Sidebar = () => {
	const { user, loading, logout } = useAuth()
	const [isOpen, setIsOpen] = useState(false)
	const [isDarkMode, setIsDarkMode] = useState(true)
	const [notifications, setNotifications] = useState<
		{ id: number; message: string; read: boolean }[]
	>([
		{ id: 1, message: 'New order received #ORD8721', read: false },
		{ id: 2, message: 'Low stock alert: GPU RTX 4080', read: false },
	])
	const [showNotifications, setShowNotifications] = useState(false)
	const [showHelpPopup, setShowHelpPopup] = useState(false)
	const notificationRef = useRef<HTMLDivElement>(null)
	const helpRef = useRef<HTMLDivElement>(null)
	const router = useRouter()
	const pathname = usePathname()

	useEffect(() => {
		if (!loading && user === null) {
			router.push('/admin/login')
		}
	}, [user, loading, router])

	useEffect(() => {
		// Close panels when clicking outside
		const handleClickOutside = (event: MouseEvent) => {
			if (
				notificationRef.current &&
				!notificationRef.current.contains(event.target as Node)
			) {
				setShowNotifications(false)
			}
			if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
				setShowHelpPopup(false)
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

	const toggleTheme = () => {
		setIsDarkMode(!isDarkMode)
		// In a real app, this would update the application theme
	}

	const markAllAsRead = () => {
		setNotifications(prev => prev.map(notif => ({ ...notif, read: true })))
	}

	const deleteNotification = (id: number) => {
		setNotifications(prev => prev.filter(notif => notif.id !== id))
	}

	// Navigation links grouped by category
	const navigationLinks = [
		{
			category: 'Dashboard',
			links: [
				{
					name: 'Overview',
					icon: <Home className='w-5 h-5' />,
					href: '/admin/dashboard',
				},
				// {
				// 	name: 'Analytics',
				// 	icon: <BarChart3 className='w-5 h-5' />,
				// 	href: '/admin/analytics',
				// },
			],
		},
		{
			category: 'Products',
			links: [
				{
					name: 'Components',
					icon: <Cpu className='w-5 h-5' />,
					href: '/admin/components',
				},
				{
					name: 'Configurations',
					icon: <PcCase className='w-5 h-5' />,
					href: '/admin/configurations',
				},
				{
					name: 'Categories',
					icon: <ListFilterPlus className='w-5 h-5' />,
					href: '/admin/categories',
				},
			],
		},
		{
			category: 'Orders',
			links: [
				{
					name: 'Manage Orders',
					icon: <ScrollText className='w-5 h-5' />,
					href: '/admin/orders',
				},
			],
		},
		{
			category: 'System',
			links: [
				{
					name: 'Settings',
					icon: <Settings className='w-5 h-5' />,
					href: '/admin/settings',
				},
				// {
				// 	name: 'Help',
				// 	icon: <HelpCircle className='w-5 h-5' />,
				// 	href: '/admin/help',
				// },
			],
		},
	]

	const isActive = (href: string) => {
		return pathname === href
	}

	const unreadCount = notifications.filter(n => !n.read).length

	// Quick help resources for the help popup
	const quickHelpLinks = [
		{ title: 'Admin Documentation', href: '/admin/help#documentation' },
		{ title: 'Video Tutorials', href: '/admin/help#tutorials' },
		{ title: 'API Reference', href: '/admin/help#api' },
		{ title: 'Contact Support', href: '/admin/help#support' },
	]

	return (
		<div className='relative'>
			<div
				className={`fixed top-0 left-0 h-full transition-all duration-300 z-30 ${
					isOpen ? 'w-64' : 'w-20'
				} bg-[#1a1d21] border-r border-[#2a2d35] shadow-lg`}
				onMouseEnter={() => setIsOpen(true)}
				onMouseLeave={() => setIsOpen(false)}
			>
				{/* Logo section */}
				<div className='p-4 border-b border-[#2a2d35] flex items-center justify-center h-16'>
					{isOpen ? (
						<div className='flex items-center'>
							<div className='w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold mr-2'>
								PC
							</div>
							<span className='text-white font-bold'>Admin Panel</span>
						</div>
					) : (
						<div className='w-10 h-10 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold'>
							PC
						</div>
					)}
				</div>

				{/* User profile section */}
				<div className='px-4 py-5 border-b border-[#2a2d35] flex items-center'>
					<div className='relative'>
						<div className='w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden'>
							<CircleUserRound size={32} className='text-gray-300' />
						</div>
						<div className='absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-[#1a1d21]'></div>
					</div>

					{isOpen && (
						<div className='ml-3 overflow-hidden'>
							<p className='text-white font-semibold truncate'>
								{user?.name || user?.email || 'Admin User'}
							</p>
							<p className='text-gray-400 text-xs'>
								{user?.role || 'Administrator'}
							</p>
						</div>
					)}
				</div>

				{/* Navigation section */}
				<div className='p-4 overflow-y-auto h-[calc(100vh-140px)]'>
					{navigationLinks.map((group, groupIndex) => (
						<div key={groupIndex} className='mb-6'>
							{isOpen && (
								<p className='text-gray-400 text-xs uppercase tracking-wider mb-2 pl-2'>
									{group.category}
								</p>
							)}

							{group.links.map((link, linkIndex) => (
								<Link
									href={link.href}
									key={linkIndex}
									className={`flex items-center py-3 px-3 rounded-lg mb-1 group transition-colors ${
										isActive(link.href)
											? 'bg-blue-600 text-white'
											: 'text-gray-400 hover:bg-[#2a2d35] hover:text-white'
									}`}
								>
									<div
										className={`${
											isActive(link.href)
												? 'text-white'
												: 'text-gray-400 group-hover:text-white'
										}`}
									>
										{link.icon}
									</div>

									{isOpen && <span className='ml-3 truncate'>{link.name}</span>}

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
				<div className='flex items-center text-white space-x-4'>
					<Bell className='w-8 mr-2' />
					<div className={`${isOpen ? 'block' : 'hidden'}`}>
						<Link href='/admin/settings/notification' className='font-bold'>
							Настройки уведомлений
						</Link>
					</div>
				</div>

				{/* Bottom actions */}
				<div className='absolute bottom-0 left-0 right-0 border-t border-[#2a2d35] bg-[#1a1d21]'>
					{isOpen ? (
						<div className='p-4 space-y-3'>
							<button
								onClick={toggleTheme}
								className='flex items-center w-full py-3 px-3 rounded-lg text-gray-400 hover:bg-[#2a2d35] hover:text-white transition-colors'
							>
								<SunMoon size={20} />
								<span className='ml-3'>
									{isDarkMode ? 'Light Mode' : 'Dark Mode'}
								</span>
							</button>

							<button
								onClick={() => setShowHelpPopup(!showHelpPopup)}
								className='flex items-center w-full py-3 px-3 rounded-lg text-gray-400 hover:bg-[#2a2d35] hover:text-white transition-colors relative'
							>
								<HelpCircle size={20} />
								<span className='ml-3'>Help & Support</span>
							</button>

							<button
								onClick={handleLogout}
								className='flex items-center w-full py-3 px-3 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors'
							>
								<LogOut size={20} />
								<span className='ml-3'>Log Out</span>
							</button>
						</div>
					) : (
						<div className='p-4 flex flex-col items-center space-y-6'>
							<button
								onClick={toggleTheme}
								className='p-2 rounded-lg text-gray-400 hover:bg-[#2a2d35] hover:text-white transition-colors'
								title={
									isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'
								}
							>
								<SunMoon size={20} />
							</button>

							<button
								onClick={() => setShowHelpPopup(!showHelpPopup)}
								className='p-2 rounded-lg text-gray-400 hover:bg-[#2a2d35] hover:text-white transition-colors'
								title='Help & Support'
							>
								<HelpCircle size={20} />
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

			{/* Help popup */}
			{showHelpPopup && (
				<div
					ref={helpRef}
					className='fixed bottom-24 left-24 z-50 w-64 bg-[#2a2d35] rounded-lg shadow-xl overflow-hidden border border-[#3a3d45]'
				>
					<div className='p-3 border-b border-[#3a3d45] bg-blue-600/20'>
						<h3 className='font-medium text-white flex items-center gap-2'>
							<HelpCircle size={16} />
							<span>Help & Resources</span>
						</h3>
					</div>

					<div className='p-3'>
						<div className='space-y-1'>
							{quickHelpLinks.map((link, index) => (
								<Link
									key={index}
									href={link.href}
									className='block p-2 text-gray-300 hover:bg-[#353a42] hover:text-white rounded transition-colors'
								>
									{link.title}
								</Link>
							))}
						</div>

						<div className='mt-3 pt-3 border-t border-[#3a3d45]'>
							<button
								onClick={() => router.push('/admin/help')}
								className='w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors text-sm font-medium'
							>
								View Help Center
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Notifications button */}
			<div className='fixed top-5 right-5 z-40'>
				<button
					className='relative rounded-full p-2 bg-[#2a2d35] text-gray-300 hover:text-white transition-colors'
					onClick={() => setShowNotifications(!showNotifications)}
				>
					<Bell size={20} />
					{unreadCount > 0 && (
						<span className='absolute top-0 right-0 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full'>
							{unreadCount}
						</span>
					)}
				</button>

				{/* Notifications panel */}
				{showNotifications && (
					<div
						ref={notificationRef}
						className='absolute top-full right-0 mt-2 w-80 bg-[#2a2d35] rounded-lg shadow-lg overflow-hidden'
					>
						<div className='p-3 border-b border-[#3a3d45] flex justify-between items-center'>
							<h3 className='font-medium text-white'>Notifications</h3>
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
										className={`p-3 border-b border-[#3a3d45] hover:bg-[#343841] transition-colors flex items-start ${
											notification.read ? 'opacity-70' : ''
										}`}
									>
										<div
											className={`w-2 h-2 rounded-full mt-2 mr-2 flex-shrink-0 ${
												notification.read ? 'bg-gray-500' : 'bg-blue-500'
											}`}
										></div>
										<div className='flex-grow'>
											<p className='text-sm text-white'>
												{notification.message}
											</p>
											<p className='text-xs text-gray-400 mt-1'>Just now</p>
										</div>
										<button
											onClick={() => deleteNotification(notification.id)}
											className='text-gray-500 hover:text-gray-300'
										>
											&times;
										</button>
									</div>
								))
							) : (
								<div className='p-4 text-center text-gray-400'>
									<p>No notifications</p>
								</div>
							)}
						</div>

						<div className='p-2 border-t border-[#3a3d45] text-center'>
							<button className='text-xs text-blue-400 hover:text-blue-300'>
								View all
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

export default Sidebar
