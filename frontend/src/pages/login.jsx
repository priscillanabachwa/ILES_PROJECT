import { useState } from "react";
import style from'./login.css';

export default function Login() {
  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [loading,  setLoading]  = useState(false)
  const [success,  setSuccess]  = useState(false)
  const [error,    setError]    = useState("")

  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess(false)
    setLoading(true)

    try {
      const response = await fetch("http://127.0.0.1:8000/api/accounts/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.detail || "Invalid email or password")
      }

      
      login(data.user, data.access)
      
      
      localStorage.setItem('access_token', data.access)
      localStorage.setItem('user', JSON.stringify(data.user))

      setSuccess(true)

      // 3. Redirect based on user role
      const route = ROLE_ROUTES[data.user?.role] || '/student/dashboard'
      setTimeout(() => navigate(route), 1000)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{style}</style>
      <div className="login-root">
        <div className="login-card">

          <div className="login-header">
            <p className="login-eyebrow">ILES Project</p>
            <h1 className="login-title">Welcome <em>back</em></h1>
            <p className="login-subtitle">Sign in to your internship portal</p>
          </div>

          <div className="login-body">
            {success && (
              <div className="success-banner">✓ Login successful — redirecting…</div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="field-group">
                <div>
                  <label className="field-label" htmlFor="email">Email</label>
                  <input
                    id="email"
                    className="field-input"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="password">Password</label>
                  <input
                    id="password"
                    className="field-input"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  {error && <p className="error-msg">{error}</p>}
                </div>
              </div>

              <button
                type="submit"
                className={`login-btn${loading ? " loading" : ""}`}
                disabled={loading}
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>

            <p className="login-footer">
              No account? <a href="/register">Register here</a>
            </p>
          </div>

        </div>
      </div>
    </>
  )
}
