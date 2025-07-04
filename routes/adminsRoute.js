import express from 'express';
import {Admin} from '../models/AdminModel.js';
import bcrypt from 'bcrypt'
const router = express.Router();
//Update
router.put('/:id', async (req, res) => {
    
        if(req.body.password){
            const salt = await bcrypt.genSalt(10);
            req.body.password = await bcrypt.hash(req.body.password, salt);
        }
        try {
            const updatedUser = await Admin.findByIdAndUpdate(req.params.id,req.body);
            res.status(200).json(updatedUser);
        } catch (err) {
            res.status(500).json(err)
        }
})

//Delete
router.delete('/:id', async (req, res) => {
   
        try {
            await Admin.findByIdAndDelete(req.params.id)
            res.status(200).json("admin has been deleted");
        } catch (err) {
            res.status(500).json(err)
        }

})

//Get Admin
router.get("/:id",async (req,res)=>{
    try{
        const admin = await Admin.findById(req.params.id);
        const {password,...others}= admin._doc;
        res.status(200).json(others);
    }
    catch (err){
        res.status(500).json(err);
    }
})

export default router;