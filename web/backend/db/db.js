import mongoose from "mongoose";

const connectDataBase = async () => {
    const MONGO_URL = process.env.MONGO_URL;
    
    try {
        if (!MONGO_URL) {
            console.error('❌ MONGO_URL is not defined in environment variables');
            throw new Error('MONGO_URL is not defined');
        }
        
        
        await mongoose.connect(MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('✅ MongoDB connected successfully');
        
        // Test the connection
        const db = mongoose.connection;
        db.on('error', (error) => {
            console.error('❌ MongoDB connection error:', error);
        });
        
        db.on('disconnected', () => {
            console.log('⚠️ MongoDB disconnected');
        });
        
    } catch (error) {
        console.error('❌ Error while connecting to MongoDB:', error.message);
        console.error('❌ Full error:', error);
        throw error; // Re-throw to prevent app from starting with broken DB
    }
}

export default connectDataBase