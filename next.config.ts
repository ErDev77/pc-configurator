/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
	  domains: ['res.cloudinary.com'],
	},
	eslint: {
	  ignoreDuringBuilds: true, // ✅ отключаем ESLint на билде
	},
	typescript: {
	  ignoreBuildErrors: true, // ✅ отключаем ошибки TypeScript на билде (на всякий случай)
	},
  };
  
  export default nextConfig;

