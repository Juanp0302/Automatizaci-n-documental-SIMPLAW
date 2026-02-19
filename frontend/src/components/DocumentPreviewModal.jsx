
import React from 'react';
import './DocumentPreviewModal.css';

const DocumentPreviewModal = ({ isOpen, onClose, pdfUrl, title }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-container animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Vista Previa: {title}</h3>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    {pdfUrl ? (
                        <iframe
                            src={pdfUrl}
                            title="Document Preview"
                            width="100%"
                            height="100%"
                            type="application/pdf"
                        />
                    ) : (
                        <div className="loading-preview">
                            <div className="spinner"></div>
                            <p>Cargando vista previa...</p>
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
                </div>
            </div>
        </div>
    );
};

export default DocumentPreviewModal;
