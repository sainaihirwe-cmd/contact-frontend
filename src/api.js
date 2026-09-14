const configuredApiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const productionApiUrl = 'https://contact-backend-11.onrender.com'
const apiBaseUrl = (configuredApiUrl || (import.meta.env.PROD ? productionApiUrl : ''))
	.replace(/\/api\/health$/, '')
	.replace(/\/api$/, '')

export const apiUrl = (path) => `${apiBaseUrl}${path}`
