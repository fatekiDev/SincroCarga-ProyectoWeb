import { useState } from 'react'

export default function LogoutButton({ onLogout, className, label = 'Cerrar sesión' }) {
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleClick = async () => {
    setError('')
    setIsSubmitting(true)

    try {
      await onLogout()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={handleClick}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Cerrando sesión…' : label}
      </button>
      {error && <span role="alert">{error}</span>}
    </>
  )
}
