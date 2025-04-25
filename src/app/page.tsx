export default function Home() {
	const fetchData = async () => {
		try {
			const response = await fetch('/api/test')
			const data = await response.json()
			console.log(data)
		} catch (error) {
			console.error('Error:', error)
		}
	}

	return (
    <div>je</div>
	)
}
