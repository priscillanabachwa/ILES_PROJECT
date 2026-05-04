import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthToken, getUser, isAuthenticated, logoutUser } from '../services/authService';
import './Student_dashboard.css';
import maklogo from '../assets/maklogo.png';

const API_BASE_URL = 'http://localhost:8000/api';

export default function Student_dashboard() {
  const navigate = useNavigate();
  const user = getUser();
  const token = getAuthToken();

  // State Management
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Data State
  const [placement, setPlacement] = useState(null);
  const [weeklyLogs, setWeeklyLogs] = useState([]);
  const [evaluations, setEvaluations] = useState([]);

  // Authentication Check
  useEffect(() => {
    if (!isAuthenticated() || user?.role !== 'student') {
      navigate('/login');
      return;
    }
  }, [navigate, user]);

  // Fetch Dashboard Data
  useEffect(() => {
    if (!token || !user) return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch student's active placement
        const placementRes = await fetch(
          `${API_BASE_URL}/placements/?search=${user.id}`,
          {
            headers: {
              'Authorization': `Token ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (placementRes.ok) {
          const placementData = await placementRes.json();
          if (Array.isArray(placementData)) {
            const activePlacement = placementData.find(p => p.status === 'ACTIVE') || placementData[0];
            setPlacement(activePlacement);

            if (activePlacement?.id) {
              // Fetch weekly logs for this placement
              const logsRes = await fetch(
                `${API_BASE_URL}/weekly-logs/?placement=${activePlacement.id}`,
                {
                  headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                  },
                }
              );

              if (logsRes.ok) {
                const logsData = await logsRes.json();
                setWeeklyLogs(Array.isArray(logsData) ? logsData : []);
              }

              // Fetch evaluations for this placement
              const evalsRes = await fetch(
                `${API_BASE_URL}/academic-evaluations/?placement=${activePlacement.id}`,
                {
                  headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                  },
                }
              );

              if (evalsRes.ok) {
                const evalsData = await evalsRes.json();
                setEvaluations(Array.isArray(evalsData) ? evalsData : []);
              }
            }
          }
        }
      } catch (err) {
        setError('Failed to load dashboard data. Please try again.');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token, user]);

  // Calculate Statistics
  const calculateStats = () => {
    const stats = {
      placementStatus: placement?.status || 'NO_PLACEMENT',
      logsSubmitted: weeklyLogs.filter(log => log.status !== 'draft').length,
      totalLogs: weeklyLogs.length,
      avgEvalScore: evaluations.length > 0 
        ? (evaluations.reduce((sum, item) => sum + (item.total_score || 0), 0) / evaluations.length).toFixed(2)
        : 'N/A',
    };
    return stats;
  };

  const stats = calculateStats();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* ==================== HEADER ====================*/}
      <header className="dashboard-header">
        <div className="header-left">
          <img src={maklogo} alt="ILES Logo" className="header-logo" />
          <h1>ILES Dashboard</h1>
        </div>
        <div className="header-right">
          <div className="user-info">
            <div className="user-details">
              <p className="user-name">{user?.first_name} {user?.last_name}</p>
              <p className="user-email">{user?.email}</p>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* ==================== TAB NAVIGATION ====================*/}
      <nav className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'placement' ? 'active' : ''}`}
          onClick={() => setActiveTab('placement')}
        >
          🏢 Placement
        </button>
        <button
          className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          📝 Weekly Logs
        </button>
        <button
          className={`tab-btn ${activeTab === 'evaluations' ? 'active' : ''}`}
          onClick={() => setActiveTab('evaluations')}
        >
          ⭐ Evaluations
        </button>
      </nav>

      {/* ==================== ERROR MESSAGE ====================*/}
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {/* ==================== OVERVIEW TAB ====================*/}
      {activeTab === 'overview' && (
        <section className="tab-content">
          <h2>Dashboard Overview</h2>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📍</div>
              <div className="stat-content">
                <p className="stat-label">Placement Status</p>
                <p className="stat-value">{stats.placementStatus}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div className="stat-content">
                <p className="stat-label">Weekly Logs Submitted</p>
                <p className="stat-value">{stats.logsSubmitted}/{stats.totalLogs}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-content">
                <p className="stat-label">Average Evaluation Score</p>
                <p className="stat-value">{stats.avgEvalScore}/100</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🎯</div>
              <div className="stat-content">
                <p className="stat-label">Total Evaluators</p>
                <p className="stat-value">{evaluations.length}</p>
              </div>
            </div>
          </div>

          {/* Next Deadline */}
          {weeklyLogs.length > 0 && (
            <div className="deadline-card">
              <h3>📅 Upcoming Deadlines</h3>
              {weeklyLogs
                .filter(log => log.status === 'draft')
                .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
                .slice(0, 3)
                .map(log => (
                  <div key={log.id} className="deadline-item">
                    <p><strong>Week {log.week_number}</strong></p>
                    <p className="deadline-date">
                      {new Date(log.deadline).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                ))}
              {weeklyLogs.filter(log => log.status === 'draft').length === 0 && (
                <p className="no-deadlines">No upcoming deadlines</p>
              )}
            </div>
          )}
        </section>
      )}

      {/* ==================== PLACEMENT TAB ====================*/}
      {activeTab === 'placement' && (
        <section className="tab-content">
          <h2>Internship Placement</h2>
          
          {placement ? (
            <div className="placement-details">
              <div className="detail-grid">
                <div className="detail-card">
                  <h3>🏢 Company</h3>
                  <p className="detail-value">{placement.company_name || 'N/A'}</p>
                </div>

                <div className="detail-card">
                  <h3>📍 Address</h3>
                  <p className="detail-value">{placement.company_address || 'Address not provided'}</p>
                </div>

                <div className="detail-card">
                  <h3>📅 Duration</h3>
                  <p className="detail-value">
                    {placement.start_date ? new Date(placement.start_date).toLocaleDateString() : 'N/A'}
                    {' '} to {placement.end_date ? new Date(placement.end_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>

                <div className="detail-card">
                  <h3>🎯 Status</h3>
                  <p className={`detail-value status ${placement.status?.toLowerCase()}`}>
                    {placement.status}
                  </p>
                </div>

                <div className="detail-card">
                  <h3>👨‍💼 Workplace Supervisor</h3>
                  <p className="detail-value">
                    {placement.workplace_supervisor ? `Supervisor ID: ${placement.workplace_supervisor}` : 'Not assigned'}
                  </p>
                </div>

                <div className="detail-card">
                  <h3>👨‍🎓 Academic Supervisor</h3>
                  <p className="detail-value">
                    {placement.academic_supervisor ? `Supervisor ID: ${placement.academic_supervisor}` : 'Not assigned'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-data-message">
              <p>📍 No active placement assigned yet. Please contact your administrator.</p>
            </div>
          )}
        </section>
      )}

      {/* ==================== WEEKLY LOGS TAB ====================*/}
      {activeTab === 'logs' && (
        <section className="tab-content">
          <h2>📝 Weekly Logbook</h2>

          {weeklyLogs.length > 0 ? (
            <div className="logs-list">
              {weeklyLogs
                .sort((a, b) => b.week_number - a.week_number)
                .map(log => (
                  <div key={log.id} className="log-card">
                    <div className="log-header">
                      <h3>Week {log.week_number}</h3>
                      <span className={`log-status ${log.status}`}>
                        {log.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="log-content">
                      <div className="log-section">
                        <strong>📌 Activities:</strong>
                        <p>{log.activities}</p>
                      </div>

                      {log.challenges && (
                        <div className="log-section">
                          <strong>⚠️ Challenges:</strong>
                          <p>{log.challenges}</p>
                        </div>
                      )}

                      {log.lesson && (
                        <div className="log-section">
                          <strong>💡 Lessons Learned:</strong>
                          <p>{log.lesson}</p>
                        </div>
                      )}

                      {log.supervisor_comment && (
                        <div className="log-section supervisor-comment">
                          <strong>💬 Supervisor Feedback:</strong>
                          <p>{log.supervisor_comment}</p>
                        </div>
                      )}

                      <div className="log-meta">
                        <small>Deadline: {new Date(log.deadline).toLocaleDateString()}</small>
                        {log.submitted_at && (
                          <small>Submitted: {new Date(log.submitted_at).toLocaleDateString()}</small>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="no-data-message">
              <p>📝 No weekly logs yet. Start logging your internship activities!</p>
            </div>
          )}
        </section>
      )}

      {/* ==================== EVALUATIONS TAB ====================*/}
      {activeTab === 'evaluations' && (
        <section className="tab-content">
          <h2>⭐ Academic Evaluations</h2>

          {evaluations.length > 0 ? (
            <div className="evaluations-list">
              {/* Summary Card */}
              {evaluations.length > 0 && (
                <div className="evaluation-summary">
                  <h3>📊 Overall Performance Summary</h3>
                  <div className="summary-stats">
                    <div className="summary-stat">
                      <span className="summary-label">Average Score:</span>
                      <span className="summary-value">
                        {(evaluations.reduce((sum, item) => sum + (item.total_score || 0), 0) / evaluations.length).toFixed(2)}/100
                      </span>
                    </div>
                    <div className="summary-stat">
                      <span className="summary-label">Total Evaluators:</span>
                      <span className="summary-value">{evaluations.length}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Individual Evaluations */}
              {evaluations.map(evaluation => (
                <div key={evaluation.id} className="evaluation-card">
                  <div className="eval-header">
                    <h3>Evaluator ID: {evaluation.evaluator}</h3>
                    <span className={`eval-status ${evaluation.status?.toLowerCase()}`}>
                      {evaluation.status}
                    </span>
                  </div>

                  <div className="eval-content">
                    <div className="eval-score">
                      <strong>Score:</strong>
                      <span className="score-value">{evaluation.total_score}/100</span>
                    </div>

                    <div className="eval-grade">
                      <strong>Grade:</strong>
                      <span className="grade-value">{evaluation.grade || 'N/A'}</span>
                    </div>

                    {evaluation.overall_comment && (
                      <div className="eval-comment">
                        <strong>Evaluator Comments:</strong>
                        <p>{evaluation.overall_comment}</p>
                      </div>
                    )}

                    <div className="eval-meta">
                      {evaluation.submitted_at && (
                        <small>Submitted: {new Date(evaluation.submitted_at).toLocaleDateString()}</small>
                      )}
                      <small>Created: {new Date(evaluation.created_at).toLocaleDateString()}</small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data-message">
              <p>⭐ No evaluations yet. They will appear here once evaluators submit their assessments.</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
