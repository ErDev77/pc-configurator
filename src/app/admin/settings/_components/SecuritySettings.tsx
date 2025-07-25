'use client'

import { useState, useEffect } from 'react'
import {
	Lock,
	Shield,
	Mail,
	Smartphone,
	Check,
	AlertTriangle,
	X,
	Loader,
} from 'lucide-react'
import { toast } from 'react-toastify'
import { useAuth } from '@/context/AuthContext'

export function SecuritySettings() {
	const { user } = useAuth()
	const [sessionTimeout, setSessionTimeout] = useState(60)
	const [maxLoginAttempts, setMaxLoginAttempts] = useState(5)
	const [saving, setSaving] = useState(false)
	const [loadingSettings, setLoadingSettings] = useState(true)
	const [accountSettings, setAccountSettings] = useState({
		name: user?.name || 'Admin User',
		email: user?.email || 'admin@example.com',
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
	})

	useEffect(() => {
		// Update account settings when user data changes
		if (user) {
			setAccountSettings(prev => ({
				...prev,
				name: user.name || prev.name,
				email: user.email || prev.email,
			}))
		}
	}, [user])

	// Load security settings
	useEffect(() => {
		const fetchSecuritySettings = async () => {
			try {
				const response = await fetch('/api/admin/security-settings')
				if (response.ok) {
					const data = await response.json()
					setSessionTimeout(data.session_timeout_minutes || 60)
					setMaxLoginAttempts(data.max_login_attempts || 5)
				}
			} catch (error) {
				console.error('Error fetching security settings:', error)
				toast.error('Failed to load security settings')
			} finally {
				setLoadingSettings(false)
			}
		}

		fetchSecuritySettings()
	}, [])

	const handlePasswordChange = async () => {
		if (accountSettings.newPassword !== accountSettings.confirmPassword) {
			toast.error('New passwords do not match')
			return
		}

		if (!accountSettings.currentPassword) {
			toast.error('Current password is required')
			return
		}

		if (accountSettings.newPassword.length < 8) {
			toast.error('Password must be at least 8 characters long')
			return
		}

		setSaving(true)

		try {
			const response = await fetch('/api/admin/change-password', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					currentPassword: accountSettings.currentPassword,
					newPassword: accountSettings.newPassword,
				}),
			})

			const data = await response.json()

			if (response.ok) {
				toast.success('Password changed successfully!')
				setAccountSettings({
					...accountSettings,
					currentPassword: '',
					newPassword: '',
					confirmPassword: '',
				})
			} else {
				toast.error(data.error || 'Failed to change password')
			}
		} catch (error) {
			console.error('Error changing password:', error)
			toast.error('An unexpected error occurred')
		} finally {
			setSaving(false)
		}
	}

	const handleSaveSecuritySettings = async () => {
		setSaving(true)

		try {
			const response = await fetch('/api/admin/security-settings', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					session_timeout_minutes: sessionTimeout,
					max_login_attempts: maxLoginAttempts,
				}),
			})

			const data = await response.json()

			if (response.ok) {
				toast.success('Security settings updated successfully!')
			} else {
				toast.error(data.error || 'Failed to update security settings')
			}
		} catch (error) {
			console.error('Error updating security settings:', error)
			toast.error('An unexpected error occurred')
		} finally {
			setSaving(false)
		}
	}


	if (loadingSettings) {
		return (
			<div className='flex items-center justify-center h-64'>
				<Loader size={32} className='animate-spin text-blue-500' />
			</div>
		)
	}

	return (
		<div className='space-y-8'>
			<div className='pb-5 border-b border-gray-700'>
				<h2 className='text-xl font-bold text-white mb-1'>
					Настройки безопасности
				</h2>
				<p className='text-gray-400 text-sm'>
					Управляйте своими параметрами безопасности
				</p>
			</div>

				<h3 className='text-lg font-medium text-white mb-4'>Сменить пароль</h3>
				<div className='space-y-4'>
					<div>
						<label className='block text-sm font-medium text-gray-300 mb-2'>
							Текущий пароль
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
								Новый пароль
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
								Подтвердите новый пароль
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
							disabled={saving}
							className={`px-4 py-2 ${
								saving
									? 'bg-blue-700 opacity-75 cursor-not-allowed'
									: 'bg-blue-600 hover:bg-blue-700'
							} text-white rounded-lg transition-colors flex items-center gap-2`}
						>
							{saving ? (
								<>
									<Loader size={16} className='animate-spin' />
									<span>Обновление...</span>
								</>
							) : (
								<>
									<Lock size={16} />
									<span>Обновить пароль</span>
								</>
							)}
						</button>
					</div>
				</div>

			{/* Session Settings */}
			<div className='pt-4 border-t border-gray-700'>
				<h3 className='text-lg font-medium text-white mb-4'>Настройки сеанса</h3>

				<div className='space-y-4'>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
						<div>
							<label className='block text-sm font-medium text-gray-300 mb-2'>
								Тайм-аут сеанса (минуты)
							</label>
							<input
								type='number'
								min='5'
								max='1440'
								value={sessionTimeout}
								onChange={e => setSessionTimeout(parseInt(e.target.value))}
								className='w-full bg-[#2a2f35] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
							/>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-300 mb-2'>
								Максимальное количество попыток входа
							</label>
							<input
								type='number'
								min='1'
								max='10'
								value={maxLoginAttempts}
								onChange={e => setMaxLoginAttempts(parseInt(e.target.value))}
								className='w-full bg-[#2a2f35] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
							/>
						</div>
					</div>

					<div className='flex gap-4'>
						<button
							onClick={handleSaveSecuritySettings}
							disabled={saving}
							className={`px-4 py-2 ${
								saving
									? 'bg-blue-700 opacity-75 cursor-not-allowed'
									: 'bg-blue-600 hover:bg-blue-700'
							} text-white rounded-lg transition-colors flex items-center gap-2`}
						>
							{saving ? (
								<>
									<Loader size={16} className='animate-spin' />
									<span>Сохранение...</span>
								</>
							) : (
								<>
									<Shield size={16} />
									<span>Сохранить настройки безопасности</span>
								</>
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
