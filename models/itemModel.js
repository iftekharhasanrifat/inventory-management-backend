import mongoose from "mongoose";
const itemSchema = mongoose.Schema(
    {
        Name:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
        },
        Category:{
            type:String,
            required:true
        },
        Company:{
            type:String,
            required:true
        },
        Quantity:{
            type:Number,
            required:false
        },
        BuyingPrice:{
            type:Number,
            required:false
        },
    },
    {
        timestamps:true
    }
)
export const Item = mongoose.model('Item', itemSchema);