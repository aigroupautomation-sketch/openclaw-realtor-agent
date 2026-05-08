const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());
function isoAddMinutes(d, mins){ return new Date(d.getTime() + mins*60000).toISOString(); }
app.get('/health', (req, res) => res.json({ ok: true }));
app.post('/v1/find-availability', (req, res) => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0, 0);
  const slots = [
    { start: startDate.toISOString(), end: isoAddMinutes(startDate, 30) },
    { start: isoAddMinutes(startDate, 180), end: isoAddMinutes(startDate, 210) },
    { start: isoAddMinutes(startDate, 300), end: isoAddMinutes(startDate, 330) }
  ];
  res.json({ slots });
});
app.post('/v1/book', (req, res) => {
  const { slot, lead } = req.body || {};
  if (!slot) return res.status(400).json({ error: 'slot required' });
  const bookingId = 'bk-' + Math.random().toString(36).slice(2,9);
  res.json({ bookingId, slot, status: 'confirmed', agentContact: '+1-555-555-0100' });
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Mock tool listening on ${PORT}`));
