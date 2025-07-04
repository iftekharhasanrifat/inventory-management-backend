import express from 'express';
import {StockIn} from '../models/StockInModel.js';
import { Item } from '../models/itemModel.js';

const router = express.Router();

// get request to get all stock in items
router.get('/', async (request, response) => {
    try {
        const items = await StockIn.find({});
        return response.status(200).send({
            count : items.length,
            data : items,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/totaltaka/:startDate/:endDate', async (req, res) => {
    try {
        const { startDate, endDate } = req.params;
        
        // Parse the start and end dates from dd/mm/yyyy to Date objects
        const [sYear,sMonth , sDay] = startDate.split('-');
        const start = new Date(sYear, sMonth - 1, sDay);
        
        const [eYear, eMonth, eDay] = endDate.split('-');
        const end = new Date(eYear, eMonth - 1, eDay);
        
        // First, get all stocks .
        const stocks = await StockIn.find({ });
        let sum = 0;
        
        // Filter stocks whose date falls between the start and end dates (inclusive)
        const filteredData = stocks.filter(stock => {
            const [year, month, day] = stock.Date.split('-');
            const stockDate = new Date(year, month - 1, day);
            if (stockDate >= start && stockDate <= end) {
                sum += stock.TotalCost;
                return true;
            }
            return false;
        });
        
        return res.status(200).send({
            totalCost: sum,
            count: filteredData.length,
            data: filteredData
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ error: 'Internal Server Error' });
    }
});
router.get('/totaltaka/:item/:startDate/:endDate', async (req, res) => {
    try {
        const {item, startDate, endDate } = req.params;
        
        // Parse the start and end dates from dd/mm/yyyy to Date objects
        const [sYear,sMonth , sDay] = startDate.split('-');
        const start = new Date(sYear, sMonth - 1, sDay);
        
        const [eYear, eMonth, eDay] = endDate.split('-');
        const end = new Date(eYear, eMonth - 1, eDay);
        
        // First, get all stocks .
        const stocks = await StockIn.find({ Name: item});
        let sum = 0;
        
        // Filter stocks whose date falls between the start and end dates (inclusive)
        const filteredData = stocks.filter(stock => {
            const [year, month, day] = stock.Date.split('-');
            const stockDate = new Date(year, month - 1, day);
            if (stockDate >= start && stockDate <= end) {
                sum += stock.TotalCost;
                return true;
            }
            return false;
        });
        
        return res.status(200).send({
            totalCost: sum,
            count: filteredData.length,
            data: filteredData
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ error: 'Internal Server Error' });
    }
});

// get request to get a stock in item by id
router.get('/:id', async (request, response) => {
    try {
        const item = await StockIn.findById(request.params.id);
        if (!item) {
            return response.status(404).send({ message: 'Stock in item not found' });
        }
        return response.status(200).send(item);
    } catch (error) {
        return response.status(500).send({ message: error.message });
    }
});




// post request to add a new stock in item
router.post('/', async (request, response) => {
    try {
        const price = request.body.PricePerUnit* request.body.Quantity;
        const labourCost = request.body.LabourCostPerUnit * request.body.Quantity;
        const totalCost = price + labourCost;
        // const finalPrice = totalCost/request.body.Quantity;
        const finalPrice = parseFloat((totalCost / request.body.Quantity).toFixed(2));

        const itemId = request.body.ItemId;
        const existingItem = await Item.findById(itemId);
        if (!existingItem) {
            return response.status(404).send({ message: 'Item not found' });
        }

        // const buyingPrice = ((existingItem.BuyingPrice * existingItem.Quantity)+(finalPrice* request.body.Quantity))/(existingItem.Quantity + request.body.Quantity);
    const buyingPrice = parseFloat((
    (existingItem.BuyingPrice * existingItem.Quantity) +
    (finalPrice * request.body.Quantity)
    ) / (existingItem.Quantity + request.body.Quantity)).toFixed(2);

        const updatedItemData = {
            Quantity: existingItem.Quantity + request.body.Quantity,
            BuyingPrice: buyingPrice,
        };

        const updatedItem =  await Item.findByIdAndUpdate(itemId, updatedItemData, { new: true });

        const newItem = {
            ItemId: itemId,
            Name: request.body.Name,
            Company: request.body.Company,
            Category: request.body.Category,
            Quantity: request.body.Quantity,
            PricePerUnit: request.body.PricePerUnit,
            LabourCostPerUnit: request.body.LabourCostPerUnit,
            TotalCost: totalCost,
            FinalPrice: finalPrice,
            Date: request.body.Date,
        };

        const item = await StockIn.create(newItem);
        return response.status(201).send(item);
    } catch (error) {
        return response.status(500).send({ message: error.message });
    }
});



router.put('/:id', async (request, response) => {
  try {
    const stockInId = request.params.id;

    // Step 1: Fetch the existing stock-in entry
    const existingStockIn = await StockIn.findById(stockInId);
    if (!existingStockIn) {
      return response.status(404).send({ message: 'StockIn entry not found' });
    }

    const previousItemId = existingStockIn.ItemId; // Old item
    const newItemId = request.body.ItemId;         // New item (could be same)

    const previousQty = existingStockIn.Quantity;
    const previousFinalPrice = existingStockIn.FinalPrice;
    const previousTotalValue = previousQty * previousFinalPrice;

    const newQty = request.body.Quantity;
    const newPrice = request.body.PricePerUnit;
    const newLabour = request.body.LabourCostPerUnit;
    const newTotalCost = newQty * newPrice + newQty * newLabour;
    const newFinalPrice = parseFloat((newTotalCost / newQty).toFixed(2));

    // Step 2: Handle rod quantity if this is a transformation (e.g. fittings from rod)
    if (existingStockIn.Category.toLowerCase() === 'fittings') {
      const sourceItem = await Item.findOne({ Company: existingStockIn.Company, Category: 'rod' });

      if (!sourceItem) {
        return response.status(404).send({ message: 'Rod source item not found for transformation reversal' });
      }

      const updatedSourceItemQty = sourceItem.Quantity + previousQty - newQty;

      if (updatedSourceItemQty < 0) {
        return response.status(400).send({ message: 'Insufficient rod quantity to update transformation' });
      }

      sourceItem.Quantity = updatedSourceItemQty;
      await sourceItem.save();
    }

    // Step 3: Reverse old stock effect from previous item
    const previousItem = await Item.findById(previousItemId);
    if (!previousItem) {
      return response.status(404).send({ message: 'Previous item not found' });
    }

    const prevQty = previousItem.Quantity;
    const prevValue = previousItem.BuyingPrice * prevQty;

    const updatedPreviousQty = prevQty - previousQty;
    const updatedPreviousValue = prevValue - previousTotalValue;

    if (updatedPreviousQty < 0) {
      return response.status(400).send({ message: 'Invalid quantity after reversing old stock' });
    }

    await Item.findByIdAndUpdate(previousItemId, {
      Quantity: updatedPreviousQty,
      BuyingPrice: updatedPreviousQty > 0 ? parseFloat((updatedPreviousValue / updatedPreviousQty).toFixed(2)) : 0
    });

    // Step 4: Apply new stock to the new item
    const newItem = await Item.findById(newItemId);
    if (!newItem) {
      return response.status(404).send({ message: 'New item not found' });
    }

    const currentQty = newItem.Quantity;
    const currentValue = newItem.BuyingPrice * currentQty;

    const updatedQty = currentQty + newQty;
    const updatedValue = currentValue + (newFinalPrice * newQty);

    await Item.findByIdAndUpdate(newItemId, {
      Quantity: updatedQty,
      BuyingPrice: parseFloat((updatedValue / updatedQty).toFixed(2)),
    });

    // Step 5: Update StockIn entry
    const updatedStock = await StockIn.findByIdAndUpdate(
      stockInId,
      {
        Name: request.body.Name,
        Company: request.body.Company,
        Category: request.body.Category,
        ItemId: newItemId,
        Quantity: newQty,
        PricePerUnit: newPrice,
        LabourCostPerUnit: newLabour,
        TotalCost: newTotalCost,
        FinalPrice: newFinalPrice,
        Date: request.body.Date,
      },
      { new: true }
    );

    return response.status(200).send(updatedStock);
  } catch (error) {
    return response.status(500).send({ message: error.message });
  }
});


// post request to transform rod into new item
router.post('/transform', async (request, response) => {
    try {
        const { Name, Company, Category, Quantity, LabourCostPerUnit, Date } = request.body;
        const itemId = request.body.ItemId;


        // Find source item to deduct (Rod from same Company)
        const sourceItem = await Item.findOne({ Company, Category: 'rod' });

        if (!sourceItem) {
            return response.status(404).send({ message: 'Source item (Rod) not found for this company' });
        }

        if (sourceItem.Quantity < Quantity) {
            return response.status(400).send({ message: 'Insufficient rod quantity to create new item' });
        }

        // Deduct quantity from source item (Rod)
        sourceItem.Quantity -= Quantity;
        await sourceItem.save();
        // Compute cost
        const PricePerUnit = sourceItem.BuyingPrice;
        const materialCost = sourceItem.BuyingPrice * Quantity;
        const labourCost = LabourCostPerUnit * Quantity;
        const totalCost = materialCost + labourCost;
        const finalPrice = parseFloat((totalCost / Quantity).toFixed(2));

        // Update or Create the new item (like ksrm haru)
        let newItem = await Item.findOne({ Name });
            // If it already exists, update quantity and recalculate average price
            const totalQty = newItem.Quantity + Quantity;
            const totalValue = (newItem.BuyingPrice * newItem.Quantity) + (finalPrice * Quantity);
            newItem.BuyingPrice = parseFloat((totalValue / totalQty).toFixed(2));
            newItem.Quantity = totalQty;
            await newItem.save();
        

        // Log the stock-in
        const stockInRecord = await StockIn.create({
            ItemId: itemId,
            Name,
            Company,
            Category,
            Quantity,
            PricePerUnit,
            LabourCostPerUnit,
            TotalCost: totalCost,
            FinalPrice: finalPrice,
            Date,
        });

        return response.status(201).send(stockInRecord);

    } catch (error) {
        return response.status(500).send({ message: error.message });
    }
});




router.delete('/:id', async (request, response) => {
  try {
    const stockInId = request.params.id;

    // Step 1: Find the StockIn record to delete
    const stockInRecord = await StockIn.findById(stockInId);
    if (!stockInRecord) {
      return response.status(404).send({ message: 'StockIn record not found' });
    }

    const { ItemId, Quantity, FinalPrice, Category, Company } = stockInRecord;

    // Step 2: Find the item from the stock-in
    const item = await Item.findById(ItemId);
    if (!item) {
      return response.status(404).send({ message: 'Associated item not found' });
    }

    // Step 3: Calculate values to revert
    const stockValue = FinalPrice * Quantity;
    const updatedQty = item.Quantity - Quantity;

    if (updatedQty < 0) {
      return response.status(400).send({ message: 'Cannot delete: insufficient item quantity in stock' });
    }

    let newBuyingPrice = 0;
    if (updatedQty === 0) {
      newBuyingPrice = 0;
    } else {
      const totalValue = item.BuyingPrice * item.Quantity - stockValue;
      newBuyingPrice = parseFloat((totalValue / updatedQty).toFixed(2));
    }

    // Step 4: Update the item
    await Item.findByIdAndUpdate(ItemId, {
      Quantity: updatedQty,
      BuyingPrice: newBuyingPrice,
    });

    // Step 5: If this was a transformation, return the rod quantity
    if (Category.toLowerCase() === 'fittings') {
      const rodItem = await Item.findOne({ Company, Category: 'rod' });

      if (!rodItem) {
        return response.status(404).send({ message: 'Rod source item not found for reversal' });
      }

      rodItem.Quantity += Quantity;
      await rodItem.save();
    }

    // Step 6: Delete the stock-in record
    await StockIn.findByIdAndDelete(stockInId);

    return response.status(200).send({ message: 'StockIn record deleted and item updated successfully' });
  } catch (error) {
    return response.status(500).send({ message: error.message });
  }
});


// router.delete('/:id', async (request, response) => {
//     try {
//         const item = await StockIn.findById(request.params.id);
//         if (!item) {
//             return response.status(404).send({ message: 'Stock in item not found' });
//         }
//         await StockIn.findByIdAndDelete(request.params.id);
//         return response.status(200).send({ message: 'Stock in item deleted successfully' });
//     } catch (error) {
//         return response.status(500).send({ message: error.message });
//     }
// });

export default router;