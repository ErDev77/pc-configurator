import React, { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle, Trash } from 'lucide-react'
import { toast } from 'react-toastify'

interface Component {
	id: number
	name?: string
}

interface Compatibility {
	id: number
	component1_id: number
	component2_id: number
}

interface Props {
	componentId: number
}

const CompatibilitiesList: React.FC<Props> = ({ componentId }) => {
	const [compatibilities, setCompatibilities] = useState<Compatibility[]>([])
	const [componentsMap, setComponentsMap] = useState<Map<number, string>>(
		new Map()
	)
	const [currentComponentName, setCurrentComponentName] = useState<string>('')
	const [isLoading, setIsLoading] = useState(true)
	const [isEmpty, setIsEmpty] = useState(false)

	// Function to load compatibilities
	const fetchCompatibilities = async () => {
		if (!componentId) {
			setIsLoading(false)
			setIsEmpty(true)
			return
		}

		setIsLoading(true)
		try {
			// First, get the current component data
			const currentRes = await fetch(`/api/products/${componentId}`)
			if (currentRes.ok) {
				const currentData = await currentRes.json()
				if (currentData.product && currentData.product.name) {
					setCurrentComponentName(currentData.product.name)
					console.log(
						'Current component name set to:',
						currentData.product.name
					)
				}
			}
			// Get compatibilities
			const res = await fetch(`/api/compatibility?componentId=${componentId}`)
			const data = await res.json()

			if (res.ok) {
				setCompatibilities(data)
				setIsEmpty(data.length === 0)

				// Get all products to create a map
				const productsRes = await fetch(`/api/products?page=1&pageSize=1000`)
				const productsData = await productsRes.json()

				// Get the list of components
				const componentsList = productsData.components

				// Check if it's an array
				if (Array.isArray(componentsList)) {
					const newComponentsMap = new Map<number, string>()
					componentsList.forEach((component: Component) => {
						if (component.name && component.id) {
							newComponentsMap.set(component.id, component.name)
						}
					})
					setComponentsMap(newComponentsMap)

					// Set current component name
					const currentComponent = componentsList.find(
						c => c.id === componentId
					)
					if (currentComponent && currentComponent.name) {
						setCurrentComponentName(currentComponent.name)
						console.log('Current component found:', currentComponent.name)
					} else {
						console.log('Current component not found for ID:', componentId)
						// Try to get it from the components map we just created
						const nameFromMap = newComponentsMap.get(componentId)
						if (nameFromMap) {
							setCurrentComponentName(nameFromMap)
						}
					}
				} else {
					console.error('API response is not an array of components.')
				}
			} else {
				setIsEmpty(true)
				console.error(data.error || 'No compatibilities for this component.')
			}
		} catch (error) {
			console.error('Error loading compatibilities:', error)
			toast.error('Error loading compatibilities.')
		}
		setIsLoading(false)
	}

	// Function to delete compatibility
	const handleRemoveCompatibility = async (compatibilityId: number) => {
		try {
			const loadingToastId = toast.loading('Removing compatibility...')

			const res = await fetch(`/api/compatibility/${compatibilityId}/`, {
				method: 'DELETE',
			})

			toast.dismiss(loadingToastId)

			if (res.ok) {
				// Remove deleted compatibility from the list
				setCompatibilities(prev =>
					prev.filter(item => item.id !== compatibilityId)
				)
				if (compatibilities.length === 1) {
					setIsEmpty(true)
				}
				toast.success('Compatibility successfully removed.')
			} else {
				const data = await res.json()
				toast.error(data.error || 'Error removing compatibility.')
			}
		} catch (error) {
			console.error('Error removing compatibility:', error)
			toast.error('Error removing compatibility.')
		}
	}

	// Load compatibilities when componentId changes
	useEffect(() => {
		fetchCompatibilities()
	}, [componentId])

	// Helper function to get component name
	const getComponentName = (compatibility: Compatibility) => {
		// Determine which component ID is the "other" component (not the current one)
		const otherComponentId =
			compatibility.component1_id === componentId
				? compatibility.component2_id
				: compatibility.component1_id

		console.log('Current componentId:', componentId)
		console.log('Compatibility object:', compatibility)
		console.log('Other component ID:', otherComponentId)
		console.log('Components map size:', componentsMap.size)
		console.log(
			'Name for other component:',
			componentsMap.get(otherComponentId)
		)

		return (
			componentsMap.get(otherComponentId) || `Component #${otherComponentId}`
		)
	}

	// Helper function to check if this is the current component
	const isCurrentComponent = (id: number) => {
		return id === componentId
	}

	return (
		<div className='bg-[#202529] p-6 rounded-2xl border border-gray-700 shadow-lg'>
			<h3 className='text-xl text-white font-bold mb-4 flex items-center'>
				<CheckCircle className='h-5 w-5 mr-2 text-blue-400' />
				Compatible Components
			</h3>

			{isLoading ? (
				<div className='flex justify-center items-center p-8'>
					<div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500'></div>
					<span className='ml-3 text-blue-400'>Loading compatibilities...</span>
				</div>
			) : isEmpty || compatibilities.length === 0 ? (
				<div className='text-center py-8 px-4'>
					<AlertCircle className='h-10 w-10 text-yellow-500 mx-auto mb-3' />
					<p className='text-gray-300 mb-2'>No compatibilities found</p>
					<p className='text-gray-400 text-sm'>
						Add compatible components in the section above
					</p>
				</div>
			) : (
				<div className='max-h-[350px] overflow-y-auto pr-1 custom-scrollbar'>
					<table className='text-white w-full border-separate border-spacing-0'>
						<tbody className='divide-y divide-gray-700'>
							{compatibilities.map(comp => {
								const otherComponentName = getComponentName(comp)
								return (
									<tr
										key={comp.id}
										className='hover:bg-[#252A30] transition-colors'
									>
										<td className='py-3 px-2 flex items-center w-full'>
											<div className='flex items-center w-full justify-between'>
												<div className='flex items-center space-x-2'>
													<span className='text-blue-400'>•</span>
													<span
														className={`${
															comp.component1_id === componentId
																? 'text-blue-400 font-bold'
																: 'text-gray-300'
														} font-medium`}
													>
														{componentsMap.get(comp.component1_id) ||
															`Component #${comp.component1_id}`}
													</span>
												</div>
												<div className='border-t border-dashed border-gray-600 flex-grow mx-4'></div>
												<span
													className={`${
														comp.component2_id === componentId
															? 'text-blue-400 font-bold'
															: 'text-gray-300'
													}`}
												>
													{componentsMap.get(comp.component2_id) ||
														`Component #${comp.component2_id}`}
												</span>
											</div>
										</td>
										<td className='py-2 px-2 w-12'>
											<button
												className='bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-lg transition-colors'
												onClick={() => handleRemoveCompatibility(comp.id)}
												title='Remove compatibility'
											>
												<Trash size={16} />
											</button>
										</td>
									</tr>
								)
							})}
						</tbody>
					</table>
				</div>
			)}

			<button
				onClick={fetchCompatibilities}
				className='mt-4 text-blue-400 hover:text-blue-300 text-sm flex items-center'
			>
				<svg
					className='w-4 h-4 mr-1'
					fill='none'
					stroke='currentColor'
					viewBox='0 0 24 24'
				>
					<path
						strokeLinecap='round'
						strokeLinejoin='round'
						strokeWidth='2'
						d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
					></path>
				</svg>
				Refresh list
			</button>
		</div>
	)
}

export default CompatibilitiesList
