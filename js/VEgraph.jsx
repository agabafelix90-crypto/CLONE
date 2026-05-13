import { urls } from './config.dev'; // Import the backend URLs
import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2"; // Import the Line chart component
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "chartjs-adapter-date-fns";

// Register required chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const VEgraph = ({ entries, onClose }) => {
  // Filter out invalid data points
  const validEntries = entries.filter(
    (entry) => entry.dilation >= 0 && entry.dilation <= 10
  );

  // Prepare state for backend response
  const [backendResponse, setBackendResponse] = useState(null);

  // Function to send payload to the backend
  const sendPayloadToBackend = async () => {
    if (validEntries.length > 0 && !backendResponse) { // Only send payload if there's no existing response
      try {
        const response = await fetch(urls.deliveryAI, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ entries: validEntries }), // Send validEntries in payload
        });

        const data = await response.json();
        setBackendResponse(data); // Set the response from the backend to state
      } catch (error) {
        console.error('Error sending data to backend:', error);
      }
    }
  };

  // Use useEffect to send the payload once when validEntries change, but only if backendResponse is not set
  useEffect(() => {
    if (validEntries.length > 0 && !backendResponse) {
      sendPayloadToBackend();
    }
  }, [validEntries, backendResponse]); 

  // Return fallback if no valid data is available
  if (validEntries.length === 0) {
    return (
      <div
        style={{
          position: "fixed",
          top: "10%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "90%", // Increased width
          height: "80%", // Increased height
          backgroundColor: "#fff",
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)",
          padding: "20px",
          borderRadius: "10px",
          zIndex: 1000,
          overflow: "hidden", // Hide overflow outside of the container
        }}
      >
        <h2 style={{ textAlign: "center", color: "#007bff" }}>Cervical Dilation</h2>
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
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>
    );
  }

  // Prepare data for the graph
  const timestamps = validEntries.map((entry) => `${entry.date}T${entry.time}`);
  const dilations = validEntries.map((entry) => parseInt(entry.dilation, 10));
  const descents = validEntries.map((entry) => parseInt(entry.descent, 10));
  const mouldings = validEntries.map((entry) => entry.moulding);

  // Calculate the x-axis range (16-hour window starting from the first timestamp)
  const minTimestamp = new Date(Math.min(...timestamps.map((t) => new Date(t))));
  const maxTimestamp = new Date(minTimestamp);
  maxTimestamp.setHours(maxTimestamp.getHours() + 16);

  // Generate Alert and Action Lines
  const generateReferenceLine = (startTime, startDilation, stepHours) => {
    const lineData = [];
    let time = new Date(startTime);
    let dilation = startDilation;

    while (dilation <= 10) {
      lineData.push({ x: time.toISOString(), y: dilation });
      time.setHours(time.getHours() + stepHours);
      dilation += 1;
    }

    return lineData;
  };

  const alertLineData = generateReferenceLine(timestamps[0], 4, 1); // Alert line starts at 4 cm
  const actionLineData = generateReferenceLine(
    new Date(new Date(timestamps[0]).setHours(new Date(timestamps[0]).getHours() + 4)),
    4,
    1
  ); // Action line starts 4 hours later at 4 cm

  // Chart data and options
  const data = {
    datasets: [
      {
        label: "Dilation (cm)",
        data: timestamps.map((time, index) => ({
          x: time,
          y: dilations[index],
        })),
        borderColor: "#007bff",
        backgroundColor: "rgba(0, 123, 255, 0.2)",
        pointBackgroundColor: "#007bff",
        pointBorderColor: "#fff",
        borderWidth: 2,
        tension: 0.4,
      },
      {
        label: "Descent (cm)",
        data: timestamps.map((time, index) => ({
          x: time,
          y: descents[index],
        })),
        borderColor: "#28a745",
        backgroundColor: "rgba(40, 167, 69, 0.2)",
        pointBackgroundColor: "#28a745",
        pointBorderColor: "#fff",
        borderWidth: 2,
        tension: 0.4,
      },
      {
        label: "Alert Line",
        data: alertLineData,
        borderColor: "#ff9800",
        borderWidth: 2,
        borderDash: [5, 5],
        tension: 0,
      },
      {
        label: "Action Line",
        data: actionLineData,
        borderColor: "#f44336",
        borderWidth: 2,
        borderDash: [5, 5],
        tension: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      tooltip: {
        callbacks: {
          label: (context) => {
            const datasetLabel = context.dataset.label;

            if (datasetLabel === "Alert Line") {
              return "This is the alert line";
            } else if (datasetLabel === "Action Line") {
              return "This is the action line";
            }

            const entry = validEntries[context.dataIndex];
            return entry
              ? `Time: ${entry.date} ${entry.time}, Dilation: ${entry.dilation}, Descent: ${entry.descent}, Membranes: ${entry.membranes}, Liquor: ${entry.liquor}, Moulding: ${entry.moulding || "Not specified"}`
              : "No data";
          },
        },
      },
    },
    scales: {
      x: {
        type: "time",
        time: { unit: "hour", displayFormats: { hour: "HH:mm" } },
        title: {
          display: true,
          text: "Time (Hours)",
          font: { size: 16 },
        },
        min: minTimestamp.toISOString(),
        max: maxTimestamp.toISOString(),
      },
      y: {
        title: {
          display: true,
          text: "Measurement (cm)",
          font: { size: 16 },
        },
        min: 0,
        max: 10,
        ticks: { stepSize: 1 },
      },
    },
  };
  const overlayStyle = {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent black background
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: '1000', // Ensure it appears on top of other content
  };
  // Component rendering
  return (
    <div style={overlayStyle}>
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "90%", // Increased width
          height: "80%", // Increased height
          backgroundColor: "#f4f6f9",
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.5)",
          padding: "20px",
          borderRadius: "10px",
          zIndex: 1000,
          overflowY: "auto",
        }}
      >
        {/* Close button as an X in the top-right corner */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            padding: "5px 10px",
            backgroundColor: "transparent",
            color: "#dc3545",
            border: "none",
            fontSize: "20px",
            cursor: "pointer",
          }}
        >
          &times;
        </button>
  
        <h2 style={{ textAlign: "center", color: "#007bff" }}>Cervical Dilation</h2>
        
        <div style={{ height: "65%", marginBottom: "20px" }}>
          <Line data={data} options={options} />
        </div>
  
        {/* Display the backend response below the graph */}
        {backendResponse && (
          <div
            style={{
              marginTop: "20px",
              maxHeight: "300px", // Set a max height for the response container
              overflowY: "auto", // Add a vertical scrollbar if content overflows
              padding: "10px",
              backgroundColor: "#fff",
              borderRadius: "8px",
              boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
            }}
            dangerouslySetInnerHTML={{ __html: backendResponse.answer }} // Use HTML content
          />
        )}
  
        <button
          onClick={onClose}
          style={{
            display: "block",
            margin: "0 auto",
            padding: "10px 20px",
            backgroundColor: "#dc3545",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
  
};

export default VEgraph;
