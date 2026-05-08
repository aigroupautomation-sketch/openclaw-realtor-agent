const fetch = require('node-fetch');
const dotenv = require('dotenv');
const fs = require('fs');

async function runTest() {
  const envPath = process.env.ENV_PATH || './agents/showing-scheduler/secrets/.env';
  if (fs.existsSync(envPath)) dotenv.config({ path: envPath });

  const url = process.env.TOOL_MCP_URL || 'http://localhost:5000';
  console.log(`\n--- [Adapter] Talking to Mock Tool at ${url} ---`);

  try {
    // 1. Get Availability
    const availRes = await fetch(`${url}/v1/find-availability`, { method: 'POST' });
    const avail = await availRes.json();
    console.log(`\n[Tool Output] Found ${avail.slots.length} available slots.`);
    
    // 2. Pick the first slot and Book it
    const targetSlot = avail.slots[0];
    console.log(`[Action] Attempting to book first slot: ${targetSlot.start}`);

    const bookRes = await fetch(`${url}/v1/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slot: targetSlot,
        lead: { name: "Vision Lead", phone: "555-0199" }
      })
    });
    const booking = await bookRes.json();
    console.log(`\n[Success] Booking ID: ${booking.bookingId}`);
    console.log(`[Status] ${booking.status.toUpperCase()}`);
    console.log(`[Contact] Agent will meet you at: ${booking.agentContact}`);

  } catch (err) {
    console.error('Error connecting to tool:', err.message);
  }
}

runTest();
