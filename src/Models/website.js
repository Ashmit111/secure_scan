import mongoose from "mongoose";

const WebsiteSchema = new mongoose.Schema(
    {
        url: {
            type: String,
            required: true,
            unique: true
        },
        userEmail: { // Store the user's email
            type: String,
            required: true,
            unique: true
        },
        status: {
            type: String,
            enum: ["UP", "DOWN"],
            default: "UP"
        },
        responseTime: {
            type: String,
            default: "N/A"
        },
        lastChecked: {
            type: Date,
            default: Date.now
        },
        logs: [
            {
                timestamp: { type: Date, default: Date.now },
                status: { type: String },
                responseTime: { type: String },
            },
        ],
    },
    { timestamps: true }
);

export const Website = mongoose.models.Website || mongoose.model("Website", WebsiteSchema);
