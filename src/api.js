const configuredApiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const apiBaseUrl = configuredApiUrl.replace(/\/api\/health$/, '').replace(/\/api$/, '')

export const apiUrl = (path) => `${apiBaseUrl}${path}`
