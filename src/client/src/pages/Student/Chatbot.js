import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
  Grid,
} from '@mui/material';
import {
  Send,
  SmartToy,
  Person,
  Refresh,
  Settings,
  Info,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

const Chatbot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI medical assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Free AI API options
  const aiServices = [
    {
      name: 'Hugging Face (Free)',
      endpoint: 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
      description: 'Free conversational AI model',
      requiresKey: true,
    },
    {
      name: 'OpenAI (Free Tier)',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      description: 'GPT-3.5-turbo with free tier',
      requiresKey: true,
    },
    {
      name: 'Local Fallback',
      endpoint: 'local',
      description: 'Simple rule-based responses',
      requiresKey: false,
    },
  ];

  const getLocalResponse = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    // Medical-related responses
    if (message.includes('symptom') || message.includes('pain') || message.includes('hurt')) {
      return "I understand you're experiencing symptoms. For medical concerns, I recommend:\n1. Contact campus medical services\n2. Visit the dispensary\n3. Use the Emergency SOS feature for urgent cases\n\nWould you like me to help you book an appointment?";
    }
    
    if (message.includes('appointment') || message.includes('book')) {
      return "To book an appointment:\n1. Go to 'Book Appointment' in the menu\n2. Select a doctor\n3. Choose date and time\n4. Describe your symptoms\n\nWould you like me to guide you through this process?";
    }
    
    if (message.includes('emergency') || message.includes('urgent')) {
      return "🚨 For emergencies, please:\n1. Use the Emergency SOS feature immediately\n2. Call campus security at 911\n3. Go to the nearest medical facility\n\nYour safety is our priority!";
    }
    
    if (message.includes('prescription') || message.includes('medicine')) {
      return "For prescription-related queries:\n1. Check 'My Prescriptions' for your medication history\n2. Contact the dispensary for refills\n3. Consult with your doctor for dosage questions\n\nIs there anything specific about your medication?";
    }
    
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      return "Hello! I'm here to help with your medical and health-related questions. How can I assist you today?";
    }
    
    if (message.includes('help')) {
      return "I can help you with:\n• Booking appointments\n• Medical information\n• Emergency guidance\n• Prescription queries\n• General health questions\n\nWhat would you like to know?";
    }
    
    // Default responses
    const defaultResponses = [
      "I'm here to help with medical and health questions. Could you be more specific about what you need?",
      "For medical advice, I recommend consulting with our campus doctors. Would you like help booking an appointment?",
      "I can assist with appointment booking, medical information, and emergency guidance. What do you need help with?",
      "Your health is important! I can help you navigate our medical services. What's your concern?",
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      let botResponse;

      if (apiKey && apiKey.trim()) {
        // Try to use external AI API
        try {
          const response = await axios.post('/api/chatbot/ai-response', {
            message: inputMessage,
            apiKey: apiKey,
          });
          botResponse = response.data.response;
        } catch (error) {
          console.log('External API failed, using local response');
          botResponse = getLocalResponse(inputMessage);
        }
      } else {
        // Use local response
        botResponse = getLocalResponse(inputMessage);
      }

      const botMessage = {
        id: Date.now() + 1,
        text: botResponse,
        sender: 'bot',
        timestamp: new Date(),
      };

      setTimeout(() => {
        setMessages(prev => [...prev, botMessage]);
        setIsLoading(false);
      }, 1000);

    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm sorry, I'm having trouble responding right now. Please try again or contact support.",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        text: "Hello! I'm your AI medical assistant. How can I help you today?",
        sender: 'bot',
        timestamp: new Date(),
      },
    ]);
  };

  const quickActions = [
    { text: "Book Appointment", action: "I need to book a medical appointment" },
    { text: "Emergency Help", action: "I have a medical emergency" },
    { text: "Prescription Info", action: "Tell me about my prescriptions" },
    { text: "General Health", action: "I have general health questions" },
  ];

  const handleQuickAction = (action) => {
    setInputMessage(action);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" gutterBottom>
          🤖 AI Medical Assistant
        </Typography>
        <Box>
          <IconButton onClick={() => setShowSettings(!showSettings)}>
            <Settings />
          </IconButton>
          <IconButton onClick={clearChat}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Get instant help with medical questions, appointment booking, and health guidance
      </Typography>

      {/* Settings Panel */}
      {showSettings && (
        <Card sx={{ mb: 2, bgcolor: 'grey.50' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              AI Settings
            </Typography>
            <TextField
              fullWidth
              label="API Key (Optional)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your free AI API key for enhanced responses"
              helperText="Leave empty to use built-in responses"
              size="small"
            />
            <Box mt={2}>
              <Typography variant="body2" color="text.secondary">
                <strong>Free AI Services:</strong>
              </Typography>
              {aiServices.map((service, index) => (
                <Chip
                  key={index}
                  label={`${service.name} - ${service.description}`}
                  size="small"
                  sx={{ mr: 1, mb: 1 }}
                  color={service.requiresKey ? 'primary' : 'default'}
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={2}>
        {/* Chat Interface */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Messages */}
              <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
                <List>
                  {messages.map((message) => (
                    <ListItem key={message.id} sx={{ flexDirection: message.sender === 'user' ? 'row-reverse' : 'row' }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: message.sender === 'user' ? 'primary.main' : 'secondary.main' }}>
                          {message.sender === 'user' ? <Person /> : <SmartToy />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Paper
                            sx={{
                              p: 2,
                              bgcolor: message.sender === 'user' ? 'primary.light' : 'grey.100',
                              color: message.sender === 'user' ? 'primary.contrastText' : 'text.primary',
                              maxWidth: '70%',
                              ml: message.sender === 'user' ? 'auto' : 0,
                              mr: message.sender === 'user' ? 0 : 'auto',
                            }}
                          >
                            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                              {message.text}
                            </Typography>
                            <Typography variant="caption" display="block" sx={{ mt: 1, opacity: 0.7 }}>
                              {message.timestamp.toLocaleTimeString()}
                            </Typography>
                          </Paper>
                        }
                      />
                    </ListItem>
                  ))}
                  {isLoading && (
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'secondary.main' }}>
                          <SmartToy />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Paper sx={{ p: 2, bgcolor: 'grey.100', maxWidth: '70%' }}>
                            <Box display="flex" alignItems="center">
                              <CircularProgress size={20} sx={{ mr: 1 }} />
                              <Typography variant="body2">AI is thinking...</Typography>
                            </Box>
                          </Paper>
                        }
                      />
                    </ListItem>
                  )}
                </List>
                <div ref={messagesEndRef} />
              </Box>

              {/* Input */}
              <Box display="flex" gap={1}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={3}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about medical services, appointments, or health..."
                  disabled={isLoading}
                />
                <Button
                  variant="contained"
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  startIcon={isLoading ? <CircularProgress size={20} /> : <Send />}
                >
                  Send
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions & Info */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outlined"
                  fullWidth
                  sx={{ mb: 1 }}
                  onClick={() => handleQuickAction(action.action)}
                >
                  {action.text}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Info sx={{ mr: 1, verticalAlign: 'middle' }} />
                How I Can Help
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Book medical appointments
                • Provide health information
                • Guide emergency procedures
                • Answer prescription questions
                • General medical assistance
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Alert severity="info" size="small">
                <Typography variant="body2">
                  <strong>Note:</strong> For serious medical emergencies, use the Emergency SOS feature or call 911.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Chatbot;
