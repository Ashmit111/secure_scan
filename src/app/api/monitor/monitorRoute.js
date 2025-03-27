import { checkWebsiteStatus } from "@/lib/monitor";

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

        console.log(url);

        const result = await checkWebsiteStatus(url); // Call helper function from lib folder

        return new Response(
            JSON.stringify(result),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: "Internal Server Error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
