import type { NextApiRequest, NextApiResponse } from 'next'
import cloudinary from '@/lib/cloudinary'
import multer from 'multer'
import streamifier from 'streamifier'

export const config = {
	api: {
		bodyParser: false,
	},
}

const upload = multer()

const runMiddleware = (req: NextApiRequest, res: NextApiResponse, fn: any) => {
	return new Promise((resolve, reject) => {
		fn(req, res, (result: any) => {
			if (result instanceof Error) {
				return reject(result)
			}
			return resolve(result)
		})
	})
}

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method Not Allowed' })
	}

	try {
		await runMiddleware(req, res, upload.single('file'))

		const file = (req as any).file
		const streamUpload = () => {
			return new Promise<{ url: string }>((resolve, reject) => {
				const stream = cloudinary.uploader.upload_stream(
					{
						folder: 'pc-components',
					},
					(error, result) => {
						if (result) {
							resolve({ url: result.secure_url })
						} else {
							reject(error)
						}
					}
				)
				streamifier.createReadStream(file.buffer).pipe(stream)
			})
		}

		const result = await streamUpload()
		res.status(200).json(result)
	} catch (error) {
		console.error('Ошибка загрузки:', error)
		res.status(500).json({ error: 'Ошибка загрузки изображения' })
	}
}
