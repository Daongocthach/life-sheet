import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { isFirebaseConfigured } from '../services/firebase';
import { Crown, Mail, Lock, ArrowRight } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, authError, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ email và mật khẩu.');
      return;
    }

    const success = await login(email.trim(), password);
    if (!success) {
      // If store authError has a value, use it or fallback
      setErrorMsg(authError || 'Đăng nhập không thành công. Vui lòng kiểm tra lại tài khoản.');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100vw',
        background: 'radial-gradient(circle at 10% 20%, rgba(37, 99, 235, 0.08) 0%, rgba(255, 255, 255, 1) 90.2%)',
        backgroundColor: 'var(--background)',
        padding: '20px',
      }}
    >
      {/* Login Card */}
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '40px 32px',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05), 0 0 0 1px var(--border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: '24px',
        }}
      >
        {/* Brand identity */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '8px',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)',
            }}
          >
            <Crown size={28} fill="var(--primary)" stroke="none" />
          </div>
          <h1
            style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              color: 'var(--slate-900)',
              letterSpacing: '-0.75px',
            }}
          >
            LifeSheet Premium
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            Đăng nhập để theo dõi Tài chính, Dinh dưỡng & Tập luyện của bạn
          </p>
        </div>

        {/* Error notification */}
        {(errorMsg || authError) && (
          <div
            style={{
              backgroundColor: 'var(--error-light)',
              border: '1.5px solid rgba(239, 68, 68, 0.15)',
              borderRadius: '10px',
              padding: '12px 16px',
              color: 'var(--error)',
              fontSize: '0.85rem',
              fontWeight: 500,
              lineHeight: '1.4',
            }}
          >
            {errorMsg || authError}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Email input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--slate-500)' }}>
              Email đăng nhập
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={18}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--slate-400)',
                }}
              />
              <input
                type="email"
                placeholder="ten@vi-du.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="form-input"
                style={{
                  paddingLeft: '44px',
                }}
                required
              />
            </div>
          </div>

          {/* Password input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--slate-500)' }}>
              Mật khẩu
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--slate-400)',
                }}
              />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="form-input"
                style={{
                  paddingLeft: '44px',
                }}
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{
              padding: '12px',
              fontSize: '0.925rem',
              fontWeight: 700,
              width: '100%',
              marginTop: '8px',
              opacity: isLoading ? 0.75 : 1,
            }}
          >
            {isLoading ? (
              'Đang xác thực...'
            ) : (
              <>
                Đăng nhập <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Offline Mode Hint box */}
        {!isFirebaseConfigured && (
          <div
            style={{
              backgroundColor: 'var(--primary-light)',
              border: '1.5px solid rgba(37, 99, 235, 0.1)',
              borderRadius: '10px',
              padding: '12px 16px',
              fontSize: '0.8rem',
              color: 'var(--primary)',
              lineHeight: '1.5',
            }}
          >
            <strong style={{ display: 'block', marginBottom: '4px' }}>💡 Chế độ Offline (Mock Mode) đang kích hoạt:</strong>
            Nhập email <code style={{ backgroundColor: '#ffffff', padding: '1px 4px', borderRadius: '3px', fontWeight: 'bold' }}>admin@lifesheet.vn</code> và mật khẩu <code style={{ backgroundColor: '#ffffff', padding: '1px 4px', borderRadius: '3px', fontWeight: 'bold' }}>admin123</code> để đăng nhập dùng thử.
          </div>
        )}
      </div>
    </div>
  );
};
export default LoginScreen;
