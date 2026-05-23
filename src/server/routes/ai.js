const express = require('express');
const { body, validationResult } = require('express-validator');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes (optional for chatbot)
router.use(optionalAuth);

// @route   POST /api/ai/analyze-symptoms
// @desc    Analyze symptoms and assign priority using AI
// @access  Private
router.post('/analyze-symptoms', [
  body('symptoms').notEmpty().withMessage('Symptoms description is required'),
  body('additionalInfo').optional().isString().withMessage('Additional info must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { symptoms, additionalInfo = '' } = req.body;

    // Enhanced AI-powered symptom analysis
    const analysisResult = await analyzeSymptomsWithAI(symptoms, additionalInfo);

    res.json({
      priority: analysisResult.priority,
      urgency: analysisResult.urgency,
      recommendedAction: analysisResult.recommendedAction,
      estimatedWaitTime: analysisResult.estimatedWaitTime,
      riskFactors: analysisResult.riskFactors,
      suggestedMedications: analysisResult.suggestedMedications
    });
  } catch (error) {
    console.error('Symptom analysis error:', error);
    res.status(500).json({ message: 'Server error analyzing symptoms' });
  }
});

// @route   POST /api/ai/chatbot
// @desc    AI-powered symptom chatbot
// @access  Public (with optional authentication)
router.post('/chatbot', [
  body('message').notEmpty().withMessage('Message is required'),
  body('conversationHistory').optional().isArray().withMessage('Conversation history must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { message, conversationHistory = [] } = req.body;
    const userId = req.user ? req.user.id : null;

    // Get AI response from chatbot
    const chatbotResponse = await getChatbotResponse(message, conversationHistory, userId);

    res.json({
      response: chatbotResponse.response,
      suggestedActions: chatbotResponse.suggestedActions,
      emergencyAlert: chatbotResponse.emergencyAlert,
      followUpQuestions: chatbotResponse.followUpQuestions,
      confidence: chatbotResponse.confidence
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ message: 'Server error processing chatbot request' });
  }
});

// @route   POST /api/ai/predict-wait-time
// @desc    Predict wait time using AI
// @access  Private
router.post('/predict-wait-time', [
  body('doctorId').isUUID().withMessage('Valid doctor ID is required'),
  body('appointmentTime').notEmpty().withMessage('Appointment time is required'),
  body('priority').isNumeric().withMessage('Priority must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { doctorId, appointmentTime, priority } = req.body;

    const prediction = await predictWaitTime(doctorId, appointmentTime, priority);

    res.json({
      estimatedWaitTime: prediction.estimatedWaitTime,
      confidence: prediction.confidence,
      factors: prediction.factors,
      recommendations: prediction.recommendations
    });
  } catch (error) {
    console.error('Wait time prediction error:', error);
    res.status(500).json({ message: 'Server error predicting wait time' });
  }
});

// @route   POST /api/ai/optimize-schedule
// @desc    Optimize doctor schedule using AI
// @access  Private
router.post('/optimize-schedule', [
  body('doctorId').isUUID().withMessage('Valid doctor ID is required'),
  body('date').isISO8601().withMessage('Valid date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { doctorId, date } = req.body;

    const optimization = await optimizeDoctorSchedule(doctorId, date);

    res.json({
      optimizedSlots: optimization.optimizedSlots,
      efficiency: optimization.efficiency,
      recommendations: optimization.recommendations
    });
  } catch (error) {
    console.error('Schedule optimization error:', error);
    res.status(500).json({ message: 'Server error optimizing schedule' });
  }
});

// @route   POST /api/ai/emergency-detection
// @desc    Detect emergency situations using AI
// @access  Private
router.post('/emergency-detection', [
  body('symptoms').notEmpty().withMessage('Symptoms description is required'),
  body('vitalSigns').optional().isObject().withMessage('Vital signs must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { symptoms, vitalSigns = {} } = req.body;

    const emergencyAnalysis = await detectEmergency(symptoms, vitalSigns);

    res.json({
      isEmergency: emergencyAnalysis.isEmergency,
      emergencyLevel: emergencyAnalysis.emergencyLevel,
      immediateActions: emergencyAnalysis.immediateActions,
      alertRequired: emergencyAnalysis.alertRequired,
      confidence: emergencyAnalysis.confidence
    });
  } catch (error) {
    console.error('Emergency detection error:', error);
    res.status(500).json({ message: 'Server error detecting emergency' });
  }
});

