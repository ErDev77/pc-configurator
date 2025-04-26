'use client'

import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/redux/store'
import { clearCart } from '@/redux/slices/cartSlice'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'

const Checkout = () => {
	const cartItems = useSelector((state: RootState) => state.cart.items)
	const dispatch = useDispatch()
	const router = useRouter()

	const calculateTotal = () => {
		return cartItems.reduce(
			(total, item) => total + item.price * item.quantity,
			0
		)
	}

	const handleCheckout = async () => {
		

		try {
			// Пример отправки данных на сервер
			const response = await fetch('/api/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ items: cartItems, total: calculateTotal() }),
			})

			if (response.ok) {
				dispatch(clearCart()) // Очищаем корзину
				toast.success('Заказ успешно оформлен!')
				router.push('/thank-you') // Перенаправляем на страницу подтверждения
			} else {
				throw new Error('Ошибка оформления заказа')
			}
		} catch (error) {
			toast.error((error instanceof Error ? error.message : 'Что-то пошло не так'))
		}
	}

	return (
		<div className='p-6 bg-[#171C1F] min-h-screen'>
			<h1 className='text-3xl text-white mb-6 font-bold'>Оформление заказа</h1>
			<div>
				<ul className='space-y-4'>
					{cartItems.map(item => (
						<li key={item.id} className='bg-gray-700 p-4 rounded'>
							<div className='flex justify-between items-center'>
								<div>
									<img
										src={item.image_url}
										alt={item.name}
										width={50}
										height={50}
									/>
									<span className='text-white ml-4'>{item.name}</span>
									<span className='text-white ml-4'>× {item.quantity}</span>
								</div>
								<div>
									<span className='text-white'>
										{item.price * item.quantity}$
									</span>
								</div>
							</div>
						</li>
					))}
				</ul>

				<div className='mt-6 text-white text-xl'>
					<strong>Итого: </strong>
					{calculateTotal()}$
				</div>

				<button
					onClick={handleCheckout}
					className='bg-green-600 text-white p-3 rounded mt-4 w-full'
				>
					Оформить заказ
				</button>
			</div>
		</div>
	)
}

export default Checkout
