import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Loader2, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { urls } from './config.dev';
import TestResultModal from './TestResultModal';
import { useNavigate } from 'react-router-dom';
import { resolveTheme, parseThemeFromSearch } from './themeUtils';
import {
  clearTokenFromUrl,
  getTokenFromUrlOrSession,
  saveSessionToken,
  handleInvalidSession,
  getStoredToken,
} from './authUtils';
import Topbar from './Topbar';
import LabPatientCard from './LabPatientCard';
import LabConfirmationModal from './LabConfirmationModal';
import LabEmptyState from './LabEmptyState';
import styles from './Laboratory.module.css';

const colors = {
  blue: {
    mainBg: '#f8fafc',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    tableHeader: '#f1f5f9',
    accent: '#16a34a',
    accentLight: '#dcfce7',
    danger: '#dc2626',
    dangerLight: '#fef2f2',
    warning: '#d97706',
    warningLight: '#fffbeb',
    info: '#2563eb',
    infoLight: '#eff6ff',
    skyBlue: '#38bdf8',
    skyBlueLight: '#e0f2fe',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#64748b',
  },
  white: {
    mainBg: '#f8fafc',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    tableHeader: '#f1f5f9',
    accent: '#16a34a',
    accentLight: '#dcfce7',
    danger: '#dc2626',
    dangerLight: '#fef2f2',
    warning: '#d97706',
    warningLight: '#fffbeb',
    info: '#2563eb',
    infoLight: '#eff6ff',
    skyBlue: '#38bdf8',
    skyBlueLight: '#e0f2fe',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#64748b',
  },
};

