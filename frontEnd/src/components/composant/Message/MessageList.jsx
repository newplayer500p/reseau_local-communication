import React, { useEffect, useRef } from 'react';
import { API_BASE } from '../../../service/axios.service';

export const MessageList = ({ messages, formatDateFR, profile }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="message-container">
      {messages.map((msg) => {
        const isMe = msg.sender === profile.email;
        
        return (
          <div key={`${msg._id}-${msg.createdAt}`} className={`message ${isMe ? 'own-message' : ''}`}>
            <div className="message-header">
              <span className="sender">{msg.sender}</span>
              <span className="timestamp">{formatDateFR(msg.createdAt)}</span>
            </div>
            <div className="message-content">
              {msg.type === 'file' ? (
                <a href={`${API_BASE}/download/${msg.file.url.split("/")[2]}`} download>
                  📎 {msg.file.originalName}
                </a>
              ) : (
                msg.text
              )}
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};