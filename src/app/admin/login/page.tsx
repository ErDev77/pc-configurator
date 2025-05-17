'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import React, { useState, useEffect, Suspense } from 'react'
import { useAuth } from '@/context/AuthContext'
import { User, Lock, Shield, Check, Loader } from 'lucide-react'

// Create a client component that uses useSearchParams
function AdminLoginContent() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [loginSuccess, setLoginSuccess] = useState(false)
	const router = useRouter()
	const searchParams = useSearchParams()
	const { refreshUser } = useAuth()

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
				console.log('Login successful')
				
				// If login is successful, proceed with normal login
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
									Advanced admin dashboard
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
				</div>
			</div>
		</div>
	)
}

// Create a wrapper component that sets up Suspense
export default function AdminLoginPage() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<AdminLoginContent />
		</Suspense>
	)
}
