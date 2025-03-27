import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req, res) {
    try {
        const { url } = await req.json(); // Ensure `req.json()` is awaited
        console.log("Request received:", url);

        if (!url) {
            return new Response(JSON.stringify({ error: "URL is required" }), { status: 400 });
        }

        const result = await analyze_domain(url);
        console.log("Analysis result:", result);
        return new Response(JSON.stringify(result), { status: 200 });
    } catch (error) {
        console.error("Error in POST handler:", error);
        return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), { status: 400 });
    }
}

const analyze_domain = async (url) => {
    const gemini_api = process.env.GEMINI_API_KEY;

    if (!gemini_api) {
        throw new Error("GEMINI_API_KEY is not set in environment variables");
    }

    console.log("API Key:", gemini_api);

    const googleGenerativeAI = new GoogleGenerativeAI({ apiKey: gemini_api });

    const prompt = `You are an expert in cybersecurity with a focus on phishing detection. When provided with a domain name, analyze its characteristics and determine the likelihood of it being a phishing site. Consider factors such as domain age, SSL certificate validity, presence in known blacklists, and URL structure. Provide a concise risk assessment and recommendations. This is a test of your expertise and ability to communicate complex technical information to a non-technical audience. Domain: ${url}`;

    try {
        const response = await googleGenerativeAI.generateText({
            model: "gemini-2.0-flash", // Correct model name for text generation
            prompt: prompt,
        });

        if (!response || !response.candidates || !response.candidates[0]) {
            throw new Error("Invalid response from Google Generative AI");
        }

        const text = response.candidates[0].output;
        console.log("Generated text:", text);

        return { data: text, status: 200 };
    } catch (error) {
        console.error("Error in analyze_domain:", error);
        throw new Error("Failed to analyze domain");
    }
};
