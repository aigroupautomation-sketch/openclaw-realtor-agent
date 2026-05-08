require('dotenv').config({ path: process.env.ENV_PATH || './agents/showing-scheduler/secrets/.env' });
const adapter = require('./agents/showing-scheduler/tooling/tool-adapter');

async function run() {
  try {
    const h = await adapter.health().catch(() => null);
    if (!h) { console.error('Tool health failed'); return; }
    const avail = await adapter.findAvailability({});
    const slot = avail.slots && avail.slots[0];
    if (!slot) { console.log('No slots'); return; }
    const booking = await adapter.book(slot, { name: 'Vision Client', phone: '555-0199' });
    console.log('Booking:', booking);
  } catch (err) {
    console.error('Agent error', err.message);
  }
}
run();
