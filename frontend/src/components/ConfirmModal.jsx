import './ConfirmModal.css'

function ConfirmModal({ isOpen, onConfirm, onCancel, title, message, confirmText = 'Confirmar', danger = false }) {
    if (!isOpen) return null

    return (
        <div className="confirm-overlay" onClick={onCancel}>
            <div className="confirm-modal animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="confirm-icon">
                    {danger ? '⚠️' : 'ℹ️'}
                </div>
                <h3 className="confirm-title">{title}</h3>
                <p className="confirm-message">{message}</p>
                <div className="confirm-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={onCancel}
                    >
                        Cancelar
                    </button>
                    <button
                        className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ConfirmModal
