import axios from "axios";
import { useAppContext } from "../../../context/AppContext";

const useAddressService = () => {
  const { backendUrl, token } = useAppContext();
  const API = `${backendUrl}/api/address`;

  const headers = {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };

  const addAddress = async (data) => (await axios.post(API, data, headers)).data;
  const getAddresses = async () => (await axios.get(API, headers)).data;
  const updateAddress = async (id, data) =>
    (await axios.put(`${API}/${id}`, data, headers)).data;
  const deleteAddress = async (id) =>
    (await axios.delete(`${API}/${id}`, headers)).data;

  return { addAddress, getAddresses, updateAddress, deleteAddress };
};

export default useAddressService;
