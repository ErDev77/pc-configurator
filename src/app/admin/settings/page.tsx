'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Sidebar from '../_components/Sidebar'
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
			title: 'Account Settings',
			icon: <User size={20} />,
			description: 'Manage your account information and security settings',
		},
		{
			id: 'notifications',
			title: 'Notifications',
			icon: <Bell size={20} />,
			description: 'Configure how and when you receive notifications',
		},
		{
			id: 'appearance',
			title: 'Appearance',
			icon: <Palette size={20} />,
			description: 'Customize the look and feel of the admin dashboard',
		},
		{
			id: 'store',
			title: 'Store Settings',
			icon: <Globe size={20} />,
			description: 'Configure global store settings and preferences',
		},
		{
			id: 'security',
			title: 'Security',
			icon: <Shield size={20} />,
			description: 'Manage security settings and permissions',
		},
		{
			id: 'integrations',
			title: 'Integrations',
			icon: <FileJson size={20} />,
			description: 'Manage API keys and third-party integrations',
		},
		{
			id: 'system',
			title: 'System',
			icon: <Database size={20} />,
			description: 'View system information and manage backups',
		},
	]
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

	 const handleSaveSettings = async () => {
			setIsSaving(true)
			try {
				const response = await fetch('/api/admin/settings', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						notifications: notificationSettings,
					}),
				})

				if (response.ok) {
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

	const handlePasswordChange = () => {
		if (accountSettings.newPassword !== accountSettings.confirmPassword) {
			toast.error('New passwords do not match')
			return
		}

		if (!accountSettings.currentPassword) {
			toast.error('Current password is required')
			return
		}

		setSaving(true)

		// Simulate API call
		setTimeout(() => {
			toast.success('Password changed successfully!')
			setAccountSettings({
				...accountSettings,
				currentPassword: '',
				newPassword: '',
				confirmPassword: '',
			})
			setSaving(false)
		}, 1500)
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

	return (
		<div className='flex bg-[#171C1F] min-h-screen'>
			<Sidebar />
			<div className='flex-1 p-6 ml-20 overflow-auto'>
				<ToastContainer />

				<div className='flex justify-between items-center mb-8'>
					<div>
						<h1 className='text-3xl font-bold text-white'>Settings</h1>
						<p className='text-gray-400'>
							Manage your account and system preferences
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
						<span>{saving ? 'Saving...' : 'Save Changes'}</span>
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

						<div className='p-4 bg-blue-600/10 border-t border-blue-600/20 mt-2'>
							<div className='flex items-center gap-3'>
								<div className='p-2 bg-blue-600/20 rounded-full'>
									<LifeBuoy size={18} className='text-blue-400' />
								</div>
								<div>
									<h3 className='text-sm font-medium text-white'>Need help?</h3>
									<p className='text-xs text-gray-400'>
										Check our documentation
									</p>
								</div>
							</div>
							<button
								onClick={() => router.push('/admin/help')}
								className='mt-3 w-full py-2 px-3 bg-[#2a2f35] hover:bg-[#353a42] text-blue-400 rounded-lg text-sm transition-colors'
							>
								View Documentation
							</button>
						</div>
					</div>

					{/* Settings Content */}
					<div className='lg:col-span-3 bg-[#202529] rounded-xl shadow-lg overflow-hidden p-6'>
						{/* Account Settings */}
						{activeSection === 'account' && (
							<div className='space-y-8'>
								<div className='pb-5 border-b border-gray-700'>
									<h2 className='text-xl font-bold text-white mb-1'>
										Account Settings
									</h2>
									<p className='text-gray-400 text-sm'>
										Manage your personal information and account security
									</p>
								</div>

								<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
									<div>
										<label className='block text-sm font-medium text-gray-300 mb-2'>
											Full Name
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
											Email Address
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

								<div className='pt-4 border-t border-gray-700'>
									<h3 className='text-lg font-medium text-white mb-4'>
										Change Password
									</h3>

									<div className='space-y-4'>
										<div>
											<label className='block text-sm font-medium text-gray-300 mb-2'>
												Current Password
											</label>
											<input
												type='password'
												value={accountSettings.currentPassword}
												onChange={e =>
													setAccountSettings({
														...accountSettings,
														currentPassword: e.target.value,
													})
												}
												className='w-full bg-[#2a2f35] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
											/>
										</div>

										<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
											<div>
												<label className='block text-sm font-medium text-gray-300 mb-2'>
													New Password
												</label>
												<input
													type='password'
													value={accountSettings.newPassword}
													onChange={e =>
														setAccountSettings({
															...accountSettings,
															newPassword: e.target.value,
														})
													}
													className='w-full bg-[#2a2f35] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
												/>
											</div>

											<div>
												<label className='block text-sm font-medium text-gray-300 mb-2'>
													Confirm New Password
												</label>
												<input
													type='password'
													value={accountSettings.confirmPassword}
													onChange={e =>
														setAccountSettings({
															...accountSettings,
															confirmPassword: e.target.value,
														})
													}
													className='w-full bg-[#2a2f35] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
												/>
											</div>
										</div>

										<div>
											<button
												onClick={handlePasswordChange}
												className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors'
											>
												Update Password
											</button>
										</div>
									</div>
								</div>
							</div>
						)}

						{/* Notification Settings */}
						{activeSection === 'notifications' && (
							<div className='space-y-8'>
								<div className='pb-5 border-b border-gray-700'>
									<h2 className='text-xl font-bold text-white mb-1'>
										Notification Settings
									</h2>
									<p className='text-gray-400 text-sm'>
										Control when and how you receive notifications
									</p>
								</div>

								<div>
									<h3 className='text-lg font-medium text-white mb-4'>
										Notification Channels
									</h3>

									<div className='space-y-4'>
										<div className='flex items-center justify-between p-4 bg-[#2a2f35] rounded-lg'>
											<div className='flex items-center gap-3'>
												<div className='p-2 bg-blue-600/20 rounded-full'>
													<Bell size={18} className='text-blue-400' />
												</div>
												<div>
													<p className='font-medium text-white'>
														Email Notifications
													</p>
													<p className='text-sm text-gray-400'>
														Receive notifications via email
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
														Telegram Notifications
													</p>
													<p className='text-sm text-gray-400'>
														Receive notifications via telegram
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
														Browser Notifications
													</p>
													<p className='text-sm text-gray-400'>
														Receive notifications in browser
													</p>
												</div>
											</div>
											<label className='relative inline-flex items-center cursor-pointer'>
												<input
													type='checkbox'
													checked={browserNotifications}
													onChange={() =>
														setBrowserNotifications(!browserNotifications)
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
										Notification Types
									</h3>

									<div className='space-y-4'>
										<div className='flex items-center justify-between p-4 bg-[#2a2f35] rounded-lg'>
											<div className='flex items-center gap-3'>
												<div className='p-2 bg-green-600/20 rounded-full'>
													<ShoppingCart size={18} className='text-green-400' />
												</div>
												<div>
													<p className='font-medium text-white'>
														Order Notifications
													</p>
													<p className='text-sm text-gray-400'>
														Notify about new orders and status changes
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
													<p className='font-medium text-white'>Stock Alerts</p>
													<p className='text-sm text-gray-400'>
														Notify about low inventory levels
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
							</div>
						)}

						{/* Appearance Settings */}
						{activeSection === 'appearance' && (
							<div className='space-y-8'>
								<div className='pb-5 border-b border-gray-700'>
									<h2 className='text-xl font-bold text-white mb-1'>
										Appearance Settings
									</h2>
									<p className='text-gray-400 text-sm'>
										Customize how the admin panel looks
									</p>
								</div>

								<div>
									<h3 className='text-lg font-medium text-white mb-4'>Theme</h3>

									<div className='flex gap-4'>
										<div
											className={`p-4 bg-[#2a2f35] rounded-lg border-2 ${
												isDarkMode ? 'border-blue-500' : 'border-transparent'
											} cursor-pointer transition-all hover:bg-[#353a42]`}
											onClick={() => setIsDarkMode(true)}
										>
											<div className='h-32 bg-[#171C1F] rounded-md mb-4 p-3'>
												<div className='w-1/4 h-full bg-[#202529] rounded'></div>
											</div>
											<div className='flex items-center gap-2'>
												<div
													className={`w-4 h-4 rounded-full border ${
														isDarkMode
															? 'bg-blue-500 border-blue-500'
															: 'border-gray-500'
													}`}
												></div>
												<span className='text-white'>Dark Mode</span>
											</div>
										</div>

										<div
											className={`p-4 bg-[#2a2f35] rounded-lg border-2 ${
												!isDarkMode ? 'border-blue-500' : 'border-transparent'
											} cursor-pointer transition-all hover:bg-[#353a42]`}
											onClick={() => setIsDarkMode(false)}
										>
											<div className='h-32 bg-gray-100 rounded-md mb-4 p-3'>
												<div className='w-1/4 h-full bg-white rounded border border-gray-300'></div>
											</div>
											<div className='flex items-center gap-2'>
												<div
													className={`w-4 h-4 rounded-full border ${
														!isDarkMode
															? 'bg-blue-500 border-blue-500'
															: 'border-gray-500'
													}`}
												></div>
												<span className='text-white'>Light Mode</span>
											</div>
										</div>
									</div>
								</div>

								<div className='pt-4 border-t border-gray-700'>
									<h3 className='text-lg font-medium text-white mb-4'>
										Language
									</h3>

									<div className='max-w-md'>
										<select
											value={language}
											onChange={e => setLanguage(e.target.value)}
											className='w-full bg-[#2a2f35] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
										>
											<option value='en'>English</option>
											<option value='ru'>Russian</option>
											<option value='am'>Armenian</option>
											<option value='es'>Spanish</option>
											<option value='fr'>French</option>
											<option value='de'>German</option>
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
										Store Settings
									</h2>
									<p className='text-gray-400 text-sm'>
										Configure your online store
									</p>
								</div>

								<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
									<div>
										<label className='block text-sm font-medium text-gray-300 mb-2'>
											Store Name
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
											Store Email
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
											Currency
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
											<option value='USD'>USD - US Dollar</option>
											<option value='EUR'>EUR - Euro</option>
											<option value='GBP'>GBP - British Pound</option>
											<option value='CAD'>CAD - Canadian Dollar</option>
											<option value='AUD'>AUD - Australian Dollar</option>
										</select>
									</div>

									<div>
										<label className='block text-sm font-medium text-gray-300 mb-2'>
											Tax Rate (%)
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
											Order Number Prefix
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
						{activeSection === 'security' && (
							<div className='space-y-8'>
								<div className='pb-5 border-b border-gray-700'>
									<h2 className='text-xl font-bold text-white mb-1'>
										Security Settings
									</h2>
									<p className='text-gray-400 text-sm'>
										Manage your security preferences
									</p>
								</div>

								<div>
									<h3 className='text-lg font-medium text-white mb-4'>
										Authentication
									</h3>

									<div className='flex items-center justify-between p-4 bg-[#2a2f35] rounded-lg mb-4'>
										<div className='flex items-center gap-3'>
											<div className='p-2 bg-blue-600/20 rounded-full'>
												<Lock size={18} className='text-blue-400' />
											</div>
											<div>
												<p className='font-medium text-white'>
													Two-Factor Authentication
												</p>
												<p className='text-sm text-gray-400'>
													Add an extra layer of security to your account
												</p>
											</div>
										</div>
										<button className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors'>
											Enable
										</button>
									</div>

									<div className='flex items-center justify-between p-4 bg-[#2a2f35] rounded-lg'>
										<div className='flex items-center gap-3'>
											<div className='p-2 bg-blue-600/20 rounded-full'>
												<Shield size={18} className='text-blue-400' />
											</div>
											<div>
												<p className='font-medium text-white'>
													Password Requirements
												</p>
												<p className='text-sm text-gray-400'>
													Set minimum password complexity requirements
												</p>
											</div>
										</div>
										<button className='px-4 py-2 border border-gray-600 hover:border-gray-500 text-white rounded-lg transition-colors'>
											Configure
										</button>
									</div>
								</div>

								<div className='pt-4 border-t border-gray-700'>
									<h3 className='text-lg font-medium text-white mb-4'>
										Session
									</h3>

									<div className='space-y-4'>
										<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
											<div>
												<label className='block text-sm font-medium text-gray-300 mb-2'>
													Session Timeout (minutes)
												</label>
												<input
													type='number'
													min='5'
													max='1440'
													defaultValue='60'
													className='w-full bg-[#2a2f35] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
												/>
											</div>

											<div>
												<label className='block text-sm font-medium text-gray-300 mb-2'>
													Maximum Login Attempts
												</label>
												<input
													type='number'
													min='1'
													max='10'
													defaultValue='5'
													className='w-full bg-[#2a2f35] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
												/>
											</div>
										</div>

										<div className='mt-4'>
											<button className='px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors'>
												Sign Out All Devices
											</button>
										</div>
									</div>
								</div>
							</div>
						)}

						{/* Integrations Settings */}
						{activeSection === 'integrations' && (
							<div className='space-y-8'>
								<div className='pb-5 border-b border-gray-700'>
									<h2 className='text-xl font-bold text-white mb-1'>
										Integrations
									</h2>
									<p className='text-gray-400 text-sm'>
										Manage API keys and third-party services
									</p>
								</div>

								<div>
									<h3 className='text-lg font-medium text-white mb-4'>
										API Access
									</h3>

									<div className='bg-[#2a2f35] rounded-lg p-4 mb-6'>
										<div className='flex justify-between items-center mb-2'>
											<label className='text-sm font-medium text-gray-300'>
												API Key
											</label>
											<button
												onClick={regenerateApiKey}
												className='text-xs text-blue-400 hover:text-blue-300'
											>
												Regenerate
											</button>
										</div>
										<div className='flex'>
											<input
												type='text'
												value={apiKey}
												readOnly
												className='flex-grow bg-[#171C1F] border border-gray-700 rounded-l-lg px-4 py-2 text-white focus:outline-none'
											/>
											<button
												onClick={() => {
													navigator.clipboard.writeText(apiKey)
													toast.success('API key copied to clipboard!')
												}}
												className='bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-r-lg transition-colors'
											>
												Copy
											</button>
										</div>
										<p className='text-xs text-gray-400 mt-2'>
											This API key grants full access to your store. Keep it
											secure and never share it publicly.
										</p>
									</div>

									<h3 className='text-lg font-medium text-white mb-4'>
										Payment Gateways
									</h3>

									<div className='space-y-4'>
										<div className='flex items-center justify-between p-4 bg-[#2a2f35] rounded-lg'>
											<div className='flex items-center gap-3'>
												<div className='w-10 h-10 bg-white rounded-md flex items-center justify-center'>
													<span className='text-blue-600 font-bold text-sm'>
														Stripe
													</span>
												</div>
												<div>
													<p className='font-medium text-white'>Stripe</p>
													<p className='text-sm text-gray-400'>
														Accept credit card payments
													</p>
												</div>
											</div>
											<label className='relative inline-flex items-center cursor-pointer'>
												<input
													type='checkbox'
													checked={true}
													className='sr-only peer'
												/>
												<div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
											</label>
										</div>

										<div className='flex items-center justify-between p-4 bg-[#2a2f35] rounded-lg'>
											<div className='flex items-center gap-3'>
												<div className='w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center'>
													<span className='text-white font-bold text-sm'>
														PP
													</span>
												</div>
												<div>
													<p className='font-medium text-white'>PayPal</p>
													<p className='text-sm text-gray-400'>
														Accept PayPal payments
													</p>
												</div>
											</div>
											<label className='relative inline-flex items-center cursor-pointer'>
												<input
													type='checkbox'
													checked={true}
													className='sr-only peer'
												/>
												<div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
											</label>
										</div>
									</div>
								</div>
							</div>
						)}

						{/* System Settings */}
						{activeSection === 'system' && (
							<div className='space-y-8'>
								<div className='pb-5 border-b border-gray-700'>
									<h2 className='text-xl font-bold text-white mb-1'>
										System Information
									</h2>
									<p className='text-gray-400 text-sm'>
										View system status and manage backups
									</p>
								</div>

								<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
									<div className='bg-[#2a2f35] rounded-lg p-4'>
										<h3 className='text-lg font-medium text-white mb-4'>
											System Status
										</h3>

										<div className='space-y-3'>
											<div className='flex justify-between'>
												<span className='text-gray-400'>Version</span>
												<span className='text-white'>{systemInfo.version}</span>
											</div>
											<div className='flex justify-between'>
												<span className='text-gray-400'>Node.js Version</span>
												<span className='text-white'>
													{systemInfo.nodeVersion}
												</span>
											</div>
											<div className='flex justify-between'>
												<span className='text-gray-400'>Database</span>
												<span className='text-white'>
													{systemInfo.dbVersion}
												</span>
											</div>
											<div className='flex justify-between'>
												<span className='text-gray-400'>Environment</span>
												<span className='text-white capitalize'>
													{systemInfo.environment}
												</span>
											</div>
											<div className='flex justify-between'>
												<span className='text-gray-400'>Uptime</span>
												<span className='text-white'>{systemInfo.uptime}</span>
											</div>
											<div className='flex justify-between'>
												<span className='text-gray-400'>Last Restart</span>
												<span className='text-white'>
													{new Date(systemInfo.lastRestart).toLocaleString()}
												</span>
											</div>
										</div>
									</div>

									<div className='bg-[#2a2f35] rounded-lg p-4'>
										<h3 className='text-lg font-medium text-white mb-4'>
											Resource Usage
										</h3>

										<div className='space-y-6'>
											{/* Storage */}
											<div>
												<div className='flex justify-between mb-2'>
													<span className='text-gray-400'>Storage</span>
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
													<span className='text-gray-400'>Memory</span>
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
										Backup Management
									</h3>

									<div className='bg-[#2a2f35] rounded-lg p-4 mb-6'>
										<div className='flex justify-between items-center mb-4'>
											<div>
												<h4 className='text-white font-medium'>
													Automatic Backups
												</h4>
												<p className='text-sm text-gray-400'>
													System will automatically backup your data
												</p>
											</div>
											<button
												onClick={handleBackupNow}
												className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2'
											>
												<HardDrive size={16} />
												<span>Backup Now</span>
											</button>
										</div>

										<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
											<div>
												<label className='block text-sm font-medium text-gray-300 mb-2'>
													Backup Frequency
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
													<option value='hourly'>Hourly</option>
													<option value='daily'>Daily</option>
													<option value='weekly'>Weekly</option>
													<option value='monthly'>Monthly</option>
												</select>
											</div>

											<div>
												<p className='block text-sm font-medium text-gray-300 mb-2'>
													Last Backup
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
													Next Backup
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
