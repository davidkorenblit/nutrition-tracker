import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import waterService from '../services/waterService';

function WaterTrackingPage() {
  const navigate = useNavigate();
  const [waterLogs, setWaterLogs] = useState([]);
  const [totalWater, setTotalWater] = useState(0);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadWaterData();
  }, []);

  const loadWaterData = async () => {
    try {
      setLoading(true);
      const [logs, total] = await Promise.all([
        waterService.getWaterLogs(today),
        waterService.getTotalWater(today)
      ]);
      setWaterLogs(logs);
      setTotalWater(total.total_ml);
    } catch (error) {
      console.error('Failed to load water data:', error);
      setError('Failed to load water data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWater = async (e) => {
    e.preventDefault();
    
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      await waterService.createWaterLog(parseFloat(amount));
      setAmount('');
      setError('');
      await loadWaterData();
    } catch (error) {
      console.error('Failed to add water:', error);
      setError('Failed to add water log');
    }
  };

  const handleDeleteLog = async (logId) => {
    try {
      await waterService.deleteWaterLog(logId);
      await loadWaterData();
    } catch (error) {
      console.error('Failed to delete water log:', error);
      setError('Failed to delete water log');
    }
  };

  const quickAmounts = [250, 500, 750, 1000];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-xl text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">💧 Water Tracking</h1>
              <p className="text-gray-600 mt-1">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Total Water Display */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg shadow-md p-8 mb-6 text-white">
          <div className="text-center">
            <p className="text-lg mb-2">Total Water Today</p>
            <p className="text-6xl font-bold">{totalWater.toLocaleString()}</p>
            <p className="text-2xl mt-2">ml</p>
            <div className="mt-4 text-sm">
              <p>{(totalWater / 1000).toFixed(2)} liters</p>
            </div>
          </div>
        </div>

        {/* Add Water Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Water</h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Quick Add Buttons */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {quickAmounts.map(amt => (
              <button
                key={amt}
                onClick={() => setAmount(amt.toString())}
                className="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
              >
                <p className="text-2xl font-bold text-blue-600">{amt}</p>
                <p className="text-xs text-gray-600">ml</p>
              </button>
            ))}
          </div>

          {/* Custom Amount Form */}
          <form onSubmit={handleAddWater} className="flex gap-3">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount (ml)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add
            </button>
          </form>
        </div>

        {/* Water Logs History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Today's Logs</h2>
          
          {waterLogs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No water logged today</p>
          ) : (
            <div className="space-y-3">
              {waterLogs.map(log => (
                <div key={log.id} className="flex items-center justify-between p-4 border rounded hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">💧</span>
                    <div>
                      <p className="font-semibold text-gray-800">{log.amount_ml} ml</p>
                      <p className="text-sm text-gray-500">
                        {new Date(log.logged_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteLog(log.id)}
                    className="px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default WaterTrackingPage;