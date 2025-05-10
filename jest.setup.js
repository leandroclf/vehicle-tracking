// Optional: configure or set up a testing framework before each test
// if you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from 'util';

// Configurações globais para os testes de API
// --- BEGIN ADDED/MODIFIED MOCKS ---
// Ensure Headers, Request, Response are robustly defined for Next.js

if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init) { this._headers = {}; if (init) { for (const [key, value] of Object.entries(init)) { this.set(key, value); } } }
    append(name, value) { this._headers[name.toLowerCase()] = value; }
    delete(name) { delete this._headers[name.toLowerCase()]; }
    get(name) { return this._headers[name.toLowerCase()]; }
    has(name) { return name.toLowerCase() in this._headers; }
    set(name, value) { this._headers[name.toLowerCase()] = value; }
    forEach(callback) { for (const name in this._headers) { callback(this._headers[name], name, this); } }
    *[Symbol.iterator]() { for (const name in this._headers) { yield [name, this._headers[name]]; } }
    entries() { return this[Symbol.iterator](); }
    keys() { const keys = []; for (const name in this._headers) { keys.push(name); } return keys[Symbol.iterator](); }
    values() { const values = []; for (const name in this._headers) { values.push(this._headers[name]); } return values[Symbol.iterator](); }
  };
}

if (typeof global.Request === 'undefined' || typeof global.Request.prototype?.clone !== 'function') {
  global.Request = jest.fn().mockImplementation((input, init) => {
    const reqUrl = typeof input === 'string' ? input : input.url;
    const reqInit = typeof input === 'string' ? init : { ...(typeof input === 'object' && input !== null ? input : {}), ...init };

    let body = reqInit?.body;
    let bodyUsed = false;

    const requestObject = {
      url: reqUrl,
      method: reqInit?.method?.toUpperCase() || 'GET',
      headers: new global.Headers(reqInit?.headers),
      get body() { return body; },
      get bodyUsed() { return bodyUsed; },
      arrayBuffer: jest.fn().mockImplementation(async () => {
        if (bodyUsed) throw new TypeError('Already read');
        bodyUsed = true;
        if (body instanceof ArrayBuffer) return body;
        if (typeof TextEncoder === 'undefined') { global.TextEncoder = require('util').TextEncoder; }
        return new TextEncoder().encode(String(body)).buffer;
      }),
      blob: jest.fn().mockImplementation(async () => {
        if (bodyUsed) throw new TypeError('Already read');
        bodyUsed = true;
        if (typeof Blob === 'undefined') { global.Blob = require('node:buffer').Blob; }
        return new Blob([String(body)]);
      }),
      formData: jest.fn().mockImplementation(async () => {
        if (bodyUsed) throw new TypeError('Already read');
        bodyUsed = true;
        if (typeof FormData === 'undefined') { global.FormData = require('formdata-node').FormData;}
        return new FormData(); 
      }),
      json: jest.fn().mockImplementation(async () => {
        if (bodyUsed) throw new TypeError('Already read');
        bodyUsed = true;
        return JSON.parse(String(body));
      }),
      text: jest.fn().mockImplementation(async () => {
        if (bodyUsed) throw new TypeError('Already read');
        bodyUsed = true;
        return String(body);
      }),
      clone: jest.fn().mockImplementation(() => {
        const clonedInit = { ...reqInit, body: body }; // Pass current body to new Request
        const clonedRequest = new global.Request(reqUrl, clonedInit); 
        // If body was a stream, it would need more complex cloning. For simple string/buffer body, this is okay.
        // Reset bodyUsed for the clone if the original was not used, or handle stream cloning.
        // For this mock, we assume the cloned Request starts fresh with its own body state.
        return clonedRequest;
      }),
      duplex: 'half',
      cache: reqInit?.cache,
      credentials: reqInit?.credentials,
      integrity: reqInit?.integrity,
      keepalive: reqInit?.keepalive,
      mode: reqInit?.mode,
      redirect: reqInit?.redirect,
      referrer: reqInit?.referrer,
      referrerPolicy: reqInit?.referrerPolicy,
      signal: reqInit?.signal,
      cookies: new Map(),
      nextUrl: new URL(reqUrl),
      ua: {
        isBot: false,
        browser: { name: 'jest', version: '1.0.0' },
        device: { type: 'desktop', model: 'jest' },
        engine: { name: 'jest', version: '1.0.0' },
        os: { name: 'jest', version: '1.0.0' },
        cpu: { architecture: 'x64' }
      },
      [Symbol.for('internals')]: {
        cookies: new Map(),
        url: new URL(reqUrl)
      }
    };
    // Allow spreading other properties from init if they don't overwrite defined methods
    for(const key in reqInit) {
      if(Object.prototype.hasOwnProperty.call(reqInit, key) && !Object.prototype.hasOwnProperty.call(requestObject, key)) {
        requestObject[key] = reqInit[key];
      }
    }
    return requestObject;
  });
}

