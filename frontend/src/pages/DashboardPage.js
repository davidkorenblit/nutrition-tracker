import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';
import mealService from '../services/mealService';
import snackService from '../services/snackService';
import waterService from '../services/waterService';

/* ─── Circular Water Progress ─── */
function WaterRing({ current, goal }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(current / goal, 1);
  const offset = circumference - pct * circumference;

  return (
    <svg width="128" height="128" viewBox="0 0 128 128" className="drop-shadow-sm">
      {/* background ring */}
      <circle cx="64" cy="64" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
      {/* progress ring */}
      <circle
        cx="64" cy="64" r={radius} fill="none"
        stroke="url(#waterGrad)" strokeWidth="10" strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        className="progress-ring-circle"
      />
      <defs>
        <linearGradient id="waterGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      {/* centre text */}
      <text x="64" y="58" textAnchor="middle" className="fill-gray-800 text-lg font-bold">{Math.round(pct * 100)}%</text>
      <text x="64" y="76" textAnchor="middle" className="fill-gray-400 text-[10px]">{current} ml</text>
    </svg>
  );
}

/* ─── Skeleton Loader ─── */
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 bg-gradient-mesh">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* header skeleton */}
        <div className="card-glass p-6">
          <div className="skeleton h-8 w-48 mb-2" />
          <div className="skeleton h-4 w-32" />
        </div>
        {/* metrics skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
        {/* meals skeleton */}
        <div className="card-glass p-6 space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Dashboard ─── */
