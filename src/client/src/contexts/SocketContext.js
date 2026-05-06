import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
        auth: {
          token: localStorage.getItem('token')
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setConnected(false);
      });

      // Join user-specific room
      newSocket.emit('join-room', user._id);

      // Listen for real-time updates
      newSocket.on('appointment-booked', (data) => {
        if (user.role === 'admin') {
          toast.info(`New appointment booked by ${data.studentName}`);
        }
      });

      newSocket.on('emergency-sos', (data) => {
        if (user.role === 'admin') {
          toast.error(`🚨 EMERGENCY SOS: ${data.studentName} needs immediate help!`);
        }
      });

      newSocket.on('ambulance-assigned', (data) => {
        if (user.role === 'admin') {
          toast.info(`Ambulance ${data.vehicleNumber} assigned to student`);
        } else if (data.studentId === user._id) {
          toast.success(`Ambulance ${data.vehicleNumber} is on the way!`);
        }
      });

      newSocket.on('appointment-status-changed', (data) => {
        if (data.studentId === user._id) {
          toast.info('Your appointment status has been updated');
        }
      });

      newSocket.on('leave-request-submitted', (data) => {
        if (user.role === 'admin') {
          toast.info('New leave request submitted');
        } else if (data.studentId === user._id) {
          toast.success('Leave request submitted successfully');
        }
      });

      newSocket.on('leave-request-updated', (data) => {
        if (data.studentId === user._id) {
          toast.info('Your leave request has been processed');
        }
      });

      newSocket.on('doctor-duty-changed', (data) => {
        toast.info(`Dr. ${data.doctorName} ${data.isOnDuty ? 'started' : 'ended'} duty`);
      });

      newSocket.on('ambulance-status-changed', (data) => {
        if (user.role === 'admin') {
          toast.info(`Ambulance ${data.vehicleNumber} status changed to ${data.status}`);
        }
      });

      newSocket.on('qr-scan-processed', (data) => {
        if (user.role === 'admin') {
          toast.success(`QR scan processed for ${data.studentName}`);
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
        setConnected(false);
      }
    }
  }, [user]);

  const emit = (event, data) => {
    if (socket && connected) {
      socket.emit(event, data);
    }
  };

  const on = (event, callback) => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  const off = (event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  const value = {
    socket,
    connected,
    emit,
    on,
    off,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
