import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import snackService from '../services/snackService';

function AddSnackPage() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    date: today,
    description: '',
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

    if (!formData.description.trim()) {
      setError('Please enter a description for the snack');
      setLoading(false);
      return;
    }

    try {
      await snackService.createSnack(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add snack. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 bg-gradient-mesh py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="card-glass p-6 md:p-8 flex items-center justify-between">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500 tracking-tight flex items-center gap-3">
            <span className="text-4xl">🍎</span> Add Snack
          </h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Main Content */}
        <div className="card-glass p-6 md:p-10">
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-bold text-gray-700 mb-2">
                Date
              </label>
              <input
                id="date"
                name="date"
                type="date"
                required
                value={formData.date}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all font-medium text-gray-800"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-bold text-gray-700 mb-2">
                What did you eat?
              </label>
              <textarea
                id="description"
                name="description"
                required
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder="e.g., Apple with peanut butter, handful of almonds..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white resize-none transition-all font-medium text-gray-800"
              />
              <p className="mt-2 text-xs text-gray-400 font-medium">
                Describe your snack in detail (quantities, preparation).
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                disabled={loading}
                className="flex-1 px-6 py-4 rounded-xl text-gray-600 font-bold bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-800 transition-all shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`flex-[2] px-6 py-4 rounded-xl text-white font-bold transition-all shadow-md ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed text-gray-500'
                    : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:shadow-lg hover:-translate-y-0.5'
                }`}
              >
                {loading ? 'Saving...' : 'Save Snack'}
              </button>
            </div>
          </form>

          {/* Tips */}
          <div className="mt-10 p-5 bg-pink-50/50 border border-pink-100 rounded-2xl">
            <h3 className="text-sm font-bold text-pink-700 mb-3 flex items-center gap-2">
              <span>💡</span> Tips for tracking snacks
            </h3>
            <ul className="text-xs text-pink-600 space-y-2 font-medium">
              <li className="flex gap-2"><span>•</span> Be specific about quantities (e.g., "2 cookies" not just "cookies")</li>
              <li className="flex gap-2"><span>•</span> Include preparation methods (e.g., "roasted almonds" not just "almonds")</li>
              <li className="flex gap-2"><span>•</span> Note timing if relevant (e.g., "late evening chocolate")</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}

export default AddSnackPage;