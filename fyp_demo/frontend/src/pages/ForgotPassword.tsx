import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Heart, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { authService } from '../services/authService';
import Input from '../components/Input';
import Button from '../components/Button';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      console.log('📧 Sending forgot password request for:', email);
      const response = await authService.forgotPassword(email);
      console.log('📧 Response received:', response);
      
      if (response.success) {
        setEmailSent(true);
        toast.success(response.message || 'Reset link sent to your email!');
        console.log('✅ Success! Check your BACKEND console/terminal for the email preview URL');
        //console.log('⚠️  IMPORTANT: The email preview link appears in your BACKEND terminal, not browser console!');
      } else {
        toast.error(response.error || 'Failed to send reset email');
      }
    } catch (error: any) {
      console.error('❌ Error:', error);
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

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
              {emailSent ? 'Check your email!' : 'Reset your password'}
            </p>
          </div>

          {emailSent ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
                <p className="font-semibold mb-1">Email sent!</p>
                <p>
                  If an account with <strong>{email}</strong> exists, we've sent you a password reset link.
                </p>
                <p className="mt-2 text-xs">
                  The link will expire in 10 minutes.
                </p>
              </div>
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                fullWidth
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </motion.div>
          ) : (
            <>
              <p className="text-gray-600 text-sm text-center">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  id="email"
                  type="email"
                  label="Email"
                  icon={<Mail className="w-4 h-4" />}
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={isLoading}
                >
                  Send Reset Link
                </Button>
              </form>

              <div className="text-center">
                <button
                  onClick={() => navigate('/')}
                  className="text-sm text-pink-600 font-semibold hover:text-purple-600 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;

