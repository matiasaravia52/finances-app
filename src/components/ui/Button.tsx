import { forwardRef } from 'react'
import styles from '@/styles/Button.module.css'

type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'small' | 'default' | 'large'
  loading?: boolean
  className?: string
  disabled?: boolean
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  style?: React.CSSProperties
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>((
  { 
    variant = 'primary',
    size = 'default',
    loading = false,
    className = '',
    disabled,
    children,
    onClick,
    ...props
  }, 
  ref
) => {
  const classes = [
    styles.button,
    styles[variant],
    size !== 'default' && styles[size],
    loading && styles.loading,
    className
  ].filter(Boolean).join(' ')

  return (
    <button
      ref={ref}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
})

Button.displayName = 'Button'

export default Button
