'use client'

import React from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { Search, ShoppingBag, User } from 'lucide-react'
import Image from 'next/image'
import {
	Facebook,
	Instagram,
	LinkIcon,
	TicketCheckIcon,
	Twitter,
	Youtube,
} from 'lucide-react'
import CartIcon from './CartIcon'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useLanguage } from '@/context/LanguageContext'

function Header() {
	const socialIcons = [
		{ Icon: Facebook },
		{ Icon: Twitter },
		{ Icon: Instagram },
		{ Icon: Youtube },
		{ Icon: TicketCheckIcon },
	]
	const [isLoading, setIsLoading] = useState(false)
	const { language, setLanguage, t } = useLanguage()

	const handleChangeLanguage = (lang: 'en' | 'ru' | 'am') => {
		setIsLoading(true)
		setTimeout(() => {
			setLanguage(lang)
			setIsLoading(false)
		}, 500)
	}

	return (
		<>
			<div className='bg-gray-100 text-gray-700 text-xs py-1.5 px-6 w-full'>
				<div className='flex items-center justify-between max-w-6xl mx-auto w-full'>
					<div className='flex gap-3'>
						<Link href='#' className='hover:text-gray-500'>
							{t('header.support')}
						</Link>
						<Link href='#' className='hover:text-gray-500'>
							{t('header.knowledgeBase')}
						</Link>
						<Link href='#' className='hover:text-gray-500'>
							{t('header.financing')}
						</Link>
						<Link href='#' className='hover:text-gray-500'>
							{t('header.reviews')}
						</Link>
					</div>

					<div className='flex items-center gap-2'>
						{socialIcons.map(({ Icon }, index) => (
							<Icon
								key={index}
								className='text-gray-700 hover:text-gray-500 cursor-pointer h-[14px] w-[14px]'
							/>
						))}

						<LanguageSwitcher
							currentLanguage={language}
							onChange={handleChangeLanguage}
							isLoading={isLoading}
						/>
					</div>
				</div>
			</div>

			<header className='bg-[#222227] text-white py-4 px-6 flex flex-col items-center border-b border-gray-700 w-full'>
				<div className='flex justify-between items-center w-full max-w-6xl'>
					<span className='flex items-center'>
						<Image
							src='https://maingear.com/cdn/shop/files/mg_logo_cyan_wordmark_white.svg?v=1715019749'
							alt='MAINGEAR Logo'
							width={170}
							height={170}
						/>
					</span>
					<div className='flex space-x-4 items-center ml-auto'>
						<Search size={24} className='cursor-pointer hover:text-gray-400' />
						<Link href={'#'}>
							<User size={24} className='cursor-pointer hover:text-gray-400' />
						</Link>
						<div className='relative cursor-pointer'>
							<CartIcon />
						</div>
					</div>
				</div>

				<nav className='w-full max-w-6xl mt-4 flex space-x-6 font-semibold'>
					<Link href='#' className='hover:text-gray-400'>
						{t('nav.gamingDesktops')}
					</Link>
					<Link href='#' className='hover:text-gray-400'>
						{t('nav.quickshipPCs')}
					</Link>
					<Link href='#' className='hover:text-gray-400'>
						{t('nav.gamingLaptops')}
					</Link>
					<Link href='#' className='hover:text-gray-400'>
						{t('nav.workstations')}
					</Link>
					<Link href='#' className='hover:text-gray-400'>
						{t('nav.accessories')}
					</Link>
					<Link href='#' className='text-blue-400 hover:text-blue-300'>
						{t('nav.salesPromotions')}
					</Link>
				</nav>
			</header>
		</>
	)
}

export default Header
