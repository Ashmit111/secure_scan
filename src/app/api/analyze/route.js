
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
        const { url } = await req.json(); // Ensure `req.json()` is awaited
        console.log("Request received:", url);

        if (!url) {
            return new Response(JSON.stringify({ error: "URL is required" }), { status: 400 });
        }

        const domainAnalysisResult = await analyze_domain(url);
        // console.log("Analysis result:", result);

        const externalEvaluations = await evaluateExternalLinks(url);
        console.log("External links evaluations:", externalEvaluations);
    
        // Combine both results
        const combinedResult = {
          domainAnalysis: domainAnalysisResult,
          externalLinksEvaluations: externalEvaluations,
        };

        console.log(combinedResult)
    


        return new Response(JSON.stringify(combinedResult), { status: 200 });
    } catch (error) {
        console.error("Error in POST handler:", error);
        return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), { status: 400 });
    }
}

const analyze_domain = async (url) => {

    if (!gemini_api) {
        throw new Error("GEMINI_API_KEY is not set in environment variables");
    }

    console.log("API Key:", gemini_api);

   
    const prompt =`You are an AI assistant designed to extract domain information from a given URL and return it in a structured JSON format.

Instructions:

Receive Input: You will be provided with a URL.
Extract Information: Analyze the URL and extract the following information:
domain_age_days: The age of the domain in days.
domain_expiration_days: The number of days until the domain expires.
ssl_issuer: The issuer of the SSL certificate.
ssl_valid_days: The number of days the SSL certificate is valid.
is_google_indexed: A boolean value indicating whether the domain is indexed by Google (true or false).
is_domain_Blacklisted: Check all the online sources where You can find all the blacklisted domains and if the provided domain lies in those lists ...return a boolen value true or false based on the result 
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
  "is_domain_blacklisted":false,  
  "is_whois_private": false
}
Constraints:

Return valid JSON.
If data that cannot be found Return the reason due to which data didn't found.
Do not add null in the response add the reason why the data is null
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

JSON


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
Each URL should be represented as a JSON object with the specified keys.
The "reason" should be a concise, one-line explanation.
Do not include any additional text or explanations outside the JSON output.
Now, process the provided array of external URLs and return the evaluation results in JSON format.Link to analyze ${externalLink}`;

  
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [systemPrompt],
      });
  
      const text = response.text;
      return   text ;
    } catch (error) {
      console.error(`Error assessing link ${externalLink}: ${error.message}`);
      return { externalLink, evaluation: "Error assessing link" };
    }
  }
  
  // Function to extract external links and evaluate each link's trustworthiness
  async function evaluateExternalLinks(url) {
    const externalLinks = await extractExternalLinks(url);
    const evaluations = [];
    for (const link of externalLinks) {
      const evalResult = await assessLinkTrustworthiness(link);
      evaluations.push(evalResult);
    }
    return evaluations;
  }
  

