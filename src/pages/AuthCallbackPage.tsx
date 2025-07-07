import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authService } from '@/services/auth';

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const result = await authService.handleOAuthCallback();
        
        if (result.user && result.session) {
          // Store auth data
          localStorage.setItem('authToken', result.token);
          localStorage.setItem('userData', JSON.stringify(result.user));
          
          setStatus('success');
          
          // Redirect after a brief success message
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          throw new Error('No user data received');
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setStatus('error');
        
        // Redirect to sign in after error
        setTimeout(() => {
          navigate('/signin');
        }, 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-brand-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Completing sign in...
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Please wait while we authenticate your account.
              </p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Welcome back!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Redirecting to your dashboard...
              </p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Authentication Failed
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {error}
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to sign in page...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}