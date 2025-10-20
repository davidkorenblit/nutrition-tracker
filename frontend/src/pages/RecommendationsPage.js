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
  const [uploadedFileInfo, setUploadedFileInfo] = useState(null);
  
  // 🆕 Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    loadRecommendations();
    
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
      
      // If no recommendations, clear upload info
      if (data.length === 0) {
        setUploadedFileInfo(null);
        localStorage.removeItem('uploadedFileInfo');
      }
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
      
      const result = await recommendationService.uploadRecommendations(visitDate, selectedFile);
      
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
      
      await loadRecommendations();
      
      setSelectedFile(null);
      setVisitDate(new Date().toISOString().split('T')[0]);
    } catch (err) {
      console.error('Error uploading:', err);
      setError(err.response?.data?.detail || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  // 🆕 Open delete modal
  const openDeleteModal = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  // 🆕 Confirm delete
  const confirmDelete = async () => {
    try {
      setLoading(true);
      await recommendationService.deleteRecommendation(deleteId);
      const updatedData = await recommendationService.getAllRecommendations();
      setRecommendations(updatedData);
      
      // If no recommendations left, clear upload info
      if (updatedData.length === 0) {
        setUploadedFileInfo(null);
        localStorage.removeItem('uploadedFileInfo');
      }
      
      setShowDeleteModal(false);
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } catch (err) {
      console.error('Error deleting:', err);
      setError(err.response?.data?.detail || 'Failed to delete recommendation');
      setShowDeleteModal(false);
    } finally {
      setLoading(false);
      setDeleteId(null);
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

        {/* Upload Success Confirmation */}
        {uploadedFileInfo && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-green-600 text-xl">✓</span>
              <p className="text-sm text-green-800">
                <span className="font-medium">קובץ הועלה בהצלחה!</span> נמצאו {uploadedFileInfo.recommendationsCount} המלצות
              </p>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            📤 Upload New Recommendations
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search recommendations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

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
            <span className="text-6xl mb-4 block">📋</span>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No Recommendations Yet
            </h3>
            <p className="text-gray-600">
              Upload a Word document with your nutritionist's recommendations to get started
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredRecommendations.map((rec) => (
              <div key={rec.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4 pb-4 border-b">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Visit: {new Date(rec.visit_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {rec.recommendations.length} recommendations
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📅</span>
                    <button
                      onClick={() => openDeleteModal(rec.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {rec.recommendations
                    .filter(item => 
                      filterCategory === 'all' || item.category === filterCategory
                    )
                    .map((item) => (
                      <div
                        key={item.id}
                        className={`p-4 rounded-lg border ${getCategoryColor(item.category)}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{getCategoryIcon(item.category)}</span>
                          <div className="flex-1">
                            <p className="text-gray-800 font-medium">{item.text}</p>
                            {item.notes && (
                              <p className="text-sm text-gray-600 mt-1">{item.notes}</p>
                            )}
                            {item.target_value && (
                              <p className="text-sm text-blue-600 mt-1">
                                Target: {item.target_value}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
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

      {/* 🆕 Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <span className="text-3xl">🗑️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                מחיקת המלצות
              </h3>
              <p className="text-gray-600 mb-6">
                האם אתה בטוח שברצונך למחוק את סט ההמלצות הזה? פעולה זו לא ניתנת לביטול.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors"
                >
                  מחק
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <span className="text-3xl">✓</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                נמחק בהצלחה!
              </h3>
              <p className="text-gray-600">
                ההמלצות נמחקו מהמערכת
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecommendationsPage;