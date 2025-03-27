import mongoose from "mongoose";
import dotenv from dotenv;


dotenv.config();

export const connectDB = async () => {
    try {

        const mongoURI = `${process.env.MONGO_URI}/ ${securescan}`;

        const connectionInstance = await mongoose.connect(mongoURI);

        console.log(`MONGODB connected with HOST : ${connectionInstance.connection.host}`)

    } catch (error) {
        console.log(`MONGODB connection failed due to ${error.message}`);
        process.exit(1);
    }
}
