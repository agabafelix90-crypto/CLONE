import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { urls } from "./config.dev";

const AnnualAssessment = ({ token, onClose }) => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [MEDCOREAssessment, setMEDCOREAssessment] = useState(null);
  const [selectedMetrics, setSelectedMetrics] = useState({
    sales: true,
    expenses: true,
    profits: true,
    costOfDrugs: false
  });
  const [viewMode, setViewMode] = useState("graph"); // 'graph' or 'analysis'
  const [analysisReady, setAnalysisReady] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const fetchAnnualData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(urls.fetchannualdata, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, year }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch data.");
      }

      const result = await response.json();
      setData(result);
      setAnalysisReady(false);
      setViewMode("graph");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendToAIannualAssessment = async () => {
    setAnalysisLoading(true);
    setError(null);
    try {
      const response = await fetch(urls.AIannualassessment, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          year,
          annualData: data,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed make employee and financial assessment, please try again.");
      }

      const aiResponse = await response.json();
      setMEDCOREAssessment(aiResponse);
      setAnalysisReady(true);
    } catch (err) {
      setError(`Error with AI assessment: ${err.message}`);
    } finally {
      setAnalysisLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnualData();
  }, [year]);

  const handleMetricChange = (metric) => {
    setSelectedMetrics((prevMetrics) => ({
      ...prevMetrics,
      [metric]: !prevMetrics[metric],
    }));
  };

  const graphData = data
    ? {
        labels: [
          "Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ],
        datasets: [
          selectedMetrics.sales && {
            label: "Sales",
            data: Object.values(data.sales),
            borderColor: "#4CAF50",
            backgroundColor: "rgba(76, 175, 80, 0.1)",
            fill: true,
            tension: 0.3
          },
          selectedMetrics.expenses && {
            label: "Expenses",
            data: Object.values(data.expenses),
            borderColor: "#F44336",
            backgroundColor: "rgba(244, 67, 54, 0.1)",
            fill: true,
            tension: 0.3
          },
          selectedMetrics.profits && {
            label: "Profits",
            data: Object.values(data.profits),
            borderColor: "#2196F3",
            backgroundColor: "rgba(33, 150, 243, 0.1)",
            fill: true,
            tension: 0.3
          },
          selectedMetrics.costOfDrugs && {
            label: "Cost of Drugs",
            data: Object.values(data.cost_of_drugs_sold),
            borderColor: "#FF9800",
            backgroundColor: "rgba(255, 152, 0, 0.1)",
            fill: true,
            tension: 0.3
          },
        ].filter(Boolean),
      }
    : null;
  
  const formatResponse = (responseText) => {
    return responseText
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br />")
      .replace(/\\n/g, "<br />")
      .replace(/\*{2}(.*?)\*{2}/g, "<strong>$1</strong>");
  };

  const toggleFullScreen = (containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: 0,
      margin: 0,
      overflow: "hidden"
    }}>
      <div style={{
        backgroundColor: "#fff",
        borderRadius: "8px",
        width: "95vw",
        height: "95vh",
        maxWidth: "none",
        overflow: "hidden",
        position: "relative",
        display: "flex",
        flexDirection: "column"
      }}>
        <button 
          onClick={onClose}
          style={{
            position: "absolute",
            top: "15px",
            right: "15px",
            background: "#fff",
            border: "none",
            fontSize: "24px",
            color: "#666",
            cursor: "pointer",
            zIndex: 10,
            padding: "5px 10px",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
          }}
        >
          &times;
        </button>

        <div style={{ 
          padding: "20px",
          flex: 1,
          overflowY: "auto",
          width: "100%"
        }}>
          <h1 style={{
            color: "#333",
            fontSize: "24px",
            fontWeight: "500",
            marginBottom: "20px",
            borderBottom: "1px solid #eee",
            paddingBottom: "10px"
          }}>
            Annual Assessment - {year}
          </h1>

          <div style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "20px",
            gap: "15px",
            flexWrap: "wrap"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}>
              <label style={{
                color: "#555",
                fontSize: "14px",
                fontWeight: "500"
              }}>
                Year:
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                  width: "80px"
                }}
              />
            </div>

            {viewMode === "graph" && (
              <div style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap"
              }}>
                {Object.keys(selectedMetrics).map(metric => (
                  <label key={metric} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    cursor: "pointer",
                    fontSize: "14px"
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedMetrics[metric]}
                      onChange={() => handleMetricChange(metric)}
                      style={{
                        cursor: "pointer",
                        width: "16px",
                        height: "16px"
                      }}
                    />
                    {metric.charAt(0).toUpperCase() + metric.slice(1).replace(/([A-Z])/g, ' $1')}
                  </label>
                ))}
              </div>
            )}

            <div style={{ marginLeft: "auto", display: "flex", gap: "10px" }}>
              {viewMode === "graph" && analysisReady && (
                <button
                  onClick={() => setViewMode("analysis")}
                  style={{
                    padding: "8px 15px",
                    backgroundColor: "#4CAF50",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px"
                  }}
                >
                  <span>View Analysis</span>
                  <span>✓</span>
                </button>
              )}
              
              {viewMode === "analysis" && (
                <button
                  onClick={() => setViewMode("graph")}
                  style={{
                    padding: "8px 15px",
                    backgroundColor: "#2196F3",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px"
                  }}
                >
                  View Graph
                </button>
              )}

              {viewMode === "graph" && !analysisReady && data && (
                <button
                  onClick={sendToAIannualAssessment}
                  disabled={analysisLoading}
                  style={{
                    padding: "8px 15px",
                    backgroundColor: analysisLoading ? "#9E9E9E" : "#FF9800",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: analysisLoading ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px"
                  }}
                >
                  {analysisLoading ? (
                    <>
                      <span>Analyzing...</span>
                      <div style={{
                        width: "12px",
                        height: "12px",
                        border: "2px solid #fff",
                        borderTop: "2px solid transparent",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite"
                      }}></div>
                    </>
                  ) : (
                    "Generate MEDCORE Analysis"
                  )}
                </button>
              )}
            </div>
          </div>

          {loading && (
            <div style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              height: "200px",
              color: "#666",
              fontSize: "16px",
              gap: "15px"
            }}>
              <div style={{
                width: "50px",
                height: "50px",
                border: "5px solid #f3f3f3",
                borderTop: "5px solid #3498db",
                borderRadius: "50%",
                animation: "spin 1s linear infinite"
              }}></div>
              <div>Loading annual data...</div>
            </div>
          )}

          {error && (
            <div style={{
              padding: "15px",
              backgroundColor: "#ffeeee",
              color: "#d32f2f",
              borderRadius: "4px",
              marginBottom: "20px",
              border: "1px solid #ffcdd2",
              fontSize: "14px"
            }}>
              {error}
            </div>
          )}

          {viewMode === "graph" && graphData && (
            <div style={{
              height: "60vh",
              position: "relative",
              marginBottom: "20px"
            }}>
              <Line
                data={graphData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                      labels: {
                        boxWidth: 12,
                        padding: 10,
                        font: {
                          size: 12
                        }
                      }
                    },
                    tooltip: {
                      mode: "index",
                      intersect: false,
                      backgroundColor: "rgba(0, 0, 0, 0.8)",
                      titleFont: {
                        size: 12
                      },
                      bodyFont: {
                        size: 12
                      },
                      padding: 8
                    }
                  },
                  scales: {
                    x: {
                      grid: {
                        display: false
                      },
                      ticks: {
                        color: "#666",
                        font: {
                          size: 11
                        }
                      }
                    },
                    y: {
                      grid: {
                        color: "#f5f5f5"
                      },
                      ticks: {
                        color: "#666",
                        font: {
                          size: 11
                        }
                      }
                    }
                  },
                  elements: {
                    point: {
                      radius: 2,
                      hoverRadius: 4
                    }
                  }
                }}
              />
            </div>
          )}

          {viewMode === "analysis" && MEDCOREAssessment && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              height: "calc(80vh - 100px)"
            }}>
              <div 
                id="financial-analysis-container"
                style={{
                  backgroundColor: "#f9f9f9",
                  borderRadius: "6px",
                  padding: "20px",
                  border: "1px solid #eee",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  overflow: "hidden"
                }}
              >
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "15px"
                }}>
                  <h3 style={{
                    color: "#333",
                    fontSize: "18px",
                    fontWeight: "500",
                    margin: 0
                  }}>
                    Financial Analysis
                  </h3>
                  <button
                    onClick={() => toggleFullScreen("financial-analysis-container")}
                    style={{
                      padding: "5px 10px",
                      backgroundColor: "#2196F3",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px"
                    }}
                  >
                    Full Screen
                  </button>
                </div>
                <div
                  dangerouslySetInnerHTML={{
                    __html: formatResponse(MEDCOREAssessment.financialAnalysis),
                  }}
                  style={{
                    color: "#444",
                    fontSize: "14px",
                    lineHeight: "1.6",
                    whiteSpace: "pre-wrap",
                    wordWrap: "break-word",
                    flex: 1,
                    overflowY: "auto",
                    paddingRight: "10px"
                  }}
                />
              </div>

              <div 
                id="employee-analysis-container"
                style={{
                  backgroundColor: "#f9f9f9",
                  borderRadius: "6px",
                  padding: "20px",
                  border: "1px solid #eee",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  overflow: "hidden"
                }}
              >
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "15px"
                }}>
                  <h3 style={{
                    color: "#333",
                    fontSize: "18px",
                    fontWeight: "500",
                    margin: 0
                  }}>
                    Employee Analysis
                  </h3>
                  <button
                    onClick={() => toggleFullScreen("employee-analysis-container")}
                    style={{
                      padding: "5px 10px",
                      backgroundColor: "#2196F3",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px"
                    }}
                  >
                    Full Screen
                  </button>
                </div>
                <div
                  dangerouslySetInnerHTML={{
                    __html: formatResponse(MEDCOREAssessment.employeeAnalysis),
                  }}
                  style={{
                    color: "#444",
                    fontSize: "14px",
                    lineHeight: "1.6",
                    whiteSpace: "pre-wrap",
                    wordWrap: "break-word",
                    flex: 1,
                    overflowY: "auto",
                    paddingRight: "10px"
                  }}
                />
              </div>
            </div>
          )}

          {analysisLoading && (
            <div style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              height: "200px",
              color: "#666",
              fontSize: "16px",
              gap: "15px"
            }}>
              <div style={{
                width: "50px",
                height: "50px",
                border: "5px solid #f3f3f3",
                borderTop: "5px solid #FF9800",
                borderRadius: "50%",
                animation: "spin 1s linear infinite"
              }}></div>
              <div>MEDCORE Intelligence analyzing data...</div>
              <div style={{ color: "#999", fontSize: "14px" }}>
                This may take a moment...
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AnnualAssessment;