// AI Helper Functions

async function analyzeSymptomsWithAI(symptoms, additionalInfo) {
  try {
    // This would integrate with Google's Gemini API or OpenAI
    const prompt = `
    Analyze the following medical symptoms and provide a priority assessment:
    
    Symptoms: ${symptoms}
    Additional Info: ${additionalInfo}
    
    Please provide:
    1. Priority level (1-10, where 10 is highest)
    2. Urgency level (low, medium, high, critical)
    3. Recommended immediate action
    4. Estimated wait time in minutes
    5. Risk factors identified
    6. Suggested over-the-counter medications (if any)
    
    Respond in JSON format.
    `;

    // For now, we'll use a simplified analysis
    // In production, this would call the actual AI API
    const analysis = await performBasicSymptomAnalysis(symptoms, additionalInfo);
    
    return analysis;
  } catch (error) {
    console.error('AI symptom analysis error:', error);
    // Fallback to basic analysis
    return performBasicSymptomAnalysis(symptoms, additionalInfo);
  }
}

async function performBasicSymptomAnalysis(symptoms, additionalInfo) {
  const symptomsLower = symptoms.toLowerCase();
  
  // Emergency keywords
  const emergencyKeywords = [
    'unconscious', 'bleeding heavily', 'chest pain', 'difficulty breathing',
    'severe headache', 'stroke', 'heart attack', 'seizure', 'allergic reaction'
  ];
  
  // High priority keywords
  const highPriorityKeywords = [
    'severe pain', 'high fever', 'vomiting', 'dizziness', 'fainting',
    'abdominal pain', 'back pain', 'nausea', 'diarrhea'
  ];
  
  // Medium priority keywords
  const mediumPriorityKeywords = [
    'mild pain', 'cough', 'cold', 'sore throat', 'headache',
    'fatigue', 'mild fever', 'rash'
  ];

  let priority = 5;
  let urgency = 'medium';
  let recommendedAction = 'Schedule an appointment with a doctor';
  let estimatedWaitTime = 30;
  let riskFactors = [];
  let suggestedMedications = [];

  // Check for emergency conditions
  if (emergencyKeywords.some(keyword => symptomsLower.includes(keyword))) {
    priority = 10;
    urgency = 'critical';
    recommendedAction = 'Seek immediate emergency medical attention';
    estimatedWaitTime = 0;
    riskFactors.push('Life-threatening condition suspected');
  }
  // Check for high priority conditions
  else if (highPriorityKeywords.some(keyword => symptomsLower.includes(keyword))) {
    priority = 8;
    urgency = 'high';
    recommendedAction = 'Book urgent appointment or visit emergency room';
    estimatedWaitTime = 15;
    riskFactors.push('Severe symptoms requiring prompt attention');
  }
  // Check for medium priority conditions
  else if (mediumPriorityKeywords.some(keyword => symptomsLower.includes(keyword))) {
    priority = 6;
    urgency = 'medium';
    recommendedAction = 'Schedule appointment within 24-48 hours';
    estimatedWaitTime = 45;
  }
  // Low priority
  else {
    priority = 3;
    urgency = 'low';
    recommendedAction = 'Schedule routine appointment';
    estimatedWaitTime = 60;
  }

  // Add specific risk factors based on symptoms
  if (symptomsLower.includes('fever') && symptomsLower.includes('high')) {
    riskFactors.push('High fever may indicate infection');
  }
  if (symptomsLower.includes('chest') && symptomsLower.includes('pain')) {
    riskFactors.push('Chest pain may indicate cardiac issues');
  }
  if (symptomsLower.includes('breathing') && symptomsLower.includes('difficulty')) {
    riskFactors.push('Respiratory distress requires immediate attention');
  }

  // Suggest medications based on symptoms
  if (symptomsLower.includes('headache') || symptomsLower.includes('pain')) {
    suggestedMedications.push('Acetaminophen or Ibuprofen (if no allergies)');
  }
  if (symptomsLower.includes('fever')) {
    suggestedMedications.push('Acetaminophen for fever reduction');
  }
  if (symptomsLower.includes('nausea')) {
    suggestedMedications.push('Ginger tea or anti-nausea medication');
  }

  return {
    priority,
    urgency,
    recommendedAction,
    estimatedWaitTime,
    riskFactors,
    suggestedMedications
  };
}

