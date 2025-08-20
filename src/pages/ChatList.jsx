import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';

function ChatList() {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [chats, setChats] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState({});
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/chats/${user.id}`);
        const sortedChats = res.data.sort((a, b) => {
          const aTime = a.messages.length ? new Date(a.messages[a.messages.length - 1].timestamp).getTime() : 0;
          const bTime = b.messages.length ? new Date(b.messages[b.messages.length - 1].timestamp).getTime() : 0;
          return bTime - aTime;
        });
        setChats(sortedChats);
      } catch (err) {
        console.error(err);
      }
    };

    fetchChats();

    socket.on('receive_message', (msg) => {
      setChats(prev => {
        const idx = prev.findIndex(c => c._id === msg.chatId);
        let updatedChats = [...prev];
        if (idx > -1) {
          updatedChats[idx].messages.push(msg);
          const chat = updatedChats.splice(idx, 1)[0];
          updatedChats = [chat, ...updatedChats];
        } else {
          const newChat = {
            _id: msg.chatId,
            participants: [{ _id: user.id, name: user.name }, msg.senderInfo],
            messages: [msg]
          };
          updatedChats = [newChat, ...updatedChats];
        }
        return updatedChats;
      });
    });

    socket.on('update_online', users => setOnlineUsers(users));

    return () => {
      socket.off('receive_message');
      socket.off('update_online');
    };
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setUsers([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/users?search=${search}`);
        setUsers(res.data.filter(u => u._id !== user.id));
      } catch (err) {
        console.error(err);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const startChat = async (friendId) => {
    try {
      const res = await axios.post('http://localhost:5000/api/chats', { userIds: [user.id, friendId] });
      navigate(`/chat/${res.data._id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredChats = chats.filter(c => {
    const friend = c.participants.find(p => p._id !== user.id);
    const lastMsg = c.messages[c.messages.length - 1]?.text || '';
    return (
      friend?.name.toLowerCase().includes(search.toLowerCase()) ||
      friend?.phone?.includes(search) ||
      lastMsg.toLowerCase().includes(search.toLowerCase())
    );
  });

  const generateAvatar = (name, size = 50) => {
    const colors = ['#25D366', '#128C7E', '#075E54', '#34B7F1', '#00A884', '#DCF8C6'];
    const color = colors[name.charCodeAt(0) % colors.length];
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: color,
          color: 'white',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontWeight: 'bold',
          fontSize: size / 2,
          textTransform: 'uppercase',
          marginRight: 10,
          flexShrink: 0,
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          transition: 'transform 0.2s',
        }}
        className="avatar-hover"
      >
        {name.charAt(0)}
      </div>
    );
  };

  return (
    <div style={{ width: '95%', maxWidth: 500, margin: '20px auto', boxSizing: 'border-box' }}>
      <h2 style={{ fontSize: '1.5rem', wordBreak: 'break-word', color: '#075E54' }}>Chats</h2>

      <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: 10 }}>
        <input
          type="text"
          placeholder="Search by name, phone, or message"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: '1 1 60%',
            padding: 10,
            minWidth: 120,
            marginBottom: 5,
            borderRadius: 25,
            border: '1px solid #ccc',
            outline: 'none',
            transition: 'all 0.3s ease',
          }}
        />
      </div>

      <div style={{ marginTop: 20 }}>
        {/* Search Results */}
        {users.map(u => {
          const isOnline = onlineUsers[u._id]?.socketId;
          return (
            <div
              key={u._id}
              style={{
                display: 'flex',
                alignItems: 'center',
                border: '1px solid #e0e0e0',
                padding: 10,
                margin: 5,
                cursor: 'pointer',
                flexWrap: 'wrap',
                borderRadius: 10,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                transition: 'all 0.2s',
              }}
              onClick={() => startChat(u._id)}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0f0f0'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
            >
              {u.avatar ? (
                <img
                  src={u.avatar}
                  alt="avatar"
                  style={{ width: 50, height: 50, borderRadius: '50%', marginRight: 10, marginBottom: 5 }}
                />
              ) : (
                generateAvatar(u.name, 50)
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 'bold' }}>{u.name}</div>
                <small style={{ color: isOnline ? '#25D366' : 'gray' }}>
                  {isOnline ? 'Online' : 'Offline'}
                </small>
              </div>
            </div>
          );
        })}

        {/* Existing Chats */}
        <h3 style={{ marginTop: 15, color: '#128C7E' }}>Existing Chats</h3>
        {filteredChats.length === 0 && <p style={{ color: 'gray' }}>No chats found.</p>}
        {filteredChats.map(c => {
          const friend = c.participants.find(p => p._id !== user.id);
          const friendData = onlineUsers[friend._id];
          const isOnline = friendData?.socketId;
          const statusText = isOnline
            ? 'Online'
            : friendData?.lastSeen
              ? `Last seen: ${new Date(friendData.lastSeen).toLocaleTimeString()}`
              : 'Offline';

          const lastMsg = c.messages[c.messages.length - 1];
          const lastMsgText = lastMsg?.text || (lastMsg?.image ? 'Image' : '');
          const lastMsgPreview = lastMsg?.image ? (
            <img 
              src={lastMsg.image} 
              alt="preview" 
              style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 5, marginLeft: 5 }} 
            />
          ) : null;

          return (
            <div
              key={c._id}
              style={{
                display: 'flex',
                alignItems: 'center',
                border: '1px solid #e0e0e0',
                padding: 10,
                margin: 5,
                cursor: 'pointer',
                flexWrap: 'wrap',
                borderRadius: 10,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                transition: 'all 0.2s',
              }}
              onClick={() => navigate(`/chat/${c._id}`)}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0f0f0'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
            >
              {friend.avatar ? (
                <img
                  src={friend.avatar}
                  alt="avatar"
                  style={{ width: 50, height: 50, borderRadius: '50%', marginRight: 10, marginBottom: 5 }}
                />
              ) : (
                generateAvatar(friend.name, 50)
              )}
              <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <b>{friend?.name}</b>
                  <span style={{ fontSize: 12, color: 'gray' }}>{statusText}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: 'gray', flexWrap: 'wrap' }}>
                  {lastMsg ? `${lastMsg.sender === user.id ? 'You: ' : ''}${lastMsgText}` : 'No messages yet'}
                  {lastMsgPreview}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ChatList;
