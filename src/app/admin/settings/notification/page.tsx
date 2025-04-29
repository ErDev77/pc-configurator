// src/app/admin/notification-settings/NotificationSettings.tsx
'use client'

import { useState, useEffect } from 'react'
import Sidebar from '../../_components/Sidebar'
import { toast } from 'react-toastify'

interface NotificationSettings {
	id: number
	name: string
	email_enabled: boolean
	telegram_enabled: boolean
	email_recipient: string
	telegram_chat_id: string | null
	is_active: boolean
}

export default function NotificationSettings() {
	const [settings, setSettings] = useState<NotificationSettings | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [isSaving, setIsSaving] = useState(false)
	const [emailTestStatus, setEmailTestStatus] = useState<
		'idle' | 'loading' | 'success' | 'error'
	>('idle')
	const [telegramTestStatus, setTelegramTestStatus] = useState<
		'idle' | 'loading' | 'success' | 'error'
	>('idle')

	useEffect(() => {
		fetchSettings()
	}, [])

	const fetchSettings = async () => {
		setIsLoading(true)
		try {
			const response = await fetch('/api/admin/settings/notifications')
			if (!response.ok) throw new Error('Failed to fetch settings')

			const data = await response.json()
			setSettings(data)
		} catch (error) {
			console.error('Error fetching notification settings:', error)
			toast.error('Failed to load notification settings')
		} finally {
			setIsLoading(false)
		}
	}

	const updateSetting = (field: keyof NotificationSettings, value: any) => {
		if (!settings) return

		setSettings({
			...settings,
			[field]: value,
		})
	}

	const saveSettings = async () => {
		if (!settings) return

		setIsSaving(true)
		try {
			const response = await fetch('/api/admin/settings/notifications', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(settings),
			})

			if (!response.ok) throw new Error('Failed to save settings')

			toast.success('Notification settings saved successfully')
		} catch (error) {
			console.error('Error saving notification settings:', error)
			toast.error('Failed to save notification settings')
		} finally {
			setIsSaving(false)
		}
	}

	const testEmailNotification = async () => {
		setEmailTestStatus('loading')
		try {
			const response = await fetch('/api/admin/settings/test-email', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					email: settings?.email_recipient,
				}),
			})

			if (!response.ok) throw new Error('Failed to send test email')

			setEmailTestStatus('success')
			toast.success('Test email sent successfully')
		} catch (error) {
			console.error('Error sending test email:', error)
			setEmailTestStatus('error')
			toast.error('Failed to send test email')
		} finally {
			setTimeout(() => setEmailTestStatus('idle'), 3000)
		}
	}

	const testTelegramNotification = async () => {
		setTelegramTestStatus('loading')
		try {
			const response = await fetch('/api/admin/settings/test-telegram', {
				method: 'POST',
			})

			if (!response.ok) throw new Error('Failed to send test telegram message')

			setTelegramTestStatus('success')
			toast.success('Test telegram message sent successfully')
		} catch (error) {
			console.error('Error sending test telegram message:', error)
			setTelegramTestStatus('error')
			toast.error('Failed to send test telegram message')
		} finally {
			setTimeout(() => setTelegramTestStatus('idle'), 3000)
		}
	}

	if (isLoading) {
		return (
			<div className='p-6 bg-[#171C1F] min-h-screen'>
				<Sidebar />
				<div className='ml-72'>
					<h1 className='text-3xl text-white mb-6 font-bold'>
						Notification Settings
					</h1>
					<div className='bg-[#202529] p-6 rounded-lg shadow-lg'>
						<p className='text-white'>Loading settings...</p>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className='p-6 bg-[#171C1F] min-h-screen'>
			<Sidebar />

			<div className='ml-72'>
				<h1 className='text-3xl text-white mb-6 font-bold'>
					Notification Settings
				</h1>

				<div className='bg-[#202529] p-6 rounded-lg shadow-lg'>
					<div className='mb-6'>
						<h2 className='text-xl text-white font-semibold mb-4'>
							Email Notifications
						</h2>

						<div className='flex items-center mb-4'>
							<label className='inline-flex items-center cursor-pointer'>
								<input
									type='checkbox'
									className='sr-only peer'
									checked={settings?.email_enabled || false}
									onChange={e =>
										updateSetting('email_enabled', e.target.checked)
									}
								/>
								<div
									className={`relative w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer ${
										settings?.email_enabled
											? 'peer-checked:after:translate-x-full peer-checked:after:border-white'
											: ''
									} after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00b5ed]`}
								></div>
								<span className='ml-3 text-white'>
									Enable Email Notifications
								</span>
							</label>
						</div>

						<div className='mb-4'>
							<label className='block text-sm text-gray-400 mb-2'>
								Recipient Email
							</label>
							<input
								type='email'
								className='w-full p-2 bg-gray-700 text-white rounded'
								value={settings?.email_recipient || ''}
								onChange={e => updateSetting('email_recipient', e.target.value)}
								placeholder='store@example.com'
							/>
							<p className='text-xs text-gray-400 mt-1'>
								Order confirmations and notifications will be sent to this email
								address
							</p>
						</div>

						<button
							onClick={testEmailNotification}
							disabled={
								emailTestStatus === 'loading' || !settings?.email_enabled
							}
							className={`mt-2 px-4 py-2 rounded text-white ${
								emailTestStatus === 'loading' || !settings?.email_enabled
									? 'bg-gray-600 cursor-not-allowed'
									: 'bg-blue-600 hover:bg-blue-700'
							}`}
						>
							{emailTestStatus === 'loading' ? 'Sending...' : 'Send Test Email'}
							{emailTestStatus === 'success' && (
								<span className='ml-2 text-green-400'>✓</span>
							)}
							{emailTestStatus === 'error' && (
								<span className='ml-2 text-red-400'>✗</span>
							)}
						</button>
					</div>

					<div className='border-t border-gray-700 pt-6 mb-6'>
						<h2 className='text-xl text-white font-semibold mb-4'>
							Telegram Notifications
						</h2>

						<div className='flex items-center mb-4'>
							<label className='inline-flex items-center cursor-pointer'>
								<input
									type='checkbox'
									className='sr-only peer'
									checked={settings?.telegram_enabled || false}
									onChange={e =>
										updateSetting('telegram_enabled', e.target.checked)
									}
								/>
								<div
									className={`relative w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer ${
										settings?.telegram_enabled
											? 'peer-checked:after:translate-x-full peer-checked:after:border-white'
											: ''
									} after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00b5ed]`}
								></div>
								<span className='ml-3 text-white'>
									Enable Telegram Notifications
								</span>
							</label>
						</div>

						<p className='text-sm text-gray-400 mb-4'>
							Telegram notifications use the bot token and chat ID configured in
							your environment variables.
							<br />
							To change these settings, update the TELEGRAM_BOT_TOKEN and
							TELEGRAM_CHAT_ID variables in your .env file.
						</p>

						<button
							onClick={testTelegramNotification}
							disabled={
								telegramTestStatus === 'loading' || !settings?.telegram_enabled
							}
							className={`mt-2 px-4 py-2 rounded text-white ${
								telegramTestStatus === 'loading' || !settings?.telegram_enabled
									? 'bg-gray-600 cursor-not-allowed'
									: 'bg-blue-600 hover:bg-blue-700'
							}`}
						>
							{telegramTestStatus === 'loading'
								? 'Sending...'
								: 'Send Test Telegram Message'}
							{telegramTestStatus === 'success' && (
								<span className='ml-2 text-green-400'>✓</span>
							)}
							{telegramTestStatus === 'error' && (
								<span className='ml-2 text-red-400'>✗</span>
							)}
						</button>
					</div>

					<div className='border-t border-gray-700 pt-6'>
						<h2 className='text-xl text-white font-semibold mb-4'>
							General Settings
						</h2>

						<div className='mb-4'>
							<label className='block text-sm text-gray-400 mb-2'>
								Settings Profile Name
							</label>
							<input
								type='text'
								className='w-full p-2 bg-gray-700 text-white rounded'
								value={settings?.name || ''}
								onChange={e => updateSetting('name', e.target.value)}
								placeholder='Default Settings'
							/>
						</div>
					</div>

					<div className='mt-6 flex justify-end'>
						<button
							onClick={saveSettings}
							disabled={isSaving}
							className={`px-6 py-2 rounded font-medium ${
								isSaving
									? 'bg-gray-600 cursor-not-allowed'
									: 'bg-[#00b5ed] hover:bg-[#00a1d4]'
							} text-white`}
						>
							{isSaving ? 'Saving...' : 'Save Settings'}
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
