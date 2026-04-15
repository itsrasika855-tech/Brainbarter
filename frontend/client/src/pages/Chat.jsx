import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { io } from 'socket.io-client';
import {
  Send, MessageCircle, ArrowLeft, User, Search
} from 'lucide-react';

const Chat = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const preSelectedSwapId = searchParams.get('swapId');

  const [swaps, setSwaps] = useState([]);
  const [selectedSwap, setSelectedSwap] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [socket, setSocket] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Connect socket
    const newSocket = io(window.location.origin, {
      transports: ['websocket', 'polling']
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      if (user?._id) {
        newSocket.emit('register', user._id);
      }
    });

    newSocket.on('receiveMessage', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    fetchSwaps();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchSwaps = async () => {
    try {
      setLoading(true);
      const res = await API.get('/swaps', { params: { status: 'accepted' } });
      // Also include completed swaps for chat history
      const res2 = await API.get('/swaps', { params: { status: 'completed' } });
      const allSwaps = [...res.data, ...res2.data];
      setSwaps(allSwaps);

      // Auto-select if given swapId
      if (preSelectedSwapId) {
        const target = allSwaps.find(s => s._id === preSelectedSwapId);
        if (target) {
          selectSwap(target);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectSwap = async (swap) => {
    setSelectedSwap(swap);
    setShowSidebar(false);
    setLoadingMessages(true);
    try {
      const res = await API.get(`/chat/${swap._id}`);
      setMessages(res.data);
      // Mark as read
      await API.put(`/chat/read/${swap._id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedSwap) return;

    const otherUser = getOtherUser(selectedSwap);

    if (socket) {
      socket.emit('sendMessage', {
        senderId: user._id,
        receiverId: otherUser._id,
        message: newMessage,
        swapId: selectedSwap._id
      });

      // Optimistic update
      setMessages(prev => [...prev, {
        _id: Date.now(),
        sender: user._id,
        receiver: otherUser._id,
        message: newMessage,
        swap: selectedSwap._id,
        createdAt: new Date().toISOString()
      }]);
    } else {
      // Fallback to REST
      try {
        await API.post('/chat', {
          swapId: selectedSwap._id,
          receiverId: otherUser._id,
          message: newMessage
        });
      } catch (err) {
        console.error(err);
      }
    }

    setNewMessage('');
  };

  const getOtherUser = (swap) => {
    return swap.requester._id === user?._id ? swap.recipient : swap.requester;
  };

  const filteredSwaps = swaps.filter(swap => {
    if (!searchQuery) return true;
    const other = getOtherUser(swap);
    return other.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container fade-in" style={{ height: 'calc(100vh - 64px - 4rem)' }}>
      <div className="glass-card overflow-hidden h-full flex" style={{ minHeight: '500px' }}>
        {/* Sidebar - Chat List */}
        <div className={`${showSidebar ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-80 border-r border-slate-100 bg-white/50`}>
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-3">
              <MessageCircle className="w-5 h-5 text-blue-500" />
              Messages
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="input-field pl-9 text-sm py-2"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredSwaps.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-3xl mb-2">💬</div>
                <p className="text-sm text-slate-400">No conversations yet</p>
                <Link to="/explore" className="text-xs text-blue-500 no-underline hover:underline mt-1 inline-block">
                  Find someone to swap with
                </Link>
              </div>
            ) : (
              filteredSwaps.map(swap => {
                const other = getOtherUser(swap);
                const isSelected = selectedSwap?._id === swap._id;

                return (
                  <button
                    key={swap._id}
                    onClick={() => selectSwap(swap)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 border-b border-slate-50 transition-all cursor-pointer border-l-2 text-left bg-transparent ${
                      isSelected
                        ? 'bg-blue-50/80 border-l-blue-500'
                        : 'border-l-transparent hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-emerald-400 flex items-center justify-center text-sm text-white font-bold flex-shrink-0">
                      {other.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-700 truncate">{other.name}</div>
                      <div className="text-xs text-slate-400 truncate">
                        {swap.requesterSkill} ↔ {swap.recipientSkill}
                      </div>
                    </div>
                    <span className={`badge text-[10px] ${swap.status === 'accepted' ? 'badge-green' : 'badge-blue'}`}>
                      {swap.status === 'accepted' ? 'Active' : 'Done'}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`${!showSidebar ? 'flex' : 'hidden'} md:flex flex-col flex-1`}>
          {selectedSwap ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-white/60">
                <button
                  onClick={() => setShowSidebar(true)}
                  className="md:hidden p-1 rounded-lg hover:bg-slate-100 cursor-pointer border-none bg-transparent"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <Link to={`/profile/${getOtherUser(selectedSwap)._id}`} className="no-underline flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-emerald-400 flex items-center justify-center text-sm text-white font-bold">
                    {getOtherUser(selectedSwap).name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">{getOtherUser(selectedSwap).name}</div>
                    <div className="text-xs text-slate-400">
                      {selectedSwap.requesterSkill} ↔ {selectedSwap.recipientSkill}
                    </div>
                  </div>
                </Link>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages ? (
                  <LoadingSpinner size="sm" text="Loading messages..." />
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="text-4xl mb-3">👋</div>
                    <p className="text-sm text-slate-400">Say hello and start your skill exchange!</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMine = (msg.sender?._id || msg.sender) === user?._id;

                    return (
                      <div
                        key={msg._id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                          isMine
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md'
                            : 'bg-white border border-slate-100 text-slate-700 rounded-bl-md shadow-sm'
                        }`}>
                          <p className="break-words">{msg.message}</p>
                          <div className={`text-[10px] mt-1 ${isMine ? 'text-blue-100' : 'text-slate-300'}`}>
                            {formatTime(msg.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={sendMessage} className="flex items-center gap-2 p-3 border-t border-slate-100 bg-white/60">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="input-field flex-1 py-2.5"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="btn-primary py-2.5 px-4 disabled:opacity-30"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-emerald-100 flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-1">Select a conversation</h3>
              <p className="text-sm text-slate-400">Choose a swap partner to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
