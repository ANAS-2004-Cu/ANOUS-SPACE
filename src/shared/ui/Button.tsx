import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  children,
  style,
  ...rest
}) => {
  const sizeStyles: Record<'sm' | 'md' | 'lg', React.CSSProperties> = {
    sm: { padding: '5px 10px', fontSize: 12, borderRadius: 6 },
    md: { padding: '8px 14px', fontSize: 13, borderRadius: 7 },
    lg: { padding: '10px 18px', fontSize: 14, borderRadius: 8 },
  };

  const variantStyles: Record<'primary' | 'secondary' | 'ghost' | 'danger', React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--accent)',
      color: '#FFFFFF',
      border: '1px solid var(--accent)',
    },
    secondary: {
      backgroundColor: 'var(--bg-surface)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-subtle)',
      boxShadow: 'var(--card-top-highlight)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid transparent',
    },
    danger: {
      backgroundColor: 'var(--danger-subtle)',
      color: 'var(--danger)',
      border: '1px solid rgba(239, 68, 68, 0.35)',
    },
  };

  return (
    <button
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontWeight: 500,
        width: fullWidth ? '100%' : undefined,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
      }}
      {...rest}
    >
      {loading && <span className="spinner" style={{ width: 13, height: 13 }} />}
      {children}
    </button>
  );
};
