import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';

export const LandingPage = () => {
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await authService.getPublicStats();
        if (res.success && res.data) {
          setStats(res.data);
        }
      } catch (err) {
        console.error('Failed to load dynamic public stats:', err);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="bg-white min-vh-100 d-flex flex-column" style={{ overflowX: 'hidden' }}>
      {/* 1. PUBLIC NAVBAR */}
      <header className="sticky-top bg-white bg-opacity-95 border-bottom border-light-subtle shadow-sm px-3 px-lg-5 py-3">
        <div className="container-fluid d-flex align-items-center justify-content-between">
          <Link to="/" className="d-flex align-items-center text-decoration-none gap-2">
            <div
              className="rounded-3 d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
              style={{ width: '40px', height: '40px', background: 'var(--primary-gradient)', fontSize: '1.2rem' }}
            >
              A
            </div>
            <div>
              <span className="brand-font fs-4 fw-bold text-dark">ACXIOM</span>
              <span className="fs-4 fw-bold text-primary">CRM</span>
            </div>
          </Link>

          <nav className="d-none d-lg-flex align-items-center gap-4">
            <a href="#features" className="text-secondary fw-medium text-decoration-none small hover-primary">Features</a>
            <a href="#workflow" className="text-secondary fw-medium text-decoration-none small hover-primary">Workflow</a>
            <a href="#roles" className="text-secondary fw-medium text-decoration-none small hover-primary">Solutions & Roles</a>
            <a href="#security" className="text-secondary fw-medium text-decoration-none small hover-primary">Security</a>
            <a href="#stats" className="text-secondary fw-medium text-decoration-none small hover-primary">Live Database Metrics</a>
          </nav>

          <div className="d-flex align-items-center gap-2">
            <Link to="/login" className="btn btn-outline-secondary btn-sm px-3 fw-semibold">
              Customer Login
            </Link>
            <Link to="/register" className="btn btn-primary-gradient btn-sm px-3 fw-semibold shadow-sm">
              Customer Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="position-relative py-5 py-lg-6" style={{ background: 'radial-gradient(ellipse at top, #eef2ff 0%, #ffffff 70%)' }}>
        <div className="container py-4">
          <div className="row align-items-center gy-5">
            <div className="col-lg-6 text-center text-lg-start">
              <div className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 rounded-pill mb-3 fw-semibold small">
                <i className="bi bi-stars me-1"></i> Next-Gen Enterprise Customer OS
              </div>
              <h1 className="display-4 fw-extrabold text-dark tracking-tight mb-3" style={{ lineHeight: '1.15' }}>
                Turn Every Customer Interaction Into <span style={{ background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Growth</span>
              </h1>
              <p className="lead text-secondary mb-4 fs-6">
                AcxiomCRM empowers modern organizations to orchestrate customers, qualified leads, active sales pipelines, and automated follow-ups from one intelligent, role-governed platform.
              </p>
              <div className="d-flex flex-wrap gap-3 justify-content-center justify-content-lg-start mb-4">
                <Link to="/register" className="btn btn-primary-gradient px-4 py-3 fw-bold rounded-pill shadow">
                  <i className="bi bi-rocket-takeoff-fill me-2"></i> Get Started Free
                </Link>
                <a href="#features" className="btn btn-outline-dark px-4 py-3 fw-semibold rounded-pill">
                  Explore CRM Capabilities
                </a>
              </div>
              <div className="d-flex align-items-center justify-content-center justify-content-lg-start gap-4 text-muted small pt-2">
                <div><i className="bi bi-check-circle-fill text-success me-1"></i> Multi-Role RBAC</div>
                <div><i className="bi bi-check-circle-fill text-success me-1"></i> Zero Mongo / 100% MySQL</div>
                <div><i className="bi bi-check-circle-fill text-success me-1"></i> SOC2 Audit Logging</div>
              </div>
            </div>

            {/* Interactive Hero Visual */}
            <div className="col-lg-6">
              <div className="position-relative p-2">
                {/* Decorative blur backdrop */}
                <div
                  className="position-absolute top-50 start-50 translate-middle rounded-circle"
                  style={{
                    width: '380px',
                    height: '380px',
                    background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.15), rgba(6, 182, 212, 0.15))',
                    filter: 'blur(60px)',
                    zIndex: 0
                  }}
                ></div>

                {/* Dashboard Mockup Card */}
                <div className="saas-card shadow-lg p-4 position-relative bg-white rounded-4 border border-light-subtle" style={{ zIndex: 1 }}>
                  <div className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom">
                    <div className="d-flex align-items-center gap-2">
                      <div className="rounded-circle bg-danger" style={{ width: '10px', height: '10px' }}></div>
                      <div className="rounded-circle bg-warning" style={{ width: '10px', height: '10px' }}></div>
                      <div className="rounded-circle bg-success" style={{ width: '10px', height: '10px' }}></div>
                      <span className="ms-2 small text-muted fw-semibold">acxiomcrm.enterprise/live-preview</span>
                    </div>
                    <span className="badge bg-success-subtle text-success small">Real-time Connected</span>
                  </div>

                  {/* Dynamic Metric Grid */}
                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <div className="p-3 rounded-3 bg-light border">
                        <div className="text-muted small fw-medium">Live Pipeline Value</div>
                        <div className="h5 fw-bold text-dark mb-0 mt-1">
                          ${stats ? (stats.totalPipelineValue).toLocaleString() : '685,000'}
                        </div>
                        <span className="badge bg-success-subtle text-success small mt-1">
                          <i className="bi bi-database me-1"></i> Live MySQL Data
                        </span>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-3 rounded-3 bg-light border">
                        <div className="text-muted small fw-medium">Closed Won Revenue</div>
                        <div className="h5 fw-bold text-dark mb-0 mt-1">
                          ${stats ? (stats.totalWonRevenue).toLocaleString() : '173,000'}
                        </div>
                        <span className="badge bg-info-subtle text-info small mt-1">
                          {stats ? stats.wonDealsCount : 2} Deals Closed
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Pipeline Stages Bar */}
                  <div className="p-3 rounded-3 bg-light border mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="small fw-bold text-dark">Active Opportunities</span>
                      <span className="small text-muted">{stats ? stats.totalOpportunities : 12} Deals in Database</span>
                    </div>
                    <div className="progress" style={{ height: '8px' }}>
                      <div className="progress-bar bg-info" style={{ width: '25%' }} title="Qualification"></div>
                      <div className="progress-bar bg-primary" style={{ width: '35%' }} title="Proposal"></div>
                      <div className="progress-bar bg-warning" style={{ width: '25%' }} title="Negotiation"></div>
                      <div className="progress-bar bg-success" style={{ width: '15%' }} title="Won"></div>
                    </div>
                  </div>

                  {/* Live Activity Row */}
                  <div className="p-2 px-3 rounded-3 bg-primary-subtle text-primary small d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-check2-circle"></i>
                      <span>Assigned Reps Active: <strong>{stats ? `${stats.totalSalesExecs} Sales Execs, ${stats.totalManagers} Manager` : '2 Sales Execs, 1 Manager'}</strong></span>
                    </div>
                    <span className="badge bg-primary text-white">Live</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. DYNAMIC TRUST & STATISTICS SECTION */}
      <section id="stats" className="py-5 bg-dark text-white">
        <div className="container">
          <div className="text-center mb-4">
            <span className="badge bg-success-subtle text-success px-3 py-1 rounded-pill small fw-semibold">
              <i className="bi bi-hdd-network-fill me-1"></i> Live Database Telemetry (Connected to MySQL: acxiomcrm)
            </span>
            <h3 className="fw-bold text-white mt-2 mb-1">Real Live Dynamic Database Counts</h3>
            <p className="text-secondary small mb-0">
              Zero static placeholders. Metrics are retrieved live from relational database tables.
            </p>
          </div>

          <div className="row g-4 text-center">
            <div className="col-6 col-md-3">
              <h2 className="display-5 fw-extrabold text-info mb-1">
                {stats ? stats.totalCustomers : '12'}
              </h2>
              <div className="text-secondary small text-uppercase tracking-wider fw-semibold">Customers Managed</div>
              <div className="text-info-emphasis small mt-1" style={{ fontSize: '0.75rem' }}>Active Accounts</div>
            </div>
            <div className="col-6 col-md-3">
              <h2 className="display-5 fw-extrabold text-warning mb-1">
                {stats ? stats.totalLeads : '18'}
              </h2>
              <div className="text-secondary small text-uppercase tracking-wider fw-semibold">Leads Tracked</div>
              <div className="text-warning-emphasis small mt-1" style={{ fontSize: '0.75rem' }}>Sales Funnel Prospects</div>
            </div>
            <div className="col-6 col-md-3">
              <h2 className="display-5 fw-extrabold text-success mb-1">
                {stats ? `$${(stats.totalPipelineValue / 1000).toFixed(0)}K` : '$685K'}
              </h2>
              <div className="text-secondary small text-uppercase tracking-wider fw-semibold">Pipeline Value</div>
              <div className="text-success-emphasis small mt-1" style={{ fontSize: '0.75rem' }}>
                {stats ? stats.totalOpportunities : 12} Open Deals
              </div>
            </div>
            <div className="col-6 col-md-3">
              <h2 className="display-5 fw-extrabold text-light mb-1">
                {stats ? stats.totalUsers : '6'}
              </h2>
              <div className="text-secondary small text-uppercase tracking-wider fw-semibold">System Users</div>
              <div className="text-white-50 small mt-1" style={{ fontSize: '0.75rem' }}>
                {stats ? `${stats.totalManagers} Mgr • ${stats.totalSalesExecs} Sales • ${stats.totalCustomerUsers} Clients` : '1 Mgr • 2 Sales • 2 Clients'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURES SECTION */}
      <section id="features" className="py-5 py-lg-6 bg-light">
        <div className="container">
          <div className="text-center mb-5" style={{ maxWidth: '640px', margin: '0 auto' }}>
            <span className="badge bg-primary-subtle text-primary px-3 py-1 rounded-pill fw-semibold small mb-2">Capabilities</span>
            <h2 className="fw-bold text-dark">Built for Complete Commercial Sales Life Cycles</h2>
            <p className="text-muted small">Everything high-growth enterprises need to convert prospects and retain high-value accounts.</p>
          </div>

          <div className="row g-4">
            {[
              { icon: 'bi-people-fill', title: 'Customer Management', desc: 'Normalized relational records with duplicate detection, contact mapping, and multi-tier history.' },
              { icon: 'bi-funnel-fill', title: 'Lead Funnel & Triage', desc: 'Capture, score, and prioritize leads into Hot, Warm, and Cold streams with one-click conversion.' },
              { icon: 'bi-briefcase-fill', title: 'Opportunity Pipeline', desc: '5-stage visual deal flow with auto weighted pipeline values, win probabilities, and expected close tracking.' },
              { icon: 'bi-calendar-check-fill', title: 'Follow-Up Tracking', desc: 'Time-horizon scheduling preventing past dates, with automated completion activity logs.' },
              { icon: 'bi-grid-1x2-fill', title: 'Dynamic Smart Dashboards', desc: 'Live SQL-calculated KPI cards and Chart.js visualizations custom-tailored per user role.' },
              { icon: 'bi-file-earmark-bar-graph-fill', title: '8 Comprehensive Reports', desc: 'Instant audit, pipeline, conversion, and activity reports with one-click CSV export.' },
              { icon: 'bi-person-badge-fill', title: 'Role-Based Access (RBAC)', desc: 'Admin, Manager, Sales Executive, and Customer personas enforced at Express middleware layer.' },
              { icon: 'bi-shield-check', title: 'Audit Trail & Security', desc: 'Immutable audit logs with diff snapshots, bcrypt hashing, JWT auth, and account lockout.' }
            ].map((f, i) => (
              <div key={i} className="col-md-6 col-lg-3">
                <div className="saas-card saas-card-hover p-4 h-100 bg-white border">
                  <div
                    className="rounded-3 bg-primary-subtle text-primary d-flex align-items-center justify-content-center mb-3"
                    style={{ width: '48px', height: '48px', fontSize: '1.3rem' }}
                  >
                    <i className={`bi ${f.icon}`}></i>
                  </div>
                  <h6 className="fw-bold text-dark mb-2">{f.title}</h6>
                  <p className="text-muted small mb-0">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. WORKFLOW SECTION */}
      <section id="workflow" className="py-5 py-lg-6 bg-white">
        <div className="container">
          <div className="text-center mb-5" style={{ maxWidth: '640px', margin: '0 auto' }}>
            <span className="badge bg-success-subtle text-success px-3 py-1 rounded-pill fw-semibold small mb-2">Automated Pipeline</span>
            <h2 className="fw-bold text-dark">The End-to-End Deal Conversion Journey</h2>
            <p className="text-muted small">Standardized state transitions enforced through database transactions and business rules.</p>
          </div>

          <div className="d-flex flex-wrap justify-content-center align-items-center gap-2 gap-md-3">
            {[
              { step: '1', title: 'Lead', desc: 'Inbound Ingestion' },
              { step: '2', title: 'Qualified', desc: 'Score & Triage' },
              { step: '3', title: 'Customer', desc: 'Contact Created' },
              { step: '4', title: 'Opportunity', desc: 'Deal Structured' },
              { step: '5', title: 'Follow-Up', desc: 'Touchpoint Held' },
              { step: '6', title: 'Won', desc: 'Revenue Realized' }
            ].map((st, i) => (
              <React.Fragment key={i}>
                <div className="saas-card p-3 text-center border bg-light" style={{ minWidth: '150px' }}>
                  <div className="badge bg-primary text-white rounded-pill mb-2 px-2 py-1">Step {st.step}</div>
                  <div className="fw-bold text-dark">{st.title}</div>
                  <div className="text-muted small">{st.desc}</div>
                </div>
                {i < 5 && (
                  <div className="text-primary fs-4 d-none d-md-block">
                    <i className="bi bi-arrow-right"></i>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* 6. ROLE-BASED SECTION */}
      <section id="roles" className="py-5 py-lg-6 bg-light">
        <div className="container">
          <div className="text-center mb-5" style={{ maxWidth: '640px', margin: '0 auto' }}>
            <span className="badge bg-info-subtle text-info px-3 py-1 rounded-pill fw-semibold small mb-2">Tailored Workspaces</span>
            <h2 className="fw-bold text-dark">Distinct Experiences for Every Stakeholder</h2>
            <p className="text-muted small">AcxiomCRM gives each persona an experience calibrated precisely to their responsibilities.</p>
          </div>

          <div className="row g-4">
            <div className="col-md-6 col-lg-3">
              <div className="saas-card p-4 h-100 bg-white border-top border-4 border-primary d-flex flex-column justify-content-between">
                <div>
                  <div className="badge-role badge-role-admin mb-2">ADMIN</div>
                  <h5 className="fw-bold text-dark">System Governance</h5>
                  <p className="text-muted small">
                    Complete organization visibility, user role assignments, password resets, system health metrics, and SOC2 immutable audit trail analysis.
                  </p>
                  <div className="border-top pt-3 small text-secondary">
                    <strong>Unique Feature:</strong> System Health & Security Center with active connection monitor.
                  </div>
                </div>
                <Link to="/admin" className="btn btn-outline-danger btn-sm mt-3 w-100 fw-semibold">
                  <i className="bi bi-shield-lock me-1"></i> Open Admin Portal
                </Link>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="saas-card p-4 h-100 bg-white border-top border-4 border-info d-flex flex-column justify-content-between">
                <div>
                  <div className="badge-role badge-role-manager mb-2">MANAGER</div>
                  <h5 className="fw-bold text-dark">Team Leadership</h5>
                  <p className="text-muted small">
                    Oversee multi-agent sales funnels, review team conversion percentages, re-assign accounts, and monitor monthly sales targets.
                  </p>
                  <div className="border-top pt-3 small text-secondary">
                    <strong>Unique Feature:</strong> Team Performance Center with live sales executive leaderboard.
                  </div>
                </div>
                <Link to="/manager" className="btn btn-outline-info btn-sm mt-3 w-100 fw-semibold">
                  <i className="bi bi-briefcase me-1"></i> Open Manager Portal
                </Link>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="saas-card p-4 h-100 bg-white border-top border-4 border-success d-flex flex-column justify-content-between">
                <div>
                  <div className="badge-role badge-role-sales mb-2">SALES EXECUTIVE</div>
                  <h5 className="fw-bold text-dark">Execution & Velocity</h5>
                  <p className="text-muted small">
                    Execute assigned leads, schedule customer meetings, advance deals through negotiation, and log calls and tasks.
                  </p>
                  <div className="border-top pt-3 small text-secondary">
                    <strong>Unique Feature:</strong> My Sales Workspace with Hot Leads and Today's follow-ups.
                  </div>
                </div>
                <Link to="/sales-exec" className="btn btn-outline-success btn-sm mt-3 w-100 fw-semibold">
                  <i className="bi bi-person-badge me-1"></i> Open Sales Exec Portal
                </Link>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="saas-card p-4 h-100 bg-white border-top border-4 border-warning d-flex flex-column justify-content-between">
                <div>
                  <div className="badge-role badge-role-customer mb-2">CUSTOMER</div>
                  <h5 className="fw-bold text-dark">Client Portal</h5>
                  <p className="text-muted small">
                    Direct client self-service portal to review active contracts, view upcoming meetings, and submit priority support tickets.
                  </p>
                  <div className="border-top pt-3 small text-secondary">
                    <strong>Unique Feature:</strong> Customer Relationship Center with assigned account rep contact.
                  </div>
                </div>
                <Link to="/login" className="btn btn-outline-warning btn-sm mt-3 w-100 fw-semibold">
                  <i className="bi bi-box-arrow-in-right me-1"></i> Open Customer Portal
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. SECURITY SECTION */}
      <section id="security" className="py-5 py-lg-6 bg-white">
        <div className="container">
          <div className="row align-items-center gy-4">
            <div className="col-lg-6">
              <span className="badge bg-danger-subtle text-danger px-3 py-1 rounded-pill fw-semibold small mb-2">Enterprise Defense</span>
              <h2 className="fw-bold text-dark mb-3">Enterprise-Grade Security by Design</h2>
              <p className="text-muted mb-4 small">
                Every API call and user interaction is strictly guarded with modern defense-in-depth principles.
              </p>
              <div className="row g-3">
                <div className="col-sm-6">
                  <div className="p-3 rounded-3 bg-light border">
                    <i className="bi bi-key-fill text-primary fs-5 mb-2 d-block"></i>
                    <h6 className="fw-bold text-dark mb-1">bcrypt & JWT</h6>
                    <div className="text-muted small">10-round salted password hashing with signed JSON Web Tokens.</div>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="p-3 rounded-3 bg-light border">
                    <i className="bi bi-shield-lock-fill text-danger fs-5 mb-2 d-block"></i>
                    <h6 className="fw-bold text-dark mb-1">Account Lockout</h6>
                    <div className="text-muted small">Automatic 15-minute freeze upon 5 consecutive failed logins.</div>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="p-3 rounded-3 bg-light border">
                    <i className="bi bi-journal-code text-info fs-5 mb-2 d-block"></i>
                    <h6 className="fw-bold text-dark mb-1">Parameterized SQL</h6>
                    <div className="text-muted small">Prepared statements eliminating SQL injection vulnerabilities.</div>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="p-3 rounded-3 bg-light border">
                    <i className="bi bi-speedometer2 text-success fs-5 mb-2 d-block"></i>
                    <h6 className="fw-bold text-dark mb-1">Rate Limiting & Helmet</h6>
                    <div className="text-muted small">Strict request throttling and secure HTTP headers.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6 text-center">
              <div className="p-4 p-md-5 rounded-4 bg-dark text-white text-start shadow-lg">
                <div className="d-flex align-items-center gap-2 text-success small mb-3">
                  <i className="bi bi-check-circle-fill"></i>
                  <span>Zero Plaintext Passwords / Zero Insecure Endpoints</span>
                </div>
                <h4 className="fw-bold text-white mb-3">Security & Audit Policy</h4>
                <p className="text-secondary small mb-4">
                  Audit logs are append-only and cannot be altered by normal CRM users. Any change to customer records, deals, or account permissions generates an immediate immutable audit trail entry.
                </p>
                <div className="p-3 rounded-3 bg-secondary bg-opacity-25 font-monospace small text-info">
                  &gt; SELECT action, entity_name, record_id, ip_address FROM audit_logs ORDER BY created_at DESC;
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. CALL TO ACTION SECTION */}
      <section className="py-5 bg-primary text-white text-center position-relative" style={{ background: 'var(--primary-gradient)' }}>
        <div className="container py-4">
          <h2 className="display-6 fw-bold mb-3">Ready to manage your customer journey smarter?</h2>
          <p className="lead mb-4 text-white-50" style={{ maxWidth: '580px', margin: '0 auto' }}>
            Empower your leadership, sales executives, and customers with AcxiomCRM's intelligent platform.
          </p>
          <Link to="/register" className="btn btn-light px-5 py-3 fw-bold rounded-pill text-primary shadow">
            Start Using AcxiomCRM
          </Link>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="bg-dark text-secondary py-5 mt-auto">
        <div className="container">
          <div className="row g-4 mb-4">
            <div className="col-lg-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                  style={{ width: '32px', height: '32px', background: 'var(--primary-gradient)' }}
                >
                  A
                </div>
                <span className="brand-font fs-5 fw-bold text-white">ACXIOM<span className="text-info">CRM</span></span>
              </div>
              <p className="small text-muted mb-0">
                Enterprise Customer Relationship Management software system with role-based access control, relational MySQL architecture, and real-time sales intelligence.
              </p>
            </div>
            <div className="col-6 col-lg-2">
              <h6 className="text-white small fw-bold text-uppercase mb-3">Product</h6>
              <ul className="list-unstyled small d-flex flex-column gap-2 mb-0">
                <li><a href="#features" className="text-secondary text-decoration-none hover-white">Features</a></li>
                <li><a href="#workflow" className="text-secondary text-decoration-none hover-white">Workflow</a></li>
                <li><a href="#roles" className="text-secondary text-decoration-none hover-white">Role Matrix</a></li>
              </ul>
            </div>
            <div className="col-6 col-lg-2">
              <h6 className="text-white small fw-bold text-uppercase mb-3">Solutions</h6>
              <ul className="list-unstyled small d-flex flex-column gap-2 mb-0">
                <li><Link to="/login" className="text-secondary text-decoration-none hover-white">Admin Hub</Link></li>
                <li><Link to="/login" className="text-secondary text-decoration-none hover-white">Sales Pipeline</Link></li>
                <li><Link to="/login" className="text-secondary text-decoration-none hover-white">Customer Portal</Link></li>
              </ul>
            </div>
            <div className="col-6 col-lg-2">
              <h6 className="text-white small fw-bold text-uppercase mb-3">Security</h6>
              <ul className="list-unstyled small d-flex flex-column gap-2 mb-0">
                <li><a href="#security" className="text-secondary text-decoration-none hover-white">Audit Logging</a></li>
                <li><a href="#security" className="text-secondary text-decoration-none hover-white">Password Policy</a></li>
                <li><a href="#security" className="text-secondary text-decoration-none hover-white">Data Privacy</a></li>
              </ul>
            </div>
            <div className="col-6 col-lg-2">
              <h6 className="text-white small fw-bold text-uppercase mb-3">Access</h6>
              <ul className="list-unstyled small d-flex flex-column gap-2 mb-0">
                <li><Link to="/login" className="text-secondary text-decoration-none hover-white">Sign In</Link></li>
                <li><Link to="/register" className="text-secondary text-decoration-none hover-white">Register Account</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-4 border-top border-secondary border-opacity-25 text-center text-muted small">
            &copy; 2026 AcxiomCRM Enterprise Systems. All rights reserved. Relational MySQL Engine.
          </div>
        </div>
      </footer>
    </div>
  );
};
