import mongoose from "mongoose";

const connectDataBase = async () => {

    const MONGO_URL= process.env.MONGO_URL
    try {
        if (!MONGO_URL) {
            throw new Error('MONGO_URL is not defined');
          }
       await mongoose.connect(MONGO_URL)
       console.log('MongoDB connected sucessfully');

    } catch (error) {
        console.log("Error while connect MongoDB",error)
    }
}

export default connectDataBase