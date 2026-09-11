import { useEffect, useState } from 'preact/hooks'
import { Navbar } from './components/Navbar'
import './app.css'

const initialForm = {
  name: '',
  email: '',
  phone: '',
  message: '',
}

export function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState({ loading: false, success: '', error: '' })
  const [contacts, setContacts] = useState([])
  const [loadingContacts, setLoadingContacts] = useState(true)
  const [contactsError, setContactsError] = useState('')

  // Check if user is logged in from localStorage
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (token) {
      setIsLoggedIn(true)
    }
  }, [])

  const loadContacts = async () => {
    try {
      setLoadingContacts(true)
      setContactsError('')

      const response = await fetch('/api/contact', {
        headers: {
          Accept: 'application/json',
        },
      })

      const result = await response.json().catch(() => ({ success: false, data: [] }))

      if (!response.ok) {
        throw new Error(result.message || 'Failed to load recent submissions.')
      }

      setContacts(Array.isArray(result.data) ? result.data : [])
    } catch (error) {
      setContactsError(error.message || 'Unable to load submissions.')
      setContacts([])
    } finally {
      setLoadingContacts(false)
    }
  }

  useEffect(() => {
    loadContacts()
  }, [])

  const validateForm = () => {
    const nextErrors = {}
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const trimmedName = form.name.trim()
    const trimmedEmail = form.email.trim()
    const trimmedMessage = form.message.trim()
    const normalizedPhone = form.phone.replace(/\D/g, '')

    if (!trimmedName) {
      nextErrors.name = 'Name is required.'
    } else if (trimmedName.length < 2) {
      nextErrors.name = 'Name must be at least 2 characters long.'
    } else if (trimmedName.length > 50) {
      nextErrors.name = 'Name must be less than 50 characters.'
    }

    if (!trimmedEmail) {
      nextErrors.email = 'Email is required.'
    } else if (!emailPattern.test(trimmedEmail)) {
      nextErrors.email = 'Please enter a valid email address.'
    }

    if (normalizedPhone && normalizedPhone.length !== 10) {
      nextErrors.phone = 'Phone number must be exactly 10 digits.'
    }

    if (!trimmedMessage) {
      nextErrors.message = 'Message is required.'
    } else if (trimmedMessage.length < 20) {
      nextErrors.message = 'Message must be at least 20 characters long.'
    } else if (trimmedMessage.length > 500) {
      nextErrors.message = 'Message must be less than 500 characters.'
    }

    return nextErrors
  }

  const sanitizePayload = () => ({
    name: form.name.trim(),
    email: form.email.trim().toLowerCase(),
    phone: form.phone.replace(/\D/g, ''),
    message: form.message.trim(),
  })

  const handleChange = (event) => {
    const { name, value } = event.target

    const nextValue = name === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value

    setForm((prev) => ({
      ...prev,
      [name]: nextValue,
    }))

    setErrors((prev) => ({
      ...prev,
      [name]: '',
    }))

    if (status.error) {
      setStatus((prev) => ({ ...prev, error: '' }))
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    event.stopPropagation()

    const nextErrors = validateForm()
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setStatus({ loading: false, success: '', error: 'Please fix the highlighted fields and try again.' })
      return
    }

    setStatus({ loading: true, success: '', error: '' })

    try {
      const payload = sanitizePayload()

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (Array.isArray(result.errors) && result.errors.length > 0) {
          throw new Error(result.errors.join(', '))
        }
        throw new Error(result.message || 'Something went wrong. Please try again later.')
      }

      setStatus({
        loading: false,
        success: 'Your message has been sent successfully. We will get back to you soon.',
        error: '',
      })
      setForm(initialForm)
      setErrors({})
      await loadContacts()
    } catch (error) {
      setStatus({
        loading: false,
        success: '',
        error: error.message || 'Failed to submit the form. Please try again.',
      })
    }
  }

  return (
    <>
      <Navbar onLoginChange={setIsLoggedIn} />
      {!isLoggedIn && (
      <main class="contact-page">
      <section class="contact-shell">
        <div class="contact-header">
          <p class="eyebrow">Contact Us</p>
          <p class="intro">
            We would love to hear from you. Send us a message and our team will contact you as soon as possible.
          </p>
        </div>

        <div class="contact-layout">
          <div class="contact-card">
            <form class="contact-form" onSubmit={handleSubmit} noValidate>
              <div class="field-row">
                <label class="field" htmlFor="name">
                  <span>Name</span>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={form.name}
                    onInput={handleChange}
                    placeholder="Your name"
                    class={errors.name ? 'input error' : 'input'}
                  />
                  {errors.name && <small class="error-text">{errors.name}</small>}
                </label>
              </div>

              <div class="field-row two-col">
                <label class="field" htmlFor="email">
                  <span>Email</span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onInput={handleChange}
                    placeholder="you@example.com"
                    class={errors.email ? 'input error' : 'input'}
                  />
                  {errors.email && <small class="error-text">{errors.email}</small>}
                </label>

                <label class="field" htmlFor="phone">
                  <span>Phone</span>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onInput={handleChange}
                    placeholder="+250712345678"
                    class={errors.phone ? 'input error' : 'input'}
                  />
                  {errors.phone && <small class="error-text">{errors.phone}</small>}
                </label>
              </div>

              <label class="field" htmlFor="message">
                <span>Message</span>
                <textarea
                  id="message"
                  name="message"
                  rows="6"
                  value={form.message}
                  onInput={handleChange}
                  placeholder="Tell us about your requirements"
                  class={errors.message ? 'textarea error' : 'textarea'}
                />
                {errors.message && <small class="error-text">{errors.message}</small>}
              </label>

              <button type="submit" class="submit-btn" disabled={status.loading}>
                {status.loading ? 'Sending...' : 'Send Message'}
              </button>

              {status.success && <div class="status success">{status.success}</div>}
              {status.error && <div class="status error">{status.error}</div>}
            </form>
          </div>

          <aside class="map-card" aria-label="AC Mobility location map">
            <div class="location-header">
              <h2>Visit our office</h2>
              <p>AC Mobility</p>
            </div>

            <div class="map-wrap">
              <iframe
                title="AC Mobility location map"
                src="https://www.google.com/maps?q=AC%20Mobility&output=embed"
                loading="lazy"
                allowFullScreen
              />
            </div>

            <div class="office-info">
              <p>Address: AC Mobility Office</p>
              <p>Email: hello@acmobility.com</p>
              <p>Phone: +250 788 123 456</p>
            </div>

            <div class="records-card">
              <div class="records-header">
                <h3>Recent submissions</h3>
                <span>{contacts.length}</span>
              </div>

              {loadingContacts && <p class="records-status">Loading latest submissions...</p>}
              {!loadingContacts && contactsError && <p class="status error">{contactsError}</p>}
              {!loadingContacts && !contactsError && contacts.length === 0 && (
                <p class="records-status">No submissions yet.</p>
              )}

              {!loadingContacts && !contactsError && contacts.length > 0 && (
                <ul class="contact-list">
                  {contacts.map((contact) => (
                    <li class="contact-item" key={contact._id || `${contact.email}-${contact.createdAt}`}>
                      <strong>{contact.name}</strong>
                      <span>{contact.email}</span>
                      {contact.phone && <small>{contact.phone}</small>}
                      <p>{contact.message}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </section>
      </main>
      )}
    </>
  )
}
