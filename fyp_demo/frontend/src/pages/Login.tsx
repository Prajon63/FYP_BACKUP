import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Heart, Sparkles, ArrowRight } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/Input';
import Button from '../components/Button';
import { validateAuthForm } from '../utils/validation';

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');`;

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
    <div
      className="min-h-screen bg-[#faf9f7] flex items-center justify-center p-4 sm:p-6"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      <style>{`
        ${FONTS}
        * { box-sizing: border-box; }
      `}</style>
      <Toaster position="top-center" />

      {/* Ambient background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-20 w-72 h-72 rounded-full bg-rose-200/40 blur-3xl" />
        <div className="absolute top-1/4 -right-20 w-72 h-72 rounded-full bg-pink-200/40 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 w-80 h-80 rounded-full bg-purple-200/30 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative"
      >
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-7 sm:p-8 space-y-6">
          {/* Logo and Title */}
          <div className="text-center space-y-2.5">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl mb-2 shadow-lg shadow-rose-300/40"
            >
              <Heart className="w-8 h-8 text-white fill-white" />
            </motion.div>
            <h1
              className="text-4xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Capella
            </h1>
            <p className="text-slate-500 text-sm flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              {isLogin ? 'Welcome back to your matches' : 'Create your account and start discovering'}
            </p>
          </div>

          {/* Form Error Display */}
          <AnimatePresence>
            {formError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm"
              >
                {formError}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" method="post" noValidate>
            <Input
              id="email"
              name="email"
              type="email"
              label="Email"
              icon={<Mail className="w-4 h-4" />}
              placeholder="Enter your email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
              inputMode="email"
              required
              className="border-slate-200 focus:ring-rose-300"
            />

            <Input
              id="password"
              name="password"
              type="password"
              label="Password"
              icon={<Lock className="w-4 h-4" />}
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              required
              className="border-slate-200 focus:ring-rose-300"
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
              className="rounded-2xl font-bold !bg-gradient-to-r !from-rose-500 !to-pink-500 !shadow-lg !shadow-rose-300/40 hover:!from-rose-600 hover:!to-pink-600"
            >
              <span className="inline-flex items-center gap-2">
                {isLogin ? 'Log In' : 'Sign Up'}
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </span>
            </Button>
          </form>

          {/* Forgot Password Link */}
          {isLogin && (
            <div className="text-center">
              <button
                onClick={() => window.location.href = '/forgot-password'}
                className="text-sm text-rose-600 font-semibold hover:text-pink-600 transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {/* Toggle Login/Register */}
          <div className="text-center text-sm text-slate-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setFormError(null);
              }}
              className="text-rose-600 font-semibold hover:text-pink-600 transition-colors"
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 tracking-widest">Connect & Discover</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;



