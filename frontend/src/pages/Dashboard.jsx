import { useState, useEffect } from 'react';
import {
  AcademicCapIcon,
  BriefcaseIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const stats = [
  { name: 'Current Placement', value: 'TechCorp Inc.', icon: BriefcaseIcon, change: '+4.75%' },
  { name: 'Weeks Completed', value: '6/12', icon: ClockIcon, change: '50%' },
  { name: 'Pending Reviews', value: '2', icon: AcademicCapIcon, change: '2 pending' },
  { name: 'Overall Score', value: '87.5%', icon: CheckCircleIcon, change: 'Excellent' },
];

const recentLogs = [
  { week: 6, title: 'API Development', status: 'pending', date: 'Mar 25, 2026' },
  { week: 5, title: 'Database Design', status: 'approved', date: 'Mar 18, 2026' },
  { week: 4, title: 'Frontend Setup', status: 'reviewed', date: 'Mar 11, 2026' },
];

const pendingTasks = [
  { id: 1, task: 'Submit Week 6 Log', deadline: 'Mar 27, 2026', priority: 'high' },
  { id: 2, task: 'Review by Supervisor', deadline: 'Mar 28, 2026', priority: 'medium' },
];

export default function Dashboard() {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{greeting}, John! 👋</h1>
        <p className="text-text-muted mt-1">Track your internship progress and pending tasks</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-muted text-sm">{stat.name}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                <p className="text-xs text-text-muted mt-1">{stat.change}</p>
              </div>
              <stat.icon className="h-8 w-8 text-accent" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Logs */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Recent Weekly Logs</h2>
          <div className="space-y-3">
            {recentLogs.map((log) => (
              <div key={log.week} className="flex items-center justify-between py-2 border-b border-border">
                <div>
                  <p className="font-medium">Week {log.week}: {log.title}</p>
                  <p className="text-xs text-text-muted">{log.date}</p>
                </div>
                <span className={`badge ${
                  log.status === 'approved' ? 'badge-success' : 
                  log.status === 'pending' ? 'badge-warning' : 'badge'
                }`}>
                  {log.status}
                </span>
              </div>
            ))}
          </div>
          <button className="btn btn-outline w-full mt-4">View All Logs</button>
        </div>

        {/* Pending Tasks */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Pending Tasks</h2>
          <div className="space-y-3">
            {pendingTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between py-2 border-b border-border">
                <div>
                  <p className="font-medium">{task.task}</p>
                  <p className="text-xs text-text-muted">Due: {task.deadline}</p>
                </div>
                <span className={`badge ${task.priority === 'high' ? 'badge-danger' : 'badge-warning'}`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
          <button className="btn btn-primary w-full mt-4">Submit New Log</button>
        </div>
      </div>
    </div>
  );
}