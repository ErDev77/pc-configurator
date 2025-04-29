// src/lib/emailService.ts

interface EmailOptions {
	to: string
	subject: string
	html: string
}

/**
 * A simple email service that logs messages during development
 * In production, you would replace this with your actual email sending logic
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
	if (process.env.NODE_ENV === 'production') {
		// In production, implement your preferred email sending method
		// This could be using SendGrid, AWS SES, or any other service
		try {
			// Example implementation (replace with your actual service)
			// const response = await fetch('https://api.youremailservice.com/send', {
			//   method: 'POST',
			//   headers: { 'Content-Type': 'application/json' },
			//   body: JSON.stringify({
			//     apiKey: process.env.EMAIL_API_KEY,
			//     to: options.to,
			//     subject: options.subject,
			//     html: options.html
			//   })
			// });
			// return response.status === 200;

			// For now, just log the message
			console.log('[PRODUCTION EMAIL]', options)
			return true
		} catch (error) {
			console.error('Failed to send email:', error)
			return false
		}
	} else {
		// In development, just log the email
		console.log('==== DEVELOPMENT EMAIL ====')
		console.log('To:', options.to)
		console.log('Subject:', options.subject)
		console.log('Body:', options.html.substring(0, 150) + '...')
		console.log('===========================')
		return true
	}
}

/**
 * Generates and sends a 2FA verification email
 */
export async function send2FAVerificationEmail(
	email: string,
	code: string
): Promise<boolean> {
	return sendEmail({
		to: email,
		subject: 'Your Login Verification Code',
		html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0C6FFC;">Verification Code</h2>
        <p>Your verification code for PC Admin login is:</p>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${code}
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you did not request this code, please ignore this email and secure your account.</p>
      </div>
    `,
	})
}
