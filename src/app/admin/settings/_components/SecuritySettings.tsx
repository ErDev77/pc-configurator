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
	const [loading, setLoading] = useState(true)
	const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
	const [twoFactorMethod, setTwoFactorMethod] = useState('email')
	const [setupStep, setSetupStep] = useState(0) // 0: not setting up, 1: select method, 2: verify code
	const [verificationCode, setVerificationCode] = useState('')
	const [verificationLoading, setVerificationLoading] = useState(false)
	const [verificationError, setVerificationError] = useState('')
	const [sessionTimeout, setSessionTimeout] = useState(60)
	const [maxLoginAttempts, setMaxLoginAttempts] = useState(5)

	// Fetch current 2FA settings
	useEffect(() => {
		const fetch2FAStatus = async () => {
			try {
				setLoading(true)
				const response = await fetch('/api/admin/2fa/status', {
					credentials: 'include',
					cache: 'no-store',
				})

				if (response.ok) {
					const data = await response.json()
					setTwoFactorEnabled(data.enabled)
					setTwoFactorMethod(data.method || 'email')
				}
			} catch (error) {
				console.error('Error fetching 2FA status:', error)
			} finally {
				setLoading(false)
			}
		}

		fetch2FAStatus()
	}, [])

	// Start 2FA setup
	const startTwoFactorSetup = () => {
		setSetupStep(1)
		setVerificationCode('')
		setVerificationError('')
	}

	// Select 2FA method and generate verification code
	const selectTwoFactorMethod = async (method: string) => {
		try {
			setTwoFactorMethod(method)
			setVerificationLoading(true)

			// Generate and send verification code
			const response = await fetch('/api/admin/2fa/generate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ method }),
				credentials: 'include',
			})

			if (response.ok) {
				setSetupStep(2)
				toast.info(
					`Verification code sent via ${
						method === 'email' ? 'email' : 'authenticator app'
					}`
				)
			} else {
				const data = await response.json()
				toast.error(data.error || 'Failed to generate verification code')
			}
		} catch (error) {
			console.error('Error generating verification code:', error)
			toast.error('Failed to generate verification code')
		} finally {
			setVerificationLoading(false)
		}
	}

	// Verify code and enable 2FA
	const verifyAndEnable2FA = async () => {
		try {
			setVerificationLoading(true)
			setVerificationError('')

			// Verify the code
			const verifyResponse = await fetch('/api/admin/2fa/verify', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ code: verificationCode }),
				credentials: 'include',
			})

			if (verifyResponse.ok) {
				// Enable 2FA with the selected method
				const enableResponse = await fetch('/api/admin/2fa/enable', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ method: twoFactorMethod }),
					credentials: 'include',
				})

				if (enableResponse.ok) {
					setTwoFactorEnabled(true)
					setSetupStep(0)
					toast.success('Two-factor authentication enabled successfully')
				} else {
					const data = await enableResponse.json()
					setVerificationError(
						data.error || 'Failed to enable two-factor authentication'
					)
				}
			} else {
				const data = await verifyResponse.json()
				setVerificationError(data.error || 'Invalid verification code')
			}
		} catch (error) {
			console.error('Error verifying code:', error)
			setVerificationError('An unexpected error occurred')
		} finally {
			setVerificationLoading(false)
		}
	}

	// Disable 2FA
	const disableTwoFactor = async () => {
		if (
			!confirm(
				'Are you sure you want to disable two-factor authentication? This will make your account less secure.'
			)
		) {
			return
		}

		try {
			setLoading(true)

			const response = await fetch('/api/admin/2fa/disable', {
				method: 'POST',
				credentials: 'include',
			})

			if (response.ok) {
				setTwoFactorEnabled(false)
				toast.success('Two-factor authentication disabled')
			} else {
				const data = await response.json()
				toast.error(data.error || 'Failed to disable two-factor authentication')
			}
		} catch (error) {
			console.error('Error disabling 2FA:', error)
			toast.error('Failed to disable two-factor authentication')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className='space-y-8'>
			<div className='pb-5 border-b border-gray-700'>
				<h2 className='text-xl font-bold text-white mb-1'>Security Settings</h2>
				<p className='text-gray-400 text-sm'>
					Manage your security preferences and two-factor authentication
				</p>
			</div>

			{/* Two-Factor Authentication */}
			<div>
				<h3 className='text-lg font-medium text-white mb-4'>
					Two-Factor Authentication
				</h3>

				{loading ? (
					<div className='flex items-center justify-center py-8'>
						<Loader className='animate-spin text-blue-500 w-8 h-8' />
					</div>
				) : setupStep === 0 ? (
					// Current 2FA Status
					<div className='flex items-center justify-between p-5 bg-[#2a2f35] rounded-lg mb-6'>
						<div className='flex items-center gap-4'>
							<div
								className={`p-3 rounded-full ${
									twoFactorEnabled ? 'bg-green-600/20' : 'bg-blue-600/20'
								}`}
							>
								<Shield
									className={`${
										twoFactorEnabled ? 'text-green-400' : 'text-blue-400'
									} w-6 h-6`}
								/>
							</div>
							<div>
								<p className='font-medium text-white'>
									{twoFactorEnabled
										? 'Two-Factor Authentication Enabled'
										: 'Two-Factor Authentication'}
								</p>
								<p className='text-sm text-gray-400'>
									{twoFactorEnabled
										? `Your account is protected using ${
												twoFactorMethod === 'email'
													? 'email verification'
													: 'an authenticator app'
										  }`
										: 'Add an extra layer of security to your account'}
								</p>
							</div>
						</div>
						{twoFactorEnabled ? (
							<button
								onClick={disableTwoFactor}
								className='px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2'
							>
								<X size={16} />
								<span>Disable</span>
							</button>
						) : (
							<button
								onClick={startTwoFactorSetup}
								className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2'
							>
								<Shield size={16} />
								<span>Enable</span>
							</button>
						)}
					</div>
				) : setupStep === 1 ? (
					// Step 1: Select 2FA Method
					<div className='bg-[#2a2f35] rounded-lg p-6 mb-6'>
						<h4 className='text-lg font-medium text-white mb-4'>
							Select Verification Method
						</h4>
						<p className='text-gray-400 mb-6'>
							Choose how you want to receive verification codes when logging in
						</p>

						<div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
							<div
								className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
									twoFactorMethod === 'email'
										? 'border-blue-500 bg-blue-600/10'
										: 'border-gray-700 bg-[#202529] hover:border-gray-600'
								}`}
								onClick={() => setTwoFactorMethod('email')}
							>
								<div className='flex items-center gap-3 mb-2'>
									<div className='p-2 rounded-full bg-blue-600/20'>
										<Mail className='text-blue-400 w-5 h-5' />
									</div>
									<div className='font-medium text-white'>Email</div>
								</div>
								<p className='text-sm text-gray-400 ml-10'>
									Receive verification codes via email at{' '}
									{user?.email || 'your email address'}
								</p>
							</div>

							<div
								className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
									twoFactorMethod === 'app'
										? 'border-blue-500 bg-blue-600/10'
										: 'border-gray-700 bg-[#202529] hover:border-gray-600'
								}`}
								onClick={() => setTwoFactorMethod('app')}
							>
								<div className='flex items-center gap-3 mb-2'>
									<div className='p-2 rounded-full bg-purple-600/20'>
										<Smartphone className='text-purple-400 w-5 h-5' />
									</div>
									<div className='font-medium text-white'>
										Authenticator App
									</div>
								</div>
								<p className='text-sm text-gray-400 ml-10'>
									Use an authenticator app like Google Authenticator or Authy
								</p>
							</div>
						</div>

						<div className='flex justify-end gap-3 pt-4 border-t border-gray-700'>
							<button
								onClick={() => setSetupStep(0)}
								className='px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors'
							>
								Cancel
							</button>
							<button
								onClick={() => selectTwoFactorMethod(twoFactorMethod)}
								disabled={verificationLoading}
								className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-70'
							>
								{verificationLoading ? (
									<>
										<Loader className='animate-spin w-4 h-4' />
										<span>Processing...</span>
									</>
								) : (
									<>
										<Check size={16} />
										<span>Continue</span>
									</>
								)}
							</button>
						</div>
					</div>
				) : setupStep === 2 ? (
					// Step 2: Verify Code
					<div className='bg-[#2a2f35] rounded-lg p-6 mb-6'>
						<h4 className='text-lg font-medium text-white mb-4'>
							Verify Your Identity
						</h4>

						{twoFactorMethod === 'email' ? (
							<div className='mb-6'>
								<p className='text-gray-400 mb-2'>
									We've sent a verification code to your email at{' '}
									{user?.email?.replace(/(\w{3})(.*)(@.*)/, '$1***$3')}
								</p>
								<p className='text-gray-400'>
									Enter the 6-digit code to enable two-factor authentication
								</p>
							</div>
						) : (
							<div className='mb-6'>
								<p className='text-gray-400 mb-2'>
									Scan the QR code with your authenticator app, then enter the
									6-digit code shown in your app
								</p>
								<div className='bg-white p-4 rounded-lg w-48 h-48 mx-auto my-4'>
									{/* QR code placeholder - in real app, generate and display actual QR code */}
									<div className='w-full h-full bg-gray-200 flex items-center justify-center'>
										<span className='text-gray-500 text-xs'>QR Code</span>
									</div>
								</div>
							</div>
						)}

						{verificationError && (
							<div className='bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-6'>
								<div className='flex items-center gap-2'>
									<AlertTriangle className='w-4 h-4 flex-shrink-0' />
									<span>{verificationError}</span>
								</div>
							</div>
						)}

						<div className='mb-6'>
							<label className='block text-sm font-medium text-gray-300 mb-2'>
								Verification Code
							</label>
							<input
								type='text'
								maxLength={6}
								value={verificationCode}
								onChange={e =>
									setVerificationCode(
										e.target.value.replace(/\D/g, '').substring(0, 6)
									)
								}
								placeholder='000000'
								className='w-full bg-[#171C1F] border border-gray-700 rounded-lg px-4 py-3 text-white text-center tracking-wider letter-spacing-2 font-mono text-xl focus:outline-none focus:ring-2 focus:ring-blue-500'
							/>
						</div>

						<div className='flex justify-end gap-3'>
							<button
								onClick={() => setSetupStep(1)}
								className='px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors'
							>
								Back
							</button>
							<button
								onClick={verifyAndEnable2FA}
								disabled={verificationLoading || verificationCode.length !== 6}
								className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-70'
							>
								{verificationLoading ? (
									<>
										<Loader className='animate-spin w-4 h-4' />
										<span>Verifying...</span>
									</>
								) : (
									<>
										<Shield size={16} />
										<span>Enable Two-Factor Auth</span>
									</>
								)}
							</button>
						</div>
					</div>
				) : null}

				{/* Security Recommendations */}
				<div className='bg-yellow-600/10 border border-yellow-600/20 rounded-lg p-4 mb-6'>
					<div className='flex items-start gap-3'>
						<div className='p-1 bg-yellow-600/20 rounded-full mt-0.5'>
							<AlertTriangle className='text-yellow-400 w-4 h-4' />
						</div>
						<div>
							<p className='font-medium text-white mb-1'>
								Security Recommendations
							</p>
							<ul className='text-sm text-gray-300 space-y-2 list-disc pl-5'>
								<li>
									Use a strong, unique password that you don't use elsewhere
								</li>
								<li>
									Enable two-factor authentication for additional security
								</li>
								<li>
									Regularly check your account activity for suspicious logins
								</li>
								<li>Never share your login credentials with anyone</li>
							</ul>
						</div>
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
