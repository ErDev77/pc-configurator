// src/context/NotificationContext.tsx
import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from 'react'

export interface Notification {
	id: number
	message: string
	read: boolean
	timestamp: string
}

interface NotificationContextType {
	notifications: Notification[]
	unreadCount: number
	browserNotificationsEnabled: boolean
	setBrowserNotificationsEnabled: (enabled: boolean) => void
	addNotification: (message: string) => void
	markAsRead: (id: number) => void
	markAllAsRead: () => void
	deleteNotification: (id: number) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(
	undefined
)

interface NotificationProviderProps {
	children: ReactNode
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
	children,
}) => {
	// Initial demo notifications
	const [notifications, setNotifications] = useState<Notification[]>([
	])

	const [browserNotificationsEnabled, setBrowserNotificationsEnabled] =
		useState<boolean>(true)

	// Load settings from localStorage on mount
	useEffect(() => {
		const savedSettings = localStorage.getItem('notificationSettings')
		if (savedSettings) {
			try {
				const settings = JSON.parse(savedSettings)
				setBrowserNotificationsEnabled(settings.browserNotifications !== false) // default to true
			} catch (e) {
				console.error('Error parsing notification settings:', e)
			}
		}
	}, [])

	// Save settings to localStorage when changed
	useEffect(() => {
		localStorage.setItem(
			'notificationSettings',
			JSON.stringify({
				browserNotifications: browserNotificationsEnabled,
			})
		)
	}, [browserNotificationsEnabled])

	// Calculate unread count
	const unreadCount = notifications.filter(n => !n.read).length

	// Add a new notification
	const addNotification = (message: string) => {
		const newNotification: Notification = {
			id: Date.now(),
			message,
			read: false,
			timestamp: new Date().toISOString(),
		}

		setNotifications(prev => [newNotification, ...prev])
	}

	// Mark a notification as read
	const markAsRead = (id: number) => {
		setNotifications(prev =>
			prev.map(notification =>
				notification.id === id ? { ...notification, read: true } : notification
			)
		)
	}

	// Mark all notifications as read
	const markAllAsRead = () => {
		setNotifications(prev =>
			prev.map(notification => ({ ...notification, read: true }))
		)
	}

	// Delete a notification
	const deleteNotification = (id: number) => {
		setNotifications(prev =>
			prev.filter(notification => notification.id !== id)
		)
	}

	return (
		<NotificationContext.Provider
			value={{
				notifications,
				unreadCount,
				browserNotificationsEnabled,
				setBrowserNotificationsEnabled,
				addNotification,
				markAsRead,
				markAllAsRead,
				deleteNotification,
			}}
		>
			{children}
		</NotificationContext.Provider>
	)
}

export const useNotifications = (): NotificationContextType => {
	const context = useContext(NotificationContext)
	if (context === undefined) {
		throw new Error(
			'useNotifications must be used within a NotificationProvider'
		)
	}
	return context
}
