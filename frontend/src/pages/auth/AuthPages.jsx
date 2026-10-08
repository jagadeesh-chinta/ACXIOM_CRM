import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { FormInput } from '../../components/forms/FormControls';
import { authService } from '../../services/authService';

/**
 * LOGIN PAGE
 */
export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const sessionExpired = new URLSearchParams(location.search).get('sessionExpired');

  const validate = () => {
    const errs = {};
    if (!email.trim()) errs.email = 'Email address is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email address.';
    if (!password) errs.password = 'Password is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await login(email, password);
      showToast('success', 'Welcome Back!', `Logged in as ${res.data.user.role_name}`);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      showToast('error', 'Authentication Failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-3">
      <div className="saas-card shadow-lg p-0 overflow-hidden bg-white" style={{ maxWidth: '920px', width: '100%', borderRadius: '20px' }}>
        <div className="row g-0">
          {/* Left Brand Panel */}
          <div
            className="col-lg-5 p-4 p-md-5 d-none d-lg-flex flex-column justify-content-between text-white"
            style={{ background: 'var(--primary-gradient)' }}
          >
            <div>
              <div className="d-flex align-items-center gap-2 mb-4">
                <div className="rounded-3 bg-white text-primary fw-bold p-2 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                  A
                </div>
                <span className="brand-font fs-4 fw-bold">ACXIOMCRM</span>
              </div>
              <span className="badge bg-white bg-opacity-25 text-white mb-3 px-3 py-1 rounded-pill">Customer Portal</span>
              <h3 className="fw-bold mb-3">Customer Relationship Center</h3>
              <p className="text-white-50 small mb-4">
                Dedicated client gateway to monitor service requests, track organizational opportunities, review follow-ups, and coordinate with your account management team.
              </p>
            </div>

            <div className="p-3 rounded-3 bg-white bg-opacity-10 small">
              <div className="fw-bold mb-1"><i className="bi bi-shield-lock-fill me-1"></i> Customer Data Protected</div>
              <div className="text-white-50" style={{ fontSize: '0.75rem' }}>
                Encrypted end-to-end sessions. Account lockout after 5 consecutive failed attempts.
              </div>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="col-lg-7 p-4 p-md-5">
            <div className="mb-4">
              <span className="badge bg-primary-subtle text-primary mb-2 px-2 py-1 rounded-pill small fw-semibold">Customer Sign In</span>
              <h3 className="fw-bold text-dark mb-1">Sign in to Customer Portal</h3>
              <p className="text-muted small">Enter your customer account email and password to access your workspace.</p>
            </div>

            {sessionExpired && (
              <div className="alert alert-warning small p-2 mb-3">
                <i className="bi bi-exclamation-triangle-fill me-1"></i> Your session has expired. Please log in again.
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <FormInput
                label="Customer Email Address"
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                placeholder="name@gmail.com"
                icon="bi-envelope"
                required
              />

              <FormInput
                label="Password"
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                placeholder="••••••••"
                icon="bi-lock"
                required
              />

              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="form-check">
                  <input type="checkbox" className="form-check-input" id="rememberMe" defaultChecked />
                  <label className="form-check-label small text-muted" htmlFor="rememberMe">Remember me</label>
                </div>
                <Link to="/forgot-password" className="small text-primary text-decoration-none fw-semibold">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                className="btn btn-primary-gradient w-100 py-2 fw-semibold shadow-sm"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span> Authenticating...
                  </>
                ) : (
                  'Sign In as Customer'
                )}
              </button>
            </form>

            <div className="text-center mt-4 pt-2 border-top">
              <span className="text-muted small">Don't have a customer account? </span>
              <Link to="/register" className="small text-primary fw-bold text-decoration-none">
                Register as Customer
              </Link>
            </div>

            {/* Internal Workspaces Direct Links */}
            <div className="mt-4 pt-3 border-top bg-light p-3 rounded-3 text-center">
              <div className="text-muted small fw-semibold mb-2" style={{ fontSize: '0.75rem' }}>
                <i className="bi bi-building me-1"></i> AcxiomCRM Staff & Executive Access
              </div>
              <div className="d-flex justify-content-center gap-3" style={{ fontSize: '0.8rem' }}>
                <Link to="/admin" className="text-decoration-none fw-semibold text-danger">
                  <i className="bi bi-shield-fill-check me-1"></i>Admin Portal
                </Link>
                <span className="text-muted">|</span>
                <Link to="/manager" className="text-decoration-none fw-semibold text-info">
                  <i className="bi bi-briefcase-fill me-1"></i>Manager Portal
                </Link>
                <span className="text-muted">|</span>
                <Link to="/sales-exec" className="text-decoration-none fw-semibold text-success">
                  <i className="bi bi-person-badge-fill me-1"></i>Sales Exec Portal
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * REGISTER PAGE
 */
export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_name: '',
    password: '',
    confirm_password: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!formData.first_name.trim()) errs.first_name = 'First Name is required.';
    if (!formData.last_name.trim()) errs.last_name = 'Last Name is required.';
    if (!formData.email.trim()) errs.email = 'Email address is required.';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Enter a valid email address.';
    if (!formData.phone.trim()) errs.phone = 'Phone number is required.';
    if (!formData.password) errs.password = 'Password is required.';
    else if (formData.password.length < 6) errs.password = 'Password must be at least 6 characters.';
    if (formData.password !== formData.confirm_password) errs.confirm_password = 'Passwords do not match.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await register({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        company_name: formData.company_name,
        password: formData.password
      });
      showToast('success', 'Registration Successful', 'Welcome to AcxiomCRM Customer Portal.');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed.';
      showToast('error', 'Error Registering', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-3">
      <div className="saas-card shadow-lg p-4 p-md-5 bg-white" style={{ maxWidth: '640px', width: '100%', borderRadius: '20px' }}>
        <div className="text-center mb-4">
          <Link to="/" className="d-inline-flex align-items-center text-decoration-none gap-2 mb-2">
            <div className="rounded-3 bg-primary text-white fw-bold p-2 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
              A
            </div>
            <span className="brand-font fs-4 fw-bold text-dark">ACXIOM<span className="text-primary">CRM</span></span>
          </Link>
          <h4 className="fw-bold text-dark">Create Your Customer Account</h4>
          <p className="text-muted small">Register to track your organizational opportunities and request support.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="row g-2">
            <div className="col-sm-6">
              <FormInput
                label="First Name"
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                error={errors.first_name}
                placeholder="Jane"
                required
              />
            </div>
            <div className="col-sm-6">
              <FormInput
                label="Last Name"
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                error={errors.last_name}
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div className="row g-2">
            <div className="col-sm-6">
              <FormInput
                label="Email"
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={errors.email}
                placeholder="name@gmail.com"
                required
              />
            </div>
            <div className="col-sm-6">
              <FormInput
                label="Phone"
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                error={errors.phone}
                placeholder="+1-555-0199"
                required
              />
            </div>
          </div>

          <FormInput
            label="Company Name"
            id="company_name"
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            placeholder="Apex Technologies Inc."
          />

          <div className="row g-2">
            <div className="col-sm-6">
              <FormInput
                label="Password"
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                error={errors.password}
                placeholder="Min 6 characters"
                required
              />
            </div>
            <div className="col-sm-6">
              <FormInput
                label="Confirm Password"
                id="confirm_password"
                type="password"
                value={formData.confirm_password}
                onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                error={errors.confirm_password}
                placeholder="Repeat password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary-gradient w-100 py-2 mt-3 fw-semibold"
            disabled={submitting}
          >
            {submitting ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>

        <div className="text-center mt-4 pt-2 border-top">
          <span className="text-muted small">Already have an account? </span>
          <Link to="/login" className="small text-primary fw-bold text-decoration-none">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

/**
 * FORGOT PASSWORD PAGE
 */
export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
      showToast('info', 'Recovery Initiated', 'Password recovery instructions have been dispatched.');
    } catch (err) {
      showToast('error', 'Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-3">
      <div className="saas-card shadow-lg p-4 p-md-5 bg-white text-center" style={{ maxWidth: '440px', width: '100%', borderRadius: '20px' }}>
        <div className="rounded-circle bg-primary-subtle text-primary mx-auto d-flex align-items-center justify-content-center mb-3" style={{ width: '64px', height: '64px', fontSize: '1.8rem' }}>
          <i className="bi bi-key-fill"></i>
        </div>
        <h4 className="fw-bold text-dark mb-1">Reset Password</h4>
        <p className="text-muted small mb-4">Enter your registered email address to receive password recovery instructions.</p>

        {submitted ? (
          <div className="alert alert-success small text-start">
            <strong>Check your inbox!</strong> If an account exists with this email, security instructions have been generated.
            <div className="mt-3 text-center">
              <Link to="/reset-password" className="btn btn-primary-gradient btn-sm px-4">
                Proceed to Reset Form
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <FormInput
              label="Account Email"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@gmail.com"
              required
            />
            <button type="submit" className="btn btn-primary-gradient w-100 py-2 fw-semibold" disabled={loading}>
              {loading ? 'Processing...' : 'Send Recovery Instructions'}
            </button>
          </form>
        )}

        <div className="mt-4 pt-2 border-top">
          <Link to="/login" className="small text-muted text-decoration-none">
            <i className="bi bi-arrow-left me-1"></i> Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

/**
 * RESET PASSWORD PAGE
 */
export const ResetPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !newPassword || newPassword.length < 6) {
      showToast('error', 'Validation Error', 'Email and password (min 6 chars) are required.');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({ email, new_password: newPassword });
      showToast('success', 'Password Updated', 'You can now sign in with your new credentials.');
      navigate('/login');
    } catch (err) {
      showToast('error', 'Reset Failed', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-3">
      <div className="saas-card shadow-lg p-4 p-md-5 bg-white text-center" style={{ maxWidth: '440px', width: '100%', borderRadius: '20px' }}>
        <h4 className="fw-bold text-dark mb-1">Set New Password</h4>
        <p className="text-muted small mb-4">Choose a strong new password for your account.</p>

        <form onSubmit={handleSubmit}>
          <FormInput
            label="Registered Email"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@gmail.com"
            required
          />
          <FormInput
            label="New Password"
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min 6 characters"
            required
          />
          <button type="submit" className="btn btn-primary-gradient w-100 py-2 fw-semibold" disabled={loading}>
            {loading ? 'Updating Password...' : 'Save & Log In'}
          </button>
        </form>

        <div className="mt-4 pt-2 border-top">
          <Link to="/login" className="small text-muted text-decoration-none">
            <i className="bi bi-arrow-left me-1"></i> Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
