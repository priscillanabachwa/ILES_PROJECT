import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../Context/AuthContext'
import { loginUser, requestPasswordReset, verifyResetCode, resetPassword } from '../services/authService'
import './Login.css'
import ILES_LOGO from '../assets/ILES_LOGO.png'

// ==================== FORGOT PASSWORD MODAL ====================
function ForgotPasswordModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1) // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await requestPasswordReset(email)
      setSuccess('A recovery code has been sent!')
      setStep(2) // Move to OTP step
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
      setStep(3) // Move to password reset step
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

    // Validation
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
      setSuccess('Password reset successfully! You can now login with your new password.')
      setTimeout(() => {
        resetModal()
        onClose()
      }, 2000)
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

  const handleClose = () => {
    resetModal()
    onClose()
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
          <button className="modal-close-btn" onClick={handleClose} type="button" aria-label="Close">✕</button>
        </div>

        {error && <div className="error-msg">{error}</div>}
        {success && <div className="success-banner">✓ {success}</div>}

        {/* Step 1 — Enter Email */}
        {step === 1 && (
          <form onSubmit={handleEmailSubmit}>
            <div className="field-group">
              <label className="field-label" htmlFor="reset-email">Email address</label>
              <input
                id="reset-email"
                className="field-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Sending…' : 'Send Recovery Code'}
            </button>
          </form>
        )}

        {/* Step 2 — Enter OTP */}
        {step === 2 && (
          <form onSubmit={handleOtpSubmit}>
            <div className="field-group">
              <label className="field-label" htmlFor="otp">Recovery Code</label>
              <input
                id="otp"
                className="field-input"
                type="text"
                placeholder="Enter the 6-digit code sent to your email"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength="6"
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Verifying…' : 'Verify Code'}
            </button>
          </form>
        )}

        {/* Step 3 — Set New Password */}
        {step === 3 && (
          <form onSubmit={handlePasswordReset}>
            <div className="field-group">
              <label className="field-label" htmlFor="new-password">New Password</label>
              <input
                id="new-password"
                className="field-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="confirm-password">Confirm Password</label>
              <input
                id="confirm-password"
                className="field-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="field-group checkbox-group">
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
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>
        )}

        {/* Progress Indicator */}
        <div className="modal-progress">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2</div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>3</div>
        </div>
      </div>
    </div>
  )
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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await loginUser(email, password)
      
      if (response.token && response.user) {
        // Use AuthContext to store auth data
        login(response.user, response.token)
        
        // Also store in localStorage for persistence
        localStorage.setItem('authToken', response.token)
        localStorage.setItem('user', JSON.stringify(response.user))
        
        // Redirect based on user role
        const roleRoutes = {
          student: '/student/dashboard',
          academic_supervisor: '/academic/dashboard',
          workplace_supervisor: '/supervisor/dashboard',
          admin: '/admin/dashboard',
        }
        
        const redirectPath = roleRoutes[response.user.role] || '/student/dashboard'
        navigate(redirectPath)
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-root">
      <div className="login-card">
        {/* Header — Logo + Brand */}
        <div className="card-header">
          <img src={ILES_LOGO} alt="ILES Logo" className="logo-img" />
          <div className="brand-content">
            <div className="brand-name">INTERNSHIP LOGIN AND EVALUATION SYSTEM</div>
            
          </div>
        </div>

        <h1 className="login-title">Welcome , Login to ILES</h1>
        

        <form onSubmit={handleSubmit}>
          <div className="field-group">
            <label className="field-label" htmlFor="email">Email address</label>
            <input
              id="email"
              className="field-input"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="password">Password</label>
            <div className="password-wrapper">
              <input
                id="password"
                className="field-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
                disabled={loading}
                title={showPassword ? 'Hide password' : 'Show password'}
                
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          {error && <p className="error-msg">{error}</p>}

          <div className="button-group-login">
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
            <button
              type="button"
              className="forgot-pwd-btn"
              onClick={() => setShowForgotPassword(true)}
              disabled={loading}
            >
              🔑 Forgot Password?
            </button>
          </div>
        </form>

        <p className="login-footer">
          No account? <a href="/register">Register here</a>
        </p>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </div>
  )
}

