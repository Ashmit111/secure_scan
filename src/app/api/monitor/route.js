import { connectDB } from "@/lib/db";
import { checkWebsiteStatus } from "@/lib/monitor";
import { Website } from "@/Models/website";
import { sendAlert } from "@/lib/alert";

// To handle get requests for uptime monitoring
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const url = searchParams.get("url");

        if (!url) {
            return new Response(
                JSON.stringify({ error: "URL is required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        console.log("Checking status for:", url);

        // Connect to MongoDB
        await connectDB();

        // Get website status before updating DB
        const result = await checkWebsiteStatus(url); // Call helper function

        // Check if the websites already exists in DB
        const existingWebsite = await Website.findOne({ url });

        if (existingWebsite) {
            //  Update existing website logs
            existingWebsite.logs.push({
                status: result.status,
                responseTime: result.responseTime,
            });
            existingWebsite.status = result.isUp ? "UP" : "DOWN";
            existingWebsite.lastChecked = Date.now();
            await existingWebsite.save();

            if (!result.isUp) {
                console.log("Website is down sending alert");
                await sendAlert(existingWebsite.userEmail, url, result.status);
            }

        } else {
            //  Create a new website entry in DB
            await Website.create({
                url,
                userEmail,
                status: result.isUp ? "UP" : "DOWN",
                responseTime: result.responseTime,
                logs: [
                    {
                        status: result.status,
                        responseTime: result.responseTime,
                    },
                ],
            });
        }

        //  Return the response
        return new Response(
            JSON.stringify(result),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("Error in GET request:", error);
        return new Response(
            JSON.stringify({ error: "Internal Server Error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
