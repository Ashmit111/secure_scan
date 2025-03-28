import axios from 'axios';

export async function GET(req) {
  const url = new URL(req.url);
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) {
    return new Response(
      JSON.stringify({ error: 'URL parameter is required' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Ensure URL is valid and has proper protocol
  let validatedUrl;
  try {
    validatedUrl = new URL(targetUrl);
    if (!validatedUrl.protocol.startsWith('http')) {
      validatedUrl = new URL(`https://${targetUrl}`);
    }
  } catch (error) {
    try {
      validatedUrl = new URL(`https://${targetUrl}`);
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  try {
    const startTime = Date.now();
    
    const response = await axios.get(validatedUrl.toString(), {
      timeout: 10000,
      validateStatus: () => true // Don't throw on any status
    });
    
    const endTime = Date.now();
    const responseTime = `${endTime - startTime}ms`;
    const status = response.status;
    
    // Consider status codes 2xx and 3xx as "up"
    const isUp = status >= 200 && status < 400;
    
    return new Response(
      JSON.stringify({
        url: validatedUrl.toString(),
        status,
        isUp,
        responseTime
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        url: validatedUrl.toString(),
        status: 0,
        isUp: false,
        responseTime: "0ms",
        error: error.message || "Request failed"
      }),
      {
        status: 200, // Still return 200 as the API itself worked correctly
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
