import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

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

    api.post('/api/v1/auth/verify-email', { code })
      .then(response => {
        setStatus('success');
        setMessage(response.data?.message || 'Email verified successfully!');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.response?.data?.detail || err.message || 'Verification failed.');
      });
  }, [code, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 bg-gradient-mesh flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full card-glass p-10">
        <div className="text-center">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            {status === 'verifying' && (
              <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            )}
            {status === 'success' && (
              <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center border-4 border-emerald-100">
                <span className="text-5xl drop-shadow-sm">✅</span>
              </div>
            )}
            {status === 'error' && (
              <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center border-4 border-rose-100">
                <span className="text-5xl drop-shadow-sm">❌</span>
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-black text-gray-900 mx-auto tracking-tight mb-3">
            {status === 'verifying' && 'Verifying Your Email...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </h1>

          {/* Message */}
          <p className={`text-base font-medium mb-8 ${
            status === 'error' ? 'text-rose-600' : 'text-gray-500'
          }`}>
            {message}
          </p>

          {/* Actions */}
          {status === 'success' && (
            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
              <p className="text-sm font-bold text-indigo-600 animate-pulse">
                Redirecting you to login in 3 seconds...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-3">
              <button
                onClick={() => navigate('/login')}
                className="w-full px-4 py-3 bg-gradient-primary text-white font-bold rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-md"
              >
                Go to Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className="w-full px-4 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm"
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