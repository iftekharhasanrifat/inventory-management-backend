import mongoose from "mongoose";

const categorySchema = mongoose.Schema(
    {
        Name:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
        }
        
    },
    {
        timestamps:true
    }
)
export const Category = mongoose.model('Category', categorySchema);