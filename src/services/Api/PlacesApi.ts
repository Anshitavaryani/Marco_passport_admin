import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://api.themarcopassport.com/api/v1/";

export const GetPlacesAPI = (params: {
  token: string;
  page?: number;
  limit?: number;
  search?: string;
}) => {
  const { token, ...query } = params;
  return axios.get(`${API_BASE_URL}explore/admin`, {
    headers: { "x-access-token": token },
    params: { ...query, type: "place" },
  });
};

export const GetPlaceByIdAPI = (id: string | number, token: string) => {
  return axios.get(`${API_BASE_URL}explore/admin/${id}`, {
    headers: { "x-access-token": token },
  });
};

export const AddPlaceAPI = (formData: FormData, token: string) => {
  return axios.post(`${API_BASE_URL}explore/admin`, formData, {
    headers: {
      "x-access-token": token,
      "Content-Type": "multipart/form-data",
    },
  });
};

export const UpdatePlaceAPI = (id: string | number, formData: FormData, token: string) => {
  return axios.put(`${API_BASE_URL}explore/admin/${id}`, formData, {
    headers: {
      "x-access-token": token,
      "Content-Type": "multipart/form-data",
    },
  });
};

export const DeletePlaceAPI = (id: string | number, token: string) => {
  return axios.delete(`${API_BASE_URL}explore/admin/${id}`, {
    headers: { "x-access-token": token },
  });
};

// --- Place Categories (type: "place") ---------------------------------
// Kept in this same file rather than a separate PlaceCategoryApi.ts —
// mirrors how the /places page itself already calls these endpoints.

export const GetPlaceCategoriesAPI = (token: string) => {
  return axios.get(`${API_BASE_URL}place-category`, {
    headers: { "x-access-token": token },
    params: { type: "place" },
  });
};


export const AddPlaceCategoryAPI = (formData: FormData, token: string) => {
  formData.append("type", "place");
  return axios.post(`${API_BASE_URL}place-category`, formData, {
    headers: {
      "x-access-token": token,
      "Content-Type": "multipart/form-data",
    },
  });
};

export const UpdatePlaceCategoryAPI = (
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

export const DeletePlaceCategoryAPI = (id: string | number, token: string) => {
  return axios.delete(`${API_BASE_URL}place-category/${id}`, {
    headers: { "x-access-token": token },
  });
};