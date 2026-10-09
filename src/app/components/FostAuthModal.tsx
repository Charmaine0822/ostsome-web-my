import { useState } from 'react';
import { X, Crown, Eye, EyeOff, Check, ArrowLeft, Mail, Lock, User, Phone, Calendar } from 'lucide-react';
import { useAuth } from './AuthContext';
import { customerLogin, customerRegister, customerResetPassword, getCustomer } from '../data/shopify';

type AuthView = 'login' | 'signup' | 'forgot' | 'forgot-sent' | 'signup-success';

type FostAuthModalProps = {
  initialView?: AuthView;
  onClose: () => void;
};

// Year options for the "Year of Birth" field: current year back to 100 years ago
const CURRENT_YEAR = new Date().getFullYear();
const birthYears = Array.from({ length: 100 + 1 }, (_, i) => CURRENT_YEAR - i);


// ─── SHARED HELPERS ───────────────────────────────────────────────────────────

function PasswordInput({ value, onChange, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? '••••••••'}
        className="w-full border border-neutral-200 rounded-xl px-4 py-3 pr-11 text-sm outline-none focus:border-[#F16C10] transition text-black placeholder-neutral-400 bg-white"
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function FieldRow({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

function StrengthBar({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const strength = checks.filter(Boolean).length;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', 'bg-red-400', 'bg-amber-400', 'bg-yellow-400', 'bg-green-500'];
  if (!password) return null;
  return (
    <div className="mt-1">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? colors[strength] : 'bg-neutral-200'}`} />
        ))}
      </div>
      <p className={`text-[10px] font-semibold ${strength <= 1 ? 'text-red-400' : strength === 2 ? 'text-amber-500' : strength === 3 ? 'text-yellow-600' : 'text-green-600'}`}>
        {labels[strength]}
      </p>
    </div>
  );
}

// Strips everything except digits, +, spaces, hyphens, parentheses
function sanitizePhone(value: string) {
  return value.replace(/[^\d\s\+\-\(\)]/g, '');
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginView({ onSignup, onForgot, onSuccess }: {
  onSignup: () => void;
  onForgot: () => void;
  onSuccess: () => void;
}) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validateEmail() {
    if (!email) { setErrors(p => ({ ...p, email: 'Email is required' })); return false; }
    if (!isValidEmail(email)) { setErrors(p => ({ ...p, email: 'Enter a valid email address' })); return false; }
    return true;
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!email) e.email = 'Email is required';
    else if (!isValidEmail(email)) e.email = 'Enter a valid email address';
    if (!password) e.password = 'Password is required';
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      const result = await customerLogin(email, password);
      if (!result) {
        setErrors({ password: 'Incorrect email or password' });
        setLoading(false);
        return;
      }
      // Fetch real customer data
      const customer = await getCustomer(result.token);
      login({
        firstName: customer?.firstName ?? email.split('@')[0],
        lastName: customer?.lastName ?? '',
        email,
        shopifyToken: result.token,
      });
      onSuccess();
    } catch (err) {
      setErrors({ password: 'Login failed. Please try again.' });
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center mb-2">
        <h2 className="text-xl font-bold text-black mb-1">Welcome back</h2>
        <p className="text-sm text-neutral-500">Log in to access your FOST perks</p>
      </div>

      <FieldRow label="Email" error={errors.email}>
        <div className="relative">
          <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
            onBlur={validateEmail}
            placeholder="jane@example.com"
            className={`w-full border rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-[#F16C10] transition text-black placeholder-neutral-400 ${errors.email ? 'border-red-300 bg-red-50' : 'border-neutral-200'}`}
          />
        </div>
      </FieldRow>

      <FieldRow label="Password" error={errors.password}>
        <PasswordInput
          value={password}
          onChange={v => { setPassword(v); setErrors(p => ({ ...p, password: '' })); }}
        />
        <button
          onClick={onForgot}
          className="text-xs text-[#F16C10] font-semibold hover:underline text-right mt-0.5 self-end"
        >
          Forgot password?
        </button>
      </FieldRow>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-[#F16C10] hover:bg-[#d65f0e] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition text-sm flex items-center justify-center gap-2"
      >
        {loading
          ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Logging in…</>
          : 'Log In'}
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-neutral-100" />
        <span className="text-xs text-neutral-400">or</span>
        <div className="flex-1 h-px bg-neutral-100" />
      </div>

      <p className="text-center text-sm text-neutral-500">
        Not a member yet?{' '}
        <button onClick={onSignup} className="text-[#F16C10] font-bold hover:underline">
          Join FOST — it's free
        </button>
      </p>
    </div>
  );
}

// ─── SIGN UP ──────────────────────────────────────────────────────────────────
function SignupView({ onLogin, onSuccess }: {
  onLogin: () => void;
  onSuccess: (firstName: string, lastName: string, email: string, token: string | null) => void;
}) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', birthYear: '', password: '', confirm: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (v: string) => {
    setForm(prev => ({ ...prev, [key]: v }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  function handlePhoneChange(raw: string) {
    set('phone')(sanitizePhone(raw));
  }

  function validateEmailField() {
    if (form.email && !isValidEmail(form.email)) {
      setErrors(p => ({ ...p, email: 'Enter a valid email address' }));
    }
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim()) e.lastName = 'Required';
    if (!form.email) e.email = 'Required';
    else if (!isValidEmail(form.email)) e.email = 'Enter a valid email address';
    if (form.phone && !/^[\d\s\+\-\(\)]{7,15}$/.test(form.phone)) e.phone = 'Enter a valid phone number';
    if (!form.password) e.password = 'Required';
    else if (form.password.length < 8) e.password = 'Minimum 8 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    if (!agree) e.agree = 'Please agree to the terms';
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      const result = await customerRegister({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
      });
      if (!result.success) {
        setErrors({ email: result.errors[0] ?? 'Registration failed' });
        setLoading(false);
        return;
      }
      // Auto-login after registration
      const tokenResult = await customerLogin(form.email, form.password);
      if (tokenResult) {
        const customer = await getCustomer(tokenResult.token);
        // Only the authenticated account can be tagged; wait for the result before checkout.
        let tagged = false;
        for (let attempt = 0; attempt < 3 && !tagged; attempt++) {
          try {
            const response = await fetch('/.netlify/functions/tag-fost-member', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ customerAccessToken: tokenResult.token }),
            });
            const data = await response.json();
            tagged = response.ok && data.success === true;
          } catch (error) { console.error('FOST membership activation failed', error); }
          if (!tagged && attempt < 2) await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
        if (!tagged) {
          setErrors({ email: 'Account created, but your first-order discount is not activated yet. Please contact support before checkout.' });
        }
        // Store token via onSuccess callback
        onSuccess(form.firstName, form.lastName, form.email, tokenResult.token);
      } else {
        onSuccess(form.firstName, form.lastName, form.email, null);
      }
    } catch (err) {
      setErrors({ email: 'Registration failed. Please try again.' });
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center mb-1">
        <h2 className="text-xl font-bold text-black mb-1">Join FOST</h2>
        <p className="text-sm text-neutral-500">Free membership. Better prices. Early access.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FieldRow label="First Name" error={errors.firstName}>
          <div className="relative">
            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input type="text" value={form.firstName} onChange={e => set('firstName')(e.target.value)}
              placeholder="Jane"
              className={`w-full border rounded-xl pl-9 pr-3 py-3 text-sm outline-none focus:border-[#F16C10] transition text-black placeholder-neutral-400 ${errors.firstName ? 'border-red-300 bg-red-50' : 'border-neutral-200'}`} />
          </div>
        </FieldRow>
        <FieldRow label="Last Name" error={errors.lastName}>
          <input type="text" value={form.lastName} onChange={e => set('lastName')(e.target.value)}
            placeholder="Tan"
            className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-[#F16C10] transition text-black placeholder-neutral-400 ${errors.lastName ? 'border-red-300 bg-red-50' : 'border-neutral-200'}`} />
        </FieldRow>
      </div>

      <FieldRow label="Email" error={errors.email}>
        <div className="relative">
          <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="email"
            value={form.email}
            onChange={e => set('email')(e.target.value)}
            onBlur={validateEmailField}
            placeholder="jane@example.com"
            className={`w-full border rounded-xl pl-9 pr-4 py-3 text-sm outline-none focus:border-[#F16C10] transition text-black placeholder-neutral-400 ${errors.email ? 'border-red-300 bg-red-50' : 'border-neutral-200'}`}
          />
        </div>
      </FieldRow>

      <div className="grid grid-cols-2 gap-3">
        <FieldRow label="Phone (optional)" error={errors.phone}>
          <div className="relative">
            <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="tel"
              inputMode="numeric"
              value={form.phone}
              onChange={e => handlePhoneChange(e.target.value)}
              placeholder="+65 9123 4567"
              className={`w-full border rounded-xl pl-9 pr-3 py-3 text-sm outline-none focus:border-[#F16C10] transition text-black placeholder-neutral-400 ${errors.phone ? 'border-red-300 bg-red-50' : 'border-neutral-200'}`}
            />
          </div>
        </FieldRow>
        <FieldRow label="Year of Birth (optional)">
          <div className="relative">
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <select value={form.birthYear} onChange={e => set('birthYear')(e.target.value)}
              className={`w-full border border-neutral-200 rounded-xl pl-9 pr-3 py-3 text-sm outline-none focus:border-[#F16C10] transition appearance-none ${form.birthYear ? 'text-black' : 'text-neutral-400'}`}>
              <option value="" disabled>Select year</option>
              {birthYears.map(year => (
                <option key={year} value={year} className="text-black">{year}</option>
              ))}
            </select>
          </div>
        </FieldRow>
      </div>

      <FieldRow label="Password" error={errors.password}>
        <PasswordInput value={form.password} onChange={set('password')} placeholder="Min. 8 characters" />
        <StrengthBar password={form.password} />
      </FieldRow>

      <FieldRow label="Confirm Password" error={errors.confirm}>
        <PasswordInput value={form.confirm} onChange={set('confirm')} placeholder="Re-enter password" />
      </FieldRow>

      <div>
        <label className="flex items-start gap-3 cursor-pointer">
          <div
            onClick={() => { setAgree(a => !a); setErrors(prev => ({ ...prev, agree: '' })); }}
            className={`mt-0.5 w-4 h-4 shrink-0 rounded border-2 flex items-center justify-center transition ${agree ? 'bg-[#F16C10] border-[#F16C10]' : 'border-neutral-300'}`}
          >
            {agree && <Check size={10} strokeWidth={3} className="text-white" />}
          </div>
          <span className="text-xs text-neutral-500 leading-relaxed">
            I agree to Ostsome's{' '}
            <a href="#" className="text-[#F16C10] hover:underline font-medium">Terms of Service</a>{' '}
            and{' '}
            <a href="#" className="text-[#F16C10] hover:underline font-medium">Privacy Policy</a>
          </span>
        </label>
        {errors.agree && <p className="text-xs text-red-500 mt-1 ml-7">{errors.agree}</p>}
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-[#F16C10] hover:bg-[#d65f0e] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition text-sm flex items-center justify-center gap-2 mt-1"
      >
        {loading
          ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Creating account…</>
          : 'Create My FOST Account'}
      </button>

      <p className="text-center text-sm text-neutral-500">
        Already a member?{' '}
        <button onClick={onLogin} className="text-[#F16C10] font-bold hover:underline">Log in</button>
      </p>
    </div>
  );
}

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
function ForgotView({ onBack, onSent }: { onBack: () => void; onSent: (email: string) => void }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function validateEmailField() {
    if (email && !isValidEmail(email)) setError('Enter a valid email address');
  }

  async function handleSubmit() {
    if (!email) { setError('Please enter your email address'); return; }
    if (!isValidEmail(email)) { setError('Enter a valid email address'); return; }
    setLoading(true);
    try {
      await customerResetPassword(email);
      onSent(email); // always show sent screen (Shopify doesn't confirm if email exists)
    } catch {
      onSent(email); // still show sent screen for security
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-black transition self-start">
        <ArrowLeft size={15} /> Back to login
      </button>

      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-[#F16C10]/10 flex items-center justify-center mx-auto mb-4">
          <Lock size={24} className="text-[#F16C10]" />
        </div>
        <h2 className="text-xl font-bold text-black mb-2">Reset your password</h2>
        <p className="text-sm text-neutral-500 leading-relaxed">
          Enter your email and we'll send you a link to reset your password.
        </p>
      </div>

      <FieldRow label="Email Address" error={error}>
        <div className="relative">
          <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(''); }}
            onBlur={validateEmailField}
            placeholder="jane@example.com"
            className={`w-full border rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-[#F16C10] transition text-black placeholder-neutral-400 ${error ? 'border-red-300 bg-red-50' : 'border-neutral-200'}`}
          />
        </div>
      </FieldRow>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-[#F16C10] hover:bg-[#d65f0e] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition text-sm flex items-center justify-center gap-2"
      >
        {loading
          ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Sending…</>
          : 'Send Reset Link'}
      </button>
    </div>
  );
}

// ─── SUCCESS SCREENS ──────────────────────────────────────────────────────────
function ForgotSentView({ email, onBack }: { email: string; onBack: () => void }) {
  return (
    <div className="flex flex-col items-center text-center gap-5 py-4">
      <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center">
        <Mail size={28} className="text-green-500" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-black mb-2">Check your inbox</h2>
        <p className="text-sm text-neutral-500 leading-relaxed">We've sent a password reset link to</p>
        <p className="text-sm font-bold text-black mt-1">{email}</p>
      </div>
      <div className="bg-neutral-50 rounded-xl border border-neutral-100 px-5 py-4 text-xs text-neutral-500 leading-relaxed w-full">
        Didn't receive it? Check your spam folder, or{' '}
        <button onClick={onBack} className="text-[#F16C10] font-semibold hover:underline">try a different email</button>.
      </div>
    </div>
  );
}

function SignupSuccessView({ firstName, onClose }: { firstName: string; onClose: () => void }) {
  return (
    <div className="flex flex-col items-center text-center gap-5 py-4">
      <div className="w-16 h-16 rounded-full bg-[#F16C10]/10 border-2 border-[#F16C10]/30 flex items-center justify-center">
        <Crown size={28} className="text-[#F16C10]" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-black mb-2">Welcome, {firstName}! 🎉</h2>
        <p className="text-sm text-neutral-500 leading-relaxed">
          You now have access to member pricing, early drops, and exclusive events.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 w-full">
        {[
          { emoji: '🏷️', label: 'Member Pricing', sub: 'Unlocked' },
          { emoji: '⚡', label: 'Early Access', sub: 'Activated' },
          { emoji: '🧪', label: 'Product Testing', sub: 'Eligible' },
          { emoji: '🎟️', label: 'Events', sub: 'Invite-eligible' },
        ].map(p => (
          <div key={p.label} className="flex flex-col items-center gap-1 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
            <span className="text-lg">{p.emoji}</span>
            <p className="font-bold text-black text-xs">{p.label}</p>
            <p className="text-[10px] text-green-600 font-semibold">{p.sub}</p>
          </div>
        ))}
      </div>
      <button
        onClick={onClose}
        className="w-full bg-[#F16C10] hover:bg-[#d65f0e] text-white font-bold py-3.5 rounded-xl transition text-sm"
      >
        Start Shopping
      </button>
    </div>
  );
}

// ─── MAIN MODAL ───────────────────────────────────────────────────────────────
export function FostAuthModal({ initialView = 'login', onClose }: FostAuthModalProps) {
  const { login } = useAuth();
  const [view, setView] = useState<AuthView>(initialView);
  const [forgotEmail, setForgotEmail] = useState('');
  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '' });

  const titles: Record<AuthView, string> = {
    login: 'FOST Member Login',
    signup: 'Join FOST',
    forgot: 'Reset Password',
    'forgot-sent': 'Email Sent',
    'signup-success': 'Welcome to FOST',
  };

  function handleSignupSuccess(firstName: string, lastName: string, email: string, token: string | null) {
    setNewUser({ firstName, lastName, email });
    login({ firstName, lastName, email, shopifyToken: token ?? undefined });
    setView('signup-success');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <Crown size={16} className="text-[#F16C10]" />
            <span className="text-sm font-bold text-black">{titles[view]}</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 transition text-neutral-400"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-6">
          {view === 'login' && (
            <LoginView
              onSignup={() => setView('signup')}
              onForgot={() => setView('forgot')}
              onSuccess={onClose}
            />
          )}
          {view === 'signup' && (
            <SignupView
              onLogin={() => setView('login')}
              onSuccess={handleSignupSuccess}
            />
          )}
          {view === 'forgot' && (
            <ForgotView
              onBack={() => setView('login')}
              onSent={email => { setForgotEmail(email); setView('forgot-sent'); }}
            />
          )}
          {view === 'forgot-sent' && (
            <ForgotSentView email={forgotEmail} onBack={() => setView('forgot')} />
          )}
          {view === 'signup-success' && (
            <SignupSuccessView firstName={newUser.firstName} onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  );
}