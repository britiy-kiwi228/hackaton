import httpClient from './httpClient';

const getRequests = async () => {
  try {
    const response = await httpClient.get('/requests');
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getSentRequests = async () => {
  try {
    const response = await httpClient.get('/requests/sent');
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getReceivedRequests = async () => {
  try {
    const response = await httpClient.get('/requests/received');
    return response.data;
  } catch (error) {
    throw error;
  }
};

const updateRequest = async (id, data) => {
  try {
    const response = await httpClient.put(`/requests/${id}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const deleteRequest = async (id) => {
  try {
    const response = await httpClient.delete(`/requests/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export { getRequests, getSentRequests, getReceivedRequests, updateRequest, deleteRequest };
