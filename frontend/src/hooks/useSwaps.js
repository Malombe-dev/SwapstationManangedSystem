// frontend/src/hooks/useSwaps.js
import { useState, useEffect } from 'react';
import ApiService from '../services/api';

export const useSwaps = (riderId = null) => {
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSwaps = async (params = {}) => {
    try {
      setLoading(true);
      let response;
      if (riderId) {
        response = await ApiService.getSwapsByRider(riderId);
      } else {
        response = await ApiService.getSwaps(params);
      }
      setSwaps(response.swaps || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addSwap = async (swapData) => {
    try {
      const response = await ApiService.createSwap(swapData);
      setSwaps(prev => [response.swap, ...prev]);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchSwaps();
  }, [riderId]);

  return {
    swaps,
    loading,
    error,
    fetchSwaps,
    addSwap
  };
};