import React, { useState, useEffect } from 'react';
import { urls } from './config.dev';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { faPrint, faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';
function GenerateDrugOrder() {
  const [days, setDays] = useState(7);
  const [drugs, setDrugs] = useState([]);
  const [error, setError] = useState(null);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [employeeName, setEmployeeName] = useState('');
  const [token, setToken] = useState('');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTokenAndCheckSecurity = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const tokenFromUrl = params.get('token');
        if (!tokenFromUrl) {
          navigate('/login');
          return;
        }

        setToken(tokenFromUrl);

        const securityResponse = await fetch(urls.security, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenFromUrl }),
        });

        if (securityResponse.ok) {
          const securityData = await securityResponse.json();
          if (securityData.message === 'Session valid') {
            setEmployeeName(securityData.employee_name);
            fetchDrugs(tokenFromUrl);
          } else {
            navigate('/login');
          }
        } else {
          navigate('/login');
        }
      } catch (error) {
        navigate('/login');
      }
    };

    fetchTokenAndCheckSecurity();
  }, [navigate]);

  const fetchDrugs = async (token) => {
    try {
      const response = await fetch(urls.creatdrugorder, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, days }),
      });
      if (!response.ok) throw new Error('Failed to fetch drugs');
      const data = await response.json();
      data.sort((a, b) => b.quantityToBuy - a.quantityToBuy);
      setDrugs(data);
    } catch (error) {
      setError('Failed to fetch drugs. Please try again later.');
    }
  };

  const updateEstimatedCost = () => {
    let totalCost = drugs.reduce((sum, drug) => sum + drug.quantityToBuy * drug.costPrice, 0);
    totalCost = Math.round(totalCost / 1000) * 1000;
    setEstimatedCost(totalCost);
  };

  useEffect(updateEstimatedCost, [drugs]);
  const handlePrintOrder = async () => {
    setLoading(true); // Start loading

    try {
      const formattedDrugs = drugs.map(drug => ({
        name: drug.name,
        packaging: drug.packaging,
        quantityToBuy: drug.quantityToBuy,
        costPrice: drug.costPrice,
        totalCost: drug.quantityToBuy * drug.costPrice,
        quantityLeftInStore: drug.quantityLeftInStore || 0,
        quantityLeftInDispensary: drug.quantityLeftInDispensary || 0,
      }));
  
      const response = await fetch(urls.printdrugorder, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, days, drugs: formattedDrugs }),
      });
  
      if (!response.ok) throw new Error('Failed to generate order');
  
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      alert('Failed to print order. Please try again.');
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Drugs Suggested for Next Order</h1>
      <p style={styles.estimatedCost}>
        Estimated Cost: UGX <span style={styles.costHighlight}>{estimatedCost}</span>
      </p>

      <div style={styles.controls}>
        <label style={styles.label}>Number of days:</label>
        <input
          type="number"
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          style={styles.input}
        />
        <button style={styles.printButton} onClick={handlePrintOrder} disabled={loading}>
      {loading ? (
        <FontAwesomeIcon icon={faSpinner} spin /> // Show spinner while loading
      ) : (
        <FontAwesomeIcon icon={faPrint} />
      )}
      {loading ? ' Generating Order...' : 'Print Order'}
    </button>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      <table style={styles.table}>
        <thead>
          <tr>
            <th>Drug</th>
            <th>Packaging</th>
            <th>Quantity to Buy</th>
            <th>Cost Price</th>
            <th>Total Cost</th>
            <th>In Store</th>
            <th>In Dispensary</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {drugs
            .filter((drug) => drug.quantityToBuy > 0)
            .map((drug, index) => (
              <tr key={drug.drug_id || drug.id || index} style={styles.row}>
                <td>{drug.name}</td>
                <td>{drug.packaging}</td>
                <td>
                  <input
                    type="number"
                    value={drug.quantityToBuy}
                    onChange={(e) =>
                      setDrugs((prev) =>
                        prev.map((d, i) =>
                          i === index ? { ...d, quantityToBuy: parseInt(e.target.value) } : d
                        )
                      )
                    }
                    style={styles.smallInput}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={drug.costPrice}
                    onChange={(e) =>
                      setDrugs((prev) =>
                        prev.map((d, i) =>
                          i === index ? { ...d, costPrice: parseInt(e.target.value) } : d
                        )
                      )
                    }
                    style={styles.smallInput}
                  />
                </td>
                <td>{drug.quantityToBuy * drug.costPrice}</td>
                <td>{drug.quantityLeftInStore || 0}</td>
                <td>{drug.quantityLeftInDispensary || 0}</td>
                <td>
                  <button
                    style={styles.removeButton}
                    onClick={() => setDrugs((prev) => prev.filter((_, i) => i !== index))}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  container: { padding: '20px', width: '100vw', margin: 'auto', fontFamily: 'Arial, sans-serif' },
  title: { textAlign: 'center', fontSize: '24px', marginBottom: '10px' },
  estimatedCost: { fontSize: '18px', textAlign: 'center' },
  costHighlight: { color: 'green', fontWeight: 'bold', animation: 'heartbeat 1s infinite' },
  controls: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '20px' },
  label: { fontSize: '16px' },
  input: { padding: '5px', fontSize: '16px', width: '80px', textAlign: 'center' },
  printButton: { padding: '8px 12px', background: '#007BFF', color: '#fff', border: 'none', cursor: 'pointer' },
  error: { color: 'red', textAlign: 'center' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },
  row: { textAlign: 'center', borderBottom: '1px solid #ddd' },
  smallInput: { width: '80px', padding: '5px', textAlign: 'center' },
  removeButton: { background: 'red', color: 'white', border: 'none', padding: '5px', cursor: 'pointer' },
};

export default GenerateDrugOrder;
