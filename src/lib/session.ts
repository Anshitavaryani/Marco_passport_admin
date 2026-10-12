/** @format */

import axios from "axios";

export const clearSession = () => {
  localStorage.removeItem("token");
  sessionStorage.clear();
};

// The backend answers 401 for an invalid/expired token, a deactivated admin or
// a role that isn't allowed, and 400 "Access denied: No token provided" when
// the header is missing. Either way the session is unusable: back to login.
export const installSessionInterceptor = () => {
  axios.interceptors.response.use(
    (res) => res,
    (err) => {
      const status = err?.response?.status;
      const message: string = err?.response?.data?.message || "";
      const noToken = status === 400 && /no token provided/i.test(message);

      if ((status === 401 || noToken) && window.location.pathname !== "/") {
        clearSession();
        window.location.href = "/?sessionExpired=true";
      }
      return Promise.reject(err);
    },
  );
};
