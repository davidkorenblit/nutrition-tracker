import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import complianceService from '../services/complianceService';

function CompliancePage() {
  const navigate = useNavigate();
  const [latestCheck, setLatestCheck] = useState(null);
  const [checkHistory, setCheckHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewCheckForm, setShowNewCheckForm] = useState(false);
  const [newCheckData, setNewCheckData] = useState({
    period_start: '',
    period_end: ''
  });
  const [runningCheck, setRunningCheck] = useState(false);

  useEffect(() => {
    loadComplianceData();
  }, []);

  const loadComplianceData = async () => {
    try {
      setLoading(true);
      setError('');

      try {
        const latest = await complianceService.getLatestCheck();
        setLatestCheck(latest);
      } catch (err) {
        if (err.response?.status !== 404) {
          throw err;
        }
        setLatestCheck(null);
      }

      const history = await complianceService.getCheckHistory(10);
      setCheckHistory(history);

    } catch (err) {
      setError('Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  };

  const handleRunCheck = async (e) => {
    e.preventDefault();
    setError('');
    setRunningCheck(true);

    try {
      await complianceService.runComplianceCheck(
        newCheckData.period_start,
        newCheckData.period_end
      );
      
      await loadComplianceData();
      
      setShowNewCheckForm(false);
      setNewCheckData({ period_start: '', period_end: '' });
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to run compliance check');
    } finally {
      setRunningCheck(false);
    }
  };

  const handleDeleteCheck = async (checkId) => {
    if (!window.confirm('Are you sure you want to delete this compliance check?')) {
      return;
    }

    try {
      await complianceService.deleteCheck(checkId);
      await loadComplianceData();
    } catch (err) {
      setError('Failed to delete check');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'from-emerald-50 to-teal-50 border-emerald-100';
    if (score >= 60) return 'from-amber-50 to-yellow-50 border-amber-100';
    return 'from-rose-50 to-red-50 border-rose-100';
  };

  const getScoreGradientText = (score) => {
    if (score >= 80) return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-transparent bg-clip-text';
    if (score >= 60) return 'bg-gradient-to-r from-amber-500 to-orange-500 text-transparent bg-clip-text';
    return 'bg-gradient-to-r from-rose-500 to-red-500 text-transparent bg-clip-text';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 bg-gradient-mesh flex items-center justify-center">
        <div className="card-glass p-10 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
          <div className="text-xl font-medium text-gray-600">Loading Compliance Data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 bg-gradient-mesh py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="card-glass p-6 md:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 tracking-tight flex items-center gap-3">
              <span>🎯</span> Compliance Tracking
            </h1>
            <p className="text-gray-500 mt-1 font-medium ml-11">
              Monitor your adherence to nutrition goals
            </p>
          </div>
          <div className="flex gap-3">
            {!showNewCheckForm && latestCheck && (
              <button
                onClick={() => setShowNewCheckForm(true)}
                className="px-5 py-2.5 bg-gradient-primary text-white font-bold rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-md"
              >
                + Run Check
              </button>
            )}
            <button
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm flex items-center gap-2"
            >
              <span>←</span> Back
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {/* New Check Form */}
        {showNewCheckForm && (
          <div className="card-glass p-6 md:p-8 animate-fadeIn">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="text-2xl">⚡</span> Run New Compliance Check
            </h2>
            <form onSubmit={handleRunCheck}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Period Start</label>
                  <input
                    type="date" required value={newCheckData.period_start}
                    onChange={(e) => setNewCheckData({ ...newCheckData, period_start: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-gray-800 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Period End</label>
                  <input
                    type="date" required value={newCheckData.period_end}
                    onChange={(e) => setNewCheckData({ ...newCheckData, period_end: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-gray-800 transition-all"
                  />
                </div>
              </div>
              <div className="mt-8 flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowNewCheckForm(false)}
                  className="px-6 py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={runningCheck}
                  className={`px-8 py-3 rounded-xl text-white font-bold transition-all shadow-md ${
                    runningCheck ? 'bg-gray-400 cursor-not-allowed text-gray-500' : 'bg-gradient-primary hover:shadow-lg hover:-translate-y-0.5'
                  }`}
                >
                  {runningCheck ? 'Running Check...' : 'Run Check Now'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* No Data State */}
        {!latestCheck && checkHistory.length === 0 && !showNewCheckForm && (
          <div className="card-glass p-16 text-center border-2 border-dashed border-gray-200">
            <span className="text-6xl mb-4 block opacity-60">📊</span>
            <p className="text-2xl font-bold text-gray-800 mb-2">No Compliance Checks Yet</p>
            <p className="text-gray-500 font-medium mb-8 max-w-md mx-auto">
              Run your first compliance check to see how well you're adhering to your nutrition goals.
            </p>
            <button
              onClick={() => setShowNewCheckForm(true)}
              className="px-8 py-4 bg-gradient-primary text-white rounded-xl font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-md text-lg"
            >
              Run First Check
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Content (Latest Check) */}
          <div className="lg:col-span-2 space-y-6">
            {latestCheck && (
              <div className="card-glass p-6 md:p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-6 border-b border-gray-100">
                  <div>
                    <h2 className="text-2xl font-black text-gray-800 mb-1">Latest Report</h2>
                    <p className="text-sm font-bold text-indigo-500 uppercase tracking-wider">
                      {new Date(latestCheck.check_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="mt-3 sm:mt-0 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100 font-medium text-gray-600 text-sm">
                    {latestCheck.period_start} → {latestCheck.period_end}
                  </div>
                </div>

                {/* Overall Score */}
                <div className="mb-8 relative overflow-hidden rounded-3xl p-8 bg-gray-900 shadow-xl group cursor-default">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-gray-900 to-black rounded-3xl opacity-80"></div>
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                  
                  <div className="relative z-10 text-center">
                    <p className="text-gray-400 uppercase tracking-widest font-bold text-sm mb-2">Overall Score</p>
                    <p className={`text-7xl font-black tracking-tighter drop-shadow-md ${getScoreGradientText(latestCheck.overall_score)}`}>
                      {latestCheck.overall_score?.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Individual Scores */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <div className={`metric-card bg-gradient-to-br group ${getScoreBgColor(latestCheck.water_intake_score)}`}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-4xl opacity-80 group-hover:scale-110 transition-transform">💧</span>
                      <span className={`text-3xl font-black ${getScoreColor(latestCheck.water_intake_score)}`}>{latestCheck.water_intake_score?.toFixed(0)}%</span>
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg">Water Intake</h3>
                    {latestCheck.water_intake_details && (
                      <p className="text-sm font-medium text-gray-600 mt-1">
                        {latestCheck.water_intake_details.days_met_goal}/{latestCheck.water_intake_details.total_days} days met goal (Avg {latestCheck.water_intake_details.daily_avg_ml.toFixed(0)}ml)
                      </p>
                    )}
                  </div>

                  <div className={`metric-card bg-gradient-to-br group ${getScoreBgColor(latestCheck.new_foods_score)}`}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-4xl opacity-80 group-hover:scale-110 transition-transform">🥗</span>
                      <span className={`text-3xl font-black ${getScoreColor(latestCheck.new_foods_score)}`}>{latestCheck.new_foods_score?.toFixed(0)}%</span>
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg">New Foods</h3>
                    {latestCheck.new_foods_details && (
                      <p className="text-sm font-medium text-gray-600 mt-1">
                        {latestCheck.new_foods_details.total_new_foods} new foods tried during period
                      </p>
                    )}
                  </div>

                  <div className={`metric-card bg-gradient-to-br group ${getScoreBgColor(latestCheck.recommendations_match_score)}`}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-4xl opacity-80 group-hover:scale-110 transition-transform">📋</span>
                      <span className={`text-3xl font-black ${getScoreColor(latestCheck.recommendations_match_score)}`}>{latestCheck.recommendations_match_score?.toFixed(0)}%</span>
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg">Recommendations</h3>
                    {latestCheck.recommendations_match_details && (
                      <p className="text-sm font-medium text-gray-600 mt-1">
                        {latestCheck.recommendations_match_details.recommendations_followed}/{latestCheck.recommendations_match_details.total_recommendations} followed
                      </p>
                    )}
                  </div>

                  <div className={`metric-card bg-gradient-to-br group ${getScoreBgColor(latestCheck.healthy_plates_ratio_score)}`}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-4xl opacity-80 group-hover:scale-110 transition-transform">🍽️</span>
                      <span className={`text-3xl font-black ${getScoreColor(latestCheck.healthy_plates_ratio_score)}`}>{latestCheck.healthy_plates_ratio_score?.toFixed(0)}%</span>
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg">Healthy Meals</h3>
                    {latestCheck.healthy_plates_details && (
                      <p className="text-sm font-medium text-gray-600 mt-1">
                        {latestCheck.healthy_plates_details.healthy_meals}/{latestCheck.healthy_plates_details.total_reported_meals} meals optimally portioned
                      </p>
                    )}
                  </div>
                </div>

                {/* Detailed Breakdown */}
                <div className="space-y-4">
                  
                  {/* Water Details */}
                  {latestCheck.water_intake_details && (
                    <details className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden group">
                      <summary className="p-5 cursor-pointer font-bold text-gray-800 bg-white hover:bg-gray-50 transition-colors list-none flex justify-between items-center outline-none">
                        <span className="flex items-center gap-2">💧 Water Intake Details</span>
                        <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                      </summary>
                      <div className="p-5 pt-2 text-sm text-gray-600 grid grid-cols-2 gap-y-3 font-medium">
                        <p>Daily Average: <span className="font-bold text-gray-900">{latestCheck.water_intake_details.daily_avg_ml.toFixed(0)}ml</span></p>
                        <p>Goal: <span className="font-bold text-gray-900">{latestCheck.water_intake_details.goal_ml}ml</span></p>
                        <p>Days Met Goal: <span className="font-bold text-gray-900">{latestCheck.water_intake_details.days_met_goal} / {latestCheck.water_intake_details.total_days}</span></p>
                        <p>Success Rate: <span className="font-bold text-gray-900">{latestCheck.water_intake_details.percentage_days_met.toFixed(1)}%</span></p>
                      </div>
                    </details>
                  )}

                  {/* Recommendations Details */}
                  {latestCheck.recommendations_match_details && (
                    <details className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden group">
                      <summary className="p-5 cursor-pointer font-bold text-gray-800 bg-white hover:bg-gray-50 transition-colors list-none flex justify-between items-center outline-none">
                        <span className="flex items-center gap-2">📋 Recommendations Feedback</span>
                        <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                      </summary>
                      <div className="p-5 pt-2 text-sm font-medium text-gray-600 space-y-4">
                        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-900 italic">
                          "{latestCheck.recommendations_match_details.analysis}"
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {latestCheck.recommendations_match_details.matched_items.length > 0 && (
                            <div className="p-4 bg-white rounded-xl border border-emerald-100">
                              <p className="font-bold text-emerald-600 mb-2 flex items-center gap-2"><span>✓</span> Followed</p>
                              <ul className="space-y-1">
                                {latestCheck.recommendations_match_details.matched_items.map((item, i) => <li key={i}>• {item}</li>)}
                              </ul>
                            </div>
                          )}
                          
                          {latestCheck.recommendations_match_details.unmatched_items.length > 0 && (
                            <div className="p-4 bg-white rounded-xl border border-rose-100">
                              <p className="font-bold text-rose-600 mb-2 flex items-center gap-2"><span>✗</span> Needs Focus</p>
                              <ul className="space-y-1">
                                {latestCheck.recommendations_match_details.unmatched_items.map((item, i) => <li key={i}>• {item}</li>)}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </details>
                  )}
                  
                  {latestCheck.new_foods_details && latestCheck.new_foods_details.foods.length > 0 && (
                    <details className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden group">
                      <summary className="p-5 cursor-pointer font-bold text-gray-800 bg-white hover:bg-gray-50 transition-colors list-none flex justify-between items-center outline-none">
                        <span className="flex items-center gap-2">🥗 New Foods ({latestCheck.new_foods_details.total_new_foods})</span>
                        <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                      </summary>
                      <div className="p-5 pt-2 space-y-2">
                        {latestCheck.new_foods_details.foods.map((food, index) => (
                          <div key={index} className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <span className="font-bold text-gray-900 block">{food.food_name}</span>
                              {food.notes && <span className="text-sm font-medium text-gray-500">{food.notes}</span>}
                            </div>
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full whitespace-nowrap">Diff: {food.difficulty_level}/10</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => handleDeleteCheck(latestCheck.id)}
                    className="px-4 py-2 text-rose-500 font-bold hover:bg-rose-50 rounded-lg text-sm transition-colors"
                  >
                    Delete This Report
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Info Card */}
            <div className="card-glass p-6 bg-gradient-to-br from-indigo-50/50 to-purple-50/50">
              <h3 className="text-sm font-black text-indigo-900 mb-3 flex items-center gap-2 uppercase tracking-wide">
                <span>💡</span> How It Works
              </h3>
              <ul className="text-sm font-medium text-indigo-800 space-y-2">
                <li className="flex gap-2"><span>•</span> AI analyzes your adherence to custom nutrition goals over a timeframe.</li>
                <li className="flex gap-2"><span>•</span> Green (<span className="text-emerald-600 font-bold">80%+</span>) = Exceptional</li>
                <li className="flex gap-2"><span>•</span> Yellow (<span className="text-amber-500 font-bold">60-79%</span>) = Solid effort</li>
                <li className="flex gap-2"><span>•</span> Red (<span className="text-rose-500 font-bold">&lt;60%</span>) = Focus area</li>
              </ul>
            </div>

            {/* Check History */}
            <div className="card-glass p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>🕒</span> History
              </h2>
              {checkHistory.length > 1 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {checkHistory.slice(1).map((check) => (
                    <div key={check.id} className="p-4 bg-white border border-gray-100 rounded-xl hover:border-gray-300 transition-colors group">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-800 text-sm">{check.period_start} <span className="text-gray-400 mx-1">→</span> {check.period_end}</p>
                          <p className="text-xs font-medium text-gray-500">{new Date(check.check_date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <p className={`text-xl font-black ${getScoreColor(check.overall_score)}`}>{check.overall_score?.toFixed(0)}%</p>
                          <button
                            onClick={() => handleDeleteCheck(check.id)}
                            className="text-xs font-bold text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity mt-1"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 font-medium italic p-4 bg-gray-50 rounded-xl text-center">No past history found.</p>
              )}
            </div>

          </div>

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
        details summary::-webkit-details-marker {
          display:none;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>
    </div>
  );
}

export default CompliancePage;