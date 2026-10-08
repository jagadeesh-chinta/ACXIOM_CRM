import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { FormInput } from '../../components/forms/FormControls';
import { authService } from '../../services/authService';

export const AdminPortalPage = () => {
  const [activeTab, setActiveTab] = useState('signin'); // 'signin' or 'signup'
  const [adminExists, setAdminExists] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Signin form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState({});
  const [submittingLogin, setSubmittingLogin] = useState(false);

  // Signup form state (Only accessible if NO admin exists yet)
  const [signupForm, setSignupForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
    phone: '',
    department: 'Executive Leadership'
  });
  const [signupErrors, setSignupErrors] = useState({});
  const [submittingSignup, setSubmittingSignup] = useState(false);

  const { login, registerAdmin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Check backend whether an admin already exists in MySQL
  useEffect(() => {
    const fetchAdminStatus = async () => {
      try {
        setLoadingStatus(true);
        const res = await authService.checkAdminStatus();
        if (res.success && res.data) {
          const exists = res.data.adminExists;
          setAdminExists(exists);
          if (exists) {
            setActiveTab('signin'); // Strictly force signin when admin exists
          } else {
            setActiveTab('signup'); // Default to initial setup if no admin exists
          }
        }
      } catch (err) {
        console.error('Failed to verify admin status:', err);
      } finally {
        setLoadingStatus(false);
      }
    };

    fetchAdminStatus();
  }, []);

  // Validate Signin
  const validateLogin = () => {
    const errs = {};
    if (!loginEmail.trim()) errs.email = 'Admin email address is required.';
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
      if (res.data.user.role_name !== 'ADMIN') {
        showToast('warning', 'Notice', 'Logged in successfully, but your role is ' + res.data.user.role_name + '. Redirecting to workspace.');
      } else {
        showToast('success', 'Master Admin Access', 'Welcome back, Administrator ' + res.data.user.first_name);
      }
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Check your admin credentials.';
      showToast('error', 'Authentication Error', msg);
    } finally {
      setSubmittingLogin(false);
    }
  };

  // Validate Signup (initial master setup)
  const validateSignup = () => {
    const errs = {};
    if (!signupForm.first_name.trim()) errs.first_name = 'First name is required.';
    if (!signupForm.last_name.trim()) errs.last_name = 'Last name is required.';
    if (!signupForm.email.trim()) errs.email = 'Admin email is required.';
    else if (!/\S+@\S+\.\S+/.test(signupForm.email)) errs.email = 'Enter a valid email address.';
    if (!signupForm.password) errs.password = 'Password is required.';
    else if (signupForm.password.length < 6) errs.password = 'Password must be at least 6 characters.';
    if (signupForm.password !== signupForm.confirm_password) errs.confirm_password = 'Passwords do not match.';
    setSignupErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (adminExists) {
      showToast('error', 'Registration Restricted', 'An Administrator is already registered. Only one master admin is permitted.');
      return;
    }
    if (!validateSignup()) return;

    setSubmittingSignup(true);
    try {
      await registerAdmin({
        first_name: signupForm.first_name,
        last_name: signupForm.last_name,
        email: signupForm.email,
        password: signupForm.password,
        phone: signupForm.phone,
        department: signupForm.department
      });
      showToast('success', 'Master Admin Initialized', 'Primary system administrator account created.');
      setAdminExists(true);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Admin initialization failed.';
      showToast('error', 'Registration Error', msg);
    } finally {
      setSubmittingSignup(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-dark p-3" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)' }}>
      <div className="saas-card shadow-lg p-0 overflow-hidden bg-white" style={{ maxWidth: '940px', width: '100%', borderRadius: '24px' }}>
        <div className="row g-0">
          {/* Left Brand Panel */}
          <div
            className="col-lg-5 p-4 p-md-5 d-none d-lg-flex flex-column justify-content-between text-white"
            style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)' }}
          >
            <div>
              <div className="d-flex align-items-center gap-2 mb-4">
                <div className="rounded-3 bg-danger text-white fw-bold p-2 d-flex align-items-center justify-content-center shadow" style={{ width: '42px', height: '42px' }}>
                  <i className="bi bi-shield-lock-fill fs-5"></i>
                </div>
                <div>
                  <span className="brand-font fs-4 fw-bold text-white">ACXIOM<span className="text-danger">ADMIN</span></span>
                  <div className="text-white-50" style={{ fontSize: '0.7rem' }}>Master Governance Console</div>
                </div>
              </div>

              <span className="badge bg-danger bg-opacity-75 text-white mb-3 px-3 py-1 rounded-pill">
                <i className="bi bi-key-fill me-1"></i> Root Administration
              </span>

              <h3 className="fw-bold mb-3">Enterprise System Administration</h3>
              <p className="text-white-50 small mb-4">
                Exclusive portal for Master Administrators to oversee organization users, inspect audit trails, monitor database integrity, and enforce role assignments.
              </p>

              <div className="p-3 rounded-3 bg-white bg-opacity-10 small mb-3">
                <div className="fw-bold mb-1 text-warning">
                  <i className="bi bi-shield-exclamation me-1"></i> Single Admin Policy Enforced
                </div>
                <div className="text-white-50" style={{ fontSize: '0.75rem' }}>
                  For compliance and defense-in-depth, only 1 primary system administrator registration is authorized.
                </div>
              </div>
            </div>

            <div className="pt-3 border-top border-white border-opacity-20 d-flex justify-content-between text-white-50" style={{ fontSize: '0.75rem' }}>
              <span>ACXIOM CRM v2.0 Enterprise</span>
              <span className="text-success"><i className="bi bi-circle-fill me-1" style={{ fontSize: '8px' }}></i>DB Connected</span>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="col-lg-7 p-4 p-md-5">
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div>
                <span className="badge bg-danger-subtle text-danger mb-1 px-2 py-1 rounded-pill small fw-semibold">
                  Administrator Access
                </span>
                <h3 className="fw-bold text-dark mb-0">Admin Portal</h3>
              </div>
              <Link to="/login" className="btn btn-outline-secondary btn-sm" title="Back to Customer Login">
                <i className="bi bi-box-arrow-left me-1"></i> Customer Login
              </Link>
            </div>

            {loadingStatus ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <div className="text-muted small mt-2">Checking admin account status in database...</div>
              </div>
            ) : (
              <>
                {/* Single Admin Condition Notification & Tab Selector */}
                {adminExists ? (
                  /* Admin ALREADY EXISTS: Show ONLY Sign In, hide Sign Up option */
                  <div className="mb-4">
                    <div className="alert alert-info py-2 px-3 small d-flex align-items-center gap-2 mb-3 rounded-3">
                      <i className="bi bi-shield-check fs-5 text-primary"></i>
                      <div>
                        <strong>Master Admin Account Configured.</strong><br />
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                          Single admin limit active. Sign-up is locked. Please sign in with your administrator credentials.
                        </span>
                      </div>
                    </div>

                    <div className="nav nav-pills nav-justified bg-light p-1 rounded-3 mb-3">
                      <button className="nav-link active py-2 fw-semibold" style={{ background: 'var(--primary-color)' }}>
                        <i className="bi bi-box-arrow-in-right me-1"></i> Admin Sign In
                      </button>
                    </div>
                  </div>
                ) : (
                  /* NO Admin Exists Yet: Allow Initial Setup Registration */
                  <div className="mb-4">
                    <div className="alert alert-warning py-2 px-3 small d-flex align-items-center gap-2 mb-3 rounded-3">
                      <i className="bi bi-exclamation-triangle-fill fs-5 text-warning"></i>
                      <div>
                        <strong>Initial System Setup:</strong> No administrator is registered yet. Please create the master administrator account.
                      </div>
                    </div>

                    <div className="nav nav-pills nav-justified bg-light p-1 rounded-3 mb-3">
                      <button
                        className={`nav-link py-2 fw-semibold ${activeTab === 'signup' ? 'active bg-danger text-white' : 'text-secondary'}`}
                        onClick={() => setActiveTab('signup')}
                      >
                        <i className="bi bi-person-plus-fill me-1"></i> Initial Admin Sign Up
                      </button>
                      <button
                        className={`nav-link py-2 fw-semibold ${activeTab === 'signin' ? 'active bg-primary text-white' : 'text-secondary'}`}
                        onClick={() => setActiveTab('signin')}
                      >
                        <i className="bi bi-box-arrow-in-right me-1"></i> Admin Sign In
                      </button>
                    </div>
                  </div>
                )}

                {/* SIGN IN FORM (Always available) */}
                {(activeTab === 'signin' || adminExists) && (
                  <form onSubmit={handleLoginSubmit} noValidate>
                    <FormInput
                      label="Administrator Email Address"
                      id="adminEmail"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      error={loginErrors.email}
                      placeholder="name@gmail.com"
                      icon="bi-shield-lock"
                      required
                    />

                    <FormInput
                      label="Admin Security Password"
                      id="adminPassword"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      error={loginErrors.password}
                      placeholder="••••••••"
                      icon="bi-key"
                      required
                    />

                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <div className="form-check">
                        <input type="checkbox" className="form-check-input" id="adminRemember" defaultChecked />
                        <label className="form-check-label small text-muted" htmlFor="adminRemember">Remember admin session</label>
                      </div>
                      <Link to="/forgot-password" className="small text-primary text-decoration-none fw-semibold">
                        Forgot password?
                      </Link>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-dark w-100 py-2 fw-semibold shadow-sm d-flex align-items-center justify-content-center gap-2"
                      style={{ background: '#1e1b4b', borderColor: '#1e1b4b' }}
                      disabled={submittingLogin}
                    >
                      {submittingLogin ? (
                        <>
                          <span className="spinner-border spinner-border-sm"></span> Verifying Credentials...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-shield-check"></i> Sign In to Admin Console
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* SIGN UP FORM (Strictly shown ONLY when no admin exists in MySQL) */}
                {activeTab === 'signup' && !adminExists && (
                  <form onSubmit={handleSignupSubmit} noValidate>
                    <div className="row g-2">
                      <div className="col-sm-6">
                        <FormInput
                          label="First Name"
                          id="first_name"
                          value={signupForm.first_name}
                          onChange={(e) => setSignupForm({ ...signupForm, first_name: e.target.value })}
                          error={signupErrors.first_name}
                          placeholder="Alexander"
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
                          placeholder="Vance"
                          required
                        />
                      </div>
                    </div>

                    <FormInput
                      label="Admin Email Address"
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
                          placeholder="+1-555-0100"
                        />
                      </div>
                      <div className="col-sm-6">
                        <FormInput
                          label="Department"
                          id="department"
                          value={signupForm.department}
                          onChange={(e) => setSignupForm({ ...signupForm, department: e.target.value })}
                          placeholder="Executive Leadership"
                        />
                      </div>
                    </div>

                    <div className="row g-2">
                      <div className="col-sm-6">
                        <FormInput
                          label="Master Password"
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

                    <div className="alert alert-warning py-2 small mb-3">
                      <i className="bi bi-info-circle-fill me-1"></i> Once this master administrator account is registered, this sign-up form will permanently close and only sign-in will be permitted.
                    </div>

                    <button
                      type="submit"
                      className="btn btn-danger w-100 py-2 fw-semibold shadow-sm"
                      disabled={submittingSignup}
                    >
                      {submittingSignup ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span> Initializing Admin...
                        </>
                      ) : (
                        'Complete Master Admin Setup'
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
                    <Link to="/manager" className="text-decoration-none fw-semibold text-info">
                      <i className="bi bi-briefcase-fill me-1"></i>Manager Portal (/manager)
                    </Link>
                    <span className="text-muted">|</span>
                    <Link to="/sales-exec" className="text-decoration-none fw-semibold text-success">
                      <i className="bi bi-person-badge-fill me-1"></i>Sales Exec Portal (/sales-exec)
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
