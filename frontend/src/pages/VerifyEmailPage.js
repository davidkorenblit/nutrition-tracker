import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get('code');
  
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!code) {
      setStatus('error');
      setMessage('Invalid verification link. No code provided.');
      return;
    }

    // שלח את הקוד לשרת
    fetch('http://localhost:8000/api/v1/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(data => {
            throw new Error(data.detail || 'Verification failed');
          });
        }
        return res.json();
      })
      .then(data => {
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
        
        // הפנה להתחברות אחרי 3 שניות
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.message || 'Verification failed. Please try again.');
      });
  }, [code, navigate]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          {/* Icon */}
          <div className="mb-4">
            {status === 'verifying' && (
              <div className="text-6xl animate-spin">⏳</div>
            )}
            {status === 'success' && (
              <div className="text-6xl text-green-500">✅</div>
            )}
            {status === 'error' && (
              <div className="text-6xl text-red-500">❌</div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {status === 'verifying' && 'Verifying Your Email...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </h1>

          {/* Message */}
          <p className={`text-lg mb-6 ${
            status === 'error' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {message}
          </p>

          {/* Actions */}
          {status === 'success' && (
            <p className="text-sm text-gray-500">
              Redirecting to login page in 3 seconds...
            </p>
          )}

          {status === 'error' && (
            <div className="space-y-3">
              <button
                onClick={() => navigate('/login')}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Go to Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Register Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerifyEmailPage;