import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import complianceService from '../services/complianceService';

function CompliancePage() {
  const navigate = useNavigate();
  const [latestCheck, setLatestCheck] = useState(null);
  const [checkHistory, setCheckHistory] = useState([]);
  const [isDueInfo, setIsDueInfo] = useState(null);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [loading, setLoading] = useState(true);
  const [runningCheck, setRunningCheck] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load latest check
      try {
        const latest = await complianceService.getLatestCheck();
        setLatestCheck(latest);
      } catch (err) {
        if (err.response?.status !== 404) {
          console.error('Error loading latest check:', err);
        }
        // 404 is ok - means no checks yet
      }

      // Load check history
      const history = await complianceService.getCheckHistory(5);
      setCheckHistory(history);

      // Check if due
      const dueInfo = await complianceService.checkIfDue();
      setIsDueInfo(dueInfo);

      // Set default dates (last 2 weeks)
      const today = new Date();
      const twoWeeksAgo = new Date(today);
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      setPeriodStart(twoWeeksAgo.toISOString().split('T')[0]);
      setPeriodEnd(today.toISOString().split('T')[0]);

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  };

  const handleRunCheck = async () => {
    if (!periodStart || !periodEnd) {
      setError('Please select both start and end dates');
      return;
    }

    try {
      setRunningCheck(true);
      setError('');
      setSuccessMessage('');

      const result = await complianceService.runComplianceCheck(periodStart, periodEnd);
      setLatestCheck(result);
      setSuccessMessage('✅ Compliance check completed successfully!');
      
      // Reload history
      const history = await complianceService.getCheckHistory(5);
      setCheckHistory(history);

      // Check due status again
      const dueInfo = await complianceService.checkIfDue();
      setIsDueInfo(dueInfo);

    } catch (err) {
      console.error('Error running check:', err);
      setError(err.response?.data?.detail || 'Failed to run compliance check');
    } finally {
      setRunningCheck(false);
    }
  };

  const handleDeleteCheck = async () => {
    if (!latestCheck) return;
    
    if (!window.confirm('Are you sure you want to delete this compliance check?')) {
      return;
    }

    try {
      setError('');
      await complianceService.deleteCheck(latestCheck.id);
      setLatestCheck(null); 
      setSuccessMessage('🗑️ Compliance check deleted successfully!');
      await loadData();
    } catch (err) {
      console.error('Error deleting check:', err);
      setError(err.response?.data?.detail || 'Failed to delete compliance check');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-50';
    if (score >= 60) return 'bg-yellow-50';
    if (score >= 40) return 'bg-orange-50';
    return 'bg-red-50';
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
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Compliance Tracking</h1>
              <p className="text-sm text-gray-600 mt-1">
                Automated analysis of your nutrition goals
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
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Due Status Banner */}
        {isDueInfo && isDueInfo.due && (
          <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-3">⏰</span>
              <div>
                <h3 className="font-semibold text-blue-900">Time for a Check!</h3>
                <p className="text-sm text-blue-800">{isDueInfo.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Run New Check Panel */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            🎯 Run New Compliance Check
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Period Start
              </label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Period End
              </label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={handleRunCheck}
            disabled={runningCheck || !periodStart || !periodEnd}
            className={`w-full px-6 py-3 rounded-lg text-white font-medium ${
              runningCheck || !periodStart || !periodEnd
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {runningCheck ? '⏳ Running Check...' : '▶️ Run Compliance Check'}
          </button>

          <p className="text-xs text-gray-500 mt-2">
            The system will analyze: water intake, new foods tried, recommendations match, and healthy plates ratio
          </p>
        </div>

        {/* Latest Check Results */}
        {latestCheck && (
          <>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Latest Check Results
                  </h2>
                  <p className="text-sm text-gray-600">
                    Period: {latestCheck.period_start} to {latestCheck.period_end}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleDeleteCheck}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  >
                    🗑️ Delete Check
                  </button>
                  <div className="text-right">
                    <div className={`text-4xl font-bold ${getScoreColor(latestCheck.overall_score)}`}>
                      {latestCheck.overall_score?.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">Overall Score</div>
                  </div>
                </div>
              </div>

              {/* 4 Scores Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Water Intake */}
                <div className={`rounded-lg shadow-md p-4 ${getScoreBgColor(latestCheck.water_intake_score || 0)}`}>
                  <div className="text-center mb-2">
                    <span className="text-3xl">💧</span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-700 text-center mb-2">
                    Water Intake
                  </h3>
                  <div className={`text-3xl font-bold text-center ${getScoreColor(latestCheck.water_intake_score || 0)}`}>
                    {latestCheck.water_intake_score?.toFixed(0)}%
                  </div>
                  {latestCheck.water_intake_details && (
                    <div className="mt-3 text-xs text-gray-600 space-y-1">
                      <p>Avg: {latestCheck.water_intake_details.daily_avg_ml?.toFixed(0)} ml/day</p>
                      <p>Goal: {latestCheck.water_intake_details.goal_ml} ml/day</p>
                      <p>Days met: {latestCheck.water_intake_details.days_met_goal}/{latestCheck.water_intake_details.total_days}</p>
                    </div>
                  )}
                </div>

                {/* New Foods */}
                <div className={`rounded-lg shadow-md p-4 ${getScoreBgColor(latestCheck.new_foods_score || 0)}`}>
                  <div className="text-center mb-2">
                    <span className="text-3xl">🍎</span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-700 text-center mb-2">
                    New Foods
                  </h3>
                  <div className={`text-3xl font-bold text-center ${getScoreColor(latestCheck.new_foods_score || 0)}`}>
                    {latestCheck.new_foods_score?.toFixed(0)}%
                  </div>
                  {latestCheck.new_foods_details && (
                    <div className="mt-3 text-xs text-gray-600 space-y-1">
                      <p>Total new foods: {latestCheck.new_foods_details.total_new_foods}</p>
                      {latestCheck.new_foods_details.foods?.slice(0, 2).map((food, idx) => (
                        <p key={idx} className="truncate">• {food.food_name}</p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recommendations Match */}
                <div className={`rounded-lg shadow-md p-4 ${getScoreBgColor(latestCheck.recommendations_match_score || 0)}`}>
                  <div className="text-center mb-2">
                    <span className="text-3xl">📋</span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-700 text-center mb-2">
                    Recommendations
                  </h3>
                  <div className={`text-3xl font-bold text-center ${getScoreColor(latestCheck.recommendations_match_score || 0)}`}>
                    {latestCheck.recommendations_match_score?.toFixed(0)}%
                  </div>
                  {latestCheck.recommendations_match_details && (
                    <div className="mt-3 text-xs text-gray-600 space-y-1">
                      <p>Followed: {latestCheck.recommendations_match_details.recommendations_followed}/{latestCheck.recommendations_match_details.total_recommendations}</p>
                      <p className="italic truncate">{latestCheck.recommendations_match_details.analysis}</p>
                    </div>
                  )}
                </div>

                {/* Healthy Plates */}
                <div className={`rounded-lg shadow-md p-4 ${getScoreBgColor(latestCheck.healthy_plates_ratio_score || 0)}`}>
                  <div className="text-center mb-2">
                    <span className="text-3xl">🍽️</span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-700 text-center mb-2">
                    Healthy Plates
                  </h3>
                  <div className={`text-3xl font-bold text-center ${getScoreColor(latestCheck.healthy_plates_ratio_score || 0)}`}>
                    {latestCheck.healthy_plates_ratio_score?.toFixed(0)}%
                  </div>
                  {latestCheck.healthy_plates_details && (
                    <div className="mt-3 text-xs text-gray-600 space-y-1">
                      <p>Healthy: {latestCheck.healthy_plates_details.healthy_plates}</p>
                      <p>Total: {latestCheck.healthy_plates_details.total_plates}</p>
                      <p>Ratio: {latestCheck.healthy_plates_details.ratio_percentage?.toFixed(1)}%</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed Analysis */}
              {latestCheck.recommendations_match_details && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">📊 LLM Analysis</h3>
                  <p className="text-sm text-gray-700 mb-3">{latestCheck.recommendations_match_details.analysis}</p>
                  
                  {latestCheck.recommendations_match_details.matched_items?.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-xs font-semibold text-green-700 mb-1">✅ Followed:</h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {latestCheck.recommendations_match_details.matched_items.map((item, idx) => (
                          <li key={idx}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {latestCheck.recommendations_match_details.unmatched_items?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-red-700 mb-1">❌ Not Followed:</h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {latestCheck.recommendations_match_details.unmatched_items.map((item, idx) => (
                          <li key={idx}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* History */}
        {checkHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              📈 Check History
            </h2>
            <div className="space-y-3">
              {checkHistory.map((check) => (
                <div
                  key={check.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">
                      {check.period_start} to {check.period_end}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(check.check_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className={`text-2xl font-bold ${getScoreColor(check.overall_score || 0)}`}>
                    {check.overall_score?.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 How Automated Compliance Works</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Water Intake:</strong> Checks if you met your daily water goal</li>
            <li>• <strong>New Foods:</strong> Counts new foods you tried (10 points each)</li>
            <li>• <strong>Recommendations Match:</strong> AI analyzes if new foods match nutritionist advice</li>
            <li>• <strong>Healthy Plates:</strong> Percentage of meals with proper plate ratios (50/30/20)</li>
            <li>• <strong>Overall Score:</strong> Average of all four checks</li>
          </ul>
        </div>

        {/* No Checks Yet */}
        {!latestCheck && checkHistory.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <span className="text-6xl mb-4 block">🎯</span>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No Compliance Checks Yet
            </h3>
            <p className="text-gray-600 mb-4">
              Run your first compliance check to see how well you're following your nutrition goals
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CompliancePage;