import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import dashboardService from "../../services/dashboardService"

export default function InternshipAdministratorDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">Coming soon...</p>
      </div>
    </div>
  )
}
