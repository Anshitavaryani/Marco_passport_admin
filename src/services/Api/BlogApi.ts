import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://api.themarcopassport.com/api/v1/";

export const GetBlogsAPI = (params: { token: string; page?: number; limit?: number; search?: string }) => {
  const { token, ...query } = params;
  return axios.get(`${API_BASE_URL}blog`, {
    headers: { "x-access-token": token },
    params: query,
  });
};

export const GetBlogByIdAPI = (id: string | number, token: string) => {
  return axios.get(`${API_BASE_URL}blog/${id}`, {
    headers: { "x-access-token": token },
  });
};

export const AddBlogAPI = (formData: FormData, token: string) => {
  return axios.post(`${API_BASE_URL}blog`, formData, {
    headers: {
      "x-access-token": token,
      "Content-Type": "multipart/form-data",
    },
  });
};

export const UpdateBlogAPI = (id: string | number, formData: FormData, token: string) => {
  return axios.put(`${API_BASE_URL}blog/${id}`, formData, {
    headers: {
      "x-access-token": token,
      "Content-Type": "multipart/form-data",
    },
  });
};

export const DeleteBlogAPI = (id: string | number, token: string) => {
  return axios.delete(`${API_BASE_URL}blog/${id}`, {
    headers: { "x-access-token": token },
  });
};