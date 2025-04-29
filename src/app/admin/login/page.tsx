'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { User, Lock, Shield, Check, Loader, InfoIcon } from 'lucide-react'

export default function AdminLoginPage() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [loginSuccess, setLoginSuccess] = useState(false)
	const [step, setStep] = useState('credentials') // 'credentials', '2fa', 'success'
	const [verificationCode, setVerificationCode] = useState('')
	const [twoFactorMethod, setTwoFactorMethod] = useState('email')
	const [debugCode, setDebugCode] = useState('')
	const router = useRouter()
	const searchParams = useSearchParams()
	const { refreshUser } = useAuth()

	// Check if we need to show 2FA step directly (e.g., when redirected by middleware)
	useEffect(() => {
		const require2fa = searchParams?.get('require2fa')
		if (require2fa === 'true') {
			setStep('2fa')
		}
	}, [searchParams])

	// Check for debug code in development mode
	useEffect(() => {
		if (process.env.NODE_ENV !== 'production') {
			const checkForDebugCode = () => {
				const debugCode = document.cookie
					.split('; ')
					.find(row => row.startsWith('dev_2fa_code='))
					?.split('=')[1]

				if (debugCode) {
					setDebugCode(debugCode)
				}
			}

			checkForDebugCode()
			// Check every 2 seconds in case the code gets generated while page is open
			const interval = setInterval(checkForDebugCode, 2000)
			return () => clearInterval(interval)
		}
	}, [])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		setError('')

		try {
			console.log('Submitting login...')
			const res = await fetch('/api/admin/login', {
				method: 'POST',
				body: JSON.stringify({ email, password }),
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				cache: 'no-store',
			})

			if (res.ok) {
				const data = await res.json()
				console.log('Login successful, checking 2FA status...')

				try {
					// Check if 2FA is enabled for this user
					const twoFARes = await fetch('/api/admin/2fa/status', {
						method: 'GET',
						credentials: 'include',
						cache: 'no-store',
						headers: {
							'Cache-Control': 'no-cache',
						},
					})

					if (twoFARes.ok) {
						const twoFAData = await twoFARes.json()

						if (twoFAData.enabled) {
							// If 2FA is enabled, move to the 2FA verification step
							setTwoFactorMethod(twoFAData.method || 'email')
							setStep('2fa')

							// Trigger sending of 2FA code
							try {
								const generateRes = await fetch('/api/admin/2fa/generate', {
									method: 'POST',
									credentials: 'include',
									headers: {
										'Content-Type': 'application/json',
									},
								})

								if (generateRes.ok) {
									const generateData = await generateRes.json()
									if (
										generateData.dev_code &&
										process.env.NODE_ENV !== 'production'
									) {
										setDebugCode(generateData.dev_code)
									}
								} else {
									console.error(
										'Failed to generate 2FA code:',
										await generateRes.text()
									)
								}
							} catch (err) {
								console.error('Error generating 2FA code:', err)
							}

							setLoading(false)
							return
						}
					}
				} catch (err) {
					console.error('Error checking 2FA status:', err)
					// Continue with normal login even if 2FA check fails
				}

				// If 2FA is not enabled or there was an error checking, proceed with normal login
				setLoginSuccess(true)

				// Wait a moment for cookie to be properly set
				setTimeout(async () => {
					try {
						// Double-check auth before redirecting
						const checkRes = await fetch('/api/admin/me', {
							method: 'GET',
							credentials: 'include',
							cache: 'no-store',
							headers: {
								'Cache-Control': 'no-cache',
							},
						})

						if (checkRes.ok) {
							// Update the authentication context
							console.log(
								'Authentication verified, refreshing user and redirecting...'
							)
							await refreshUser()

							// Get the redirect destination if any
							const from = searchParams?.get('from') || '/admin/dashboard'

							// Use replace instead of push for cleaner navigation
							router.replace(from)
						} else {
							console.log('Authentication check failed:', await checkRes.text())
							setError('Authentication failed. Please try again.')
							setLoginSuccess(false)
						}
					} catch (err) {
						console.error('Auth check error:', err)
						setError('Authentication failed. Please try again.')
						setLoginSuccess(false)
					} finally {
						setLoading(false)
					}
				}, 500)
			} else {
				const data = await res.json()
				console.log('Login failed:', data)
				setError(data.error || 'Login failed')
				setLoading(false)
			}
		} catch (err) {
			console.error('Login error:', err)
			setError('An unexpected error occurred')
			setLoading(false)
		}
	}

	const handleVerifyCode = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		setError('')

		try {
			const res = await fetch('/api/admin/2fa/verify', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ code: verificationCode }),
				credentials: 'include',
			})

			if (res.ok) {
				setStep('success')
				setLoginSuccess(true)

				// Wait a moment to show success message before redirecting
				setTimeout(async () => {
					await refreshUser()
					// Get the redirect destination if any
					const from = searchParams?.get('from') || '/admin/dashboard'
					router.replace(from)
				}, 1000)
			} else {
				const data = await res.json()
				setError(data.error || 'Invalid verification code')
			}
		} catch (err) {
			console.error('Verification error:', err)
			setError('An unexpected error occurred')
		} finally {
			setLoading(false)
		}
	}

	// Handle resending the verification code
	const handleResendCode = async () => {
		setLoading(true)
		setError('')

		try {
			const generateRes = await fetch('/api/admin/2fa/generate', {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
				},
			})

			if (generateRes.ok) {
				const generateData = await generateRes.json()
				if (generateData.dev_code && process.env.NODE_ENV !== 'production') {
					setDebugCode(generateData.dev_code)
				}
				setError('') // Clear any previous errors
			} else {
				const data = await generateRes.json()
				setError(data.error || 'Failed to resend code')
			}
		} catch (err) {
			console.error('Error resending code:', err)
			setError('Failed to resend code')
		} finally {
			setLoading(false)
		}
	}

	if (loading) {
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
		<div className='flex min-h-screen bg-gradient-to-br from-[#171C1F] to-[#0F1215]'>
			{/* Left panel with image/illustration */}
			<div className='hidden lg:flex lg:w-1/2 bg-[#0C6FFC]/10 items-center justify-center p-12'>
				<div className='max-w-md text-center'>
					<div className='mb-8 flex justify-center'>
						<div className='relative w-20 h-20'>
							<div className='absolute inset-0 bg-blue-600 rounded-xl rotate-6'></div>
							<div className='absolute inset-0 bg-[#0C6FFC] rounded-xl flex items-center justify-center'>
								<Shield className='text-white w-10 h-10' />
							</div>
						</div>
					</div>
					<h1 className='text-3xl font-bold text-white mb-4'>
						PC Admin Dashboard
					</h1>
					<p className='text-gray-400 mb-8'>
						Manage your store, track orders, and update product inventory with
						our powerful admin interface.
					</p>
					<div className='bg-gradient-to-r from-[#0C6FFC]/20 to-[#0C6FFC]/5 p-6 rounded-xl'>
						<div className='flex items-center gap-4 mb-6'>
							<div className='w-12 h-12 bg-[#0C6FFC]/30 rounded-lg flex items-center justify-center'>
								<Shield className='text-[#0C6FFC] w-6 h-6' />
							</div>
							<div className='text-left'>
								<h3 className='text-white font-medium'>Secure Admin Area</h3>
								<p className='text-gray-400 text-sm'>
									Enhanced with two-factor authentication
								</p>
							</div>
						</div>

						<ul className='space-y-3 text-left'>
							<li className='flex items-center gap-2'>
								<div className='w-5 h-5 rounded-full bg-[#0C6FFC]/20 flex items-center justify-center'>
									<Check className='text-[#0C6FFC] w-3 h-3' />
								</div>
								<span className='text-gray-300 text-sm'>
									Real-time order tracking
								</span>
							</li>
							<li className='flex items-center gap-2'>
								<div className='w-5 h-5 rounded-full bg-[#0C6FFC]/20 flex items-center justify-center'>
									<Check className='text-[#0C6FFC] w-3 h-3' />
								</div>
								<span className='text-gray-300 text-sm'>
									Inventory management
								</span>
							</li>
							<li className='flex items-center gap-2'>
								<div className='w-5 h-5 rounded-full bg-[#0C6FFC]/20 flex items-center justify-center'>
									<Check className='text-[#0C6FFC] w-3 h-3' />
								</div>
								<span className='text-gray-300 text-sm'>
									Revenue & sales analytics
								</span>
							</li>
							<li className='flex items-center gap-2'>
								<div className='w-5 h-5 rounded-full bg-[#0C6FFC]/20 flex items-center justify-center'>
									<Check className='text-[#0C6FFC] w-3 h-3' />
								</div>
								<span className='text-gray-300 text-sm'>
									Customer data protection
								</span>
							</li>
						</ul>
					</div>
				</div>
			</div>

			{/* Right panel with login form */}
			<div className='w-full lg:w-1/2 flex items-center justify-center p-8'>
				<div className='w-full max-w-md'>
					{/* Step 1: Credentials */}
					{step === 'credentials' && (
						<div className='bg-[#202529] rounded-2xl shadow-2xl p-8 border border-gray-700/50'>
							<div className='mb-8 text-center'>
								<div className='inline-block p-3 bg-blue-600/10 rounded-xl mb-4'>
									<Lock className='text-blue-500 w-8 h-8' />
								</div>
								<h2 className='text-2xl font-bold text-white'>Admin Login</h2>
								<p className='text-gray-400 mt-2'>
									Enter your credentials to access the admin panel
								</p>
							</div>

							{error && (
								<div className='bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg text-sm mb-6'>
									<div className='flex items-center gap-2'>
										<div className='p-1 bg-red-500/20 rounded-full'>
											<Shield className='text-red-400 w-4 h-4' />
										</div>
										<span>{error}</span>
									</div>
								</div>
							)}

							<form onSubmit={handleSubmit} className='space-y-6'>
								<div>
									<label className='block text-sm font-medium text-gray-300 mb-2'>
										Email
									</label>
									<div className='relative'>
										<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
											<User className='text-gray-500 w-5 h-5' />
										</div>
										<input
											type='email'
											placeholder='admin@example.com'
											className='bg-[#2a2f35] w-full pl-10 pr-4 py-3 rounded-lg text-white placeholder-gray-500 border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
											value={email}
											onChange={e => setEmail(e.target.value)}
											required
											autoComplete='email'
										/>
									</div>
								</div>

								<div>
									<div className='flex items-center justify-between mb-2'>
										<label className='block text-sm font-medium text-gray-300'>
											Password
										</label>
										<a
											href='#'
											className='text-sm text-blue-400 hover:text-blue-300'
										>
											Forgot password?
										</a>
									</div>
									<div className='relative'>
										<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
											<Lock className='text-gray-500 w-5 h-5' />
										</div>
										<input
											type='password'
											placeholder='••••••••'
											className='bg-[#2a2f35] w-full pl-10 pr-4 py-3 rounded-lg text-white placeholder-gray-500 border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
											value={password}
											onChange={e => setPassword(e.target.value)}
											required
											autoComplete='current-password'
										/>
									</div>
								</div>

								<button
									type='submit'
									disabled={loading || loginSuccess}
									className='w-full bg-[#0C6FFC] hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#202529] transition-colors disabled:opacity-70 disabled:hover:bg-[#0C6FFC]'
								>
									{loading ? (
										<>
											<Loader className='animate-spin w-5 h-5' />
											<span>Authenticating...</span>
										</>
									) : loginSuccess ? (
										<>
											<Check className='w-5 h-5' />
											<span>Success! Redirecting...</span>
										</>
									) : (
										<>
											<Lock className='w-5 h-5' />
											<span>Sign In</span>
										</>
									)}
								</button>
							</form>
						</div>
					)}

					{/* Step 2: Two-Factor Authentication */}
					{step === '2fa' && (
						<div className='bg-[#202529] rounded-2xl shadow-2xl p-8 border border-gray-700/50'>
							<div className='mb-8 text-center'>
								<div className='inline-block p-3 bg-blue-600/10 rounded-xl mb-4'>
									<Shield className='text-blue-500 w-8 h-8' />
								</div>
								<h2 className='text-2xl font-bold text-white'>
									Two-Factor Authentication
								</h2>
								<p className='text-gray-400 mt-2'>
									{twoFactorMethod === 'email'
										? `Enter the verification code sent to ${email.replace(
												/(\w{3})(.*)(@.*)/,
												'$1***$3'
										  )}`
										: 'Enter the verification code from your authenticator app'}
								</p>
							</div>

							{error && (
								<div className='bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg text-sm mb-6'>
									<div className='flex items-center gap-2'>
										<div className='p-1 bg-red-500/20 rounded-full'>
											<Shield className='text-red-400 w-4 h-4' />
										</div>
										<span>{error}</span>
									</div>
								</div>
							)}

							{/* Show debug code in development mode */}
							{process.env.NODE_ENV !== 'production' && debugCode && (
								<div className='bg-blue-500/10 border border-blue-500/20 text-blue-400 p-4 rounded-lg text-sm mb-6'>
									<div className='flex items-center gap-2'>
										<div className='p-1 bg-blue-500/20 rounded-full'>
											<InfoIcon className='text-blue-400 w-4 h-4' />
										</div>
										<span>
											Development mode: Use code <strong>{debugCode}</strong>
										</span>
									</div>
								</div>
							)}

							<form onSubmit={handleVerifyCode} className='space-y-6'>
								<div>
									<label className='block text-sm font-medium text-gray-300 mb-4 text-center'>
										Verification Code
									</label>
									<div className='flex justify-center gap-2'>
										<input
											type='text'
											value={verificationCode}
											onChange={e => {
												// Only allow numbers and limit to 6 digits
												const value = e.target.value
													.replace(/\D/g, '')
													.substring(0, 6)
												setVerificationCode(value)
											}}
											className='bg-[#2a2f35] w-full py-4 text-center text-2xl rounded-lg text-white border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none tracking-wider letter-spacing-2 font-mono'
											placeholder='000000'
											autoComplete='one-time-code'
											required
										/>
									</div>
								</div>

								<button
									type='submit'
									disabled={loading || verificationCode.length < 6}
									className='w-full bg-[#0C6FFC] hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#202529] transition-colors disabled:opacity-70 disabled:hover:bg-[#0C6FFC]'
								>
									{loading ? (
										<>
											<Loader className='animate-spin w-5 h-5' />
											<span>Verifying...</span>
										</>
									) : (
										<>
											<Check className='w-5 h-5' />
											<span>Verify & Sign In</span>
										</>
									)}
								</button>

								<div className='text-center mt-4'>
									<button
										type='button'
										onClick={handleResendCode}
										disabled={loading}
										className='text-blue-400 text-sm hover:text-blue-300 focus:outline-none disabled:opacity-50'
									>
										{loading ? 'Sending...' : "Didn't receive a code? Resend"}
									</button>
								</div>
							</form>
						</div>
					)}

					{/* Step 3: Success */}
					{step === 'success' && (
						<div className='bg-[#202529] rounded-2xl shadow-2xl p-8 border border-gray-700/50 text-center'>
							<div className='mb-6 inline-flex items-center justify-center w-16 h-16 bg-green-600/20 rounded-full'>
								<Check className='text-green-500 w-8 h-8' />
							</div>
							<h2 className='text-2xl font-bold text-white mb-2'>
								Authentication Successful
							</h2>
							<p className='text-gray-400 mb-8'>
								You are being redirected to the admin dashboard...
							</p>
							<div className='animate-pulse'>
								<Loader className='inline-block w-6 h-6 text-blue-500 animate-spin' />
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
