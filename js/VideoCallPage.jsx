// src/VideoCallPage.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

const VideoCallPage = () => {
  const localVideoRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useParams(); // Extract token from URL

  useEffect(() => {
    // Initialize local video
    const initLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
            facingMode: 'user',
          },
          audio: true,
        });

        setLocalStream(stream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        setLoading(false);
      } catch (err) {
        console.error('Error accessing camera/microphone:', err);
        alert('Could not access camera/microphone: ' + err.message);
      }
    };

    initLocalStream();

    // Cleanup on unmount
    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [localStream]);

  const sendSignalingMessage = async (type, payload = {}) => {
    try {
      const response = await fetch('/api/webrtc-signaling.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          from: 'current-user-id', // We'll update this later
          to: 6, // Hardcoded user ID for Dr. Ddungu
          payload,
          token: token // Token extracted from URL
        })
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      
      return result;
    } catch (error) {
      console.error('Error sending signaling message:', error);
    }
  };

  const handleCallDdungu = () => {
    // Send call request with token and hardcoded user ID
    sendSignalingMessage('call-request', {
      message: 'Incoming video call request',
      timestamp: new Date().toISOString()
    });
    
    alert('Calling Dr. Ddungu — Request sent with token: ' + token);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header
        style={{
          backgroundColor: '#0D47A1',
          color: 'white',
          padding: '12px 16px',
          fontSize: '20px',
        }}
      >
        Video — Call Ddungu (Token: {token})
      </header>

      <div
        style={{
          flex: 1,
          backgroundColor: '#111',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {loading ? (
          <div style={{ color: 'white' }}>Loading...</div>
        ) : (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', maxHeight: '100%', objectFit: 'cover' }}
          />
        )}
      </div>

      <div style={{ padding: '16px' }}>
        <button
          onClick={handleCallDdungu}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: '#0D47A1',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          📹 Call Dr. Ddungu (User ID: 6)
        </button>
      </div>
    </div>
  );
};

export default VideoCallPage;