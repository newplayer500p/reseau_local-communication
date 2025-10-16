/* eslint-disable no-unused-vars */
import { data } from "react-router-dom";
import {api} from "../service/axios.service";

export const sign_up = async (nom, email, password, status, avatar, handleLogin) => {
    if (nom===null || email===null || password===null || status===null || avatar==null) return null;

    try {
        const formData = new FormData();

        formData.append("nom", nom);
        formData.append("email", email);
        formData.append("password", password);
        formData.append("status", status);
        formData.append("avatar", avatar);

        const url = "/auth/sign_up";

        const res = await api.put(url, formData);

        if (res.status ===  200 && res.data ){
            const accessToken = res.data; 
            localStorage.setItem("accessToken", accessToken);
            handleLogin(accessToken)
            return true;
        }

        if (res.status === 409) return false;

        return null;

    } catch(err){
        return false;
    }
}

export const updateUser = async (formData) => {
  try {
    const resp = await api.post("/user/changeProfile", formData);
    if (resp.status === 404) return null;
    return resp;
  } catch (err){
    console.log(err);
    return null;
  }
}

export const login = async (email, password, handleLogin) => {
  try {
    if (!email || !password) return null;

    const resp = await api.post("/auth/login", { email, password });

    if (resp.status === 200 && resp.data) {
      const accessToken = resp.data; // ou resp.data.accessToken selon impl
      localStorage.setItem("accessToken", accessToken);
      handleLogin(accessToken);
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
};

// authClient.js (utilise l'instance api avecCredentials: true)
export const refreshAccessToken = async () => {
  try {
    // on n'envoie PAS le token dans le body — serveur lira le cookie httpOnly
    const resp = await api.post("/auth/refresh"); // avecCredentials true depuis api
    if (resp.status === 200 && resp.data) {
      const newAccessToken = resp.data.accessToken ?? resp.data; // selon shape
      localStorage.setItem("accessToken", newAccessToken);
      api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
      return newAccessToken;
    }
    return null;
  } catch (err) {
    console.warn("refresh failed", err);
    // clear local auth
    localStorage.removeItem("accessToken");
    delete api.defaults.headers.common["Authorization"];
    return null;
  }
};

export const logout = async () => {
  try {
    const resp = await api.delete("/auth/logout"); 
    localStorage.removeItem("accessToken");
    delete api.defaults.headers.common["Authorization"];

    // certains serveurs répondent 200, d'autres 204, d'autres seulement clearCookie sans body
    if (resp && (resp.status === 200 || resp.status === 204)) {
      return true;
    }
    // si pas de resp (parfois clearCookie renvoie undefined), on considère succès local
    return true;
  } catch (err) {
    console.warn("logout error", err);
    // on supprime quand même localement
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    delete api.defaults.headers.common["Authorization"];
    return false;
  }
};

export const deleteAccount = async (password) => {
  try {
    const resp = await api.delete("/user/deleteProfile", {
      data: {password}
    })
    if (resp.status === 200) return true;
    return false;
  } catch (err){
    console.log(err)
    return false;
  }
}

export const comparePassword = async (password) => {
  try {
    const resp = await api.post("/user/verifyPassword", {password})
    if (resp.status === 200) return true;
    return false;
  } catch (err){
    console.log(err)
    return false;
  }
}