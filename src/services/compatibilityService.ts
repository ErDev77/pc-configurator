// src/services/compatibilityService.ts

export async function fetchCompatibilityMap() {
	try {
		const response = await fetch(
			`${process.env.NEXT_PUBLIC_SITE_URL}/api/compatibility`,
			{
				cache: 'no-store',
			}
		)

		if (!response.ok) {
			throw new Error('Failed to fetch compatibility data')
		}

		const compatibilityData = await response.json()

		// Create a compatibility map
		const compatibilityMap = new Map<number, Set<number>>()

		compatibilityData.forEach(
			({
				component1_id,
				component2_id,
			}: {
				component1_id: number
				component2_id: number
			}) => {
				if (!compatibilityMap.has(component1_id)) {
					compatibilityMap.set(component1_id, new Set())
				}
				if (!compatibilityMap.has(component2_id)) {
					compatibilityMap.set(component2_id, new Set())
				}

				compatibilityMap.get(component1_id)?.add(component2_id)
				compatibilityMap.get(component2_id)?.add(component1_id)
			}
		)

		return compatibilityMap
	} catch (error) {
		console.error('Error fetching compatibility data:', error)
		return new Map<number, Set<number>>()
	}
}

export async function getComponentCompatibility(componentId: string | number) {
	try {
		const response = await fetch(
			`${process.env.NEXT_PUBLIC_SITE_URL}/api/compatibility?componentId=${componentId}`,
			{ cache: 'no-store' }
		)

		if (!response.ok) {
			throw new Error('Failed to fetch component compatibility')
		}

		return await response.json()
	} catch (error) {
		console.error('Error fetching component compatibility:', error)
		return []
	}
}
