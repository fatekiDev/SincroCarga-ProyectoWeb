import './button.css'

/**
 * Botón reutilizable de SincroCarga.
 * variant: "primary" (azul, fondo sólido) | "ghost" (borde, para header)
 */
function Button({ children, onClick, variant = 'primary', disabled = false, type = 'button' }) {
  return (
    <button
      type={type}
      className={`btn btn--${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

export default Button
