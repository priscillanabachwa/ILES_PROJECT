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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Recover Password</h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex gap-2 mb-6">
          <div className={`h-1 flex-1 rounded-full transition-all ${step >= 1 ? 'bg-indigo-500' : 'bg-slate-700'}`} />
          <div className={`h-1 flex-1 rounded-full transition-all ${step >= 2 ? 'bg-indigo-500' : 'bg-slate-700'}`} />
          <div className={`h-1 flex-1 rounded-full transition-all ${step >= 3 ? 'bg-indigo-500' : 'bg-slate-700'}`} />
        </div>

        {/* Step 1: Email */}
        {step === 1 && (
          <form onSubmit={handleEmailSubmit}>
            <p className="text-slate-300 text-sm mb-4">Enter your email address to receive a recovery code</p>
            
            <div className="mb-4">
              <label htmlFor="recovery-email" className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <input
                id="recovery-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                required
                disabled={loading}
              />
            </div>

            {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"><p className="text-red-400 text-sm">{error}</p></div>}
            {success && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg"><p className="text-green-400 text-sm">{success}</p></div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-all"
            >
              {loading ? 'Sending...' : 'Send Recovery Code'}
            </button>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <form onSubmit={handleOtpSubmit}>
            <p className="text-slate-300 text-sm mb-4">Enter the recovery code sent to your email</p>
            
            <div className="mb-4">
              <label htmlFor="otp" className="block text-sm font-medium text-slate-300 mb-2">
                Recovery Code
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.toUpperCase())}
                placeholder="Enter 6-digit code"
                maxLength="6"
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-center tracking-widest"
                required
                disabled={loading}
              />
            </div>

            {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"><p className="text-red-400 text-sm">{error}</p></div>}
            {success && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg"><p className="text-green-400 text-sm">{success}</p></div>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-all"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <form onSubmit={handlePasswordReset}>
            <p className="text-slate-300 text-sm mb-4">Set your new password</p>
            
            <div className="mb-4">
              <label htmlFor="new-password" className="block text-sm font-medium text-slate-300 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">Minimum 8 characters</p>
            </div>

            <div className="mb-4">
              <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-300 mb-2">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                required
                disabled={loading}
              />
            </div>

            {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"><p className="text-red-400 text-sm">{error}</p></div>}
            {success && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg"><p className="text-green-400 text-sm">{success}</p></div>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-all"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </form>
        )}
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
    <div className="login-container">
      <div className="login-box">
        {/* Header with Logo and System Title - Inside Box */}
        <div className="login-box-header">
          <img src={ILES_LOGO} alt="ILES Logo" className="ILES_LOGO" />
          <span className="system-title">INTERNSHIP LOGIN AND EVALUATION SYSTEM</span>
        </div>

        <h1>Welcome, Login to ILES</h1>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={togglePasswordVisibility}
                disabled={loading}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          {/* Login and Forgot Password Buttons */}
          <div className="button-group">
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              disabled={loading}
              className="forgot-password-btn"
            >
              🔑 Forgot Password?
            </button>
          </div>
        </form>

        <div className="register-section">
          <p>Don't have an account? <a href="/register">Register here</a></p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal 
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </div>
  )
}
