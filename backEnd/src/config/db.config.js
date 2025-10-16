import mongoose from 'mongoose';
import { createDefaultAdmin } from '../utils/helperInit.js';

async function connectDB(uri) {
    try{
        await mongoose.connect(uri);
        await createDefaultAdmin();
        
        console.log("MongoDB connecter avec succes");

    } catch(err){
        console.log("MongoDB connecyion error: ", err);
        process.exit(1);
    }
}

export default connectDB;