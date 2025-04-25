'use client'

import { useEffect, useState } from 'react'

type Product = {
	id: number
	name: string
	brand: string
	price: number
	image_url: string
}

export default function ProductsPage() {
	const [products, setProducts] = useState<Product[]>([])

	useEffect(() => {
		fetch('/api/products')
			.then(res => res.json())
			.then(setProducts)
			.catch(console.error)
	}, [])

    console.log(products)
	return (
		<div className='p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6'>
			{products.map(product => (
				<div key={product.id} className='bg-white rounded-2xl shadow-md p-4'>
					<img
						src={product.image_url}
						alt={product.name}
						className='w-full h-48 object-cover rounded-xl'
					/>
					<h2 className='text-xl font-semibold mt-2'>{product.name}</h2>
					<p className='text-gray-500'>{product.brand}</p>
					<p className='text-lg font-bold text-blue-600'>{product.price} ₽</p>
				</div>
			))}
		</div>
	)
}
