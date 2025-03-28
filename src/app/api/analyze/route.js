import {
    GoogleGenAI,
    createUserContent,
    createPartFromUri,
} from "@google/genai";

import axios from "axios";
import * as cheerio from 'cheerio'

//globally declare kar raha hu taaki sabhi function me use kar saku 
// nahi toh baar baar likhna padega 
//Aur Optimise karne ke liye 
// isko ek function bhi bana sakte...aur usko prompt pass kar sakte and it will return reponse 
const gemini_api = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: gemini_api });

export async function POST(req, res) {
    try {
        console.log("Request received:");
        const { url } = await req.json(); // Ensure `req.json()` is awaited

        if (!url) {
            return new Response(JSON.stringify({ error: "URL is required" }), { status: 400 });
        }

        const domainAnalysisResult = await analyze_domain(url);
        const externalEvaluations = await evaluateExternalLinks(url);
        
        // Don't parse externalEvaluations as JSON - it's already processed
        console.log("External links evaluations:", externalEvaluations);

        // Combine both results
        const combinedResult = {
            domainAnalysis: domainAnalysisResult,
            externalLinksEvaluations: externalEvaluations,
        };

        // Don't parse combinedResult - it's already an object
        console.log("Combined result:", combinedResult);

        return new Response(JSON.stringify(combinedResult), { status: 200 });
    } catch (error) {
        console.error("Error in POST handler:", error);
        return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), { status: 400 });
    }
}

// Helper function to clean AI responses from markdown formatting
function cleanJsonResponse(text) {
    // Remove markdown formatting like ```json and ``` that might be in the response
    let cleaned = text.replace(/```json|```/g, '').trim();
    
    // Handle possible additional text before or after the JSON
    try {
        // Try to find JSON content between curly braces
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return jsonMatch[0];
        }
        return cleaned;
    } catch (e) {
        return cleaned;
    }
}

const analyze_domain = async (url) => {

    if (!gemini_api) {
        throw new Error("GEMINI_API_KEY is not set in environment variables");
    }

    console.log("API Key:", gemini_api);


    const prompt = `You are an AI assistant designed to extract domain information from a given URL and return it in a structured JSON format.

Instructions:

1.  Receive Input: You will be provided with a URL.
2.  Extract Information: Analyze the URL and extract the following information:
    * domain_age_days: (number) The age of the domain in days. If the information cannot be found,provide any Random value according to the context of the parameter or provide the reason as a string.
    * domain_expiration_days: (number) The number of days until the domain expires. If the information cannot be found, provide any Random value according to the context of the parameter or provide the reason as a string.
    * ssl_issuer: (string) The issuer of the SSL certificate. If the information cannot be found, provide any Random value according to the context of the parameter.
    * ssl_valid_days: (number) The number of days the SSL certificate is valid. If the information cannot be found, provide the reason as a string.
    * is_google_indexed: (boolean) A boolean value indicating whether the domain is indexed by Google (true or false). If the information cannot be found, provide any Random value according to the context of the parameter or provide the reason as a string.
    * is_domain_blacklisted: (boolean) Check all the online sources where You can find all the blacklisted domains and if the provided domain lies in those lists ...return a boolen value true or false based on the result. If the information cannot be found,provide any Random value according to the context of the parameter or  provide the reason as a string.
    * is_whois_private: (boolean) A boolean value indicating whether the WHOIS information is private (true or false). If the information cannot be found, provide any Random value according to the context of the parameter or  provide the reason as a string.
    * risk_score: (number) Provide a risk score between 0 and 100, where 0 is completely safe and 100 is extremely dangerous. Base this on all factors above and your knowledge of phishing patterns.
3.  Format Output: Return the extracted information in a valid JSON object with the specified keys.
4.  No Extraneous Information: Do not include any additional text or explanations in your response, only the JSON object.
5.  Respond with a valid JSON object without Markdown formatting, triple backticks, or extra newlines.
6. IF you are not able to find the information then Strictly provide the any random Value in Context of that Parameter .
Example Input:

https://example.com

Example Output:

{
  "domain_age_days": 7300 days,
  "domain_expiration_days": 365 days,
  "ssl_issuer": "Let's Encrypt",
  "ssl_valid_days": 90 days,
  "is_google_indexed": true,
  "is_domain_blacklisted": false,
  "is_whois_private": false,
  "risk_score": 15
}

Constraints:

* Return valid JSON. NO MARKDOWN FORMAT OR STRING --- dont include that triple backticks and json specified in the response 
* If data cannot be found, return the reason as a string.
* Do not add any additional text to the response, only the JSON.
*Respond with a valid JSON object without Markdown formatting, triple backticks, or extra newlines.

Now, process the provided URL ${url} and return the requested information in JSON format.`

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash", // Correct model name for text generation
            contents: [prompt]
        });

        if (!response || !response.text) {
            throw new Error("Invalid response from Google Generative AI");
        }

        // Access the text content properly from the response object
        const text = response.text;
        console.log("Generated text:", text);

        // Clean the response and try to parse as JSON
        try {
            const cleanedText = cleanJsonResponse(text);
            const jsonData = JSON.parse(cleanedText);
            return { data: jsonData, status: 200 };
        } catch (e) {
            console.error("Error parsing domain analysis JSON:", e);
            return { data: text, status: 200 };
        }
    } catch (error) {
        console.error("Error in analyze_domain:", error);
        throw new Error(`Failed to analyze domain: ${error.message}`);
    }
};


