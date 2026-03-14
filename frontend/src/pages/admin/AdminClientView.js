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
        const users = await authService.getAllUsers();
        const clientData = users.find(u => u.id === parseInt(userId));
        setClient(clientData);

        const dates = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          dates.push(date.toISOString().split('T')[0]);
        }

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
        // reverse to show newest first
        setDailyData(allData.reverse());
      } catch (error) {
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
      weekday: 'short', month: 'short', day: 'numeric'
    });
  };

  const getMealTime = (meal) => {
    const timeMap = { breakfast: '08:00', lunch: '12:00', dinner: '18:00' };
    return timeMap[meal.meal_type] || '12:00';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 bg-gradient-mesh flex items-center justify-center">
        <div className="card-glass p-10 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
          <div className="text-xl font-medium text-gray-600">Loading Patient Report...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 bg-gradient-mesh flex items-center justify-center">
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-6 py-4 rounded-xl shadow-md font-bold">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 bg-gradient-mesh py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="card-glass p-6 md:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-t-4 border-t-indigo-500">
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 tracking-tight flex items-center gap-3">
              <span className="text-gray-900">👤</span> {client?.name || 'Unknown Patient'}
            </h1>
            <p className="text-gray-500 mt-1 font-medium ml-12">
              Last 7 Days Activity Report
            </p>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
          >
            <span>←</span> Back to Users
          </button>
        </div>

        {/* Daily Activity Timeline */}
        <div className="space-y-6">
          {dailyData.map((day) => (
            <div key={day.date} className="card-glass p-6 md:p-8">
              
              {/* Day Header */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 pb-4 border-b border-gray-100 gap-4">
                <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                  <span className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center text-lg">📅</span>
                  {formatDate(day.date)}
                </h2>
                <div className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100">
                    <span className="mr-1.5 text-sm">🍽️</span> {day.meals.length} Meals
                  </span>
                  <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-cyan-50 text-cyan-600 border border-cyan-100">
                    <span className="mr-1.5 text-sm">💧</span> {day.waterTotal}ml Water
                  </span>
                </div>
              </div>

              {/* Day Content */}
              {day.meals.length === 0 && day.snacks.length === 0 && day.waterTotal === 0 ? (
                <div className="text-center py-10 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                  <span className="text-4xl opacity-50 mb-2 block">📭</span>
                  <p className="text-gray-400 font-bold">No activity recorded for this day</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* Meals Column */}
                  <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                    <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                      <span>🍳</span> Main Meals
                    </h3>
                    {day.meals.length === 0 ? (
                      <p className="text-gray-400 font-medium italic text-sm">No meals recorded</p>
                    ) : (
                      <div className="space-y-3">
                        {day.meals.map((meal) => (
                          <div key={meal.id} className="flex flex-col sm:flex-row sm:items-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm gap-4 transition-transform hover:-translate-y-0.5">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-black text-gray-900">{getMealTime(meal)}</span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-50 text-indigo-600 uppercase tracking-wider">
                                  {meal.meal_type}
                                </span>
                              </div>
                              <p className="text-xs font-bold mt-2">
                                {meal.plates && meal.plates.length > 1 ? (
                                  <span className="text-emerald-500 bg-emerald-50 px-2 py-1 rounded flex w-fit items-center gap-1">
                                    <span className="text-sm">✓</span> Completed
                                  </span>
                                ) : (
                                  <span className="text-amber-500 bg-amber-50 px-2 py-1 rounded flex w-fit items-center gap-1">
                                    <span className="text-sm">⏳</span> Pending
                                  </span>
                                )}
                              </p>
                              {(meal.notes || meal.photo_url) && (
                                <div className="mt-3 pt-3 border-t border-gray-100 flex gap-4">
                                  {meal.notes && (
                                    <div className="flex-1 bg-yellow-50/50 p-2 rounded-lg text-xs text-gray-700 italic border border-yellow-100/50">
                                      <span className="font-bold text-yellow-600 not-italic mr-1">📝</span>
                                      "{meal.notes}"
                                    </div>
                                  )}
                                  {meal.photo_url && (
                                    <div className="shrink-0 group relative overflow-hidden rounded-lg w-16 h-16 border border-gray-200">
                                      <img src={meal.photo_url} alt="Meal" className="w-full h-full object-cover group-hover:scale-110 transition-transform cursor-pointer" onClick={() => window.open(meal.photo_url, '_blank')} />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer pointer-events-none">
                                        <span className="text-white text-xs font-bold">🔍</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Snacks & Water Column */}
                  <div className="space-y-6">
                    
                    {/* Water Progress */}
                    <div className="bg-cyan-50/50 p-6 rounded-2xl border border-cyan-100">
                      <h3 className="text-lg font-black text-cyan-900 mb-4 flex items-center gap-2">
                        <span>💧</span> Water Intake
                      </h3>
                      <div className="flex justify-between text-xs font-bold text-cyan-700 mb-2">
                        <span className="uppercase tracking-widest">Progress</span>
                        <span>{day.waterTotal}ml / 2500ml</span>
                      </div>
                      <div className="w-full bg-cyan-100/50 rounded-full h-3 overflow-hidden border border-cyan-200/50">
                        <div
                          className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full transition-all duration-1000 relative"
                          style={{ width: `${Math.min((day.waterTotal / 2500) * 100, 100)}%` }}
                        >
                          <div className="absolute top-0 right-0 bottom-0 left-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[progress_1s_linear_infinite]"></div>
                        </div>
                      </div>
                    </div>

                    {/* Snacks */}
                    <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100">
                      <h4 className="text-lg font-black text-amber-900 mb-4 flex items-center gap-2">
                        <span>🥨</span> Snacks
                      </h4>
                      {day.snacks.length === 0 ? (
                        <p className="text-orange-400/70 font-medium italic text-sm">No snacks recorded</p>
                      ) : (
                        <ul className="space-y-3">
                          {day.snacks.map((snack) => (
                            <li key={snack.id} className="flex justify-between items-center p-3 bg-white/60 rounded-xl border border-amber-200/50 shadow-sm text-sm">
                              <span className="font-bold text-gray-800">{snack.description}</span>
                              <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-md">
                                {new Date(snack.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <style jsx="true">{`
        @keyframes progress {
          0% { background-position: 1rem 0; }
          100% { background-position: 0 0; }
        }
      `}</style>
    </div>
  );
}

export default AdminClientView;