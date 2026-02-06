import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Heart } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/Input';
import Button from '../components/Button';
import { validateAuthForm } from '../utils/validation';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ email: '', password: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const { login, register, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    // Validate form
    const validation = validateAuthForm(form.email, form.password);
    if (!validation.isValid) {
      setFormError(validation.error || 'Invalid input');
      return;
    }

    // Call appropriate auth function
    if (isLogin) {
      await login(form);
    } else {
      await register(form);
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
              {isLogin ? 'Welcome back!' : 'Join the community'}
            </p>
          </div>

          {/* Form Error Display */}
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {formError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="email"
              type="email"
              label="Email"
              icon={<Mail className="w-4 h-4" />}
              placeholder="Enter your email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />

            <Input
              id="password"
              type="password"
              label="Password"
              icon={<Lock className="w-4 h-4" />}
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
            >
              {isLogin ? 'Log In' : 'Sign Up'}
            </Button>
          </form>

          {/* Forgot Password Link */}
          {isLogin && (
            <div className="text-center">
              <button
                onClick={() => window.location.href = '/forgot-password'}
                className="text-sm text-pink-600 font-semibold hover:text-purple-600 transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {/* Toggle Login/Register */}
          <div className="text-center text-sm text-gray-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setFormError(null);
              }}
              className="text-pink-600 font-semibold hover:text-purple-600 transition-colors"
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Connect & Discover</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;



