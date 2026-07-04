import twilio from 'twilio';

const sendWhatsApp = async ({ to, message }) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[WhatsApp Sandbox] To: ${to}\nMessage: ${message}`);
    return;
  }

  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      from: 'whatsapp:+14155238886',
      to: `whatsapp:${to}`,
      body: message,
    });
    console.log(`WhatsApp message sent to ${to}`);
  } catch (error) {
    console.error(`WhatsApp sending failed: ${error.message}`);
  }
};

export default sendWhatsApp;
