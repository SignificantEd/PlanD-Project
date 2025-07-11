'use client';
import React, { useState } from 'react';

export default function DebugAssignmentPage() {
  const [requestData, setRequestData] = useState<any>(null);
  const [responseData, setResponseData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Example payload (no dayType, one day cycle)
  const examplePayload = {
    date: new Date().toISOString().split('T')[0],
    dayType: 'A', // Hardcoded for now
    // Add more fields as needed (e.g., absences, teacherId, etc.)
  };

  const handleAssignCoverage = async () => {
    setLoading(true);
    setError(null);
    setRequestData(examplePayload);
    setResponseData(null);
    try {
      const res = await fetch('/api/coverage/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(examplePayload),
      });
      const data = await res.json();
      setResponseData(data);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', padding: 24, background: '#f9f9f9', borderRadius: 8 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Coverage Assignment Debug Page</h1>
      <button
        onClick={handleAssignCoverage}
        disabled={loading}
        style={{ padding: '10px 24px', fontSize: 16, fontWeight: 600, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', marginBottom: 24 }}
      >
        {loading ? 'Assigning...' : 'Trigger Assignment'}
      </button>
      {error && <div style={{ color: 'red', marginBottom: 16 }}>Error: {error}</div>}
      <div style={{ display: 'flex', gap: 32 }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>Request Payload</h2>
          <pre style={{ background: '#222', color: '#fff', padding: 12, borderRadius: 6, minHeight: 120 }}>
            {JSON.stringify(requestData, null, 2)}
          </pre>
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>API Response</h2>
          <pre style={{ background: '#222', color: '#fff', padding: 12, borderRadius: 6, minHeight: 120 }}>
            {JSON.stringify(responseData, null, 2)}
          </pre>
          {responseData?.debugLogs && (
            <>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 12 }}>Debug Logs</h3>
              <pre style={{ background: '#111', color: '#0f0', padding: 10, borderRadius: 6, minHeight: 60 }}>
                {Array.isArray(responseData.debugLogs)
                  ? responseData.debugLogs.join('\n')
                  : String(responseData.debugLogs)}
              </pre>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 