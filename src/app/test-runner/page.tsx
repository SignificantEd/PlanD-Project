'use client';

import { useEffect } from 'react';

// Import the test function directly
import '../../tests/runAssignmentTests';

export default function TestRunnerPage() {
  useEffect(() => {
    console.log('🚀 Test Runner Page Loaded');
    console.log('==========================================');
    console.log('This page will automatically run the assignment tests.');
    console.log('Check the browser console for detailed output.');
    console.log('==========================================');
  }, []);

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ color: '#333', textAlign: 'center', marginBottom: '30px' }}>
          🚀 PlanD Assignment Test Runner
        </h1>
        
        <div style={{
          background: '#e8f4fd',
          padding: '20px',
          borderRadius: '6px',
          marginBottom: '20px',
          borderLeft: '4px solid #2196F3'
        }}>
          <h3>📋 Instructions:</h3>
          <ol>
            <li>Open your browser's Developer Console (F12 or right-click → Inspect → Console)</li>
            <li>The tests will run automatically when this page loads</li>
            <li>Watch the console for detailed test output</li>
            <li>You should see the test harness messages and results from Step 0, 1, 2, and 3</li>
          </ol>
        </div>

        <div style={{
          background: '#d4edda',
          color: '#155724',
          padding: '15px',
          borderRadius: '6px',
          border: '1px solid #c3e6cb',
          marginBottom: '20px'
        }}>
          <strong>✅ Status:</strong> Tests are running automatically. Check the browser console for results.
        </div>

        <div style={{
          background: '#1e1e1e',
          color: '#00ff00',
          padding: '20px',
          borderRadius: '6px',
          fontFamily: "'Courier New', monospace",
          whiteSpace: 'pre-wrap',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          <strong>Console Output Preview:</strong>
          <div style={{ marginTop: '10px' }}>
            The test output will appear in your browser's developer console.
            <br />
            Look for messages starting with:
            <br />
            • 🚀 STARTING PLAN D ASSIGNMENT TESTS
            <br />
            • 📋 STEP 0: Testing Helper Functions
            <br />
            • 📋 STEP 1: Single Absence Test
            <br />
            • 📋 STEP 2: Multiple Absences Test
            <br />
            • 📋 STEP 3: Conflicting Assignments Test
            <br />
            • 🎯 TEST SUMMARY
          </div>
        </div>

        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '6px',
          color: '#856404'
        }}>
          <strong>💡 Tip:</strong> If you don't see the console output, make sure you have the Developer Console open (F12) and that the Console tab is selected.
        </div>
      </div>
    </div>
  );
} 