async function getChatbotResponse(message, conversationHistory, userId) {
  try {
    // This would integrate with Google's Gemini API or OpenAI
    const prompt = `
    You are a medical assistant chatbot for a college dispensary. 
    Provide helpful, accurate, and safe medical advice while always recommending 
    professional medical consultation for serious concerns.
    
    User message: ${message}
    Conversation history: ${JSON.stringify(conversationHistory)}
    
    Provide:
    1. Helpful response
    2. Suggested immediate actions
    3. Whether emergency alert is needed
    4. Follow-up questions
    5. Confidence level (0-1)
    `;

    // For now, we'll use a rule-based chatbot
    // In production, this would call the actual AI API
    const response = await generateChatbotResponse(message, conversationHistory);
    
    return response;
  } catch (error) {
    console.error('Chatbot response error:', error);
    return {
      response: "I'm sorry, I'm having trouble processing your request. Please contact the dispensary directly for immediate assistance.",
      suggestedActions: ["Contact dispensary at emergency number"],
      emergencyAlert: false,
      followUpQuestions: [],
      confidence: 0.1
    };
  }
}

async function generateChatbotResponse(message, conversationHistory) {
  const messageLower = message.toLowerCase();
  
  // Emergency detection
  if (messageLower.includes('emergency') || messageLower.includes('urgent') || 
      messageLower.includes('help') || messageLower.includes('pain')) {
    return {
      response: "I understand you're experiencing concerning symptoms. For immediate assistance, please call the emergency number or visit the dispensary right away.",
      suggestedActions: [
        "Call emergency number immediately",
        "Visit dispensary emergency section",
        "Ask someone to accompany you"
      ],
      emergencyAlert: true,
      followUpQuestions: [
        "Are you experiencing severe pain?",
        "Do you have difficulty breathing?",
        "Are you feeling dizzy or faint?"
      ],
      confidence: 0.9
    };
  }
  
  // Common symptoms
  if (messageLower.includes('fever') || messageLower.includes('temperature')) {
    return {
      response: "Fever can indicate various conditions. Monitor your temperature and stay hydrated. If fever is high (>101°F) or persistent, see a doctor.",
      suggestedActions: [
        "Take temperature regularly",
        "Stay hydrated",
        "Rest and monitor symptoms",
        "Schedule appointment if fever persists"
      ],
      emergencyAlert: false,
      followUpQuestions: [
        "What is your current temperature?",
        "How long have you had the fever?",
        "Are you experiencing other symptoms?"
      ],
      confidence: 0.8
    };
  }
  
  if (messageLower.includes('headache')) {
    return {
      response: "Headaches can have various causes. Rest in a quiet, dark room and stay hydrated. If headache is severe or sudden, seek medical attention.",
      suggestedActions: [
        "Rest in a quiet environment",
        "Apply cold compress to forehead",
        "Stay hydrated",
        "Avoid bright lights and loud noises"
      ],
      emergencyAlert: false,
      followUpQuestions: [
        "How severe is the headache (1-10)?",
        "Is this a sudden, severe headache?",
        "Do you have any vision changes?"
      ],
      confidence: 0.7
    };
  }
  
  // General response
  return {
    response: "I understand you're not feeling well. It's important to monitor your symptoms and seek professional medical advice. Would you like to schedule an appointment with our dispensary?",
    suggestedActions: [
      "Schedule an appointment",
      "Visit dispensary for consultation",
      "Monitor symptoms and seek help if they worsen"
    ],
    emergencyAlert: false,
    followUpQuestions: [
      "What specific symptoms are you experiencing?",
      "How long have you had these symptoms?",
      "Have you taken any medications recently?"
    ],
    confidence: 0.6
  };
}

