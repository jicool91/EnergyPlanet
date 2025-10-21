interface AuthErrorModalProps {
  message: string;
  onRetry: () => void;
  onDismiss: () => void;
}

export function AuthErrorModal({ message, onRetry, onDismiss }: AuthErrorModalProps) {
  return (
    <div className="modal-backdrop" role="alertdialog" aria-modal="true">
      <div className="modal">
        <h2>Ошибка авторизации</h2>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="modal-button secondary" type="button" onClick={onDismiss}>
            Закрыть
          </button>
          <button className="modal-button primary" type="button" onClick={onRetry}>
            Повторить
          </button>
        </div>
      </div>
    </div>
  );
}
