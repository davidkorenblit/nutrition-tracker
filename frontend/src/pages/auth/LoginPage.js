import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

function LoginPage() {
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
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 bg-gradient-mesh flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full card-glass p-10">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-lg shadow-indigo-200 transform -rotate-6 group-hover:rotate-0 transition-transform">
            <span className="text-4xl text-white font-black drop-shadow-md">N</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Nutrition Tracker</h1>
          <p className="mt-2 text-sm font-medium text-gray-500">Sign in to your account</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm font-medium text-center animate-fadeIn">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">Email</label>
            <input
              id="email" name="email" type="email" required
              value={formData.email} onChange={handleChange}
              className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-gray-800 transition-all focus:bg-white"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">Password</label>
            <input
              id="password" name="password" type="password" required
              value={formData.password} onChange={handleChange}
              className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-gray-800 transition-all focus:bg-white"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit" disabled={loading}
            className={`w-full flex justify-center py-3.5 px-4 rounded-xl text-white font-bold transition-all shadow-md ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-primary hover:shadow-lg hover:-translate-y-0.5'
            }`}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col items-center gap-4">
          <p className="text-sm font-medium text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/register')}
              className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              Register here
            </button>
          </p>
          
          <button
            onClick={() => navigate('/admin-login')}
            className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
          >
            Admin Access
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

export default LoginPage;