import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

export default function Navbar({ user, logout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout?.();
    navigate('/');
  };

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: '#202124',
        borderBottom: '1px solid #3c4043',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        fontFamily: "'Google Sans', 'Roboto', Arial, sans-serif",
      }}
    >
      {/* Left: Logo */}
      <Link
        to="/"
        style={{
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '22px',
          fontWeight: '500',
          letterSpacing: '-0.5px',
        }}
      >
        <span style={{ color: '#4285f4' }}>C</span>
        <span style={{ color: '#ea4335' }}>r</span>
        <span style={{ color: '#fbbc05' }}>a</span>
        <span style={{ color: '#4285f4' }}>w</span>
        <span style={{ color: '#34a853' }}>l</span>
        <span style={{ color: '#ea4335' }}>X</span>
      </Link>

      {/* Right: Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {user ? (
          <>
            {/* User avatar */}
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#1a73e8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '600',
              textTransform: 'uppercase',
              cursor: 'default',
            }} title={user.email}>
              {user.name?.charAt(0) || 'U'}
            </div>
            <span style={{ color: '#9aa0a6', fontSize: '13px' }}>{user.name}</span>
            <button
              onClick={handleLogout}
              title="Sign out"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#9aa0a6',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '13px',
                padding: '6px 10px',
                borderRadius: '4px',
                transition: 'background 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.background = '#303134'}
              onMouseOut={e => e.currentTarget.style.background = 'none'}
            >
              <LogOut size={15} />
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link
              to="/admin/login"
              style={{
                color: '#9aa0a6',
                fontSize: '13px',
                textDecoration: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                transition: 'background 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.background = '#303134'}
              onMouseOut={e => e.currentTarget.style.background = 'none'}
            >
              Admin
            </Link>
            <Link
              to="/login"
              style={{
                background: '#1a73e8',
                color: '#fff',
                fontSize: '13px',
                fontWeight: '500',
                textDecoration: 'none',
                padding: '8px 18px',
                borderRadius: '4px',
                transition: 'background 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.background = '#1765cc'}
              onMouseOut={e => e.currentTarget.style.background = '#1a73e8'}
            >
              Sign in
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}