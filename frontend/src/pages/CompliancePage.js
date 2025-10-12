import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import complianceService from '../services/complianceService';
import recommendationService from '../services/recommendationService';

function CompliancePage() {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [complianceReport, setComplianceReport] = useState(null);
  const [visitPeriod, setVisitPeriod] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const data = await recommendationService.getAllRecommendations();
      setRecommendations(data);
      
      // Auto-select most recent recommendation
      if (data.length > 0) {
        setSelectedRecommendation(data[0]);
        // Set default period (2 weeks from visit date)
        const visitDate = new Date(data[0].visit_date);
        const endDate = new Date(visitDate);
        endDate.setDate(endDate.getDate() + 14);
        setVisitPeriod(`${data[0].visit_date} to ${endDate.toISOString().split('T')[0]}`);
      }
    } catch (err) {
      console.error('Error loading recommendations:', err);
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const loadComplianceReport = async () => {
    if (!selectedRecommendation || !visitPeriod) {
      setError('Please select a recommendation and visit period');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const report = await complianceService.getComplianceReport(
        selectedRecommendation.id,
        visitPeriod
      );
      setComplianceReport(report);
    } catch (err) {
      console.error('Error loading compliance report:', err);
      setError(err.response?.data?.detail || 'Failed to load compliance report');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'not_started': return 'bg-gray-400';
      case 'abandoned': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'not_started': return 'Not Started';
      case 'abandoned': return 'Abandoned';
      default: return status;
    }
  };

  if (loading && recommendations.length === 0) {
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
                Track your progress against nutritionist recommendations
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

        {/* No Recommendations */}
        {recommendations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <span className="text-6xl mb-4 block">📊</span>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No Recommendations to Track
            </h3>
            <p className="text-gray-600 mb-4">
              Upload nutritionist recommendations first to track compliance
            </p>
            <button
              onClick={() => navigate('/recommendations')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Recommendations
            </button>
          </div>
        ) : (
          <>
            {/* Selection Panel */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                📋 Select Report Parameters
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Recommendation Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Visit / Recommendation Set
                  </label>
                  <select
                    value={selectedRecommendation?.id || ''}
                    onChange={(e) => {
                      const rec = recommendations.find(r => r.id === parseInt(e.target.value));
                      setSelectedRecommendation(rec);
                      if (rec) {
                        const visitDate = new Date(rec.visit_date);
                        const endDate = new Date(visitDate);
                        endDate.setDate(endDate.getDate() + 14);
                        setVisitPeriod(`${rec.visit_date} to ${endDate.toISOString().split('T')[0]}`);
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {recommendations.map(rec => (
                      <option key={rec.id} value={rec.id}>
                        {new Date(rec.visit_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })} - {rec.recommendations.length} recommendations
                      </option>
                    ))}
                  </select>
                </div>

                {/* Period Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tracking Period
                  </label>
                  <input
                    type="text"
                    value={visitPeriod}
                    onChange={(e) => setVisitPeriod(e.target.value)}
                    placeholder="YYYY-MM-DD to YYYY-MM-DD"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: 2025-10-01 to 2025-10-15
                  </p>
                </div>
              </div>

              <button
                onClick={loadComplianceReport}
                disabled={!selectedRecommendation || !visitPeriod || loading}
                className={`mt-4 px-6 py-3 rounded-lg text-white font-medium ${
                  !selectedRecommendation || !visitPeriod || loading
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? 'Loading Report...' : 'Generate Report'}
              </button>
            </div>

            {/* Compliance Report */}
            {complianceReport && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  {/* Total */}
                  <div className="bg-white rounded-lg shadow-md p-4">
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-3xl font-bold text-gray-800">
                      {complianceReport.total_recommendations}
                    </p>
                  </div>

                  {/* Completed */}
                  <div className="bg-green-50 rounded-lg shadow-md p-4">
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-3xl font-bold text-green-600">
                      {complianceReport.completed}
                    </p>
                  </div>

                  {/* In Progress */}
                  <div className="bg-yellow-50 rounded-lg shadow-md p-4">
                    <p className="text-sm text-gray-600">In Progress</p>
                    <p className="text-3xl font-bold text-yellow-600">
                      {complianceReport.in_progress}
                    </p>
                  </div>

                  {/* Not Started */}
                  <div className="bg-gray-50 rounded-lg shadow-md p-4">
                    <p className="text-sm text-gray-600">Not Started</p>
                    <p className="text-3xl font-bold text-gray-600">
                      {complianceReport.not_started}
                    </p>
                  </div>

                  {/* Abandoned */}
                  <div className="bg-red-50 rounded-lg shadow-md p-4">
                    <p className="text-sm text-gray-600">Abandoned</p>
                    <p className="text-3xl font-bold text-red-600">
                      {complianceReport.abandoned}
                    </p>
                  </div>
                </div>

                {/* Overall Progress */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">
                      Overall Compliance
                    </h2>
                    <span className="text-3xl font-bold text-blue-600">
                      {complianceReport.overall_completion_rate}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-6">
                    <div
                      className="bg-blue-600 h-6 rounded-full transition-all flex items-center justify-center text-white text-sm font-medium"
                      style={{ width: `${complianceReport.overall_completion_rate}%` }}
                    >
                      {complianceReport.overall_completion_rate > 10 && 
                        `${complianceReport.overall_completion_rate}%`
                      }
                    </div>
                  </div>
                </div>

                {/* Recommendations Details */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    📝 Detailed Breakdown
                  </h2>

                  {complianceReport.items.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No compliance data recorded yet for this period
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {complianceReport.items.map((item, index) => (
                        <div
                          key={index}
                          className="p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-gray-800 mb-2">
                                {item.recommendation_text}
                              </p>
                              {item.notes && (
                                <p className="text-sm text-gray-600 mb-2">
                                  📝 {item.notes}
                                </p>
                              )}
                              <div className="flex items-center gap-2">
                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full capitalize">
                                  {item.category.replace('_', ' ')}
                                </span>
                                <span className={`text-xs px-2 py-1 text-white rounded-full ${getStatusColor(item.status)}`}>
                                  {getStatusText(item.status)}
                                </span>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <div className="text-2xl font-bold text-blue-600">
                                {item.completion_rate}%
                              </div>
                              <div className="text-xs text-gray-500">completion</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-blue-900 mb-2">💡 How Compliance Tracking Works</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Select a set of recommendations from a specific visit</li>
                <li>• Choose the time period you want to track (usually 2 weeks between visits)</li>
                <li>• The system analyzes your meals, snacks, and weekly notes</li>
                <li>• See which recommendations you followed and which need attention</li>
                <li>• Note: Compliance data needs to be manually recorded in the system</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CompliancePage;