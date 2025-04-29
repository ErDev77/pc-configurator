'use client'

import { useState } from 'react'
import Sidebar from '../_components/Sidebar'
import { 
  Search, 
  BookOpen, 
  MessageCircle, 
  FileText, 
  Video, 
  Code, 
  ArrowRight,
  Zap,
  RefreshCcw,
  PenTool,
  ShoppingCart,
  Terminal,
  Award,
  Calendar,
  CheckCircle,
  PcCase
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface HelpTopic {
  id: string
  title: string
  category: string
  content: string
  views: number
}

interface Faq {
  question: string
  answer: string
}

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('documentation')
  
  // Sample help topics
  const helpTopics: HelpTopic[] = [
    {
      id: 'adding-components',
      title: 'How to add new components',
      category: 'Components',
      content: 'This guide explains the process of adding new PC components to your store inventory...',
      views: 342
    },
    {
      id: 'create-config',
      title: 'Creating PC configurations',
      category: 'Configurations',
      content: 'Learn how to create pre-built PC configurations for your customers...',
      views: 218
    },
    {
      id: 'manage-orders',
      title: 'Managing customer orders',
      category: 'Orders',
      content: 'A comprehensive guide to processing, tracking, and fulfilling customer orders...',
      views: 156
    },
    {
      id: 'inventory',
      title: 'Inventory management',
      category: 'Products',
      content: 'Best practices for managing your PC component inventory effectively...',
      views: 189
    },
    {
      id: 'categories',
      title: 'Working with product categories',
      category: 'Categories',
      content: 'How to organize your products using the category system...',
      views: 97
    },
    {
      id: 'api-usage',
      title: 'Using the admin API',
      category: 'Development',
      content: 'Technical documentation for developers integrating with the admin API...',
      views: 124
    }
  ]
  
  // FAQs
  const faqs: Faq[] = [
    {
      question: 'How do I reset my admin password?',
      answer: 'To reset your admin password, click on the "Forgot password" link on the login page. You will receive an email with instructions to create a new password.'
    },
    {
      question: 'How can I check the compatibility between components?',
      answer: 'You can manage component compatibility in the Edit Component page. Each component has a "Compatibility" section where you can select which other components are compatible with it.'
    },
    {
      question: 'How do I process a refund?',
      answer: 'To process a refund, go to the Orders section, find the specific order, click on the "View Details" button, and then use the "Process Refund" option. You can choose between full or partial refunds.'
    },
    {
      question: 'Can I bulk import components?',
      answer: 'Yes, you can bulk import components using a CSV file. Go to the Components page, click on the "Import" button, and follow the instructions to upload your CSV file with the component data.'
    },
    {
      question: 'How do I add product images?',
      answer: 'When adding or editing a component, you can upload images using the image uploader in the form. The system supports JPEG, PNG, and WebP formats with a maximum file size of 5MB.'
    },
    {
      question: 'How can I create a custom PC configuration?',
      answer: 'Go to the Configurations section and click "Add Configuration". You can select components from different categories and ensure they are compatible with each other. The system will guide you through the process.'
    },
    {
      question: 'Can I offer discounts on specific components?',
      answer: 'Yes, you can set discount prices for individual components. Edit the component, enter the discount amount, and save changes. The system will automatically display both the original and discounted price.'
    }
  ]

  // Video tutorials
  const videoTutorials = [
    {
      id: 'admin-overview',
      title: 'Admin Panel Overview',
      duration: '5:32',
      thumbnail: '/api/placeholder/240/135',
      views: 1243,
      link: '/videos/admin-overview'
    },
    {
      id: 'adding-products',
      title: 'Adding New Products',
      duration: '7:15',
      thumbnail: '/api/placeholder/240/135',
      views: 985,
      link: '/videos/adding-products'
    },
    {
      id: 'configuration-setup',
      title: 'Setting Up PC Configurations',
      duration: '10:23',
      thumbnail: '/api/placeholder/240/135',
      views: 762,
      link: '/videos/configuration-setup'
    },
    {
      id: 'order-management',
      title: 'Order Management Workflow',
      duration: '8:47',
      thumbnail: '/api/placeholder/240/135',
      views: 510,
      link: '/videos/order-management'
    },
    {
      id: 'compatibility',
      title: 'Managing Component Compatibility',
      duration: '6:19',
      thumbnail: '/api/placeholder/240/135',
      views: 423,
      link: '/videos/compatibility'
    },
    {
      id: 'api-basics',
      title: 'API Integration Basics',
      duration: '12:05',
      thumbnail: '/api/placeholder/240/135',
      views: 381,
      link: '/videos/api-basics'
    },
    {
      id: 'backup-restore',
      title: 'Backup and Restore',
      duration: '4:56',
      thumbnail: '/api/placeholder/240/135',
      views: 297,
      link: '/videos/backup-restore'
    },
    {
      id: 'security-settings',
      title: 'Security Best Practices',
      duration: '9:32',
      thumbnail: '/api/placeholder/240/135',
      views: 319,
      link: '/videos/security-settings'
    }
  ]

  // Filter topics based on search query
  const filteredTopics = helpTopics.filter(topic =>
    topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Helper content sections
  const quickStartSteps = [
    {
      title: 'Set up your store',
      description: 'Configure your store settings, including store name, currency, and tax settings.',
      icon: <Zap size={24} className="text-blue-400" />
    },
    {
      title: 'Add components',
      description: 'Add your PC components with details like specifications, prices, and images.',
      icon: <PenTool size={24} className="text-green-400" />
    },
    {
      title: 'Create configurations',
      description: 'Build PC configurations by combining compatible components.',
      icon: <RefreshCcw size={24} className="text-purple-400" />
    },
    {
      title: 'Process orders',
      description: 'Learn how to effectively manage and fulfill customer orders.',
      icon: <ShoppingCart size={24} className="text-yellow-400" />
    }
  ]

  const commonCommands = [
    { command: 'Add Component', syntax: '/admin/add-component', description: 'Create a new PC component' },
    { command: 'Edit Component', syntax: '/admin/edit-component/[id]', description: 'Modify an existing component' },
    { command: 'Add Configuration', syntax: '/admin/add-config', description: 'Create a new PC configuration' },
    { command: 'View Orders', syntax: '/admin/orders', description: 'See all customer orders' },
    { command: 'Manage Categories', syntax: '/admin/categories', description: 'Edit product categories' }
  ]

  // Sample timeline items for Changelog tab
  const changelogItems = [
    {
      version: '1.2.3',
      date: 'April 15, 2025',
      changes: [
        'Added component compatibility visualization',
        'Improved dashboard with new charts',
        'Fixed order status update issues',
        'Enhanced search functionality'
      ],
      type: 'feature'
    },
    {
      version: '1.2.2',
      date: 'March 28, 2025',
      changes: [
        'Security updates for API authentication',
        'Bug fixes in configuration builder',
        'Performance improvements for large inventories'
      ],
      type: 'bugfix'
    },
    {
      version: '1.2.1',
      date: 'March 10, 2025',
      changes: [
        'Added bulk import/export functionality',
        'Enhanced user permissions system',
        'New notification settings options'
      ],
      type: 'feature'
    },
    {
      version: '1.2.0',
      date: 'February 22, 2025',
      changes: [
        'Major redesign of the admin interface',
        'Added dark mode support',
        'Introduced real-time order notifications',
        'New analytics dashboard'
      ],
      type: 'major'
    }
  ]

  
return (
  <div className="flex bg-[#171C1F] min-h-screen">
    <Sidebar />
    <div className="flex-1 p-6 ml-20 overflow-auto">
      <div className="max-w-6xl mx-auto">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Поиск"
            className="w-full pl-10 pr-4 py-2 rounded-md bg-[#21282D] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex space-x-4 mb-6">
          <button
            className={`flex-1 py-2 rounded-md ${activeTab === 'documentation' ? 'bg-blue-500 text-white' : 'bg-[#21282D] text-gray-400'}`}
            onClick={() => setActiveTab('documentation')}
          >
            Документация
          </button>
          <button
            className={`flex-1 py-2 rounded-md ${activeTab === 'faq' ? 'bg-blue-500 text-white' : 'bg-[#21282D] text-gray-400'}`}
            onClick={() => setActiveTab('faq')}
          >
            FAQ
          </button>
          <button
            className={`flex-1 py-2 rounded-md ${activeTab === 'videos' ? 'bg-blue-500 text-white' : 'bg-[#21282D] text-gray-400'}`}
            onClick={() => setActiveTab('videos')}
          >
            Видео
          </button>
        </div>

        {activeTab === 'documentation' && (
          <>
            <h2 className="text-2xl font-bold text-white mb-4">Быстрый старт</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {quickStartSteps.map((step, index) => (
                <div key={index} className="flex items-start p-4 bg-[#21282D] rounded-lg">
                  <div className="p-2 bg-blue-500 rounded-full mr-4">
                    {step.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                    <p className="text-gray-400">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-bold text-white mb-4">Разделы помощи</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTopics.map((topic, index) => (
                <div key={index} className="p-4 bg-[#21282D] rounded-lg hover:bg-[#2A3237] transition">
                  <div className="flex items-center mb-2">
                    <div className="p-2 bg-blue-500 rounded-full mr-4">
                      11111
                    </div>
                    <h3 className="text-lg font-semibold text-white">{topic.title}</h3>
                  </div>
                  <p className="text-gray-400">44444</p>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'faq' && (
          <>
            <h2 className="text-2xl font-bold text-white mb-4">Часто задаваемые вопросы</h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="p-4 bg-[#21282D] rounded-lg">
                  <h3 className="text-lg font-semibold text-white">{faq.question}</h3>
                  <p className="text-gray-400">{faq.answer}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'videos' && (
          <>
            <h2 className="text-2xl font-bold text-white mb-4">Видеоуроки</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {videoTutorials.map((video, index) => (
                <div key={index} className="bg-[#21282D] rounded-lg overflow-hidden">
                  <img src={video.thumbnail} alt={video.title} className="w-full h-48 object-cover" />
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-white mb-2">{video.title}</h3>
                    <a
                      href={video.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      Смотреть видео
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  </div>
)
}