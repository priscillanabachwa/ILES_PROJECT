import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../Context/AuthContext'
import { loginUser, requestPasswordReset, verifyResetCode, resetPassword } from '../services/authService'
import './Login.css'
import ILES_LOGO from '../assets/ILES_LOGO.png'

// ==================== FORGOT PASSWORD MODAL ====================
function ForgotPasswordModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!isOpen) resetModal()
  }, [isOpen])

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await requestPasswordReset(email)
      setSuccess('A recovery code has been sent!')
      setStep(2)
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError(err.message || 'Failed to send recovery code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await verifyResetCode(email, otp)
      setSuccess('Code verified! Now set your new password.')
      setStep(3)
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError(err.message || 'Invalid code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async (e) => {
    e.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match!')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }
    setLoading(true)
    try {
      await resetPassword(email, otp, newPassword)
      setSuccess('Password reset successfully!')
      setTimeout(() => onClose(), 2000)
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetModal = () => {
    setStep(1)
    setEmail('')
    setOtp('')
    setNewPassword('')
    setConfirmPassword('')
    setError('')
    setSuccess('')
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h2 className="modal-title">
            {step === 1 && 'Reset Password'}
            {step === 2 && 'Enter Recovery Code'}
            {step === 3 && 'Set New Password'}
          </h2>
          <button className="modal-close-btn" onClick={onClose} type="button" aria-label="Close">✕</button>
        </div>

        {error && <div className="alert alert--error">{error}</div>}
        {success && <div className="alert alert--success">✓ {success}</div>}

        {step === 1 && (
          <form className="modal-form" onSubmit={handleEmailSubmit}>
            <div className="form-group">
              <label htmlFor="reset-email">Email address</label>
              <input
                id="reset-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
              {loading ? 'Sending…' : 'Send Recovery Code'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form className="modal-form" onSubmit={handleOtpSubmit}>
            <div className="form-group">
              <label htmlFor="otp">Recovery Code</label>
              <input
                id="otp"
                type="text"
                placeholder="Enter the 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength="6"
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
              {loading ? 'Verifying…' : 'Verify Code'}
            </button>
          </form>
        )}

        {step === 3 && (
          <form className="modal-form" onSubmit={handlePasswordReset}>
            <div className="form-group">
              <label htmlFor="new-password">New Password</label>
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirm-password">Confirm Password</label>
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                  disabled={loading}
                />
                <span>Show passwords</span>
              </label>
            </div>
            <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="modal-progress">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2</div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>3</div>
        </div>
      </div>
    </div>
  )
}

const ROLE_REDIRECTS = {
  student: '/student/dashboard',
  academic_supervisor: '/academic-supervisor/dashboard',
  supervisor: '/supervisor/dashboard',
  admin: '/admin/dashboard',
}

// ==================== MAIN LOGIN COMPONENT ====================
export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await loginUser(email, password)
      if (response.token && response.user) {
        login(response.user, response.token)
        localStorage.setItem('authToken', response.token)
        localStorage.setItem('user', JSON.stringify(response.user))
        const path = ROLE_REDIRECTS[response.user.role] || '/student/dashboard'
        navigate(path)
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-root">
      <div className="login-card">

        {/* Centered Logo + System Name */}
        <div className="login-header">
          <div className="logo-wrap">
            <img src={ILES_LOGO} alt="ILES Logo" className="logo-img" />
          </div>
          <p className="system-name">INTERNSHIP LOGGING AND EVALUATION SYSTEM</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && <p className="alert alert--error">{error}</p>}

          <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          <div className="forgot-link-wrap">
            <button
              type="button"
              className="forgot-link"
              onClick={() => setShowForgotPassword(true)}
              disabled={loading}
            >
              Forgot Password?
            </button>
          </div>
        </form>

        <p className="login-footer">
          No account? <Link to="/register">Register here</Link>
        </p>
      </div>

      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </div>
  )
}