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
    sm: { padding: '6px 11px', fontSize: 12, borderRadius: 7 },
    md: { padding: '8px 14px', fontSize: 13, borderRadius: 8 },
    lg: { padding: '11px 18px', fontSize: 14, borderRadius: 9 },
  };

  const variantStyles: Record<'primary' | 'secondary' | 'ghost' | 'danger', React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--accent)',
      color: '#FFFFFF',
      border: '1px solid var(--accent)',
      boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.16)',
    },
    secondary: {
      backgroundColor: 'var(--bg-control)',
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
      border: '1px solid var(--danger-border)',
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