// cheerio ka code to extract the external links 
async function extractExternalLinks(url) {
    try {
        const { data: html } = await axios.get(url);
        const $ = cheerio.load(html);
        // Remove non-content elements
        $('script, style, noscript, iframe, svg').remove();
        const externalLinks = new Set();
        $('a').each((_, el) => {
            const href = $(el).attr('href');
            if (!href || href === "/" || href.startsWith('#')) return;
            try {
                const absoluteUrl = new URL(href, url).href;
                // Check if the link is external by comparing origins
                if (!absoluteUrl.startsWith(new URL(url).origin)) {
                    externalLinks.add(absoluteUrl);
                }
            } catch (error) {
                console.warn(`Invalid URL: ${href}`);
            }
        });
        return Array.from(externalLinks);
    } catch (error) {
        console.error(`Error fetching ${url}: ${error.message}`);
        return [];
    }
}


//Cherio ka output denge ab gemini ko 

async function assessLinkTrustworthiness(externalLink) {
    try {
        const systemPrompt = `You are an expert digital trust evaluator. Your task is to analyze provided external URLs and determine their trustworthiness.
        
        NOTE :(Strictly Follow it ) ---> Return it as a plain JSON object with no markdown formatting, no triple backticks, and no additional text :

Instructions:

Receive Input: You will be provided with an array of external URLs.
Evaluate Each URL: For each URL in the array, perform the following evaluations:
Reputable Domain: Determine if the URL originates from a reputable domain.
Phishing/Malicious Intent: Check for signs of phishing or malicious intent.
Security: Verify the presence of proper security measures (HTTPS, verified certificates).
Public Reputation: Consult public sources and online reputation services for domain information.
Categorize Trustworthiness: Assign one of the following categories to each URL: "Trustworthy", "Suspicious", or "Untrustworthy".
Provide Reason: Give a concise, one-line explanation for the trustworthiness categorization.
Format Output: Return the evaluation results in a JSON array. Each element in the array should be a JSON object with the following keys:
link: The external URL.
is_safe: The trustworthiness category ("Trustworthy", "Suspicious", or "Untrustworthy").
reason: A one-line explanation for the categorization.
Example Input:

["https://google.com", "http://malicious-site.com", "https://example.org"]

Example Output:
  {
    "link": "https://google.com",
    "is_safe": "Trustworthy",
    "reason": "Established domain with secure HTTPS and positive reputation."
  },
  {
    "link": "http://malicious-site.com",
    "is_safe": "Untrustworthy",
    "reason": "Insecure HTTP, potential phishing, and poor reputation."
  },
  {
    "link": "https://example.org",
    "is_safe": "Trustworthy",
    "reason": "Secure HTTPS and generally reliable domain."
  }

Constraints:

Return a valid JSON array.
NOTE :(Strictly Follow it ) ---> Return it as a plain JSON object with no markdown formatting, no triple backticks, and no additional text :
Each URL should be represented as a JSON object with the specified keys.
The "reason" should be a concise, one-line explanation.
Do not include any additional text or explanations outside the JSON output.
Respond with a valid JSON object without Markdown formatting, triple backticks, or extra newlines.
Now, process the provided array of external URLs and return the evaluation results in JSON format.Link to analyze ${externalLink}`;



        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: [systemPrompt],
        });

        // Access the text content properly
        const text = response.text;
        
        // Clean the response and try to parse as JSON
        try {
            const cleanedText = cleanJsonResponse(text);
            return JSON.parse(cleanedText);
        } catch (e) {
            console.error("Error parsing link trustworthiness JSON:", e);
            return { link: externalLink, is_safe: "Unknown", reason: "Error parsing response" };
        }
    } catch (error) {
        console.error(`Error assessing link ${externalLink}: ${error.message}`);
        return { link: externalLink, is_safe: "Unknown", reason: "Error assessing link" };
    }
}

// Function to extract external links and evaluate each link's trustworthiness
async function evaluateExternalLinks(url) {
    try {
        const externalLinks = await extractExternalLinks(url);
        const evaluations = [];
        for (const link of externalLinks) {
            const evalResult = await assessLinkTrustworthiness(link);
            evaluations.push(evalResult);
        }
        return evaluations;
    } catch (error) {
        console.error("Error evaluating external links:", error);
        return []; // Return empty array on error
    }
}


