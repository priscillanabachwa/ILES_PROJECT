import { useState } from 'react';

const placements = [
  {
    id: 1,
    company: 'TechCorp Inc.',
    role: 'Software Engineering Intern',
    supervisor: 'Jane Smith',
    startDate: '2026-01-15',
    endDate: '2026-06-15',
    status: 'active',
    location: 'San Francisco, CA (Remote)',
  },
  {
    id: 2,
    company: 'CodeWorks Ltd.',
    role: 'Frontend Developer Intern',
    supervisor: 'Mike Johnson',
    startDate: '2025-06-01',
    endDate: '2025-12-01',
    status: 'completed',
    location: 'New York, NY',
  },
];

export default function Placements() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Internship Placements</h1>
          <p className="text-text-muted mt-1">View and manage your internship placements</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          + New Placement
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">Request New Placement</h2>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input type="text" className="form-input" placeholder="Enter company name" />
              </div>
              <div className="form-group">
                <label className="form-label">Position/Role</label>
                <input type="text" className="form-input" placeholder="Enter position" />
              </div>
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input type="date" className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">End Date</label>
                <input type="date" className="form-input" />
              </div>
              <div className="form-group md:col-span-2">
                <label className="form-label">Location</label>
                <input type="text" className="form-input" placeholder="City, Country or Remote" />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline">Cancel</button>
              <button type="submit" className="btn btn-primary">Submit Request</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {placements.map((placement) => (
          <div key={placement.id} className="card">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold">{placement.company}</h2>
                <p className="text-accent mt-1">{placement.role}</p>
                <p className="text-text-muted text-sm mt-2">Supervisor: {placement.supervisor}</p>
              </div>
              <span className={`badge ${placement.status === 'active' ? 'badge-success' : 'badge'}`}>
                {placement.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
              <div>
                <p className="text-text-muted text-xs">Start Date</p>
                <p className="text-sm font-medium">{new Date(placement.startDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-text-muted text-xs">End Date</p>
                <p className="text-sm font-medium">{new Date(placement.endDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-text-muted text-xs">Location</p>
                <p className="text-sm font-medium">{placement.location}</p>
              </div>
              <div>
                <p className="text-text-muted text-xs">Duration</p>
                <p className="text-sm font-medium">
                  {Math.ceil((new Date(placement.endDate) - new Date(placement.startDate)) / (1000 * 60 * 60 * 24))} days
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-4 pt-4 border-t border-border">
              <button className="btn btn-outline text-sm">View Details</button>
              <button className="btn btn-outline text-sm">Contact Supervisor</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}