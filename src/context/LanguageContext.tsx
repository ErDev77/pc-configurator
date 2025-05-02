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
	t: (key: string, vars?: Record<string, string>) => string
	isRTL: boolean
}

const translations: Record<Language, Record<string, string>> = {
	en: {
		// Homepage
		'home.title': 'Build Your Dream PC',
		'home.subtitle':
			'Choose from our pre-built configurations or customize your own gaming powerhouse',
		'home.exploreConfigs': 'Explore Configurations',
		'home.filters': 'Filters',
		'home.category': 'Category',
		'home.allCategories': 'All Categories',
		'home.priceRange': 'Price Range',
		'home.minPrice': 'Min Price',
		'home.maxPrice': 'Max Price',
		'home.sortBy': 'Sort By',
		'home.nameAZ': 'Name (A-Z)',
		'home.nameZA': 'Name (Z-A)',
		'home.priceLowHigh': 'Price (Low to High)',
		'home.priceHighLow': 'Price (High to Low)',
		'home.ratingHighLow': 'Rating (High to Low)',
		'home.configurations': 'PC Configurations',
		'home.results': 'results',
		'home.hideFilters': 'Hide Filters',
		'home.showFilters': 'Show Filters',
		'home.noResults': 'No configurations found',
		'home.tryAdjusting': 'Try adjusting your filters to see more results',
		'home.reviews': 'reviews',
		'home.customize': 'Customize',

		// Header
		'header.support': 'Support',
		'header.knowledgeBase': 'Knowledge Base / FAQ',
		'header.financing': 'Financing',
		'header.reviews': 'Reviews',
		'nav.gamingDesktops': 'Gaming Desktops',
		'nav.quickshipPCs': 'Quickship PCs',
		'nav.gamingLaptops': 'Gaming Laptops',
		'nav.workstations': 'Workstations',
		'nav.accessories': 'Accessories & Gift Cards',
		'nav.salesPromotions': 'Sales & Promotions',

		// Configuration Page
		'config.customize':
			'Customize your new {name} with component and aesthetic options and build the ultimate gaming PC. System appearance may differ based on configuration.',
		'config.yourConfiguration': 'Your Configuration',
		'config.estimatedShipping': 'Estimated to ship in 3-4 weeks',
		'config.addToCart': 'Add To Cart',
		'config.resetToDefault': 'Reset to Default Configuration',
		'config.selected': 'Selected',
		'config.saving': 'Saving ${amount}',
		'config.save': 'Save ${amount}',
		'config.notCompatible': 'Not compatible with your other components',
		'config.noImageAvailable': 'No image available',

		// Cart
		'cart.addedToCart': 'Configuration added to cart!',
		'cart.title': 'Cart',
		'cart.itemPlural.one': 'item',
		'cart.itemPlural.other': 'items',
		'cart.empty': 'Your cart is empty',
		'cart.emptyDescription':
			"It looks like you haven't added any items to your cart yet.",
		'cart.startShopping': 'Start Shopping',
		'cart.cartItems':
			'Cart ({count} {count, plural, one {item} other {items}})',
		'cart.clearCart': 'Clear Cart',
		'cart.components': 'Components:',
		'cart.quantity': 'Quantity:',
		'cart.edit': 'Edit',
		'cart.remove': 'Remove',
		'cart.continueShopping': 'Continue Shopping',
		'cart.orderSummary': 'Order Summary',
		'cart.subtotal': 'Subtotal',
		'cart.discount': 'Discount ({percentage}%)',
		'cart.shipping': 'Shipping',
		'cart.freeShipping': 'FREE',
		'cart.tax': 'Tax',
		'cart.total': 'Total',
		'cart.promoCode': 'Promo Code',
		'cart.enterCode': 'Enter code',
		'cart.apply': 'Apply',
		'cart.applying': 'Applying...',
		'cart.couponApplied': 'Coupon successfully applied!',
		'cart.checkout': 'Checkout',
		'cart.secureCheckout': 'Secure Checkout',

		// Footer
		'footer.products': 'Products',
		'footer.support': 'Support',
		'footer.resources': 'Resources',
		'footer.followUs': 'Follow Us',
		'footer.newsletter': 'Subscribe to our newsletter',
		'footer.newsletterDescription':
			'Get exclusive email-only offers when you signup!',
		'footer.newsletterConsent':
			'I agree to receiving marketing emails and special deals',
		'footer.copyright':
			'© 2025 MAINGEAR, All rights reserved. Powered by Shopify',

		// Category Management
		'categories.title': 'Category Management',
		'categories.add': 'Add',
		'categories.edit': 'Edit',
		'categories.delete': 'Delete',
		'categories.languages': 'Languages',
		'categories.products': 'products',
		'categories.created': 'Created',
		'categories.search': 'Search categories...',
		'categories.noResults': 'No categories found',
		'categories.noResultsDescription':
			'No categories found matching "{searchTerm}". Try changing your search query.',
		'categories.empty': 'No categories',
		'categories.emptyDescription':
			'Add your first category by clicking the "Add" button',

		// Notifications
		'notification.incompatible':
			'Some components were removed due to incompatibility. The following components were removed from your build:',
		'notification.categoryAdded': 'Category successfully added',
		'notification.categoryUpdated': 'Category successfully updated',
		'notification.categoryDeleted': 'Category successfully deleted',
		'notification.translationsUpdated':
			'Category translations successfully updated',

		// Common
		'common.save': 'Save',
		'common.cancel': 'Cancel',
		'common.loading': 'Loading...',
		'common.error': 'Error',
		'common.success': 'Success',
		'common.confirm': 'Confirm',
		'common.yes': 'Yes',
		'common.no': 'No',
	},
	ru: {
		// Homepage
		'home.title': 'Соберите компьютер своей мечты',
		'home.subtitle':
			'Выберите из готовых конфигураций или настройте свой собственный игровой ПК',
		'home.exploreConfigs': 'Исследовать конфигурации',
		'home.filters': 'Фильтры',
		'home.category': 'Категория',
		'home.allCategories': 'Все категории',
		'home.priceRange': 'Диапазон цен',
		'home.minPrice': 'Мин. цена',
		'home.maxPrice': 'Макс. цена',
		'home.sortBy': 'Сортировать по',
		'home.nameAZ': 'Название (А-Я)',
		'home.nameZA': 'Название (Я-А)',
		'home.priceLowHigh': 'Цена (по возрастанию)',
		'home.priceHighLow': 'Цена (по убыванию)',
		'home.ratingHighLow': 'Рейтинг (по убыванию)',
		'home.configurations': 'Конфигурации ПК',
		'home.results': 'результатов',
		'home.hideFilters': 'Скрыть фильтры',
		'home.showFilters': 'Показать фильтры',
		'home.noResults': 'Конфигурации не найдены',
		'home.tryAdjusting':
			'Попробуйте изменить фильтры, чтобы увидеть больше результатов',
		'home.reviews': 'отзывов',
		'home.customize': 'Настроить',

		// Header
		'header.support': 'Поддержка',
		'header.knowledgeBase': 'База знаний / FAQ',
		'header.financing': 'Финансирование',
		'header.reviews': 'Отзывы',
		'nav.gamingDesktops': 'Игровые ПК',
		'nav.quickshipPCs': 'ПК с быстрой доставкой',
		'nav.gamingLaptops': 'Игровые ноутбуки',
		'nav.workstations': 'Рабочие станции',
		'nav.accessories': 'Аксессуары и подарочные карты',
		'nav.salesPromotions': 'Распродажи и акции',

		// Configuration Page
		'config.customize':
			'Настройте свой новый {name} с компонентами и эстетическими опциями и создайте идеальный игровой ПК. Внешний вид системы может отличаться в зависимости от конфигурации.',
		'config.yourConfiguration': 'Ваша конфигурация',
		'config.estimatedShipping': 'Ориентировочная отправка через 3-4 недели',
		'config.addToCart': 'Добавить в корзину',
		'config.resetToDefault': 'Сбросить к конфигурации по умолчанию',
		'config.selected': 'Выбрано',
		'config.saving': 'Экономия ${amount}',
		'config.save': 'Экономия ${amount}',
		'config.notCompatible': 'Несовместимо с другими компонентами',
		'config.noImageAvailable': 'Изображение недоступно',

		// Cart
		'cart.addedToCart': 'Конфигурация добавлена в корзину!',
		'cart.title': 'Корзина',
		'cart.itemPlural.one': 'товар',
		'cart.itemPlural.few': 'товара',
		'cart.itemPlural.many': 'товаров',
		'cart.empty': 'Ваша корзина пуста',
		'cart.emptyDescription': 'Похоже, вы еще не добавили товары в корзину.',
		'cart.startShopping': 'Начать покупки',
		'cart.cartItems':
			'Корзина ({count} {count, plural, one {товар} few {товара} many {товаров} other {товара}})',
		'cart.clearCart': 'Очистить корзину',
		'cart.components': 'Компоненты:',
		'cart.quantity': 'Количество:',
		'cart.edit': 'Изменить',
		'cart.remove': 'Удалить',
		'cart.continueShopping': 'Продолжить покупки',
		'cart.orderSummary': 'Сводка заказа',
		'cart.subtotal': 'Промежуточный итог',
		'cart.discount': 'Скидка ({percentage}%)',
		'cart.shipping': 'Доставка',
		'cart.freeShipping': 'БЕСПЛАТНО',
		'cart.tax': 'Налог',
		'cart.total': 'Итого',
		'cart.promoCode': 'Промокод',
		'cart.enterCode': 'Введите код',
		'cart.apply': 'Применить',
		'cart.applying': 'Применение...',
		'cart.couponApplied': 'Купон успешно применен!',
		'cart.checkout': 'Оформить заказ',
		'cart.secureCheckout': 'Безопасное оформление',

		// Footer
		'footer.products': 'Продукты',
		'footer.support': 'Поддержка',
		'footer.resources': 'Ресурсы',
		'footer.followUs': 'Следите за нами',
		'footer.newsletter': 'Подпишитесь на нашу рассылку',
		'footer.newsletterDescription':
			'Получайте эксклюзивные предложения только для подписчиков!',
		'footer.newsletterConsent':
			'Я согласен получать маркетинговые письма и специальные предложения',
		'footer.copyright':
			'© 2025 MAINGEAR, Все права защищены. Работает на Shopify',

		// Category Management
		'categories.title': 'Управление категориями',
		'categories.add': 'Добавить',
		'categories.edit': 'Изменить',
		'categories.delete': 'Удалить',
		'categories.languages': 'Языки',
		'categories.products': 'товаров',
		'categories.created': 'Создано',
		'categories.search': 'Поиск категорий...',
		'categories.noResults': 'Категории не найдены',
		'categories.noResultsDescription':
			'По запросу "{searchTerm}" не найдено ни одной категории. Попробуйте изменить поисковый запрос.',
		'categories.empty': 'Нет категорий',
		'categories.emptyDescription':
			'Добавьте вашу первую категорию, нажав на кнопку "Добавить"',

		// Notifications
		'notification.incompatible':
			'Некоторые компоненты были удалены из-за несовместимости. Следующие компоненты были удалены из вашей сборки:',
		'notification.categoryAdded': 'Категория успешно добавлена',
		'notification.categoryUpdated': 'Категория успешно обновлена',
		'notification.categoryDeleted': 'Категория успешно удалена',
		'notification.translationsUpdated': 'Переводы категории успешно обновлены',

		// Common
		'common.save': 'Сохранить',
		'common.cancel': 'Отмена',
		'common.loading': 'Загрузка...',
		'common.error': 'Ошибка',
		'common.success': 'Успех',
		'common.confirm': 'Подтвердить',
		'common.yes': 'Да',
		'common.no': 'Нет',
	},
	am: {
		// Homepage
		'home.title': 'Կառուցեք ձեր երազանքի համակարգիչը',
		'home.subtitle':
			'Ընտրեք մեր նախապատրաստված կազմաձևերից կամ հարմարեցրեք ձեր սեփական խաղային համակարգիչը',
		'home.exploreConfigs': 'Ուսումնասիրել կազմաձևերը',
		'home.filters': 'Զտիչներ',
		'home.category': 'Կատեգորիա',
		'home.allCategories': 'Բոլոր կատեգորիաները',
		'home.priceRange': 'Գնային միջակայք',
		'home.minPrice': 'Նվազագույն գին',
		'home.maxPrice': 'Առավելագույն գին',
		'home.sortBy': 'Դասավորել ըստ',
		'home.nameAZ': 'Անուն (Ա-Ֆ)',
		'home.nameZA': 'Անուն (Ֆ-Ա)',
		'home.priceLowHigh': 'Գին (ցածրից բարձր)',
		'home.priceHighLow': 'Գին (բարձրից ցածր)',
		'home.ratingHighLow': 'Վարկանիշ (բարձրից ցածր)',
		'home.configurations': 'Համակարգչի կազմաձևեր',
		'home.results': 'արդյունքներ',
		'home.hideFilters': 'Թաքցնել զտիչները',
		'home.showFilters': 'Ցույց տալ զտիչները',
		'home.noResults': 'Կազմաձևեր չեն գտնվել',
		'home.tryAdjusting':
			'Փորձեք փոխել զտիչները՝ ավելի շատ արդյունքներ տեսնելու համար',
		'home.reviews': 'կարծիքներ',
		'home.customize': 'Հարմարեցնել',
		
		// Header
		'header.support': 'Աջակցություն',
		'header.knowledgeBase': 'Գիտելիքների բազա / ՀՏՀ',
		'header.financing': 'Ֆինանսավորում',
		'header.reviews': 'Կարծիքներ',
		'nav.gamingDesktops': 'Խաղային համակարգիչներ',
		'nav.quickshipPCs': 'Արագ առաքման համակարգիչներ',
		'nav.gamingLaptops': 'Խաղային նոութբուքեր',
		'nav.workstations': 'Աշխատանքային կայաններ',
		'nav.accessories': 'Աքսեսուարներ և նվեր քարտեր',
		'nav.salesPromotions': 'Վաճառք և խթանումներ',

		// Configuration Page
		'config.customize':
			'Կարգավորեք ձեր նոր {name}-ը բաղադրիչներով և էսթետիկ տարբերակներով և ստեղծեք իդեալական խաղային համակարգիչ: Համակարգի տեսքը կարող է տարբերվել՝ կախված կազմաձևից:',
		'config.yourConfiguration': 'Ձեր կոնֆիգուրացիան',
		'config.estimatedShipping': 'Նախատեսվում է առաքել 3-4 շաբաթվա ընթացքում',
		'config.addToCart': 'Ավելացնել զամբյուղ',
		'config.resetToDefault': 'Վերականգնել լռելյայն կազմաձևը',
		'config.selected': 'Ընտրված',
		'config.saving': 'Խնայում ${amount}',
		'config.save': 'Խնայել ${amount}',
		'config.notCompatible': 'Անհամատեղելի է ձեր մյուս բաղադրիչների հետ',
		'config.noImageAvailable': 'Պատկերը հասանելի չէ',

		// Cart
		'cart.addedToCart': 'Կոնֆիգուրացիան ավելացվել է զամբյուղ!',
		'cart.title': 'Զամբյուղ',
		'cart.itemPlural.one': 'ապրանք',
		'cart.itemPlural.other': 'ապրանք',
		'cart.empty': 'Ձեր զամբյուղը դատարկ է',
		'cart.emptyDescription':
			'Դուք դեռ ոչ մի ապրանք չեք ավելացրել ձեր զամբյուղ:',
		'cart.startShopping': 'Սկսել գնումները',
		'cart.cartItems':
			'Զամբյուղ ({count} {count, plural, one {ապրանք} other {ապրանք}})',
		'cart.clearCart': 'Մաքրել զամբյուղը',
		'cart.components': 'Բաղադրիչներ:',
		'cart.quantity': 'Քանակ:',
		'cart.edit': 'Խմբագրել',
		'cart.remove': 'Հեռացնել',
		'cart.continueShopping': 'Շարունակել գնումները',
		'cart.orderSummary': 'Պատվերի ամփոփում',
		'cart.subtotal': 'Միջանկյալ գումար',
		'cart.discount': 'Զեղչ ({percentage}%)',
		'cart.shipping': 'Առաքում',
		'cart.freeShipping': 'ԱՆՎՃԱՐ',
		'cart.tax': 'Հարկ',
		'cart.total': 'Ընդամենը',
		'cart.promoCode': 'Պրոմո կոդ',
		'cart.enterCode': 'Մուտքագրեք կոդը',
		'cart.apply': 'Կիրառել',
		'cart.applying': 'Կիրառվում է...',
		'cart.couponApplied': 'Կտրոնը հաջողությամբ կիրառվել է!',
		'cart.checkout': 'Վճարել',
		'cart.secureCheckout': 'Անվտանգ վճարում',

		// Footer
		'footer.products': 'Ապրանքներ',
		'footer.support': 'Աջակցություն',
		'footer.resources': 'Ռեսուրսներ',
		'footer.followUs': 'Հետևեք մեզ',
		'footer.newsletter': 'Բաժանորդագրվեք մեր տեղեկագրին',
		'footer.newsletterDescription':
			'Ստացեք էլփոստով բացառիկ առաջարկներ բաժանորդագրվելիս!',
		'footer.newsletterConsent':
			'Համաձայն եմ ստանալ մարքեթինգային նամակներ և հատուկ առաջարկներ',
		'footer.copyright':
			'© 2025 MAINGEAR, Բոլոր իրավունքները պաշտպանված են: Աշխատում է Shopify-ով',

		// Category Management
		'categories.title': 'Կատեգորիաների կառավարում',
		'categories.add': 'Ավելացնել',
		'categories.edit': 'Խմբագրել',
		'categories.delete': 'Ջնջել',
		'categories.languages': 'Լեզուներ',
		'categories.products': 'ապրանքներ',
		'categories.created': 'Ստեղծված',
		'categories.search': 'Որոնել կատեգորիաներ...',
		'categories.noResults': 'Կատեգորիաներ չեն գտնվել',
		'categories.noResultsDescription':
			'"{searchTerm}" հարցումով կատեգորիաներ չեն գտնվել: Փորձեք փոխել որոնման հարցումը:',
		'categories.empty': 'Կատեգորիաներ չկան',
		'categories.emptyDescription':
			'Ավելացրեք ձեր առաջին կատեգորիան՝ սեղմելով "Ավելացնել" կոճակը',

		// Notifications
		'notification.incompatible':
			'Որոշ բաղադրիչներ հեռացվել են անհամատեղելիության պատճառով: Հետևյալ բաղադրիչները հեռացվել են ձեր հավաքածուից.',
		'notification.categoryAdded': 'Կատեգորիան հաջողությամբ ավելացվել է',
		'notification.categoryUpdated': 'Կատեգորիան հաջողությամբ թարմացվել է',
		'notification.categoryDeleted': 'Կատեգորիան հաջողությամբ ջնջվել է',
		'notification.translationsUpdated':
			'Կատեգորիայի թարգմանությունները հաջողությամբ թարմացվել են',

		// Common
		'common.save': 'Պահպանել',
		'common.cancel': 'Չեղարկել',
		'common.loading': 'Բեռնվում է...',
		'common.error': 'Սխալ',
		'common.success': 'Հաջողություն',
		'common.confirm': 'Հաստատել',
		'common.yes': 'Այո',
		'common.no': 'Ոչ',
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

	// Enhanced translation function with variable interpolation
	const t = (key: string, vars?: Record<string, string>): string => {
		let translation = translations[language]?.[key] || key

		// Replace variables in the translation
		if (vars) {
			Object.entries(vars).forEach(([varKey, value]) => {
				translation = translation.replace(new RegExp(`{${varKey}}`, 'g'), value)
			})
		}

		return translation
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
