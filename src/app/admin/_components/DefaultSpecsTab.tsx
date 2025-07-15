'use client'

import React, { useState, useEffect } from 'react'
import { Trash, PlusCircle, Globe, Save, Info } from 'lucide-react'
import { toast } from 'react-toastify'

// Default parameters for different categories
const DEFAULT_SPECS_TEMPLATES: Record<number, Record<string, string>> = {
	// CPU - Category ID 1
	1: {
		TDP: '',
		Cache: '',
		Cores: '',
		Threads: '',
		'Base Clock': '',
		'Boost Clock': '',
		Socket: '',
		Architecture: '',
	},
	// GPU - Category ID 2
	2: {
		Memory: '',
		'Memory Type': '',
		'Bus Width': '',
		TDP: '',
		'Core Clock': '',
		'Boost Clock': '',
		'CUDA Cores': '',
		'RT Cores': '',
		'Tensor Cores': '',
		DirectX: '',
	},
	// Motherboard - Category ID 3
	3: {
		Socket: '',
		Chipset: '',
		'Form Factor': '',
		'Memory Slots': '',
		'Max Memory': '',
		'Memory Type': '',
		'PCIe Slots': '',
		'SATA Ports': '',
		'M.2 Slots': '',
		'USB Ports': '',
	},
	// RAM - Category ID 4
	4: {
		Capacity: '',
		Speed: '',
		Type: '',
		'CAS Latency': '',
		Timing: '',
		Voltage: '',
		'Heat Spreader': '',
	},
	// Storage - Category ID 5
	5: {
		Capacity: '',
		Type: '',
		Interface: '',
		'Read Speed': '',
		'Write Speed': '',
		Cache: '',
		'Form Factor': '',
	},
	// Case - Category ID 6
	6: {
		'Form Factor': '',
		Material: '',
		Dimensions: '',
		Weight: '',
		RGB: '',
		'Fan Support': '',
		'Radiator Support': '',
		'IO Ports': '',
		'Drive Bays': '',
	},
	// PSU - Category ID 7
	7: {
		Wattage: '',
		'Efficiency Rating': '',
		Modularity: '',
		'Fan Size': '',
		'ATX Connectors': '',
		'PCIe Connectors': '',
		'SATA Connectors': '',
		Dimensions: '',
	},
	// Cooling - Category ID 8
	8: {
		Type: '',
		'Fan Size': '',
		'Fan Speed': '',
		'Air Flow': '',
		'Noise Level': '',
		RGB: '',
		'Socket Support': '',
		Dimensions: '',
	},
}

interface DefaultSpecsTabProps {
	categoryId: number
	specs_en: string[]
	specs_ru: string[]
	specs_am: string[]
	onChange: (field: string, value: string[]) => void
}

