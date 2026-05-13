import React, { useState, useEffect } from "react";
import { urls } from './config.dev'; // Import the URLs from your config

const Comments = ({ fileId, employeeName, token, onClose }) => {
  const [aiResponse, setAiResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    // Function to fetch AI response based on fileId and employeeName
    const fetchAIResponse = async () => {
      setLoading(true);
      setError(null); // Reset previous error state
  
      try {
        const response = await fetch(urls.AIcomments, { // Use the AIcomments URL from config
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
          const errorData = await response.json();
  
          // Check if error is about missing fields
          if (errorData.error && errorData.error.startsWith("Missing fields:")) {
           
            setError(errorData.error); // Optionally, set the error state for further handling
            return; // Stop execution here if there's an error
          } else {
            throw new Error('Failed to fetch AI response');
          }
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
  
  const parseResponse = (response) => {
    if (!response) return [];
    // Split response by double newline (\n\n) to separate paragraphs
    return response.split("\n\n").map((paragraph, index) => (
      <p key={index} style={{ marginBottom: "1.5em", lineHeight: "1.6" }}>
        {paragraph.split("\n").map((line, lineIndex) => (
          <span key={lineIndex}>
            {line}
            <br />
          </span>
        ))}
      </p>
    ));
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
      <h2 style={{ textAlign: "center", color: "#007BFF" }}>Clinic Pro analysis about your prescription</h2>

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
          <p>Clinic Pro AI thinking...</p>
        </div>
      )}
      {error && <p style={{ color: "red", textAlign: "center" }}>Error: {error}</p>}

      {/* Display AI response */}
      {aiResponse && (
        <div style={{ marginTop: "20px" }}>
          <h3>Clinic Pro Response:</h3>
          <div style={{ maxHeight: "60vh", overflowY: "scroll" }}>
            <ul style={{ listStyleType: "disc", paddingLeft: "20px" }}>
              {parseResponse(aiResponse.aiResponse)}
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

export default Comments;
