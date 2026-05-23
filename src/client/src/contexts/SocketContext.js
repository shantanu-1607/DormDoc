import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';
import { supabase } from '../lib/supabase';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

const wireSocketEvents = (newSocket, user) => {
  newSocket.on('appointment-booked', (data) => {
    if (user.role === 'admin') toast.info(`New appointment booked by ${data.studentName}`);
  });
  newSocket.on('emergency-sos', (data) => {
    if (user.role === 'admin') toast.error(`🚨 EMERGENCY SOS: ${data.studentName} needs immediate help!`);
  });
  newSocket.on('ambulance-assigned', (data) => {
    if (user.role === 'admin') toast.info(`Ambulance ${data.vehicleNumber} assigned to student`);
    else if (data.studentId === user._id) toast.success(`Ambulance ${data.vehicleNumber} is on the way!`);
  });
  newSocket.on('appointment-status-changed', (data) => {
    if (data.studentId === user._id) toast.info('Your appointment status has been updated');
  });
  newSocket.on('leave-request-submitted', (data) => {
    if (user.role === 'admin') toast.info('New leave request submitted');
    else if (data.studentId === user._id) toast.success('Leave request submitted successfully');
  });
  newSocket.on('leave-request-updated', (data) => {
    if (data.studentId === user._id) toast.info('Your leave request has been processed');
  });
  newSocket.on('doctor-duty-changed', (data) => {
    toast.info(`Dr. ${data.doctorName} ${data.isOnDuty ? 'started' : 'ended'} duty`);
  });
  newSocket.on('ambulance-status-changed', (data) => {
    if (user.role === 'admin') toast.info(`Ambulance ${data.vehicleNumber} status changed to ${data.status}`);
  });
  newSocket.on('qr-scan-processed', (data) => {
    if (user.role === 'admin') toast.success(`QR scan processed for ${data.studentName}`);
  });
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
        setSocket(null);
        setConnected(false);
      }
      return undefined;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5001', {
        auth: { token: data?.session?.access_token || null },
      });
      newSocket.on('connect', () => {
        setConnected(true);
      });
      newSocket.on('disconnect', () => {
        setConnected(false);
      });
      newSocket.emit('join-room', user._id);
      wireSocketEvents(newSocket, user);

      setSocket(newSocket);
      socketRef.current = newSocket;
    });

    return () => {
      cancelled = true;
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [user]);

  const emit = (event, data) => {
    if (socket && connected) socket.emit(event, data);
  };
  const on = (event, callback) => {
    if (socket) socket.on(event, callback);
  };
  const off = (event, callback) => {
    if (socket) socket.off(event, callback);
  };

  return (
    <SocketContext.Provider value={{ socket, connected, emit, on, off }}>
      {children}
    </SocketContext.Provider>
  );
};
