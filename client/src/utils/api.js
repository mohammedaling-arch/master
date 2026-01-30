import axios from 'axios';

// Use relative path to leverage Vite proxy
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use(
    (config) => {
        // Decide which token to use based on the context (request URL or current app state)
        const isStaffEndpoint = config.url.includes('/staff/');
        const isStaffDashboard = window.location.pathname.includes('/staff/');
        const isStaffRequest = isStaffEndpoint || isStaffDashboard;

        const token = isStaffRequest ? localStorage.getItem('staffToken') : localStorage.getItem('token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        console.log(`[API REQUEST] ${config.method.toUpperCase()} ${config.baseURL}${config.url} (Using ${isStaffRequest ? 'Staff' : 'Public'} Token)`);
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
export { API_URL };
