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

const UrineAnalysisGraph = ({ entries, onClose }) => {
  // Prepare the data for the graph
  const times = entries.map(entry => entry.time);
  const volumes = entries.map(entry => entry.volume);
  const colors = entries.map(entry => entry.color);
  const odors = entries.map(entry => entry.odor);
  const remarks = entries.map(entry => entry.remarks);

  const data = {
    labels: times,
    datasets: [
      {
        label: "Volume (ml)",
        data: volumes,
        borderColor: "#007bff",
        backgroundColor: "rgba(0, 123, 255, 0.2)",
        pointBackgroundColor: "#007bff",
        pointBorderColor: "#fff",
        borderWidth: 2,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        callbacks: {
          // Custom tooltip label to include additional data like color, odor, and remarks
          label: (tooltipItem) => {
            const index = tooltipItem.dataIndex;
            const volume = volumes[index] ?? "N/A";  // Default to "N/A" if not available
            const color = colors[index] ?? "N/A";   // Default to "N/A" if not available
            const odor = odors[index] ?? "N/A";     // Default to "N/A" if not available
            const remark = remarks[index] ?? "N/A"; // Default to "N/A" if not available
            return `Volume: ${volume} ml, Color: ${color}, Odor: ${odor}, Remarks: ${remark}`;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Time",
        },
        ticks: {
          color: "#666",
        },
      },
      y: {
        title: {
          display: true,
          text: "Volume (ml)",
        },
        ticks: {
          color: "#666",
        },
        min: 0,
        max: Math.max(...volumes) + 50,  // Dynamically set max based on data
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
        height: "70%",
        backgroundColor: "#fff",
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)",
        padding: "20px",
        borderRadius: "10px",
        overflow: "hidden",
        zIndex: 1000,
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "20px", color: "#007bff" }}>
        Urine Analysis Graph
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

export default UrineAnalysisGraph;
