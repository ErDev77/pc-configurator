import React from 'react'
import '../app/styles/LoadingOverlay.css'


const LoadingOverlay: React.FC = () => {
	return (
		<div className='loading-overlay'>
			<div className='loader'> </div>
		</div>
	)
}

export default LoadingOverlay
