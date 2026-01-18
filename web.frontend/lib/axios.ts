import axios from 'axios';
import { getCookie } from '@/utils/cookie';
import { TOKEN_COOKIE_KEY } from '@/lib/constants';

// Get API URL from environment variable, fallback to '/api' for production
// const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
// axios.defaults.baseURL = API_URL;

let API_URL = `${process.env.NEXT_PUBLIC_API_PROTOCOL}://${process.env.NEXT_PUBLIC_API_HOST}:${process.env.NEXT_PUBLIC_API_PORT}/api`;

if(process.env.NODE_ENV === 'production') {
    API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
}
console.log('API_URL', API_URL);
axios.defaults.baseURL = API_URL;


// Function to update authorization header
export function setAuthToken(token: string | null) {
  if (token) {
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
}

// Set initial token if available
if (typeof document !== 'undefined') {
  const token = getCookie(TOKEN_COOKIE_KEY);
  if (token) {
    setAuthToken(token);
  }
}

export default axios;

