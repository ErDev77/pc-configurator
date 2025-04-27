'use client'
import { useAppSelector, useAppDispatch } from '@/redux/hooks/hook'
import { useRouter } from 'next/navigation'
import { toggleCart } from '@/redux/slices/cartSlice'

export default function CartIcon() {
	const cartItems = useAppSelector(state => state.cart.items)
	const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0)
	const dispatch = useAppDispatch()
	const router = useRouter()

	const handleCartClick = () => {
		router.push('/cart' as any)
	}

	return (
		<div className='relative cursor-pointer' onClick={handleCartClick}>
			<svg
				xmlns='http://www.w3.org/2000/svg'
				width='24'
				height='24'
				fill='none'
				viewBox='0 0 24 24'
				stroke='currentColor'
				className='text-white hover:text-[#00b5ed] transition-colors'
			>
				<path
					strokeLinecap='round'
					strokeLinejoin='round'
					strokeWidth={2}
					d='M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z'
				/>
			</svg>

			{itemCount > 0 && (
				<div className='absolute -top-2 -right-2 bg-[#00b5ed] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center'>
					{itemCount > 9 ? '9+' : itemCount}
				</div>
			)}
		</div>
	)
}