const DefaultSpecsTab: React.FC<DefaultSpecsTabProps> = ({
	categoryId,
	specs_en,
	specs_ru,
	specs_am,
	onChange,
}) => {
	const [activeTab, setActiveTab] = useState<'en' | 'ru' | 'am'>('en')
	const [specValues, setSpecValues] = useState<{
		en: Record<string, string>
		ru: Record<string, string>
		am: Record<string, string>
	}>({
		en: {},
		ru: {},
		am: {},
	})
	const [customSpecs, setCustomSpecs] = useState<{
		en: Record<string, string>
		ru: Record<string, string>
		am: Record<string, string>
	}>({
		en: {},
		ru: {},
		am: {},
	})
	const [newSpecKey, setNewSpecKey] = useState('')
	const [newSpecValue, setNewSpecValue] = useState('')
	const [shouldUpdateParent, setShouldUpdateParent] = useState(false)

	// Parse existing specs into key-value pairs on component mount or when specs change
	useEffect(() => {
		const parsedSpecs = {
			en: parseSpecsToObject(specs_en),
			ru: parseSpecsToObject(specs_ru),
			am: parseSpecsToObject(specs_am),
		}

		setSpecValues(parsedSpecs)

		// Identify which specs are custom (not in the template)
		const templateKeys = Object.keys(DEFAULT_SPECS_TEMPLATES[categoryId] || {})

		const customEn = Object.entries(parsedSpecs.en)
			.filter(([key]) => !templateKeys.includes(key))
			.reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {})

		const customRu = Object.entries(parsedSpecs.ru)
			.filter(([key]) => !templateKeys.includes(key))
			.reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {})

		const customAm = Object.entries(parsedSpecs.am)
			.filter(([key]) => !templateKeys.includes(key))
			.reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {})

		setCustomSpecs({
			en: customEn,
			ru: customRu,
			am: customAm,
		})

		// Ensure we don't trigger an update on initial load
		setShouldUpdateParent(false)
	}, [specs_en, specs_ru, specs_am, categoryId])

	// Effect to call parent onChange when specValues or customSpecs change
	useEffect(() => {
		// Skip this effect on the initial render
		if (!shouldUpdateParent) {
			return
		}

		const enSpecs = { ...specValues.en, ...customSpecs.en }
		const ruSpecs = { ...specValues.ru, ...customSpecs.ru }
		const amSpecs = { ...specValues.am, ...customSpecs.am }

		onChange('specs_en', formatSpecsToArray(enSpecs))
		onChange('specs_ru', formatSpecsToArray(ruSpecs))
		onChange('specs_am', formatSpecsToArray(amSpecs))
	}, [specValues, customSpecs, onChange, shouldUpdateParent])

	// Convert array of specs strings to an object
	const parseSpecsToObject = (specs: string[]): Record<string, string> => {
		const result: Record<string, string> = {}

		specs.forEach(spec => {
			const parts = spec.split(':')
			if (parts.length >= 2) {
				const key = parts[0].trim()
				const value = parts.slice(1).join(':').trim()
				result[key] = value
			}
		})

		return result
	}

	// Convert an object back to an array of strings
	const formatSpecsToArray = (specs: Record<string, string>): string[] => {
		return Object.entries(specs)
			.filter(([_, value]) => value.trim() !== '')
			.map(([key, value]) => `${key}: ${value}`)
	}

	// Handle changes to template spec values
	const handleSpecChange = (key: string, value: string) => {
		setSpecValues(prev => ({
			...prev,
			[activeTab]: {
				...prev[activeTab],
				[key]: value,
			},
		}))
		setShouldUpdateParent(true)
	}

	// Handle changes to custom spec values
	const handleCustomSpecChange = (key: string, value: string) => {
		setCustomSpecs(prev => ({
			...prev,
			[activeTab]: {
				...prev[activeTab],
				[key]: value,
			},
		}))
		setShouldUpdateParent(true)
	}

	// Add a new custom spec
	const handleAddCustomSpec = () => {
		if (!newSpecKey.trim()) {
			toast.error('Parameter name cannot be empty')
			return
		}

		setCustomSpecs(prev => ({
			...prev,
			[activeTab]: {
				...prev[activeTab],
				[newSpecKey]: newSpecValue,
			},
		}))
		setShouldUpdateParent(true)
		setNewSpecKey('')
		setNewSpecValue('')
	}

	// Remove a custom spec
	const handleRemoveCustomSpec = (key: string) => {
		setCustomSpecs(prev => {
			const updated = { ...prev }
			delete updated[activeTab][key]
			return updated
		})
		setShouldUpdateParent(true)
	}

	// Get the template for the current category
	const currentTemplate = DEFAULT_SPECS_TEMPLATES[categoryId] || {}

	return (
		<div className='bg-[#202529] p-6 rounded-xl border border-gray-700 shadow-lg'>
			<h3 className='text-xl text-white mb-4 font-bold flex items-center'>
				<Globe className='h-5 w-5 mr-2 text-blue-400' />
				Технические характеристики комплектующего
			</h3>

			{/* Language Tabs */}
			<div className='flex mb-6 border-b border-gray-700'>
				<button
					onClick={() => setActiveTab('en')}
					className={`px-4 py-2 mr-2 rounded-t-lg ${
						activeTab === 'en'
							? 'bg-blue-600 text-white'
							: 'bg-gray-700 text-gray-300 hover:bg-gray-600'
					}`}
				>
					Английский 🇺🇸
				</button>
				<button
					onClick={() => setActiveTab('ru')}
					className={`px-4 py-2 mr-2 rounded-t-lg ${
						activeTab === 'ru'
							? 'bg-blue-600 text-white'
							: 'bg-gray-700 text-gray-300 hover:bg-gray-600'
					}`}
				>
					Русский 🇷🇺
				</button>
				<button
					onClick={() => setActiveTab('am')}
					className={`px-4 py-2 rounded-t-lg ${
						activeTab === 'am'
							? 'bg-blue-600 text-white'
							: 'bg-gray-700 text-gray-300 hover:bg-gray-600'
					}`}
				>
					Армянский 🇦🇲
				</button>
			</div>

			{/* Info Banner */}
			<div className='bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-6 flex items-start'>
				<Info className='h-5 w-5 mr-2 text-blue-400 flex-shrink-0 mt-0.5' />
				<p className='text-sm text-gray-300'>
					Заполните значения характеристик для этой{' '}
					{Object.keys(currentTemplate).length > 0 ? 'категории' : 'продукта'}.
					Эти данные будут отображаться клиентам на их выбранном языке. Оставьте
					поля пустыми, если они не применимы.
				</p>
			</div>

			{/* Template Specifications */}
			{Object.keys(currentTemplate).length > 0 ? (
				<div className='mb-6'>
					<h4 className='text-lg font-medium text-white mb-4'>
						Параметры категории
					</h4>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						{Object.keys(currentTemplate).map(key => (
							<div key={key} className='mb-3'>
								<label className='block text-sm font-medium text-gray-300 mb-1'>
									{key}:
								</label>
								<input
									type='text'
									value={specValues[activeTab][key] || ''}
									onChange={e => handleSpecChange(key, e.target.value)}
									placeholder={`Enter ${key}`}
									className='w-full bg-[#2C3136] text-white p-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none'
								/>
							</div>
						))}
					</div>
				</div>
			) : (
				<div className='mb-6 text-center py-4 bg-gray-800/50 rounded-lg border border-gray-700'>
					<p className='text-gray-400'>
						Для этой категории нет параметров по умолчанию.
					</p>
				</div>
			)}

			{/* Custom Specifications */}
			<div className='mb-6'>
				<h4 className='text-lg font-medium text-white mb-4'>
					Пользовательские параметры
				</h4>
				{Object.keys(customSpecs[activeTab]).length > 0 ? (
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						{Object.entries(customSpecs[activeTab]).map(([key, value]) => (
							<div key={key} className='mb-3 relative'>
								<label className='block text-sm font-medium text-gray-300 mb-1'>
									{key}:
								</label>
								<div className='flex'>
									<input
										type='text'
										value={value}
										onChange={e => handleCustomSpecChange(key, e.target.value)}
										className='flex-grow bg-[#2C3136] text-white p-2 rounded-l-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none'
									/>
									<button
										onClick={() => handleRemoveCustomSpec(key)}
										className='bg-red-600 hover:bg-red-700 text-white p-2 rounded-r-lg transition-colors'
									>
										<Trash className='h-5 w-5' />
									</button>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className='text-center py-4 bg-gray-800/50 rounded-lg border border-gray-700 mb-4'>
						<p className='text-gray-400'>Специальные параметры не добавлены</p>
					</div>
				)}

				{/* Add new custom parameter */}
				<div className='bg-[#1A1D21] p-4 rounded-lg border border-gray-700 mt-4'>
					<h5 className='text-md font-medium text-white mb-3'>
						Добавить пользовательский параметр
					</h5>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						<div>
							<label className='block text-sm font-medium text-gray-300 mb-1'>
								Параметр:
							</label>
							<input
								type='text'
								value={newSpecKey}
								onChange={e => setNewSpecKey(e.target.value)}
								placeholder='e.g. Clock Speed'
								className='w-full bg-[#2C3136] text-white p-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none'
							/>
						</div>
						<div>
							<label className='block text-sm font-medium text-gray-300 mb-1'>
								Значение:
							</label>
							<input
								type='text'
								value={newSpecValue}
								onChange={e => setNewSpecValue(e.target.value)}
								placeholder='e.g. 3.5 GHz'
								className='w-full bg-[#2C3136] text-white p-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none'
							/>
						</div>
					</div>
					<button
						onClick={handleAddCustomSpec}
						className='mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors flex items-center justify-center'
					>
						<PlusCircle className='h-4 w-4 mr-2' />
						Добавить параметр
					</button>
				</div>
			</div>

			<p className='text-sm text-gray-400 mt-4'>
				Характеристики будут отображаться в формате «Параметр: Значение»
				(например, «TDP: 105 Вт»). Обязательно укажите единицы измерения, где
				это применимо.
			</p>
		</div>
	)
}

export default DefaultSpecsTab
