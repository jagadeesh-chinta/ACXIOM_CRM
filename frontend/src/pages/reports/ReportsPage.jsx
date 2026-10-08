import React, { useState, useEffect } from 'react';
import { reportService } from '../../services/reportService';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner, ErrorState } from '../../components/common/FeedbackStates';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const ReportsPage = () => {
  const { role } = useAuth();
  const [activeReport, setActiveReport] = useState('customers');
  const [range, setRange] = useState('');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      let res;
      switch (activeReport) {
        case 'customers':
          res = await reportService.getCustomerReport({ range });
          break;
        case 'leads':
          res = await reportService.getLeadReport({ range });
          break;
        case 'followups':
          res = await reportService.getFollowupReport({ range });
          break;
        case 'opportunities':
          res = await reportService.getOpportunityReport({ range });
          break;
        case 'pipeline':
          res = await reportService.getPipelineReport();
          break;
        case 'conversion':
          res = await reportService.getConversionReport();
          break;
        case 'activity':
          res = await reportService.getActivityReport();
          break;
        case 'audit':
          res = await reportService.getAuditReport();
          break;
        default:
          res = await reportService.getCustomerReport({ range });
      }

      if (res.success) {
        setReportData(res.data.report || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeReport, range]);

  const handleExportCSV = () => {
    const url = reportService.exportCSVUrl(activeReport, { range });
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const tabs = [
    { id: 'customers', label: '1. Customer Report' },
    { id: 'leads', label: '2. Lead Report' },
    { id: 'followups', label: '3. Follow-Up Report' },
    { id: 'opportunities', label: '4. Opportunity Report' },
    { id: 'pipeline', label: '5. Pipeline Analysis' },
    { id: 'conversion', label: '6. Conversion Velocity' },
    { id: 'activity', label: '7. Rep Engagement' }
  ];

  if (role === 'ADMIN' || role === 'MANAGER') {
    tabs.push({ id: 'audit', label: '8. Security Audit Trail' });
  }

  return (
    <div className="fade-in pb-4">
      {/* Header with Export Controls */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-1">Executive Reports & Data Exports</h4>
          <p className="text-muted small mb-0">Role-governed intelligence reports with CSV export and print view.</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button onClick={handlePrint} className="btn btn-sm btn-outline-secondary">
            <i className="bi bi-printer me-1"></i> Print Report
          </button>
          <button onClick={handleExportCSV} className="btn btn-sm btn-success">
            <i className="bi bi-file-earmark-spreadsheet me-1"></i> Export to CSV
          </button>
        </div>
      </div>

      {/* Report Switcher & Range Filter */}
      <div className="saas-card p-3 mb-4 bg-white">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          {/* Horizontal Tabs */}
          <div className="d-flex flex-wrap gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveReport(tab.id)}
                className={`btn btn-sm ${activeReport === tab.id ? 'btn-primary' : 'btn-light border'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Date range filter */}
          {['customers', 'leads', 'followups', 'opportunities'].includes(activeReport) && (
            <div className="d-flex align-items-center gap-2">
              <span className="small text-muted fw-bold">Period:</span>
              <select
                className="form-select form-select-sm"
                style={{ width: '130px' }}
                value={range}
                onChange={(e) => setRange(e.target.value)}
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Report Content Table */}
      {loading ? (
        <LoadingSpinner message="Generating consolidated report dataset..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchReport} />
      ) : reportData.length === 0 ? (
        <div className="saas-card text-center p-5 bg-white">
          <i className="bi bi-inbox fs-1 text-muted mb-2"></i>
          <h5 className="fw-bold text-dark mt-2">No Report Data Available</h5>
          <p className="text-muted small">No transactions matched the selected date filter range.</p>
        </div>
      ) : (
        <div className="saas-card bg-white p-0 overflow-hidden shadow-sm">
          <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center">
            <span className="fw-bold small text-dark text-uppercase tracking-wider">
              Generated Records ({reportData.length} entries)
            </span>
            <span className="badge bg-secondary">Live Database Query</span>
          </div>

          <div className="table-responsive">
            {activeReport === 'customers' && (
              <table className="table saas-table mb-0">
                <thead>
                  <tr>
                    <th>Customer Code</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Company</th>
                    <th>Total Deals</th>
                    <th>Deal Value</th>
                    <th>Assigned Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((r, i) => (
                    <tr key={i}>
                      <td className="font-monospace fw-semibold">{r.customer_code}</td>
                      <td className="fw-bold text-dark">{r.customer_name}</td>
                      <td>{r.email}</td>
                      <td>{r.phone}</td>
                      <td>{r.company_name || '—'}</td>
                      <td><span className="badge bg-light text-dark">{r.total_deals}</span></td>
                      <td className="fw-bold text-success">{formatCurrency(r.total_deal_value)}</td>
                      <td>{r.assigned_agent || 'Unassigned'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeReport === 'leads' && (
              <table className="table saas-table mb-0">
                <thead>
                  <tr>
                    <th>Lead Code</th>
                    <th>Lead Name</th>
                    <th>Email</th>
                    <th>Company</th>
                    <th>Source</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Expected Value</th>
                    <th>Assigned Rep</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((r, i) => (
                    <tr key={i}>
                      <td className="font-monospace fw-semibold">{r.lead_code}</td>
                      <td className="fw-bold text-dark">{r.lead_name}</td>
                      <td>{r.email}</td>
                      <td>{r.company_name || '—'}</td>
                      <td>{r.source}</td>
                      <td><span className="badge bg-light text-dark">{r.status}</span></td>
                      <td><span className="badge bg-secondary">{r.priority}</span></td>
                      <td className="fw-bold text-primary">{formatCurrency(r.expected_value)}</td>
                      <td>{r.assigned_agent || 'Unassigned'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeReport === 'followups' && (
              <table className="table saas-table mb-0">
                <thead>
                  <tr>
                    <th>Scheduled Date</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Contact / Client</th>
                    <th>Company</th>
                    <th>Remarks</th>
                    <th>Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((r, i) => (
                    <tr key={i}>
                      <td className="fw-semibold text-dark">{formatDate(r.followup_date, true)}</td>
                      <td><span className="badge bg-info-subtle text-info">{r.followup_type}</span></td>
                      <td><span className="badge bg-light text-dark">{r.status}</span></td>
                      <td className="fw-bold text-dark">{r.contact_name}</td>
                      <td>{r.company || '—'}</td>
                      <td className="small text-secondary">{r.remarks || '—'}</td>
                      <td>{r.assigned_agent || 'Unassigned'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeReport === 'opportunities' && (
              <table className="table saas-table mb-0">
                <thead>
                  <tr>
                    <th>Opportunity Code</th>
                    <th>Deal Title</th>
                    <th>Customer Name</th>
                    <th>Amount</th>
                    <th>Stage</th>
                    <th>Win Prob</th>
                    <th>Weighted Value</th>
                    <th>Close Target</th>
                    <th>Rep</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((r, i) => (
                    <tr key={i}>
                      <td className="font-monospace fw-semibold">{r.opportunity_code}</td>
                      <td className="fw-bold text-dark">{r.opportunity_name}</td>
                      <td>{r.customer_name}</td>
                      <td className="fw-bold text-dark">{formatCurrency(r.amount)}</td>
                      <td><span className="badge bg-primary-subtle text-primary">{r.stage}</span></td>
                      <td>{r.probability}%</td>
                      <td className="fw-bold text-success">{formatCurrency(r.weighted_amount)}</td>
                      <td className="small text-muted">{formatDate(r.expected_close_date)}</td>
                      <td>{r.sales_rep || 'Unassigned'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeReport === 'pipeline' && (
              <table className="table saas-table mb-0">
                <thead>
                  <tr>
                    <th>Pipeline Phase</th>
                    <th>Deal Count</th>
                    <th>Cumulative Gross Value</th>
                    <th>Average Probability</th>
                    <th>Weighted Forecast</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((r, i) => (
                    <tr key={i}>
                      <td className="fw-bold text-dark">{r.stage}</td>
                      <td><span className="badge bg-light text-dark">{r.deal_count}</span></td>
                      <td className="fw-bold text-primary">{formatCurrency(r.total_value)}</td>
                      <td>{Math.round(r.avg_probability)}%</td>
                      <td className="fw-bold text-success">{formatCurrency(r.weighted_pipeline)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeReport === 'conversion' && (
              <table className="table saas-table mb-0">
                <thead>
                  <tr>
                    <th>Lead Source Channel</th>
                    <th>Total Leads Ingested</th>
                    <th>Converted to Deals</th>
                    <th>Lost Deals</th>
                    <th>Conversion Velocity</th>
                    <th>Total Converted Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((r, i) => (
                    <tr key={i}>
                      <td className="fw-bold text-dark">{r.source}</td>
                      <td>{r.total_leads}</td>
                      <td><span className="badge bg-success-subtle text-success">{r.converted_count}</span></td>
                      <td><span className="badge bg-danger-subtle text-danger">{r.lost_count}</span></td>
                      <td><span className="fw-bold text-info">{r.conversion_percentage}%</span></td>
                      <td className="fw-bold text-success">{formatCurrency(r.converted_value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeReport === 'activity' && (
              <table className="table saas-table mb-0">
                <thead>
                  <tr>
                    <th>Representative Name</th>
                    <th>Department</th>
                    <th>Role</th>
                    <th>Total Activities</th>
                    <th>Calls</th>
                    <th>Meetings</th>
                    <th>Emails</th>
                    <th>Tasks</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((r, i) => (
                    <tr key={i}>
                      <td className="fw-bold text-dark">{r.employee_name}</td>
                      <td>{r.department}</td>
                      <td><span className="badge bg-light text-dark">{r.role_name}</span></td>
                      <td className="fw-bold text-primary">{r.total_activities_logged}</td>
                      <td>{r.calls}</td>
                      <td>{r.meetings}</td>
                      <td>{r.emails}</td>
                      <td>{r.tasks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeReport === 'audit' && (
              <table className="table saas-table mb-0">
                <thead>
                  <tr>
                    <th>Audit ID</th>
                    <th>Action</th>
                    <th>Target Entity</th>
                    <th>Record ID</th>
                    <th>Actor Name</th>
                    <th>Actor Email</th>
                    <th>IP Address</th>
                    <th>Date & Time</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((r, i) => (
                    <tr key={i}>
                      <td className="font-monospace small">#{r.audit_log_id}</td>
                      <td><span className="badge bg-secondary">{r.action}</span></td>
                      <td className="fw-semibold">{r.entity_name}</td>
                      <td>{r.record_id || '—'}</td>
                      <td>{r.user_name || 'System'}</td>
                      <td className="small text-muted">{r.user_email || '—'}</td>
                      <td className="font-monospace small">{r.ip_address}</td>
                      <td className="small text-muted">{formatDate(r.created_at, true)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
