import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';
import { 
  TrendingUp, Users, AlertTriangle, CreditCard, 
  BarChart3, Calendar, Download, RefreshCw 
} from 'lucide-react';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [trends, setTrends] = useState(null);
  const [churnPredictions, setChurnPredictions] = useState([]);
  const [demandForecast, setDemandForecast] = useState([]);
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    
    // Check if environment variable is set
    const baseUrl = process.env.REACT_APP_ML_SERVICE_URL;
    
    if (!baseUrl) {
      setError('ML Service URL not configured. Please set REACT_APP_ML_SERVICE_URL in your .env file.');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching from base URL:', baseUrl);

      // Helper function to make API calls with better error handling
      const fetchWithErrorHandling = async (endpoint) => {
        const url = `${baseUrl}${endpoint}`;
        console.log(`Fetching: ${url}`);
        
        const response = await fetch(url);
        
        // Check if response is ok
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Non-JSON response:', text.substring(0, 200));
          throw new Error('Server returned non-JSON response');
        }
        
        return response.json();
      };

      // Fetch all data with individual error handling
      const results = await Promise.allSettled([
        fetchWithErrorHandling('/analytics/summary'),
        fetchWithErrorHandling(`/analytics/trends?days=${timeRange}`),
        fetchWithErrorHandling('/predict/churn'),
        fetchWithErrorHandling('/forecast/demand?days=7')
      ]);

      // Process results
      const [summaryResult, trendsResult, churnResult, forecastResult] = results;

      if (summaryResult.status === 'fulfilled') {
        setAnalyticsData(summaryResult.value.summary || summaryResult.value);
      } else {
        console.error('Summary fetch failed:', summaryResult.reason);
      }

      if (trendsResult.status === 'fulfilled') {
        setTrends(trendsResult.value.trends || trendsResult.value);
      } else {
        console.error('Trends fetch failed:', trendsResult.reason);
      }

      if (churnResult.status === 'fulfilled') {
        setChurnPredictions(churnResult.value.predictions || churnResult.value || []);
      } else {
        console.error('Churn fetch failed:', churnResult.reason);
      }

      if (forecastResult.status === 'fulfilled') {
        setDemandForecast(forecastResult.value.forecast || forecastResult.value || []);
      } else {
        console.error('Forecast fetch failed:', forecastResult.reason);
      }

      // Check if all requests failed
      const allFailed = results.every(result => result.status === 'rejected');
      if (allFailed) {
        throw new Error('All API endpoints failed. Please check if the ML service is running.');
      }

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError(error.message || 'Failed to fetch analytics data');
      
      // Set mock data for development
      setMockData();
    } finally {
      setLoading(false);
    }
  };

  // Mock data for development/testing
  const setMockData = () => {
    console.log('Using mock data for development');
    
    setAnalyticsData({
      total_riders: 1250,
      churn_risk: {
        high: 45,
        medium: 120,
        low: 1085
      },
      recent_activity: {
        daily_average: 85
      },
      payment_stats: {
        success_rate: 94.5
      }
    });

    setTrends({
      daily_swaps: [
        { _id: '2024-01-01', count: 120 },
        { _id: '2024-01-02', count: 135 },
        { _id: '2024-01-03', count: 98 },
        { _id: '2024-01-04', count: 145 },
        { _id: '2024-01-05', count: 162 },
        { _id: '2024-01-06', count: 140 },
        { _id: '2024-01-07', count: 128 }
      ]
    });

    setChurnPredictions([
      { riderId: 'R001', risk: 'high', probability: 0.85 },
      { riderId: 'R002', risk: 'high', probability: 0.78 },
      { riderId: 'R003', risk: 'high', probability: 0.82 },
      { riderId: 'R004', risk: 'medium', probability: 0.65 },
      { riderId: 'R005', risk: 'high', probability: 0.90 }
    ]);

    setDemandForecast([
      { date: '2024-01-08', predicted_swaps: 145, lower_bound: 120, upper_bound: 170 },
      { date: '2024-01-09', predicted_swaps: 152, lower_bound: 125, upper_bound: 179 },
      { date: '2024-01-10', predicted_swaps: 138, lower_bound: 115, upper_bound: 161 },
      { date: '2024-01-11', predicted_swaps: 165, lower_bound: 140, upper_bound: 190 },
      { date: '2024-01-12', predicted_swaps: 158, lower_bound: 133, upper_bound: 183 },
      { date: '2024-01-13', predicted_swaps: 142, lower_bound: 118, upper_bound: 166 },
      { date: '2024-01-14', predicted_swaps: 149, lower_bound: 124, upper_bound: 174 }
    ]);
  };

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '+' : ''}{trend}% from last period
            </p>
          )}
        </div>
        <Icon className="h-8 w-8" style={{ color }} />
      </div>
    </div>
  );

  const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-lg">Loading analytics...</span>
      </div>
    );
  }

  if (error && !analyticsData) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-red-800">Error Loading Analytics</h3>
                <p className="text-red-600 mt-1">{error}</p>
                <div className="mt-4">
                  <button 
                    onClick={fetchAnalyticsData}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 mr-3"
                  >
                    Retry
                  </button>
                  <button 
                    onClick={() => {
                      setError(null);
                      setMockData();
                    }}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                  >
                    Use Mock Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const churnRiskData = analyticsData ? [
    { name: 'High Risk', value: analyticsData.churn_risk?.high || 0, color: '#FF6B6B' },
    { name: 'Medium Risk', value: analyticsData.churn_risk?.medium || 0, color: '#FFEAA7' },
    { name: 'Low Risk', value: analyticsData.churn_risk?.low || 0, color: '#96CEB4' }
  ] : [];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600">Comprehensive insights into rider behavior and system performance</p>
            {error && (
              <p className="text-yellow-600 text-sm mt-1">
                ⚠️ Some data may be incomplete due to API issues
              </p>
            )}
          </div>
          <div className="flex space-x-3">
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button 
              onClick={fetchAnalyticsData}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
            <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        {analyticsData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Riders"
              value={analyticsData.total_riders?.toLocaleString() || 'N/A'}
              icon={Users}
              color="#4ECDC4"
            />
            <StatCard
              title="High Churn Risk"
              value={analyticsData.churn_risk?.high || 'N/A'}
              icon={AlertTriangle}
              color="#FF6B6B"
            />
            <StatCard
              title="Daily Avg Swaps"
              value={analyticsData.recent_activity?.daily_average || 'N/A'}
              icon={TrendingUp}
              color="#45B7D1"
            />
            <StatCard
              title="Payment Success Rate"
              value={analyticsData.payment_stats?.success_rate ? `${analyticsData.payment_stats.success_rate}%` : 'N/A'}
              icon={CreditCard}
              color="#96CEB4"
            />
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Churn Risk Distribution */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Churn Risk Distribution</h3>
            {churnRiskData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={churnRiskData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {churnRiskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                No churn risk data available
              </div>
            )}
          </div>

          {/* Swap Trends */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Daily Swap Activity</h3>
            {trends && trends.daily_swaps && trends.daily_swaps.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends.daily_swaps}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#4ECDC4" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                No swap trend data available
              </div>
            )}
          </div>
        </div>

        {/* Demand Forecast */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">7-Day Demand Forecast</h3>
          {demandForecast && demandForecast.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={demandForecast}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="predicted_swaps" fill="#45B7D1" name="Predicted Swaps" />
                <Bar dataKey="lower_bound" fill="#96CEB4" name="Lower Bound" />
                <Bar dataKey="upper_bound" fill="#FFEAA7" name="Upper Bound" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No demand forecast data available
            </div>
          )}
        </div>

        {/* High Risk Riders Table */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">High Risk Riders</h3>
          {churnPredictions && churnPredictions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rider ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Probability
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {churnPredictions
                    .filter(rider => rider.risk === 'high')
                    .slice(0, 10)
                    .map((rider, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {rider.riderId || rider.rider_id || `Rider ${index + 1}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            {rider.risk}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {((rider.probability || 0) * 100).toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button className="text-blue-600 hover:text-blue-900">
                            Send Retention Offer
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No high-risk riders data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;