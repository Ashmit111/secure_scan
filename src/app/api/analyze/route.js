

import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req, res) {
    const { url } = req.json();

    
    analyze_domain(url);

   
    
}



const analyze_domain = async (url)=>{
    const gemini_api = process.env.GEMINI_API_KEY;
    console.log(gemini_api)

    const googleGenerativeAI = new GoogleGenerativeAI({apiKey : gemini_api});



    const prompt = `You are an expert in cybersecurity with a focus on phishing detection. When provided with a domain name, analyze its characteristics and determine the likelihood of it being a phishing site. Consider factors such as domain age, SSL certificate validity, presence in known blacklists, and URL structure. Provide a concise risk assessment and recommendations. This is a test of your expertise and ability to communicate complex technical information to a non-technical audience. Domain: ${url}`;



    const reponse = await googleGenerativeAI.complete({
        model : 'gemini-2.0-flash' , 
        prompt : prompt,
        });
    const text = reponse.data.choices[0].text;

    

    return Response.json({data : text , status :200})
}
