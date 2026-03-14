import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

function AdminLoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login(formData);
      const user = await authService.getProfile();
      
      if (user.role !== 'admin') {
        authService.logout();
        setError('Access denied. Admin privileges required.');
        setLoading(false);
        return;
      }
      
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.detail || 'Admin login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 bg-gradient-mesh flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Decorative Background Element for Admin View */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-rose-500 opacity-5 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-red-500 opacity-5 blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full card-glass p-10 relative z-10 border-t-4 border-t-rose-500">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-red-600 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-lg shadow-rose-200 transform hover:scale-105 transition-transform">
            <span className="text-4xl text-white font-black drop-shadow-md">🛡️</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">System Admin</h1>
          <p className="mt-2 text-sm font-bold text-rose-600 uppercase tracking-widest bg-rose-50 inline-block px-3 py-1 rounded-full border border-rose-100">
            Admin Access Only
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm font-bold text-center animate-fadeIn shadow-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label htmlFor="email" className="block text-sm font-black text-gray-700 mb-2">Email</label>
            <input
              id="email" name="email" type="email" required dir="ltr"
              value={formData.email} onChange={handleChange}
              className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium text-gray-800 transition-all focus:bg-white text-left"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-black text-gray-700 mb-2">Password</label>
            <input
              id="password" name="password" type="password" required dir="ltr"
              value={formData.password} onChange={handleChange}
              className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium text-gray-800 transition-all focus:bg-white text-left"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit" disabled={loading}
            className={`w-full flex justify-center py-3.5 px-4 rounded-xl text-white font-black tracking-wide transition-all shadow-md mt-8 ${
              loading ? 'bg-gray-400 cursor-not-allowed text-gray-200' : 'bg-gradient-to-r from-rose-500 to-red-600 hover:shadow-lg hover:-translate-y-0.5'
            }`}
          >
            {loading ? 'Signing in...' : 'Sign In as Admin'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <span>←</span> Back to User Login
          </button>
        </div>

      </div>

      <style jsx="true">{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default AdminLoginPage;
