import { useState } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400;500&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  .login-root {
    min-height: 100vh;
    background-color: #f0f7f4;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'DM Mono', monospace;
    position: relative;
    overflow: hidden;
  }

  .login-root::before {
    content: '';
    position: absolute;
    width: 520px;
    height: 520px;
    background: radial-gradient(circle, rgba(15,110,86,0.08) 0%, transparent 70%);
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
  }

  .login-card {
    width: 380px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(15,110,86,0.10);
    animation: fadeUp 0.6s ease both;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .login-header {
    background: #0F6E56;
    padding: 28px 32px;
  }

  .login-eyebrow {
    font-size: 10px;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: #9FE1CB;
    margin-bottom: 8px;
  }

  .login-title {
    font-family: 'DM Serif Display', serif;
    font-size: 28px;
    color: #ffffff;
    font-weight: 400;
    line-height: 1.1;
    margin-bottom: 4px;
  }

  .login-title em { font-style: italic; color: #9FE1CB; }

  .login-subtitle { font-size: 12px; color: #9FE1CB; }

  .login-body {
    background: #ffffff;
    padding: 28px 32px 32px;
    border: 1px solid #ddd;
    border-top: none;
    border-radius: 0 0 8px 8px;
  }

  .field-group { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }

  .field-label {
    display: block;
    font-size: 11px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #555;
    margin-bottom: 6px;
  }

  .field-input {
    width: 100%;
    background: #f9fdfb;
    border: 1px solid #cce8df;
    color: #1a1a1a;
    font-family: 'DM Mono', monospace;
    font-size: 14px;
    padding: 10px 12px;
    border-radius: 4px;
    outline: none;
    transition: border-color 0.2s ease, background 0.2s ease;
  }

  .field-input::placeholder { color: #aaa; }
  .field-input:focus { border-color: #0F6E56; background: #f0faf6; }

  .login-btn {
    width: 100%;
    padding: 12px;
    background: #0F6E56;
    color: white;
    border: none;
    border-radius: 4px;
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.1s ease;
  }

  .login-btn:hover { background: #0a5c47; }
  .login-btn:active { transform: scale(0.99); }
  .login-btn.loading { opacity: 0.7; cursor: not-allowed; }

  .success-banner {
    background: #e1f5ee;
    border: 1px solid #9FE1CB;
    color: #0F6E56;
    font-size: 11px;
    padding: 10px 12px;
    border-radius: 4px;
    margin-bottom: 16px;
  }

  .error-msg { font-size: 11px; color: #c0392b; margin-top: 6px; }

  .login-footer {
    margin-top: 20px;
    text-align: center;
    font-size: 11px;
    color: #888;
  }

  .login-footer a { color: #0F6E56; text-decoration: none; }
  .login-footer a:hover { text-decoration: underline; }
`;

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setSuccess(false);
  setLoading(true);

  try {
    const response = await fetch("http://127.0.0.1:8000/api/login/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    setSuccess(true);
    localStorage.setItem('acess_token',data.access)
    localStorage.setItem('user',JSON.stringify(data.user))


    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 1000);

  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
    
    

  return (
    <>
      <style>{styles}</style>
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
  );
}

export default Login;