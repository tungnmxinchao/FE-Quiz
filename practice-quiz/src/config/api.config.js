export const API_CONFIG = {
    BASE_URL: 'https://localhost:7107',
    ODATA_ENDPOINT: '/odata'
};

export const getODataURL = (endpoint) => `${API_CONFIG.BASE_URL}${API_CONFIG.ODATA_ENDPOINT}${endpoint}`; 