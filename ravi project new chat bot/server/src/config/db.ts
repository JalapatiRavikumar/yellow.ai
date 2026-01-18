import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot-platform';

        await mongoose.connect(mongoUri);

        console.log('📦 MongoDB connected successfully');

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
};

export default connectDB;
