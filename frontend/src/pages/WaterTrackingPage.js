import React, { useState, useEffect, useCallback } from 'react';
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

  const loadWaterData = useCallback(async () => {
    try {
      setLoading(true);
      const [logs, total] = await Promise.all([
        waterService.getWaterLogs(today),
        waterService.getTotalWater(today)
      ]);
      setWaterLogs(logs);
      setTotalWater(total.total_ml);
    } catch (error) {
      setError('Failed to load water data');
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    loadWaterData();
  }, [loadWaterData]);

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
      setError('Failed to add water log');
    }
  };

  const handleDeleteLog = async (logId) => {
    try {
      await waterService.deleteWaterLog(logId);
      await loadWaterData();
    } catch (error) {
      setError('Failed to delete water log');
    }
  };

  const quickAmounts = [250, 500, 750, 1000];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 bg-gradient-mesh flex items-center justify-center">
        <div className="card-glass p-10 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin"></div>
          <div className="text-xl font-medium text-cyan-600">Loading Water Data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 bg-gradient-mesh py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="card-glass p-6 md:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-500 tracking-tight">
              💧 Water Tracking
            </h1>
            <p className="text-gray-500 mt-1 font-medium">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
              })}
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm flex items-center gap-2"
          >
            <span>←</span> Back to Dashboard
          </button>
        </div>

        {/* Total Water Display */}
        <div className="relative overflow-hidden rounded-3xl p-8 md:p-12 mb-6 text-white text-center shadow-lg group">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-500 rounded-3xl transition-transform duration-700 group-hover:scale-105"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
          
          <div className="relative z-10">
            <p className="text-cyan-100 uppercase tracking-widest font-bold text-sm mb-3">Total Water Today</p>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-7xl font-black tracking-tighter drop-shadow-md">{totalWater.toLocaleString()}</span>
              <span className="text-2xl font-bold text-cyan-100 mb-2">ml</span>
            </div>
            <div className="mt-4 inline-block bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full font-medium text-sm">
              {(totalWater / 1000).toFixed(2)} Liters
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Add Water Form */}
          <div className="card-glass p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="bg-cyan-100 text-cyan-600 w-8 h-8 flex items-center justify-center rounded-lg text-lg">+</span> Add Water
            </h2>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
                {error}
              </div>
            )}

            {/* Quick Add Buttons */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
              {quickAmounts.map(amt => (
                <button
                  key={amt}
                  onClick={() => setAmount(amt.toString())}
                  className="p-3 border-2 border-cyan-100 bg-cyan-50/50 rounded-xl hover:border-cyan-400 hover:bg-cyan-50 hover:-translate-y-1 transition-all group"
                >
                  <p className="text-xl font-black text-cyan-600 group-hover:text-cyan-700">{amt}</p>
                  <p className="text-xs text-cyan-500 font-semibold uppercase">ml</p>
                </button>
              ))}
            </div>

            {/* Custom Amount Form */}
            <form onSubmit={handleAddWater} className="flex flex-col sm:flex-row gap-3">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Custom amount (ml)"
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white font-semibold text-gray-800 transition-all"
                min="1"
              />
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                Log It
              </button>
            </form>
          </div>

          {/* Water Logs History - side by side on desktop */}
          <div className="card-glass p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-600 w-8 h-8 flex items-center justify-center rounded-lg text-lg">🕒</span> Today's Logs
            </h2>
            
            {waterLogs.length === 0 ? (
              <div className="text-center py-10">
                <span className="text-4xl block mb-3 opacity-50">🌵</span>
                <p className="text-gray-500 font-medium">No water logged today</p>
                <p className="text-sm text-gray-400">Stay hydrated!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {waterLogs.map(log => (
                  <div key={log.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md hover:border-cyan-200 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-cyan-50 rounded-full flex items-center justify-center text-xl">💧</div>
                      <div>
                        <p className="font-bold text-gray-800">{log.amount_ml} ml</p>
                        <p className="text-xs font-medium text-gray-400">
                          {new Date(log.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      className="opacity-0 group-hover:opacity-100 px-3 py-1.5 text-xs text-red-500 font-bold bg-red-50 hover:bg-red-100 rounded-lg transition-all"
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

      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}

export default WaterTrackingPage;