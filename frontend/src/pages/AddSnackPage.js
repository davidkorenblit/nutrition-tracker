import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import snackService from '../services/snackService';

function AddSnackPage() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

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

    // Validation
    if (!formData.description.trim()) {
      setError('Please enter a description for the snack');
      setLoading(false);
      return;
    }

    try {
      await snackService.createSnack(formData);
      // הצלחה - חזרה ל-Dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Error creating snack:', err);
      setError(err.response?.data?.detail || 'Failed to add snack. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Add Snack</h1>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                id="date"
                name="date"
                type="date"
                required
                value={formData.date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                What did you eat?
              </label>
              <textarea
                id="description"
                name="description"
                required
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder="e.g., Apple with peanut butter, handful of almonds, chocolate bar..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <p className="mt-2 text-sm text-gray-500">
                Describe your snack in detail
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 py-3 px-4 rounded-lg text-white font-medium ${
                  loading
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                }`}
              >
                {loading ? 'Saving...' : 'Save Snack'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                disabled={loading}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>

          {/* Tips */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Tips for tracking snacks</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Be specific about quantities (e.g., "2 cookies" not just "cookies")</li>
              <li>• Include preparation methods (e.g., "roasted almonds" not just "almonds")</li>
              <li>• Note timing if relevant (e.g., "late evening chocolate")</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddSnackPage;