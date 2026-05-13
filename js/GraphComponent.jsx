 import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { urls } from './config.dev';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function GraphComponent({ token }) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [annualData, setAnnualData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hiddenDatasets, setHiddenDatasets] = useState(new Set());

  useEffect(() => {
    fetchAnnualData();
  }, [selectedYear, token]);

  const fetchAnnualData = async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const payload = {
        token,
        year: selectedYear
      };

      const response = await fetch(urls.fetchannualdata, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      processAnnualData(data);
    } catch (error) {
      console.error('Error fetching annual data:', error);
      setAnnualData(null);
    } finally {
      setIsLoading(false);
    }
  };

const processAnnualData = (data) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
  
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Initialize monthly data arrays
  const salesData = [];
  const expensesData = [];
  const profitsData = [];
  const drugsData = [];
  const filteredMonths = [];

  // Determine the maximum month to display based on current year
  let maxMonth = 12;
  if (selectedYear === currentYear) {
    // For current year, only show data up to currentMonth - 1
    maxMonth = currentMonth - 1;
  } else {
    // For previous years, show all available months (up to 12)
    maxMonth = 12;
  }

  // Populate data for each month (1 to maxMonth)
  for (let month = 1; month <= maxMonth; month++) {
    const monthStr = month.toString();
    
    // Check if data exists for this month in the API response
    const hasSalesData = data.sales && data.sales[monthStr] !== undefined;
    const hasExpensesData = data.expenses && data.expenses[monthStr] !== undefined;
    const hasProfitsData = data.profits && data.profits[monthStr] !== undefined;
    const hasDrugsData = data.cost_of_drugs_sold && data.cost_of_drugs_sold[monthStr] !== undefined;

    // If no data exists for any metric in this month, skip it
    if (!hasSalesData && !hasExpensesData && !hasProfitsData && !hasDrugsData) {
      continue;
    }
    
    // Round off numbers and handle missing data for individual metrics
    const sales = hasSalesData ? Math.round(data.sales[monthStr]) : 0;
    const expenses = hasExpensesData ? Math.round(data.expenses[monthStr]) : 0;
    const profits = hasProfitsData ? Math.round(data.profits[monthStr]) : 0;
    const drugs = hasDrugsData ? Math.round(data.cost_of_drugs_sold[monthStr]) : 0;

    salesData.push(sales);
    expensesData.push(expenses);
    profitsData.push(profits);
    drugsData.push(drugs);
    filteredMonths.push(months[month - 1]);
  }

  setAnnualData({
    months: filteredMonths,
    sales: salesData,
    expenses: expensesData,
    profits: profitsData,
    drugs: drugsData
  });
};

  const toggleDatasetVisibility = (datasetLabel) => {
    const newHiddenDatasets = new Set(hiddenDatasets);
    if (newHiddenDatasets.has(datasetLabel)) {
      newHiddenDatasets.delete(datasetLabel);
    } else {
      newHiddenDatasets.add(datasetLabel);
    }
    setHiddenDatasets(newHiddenDatasets);
  };

  const getDatasetConfig = (label, data, color, backgroundColor) => {
    const isHidden = hiddenDatasets.has(label);
    
    return {
      label,
      data: annualData ? data : [],
      borderColor: color,
      backgroundColor: backgroundColor,
      fill: !isHidden,
      tension: 0.4,
      borderWidth: isHidden ? 0 : 3,
      pointBackgroundColor: isHidden ? 'transparent' : color,
      pointBorderColor: isHidden ? 'transparent' : '#fff',
      pointBorderWidth: isHidden ? 0 : 2,
      pointRadius: isHidden ? 0 : 5,
      pointHoverRadius: isHidden ? 0 : 7,
      hidden: isHidden
    };
  };

  const chartData = {
    labels: annualData ? annualData.months : [],
    datasets: [
      getDatasetConfig(
        'Total Sales', 
        annualData ? annualData.sales : [], 
        'rgb(75, 192, 192)', 
        'rgba(75, 192, 192, 0.1)'
      ),
      getDatasetConfig(
        'Total Expenses', 
        annualData ? annualData.expenses : [], 
        'rgb(255, 99, 132)', 
        'rgba(255, 99, 132, 0.1)'
      ),
      getDatasetConfig(
        'Cost of Drugs Sold', 
        annualData ? annualData.drugs : [], 
        'rgb(255, 159, 64)', 
        'rgba(255, 159, 64, 0.1)'
      ),
      getDatasetConfig(
        'Profits', 
        annualData ? annualData.profits : [], 
        'rgb(34, 197, 94)', 
        'rgba(34, 197, 94, 0.1)'
      )
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#000',
          font: {
            size: 12,
            weight: 'bold'
          },
          padding: 20,
          usePointStyle: true,
          filter: (legendItem, chartData) => {
            // Always show all legend items
            return true;
          }
        },
        onClick: (e, legendItem, legend) => {
          const datasetIndex = legendItem.datasetIndex;
          const chart = legend.chart;
          const meta = chart.getDatasetMeta(datasetIndex);
          
          // Toggle visibility
          meta.hidden = meta.hidden === null ? !chart.isDatasetVisible(datasetIndex) : null;
          
          // Update our state
          toggleDatasetVisibility(legendItem.text);
          
          chart.update();
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'UGX',
                minimumFractionDigits: 0
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#000',
          font: {
            size: 11,
            weight: 'bold'
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#000',
          font: {
            size: 11
          },
          callback: function(value) {
            return 'UGX ' + value.toLocaleString('en-US');
          }
        },
        beginAtZero: true
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    animations: {
      tension: {
        duration: 1000,
        easing: 'linear'
      }
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2020 + 1 }, (_, i) => 2020 + i);

  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      border: '1px solid #e0e0e0',
      marginBottom: '20px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <h3 style={{
          margin: 0,
          color: '#2c3e50',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          Annual Financial Trends
          {annualData && selectedYear === currentYear && (
            <span style={{
              fontSize: '14px',
              color: '#666',
              fontWeight: 'normal',
              marginLeft: '10px'
            }}>
              (Excluding {new Date().toLocaleString('default', { month: 'long' })})
            </span>
          )}
        </h3>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <label style={{
            color: '#000',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            Select Year:
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              background: '#fff',
              color: '#000',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              minWidth: '100px'
            }}
          >
            {years.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div style={{
          height: '400px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#666',
          fontSize: '16px'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '15px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            Loading annual data...
          </div>
        </div>
      ) : annualData ? (
        <div style={{ height: '400px', position: 'relative' }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      ) : (
        <div style={{
          height: '400px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#666',
          fontSize: '16px',
          textAlign: 'center'
        }}>
          No data available for the selected year.
          <br />
          <span style={{ fontSize: '14px', color: '#999' }}>
            Try selecting a different year or check your data.
          </span>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}

export default GraphComponent;