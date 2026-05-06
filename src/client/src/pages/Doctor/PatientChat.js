import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Alert,
  CircularProgress,
  Badge,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Paper,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  Chat,
  Send,
  Person,
  Phone,
  Email,
  LocationOn,
  AccessTime,
  CheckCircle,
  Warning,
  Info,
  Refresh,
  Edit,
  Delete,
  Add,
  Search,
  FilterList,
  MedicalServices,
  LocalHospital,
  CrisisAlert,
  TrackChanges,
  Visibility,
  Assignment,
  School,
  QrCode,
  Print,
  Approved,
  Rejected,
  Pending,
  Schedule,
  History,
  Dashboard,
  Queue,
  Analytics,
  DirectionsCar,
  Medication,
  LocalPharmacy,
  CalendarToday,
  FileUpload,
  AttachFile,
  Description,
  Work,
  Star,
  QrCodeScanner,
  Email as EmailIcon,
  Print as PrintIcon,
  VideoCall,
  Call,
  MoreVert,
  AttachFile as AttachFileIcon,
  EmojiEmotions,
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const PatientChat = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [openVideoCall, setOpenVideoCall] = useState(false);
  const [openAudioCall, setOpenAudioCall] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);

  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch doctor's patients for chat
  const { data: chatPatients = [], isLoading: patientsLoading, refetch: refetchPatients } = useQuery(
    'doctor-chat-patients',
    () => axios.get('/api/doctor/chat/patients').then(res => res.data),
    {
      select: (data) => data || [],
      retry: 3,
    }
  );

  // Fetch chat messages with selected patient
  const { data: chatMessages = [], isLoading: messagesLoading, refetch: refetchMessages } = useQuery(
    ['chat-messages', selectedPatient?._id],
    () => selectedPatient ? axios.get(`/api/doctor/chat/messages/${selectedPatient._id}`).then(res => res.data) : Promise.resolve([]),
    {
      select: (data) => data || [],
      retry: 3,
      enabled: !!selectedPatient,
    }
  );

  // Fetch online patients
  const { data: onlinePatients = [], isLoading: onlineLoading } = useQuery(
    'online-patients',
    () => axios.get('/api/doctor/chat/online-patients').then(res => res.data),
    {
      select: (data) => data || [],
      retry: 3,
    }
  );

  // Send message mutation
  const sendMessageMutation = useMutation(
    ({ patientId, message, type = 'text' }) => 
      axios.post('/api/doctor/chat/send-message', { patientId, message, type }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['chat-messages', selectedPatient?._id]);
        setMessage('');
        toast.success('Message sent successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to send message');
      }
    }
  );

  // Mark message as read mutation
  const markAsReadMutation = useMutation(
    (messageId) => axios.put(`/api/doctor/chat/mark-read/${messageId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['chat-messages', selectedPatient?._id]);
      }
    }
  );

  // Start video call mutation
  const startVideoCallMutation = useMutation(
    (patientId) => axios.post('/api/doctor/chat/start-video-call', { patientId }),
    {
      onSuccess: () => {
        setOpenVideoCall(true);
        toast.success('Video call started');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to start video call');
      }
    }
  );

  // Start audio call mutation
  const startAudioCallMutation = useMutation(
    (patientId) => axios.post('/api/doctor/chat/start-audio-call', { patientId }),
    {
      onSuccess: () => {
        setOpenAudioCall(true);
        toast.success('Audio call started');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to start audio call');
      }
    }
  );

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!message.trim() || !selectedPatient) return;

    sendMessageMutation.mutate({
      patientId: selectedPatient._id,
      message: message.trim(),
      type: 'text'
    });
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    // Mark all messages as read when opening chat
    if (chatMessages.length > 0) {
      chatMessages.forEach(msg => {
        if (!msg.read && msg.sender !== user._id) {
          markAsReadMutation.mutate(msg._id);
        }
      });
    }
  };

  const handleStartVideoCall = () => {
    if (selectedPatient) {
      startVideoCallMutation.mutate(selectedPatient._id);
    }
  };

  const handleStartAudioCall = () => {
    if (selectedPatient) {
      startAudioCallMutation.mutate(selectedPatient._id);
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    // Implement typing indicator logic here
  };

  const filteredPatients = (chatPatients || []).filter(patient => {
    if (searchTerm && !patient.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getUnreadCount = (patient) => {
    return (patient.unreadMessages || 0);
  };

  const isPatientOnline = (patientId) => {
    return (onlinePatients || []).some(patient => patient._id === patientId);
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Patient Communication
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Chat with your patients for follow-up consultations and support
      </Typography>

      <Grid container spacing={3}>
        {/* Patients List */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '70vh' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6">
                  Patients
                </Typography>
                <Badge badgeContent={onlinePatients.length} color="success">
                  <Chip label="Online" color="success" size="small" />
                </Badge>
              </Box>
              
              <TextField
                fullWidth
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search />
                }}
                size="small"
                sx={{ mb: 2 }}
              />

              <List sx={{ maxHeight: '50vh', overflow: 'auto' }}>
                {patientsLoading ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                  </Box>
                ) : filteredPatients.map((patient) => (
                  <ListItem
                    key={patient._id}
                    button
                    selected={selectedPatient?._id === patient._id}
                    onClick={() => handlePatientSelect(patient)}
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      '&.Mui-selected': {
                        backgroundColor: 'primary.main',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'primary.dark',
                        }
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                          isPatientOnline(patient._id) ? (
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                backgroundColor: 'success.main',
                                border: '2px solid white'
                              }}
                            />
                          ) : null
                        }
                      >
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <Person />
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body1" fontWeight="bold">
                            {patient.name}
                          </Typography>
                          {getUnreadCount(patient) > 0 && (
                            <Badge badgeContent={getUnreadCount(patient)} color="error" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {patient.studentId} - {patient.department}
                          </Typography>
                          {patient.lastMessage && (
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {patient.lastMessage}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Chat Area */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
            {selectedPatient ? (
              <>
                {/* Chat Header */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <Person />
                      </Avatar>
                      <Box>
                        <Typography variant="h6">
                          {selectedPatient.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedPatient.studentId} - {selectedPatient.department}
                        </Typography>
                      </Box>
                    </Box>
                    <Box display="flex" gap={1}>
                      <Tooltip title="Audio Call">
                        <IconButton
                          color="primary"
                          onClick={handleStartAudioCall}
                          disabled={!isPatientOnline(selectedPatient._id)}
                        >
                          <Call />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Video Call">
                        <IconButton
                          color="primary"
                          onClick={handleStartVideoCall}
                          disabled={!isPatientOnline(selectedPatient._id)}
                        >
                          <Videocam />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="More Options">
                        <IconButton>
                          <MoreVert />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Box>

                {/* Messages Area */}
                <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                  {messagesLoading ? (
                    <Box display="flex" justifyContent="center" py={4}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Box>
                      {chatMessages.map((message) => (
                        <Box
                          key={message._id}
                          sx={{
                            display: 'flex',
                            justifyContent: message.sender === user._id ? 'flex-end' : 'flex-start',
                            mb: 2
                          }}
                        >
                          <Paper
                            sx={{
                              p: 2,
                              maxWidth: '70%',
                              backgroundColor: message.sender === user._id ? 'primary.main' : 'grey.100',
                              color: message.sender === user._id ? 'white' : 'text.primary'
                            }}
                          >
                            <Typography variant="body1">
                              {message.content}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>
                              {formatMessageTime(message.timestamp)}
                            </Typography>
                          </Paper>
                        </Box>
                      ))}
                      <div ref={messagesEndRef} />
                    </Box>
                  )}
                </Box>

                {/* Message Input */}
                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Box component="form" onSubmit={handleSendMessage} display="flex" gap={1}>
                    <TextField
                      fullWidth
                      placeholder="Type a message..."
                      value={message}
                      onChange={handleTyping}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton>
                              <AttachFileIcon />
                            </IconButton>
                            <IconButton>
                              <EmojiEmotions />
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={!message.trim() || sendMessageMutation.isLoading}
                    >
                      <Send />
                    </Button>
                  </Box>
                </Box>
              </>
            ) : (
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%">
                <Chat sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Select a Patient
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose a patient from the list to start chatting
                </Typography>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* Video Call Dialog */}
      <Dialog open={openVideoCall} onClose={() => setOpenVideoCall(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <Videocam />
            </Avatar>
            <Box>
              <Typography variant="h6">
                Video Call with {selectedPatient?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Medical consultation video call
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box textAlign="center" py={4}>
            <Videocam sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Video Call in Progress
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Video call with {selectedPatient?.name} is active
            </Typography>
            <Box display="flex" gap={2} justifyContent="center">
              <Button
                variant="contained"
                color="error"
                startIcon={<VideocamOff />}
                onClick={() => setOpenVideoCall(false)}
              >
                End Call
              </Button>
              <Button
                variant="outlined"
                startIcon={<MicOff />}
              >
                Mute
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Audio Call Dialog */}
      <Dialog open={openAudioCall} onClose={() => setOpenAudioCall(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <Call />
            </Avatar>
            <Box>
              <Typography variant="h6">
                Audio Call with {selectedPatient?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Medical consultation audio call
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box textAlign="center" py={4}>
            <Call sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Audio Call in Progress
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Audio call with {selectedPatient?.name} is active
            </Typography>
            <Box display="flex" gap={2} justifyContent="center">
              <Button
                variant="contained"
                color="error"
                startIcon={<Call />}
                onClick={() => setOpenAudioCall(false)}
              >
                End Call
              </Button>
              <Button
                variant="outlined"
                startIcon={<MicOff />}
              >
                Mute
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default PatientChat;
