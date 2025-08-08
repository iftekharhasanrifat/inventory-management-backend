import express from 'express';
import {Client} from '../models/ClientModel.js';
import {ClientLedger} from '../models/ClientLedger.js';
import {StockOut} from '../models/StockoutModel.js';

const router = express.Router();

// ✅ Get all clients
router.get('/', async (req, res) => {
  try {
    const clients = await Client.find().sort({ name: 1 });
    res.status(200).json({
      count: clients.length,
      data: clients
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ Create a new client
router.post('/create', async (req, res) => {
  try {
    const { name, phone } = req.body;
    const existing = await Client.findOne({ phone });
    if (existing) return res.status(400).json({ message: 'Client already exists' });

    const client = await Client.create({ name, phone });
    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ Get client by ID
router.get('/:id', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.status(200).json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// edit client details
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, totalDue } = req.body;
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    client.name = name || client.name;
    client.phone = phone || client.phone;
    client.totalDue = totalDue !== undefined ? totalDue : client.totalDue;
    await client.save();
    res.status(200).json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ Delete a client
router.delete('/:id', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    // Delete all ledger entries for this client
    await ClientLedger.deleteMany({ clientId: client._id });
    await StockOut.deleteMany({ ClientPhone: client.phone });
    await client.deleteOne();
    res.status(200).json({ message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ Add a payment entry
router.post('/payment', async (req, res) => {
  try {
    const { ClientPhone, amount, description, date } = req.body;

    const client = await Client.findOne({ phone: ClientPhone });
    if (!client) return res.status(404).json({ message: 'Client not found' });

    client.totalDue =  client.totalDue - amount;
    await client.save();

    const ledgerEntry = await ClientLedger.create({
      clientId: client._id,
      type: 'payment',
      amount,
      description: description || 'Payment received',
      date: date || new Date()
    });

    res.status(200).json(ledgerEntry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/advance', async (req, res) => {
  try {
    const { ClientPhone, amount, description, date } = req.body;

    const client = await Client.findOne({ phone: ClientPhone });
    if (!client) return res.status(404).json({ message: 'Client not found' });

    client.totalDue =  client.totalDue - amount;
    await client.save();

    const ledgerEntry = await ClientLedger.create({
      clientId: client._id,
      type: 'advance',
      amount,
      description: description || 'advance received',
      date: date || new Date()
    });

    res.status(200).json(ledgerEntry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ Get full ledger by phone
router.get('/:phone/ledger', async (req, res) => {
  try {
    const client = await Client.findOne({ phone: req.params.phone });
    if (!client) return res.status(404).json({ message: 'Client not found' });

    const ledger = await ClientLedger.find({ clientId: client._id }).sort({ date: 1 });
    res.status(200).json({ client, ledger });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// get full ledger by client ID
router.get('/ledger/:id', async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id });
    if (!client) return res.status(404).json({ message: 'Client not found' });
    const ledger = await ClientLedger.find({ clientId: req.params.id }).sort({ date: 1 });
    if (!ledger) return res.status(404).json({ message: 'Ledger not found' });

    res.status(200).json({ client, ledger });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// get ledger by id
router.get('/ledger/entry/:id', async (req, res) => {
  try {
    const ledger = await ClientLedger.findById(req.params.id);
    if (!ledger) return res.status(404).json({ message: 'Ledger entry not found' });

    res.status(200).json(ledger);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ Edit a ledger entry
// router.put('/ledger/:id', async (req, res) => {
//   try {
//     const { amount, description, date } = req.body;
//     const ledger = await ClientLedger.findById(req.params.id);
//     if (!ledger) return res.status(404).json({ message: 'Ledger entry not found' });

//     const client = await Client.findById(ledger.clientId);
//     if (!client) return res.status(404).json({ message: 'Client not found' });

//     // Adjust due amount
//     if (ledger.type === 'payment'|| ledger.type === 'advance') {
//       client.totalDue += ledger.amount;  // rollback
//       client.totalDue -= amount;         // apply new
//       // client.totalDue = Math.max(0, client.totalDue);
//       await client.save();
//     }

//     ledger.amount = amount;
//     ledger.description = description || ledger.description;
//     ledger.date = date || ledger.date;
//     await ledger.save();

//     res.status(200).json(ledger);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });
router.put('/ledger/:id', async (req, res) => {
  try {
    const { amount, description, date } = req.body;
    const ledger = await ClientLedger.findById(req.params.id);
    if (!ledger) return res.status(404).json({ message: 'Ledger entry not found' });

    const client = await Client.findById(ledger.clientId);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    // Adjust due amount based on previous ledger type
    if (ledger.type === 'payment' || ledger.type === 'advance') {
      client.totalDue += ledger.amount;  // rollback previous
      client.totalDue -= amount;         // apply new
    } else if (ledger.type === 'sale') {
      client.totalDue -= ledger.amount;  // rollback previous
      client.totalDue += amount;         // apply new
    }

    // Ensure due doesn't go negative
    // client.totalDue = Math.max(0, client.totalDue);
    await client.save();

    // Update ledger fields
    ledger.amount = amount;
    ledger.description = description || ledger.description;
    ledger.date = date || ledger.date;
    await ledger.save();

    res.status(200).json(ledger);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ✅ Delete a ledger entry
router.delete('/ledger/:id', async (req, res) => {
  try {
    const ledger = await ClientLedger.findById(req.params.id);
    if (!ledger) return res.status(404).json({ message: 'Ledger entry not found' });

    const client = await Client.findById(ledger.clientId);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    // Adjust total due
    if (ledger.type === 'payment' || ledger.type === 'advance') {
      client.totalDue += ledger.amount;
    } else if (ledger.type === 'sale') {
      client.totalDue -= ledger.amount;
    }
    // client.totalDue = Math.max(0, client.totalDue);
    await client.save();

    await ledger.deleteOne();

    res.status(200).json({ message: 'Ledger entry deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Monthly Report for a Client
router.get('/:phone/monthly-report', async (req, res) => {
  try {
    const { phone } = req.params;
    const { year, month } = req.query;

    const client = await Client.findOne({ phone });
    if (!client) return res.status(404).json({ message: 'Client not found' });

    // Convert year/month to date range
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59); // Last day of month

    const ledger = await ClientLedger.find({
      clientId: client._id,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    const summary = {
      client: { name: client.name, phone: client.phone },
      month: `${year}-${month.toString().padStart(2, '0')}`,
      totalSales: 0,
      totalPayments: 0,
      entries: ledger,
    };

    for (let entry of ledger) {
      if (entry.type === 'sale') summary.totalSales += entry.amount;
      else if (entry.type === 'payment') summary.totalPayments += entry.amount;
    }

    summary.balance = summary.totalSales - summary.totalPayments;

    res.status(200).json(summary);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all client balances
router.get('/all/balances', async (req, res) => {
  try {
    const clients = await Client.find().select('name phone totalDue').sort({ name: 1 });
    const totalDue = clients.reduce((sum, c) => sum + c.totalDue, 0);

    res.status(200).json({
      totalClients: clients.length,
      totalDue,
      clients
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


export default router;
