// api.js — créer une instance axios réutilisable
import axios from "axios";

const API_BASE = "http://localhost:8507"; // ou "http://localhost:3000" selon ton serveur

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // <-- très important : permet au navigateur d'accepter/envoyer les cookies httpOnly
});

const token = () => localStorage.getItem("accessToken");


api.interceptors.request.use(config => {
  if (token()) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token()}`
  }
  return config;
}, err => Promise.reject(err));

const ws_token = async () => {
  const ws_token = await api.get("/auth/socket-token");

  if (ws_token.status === 200) return ws_token.data.token;
  else { 
    console.log("Erreur de recuperation du token"); 
    return null; 
  }
}

// helper pour mettre le token d'accès après login
export function setAccessToken(token) {
  if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete api.defaults.headers.common['Authorization'];
}


export { API_BASE, api, token, ws_token };