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

      // טען את הבדיקה האחרונה
      try {
        const latest = await complianceService.getLatestCheck();
        setLatestCheck(latest);
      } catch (err) {
        if (err.response?.status !== 404) {
          throw err;
        }
        // אין בדיקות קודמות - זה בסדר
        setLatestCheck(null);
      }

      // טען היסטוריה
      const history = await complianceService.getCheckHistory(10);
      setCheckHistory(history);

    } catch (err) {
      console.error('Error loading compliance data:', err);
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
      
      // רענן את הנתונים
      await loadComplianceData();
      
      // סגור את הטופס
      setShowNewCheckForm(false);
      setNewCheckData({ period_start: '', period_end: '' });
      
    } catch (err) {
      console.error('Error running check:', err);
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
      console.error('Error deleting check:', err);
      setError('Failed to delete check');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xl text-gray-600">Loading compliance data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Compliance Tracking</h1>
              <p className="text-sm text-gray-600 mt-1">
                Monitor your adherence to nutrition goals
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

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* New Check Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowNewCheckForm(!showNewCheckForm)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            {showNewCheckForm ? 'Cancel' : '+ Run New Compliance Check'}
          </button>
        </div>

        {/* New Check Form */}
        {showNewCheckForm && (
          <div className="mb-6 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Run New Compliance Check</h2>
            <form onSubmit={handleRunCheck} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Period Start
                  </label>
                  <input
                    type="date"
                    required
                    value={newCheckData.period_start}
                    onChange={(e) => setNewCheckData({ ...newCheckData, period_start: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Period End
                  </label>
                  <input
                    type="date"
                    required
                    value={newCheckData.period_end}
                    onChange={(e) => setNewCheckData({ ...newCheckData, period_end: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={runningCheck}
                className={`px-6 py-2 rounded-lg text-white font-medium ${
                  runningCheck ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {runningCheck ? 'Running Check...' : 'Run Check'}
              </button>
            </form>
          </div>
        )}

        {/* Latest Check */}
        {latestCheck && (
          <div className="mb-8 bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Latest Compliance Check</h2>
              <div className="text-sm text-gray-600">
                {new Date(latestCheck.check_date).toLocaleDateString()} 
                <span className="mx-2">•</span>
                {latestCheck.period_start} to {latestCheck.period_end}
              </div>
            </div>

            {/* Overall Score */}
            <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Overall Compliance Score</p>
                <p className={`text-5xl font-bold ${getScoreColor(latestCheck.overall_score)}`}>
                  {latestCheck.overall_score?.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Individual Scores */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Water Intake */}
              <div className={`p-4 rounded-lg ${getScoreBgColor(latestCheck.water_intake_score)}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">💧</span>
                  <span className={`text-2xl font-bold ${getScoreColor(latestCheck.water_intake_score)}`}>
                    {latestCheck.water_intake_score?.toFixed(0)}%
                  </span>
                </div>
                <h3 className="font-semibold text-gray-800">Water Intake</h3>
                {latestCheck.water_intake_details && (
                  <div className="mt-2 text-sm text-gray-700">
                    <p>{latestCheck.water_intake_details.days_met_goal}/{latestCheck.water_intake_details.total_days} days met goal</p>
                    <p>Avg: {latestCheck.water_intake_details.daily_avg_ml.toFixed(0)}ml</p>
                  </div>
                )}
              </div>

              {/* New Foods */}
              <div className={`p-4 rounded-lg ${getScoreBgColor(latestCheck.new_foods_score)}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">🥗</span>
                  <span className={`text-2xl font-bold ${getScoreColor(latestCheck.new_foods_score)}`}>
                    {latestCheck.new_foods_score?.toFixed(0)}%
                  </span>
                </div>
                <h3 className="font-semibold text-gray-800">New Foods</h3>
                {latestCheck.new_foods_details && (
                  <div className="mt-2 text-sm text-gray-700">
                    <p>{latestCheck.new_foods_details.total_new_foods} foods tried</p>
                  </div>
                )}
              </div>

              {/* Recommendations Match */}
              <div className={`p-4 rounded-lg ${getScoreBgColor(latestCheck.recommendations_match_score)}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">📋</span>
                  <span className={`text-2xl font-bold ${getScoreColor(latestCheck.recommendations_match_score)}`}>
                    {latestCheck.recommendations_match_score?.toFixed(0)}%
                  </span>
                </div>
                <h3 className="font-semibold text-gray-800">Recommendations</h3>
                {latestCheck.recommendations_match_details && (
                  <div className="mt-2 text-sm text-gray-700">
                    <p>{latestCheck.recommendations_match_details.recommendations_followed}/{latestCheck.recommendations_match_details.total_recommendations} followed</p>
                  </div>
                )}
              </div>

              {/* Healthy Plates */}
              <div className={`p-4 rounded-lg ${getScoreBgColor(latestCheck.healthy_plates_ratio_score)}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">🍽️</span>
                  <span className={`text-2xl font-bold ${getScoreColor(latestCheck.healthy_plates_ratio_score)}`}>
                    {latestCheck.healthy_plates_ratio_score?.toFixed(0)}%
                  </span>
                </div>
                <h3 className="font-semibold text-gray-800">Healthy Meals</h3>
                {latestCheck.healthy_plates_details && (
                  <div className="mt-2 text-sm text-gray-700">
                    <p>{latestCheck.healthy_plates_details.healthy_meals}/{latestCheck.healthy_plates_details.total_reported_meals} meals</p>
                  </div>
                )}
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="mt-6 space-y-4">
              {/* Water Details */}
              {latestCheck.water_intake_details && (
                <details className="p-4 bg-gray-50 rounded-lg">
                  <summary className="cursor-pointer font-semibold text-gray-800">
                    💧 Water Intake Details
                  </summary>
                  <div className="mt-3 text-sm text-gray-700 space-y-1">
                    <p>• Daily Average: {latestCheck.water_intake_details.daily_avg_ml.toFixed(0)}ml</p>
                    <p>• Goal: {latestCheck.water_intake_details.goal_ml}ml</p>
                    <p>• Days Met Goal: {latestCheck.water_intake_details.days_met_goal} / {latestCheck.water_intake_details.total_days}</p>
                    <p>• Success Rate: {latestCheck.water_intake_details.percentage_days_met.toFixed(1)}%</p>
                  </div>
                </details>
              )}

              {/* New Foods Details */}
              {latestCheck.new_foods_details && latestCheck.new_foods_details.foods.length > 0 && (
                <details className="p-4 bg-gray-50 rounded-lg">
                  <summary className="cursor-pointer font-semibold text-gray-800">
                    🥗 New Foods Details ({latestCheck.new_foods_details.total_new_foods} foods)
                  </summary>
                  <div className="mt-3 space-y-2">
                    {latestCheck.new_foods_details.foods.map((food, index) => (
                      <div key={index} className="p-3 bg-white rounded border">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-800">{food.food_name}</span>
                          <span className="text-sm text-gray-600">
                            Difficulty: {food.difficulty_level}/10
                          </span>
                        </div>
                        {food.notes && (
                          <p className="text-sm text-gray-600 mt-1">{food.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* Recommendations Details */}
              {latestCheck.recommendations_match_details && (
                <details className="p-4 bg-gray-50 rounded-lg">
                  <summary className="cursor-pointer font-semibold text-gray-800">
                    📋 Recommendations Match Details
                  </summary>
                  <div className="mt-3 text-sm text-gray-700 space-y-2">
                    <p className="italic">{latestCheck.recommendations_match_details.analysis}</p>
                    
                    {latestCheck.recommendations_match_details.matched_items.length > 0 && (
                      <div>
                        <p className="font-semibold text-green-700 mt-3">✓ Followed:</p>
                        <ul className="list-disc list-inside ml-2">
                          {latestCheck.recommendations_match_details.matched_items.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {latestCheck.recommendations_match_details.unmatched_items.length > 0 && (
                      <div>
                        <p className="font-semibold text-red-700 mt-3">✗ Not Followed:</p>
                        <ul className="list-disc list-inside ml-2">
                          {latestCheck.recommendations_match_details.unmatched_items.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Healthy Plates Details */}
              {latestCheck.healthy_plates_details && (
                <details className="p-4 bg-gray-50 rounded-lg">
                  <summary className="cursor-pointer font-semibold text-gray-800">
                    🍽️ Healthy Meals Details
                  </summary>
                  <div className="mt-3 text-sm text-gray-700 space-y-1">
                    <p>• Total Reported Meals: {latestCheck.healthy_plates_details.total_reported_meals}</p>
                    <p>• Healthy Meals (50/30/20): {latestCheck.healthy_plates_details.healthy_meals}</p>
                    <p>• Success Rate: {latestCheck.healthy_plates_details.ratio_percentage.toFixed(1)}%</p>
                  </div>
                </details>
              )}
            </div>

            {/* Delete Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => handleDeleteCheck(latestCheck.id)}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm"
              >
                Delete This Check
              </button>
            </div>
          </div>
        )}

        {/* Check History */}
        {checkHistory.length > 1 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Check History</h2>
            <div className="space-y-3">
              {checkHistory.slice(1).map((check) => (
                <div key={check.id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">
                        {check.period_start} to {check.period_end}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(check.check_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${getScoreColor(check.overall_score)}`}>
                        {check.overall_score?.toFixed(1)}%
                      </p>
                      <button
                        onClick={() => handleDeleteCheck(check.id)}
                        className="text-sm text-red-600 hover:underline mt-1"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Data State */}
        {!latestCheck && checkHistory.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <span className="text-6xl mb-4 block">📊</span>
            <p className="text-xl text-gray-600 mb-2">No Compliance Checks Yet</p>
            <p className="text-gray-500 mb-6">
              Run your first compliance check to see how you're doing
            </p>
            <button
              onClick={() => setShowNewCheckForm(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Run First Check
            </button>
          </div>
        )}

        {/* Info Card */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 About Compliance Checks</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Checks analyze your adherence to nutrition goals over a specific period</li>
            <li>• Each metric is scored 0-100%, with an overall average score</li>
            <li>• Run checks weekly or bi-weekly to track progress over time</li>
            <li>• Green (80%+) = Excellent, Yellow (60-79%) = Good, Red (&lt;60%) = Needs Improvement</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default CompliancePage;