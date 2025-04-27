import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface CartItem {
	price: number
	id: string | number | null | undefined
	image_url: any
	name: string
	configId: number
	configName: string
	imageUrl?: string
	totalPrice: number
	quantity: number
	components: {
		id: number
		categoryId: number
		categoryName: string
		name: string
		price: number
		image_url?: string
		discount?: number
	}[]
}

interface CartState {
	items: CartItem[]
	isOpen: boolean
}

const initialState: CartState = {
	items: [],
	isOpen: false,
}

const cartSlice = createSlice({
	name: 'cart',
	initialState,
	reducers: {
		addToCart: (state, action: PayloadAction<CartItem>) => {
			// Можно сделать, чтобы если конфигурация уже есть в корзине, увеличивалось количество
			const existingItem = state.items.find(
				item => item.id === action.payload.id
			)
			if (existingItem) {
				existingItem.quantity += action.payload.quantity
			} else {
				state.items.push(action.payload)
			}
		},
		removeFromCart: (state, action: PayloadAction<number>) => {
			state.items = state.items.filter(item => item.id !== action.payload)
		},
		updateQuantity: (
			state,
			action: PayloadAction<{ configId: number; quantity: number }>
		) => {
			const item = state.items.find(item => item.id === action.payload.configId)
			if (item) {
				item.quantity = action.payload.quantity
			}
		},
		clearCart: state => {
			state.items = []
		},
		toggleCart: state => {
			state.isOpen = !state.isOpen
		},
		closeCart: state => {
			state.isOpen = false
		},
		openCart: state => {
			state.isOpen = true
		},
	},
})

export const {
	addToCart,
	removeFromCart,
	updateQuantity,
	clearCart,
	toggleCart,
	closeCart,
	openCart,
} = cartSlice.actions
export default cartSlice.reducer
