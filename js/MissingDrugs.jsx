import React, { useState, useEffect, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { urls } from "./config.dev";

// ─── DESIGN TOKENS (matching DoctorsDashboard) ───────────────────────────────
const colors = {
  sidebarBg: '#0a1e4a',
  sidebarBorder: '#1e3a8a',
  activeNavBg: '#2563eb',
  activeNavText: '#ffffff',
  inactiveNavText: '#e0e7ff',
  navHoverBg: '#1e3a8a',
  sectionHeaderText: '#94a3b8',
  mainBg: '#f8fafc',
  cardBg: '#ffffff',
  cardBorder: '#e2e8f0',
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
  tableHeader: '#f1f5f9',
  tableBorder: '#e2e8f0',
  badgeGreen: { bg: '#dcfce7', text: '#166534' },
  badgeRed: { bg: '#fee2e2', text: '#991b1b' },
  badgeOrange: { bg: '#ffedd5', text: '#9a3412' },
  badgeBlue: { bg: '#dbeafe', text: '#1e40af' },
  badgeSky: { bg: '#e0f2fe', text: '#0369a1' },
  badgeGray: { bg: '#f1f5f9', text: '#475569' },
  iconBright: '#fbbf24',
  iconHover: '#f59e0b',
  tooltipBg: '#1e293b',
};

function MissingDrugs({ token }) {
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [drugsData, setDrugsData] = useState(null);
  const toastIdRef = useRef(null);
  const dismissTimeoutRef = useRef(null);

  // Random chance to show (1 out of 3)
  const shouldShowNotification = () => {
    const randomNum = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3
    return randomNum === 1;
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const fetchMissingDrugs = () => {
      fetch(urls.fetchmissingdrugs, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.missing_drugs && data.missing_drugs.length > 0) {
            setDrugsData(data.missing_drugs);
            
            // Random chance to show notification (1 out of 3)
            if (shouldShowNotification()) {
              displayMissingDrugsToast(data.missing_drugs);
            }
            
            setError(false);
          }
        })
        .catch((err) => {
          console.error("Error fetching missing drugs:", err);
          setError(true);
          
          // Random chance to show error notification (1 out of 3)
          if (shouldShowNotification()) {
            toast.error("Unable to check drug inventory. Please refresh.", {
              position: "bottom-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "dark",
              style: {
                backgroundColor: colors.sidebarBg,
                color: colors.inactiveNavText,
                borderRadius: "8px",
                borderLeft: `4px solid ${colors.danger}`,
                fontFamily: "'Inter', sans-serif",
                fontSize: "13px",
                padding: "12px 16px",
              },
            });
          }
        });
    };

    fetchMissingDrugs();
  }, [token]);

  const displayMissingDrugsToast = (drugs) => {
    // Dismiss any existing toast
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
    }

    const outOfStockCount = drugs.filter(drug => drug.total_quantity === 0).length;
    const lowStockCount = drugs.length - outOfStockCount;
    const totalAffected = drugs.length;

    // Preview mode (collapsed) - shows only summary with 3 examples
    const previewContent = (
      <div style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        width: "100%",
      }}>
        {/* Header with warning icon */}
        <div style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "12px",
          gap: "10px",
        }}>
          <div style={{
            backgroundColor: colors.warning,
            borderRadius: "8px",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="white" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontSize: "14px",
              fontWeight: "600",
              color: "white",
              marginBottom: "2px",
            }}>
              Inventory Alert
            </div>
            <div style={{
              fontSize: "12px",
              color: colors.sectionHeaderText,
              display: "flex",
              gap: "8px",
            }}>
              <span style={{ color: colors.danger }}>● {outOfStockCount} out of stock</span>
              <span style={{ color: colors.warning }}>● {lowStockCount} low stock</span>
            </div>
          </div>
        </div>

        {/* Preview of first 3 drugs */}
        <div style={{
          marginBottom: "12px",
          padding: "8px 0",
        }}>
          {drugs.slice(0, 3).map((drug, index) => (
            <div 
              key={index} 
              style={{ 
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 0",
                borderBottom: index < 2 && drugs.length > 1 ? `1px solid ${colors.cardBorder}` : "none",
              }}
            >
              <div style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: drug.total_quantity === 0 ? colors.danger : colors.warning,
              }} />
              <span style={{ 
                fontSize: "12px",
                color: "white",
                fontWeight: "500",
              }}>
                {drug.drug_name}
              </span>
              <span style={{
                fontSize: "11px",
                color: colors.textMuted,
                marginLeft: "auto",
              }}>
                {drug.total_quantity === 0 ? "Out of stock" : `${drug.total_quantity} left`}
              </span>
            </div>
          ))}
        </div>

        {/* "See more" button if there are more than 3 drugs */}
        {drugs.length > 3 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(true);
              // Update the toast with expanded content
              toast.update(toastIdRef.current, {
                render: expandedContent(drugs),
                autoClose: false,
                closeOnClick: false,
              });
            }}
            style={{
              background: colors.activeNavBg,
              border: "none",
              color: "white",
              padding: "8px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "500",
              cursor: "pointer",
              width: "100%",
              textAlign: "center",
              transition: "all 0.2s ease",
              marginBottom: "8px",
            }}
            onMouseOver={(e) => e.target.style.background = colors.navHoverBg}
            onMouseOut={(e) => e.target.style.background = colors.activeNavBg}
          >
            See all {drugs.length} affected items →
          </button>
        )}

        {/* Footer with dismiss timer hint */}
        <div style={{
          fontSize: "11px",
          color: colors.textMuted,
          textAlign: "center",
          paddingTop: "4px",
        }}>
          This notification will auto-dismiss in a few seconds
        </div>
      </div>
    );

    // Expanded mode - shows all drugs
    const expandedContent = (allDrugs) => (
      <div style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        maxHeight: "60vh",
        overflowY: "auto",
        paddingRight: "4px",
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "16px",
          paddingBottom: "12px",
          borderBottom: `1px solid ${colors.cardBorder}`,
          position: "sticky",
          top: 0,
          background: colors.sidebarBg,
          zIndex: 1,
        }}>
          <div style={{
            backgroundColor: colors.warning,
            borderRadius: "8px",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: "12px",
            flexShrink: 0
          }}>
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="white" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <div>
            <h3 style={{ 
              fontSize: "16px",
              fontWeight: "600",
              margin: "0 0 4px 0",
              color: "white"
            }}>
              Inventory Status
            </h3>
            <div style={{
              fontSize: "12px",
              color: colors.sectionHeaderText,
              display: "flex",
              gap: "12px"
            }}>
              <span style={{ color: colors.danger }}>● {outOfStockCount} out of stock</span>
              <span style={{ color: colors.warning }}>● {lowStockCount} low stock</span>
            </div>
          </div>
        </div>
        
        {/* Complete Drug List */}
        <div style={{ 
          fontSize: "13px",
        }}>
          {allDrugs.map((drug, index) => (
            <div 
              key={index} 
              style={{ 
                marginBottom: "8px",
                padding: "10px 12px",
                backgroundColor: index % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent",
                borderRadius: "6px",
                display: "flex",
                alignItems: "flex-start",
              }}
            >
              <div style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: drug.total_quantity === 0 ? colors.danger : colors.warning,
                marginTop: "4px",
                marginRight: "10px",
                flexShrink: 0
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ 
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "2px"
                }}>
                  <span style={{ 
                    fontWeight: "500",
                    color: "white",
                  }}>
                    {drug.drug_name}
                  </span>
                  <span style={{
                    fontSize: "11px",
                    color: colors.textMuted,
                  }}>
                    {drug.packaging}
                  </span>
                </div>
                <div style={{ 
                  fontSize: "11px",
                  color: drug.total_quantity === 0 ? colors.danger : colors.warning,
                  fontWeight: "500",
                }}>
                  {drug.total_quantity === 0 ? "Out of stock" : `${drug.total_quantity} units remaining`}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Footer with dismiss button */}
        <div style={{
          marginTop: "16px",
          paddingTop: "12px",
          borderTop: `1px solid ${colors.cardBorder}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          bottom: 0,
          background: colors.sidebarBg,
        }}>
          <span style={{
            fontSize: "11px",
            color: colors.textMuted,
          }}>
            Total: {allDrugs.length} items affected
          </span>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              toast.dismiss(toastIdRef.current);
              setExpanded(false);
            }}
            style={{
              background: colors.navHoverBg,
              border: "none",
              color: "white",
              padding: "6px 14px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "500",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => e.target.style.background = colors.activeNavBg}
            onMouseOut={(e) => e.target.style.background = colors.navHoverBg}
          >
            Dismiss
          </button>
        </div>
      </div>
    );

    // Create the toast
    toastIdRef.current = toast.warning(previewContent, {
      position: "bottom-right",
      autoClose: 8000, // Auto dismiss after 8 seconds if not expanded
      hideProgressBar: false,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "dark",
      onClose: () => {
        setExpanded(false);
        toastIdRef.current = null;
      },
    });

    // Set auto-dismiss timeout
    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current);
    }

    dismissTimeoutRef.current = setTimeout(() => {
      if (toastIdRef.current && !expanded) {
        toast.dismiss(toastIdRef.current);
      }
    }, 8000);
  };

  return (
    <ToastContainer
      position="bottom-right"
      autoClose={8000}
      newestOnTop
      closeOnClick={false}
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      limit={3}
      style={{
        width: "360px",
        maxWidth: "90vw",
        zIndex: 9999,
      }}
      toastStyle={{
        backgroundColor: colors.sidebarBg,
        color: colors.inactiveNavText,
        borderRadius: "10px",
        border: `1px solid ${colors.sidebarBorder}`,
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
        padding: "16px",
        margin: "0 0 12px 0",
        fontFamily: "'Inter', sans-serif",
        backdropFilter: "blur(4px)",
      }}
      progressStyle={{
        background: `linear-gradient(to right, ${colors.warning}, ${colors.danger})`,
        height: "3px",
      }}
    />
  );
}

export default MissingDrugs;