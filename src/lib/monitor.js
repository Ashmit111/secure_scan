import axios from "axios";


export const checkWebsiteStatus = async (url) => {
    try {
        const start = Date.now(); // current time ko store krne ke liye before making req.
        const response = await axios.get(url, { timeout: 3000 }); // 5seconds ke liye
        const end = Date.now(); // timestamps store krne ke liye jab response mil jayega


        console.log(response.data);
        return {
            url, // jo url ko check kiya h
            status: response.status, 
            isUp: true,
            responseTime: `${end - start}ms`,
        }
    } catch (error) {
        // if req fails:
        return {
            url,
            status: error.response?.status || "DOWN",
            isUp: false,
            responseTime: "N/A",
        }
    }
}