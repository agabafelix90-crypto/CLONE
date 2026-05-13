import React, { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import styles from './Laboratory.module.css';

const testReasons = [
  'The sample collection has failed and we decided on another alternative so we returned the patient’s money',
  'This test was ordered by mistake',
  'We have not been able to do the test due to equipment breakdown',
  'We have not been able to do the test due to electricity breakdown',
  'Other (please specify)',
];

const cardReasons = [
  'Patient changed his mind',
  'Equipment breakdown preventing all tests',
  'Electricity breakdown preventing all tests',
  'Patient did not show up for the tests',
  'Tests no longer required based on new diagnosis',
  'Other (please specify)',
];

function LabConfirmationModal({
  show,
  confirmDialog,
  loadingStates,
  confirmText,
  deleteReason,
  deleteSalesRecord,
  onUpdateConfirmText,
  onToggleDeleteSalesRecord,
  onBack,
  onCancel,
  onConfirm,
  onReasonSelect,
}) {
  const isProcessing = loadingStates.deleteTest || loadingStates.deleteCard;

  const reasons = useMemo(
    () => (confirmDialog.type === 'test' ? testReasons : cardReasons),
    [confirmDialog.type]
  );

  if (!show) {
    return null;
  }

  return (
    <div className={styles.modalBackdrop} onClick={onCancel} role="dialog" aria-modal="true">
      <div className={styles.modalPanel} onClick={(e) => e.stopPropagation()}>
        {confirmDialog.step === 1 && (
          <>
            <h2 className={styles.modalTitle} id="confirmModalTitle">
              {confirmDialog.type === 'test' ? 'Cancel Test' : 'Cancel Lab Request'}
            </h2>
            <div className={styles.warningBox}>
              <strong>Warning:</strong> this action cannot be undone.
            </div>
            <p className={styles.modalText}>
              {confirmDialog.type === 'test' ? (
                <>Are you sure you want to cancel the test <strong>{confirmDialog.data?.testName}</strong> for <strong>{confirmDialog.data?.patient?.first_name} {confirmDialog.data?.patient?.last_name}</strong>?</>
              ) : (
                <>Are you sure you want to cancel the entire lab request for <strong>{confirmDialog.data?.patient?.first_name} {confirmDialog.data?.patient?.last_name}</strong>? This will remove all pending tests.</>
              )}
            </p>
            <input
              className={styles.input}
              type="text"
              placeholder="Type yes to continue"
              value={confirmText}
              onChange={(event) => onUpdateConfirmText(event.target.value)}
              disabled={isProcessing}
              aria-label="Type yes to confirm deletion"
              autoFocus
            />
            <div className={styles.modalActions}>
              <button type="button" className={styles.secondaryButton} onClick={onCancel} disabled={isProcessing}>
                Cancel
              </button>
              <button
                type="button"
                className={styles.negativeButton}
                onClick={onConfirm}
                disabled={confirmText.trim().toLowerCase() !== 'yes' || isProcessing}
              >
                Continue
              </button>
            </div>
          </>
        )}

        {confirmDialog.step === 2 && (
          <>
            <h2 className={styles.modalTitle}>Sales Record Handling</h2>
            <p className={styles.modalText}>
              If money was refunded, select Yes. If no refund was issued, select No.
            </p>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="salesRecord"
                  checked={deleteSalesRecord === true}
                  onChange={() => onToggleDeleteSalesRecord(true)}
                />
                Yes
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="salesRecord"
                  checked={deleteSalesRecord === false}
                  onChange={() => onToggleDeleteSalesRecord(false)}
                />
                No
              </label>
            </div>
            <div className={styles.modalActions}>
              <button type="button" className={styles.secondaryButton} onClick={onBack} disabled={isProcessing}>
                Back
              </button>
              <button type="button" className={styles.primaryButton} onClick={onConfirm} disabled={isProcessing}>
                Continue
              </button>
            </div>
          </>
        )}

        {confirmDialog.step === 3 && (
          <>
            <h2 className={styles.modalTitle}>Reason for Deletion</h2>
            <p className={styles.modalText}>
              Select or type the reason for deleting this {confirmDialog.type === 'test' ? 'test' : 'lab request'}.
            </p>
            <div className={styles.reasonsGrid}>
              {reasons.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  className={`${styles.reasonButton} ${deleteReason === reason ? styles.reasonButtonSelected : ''}`}
                  onClick={() => onReasonSelect(reason)}
                >
                  {reason}
                </button>
              ))}
            </div>
            <textarea
              className={styles.textarea}
              placeholder="You can edit the selected reason or add more context..."
              value={deleteReason}
              onChange={(event) => onReasonSelect(event.target.value)}
              disabled={isProcessing}
            />
            <div className={styles.modalActions}>
              <button type="button" className={styles.secondaryButton} onClick={onBack} disabled={isProcessing}>
                Back
              </button>
              <button
                type="button"
                className={styles.negativeButton}
                onClick={onConfirm}
                disabled={!deleteReason.trim() || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="spin" /> Processing...
                  </>
                ) : (
                  'Confirm Delete'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default LabConfirmationModal;
