import React, { useState, useEffect } from "react";
import { urls } from './config.dev'; // Import the URLs from your config

const FoodRecommendation = ({ fileId, employeeName, token, onClose }) => {
  const [aiResponse, setAiResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Function to fetch AI response based on fileId and employeeName
    const fetchAIResponse = async () => {
      setLoading(true);
      setError(null); // Reset previous error state

      try {
        const response = await fetch(urls.foodrecommendations, { // Use the foodrecommendations URL from config
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileId,
            employeeName,
            token, // Assuming token is required
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch food recommendations');
        }

        const data = await response.json();
        setAiResponse(data); // Assuming AI returns a JSON object with the response
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAIResponse(); // Fetch AI response when the component mounts
  }, [fileId, employeeName, token]); // Dependency array to run on prop change

  // Log the AI response for debugging
  useEffect(() => {
    if (aiResponse) {
      console.log("AI Response:", aiResponse);
    }
  }, [aiResponse]);

  // Function to convert the AI response to list items
  const parseResponse = (response) => {
    if (!response) return [];

    // Split the response by new lines and render each as a paragraph or list item
    return response.split("\n").map((line, index) => {
      const trimmedLine = line.trim();
      return trimmedLine ? <li key={index}>{trimmedLine}</li> : null; // Render meaningful lines as list items
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        backgroundColor: "white",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
        borderRadius: "10px",
        width: "80vw", // Ensures the page is wide enough
        height: "80vh", // Allows the container to take up most of the screen
        padding: "20px",
        overflow: "auto", // Enables scrolling if content overflows
        zIndex: 1000,
      }}
    >
      <h2 style={{ textAlign: "center", color: "#007BFF" }}>Food Recommendations based on your prescription</h2>

      {/* Display loading or error message */}
      {loading && (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              border: "4px solid #f3f3f3", /* Light gray */
              borderTop: "4px solid #3498db", /* Blue */
              borderRadius: "50%",
              width: "50px",
              height: "50px",
              animation: "spin 2s linear infinite",
            }}
          ></div>
          <p>Clinic Pro AI is generating your food recommendations...</p>
        </div>
      )}
      {error && <p style={{ color: "red", textAlign: "center" }}>Error: {error}</p>}

      {/* Display AI response */}
      {aiResponse && (
        <div style={{ marginTop: "20px" }}>
          <h3>Clinic Pro Response:</h3>
          <div style={{ maxHeight: "60vh", overflowY: "scroll" }}>
            <ul style={{ listStyleType: "disc", paddingLeft: "20px" }}>
              {parseResponse(aiResponse.aiResponse)} {/* Render the response as list items */}
            </ul>
          </div>
        </div>
      )}

      <button
        onClick={onClose}
        style={{
          display: "block",
          margin: "20px auto 0",
          backgroundColor: "#28a745",
          color: "white",
          border: "none",
          padding: "10px 20px",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Close
      </button>
    </div>
  );
};

export default FoodRecommendation;
