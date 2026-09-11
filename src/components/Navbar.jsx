import { useState, useEffect } from 'preact/hooks'
import { ProductDashboard } from './ProductDashboard'
import '../styles/Navbar.css'

export function Navbar({ onLoginChange }) {
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  // include confirmPassword for login as requested
  const [loginForm, setLoginForm] = useState({ email: '', password: '', confirmPassword: '' })
  const [loginError, setLoginError] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState('')
  const [userRole, setUserRole] = useState('')

  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showLoginConfirm, setShowLoginConfirm] = useState(false)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '', confirmPassword: '', phone: '' })
  const [registerErrors, setRegisterErrors] = useState({})
  const [registerStatus, setRegisterStatus] = useState({ loading: false, success: '', error: '' })
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)

  // Check if user is already logged in from localStorage
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (token) {
      setIsLoggedIn(true)
      if (onLoginChange) onLoginChange(true)
    }
  }, [])

  const handleLoginInputChange = (e) => {
    const { name, value } = e.target
    setLoginForm((prev) => ({ ...prev, [name]: value }))
    setLoginError('')
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setLoginError('')

    // Validation
    if (!loginForm.email.trim()) {
      setLoginError('Email is required')
      return
    }
    if (!loginForm.password.trim()) {
      setLoginError('Password is required')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginForm.email)) {
      setLoginError('Please enter a valid email')
      return
    }
    if (loginForm.password.length < 6) {
      setLoginError('Password must be at least 6 characters')
      return
    }
    // if confirm present, require match
    if (typeof loginForm.confirmPassword === 'string' && loginForm.confirmPassword.length > 0 && loginForm.password !== loginForm.confirmPassword) {
      setLoginError('Password and confirm password do not match')
      return
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginForm.email.trim().toLowerCase(), password: loginForm.password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setLoginError(data.message || 'Login failed')
        return
      }

      setIsLoggedIn(true)
      setUserName(data.data?.username || loginForm.email.split('@')[0])
      setUserRole(data.data?.role || 'user')
      localStorage.setItem('authToken', data.token)
      setLoginForm({ email: '', password: '', confirmPassword: '' })
      setIsLoginOpen(false)
      if (onLoginChange) onLoginChange(true)
    } catch (err) {
      setLoginError('Unable to reach server')
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUserName('')
    setUserRole('')
    setLoginForm({ email: '', password: '' })
    localStorage.removeItem('authToken')
    if (onLoginChange) onLoginChange(false)
  }

  const handleRegisterInputChange = (e) => {
    const { name, value } = e.target
    setRegisterForm((prev) => ({ ...prev, [name]: value }))
    setRegisterErrors((prev) => ({ ...prev, [name]: '' }))
    setRegisterStatus({ loading: false, success: '', error: '' })
  }

  const validateRegister = () => {
    const errs = {}
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!registerForm.username.trim() || registerForm.username.trim().length < 3) errs.username = 'Username must be at least 3 characters'
    if (!registerForm.email.trim() || !emailPattern.test(registerForm.email.trim())) errs.email = 'Please enter a valid email'
    if (!registerForm.password || registerForm.password.length < 8) errs.password = 'Password must be at least 8 characters'
    if (registerForm.password !== registerForm.confirmPassword) errs.confirmPassword = 'Passwords do not match'
    const digits = registerForm.phone.replace(/\D/g, '')
    if (digits && !(digits.length >= 9 && digits.length <= 15)) errs.phone = 'Phone must be 9–15 digits if provided'
    return errs
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setRegisterErrors({})
    const errs = validateRegister()
    if (Object.keys(errs).length > 0) {
      setRegisterErrors(errs)
      return
    }

    setRegisterStatus({ loading: true, success: '', error: '' })

    try {
      const payload = {
        username: registerForm.username.trim(),
        email: registerForm.email.trim().toLowerCase(),
        password: registerForm.password,
        phone: registerForm.phone.replace(/\D/g, ''),
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setRegisterStatus({ loading: false, success: '', error: data.message || (Array.isArray(data.errors) ? data.errors.join(', ') : 'Registration failed') })
        return
      }

      // After successful registration, store in DB (backend) and open login modal with email prefilled
      setRegisterStatus({ loading: false, success: 'Registered successfully. Redirecting to login...', error: '' })
      const savedEmail = registerForm.email.trim().toLowerCase()
      const savedPassword = registerForm.password
      setRegisterForm({ username: '', email: '', password: '', confirmPassword: '', phone: '' })
      setIsRegisterOpen(false)
      setTimeout(() => {
        setIsLoginOpen(true)
        // prefill login email; prefill password only because requested (note: pre-filling passwords is not recommended)
        setLoginForm({ email: savedEmail, password: savedPassword, confirmPassword: savedPassword })
      }, 300)
    } catch (err) {
      setRegisterStatus({ loading: false, success: '', error: 'Unable to reach server' })
    }
  }

  // Show ProductDashboard if logged in
  if (isLoggedIn) {
    return <ProductDashboard userName={userName} userRole={userRole} onLogout={handleLogout} />
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <span className="logo-text">ContactHub</span>
        </div>

        <div className="navbar-links">
          <a href="#home" className="nav-link">Home</a>
          <a href="#contacts" className="nav-link">Contacts</a>
        </div>

        <div className="navbar-auth">
          {!isLoggedIn ? (
            <button className="btn-login" onClick={() => setIsLoginOpen(!isLoginOpen)}>Login</button>
          ) : (
            <div className="user-menu">
              <span className="user-greeting">Welcome, {userName}!</span>
              <button className="btn-logout" onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </div>

      {/* Login Modal */}
      {isLoginOpen && (
        <div className="login-modal">
          <div className="login-form-container register-small">
            <div className="login-header">
              <h2>Login to Your Account</h2>
              <button className="close-btn" onClick={() => setIsLoginOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleLoginSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input type="email" id="email" name="email" placeholder="Enter your email" value={loginForm.email} onChange={handleLoginInputChange} required />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-input-wrap">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    className="auth-input"
                    placeholder="Enter your password"
                    value={loginForm.password}
                    onChange={handleLoginInputChange}
                    required
                  />
                  <button
                    type="button"
                    className={`eye-btn ${showLoginPassword ? 'visible' : 'hidden'}`}
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showLoginPassword}
                    onClick={() => setShowLoginPassword((s) => !s)}
                  >
                    {showLoginPassword ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPasswordLogin">Confirm Password</label>
                <div className="password-input-wrap">
                  <input
                    type={showLoginConfirm ? 'text' : 'password'}
                    id="confirmPasswordLogin"
                    name="confirmPassword"
                    className="auth-input"
                    placeholder="Confirm your password"
                    value={loginForm.confirmPassword}
                    onChange={handleLoginInputChange}
                  />
                  <button
                    type="button"
                    className={`eye-btn ${showLoginConfirm ? 'visible' : 'hidden'}`}
                    aria-label={showLoginConfirm ? 'Hide confirm password' : 'Show confirm password'}
                    aria-pressed={showLoginConfirm}
                    onClick={() => setShowLoginConfirm((s) => !s)}
                  >
                    {showLoginConfirm ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>

              {loginError && <div className="error-message">{loginError}</div>}

              <button type="submit" className="btn-submit">Login</button>

              <div className="login-footer">
                <p>Don't have an account? <span className="signup-link" onClick={() => { setIsLoginOpen(false); setIsRegisterOpen(true); }}>Sign up here</span></p>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {isRegisterOpen && (
        <div className="login-modal">
          <div className="login-form-container register-small">
            <div className="login-header">
              <h2>Create Account</h2>
              <button className="close-btn" onClick={() => setIsRegisterOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input id="username" name="username" placeholder="Choose a username" value={registerForm.username} onChange={handleRegisterInputChange} required />
                {registerErrors.username && <small className="error-text">{registerErrors.username}</small>}
              </div>

              <div className="form-group">
                <label htmlFor="reg-email">Email Address</label>
                <input id="reg-email" name="email" type="email" placeholder="Enter your email" value={registerForm.email} onChange={handleRegisterInputChange} required />
                {registerErrors.email && <small className="error-text">{registerErrors.email}</small>}
              </div>

              <div className="form-group">
                <label htmlFor="reg-password">Password</label>
                <div className="password-input-wrap">
                  <input
                    id="reg-password"
                    name="password"
                    type={showRegisterPassword ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="Choose a secure password"
                    value={registerForm.password}
                    onChange={handleRegisterInputChange}
                    required
                  />
                  <button
                    type="button"
                    className={`eye-btn ${showRegisterPassword ? 'visible' : 'hidden'}`}
                    aria-label={showRegisterPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showRegisterPassword}
                    onClick={() => setShowRegisterPassword((s) => !s)}
                  >
                    {showRegisterPassword ? '👁️' : '🙈'}
                  </button>
                </div>
                {registerErrors.password && <small className="error-text">{registerErrors.password}</small>}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="password-input-wrap">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showRegisterPassword ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="Repeat your password"
                    value={registerForm.confirmPassword}
                    onChange={handleRegisterInputChange}
                    required
                  />
                  <button
                    type="button"
                    className={`eye-btn ${showRegisterPassword ? 'visible' : 'hidden'}`}
                    aria-label={showRegisterPassword ? 'Hide confirm password' : 'Show confirm password'}
                    aria-pressed={showRegisterPassword}
                    onClick={() => setShowRegisterPassword((s) => !s)}
                  >
                    {showRegisterPassword ? '👁️' : '🙈'}
                  </button>
                </div>
                {registerErrors.confirmPassword && <small className="error-text">{registerErrors.confirmPassword}</small>}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone (optional)</label>
                <input id="phone" name="phone" type="tel" placeholder="0123456789" value={registerForm.phone} onChange={handleRegisterInputChange} />
                {registerErrors.phone && <small className="error-text">{registerErrors.phone}</small>}
              </div>

              {registerStatus.error && <div className="error-message">{registerStatus.error}</div>}
              {registerStatus.success && <div className="success-message">{registerStatus.success}</div>}

              <button type="submit" className="btn-submit">{registerStatus.loading ? 'Creating...' : 'Create Account'}</button>

              <div className="login-footer">
                <p>Already have an account? <span className="signup-link" onClick={() => { setIsRegisterOpen(false); setIsLoginOpen(true); }}>Login</span></p>
              </div>
            </form>
          </div>
        </div>
      )}
    </nav>
  )
}