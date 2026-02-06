import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, Heart, CheckCircle } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { authService } from '../services/authService';
import Input from '../components/Input';
import Button from '../components/Button';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      toast.error('Invalid reset link');
      setTimeout(() => navigate('/forgot-password'), 2000);
    }
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!token) {
      setError('Invalid reset token');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.resetPassword(token, password, confirmPassword);
      if (response.success) {
        setIsSuccess(true);
        toast.success('Password reset successful!');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setError(response.error || 'Failed to reset password');
        toast.error(response.error || 'Failed to reset password');
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to reset password';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 flex items-center justify-center p-4">
        <Toaster position="top-center" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 space-y-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4"
            >
              <CheckCircle className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Password Reset Successful!
            </h1>
            <p className="text-gray-600">
              Your password has been reset. Redirecting to login...
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 flex items-center justify-center p-4">
      <Toaster position="top-center" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 space-y-6">
          {/* Logo and Title */}
          <div className="text-center space-y-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl mb-2"
            >
              <Heart className="w-8 h-8 text-white fill-white" />
            </motion.div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Capella
            </h1>
            <p className="text-gray-600 text-sm">
              Set your new password
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="password"
              type="password"
              label="New Password"
              icon={<Lock className="w-4 h-4" />}
              placeholder="Enter new password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />

            <Input
              id="confirmPassword"
              type="password"
              label="Confirm Password"
              icon={<Lock className="w-4 h-4" />}
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
            >
              Reset Password
            </Button>
          </form>

          <div className="text-center text-sm text-gray-600">
            <button
              onClick={() => navigate('/')}
              className="text-pink-600 font-semibold hover:text-purple-600 transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;



