import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import authService from '../../services/authService';
import mealService from '../../services/mealService';
import snackService from '../../services/snackService';
import waterService from '../../services/waterService';

function AdminClientView() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [client, setClient] = useState(null);
  const [meals, setMeals] = useState([]);
  const [snacks, setSnacks] = useState([]);
  const [totalWater, setTotalWater] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];

        // Get all users to find the client name
        const users = await authService.getAllUsers();
        const clientData = users.find(u => u.id === parseInt(userId));
        setClient(clientData);

        // Load client data
        const [mealsData, snacksData, waterData] = await Promise.all([
          mealService.getMeals(today, userId),
          snackService.getSnacks(today, userId),
          waterService.getTotalWater(today, userId)
        ]);

        console.log('📊 Client Meals loaded:', mealsData);
        mealsData.forEach(meal => {
          console.log(`Meal ${meal.meal_type}:`, {
            id: meal.id,
            plates: meal.plates,
            plates_count: meal.plates?.length || 0
          });
        });

        setMeals(mealsData);
        setSnacks(snacksData);
        setTotalWater(waterData.total_ml);
      } catch (error) {
        console.error('Failed to load client data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId]);

  const completedMeals = meals.filter(m => m.plates && m.plates.length > 1).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-xl text-gray-600">Loading client data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Admin Header */}
        <div className="bg-red-100 rounded-lg shadow-md p-6 mb-6 border-l-4 border-red-500">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin View: {client?.name || 'Unknown User'}
              </h1>
              <p className="text-gray-600 mt-1">
                Viewing data for: {client?.email}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/admin')}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                ← Back to Users
              </button>
              <button
                onClick={() => {
                  authService.logout();
                  navigate('/login');
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Daily Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Daily Summary</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded">
              <p className="text-sm text-gray-600">Meals Completed</p>
              <p className="text-3xl font-bold text-blue-600">{completedMeals}/3</p>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <p className="text-sm text-gray-600">Snacks Today</p>
              <p className="text-3xl font-bold text-green-600">{snacks.length}</p>
            </div>
            <div className="bg-cyan-50 p-4 rounded">
              <p className="text-sm text-gray-600">Water Today</p>
              <p className="text-3xl font-bold text-cyan-600">{totalWater}</p>
              <p className="text-xs text-gray-500">ml</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all"
                style={{ width: `${(completedMeals / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Today's Meals */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Today's Meals</h2>
          <div className="space-y-4">
            {meals.map(meal => (
              <div key={meal.id} className="flex items-center justify-between p-4 border rounded">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">
                    {meal.meal_type === 'breakfast' && '🍳'}
                    {meal.meal_type === 'lunch' && '🍽️'}
                    {meal.meal_type === 'dinner' && '🌙'}
                  </span>
                  <div>
                    <h3 className="font-semibold text-gray-800 capitalize">
                      {meal.meal_type}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {meal.plates && meal.plates.length > 1 ? (
                        <span className="text-green-600 font-medium">✓ Completed</span>
                      ) : (
                        <span className="text-yellow-600 font-medium">⏳ Pending</span>
                      )}
                    </p>
                  </div>
                </div>
                {/* Read-only - no action buttons */}
              </div>
            ))}
          </div>
        </div>

        {/* Snacks */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Snacks</h2>
            {/* Read-only - no add button */}
          </div>

          {snacks.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No snacks logged today</p>
          ) : (
            <div className="space-y-3">
              {snacks.map(snack => (
                <div key={snack.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="text-gray-800">{snack.description}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(snack.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  {/* Read-only - no delete button */}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Navigation - Read Only */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Client Data Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            {/* Water Tracking */}
            <div className="p-6 border-2 border-cyan-200 rounded-lg bg-cyan-50">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">💧</span>
                <h3 className="text-lg font-semibold text-gray-800">Water Tracking</h3>
              </div>
              <p className="text-sm text-gray-600">
                Daily water intake tracking
              </p>
            </div>

            {/* Weekly Review */}
            <div className="p-6 border-2 border-purple-200 rounded-lg bg-purple-50">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">📅</span>
                <h3 className="text-lg font-semibold text-gray-800">Weekly Review</h3>
              </div>
              <p className="text-sm text-gray-600">
                Weekly progress and new foods
              </p>
            </div>

            {/* Recommendations */}
            <div className="p-6 border-2 border-orange-200 rounded-lg bg-orange-50">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">📋</span>
                <h3 className="text-lg font-semibold text-gray-800">Recommendations</h3>
              </div>
              <p className="text-sm text-gray-600">
                Nutritionist recommendations
              </p>
            </div>

            {/* Compliance */}
            <div className="p-6 border-2 border-teal-200 rounded-lg bg-teal-50">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">📊</span>
                <h3 className="text-lg font-semibold text-gray-800">Compliance</h3>
              </div>
              <p className="text-sm text-gray-600">
                Compliance reports and analytics
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default AdminClientView;