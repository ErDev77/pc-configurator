import {
	Facebook,
	Instagram,
	LinkIcon,
	TicketCheckIcon,
	Twitter,
	Youtube,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

function Footer() {
	const socialIcons = [
		{ Icon: Facebook, name: 'Facebook' },
		{ Icon: Twitter, name: 'Twitter' },
		{ Icon: Instagram, name: 'Instagram' },
		{ Icon: Youtube, name: 'YouTube' },
		{ Icon: TicketCheckIcon, name: 'Ticket' },
		{ Icon: LinkIcon, name: 'Link' },
	]

	return (
		<footer className='bg-[#1B1B20] text-white py-24 px-8'>
			<div className='container mx-auto max-w-7xl'>
				<div className='grid grid-cols-1 md:grid-cols-5 gap-6'>
					<div className='md:col-span-1'>
						<h4 className='font-bold mb-6 text-base'>Products</h4>
						<ul className='space-y-3 text-sm font-medium text-[#A5A9B1]'>
							<li>
								<Link href='#' className='hover:text-white'>
									MG-1
								</Link>
							</li>
							<li>
								<Link href='#' className='hover:text-white'>
									North
								</Link>
							</li>
							<li>
								<Link href='#' className='hover:text-white'>
									Zero
								</Link>
							</li>
							<li>
								<Link href='#' className='hover:text-white'>
									Laptops
								</Link>
							</li>
							<li>
								<Link href='#' className='hover:text-white'>
									Workstations
								</Link>
							</li>
							<li>
								<Link href='#' className='hover:text-white'>
									View All
								</Link>
							</li>
						</ul>
					</div>
					<div className='md:col-span-1'>
						<h4 className='font-bold mb-6 text-base'>Support</h4>
						<ul className='space-y-3 text-sm font-medium text-[#A5A9B1]'>
							<li>
								<Link href='#' className='hover:text-white'>
									Knowledge Base
								</Link>
							</li>
							<li>
								<Link href='#' className='hover:text-white'>
									Get Support
								</Link>
							</li>
							<li>
								<Link href='#' className='hover:text-white'>
									Warranty Policy
								</Link>
							</li>
						</ul>
					</div>
					<div className='md:col-span-1'>
						<h4 className='font-bold mb-6 text-base'>Resources</h4>
						<ul className='space-y-3 text-sm font-medium text-[#A5A9B1]'>
							<li>
								<Link href='#' className='hover:text-white'>
									Financing
								</Link>
							</li>
							<li>
								<Link href='#' className='hover:text-white'>
									Shipping Policy
								</Link>
							</li>
							<li>
								<Link href='#' className='hover:text-white'>
									Refund Policy
								</Link>
							</li>
							<li>
								<Link href='#' className='hover:text-white'>
									Privacy Policy
								</Link>
							</li>
							<li>
								<Link href='#' className='hover:text-white'>
									Terms of Service
								</Link>
							</li>
							<li>
								<Link href='#' className='hover:text-white'>
									Contact Us
								</Link>
							</li>
						</ul>
					</div>
					<div className='md:col-span-1'>
						<h4 className='font-bold mb-6 text-base'>Follow Us</h4>
						<div className='flex flex-col space-y-3 text-sm font-medium text-[#A5A9B1] cursor-pointer'>
							{socialIcons.map(({ Icon, name }, index) => (
								<div key={index} className='flex items-center hover:text-white'>
									<Icon className='hover:text-gray-400 cursor-pointer h-4 w-4' />
									<p className='ml-4'>{name}</p>
								</div>
							))}
						</div>
					</div>
					<div className='md:col-span-1 md:flex md:flex-col md:items-end w-full'>
						<h4 className='font-bold mb-4 text-base text-right'>
							Subscribe to our newsletter
						</h4>
						<p className='text-gray-400 mb-4 text-right'>
							Get exclusive email-only offers when you signup!
						</p>
						<div className='flex w-full'>
							<input
								type='email'
								placeholder='Email'
								className='bg-[#1B1B20] text-white px-4 py-3 rounded-l border border-gray-700 flex-grow focus:outline-none'
							/>
							<button className='text-black px-4 py-3 rounded-r border border-gray-700 whitespace-nowrap'>
								→
							</button>
						</div>
						<label className='flex items-center text-sm text-gray-400 mt-4'>
							<input type='checkbox' className='mr-2' /> I agree to receiving
							marketing emails and special deals
						</label>
					</div>
				</div>
				<div className='mt-12 pt-8 border-t border-gray-700 flex flex-col md:flex-row justify-between items-center'>
					<div className='text-sm'>
						© 2025 MAINGEAR, All rights reserved. Powered by Shopify
					</div>
					{/* <div className='flex space-x-6'>
						<Image
							src='/apay.png'
							alt='APay'
							className='h-6'
							width={20}
							height={20}
						/>
						<Image
							src='/paypal.png'
							alt='GPay'
							className='h-6'
							width={20}
							height={20}
						/>
						<Image src='/visa.png' alt='Visa' width={20} height={20} />
					</div> */}
				</div>
			</div>
		</footer>
	)
}

export default Footer
