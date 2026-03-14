import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
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
    setSuccess(false);
    setLoading(true);

    try {
      await authService.register(formData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 5000);
    } catch (err) {
      const errorMessage = err.response?.data?.detail;
      if (Array.isArray(errorMessage)) {
        const errors = errorMessage.map(e => e.msg).join(', ');
        setError(errors);
      } else {
        setError(errorMessage || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 bg-gradient-mesh flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full card-glass p-10 animate-fadeIn">
          <div className="text-center">
            <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center border-4 border-emerald-100 mx-auto mb-6">
              <span className="text-5xl drop-shadow-sm">📧</span>
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-6 tracking-tight">
              Registration Successful!
            </h2>
            <div className="bg-emerald-50/50 border border-emerald-200 text-emerald-800 p-5 rounded-2xl mb-8">
              <p className="font-bold mb-3 text-lg">Please verify your email</p>
              <p className="text-sm font-medium leading-relaxed">
                We've sent a verification link to <br/>
                <strong className="text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md mt-1 inline-block">{formData.email}</strong>
              </p>
              <p className="text-xs font-bold mt-4 text-emerald-600 uppercase tracking-widest">
                Check your inbox
              </p>
            </div>
            <p className="text-sm font-medium text-gray-500 mb-6 flex items-center justify-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin"></span>
              Redirecting to login...
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full px-4 py-3 bg-gradient-primary text-white font-bold rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-md"
            >
              Go to Login Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 bg-gradient-mesh flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full card-glass p-10">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-tr from-emerald-400 to-teal-500 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-lg shadow-emerald-200 transform hover:rotate-6 transition-transform">
            <span className="text-4xl text-white font-black drop-shadow-md">+</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Join Us</h1>
          <p className="mt-2 text-sm font-medium text-gray-500">Create your new account</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm font-medium animate-fadeIn">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
            <input
              id="name" name="name" type="text" required
              value={formData.name} onChange={handleChange}
              className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-gray-800 transition-all focus:bg-white"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">Email</label>
            <input
              id="email" name="email" type="email" required
              value={formData.email} onChange={handleChange}
              className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-gray-800 transition-all focus:bg-white"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">Password</label>
            <input
              id="password" name="password" type="password" required minLength="8"
              value={formData.password} onChange={handleChange}
              className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-gray-800 transition-all focus:bg-white"
              placeholder="••••••••"
            />
            <div className="mt-3 p-3 bg-gray-50 border border-gray-100 rounded-xl">
              <p className="text-xs font-bold text-gray-600 mb-2">Password requirements:</p>
              <ul className="text-xs font-medium text-gray-500 space-y-1 grid grid-cols-2 gap-x-2">
                <li className="flex gap-1 items-center"><span className="text-emerald-500 font-bold">•</span> 8+ chars</li>
                <li className="flex gap-1 items-center"><span className="text-emerald-500 font-bold">•</span> Uppercase</li>
                <li className="flex gap-1 items-center"><span className="text-emerald-500 font-bold">•</span> Lowercase</li>
                <li className="flex gap-1 items-center"><span className="text-emerald-500 font-bold">•</span> Number</li>
                <li className="flex gap-1 items-center col-span-2"><span className="text-emerald-500 font-bold">•</span> Special char (!@#$%^&*)</li>
              </ul>
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className={`w-full flex justify-center py-3.5 px-4 rounded-xl text-white font-bold transition-all shadow-md ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-lg hover:-translate-y-0.5'
            }`}
          >
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm font-medium text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="font-bold text-emerald-600 hover:text-emerald-500 transition-colors"
            >
              Sign in
            </button>
          </p>
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

export default RegisterPage;