import React, { useRef, useEffect } from 'react'

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (open && dialogRef.current) {
      dialogRef.current.showModal()
    } else if (!open && dialogRef.current) {
      dialogRef.current.close()
    }
  }, [open])

  function handleConfirm() {
    dialogRef.current?.close()
    onConfirm()
  }

  function handleCancel() {
    dialogRef.current?.close()
    onCancel()
  }

  return (
    <dialog
      ref={dialogRef}
      id="confirm-dialog"
      aria-labelledby="confirm-dialog-title"
      aria-modal="true"
      onClose={onCancel}
    >
      <h2 id="confirm-dialog-title">{title || 'Are you sure?'}</h2>
      {message && <p style={{ margin: '0.75rem 0 1.5rem' }}>{message}</p>}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button
          className="btn btn-ghost"
          onClick={handleCancel}
          data-testid="confirm-cancel-btn"
        >
          Cancel
        </button>
        <button
          className="btn btn-danger"
          onClick={handleConfirm}
          data-testid="confirm-ok-btn"
        >
          Confirm
        </button>
      </div>
    </dialog>
  )
}
