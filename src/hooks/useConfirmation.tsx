import React from 'react'
import { toast } from 'react-toastify'

const useConfirmation = (): { confirmDelete: (message: string, onConfirm: () => void) => void } => {
	const confirmDelete = (message: string, onConfirm: () => void) => {
		const toastId = toast(
			<div className='flex flex-col items-center'>
				<span className='mb-2'>{message}</span>
				<div className='flex space-x-3'>
					<button
						className='bg-green-500 text-white px-3 py-1 rounded'
						onClick={() => {
							onConfirm() // Выполняем действие подтверждения
							toast.dismiss(toastId) // Закрываем уведомление
						}}
					>
						Да
					</button>
					<button
						className='bg-red-500 text-white px-3 py-1 rounded'
						onClick={() => {
							toast.dismiss(toastId)
						}}
					>
						Нет
					</button>
				</div>
			</div>,
			{
				position: 'bottom-center',
				autoClose: false,
				closeOnClick: false,
				closeButton: false,
				draggable: false,
			}
		)
	}

	return { confirmDelete }
}

export default useConfirmation
