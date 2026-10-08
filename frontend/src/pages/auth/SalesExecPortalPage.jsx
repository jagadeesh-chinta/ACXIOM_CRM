import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { FormInput } from '../../components/forms/FormControls';

export const SalesExecPortalPage = () => {
  const [activeTab, setActiveTab] = useState('signin'); // 'signin' or 'signup'

  // Signin form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState({});
  const [submittingLogin, setSubmittingLogin] = useState(false);

  // Signup form state
  const [signupForm, setSignupForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
    phone: '',
    department: 'Enterprise Sales'
  });
  const [signupErrors, setSignupErrors] = useState({});
  const [submittingSignup, setSubmittingSignup] = useState(false);

  const { login, registerSalesExec } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Validate Signin
  const validateLogin = () => {
    const errs = {};
    if (!loginEmail.trim()) errs.email = 'Sales Executive email address is required.';
    else if (!/\S+@\S+\.\S+/.test(loginEmail)) errs.email = 'Enter a valid email address.';
    if (!loginPassword) errs.password = 'Password is required.';
    setLoginErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!validateLogin()) return;

    setSubmittingLogin(true);
    try {
      const res = await login(loginEmail, loginPassword);
      showToast('success', 'Sales Workspace', 'Welcome back, ' + res.data.user.first_name);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Check your sales credentials.';
      showToast('error', 'Authentication Failed', msg);
    } finally {
      setSubmittingLogin(false);
    }
  };

  // Validate Signup
  const validateSignup = () => {
    const errs = {};
    if (!signupForm.first_name.trim()) errs.first_name = 'First name is required.';
    if (!signupForm.last_name.trim()) errs.last_name = 'Last name is required.';
    if (!signupForm.email.trim()) errs.email = 'Corporate email is required.';
    else if (!/\S+@\S+\.\S+/.test(signupForm.email)) errs.email = 'Enter a valid email address.';
    if (!signupForm.password) errs.password = 'Password is required.';
    else if (signupForm.password.length < 6) errs.password = 'Password must be at least 6 characters.';
    if (signupForm.password !== signupForm.confirm_password) errs.confirm_password = 'Passwords do not match.';
    setSignupErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!validateSignup()) return;

    setSubmittingSignup(true);
    try {
      await registerSalesExec({
        first_name: signupForm.first_name,
        last_name: signupForm.last_name,
        email: signupForm.email,
        password: signupForm.password,
        phone: signupForm.phone,
        department: signupForm.department
      });
      showToast('success', 'Sales Rep Registered', 'Sales Executive account created successfully.');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Sales Executive registration failed.';
      showToast('error', 'Registration Error', msg);
    } finally {
      setSubmittingSignup(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-3" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)' }}>
      <div className="saas-card shadow-lg p-0 overflow-hidden bg-white" style={{ maxWidth: '940px', width: '100%', borderRadius: '24px' }}>
        <div className="row g-0">
          {/* Left Brand Panel */}
          <div
            className="col-lg-5 p-4 p-md-5 d-none d-lg-flex flex-column justify-content-between text-white"
            style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}
          >
            <div>
              <div className="d-flex align-items-center gap-2 mb-4">
                <div className="rounded-3 bg-white text-success fw-bold p-2 d-flex align-items-center justify-content-center shadow" style={{ width: '42px', height: '42px' }}>
                  <i className="bi bi-person-badge-fill fs-5 text-success"></i>
                </div>
                <div>
                  <span className="brand-font fs-4 fw-bold text-white">ACXIOM<span className="text-warning">SALES</span></span>
                  <div className="text-white-50" style={{ fontSize: '0.7rem' }}>Commercial Field Operations</div>
                </div>
              </div>

              <span className="badge bg-white bg-opacity-25 text-white mb-3 px-3 py-1 rounded-pill">
                <i className="bi bi-funnel-fill me-1"></i> Sales Executive Portal
              </span>

              <h3 className="fw-bold mb-3">Field Representative Workspace</h3>
              <p className="text-white-50 small mb-4">
                Manage your assigned leads, engage high-value prospects, track commercial deal milestones, and log real-time client touchpoints with zero friction.
              </p>

              <div className="p-3 rounded-3 bg-white bg-opacity-10 small mb-3">
                <div className="fw-bold mb-1 text-light">
                  <i className="bi bi-calendar2-check me-1"></i> Automated Follow-ups
                </div>
                <div className="text-white-50" style={{ fontSize: '0.75rem' }}>
                  Daily agenda, overdue alert warnings, and quick status logging right inside your workspace.
                </div>
              </div>
            </div>

            <div className="pt-3 border-top border-white border-opacity-20 d-flex justify-content-between text-white-50" style={{ fontSize: '0.75rem' }}>
              <span>ACXIOM CRM v2.0 Enterprise</span>
              <span className="text-light"><i className="bi bi-circle-fill me-1" style={{ fontSize: '8px' }}></i>Rep Center Active</span>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="col-lg-7 p-4 p-md-5">
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div>
                <span className="badge bg-success-subtle text-success mb-1 px-2 py-1 rounded-pill small fw-semibold">
                  Field Representative Access
                </span>
                <h3 className="fw-bold text-dark mb-0">Sales Exec Portal</h3>
              </div>
              <Link to="/login" className="btn btn-outline-secondary btn-sm" title="Back to Customer Login">
                <i className="bi bi-box-arrow-left me-1"></i> Customer Login
              </Link>
            </div>

            {/* Tab Selector */}
            <div className="nav nav-pills nav-justified bg-light p-1 rounded-3 mb-4">
              <button
                className={`nav-link py-2 fw-semibold ${activeTab === 'signin' ? 'active bg-success text-white' : 'text-secondary'}`}
                onClick={() => setActiveTab('signin')}
              >
                <i className="bi bi-box-arrow-in-right me-1"></i> Sign In as Sales Exec
              </button>
              <button
                className={`nav-link py-2 fw-semibold ${activeTab === 'signup' ? 'active bg-success text-white' : 'text-secondary'}`}
                onClick={() => setActiveTab('signup')}
              >
                <i className="bi bi-person-plus-fill me-1"></i> Sign Up as Sales Exec
              </button>
            </div>

            {/* SIGN IN FORM */}
            {activeTab === 'signin' && (
              <form onSubmit={handleLoginSubmit} noValidate>
                <FormInput
                  label="Sales Executive Email Address"
                  id="salesEmail"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  error={loginErrors.email}
                  placeholder="name@gmail.com"
                  icon="bi-envelope"
                  required
                />

                <FormInput
                  label="Password"
                  id="salesPassword"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  error={loginErrors.password}
                  placeholder="••••••••"
                  icon="bi-lock"
                  required
                />

                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className="form-check">
                    <input type="checkbox" className="form-check-input" id="salesRemember" defaultChecked />
                    <label className="form-check-label small text-muted" htmlFor="salesRemember">Remember me</label>
                  </div>
                  <Link to="/forgot-password" className="small text-primary text-decoration-none fw-semibold">
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  className="btn btn-success text-white w-100 py-2 fw-semibold shadow-sm"
                  disabled={submittingLogin}
                >
                  {submittingLogin ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span> Authenticating...
                    </>
                  ) : (
                    'Sign In to Sales Workspace'
                  )}
                </button>
              </form>
            )}

            {/* SIGN UP FORM */}
            {activeTab === 'signup' && (
              <form onSubmit={handleSignupSubmit} noValidate>
                <div className="row g-2">
                  <div className="col-sm-6">
                    <FormInput
                      label="First Name"
                      id="first_name"
                      value={signupForm.first_name}
                      onChange={(e) => setSignupForm({ ...signupForm, first_name: e.target.value })}
                      error={signupErrors.first_name}
                      placeholder="Alex"
                      required
                    />
                  </div>
                  <div className="col-sm-6">
                    <FormInput
                      label="Last Name"
                      id="last_name"
                      value={signupForm.last_name}
                      onChange={(e) => setSignupForm({ ...signupForm, last_name: e.target.value })}
                      error={signupErrors.last_name}
                      placeholder="Turner"
                      required
                    />
                  </div>
                </div>

                <FormInput
                  label="Corporate Sales Email"
                  id="signupEmail"
                  type="email"
                  value={signupForm.email}
                  onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                  error={signupErrors.email}
                  placeholder="name@gmail.com"
                  icon="bi-envelope"
                  required
                />

                <div className="row g-2">
                  <div className="col-sm-6">
                    <FormInput
                      label="Contact Phone"
                      id="phone"
                      value={signupForm.phone}
                      onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                      placeholder="+1-555-0103"
                    />
                  </div>
                  <div className="col-sm-6">
                    <FormInput
                      label="Sales Division"
                      id="department"
                      value={signupForm.department}
                      onChange={(e) => setSignupForm({ ...signupForm, department: e.target.value })}
                      placeholder="Enterprise Sales"
                    />
                  </div>
                </div>

                <div className="row g-2">
                  <div className="col-sm-6">
                    <FormInput
                      label="Password"
                      id="signupPassword"
                      type="password"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                      error={signupErrors.password}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div className="col-sm-6">
                    <FormInput
                      label="Confirm Password"
                      id="confirm_password"
                      type="password"
                      value={signupForm.confirm_password}
                      onChange={(e) => setSignupForm({ ...signupForm, confirm_password: e.target.value })}
                      error={signupErrors.confirm_password}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-success text-white w-100 py-2 fw-semibold shadow-sm mt-2"
                  disabled={submittingSignup}
                >
                  {submittingSignup ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span> Registering Sales Exec...
                    </>
                  ) : (
                    'Register as Sales Executive'
                  )}
                </button>
              </form>
            )}

            {/* Role Portals Switcher */}
            <div className="mt-4 pt-3 border-top text-center">
              <div className="text-muted small fw-semibold mb-2" style={{ fontSize: '0.75rem' }}>
                Switch to other role workspaces:
              </div>
              <div className="d-flex justify-content-center gap-3" style={{ fontSize: '0.8rem' }}>
                <Link to="/admin" className="text-decoration-none fw-semibold text-danger">
                  <i className="bi bi-shield-fill-check me-1"></i>Admin Portal (/admin)
                </Link>
                <span className="text-muted">|</span>
                <Link to="/manager" className="text-decoration-none fw-semibold text-info">
                  <i className="bi bi-briefcase-fill me-1"></i>Manager Portal (/manager)
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
