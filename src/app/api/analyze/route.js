
import {
    GoogleGenAI,
    createUserContent,
    createPartFromUri,
  } from "@google/genai";

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

    const ai = new GoogleGenAI({ apiKey: gemini_api });
    const prompt =`You are an AI assistant designed to extract domain information from a given URL and return it in a structured JSON format.

Instructions:

Receive Input: You will be provided with a URL.
Extract Information: Analyze the URL and extract the following information:
domain_age_days: The age of the domain in days.
domain_expiration_days: The number of days until the domain expires.
ssl_issuer: The issuer of the SSL certificate.
ssl_valid_days: The number of days the SSL certificate is valid.
is_google_indexed: A boolean value indicating whether the domain is indexed by Google (true or false).
alexa_rank: (Note: Alexa Rank is no longer available. Return "Alexa Rank data is no longer available.")
is_whois_private: A boolean value indicating whether the WHOIS information is private (true or false).
Format Output: Return the extracted information in a valid JSON object with the specified keys.
Error Handling: If any of the required information cannot be extracted, return "null" for that corresponding key in the JSON object.
No Extraneous Information: Do not include any additional text or explanations in your response, only the JSON object.
Example Input:

https://example.com

Example Output:

JSON

{
  "domain_age_days": 7300,
  "domain_expiration_days": 365,
  "ssl_issuer": "Let's Encrypt",
  "ssl_valid_days": 90,
  "is_google_indexed": true,
  "alexa_rank": "Alexa Rank data is no longer available.",
  "is_whois_private": false
}
Constraints:

Return valid JSON.
Return "null" for data that cannot be found.
Do not add any additional text to the response, only the JSON.
Now, process the provided URL ${url} and return the requested information in JSON format.`

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash", // Correct model name for text generation
            contents: [prompt]
        });

        if (!response || !response.candidates || !response.candidates[0]) {
            throw new Error("Invalid response from Google Generative AI");
        }

        const text = response.text;
        console.log("Generated text:", text);

        return { data: text, status: 200 };
    } catch (error) {
        console.error("Error in analyze_domain:", error);
        throw new Error("Failed to analyze domain");
    }
};
