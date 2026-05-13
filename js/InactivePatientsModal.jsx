import React, { useState, useEffect } from "react";
import { urls } from "./config.dev";
import LoadingSpinner from "./LoadingSpinner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

const PatientCategoriesModal = ({ token, onClose }) => {
  const [patients, setPatients] = useState([]);
  const [category, setCategory] = useState("inactive");
  const [totalBalance, setTotalBalance] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const response = await fetch(urls.fetchdetailedpatientscategory, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, category }),
      });
      const data = await response.json();
      if (response.ok) {
        const sortedPatients = data[`${category}_patients`].sort(
          (a, b) => (b["Visit Count"] || 0) - (a["Visit Count"] || 0)
        );
        setPatients(sortedPatients);
        calculateTotals(sortedPatients);
      } else {
        console.error("Error fetching data:", data);
      }
    } catch (error) {
      console.error("An error occurred while fetching patients:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (patientsList) => {
    let balance = 0;
    let count = patientsList.length;
    patientsList.forEach((patient) => {
      const patientBalance = parseFloat(patient["Current Balance"] || "0");
      balance += !isNaN(patientBalance) ? patientBalance : 0;
    });
    setTotalBalance(balance);
    setTotalCount(count);
  };

  useEffect(() => {
    fetchPatients();
  }, [category, token]);

  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
  };
  const handlePrint = async () => {
    setLoading2(true); // Show spinner
  
    try {
      // Determine which URL to use based on category status
      let targetUrl;
  
      if (category === "active") {
        targetUrl = urls.printPatientCategory2;
      } else if (category === "lost") {
        targetUrl = urls.printPatientCategory3;
      } else {
        targetUrl = urls.printPatientCategory;
      }
  
      const response = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, category }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }
  
      const blob = await response.blob();
      const pdfUrl = URL.createObjectURL(blob);
      window.open(pdfUrl, "_blank");
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setLoading2(false); // Hide spinner after request completes
    }
  };
  

  if (loading) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0, 0, 0, 0.9)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
        }}
      >
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0, 0, 0, 0.9)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "0px",
          padding: "30px",
          width: "1600px",
          maxHeight: "98vh",
          overflowY: "auto",
          boxSizing: "border-box",
          fontFamily: "Arial, sans-serif",
          color: "black",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
          >
            {category} Patients
          </h2>
          <div>
            {["active", "inactive", "lost"].map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                style={{
                  margin: "0 5px",
                  padding: "12px 30px",
                  fontSize: "16px",
                  cursor: "pointer",
                  borderRadius: "0px",
                  border: "none",
                  color: "white",
                  backgroundColor:
                    cat === category
                      ? "#4CAF50"
                      : cat === "inactive"
                      ? "#FF9800"
                      : "#f44336",
                }}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)} Patients
              </button>
            ))}
          </div>
        </div>

        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <p>
            <strong>Total Patients:</strong> {totalCount}
          </p>
          <p>
            <strong>Total Balance:</strong> UGX {totalBalance.toFixed(2)}
          </p>
        </div>

        <div style={{ maxHeight: "500px", overflowY: "scroll", marginTop: "20px" }}>
          {patients.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {[
                    "Name",
                    "Age",
                    "Sex",
                    "Address",
                    "Phone Number",
                    "Last Visit",
                    "No of Visits",
                    "Balance Remaining (UGX)",
                    "Last Attended By",
                  ].map((header, index) => (
                    <th
                      key={index}
                      style={{
                        padding: "10px",
                        border: "1px solid #ddd",
                        backgroundColor: "#f2f2f2",
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {patients.map((patient, index) => (
                  <tr key={index}>
                    {[
                      "Name",
                      "Age",
                      "Sex",
                      "Address",
                      "Phone Number",
                      "Last Visit",
                      "Visit Count",
                      "Current Balance",
                      "Attended By",
                    ].map((field, idx) => (
                      <td
                        key={idx}
                        style={{
                          padding: "10px",
                          border: "1px solid #ddd",
                          textAlign: "center",
                        }}
                      >
                        {field === "Current Balance"
                          ? Number(patient[field]).toFixed(2)
                          : patient[field]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No patients found in this category.</p>
          )}
        </div>

        {/* Close and Print Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            position: "sticky",
            bottom: "0",
            background: "#fff",
            padding: "15px 0",
            marginTop: "20px",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "12px 30px",
              fontSize: "16px",
              cursor: "pointer",
              borderRadius: "0px",
              border: "none",
              color: "white",
              backgroundColor: "#f44336",
            }}
          >
            Close
          </button>
          <button
      onClick={handlePrint}
      disabled={loading2}
      style={{
        padding: "12px 30px",
        fontSize: "16px",
        cursor: loading2 ? "not-allowed" : "pointer",
        borderRadius: "0px",
        border: "none",
        color: "white",
        backgroundColor: "#4CAF50",
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}
    >
      {loading2 ? (
        <>
          <FontAwesomeIcon icon={faSpinner} spin />
          Generating...
        </>
      ) : (
        "Print"
      )}
    </button>
        </div>
      </div>
    </div>
  );
};

export default PatientCategoriesModal;
