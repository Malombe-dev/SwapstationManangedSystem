
// frontend/src/hooks/useRiders.js
import { useState, useEffect } from 'react';
import ApiService from '../services/api';

export const useRiders = () => {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRiders = async (params = {}) => {
    try {
      setLoading(true);
      const response = await ApiService.getRiders(params);
      setRiders(response.riders || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addRider = async (riderData) => {
    try {
      const response = await ApiService.createRider(riderData);
      setRiders(prev => [...prev, response.rider]);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateRider = async (id, riderData) => {
    try {
      const response = await ApiService.updateRider(id, riderData);
      setRiders(prev => prev.map(rider => 
        rider._id === id ? response.rider : rider
      ));
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteRider = async (id) => {
    try {
      await ApiService.deleteRider(id);
      setRiders(prev => prev.filter(rider => rider._id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchRiders();
  }, []);

  return {
    riders,
    loading,
    error,
    fetchRiders,
    addRider,
    updateRider,
    deleteRider
  };
};