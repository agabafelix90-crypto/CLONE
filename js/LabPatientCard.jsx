import React, { memo, useMemo } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import styles from './Laboratory.module.css';

function LabPatientCard({
  patient,
  theme,
  isCardLoading,
  isTestLoading,
  onDeleteCard,
  onDeleteTest,
  onEnterResults,
}) {
  const hasSingleTest = patient.tests.length <= 1;
  const cardVars = useMemo(
    () => ({
      '--card-border': theme.cardBorder,
      '--card-bg': theme.cardBg,
      '--table-header': theme.tableHeader,
      '--info': theme.info,
      '--info-light': theme.infoLight,
      '--sky-blue': theme.skyBlue,
      '--danger': theme.danger,
      '--danger-light': theme.dangerLight,
      '--text-primary': theme.textPrimary,
      '--text-secondary': theme.textSecondary,
      '--text-muted': theme.textMuted,
    }),
    [theme]
  );

  return (
    <article className={styles.card} style={cardVars}>
      {isCardLoading && (
        <div className={styles.cardOverlay} aria-hidden="true">
          <Loader2 size={24} className="spin" />
        </div>
      )}

      <div className={styles.cardHeader}>
        <div className={styles.patientInfo}>
          <h2 className={styles.patientName}>{`${patient.first_name} ${patient.last_name}`}</h2>
          <span className={isCardLoading ? styles.loadingBadge : styles.badge}>
            {patient.totalLabTests} tests
          </span>
        </div>

        <button
          type="button"
          className={styles.iconButton}
          onClick={() => onDeleteCard(patient)}
          disabled={isCardLoading}
          aria-label="Delete full lab request"
        >
          {isCardLoading ? <Loader2 size={20} className="spin" /> : <Trash2 size={20} />}
        </button>
      </div>

      <div className={styles.detailsGrid}>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>File ID</span>
          <span className={styles.detailValue}>{patient.file_id}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Age</span>
          <span className={styles.detailValue}>{patient.age} yrs</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Sex</span>
          <span className={styles.detailValue}>{patient.sex}</span>
        </div>
      </div>

      <section className={styles.testSection} aria-label="Patient lab tests">
        <p className={styles.testSectionTitle}>Tests to be done</p>
        <ul className={styles.testList}>
          {patient.tests.map((test, index) => {
            const testLoading = isTestLoading(patient, index);
            const testDisabled = hasSingleTest || testLoading || isCardLoading;

            return (
              <li key={`${patient.contact_id}-${index}`} className={styles.testItem}>
                <span className={styles.testNumber}>{index + 1}.</span>
                <span className={styles.testName}>
                  {test}
                  {testLoading && <Loader2 size={12} className="spin" style={{ marginLeft: 8 }} />}
                </span>
                <button
                  type="button"
                  className={styles.deleteTestButton}
                  onClick={() => onDeleteTest(patient, index, test)}
                  disabled={testDisabled}
                  aria-label={`Cancel test ${test}`}
                >
                  {testLoading ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <button
        type="button"
        className={styles.primaryButton}
        onClick={() => onEnterResults(patient)}
        disabled={isCardLoading}
        aria-disabled={isCardLoading}
      >
        {isCardLoading ? 'Processing…' : 'Enter Results'}
      </button>
    </article>
  );
}

export default memo(LabPatientCard);
