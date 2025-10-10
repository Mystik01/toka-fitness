'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { verifyCallback } from '@/app/lib/auth';

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleVerification = async () => {
      try {
        // Get the access token and refresh token from URL params
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');

        if (!accessToken || !refreshToken) {
          setStatus('error');
          setMessage('Invalid verification link. Please try again.');
          return;
        }

        // Call the verify callback API
        const result = await verifyCallback(accessToken, refreshToken);
        
        if (result.success) {
          setStatus('success');
          setMessage('Your email has been verified successfully!');
          
          // Notify parent window if opened in popup/tab
          if (window.opener) {
            window.opener.postMessage({ type: 'EMAIL_VERIFIED', success: true }, '*');
          }
          
          // Redirect to dashboard after short delay
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        } else {
          setStatus('error');
          setMessage(result.error || 'Verification failed. Please try again.');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('Something went wrong. Please try again.');
      }
    };

    handleVerification();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
      >
        <div className="mb-6">
          {status === 'loading' && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="mx-auto w-16 h-16"
            >
              <Loader2 className="w-16 h-16 text-blue-500" />
            </motion.div>
          )}
          {status === 'success' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            </motion.div>
          )}
          {status === 'error' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <XCircle className="w-16 h-16 text-red-500 mx-auto" />
            </motion.div>
          )}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {status === 'loading' && 'Verifying your email...'}
          {status === 'success' && 'Email Verified!'}
          {status === 'error' && 'Verification Failed'}
        </h1>

        <p className="text-gray-600 mb-6">
          {status === 'loading' && 'Please wait while we verify your email address.'}
          {message}
        </p>

        {status === 'success' && (
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-green-50 border border-green-200 rounded-lg p-4"
            >
              <p className="text-sm text-green-700">
                You will be redirected to your dashboard in a moment...
              </p>
            </motion.div>
            
            <p className="text-sm text-gray-500">
              You can safely close this tab now.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <button
              onClick={() => router.push('/auth/register')}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Back to Registration
            </button>
            
            <button
              onClick={() => window.close()}
              className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Close Tab
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}