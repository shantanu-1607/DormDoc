import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Avatar,
  Chip,
  Grid,
  Paper,
} from '@mui/material';
import {
  QrCode,
  Download,
  Print,
  Share,
  Person,
  School,
  Email,
  Phone,
  Badge,
} from '@mui/icons-material';
import QRCode from 'qrcode';
import { useState, useEffect } from 'react';

const UserQRCode = ({ user, size = 200, showDetails = false }) => {
  const [qrCodeDataURL, setQrCodeDataURL] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [qrCodeCanvas, setQrCodeCanvas] = useState(null);

  // Generate QR code data
  const generateQRData = (user) => {
    if (!user) return '';
    
    const qrData = {
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      studentId: user.studentId,
      rollNo: user.rollNo,
      department: user.department,
      year: user.year,
      role: user.role,
      timestamp: new Date().toISOString(),
      type: 'student_id'
    };
    
    return JSON.stringify(qrData);
  };

  // Generate QR code
  useEffect(() => {
    const generateQR = async () => {
      if (!user) return;
      
      try {
        const qrData = generateQRData(user);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Generate QR code
        const qrCodeDataURL = await QRCode.toDataURL(qrData, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M'
        });
        
        setQrCodeDataURL(qrCodeDataURL);
        setQrCodeCanvas(canvas);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    generateQR();
  }, [user, size]);

  const handleDownload = () => {
    if (qrCodeDataURL) {
      const link = document.createElement('a');
      link.download = `${user.name}-QR-Code.png`;
      link.href = qrCodeDataURL;
      link.click();
    }
  };

  const handlePrint = () => {
    if (qrCodeDataURL) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>${user.name} - QR Code</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 20px;
              }
              .qr-container { 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                gap: 20px;
              }
              .qr-code { 
                border: 2px solid #000; 
                padding: 10px; 
              }
              .user-info { 
                text-align: left; 
                max-width: 300px;
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <h2>${user.name} - Student ID QR Code</h2>
              <div class="qr-code">
                <img src="${qrCodeDataURL}" alt="QR Code" />
              </div>
              <div class="user-info">
                <p><strong>Name:</strong> ${user.name}</p>
                <p><strong>Student ID:</strong> ${user.studentId || user.rollNo}</p>
                <p><strong>Department:</strong> ${user.department}</p>
                <p><strong>Year:</strong> ${user.year}</p>
                <p><strong>Email:</strong> ${user.email}</p>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleShare = async () => {
    if (navigator.share && qrCodeDataURL) {
      try {
        const response = await fetch(qrCodeDataURL);
        const blob = await response.blob();
        const file = new File([blob], `${user.name}-QR-Code.png`, { type: 'image/png' });
        
        await navigator.share({
          title: `${user.name} - Student QR Code`,
          text: `QR Code for ${user.name}`,
          files: [file]
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(qrCodeDataURL);
    }
  };

  if (!user) return null;

  return (
    <>
      <Card sx={{ maxWidth: 300, mx: 'auto' }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
              <Person />
            </Avatar>
            <Typography variant="h6" fontWeight="bold">
              {user.name}
            </Typography>
          </Box>
          
          {qrCodeDataURL && (
            <Box mb={2}>
              <img 
                src={qrCodeDataURL} 
                alt="QR Code" 
                style={{ 
                  width: size, 
                  height: size, 
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px'
                }} 
              />
            </Box>
          )}
          
          <Typography variant="body2" color="text.secondary" mb={2}>
            Student ID: {user.studentId || user.rollNo}
          </Typography>
          
          <Box display="flex" gap={1} justifyContent="center">
            <Tooltip title="View Details">
              <IconButton 
                size="small" 
                color="primary"
                onClick={() => setOpenDialog(true)}
              >
                <QrCode />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download">
              <IconButton 
                size="small" 
                color="secondary"
                onClick={handleDownload}
              >
                <Download />
              </IconButton>
            </Tooltip>
            <Tooltip title="Print">
              <IconButton 
                size="small" 
                color="info"
                onClick={handlePrint}
              >
                <Print />
              </IconButton>
            </Tooltip>
            <Tooltip title="Share">
              <IconButton 
                size="small" 
                color="success"
                onClick={handleShare}
              >
                <Share />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>

      {/* QR Code Details Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <QrCode />
            </Avatar>
            <Box>
              <Typography variant="h6">Student QR Code Details</Typography>
              <Typography variant="body2" color="text.secondary">
                Complete information and QR code for {user.name}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  QR Code
                </Typography>
                {qrCodeDataURL && (
                  <img 
                    src={qrCodeDataURL} 
                    alt="QR Code" 
                    style={{ 
                      width: 250, 
                      height: 250, 
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px'
                    }} 
                  />
                )}
                <Typography variant="body2" color="text.secondary" mt={2}>
                  Scan this QR code to access student information
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Student Information
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Person color="primary" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Name
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {user.name}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box display="flex" alignItems="center" gap={2}>
                    <Badge color="primary" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Student ID
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {user.studentId || user.rollNo}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box display="flex" alignItems="center" gap={2}>
                    <Email color="primary" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {user.email}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box display="flex" alignItems="center" gap={2}>
                    <Phone color="primary" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {user.phone || 'Not provided'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box display="flex" alignItems="center" gap={2}>
                    <School color="primary" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Department
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {user.department}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box display="flex" alignItems="center" gap={2}>
                    <School color="primary" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Year
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {user.year}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box display="flex" alignItems="center" gap={2}>
                    <Chip 
                      label={user.role} 
                      color="primary" 
                      size="small"
                    />
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
          <Button 
            variant="contained" 
            startIcon={<Download />}
            onClick={handleDownload}
          >
            Download QR Code
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UserQRCode;
