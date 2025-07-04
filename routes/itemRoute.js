import express from 'express';
import {Item} from '../models/itemModel.js';


const router = express.Router();

// get request to get all items

router.get('/', async (request, response) => {
    try {
        const items = await Item.find({});
        return response.status(200).send({
            count : items.length,
            data : items,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// get request to get a item by id
router.get('/:id', async (request, response) => {
    try {
        const item = await Item.findById(request.params.id);
        if (!item) {
            return response.status(404).send({ message: 'Item not found' });
        }
        return response.status(200).send(item);
    } catch (error) {
        return response.status(500).send({ message: error.message });
    }
});

// post request to add a new item
router.post('/', async (request, response) => {
    try {
        const itemName = request.body.Name?.trim(); // trim the name

        if (!itemName) {
            return response.status(400).send({ message: 'Please enter a valid item name' });
        }

        const isExist = await Item.findOne({ Name: itemName });
        if (isExist) {
            return response.status(400).send({ message: 'Item name already exists' });
        }

        const newItem = {
            Name: itemName,
            Company: request.body.Company,
            Category: request.body.Category,
            Quantity: 0,
            BuyingPrice: 0,
        };

        const item = await Item.create(newItem);
        return response.status(201).send(item);
    } catch (error) {
        return response.status(500).send({ message: error.message });
    }
});


// put request to update a Item
router.put('/:id', async (request, response) => {
    try {
        const itemName = request.body.Name?.trim();
        const item = await Item.findById(request.params.id);
        if (!item) {
            return response.status(404).send({ message: 'Item not found' });
        }

        if (!itemName) {
            return response.status(400).send({ message: 'Please enter a valid Item name' });
        }
        
        const isExist = await Item.findOne({ Name: itemName, _id: { $ne: request.params.id } });

        if (isExist) {
            return response.status(400).send({ message: 'Item name already exists' });
        }

        const updatedItemData = {
            Name: itemName,
            Company: request.body.Company,
            Category: request.body.Category,
            Quantity: item.Quantity,
            BuyingPrice: item.BuyingPrice,
        };
        
        const updatedItem = await Item.findByIdAndUpdate(
            request.params.id,
            updatedItemData,
            { new: true }
        );
        return response.status(200).send({message: 'Item updated successfully', data: updatedItem});
    } catch (error) {
        return response.status(500).send({ message: error.message });
    }
});

// patch request to stockin quantity and buying price of a Item
router.patch('/stockin/:id', async (request, response) => {
    try {
        const item = await Item.findById(request.params.id);
        if (!item) {
            return response.status(404).send({ message: 'Item not found' });
        }
        const quantity = request.body.Quantity;
        const buyingPrice = request.body.BuyingPrice;
        const newQuantity = item.Quantity + quantity;
        if (quantity < 0) {
            return response.status(400).send({ message: 'Quantity cannot be negative' });
        }
        if (buyingPrice < 0) {
            return response.status(400).send({ message: 'Buying price cannot be negative' });
        }
        if(buyingPrice===0){
            return response.status(400).send({ message: 'Buying price is required' });
        }
        if (newQuantity < 0) {
            return response.status(400).send({ message: 'Quantity cannot be negative' });
        }
        const updatedItemData = {
            Quantity: newQuantity,
            BuyingPrice: buyingPrice,
        };

        
        if(quantity>0){
            updatedItemData.Quantity = newQuantity;
        }
        else{
            updatedItemData.Quantity = item.Quantity;
        }
        const updatedItem = await Item.findByIdAndUpdate(
            request.params.id,
            updatedItemData,
            { new: true }
        );
        return response.status(200).send({message: 'Item updated successfully', data: updatedItem});
    } catch (error) {
        return response.status(500).send({ message: error.message });
    }
});

// patch request to update quantity and buying price of a Item
router.patch('/:id', async (request, response) => {
    try {
        const item = await Item.findById(request.params.id);
        if (!item) {
            return response.status(404).send({ message: 'Item not found' });
        }
        const quantity = request.body.Quantity;
        const buyingPrice = request.body.BuyingPrice;
        if (quantity < 0) {
            return response.status(400).send({ message: 'Quantity cannot be negative' });
        }
        if (buyingPrice < 0) {
            return response.status(400).send({ message: 'Buying price cannot be negative' });
        }
        if(buyingPrice===0){
            return response.status(400).send({ message: 'Buying price can not be zero' });
        }
        if (quantity < 0) {
            return response.status(400).send({ message: 'Quantity cannot be negative' });
        }
        const updatedItemData = {
            Quantity: quantity,
            BuyingPrice: buyingPrice,
        };

        
        if(quantity>0){
            updatedItemData.Quantity = quantity;
        }
        else{
            updatedItemData.Quantity = item.Quantity;
        }
        const updatedItem = await Item.findByIdAndUpdate(
            request.params.id,
            updatedItemData,
            { new: true }
        );
        return response.status(200).send({message: 'Item updated successfully', data: updatedItem});
    } catch (error) {
        return response.status(500).send({ message: error.message });
    }
});
// delete request to delete a item
router.delete('/:id', async (request, response) => {
    try {
        const item = await Item.findById(request.params.id);
        if (!item) {
            return response.status(404).send({ message: 'Item not found' });
        }
        await Item.findByIdAndDelete(request.params.id);
        return response.status(200).send({ message: 'Item deleted successfully' });
    } catch (error) {
        return response.status(500).send({ message: error.message });
    }
});

export default router;