import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  Send, Users, Target, Mail, Plus, Trash2, Eye, DollarSign
} from 'lucide-react';

const Marketing = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [retentionRecommendations, setRetentionRecommendations] = useState([]);
  const [campaignStats, setCampaignStats] = useState(null);

  const [newCampaign, setNewCampaign] = useState({
    name: '',
    type: 'email',
    targetAudience: 'all',
    message: '',
    discountPercentage: 0,
    startDate: '',
    endDate: '',
    targetRiders: ['rider001', 'rider002']
  });

  useEffect(() => {
    fetchCampaigns();
    fetchRetentionRecommendations();
    fetchCampaignStats();
  }, []);

  useEffect(() => {
    if (newCampaign.targetAudience === 'high-risk') {
      setNewCampaign((prev) => ({
        ...prev,
        targetRiders: retentionRecommendations.map(r => r.riderId)
      }));
    }
  }, [newCampaign.targetAudience, retentionRecommendations]);

  // ✅ Mock Campaigns
  const fetchCampaigns = () => {
    setTimeout(() => {
      setCampaigns([
        { _id: '1', name: 'Welcome Email', type: 'email', status: 'active', targetAudience: 'all', openRate: 45, clickRate: 22 },
        { _id: '2', name: 'Promo SMS', type: 'sms', status: 'scheduled', targetAudience: 'active', openRate: 60, clickRate: 30 },
        { _id: '3', name: 'Push Notification', type: 'push', status: 'completed', targetAudience: 'high-risk', openRate: 35, clickRate: 12 }
      ]);
    }, 500);
  };

  // ✅ Mock Stats
  const fetchCampaignStats = () => {
    setTimeout(() => {
      setCampaignStats({
        active: 1,
        totalReach: 1200,
        averageOpenRate: 46,
        revenue: 38000,
        email: 1,
        sms: 1,
        push: 1
      });
    }, 500);
  };

  // ✅ Mock Retention Recommendations
  const fetchRetentionRecommendations = () => {
    setTimeout(() => {
      setRetentionRecommendations([
        {
          riderId: 'rider001',
          riderName: 'John Doe',
          risk_probability: 0.82,
          recommended_actions: ['Offer 10% discount', 'Send reminder notification']
        },
        {
          riderId: 'rider002',
          riderName: 'Jane Smith',
          risk_probability: 0.76,
          recommended_actions: ['Offer loyalty points', 'Personalized message']
        }
      ]);
      setLoading(false);
    }, 500);
  };

  const handleCreateCampaign = () => {
    if (!newCampaign.name || !newCampaign.message) {
      alert('Please fill in all required fields');
      return;
    }

    const newId = Date.now().toString();
    setCampaigns(prev => [
      ...prev,
      { ...newCampaign, _id: newId, status: 'scheduled', openRate: 0, clickRate: 0 }
    ]);
    setShowCreateModal(false);
    setNewCampaign({
      name: '',
      type: 'email',
      targetAudience: 'all',
      message: '',
      discountPercentage: 0,
      startDate: '',
      endDate: '',
      targetRiders: ['rider001', 'rider002']
    });
  };

  const handleDeleteCampaign = (id) => {
    setCampaigns(campaigns.filter(c => c._id !== id));
  };

  const handleLaunchCampaign = (id) => {
    setCampaigns(campaigns.map(c => c._id === id ? { ...c, status: 'active' } : c));
  };

  const sendRetentionOffer = (riderId) => {
    alert(`Offer sent to ${riderId}`);
  };

  const getCampaignStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const COLORS = ['#4ECDC4', '#45B7D1', '#FFEAA7'];
  const campaignTypeData = campaignStats ? [
    { name: 'Email', value: campaignStats.email || 0 },
    { name: 'SMS', value: campaignStats.sms || 0 },
    { name: 'Push', value: campaignStats.push || 0 }
  ] : [];

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <Icon className="h-8 w-8" style={{ color }} />
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Marketing Dashboard</h1>
            <p className="text-gray-600">Mocked campaign and retention data</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </button>
        </div>

        {campaignStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Active Campaigns" value={campaignStats.active} icon={Target} color="#4ECDC4" />
            <StatCard title="Total Reach" value={campaignStats.totalReach.toLocaleString()} icon={Users} color="#45B7D1" />
            <StatCard title="Avg Open Rate" value={`${campaignStats.averageOpenRate}%`} icon={Mail} color="#96CEB4" />
            <StatCard title="Revenue Generated" value={`$${campaignStats.revenue.toLocaleString()}`} icon={DollarSign} color="#FFEAA7" />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Campaign Types</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={campaignTypeData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value">
                  {campaignTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Campaign Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={campaigns}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="openRate" fill="#4ECDC4" name="Open Rate %" />
                <Bar dataKey="clickRate" fill="#45B7D1" name="Click Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">All Campaigns</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Audience</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Open Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {campaigns.map((c) => (
                  <tr key={c._id}>
                    <td className="px-6 py-4 text-sm text-gray-900">{c.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{c.type}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCampaignStatusColor(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{c.targetAudience}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{c.openRate}%</td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex space-x-2">
                        <button onClick={() => setSelectedCampaign(c)} className="text-blue-600 hover:text-blue-900"><Eye className="h-4 w-4" /></button>
                        <button onClick={() => handleLaunchCampaign(c._id)} className="text-green-600 hover:text-green-900"><Send className="h-4 w-4" /></button>
                        <button onClick={() => handleDeleteCampaign(c._id)} className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Retention Table */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">High-Risk Riders</h3>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rider ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {retentionRecommendations.map((r) => (
                <tr key={r.riderId}>
                  <td className="px-6 py-4 text-sm">{r.riderId}</td>
                  <td className="px-6 py-4 text-sm">{r.riderName}</td>
                  <td className="px-6 py-4 text-sm text-red-600 font-semibold">{(r.risk_probability * 100).toFixed(1)}%</td>
                  <td className="px-6 py-4 text-sm">
                    <ul>
                      {r.recommended_actions.map((action, i) => <li key={i}>• {action}</li>)}
                    </ul>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => sendRetentionOffer(r.riderId)} className="text-blue-600 hover:text-blue-900">Send Offer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium mb-4">Create New Campaign</h3>
            <div className="space-y-4">
              <input type="text" placeholder="Campaign Name" className="w-full border p-2 rounded" value={newCampaign.name} onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })} />
              <textarea placeholder="Message" className="w-full border p-2 rounded" rows="3" value={newCampaign.message} onChange={(e) => setNewCampaign({ ...newCampaign, message: e.target.value })} />
              <input type="number" placeholder="Discount (%)" className="w-full border p-2 rounded" value={newCampaign.discountPercentage} onChange={(e) => setNewCampaign({ ...newCampaign, discountPercentage: Number(e.target.value) })} />
              <select className="w-full border p-2 rounded" value={newCampaign.targetAudience} onChange={(e) => setNewCampaign({ ...newCampaign, targetAudience: e.target.value })}>
                <option value="all">All Riders</option>
                <option value="active">Active Riders</option>
                <option value="inactive">Inactive Riders</option>
                <option value="high-risk">High Churn Risk</option>
              </select>
              <div className="flex justify-end space-x-2">
                <button className="bg-gray-300 px-4 py-2 rounded" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleCreateCampaign}>Create</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketing;
