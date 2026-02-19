import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) throw new Error('useToast must be used within ToastProvider')
    return context
}

let toastId = 0

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = ++toastId
        setToasts(prev => [...prev, { id, message, type }])
        if (duration > 0) {
            setTimeout(() => removeToast(id), duration)
        }
        return id
    }, [])

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    const success = useCallback((msg) => addToast(msg, 'success'), [addToast])
    const error = useCallback((msg) => addToast(msg, 'error', 6000), [addToast])
    const info = useCallback((msg) => addToast(msg, 'info'), [addToast])
    const warning = useCallback((msg) => addToast(msg, 'warning', 5000), [addToast])

    return (
        <ToastContext.Provider value={{ addToast, removeToast, success, error, info, warning }}>
            {children}
            <div className="toast-container">
                {toasts.map(toast => (
                    <div key={toast.id} className={`toast toast-${toast.type}`}>
                        <span className="toast-icon">
                            {toast.type === 'success' && '✅'}
                            {toast.type === 'error' && '❌'}
                            {toast.type === 'info' && 'ℹ️'}
                            {toast.type === 'warning' && '⚠️'}
                        </span>
                        <span className="toast-message">{toast.message}</span>
                        <button className="toast-close" onClick={() => removeToast(toast.id)}>✕</button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}
