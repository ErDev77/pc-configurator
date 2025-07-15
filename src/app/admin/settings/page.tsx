'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Sidebar from '../_components/Sidebar'
import { useTheme } from '@/context/ThemeContext'

import {
	User,
	Lock,
	Bell,
	Globe,
	Shield,
	Database,
	Save,
	FileJson,
	Palette,
	LifeBuoy,
	AlertCircle,
	Clock,
	RefreshCw,
	HardDrive,
    ShoppingCart,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { SecuritySettings } from './_components/SecuritySettings'
import { useNotifications } from '@/context/NotificationContext'

interface SettingsSection {
	id: string
	title: string
	icon: React.ReactNode
	description: string
}

interface BackupSchedule {
	frequency: string
	lastBackup: string
	nextBackup: string
	status: string
}

interface NotificationSettings {
	email: boolean
	telegram: boolean
}

export default function SettingsPage() {
	const { user } = useAuth()
	const router = useRouter()
  	const { theme, setTheme } = useTheme()
	const { browserNotificationsEnabled, setBrowserNotificationsEnabled } =
		useNotifications()

	// Settings states
	const [activeSection, setActiveSection] = useState('account')
	const [isDarkMode, setIsDarkMode] = useState(true)
	const [language, setLanguage] = useState('en')
	const [emailNotifications, setEmailNotifications] = useState(true)
	const [browserNotifications, setBrowserNotifications] = useState(false)
	const [orderNotifications, setOrderNotifications] = useState(true)
	const [stockNotifications, setStockNotifications] = useState(true)
	const [saving, setSaving] = useState(false)
	const [apiKey, setApiKey] = useState('sk_test_Kd*************')
	const [backups, setBackups] = useState<BackupSchedule>({
		frequency: 'daily',
		lastBackup: '2025-04-26T08:30:00Z',
		nextBackup: '2025-04-27T08:30:00Z',
		status: 'success',
	})
	const [notificationSettings, setNotificationSettings] =
		useState<NotificationSettings>({
			email: true,
			telegram: true,
		})
		 const [isLoading, setIsLoading] = useState(true)
			const [isSaving, setIsSaving] = useState(false)

			  useEffect(() => {
					// Fetch current settings from API
					const fetchSettings = async () => {
						try {
							const response = await fetch('/api/admin/settings')
							if (response.ok) {
								const data = await response.json()
								setNotificationSettings({
									email: data.notifications?.email ?? true,
									telegram: data.notifications?.telegram ?? true,
								})
							}
						} catch (error) {
							console.error('Error fetching settings:', error)
							toast.error('Failed to load settings')
						} finally {
							setIsLoading(false)
						}
					}

					fetchSettings()
				}, [])

				// Removed duplicate handleSaveSettings function to resolve redeclaration error
	const [systemInfo, setSystemInfo] = useState({
		version: '1.2.3',
		nodeVersion: '16.14.0',
		dbVersion: 'PostgreSQL 14.2',
		uptime: '12 days, 5 hours',
		lastRestart: '2025-04-15T03:15:22Z',
		environment: 'production',
		storageUsedPercent: 0,
		storageUsed: '0',
		storageLimit: '0',
		memoryUsage: 0,
	})

	// Account settings fields
	const [accountSettings, setAccountSettings] = useState({
		name: user?.name || 'Admin User',
		email: user?.email || 'admin@example.com',
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
	})

	// Store settings
	const [storeSettings, setStoreSettings] = useState({
		storeName: 'PC Hub Store',
		storeEmail: 'support@pchub.com',
		storeCurrency: 'USD',
		storeCountry: 'US',
		taxRate: 7.5,
		orderPrefix: 'PC-',
		logo: '/logo.png',
	})

	 useEffect(() => {
			const fetchSystemInfo = async () => {
				try {
					const res = await fetch('/api/usage')
					const data = await res.json()
					setSystemInfo(prev => ({
						...prev,
						storageUsedPercent: data.storage.percent,
						storageUsed: data.storage.used,
						storageLimit: data.storage.limit,
						memoryUsage: data.memoryUsage,
					}))
				} catch (error) {
					console.error('Failed to fetch system info', error)
				}
			}

			fetchSystemInfo()
		}, [])
	// List of settings sections
	const sections: SettingsSection[] = [
		{
			id: 'account',
			title: 'Настройки учетной записи',
			icon: <User size={20} />,
			description: 'Управляйте информацией учетной записи',
		},
		{
			id: 'notifications',
			title: 'Уведомления',
			icon: <Bell size={20} />,
			description: 'Настройте уведомления',
		},
		{
			id: 'appearance',
			title: 'Внешний вид',
			icon: <Palette size={20} />,
			description: 'Настройте внешний вид',
		},
		{
			id: 'store',
			title: 'Настройки магазина',
			icon: <Globe size={20} />,
			description: 'Настройте глобальные параметры магазина',
		},
		{
			id: 'security',
			title: 'Безопасность',
			icon: <Shield size={20} />,
			description: 'Управляйте параметрами безопасности',
		},
		{
			id: 'system',
			title: 'Система',
			icon: <Database size={20} />,
			description: 'Просмотр информации о системе',
		},
	]
	useEffect(() => {
		const fetchSettings = async () => {
			try {
				const response = await fetch('/api/admin/settings')
				if (response.ok) {
					const data = await response.json()
					setNotificationSettings({
						email: data.notifications?.email ?? true,
						telegram: data.notifications?.telegram ?? true,
					})
				}
			} catch (error) {
				console.error('Error fetching settings:', error)
				toast.error('Failed to load settings')
			} finally {
				setIsLoading(false)
			}
		}

		fetchSettings()
	}, [])

	 const handleSaveSettings = async () => {
			setIsSaving(true)
			try {
				// Save browser notification setting to localStorage through our context
				// This will automatically update the notification display in the sidebar

				// Save email and telegram notification settings to API
				const response = await fetch('/api/admin/settings', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						notifications: notificationSettings,
						appearance: {
							theme,
							language,
						},
					}),
				})

				if (response.ok) {
					// Request permission for browser notifications if they're enabled
					if (browserNotificationsEnabled && 'Notification' in window) {
						if (
							Notification.permission !== 'granted' &&
							Notification.permission !== 'denied'
						) {
							const permission = await Notification.requestPermission()
							if (permission !== 'granted') {
								toast.warning(
									'Browser notifications require permission to work properly.'
								)
							}
						}
					}

					toast.success('Settings saved successfully')
				} else {
					toast.error('Failed to save settings')
				}
			} catch (error) {
				console.error('Error saving settings:', error)
				toast.error('Failed to save settings')
			} finally {
				setIsSaving(false)
			}
		}

	

	const handleBackupNow = () => {
		toast.info('Backup started. This may take a few minutes.')

		// Simulate backup process
		setTimeout(() => {
			setBackups({
				...backups,
				lastBackup: new Date().toISOString(),
				nextBackup: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
			})
			toast.success('Backup completed successfully!')
		}, 3000)
	}

	const regenerateApiKey = () => {
		const newKey = 'sk_test_' + Math.random().toString(36).substring(2, 15)
		setApiKey(newKey)
		toast.success('API key regenerated successfully!')
	}

	if (isLoading) {
		return (
			<div className='flex min-h-screen bg-[#171C1F]'>
				<div className='flex-1 p-8 ml-16'>
					<div className='flex items-center justify-center h-full'>
						<div className='animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500'></div>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className='flex bg-[#171C1F] min-h-screen'>
			<Sidebar />
			<div className='flex-1 p-6 ml-20 overflow-auto'>
				<ToastContainer />

				<div className='flex justify-between items-center mb-8'>
					<div>
						<h1 className='text-3xl font-bold text-white'>Настройки</h1>
						<p className='text-gray-400'>
							Управление вашей учетной записью и системными предпочтениями
						</p>
					</div>
					<button
						onClick={handleSaveSettings}
						disabled={saving}
						className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
							saving
								? 'bg-blue-700 opacity-75 cursor-not-allowed'
								: 'bg-blue-600 hover:bg-blue-700'
						} text-white transition-colors`}
					>
						{saving ? (
							<RefreshCw className='animate-spin' size={18} />
						) : (
							<Save size={18} />
						)}
						<span>{saving ? 'Сохранение...' : 'Сохранить изменения'}</span>
					</button>
				</div>

				<div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
					{/* Settings Navigation */}
					<div className='bg-[#202529] rounded-xl shadow-lg overflow-hidden'>
						<nav className='p-1'>
							{sections.map(section => (
								<button
									key={section.id}
									onClick={() => setActiveSection(section.id)}
									className={`w-full flex items-center gap-3 p-3 rounded-lg text-left mb-1 transition-colors ${
										activeSection === section.id
											? 'bg-blue-600 text-white'
											: 'text-gray-300 hover:bg-[#2a2f35] hover:text-white'
									}`}
								>
									<div className='flex-shrink-0'>{section.icon}</div>
									<div>
										<p className='font-medium'>{section.title}</p>
										<p className='text-xs opacity-80 truncate'>
											{section.description}
										</p>
									</div>
								</button>
							))}
						</nav>
					</div>

					{/* Settings Content */}
					<div className='lg:col-span-3 bg-[#202529] rounded-xl shadow-lg overflow-hidden p-6'>
						{/* Account Settings */}
						{activeSection === 'account' && (
							<div className='space-y-8'>
								<div className='pb-5 border-b border-gray-700'>
									<h2 className='text-xl font-bold text-white mb-1'>
										Настройки учетной записи
									</h2>
									<p className='text-gray-400 text-sm'>
										Управление вашей личной информацией и безопасностью учетной
										записи
									</p>
								</div>

								<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
									<div>
										<label className='block text-sm font-medium text-gray-300 mb-2'>
											Полное имя
										</label>
										<input
											type='text'
											value={accountSettings.name}
											onChange={e =>
												setAccountSettings({
													...accountSettings,
													name: e.target.value,
												})
											}
											className='w-full bg-[#2a2f35] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
										/>
									</div>

									<div>
										<label className='block text-sm font-medium text-gray-300 mb-2'>
											Электронная почта
										</label>
										<input
											type='email'
											value={accountSettings.email}
											onChange={e =>
												setAccountSettings({
													...accountSettings,
													email: e.target.value,
												})
											}
											className='w-full bg-[#2a2f35] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
										/>
									</div>
								</div>
							</div>
						)}

						{/* Notification Settings */}
						{activeSection === 'notifications' && (
							<div className='space-y-8'>
								<div className='pb-5 border-b border-gray-700'>
									<h2 className='text-xl font-bold text-white mb-1'>
										Настройки уведомлений
									</h2>
									<p className='text-gray-400 text-sm'>
										Управление тем, когда и как вы получаете уведомления
									</p>
								</div>

								<div>
									<h3 className='text-lg font-medium text-white mb-4'>
										Каналы уведомлений
									</h3>

									<div className='space-y-4'>
										<div className='flex items-center justify-between p-4 bg-[#2a2f35] rounded-lg'>
											<div className='flex items-center gap-3'>
												<div className='p-2 bg-blue-600/20 rounded-full'>
													<Bell size={18} className='text-blue-400' />
												</div>
												<div>
													<p className='font-medium text-white'>
														Уведомления по электронной почте
													</p>
													<p className='text-sm text-gray-400'>
														Получать уведомления по электронной почте
													</p>
												</div>
											</div>
											<label className='relative inline-flex items-center cursor-pointer'>
												<input
													type='checkbox'
													checked={notificationSettings.email}
													onChange={() =>
														setNotificationSettings(prev => ({
															...prev,
															email: !prev.email,
														}))
													}
													className='sr-only peer'
												/>
												<div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
											</label>
										</div>

										<div className='flex items-center justify-between p-4 bg-[#2a2f35] rounded-lg'>
											<div className='flex items-center gap-3'>
												<div className='p-2 bg-blue-600/20 rounded-full'>
													<Bell size={18} className='text-blue-400' />
												</div>
												<div>
													<p className='font-medium text-white'>
														Уведомления Telegram
													</p>
													<p className='text-sm text-gray-400'>
														Получать уведомления через Telegram
													</p>
												</div>
											</div>
											<label className='relative inline-flex items-center cursor-pointer'>
												<input
													type='checkbox'
													checked={notificationSettings.telegram}
													onChange={() =>
														setNotificationSettings(prev => ({
															...prev,
															telegram: !prev.telegram,
														}))
													}
													className='sr-only peer'
												/>
												<div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
											</label>
										</div>

										<div className='flex items-center justify-between p-4 bg-[#2a2f35] rounded-lg'>
											<div className='flex items-center gap-3'>
												<div className='p-2 bg-blue-600/20 rounded-full'>
													<Bell size={18} className='text-blue-400' />
												</div>
												<div>
													<p className='font-medium text-white'>
														Уведомления в браузере
													</p>
													<p className='text-sm text-gray-400'>
														Получать уведомления в браузере
													</p>
												</div>
											</div>
											<label className='relative inline-flex items-center cursor-pointer'>
												<input
													type='checkbox'
													checked={browserNotificationsEnabled}
													onChange={() =>
														setBrowserNotificationsEnabled(
															!browserNotificationsEnabled
														)
													}
													className='sr-only peer'
												/>
												<div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
											</label>
										</div>
									</div>
								</div>

								<div className='pt-4 border-t border-gray-700'>
									<h3 className='text-lg font-medium text-white mb-4'>
										Типы уведомлений
									</h3>

									<div className='space-y-4'>
										<div className='flex items-center justify-between p-4 bg-[#2a2f35] rounded-lg'>
											<div className='flex items-center gap-3'>
												<div className='p-2 bg-green-600/20 rounded-full'>
													<ShoppingCart size={18} className='text-green-400' />
												</div>
												<div>
													<p className='font-medium text-white'>
														Уведомления о заказах
													</p>
													<p className='text-sm text-gray-400'>
														Уведомлять о новых заказах и изменениях статуса
													</p>
												</div>
											</div>
											<label className='relative inline-flex items-center cursor-pointer'>
												<input
													type='checkbox'
													checked={orderNotifications}
													onChange={() =>
														setOrderNotifications(!orderNotifications)
													}
													className='sr-only peer'
												/>
												<div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
											</label>
										</div>

										<div className='flex items-center justify-between p-4 bg-[#2a2f35] rounded-lg'>
											<div className='flex items-center gap-3'>
												<div className='p-2 bg-yellow-600/20 rounded-full'>
													<AlertCircle size={18} className='text-yellow-400' />
												</div>
												<div>
													<p className='font-medium text-white'>
														Уведомления о запасах
													</p>
													<p className='text-sm text-gray-400'>
														Уведомлять о низком уровне запасов
													</p>
												</div>
											</div>
											<label className='relative inline-flex items-center cursor-pointer'>
												<input
													type='checkbox'
													checked={stockNotifications}
													onChange={() =>
														setStockNotifications(!stockNotifications)
													}
													className='sr-only peer'
												/>
												<div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
											</label>
										</div>
									</div>
								</div>

								{/* Browser notification permission section */}
								{browserNotificationsEnabled && (
									<div className='pt-4 border-t border-gray-700'>
										<h3 className='text-lg font-medium text-white mb-4'>
											Разрешения на уведомления в браузере
										</h3>

										<div className='p-4 bg-[#2a2f35] rounded-lg'>
											<div className='flex items-start gap-3'>
												<div className='p-2 bg-blue-600/20 rounded-full flex-shrink-0 mt-1'>
													<Bell size={18} className='text-blue-400' />
												</div>
												<div>
													<p className='font-medium text-white mb-2'>
														Разрешить уведомления в браузере
													</p>
													<p className='text-sm text-gray-400 mb-4'>
														Чтобы получать уведомления в реальном времени в
														вашем браузере, вам необходимо предоставить
														разрешение.
													</p>

													<button
														onClick={() => {
															if (!('Notification' in window)) {
																toast.error(
																	'Your browser does not support notifications'
																)
															} else if (
																Notification.permission === 'granted'
															) {
																toast.success(
																	'Notification permission already granted'
																)
															} else if (Notification.permission !== 'denied') {
																Notification.requestPermission().then(
																	permission => {
																		if (permission === 'granted') {
																			toast.success(
																				'Notification permission granted!'
																			)
																			// Show a test notification
																			new Notification(
																				'Notifications enabled!',
																				{
																					body: 'You will now receive browser notifications',
																					icon: '/favicon.ico',
																				}
																			)
																		} else {
																			toast.error(
																				'Notification permission denied'
																			)
																			setBrowserNotificationsEnabled(false)
																		}
																	}
																)
															} else {
																toast.error(
																	'Notification permission was denied. Please update your browser settings.'
																)
															}
														}}
														className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2'
													>
														<Bell size={16} />
														<span>Request Permission</span>
													</button>
												</div>
											</div>
										</div>
									</div>
								)}
							</div>
						)}

						{/* Appearance Settings */}
						{activeSection === 'appearance' && (
							<div className='space-y-8'>
								<div className='pb-5 border-b border-[color:var(--border-color)]'>
									<h2 className='text-xl font-bold text-[color:var(--text-primary)] mb-1'>
										Настройки внешнего вида
									</h2>
									<p className='text-[color:var(--text-secondary)] text-sm'>
										Настройте внешний вид панели администратора
									</p>
								</div>

								<div>
									<h3 className='text-lg font-medium text-[color:var(--text-primary)] mb-4'>
										Темы
									</h3>

									<div className='flex gap-4'>
										<div
											className={`p-4 bg-[color:var(--bg-tertiary)] rounded-lg border-2 ${
												theme === 'dark'
													? 'border-blue-500'
													: 'border-transparent'
											} cursor-pointer transition-all hover:opacity-90`}
											onClick={() => setTheme('dark')}
										>
											<div className='h-32 bg-[#171C1F] rounded-md mb-4 p-3'>
												<div className='w-1/4 h-full bg-[#202529] rounded'></div>
											</div>
											<div className='flex items-center gap-2'>
												<div
													className={`w-4 h-4 rounded-full border ${
														theme === 'dark'
															? 'bg-blue-500 border-blue-500'
															: 'border-gray-500'
													}`}
												></div>
												<span className='text-[color:var(--text-primary)]'>
													Темная тема
												</span>
											</div>
										</div>

										<div
											className={`p-4 bg-[color:var(--bg-tertiary)] rounded-lg border-2 ${
												theme === 'light'
													? 'border-blue-500'
													: 'border-transparent'
											} cursor-pointer transition-all hover:opacity-90`}
											onClick={() => setTheme('light')}
										>
											<div className='h-32 bg-gray-100 rounded-md mb-4 p-3'>
												<div className='w-1/4 h-full bg-white rounded border border-gray-300'></div>
											</div>
											<div className='flex items-center gap-2'>
												<div
													className={`w-4 h-4 rounded-full border ${
														theme === 'light'
															? 'bg-blue-500 border-blue-500'
															: 'border-gray-500'
													}`}
												></div>
												<span className='text-[color:var(--text-primary)]'>
													Светлая тема
												</span>
											</div>
										</div>
									</div>
								</div>

								<div className='pt-4 border-t border-[color:var(--border-color)]'>
									<h3 className='text-lg font-medium text-[color:var(--text-primary)] mb-4'>
										Язык
									</h3>

									<div className='max-w-md'>
										<select
											value={language}
											onChange={e => setLanguage(e.target.value)}
											className='w-full bg-[color:var(--bg-tertiary)] border border-[color:var(--border-color)] rounded-lg px-4 py-2 text-[color:var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500'
										>
											<option value='en'>English</option>
											<option value='ru'>Русский</option>
											<option value='am'>Հայերեն</option>
											<option value='es'>Español</option>
											<option value='fr'>Français</option>
											<option value='de'>Deutsch</option>
										</select>
									</div>
								</div>
							</div>
						)}

						{/* Store Settings */}
						{activeSection === 'store' && (
							<div className='space-y-8'>
								<div className='pb-5 border-b border-gray-700'>
									<h2 className='text-xl font-bold text-white mb-1'>
										Настройки магазина
									</h2>
									<p className='text-gray-400 text-sm'>
										Настройте свой интернет-магазин
									</p>
								</div>

								<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
									<div>
										<label className='block text-sm font-medium text-gray-300 mb-2'>
											Название магазина
										</label>
										<input
											type='text'
											value={storeSettings.storeName}
											onChange={e =>
												setStoreSettings({
													...storeSettings,
													storeName: e.target.value,
												})
											}
											className='w-full bg-[#2a2f35] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
										/>
									</div>

									<div>
										<label className='block text-sm font-medium text-gray-300 mb-2'>
											Email магазина
										</label>
										<input
											type='email'
											value={storeSettings.storeEmail}
											onChange={e =>
												setStoreSettings({
													...storeSettings,
													storeEmail: e.target.value,
												})
											}
											className='w-full bg-[#2a2f35] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
										/>
									</div>

									<div>
										<label className='block text-sm font-medium text-gray-300 mb-2'>
											Валюта
										</label>
										<select
											value={storeSettings.storeCurrency}
											onChange={e =>
												setStoreSettings({
													...storeSettings,
													storeCurrency: e.target.value,
												})
											}
											className='w-full bg-[#2a2f35] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
										>
											<option value='USD'>USD - Доллар США</option>
											<option value='EUR'>EUR - Евро</option>
											<option value='GBP'>GBP - Британский фунт</option>
											<option value='CAD'>CAD - Канадский доллар</option>
											<option value='AUD'>AUD - Австралийский доллар</option>
										</select>
									</div>

									<div>
										<label className='block text-sm font-medium text-gray-300 mb-2'>
											Налоговая ставка (%)
										</label>
										<input
											type='number'
											step='0.1'
											min='0'
											max='100'
											value={storeSettings.taxRate}
											onChange={e =>
												setStoreSettings({
													...storeSettings,
													taxRate: parseFloat(e.target.value),
												})
											}
											className='w-full bg-[#2a2f35] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
										/>
									</div>

									<div>
										<label className='block text-sm font-medium text-gray-300 mb-2'>
											Префикс номера заказа
										</label>
										<input
											type='text'
											value={storeSettings.orderPrefix}
											onChange={e =>
												setStoreSettings({
													...storeSettings,
													orderPrefix: e.target.value,
												})
											}
											className='w-full bg-[#2a2f35] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
										/>
									</div>
								</div>
							</div>
						)}

						{/* Security Settings */}
						{activeSection === 'security' && <SecuritySettings />}

						{/* System Settings */}
						{activeSection === 'system' && (
							<div className='space-y-8'>
								<div className='pb-5 border-b border-gray-700'>
									<h2 className='text-xl font-bold text-white mb-1'>
										Информация о системе
									</h2>
									<p className='text-gray-400 text-sm'>
										Просмотр состояния системы и управление резервными копиями
									</p>
								</div>

								<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
									<div className='bg-[#2a2f35] rounded-lg p-4'>
										<h3 className='text-lg font-medium text-white mb-4'>
											Статус системы
										</h3>

										<div className='space-y-3'>
											<div className='flex justify-between'>
												<span className='text-gray-400'>Версия</span>
												<span className='text-white'>{systemInfo.version}</span>
											</div>
											<div className='flex justify-between'>
												<span className='text-gray-400'>Версия Node.js</span>
												<span className='text-white'>
													{systemInfo.nodeVersion}
												</span>
											</div>
											<div className='flex justify-between'>
												<span className='text-gray-400'>База данных</span>
												<span className='text-white'>
													{systemInfo.dbVersion}
												</span>
											</div>
											<div className='flex justify-between'>
												<span className='text-gray-400'>Окружение</span>
												<span className='text-white capitalize'>
													{systemInfo.environment}
												</span>
											</div>
											<div className='flex justify-between'>
												<span className='text-gray-400'>Время работы</span>
												<span className='text-white'>{systemInfo.uptime}</span>
											</div>
											<div className='flex justify-between'>
												<span className='text-gray-400'>Последний перезапуск</span>
												<span className='text-white'>
													{new Date(systemInfo.lastRestart).toLocaleString()}
												</span>
											</div>
										</div>
									</div>

									<div className='bg-[#2a2f35] rounded-lg p-4'>
										<h3 className='text-lg font-medium text-white mb-4'>
											Использование ресурсов
										</h3>

										<div className='space-y-6'>
											{/* Storage */}
											<div>
												<div className='flex justify-between mb-2'>
													<span className='text-gray-400'>Хранилище</span>
													<span className='text-white'>
														{systemInfo.storageUsed} GB /{' '}
														{systemInfo.storageLimit} GB
													</span>
												</div>
												<div className='w-full bg-gray-700 rounded-full h-2.5'>
													<div
														className={`h-2.5 rounded-full ${
															systemInfo.storageUsedPercent > 90
																? 'bg-red-600'
																: systemInfo.storageUsedPercent > 70
																? 'bg-yellow-500'
																: 'bg-green-500'
														}`}
														style={{
															width: `${systemInfo.storageUsedPercent}%`,
														}}
													></div>
												</div>
											</div>

											{/* Memory */}
											<div>
												<div className='flex justify-between mb-2'>
													<span className='text-gray-400'>Память</span>
													<span className='text-white'>
														{systemInfo.memoryUsage}%
													</span>
												</div>
												<div className='w-full bg-gray-700 rounded-full h-2.5'>
													<div
														className={`h-2.5 rounded-full ${
															systemInfo.memoryUsage > 90
																? 'bg-red-600'
																: systemInfo.memoryUsage > 70
																? 'bg-yellow-500'
																: 'bg-blue-500'
														}`}
														style={{ width: `${systemInfo.memoryUsage}%` }}
													></div>
												</div>
											</div>
										</div>
									</div>
								</div>

								<div className='pt-6 border-t border-gray-700'>
									<h3 className='text-lg font-medium text-white mb-4'>
										Управление резервными копиями
									</h3>

									<div className='bg-[#2a2f35] rounded-lg p-4 mb-6'>
										<div className='flex justify-between items-center mb-4'>
											<div>
												<h4 className='text-white font-medium'>
													Автоматические резервные копии
												</h4>
												<p className='text-sm text-gray-400'>
													Система будет автоматически создавать резервные копии ваших данных
												</p>
											</div>
											<button
												onClick={handleBackupNow}
												className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2'
											>
												<HardDrive size={16} />
												<span>Создать резервную копию сейчас</span>
											</button>
										</div>

										<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
											<div>
												<label className='block text-sm font-medium text-gray-300 mb-2'>
													Частота резервного копирования
												</label>
												<select
													value={backups.frequency}
													onChange={e =>
														setBackups({
															...backups,
															frequency: e.target.value,
														})
													}
													className='w-full bg-[#171C1F] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
												>
													<option value='hourly'>Каждый час</option>
													<option value='daily'>Ежедневно</option>
													<option value='weekly'>Еженедельно</option>
													<option value='monthly'>Ежемесячно</option>
												</select>
											</div>

											<div>
												<p className='block text-sm font-medium text-gray-300 mb-2'>
													Последняя резервная копия
												</p>
												<div className='flex items-center gap-2 bg-[#171C1F] border border-gray-700 rounded-lg px-4 py-2.5'>
													<Clock size={16} className='text-gray-400' />
													<span className='text-white'>
														{new Date(backups.lastBackup).toLocaleString()}
													</span>
												</div>
											</div>

											<div>
												<p className='block text-sm font-medium text-gray-300 mb-2'>
													Следующая резервная копия
												</p>
												<div className='flex items-center gap-2 bg-[#171C1F] border border-gray-700 rounded-lg px-4 py-2.5'>
													<Clock size={16} className='text-gray-400' />
													<span className='text-white'>
														{new Date(backups.nextBackup).toLocaleString()}
													</span>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
