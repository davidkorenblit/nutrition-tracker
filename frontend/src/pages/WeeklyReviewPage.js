import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import weeklyService from '../services/weeklyService';
import mealService from '../services/mealService';

function WeeklyReviewPage() {
  const navigate = useNavigate();
  const [weeklyNotes, setWeeklyNotes] = useState(null);
  const [newFood, setNewFood] = useState({
    food_name: '',
    difficulty_level: 5,
    notes: ''
  });
  const [weekStats, setWeekStats] = useState({
    totalMeals: 0,
    completedMeals: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Calculate week start date (Sunday)
  const getWeekStartDate = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayOfWeek);
    return weekStart.toISOString().split('T')[0];
  };

  const weekStartDate = getWeekStartDate();

  const loadWeeklyData = useCallback(async () => {
    try {
      setLoading(true);
      
      const notesData = await weeklyService.getAllNotes(weekStartDate);
      setWeeklyNotes(notesData.length > 0 ? notesData[0] : null);

      const weekStart = new Date(weekStartDate);
      let totalCompleted = 0;
      let totalMeals = 0;

      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        try {
          const meals = await mealService.getMeals(dateStr);
          totalMeals += 3; // 3 meals a day
          totalCompleted += meals.filter(m => m.plates && m.plates.length > 1).length;
        } catch (err) {
          // silent error for missing future days
        }
      }

      setWeekStats({ totalMeals, completedMeals: totalCompleted });

    } catch (error) {
      setError('Failed to load weekly data');
    } finally {
      setLoading(false);
    }
  }, [weekStartDate]);

  useEffect(() => {
    loadWeeklyData();
  }, [loadWeeklyData]);

  const handleAddFood = async (e) => {
    e.preventDefault();
    setError('');

    if (!newFood.food_name.trim()) {
      setError('Please enter a food name');
      return;
    }

    try {
      if (!weeklyNotes) {
        const data = {
          week_start_date: weekStartDate,
          new_foods: [newFood]
        };
        const created = await weeklyService.createWeeklyNotes(data);
        setWeeklyNotes(created);
      } else {
        const updatedFoods = [...weeklyNotes.new_foods, newFood];
        const updated = await weeklyService.updateNotes(weeklyNotes.id, {
          week_start_date: weekStartDate,
          new_foods: updatedFoods
        });
        setWeeklyNotes(updated);
      }

      setNewFood({ food_name: '', difficulty_level: 5, notes: '' });
      setShowAddForm(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add food');
    }
  };

  const handleDeleteFood = async (index) => {
    if (!weeklyNotes) return;

    try {
      const updatedFoods = weeklyNotes.new_foods.filter((_, i) => i !== index);
      
      if (updatedFoods.length === 0) {
        await weeklyService.deleteNotes(weeklyNotes.id);
        setWeeklyNotes(null);
      } else {
        const updated = await weeklyService.updateNotes(weeklyNotes.id, {
          week_start_date: weekStartDate,
          new_foods: updatedFoods
        });
        setWeeklyNotes(updated);
      }
    } catch (err) {
      setError('Failed to delete food');
    }
  };

  const getDifficultyColor = (level) => {
    if (level <= 3) return 'from-emerald-400 to-green-500 shadow-emerald-200';
    if (level <= 6) return 'from-amber-400 to-yellow-500 shadow-amber-200';
    return 'from-rose-400 to-red-500 shadow-rose-200';
  };

  const getDifficultyText = (level) => {
    if (level <= 3) return 'Easy';
    if (level <= 6) return 'Medium';
    return 'Hard';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 bg-gradient-mesh flex items-center justify-center">
        <div className="card-glass p-10 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
          <div className="text-xl font-medium text-gray-600">Loading Weekly Data...</div>
        </div>
      </div>
    );
  }

  const completionRate = weekStats.totalMeals > 0 
    ? Math.round((weekStats.completedMeals / weekStats.totalMeals) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 bg-gradient-mesh py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="card-glass p-6 md:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500 tracking-tight flex items-center gap-3">
              <span>📅</span> Weekly Review
            </h1>
            <p className="text-gray-500 mt-1 font-medium ml-11">
              Week of {new Date(weekStartDate).toLocaleDateString('en-US', { 
                month: 'long', day: 'numeric', year: 'numeric'
              })}
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm flex items-center gap-2"
          >
            <span>←</span> Back to Dashboard
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {/* Weekly Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Meals Completed */}
          <div className="metric-card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-blue-500 uppercase tracking-wider mb-1">Meals This Week</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-blue-600 group-hover:scale-110 transition-transform origin-left">{weekStats.completedMeals}</span>
                  <span className="text-lg font-bold text-blue-300">/ {weekStats.totalMeals}</span>
                </div>
              </div>
              <span className="text-4xl opacity-80 group-hover:scale-110 transition-transform">🍽️</span>
            </div>
            <div className="mt-5">
              <div className="w-full bg-blue-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2.5 w-full rounded-full transition-all duration-1000 ease-out"
                  style={{ transform: `translateX(-${100 - completionRate}%)` }}
                />
              </div>
              <p className="text-xs font-bold text-blue-500 mt-2 text-right">{completionRate}% complete</p>
            </div>
          </div>

          {/* New Foods */}
          <div className="metric-card bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100 group">
            <div className="flex items-center justify-between h-full">
              <div className="flex flex-col justify-center h-full">
                <p className="text-sm font-bold text-emerald-500 uppercase tracking-wider mb-1">New Foods Tried</p>
                <p className="text-4xl font-black text-emerald-600 group-hover:scale-110 transition-transform origin-left">
                  {weeklyNotes?.new_foods?.length || 0}
                </p>
              </div>
              <span className="text-5xl opacity-80 group-hover:scale-110 transition-transform">🥗</span>
            </div>
          </div>

          {/* Average Difficulty */}
          {(() => {
            const avgDiff = weeklyNotes?.new_foods?.length > 0
              ? (weeklyNotes.new_foods.reduce((sum, f) => sum + f.difficulty_level, 0) / weeklyNotes.new_foods.length).toFixed(1)
              : 0;
            return (
              <div className="metric-card bg-gradient-to-br from-purple-50 to-fuchsia-50 border-purple-100 group">
                <div className="flex items-center justify-between h-full">
                  <div className="flex flex-col justify-center h-full">
                    <p className="text-sm font-bold text-purple-500 uppercase tracking-wider mb-1">Avg. Difficulty</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-purple-600 group-hover:scale-110 transition-transform origin-left">{avgDiff}</span>
                      <span className="text-lg font-bold text-purple-300">/ 10</span>
                    </div>
                  </div>
                  <span className="text-5xl opacity-80 group-hover:scale-110 transition-transform">📊</span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* New Foods Section */}
        <div className="card-glass p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-2xl">🌟</span> New Foods This Week
              </h2>
              <p className="text-sm font-medium text-gray-500">Track foods you're trying for the first time.</p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm ${
                showAddForm 
                  ? 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200' 
                  : 'bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow hover:-translate-y-0.5'
              }`}
            >
              {showAddForm ? 'Cancel' : '+ Add New Food'}
            </button>
          </div>

          {/* Add Food Form */}
          {showAddForm && (
            <div className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-2xl animate-fadeIn">
              <form onSubmit={handleAddFood}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Food Name */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Food Name <span className="text-red-500">*</span></label>
                    <input
                      type="text" required value={newFood.food_name}
                      onChange={(e) => setNewFood({ ...newFood, food_name: e.target.value })}
                      placeholder="e.g., Quinoa salad, Tofu stir-fry"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-gray-800 transition-all"
                    />
                  </div>

                  {/* Difficulty Level */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex justify-between">
                      <span>Difficulty Level</span>
                      <span className={`px-2 rounded-md text-xs text-white bg-gradient-to-r ${getDifficultyColor(newFood.difficulty_level)}`}>
                        {newFood.difficulty_level}/10 ▪ {getDifficultyText(newFood.difficulty_level)}
                      </span>
                    </label>
                    <div className="pt-2">
                      <input
                        type="range" min="1" max="10" value={newFood.difficulty_level}
                        onChange={(e) => setNewFood({ ...newFood, difficulty_level: parseInt(e.target.value) })}
                        className="w-full accent-emerald-500"
                      />
                      <div className="flex justify-between text-xs font-semibold text-gray-400 mt-1">
                        <span>Easy (1)</span>
                        <span>Hard (10)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="mt-6">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Thoughts & Feelings (optional)</label>
                  <textarea
                    value={newFood.notes}
                    onChange={(e) => setNewFood({ ...newFood, notes: e.target.value })}
                    placeholder="How did it taste? Did you face any challenges eating it?"
                    rows="2"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none font-medium text-gray-800 transition-all"
                  />
                </div>

                <div className="mt-6 flex justify-end">
                  <button type="submit" className="px-8 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
                    Save Details
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Foods List */}
          {!weeklyNotes || weeklyNotes.new_foods.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
              <span className="text-6xl mb-4 block opacity-60">🔮</span>
              <p className="text-gray-600 font-bold text-lg">No new foods added this week</p>
              <p className="text-gray-400 font-medium text-sm mt-1">
                When you step out of your comfort zone, log it here!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {weeklyNotes.new_foods.map((food, index) => (
                <div key={index} className="flex flex-col justify-between p-5 bg-white border border-gray-100 shadow-sm rounded-2xl hover:shadow-md hover:border-emerald-200 transition-all group relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 bg-gradient-to-r ${getDifficultyColor(food.difficulty_level)} transform translate-x-10 -translate-y-10`}></div>
                  
                  <div className="mb-4 pr-12">
                    <h3 className="font-bold text-gray-800 text-lg leading-tight">{food.food_name}</h3>
                    {food.notes && (
                      <p className="text-sm text-gray-500 font-medium mt-2 leading-snug">"{food.notes}"</p>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-2">
                      <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${getDifficultyColor(food.difficulty_level)} text-white text-xs font-black shadow-md`}>
                        {food.difficulty_level} / 10
                      </div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {getDifficultyText(food.difficulty_level)}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteFood(index)}
                      className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-red-50 text-red-500 font-bold text-xs rounded-lg hover:bg-red-100 transition-all"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <style jsx="true">{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}

export default WeeklyReviewPage;