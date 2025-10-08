import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import mealService from '../services/mealService';
import snackService from '../services/snackService';  // 🆕

function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [meals, setMeals] = useState([]);
  const [snacks, setSnacks] = useState([]);  // 🆕
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // טען נתונים כשהדף נטען
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // קבל פרטי משתמש
      const userProfile = await authService.getProfile();
      setUser(userProfile);

      // קבל ארוחות של היום
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const todayMeals = await mealService.getMeals(today);
      setMeals(todayMeals);

      // 🆕 קבל snacks של היום
      const todaySnacks = await snackService.getSnacks(today);
      setSnacks(todaySnacks);

    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleDeleteSnack = async (snackId) => {
    if (window.confirm('Delete this snack?')) {
      try {
        await snackService.deleteSnack(snackId);
        // רענן את הרשימה
        loadDashboardData();
      } catch (err) {
        alert('Failed to delete snack');
      }
    }
  };

  const getMealIcon = (mealType) => {
    const icons = {
      breakfast: '🌅',
      lunch: '☀️',
      dinner: '🌙'
    };
    return icons[mealType] || '🍽️';
  };

  const getMealName = (mealType) => {
    const names = {
      breakfast: 'ארוחת בוקר',
      lunch: 'ארוחת צהריים',
      dinner: 'ארוחת ערב'
    };
    return names[mealType] || mealType;
  };

  // כמה ארוחות הושלמו (יש להן צלחות)
  const completedMeals = meals.filter(meal => meal.plates && meal.plates.length > 0).length;
  const totalMeals = 3;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🍽️ Nutrition Tracker
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome, {user?.name || 'User'}!
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Daily Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            📊 Daily Summary
          </h2>
          <div className="flex items-center space-x-4">
            <div className="text-5xl font-bold text-blue-600">
              {completedMeals}/{totalMeals}
            </div>
            <div>
              <p className="text-lg text-gray-700">Meals Completed Today</p>
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(completedMeals / totalMeals) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* 🆕 Snacks Counter */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              🍪 Snacks logged today: <span className="font-bold text-gray-900">{snacks.length}</span>
            </p>
          </div>
        </div>

        {/* Quick Add Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => navigate('/meal-entry')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg p-6 hover:from-blue-700 hover:to-blue-800 transition transform hover:scale-105"
          >
            <div className="text-3xl mb-2">🍽️</div>
            <div className="text-xl font-bold">Add Meal</div>
            <div className="text-sm opacity-90">Log your next meal</div>
          </button>

          <button
            onClick={() => navigate('/add-snack')}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg shadow-lg p-6 hover:from-green-700 hover:to-green-800 transition transform hover:scale-105"
          >
            <div className="text-3xl mb-2">🍪</div>
            <div className="text-xl font-bold">Add Snack</div>
            <div className="text-sm opacity-90">Quick snack entry</div>
          </button>
        </div>

        {/* Meals List */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🍽️ Today's Meals
          </h2>

          {meals.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No meals logged yet. Click "Add Meal" to get started!
            </p>
          ) : (
            <div className="space-y-4">
              {meals.map((meal) => (
                <div
                  key={meal.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                  onClick={() => navigate(`/meal/${meal.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl">{getMealIcon(meal.meal_type)}</div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {getMealName(meal.meal_type)}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {new Date(meal.timestamp).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    <div>
                      {meal.plates && meal.plates.length > 0 ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          ✓ Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                          ⏳ Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {meal.photo_url && (
                    <div className="mt-3">
                      <img
                        src={meal.photo_url}
                        alt="Meal"
                        className="w-20 h-20 object-cover rounded"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 🆕 Snacks List */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🍪 Today's Snacks
          </h2>

          {snacks.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No snacks logged yet. Click "Add Snack" to log one!
            </p>
          ) : (
            <div className="space-y-3">
              {snacks.map((snack) => (
                <div
                  key={snack.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">🍎</div>
                      <div>
                        <p className="font-medium text-gray-900">{snack.description}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(snack.timestamp).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSnack(snack.id);
                      }}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation to Other Pages */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/weekly')}
            className="bg-white border-2 border-gray-300 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition"
          >
            <div className="text-2xl mb-2">📅</div>
            <div className="font-semibold">Weekly Review</div>
            <div className="text-sm text-gray-500">See your week</div>
          </button>

          <button
            onClick={() => navigate('/recommendations')}
            className="bg-white border-2 border-gray-300 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition"
          >
            <div className="text-2xl mb-2">📋</div>
            <div className="font-semibold">Recommendations</div>
            <div className="text-sm text-gray-500">Nutritionist advice</div>
          </button>

          <button
            onClick={() => navigate('/compliance')}
            className="bg-white border-2 border-gray-300 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition"
          >
            <div className="text-2xl mb-2">📊</div>
            <div className="font-semibold">Compliance</div>
            <div className="text-sm text-gray-500">Track your goals</div>
          </button>
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;