import express from 'express';
import {Company} from '../models/companyModel.js';

const router = express.Router();

// get request to get all companies

router.get('/', async (request, response) => {
    try {
        const companies = await Company.find({});
        return response.status(200).send({
            count : companies.length,
            data : companies,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// get request to get a company by id
router.get('/:id', async (request, response) => {
    try {
        const company = await Company.findById(request.params.id);
        if (!company) {
            return response.status(404).send({ message: 'company not found' });
        }
        return response.status(200).send(company);
    } catch (error) {
        return response.status(500).send({ message: error.message });
    }
});

// post request to add a new company
router.post('/', async (request, response) => {
    try {
        const companyName = request.body.Name?.trim(); // trim the name

        if (!companyName) {
            return response.status(400).send({ message: 'Please enter a valid company name' });
        }

        const isExist = await Company.findOne({ Name: companyName });
        if (isExist) {
            return response.status(400).send({ message: 'Company name already exists' });
        }

        const newCompany = {
            Name: companyName,
        };

        const company = await Company.create(newCompany);
        return response.status(201).send(company);
    } catch (error) {
        return response.status(500).send({ message: error.message });
    }
});


// put request to update a company
router.put('/:id', async (request, response) => {
    try {
        const companyName = request.body.Name?.trim();
        const company = await Company.findById(request.params.id);
        if (!company) {
            return response.status(404).send({ message: 'Company not found' });
        }

        if (!companyName) {
            return response.status(400).send({ message: 'Please enter a valid company name' });
        }
        const isExist = await Company.findOne({ Name: companyName, _id: { $ne: request.params.id } });
        if (isExist) {
            return response.status(400).send({ message: 'Company name already exists' });
        }

        const updatedCompanyData = {
            Name: companyName,
        };
        
        const updatedCompany = await Company.findByIdAndUpdate(
            request.params.id,
            updatedCompanyData,
            { new: true }
        );
        return response.status(200).send({message: 'Company updated successfully', data: updatedCompany});
    } catch (error) {
        return response.status(500).send({ message: error.message });
    }
});

// delete request to delete a company
router.delete('/:id', async (request, response) => {
    try {
        const company = await Company.findById(request.params.id);
        if (!company) {
            return response.status(404).send({ message: 'Company not found' });
        }
        await Company.findByIdAndDelete(request.params.id);
        return response.status(200).send({ message: 'Company deleted successfully' });
    } catch (error) {
        return response.status(500).send({ message: error.message });
    }
});

export default router;