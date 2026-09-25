import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://api.themarcopassport.com/api/v1/";

export const GetBlogCategoriesAPI = (token: string) => {
  return axios.get(`${API_BASE_URL}blog-category`, {
    headers: { "x-access-token": token },
  });
};

export const AddBlogCategoryAPI = (data: { name: string }, token: string) => {
  return axios.post(`${API_BASE_URL}blog-category`, data, {
    headers: { "x-access-token": token },
  });
};

export const UpdateBlogCategoryAPI = (id: string | number, data: { name: string }, token: string) => {
  return axios.put(`${API_BASE_URL}blog-category/${id}`, data, {
    headers: { "x-access-token": token },
  });
};

export const DeleteBlogCategoryAPI = (id: string | number, token: string) => {
  return axios.delete(`${API_BASE_URL}blog-category/${id}`, {
    headers: { "x-access-token": token },
  });
};