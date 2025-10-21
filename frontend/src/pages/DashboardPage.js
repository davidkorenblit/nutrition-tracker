import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import mealService from '../services/mealService';
import snackService from '../services/snackService';
import waterService from '../services/waterService';

function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [meals, setMeals] = useState([]);
  const [snacks, setSnacks] = useState([]);
  const [totalWater, setTotalWater] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const [userData, mealsData, snacksData, waterData] = await Promise.all([
          authService.getProfile(),
          mealService.getMeals(today),
          snackService.getSnacks(today),
          waterService.getTotalWater(today)
        ]);

        console.log('📊 Meals loaded:', mealsData);
        mealsData.forEach(meal => {
          console.log(`Meal ${meal.meal_type}:`, {
            id: meal.id,
            plates: meal.plates,
            plates_count: meal.plates?.length || 0
          });
        });

        setUser(userData);
        setMeals(mealsData);
        setSnacks(snacksData);
        setTotalWater(waterData.total_ml);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleDeleteSnack = async (snackId) => {
    try {
      await snackService.deleteSnack(snackId);
      setSnacks(snacks.filter(s => s.id !== snackId));
    } catch (error) {
      console.error('Failed to delete snack:', error);
    }
  };

  const completedMeals = meals.filter(m => m.plates && m.plates.length > 1).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-xl text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome, {user?.name}!
              </h1>
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
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Logout
            </button>
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
              <div key={meal.id} className="flex items-center justify-between p-4 border rounded hover:bg-gray-50">
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
                
                {(!meal.plates || meal.plates.length <= 1) && (
                  <button
                    onClick={() => navigate(`/meal-entry?meal_id=${meal.id}&date=${meal.date}`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Complete Meal
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Snacks */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Snacks</h2>
            <button 
              onClick={() => navigate('/add-snack')}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              + Add Snack
            </button>
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
                  <button
                    onClick={() => handleDeleteSnack(snack.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Navigation */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Navigation</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Water Tracking */}
            <button
              onClick={() => navigate('/water-tracking')}
              className="p-6 border-2 border-cyan-200 rounded-lg hover:border-cyan-400 hover:bg-cyan-50 transition-all text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">💧</span>
                <h3 className="text-lg font-semibold text-gray-800">Water Tracking</h3>
              </div>
              <p className="text-sm text-gray-600">
                Track your daily water intake
              </p>
            </button>

            {/* Weekly Review */}
            <button
              onClick={() => navigate('/weekly-review')}
              className="p-6 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">📅</span>
                <h3 className="text-lg font-semibold text-gray-800">Weekly Review</h3>
              </div>
              <p className="text-sm text-gray-600">
                Track new foods and weekly progress
              </p>
            </button>

            {/* Recommendations */}
            <button
              onClick={() => navigate('/recommendations')}
              className="p-6 border-2 border-orange-200 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-all text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">📋</span>
                <h3 className="text-lg font-semibold text-gray-800">Recommendations</h3>
              </div>
              <p className="text-sm text-gray-600">
                View nutritionist recommendations
              </p>
            </button>

            {/* Compliance */}
            <button
              onClick={() => navigate('/compliance')}
              className="p-6 border-2 border-teal-200 rounded-lg hover:border-teal-400 hover:bg-teal-50 transition-all text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">📊</span>
                <h3 className="text-lg font-semibold text-gray-800">Compliance</h3>
              </div>
              <p className="text-sm text-gray-600">
                Check your compliance reports
              </p>
            </button>

          </div>
        </div>

      </div>
    </div>
  );
}

export default DashboardPage;