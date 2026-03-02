import type { AxiosInstance } from "axios";
import { parseErrorHoundError } from "./parse-error";

export function registerErrorHoundInterceptor(axios: AxiosInstance) {
  axios.interceptors.response.use(
    (res) => res,
    (err) => Promise.reject(parseErrorHoundError(err))
  );
}
