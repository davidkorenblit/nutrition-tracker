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
  const dateParam = searchParams.get('date');

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
  const [photoUrl, setPhotoUrl] = useState('');
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
  const showTimerNotification = () => {
    playNotificationSound();
    setShowNotification(true);
    setTimerCompleted(true);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setShowNotification(false);
    }, 5000);
  };

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
  }, []);

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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!meal) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600 mb-4">Meal not found</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
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

      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Meal</h1>
          <p className="text-gray-600">
            {meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)} - {meal.date}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Section 1: Hunger Before */}
        <div className="mb-8 pb-8 border-b">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">1. Hunger Level Before Eating</h2>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Not Hungry</span>
            <input
              type="range"
              min="1"
              max="10"
              value={hungerBefore}
              onChange={(e) => {
                setHungerBefore(parseInt(e.target.value));
                startTimer(); // Start timer when user fills this
              }}
              className="flex-1"
            />
            <span className="text-gray-600">Very Hungry</span>
            <span className="text-2xl font-bold text-blue-600 w-12 text-center">
              {hungerBefore}
            </span>
          </div>
          {timerStarted && !timerCompleted && (
            <p className="mt-2 text-sm text-green-600">⏱️ Timer started! You'll be notified in 2-5 minutes.</p>
          )}
        </div>

        {/* Section 2: Healthy Plate */}
        <div className="mb-8 pb-8 border-b">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">2. Healthy Plate (Reference)</h2>
          <p className="text-gray-600 mb-4">This is the recommended plate composition:</p>
          <div className="flex justify-center">
            <div style={{ width: '300px', height: '300px' }}>
              <Pie data={healthyPlateData} options={chartOptions} />
            </div>
          </div>
          <div className="mt-4 text-center text-gray-600">
            <p>🟢 Vegetables: 50% | 🔴 Protein: 30% | 🟡 Carbs: 20%</p>
          </div>
        </div>

        {/* Section 3: Free Plate */}
        <div className="mb-8 pb-8 border-b">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">3. Your Actual Plate</h2>
          <p className="text-gray-600 mb-4">Enter the percentages for what you actually ate:</p>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🟢 Vegetables (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={freePlate.vegetables}
                onChange={(e) => handleFreePlateChange('vegetables', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔴 Protein (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={freePlate.protein}
                onChange={(e) => handleFreePlateChange('protein', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🟡 Carbs (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={freePlate.carbs}
                onChange={(e) => handleFreePlateChange('carbs', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mb-4">
            <p className={`text-center font-semibold ${freePlateSum === 100 ? 'text-green-600' : 'text-red-600'}`}>
              Total: {freePlateSum}% {freePlateSum === 100 ? '✓' : '(must be 100%)'}
            </p>
          </div>

          <div className="flex justify-center">
            <div style={{ width: '300px', height: '300px' }}>
              <Pie data={freePlateData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Section 4: Photo Upload */}
        <div className="mb-8 pb-8 border-b">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">4. Meal Photo (Optional)</h2>
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={handlePhotoSelect}
            className="mb-4"
          />
          <p className="text-sm text-gray-500 mb-4">Max 5MB, JPG or PNG only</p>
          
          {photoPreview && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Preview:</p>
              <img
                src={photoPreview}
                alt="Meal preview"
                className="max-w-md rounded shadow"
              />
            </div>
          )}
        </div>

        {/* Section 4.5: Notes */}
        <div className="mb-8 pb-8 border-b">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Notes (Optional)</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this meal..."
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Section 5: Hunger During */}
        <div className="mb-8 pb-8 border-b">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">5. Hunger Level During Eating</h2>
          <p className="text-sm text-gray-500 mb-4">
            {timerCompleted ? '✅ Timer completed!' : 'You can fill this anytime (timer is just a reminder)'}
          </p>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Not Hungry</span>
            <input
              type="range"
              min="1"
              max="10"
              value={hungerDuring}
              onChange={(e) => setHungerDuring(parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-gray-600">Very Hungry</span>
            <span className="text-2xl font-bold text-blue-600 w-12 text-center">
              {hungerDuring}
            </span>
          </div>
        </div>

        {/* Section 6: Hunger After */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">6. Hunger Level After Eating</h2>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Not Hungry</span>
            <input
              type="range"
              min="1"
              max="10"
              value={hungerAfter}
              onChange={(e) => setHungerAfter(parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-gray-600">Very Hungry</span>
            <span className="text-2xl font-bold text-blue-600 w-12 text-center">
              {hungerAfter}
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 px-6 py-3 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isFormValid() || submitting || uploadingPhoto}
            className={`flex-1 px-6 py-3 rounded text-white font-semibold ${
              isFormValid() && !submitting && !uploadingPhoto
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-400 cursor-not-allowed'
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