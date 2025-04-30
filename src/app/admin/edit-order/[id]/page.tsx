// src/app/admin/edit-order/[id]/page.tsx
// Properly awaiting params before using its properties

import { Suspense } from 'react'
import EditOrderClient from './client-component'

export default async function EditOrderPage({
	params,
}: {
	params: { id: string }
}) {
	// Await the params before using any properties
	const resolvedParams = await params
	const orderNumber = resolvedParams.id

	return (
		<Suspense fallback={<div>Loading...</div>}>
			<EditOrderClient orderNumber={orderNumber} />
		</Suspense>
	)
}
