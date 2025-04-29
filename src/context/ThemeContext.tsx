'use client'

import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	ReactNode,
} from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextType {
	theme: Theme
	toggleTheme: () => void
	setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
	// Initialize with dark theme, but we'll check localStorage on mount
	const [theme, setTheme] = useState<Theme>('dark')

	// Load theme preference from localStorage when component mounts
	useEffect(() => {
		const savedTheme = localStorage.getItem('theme') as Theme | null
		// If a theme was saved, use it; otherwise default to dark
		if (savedTheme) {
			setTheme(savedTheme)
			applyTheme(savedTheme)
		} else {
			applyTheme('dark')
		}
	}, [])

	// Apply the theme to the document
	const applyTheme = (newTheme: Theme) => {
		const root = document.documentElement
		if (newTheme === 'dark') {
			root.classList.add('dark')
			root.style.setProperty('--bg-primary', '#171C1F')
			root.style.setProperty('--bg-secondary', '#202529')
			root.style.setProperty('--bg-tertiary', '#2A2F35')
			root.style.setProperty('--text-primary', '#FFFFFF')
			root.style.setProperty('--text-secondary', '#A0AEC0')
			root.style.setProperty('--border-color', '#2D3748')
		} else {
			root.classList.remove('dark')
			root.style.setProperty('--bg-primary', '#F7FAFC')
			root.style.setProperty('--bg-secondary', '#FFFFFF')
			root.style.setProperty('--bg-tertiary', '#EDF2F7')
			root.style.setProperty('--text-primary', '#1A202C')
			root.style.setProperty('--text-secondary', '#4A5568')
			root.style.setProperty('--border-color', '#E2E8F0')
		}
	}

	// Function to toggle theme
	const toggleTheme = () => {
		const newTheme = theme === 'dark' ? 'light' : 'dark'
		setTheme(newTheme)
		applyTheme(newTheme)
		localStorage.setItem('theme', newTheme)
	}

	// Function to set theme directly
	const setThemeValue = (newTheme: Theme) => {
		setTheme(newTheme)
		applyTheme(newTheme)
		localStorage.setItem('theme', newTheme)
	}

	return (
		<ThemeContext.Provider
			value={{ theme, toggleTheme, setTheme: setThemeValue }}
		>
			{children}
		</ThemeContext.Provider>
	)
}

export function useTheme() {
	const context = useContext(ThemeContext)
	if (context === undefined) {
		throw new Error('useTheme must be used within a ThemeProvider')
	}
	return context
}
