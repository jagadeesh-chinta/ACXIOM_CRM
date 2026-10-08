import React, { useState, useEffect } from 'react';
import { systemService } from '../../services/systemService';
import { useToast } from '../../context/ToastContext';
import { LoadingSpinner, ErrorState } from '../../components/common/FeedbackStates';
import { FormInput } from '../../components/forms/FormControls';

export const SystemHealthPage = () => {
  const { showToast } = useToast();
  const [health, setHealth] = useState(null);
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingKey, setSavingKey] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [hRes, sRes] = await Promise.all([
        systemService.getHealth(),
        systemService.getSettings()
      ]);
      if (hRes.success) setHealth(hRes.data);
      if (sRes.success) setSettings(sRes.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to retrieve system diagnostics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateSetting = async (key, val) => {
    setSavingKey(key);
    try {
      await systemService.updateSetting(key, val);
      showToast('success', 'Setting Saved', `Configuration ${key} updated.`);
    } catch (err) {
      showToast('error', 'Update Failed', err.response?.data?.message || err.message);
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) return <LoadingSpinner message="Checking server telemetry and database latency..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;
  if (!health) return null;

  return (
    <div className="fade-in pb-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-1">System Health & System Settings</h4>
          <p className="text-muted small mb-0">Live MySQL pool metrics, memory allocation telemetry, and enterprise parameters.</p>
        </div>
        <button onClick={fetchData} className="btn btn-sm btn-outline-secondary">
          <i className="bi bi-arrow-clockwise me-1"></i> Refresh Telemetry
        </button>
      </div>

      {/* Diagnostics Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="saas-card p-4 bg-white border-start border-4 border-success h-100">
            <span className="text-muted small fw-semibold text-uppercase">MySQL Database</span>
            <div className="h4 fw-bold text-dark mt-2 mb-1">{health.database.status}</div>
            <div className="small text-secondary">
              Driver: <strong>{health.database.driver}</strong> • Ping: <strong className="text-success">{health.database.latencyMs} ms</strong>
            </div>
            <div className="small text-muted mt-1">Pool Capacity: {health.database.poolLimit} connections</div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="saas-card p-4 bg-white border-start border-4 border-primary h-100">
            <span className="text-muted small fw-semibold text-uppercase">Node.js API Runtime</span>
            <div className="h4 fw-bold text-dark mt-2 mb-1">{health.server.nodeVersion}</div>
            <div className="small text-secondary">
              Heap Memory: <strong>{health.server.memoryUsageMB.heapUsed} MB / {health.server.memoryUsageMB.heapTotal} MB</strong>
            </div>
            <div className="small text-muted mt-1">Uptime: {Math.floor(health.server.uptimeSeconds / 60)} minutes</div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="saas-card p-4 bg-white border-start border-4 border-warning h-100">
            <span className="text-muted small fw-semibold text-uppercase">Security Defense Status</span>
            <div className="h4 fw-bold text-dark mt-2 mb-1">Active Protected</div>
            <div className="small text-secondary">
              Locked Accounts: <strong className="text-danger">{health.security.lockedAccounts}</strong> • Total Users: <strong>{health.security.totalUsers}</strong>
            </div>
            <div className="small text-muted mt-1">Brute-force lockout active</div>
          </div>
        </div>
      </div>

      {/* Settings Configuration Table */}
      <div className="saas-card p-4 bg-white">
        <h5 className="fw-bold text-dark mb-3">Enterprise System Parameters</h5>
        <div className="table-responsive">
          <table className="table saas-table">
            <thead>
              <tr>
                <th>Configuration Key</th>
                <th>Group</th>
                <th>Description</th>
                <th style={{ width: '250px' }}>Value</th>
                <th className="text-end">Save</th>
              </tr>
            </thead>
            <tbody>
              {settings.map((s, idx) => (
                <tr key={s.setting_id}>
                  <td className="font-monospace fw-semibold text-dark">{s.setting_key}</td>
                  <td><span className="badge bg-light text-dark">{s.setting_group}</span></td>
                  <td className="small text-secondary">{s.description}</td>
                  <td>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={s.setting_value}
                      onChange={(e) => {
                        const newVal = e.target.value;
                        setSettings((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, setting_value: newVal } : item))
                        );
                      }}
                    />
                  </td>
                  <td className="text-end">
                    <button
                      onClick={() => handleUpdateSetting(s.setting_key, s.setting_value)}
                      className="btn btn-sm btn-outline-primary"
                      disabled={savingKey === s.setting_key}
                    >
                      {savingKey === s.setting_key ? 'Saving...' : 'Update'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
