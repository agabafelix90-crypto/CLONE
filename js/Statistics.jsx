import React, { useState, useEffect } from 'react';
import { urls } from './config.dev';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AnnualAsessment from './AnnualAsessment';
import { useLocation } from "react-router-dom";
import './Statistics.css';

function getTokenFromUrlOrLocalStorage() {
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get('token');
  return tokenFromUrl || localStorage.getItem('token');
}

function Statistics() {
  const navigate = useNavigate();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [statisticsData, setStatisticsData] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAnnualAsessmentOpen, setIsAnnualAsessmentOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlToken = params.get("token");
    setToken(urlToken);
  }, [location]);

  const openAnnualAsessment = () => {
    setIsAnnualAsessmentOpen(true);
  };

  const closeAnnualAsessment = () => {
    setIsAnnualAsessmentOpen(false);
  };

  const performSecurityCheck = async (token) => {
    try {
      const securityResponse = await fetch(urls.security, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (securityResponse.ok) {
        const securityData = await securityResponse.json();
        if (securityData.message === 'Session valid') {
          fetchPerformanceData(token);
        } else if (securityData.error === 'Session expired') {
          navigate(`/dashboard?token=${securityData.clinic_session_token}`);
        } else {
          navigate('/login');
        }
      } else {
        throw new Error('Failed to perform security check');
      }
    } catch (error) {
      console.error('Error performing security check:', error);
      navigate('/login');
    }
  };

  const fetchPerformanceData = async (token) => {
    try {
      setLoading(true);
      const payload = {
        token,
        month: month,
        year: year,
      };

      const response = await fetch(`${urls.statistics}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.message === "No data found for the requested month and year.") {
          toast.error('No data found for the requested month and year.');
        } else {
          setStatisticsData(data);
        }
      } else {
        throw new Error('Failed to fetch statistics data');
      }
    } catch (error) {
      console.error('Error fetching statistics data:', error);
      toast.error('Error fetching statistics data! It might be that the data you are trying to fetch doesn\'t exist or try checking your internet connection');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getTokenFromUrlOrLocalStorage();
    performSecurityCheck(token);
  }, [month, year]);

  const calculateTotals = () => {
    if (!statisticsData) return;

    let totalDayShiftSales = 0;
    let totalNightShiftSales = 0;
    let totalDayShiftExpenses = 0;
    let totalNightShiftExpenses = 0;
    let totalCostOfProduction = 0;

    statisticsData.sales.forEach(({ DayShiftSales, NightShiftSales }) => {
      totalDayShiftSales += parseFloat(DayShiftSales || 0);
      totalNightShiftSales += parseFloat(NightShiftSales || 0);
    });

    statisticsData.expenses.forEach(({ DayShiftExpenses, NightShiftExpenses }) => {
      totalDayShiftExpenses += parseFloat(DayShiftExpenses || 0);
      totalNightShiftExpenses += parseFloat(NightShiftExpenses || 0);
    });

    statisticsData.cop.forEach(({ TotalCOP }) => {
      totalCostOfProduction += parseFloat(TotalCOP || 0);
    });

    const totalSales = totalDayShiftSales + totalNightShiftSales;
    const totalExpenses = totalDayShiftExpenses + totalNightShiftExpenses;
    const estimatedProfit = totalSales - totalCostOfProduction;

    const lastDate = statisticsData.sales[statisticsData.sales.length - 1].ShiftDate;
    const daysWithData = parseInt(lastDate.split('-')[2]);

    const averageSales = totalSales / daysWithData;
    const averageExpenses = totalExpenses / daysWithData;
    const averageProfit = estimatedProfit / daysWithData;
    const averageCostOfProduction = totalCostOfProduction / daysWithData;

    const roundToNearestHundred = (num) => Math.round(num / 100) * 100;

    return {
      totalDayShiftSales: roundToNearestHundred(totalDayShiftSales),
      totalNightShiftSales: roundToNearestHundred(totalNightShiftSales),
      totalSales: roundToNearestHundred(totalSales),
      totalDayShiftExpenses: roundToNearestHundred(totalDayShiftExpenses),
      totalNightShiftExpenses: roundToNearestHundred(totalNightShiftExpenses),
      totalExpenses: roundToNearestHundred(totalExpenses),
      totalCostOfProduction: roundToNearestHundred(totalCostOfProduction),
      estimatedProfit: roundToNearestHundred(estimatedProfit),
      averageSales: roundToNearestHundred(averageSales),
      averageExpenses: roundToNearestHundred(averageExpenses),
      averageProfit: roundToNearestHundred(averageProfit),
      averageCostOfProduction: roundToNearestHundred(averageCostOfProduction),
      totalCostOfDrugsUsed: roundToNearestHundred(totalCostOfProduction - totalExpenses),
    };
  };

  const totals = calculateTotals();

  const handleMonthChange = (e) => {
    setMonth(e.target.value);
  };

  const handleYearChange = (e) => {
    setYear(e.target.value);
  };

  const handlePrint = async () => {
    const payload = {
      token,
      month: month,
      year: year,
    };
  
    try {
      const response = await fetch(`${urls.printstatistics}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
  
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } else {
        console.error('Failed to fetch statistics:', response.statusText);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <div className="statistics-container">
      <ToastContainer position="top-right" autoClose={5000} />
      
      <div className="statistics-header">
        <h1 className="statistics-title">
          Statistics for {new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h1>
        <div className="selector-container">
          <select
            value={month}
            onChange={handleMonthChange}
            className="statistics-select"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2000, i).toLocaleDateString('en-US', { month: 'long' })}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={year}
            onChange={handleYearChange}
            className="statistics-input"
            min="2000"
            max="2100"
          />
        </div>
      </div>
  
      {loading ? (
        <div className="loading-container">
          <div>Loading statistics data...</div>
        </div>
      ) : statisticsData ? (
        <div className="statistics-content">
          <div className="table-responsive">
            <table className="statistics-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day Shift Sales</th>
                  <th>Night Shift Sales</th>
                  <th>Day Shift Expenses</th>
                  <th>Night Shift Expenses</th>
                  <th>Cost of Production</th>
                </tr>
              </thead>
              <tbody>
                {statisticsData.sales.map(({ ShiftDate, DayShiftSales, NightShiftSales }, index) => {
                  const dayShiftExpenses = statisticsData.expenses.find(exp => exp.ShiftDate === ShiftDate)?.DayShiftExpenses || 0;
                  const nightShiftExpenses = statisticsData.expenses.find(exp => exp.ShiftDate === ShiftDate)?.NightShiftExpenses || 0;
                  const totalCOP = statisticsData.cop.find(cop => cop.date === ShiftDate)?.TotalCOP || 0;
    
                  return (
                    <tr key={index}>
                      <td>{ShiftDate}</td>
                      <td>{parseFloat(DayShiftSales || 0).toLocaleString()}</td>
                      <td>{parseFloat(NightShiftSales || 0).toLocaleString()}</td>
                      <td>{parseFloat(dayShiftExpenses).toLocaleString()}</td>
                      <td>{parseFloat(nightShiftExpenses).toLocaleString()}</td>
                      <td>{parseFloat(totalCOP).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
  
          <div className="analysis-grid">
            {/* Sales Analysis Card */}
            <div className="analysis-card">
              <h2 className="card-title">Sales Analysis</h2>
              <p><strong>Total sales during day shift:</strong> UGX {totals.totalDayShiftSales.toLocaleString()}</p>
              <p><strong>Total sales during night shift:</strong> UGX {totals.totalNightShiftSales.toLocaleString()}</p>
              <p><strong>Total sales for both shifts:</strong> UGX {totals.totalSales.toLocaleString()}</p>
              <p><strong>Average sales:</strong> UGX {totals.averageSales.toLocaleString()}</p>
              <p className="positive-highlight">
                This means your medical center sells approximately UGX {totals.averageSales.toLocaleString()} per day.
              </p>
            </div>
  
            {/* Expenses Analysis Card */}
            <div className="analysis-card">
              <h2 className="card-title">Expenses Analysis</h2>
              <p><strong>Total day shift expenses:</strong> UGX {totals.totalDayShiftExpenses.toLocaleString()}</p>
              <p><strong>Total night shift expenses:</strong> UGX {totals.totalNightShiftExpenses.toLocaleString()}</p>
              <p><strong>Total expenses for both shifts:</strong> UGX {totals.totalExpenses.toLocaleString()}</p>
              <p><strong>Average expenses:</strong> UGX {totals.averageExpenses.toLocaleString()}</p>
              <p className="negative-highlight">
                This means your medical center spends approximately UGX {totals.averageExpenses.toLocaleString()} per day.
              </p>
            </div>
  
            {/* Cost of Production Card */}
            <div className="analysis-card">
              <h2 className="card-title">Cost of Production</h2>
              <p><strong>Total cost of drugs used:</strong> UGX {totals.totalCostOfDrugsUsed.toLocaleString()}</p>
              <p><strong>Total expenses:</strong> UGX {totals.totalExpenses.toLocaleString()}</p>
              <p><strong>Total cost of production:</strong> UGX {totals.totalCostOfProduction.toLocaleString()}</p>
              <p><strong>Average cost of production:</strong> UGX {totals.averageCostOfProduction.toLocaleString()}</p>
              <p className="neutral-highlight">
                This means your medical center's average cost of production is approximately UGX {totals.averageCostOfProduction.toLocaleString()} per day.
              </p>
            </div>
  
            {/* Profit Analysis Card */}
            <div className="analysis-card">
              <h2 className="card-title">Profit Analysis</h2>
              <p><strong>Total profit:</strong> UGX {totals.estimatedProfit.toLocaleString()}</p>
              <p><strong>Average profit:</strong> UGX {totals.averageProfit.toLocaleString()}</p>
              <p className="positive-highlight">
                This means your medical center's average profit is approximately UGX {totals.averageProfit.toLocaleString()} per day.
              </p>
            </div>
          </div>

          <div className="button-container">
            <button
              onClick={openAnnualAsessment}
              className="btn btn-success"
            >
              Annual Assessment
            </button>

            <button
              onClick={handlePrint}
              className="btn btn-primary"
            >
              Print Report
            </button>
          </div>

          {isAnnualAsessmentOpen && (
            <AnnualAsessment
              token={token}
              onClose={closeAnnualAsessment}
            />
          )}
        </div>
      ) : (
        <div className="no-data-container">
          <div>No data available for the selected period</div>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Refresh Data
          </button>
        </div>
      )}

      <style jsx>{`
        .statistics-container {
          font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
          width: 100%;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
          min-height: 100vh;
          color: #333;
        }

        .statistics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid #e0e0e0;
        }

        .statistics-title {
          color: #212121;
          font-size: 1.5rem;
          font-weight: 500;
          margin: 0;
          letter-spacing: 0.5px;
        }

        .selector-container {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          background-color: #ffffff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .statistics-select, .statistics-input {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 0.9rem;
          background-color: #fff;
          cursor: pointer;
          min-width: 120px;
          color: #333;
        }

        .statistics-input {
          width: 80px;
          text-align: center;
        }

        .loading-container, .no-data-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 200px;
          font-size: 1rem;
          color: #666;
        }

        .no-data-container {
          flex-direction: column;
          gap: 15px;
        }

        .table-responsive {
          width: 100%;
          overflow-x: auto;
          margin: 20px 0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .statistics-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
          min-width: 800px;
        }

        .statistics-table th {
          background-color: #424242;
          color: #fff;
          text-align: left;
          padding: 12px 15px;
          font-weight: 500;
          border: 1px solid #424242;
        }

        .statistics-table td {
          padding: 12px 15px;
          border-bottom: 1px solid #e0e0e0;
          background-color: #fff;
          border: 1px solid #e0e0e0;
        }

        .statistics-table tr:nth-child(even) td {
          background-color: #f9f9f9;
        }

        .statistics-table tr:hover td {
          background-color: #f5f5f5;
        }

        .analysis-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 30px;
        }

        .analysis-card {
          padding: 20px;
          background-color: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          transition: all 0.2s ease;
        }

        .analysis-card:hover {
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }

        .card-title {
          text-align: center;
          color: #212121;
          margin-bottom: 20px;
          font-size: 1.1rem;
          font-weight: 500;
          padding-bottom: 10px;
          border-bottom: 1px solid #e0e0e0;
        }

        .analysis-card p {
          margin: 8px 0;
          font-size: 0.9rem;
          color: #444;
        }

        .analysis-card strong {
          color: #212121;
          font-weight: 500;
        }

        .positive-highlight {
          color: #2e7d32;
          font-weight: 500;
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px solid #e0e0e0;
        }

        .negative-highlight {
          color: #c62828;
          font-weight: 500;
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px solid #e0e0e0;
        }

        .neutral-highlight {
          color: #1565c0;
          font-weight: 500;
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px solid #e0e0e0;
        }

        .button-container {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-top: 30px;
          flex-wrap: wrap;
        }

        .btn {
          padding: 10px 20px;
          border-radius: 4px;
          border: none;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 180px;
        }

        .btn-primary {
          background-color: #1976d2;
          color: #fff;
        }

        .btn-primary:hover {
          background-color: #1565c0;
          transform: translateY(-1px);
        }

        .btn-success {
          background-color: #2e7d32;
          color: #fff;
        }

        .btn-success:hover {
          background-color: #1b5e20;
          transform: translateY(-1px);
        }

        @media (max-width: 768px) {
          .statistics-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .selector-container {
            width: 100%;
          }

          .statistics-title {
            font-size: 1.3rem;
          }

          .analysis-grid {
            grid-template-columns: 1fr;
          }

          .btn {
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .statistics-container {
            padding: 15px;
          }

          .statistics-title {
            font-size: 1.2rem;
          }

          .statistics-select, .statistics-input {
            width: 100%;
          }

          .selector-container {
            flex-direction: column;
            gap: 10px;
          }
        }
      `}</style>
    </div>
  );
}

export default Statistics;