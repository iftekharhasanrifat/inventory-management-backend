import express from 'express';
import { PORT, mongoDBURL } from './config.js';
import cors from 'cors';
import mongoose from 'mongoose';
import categoryRoute from './routes/categoryRoute.js';
import companyRoute from './routes/companyRoute.js';
import itemRoute from './routes/itemRoute.js';
import stockInRoute from './routes/StockInRoute.js';
import stockOutRoute from './routes/StockOutRoute.js';
import authRouter from './routes/authRoute.js';
import adminRouter from './routes/adminsRoute.js'
const app = express();
app.use(express.json());
app.use(cors());

app.use('/categories', categoryRoute);
app.use('/companies', companyRoute);
app.use('/items', itemRoute);
app.use('/stockin', stockInRoute);
app.use('/stockout', stockOutRoute);
app.use('/admins', adminRouter)
app.use('/auth',authRouter)
app.get('/', (req, res) => {
  res.send('Hello World!');
});

mongoose.connect(mongoDBURL)
.then(() => {
  console.log('Connected to MongoDB');
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
})
.catch((error) => {
    console.log('Error:', error);
});