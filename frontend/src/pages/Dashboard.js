import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Users, TrendingUp, Battery, DollarSign, AlertTriangle } from 'lucide-react';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [churnData, setChurnData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    fetchChurnData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await analyticsAPI.getDashboard();
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChurnData = async () => {
    try {
      const response = await analyticsAPI.getChurnPredictions();
      setChurnData(response.data.data);
    } catch (error) {
      console.error('Error fetching churn data:', error);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Rider Management Dashboard</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Riders</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData?.summary?.totalRiders || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Riders</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData?.summary?.activeRiders || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Battery className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Swaps Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData?.summary?.totalSwapsToday || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${dashboardData?.summary?.monthlyRevenue || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Rider Growth Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Rider Growth Trend</h3>
          <LineChart width={500} height={300} data={dashboardData?.riderGrowth || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="_id" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="newRiders" stroke="#8884d8" activeDot={{ r: 8 }} />
          </LineChart>
        </div>

        {/* Churn Risk Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Churn Risk Distribution</h3>
          <PieChart width={500} height={300}>
            <Pie
              data={churnData}
              cx={250}
              cy={150}
              labelLine={false}
              label={({ _id, count }) => `${_id}: ${count}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {churnData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>
      </div>

      {/* Top Locations */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Performing Locations</h3>
        <BarChart width={800} height={300} data={dashboardData?.topLocations || []}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="_id" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="swapCount" fill="#8884d8" />
          <Bar dataKey="revenue" fill="#82ca9d" />
        </BarChart>
      </div>

      {/* High Risk Riders Alert */}
      {churnData.find(item => item._id === 'high')?.count > 0 && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h4 className="ml-2 text-red-800 font-semibold">High Churn Risk Alert</h4>
          </div>
          <p className="text-red-700 mt-2">
            {churnData.find(item => item._id === 'high')?.count} riders are at high risk of churning. 
            Consider immediate retention campaigns.
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;