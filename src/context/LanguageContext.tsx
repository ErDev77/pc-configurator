'use client'

import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from 'react'

export type Language = 'en' | 'ru' | 'am'

interface LanguageContextType {
	language: Language
	setLanguage: (language: Language) => void
	t: (key: string, fallback?: string) => string
	isRTL: boolean
}

const translations: Record<string, Record<string, string>> = {
	en: {
		'nav.home': 'Home',
		'nav.products': 'Products',
		'nav.configurations': 'Configurations',
		'product.price': 'Price',
		'product.specs': 'Specifications',
		'common.save': 'Save',
		'common.cancel': 'Cancel',
		// Add more translations as needed
	},
	ru: {
		'nav.home': 'Главная',
		'nav.products': 'Продукты',
		'nav.configurations': 'Конфигурации',
		'product.price': 'Цена',
		'product.specs': 'Спецификации',
		'common.save': 'Сохранить',
		'common.cancel': 'Отмена',
		// Add more translations as needed
	},
	am: {
		'nav.home': 'Տուն',
		'nav.products': 'Ապրանքներ',
		'nav.configurations': 'Կարգավորումներ',
		'product.price': 'Գին',
		'product.specs': 'Բնութագրեր',
		'common.save': 'Պահպանել',
		'common.cancel': 'Չեղարկել',
		// Add more translations as needed
	},
}

const LanguageContext = createContext<LanguageContextType | undefined>(
	undefined
)

export function LanguageProvider({ children }: { children: ReactNode }) {
	const [language, setLanguageState] = useState<Language>('en')
	const [isRTL, setIsRTL] = useState(false)

	useEffect(() => {
		// Load language preference from localStorage when component mounts
		const savedLanguage = localStorage.getItem('language') as Language
		if (savedLanguage && ['en', 'ru', 'am'].includes(savedLanguage)) {
			setLanguageState(savedLanguage)
		} else {
			// Try to detect browser language
			const browserLang = navigator.language.split('-')[0] as Language
			if (['en', 'ru', 'am'].includes(browserLang)) {
				setLanguageState(browserLang)
			}
		}
	}, [])

	useEffect(() => {
		// Update HTML lang attribute and RTL direction when language changes
		if (language) {
			document.documentElement.lang = language
			localStorage.setItem('language', language)

			// Armenian isn't RTL, but if you add languages like Arabic or Hebrew in the future
			const rtlLanguages: Language[] = []
			setIsRTL(rtlLanguages.includes(language))

			if (rtlLanguages.includes(language)) {
				document.documentElement.dir = 'rtl'
			} else {
				document.documentElement.dir = 'ltr'
			}
		}
	}, [language])

	const setLanguage = (newLanguage: Language) => {
		setLanguageState(newLanguage)
	}

	// Translation function
	const t = (key: string, fallback?: string): string => {
		return translations[language]?.[key] || fallback || key
	}

	return (
		<LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
			{children}
		</LanguageContext.Provider>
	)
}

export function useLanguage(): LanguageContextType {
	const context = useContext(LanguageContext)
	if (context === undefined) {
		throw new Error('useLanguage must be used within a LanguageProvider')
	}
	return context
}
