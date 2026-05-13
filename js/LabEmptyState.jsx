import React from 'react';
import styles from './Laboratory.module.css';

const LabEmptyState = ({ theme }) => {
  const cssVars = {
    '--info': theme.info,
    '--info-light': theme.infoLight,
    '--sky-blue': theme.skyBlue,
    '--sky-blue-light': theme.skyBlueLight,
    '--text-muted': theme.textMuted,
    '--table-border': theme.tableBorder,
  };

  return (
    <div className={styles.emptyStateCard} style={cssVars}>
      <svg
        viewBox="0 0 260 160"
        width="260"
        height="160"
        style={{ display: 'block', margin: '0 auto 24px', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="flaskLiquid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--info)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--info-light)" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="beakerLiquid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--sky-blue)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--sky-blue-light)" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="glassShine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="40%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <clipPath id="flaskClip">
            <path d="M100 20 L100 52 L68 110 Q62 122 72 128 L128 128 Q138 122 132 110 L100 52 L100 20 Z" />
          </clipPath>
          <clipPath id="beakerClip">
            <rect x="155" y="42" width="62" height="86" rx="3" />
          </clipPath>
        </defs>
        <g className="lab-empty-flask">
          <path
            d="M100 18 L100 52 L67 111 Q60 126 72 132 L128 132 Q140 126 133 111 L100 52 L100 18"
            fill="none"
            stroke="var(--info)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M100 20 L100 52 L68 110 Q62 122 72 128 L128 128 Q138 122 132 110 L100 52 L100 20 Z"
            fill="var(--info-light)"
            fillOpacity="0.5"
          />
          <g clipPath="url(#flaskClip)">
            <rect x="60" y="98" width="80" height="34" fill="url(#flaskLiquid)" />
            <ellipse cx="100" cy="98" rx="28" ry="5" fill="var(--info)" fillOpacity="0.7" />
          </g>
          <path
            d="M76 80 Q80 90 74 110"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3"
            strokeOpacity="0.6"
            strokeLinecap="round"
          />
          <rect x="94" y="10" width="12" height="12" rx="2" fill="var(--info-light)" fillOpacity="0.6" stroke="var(--info)" strokeWidth="2" />
          <rect x="90" y="7" width="20" height="6" rx="3" fill="var(--info)" />
          <circle className="lab-bubble-1" cx="90" cy="108" r="3.5" fill="var(--info)" fillOpacity="0.8" />
          <circle className="lab-bubble-2" cx="106" cy="112" r="2.5" fill="#86efac" fillOpacity="0.9" />
          <circle className="lab-bubble-3" cx="98" cy="105" r="2" fill="var(--info)" fillOpacity="0.7" />
        </g>
        <g className="lab-empty-beaker">
          <rect x="155" y="42" width="62" height="88" rx="3" fill="var(--sky-blue-light)" fillOpacity="0.5" />
          <path
            d="M155 42 L155 130 Q155 134 159 134 L213 134 Q217 134 217 130 L217 42"
            fill="none"
            stroke="var(--sky-blue)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M152 42 Q152 38 156 38 L214 38 Q218 38 218 42"
            fill="none"
            stroke="var(--sky-blue)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path d="M213 42 Q218 36 222 34" fill="none" stroke="var(--sky-blue)" strokeWidth="2.5" strokeLinecap="round" />
          <g clipPath="url(#beakerClip)">
            <rect x="155" y="96" width="62" height="38" fill="url(#beakerLiquid)" />
            <ellipse cx="186" cy="96" rx="28" ry="4" fill="var(--sky-blue)" fillOpacity="0.7" />
          </g>
          <line x1="218" y1="80" x2="213" y2="80" stroke="var(--sky-blue)" strokeWidth="1.5" />
          <line x1="218" y1="65" x2="211" y2="65" stroke="var(--sky-blue)" strokeWidth="1.5" />
          <line x1="218" y1="112" x2="213" y2="112" stroke="var(--sky-blue)" strokeWidth="1.5" />
          <line x1="162" y1="50" x2="162" y2="126" stroke="#ffffff" strokeWidth="3" strokeOpacity="0.5" strokeLinecap="round" />
          <circle className="lab-bubble-b1" cx="175" cy="108" r="3" fill="var(--sky-blue)" fillOpacity="0.85" />
          <circle className="lab-bubble-b2" cx="192" cy="112" r="2.5" fill="#7dd3fc" fillOpacity="0.9" />
        </g>
        <g>
          <ellipse className="lab-steam-1" cx="176" cy="34" rx="4" ry="3" fill="var(--sky-blue)" fillOpacity="0.4" />
          <ellipse className="lab-steam-2" cx="186" cy="30" rx="3" ry="2.5" fill="var(--sky-blue)" fillOpacity="0.35" />
          <ellipse className="lab-steam-3" cx="196" cy="34" rx="4" ry="3" fill="var(--sky-blue)" fillOpacity="0.4" />
        </g>
        <g>
          <g className="lab-sparkle-1">
            <line x1="70" y1="46" x2="70" y2="54" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
            <line x1="66" y1="50" x2="74" y2="50" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
            <line x1="67.2" y1="47.2" x2="72.8" y2="52.8" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="72.8" y1="47.2" x2="67.2" y2="52.8" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
          </g>
          <g className="lab-sparkle-2">
            <line x1="232" y1="66" x2="232" y2="74" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
            <line x1="228" y1="70" x2="236" y2="70" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
          </g>
          <g className="lab-sparkle-3">
            <line x1="140" y1="86" x2="140" y2="94" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" />
            <line x1="136" y1="90" x2="144" y2="90" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" />
            <line x1="137.2" y1="87.2" x2="142.8" y2="92.8" stroke="#f472b6" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="142.8" y1="87.2" x2="137.2" y2="92.8" stroke="#f472b6" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        </g>
        <ellipse cx="100" cy="144" rx="38" ry="6" fill="var(--table-border)" fillOpacity="0.6" />
        <ellipse cx="186" cy="144" rx="40" ry="6" fill="var(--table-border)" fillOpacity="0.6" />
      </svg>
      <p className={styles.emptyStateTitle}>All quiet in the lab!</p>
      <p className={styles.emptyStateSubtitle}>No pending tests right now</p>
    </div>
  );
};

export default React.memo(LabEmptyState);
