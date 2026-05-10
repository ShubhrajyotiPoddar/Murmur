/**
 * RegisterForm
 * Account creation card — mirrors LoginForm structure but calls
 * `useAuth().register` and shows a success banner before redirecting.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { UserIcon, LockIcon, EyeIcon, EyeOffIcon, ChatIcon } from '../../components/ui/Icons';

const RegisterForm: React.FC = () => {
  const [username,  setUsername]  = useState('');
  const [password,  setPassword]  = useState('');
  const [pwVisible, setPwVisible] = useState(false);

  const { register, loading, error, success } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void register(username, password);
  };

  const btnLabel = error ? error : loading ? 'Registering…' : 'Register';

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
        <div className="card-title">Create account</div>
        <div className="card-sub">Sign up to get started</div>

        {success && <div className="success-msg">{success}</div>}

        <form onSubmit={handleSubmit}>
          <Input
            id="reg-username"
            label="Username"
            type="text"
            placeholder="Choose a username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            icon={<UserIcon />}
            hasError={!!error && !username}
          />

          <Input
            id="reg-password"
            label="Password"
            type={pwVisible ? 'text' : 'password'}
            placeholder="Choose a password"
            autoComplete="new-password"
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
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>

      {/* Byline */}
      <div className="byline">
        made with <span className="heart">♥</span> by <strong>Shubhra</strong>
      </div>

    </div>
  );
};

export default RegisterForm;