function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [meals, setMeals] = useState([]);
  const [snacks, setSnacks] = useState([]);
  const [totalWater, setTotalWater] = useState(0);
  const [loading, setLoading] = useState(true);

  const location = useLocation();

  const waterGoal = user?.daily_water_goal_ml || 3000;

  const loadData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [userData, mealsData, snacksData, waterData] = await Promise.all([
        authService.getProfile(),
        mealService.getMeals(today),
        snackService.getSnacks(today),
        waterService.getTotalWater(today)
      ]);

      setUser(userData);
      setMeals(mealsData);
      setSnacks(snacksData);
      setTotalWater(waterData.total_ml);
    } catch (error) {
      // silent — user sees empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [location.key]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleDeleteSnack = async (snackId) => {
    try {
      await snackService.deleteSnack(snackId);
      setSnacks(snacks.filter(s => s.id !== snackId));
    } catch (error) {
      // silent
    }
  };

  const completedMeals = meals.filter(m => m.is_logged).length;

  /* ──── Loading state ──── */
  if (loading) return <DashboardSkeleton />;

  /* ──── Meal emoji & gradient mapping ──── */
  const mealMeta = {
    breakfast: { emoji: '🍳', gradient: 'from-amber-50 to-orange-50', border: 'border-amber-200', accent: 'text-amber-600' },
    lunch:     { emoji: '🍽️', gradient: 'from-emerald-50 to-green-50', border: 'border-emerald-200', accent: 'text-emerald-600' },
    dinner:    { emoji: '🌙', gradient: 'from-indigo-50 to-purple-50', border: 'border-indigo-200', accent: 'text-indigo-600' },
  };

  return (
    <div className="min-h-screen bg-gray-50 bg-gradient-mesh">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">

        {/* ──── Header ──── */}
        <div className="card-glass p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gradient">
              Welcome, {user?.name}!
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              })}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-5 py-2 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
          >
            Logout
          </button>
        </div>

        {/* ──── Metrics Row ──── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Meals Completed */}
          <div className="metric-card bg-gradient-to-br from-indigo-50 to-indigo-100/60">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Meals</p>
            <p className="text-4xl font-black text-indigo-600 mt-1">{completedMeals}<span className="text-lg text-indigo-300">/3</span></p>
            <div className="mt-3 w-full bg-indigo-200/50 rounded-full h-2 overflow-hidden">
              <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
                   style={{ width: `${(completedMeals / 3) * 100}%` }} />
            </div>
          </div>

          {/* Snacks */}
          <div className="metric-card bg-gradient-to-br from-emerald-50 to-emerald-100/60">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Snacks</p>
            <p className="text-4xl font-black text-emerald-600 mt-1">{snacks.length}</p>
            <p className="text-xs text-emerald-400 mt-1">logged today</p>
          </div>

          {/* Water — circular progress */}
          <div className="metric-card bg-gradient-to-br from-cyan-50 to-cyan-100/60 sm:col-span-2 lg:col-span-1 flex items-center gap-4">
            <WaterRing current={totalWater} goal={waterGoal} />
            <div>
              <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Water</p>
              <p className="text-2xl font-black text-cyan-600">{totalWater}<span className="text-sm text-cyan-300 ml-1">ml</span></p>
              <p className="text-xs text-cyan-400">goal: {waterGoal} ml</p>
            </div>
          </div>

          {/* Quick Add Snack */}
          <button
            onClick={() => navigate('/add-snack')}
            className="metric-card bg-gradient-to-br from-pink-50 to-rose-100/60 border-dashed border-pink-200 group"
          >
            <span className="text-3xl group-hover:scale-110 inline-block transition-transform">🍎</span>
            <p className="text-sm font-semibold text-pink-600 mt-2">Add Snack</p>
            <p className="text-xs text-pink-400">Tap to log</p>
          </button>
        </div>

        {/* ──── Today's Meals ──── */}
        <div className="card-glass p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Today's Meals</h2>
          <div className="space-y-3">
            {meals.map(meal => {
              const meta = mealMeta[meal.meal_type] || mealMeta.breakfast;
              const isComplete = meal.is_logged;
              return (
                <div key={meal.id}
                  className={`flex items-center justify-between p-4 rounded-xl border bg-gradient-to-r ${meta.gradient} ${meta.border} hover:shadow-md transition-all duration-300`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{meta.emoji}</span>
                    <div>
                      <h3 className="font-semibold text-gray-800 capitalize">{meal.meal_type}</h3>
                      <p className="text-sm">
                        {isComplete ? (
                          <span className="text-green-600 font-medium">✓ Completed</span>
                        ) : (
                          <span className="text-yellow-600 font-medium">⏳ Pending</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {!isComplete ? (
                    <button
                      onClick={() => navigate(`/meal-entry?meal_id=${meal.id}&date=${meal.date}`)}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-gradient-primary hover:opacity-90 shadow-sm transition-all"
                    >
                      Complete
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(`/meal-entry?meal_id=${meal.id}&date=${meal.date}`)}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-indigo-600 bg-white border border-indigo-200 hover:bg-indigo-50 shadow-sm transition-all"
                    >
                      View / Edit
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ──── Snacks ──── */}
        <div className="card-glass p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800">Snacks</h2>
            <button
              onClick={() => navigate('/add-snack')}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-green-500 hover:opacity-90 shadow-sm transition-all"
            >
              + Add Snack
            </button>
          </div>

          {snacks.length === 0 ? (
            <div className="text-center py-10">
              <span className="text-4xl">🥗</span>
              <p className="text-gray-400 mt-2">No snacks logged today</p>
              <p className="text-xs text-gray-300 mt-1">Tap the button above to add one</p>
            </div>
          ) : (
            <div className="space-y-2">
              {snacks.map(snack => (
                <div key={snack.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50/80 transition-all">
                  <div>
                    <p className="text-gray-800 font-medium">{snack.description}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(snack.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteSnack(snack.id)}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors px-3 py-1 rounded-lg hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ──── Quick Navigation ──── */}
        <div className="card-glass p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Navigation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            <button onClick={() => navigate('/water-tracking')}
              className="nav-card border-cyan-200 hover:border-cyan-400 hover:bg-cyan-50/70">
              <span className="text-3xl">💧</span>
              <h3 className="text-base font-semibold text-gray-800 mt-2">Water Tracking</h3>
              <p className="text-xs text-gray-500 mt-1">Track your daily intake</p>
            </button>

            <button onClick={() => navigate('/weekly-review')}
              className="nav-card border-purple-200 hover:border-purple-400 hover:bg-purple-50/70">
              <span className="text-3xl">📅</span>
              <h3 className="text-base font-semibold text-gray-800 mt-2">Weekly Review</h3>
              <p className="text-xs text-gray-500 mt-1">New foods & progress</p>
            </button>

            <button onClick={() => navigate('/recommendations')}
              className="nav-card border-orange-200 hover:border-orange-400 hover:bg-orange-50/70">
              <span className="text-3xl">📋</span>
              <h3 className="text-base font-semibold text-gray-800 mt-2">Recommendations</h3>
              <p className="text-xs text-gray-500 mt-1">Nutritionist advice</p>
            </button>

            <button onClick={() => navigate('/compliance')}
              className="nav-card border-teal-200 hover:border-teal-400 hover:bg-teal-50/70">
              <span className="text-3xl">📊</span>
              <h3 className="text-base font-semibold text-gray-800 mt-2">Compliance</h3>
              <p className="text-xs text-gray-500 mt-1">Your compliance reports</p>
            </button>

          </div>
        </div>

      </div>
    </div>
  );
}

export default DashboardPage;