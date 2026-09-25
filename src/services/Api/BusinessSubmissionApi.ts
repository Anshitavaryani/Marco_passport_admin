import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://api.themarcopassport.com/api/v1/";

export const GetBusinessSubmissionsAPI = (token: string) => {
  return axios.get(`${API_BASE_URL}business-submission`, {
    headers: { "x-access-token": token },
  });
};

export const GetBusinessSubmissionByIdAPI = (id: string | number, token: string) => {
  return axios.get(`${API_BASE_URL}business-submission/${id}`, {
    headers: { "x-access-token": token },
  });
};