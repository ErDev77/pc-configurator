'use client'
import React, { useState } from 'react'
import { useAppSelector, useAppDispatch } from '@/redux/hooks/hook'
import { clearCart } from '@/redux/slices/cartSlice'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { toast } from 'react-toastify'

// Form field type
interface FormField {
	value: string
	error: string
	touched: boolean
}

export default function CheckoutPage() {
	const router = useRouter()
	const dispatch = useAppDispatch()
	const cartItems = useAppSelector(state => state.cart.items)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [orderPlaced, setOrderPlaced] = useState(false)
	const [orderNumber, setOrderNumber] = useState('')
	const [notificationPreferences, setNotificationPreferences] = useState({
		email: true,
		telegram: true,
	})

	// Form state
	const [form, setForm] = useState({
		firstName: { value: '', error: '', touched: false } as FormField,
		lastName: { value: '', error: '', touched: false } as FormField,
		email: { value: '', error: '', touched: false } as FormField,
		phone: { value: '', error: '', touched: false } as FormField,
		address: { value: '', error: '', touched: false } as FormField,
		city: { value: '', error: '', touched: false } as FormField,
		state: { value: '', error: '', touched: false } as FormField,
		zipCode: { value: '', error: '', touched: false } as FormField,
		country: { value: 'USA', error: '', touched: false } as FormField,
		cardNumber: { value: '', error: '', touched: false } as FormField,
		cardName: { value: '', error: '', touched: false } as FormField,
		expiryDate: { value: '', error: '', touched: false } as FormField,
		cvv: { value: '', error: '', touched: false } as FormField,
	})

	// Payment method state
	const [paymentMethod, setPaymentMethod] = useState('credit-card')

	// Calculate totals from cart
	const subtotal = cartItems.reduce(
		(sum, item) => sum + item.totalPrice * item.quantity,
		0
	)
	const shipping = subtotal > 1000 ? 0 : 49.99
	const tax = subtotal * 0.07
	const total = subtotal + shipping + tax

	// Handle input change
	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = e.target

		// Validate field
		let error = ''
		if (!value.trim()) {
			error = 'This field is required'
		} else if (name === 'email' && !/\S+@\S+\.\S+/.test(value)) {
			error = 'Please enter a valid email'
		} else if (name === 'phone' && !/^\d{10}$/.test(value.replace(/\D/g, ''))) {
			error = 'Please enter a valid 10-digit phone number'
		} else if (name === 'zipCode' && !/^\d{5}(-\d{4})?$/.test(value)) {
			error = 'Please enter a valid zip code'
		} else if (
			name === 'cardNumber' &&
			!/^\d{16}$/.test(value.replace(/\s/g, ''))
		) {
			error = 'Please enter a valid 16-digit card number'
		} else if (name === 'cvv' && !/^\d{3,4}$/.test(value)) {
			error = 'Please enter a valid CVV'
		}

		setForm(prev => ({
			...prev,
			[name]: {
				value,
				error,
				touched: true,
			},
		}))
	}

	// Handle notification preference changes
	const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, checked } = e.target
		setNotificationPreferences(prev => ({
			...prev,
			[name]: checked,
		}))
	}

	// Handle field blur
	const handleBlur = (
		e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name } = e.target

		setForm(prev => ({
			...prev,
			[name]: {
				...prev[name as keyof typeof prev],
				touched: true,
			},
		}))
	}

	// Validate all form fields
	const validateForm = () => {
		let isValid = true
		const newForm = { ...form }

		// Check each field
		Object.entries(form).forEach(([key, field]) => {
			if (!field.value.trim()) {
				newForm[key as keyof typeof form] = {
					...field,
					error: 'This field is required',
					touched: true,
				}
				isValid = false
			}
		})

		// Additional validations for specific fields
		if (newForm.email.value && !/\S+@\S+\.\S+/.test(newForm.email.value)) {
			newForm.email.error = 'Please enter a valid email'
			isValid = false
		}

		if (
			newForm.phone.value &&
			!/^\d{10}$/.test(newForm.phone.value.replace(/\D/g, ''))
		) {
			newForm.phone.error = 'Please enter a valid 10-digit phone number'
			isValid = false
		}

		if (
			newForm.zipCode.value &&
			!/^\d{5}(-\d{4})?$/.test(newForm.zipCode.value)
		) {
			newForm.zipCode.error = 'Please enter a valid zip code'
			isValid = false
		}

		if (paymentMethod === 'credit-card') {
			if (
				newForm.cardNumber.value &&
				!/^\d{16}$/.test(newForm.cardNumber.value.replace(/\s/g, ''))
			) {
				newForm.cardNumber.error = 'Please enter a valid 16-digit card number'
				isValid = false
			}

			if (newForm.cvv.value && !/^\d{3,4}$/.test(newForm.cvv.value)) {
				newForm.cvv.error = 'Please enter a valid CVV'
				isValid = false
			}
		}

		setForm(newForm)
		return isValid
	}

	// Handle form submission
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!validateForm()) {
			return
		}

		setIsSubmitting(true)

		try {
			// Generate random order number
			const generatedOrderNumber = `PC-${Math.floor(Math.random() * 1000000)}`

			// Create order object with all details
			const orderData = {
				orderNumber: generatedOrderNumber,
				customer: {
					firstName: form.firstName.value,
					lastName: form.lastName.value,
					email: form.email.value,
					phone: form.phone.value,
				},
				shipping: {
					address: form.address.value,
					city: form.city.value,
					state: form.state.value,
					zipCode: form.zipCode.value,
					country: form.country.value,
				},
				payment: {
					method: paymentMethod,
					cardDetails:
						paymentMethod === 'credit-card'
							? {
									cardNumber: form.cardNumber.value.slice(-4), // Only store last 4 digits for security
									cardName: form.cardName.value,
									expiryDate: form.expiryDate.value,
							  }
							: null,
				},
				items: cartItems,
				totals: {
					subtotal,
					shipping,
					tax,
					total,
				},
				notifications: notificationPreferences,
				orderedAt: new Date().toISOString(),
			}

			// Send order data to backend - UNIFIED ENDPOINT
			const response = await fetch('/api/checkout/process-order', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(orderData),
			})

			if (!response.ok) {
				throw new Error('Failed to place order')
			}

			const data = await response.json()

			// On success, clear cart and show success message
			dispatch(clearCart())
			setOrderNumber(data.orderNumber || generatedOrderNumber)
			setOrderPlaced(true)

			// Show notification status
			if (data.notifications) {
				if (data.notifications.email) {
					toast.success('Order confirmation email sent')
				}
				if (data.notifications.telegram) {
					toast.success('Order notification sent to shop')
				}
			}
		} catch (error) {
			console.error('Checkout error:', error)
			toast.error('There was an error processing your order. Please try again.')
		} finally {
			setIsSubmitting(false)
		}
	}

	// If cart is empty, redirect to cart page
	if (cartItems.length === 0 && !orderPlaced) {
		return (
			<>
				<Header />
				<div className='min-h-screen bg-[#1C1C24] text-white pt-12 pb-32 flex items-center justify-center'>
					<div className='text-center'>
						<h1 className='text-2xl font-bold mb-4'>Your cart is empty</h1>
						<p className='text-gray-400 mb-8'>
							Add some items to your cart before proceeding to checkout.
						</p>
						<button
							onClick={() => router.push('/')}
							className='bg-[#00b5ed] hover:bg-[#00a1d4] transition-colors py-3 px-8 rounded-full text-white font-medium'
						>
							Start Shopping
						</button>
					</div>
				</div>
			</>
		)
	}

	// Order success page
	if (orderPlaced) {
		return (
			<>
				<Header />
				<div className='min-h-screen bg-[#1C1C24] text-white pt-12 pb-32'>
					<div className='max-w-3xl mx-auto px-4'>
						<div className='bg-[#222227] rounded-lg p-8 text-center'>
							<div className='w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6'>
								<svg
									xmlns='http://www.w3.org/2000/svg'
									width='40'
									height='40'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M5 13l4 4L19 7'
									/>
								</svg>
							</div>

							<h1 className='text-3xl font-bold mb-4'>
								Order Placed Successfully!
							</h1>
							<p className='text-gray-400 mb-6'>
								Thank you for your order. We've sent a confirmation email to{' '}
								{form.email.value}.
							</p>

							<div className='bg-[#2E2E35] p-4 rounded-lg mb-8'>
								<p className='text-lg mb-2'>
									Order Number: <span className='font-bold'>{orderNumber}</span>
								</p>
								<p className='text-gray-400'>
									Please save this number for reference.
								</p>
							</div>

							<div className='flex flex-col sm:flex-row gap-4 justify-center'>
								<button
									onClick={() => router.push('/')}
									className='bg-[#00b5ed] hover:bg-[#00a1d4] transition-colors py-3 px-8 rounded-full text-white font-medium'
								>
									Continue Shopping
								</button>
							</div>
						</div>
					</div>
				</div>
			</>
		)
	}

	return (
		<>
			<Header />
			<div className='min-h-screen bg-[#1C1C24] text-white pt-12 pb-32'>
				<div className='max-w-6xl mx-auto px-4'>
					<h1 className='text-4xl font-bold mb-12'>Checkout</h1>

					<div className='flex flex-col lg:flex-row gap-8'>
						{/* Left side - Form */}
						<div className='flex-grow'>
							<form onSubmit={handleSubmit}>
								{/* Customer information */}
								<div className='bg-[#222227] rounded-lg p-6 mb-8'>
									<h2 className='text-xl font-semibold mb-6'>
										Customer Information
									</h2>

									<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
										{/* First Name */}
										<div>
											<label className='block text-sm text-gray-400 mb-2'>
												First Name *
											</label>
											<input
												type='text'
												name='firstName'
												value={form.firstName.value}
												onChange={handleChange}
												onBlur={handleBlur}
												className={`w-full bg-[#2E2E35] border ${
													form.firstName.error && form.firstName.touched
														? 'border-red-500'
														: 'border-gray-700'
												} rounded-lg py-3 px-4 focus:outline-none focus:border-[#00b5ed]`}
											/>
											{form.firstName.error && form.firstName.touched && (
												<p className='text-red-500 text-sm mt-1'>
													{form.firstName.error}
												</p>
											)}
										</div>

										{/* Last Name */}
										<div>
											<label className='block text-sm text-gray-400 mb-2'>
												Last Name *
											</label>
											<input
												type='text'
												name='lastName'
												value={form.lastName.value}
												onChange={handleChange}
												onBlur={handleBlur}
												className={`w-full bg-[#2E2E35] border ${
													form.lastName.error && form.lastName.touched
														? 'border-red-500'
														: 'border-gray-700'
												} rounded-lg py-3 px-4 focus:outline-none focus:border-[#00b5ed]`}
											/>
											{form.lastName.error && form.lastName.touched && (
												<p className='text-red-500 text-sm mt-1'>
													{form.lastName.error}
												</p>
											)}
										</div>

										{/* Email */}
										<div>
											<label className='block text-sm text-gray-400 mb-2'>
												Email Address *
											</label>
											<input
												type='email'
												name='email'
												value={form.email.value}
												onChange={handleChange}
												onBlur={handleBlur}
												className={`w-full bg-[#2E2E35] border ${
													form.email.error && form.email.touched
														? 'border-red-500'
														: 'border-gray-700'
												} rounded-lg py-3 px-4 focus:outline-none focus:border-[#00b5ed]`}
											/>
											{form.email.error && form.email.touched && (
												<p className='text-red-500 text-sm mt-1'>
													{form.email.error}
												</p>
											)}
										</div>

										{/* Phone */}
										<div>
											<label className='block text-sm text-gray-400 mb-2'>
												Phone Number *
											</label>
											<input
												type='tel'
												name='phone'
												value={form.phone.value}
												onChange={handleChange}
												onBlur={handleBlur}
												className={`w-full bg-[#2E2E35] border ${
													form.phone.error && form.phone.touched
														? 'border-red-500'
														: 'border-gray-700'
												} rounded-lg py-3 px-4 focus:outline-none focus:border-[#00b5ed]`}
												placeholder='(123) 456-7890'
											/>
											{form.phone.error && form.phone.touched && (
												<p className='text-red-500 text-sm mt-1'>
													{form.phone.error}
												</p>
											)}
										</div>
									</div>
								</div>

								{/* Shipping Address */}
								<div className='bg-[#222227] rounded-lg p-6 mb-8'>
									<h2 className='text-xl font-semibold mb-6'>
										Shipping Address
									</h2>

									<div className='grid grid-cols-1 gap-6'>
										{/* Street Address */}
										<div>
											<label className='block text-sm text-gray-400 mb-2'>
												Street Address *
											</label>
											<input
												type='text'
												name='address'
												value={form.address.value}
												onChange={handleChange}
												onBlur={handleBlur}
												className={`w-full bg-[#2E2E35] border ${
													form.address.error && form.address.touched
														? 'border-red-500'
														: 'border-gray-700'
												} rounded-lg py-3 px-4 focus:outline-none focus:border-[#00b5ed]`}
											/>
											{form.address.error && form.address.touched && (
												<p className='text-red-500 text-sm mt-1'>
													{form.address.error}
												</p>
											)}
										</div>

										<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
											{/* City */}
											<div>
												<label className='block text-sm text-gray-400 mb-2'>
													City *
												</label>
												<input
													type='text'
													name='city'
													value={form.city.value}
													onChange={handleChange}
													onBlur={handleBlur}
													className={`w-full bg-[#2E2E35] border ${
														form.city.error && form.city.touched
															? 'border-red-500'
															: 'border-gray-700'
													} rounded-lg py-3 px-4 focus:outline-none focus:border-[#00b5ed]`}
												/>
												{form.city.error && form.city.touched && (
													<p className='text-red-500 text-sm mt-1'>
														{form.city.error}
													</p>
												)}
											</div>

											{/* State */}
											<div>
												<label className='block text-sm text-gray-400 mb-2'>
													State *
												</label>
												<input
													type='text'
													name='state'
													value={form.state.value}
													onChange={handleChange}
													onBlur={handleBlur}
													className={`w-full bg-[#2E2E35] border ${
														form.state.error && form.state.touched
															? 'border-red-500'
															: 'border-gray-700'
													} rounded-lg py-3 px-4 focus:outline-none focus:border-[#00b5ed]`}
												/>
												{form.state.error && form.state.touched && (
													<p className='text-red-500 text-sm mt-1'>
														{form.state.error}
													</p>
												)}
											</div>

											{/* Zip Code */}
											<div>
												<label className='block text-sm text-gray-400 mb-2'>
													Zip Code *
												</label>
												<input
													type='text'
													name='zipCode'
													value={form.zipCode.value}
													onChange={handleChange}
													onBlur={handleBlur}
													className={`w-full bg-[#2E2E35] border ${
														form.zipCode.error && form.zipCode.touched
															? 'border-red-500'
															: 'border-gray-700'
													} rounded-lg py-3 px-4 focus:outline-none focus:border-[#00b5ed]`}
												/>
												{form.zipCode.error && form.zipCode.touched && (
													<p className='text-red-500 text-sm mt-1'>
														{form.zipCode.error}
													</p>
												)}
											</div>
										</div>

										{/* Country */}
										<div>
											<label className='block text-sm text-gray-400 mb-2'>
												Country *
											</label>
											<select
												name='country'
												value={form.country.value}
												onChange={handleChange}
												onBlur={handleBlur}
												className='w-full bg-[#2E2E35] border border-gray-700 rounded-lg py-3 px-4 focus:outline-none focus:border-[#00b5ed]'
											>
												<option value='USA'>United States</option>
												<option value='CAN'>Canada</option>
												<option value='MEX'>Mexico</option>
												<option value='GBR'>United Kingdom</option>
												<option value='AUS'>Australia</option>
											</select>
										</div>
									</div>
								</div>

								{/* Payment Method */}
								<div className='bg-[#222227] rounded-lg p-6 mb-8'>
									<h2 className='text-xl font-semibold mb-6'>Payment Method</h2>

									<div className='flex flex-wrap gap-4 mb-6'>
										<div
											className={`flex items-center gap-3 px-5 py-3 border ${
												paymentMethod === 'credit-card'
													? 'border-[#00b5ed] bg-[#2E2E35]'
													: 'border-gray-700 bg-transparent'
											} rounded-lg cursor-pointer`}
											onClick={() => setPaymentMethod('credit-card')}
										>
											<input
												type='radio'
												name='paymentMethod'
												checked={paymentMethod === 'credit-card'}
												onChange={() => setPaymentMethod('credit-card')}
												className='accent-[#00b5ed]'
											/>
											<span>Credit Card</span>
										</div>

										<div
											className={`flex items-center gap-3 px-5 py-3 border ${
												paymentMethod === 'paypal'
													? 'border-[#00b5ed] bg-[#2E2E35]'
													: 'border-gray-700 bg-transparent'
											} rounded-lg cursor-pointer`}
											onClick={() => setPaymentMethod('paypal')}
										>
											<input
												type='radio'
												name='paymentMethod'
												checked={paymentMethod === 'paypal'}
												onChange={() => setPaymentMethod('paypal')}
												className='accent-[#00b5ed]'
											/>
											<span>PayPal</span>
										</div>
									</div>

									{paymentMethod === 'credit-card' && (
										<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
											{/* Card Number */}
											<div className='md:col-span-2'>
												<label className='block text-sm text-gray-400 mb-2'>
													Card Number *
												</label>
												<input
													type='text'
													name='cardNumber'
													value={form.cardNumber.value}
													onChange={handleChange}
													onBlur={handleBlur}
													className={`w-full bg-[#2E2E35] border ${
														form.cardNumber.error && form.cardNumber.touched
															? 'border-red-500'
															: 'border-gray-700'
													} rounded-lg py-3 px-4 focus:outline-none focus:border-[#00b5ed]`}
													placeholder='1234 5678 9012 3456'
												/>
												{form.cardNumber.error && form.cardNumber.touched && (
													<p className='text-red-500 text-sm mt-1'>
														{form.cardNumber.error}
													</p>
												)}
											</div>

											{/* Card Name */}
											<div className='md:col-span-2'>
												<label className='block text-sm text-gray-400 mb-2'>
													Name on Card *
												</label>
												<input
													type='text'
													name='cardName'
													value={form.cardName.value}
													onChange={handleChange}
													onBlur={handleBlur}
													className={`w-full bg-[#2E2E35] border ${
														form.cardName.error && form.cardName.touched
															? 'border-red-500'
															: 'border-gray-700'
													} rounded-lg py-3 px-4 focus:outline-none focus:border-[#00b5ed]`}
												/>
												{form.cardName.error && form.cardName.touched && (
													<p className='text-red-500 text-sm mt-1'>
														{form.cardName.error}
													</p>
												)}
											</div>

											{/* Expiry Date */}
											<div>
												<label className='block text-sm text-gray-400 mb-2'>
													Expiry Date *
												</label>
												<input
													type='text'
													name='expiryDate'
													value={form.expiryDate.value}
													onChange={handleChange}
													onBlur={handleBlur}
													className={`w-full bg-[#2E2E35] border ${
														form.expiryDate.error && form.expiryDate.touched
															? 'border-red-500'
															: 'border-gray-700'
													} rounded-lg py-3 px-4 focus:outline-none focus:border-[#00b5ed]`}
													placeholder='MM/YY'
												/>
												{form.expiryDate.error && form.expiryDate.touched && (
													<p className='text-red-500 text-sm mt-1'>
														{form.expiryDate.error}
													</p>
												)}
											</div>

											{/* CVV */}
											<div>
												<label className='block text-sm text-gray-400 mb-2'>
													CVV *
												</label>
												<input
													type='text'
													name='cvv'
													value={form.cvv.value}
													onChange={handleChange}
													onBlur={handleBlur}
													className={`w-full bg-[#2E2E35] border ${
														form.cvv.error && form.cvv.touched
															? 'border-red-500'
															: 'border-gray-700'
													} rounded-lg py-3 px-4 focus:outline-none focus:border-[#00b5ed]`}
													placeholder='123'
													maxLength={4}
												/>
												{form.cvv.error && form.cvv.touched && (
													<p className='text-red-500 text-sm mt-1'>
														{form.cvv.error}
													</p>
												)}
											</div>
										</div>
									)}

									{paymentMethod === 'paypal' && (
										<div className='bg-[#2E2E35] p-4 rounded-lg text-center'>
											<p className='mb-4'>
												You will be redirected to PayPal to complete your
												payment.
											</p>
											<img
												src='/api/placeholder/180/60'
												alt='PayPal Logo'
												className='mx-auto'
											/>
										</div>
									)}
								</div>

								{/* Notification Preferences */}
								<div className='bg-[#222227] rounded-lg p-6 mb-8'>
									<h2 className='text-xl font-semibold mb-6'>Notifications</h2>
									<div className='space-y-3'>
										<label className='flex items-center text-sm'>
											<input
												type='checkbox'
												name='email'
												checked={notificationPreferences.email}
												onChange={handleNotificationChange}
												className='mr-3 accent-[#00b5ed]'
											/>
											Send order confirmation email
										</label>
										<label className='flex items-center text-sm'>
											<input
												type='checkbox'
												name='telegram'
												checked={notificationPreferences.telegram}
												onChange={handleNotificationChange}
												className='mr-3 accent-[#00b5ed]'
											/>
											Notify store about my order
										</label>
										<p className='text-xs text-gray-400 mt-3'>
											We use these notifications to process your order. You can
											disable either option, but we recommend keeping at least
											one enabled for better service.
										</p>
									</div>
								</div>
							</form>
						</div>

						{/* Right side - Order summary */}
						<div className='w-full lg:w-1/3'>
							<div className='bg-[#222227] rounded-lg p-6 sticky top-24'>
								<h2 className='text-xl font-semibold mb-6'>Order Summary</h2>

								{/* Order items */}
								<div className='mb-6'>
									{cartItems.map(item => (
										<div
											key={item.configId}
											className='flex justify-between mb-4 pb-4 border-b border-gray-700 last:border-0 last:pb-0'
										>
											<div>
												<p className='font-medium'>{item.configName}</p>
												<p className='text-sm text-gray-400'>
													Qty: {item.quantity}
												</p>
											</div>
											<p className='font-medium'>
												${(item.totalPrice * item.quantity).toFixed(2)}
											</p>
										</div>
									))}
								</div>

								{/* Totals */}
								<div className='space-y-4 mb-6'>
									<div className='flex justify-between'>
										<span className='text-gray-400'>Subtotal</span>
										<span>${subtotal.toFixed(2)}</span>
									</div>

									<div className='flex justify-between'>
										<span className='text-gray-400'>Shipping</span>
										<span>
											{shipping === 0 ? 'FREE' : `${shipping.toFixed(2)}`}
										</span>
									</div>

									<div className='flex justify-between'>
										<span className='text-gray-400'>Tax (7%)</span>
										<span>${tax.toFixed(2)}</span>
									</div>

									<div className='border-t border-gray-700 pt-4 flex justify-between font-bold text-xl'>
										<span>Total</span>
										<span>${total.toFixed(2)}</span>
									</div>
								</div>

								{/* Submit button */}
								<button
									type='submit'
									onClick={handleSubmit}
									disabled={isSubmitting || cartItems.length === 0}
									className={`w-full bg-[#00b5ed] hover:bg-[#00a1d4] transition-colors py-3 rounded-lg font-medium ${
										isSubmitting || cartItems.length === 0
											? 'opacity-50 cursor-not-allowed'
											: ''
									}`}
								>
									{isSubmitting ? 'Processing...' : 'Place Order'}
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}
