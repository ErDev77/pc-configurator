'use client'
import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/redux/store'
import {
	removeFromCart,
	updateQuantity,
	clearCart,
} from '@/redux/slices/cartSlice'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const Cart = () => {
	const router = useRouter()
	const dispatch = useDispatch()
	const cartItems = useSelector((state: RootState) => state.cart.items)
	const [couponCode, setCouponCode] = useState('')
	const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)
	const [couponDiscount, setCouponDiscount] = useState(0)
	const { t, language } = useLanguage()

	const handleQuantityChange = (configId: number, quantity: number) => {
		dispatch(updateQuantity({ configId, quantity }))
	}

	const handleRemove = (id: number) => {
		dispatch(removeFromCart(id))
	}

	const handleClearCart = () => {
		dispatch(clearCart())
	}

	const handleApplyCoupon = () => {
		setIsApplyingCoupon(true)
		setTimeout(() => {
			if (
				couponCode.toLowerCase() === 'pc10' ||
				couponCode.toLowerCase() === 'welcome'
			) {
				setCouponDiscount(10)
			} else {
				setCouponDiscount(0)
			}
			setIsApplyingCoupon(false)
		}, 1000)
	}

	const subtotal = cartItems.reduce(
		(total, item) => total + item.totalPrice * item.quantity,
		0
	)
	const discount = couponDiscount > 0 ? (subtotal * couponDiscount) / 100 : 0
	const shipping = subtotal > 1000 ? 0 : 49.99
	const tax = subtotal * 0.1 // 10% tax
	const total = subtotal - discount + shipping + tax

	const pluralize = (count: number, language: string, key: string) => {
		if (language === 'ru') {
			const lastDigit = count % 10
			const lastTwoDigits = count % 100

			if (lastDigit === 1 && lastTwoDigits !== 11) {
				return t(`${key}.one`) // товар
			} else if (
				[2, 3, 4].includes(lastDigit) &&
				![12, 13, 14].includes(lastTwoDigits)
			) {
				return t(`${key}.few`) // товара
			} else {
				return t(`${key}.many`) // товаров
			}
		} else {
			// For English and Armenian, simple singular/plural
			return count === 1 ? t(`${key}.one`) : t(`${key}.other`)
		}
	}

	if (cartItems.length === 0) {
		return (
			<>
					<Header />
				<div className='p-6 bg-[#222227] min-h-screen'>
					<h1 className='text-3xl text-white mb-6 font-bold'>
						{t('cart.empty')}
					</h1>
					<div className='flex flex-col items-center justify-center bg-gray-700 rounded-lg py-20 px-6'>
						<div className='w-24 h-24 mb-6'>
							<svg
								xmlns='http://www.w3.org/2000/svg'
								fill='none'
								viewBox='0 0 24 24'
								stroke='currentColor'
								className='w-full h-full text-gray-400'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={1.5}
									d='M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z'
								/>
							</svg>
						</div>
						<h2 className='text-2xl font-medium mb-4 text-white'>
							{t('cart.empty')}
						</h2>
						<p className='text-gray-400 mb-8 text-center max-w-md'>
							{t('cart.emptyDescription', {
								defaultValue:
									"It looks like you haven't added any items to your cart yet.",
							})}
						</p>
						<button
							onClick={() => router.push('/')}
							className='bg-blue-600 hover:bg-blue-700 transition-colors py-3 px-8 rounded-full text-white font-medium'
						>
							{t('cart.startShopping', { defaultValue: 'Start Shopping' })}
						</button>
					</div>
				</div>
				<Footer />
			</>
		)
	}

	return (
		<>
			<Header />
			<div className='p-6 bg-[#222227] min-h-screen'>
				<h1 className='text-3xl text-white mb-6 font-bold'>
					{t('cart.title', { defaultValue: 'Cart' })}
				</h1>
				<div className='flex flex-col lg:flex-row gap-8'>
					{/* Left side - Cart items */}
					<div className='flex-grow'>
						<div className='bg-gray-700 rounded-lg p-6 mb-6'>
							<div className='flex justify-between items-center pb-4 border-b border-gray-600 mb-6'>
								<h2 className='text-xl font-semibold text-white'>
									{t('cart.title')} ({cartItems.length}{' '}
									{pluralize(cartItems.length, language, 'cart.itemPlural')})
								</h2>
								<button
									onClick={handleClearCart}
									className='text-gray-300 hover:text-white text-sm underline'
								>
									{t('cart.clearCart', { defaultValue: 'Clear Cart' })}
								</button>
							</div>

							{cartItems.map(item => (
								<div
									key={item.id}
									className='border-b border-gray-600 pb-6 mb-6 last:mb-0 last:border-0'
								>
									<div className='flex flex-col md:flex-row gap-6'>
										{/* Item image */}
										<div className='w-full md:w-1/4 aspect-square bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center'>
											{item.image_url ? (
												<Image
													src={item.image_url}
													alt={item.name}
													width={200}
													height={200}
													className='object-contain'
												/>
											) : (
												<div className='w-full h-full bg-gray-800 flex items-center justify-center text-gray-500'>
													{t('config.noImageAvailable')}
												</div>
											)}
										</div>

										{/* Item details */}
										<div className='flex-grow'>
											<div className='flex justify-between mb-3'>
												<h3 className='text-xl font-medium text-white'>
													{item.name}
												</h3>
												<div className='text-xl font-semibold text-white'>
													${(item.totalPrice * item.quantity).toFixed(2)}
												</div>
											</div>

											{/* Show components if available */}
											{item.components && item.components.length > 0 && (
												<div className='mb-4'>
													<h4 className='text-sm text-gray-400 mb-2'>
														{t('cart.components', {
															defaultValue: 'Components:',
														})}
													</h4>
													<ul className='list-disc list-inside text-sm text-gray-300'>
														{item.components.map((component, index) => (
															<li key={index}>
																{component.name} - ${component.price.toFixed(2)}
															</li>
														))}
													</ul>
												</div>
											)}

											{/* Actions row */}
											<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4'>
												<div className='flex items-center'>
													<label className='mr-3 text-sm text-gray-300'>
														{t('cart.quantity', { defaultValue: 'Quantity:' })}
													</label>
													<div className='flex items-center'>
														<button
															onClick={() =>
																handleQuantityChange(
																	Number(item.id),
																	Math.max(1, item.quantity - 1)
																)
															}
															className='bg-gray-800 hover:bg-gray-600 w-8 h-8 flex items-center justify-center rounded-l-lg text-white'
														>
															-
														</button>
														<input
															type='number'
															min='1'
															value={item.quantity}
															onChange={e =>
																handleQuantityChange(
																	Number(item.id),
																	parseInt(e.target.value) || 1
																)
															}
															className='bg-gray-800 w-12 h-8 text-center outline-none text-white'
														/>
														<button
															onClick={() =>
																handleQuantityChange(
																	Number(item.id),
																	item.quantity + 1
																)
															}
															className='bg-gray-800 hover:bg-gray-600 w-8 h-8 flex items-center justify-center rounded-r-lg text-white'
														>
															+
														</button>
													</div>
												</div>

												<div className='flex items-center gap-4'>
													<button
														onClick={() => router.push(`/config/${item.id}`)}
														className='text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1'
													>
														<svg
															xmlns='http://www.w3.org/2000/svg'
															width='16'
															height='16'
															fill='none'
															viewBox='0 0 24 24'
															stroke='currentColor'
														>
															<path
																strokeLinecap='round'
																strokeLinejoin='round'
																strokeWidth={2}
																d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z'
															/>
														</svg>
														{t('cart.edit', { defaultValue: 'Edit' })}
													</button>
													<button
														onClick={() => handleRemove(Number(item.id))}
														className='text-red-400 hover:text-red-300 text-sm flex items-center gap-1'
													>
														<svg
															xmlns='http://www.w3.org/2000/svg'
															width='16'
															height='16'
															fill='none'
															viewBox='0 0 24 24'
															stroke='currentColor'
														>
															<path
																strokeLinecap='round'
																strokeLinejoin='round'
																strokeWidth={2}
																d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
															/>
														</svg>
														{t('cart.remove', { defaultValue: 'Remove' })}
													</button>
												</div>
											</div>
										</div>
									</div>
								</div>
							))}
						</div>

						<button
							onClick={() => router.push('/')}
							className='text-blue-400 hover:text-blue-300 flex items-center gap-2'
						>
							<svg
								xmlns='http://www.w3.org/2000/svg'
								width='20'
								height='20'
								fill='none'
								viewBox='0 0 24 24'
								stroke='currentColor'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M10 19l-7-7m0 0l7-7m-7 7h18'
								/>
							</svg>
							{t('cart.continueShopping', {
								defaultValue: 'Continue Shopping',
							})}
						</button>
					</div>

					{/* Right side - Order summary */}
					<div className='w-full lg:w-1/3'>
						<div className='bg-gray-700 rounded-lg p-6 sticky top-24'>
							<h2 className='text-xl font-semibold mb-6 text-white'>
								{t('cart.orderSummary', { defaultValue: 'Order Summary' })}
							</h2>

							<div className='space-y-4 mb-6'>
								<div className='flex justify-between'>
									<span className='text-gray-300'>{t('cart.subtotal')}:</span>
									<span className='text-white'>${subtotal.toFixed(2)}</span>
								</div>

								{couponDiscount > 0 && (
									<div className='flex justify-between text-green-400'>
										<span>
											{t('cart.discount', {
												percentage: couponDiscount.toString(),
												defaultValue: `Discount (${couponDiscount}%)`,
											})}
										</span>
										<span>-${discount.toFixed(2)}</span>
									</div>
								)}

								<div className='flex justify-between'>
									<span className='text-gray-300'>{t('cart.shipping')}:</span>
									<span className='text-white'>
										{shipping === 0
											? t('cart.freeShipping', { defaultValue: 'FREE' })
											: `$${shipping.toFixed(2)}`}
									</span>
								</div>

								<div className='flex justify-between'>
									<span className='text-gray-300'>{t('cart.tax')}:</span>
									<span className='text-white'>${tax.toFixed(2)}</span>
								</div>

								<div className='border-t border-gray-600 pt-4 flex justify-between font-bold text-xl'>
									<span className='text-white'>{t('cart.total')}</span>
									<span className='text-white'>${total.toFixed(2)}</span>
								</div>
							</div>

							{/* Promo code input */}
							<div className='mb-6'>
								<label className='block text-sm text-gray-300 mb-2'>
									{t('cart.promoCode', { defaultValue: 'Promo Code' })}
								</label>
								<div className='flex gap-2'>
									<input
										type='text'
										value={couponCode}
										onChange={e => setCouponCode(e.target.value)}
										placeholder={t('cart.enterCode', {
											defaultValue: 'Enter code',
										})}
										className='flex-grow bg-gray-800 border border-gray-600 rounded-lg py-2 px-4 focus:outline-none focus:border-blue-500 text-white'
									/>
									<button
										onClick={handleApplyCoupon}
										disabled={isApplyingCoupon || !couponCode}
										className={`bg-white text-black font-medium py-2 px-4 rounded-lg ${
											isApplyingCoupon || !couponCode
												? 'opacity-50 cursor-not-allowed'
												: 'hover:bg-gray-200'
										}`}
									>
										{isApplyingCoupon
											? t('cart.applying', { defaultValue: 'Applying...' })
											: t('cart.apply', { defaultValue: 'Apply' })}
									</button>
								</div>
								{couponDiscount > 0 && (
									<p className='text-green-400 text-sm mt-2'>
										{t('cart.couponApplied', {
											defaultValue: 'Coupon successfully applied!',
										})}
									</p>
								)}
							</div>

							<Link
								href='/checkout'
								className='w-full bg-blue-600 hover:bg-blue-700 transition-colors py-3 rounded-lg font-medium text-white flex items-center justify-center'
							>
								{t('cart.checkout')}
							</Link>

							<div className='flex items-center justify-center gap-3 mt-6'>
								<svg
									xmlns='http://www.w3.org/2000/svg'
									width='20'
									height='20'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'
									className='text-gray-300'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
									/>
								</svg>
								<span className='text-sm text-gray-300'>
									{t('cart.secureCheckout', {
										defaultValue: 'Secure Checkout',
									})}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
			<Footer />
		</>
	)
}

export default Cart
