import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { requestEvents } from '../api/request'
import '../styles/RequestFeedback.css'

export default function RequestFeedback() {
  const [pendingRequests, setPendingRequests] = useState(0)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const handleRequest = (event) => {
      setPendingRequests((count) => Math.max(0, count + (event.detail.active ? 1 : -1)))
    }
    const handleToast = (event) => {
      setToast(event.detail)
    }

    window.addEventListener(requestEvents.request, handleRequest)
    window.addEventListener(requestEvents.toast, handleToast)
    return () => {
      window.removeEventListener(requestEvents.request, handleRequest)
      window.removeEventListener(requestEvents.toast, handleToast)
    }
  }, [])

  useEffect(() => {
    if (!toast) return undefined
    const timeout = window.setTimeout(() => setToast(null), 5000)
    return () => window.clearTimeout(timeout)
  }, [toast])

  return (
    <>
      {pendingRequests > 0 && <div className="request-progress" aria-hidden="true" />}
      {toast && (
        <div
          className={`request-toast request-toast--${toast.type}`}
          role={toast.type === 'error' ? 'alert' : 'status'}
        >
          <span>{toast.message}</span>
          <button type="button" aria-label="Cerrar notificación" onClick={() => setToast(null)}>
            <X size={17} aria-hidden="true" />
          </button>
        </div>
      )}
    </>
  )
}
