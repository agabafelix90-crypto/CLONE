import React, { useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Styles
const modalStyle = {
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "80%",
  height: "70%",
  backgroundColor: "#fff",
  boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)",
  padding: "20px",
  borderRadius: "10px",
  overflow: "hidden",
  zIndex: 1000,
};

const headerStyle = {
  textAlign: "center",
  marginBottom: "20px",
  color: "#007bff",
};

const errorMessageStyle = {
  textAlign: "center",
  color: "#dc3545",
};

const closeButtonStyle = {
  display: "block",
  margin: "10px 0",
  padding: "10px 20px",
  backgroundColor: "#dc3545",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  borderRadius: "5px",
  fontSize: "16px",
  position: "absolute",
  bottom: "10px",
  right: "20px",
};

const chartContainerStyle = {
  position: "relative",
  height: "65%",
  width: "100%",
  marginBottom: "20px",
};

const buttonContainerStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "10px", // Space between buttons
  marginBottom: "20px",
};

const buttonStyle = (bgColor) => ({
  padding: "10px 20px",
  backgroundColor: bgColor,
  color: "#fff",
  border: "none",
  cursor: "pointer",
  borderRadius: "5px",
  fontSize: "16px",
});

const VitalSignGraph = ({ entries, onClose }) => {
  const [selectedVital, setSelectedVital] = useState("systolic");

  // Function to split blood pressure into systolic and diastolic values
  const splitBloodPressure = (bloodPressure) => {
    if (!bloodPressure || !bloodPressure.includes("/")) {
      return { systolic: null, diastolic: null };
    }
    const [systolic, diastolic] = bloodPressure
      .split("/")
      .map((value) => parseInt(value.trim(), 10)); // Parse numbers correctly
    return { systolic, diastolic };
  };

  // Filter out invalid entries (entries with missing time or any selected vital sign)
  const validEntries = entries.filter((entry) => {
    if (!entry.time) return false;
    if (selectedVital === "systolic" || selectedVital === "diastolic") {
      return entry.bloodPressure && splitBloodPressure(entry.bloodPressure)[selectedVital] !== null;
    }
    return entry[selectedVital] !== undefined;
  });

  // Handle the case where there are no valid entries
  if (validEntries.length === 0) {
    return (
      <div style={modalStyle}>
        <h2 style={headerStyle}>Vital Sign Graph</h2>
        <p style={errorMessageStyle}>No valid data available for the graph.</p>
        <button onClick={onClose} style={closeButtonStyle}>
          Close
        </button>
      </div>
    );
  }

  // Split blood pressure data into systolic and diastolic
  const systolicData = validEntries.map(
    (entry) => splitBloodPressure(entry.bloodPressure).systolic
  );
  const diastolicData = validEntries.map(
    (entry) => splitBloodPressure(entry.bloodPressure).diastolic
  );

  // Prepare data for other vitals
  const spO2Data = validEntries.map((entry) => entry.spo2);
  const pulseData = validEntries.map((entry) => entry.pulse);
  const temperatureData = validEntries.map((entry) => entry.temperature);

  // Prepare time labels with padding
  const times = validEntries.map((entry) => `${entry.date} ${entry.time}`);
  const firstTime = new Date(`${validEntries[0].date} ${validEntries[0].time}`);
  const lastTime = new Date(`${validEntries[validEntries.length - 1].date} ${validEntries[validEntries.length - 1].time}`);
  const paddedTimes = [
    new Date(firstTime.getTime() - 5 * 60 * 1000).toLocaleString(), // 5 minutes earlier
    ...times,
    new Date(lastTime.getTime() + 5 * 60 * 1000).toLocaleString(), // 5 minutes later
  ];
  

  // Define normal ranges for each vital sign
  const limits = {
    systolic: { lower: 90, upper: 120 },
    diastolic: { lower: 60, upper: 80 },
    spo2: { lower: 95, upper: 100 },
    pulse: { lower: 60, upper: 100 },
    temperature: { lower: 36.1, upper: 37.2 },
  };

  // Prepare data for the graph based on selected vital sign
  const data = {
    labels: paddedTimes,
    datasets: [
      {
        label:
          selectedVital === "systolic"
            ? "Systolic Pressure"
            : selectedVital === "diastolic"
            ? "Diastolic Pressure"
            : selectedVital === "spo2"
            ? "SpO2"
            : selectedVital === "pulse"
            ? "Pulse"
            : "Temperature",
        data: [
          null,
          ...(selectedVital === "systolic"
            ? systolicData
            : selectedVital === "diastolic"
            ? diastolicData
            : selectedVital === "spo2"
            ? spO2Data
            : selectedVital === "pulse"
            ? pulseData
            : temperatureData),
          null,
        ],
        borderColor: "#007bff",
        backgroundColor: "rgba(0, 123, 255, 0.2)",
        pointBackgroundColor: "#007bff",
        pointBorderColor: "#fff",
        borderWidth: 2,
        tension: 0.4, // Smooth curve
      },
      {
        label: "Lower Limit",
        data: new Array(paddedTimes.length).fill(limits[selectedVital].lower),
        borderColor: "#28a745",
        borderDash: [5, 5],
        borderWidth: 1,
        pointRadius: 0,
      },
      {
        label: "Upper Limit",
        data: new Array(paddedTimes.length).fill(limits[selectedVital].upper),
        borderColor: "#dc3545",
        borderDash: [5, 5],
        borderWidth: 1,
        pointRadius: 0,
      },
    ],
  };

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "#333",
          font: { size: 14, weight: "bold" },
        },
      },
      tooltip: {
        backgroundColor: "#333",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderWidth: 1,
        borderColor: "#007bff",
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Time",
          color: "#333",
          font: { size: 16, weight: "bold" },
        },
        ticks: {
          color: "#666",
        },
      },
      y: {
        title: {
          display: true,
          text:
            selectedVital === "systolic"
              ? "Systolic Pressure"
              : selectedVital === "diastolic"
              ? "Diastolic Pressure"
              : selectedVital === "spo2"
              ? "SpO2"
              : selectedVital === "pulse"
              ? "Pulse"
              : "Temperature",
          color: "#333",
          font: { size: 16, weight: "bold" },
        },
        ticks: {
          color: "#666",
        },
        min: 0,
        max: 200, // Adjust based on the vital sign ranges
      },
    },
  };

  return (
    <div style={modalStyle}>
      <h2 style={headerStyle}>Vital Sign Graph</h2>
      <div style={chartContainerStyle}>
        <Line data={data} options={options} />
      </div>
      <div style={buttonContainerStyle}>
        <button onClick={() => setSelectedVital("systolic")} style={buttonStyle("#007bff")}>
          Systolic
        </button>
        <button onClick={() => setSelectedVital("diastolic")} style={buttonStyle("#28a745")}>
          Diastolic
        </button>
        <button onClick={() => setSelectedVital("spo2")} style={buttonStyle("#ffc107")}>
          SpO2
        </button>
        <button onClick={() => setSelectedVital("pulse")} style={buttonStyle("#17a2b8")}>
          Pulse
        </button>
        <button onClick={() => setSelectedVital("temperature")} style={buttonStyle("#ff5733")}>
          Temperature
        </button>
      </div>
      <button onClick={onClose} style={closeButtonStyle}>
        Close
      </button>
    </div>
  );
};

export default VitalSignGraph;
