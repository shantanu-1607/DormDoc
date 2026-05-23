const express = require('express');
const axios = require('axios');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.1-8b-instant';

const systemPrompt = `You are the College Dispensary AI Assistant. You help students with their medical queries, dispensary information, and emergencies.
Key capabilities:
1. You can answer questions about the college dispensary.
2. You can help users understand if they need an ambulance based on their symptoms.
3. If a user clearly needs an ambulance and provides their location (e.g., "I'm at Hostel 1, I have severe chest pain"), you MUST use the book_ambulance function to book it for them. If they don't provide a location, ask for it first before booking.
4. You can provide previous leave details or prescription info if asked (for now, tell them you are checking their records).

Be concise, empathetic, and professional.`;

const tools = [
  {
    type: 'function',
    function: {
      name: 'book_ambulance',
      description:
        'Book an emergency ambulance for the student. Use this ONLY when the student explicitly needs an ambulance and has provided a pickup location.',
      parameters: {
        type: 'object',
        properties: {
          symptoms: { type: 'string', description: 'The medical symptoms or reason for the ambulance' },
          pickupAddress: {
            type: 'string',
            description: "The student's current location (e.g., Hostel 1, Block B)",
          },
          isEmergency: { type: 'boolean', description: 'True if it is a life-threatening emergency' },
        },
        required: ['symptoms', 'pickupAddress', 'isEmergency'],
      },
    },
  },
];

async function pickAvailableAmbulance(sb) {
  const { data } = await sb
    .from('ambulances')
    .select('id, vehicle_number, driver_name, driver_phone')
    .eq('status', 'available')
    .eq('is_active', true)
    .order('average_response_time', { ascending: true })
    .limit(1);
  return data?.[0] || null;
}

async function bookAmbulanceTrip(sb, { student, args }) {
  const ambulance = await pickAvailableAmbulance(sb);
  if (!ambulance) return { booked: false };

  const { data: trip, error: tripErr } = await sb
    .from('ambulance_trips')
    .insert({
      patient_name: student.name || 'Student',
      patient_phone: student.phone || '',
      student_id: student.id,
      pickup_location: args.pickupAddress,
      destination: 'College Dispensary',
      emergency_type: 'medical',
      priority: args.isEmergency ? 'high' : 'medium',
      ambulance_id: ambulance.id,
      status: 'dispatched',
      notes: args.symptoms || '',
      created_by: student.id,
    })
    .select()
    .single();

  if (tripErr) {
    console.error('ambulance_trips insert failed:', tripErr);
    return { booked: false };
  }

  const { error: ambulanceErr } = await sb
    .from('ambulances')
    .update({ status: 'in_use' })
    .eq('id', ambulance.id);
  if (ambulanceErr) console.error('ambulance status update failed:', ambulanceErr);

  return { booked: true, ambulance, trip };
}

router.post('/', async (req, res) => {
  try {
    if (!GROQ_API_KEY) {
      return res.status(503).json({ reply: 'AI assistant is not configured. Please contact admin.' });
    }

    const sb = req.sb;
    const { messages } = req.body;
    const student = req.user;

    const apiMessages = [{ role: 'system', content: systemPrompt }, ...messages];

    const response = await axios.post(
      GROQ_URL,
      { model: GROQ_MODEL, messages: apiMessages, tools, tool_choice: 'auto' },
      { headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' } }
    );

    const responseMessage = response.data.choices[0].message;

    if (responseMessage.tool_calls) {
      const toolCall = responseMessage.tool_calls[0];

      if (toolCall.function.name === 'book_ambulance') {
        const args = JSON.parse(toolCall.function.arguments);
        const booking = await bookAmbulanceTrip(sb, { student, args });

        if (!booking.booked) {
          return res.json({
            reply:
              "I'm sorry, but there are no ambulances available right now. Please seek alternative transport immediately or call the emergency hotline directly.",
          });
        }

        apiMessages.push(responseMessage);
        apiMessages.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: 'book_ambulance',
          content: JSON.stringify({
            success: true,
            message: `Ambulance ${booking.ambulance.vehicle_number} has been dispatched. Driver: ${booking.ambulance.driver_name} (${booking.ambulance.driver_phone}).`,
          }),
        });

        const finalResponse = await axios.post(
          GROQ_URL,
          { model: GROQ_MODEL, messages: apiMessages },
          { headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' } }
        );

        return res.json({
          reply: finalResponse.data.choices[0].message.content,
          actionTriggered: 'ambulance_booked',
          ambulanceDetails: {
            vehicleNumber: booking.ambulance.vehicle_number,
            driverName: booking.ambulance.driver_name,
            tripId: booking.trip.id,
          },
        });
      }
    }

    res.json({ reply: responseMessage.content });
  } catch (error) {
    console.error('Chat error:', error.response?.data || error.message);
    res.status(500).json({
      reply: "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later.",
      debug: error.response?.data || error.message,
    });
  }
});

module.exports = router;
