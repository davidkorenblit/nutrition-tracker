import React, { useState, useEffect, useCallback } from 'react';
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
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const loadRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await recommendationService.getAllRecommendations();
      setRecommendations(data);
      
      if (data.length === 0) {
        setUploadedFileInfo(null);
        localStorage.removeItem('uploadedFileInfo');
      }
    } catch (err) {
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecommendations();
    const savedUploadInfo = localStorage.getItem('uploadedFileInfo');
    if (savedUploadInfo) {
      setUploadedFileInfo(JSON.parse(savedUploadInfo));
    }
  }, [loadRecommendations]);

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
          year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
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
      setError(err.response?.data?.detail || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const openDeleteModal = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      await recommendationService.deleteRecommendation(deleteId);
      const updatedData = await recommendationService.getAllRecommendations();
      setRecommendations(updatedData);
      
      if (updatedData.length === 0) {
        setUploadedFileInfo(null);
        localStorage.removeItem('uploadedFileInfo');
      }
      
      setShowDeleteModal(false);
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } catch (err) {
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
      case 'new_food': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'quantity': return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'habit': return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'general': return 'bg-gray-50 text-gray-800 border-gray-200';
      default: return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  const filteredRecommendations = recommendations.filter(rec => {
    // We don't filter the outer array, only the inner recommendations
    return true; 
  }).map(rec => ({
    ...rec,
    recommendations: rec.recommendations.filter(item => {
      const matchSearch = item.text.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = filterCategory === 'all' || item.category === filterCategory;
      return matchSearch && matchCat;
    })
  })).filter(rec => rec.recommendations.length > 0); // Hide empty visits

  if (loading && recommendations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 bg-gradient-mesh flex items-center justify-center">
        <div className="card-glass p-10 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
          <div className="text-xl font-medium text-gray-600">Loading Recommendations...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 bg-gradient-mesh py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="card-glass p-6 md:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500 tracking-tight flex items-center gap-3">
              <span>📋</span> Recommendations
            </h1>
            <p className="text-gray-500 mt-1 font-medium ml-11">
              Upload and view nutritionist recommendations
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm flex items-center gap-2"
          >
            <span>←</span> Back
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {uploadedFileInfo && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-lg">✓</div>
              <p className="text-sm font-medium text-emerald-800">
                <span className="font-bold block text-emerald-900 text-base">File uploaded successfully!</span>
                Found {uploadedFileInfo.recommendationsCount} recommendations
              </p>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="card-glass p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="text-2xl">📤</span> Upload New Document
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Word Document (.docx)</label>
              <div className="flex items-center gap-3 w-full border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 hover:bg-white transition-colors">
                <input
                  type="file"
                  accept=".docx"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-bold
                    file:bg-amber-100 file:text-amber-700
                    hover:file:bg-amber-200 transition-colors
                    cursor-pointer"
                />
              </div>
              {selectedFile && (
                <p className="text-sm font-bold text-emerald-600 mt-2 ml-1">✓ {selectedFile.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Visit Date</label>
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-gray-800 transition-all"
              />
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className={`mt-6 px-8 py-3.5 rounded-xl text-white font-bold transition-all shadow-md ${
              !selectedFile || uploading
                ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-lg hover:-translate-y-0.5'
            }`}
          >
            {uploading ? 'Processing Document...' : 'Upload & Parse Document'}
          </button>
        </div>

        {/* Filters */}
        {recommendations.length > 0 && (
          <div className="card-glass p-4 sm:p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder="Search inside recommendations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-gray-800 transition-all"
                />
              </div>

              <div className="md:w-64">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-gray-700 cursor-pointer transition-all appearance-none"
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
          <div className="card-glass p-16 text-center border-2 border-dashed border-gray-200">
            <span className="text-6xl mb-4 block opacity-60">📄</span>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Recommendations Yet</h3>
            <p className="text-gray-500 font-medium max-w-sm mx-auto">
              Upload a Word document given by your nutritionist to let the AI organize your new dietary guidelines.
            </p>
          </div>
        ) : filteredRecommendations.length === 0 ? (
           <div className="card-glass p-12 text-center text-gray-500 font-medium">
             No recommendations match your search/filter criteria.
           </div>
        ) : (
          <div className="space-y-6">
            {filteredRecommendations.map((rec) => (
              <div key={rec.id} className="card-glass">
                <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50 rounded-t-3xl">
                  <div>
                    <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-sm">📅</span>
                      Visit date: {new Date(rec.visit_date).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </h3>
                    <p className="text-sm font-bold text-gray-400 mt-1 ml-10">
                      {rec.recommendations.length} items parsed
                    </p>
                  </div>
                  <button
                    onClick={() => openDeleteModal(rec.id)}
                    className="px-4 py-2 bg-white border border-rose-200 text-rose-500 font-bold rounded-xl hover:bg-rose-50 transition-colors text-sm shadow-sm"
                  >
                    Delete Report
                  </button>
                </div>

                <div className="p-6 md:p-8 space-y-4">
                  {rec.recommendations.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 md:p-5 rounded-2xl border transition-all hover:shadow-md ${getCategoryColor(item.category)}`}
                    >
                      <div className="flex items-start gap-4">
                        <span className="text-3xl filter drop-shadow-sm">{getCategoryIcon(item.category)}</span>
                        <div className="flex-1">
                          <p className="text-gray-900 font-bold text-base md:text-lg leading-snug">{item.text}</p>
                          {item.notes && (
                            <p className="text-sm font-medium text-gray-600 mt-2 opacity-90">{item.notes}</p>
                          )}
                          {item.target_value && (
                            <div className="mt-3 inline-block px-3 py-1 bg-white/60 rounded-lg text-sm font-black border border-black/5">
                              Target: {item.target_value}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 ml-4">
                          <span className="text-xs px-3 py-1 bg-white/80 font-bold rounded-full capitalize shadow-sm border border-black/5 whitespace-nowrap">
                            {item.category.replace('_', ' ')}
                          </span>
                          {item.tracked && (
                            <span className="text-xs px-3 py-1 bg-gradient-to-r from-emerald-400 to-green-500 text-white font-bold rounded-full shadow-sm whitespace-nowrap">
                              Tracked
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4 transform transition-all">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-rose-100 mb-6 border-4 border-rose-50">
                <span className="text-4xl">🗑️</span>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">
                מחיקת המלצות
              </h3>
              <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                האם אתה בטוח שברצונך למחוק את סט ההמלצות הזה? פעולה זו לא ניתנת לביטול.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-3.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-bold transition-all"
                >
                  ביטול
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-3.5 bg-rose-500 text-white rounded-xl hover:bg-rose-600 hover:shadow-lg hover:-translate-y-0.5 font-bold transition-all"
                >
                  מחק סופית
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4 transform transition-all scale-105">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-emerald-100 mb-6 border-4 border-emerald-50">
                <span className="text-4xl">✓</span>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">
                נמחק בהצלחה!
              </h3>
              <p className="text-gray-500 font-medium">
                ההמלצות הוסרו מהמערכת.
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx="true">{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default RecommendationsPage;