if (typeof global.Response === 'undefined' || typeof global.Response.prototype?.clone !== 'function') {
  global.Response = jest.fn().mockImplementation((body, init) => {
    const resInit = init || {};
    const status = resInit.status || 200;
    let bodyUsed = false;

    const responseObject = {
      headers: new global.Headers(resInit.headers),
      ok: status >= 200 && status < 300,
      redirected: resInit.redirected || false,
      status: status,
      statusText: resInit.statusText || 'OK',
      type: resInit.type || 'basic',
      url: resInit.url || '',
      get body() { return body; }, 
      get bodyUsed() { return bodyUsed; },
      arrayBuffer: jest.fn().mockImplementation(async () => {
        if (bodyUsed) throw new TypeError('Already read');
        bodyUsed = true;
        if (body instanceof ArrayBuffer) return body;
        if (typeof TextEncoder === 'undefined') { global.TextEncoder = require('util').TextEncoder; }
        return new TextEncoder().encode(String(body)).buffer;
      }),
      blob: jest.fn().mockImplementation(async () => {
        if (bodyUsed) throw new TypeError('Already read');
        bodyUsed = true;
        if (typeof Blob === 'undefined') { global.Blob = require('node:buffer').Blob; }
        return new Blob([String(body)]);
      }),
      formData: jest.fn().mockImplementation(async () => {
        if (bodyUsed) throw new TypeError('Already read');
        bodyUsed = true;
        if (typeof FormData === 'undefined') { global.FormData = require('formdata-node').FormData;}
        return new FormData();
      }),
      json: jest.fn().mockImplementation(async () => {
        if (bodyUsed) throw new TypeError('Already read');
        bodyUsed = true;
        if (typeof body === 'object' && body !== null && !(body instanceof ArrayBuffer) && !(body instanceof Blob) && !(body instanceof FormData)) {
            return body; 
        }
        return JSON.parse(String(body));
      }),
      text: jest.fn().mockImplementation(async () => {
        if (bodyUsed) throw new TypeError('Already read');
        bodyUsed = true;
        return String(body);
      }),
      clone: jest.fn().mockImplementation(() => {
        // Create a new Response with the same body and init options
        return new global.Response(body, { ...resInit });
      }),
    };
    return responseObject;
  });
}

global.fetch = jest.fn(async (input, init) => {
  let req;
  // Check if input is already a Request instance (or our mock of it)
  if (input instanceof global.Request || (typeof input === 'object' && input && typeof input.clone === 'function' && typeof input.url === 'string')) {
    req = input;
  } else {
    req = new global.Request(String(input), init);
  }
  return Promise.resolve(new global.Response(JSON.stringify({ mockData: true, requestedUrl: req.url }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  }));
});
// --- END ADDED/MODIFIED MOCKS ---
global.__MOCK_JWT_EXPIRED__ = false;

// Aumentar o timeout para testes de API que podem ser mais lentos
jest.setTimeout(30000);

// Mock de funções do ambiente que podem não estar disponíveis no ambiente de teste
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      updateUser: jest.fn(),
      getUser: jest.fn()
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn()
    })
  }
}));

// Mock NextResponse
jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server');
  return {
    ...actual,
    NextResponse: {
      ...actual.NextResponse,
      json: (data, init) => {
        return {
          ...actual.NextResponse.json(data, init),
          json: async () => data,
          status: init?.status || 200
        };
      },
    },
  };
});

