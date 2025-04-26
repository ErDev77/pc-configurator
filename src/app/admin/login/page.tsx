'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)
	const router = useRouter()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)

		try {
			const res = await fetch('/api/admin/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email, password }),
			})

			if (res.ok) {
				router.push('/admin/dashboard')
			} else {
				const data = await res.json()
				alert(data.error || 'Неверный логин или пароль')
			}
		} catch (error) {
			console.error('Ошибка запроса:', error)
			alert('Ошибка при входе')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className='flex h-screen items-center justify-center'>
			<form
				onSubmit={handleSubmit}
				className='p-6 rounded-xl shadow-md w-full max-w-sm space-y-4'
			>
				<h2 className='text-xl font-bold'>Вход в админку</h2>
				<input
					type='email'
					placeholder='Email'
					className='w-full border p-2 rounded'
					value={email}
					onChange={e => setEmail(e.target.value)}
					required
					autoComplete='email'
				/>
				<input
					type='password'
					placeholder='Пароль'
					className='w-full border p-2 rounded'
					value={password}
					onChange={e => setPassword(e.target.value)}
					required
					autoComplete='current-password'
				/>

				<button
					type='submit'
					disabled={loading}
					className='w-full bg-black text-white p-2 rounded hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed'
				>
					{loading ? 'Входим...' : 'Войти'}
				</button>
			</form>
		</div>
	)
}
