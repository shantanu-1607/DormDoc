import QRCode from 'qrcode';
import axios from 'axios';

class QRService {
  // Generate QR code data for a user
  static generateUserQRData(user) {
    if (!user) return null;
    
    const qrData = {
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      studentId: user.studentId || user.rollNo,
      department: user.department,
      year: user.year,
      role: user.role,
      phone: user.phone,
      bloodGroup: user.bloodGroup,
      emergencyContact: user.emergencyContact,
      timestamp: new Date().toISOString(),
      type: 'student_id',
      version: '1.0'
    };
    
    return qrData;
  }

  // Generate QR code as data URL
  static async generateQRCodeDataURL(user, options = {}) {
    try {
      const qrData = this.generateUserQRData(user);
      if (!qrData) return null;

      const defaultOptions = {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      };

      const finalOptions = { ...defaultOptions, ...options };
      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), finalOptions);
      
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return null;
    }
  }

  // Generate QR code as canvas
  static async generateQRCodeCanvas(user, options = {}) {
    try {
      const qrData = this.generateUserQRData(user);
      if (!qrData) return null;

      const defaultOptions = {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      };

      const finalOptions = { ...defaultOptions, ...options };
      const canvas = await QRCode.toCanvas(JSON.stringify(qrData), finalOptions);
      
      return canvas;
    } catch (error) {
      console.error('Error generating QR code canvas:', error);
      return null;
    }
  }

  // Save QR code to server
  static async saveQRCodeToServer(user, qrCodeDataURL) {
    try {
      const response = await axios.post('/api/user/qr-code', {
        userId: user._id || user.id,
        qrCodeDataURL,
        qrData: this.generateUserQRData(user)
      });
      
      return response.data;
    } catch (error) {
      console.error('Error saving QR code to server:', error);
      throw error;
    }
  }

  // Get user's QR code from server
  static async getUserQRCode(userId) {
    try {
      const response = await axios.get(`/api/user/qr-code/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user QR code:', error);
      throw error;
    }
  }

  // Download QR code as image
  static downloadQRCode(qrCodeDataURL, filename) {
    if (!qrCodeDataURL) return;
    
    const link = document.createElement('a');
    link.download = filename || 'student-qr-code.png';
    link.href = qrCodeDataURL;
    link.click();
  }

  // Print QR code
  static printQRCode(user, qrCodeDataURL) {
    if (!qrCodeDataURL || !user) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${user.name} - Student QR Code</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 20px;
              margin: 0;
            }
            .qr-container { 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              gap: 20px;
              max-width: 400px;
              margin: 0 auto;
            }
            .qr-code { 
              border: 2px solid #000; 
              padding: 10px; 
              border-radius: 8px;
            }
            .user-info { 
              text-align: left; 
              max-width: 300px;
            }
            .user-info p {
              margin: 8px 0;
            }
            .header {
              background: #1976d2;
              color: white;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            @media print {
              body { margin: 0; }
              .qr-container { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="header">
              <h2>Birla Institute of Technology, Mesra</h2>
              <h3>Student ID QR Code</h3>
            </div>
            <div class="qr-code">
              <img src="${qrCodeDataURL}" alt="QR Code" style="width: 250px; height: 250px;" />
            </div>
            <div class="user-info">
              <h4>Student Information</h4>
              <p><strong>Name:</strong> ${user.name}</p>
              <p><strong>Student ID:</strong> ${user.studentId || user.rollNo}</p>
              <p><strong>Department:</strong> ${user.department}</p>
              <p><strong>Year:</strong> ${user.year}</p>
              <p><strong>Email:</strong> ${user.email}</p>
              ${user.phone ? `<p><strong>Phone:</strong> ${user.phone}</p>` : ''}
              ${user.bloodGroup ? `<p><strong>Blood Group:</strong> ${user.bloodGroup}</p>` : ''}
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  // Share QR code
  static async shareQRCode(user, qrCodeDataURL) {
    if (navigator.share && qrCodeDataURL) {
      try {
        const response = await fetch(qrCodeDataURL);
        const blob = await response.blob();
        const file = new File([blob], `${user.name}-QR-Code.png`, { type: 'image/png' });
        
        await navigator.share({
          title: `${user.name} - Student QR Code`,
          text: `QR Code for ${user.name} - Student ID: ${user.studentId || user.rollNo}`,
          files: [file]
        });
      } catch (error) {
        console.error('Error sharing QR code:', error);
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(qrCodeDataURL);
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(qrCodeDataURL);
    }
  }

  // Validate QR code data
  static validateQRCodeData(qrData) {
    try {
      const data = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
      
      const requiredFields = ['id', 'name', 'email', 'type'];
      const hasRequiredFields = requiredFields.every(field => data[field]);
      
      if (!hasRequiredFields) return false;
      if (data.type !== 'student_id') return false;
      
      return true;
    } catch (error) {
      console.error('Error validating QR code data:', error);
      return false;
    }
  }

  // Extract user data from QR code
  static extractUserDataFromQR(qrData) {
    try {
      const data = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
      
      if (!this.validateQRCodeData(data)) return null;
      
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        studentId: data.studentId,
        department: data.department,
        year: data.year,
        role: data.role,
        phone: data.phone,
        bloodGroup: data.bloodGroup,
        emergencyContact: data.emergencyContact,
        timestamp: data.timestamp
      };
    } catch (error) {
      console.error('Error extracting user data from QR code:', error);
      return null;
    }
  }
}

export default QRService;
