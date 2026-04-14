import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function SubmitLogPage() {
  const [weekNumber, setWeekNumber] = useState('')
  const [activities, setActivities] = useState('')
  const [challenges, setChallenges] = useState('')
  const [status, setStatus] = useState('draft')
  const [message, setMessage] = useState('')
  const token = localStorage.getItem('access_token')
  const navigate = useNavigate()

  const handleSubmit = async () => {
    try {
      await axios.post('http://127.0.0.1:8000/api/logs/', {
        week_number: weekNumber,
        activities: activities,
        challenges: challenges,
        status: status,
        placement: 1,
        deadline: '2026-12-31',
      }, {
        headers: { Authorization: 'Bearer ' + token }
      })
      setMessage('Log saved successfully!')
      navigate('/student')
    } catch (error) {
      setMessage('Error: ' + (error.response?.data?.detail || 'Something went wrong'))
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto' }}>

      {/* HEADER BAR */}
      <div style={{
        background: '#0F6E56',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>
          Submit Weekly Log
        </h2>
        <p style={{ color: '#9FE1CB', fontSize: '13px', marginTop: '4px' }}>
          Fill in your internship activities for the week
        </p>
      </div>

      {/* FORM BODY */}
      <div style={{
        padding: '24px',
        border: '1px solid #ddd',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        background: 'white'
      }}>

        <div style={{ marginBottom: '15px' }}>
          <label>Week Number</label>
          <input type='number' value={weekNumber}
            onChange={(e) => setWeekNumber(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '5px',
                     border: '1px solid #ccc', borderRadius: '4px' }} />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Activities This Week</label>
          <textarea value={activities}
            onChange={(e) => setActivities(e.target.value)}
            rows={4}
            style={{ width: '100%', padding: '8px', marginTop: '5px',
                     border: '1px solid #ccc', borderRadius: '4px' }} />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Challenges Faced</label>
          <textarea value={challenges}
            onChange={(e) => setChallenges(e.target.value)}
            rows={3}
            style={{ width: '100%', padding: '8px', marginTop: '5px',
                     border: '1px solid #ccc', borderRadius: '4px' }} />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label>Save as:</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            style={{ marginLeft: '10px', padding: '6px' }}>
            <option value='draft'>Draft</option>
            <option value='submitted'>Submit Now</option>
          </select>
        </div>

        <button onClick={handleSubmit}
          style={{ width: '100%', padding: '10px', backgroundColor: '#0F6E56',
                   color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Save Log
        </button>

        {message && <p style={{ marginTop: '15px',
          color: message.includes('Error') ? 'red' : 'green' }}>{message}</p>}

      </div>
    </div>
  )
}

export default SubmitLogPage