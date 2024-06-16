// App.js

import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io('https://bumbleee.netlify.app/'); 

function App() {
  const [roomID, setRoomID] = useState('');
  const [name, setName] = useState('');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');

  useEffect(() => {
    socket.on('connect', () => {
      setError('');
    });

    socket.on('connect_error', (err) => {
      setError('Error connecting to server. Please try again later.');
      console.error('Socket connection error:', err);
    });

    socket.on('message', (message) => {
      setMessages(prevMessages => [...prevMessages, message]);
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('message');
    };
  }, []);

  const handleJoinRoom = () => {
    if (roomID.trim() === '' || name.trim() === '') {
      setError('Please enter Room ID and Name.');
      return;
    }
    socket.emit('joinRoom', roomID, name);
    setError('');
  };

  const handleCreateRoom = () => {
    const newRoomID = Math.random().toString(36).substr(2, 6); // Generate random room ID
    setRoomID(newRoomID);
    socket.emit('joinRoom', newRoomID, name);
    setError('');
  };

  const startScreenSharing = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setMediaStream(stream);
      socket.emit('screenShare', roomID, stream);
      setIsScreenSharing(true);
    } catch (err) {
      console.error('Error accessing screen sharing:', err);
      setError('Error accessing screen sharing. Please check permissions and try again.');
    }
  };

  const stopScreenSharing = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
      socket.emit('stopScreenShare', roomID);
      setIsScreenSharing(false);
    }
  };

  const handleMessageSubmit = (e) => {
    e.preventDefault();
    if (messageInput.trim() === '') return;
    const message = `${name}: ${messageInput}`;
    socket.emit('message', roomID, message);
    setMessages(prevMessages => [...prevMessages, message]);
    setMessageInput('');
  };

  const handleExitRoom = () => {
    socket.emit('leaveRoom', roomID, name);
    setRoomID('');
    setName('');
    setMessages([]);
    if (mediaStream) {
      stopScreenSharing();
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Screen Share App</h1>
      </header>
      <div className="content">
        {!roomID && (
          <div className="name-input">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter Your Name"
              className="name-input-field"
            />
          </div>
        )}
        <div className="room-controls">
          <input
            type="text"
            value={roomID}
            onChange={(e) => setRoomID(e.target.value)}
            placeholder="Enter Room ID"
            className="room-input"
            disabled={!!roomID}
          />
          {!roomID && (
            <button onClick={handleJoinRoom} className="action-button">Join Room</button>
          )}
          {!roomID && (
            <button onClick={handleCreateRoom} className="action-button">Create Room</button>
          )}
          {roomID && (
            <button onClick={handleExitRoom} className="action-button">Exit Room</button>
          )}
        </div>
        <div className="share-controls">
          {roomID && !isScreenSharing && (
            <button onClick={startScreenSharing} className="action-button start-button">Start Screen Share</button>
          )}
          {roomID && isScreenSharing && (
            <button onClick={stopScreenSharing} className="action-button stop-button">Stop Screen Share</button>
          )}
        </div>
        {isScreenSharing && (
          <div className="video-container">
            <video className="screen-share-video" srcObject={mediaStream} autoPlay />
          </div>
        )}
        {roomID && (
          <div className="chat-container">
            <h3>Chat</h3>
            <div className="chat-messages">
              {messages.map((message, index) => (
                <div key={index} className="chat-message">{message}</div>
              ))}
            </div>
            <form onSubmit={handleMessageSubmit} className="message-form">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type your message..."
                className="message-input"
              />
              <button type="submit" className="send-button">Send</button>
            </form>
          </div>
        )}
      </div>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

export default App;
