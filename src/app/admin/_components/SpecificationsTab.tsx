'use client'

import React, { useState, useEffect } from 'react'
import { Trash, PlusCircle, Globe } from 'lucide-react'
import { toast } from 'react-toastify'

interface SpecificationsTabProps {
	specs_en: string[]
	specs_ru: string[]
	specs_am: string[]
	onChange: (field: string, value: string[]) => void
}

const SpecificationsTab: React.FC<SpecificationsTabProps> = ({
	specs_en = [],
	specs_ru = [],
	specs_am = [],
	onChange,
}) => {
	const [activeTab, setActiveTab] = useState<'en' | 'ru' | 'am'>('en')
	const [newSpec, setNewSpec] = useState('')

	// Get the active specs based on the selected language tab
	const getActiveSpecs = () => {
		switch (activeTab) {
			case 'en':
				return specs_en
			case 'ru':
				return specs_ru
			case 'am':
				return specs_am
			default:
				return specs_en
		}
	}

	// Get the field name based on the selected language tab
	const getFieldName = () => {
		switch (activeTab) {
			case 'en':
				return 'specs_en'
			case 'ru':
				return 'specs_ru'
			case 'am':
				return 'specs_am'
			default:
				return 'specs_en'
		}
	}

	const handleAddSpec = () => {
		if (!newSpec.trim()) {
			toast.error('Specification cannot be empty')
			return
		}

		const currentSpecs = getActiveSpecs()
		const updatedSpecs = [...currentSpecs, newSpec]
		onChange(getFieldName(), updatedSpecs)
		setNewSpec('')
	}

	const handleRemoveSpec = (index: number) => {
		const currentSpecs = getActiveSpecs()
		const updatedSpecs = [...currentSpecs]
		updatedSpecs.splice(index, 1)
		onChange(getFieldName(), updatedSpecs)
	}

	return (
		<div className='bg-[#202529] p-6 rounded-xl border border-gray-700 shadow-lg'>
			<h3 className='text-xl text-white mb-4 font-bold flex items-center'>
				<Globe className='h-5 w-5 mr-2 text-blue-400' />
				Product Specifications
			</h3>

			{/* Language Tabs */}
			<div className='flex mb-4 border-b border-gray-700'>
				<button
					onClick={() => setActiveTab('en')}
					className={`px-4 py-2 mr-2 rounded-t-lg ${
						activeTab === 'en'
							? 'bg-blue-600 text-white'
							: 'bg-gray-700 text-gray-300 hover:bg-gray-600'
					}`}
				>
					English 🇺🇸
				</button>
				<button
					onClick={() => setActiveTab('ru')}
					className={`px-4 py-2 mr-2 rounded-t-lg ${
						activeTab === 'ru'
							? 'bg-blue-600 text-white'
							: 'bg-gray-700 text-gray-300 hover:bg-gray-600'
					}`}
				>
					Russian 🇷🇺
				</button>
				<button
					onClick={() => setActiveTab('am')}
					className={`px-4 py-2 rounded-t-lg ${
						activeTab === 'am'
							? 'bg-blue-600 text-white'
							: 'bg-gray-700 text-gray-300 hover:bg-gray-600'
					}`}
				>
					Armenian 🇦🇲
				</button>
			</div>

			{/* Add new specification */}
			<div className='flex mb-4'>
				<input
					type='text'
					value={newSpec}
					onChange={e => setNewSpec(e.target.value)}
					placeholder={`Add a specification in ${
						activeTab === 'en'
							? 'English'
							: activeTab === 'ru'
							? 'Russian'
							: 'Armenian'
					}`}
					className='flex-grow bg-[#2C3136] text-white p-3 rounded-l-xl border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none'
					onKeyPress={e => e.key === 'Enter' && handleAddSpec()}
				/>
				<button
					onClick={handleAddSpec}
					className='bg-blue-600 text-white px-4 rounded-r-xl hover:bg-blue-500 transition-colors flex items-center'
				>
					<PlusCircle className='h-5 w-5 mr-1' />
					Add
				</button>
			</div>

			{/* Specifications list */}
			<div className='max-h-[350px] overflow-y-auto pr-1 custom-scrollbar'>
				<ul className='space-y-2'>
					{getActiveSpecs().map((spec, index) => (
						<li
							key={index}
							className='flex justify-between items-center bg-[#1A1D21] p-3 rounded-lg'
						>
							<span className='text-white'>{spec}</span>
							<button
								onClick={() => handleRemoveSpec(index)}
								className='text-red-400 hover:text-red-500 transition-colors'
							>
								<Trash className='h-4 w-4' />
							</button>
						</li>
					))}
					{getActiveSpecs().length === 0 && (
						<li className='text-gray-400 text-center p-4 italic'>
							No specifications added for{' '}
							{activeTab === 'en'
								? 'English'
								: activeTab === 'ru'
								? 'Russian'
								: 'Armenian'}{' '}
							yet.
						</li>
					)}
				</ul>
			</div>

			<p className='text-sm text-gray-400 mt-4'>
				Add technical specifications for the product in all three languages to
				provide complete information for customers.
			</p>
		</div>
	)
}

export default SpecificationsTab
