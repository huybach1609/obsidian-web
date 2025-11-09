import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import http from 'http';
import { URL } from 'url';

// Force Next.js to use Node.js runtime for this route
export const runtime = 'nodejs';

const BACKEND_URL = process.env.BACKEND_URL || 'https://localhost:7153';

// Create an agent that accepts self-signed certificates (development only)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // Accept self-signed certificates in development
});

function makeRequest(
  url: string,
  method: string,
  headers: Record<string, string>,
  body?: string
): Promise<{ status: number; statusText: string; data: string; contentType: string }> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method,
      headers,
      ...(isHttps && { agent: httpsAgent }),
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode || 500,
          statusText: res.statusMessage || 'Unknown',
          data,
          contentType: res.headers['content-type'] || 'application/json',
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(body);
    }

    req.end();
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, params, 'GET');
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, params, 'POST');
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, params, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, params, 'DELETE');
}

async function proxyRequest(
  request: NextRequest,
  params: { path: string[] },
  method: string
) {
  try {
    const path = params.path.join('/');
    const searchParams = request.nextUrl.searchParams.toString();
    const url = `${BACKEND_URL}/api/${path}${searchParams ? `?${searchParams}` : ''}`;

    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      // Forward important headers, but skip host and connection
      if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
        headers[key] = value;
      }
    });

    let body: string | undefined;
    if (method === 'POST' || method === 'PUT') {
      body = await request.text();
      if (body && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
      if (body) {
        headers['Content-Length'] = Buffer.byteLength(body).toString();
      }
    }

    const response = await makeRequest(url, method, headers, body);

    return new NextResponse(response.data, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': response.contentType,
      },
    });
  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Proxy error', message: error.message },
      { status: 500 }
    );
  }
}

