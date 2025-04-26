"use client"

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
export default function AdminLoginPage() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [loginSuccess, setLoginSuccess] = useState(false)
	const router = useRouter()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		const res = await fetch('/api/admin/login', {
			method: 'POST',
			body: JSON.stringify({ email, password }),
			headers: {
				'Content-Type': 'application/json',
			},
		})

		if (res.ok) {
			// ✅ Успешный логин — редирект на dashboard
			router.push('/admin/dashboard')
		} else {
			const data = await res.json()
			setError(data.error || 'Login failed')
		}
	}


	return (
		<div className='flex h-screen items-center justify-center bg-[#171C1F]'>
			<form
				onSubmit={handleSubmit}
				className='p-6 rounded-xl shadow-md w-full max-w-sm space-y-4 bg-[#202529]'
			>
				<h2 className='text-xl font-bold text-white'>Вход в админ-панель</h2>

				{error && (
					<div className='bg-red-500 text-white p-2 rounded text-center'>
						{error}
					</div>
				)}

				{loginSuccess && (
					<div className='bg-green-500 text-white p-2 rounded text-center'>
						Успешный вход! Перенаправление...
					</div>
				)}

				<input
					type='email'
					placeholder='Email'
					className='w-full border p-2 rounded bg-gray-600 text-white'
					value={email}
					onChange={e => setEmail(e.target.value)}
					required
					autoComplete='email'
				/>
				<input
					type='password'
					placeholder='Пароль'
					className='w-full border p-2 rounded bg-gray-600 text-white'
					value={password}
					onChange={e => setPassword(e.target.value)}
					required
					autoComplete='current-password'
				/>

				<button
					type='submit'
					disabled={loading || loginSuccess}
					className='w-full bg-[#0C6FFC] text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed'
				>
					{loading ? 'Входим...' : loginSuccess ? 'Успешный вход!' : 'Войти'}
				</button>
			</form>
		</div>
	)
}
