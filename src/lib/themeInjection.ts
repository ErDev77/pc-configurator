// src/lib/themeInjection.ts
export function injectThemeClasses() {
	// Get current theme
	const theme = localStorage.getItem('theme') || 'dark'

	// Select all admin background containers
	const backgroundElements = document.querySelectorAll(
		'.bg-\\[\\#171C1F\\], .bg-\\[\\#14181B\\], .bg-gradient-to-b'
	)
	backgroundElements.forEach(el => {
		el.classList.add('admin-bg-primary')
	})

	// Select card/panel elements
	const cardElements = document.querySelectorAll(
		'.bg-\\[\\#202529\\], .bg-\\[\\#222227\\], .bg-\\[\\#2E2E35\\]'
	)
	cardElements.forEach(el => {
		el.classList.add('admin-bg-secondary')
	})

	// Select headings and text elements
	const textElements = document.querySelectorAll('h1, h2, h3, h4, p')
	textElements.forEach(el => {
		if (el.classList.contains('text-white')) {
			el.classList.add('admin-text-primary')
		} else if (el.classList.contains('text-gray-400')) {
			el.classList.add('admin-text-secondary')
		}
	})
}
