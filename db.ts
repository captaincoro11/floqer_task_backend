import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config({});

const url:string|undefined = process.env.MONGODB_URL

const connectDatabase =(url: string)=>{
    mongoose.connect(url).then((con)=>console.log(con.connection.host)).catch((error)=>console.error(error));

}

export default connectDatabase;