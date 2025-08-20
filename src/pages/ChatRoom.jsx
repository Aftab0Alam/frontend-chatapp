import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { socket } from '../socket';
import axios from 'axios';
import EmojiPicker from 'emoji-picker-react';

function ChatRoom() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [friendName, setFriendName] = useState('');
  const [typing, setTyping] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    socket.emit('join_room', chatId);

    const fetchChat = async () => {
      const res = await axios.get(`http://localhost:5000/api/chats/${user.id}`);
      const chat = res.data.find(c => c._id === chatId);
      setMessages(chat?.messages || []);
      const friend = chat.participants.find(p => p._id !== user.id);
      setFriendName(friend?.name);
      scrollToBottom();
    };
    fetchChat();

    socket.on('receive_message', (msg) => {
      setMessages(prev => [...prev, msg]);
      scrollToBottom();
    });

    socket.on('user_typing', ({ userName }) => {
      setTyping(`${userName} is typing...`);
      setTimeout(() => setTyping(''), 2000);
    });

    return () => {
      socket.off('receive_message');
      socket.off('user_typing');
    };
  }, [chatId]);

  const handleTyping = (e) => {
    setText(e.target.value);
    socket.emit('typing', { chatId, userName: user.name });
  };

  const sendMessage = () => {
    if (!text.trim()) return;
    socket.emit('send_message', { chatId, senderId: user.id, text });
    setText('');
    setShowEmoji(false);
  };

  const onEmojiClick = (emojiData) => {
    setText(prev => prev + emojiData.emoji);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result;
      socket.emit('send_message', { chatId, senderId: user.id, image: imageData });
    };
    reader.readAsDataURL(file);
  };

  const renderMessage = (m, i) => {
    const isUser = m.sender === user.id;
    const time = m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    return (
      <div key={i} style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        margin: '8px 0',
      }}>
        <div style={{
          maxWidth: '70%',
          backgroundColor: isUser ? '#dcf8c6' : '#fff',
          padding: 10,
          borderRadius: 10,
          borderTopRightRadius: isUser ? 0 : 10,
          borderTopLeftRadius: isUser ? 10 : 0,
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
          wordBreak: 'break-word'
        }}>
          {m.text && <div style={{ marginBottom: m.image ? 5 : 0 }}>{m.text}</div>}
          {m.image && (
            <img
              src={m.image}
              alt="sent"
              style={{ maxWidth: '100%', borderRadius: 8 }}
            />
          )}
          <div style={{ fontSize: 10, color: 'gray', textAlign: 'right', marginTop: 3 }}>
            {isUser ? 'You' : friendName} • {time}
          </div>
        </div>
      </div>
    );
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString(); // e.g., 20/08/2025
  };

  const renderMessagesWithDate = () => {
    let lastDate = null;
    return messages.map((m, i) => {
      const messageDate = m.timestamp ? new Date(m.timestamp).toDateString() : '';
      const showDate = messageDate !== lastDate;
      lastDate = messageDate;

      return (
        <React.Fragment key={i}>
          {showDate && (
            <div style={{
              textAlign: 'center',
              margin: '10px 0',
              fontSize: 12,
              color: 'gray'
            }}>
              {formatDate(m.timestamp)}
            </div>
          )}
          {renderMessage(m, i)}
        </React.Fragment>
      );
    });
  };

  return (
    <div style={{ width: '95%', maxWidth: 600, margin: '20px auto', boxSizing: 'border-box' }}>
      <h2 style={{ fontSize: '1.5rem', wordBreak: 'break-word', marginBottom: 15 }}>
        Chat with {friendName}
      </h2>

      <div
        style={{
          border: '1px solid #ccc',
          height: '60vh',
          maxHeight: '80vh',
          overflowY: 'auto',
          padding: 10,
          borderRadius: 8,
          backgroundColor: '#f0f0f0',
        }}
      >
        {renderMessagesWithDate()}
        <div ref={messagesEndRef} />
      </div>

      {typing && <p style={{ fontStyle: 'italic', color: 'gray', marginTop: 5 }}>{typing}</p>}

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        marginTop: 10
      }}>
        <button
          onClick={() => setShowEmoji(prev => !prev)}
          style={{ fontSize: 20, marginRight: 5, marginBottom: 5 }}
        >😀</button>

        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ marginRight: 5, marginBottom: 5 }}
        />

        <input
          type="text"
          placeholder="Type a message"
          value={text}
          onChange={handleTyping}
          onKeyPress={e => e.key === 'Enter' && sendMessage()}
          style={{
            flex: 1,
            padding: 10,
            minWidth: '60%',
            marginBottom: 5,
            borderRadius: 20,
            border: '1px solid #ccc',
            outline: 'none',
            backgroundColor: '#fff'
          }}
        />
        <button
          onClick={sendMessage}
          style={{
            padding: '10px 15px',
            marginLeft: 5,
            marginBottom: 5,
            borderRadius: 20,
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Send
        </button>
      </div>

      {showEmoji && (
        <div style={{ position: 'relative', marginTop: 10, maxWidth: '100%' }}>
          <EmojiPicker onEmojiClick={onEmojiClick} />
        </div>
      )}
    </div>
  );
}

export default ChatRoom;
