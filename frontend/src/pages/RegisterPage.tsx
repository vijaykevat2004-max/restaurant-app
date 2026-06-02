import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Mail, Lock, User, ArrowRight, Check, Sparkles } from 'lucide-react';

const STEPS = ['Restaurant Info', 'Owner Details', 'Complete'];

export function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form data
  const [restaurantName, setRestaurantName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleNext = () => {
    if (step === 0) {
      if (!restaurantName.trim()) {
        setError('Restaurant name is required');
        return;
      }
    }
    if (step === 1) {
      if (!ownerName.trim() || !ownerEmail.trim() || !password.trim()) {
        setError('All fields are required');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
    }
    setError('');
    setStep(step + 1);
  };

  const handleRegister = async () => {
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantName,
          ownerName,
          ownerEmail,
          password,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Auto login after registration
        navigate('/login', { state: { email: ownerEmail, message: 'Registration successful! Please login.' } });
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-orange-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-0 w-80 h-80 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500 via-pink-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-pink-500/30">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-orange-400 via-pink-400 to-fuchsia-400 bg-clip-text text-transparent">
            Join Apna Restaurant
          </h1>
          <p className="text-white/60 mt-2">Start your restaurant's digital journey</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                i <= step 
                  ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white' 
                  : 'bg-white/10 text-white/40'
              }`}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-12 h-0.5 ${i < step ? 'bg-gradient-to-r from-orange-500 to-pink-500' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="glass-card-vibrant p-8">
          {step === 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white mb-4">Restaurant Details</h2>
              
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Restaurant Name *</label>
                <div className="relative">
                  <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="text"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    placeholder="e.g., Taj Palace Restaurant"
                    className="input-vibrant pl-12"
                  />
                </div>
              </div>

              <button
                onClick={handleNext}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold text-lg hover:shadow-lg hover:shadow-pink-500/30 transition-all flex items-center justify-center gap-2"
              >
                Continue <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white mb-4">Owner Details</h2>
              
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Owner Name *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Your full name"
                    className="input-vibrant pl-12"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="owner@restaurant.com"
                    className="input-vibrant pl-12"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="input-vibrant pl-12"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="input-vibrant pl-12"
                  />
                </div>
              </div>

              <button
                onClick={handleNext}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold text-lg hover:shadow-lg hover:shadow-pink-500/30 transition-all flex items-center justify-center gap-2"
              >
                Create Account <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="text-center py-4">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">You're All Set!</h2>
              <p className="text-white/60 mb-8">
                Your restaurant "{restaurantName}" has been registered. Please login to continue.
              </p>
              
              <button
                onClick={handleRegister}
                disabled={isLoading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-lg hover:shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Go to Login'} <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Login Link */}
        <p className="text-center text-white/60 mt-6">
          Already have an account?{' '}
          <button onClick={() => navigate('/login')} className="text-orange-400 hover:text-orange-300 font-semibold">
            Login here
          </button>
        </p>
      </div>
    </div>
  );
}
