import React, { useState, useEffect, useCallback } from 'react';
import { systemService } from '../../services/systemService';
import { SearchBar, Pagination } from '../../components/common/DataControls';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner, EmptyState, ErrorState } from '../../components/common/FeedbackStates';
import { formatDate } from '../../utils/formatters';

export const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  // Diff inspection modal
  const [inspectLog, setInspectLog] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await systemService.getAuditLogs({
        search,
        action: actionFilter,
        entity: entityFilter,
        page: pagination.page,
        limit: pagination.limit
      });
      if (res.success) {
        setLogs(res.data.auditLogs);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  }, [search, actionFilter, entityFilter, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="fade-in pb-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-1">Security Audit & Event Trail</h4>
          <p className="text-muted small mb-0">Immutable, append-only log of all authentication, mutation, and role authorization events.</p>
        </div>
        <span className="badge bg-secondary p-2 px-3 rounded-pill fw-semibold small">
          <i className="bi bi-shield-lock-fill me-1"></i> SOC2 Compliant Ledger
        </span>
      </div>

      {/* Filter Bar */}
      <div className="saas-card p-3 mb-4 bg-white d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="col-md-5">
          <SearchBar
            value={search}
            onChange={(val) => { setSearch(val); setPagination(p => ({ ...p, page: 1 })); }}
            onClear={() => setSearch('')}
            placeholder="Search action, actor, entity, IP..."
          />
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <select
            className="form-select form-select-sm"
            style={{ width: '160px' }}
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
          >
            <option value="">All Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="FAILED_LOGIN">FAILED_LOGIN</option>
            <option value="ACCOUNT_LOCKOUT">ACCOUNT_LOCKOUT</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="ROLE_CHANGE">ROLE_CHANGE</option>
            <option value="STATUS_CHANGE">STATUS_CHANGE</option>
          </select>

          <select
            className="form-select form-select-sm"
            style={{ width: '150px' }}
            value={entityFilter}
            onChange={(e) => { setEntityFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
          >
            <option value="">All Entities</option>
            <option value="USER">USER</option>
            <option value="CUSTOMER">CUSTOMER</option>
            <option value="LEAD">LEAD</option>
            <option value="OPPORTUNITY">OPPORTUNITY</option>
            <option value="FOLLOWUP">FOLLOWUP</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      {loading ? (
        <LoadingSpinner message="Scanning audit event registry..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchLogs} />
      ) : logs.length === 0 ? (
        <EmptyState
          icon="bi-shield-check"
          title="No audit events found"
          description="No event records matched the specified criteria."
        />
      ) : (
        <div className="saas-card bg-white p-0 overflow-hidden shadow-sm">
          <div className="table-responsive">
            <table className="table saas-table mb-0">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Record ID</th>
                  <th>Actor / User</th>
                  <th>IP Address</th>
                  <th>User Agent</th>
                  <th className="text-end">State Snapshot</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.audit_log_id}>
                    <td>
                      <span className="small text-muted">{formatDate(log.created_at, true)}</span>
                    </td>
                    <td>
                      <span className={`badge ${
                        log.action.includes('FAIL') || log.action.includes('LOCK') ? 'bg-danger text-white' :
                        log.action.includes('DELETE') ? 'bg-warning text-dark' :
                        log.action.includes('LOGIN') ? 'bg-info-subtle text-info' :
                        'bg-primary-subtle text-primary'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td><span className="fw-semibold text-dark">{log.entity_name}</span></td>
                    <td className="font-monospace small">{log.record_id || '—'}</td>
                    <td>
                      <div className="fw-semibold text-dark small">{log.first_name ? `${log.first_name} ${log.last_name}` : 'System Agent'}</div>
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>{log.user_email || '—'}</div>
                    </td>
                    <td><span className="font-monospace small text-muted">{log.ip_address}</span></td>
                    <td className="small text-muted text-truncate" style={{ maxWidth: '140px' }}>
                      {log.user_agent}
                    </td>
                    <td className="text-end">
                      {(log.old_value || log.new_value) && (
                        <button
                          onClick={() => setInspectLog(log)}
                          className="btn btn-sm btn-outline-primary py-0 px-2 small"
                        >
                          <i className="bi bi-file-diff me-1"></i> Inspect Diff
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-light border-top">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
            />
          </div>
        </div>
      )}

      {/* Diff Inspection Modal */}
      <Modal
        isOpen={!!inspectLog}
        onClose={() => setInspectLog(null)}
        title={`Audit Record #${inspectLog?.audit_log_id} State Diff`}
        size="lg"
      >
        <div className="mb-3 small text-secondary">
          Action: <strong>{inspectLog?.action}</strong> on <strong>{inspectLog?.entity_name}</strong> (Record #{inspectLog?.record_id}) by <strong>{inspectLog?.user_email || 'System'}</strong>
        </div>

        <div className="row g-3">
          <div className="col-md-6">
            <h6 className="fw-bold text-dark small text-uppercase">Previous State (old_value)</h6>
            <div className="p-3 bg-light border rounded-3 font-monospace small" style={{ maxHeight: '280px', overflowY: 'auto' }}>
              <pre className="mb-0 text-secondary">
                {inspectLog?.old_value ? JSON.stringify(typeof inspectLog.old_value === 'string' ? JSON.parse(inspectLog.old_value) : inspectLog.old_value, null, 2) : 'null (Created or Initial Action)'}
              </pre>
            </div>
          </div>
          <div className="col-md-6">
            <h6 className="fw-bold text-dark small text-uppercase">New State (new_value)</h6>
            <div className="p-3 bg-light border rounded-3 font-monospace small" style={{ maxHeight: '280px', overflowY: 'auto' }}>
              <pre className="mb-0 text-success">
                {inspectLog?.new_value ? JSON.stringify(typeof inspectLog.new_value === 'string' ? JSON.parse(inspectLog.new_value) : inspectLog.new_value, null, 2) : 'null (Deleted)'}
              </pre>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
