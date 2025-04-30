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

	const handlePasswordChange = () => {
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

		// Simulate API call - in a real app, this would be an actual API request
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

	return (
		<div className='space-y-8'>
			<div className='pb-5 border-b border-gray-700'>
				<h2 className='text-xl font-bold text-white mb-1'>Security Settings</h2>
				<p className='text-gray-400 text-sm'>
					Manage your security preferences and two-factor authentication
				</p>
			</div>

			<div className='pt-4 border-t border-gray-700'>
				<h3 className='text-lg font-medium text-white mb-4'>Change Password</h3>

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
									<span>Updating...</span>
								</>
							) : (
								<>
									<Lock size={16} />
									<span>Update Password</span>
								</>
							)}
						</button>
					</div>
				</div>
			</div>

			{/* Session Settings */}
			<div className='pt-4 border-t border-gray-700'>
				<h3 className='text-lg font-medium text-white mb-4'>Session</h3>

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
								value={sessionTimeout}
								onChange={e => setSessionTimeout(parseInt(e.target.value))}
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
								value={maxLoginAttempts}
								onChange={e => setMaxLoginAttempts(parseInt(e.target.value))}
								className='w-full bg-[#2a2f35] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
							/>
						</div>
					</div>

					<div className='mt-4'>
						<button
							className='px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2'
							onClick={() => {
								// Implement sign out all devices functionality
								toast.success('All devices signed out successfully')
							}}
						>
							<Lock size={16} />
							<span>Sign Out All Devices</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
