import { useState, useEffect, useRef } from 'react'
import { Edit, Trash, MoreVertical } from 'lucide-react'
import Link from 'next/link'

const DashboardActions = ({
	componentId,
	onDelete,
}: {
	componentId: number
	onDelete: () => void
}) => {
	const [isOpen, setIsOpen] = useState(false)
	const menuRef = useRef<HTMLDivElement | null>(null)

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setIsOpen(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [])

	return (
		<div className='relative' ref={menuRef}>
			<button onClick={() => setIsOpen(!isOpen)} className='rounded-lg'>
				<MoreVertical className='text-white' />
			</button>
			{isOpen && (
				<div className='absolute right-0 bottom-full mb-2 w-40 bg-gray-800 rounded-lg shadow-lg p-2 flex flex-col'>
					<Link
						href={`/admin/edit-component/${componentId}`}
						className='flex items-center space-x-2 p-2 hover:bg-gray-700 rounded-lg text-white'
					>
						<Edit size={16} />
						<span>Редактировать</span>
					</Link>
					<button
						onClick={onDelete}
						className='flex items-center space-x-2 p-2 hover:bg-red-600 rounded-lg text-white'
					>
						<Trash size={16} />
						<span>Удалить</span>
					</button>
				</div>
			)}
		</div>
	)
}

export default DashboardActions;
