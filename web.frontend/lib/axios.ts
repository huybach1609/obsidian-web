import axios from 'axios';
import { getTokenFromCookie } from '@/contexts/AppContext';

// Get API URL from environment variable, fallback to '/api' for production
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
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
  const token = getTokenFromCookie();
  if (token) {
    setAuthToken(token);
  }
}

export default axios;

