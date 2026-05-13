import React from "react";
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
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const FetalHeartGraph = ({ entries, onClose }) => {
  // Filter out invalid heart rates
  const validEntries = entries.filter(
    (entry) => entry.heartRate > 0 && entry.heartRate < 200
  );

  if (validEntries.length === 0) {
    return (
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "80%",
          height: "60%",
          backgroundColor: "#fff",
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)",
          padding: "20px",
          borderRadius: "10px",
          overflow: "hidden",
          zIndex: 1000,
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "20px", color: "#007bff" }}>
          Fetal Heart Graph
        </h2>
        <p style={{ textAlign: "center", color: "#dc3545" }}>
          No valid data available for the graph.
        </p>
        <button
          onClick={onClose}
          style={{
            display: "block",
            margin: "0 auto",
            padding: "10px 20px",
            backgroundColor: "#dc3545",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            borderRadius: "5px",
            fontSize: "16px",
          }}
        >
          Close
        </button>
      </div>
    );
  }

  // Add padding time on both sides
  const times = validEntries.map((entry) => entry.time);
  const firstTime = times[0];
  const lastTime = times[times.length - 1];
  const paddedTimes = [
    new Date(new Date(firstTime).getTime() - 5 * 60 * 1000).toLocaleTimeString(),
    ...times,
    new Date(new Date(lastTime).getTime() + 5 * 60 * 1000).toLocaleTimeString(),
  ];

  // Prepare data for the graph
  const data = {
    labels: paddedTimes,
    datasets: [
      {
        label: "Heart Rate (BPM)",
        data: [null, ...validEntries.map((entry) => entry.heartRate), null],
        borderColor: "#007bff",
        backgroundColor: "rgba(0, 123, 255, 0.2)",
        pointBackgroundColor: "#007bff",
        pointBorderColor: "#fff",
        borderWidth: 2,
        tension: 0.4, // Smooth curve
      },
      {
        label: "Lower Limit",
        data: new Array(paddedTimes.length).fill(110),
        borderColor: "#28a745",
        borderDash: [5, 5],
        borderWidth: 1,
        pointRadius: 0,
      },
      {
        label: "Upper Limit",
        data: new Array(paddedTimes.length).fill(160),
        borderColor: "#dc3545",
        borderDash: [5, 5],
        borderWidth: 1,
        pointRadius: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "#333",
          font: {
            size: 14,
            weight: "bold",
          },
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
          font: {
            size: 16,
            weight: "bold",
          },
        },
        ticks: {
          color: "#666",
        },
      },
      y: {
        title: {
          display: true,
          text: "Heart Rate (BPM)",
          color: "#333",
          font: {
            size: 16,
            weight: "bold",
          },
        },
        ticks: {
          color: "#666",
          stepSize: 20,
        },
        min: 0,
        max: 200,
      },
    },
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "80%",
        height: "70%", // Increased height
        backgroundColor: "#fff",
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)",
        padding: "20px",
        borderRadius: "10px",
        overflow: "hidden",
        zIndex: 1000,
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "20px", color: "#007bff" }}>
        Fetal Heart Graph
      </h2>
      <div
        style={{
          position: "relative",
          height: "65%",
          width: "100%",
          marginBottom: "20px",
        }}
      >
        <Line data={data} options={options} />
      </div>
      <button
        onClick={onClose}
        style={{
          display: "block",
          margin: "0 auto",
          padding: "10px 20px",
          backgroundColor: "#dc3545",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          borderRadius: "5px",
          fontSize: "16px",
        }}
      >
        Close
      </button>
    </div>
  );
};

export default FetalHeartGraph;

