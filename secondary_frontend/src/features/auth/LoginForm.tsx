/**
 * LoginForm
 * Full login card including logo, username/password fields,
 * password visibility toggle, error feedback on the button,
 * and a link to the register page.
 * All async logic delegated to the `useAuth` hook.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { UserIcon, LockIcon, EyeIcon, EyeOffIcon, ChatIcon } from '../../components/ui/Icons';

const LoginForm: React.FC = () => {
  const [username,   setUsername]   = useState('');
  const [password,   setPassword]   = useState('');
  const [pwVisible,  setPwVisible]  = useState(false);

  const { login, loading, error } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void login(username, password);
  };

  const btnLabel = error ? error : loading ? 'Signing in…' : 'Login';

  return (
    <div className="login-wrap">

      {/* Logo */}
      <div className="logo">
        <div className="logo-icon">
          <ChatIcon stroke="#fff" width="24" height="24" />
        </div>
        <div className="logo-name">Murmur</div>
        <div className="logo-tagline">quiet conversations, loud connections</div>
      </div>

      {/* Card */}
      <div className="login-card">
        <div className="card-title">Welcome back</div>
        <div className="card-sub">Sign in to your account to continue</div>

        <form onSubmit={handleSubmit}>
          <Input
            id="username"
            label="Username"
            type="text"
            placeholder="Enter your username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            icon={<UserIcon />}
            hasError={!!error && !username}
          />

          <Input
            id="password"
            label="Password"
            type={pwVisible ? 'text' : 'password'}
            placeholder="Enter your password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<LockIcon />}
            hasError={!!error && !password}
            trailing={
              <button
                type="button"
                className="toggle-pw"
                onClick={() => setPwVisible((v) => !v)}
                title={pwVisible ? 'Hide password' : 'Show password'}
              >
                {pwVisible ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            }
          />

          <Button
            type="submit"
            className={`btn-login${error ? ' error' : ''}`}
            disabled={loading}
            style={{ opacity: loading ? 0.75 : 1 }}
          >
            {btnLabel}
          </Button>
        </form>

        <div className="divider-or"><span>or</span></div>

        <div className="register-row">
          Don't have an account? <Link to="/register">Register</Link>
        </div>
      </div>

      {/* Byline */}
      <div className="byline">
        made with <span className="heart">♥</span> by <strong>Shubhra</strong>
      </div>

    </div>
  );
};

export default LoginForm;
