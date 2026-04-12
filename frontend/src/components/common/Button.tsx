import { forwardRef, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'btn-primary btn-3d glow-border',
      secondary: 'btn-secondary btn-3d glow-border',
      danger: 'btn-danger btn-3d glow-border',
      ghost: 'btn-ghost btn-3d',
    };

    const sizes = {
      sm: 'btn-sm',
      md: '',
      lg: 'btn-lg',
    };

    return (
      <button
        ref={ref}
        className={`btn ${variants[variant]} ${sizes[size]} ${className} ripple`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <div className="spinner-3d w-4 h-4" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
