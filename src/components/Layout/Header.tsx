import React from 'react';
import { Menu, Bot } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
  onToggleChat: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onToggleChat }) => {
  return (
    <header
      className="mobile-header"
      style={{
        height: '64px',
        backgroundColor: '#ffffff',
        color: 'var(--text-main)',
        display: 'none',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        position: 'sticky',
        top: 0,
        zIndex: 90,
        borderBottom: '1px solid var(--border-light)',
      }}
    >
      {/* Sidebar trigger */}
      <button
        onClick={onToggleSidebar}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-main)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: '8px',
        }}
      >
        <Menu size={24} />
      </button>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="7" height="9" rx="1.5" fill="var(--primary)" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" fill="var(--primary)" opacity="0.6" />
          <rect x="3" y="16" width="7" height="5" rx="1.5" fill="var(--primary)" opacity="0.6" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" fill="var(--primary)" />
        </svg>
        <span
          style={{
            fontWeight: 800,
            fontSize: '1.15rem',
            color: 'var(--slate-900)',
            letterSpacing: '-0.5px',
          }}
        >
          LifeSheet
        </span>
      </div>

      {/* Chat trigger */}
      <button
        onClick={onToggleChat}
        style={{
          background: 'var(--primary-light)',
          border: 'none',
          color: 'var(--primary)',
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <Bot size={18} />
      </button>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 768px) {
          .mobile-header {
            display: flex !important;
          }
        }
      `}} />
    </header>
  );
};
export default Header;
