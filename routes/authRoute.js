import express from 'express';
import { Admin } from '../models/AdminModel.js';
import bcrypt from 'bcrypt';
const router = express.Router();
//Register
router.post('/register', async (req, res) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash(req.body.password, salt);
        const newUser = {
            username: req.body.username,
            password: hashedPass
        };
        const admin = await Admin.create(newUser);
        res.status(200).json(admin)
        console.log(newUser)
    } catch (err) {
        res.status(500).json(err)
    }
})


//Login

router.post('/login', async (req, res) => {
    try {
        // const admin = await Admin.find({ username: req.body.username })
        const admin = await Admin.findOne({ username: req.body.username });

        if (!admin) {
            res.status(400).json("Wrong Credentials");
            return;
        }

        const validated = await bcrypt.compare(req.body.password, admin.password)
        if (!validated) {
            res.status(400).json("Wrong Credentials");
            return;
        }

        const {password, ...others} = admin._doc;
        res.status(200).json(others);
        return;
    } catch (err) {
        res.status(500).json(err)
    }
})

export default router;