import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import App from './App.jsx'
import './index.css'

const localApiUrl = 'http://localhost:5000';
const apiUrl = import.meta.env.VITE_API_URL || localApiUrl;
// Rewrite legacy localhost URLs so the same frontend works after deployment.
axios.interceptors.request.use(config => {
  if (config.url?.startsWith(localApiUrl) && apiUrl !== localApiUrl) {
    config.url = `${apiUrl}${config.url.slice(localApiUrl.length)}`;
  }
  return config;
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
