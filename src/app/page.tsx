// pages/index.tsx
'use client'

import Header from '@/components/Header'
import Image from 'next/image'
import { useEffect, useState } from 'react'

interface Category {
	id: string
	name: string
}

interface Product {
	id: string
	name: string
	brand: string
	price: number
	image_url: string
}

interface Configuration {
	id: number
	name: string
	components: string[]
	image_url: string
}

const HomePage = () => {
	const [configurations, setConfigurations] = useState<Configuration[]>([])
	const [products, setProducts] = useState<Product[]>([])
	const [filteredConfigurations, setFilteredConfigurations] = useState<
		Configuration[]
	>([])
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
	const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000])
	const [categories, setCategories] = useState<string[]>([])

	useEffect(() => {
		async function fetchData() {
			try {
				const configRes = await fetch('/api/configurations')
				const configurationsData = await configRes.json()
				setConfigurations(configurationsData)

				const productRes = await fetch('/api/products')
				const productsData = await productRes.json()

				console.log('Полученные данные продуктов:', productsData)

				if (Array.isArray(productsData.components)) {
					setProducts(productsData.components as Product[])
					const uniqueCategories = Array.from(
						new Set(
							productsData.categories.map((category: Category) => category.name)
						)
					) as string[]
					setCategories(uniqueCategories)
				} else {
					console.error(
						'Полученные данные продуктов не содержат компонент: ',
						productsData
					)
				}
			} catch (error) {
				console.error('Ошибка при загрузке данных:', error)
			}
		}

		fetchData()
	}, [])

	useEffect(() => {
		const filtered = configurations.filter(config => {
			const categoryMatch = selectedCategory
				? config.components &&
				  Array.isArray(config.components) &&
				  config.components.some(component => component === selectedCategory)
				: true

			const priceMatch = products.some(product => {
				return product.price >= priceRange[0] && product.price <= priceRange[1]
			})

			return categoryMatch && priceMatch
		})

		setFilteredConfigurations(filtered)
	}, [configurations, products, selectedCategory, priceRange])

	return (
		<>
			<Header />
			<div className='flex bg-[#222227]'>
				<aside className='w-1/4 p-4 border-r'>
					<h2 className='text-xl font-semibold mb-4'>Фильтры</h2>
					<div className='space-y-6'>
						<div>
							<h3 className='text-lg font-semibold mb-2'>Категория</h3>
							<select
								onChange={e => setSelectedCategory(e.target.value)}
								value={selectedCategory || ''}
								className='w-full p-2 border rounded'
							>
								<option value=''>Все категории</option>
								{categories.map(category => (
									<option key={category} value={category}>
										{category}
									</option>
								))}
							</select>
						</div>
						<div>
							<h3 className='text-lg font-semibold mb-2'>Цена</h3>
							<input
								type='range'
								min={0}
								max={5000}
								step={50}
								value={priceRange[0]}
								onChange={e => setPriceRange([+e.target.value, priceRange[1]])}
								className='w-full'
							/>
							<input
								type='range'
								min={0}
								max={5000}
								step={50}
								value={priceRange[1]}
								onChange={e => setPriceRange([priceRange[0], +e.target.value])}
								className='w-full mt-4'
							/>
							<p className='text-sm mt-2'>
								{`Цена: ${priceRange[0]} - ${priceRange[1]}`}
							</p>
						</div>
					</div>
				</aside>
				<main className='w-3/4 p-4'>
					<h1 className='text-3xl font-bold text-center my-8'>
						Конфигурации компьютеров
					</h1>
					{filteredConfigurations.length === 0 ? (
						<p className='text-center'>
							Нет конфигураций, соответствующих фильтрам.
						</p>
					) : (
						<div className='grid grid-cols-3 gap-8 bg-[#2E2E35]'>
							{filteredConfigurations.map(config => (
								<div
									key={config.id}
									className='border rounded shadow hover:shadow-lg transition'
								>
									{config.image_url && (
										<Image
											width={500}
											height={500}
											src={config.image_url}
											alt={config.name}
											className='w-full h-48 object-cover rounded-t'
										/>
									)}
									<div className='p-4'>
										<h3 className='text-lg font-semibold'>{config.name}</h3>
										<ul className='mt-2 text-sm space-y-1'>
											{Array.isArray(config.components) &&
											config.components.length > 0 ? (
												config.components.map((component, index) => (
													<li key={index}>{component}</li>
												))
											) : (
												<li>Нет компонентов</li> // Fallback message if components is not an array or is empty
											)}
										</ul>

										<button className='mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition'>
											Подробнее
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</main>
			</div>
		</>
	)
}

export default HomePage
