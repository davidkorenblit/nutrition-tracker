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
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get client profile
        const users = await authService.getAllUsers();
        const clientData = users.find(u => u.id === parseInt(userId));
        setClient(clientData);

        // Calculate last 7 days
        const dates = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          dates.push(date.toISOString().split('T')[0]);
        }

        // Fetch data for each day
        const dataPromises = dates.map(async (date) => {
          const [meals, snacks, water] = await Promise.all([
            mealService.getMeals(date, userId),
            snackService.getSnacks(date, userId),
            waterService.getTotalWater(date, userId)
          ]);

          return {
            date,
            meals,
            snacks,
            waterTotal: water.total_ml || 0
          };
        });

        const allData = await Promise.all(dataPromises);
        setDailyData(allData);
      } catch (error) {
        console.error('Failed to load client data:', error);
        setError('Failed to load patient data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };

  const getMealTime = (meal) => {
    const timeMap = {
      breakfast: '08:00',
      lunch: '12:00',
      dinner: '18:00'
    };
    return timeMap[meal.meal_type] || '12:00';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xl text-gray-600">Loading patient report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Patient Report: {client?.name || 'Unknown Patient'}
              </h1>
              <p className="text-gray-600 mt-1">
                Last 7 Days Activity Report
              </p>
            </div>
            <button
              onClick={() => navigate('/admin')}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              ← Back to Users
            </button>
          </div>
        </div>

        {/* Daily Activity Timeline */}
        <div className="space-y-6">
          {dailyData.map((day) => (
            <div key={day.date} className="bg-white rounded-lg shadow-sm border p-6">
              {/* Day Header */}
              <div className="flex justify-between items-center mb-4 pb-3 border-b">
                <h2 className="text-xl font-semibold text-gray-800">
                  {formatDate(day.date)}
                </h2>
                <div className="flex gap-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {day.meals.length} Meals
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-cyan-100 text-cyan-800">
                    {day.waterTotal}ml Water
                  </span>
                </div>
              </div>

              {/* Day Content */}
              {day.meals.length === 0 && day.snacks.length === 0 && day.waterTotal === 0 ? (
                <p className="text-gray-400 text-center py-8 italic">No activity recorded for this day</p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Meals Column */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-3">Meals</h3>
                    {day.meals.length === 0 ? (
                      <p className="text-gray-400 italic">No meals recorded</p>
                    ) : (
                      <div className="space-y-3">
                        {day.meals.map((meal) => (
                          <div key={meal.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                            <div className="flex-shrink-0">
                              <span className="text-2xl">
                                {meal.meal_type === 'breakfast' && '🍳'}
                                {meal.meal_type === 'lunch' && '🍽️'}
                                {meal.meal_type === 'dinner' && '🌙'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-gray-800">
                                  {getMealTime(meal)}
                                </span>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700 capitalize">
                                  {meal.meal_type}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">
                                {meal.plates && meal.plates.length > 1 ? (
                                  <span className="text-green-600 font-medium">✓ Completed</span>
                                ) : (
                                  <span className="text-yellow-600 font-medium">⏳ Pending</span>
                                )}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Snacks & Water Column */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-3">Snacks & Water</h3>
                    <div className="space-y-4">
                      {/* Water Progress */}
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Water Intake</span>
                          <span>{day.waterTotal}ml / 2500ml</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-cyan-600 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min((day.waterTotal / 2500) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Snacks */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Snacks</h4>
                        {day.snacks.length === 0 ? (
                          <p className="text-gray-400 italic text-sm">No snacks recorded</p>
                        ) : (
                          <ul className="space-y-2">
                            {day.snacks.map((snack) => (
                              <li key={snack.id} className="flex justify-between text-sm">
                                <span className="text-gray-800">{snack.description}</span>
                                <span className="text-gray-500">
                                  {new Date(snack.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminClientView;