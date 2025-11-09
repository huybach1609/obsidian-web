import axios from 'axios';

axios.defaults.baseURL = '/api';

// Function to update authorization header
export function setAuthToken(token: string | null) {
  if (token) {
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
}

// Set initial token if available
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('jwt');
  if (token) {
    setAuthToken(token);
  }
}

export default axios;