async function predictWaitTime(doctorId, appointmentTime, priority) {
  try {
    // This would use machine learning models trained on historical data
    // For now, we'll use a simplified prediction algorithm
    
    const baseWaitTime = 30; // Base wait time in minutes
    const priorityMultiplier = (11 - priority) / 10; // Higher priority = shorter wait
    const timeOfDayMultiplier = getTimeOfDayMultiplier(appointmentTime);
    
    const estimatedWaitTime = Math.round(baseWaitTime * priorityMultiplier * timeOfDayMultiplier);
    
    return {
      estimatedWaitTime,
      confidence: 0.7,
      factors: [
        `Priority level: ${priority}`,
        `Time of day: ${appointmentTime}`,
        'Current queue length',
        'Doctor availability'
      ],
      recommendations: [
        'Arrive 10 minutes early',
        'Bring necessary documents',
        'Update contact information'
      ]
    };
  } catch (error) {
    console.error('Wait time prediction error:', error);
    return {
      estimatedWaitTime: 30,
      confidence: 0.3,
      factors: ['Basic estimation'],
      recommendations: ['Contact dispensary for accurate timing']
    };
  }
}

function getTimeOfDayMultiplier(appointmentTime) {
  const hour = parseInt(appointmentTime.split(':')[0]);
  
  if (hour >= 9 && hour <= 11) return 1.2; // Morning rush
  if (hour >= 14 && hour <= 16) return 1.1; // Afternoon
  if (hour >= 17 && hour <= 19) return 0.9; // Evening
  return 1.0; // Default
}

async function optimizeDoctorSchedule(doctorId, date) {
  try {
    // This would use optimization algorithms
    // For now, we'll provide basic recommendations
    
    return {
      optimizedSlots: [
        { time: '09:00', duration: 30, type: 'consultation' },
        { time: '09:30', duration: 30, type: 'consultation' },
        { time: '10:00', duration: 15, type: 'break' },
        { time: '10:15', duration: 30, type: 'consultation' }
      ],
      efficiency: 0.85,
      recommendations: [
        'Schedule breaks every 2 hours',
        'Allocate buffer time between appointments',
        'Group similar cases together'
      ]
    };
  } catch (error) {
    console.error('Schedule optimization error:', error);
    return {
      optimizedSlots: [],
      efficiency: 0.5,
      recommendations: ['Unable to optimize schedule at this time']
    };
  }
}

async function detectEmergency(symptoms, vitalSigns) {
  try {
    const symptomsLower = symptoms.toLowerCase();
    
    // Critical emergency indicators
    const criticalIndicators = [
      'unconscious', 'not breathing', 'severe bleeding', 'chest pain',
      'stroke symptoms', 'severe allergic reaction', 'overdose'
    ];
    
    // High priority indicators
    const highPriorityIndicators = [
      'severe pain', 'high fever', 'difficulty breathing', 'severe headache',
      'abdominal pain', 'dizziness', 'fainting'
    ];
    
    let isEmergency = false;
    let emergencyLevel = 'low';
    let immediateActions = [];
    let alertRequired = false;
    let confidence = 0.5;
    
    if (criticalIndicators.some(indicator => symptomsLower.includes(indicator))) {
      isEmergency = true;
      emergencyLevel = 'critical';
      immediateActions = [
        'Call emergency services immediately',
        'Do not move the patient',
        'Check for breathing and pulse',
        'Stay with the patient until help arrives'
      ];
      alertRequired = true;
      confidence = 0.9;
    } else if (highPriorityIndicators.some(indicator => symptomsLower.includes(indicator))) {
      isEmergency = true;
      emergencyLevel = 'high';
      immediateActions = [
        'Seek immediate medical attention',
        'Do not delay treatment',
        'Contact emergency services if symptoms worsen'
      ];
      alertRequired = true;
      confidence = 0.8;
    }
    
    // Check vital signs for additional indicators
    if (vitalSigns.heartRate && (vitalSigns.heartRate > 120 || vitalSigns.heartRate < 50)) {
      isEmergency = true;
      emergencyLevel = 'high';
      immediateActions.push('Monitor vital signs closely');
    }
    
    if (vitalSigns.bloodPressure && vitalSigns.bloodPressure.systolic > 180) {
      isEmergency = true;
      emergencyLevel = 'high';
      immediateActions.push('Monitor blood pressure closely');
    }
    
    return {
      isEmergency,
      emergencyLevel,
      immediateActions,
      alertRequired,
      confidence
    };
  } catch (error) {
    console.error('Emergency detection error:', error);
    return {
      isEmergency: false,
      emergencyLevel: 'low',
      immediateActions: ['Seek professional medical advice'],
      alertRequired: false,
      confidence: 0.3
    };
  }
}

module.exports = router;
