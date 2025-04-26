import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface CartItem {
	id: number
	name: string
	image_url: string
	price: number
	quantity: number
}

interface CartState {
	items: CartItem[]
}

const initialState: CartState = {
	items: [],
}

const cartSlice = createSlice({
	name: 'cart',
	initialState,
	reducers: {
		addToCart(state, action: PayloadAction<CartItem>) {
			const existingItem = state.items.find(
				item => item.id === action.payload.id
			)
			if (existingItem) {
				existingItem.quantity += action.payload.quantity
			} else {
				state.items.push(action.payload)
			}
		},
		removeFromCart(state, action: PayloadAction<number>) {
			state.items = state.items.filter(item => item.id !== action.payload)
		},
		clearCart(state) {
			state.items = []
		},
	},
})

export const { addToCart, removeFromCart, clearCart } = cartSlice.actions

export default cartSlice.reducer
