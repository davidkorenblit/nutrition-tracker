import React, { useState, useEffect } from 'react';
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

  // חישוב תאריך תחילת השבוע (יום ראשון)
  const getWeekStartDate = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayOfWeek);
    return weekStart.toISOString().split('T')[0];
  };

  const weekStartDate = getWeekStartDate();

  useEffect(() => {
    loadWeeklyData();
  }, []);

  const loadWeeklyData = async () => {
    try {
      setLoading(true);
      
      // טען weekly notes
      const notesData = await weeklyService.getAllNotes(weekStartDate);
      setWeeklyNotes(notesData.length > 0 ? notesData[0] : null);

      // חשב סטטיסטיקות שבועיות
      const weekStart = new Date(weekStartDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      let totalCompleted = 0;
      let totalMeals = 0;

      // טען ארוחות לכל יום בשבוע
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        try {
          const meals = await mealService.getMeals(dateStr);
          totalMeals += 3; // 3 ארוחות ביום
          totalCompleted += meals.filter(m => m.plates && m.plates.length > 1).length;
        } catch (err) {
          console.error(`Error loading meals for ${dateStr}:`, err);
        }
      }

      setWeekStats({ totalMeals, completedMeals: totalCompleted });

    } catch (error) {
      console.error('Error loading weekly data:', error);
      setError('Failed to load weekly data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFood = async (e) => {
    e.preventDefault();
    setError('');

    if (!newFood.food_name.trim()) {
      setError('Please enter a food name');
      return;
    }

    try {
      if (!weeklyNotes) {
        // צור weekly notes חדש
        const data = {
          week_start_date: weekStartDate,
          new_foods: [newFood]
        };
        const created = await weeklyService.createWeeklyNotes(data);
        setWeeklyNotes(created);
      } else {
        // עדכן weekly notes קיים
        const updatedFoods = [...weeklyNotes.new_foods, newFood];
        const updated = await weeklyService.updateNotes(weeklyNotes.id, {
          week_start_date: weekStartDate,
          new_foods: updatedFoods
        });
        setWeeklyNotes(updated);
      }

      // אפס טופס
      setNewFood({ food_name: '', difficulty_level: 5, notes: '' });
      setShowAddForm(false);
    } catch (err) {
      console.error('Error adding food:', err);
      setError(err.response?.data?.detail || 'Failed to add food');
    }
  };

  const handleDeleteFood = async (index) => {
    if (!weeklyNotes) return;

    try {
      const updatedFoods = weeklyNotes.new_foods.filter((_, i) => i !== index);
      
      if (updatedFoods.length === 0) {
        // אם אין מזונות, מחק את כל הרשומה
        await weeklyService.deleteNotes(weeklyNotes.id);
        setWeeklyNotes(null);
      } else {
        // עדכן עם רשימה חדשה
        const updated = await weeklyService.updateNotes(weeklyNotes.id, {
          week_start_date: weekStartDate,
          new_foods: updatedFoods
        });
        setWeeklyNotes(updated);
      }
    } catch (err) {
      console.error('Error deleting food:', err);
      setError('Failed to delete food');
    }
  };

  const getDifficultyColor = (level) => {
    if (level <= 3) return 'bg-green-500';
    if (level <= 6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getDifficultyText = (level) => {
    if (level <= 3) return 'Easy';
    if (level <= 6) return 'Medium';
    return 'Hard';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xl text-gray-600">Loading weekly data...</p>
      </div>
    );
  }

  const completionRate = weekStats.totalMeals > 0 
    ? Math.round((weekStats.completedMeals / weekStats.totalMeals) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Weekly Review</h1>
              <p className="text-sm text-gray-600 mt-1">
                Week of {new Date(weekStartDate).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Weekly Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Meals Completed */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Meals This Week</p>
                <p className="text-3xl font-bold text-blue-600">
                  {weekStats.completedMeals}/{weekStats.totalMeals}
                </p>
              </div>
              <span className="text-4xl">🍽️</span>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">{completionRate}% complete</p>
            </div>
          </div>

          {/* New Foods */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New Foods Tried</p>
                <p className="text-3xl font-bold text-green-600">
                  {weeklyNotes?.new_foods?.length || 0}
                </p>
              </div>
              <span className="text-4xl">🥗</span>
            </div>
          </div>

          {/* Average Difficulty */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Difficulty</p>
                <p className="text-3xl font-bold text-purple-600">
                  {weeklyNotes?.new_foods?.length > 0
                    ? (weeklyNotes.new_foods.reduce((sum, f) => sum + f.difficulty_level, 0) / 
                       weeklyNotes.new_foods.length).toFixed(1)
                    : '0'}
                  /10
                </p>
              </div>
              <span className="text-4xl">📊</span>
            </div>
          </div>
        </div>

        {/* New Foods Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">New Foods This Week</h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              {showAddForm ? 'Cancel' : '+ Add New Food'}
            </button>
          </div>

          {/* Add Food Form */}
          {showAddForm && (
            <form onSubmit={handleAddFood} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Food Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Food Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newFood.food_name}
                    onChange={(e) => setNewFood({ ...newFood, food_name: e.target.value })}
                    placeholder="e.g., Quinoa salad, Tofu stir-fry"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Difficulty Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty Level: {newFood.difficulty_level}/10 - {getDifficultyText(newFood.difficulty_level)}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={newFood.difficulty_level}
                    onChange={(e) => setNewFood({ ...newFood, difficulty_level: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={newFood.notes}
                  onChange={(e) => setNewFood({ ...newFood, notes: e.target.value })}
                  placeholder="How did it taste? Would you eat it again?"
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Add Food
              </button>
            </form>
          )}

          {/* Foods List */}
          {!weeklyNotes || weeklyNotes.new_foods.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">🥗</span>
              <p className="text-gray-500 text-lg">No new foods added this week</p>
              <p className="text-gray-400 text-sm mt-2">
                Start by adding foods you tried for the first time
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {weeklyNotes.new_foods.map((food, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{food.food_name}</h3>
                    {food.notes && (
                      <p className="text-sm text-gray-600 mt-1">{food.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Difficulty Badge */}
                    <div className="text-center">
                      <div className={`px-3 py-1 rounded-full ${getDifficultyColor(food.difficulty_level)} text-white text-sm font-medium`}>
                        {food.difficulty_level}/10
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {getDifficultyText(food.difficulty_level)}
                      </p>
                    </div>
                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteFood(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Weekly Review Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Track any food you're trying for the first time or adding to your regular menu</li>
            <li>• Difficulty level: How hard was it to eat this food? (taste, texture, mental challenge)</li>
            <li>• Review your progress at the end of each week to see patterns</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default WeeklyReviewPage;