import mongoose from "mongoose";

const companySchema = mongoose.Schema(
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
export const Company = mongoose.model('Company', companySchema);