import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [events, setEvents] = useState([]);
  const [organisations, setOrganisations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const fetchEvents = (page, orgId = '') => {
    const url = `http://localhost:8080/events?page=${page}&limit=${limit}${orgId ? `&orgId=${orgId}` : ''}`;
    axios.get(url)
      .then(res => setEvents(res.data))
      .catch(err => console.error('Error fetching events:', err));
  };

  useEffect(() => {
    fetchEvents(page, selectedOrg);
  }, [page, selectedOrg]);

  useEffect(() => {
    axios.get('http://localhost:8080/organisations')
      .then(res => setOrganisations(res.data))
      .catch(err => console.error('Error fetching organisations:', err));
  }, []);

  const handleOrgChange = (e) => {
    setSelectedOrg(e.target.value);
    setPage(1); // Reset to page 1 on org change
  };

  return (
    <div className="App">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Event Execution Dashboard</h1>
        <select value={selectedOrg} onChange={handleOrgChange}>
          <option value="">All Organisations</option>
          {organisations.map(org => (
            <option key={org._id} value={org._id}>{org.name}</option>
          ))}
        </select>
      </div>

      <table>
        <thead>
          <tr>
            <th>Event ID</th>
            <th>Event Name</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e, idx) => (
            <tr key={idx}>
              <td>{e.eventId}</td>
              <td>{e.eventName || 'N/A'}</td>
              <td>{new Date(e.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div style={{ marginTop: '20px' }}>
        <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}>
          Previous
        </button>
        <span style={{ margin: '0 10px' }}>Page {page}</span>
        <button onClick={() => setPage(p => p + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}

export default App;
