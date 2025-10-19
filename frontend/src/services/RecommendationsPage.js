import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import recommendationService from '../services/recommendationService';

function RecommendationsPage() {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  
  // ✨ NEW: State for upload confirmation
  const [uploadedFileInfo, setUploadedFileInfo] = useState(null);

  useEffect(() => {
    loadRecommendations();
    
    // Load saved upload info from localStorage
    const savedUploadInfo = localStorage.getItem('uploadedFileInfo');
    if (savedUploadInfo) {
      setUploadedFileInfo(JSON.parse(savedUploadInfo));
    }
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const data = await recommendationService.getAllRecommendations();
      setRecommendations(data);
    } catch (err) {
      console.error('Error loading recommendations:', err);
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith('.docx')) {
        setError('Please select a .docx file');
        return;
      }
      setSelectedFile(file);
      setError('');
      // Clear previous upload info when selecting new file
      setUploadedFileInfo(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    try {
      setUploading(true);
      setError('');
      
      // Upload the file
      const result = await recommendationService.uploadRecommendations(visitDate, selectedFile);
      
      // ✨ NEW: Save upload info for display
      const uploadInfo = {
        fileName: selectedFile.name,
        uploadDate: new Date().toLocaleString('he-IL', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }),
        visitDate: visitDate,
        recommendationsCount: result?.recommendations?.length || 0
      };
      
      setUploadedFileInfo(uploadInfo);
      localStorage.setItem('uploadedFileInfo', JSON.stringify(uploadInfo));
      
      // Reload recommendations
      await loadRecommendations();
      
      // Reset form
      setSelectedFile(null);
      setVisitDate(new Date().toISOString().split('T')[0]);
    } catch (err) {
      console.error('Error uploading:', err);
      setError(err.response?.data?.detail || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  // 🆕 Delete function
  const handleDelete = async (recommendationId) => {
    if (!window.confirm('Are you sure you want to delete this recommendation set? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await recommendationService.deleteRecommendation(recommendationId);
      await loadRecommendations();
      alert('Recommendation deleted successfully!');
    } catch (err) {
      console.error('Error deleting:', err);
      setError(err.response?.data?.detail || 'Failed to delete recommendation');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'new_food': return '🥗';
      case 'quantity': return '💧';
      case 'habit': return '🔄';
      case 'general': return '📝';
      default: return '📋';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'new_food': return 'bg-green-100 text-green-800 border-green-200';
      case 'quantity': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'habit': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'general': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredRecommendations = recommendations.filter(rec => {
    // Search filter
    const matchesSearch = rec.recommendations.some(item =>
      item.text.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return matchesSearch;
  });

  if (loading && recommendations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xl text-gray-600">Loading recommendations...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Recommendations</h1>
              <p className="text-sm text-gray-600 mt-1">
                Upload and view nutritionist recommendations
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

        {/* ✨ NEW: Upload Success Confirmation */}
        {uploadedFileInfo && (
          <div className="mb-6 bg-green-50 border-2 border-green-300 rounded-lg p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-2xl">✓</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-900 mb-3">
                  קובץ הועלה בהצלחה!
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <p className="text-gray-600 mb-1">שם הקובץ:</p>
                    <p className="font-medium text-gray-900">{uploadedFileInfo.fileName}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <p className="text-gray-600 mb-1">תאריך ביקור:</p>
                    <p className="font-medium text-gray-900">{uploadedFileInfo.visitDate}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <p className="text-gray-600 mb-1">הועלה בתאריך:</p>
                    <p className="font-medium text-gray-900">{uploadedFileInfo.uploadDate}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <p className="text-gray-600 mb-1">מספר המלצות שנמצאו:</p>
                    <p className="font-medium text-green-600 text-lg">
                      {uploadedFileInfo.recommendationsCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            📤 Upload New Recommendations
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* File Input */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Word Document (.docx)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept=".docx"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-medium
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100
                    cursor-pointer"
                />
                {selectedFile && (
                  <span className="text-sm text-green-600">✓ {selectedFile.name}</span>
                )}
              </div>
            </div>

            {/* Visit Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visit Date
              </label>
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className={`mt-4 px-6 py-3 rounded-lg text-white font-medium ${
              !selectedFile || uploading
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {uploading ? 'Uploading...' : 'Upload & Parse'}
          </button>
        </div>

        {/* Filters */}
        {recommendations.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search recommendations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="new_food">🥗 New Food</option>
                  <option value="quantity">💧 Quantity</option>
                  <option value="habit">🔄 Habit</option>
                  <option value="general">📝 General</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations List */}
        {recommendations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No recommendations yet
            </h3>
            <p className="text-gray-500">
              Upload a Word document with your nutritionist's recommendations to get started
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecommendations.map((visit) => (
              <div key={visit.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        Visit: {new Date(visit.visit_date).toLocaleDateString('he-IL')}
                      </h3>
                      <span className="px-3 py-1 bg-white bg-opacity-20 text-white rounded-full text-sm inline-block mt-2">
                        {visit.recommendations.length} recommendations
                      </span>
                    </div>
                    {/* 🆕 Delete Button */}
                    <button
                      onClick={() => handleDelete(visit.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {visit.recommendations.map((item, idx) => (
                    <div
                      key={idx}
                      className="mb-4 p-4 border-l-4 border-blue-400 bg-gray-50 rounded-r-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-gray-800 mb-2">{item.text}</p>
                          <div className="flex flex-wrap gap-2">
                            {item.tracked && (
                              <span className="text-xs px-2 py-1 bg-green-500 text-white rounded-full">
                                Tracked
                              </span>
                            )}
                            <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded-full capitalize">
                              {item.category.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 How it works</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Upload a .docx file with your nutritionist's recommendations</li>
            <li>• The system will automatically parse and categorize them</li>
            <li>• Use these recommendations in the Compliance page to track your progress</li>
            <li>• You can filter and search through all your recommendations</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default RecommendationsPage;