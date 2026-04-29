import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Lock,
  User,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader,
} from 'lucide-react';
import { Button, Input, Card } from '../components/UI';
import { ParticleBackground } from '../components/ParticleBackground';

type AuthMode = 'login' | 'signup';

interface AuthError {
  field?: string;
  message: string;
}

export const LoginPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    fullName: '',
    confirmPassword: '',
  });

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      navigate('/');
    }
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null); // Clear error when user types
  };

  const validateForm = (): boolean => {
    // Common validation
    if (!formData.email) {
      setError({ field: 'email', message: 'Email is required' });
      return false;
    }

    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      setError({ field: 'email', message: 'Invalid email format' });
      return false;
    }

    if (!formData.password) {
      setError({ field: 'password', message: 'Password is required' });
      return false;
    }

    if (formData.password.length < 6) {
      setError({ field: 'password', message: 'Password must be at least 6 characters' });
      return false;
    }

    // Signup-specific validation
    if (mode === 'signup') {
      if (!formData.username) {
        setError({ field: 'username', message: 'Username is required' });
        return false;
      }

      if (formData.username.length < 3) {
        setError({ field: 'username', message: 'Username must be at least 3 characters' });
        return false;
      }

      if (!/^[a-z0-9_-]+$/.test(formData.username.toLowerCase())) {
        setError({
          field: 'username',
          message: 'Username can only contain letters, numbers, hyphens, and underscores',
        });
        return false;
      }

      if (!formData.confirmPassword) {
        setError({ field: 'confirmPassword', message: 'Please confirm your password' });
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        setError({ field: 'confirmPassword', message: 'Passwords do not match' });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';

      const payload =
        mode === 'login'
          ? {
              email: formData.email,
              password: formData.password,
            }
          : {
              email: formData.email,
              password: formData.password,
              username: formData.username,
              fullName: formData.fullName || undefined,
            };

      const response = await fetch(`http://localhost:5001${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `${mode === 'login' ? 'Login' : 'Signup'} failed`);
      }

      // Store token
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      setSuccess(true);

      // Redirect after short delay
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'An error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setFormData({
      email: '',
      password: '',
      username: '',
      fullName: '',
      confirmPassword: '',
    });
    setError(null);
    setSuccess(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden relative">
      <ParticleBackground />

      {/* Back button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center gap-2 text-white/40 hover:text-white transition-colors z-40"
      >
        <ArrowLeft size={20} />
        <span className="text-sm font-semibold">Back</span>
      </motion.button>

      {/* Main content */}
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center gap-4"
              >
                <motion.div
                  animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.8 }}
                  className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-full"
                >
                  <CheckCircle size={48} className="text-emerald-400" />
                </motion.div>
                <h2 className="text-2xl font-black text-center text-emerald-400">
                  {mode === 'login' ? 'Welcome Back!' : 'Account Created!'}
                </h2>
                <p className="text-white/60 text-center text-sm">
                  {mode === 'login'
                    ? 'You are now logged in. Redirecting...'
                    : 'Your account is ready. Get started now!'}
                </p>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.5 }}
                    className="h-full bg-emerald-400"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Header */}
                <div className="mb-10 text-center">
                  <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center justify-center gap-2 mb-3"
                  >
                    {mode === 'login' ? <LogIn size={28} /> : <UserPlus size={28} />}
                    <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">
                      {mode === 'login' ? 'Welcome Back' : 'Join AdaptiveIQ'}
                    </h1>
                  </motion.div>
                  <p className="text-white/50 text-sm">
                    {mode === 'login'
                      ? 'Sign in to your account to continue'
                      : 'Create a new account to get started'}
                  </p>
                </div>

                {/* Form Card */}
                <Card className="space-y-6 mb-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Error message */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-start gap-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl"
                        >
                          <AlertCircle size={18} className="text-rose-400 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-rose-200">{error.message}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Signup fields */}
                    {mode === 'signup' && (
                      <>
                        {/* Username */}
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <label className="block text-xs font-semibold text-white/70 mb-2">Username</label>
                          <div className="relative">
                            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                            <Input
                              name="username"
                              type="text"
                              placeholder="e.g., quizmaster_pro"
                              value={formData.username}
                              onChange={handleInputChange}
                              className="pl-12"
                            />
                          </div>
                        </motion.div>

                        {/* Full Name */}
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.15 }}
                        >
                          <label className="block text-xs font-semibold text-white/70 mb-2">
                            Full Name <span className="text-white/40">(optional)</span>
                          </label>
                          <div className="relative">
                            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                            <Input
                              name="fullName"
                              type="text"
                              placeholder="Your full name"
                              value={formData.fullName}
                              onChange={handleInputChange}
                              className="pl-12"
                            />
                          </div>
                        </motion.div>
                      </>
                    )}

                    {/* Email */}
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: mode === 'signup' ? 0.2 : 0.1 }}
                    >
                      <label className="block text-xs font-semibold text-white/70 mb-2">Email</label>
                      <div className="relative">
                        <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                        <Input
                          name="email"
                          type="email"
                          placeholder="you@example.com"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="pl-12"
                        />
                      </div>
                    </motion.div>

                    {/* Password */}
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: mode === 'signup' ? 0.25 : 0.15 }}
                    >
                      <label className="block text-xs font-semibold text-white/70 mb-2">Password</label>
                      <div className="relative">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                        <Input
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="pl-12 pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                        >
                          {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                      </div>
                    </motion.div>

                    {/* Confirm Password (signup only) */}
                    {mode === 'signup' && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <label className="block text-xs font-semibold text-white/70 mb-2">Confirm Password</label>
                        <div className="relative">
                          <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                          <Input
                            name="confirmPassword"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className="pl-12 pr-12"
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* Submit Button */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: mode === 'signup' ? 0.35 : 0.2 }}
                    >
                      <Button
                        type="submit"
                        disabled={loading}
                        isLoading={loading}
                        className="w-full"
                        size="lg"
                      >
                        {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                      </Button>
                    </motion.div>
                  </form>
                </Card>

                {/* Mode toggle */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: mode === 'signup' ? 0.4 : 0.25 }}
                  className="text-center"
                >
                  <p className="text-white/60 text-sm">
                    {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                    <button
                      onClick={toggleMode}
                      className="ml-2 text-indigo-400 font-semibold hover:text-indigo-300 transition-colors"
                    >
                      {mode === 'login' ? 'Sign up' : 'Sign in'}
                    </button>
                  </p>
                </motion.div>

                {/* Demo credentials */}
                {mode === 'login' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-8 p-4 bg-white/5 border border-white/10 rounded-xl"
                  >
                    <p className="text-xs text-white/50 font-semibold mb-2">Demo Credentials:</p>
                    <p className="text-xs text-white/60">
                      Email: <span className="font-mono text-indigo-400">demo@example.com</span>
                    </p>
                    <p className="text-xs text-white/60">
                      Password: <span className="font-mono text-indigo-400">demo123</span>
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
