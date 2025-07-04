import express from 'express';
import {Category} from '../models/categoryModel.js';

const router = express.Router();

// get request to get all categories

router.get('/', async (request, response) => {
    try {
        const categories = await Category.find({});
        return response.status(200).send({
            count : categories.length,
            data : categories,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// get request to get a category by id
router.get('/:id', async (request, response) => {
    try {
        const category = await Category.findById(request.params.id);
        if (!category) {
            return response.status(404).send({ message: 'Category not found' });
        }
        return response.status(200).send(category);
    } catch (error) {
        return response.status(500).send({ message: error.message });
    }
});

// post request to add a new category
router.post('/', async (request, response) => {
    try {
        const categoryName = request.body.Name?.trim(); // trim the name

        if (!categoryName) {
            return response.status(400).send({ message: 'Please enter a valid category name' });
        }

        const isExist = await Category.findOne({ Name: categoryName });
        if (isExist) {
            return response.status(400).send({ message: 'Category name already exists' });
        }

        const newCategory = {
            Name: categoryName,
        };

        const category = await Category.create(newCategory);
        return response.status(201).send(category);
    } catch (error) {
        return response.status(500).send({ message: error.message });
    }
});


// put request to update a category
router.put('/:id', async (request, response) => {
    try {
        const categoryName = request.body.Name?.trim();
        const category = await Category.findById(request.params.id);
        if (!category) {
            return response.status(404).send({ message: 'Category not found' });
        }

        if (!categoryName) {
            return response.status(400).send({ message: 'Please enter a valid category name' });
        }
        const isExist = await Category.findOne({ Name: categoryName, _id: { $ne: request.params.id } });
        // const isExist = await Category.findOne({ Name: categoryName });
        if (isExist) {
            return response.status(400).send({ message: 'Category name already exists' });
        }

        const updatedCategoryData = {
            Name: categoryName,
        };
        
        const updatedCategory = await Category.findByIdAndUpdate(
            request.params.id,
            updatedCategoryData,
            { new: true }
        );
        return response.status(200).send({message: 'Category updated successfully', data: updatedCategory});
    } catch (error) {
        return response.status(500).send({ message: error.message });
    }
});

// delete request to delete a category
router.delete('/:id', async (request, response) => {
    try {
        const category = await Category.findById(request.params.id);
        if (!category) {
            return response.status(404).send({ message: 'Category not found' });
        }
        await Category.findByIdAndDelete(request.params.id);
        return response.status(200).send({ message: 'Category deleted successfully' });
    } catch (error) {
        return response.status(500).send({ message: error.message });
    }
});

export default router;