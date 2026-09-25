import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://api.themarcopassport.com/api/v1/";

export const GetBusinessesAPI = (params: {
  token: string;
  page?: number;
  limit?: number;
  search?: string;
}) => {
  const { token, ...query } = params;
  return axios.get(`${API_BASE_URL}explore/admin`, {
    headers: { "x-access-token": token },
    params: { ...query, type: "business" },
  });
};

export const GetBusinessByIdAPI = (id: string | number, token: string) => {
  return axios.get(`${API_BASE_URL}explore/admin/${id}`, {
    headers: { "x-access-token": token },
  });
};

export const AddBusinessAPI = (formData: FormData, token: string) => {
  return axios.post(`${API_BASE_URL}explore/admin`, formData, {
    headers: {
      "x-access-token": token,
      "Content-Type": "multipart/form-data",
    },
  });
};

export const UpdateBusinessAPI = (id: string | number, formData: FormData, token: string) => {
  return axios.put(`${API_BASE_URL}explore/admin/${id}`, formData, {
    headers: {
      "x-access-token": token,
      "Content-Type": "multipart/form-data",
    },
  });
};

export const DeleteBusinessAPI = (id: string | number, token: string) => {
  return axios.delete(`${API_BASE_URL}explore/admin/${id}`, {
    headers: { "x-access-token": token },
  });
};

export const GetBusinessCategoriesAPI = (token: string) => {
  return axios.get(`${API_BASE_URL}place-category`, {
    headers: { "x-access-token": token },
    params: { type: "business" },
  });
};

export const AddBusinessCategoryAPI = (formData: FormData, token: string) => {
  // formData.append("type", "business");
  return axios.post(`${API_BASE_URL}place-category`, formData, {
    headers: {
      "x-access-token": token,
      "Content-Type": "multipart/form-data",
    },
  });
};

export const UpdateBusinessCategoryAPI = (
  id: string | number,
  formData: FormData,
  token: string
) => {
  return axios.put(`${API_BASE_URL}place-category/${id}`, formData, {
    headers: {
      "x-access-token": token,
      "Content-Type": "multipart/form-data",
    },
  });
};

export const DeleteBusinessCategoryAPI = (id: string | number, token: string) => {
  return axios.delete(`${API_BASE_URL}place-category/${id}`, {
    headers: { "x-access-token": token },
  });
};