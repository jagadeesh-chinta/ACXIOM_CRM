import React, { useState, useEffect } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import '../utils/chartConfig';
import { dashboardService } from '../services/dashboardService';
import { DashboardCard, ChartCard } from '../components/common/DashboardCard';
import { LoadingSpinner, ErrorState } from '../components/common/FeedbackStates';
import { formatCurrency } from '../utils/formatters';

export const ManagerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardService.getManagerDashboard();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load manager metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner message="Aggregating team performance metrics..." />;
  if (error) return <ErrorState message={error} onRetry={fetchStats} />;
  if (!data) return null;

  const { kpis, teamPerformanceCenter, charts } = data;

  const oppChartData = {
    labels: charts.oppStage.map((s) => s.stage),
    datasets: [
      {
        label: 'Stage Total ($)',
        data: charts.oppStage.map((s) => s.total_amount),
        backgroundColor: '#0284c7',
        borderRadius: 8
      }
    ]
  };

  const salesChartData = {
    labels: charts.monthlySales.map((s) => s.month),
    datasets: [
      {
        label: 'Team Closed Revenue ($)',
        data: charts.monthlySales.map((s) => s.total_sales),
        borderColor: '#0284c7',
        backgroundColor: 'rgba(2, 132, 199, 0.12)',
        tension: 0.35,
        fill: true,
        pointRadius: 5
      }
    ]
  };

  return (
    <div className="fade-in pb-4">
      {/* Top Banner */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-1">Sales Management & Team Center</h4>
          <p className="text-muted small mb-0">Pipeline distribution, rep performance leaderboards, and sales velocity.</p>
        </div>
        <button onClick={fetchStats} className="btn btn-sm btn-outline-secondary">
          <i className="bi bi-arrow-clockwise me-1"></i> Refresh
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-3">
          <DashboardCard
            title="Team Pipeline"
            value={formatCurrency(kpis.teamPipelineValue)}
            icon="bi-currency-dollar"
            iconBg="bg-primary-subtle"
            iconColor="text-primary"
            subtext={`${kpis.openOpportunities} active deals`}
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <DashboardCard
            title="Team Conversion"
            value={kpis.teamConversionRate}
            icon="bi-percent"
            iconBg="bg-success-subtle"
            iconColor="text-success"
            subtext="Lead to Customer conversion"
            trend="+3.2%"
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <DashboardCard
            title="Monthly Sales"
            value={formatCurrency(kpis.monthlySales)}
            icon="bi-trophy"
            iconBg="bg-warning-subtle"
            iconColor="text-warning"
            subtext={`${kpis.wonOpportunities} closed deals`}
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <DashboardCard
            title="Follow-up Rate"
            value={teamPerformanceCenter.followUpCompletionRate}
            icon="bi-check2-all"
            iconBg="bg-info-subtle"
            iconColor="text-info"
            subtext={`${kpis.pendingFollowUps} pending items`}
          />
        </div>
      </div>

      {/* UNIQUE MANAGER FEATURE: TEAM PERFORMANCE CENTER */}
      <div className="saas-card p-4 mb-4 border-info-subtle bg-white">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <div className="rounded-circle bg-info-subtle text-info p-2 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
              <i className="bi bi-award-fill fs-5"></i>
            </div>
            <div>
              <h5 className="fw-bold text-dark mb-0">Team Performance Center</h5>
              <span className="text-muted small">Sales executive leaderboard and deal completion velocity</span>
            </div>
          </div>
          <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2">
            Active Representatives: {teamPerformanceCenter.leaderboard.length}
          </span>
        </div>

        <div className="table-responsive">
          <table className="table saas-table">
            <thead>
              <tr>
                <th>Representative</th>
                <th>Department</th>
                <th>Assigned Leads</th>
                <th>Open Pipeline</th>
                <th>Closed Won Revenue</th>
                <th>Deals Won</th>
                <th>Follow-up Completion</th>
              </tr>
            </thead>
            <tbody>
              {teamPerformanceCenter.leaderboard.map((rep, idx) => {
                const completionPct = rep.total_followups > 0
                  ? Math.round((rep.completed_followups / rep.total_followups) * 100)
                  : 100;
                return (
                  <tr key={rep.user_id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-light text-dark border rounded-circle" style={{ width: '24px', height: '24px', lineHeight: '18px' }}>
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="fw-bold text-dark">{rep.first_name} {rep.last_name}</div>
                          <div className="text-muted small">{rep.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge bg-light text-dark">{rep.department}</span></td>
                    <td className="fw-semibold">{rep.assigned_leads} leads</td>
                    <td className="fw-bold text-primary">{formatCurrency(rep.open_pipeline)}</td>
                    <td className="fw-bold text-success">{formatCurrency(rep.closed_revenue)}</td>
                    <td>
                      <span className="badge bg-success-subtle text-success px-2 py-1">
                        {rep.won_deals_count} won
                      </span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="progress flex-grow-1" style={{ height: '6px', width: '70px' }}>
                          <div
                            className={`progress-bar ${completionPct > 80 ? 'bg-success' : 'bg-warning'}`}
                            style={{ width: `${completionPct}%` }}
                          ></div>
                        </div>
                        <span className="small text-muted">{completionPct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Row */}
      <div className="row g-3">
        <div className="col-lg-6">
          <ChartCard title="Team Pipeline by Stage" subtitle="Capital allocation across sales stages">
            <div style={{ height: '270px' }}>
              <Bar
                data={oppChartData}
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { y: { ticks: { callback: (v) => `$${v / 1000}k` } } }
                }}
              />
            </div>
          </ChartCard>
        </div>

        <div className="col-lg-6">
          <ChartCard title="Team Sales Revenue Trend" subtitle="Monthly team quota realization">
            <div style={{ height: '270px' }}>
              <Line
                data={salesChartData}
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { y: { ticks: { callback: (v) => `$${v / 1000}k` } } }
                }}
              />
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
};
