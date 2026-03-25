import { useState } from 'react';
import { PencilIcon, EyeIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

const logs = [
  {
    id: 1,
    week: 6,
    title: 'API Development and Integration',
    description: 'Worked on building RESTful APIs for the internship system. Implemented endpoints for log submissions and reviews.',
    status: 'draft',
    submittedAt: null,
    activities: ['API design', 'Django REST Framework setup', 'Testing endpoints'],
  },
  {
    id: 2,
    week: 5,
    title: 'Database Design and Models',
    description: 'Designed database schema for the ILES system. Created models for placements, logs, and evaluations.',
    status: 'submitted',
    submittedAt: '2026-03-18',
    activities: ['ERD design', 'Django models', 'Migrations'],
  },
  {
    id: 3,
    week: 4,
    title: 'Frontend Development',
    description: 'Set up React application with Vite. Created basic components and routing.',
    status: 'reviewed',
    submittedAt: '2026-03-11',
    activities: ['React setup', 'Component development', 'Routing'],
  },
  {
    id: 4,
    week: 3,
    title: 'Requirements Analysis',
    description: 'Analyzed system requirements and created user stories for all roles.',
    status: 'approved',
    submittedAt: '2026-03-04',
    activities: ['User stories', 'Workflow design', 'Documentation'],
  },
];

const getStatusBadge = (status) => {
  switch (status) {
    case 'draft':
      return <span className="badge badge-warning">Draft</span>;
    case 'submitted':
      return <span className="badge">Submitted</span>;
    case 'reviewed':
      return <span className="badge">Reviewed</span>;
    case 'approved':
      return <span className="badge badge-success">Approved</span>;
    default:
      return <span className="badge">{status}</span>;
  }
};

export default function WeeklyLogs() {
  const [selectedLog, setSelectedLog] = useState(null);
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Weekly Logs</h1>
          <p className="text-text-muted mt-1">Submit and track your weekly internship activities</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          + New Weekly Log
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">Submit Weekly Log - Week 7</h2>
          <form className="space-y-4">
            <div className="form-group">
              <label className="form-label">Log Title</label>
              <input type="text" className="form-input" placeholder="e.g., API Development, Database Design" />
            </div>
            <div className="form-group">
              <label className="form-label">Activities Performed</label>
              <textarea className="form-textarea" rows="4" placeholder="Describe your activities for this week..." />
            </div>
            <div className="form-group">
              <label className="form-label">Challenges Faced</label>
              <textarea className="form-textarea" rows="3" placeholder="Any challenges or blockers?" />
            </div>
            <div className="form-group">
              <label className="form-label">Next Week Plan</label>
              <textarea className="form-textarea" rows="3" placeholder="What do you plan to work on next week?" />
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline">Cancel</button>
              <button type="button" className="btn btn-outline">Save as Draft</button>
              <button type="submit" className="btn btn-primary">Submit for Review</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {logs.map((log) => (
          <div key={log.id} className="card">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-accent font-semibold">Week {log.week}</span>
                  {getStatusBadge(log.status)}
                </div>
                <h3 className="text-lg font-semibold">{log.title}</h3>
                <p className="text-text-muted text-sm mt-1 line-clamp-2">{log.description}</p>
                
                <div className="mt-3">
                  <p className="text-xs text-text-muted mb-2">Key Activities:</p>
                  <div className="flex flex-wrap gap-2">
                    {log.activities.map((activity, idx) => (
                      <span key={idx} className="text-xs bg-accent-light text-accent px-2 py-1 rounded-full">
                        {activity}
                      </span>
                    ))}
                  </div>
                </div>

                {log.submittedAt && (
                  <p className="text-xs text-text-muted mt-3">
                    Submitted: {new Date(log.submittedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setSelectedLog(log)} 
                  className="p-2 rounded-lg hover:bg-accent-light"
                >
                  <EyeIcon className="h-5 w-5" />
                </button>
                {log.status === 'draft' && (
                  <button className="p-2 rounded-lg hover:bg-accent-light">
                    <PencilIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}