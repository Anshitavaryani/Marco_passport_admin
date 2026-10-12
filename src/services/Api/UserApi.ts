/** @format */

import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://api.themarcopassport.com/api/v1/";

// These admin routes now require the admin token like every other admin call.
const authHeaders = () => ({
  "x-access-token": localStorage.getItem("token") || "",
});

export const GetAllUsersAPI = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
}) => {
  return axios.get(`${API_BASE_URL}admin/user`, {
    params,
    headers: authHeaders(),
  });
};

export const DeleteUserAPI = async (user_id: number[]) => {
  return axios.post(`${API_BASE_URL}admin/user`, { user_id }, { headers: authHeaders() });
};

export const GetUserDetailsAPI = async (userId: number) => {
  return axios.get(`${API_BASE_URL}admin/user/${userId}`, { headers: authHeaders() });
};
