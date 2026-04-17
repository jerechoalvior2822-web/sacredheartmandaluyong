import { useState, useEffect, useRef } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { useNotifications } from '../../components/NotificationContext';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Send, Bot, User, Phone, PhoneOff } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { getApiUrl } from '../../utils/apiConfig';

interface Message {
  id: number;
  userId: number;
  userName?: string;
  userEmail?: string;
  text: string;
  sender: 'user' | 'admin';
  timestamp: string;
}

interface ConversationGroup {
  userId: number;
  userName?: string;
  userEmail?: string;
  messages: Message[];
  lastMessage: string;
}

export function AdminMessages() {
  const [conversations, setConversations] = useState<ConversationGroup[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyText, setReplyText] = useState('');
  const [previousUserMessageCount, setPreviousUserMessageCount] = useState(0);
  const { setUnreadMessages } = useNotifications();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [activeCallUserId, setActiveCallUserId] = useState<number | null>(null);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    fetchAllMessages();
    // Poll for new messages every 2 seconds
    const interval = setInterval(fetchAllMessages, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages change or user switches
    if (messagesContainerRef.current) {
      const timer = setTimeout(() => {
        messagesContainerRef.current?.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedUserId, conversations]);

  const fetchAllMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl('/api/messages'));
      if (!response.ok) throw new Error('Failed to load messages');
      const data = await response.json();

      // Group messages by userId and capture user info
      const grouped: Record<number, { messages: Message[]; userName?: string; userEmail?: string }> = {};
      data.forEach((msg: Message) => {
        if (!grouped[msg.userId]) {
          grouped[msg.userId] = {
            messages: [],
            userName: msg.userName,
            userEmail: msg.userEmail,
          };
        }
        grouped[msg.userId].messages.push(msg);
      });

      const convos = Object.entries(grouped).map(([userId, data]) => ({
        userId: parseInt(userId),
        userName: data.userName,
        userEmail: data.userEmail,
        messages: data.messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
        lastMessage: data.messages[data.messages.length - 1]?.text || '',
      }));

      // Count user messages (not admin)
      const totalUserMessages = convos.reduce((sum, convo) => 
        sum + convo.messages.filter((m: Message) => m.sender === 'user').length, 0
      );
      
      // Update unread count in notification context
      setUnreadMessages(totalUserMessages);
      
      // Show notification if new user message arrived
      if (previousUserMessageCount > 0 && totalUserMessages > previousUserMessageCount) {
        toast.success('New message from user!');
      }
      
      setPreviousUserMessageCount(totalUserMessages);
      setConversations(convos);
      if (convos.length > 0 && !selectedUserId) {
        setSelectedUserId(convos[0].userId);
      }
    } catch (err) {
      setError((err as Error).message || 'Unable to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedUserId) return;

    try {
      await fetch(getApiUrl('/api/messages'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: selectedUserId, sender: 'admin', text: replyText }),
      });
      setReplyText('');
      fetchAllMessages();
    } catch (err) {
      console.error('Failed to send reply:', err);
    }
  };

  const handleInitiateCall = (userId: number) => {
    setActiveCallUserId(userId);
    toast.success('Call initiated with user...');
    
    try {
      fetch(getApiUrl('/api/messages'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId, sender: 'admin', text: '📞 Admin initiated a call' }),
      }).catch(err => console.error('Failed to log call:', err));
    } catch (err) {
      console.error('Error initiating call:', err);
    }
  };

  const handleEndCall = () => {
    setActiveCallUserId(null);
    setCallDuration(0);
    toast.info('Call ended');
  };

  // Simulate call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeCallUserId) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeCallUserId]);

  const selectedConvo = conversations.find(c => c.userId === selectedUserId);

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-100px)]">
        <div className="mb-6">
          <h1 className="text-primary mb-2">Messages</h1>
          <p className="text-muted-foreground">Manage user messages and conversations</p>
        </div>

        <div className="flex gap-6 flex-1 overflow-hidden">
          {/* Conversations List */}
          <div className="w-80 border border-border rounded-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border bg-secondary/50">
              <h2 className="font-semibold">Conversations</h2>
              <p className="text-xs text-muted-foreground">{conversations.length} users</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-muted-foreground">Loading...</div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">No messages yet</div>
              ) : (
                conversations.map(convo => (
                  <motion.button
                    key={convo.userId}
                    onClick={() => setSelectedUserId(convo.userId)}
                    className={`w-full p-4 border-b border-border text-left transition-colors ${
                      selectedUserId === convo.userId ? 'bg-primary/10' : 'hover:bg-secondary/50'
                    }`}
                    whileHover={{ backgroundColor: 'var(--secondary)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{convo.userName || convo.userEmail || `User ${convo.userId}`}</p>
                        <p className="text-xs text-muted-foreground truncate">{convo.lastMessage}</p>
                      </div>
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          </div>

          {/* Messages View */}
          <div className="flex-1 border border-border rounded-lg overflow-hidden flex flex-col">
            {selectedConvo ? (
              <>
                <div className="p-4 border-b border-border bg-secondary/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{selectedConvo.userName || selectedConvo.userEmail || `User ${selectedConvo.userId}`}</h3>
                      <p className="text-xs text-muted-foreground">
                        {activeCallUserId === selectedConvo.userId ? (
                          <span className="text-green-600 font-medium">
                            📞 Call Active - {Math.floor(callDuration / 60)}:{String(callDuration % 60).padStart(2, '0')}
                          </span>
                        ) : (
                          `${selectedConvo.userEmail && selectedConvo.userName ? selectedConvo.userEmail : ''} • ${selectedConvo.messages.length} messages`
                        )}
                      </p>
                    </div>
                  </div>
                  <div>
                    {activeCallUserId === selectedConvo.userId ? (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={handleEndCall}
                        className="flex items-center gap-2"
                      >
                        <PhoneOff className="w-4 h-4" />
                        <span className="hidden sm:inline">End Call</span>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleInitiateCall(selectedConvo.userId)}
                        className="flex items-center gap-2"
                      >
                        <Phone className="w-4 h-4" />
                        <span className="hidden sm:inline">Call User</span>
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={messagesContainerRef}>
                  {selectedConvo.messages.map((msg, index) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`flex gap-2 max-w-[70%] ${msg.sender === 'user' ? '' : 'flex-row-reverse'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          msg.sender === 'user' ? 'bg-accent' : 'bg-primary'
                        }`}>
                          {msg.sender === 'user' ? (
                            <User className="w-5 h-5 text-white" />
                          ) : (
                            <Bot className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div>
                          <div className={`px-4 py-2 rounded-2xl ${
                            msg.sender === 'user' ? 'bg-secondary text-foreground' : 'bg-primary text-white'
                          }`}>
                            <p className="text-sm">{msg.text}</p>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-border">
                  <form onSubmit={handleSendReply} className="flex gap-2">
                    <Input
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Type your reply..."
                      className="flex-1"
                    />
                    <Button type="submit" disabled={!replyText.trim()}>
                      <Send className="w-5 h-5" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                {error ? error : 'Select a conversation to view messages'}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
