import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Sparkles, Crown, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../stores';

const LOGIN_PARTICLE_COLORS = ['#f43f5e', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];
const LOGIN_PARTICLE_POSITIONS = Array.from({ length: 20 }, (_, i) => ({
  left: `${(i * 5 + 3) % 100}%`,
  delay: `${(i * 0.2) % 5}s`,
  duration: `${10 + (i * 0.5) % 10}s`,
}));

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-rose-500/30 to-pink-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 right-0 w-80 h-80 bg-gradient-to-r from-violet-500/30 to-fuchsia-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-20 left-0 w-72 h-72 bg-gradient-to-r from-amber-500/30 to-orange-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-gradient-to-r from-emerald-500/30 to-teal-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Floating Particles */}
      <div className="floating-particles">
        {LOGIN_PARTICLE_POSITIONS.map((pos, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: pos.left,
              backgroundColor: LOGIN_PARTICLE_COLORS[i % LOGIN_PARTICLE_COLORS.length],
              animationDuration: pos.duration,
              animationDelay: pos.delay,
            }}
          />
        ))}
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-500 mb-6 shadow-2xl shadow-pink-500/40 animate-bounce">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-rose-400 via-pink-400 to-fuchsia-400 bg-clip-text text-transparent mb-2">
            Apna Restaurant
          </h1>
          <p className="text-white/60 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Restaurant Management System
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-card-vibrant p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Welcome Back!</h2>
            <p className="text-white/50">Sign in to your restaurant dashboard</p>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 mb-6 rounded-2xl bg-gradient-to-r from-rose-500/20 to-red-500/20 border border-rose-500/30 text-rose-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/30 to-purple-500/30 flex items-center justify-center">
                <Mail className="w-5 h-5 text-violet-400" />
              </div>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-vibrant pl-16"
                required
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 flex items-center justify-center">
                <Lock className="w-5 h-5 text-emerald-400" />
              </div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-vibrant pl-16"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 text-white font-bold text-lg shadow-xl shadow-pink-500/30 hover:shadow-pink-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="text-center mb-4">
              <p className="text-sm text-white/40 flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Demo Accounts
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 max-w-xs mx-auto">
              {[
                { role: 'Owner', email: 'owner@apna-restaurant.com' },
              ].map((account) => (
                <button
                  key={account.role}
                  type="button"
                  onClick={() => {
                    setEmail(account.email);
                    setPassword('password123');
                  }}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-violet-500/30 transition-all duration-300 text-center group"
                >
                  <p className="text-xs font-semibold text-violet-400 group-hover:text-violet-300">{account.role}</p>
                  <p className="text-[10px] text-white/40 mt-1 truncate">{account.email}</p>
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-white/30 mt-4">Password: password123</p>
            <p className="text-center text-xs text-white/20 mt-2">Login as Owner, then add team members in Settings</p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/30 text-sm mt-6">
          Don't have an account?{' '}
          <a href="/register" className="text-orange-400 hover:text-orange-300 font-semibold">
            Sign Up Free
          </a>
        </p>
        <p className="text-center text-white/20 text-xs mt-3">
          Powered by Apna Restaurant SaaS
        </p>
      </div>
    </div>
  );
}
