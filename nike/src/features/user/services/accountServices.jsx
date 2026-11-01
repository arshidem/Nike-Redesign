import axios from "axios";
import { useAppContext } from "../../../context/AppContext";
export default function useAccountService() {
  const { backendUrl, token } = useAppContext();
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const get = async (path) =>
    (await axios.get(`${backendUrl}/api/${path}`, config)).data;
  return {
    getPreferences: () => get("auth/preferences"),
    savePreferences: async (data) =>
      (await axios.put(`${backendUrl}/api/auth/preferences`, data, config))
        .data,
    exportData: () => get("auth/data"),
    getOffers: () => get("coupons/available"),
    getSupport: () => get("support"),
    submitSupport: async (data) =>
      (await axios.post(`${backendUrl}/api/support`, data, config)).data,
    getAdminSupport: () => get("support/admin"),
    updateSupport: async (id, status) =>
      (
        await axios.patch(
          `${backendUrl}/api/support/${id}/status`,
          { status },
          config,
        )
      ).data,
  };
}
