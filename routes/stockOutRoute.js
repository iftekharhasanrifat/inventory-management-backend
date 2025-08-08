import express from 'express';
import {StockOut} from '../models/StockoutModel.js';
import { Item } from '../models/itemModel.js';
import { Client } from '../models/ClientModel.js';
import { ClientLedger } from '../models/ClientLedger.js';

const router = express.Router();

// get request to get all stock out items
router.get('/', async (request, response) => {
    try {
        const items = await StockOut.find({});
        return response.status(200).send({
            count : items.length,
            data : items,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// get request to get a stock in item by id
router.get('/:id', async (request, response) => {
    try {
        const item = await StockOut.findById(request.params.id);
        if (!item) {
            return response.status(404).send({ message: 'Stock out item not found' });
        }
        return response.status(200).send(item);
    } catch (error) {
        return response.status(500).send({ message: error.message });
    }
});

// // post request to add a new stock out item
// router.post('/', async (request, response) => {
//     try {
//         const itemId = request.body.ItemId;
//         const item = await Item.findById(itemId);
//         console.log(item);
//         if (item.Quantity<request.body.Quantity) {
//             return response.status(400).send({ message: 'Insufficient stock' });
//         }

//         const updatedItemData = {
//             Quantity: item.Quantity - request.body.Quantity,
//         };

//         const buyingPrice = item.BuyingPrice * request.body.Quantity;
//         const sellingPrice = request.body.SellingPricePerUnit * request.body.Quantity;
//         const labourCost = request.body.LabourCostPerUnit * request.body.Quantity;
//         const hospitality = request.body.Hospitality;
//         const newItem = {
//             Name: request.body.Name,
//             Company: request.body.Company,
//             Category: request.body.Category,
//             Quantity: request.body.Quantity,   
//             BuyingPricePerUnit: item.BuyingPrice,
//             SellingPricePerUnit: request.body.SellingPricePerUnit,
//             LabourCostPerUnit: request.body.LabourCostPerUnit,
//             Hospitality: request.body.Hospitality || 0,
//             Date: request.body.Date,
//             Profit: parseFloat((sellingPrice - (buyingPrice + labourCost + hospitality)).toFixed(2)),
//             ClientName: request.body.ClientName,
//             ClientPhone: request.body.ClientPhone,
//         };

//         const stockOutItem = await StockOut.create(newItem);
//         const updatedItem = await Item.findByIdAndUpdate(
//             itemId,
//             updatedItemData,
//             { new: true }
//         );
//         return response.status(201).send(stockOutItem);
//     } catch (error) {
//         return response.status(500).send({ message: error.message });
//     }
// });
router.post('/', async (request, response) => {
  try {
    const itemId = request.body.ItemId;
    const item = await Item.findById(itemId);
    if (!item || item.Quantity < request.body.Quantity) {
      return response.status(400).send({ message: 'Insufficient stock' });
    }

    const sellingQty = request.body.Quantity;
    const buyingPrice = item.BuyingPrice * sellingQty;
    const sellingPrice = request.body.SellingPricePerUnit * sellingQty;
    const labourCost = request.body.LabourCostPerUnit * sellingQty;
    const hospitality = request.body.Hospitality || 0;
    const profit = parseFloat((sellingPrice - (buyingPrice + labourCost + hospitality)).toFixed(2));

    // Update item quantity
    item.Quantity -= sellingQty;
    await item.save();

    // Save stockOut
    const stockOut = await StockOut.create({
      Name: request.body.Name,
      Company: request.body.Company,
      Category: request.body.Category,
      Quantity: sellingQty,
      BuyingPricePerUnit: item.BuyingPrice,
      SellingPricePerUnit: request.body.SellingPricePerUnit,
      LabourCostPerUnit: request.body.LabourCostPerUnit,
      Hospitality: hospitality,
      Date: request.body.Date,
      Profit: profit,
      ClientName: request.body.ClientName,
      ClientPhone: request.body.ClientPhone,
      ItemId: itemId,
    });

    // Update client total due
    let client = await Client.findOne({ name: request.body.ClientName, phone: request.body.ClientPhone });
    if (!client) {
      client = await Client.create({
        name: request.body.ClientName,
        phone: request.body.ClientPhone,
        totalDue: 0,
      });
    }
    const amountDue = sellingPrice;
    client.totalDue += amountDue;
    await client.save();

    // Ledger entry
    await ClientLedger.create({
      clientId: client._id,
      stockOutId: stockOut._id,
      date: new Date(request.body.Date),
      type: 'sale',
      amount: amountDue,
      description: `Sold ${request.body.Name} x ${sellingQty}`,
    });

    return response.status(201).send(stockOut);
  } catch (error) {
    return response.status(500).send({ message: error.message });
  }
});
 

// put request to update a stock out item

// router.put('/:id', async (request, response) => {
//     try {
//         const stockOutId = request.params.id;
//         const updatedQuantity = request.body.Quantity;

//         // Find existing StockOut entry
//         const existingStockOut = await StockOut.findById(stockOutId);
//         if (!existingStockOut) {
//             return response.status(404).send({ message: 'StockOut item not found' });
//         }

//         // Find the corresponding item
//         const item = await Item.findOne({ Name: existingStockOut.Name });
//         if (!item) {
//             return response.status(404).send({ message: 'Item not found' });
//         }

//         // Revert previous stock out
//         item.Quantity += existingStockOut.Quantity;

//         // Check if new quantity can be deducted
//         if (item.Quantity < updatedQuantity) {
//             return response.status(400).send({ message: 'Insufficient stock for update' });
//         }

//         // Deduct the new quantity
//         item.Quantity -= updatedQuantity;

//         // Save updated item quantity
//         await item.save();

//         const buyingPrice = item.BuyingPrice * updatedQuantity;
//         const sellingPrice = request.body.SellingPricePerUnit * updatedQuantity;
//         const labourCost = request.body.LabourCostPerUnit * updatedQuantity;
//         const hospitality = request.body.Hospitality || 0;

//         const updatedStockOut = await StockOut.findByIdAndUpdate(
//             stockOutId,
//             {
//                 Quantity: updatedQuantity,
//                 SellingPricePerUnit: request.body.SellingPricePerUnit,
//                 LabourCostPerUnit: request.body.LabourCostPerUnit,
//                 Hospitality: hospitality,
//                 Date: request.body.Date,
//                 Profit: sellingPrice - (buyingPrice + labourCost + hospitality),
//                 ClientName: request.body.ClientName,
//                 ClientPhone: request.body.ClientPhone,
//             },
//             { new: true }
//         );

//         return response.status(200).send(updatedStockOut);
//     } catch (error) {
//         return response.status(500).send({ message: error.message });
//     }
// });
router.put('/:id', async (request, response) => {
  try {
    const stockOutId = request.params.id;
    const updatedQuantity = request.body.Quantity;

    const existingStockOut = await StockOut.findById(stockOutId);
    if (!existingStockOut) {
      return response.status(404).send({ message: 'StockOut item not found' });
    }

    const item = await Item.findOne({ Name: existingStockOut.Name });
    if (!item) {
      return response.status(404).send({ message: 'Item not found' });
    }

    // Revert previous quantity
    item.Quantity += existingStockOut.Quantity;

    if (item.Quantity < updatedQuantity) {
      return response.status(400).send({ message: 'Insufficient stock for update' });
    }

    // Deduct new quantity
    item.Quantity -= updatedQuantity;
    await item.save();

    const buyingPrice = item.BuyingPrice * updatedQuantity;
    const sellingPrice = request.body.SellingPricePerUnit * updatedQuantity;
    const labourCost = request.body.LabourCostPerUnit * updatedQuantity;
    const hospitality = request.body.Hospitality || 0;
    const newProfit = parseFloat((sellingPrice - (buyingPrice + labourCost + hospitality)).toFixed(2));

    // Find old client
    const oldClient = await Client.findOne({ name: existingStockOut.ClientName, phone: existingStockOut.ClientPhone });
    const oldAmountDue = existingStockOut.SellingPricePerUnit * existingStockOut.Quantity;

    if (oldClient) {
      oldClient.totalDue -= oldAmountDue;
      await oldClient.save();
    }

    // 🧹 Remove old ledger entries for this stockOut
    await ClientLedger.deleteMany({ stockOutId });

    // Find or create new client
    let newClient = await Client.findOne({ name: request.body.ClientName, phone: request.body.ClientPhone });
    if (!newClient) {
      newClient = await Client.create({
        name: request.body.ClientName,
        phone: request.body.ClientPhone,
        totalDue: 0,
      });
    }

    newClient.totalDue += sellingPrice;
    await newClient.save();

    // Add single fresh ledger entry (no duplication)
    await ClientLedger.create({
      clientId: newClient._id,
      stockOutId: stockOutId,
      date: new Date(request.body.Date),
      type: 'sale',
      amount: sellingPrice,
      description: `Updated sale of ${request.body.Name} x ${updatedQuantity}`,
    });

    // Update stock out
    const updatedStockOut = await StockOut.findByIdAndUpdate(
      stockOutId,
      {
        Quantity: updatedQuantity,
        SellingPricePerUnit: request.body.SellingPricePerUnit,
        LabourCostPerUnit: request.body.LabourCostPerUnit,
        Hospitality: hospitality,
        Date: request.body.Date,
        Profit: newProfit,
        ClientName: request.body.ClientName,
        ClientPhone: request.body.ClientPhone,
      },
      { new: true }
    );

    return response.status(200).send(updatedStockOut);
  } catch (error) {
    console.error(error);
    return response.status(500).send({ message: error.message });
  }
});


// delete request to delete a stock out item
// router.delete('/:id', async (request, response) => {
//     try {
//         const stockOutItem = await StockOut.findById(request.params.id);
//         if (!stockOutItem) {
//             return response.status(404).send({ message: 'Stock out item not found' });
//         }

//         // Find the associated item
//         const item = await Item.findOne({ Name: stockOutItem.Name });
//         if (!item) {
//             return response.status(404).send({ message: 'Associated item not found' });
//         }

//         // Restore the stock
//         const updatedQty = item.Quantity + stockOutItem.Quantity;
//         await Item.findByIdAndUpdate(item._id, { Quantity: updatedQty });

//         // Delete the stock out record
//         await StockOut.findByIdAndDelete(request.params.id);

//         return response.status(200).send({ message: 'Stock out item deleted and quantity restored' });
//     } catch (error) {
//         return response.status(500).send({ message: error.message });
//     }
// });
router.delete('/:id', async (req, res) => {
  try {
    const stockOutId = req.params.id;

    // 1. Find the StockOut entry
    const stockOut = await StockOut.findById(stockOutId);
    if (!stockOut) {
      return res.status(404).send({ message: 'StockOut not found' });
    }

    // 2. Restore the item quantity
    const item = await Item.findOne({ Name: stockOut.Name });
    if (item) {
      item.Quantity += stockOut.Quantity;
      await item.save();
    }

    // 3. Find client
    const client = await Client.findOne({ name: stockOut.ClientName, phone: stockOut.ClientPhone });
    const amountDue = stockOut.SellingPricePerUnit * stockOut.Quantity;

    if (client) {
      client.totalDue -= amountDue;
      if (client.totalDue < 0) client.totalDue = 0; // prevent negative due
      await client.save();
    }

    // 4. Delete associated client ledger entry
    await ClientLedger.deleteOne({
      stockOutId: stockOut._id,
      type: 'sale'
    });

    // 5. Delete the stockOut entry
    await StockOut.findByIdAndDelete(stockOutId);

    return res.status(200).send({ message: 'StockOut deleted successfully' });
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
});



// get stockouts to get all stock out items by date

router.get('/totalProfit/:startDate/:endDate', async (req, res) => {
    try {
        const { startDate, endDate } = req.params;
        
        // Parse the start and end dates from dd/mm/yyyy to Date objects
        const [sYear,sMonth , sDay] = startDate.split('-');
        const start = new Date(sYear, sMonth - 1, sDay);
        
        const [eYear, eMonth, eDay] = endDate.split('-');
        const end = new Date(eYear, eMonth - 1, eDay);
        
        // First, get all stocks .
        const stocks = await StockOut.find({ });
        let sum = 0;
        
        // Filter stocks whose date falls between the start and end dates (inclusive)
        const filteredData = stocks.filter(stock => {
            const [year, month, day] = stock.Date.split('-');
            const stockDate = new Date(year, month - 1, day);
            if (stockDate >= start && stockDate <= end) {
                sum += stock.Profit;
                return true;
            }
            return false;
        });
        
        return res.status(200).send({
            TotalProfit: parseFloat(sum.toFixed(2)),
            count: filteredData.length,
            data: filteredData
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ error: 'Internal Server Error' });
    }
});

// get stockouts to get all stock out items by date
router.get('/totalProfit/:item/:startDate/:endDate', async (req, res) => {
    try {
        const { item,startDate, endDate } = req.params;
        
        // Parse the start and end dates from dd/mm/yyyy to Date objects
        const [sYear,sMonth , sDay] = startDate.split('-');
        const start = new Date(sYear, sMonth - 1, sDay);
        
        const [eYear, eMonth, eDay] = endDate.split('-');
        const end = new Date(eYear, eMonth - 1, eDay);
        
        // First, get all stocks .
        const stocks = await StockOut.find({Name: item});
        let sum = 0;
        
        // Filter stocks whose date falls between the start and end dates (inclusive)
        const filteredData = stocks.filter(stock => {
            const [year, month, day] = stock.Date.split('-');
            const stockDate = new Date(year, month - 1, day);
            if (stockDate >= start && stockDate <= end) {
                sum += stock.Profit;
                return true;
            }
            return false;
        });
        
        return res.status(200).send({
            TotalProfit: parseFloat(sum.toFixed(2)),
            count: filteredData.length,
            data: filteredData
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ error: 'Internal Server Error' });
    }
});



export default router;