import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import mealService from '../services/mealService';
import api from '../services/api';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

function MealEntryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mealId = parseInt(searchParams.get('meal_id'));

  // State - Meal Data
  const [meal, setMeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State - Hunger Levels (1-10)
  const [hungerBefore, setHungerBefore] = useState(5);
  const [hungerDuring, setHungerDuring] = useState(5);
  const [hungerAfter, setHungerAfter] = useState(5);

  // State - Free Plate (must sum to 100)
  const [freePlate, setFreePlate] = useState({
    vegetables: 34,
    protein: 33,
    carbs: 33
  });

  // State - Photo
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // State - Timer
  const [timerStarted, setTimerStarted] = useState(false);
  const [timerCompleted, setTimerCompleted] = useState(false);

  // State - Submission
  const [submitting, setSubmitting] = useState(false);
  
  // State - notes
  const [notes, setNotes] = useState('');

  // State - Notification
  const [showNotification, setShowNotification] = useState(false);

  // Load meal data on mount
  useEffect(() => {
    const loadMeal = async () => {
      try {
        setLoading(true);
        const mealData = await mealService.getMeal(mealId);
        setMeal(mealData);
        
        // Check if timer was already started
        const savedTimerEnd = localStorage.getItem('mealTimerEnd');
        if (savedTimerEnd) {
          setTimerStarted(true);
        }
      } catch (err) {
        setError('Failed to load meal. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (mealId) {
      loadMeal();
    }
  }, [mealId]);

  // Play notification sound
  const playNotificationSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjWH0fPTgjMGHm7A7+OZURE');
    audio.play().catch(e => console.error('Failed to play sound:', e));
  };

  // Show notification with animation
  const showTimerNotification = React.useCallback(() => {
    playNotificationSound();
    setShowNotification(true);
    setTimerCompleted(true);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setShowNotification(false);
    }, 5000);
  }, []);

  // Timer polling - check every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const endTime = localStorage.getItem('mealTimerEnd');
      if (endTime && Date.now() >= parseInt(endTime)) {
        showTimerNotification();
        localStorage.removeItem('mealTimerEnd');
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [showTimerNotification]);

  // Start timer when "hunger before" is filled
  const startTimer = () => {
    if (timerStarted) return; // Already started

    const randomMinutes = Math.floor(Math.random() * 4) + 2; // 2-5 minutes
    const endTime = Date.now() + (randomMinutes * 60 * 1000);
    
    localStorage.setItem('mealTimerEnd', endTime);
    setTimerStarted(true);
  };

  // Handle Free Plate input change
  const handleFreePlateChange = (field, value) => {
    const numValue = parseInt(value) || 0;
    
    // Validate: 0-100
    if (numValue < 0 || numValue > 100) return;

    setFreePlate(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  // Handle photo selection
  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be less than 5MB');
      return;
    }

    // Validate file type (JPG, PNG only)
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Only JPG and PNG files are allowed');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);

    setPhotoFile(file);
    setError('');
  };

  // Upload photo to backend
  const uploadPhoto = async () => {
    if (!photoFile) return '';

    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append('file', photoFile);

      const response = await api.post('/api/v1/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.url;
    } catch (err) {
      setError('Failed to upload photo. Continuing without photo.');
      return '';
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Validate form
  const isFormValid = () => {
    // Check Free Plate sum = 100%
    const sum = freePlate.vegetables + freePlate.protein + freePlate.carbs;
    if (sum !== 100) return false;

    // Check hunger levels (1-10)
    if (hungerBefore < 1 || hungerBefore > 10) return false;
    if (hungerDuring < 1 || hungerDuring > 10) return false;
    if (hungerAfter < 1 || hungerAfter > 10) return false;

    return true;
  };

  // Submit meal
  const handleSubmit = async () => {
    if (!isFormValid()) {
      setError('Please fill all fields correctly. Free Plate must sum to 100%.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      // Upload photo if exists
      let uploadedPhotoUrl = '';
      if (photoFile) {
        uploadedPhotoUrl = await uploadPhoto();
      }

      // Complete meal
      await mealService.completeMeal({
        meal_id: mealId,
        free_plate_vegetables: freePlate.vegetables,
        free_plate_protein: freePlate.protein,
        free_plate_carbs: freePlate.carbs,
        hunger_before: hungerBefore,
        hunger_during: hungerDuring,
        hunger_after: hungerAfter,
        photo_url: uploadedPhotoUrl || undefined,
      });

      // Clear timer
      localStorage.removeItem('mealTimerEnd');

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to save meal. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Chart data
  const healthyPlateData = {
    labels: ['Vegetables', 'Protein', 'Carbs'],
    datasets: [{
      data: [50, 30, 20],
      backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
    }]
  };

  const freePlateSum = freePlate.vegetables + freePlate.protein + freePlate.carbs;
  const freePlateData = {
    labels: ['Vegetables', 'Protein', 'Carbs'],
    datasets: [{
      data: [freePlate.vegetables, freePlate.protein, freePlate.carbs],
      backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 bg-gradient-mesh flex items-center justify-center">
        <div className="card-glass p-10 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
          <div className="text-xl font-medium text-gray-600">Loading Meal Data...</div>
        </div>
      </div>
    );
  }

  if (!meal) {
    return (
      <div className="min-h-screen bg-gray-50 bg-gradient-mesh flex items-center justify-center py-8 px-4">
        <div className="card-glass p-10 max-w-md w-full text-center">
          <span className="text-6xl mb-4 block">🍳</span>
          <p className="text-2xl font-bold text-gray-800 mb-2">Meal not found</p>
          <p className="text-gray-500 mb-6">We couldn't find the requested meal.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full px-4 py-3 bg-gradient-primary text-white font-medium rounded-xl hover:opacity-90 transition-all shadow-sm"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 bg-gradient-mesh py-8 px-4">
      {/* Notification Modal */}
      {showNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 transform animate-scaleIn">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-bounce">🔔</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                זמן לבדוק!
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Time to check your hunger level during the meal!
              </p>
              <button
                onClick={() => setShowNotification(false)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                אישור
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto card-glass p-6 md:p-10">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-gradient mb-2 tracking-tight">Complete Your Meal</h1>
            <p className="text-gray-500 font-medium flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs uppercase tracking-wider font-bold">
                {meal.meal_type}
              </span> 
              • {meal.date}
            </p>
          </div>
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Section 1: Hunger Before */}
        <div className="mb-8 pb-8 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-600 w-8 h-8 flex items-center justify-center rounded-lg text-sm">1</span>
            Hunger Level Before Eating
          </h2>
          <div className="metric-card bg-white hover:-translate-y-0">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-500">Not Hungry</span>
              <input
                type="range" min="1" max="10" value={hungerBefore}
                onChange={(e) => {
                  setHungerBefore(parseInt(e.target.value));
                  startTimer();
                }}
                className="flex-1 accent-blue-500"
              />
              <span className="text-sm font-medium text-gray-500">Very Hungry</span>
              <span className="text-2xl font-black text-blue-500 w-12 text-center bg-blue-50 rounded-lg py-1">
                {hungerBefore}
              </span>
            </div>
            {timerStarted && !timerCompleted && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-center gap-3 animate-pulse">
                <span className="text-xl">⏱️</span>
                <p className="text-sm text-blue-700 font-medium">Timer started! You'll be notified in 2-5 minutes during your meal.</p>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Healthy Plate */}
        <div className="mb-8 pb-8 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
            <span className="bg-emerald-100 text-emerald-600 w-8 h-8 flex items-center justify-center rounded-lg text-sm">2</span>
            Healthy Plate (Reference)
          </h2>
          <p className="text-gray-500 mb-6 text-sm ml-10">This is the recommended optimal plate composition:</p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 metric-card bg-emerald-50/30 hover:-translate-y-0">
            <div style={{ width: '220px', height: '220px' }}>
              <Pie data={healthyPlateData} options={chartOptions} />
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100"><span className="w-3 h-3 rounded-full bg-emerald-500"></span><span className="font-medium text-gray-700">Vegetables</span><span className="font-bold text-emerald-600 ml-auto">50%</span></div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100"><span className="w-3 h-3 rounded-full bg-red-500"></span><span className="font-medium text-gray-700">Protein</span><span className="font-bold text-red-600 ml-auto">30%</span></div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100"><span className="w-3 h-3 rounded-full bg-amber-500"></span><span className="font-medium text-gray-700">Carbs</span><span className="font-bold text-amber-600 ml-auto">20%</span></div>
            </div>
          </div>
        </div>

        {/* Section 3: Free Plate */}
        <div className="mb-8 pb-8 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
            <span className="bg-purple-100 text-purple-600 w-8 h-8 flex items-center justify-center rounded-lg text-sm">3</span>
            Your Actual Plate
          </h2>
          <p className="text-gray-500 mb-6 text-sm ml-10">Enter the percentages for what you actually ate:</p>
          
          <div className="metric-card bg-purple-50/30 hover:-translate-y-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Vegetables (%)
                </label>
                <input
                  type="number" min="0" max="100" value={freePlate.vegetables}
                  onChange={(e) => handleFreePlateChange('vegetables', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-semibold text-gray-800"
                />
              </div>
              
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span> Protein (%)
                </label>
                <input
                  type="number" min="0" max="100" value={freePlate.protein}
                  onChange={(e) => handleFreePlateChange('protein', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all font-semibold text-gray-800"
                />
              </div>
              
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span> Carbs (%)
                </label>
                <input
                  type="number" min="0" max="100" value={freePlate.carbs}
                  onChange={(e) => handleFreePlateChange('carbs', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-semibold text-gray-800"
                />
              </div>
            </div>

            <div className={`p-4 rounded-xl border text-center font-bold flex flex-col items-center gap-1 ${freePlateSum === 100 ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-red-50 border-red-200'}`}>
              <span className={`text-3xl ${freePlateSum === 100 ? 'text-emerald-500' : 'text-red-500'}`}>
                {freePlateSum === 100 ? '✓' : '⚠️'}
              </span>
              <p className={freePlateSum === 100 ? 'text-emerald-700' : 'text-red-700'}>
                Total: {freePlateSum}% <span className="font-normal opacity-80">{freePlateSum !== 100 && '(must equal 100%)'}</span>
              </p>
            </div>

            <div className="flex justify-center mt-8">
              <div style={{ width: '220px', height: '220px' }}>
                <Pie data={freePlateData} options={chartOptions} />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Photo Upload */}
        <div className="mb-8 pb-8 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="bg-pink-100 text-pink-600 w-8 h-8 flex items-center justify-center rounded-lg text-sm">4</span>
            Meal Photo (Optional)
          </h2>
          <div className="metric-card bg-white hover:-translate-y-0 text-center py-8 border-dashed border-2 border-gray-200">
            <div className="text-4xl mb-3">📸</div>
            <input
              type="file" accept="image/jpeg,image/png"
              onChange={handlePhotoSelect}
              className="block w-full max-w-xs mx-auto text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0
                file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-600
                hover:file:bg-pink-100 transition-colors cursor-pointer"
            />
            <p className="text-xs text-gray-400 mt-3">Max 5MB, JPG or PNG only</p>
            
            {photoPreview && (
              <div className="mt-6">
                <img src={photoPreview} alt="Meal preview" className="max-w-xs mx-auto rounded-xl shadow border border-gray-100" />
              </div>
            )}
          </div>
        </div>

        {/* Section 4.5: Notes */}
        <div className="mb-8 pb-8 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">📝 Notes (Optional)</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any context, how you felt, where you ate..."
            rows="3"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none transition-all"
          />
        </div>

        {/* Section 5: Hunger During */}
        <div className="mb-8 pb-8 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-600 w-8 h-8 flex items-center justify-center rounded-lg text-sm">5</span>
            Hunger Level During Eating
          </h2>
          <p className="text-sm text-gray-500 mb-4 ml-10">
            {timerCompleted ? '✅ Timer completed! Time to evaluate.' : 'You can fill this anytime (timer is just a reminder)'}
          </p>
          <div className="metric-card bg-white hover:-translate-y-0 flex items-center gap-4">
            <span className="text-sm font-medium text-gray-500">Not Hungry</span>
            <input type="range" min="1" max="10" value={hungerDuring} onChange={(e) => setHungerDuring(parseInt(e.target.value))} className="flex-1 accent-indigo-500" />
            <span className="text-sm font-medium text-gray-500">Very Hungry</span>
            <span className="text-2xl font-black text-indigo-500 w-12 text-center bg-indigo-50 rounded-lg py-1">{hungerDuring}</span>
          </div>
        </div>

        {/* Section 6: Hunger After */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-600 w-8 h-8 flex items-center justify-center rounded-lg text-sm">6</span>
            Hunger Level After Eating
          </h2>
          <div className="metric-card bg-white hover:-translate-y-0 flex items-center gap-4">
            <span className="text-sm font-medium text-gray-500">Not Hungry</span>
            <input type="range" min="1" max="10" value={hungerAfter} onChange={(e) => setHungerAfter(parseInt(e.target.value))} className="flex-1 accent-purple-500" />
            <span className="text-sm font-medium text-gray-500">Very Hungry</span>
            <span className="text-2xl font-black text-purple-500 w-12 text-center bg-purple-50 rounded-lg py-1">{hungerAfter}</span>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4 mt-12 bg-gray-50 -mx-6 md:-mx-10 -mb-6 md:-mb-10 p-6 md:p-10 rounded-b-2xl border-t border-gray-100">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 px-6 py-4 rounded-xl text-gray-600 font-bold bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-800 transition-all shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isFormValid() || submitting || uploadingPhoto}
            className={`flex-[2] px-6 py-4 rounded-xl text-white font-bold transition-all shadow-md ${
              isFormValid() && !submitting && !uploadingPhoto
                ? 'bg-gradient-primary hover:shadow-lg hover:-translate-y-0.5'
                : 'bg-gray-300 cursor-not-allowed text-gray-500'
            }`}
          >
            {submitting ? 'Saving...' : uploadingPhoto ? 'Uploading Photo...' : 'Save Meal'}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default MealEntryPage;