// frontend/src/hooks/useAnalytics.js
import { useState, useEffect } from 'react';
import ApiService from '../services/api';

export const useAnalytics = () => {
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    swapTrends: [],
    churnAnalysis: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getDashboardStats();
      setDashboardData(response);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchChurnPrediction = async () => {
    try {
      const response = await ApiService.getChurnPrediction();
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const fetchSwapForecast = async (params = {}) => {
    try {
      const response = await ApiService.getSwapForecast(params);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Set up polling for real-time updates
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  return {
    dashboardData,
    loading,
    error,
    fetchDashboardData,
    fetchChurnPrediction,
    fetchSwapForecast
  };
};