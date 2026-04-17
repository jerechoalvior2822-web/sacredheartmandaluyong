import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { UserNavbar } from '../components/UserNavbar';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useAuth } from '../components/AuthContext';
import { useNotifications } from '../components/NotificationContext';
import { Send, Bot, User, Phone, PhoneOff } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { getApiUrl } from '../utils/apiConfig';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'admin';
  timestamp: string;
}

export function Messages() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { notifications, resetUnreadMessages } = useNotifications();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [previousAdminMessageCount, setPreviousAdminMessageCount] = useState(0);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const handleInitiateCall = () => {
    setIsCallActive(true);
    toast.success('Requesting call with admin... Please wait for response.');
    
    // Send a system message indicating a call was requested
    try {
      const userId = parseInt(user?.id || '1', 10);
      fetch(getApiUrl('/api/messages'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId, sender: 'user', text: '📞 Initiated a call request' }),
      }).catch(err => console.error('Failed to log call request:', err));
    } catch (err) {
      console.error('Error initiating call:', err);
    }
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    setCallDuration(0);
    toast.info('Call ended');
  };

  // Simulate call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallActive]);

  const fetchMessages = async () => {
    try {
      const userId = parseInt(user?.id || '1', 10);
      const response = await fetch(getApiUrl(`/api/messages?user_id=${userId}`));
      if (!response.ok) throw new Error('Failed to load messages');
      const data = await response.json();
      
      // Count admin messages
      const adminMessageCount = data.filter((m: Message) => m.sender === 'admin').length;
      
      // Show notification if new admin message arrived
      if (previousAdminMessageCount > 0 && adminMessageCount > previousAdminMessageCount) {
        toast.success('New reply from admin staff!');
      }
      
      setPreviousAdminMessageCount(adminMessageCount);
      setMessages(data);
      // Reset unread count when viewing messages
      if (notifications.unreadMessages > 0) {
        resetUnreadMessages();
      }
    } catch (err) {
      setError((err as Error).message || 'Unable to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [user]);

  // Poll for new messages every 2 seconds
  useEffect(() => {
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [user, previousAdminMessageCount, notifications.unreadMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const userId = parseInt(user?.id || '1', 10);
    const messageText = newMessage;
    setNewMessage('');

    try {
      await fetch(getApiUrl('/api/messages'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId, sender: 'user', text: messageText }),
      });
      // Refresh messages immediately after sending
      fetchMessages();
    } catch (err) {
      console.error('Failed to save message:', err);
    }
  };

  return (
    <div className="min-h-screen">
      <UserNavbar />

      <div className="max-w-4xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-primary mb-2">Messages</h1>
          <p className="text-muted-foreground">Chat with our parish staff</p>
        </motion.div>

        <Card className="h-[calc(100vh-250px)] flex flex-col">
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3>Sacred Heart Parish</h3>
                  <p className="text-sm text-muted-foreground">
                    {isCallActive ? (
                      <span className="text-green-600 font-medium">
                        📞 Call Active - {Math.floor(callDuration / 60)}:{String(callDuration % 60).padStart(2, '0')}
                      </span>
                    ) : (
                      'Admin staff • Responses may take a while'
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {!isCallActive ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleInitiateCall}
                    className="flex items-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    <span className="hidden sm:inline">Call</span>
                  </Button>
                ) : (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleEndCall}
                    className="flex items-center gap-2"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span className="hidden sm:inline">End Call</span>
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardBody className="flex-1 overflow-y-auto">
            <div className="space-y-4">
              {loading ? (
                <div className="text-center text-muted-foreground py-8">Loading conversation...</div>
              ) : error ? (
                <div className="text-center text-destructive py-8">{error}</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">No previous messages found.</div>
              ) : (
                <>
                  {messages.map((message, index) => (
                    <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex gap-2 max-w-[70%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.sender === 'user' ? 'bg-accent' : 'bg-primary'
                        }`}
                      >
                        {message.sender === 'user' ? (
                          <User className="w-5 h-5 text-white" />
                        ) : (
                          <Bot className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            message.sender === 'user'
                              ? 'bg-primary text-white'
                              : 'bg-secondary text-foreground'
                          }`}
                        >
                          <p>{message.text}</p>
                        </div>
                        <div
                          className={`flex items-center gap-2 mt-1 text-xs text-muted-foreground ${message.sender === 'user' ? 'justify-end' : ''}`}
                        >
                          <span>{message.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )
            }
            </div>
          </CardBody>

          <div className="p-4 border-t border-border">
            <form onSubmit={handleSend} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button type="submit" disabled={!newMessage.trim()}>
                <Send className="w-5 h-5" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
