/** @format */

import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://api.themarcopassport.com/api/v1/";

export const GetAllAdminsAPI = (params: {
  token: string;
  page?: number;
  limit?: number;
  search?: string;
}) => {
  const { token, ...query } = params;
  return axios.get(`${API_BASE_URL}admin/auth/all`, {
    headers: { "x-access-token": token },
    params: query,
  });
};

export const GetAdminByIdAPI = (id: number | string, token: string) => {
  // matches router.get("/:id", ...) — NOT "/findAdminById/:id", which
  // doesn't exist in the router and would 404
  return axios.get(`${API_BASE_URL}admin/auth/${id}`, {
    headers: { "x-access-token": token },
  });
};

// The backend generates a temporary password and emails it to the new admin.
// It refuses the Super Admin role here.
export const AddAdminAPI = (
  data: { name: string; email: string; role_id: number; department_id: number },
  token: string,
) => {
  return axios.post(`${API_BASE_URL}admin/auth/register`, data, {
    headers: { "x-access-token": token },
  });
};

export const UpdateAdminAPI = (
  id: number | string,
  data: { name?: string; role_id?: number },
  token: string,
) => {
  return axios.put(`${API_BASE_URL}admin/auth/${id}`, data, {
    headers: { "x-access-token": token },
  });
};

// Super admin only.
export const GetRolesAPI = (token: string) => {
  return axios.get(`${API_BASE_URL}role`, {
    headers: { "x-access-token": token },
  });
};

export const GetDepartmentsAPI = (token: string) => {
  return axios.get(`${API_BASE_URL}department`, {
    headers: { "x-access-token": token },
  });
};

export const DeleteAdminAPI = (id: number | string, token: string) => {
  return axios.delete(`${API_BASE_URL}admin/auth/${id}`, {
    headers: { "x-access-token": token },
  });
};
