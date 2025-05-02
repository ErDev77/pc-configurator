'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Language } from '@/context/LanguageContext'
import { ChevronDown, Globe, Loader2 } from 'lucide-react'

interface LanguageSwitcherProps {
	currentLanguage: Language
	onChange: (language: Language) => void
	isLoading?: boolean
}

interface LanguageOption {
	code: Language
	name: string
	flag: string
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
	currentLanguage,
	onChange,
	isLoading = false,
}) => {
	const [isOpen, setIsOpen] = useState(false)
	const dropdownRef = useRef<HTMLDivElement>(null)

	const languages: LanguageOption[] = [
		{ code: 'en', name: 'English', flag: '🇺🇸' },
		{ code: 'ru', name: 'Русский', flag: '🇷🇺' },
		{ code: 'am', name: 'Հայերեն', flag: '🇦🇲' },
	]

	const currentLanguageOption =
		languages.find(lang => lang.code === currentLanguage) || languages[0]

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [])

	const handleSelect = (language: Language) => {
		onChange(language)
		setIsOpen(false)
	}

	return (
		<div className='relative' ref={dropdownRef}>
			<button
				onClick={() => setIsOpen(!isOpen)}
				className='flex items-center gap-1 text-gray-800 hover:text-gray-600 px-2 py-1 rounded-md transition-colors'
				disabled={isLoading}
			>
				{isLoading ? (
					<Loader2 className='h-4 w-4 animate-spin' />
				) : (
					<>
						<Globe className='h-4 w-4' />
						<span>{currentLanguageOption.flag}</span>
						<ChevronDown
							className={`h-3 w-3 transition-transform ${
								isOpen ? 'rotate-180' : ''
							}`}
						/>
					</>
				)}
			</button>

			{isOpen && (
				<div className='absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg overflow-hidden z-50 border border-gray-200'>
					<div className='py-1'>
						{languages.map(language => (
							<button
								key={language.code}
								onClick={() => handleSelect(language.code)}
								className={`flex items-center gap-2 w-full text-left px-4 py-2 text-sm ${
									currentLanguage === language.code
										? 'bg-blue-50 text-blue-600'
										: 'text-gray-700 hover:bg-gray-100'
								}`}
							>
								<span>{language.flag}</span>
								<span>{language.name}</span>
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	)
}
