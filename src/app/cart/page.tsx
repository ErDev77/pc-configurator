'use client'

import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/redux/store'
import { removeFromCart, clearCart } from '@/redux/slices/cartSlice'
import Link from 'next/link'

const Cart = () => {
	const cartItems = useSelector((state: RootState) => state.cart.items)
	const dispatch = useDispatch()

	const calculateTotal = () => {
		return cartItems.reduce(
			(total, item) => total + item.price * item.quantity,
			0
		)
	}

	const handleRemove = (id: number) => {
		dispatch(removeFromCart(id))
	}

	const handleClearCart = () => {
		dispatch(clearCart())
	}

	return (
		<div className='p-6 bg-[#171C1F] min-h-screen'>
			<h1 className='text-3xl text-white mb-6 font-bold'>Корзина</h1>
			{cartItems.length === 0 ? (
				<p className='text-white'>Ваша корзина пуста.</p>
			) : (
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
										<button
											className='bg-red-600 text-white p-2 rounded ml-4'
											onClick={() => handleRemove(item.id)}
										>
											Удалить
										</button>
									</div>
								</div>
							</li>
						))}
					</ul>

					<div className='mt-6 flex justify-between items-center'>
						<button
							onClick={handleClearCart}
							className='bg-red-600 text-white p-2 rounded'
						>
							Очистить корзину
						</button>
						<div className='text-white text-xl'>
							<strong>Итого: </strong>
							{calculateTotal()}$
						</div>
						<Link
							href='/checkout'
							className='bg-blue-600 text-white p-3 rounded'
						>
							Перейти к оформлению
						</Link>
					</div>
				</div>
			)}
		</div>
	)
}

export default Cart
