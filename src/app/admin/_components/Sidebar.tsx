'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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
} from 'lucide-react'
import { useRouter } from 'next/navigation'
type User = {
	email?: string
}

const Sidebar = () => {
	const { user, loading, logout } = useAuth()
	const [isOpen, setIsOpen] = useState(false)
	const router = useRouter()

useEffect(() => {
	if (!loading && user === null) {
		router.push('/admin/login')
	}
}, [user, loading])

const handleLogout = async () => {
	await logout()
}


	return (
		<div className='relative'>
			<div
				className={`fixed top-0 left-0 h-full transition-all duration-300 ease-in-out ${
					isOpen ? 'w-64' : 'w-16'
				} bg-[#202529] p-4 border-r-2 border-gray-700`} // Добавлен бордер для закрытого состояния
				onMouseEnter={() => setIsOpen(true)} // Открытие при наведении
				onMouseLeave={() => setIsOpen(false)} // Закрытие при убирании мыши
			>
				<div className='text-white mb-4 flex flex-col items-center'>
					{/* Иконка сверху */}

					<CircleUserRound size={24} className='mb-2' />
					{/* Показываем текст, если панель открыта */}
					<div className={`${isOpen ? 'block' : 'hidden'}`}>
						{user && user.email ? (
							<p className='font-bold'>{user.email}</p>
						) : (
							<p>Нет данных пользователя</p>
						)}
					</div>
				</div>

				{/* Навигация */}
				<nav className='mt-10 space-y-8'>
					<div className='flex items-center text-white space-x-4'>
						<Home className='w-8 mr-2' />
						<div className={`${isOpen ? 'block' : 'hidden'}`}>
							<Link href='/admin/dashboard' className='font-bold'>
								Главная
							</Link>
						</div>
					</div>
					{/* Добавить комплектующее */}
					<div className='flex items-center text-white space-x-4'>
						{' '}
						{/* space-x-4 для расстояния между иконками */}
						<Cpu />
						{/* Показываем текст, если панель открыта */}
						<div className={`${isOpen ? 'block' : 'hidden'}`}>
							<Link href='/admin/add-component' className='font-bold'>
								Добавить комплектующее
							</Link>
						</div>
					</div>
					<div className='flex items-center text-white space-x-4'>
						{' '}
						{/* space-x-4 для расстояния между иконками */}
						<PcCase />
						{/* Показываем текст, если панель открыта */}
						<div className={`${isOpen ? 'block' : 'hidden'}`}>
							<Link href='/admin/add-config' className='font-bold'>
								Добавить конфигурацию
							</Link>
						</div>
					</div>
					<div className='flex items-center text-white space-x-4'>
						<Box className='w-8 mr-2' />
						<div className={`${isOpen ? 'block' : 'hidden'}`}>
							<Link href='/admin/config-list' className='font-bold'>
								Посмотреть конфигурации
							</Link>
						</div>
					</div>

					{/* Переключить тему */}
					<div className='flex items-center text-white space-x-4'>
						<SunMoon className='mr-2' />
						{/* Показываем текст, если панель открыта */}
						<div className={`${isOpen ? 'block' : 'hidden'}`}>
							<button className='font-bold'>Переключить тему</button>
						</div>
					</div>

					{/* Выйти */}
					<div className='flex items-center text-red-400 space-x-4'>
						<LogOut className='mr-2' />
						{/* Показываем текст, если панель открыта */}
						<div className={`${isOpen ? 'block' : 'hidden'}`}>
							<button onClick={handleLogout} className='font-bold'>
								Выйти
							</button>
						</div>
					</div>
				</nav>
			</div>
		</div>
	)
}

export default Sidebar