function Laboratory() {
  const [pendingLabTests, setPendingLabTests] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [clinicDetails, setClinicDetails] = useState(null);
  const [clinicSettings, setClinicSettings] = useState({
    use_drug_expiry_date: 'no',
    use_drug_batch_numbers: 'no',
  });
  const [confirmDialog, setConfirmDialog] = useState({ show: false, type: '', data: null, step: 1 });
  const [confirmText, setConfirmText] = useState('');
  const [deleteSalesRecord, setDeleteSalesRecord] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [actionInProgress, setActionInProgress] = useState(null);
  const [loadingStates, setLoadingStates] = useState({
    fetchClinic: false,
    fetchTests: false,
    deleteTest: false,
    deleteCard: false,
    refreshing: false,
  });
  const [notification, setNotification] = useState({ show: false, type: 'success', message: '' });
  const [currentTheme, setCurrentTheme] = useState('blue');

  const navigate = useNavigate();
  const urlTheme = parseThemeFromSearch(window.location.search);
  const urlToken = getTokenFromUrlOrSession();

  const notificationTimerRef = useRef(null);
  const refreshIntervalRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    if (urlToken) {
      saveSessionToken(urlToken);
      clearTokenFromUrl();
    }
  }, [urlToken]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  const theme = colors[currentTheme] || colors.blue;

  const pageVars = useMemo(
    () => ({
      '--page-bg': theme.mainBg,
      '--card-bg': theme.cardBg,
      '--card-border': theme.cardBorder,
      '--table-header': theme.tableHeader,
      '--accent': theme.accent,
      '--accent-light': theme.accentLight,
      '--danger': theme.danger,
      '--danger-light': theme.dangerLight,
      '--warning': theme.warning,
      '--warning-light': theme.warningLight,
      '--info': theme.info,
      '--info-light': theme.infoLight,
      '--sky-blue': theme.skyBlue,
      '--sky-blue-light': theme.skyBlueLight,
      '--text-primary': theme.textPrimary,
      '--text-secondary': theme.textSecondary,
      '--text-muted': theme.textMuted,
    }),
    [theme]
  );

  const showNotification = useCallback((type, message) => {
    if (!isMountedRef.current) {
      return;
    }

    setNotification({ show: true, type, message });

    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
    }

    notificationTimerRef.current = window.setTimeout(() => {
      if (isMountedRef.current) {
        setNotification((prev) => ({ ...prev, show: false }));
      }
    }, 5000);
  }, []);

  const setLoading = useCallback((key, value) => {
    setLoadingStates((prev) => ({ ...prev, [key]: value }));
  }, []);

  const parseLabTests = useCallback((labTestsString) => {
    if (!labTestsString) return [];

    return labTestsString
      .split(/[;,]/)
      .map((value) => value.trim())
      .filter(Boolean)
      .map((raw) => {
        const normalized = raw.replace(/^Lab Test:\s*/i, '').trim();
        const mappings = {
          'hb electrolysis': 'HB Electrolysis',
          'hiv/hct/rct': 'HIV/HCT/RCT',
          'blood grouping': 'Blood Grouping',
          'stool analysis': 'Stool Analysis',
        };
        return mappings[normalized.toLowerCase()] || normalized;
      });
  }, []);

  const processPendingLabTests = useCallback(
    (rawData) =>
      (Array.isArray(rawData) ? rawData : []).map((patient) => {
        const tests = parseLabTests(patient.lab_tests || '');
        return {
          ...patient,
          tests,
          totalLabTests: tests.length,
          lab_tests: tests.join('; '),
        };
      }),
    [parseLabTests]
  );

  const isCardLoading = useCallback(
    (patient) => actionInProgress === `card-${patient.contact_id}`,
    [actionInProgress]
  );

  const isTestLoading = useCallback(
    (patient, index) => actionInProgress === `test-${patient.contact_id}-${index}`,
    [actionInProgress]
  );

  const resetConfirmation = useCallback(() => {
    setConfirmDialog({ show: false, type: '', data: null, step: 1 });
    setConfirmText('');
    setDeleteReason('');
    setDeleteSalesRecord(false);
    setActionInProgress(null);
  }, []);

  const handleDeleteTest = useCallback((patient, testIndex, testName) => {
    setConfirmDialog({ show: true, type: 'test', data: { patient, testIndex, testName }, step: 1 });
    setConfirmText('');
    setDeleteSalesRecord(false);
    setDeleteReason('');
  }, []);

  const handleDeleteCard = useCallback((patient) => {
    setConfirmDialog({ show: true, type: 'card', data: { patient }, step: 1 });
    setConfirmText('');
    setDeleteSalesRecord(false);
    setDeleteReason('');
  }, []);

  const executeDeleteTest = useCallback(async () => {
    if (!deleteReason.trim()) {
      showNotification('error', 'Please provide a reason for deletion.');
      return;
    }

    const { patient, testIndex } = confirmDialog.data || {};
    if (!patient) {
      showNotification('error', 'Unable to locate test details.');
      resetConfirmation();
      return;
    }

    setLoading('deleteTest', true);
    setActionInProgress(`test-${patient.contact_id}-${testIndex}`);

    const tests = [...patient.tests];
    const canceledTest = tests[testIndex];
    const remainingTests = tests.filter((_, index) => index !== testIndex);
    const tokenToUse = getStoredToken();
    if (!tokenToUse) {
      handleInvalidSession(navigate);
      return;
    }

    try {
      const response = await fetch(urls.cancelSpecificLabTest, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenToUse,
          file_id: patient.file_id,
          canceled_test: canceledTest,
          remaining_tests: remainingTests,
          delete_sales_record: deleteSalesRecord,
          deletion_reason: deleteReason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel test.');
      }

      setPendingLabTests((prev) =>
        prev
          .map((item) => {
            if (item.contact_id !== patient.contact_id) return item;
            return {
              ...item,
              tests: remainingTests,
              totalLabTests: remainingTests.length,
              lab_tests: remainingTests.join('; '),
            };
          })
          .filter((item) => item.totalLabTests > 0)
      );
      showNotification('success', 'Test canceled successfully.');
    } catch (error) {
      console.error('Error canceling test:', error);
      showNotification('error', error.message || 'Network error while canceling test.');
    } finally {
      setLoading('deleteTest', false);
      setActionInProgress(null);
      resetConfirmation();
    }
  }, [confirmDialog.data, deleteReason, deleteSalesRecord, handleInvalidSession, navigate, resetConfirmation, setLoading, showNotification]);

  const executeDeleteCard = useCallback(async () => {
    if (!deleteReason.trim()) {
      showNotification('error', 'Please provide a reason for deletion.');
      return;
    }

    const { patient } = confirmDialog.data || {};
    if (!patient) {
      showNotification('error', 'Unable to locate lab request details.');
      resetConfirmation();
      return;
    }

    setLoading('deleteCard', true);
    setActionInProgress(`card-${patient.contact_id}`);

    const tokenToUse = getStoredToken();
    if (!tokenToUse) {
      handleInvalidSession(navigate);
      return;
    }

    try {
      const response = await fetch(urls.cancelLabRequest3, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenToUse,
          file_id: patient.file_id,
          canceled_test: patient.tests,
          remaining_tests: [],
          delete_sales_record: deleteSalesRecord,
          deletion_reason: deleteReason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel lab request.');
      }

      setPendingLabTests((prev) => prev.filter((item) => item.contact_id !== patient.contact_id));
      showNotification('success', 'Lab request canceled successfully.');
    } catch (error) {
      console.error('Error canceling lab request:', error);
      showNotification('error', error.message || 'Network error while canceling lab request.');
    } finally {
      setLoading('deleteCard', false);
      setActionInProgress(null);
      resetConfirmation();
    }
  }, [confirmDialog.data, deleteReason, deleteSalesRecord, handleInvalidSession, navigate, resetConfirmation, setLoading, showNotification]);

  const handleConfirm = useCallback(() => {
    if (confirmDialog.step === 1) {
      if (confirmText.trim().toLowerCase() !== 'yes') {
        return;
      }
      setConfirmDialog((prev) => ({ ...prev, step: 2 }));
      return;
    }

    if (confirmDialog.step === 2) {
      setConfirmDialog((prev) => ({ ...prev, step: 3 }));
      return;
    }

    if (confirmDialog.step === 3) {
      if (confirmDialog.type === 'test') {
        executeDeleteTest();
      } else if (confirmDialog.type === 'card') {
        executeDeleteCard();
      }
    }
  }, [confirmDialog, confirmText, executeDeleteCard, executeDeleteTest]);

  const handleBack = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, step: Math.max(1, prev.step - 1) }));
  }, []);

  const handleReasonSelect = useCallback((reason) => {
    setDeleteReason(reason);
  }, []);

  const fetchClinicDetails = useCallback(
    async (tokenToUse) => {
      setLoading('fetchClinic', true);
      try {
        const response = await fetch(urls.fetchclinicdetails, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenToUse }),
        });

        if (!response.ok) {
          throw new Error('Failed to load clinic details.');
        }

        const data = await response.json();
        setClinicDetails(data);
      } catch (error) {
        console.error('Error fetching clinic details:', error);
        showNotification('error', 'Unable to load clinic details.');
      } finally {
        setLoading('fetchClinic', false);
      }
    },
    [setLoading, showNotification]
  );

  const fetchPendingLabTests = useCallback(
    async (tokenToUse, showRefreshing = false) => {
      setLoading(showRefreshing ? 'refreshing' : 'fetchTests', true);
      try {
        const response = await fetch(urls.pendinglabtests, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenToUse }),
        });

        if (!response.ok) {
          throw new Error('Failed to load pending lab tests.');
        }

        const data = await response.json();
        setPendingLabTests(processPendingLabTests(data));
        if (showRefreshing) {
          showNotification('success', 'Lab tests refreshed.');
        }
      } catch (error) {
        console.error('Error fetching pending lab tests:', error);
        if (showRefreshing) {
          showNotification('error', 'Unable to refresh lab tests.');
        }
      } finally {
        setLoading('fetchTests', false);
        setLoading('refreshing', false);
      }
    },
    [processPendingLabTests, setLoading, showNotification]
  );

  const handleManualRefresh = useCallback(() => {
    const tokenToUse = getStoredToken();
    if (!tokenToUse) {
      handleInvalidSession(navigate);
      return;
    }
    fetchPendingLabTests(tokenToUse, true);
  }, [fetchPendingLabTests, navigate]);

  useEffect(() => {
    const tokenToUse = urlToken || getStoredToken();
    if (!tokenToUse) {
      handleInvalidSession(navigate);
      return;
    }

    let active = true;

    const loadSession = async () => {
      try {
        const response = await fetch(urls.security, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenToUse }),
        });

        if (!response.ok) {
          throw new Error('Security validation failed.');
        }

        const data = await response.json();
        if (data.message !== 'Session valid') {
          handleInvalidSession(navigate);
          return;
        }

        const activeToken = data.clinic_session_token || tokenToUse;
        saveSessionToken(activeToken);
        setCurrentTheme(resolveTheme(urlTheme, data.colour || ''));
        setClinicSettings({
          use_drug_expiry_date: data.use_drug_expiry_date || 'no',
          use_drug_batch_numbers: data.use_drug_batch_numbers || 'no',
        });
        setPendingLabTests([]);

        await Promise.all([fetchClinicDetails(activeToken), fetchPendingLabTests(activeToken)]);
        if (!active) return;

        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
        refreshIntervalRef.current = window.setInterval(() => fetchPendingLabTests(activeToken), 30000);
      } catch (error) {
        console.error('Security initialization error:', error);
        showNotification('error', 'Unable to validate session.');
        handleInvalidSession(navigate);
      }
    };

    loadSession();
    return () => {
      active = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchClinicDetails, fetchPendingLabTests, navigate, showNotification, urlToken, urlTheme]);

  const handleSubmitResults = useCallback((patient) => {
    setSelectedPatient(patient);
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setSelectedPatient(null);
  }, []);

  const handleSaveResults = useCallback((contactId, results) => {
    console.log('Saving lab results for', contactId, results);
  }, []);

  const notificationClassName = useMemo(() => {
    if (notification.type === 'success') {
      return `${styles.notification} ${styles.success}`;
    }
    if (notification.type === 'error') {
      return `${styles.notification} ${styles.error}`;
    }
    return `${styles.notification} ${styles.warning}`;
  }, [notification.type]);

  return (
    <div className={styles.labPage} style={pageVars}>
      <Topbar token={getStoredToken()} themeColor={currentTheme} />

      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Pending Lab Tests</h1>
        <button
          type="button"
          className={styles.refreshButton}
          onClick={handleManualRefresh}
          disabled={loadingStates.refreshing}
          aria-label="Refresh lab tests"
        >
          {loadingStates.refreshing ? <Loader2 size={20} className="spin" /> : <RefreshCw size={20} />}
        </button>
      </header>

      {notification.show && (
        <div className={notificationClassName} role="status" aria-live="polite">
          {notification.type === 'success' && <CheckCircle size={20} />}
          {notification.type === 'error' && <XCircle size={20} />}
          {notification.type === 'warning' && <AlertTriangle size={20} />}
          {notification.message}
        </div>
      )}

      {loadingStates.fetchTests && pendingLabTests.length === 0 ? (
        <div className={styles.loadingState}>
          <div className={styles.statusMessage}>
            <Loader2 size={24} className="spin" style={{ marginBottom: 14 }} />
            Loading lab tests...
          </div>
        </div>
      ) : pendingLabTests.length === 0 ? (
        <div className={styles.emptyStateWrapper}>
          <LabEmptyState theme={theme} />
        </div>
      ) : (
        <div className={styles.grid}>
          {pendingLabTests.map((patient) => (
            <LabPatientCard
              key={patient.contact_id}
              patient={patient}
              theme={theme}
              isCardLoading={isCardLoading(patient)}
              isTestLoading={(patientArg, index) => isTestLoading(patientArg, index)}
              onDeleteCard={handleDeleteCard}
              onDeleteTest={handleDeleteTest}
              onEnterResults={handleSubmitResults}
            />
          ))}
        </div>
      )}

      {showModal && selectedPatient && (
        <TestResultModal
          patient={selectedPatient}
          clinicDetails={clinicDetails}
          token={getStoredToken()}
          totalLabTests={selectedPatient.totalLabTests}
          labTests={selectedPatient.lab_tests}
          useDrugExpiryDate={clinicSettings.use_drug_expiry_date}
          useDrugBatchNumbers={clinicSettings.use_drug_batch_numbers}
          onClose={handleCloseModal}
          onSubmit={handleSaveResults}
        />
      )}

      <LabConfirmationModal
        show={confirmDialog.show}
        confirmDialog={confirmDialog}
        loadingStates={loadingStates}
        confirmText={confirmText}
        deleteReason={deleteReason}
        deleteSalesRecord={deleteSalesRecord}
        onUpdateConfirmText={setConfirmText}
        onToggleDeleteSalesRecord={setDeleteSalesRecord}
        onBack={handleBack}
        onCancel={resetConfirmation}
        onConfirm={handleConfirm}
        onReasonSelect={handleReasonSelect}
      />
    </div>
  );
}

export default Laboratory;
