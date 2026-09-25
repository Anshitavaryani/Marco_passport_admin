/** @format */

import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://api.themarcopassport.com/api/v1/";

export const GetAllUsersAPI = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
}) => {
  return axios.get(`${API_BASE_URL}admin/user`, {
    params,
  });
};

export const DeleteUserAPI = async (user_id: number[]) => {
  return axios.post(`${API_BASE_URL}admin/user`, { user_id });
};

export const GetUserDetailsAPI = async (userId: number) => {
  return axios.get(`${API_BASE_URL}admin/user/${userId}`, {});
};
