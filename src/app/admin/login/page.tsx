'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const router = useRouter()

	const handleLogin = async () => {
		const res = await fetch('/api/admin/login', {
			method: 'POST',
			body: JSON.stringify({ email, password }),
		})

		if (res.ok) {
			router.push('/admin')
		} else {
			alert('Неверный логин или пароль')
		}
	}

	return (
		<div className='flex h-screen items-center justify-center'>
			<div className='p-6 rounded-xl shadow-md bg-white w-full max-w-sm space-y-4'>
				<h2 className='text-xl font-bold'>Вход в админку</h2>
				<input
					type='email'
					placeholder='Email'
					className='w-full border p-2 rounded'
					value={email}
					onChange={e => setEmail(e.target.value)}
				/>
				<input
					type='password'
					placeholder='Пароль'
					className='w-full border p-2 rounded'
					value={password}
					onChange={e => setPassword(e.target.value)}
				/>
				<button
					onClick={handleLogin}
					className='w-full bg-black text-white p-2 rounded hover:bg-gray-800'
				>
					Войти
				</button>
			</div>
		</div>
	)
}
