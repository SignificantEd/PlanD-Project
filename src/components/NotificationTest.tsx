import { useState, useEffect } from 'react';

interface EmailConfig {
  provider: string;
  fromEmail: string;
  adminEmail: string;
  status: string;
}

interface NotificationTestProps {
  className?: string;
}

export default function NotificationTest({ className = '' }: NotificationTestProps) {
  const [emailConfig, setEmailConfig] = useState<EmailConfig | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [summaryRecipients, setSummaryRecipients] = useState('admin@school.edu,office@school.edu');
  const [summaryDate, setSummaryDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchEmailConfig();
  }, []);

  const fetchEmailConfig = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setEmailConfig(data.emailConfig);
      }
    } catch (error) {
      console.error('Error fetching email config:', error);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      setMessage('Please enter an email address');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'test',
          data: {
            recipientEmail: testEmail,
            recipientName: 'Test User'
          }
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        setMessage('✅ Test email sent successfully!');
      } else {
        setMessage(`❌ Failed to send email: ${result.error}`);
      }
    } catch (error) {
      setMessage('❌ Error sending test email');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendDailySummary = async () => {
    if (!summaryRecipients) {
      setMessage('Please enter recipient email addresses');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const recipients = summaryRecipients.split(',').map(email => email.trim());
      
      const response = await fetch('/api/notifications/daily-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: summaryDate,
          recipients
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        setMessage(`✅ Daily summary sent to ${recipients.length} recipients!`);
      } else {
        setMessage(`❌ Failed to send summary: ${result.error}`);
      }
    } catch (error) {
      setMessage('❌ Error sending daily summary');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <h3 className="text-xl font-semibold text-indigo-800 mb-4">
        📬 Email Notification System
      </h3>

      {/* Email Configuration Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-700 mb-2">Configuration Status</h4>
        {emailConfig ? (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Provider:</span> {emailConfig.provider}
            </div>
            <div>
              <span className="font-medium">Status:</span> 
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                emailConfig.status === 'configured' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {emailConfig.status}
              </span>
            </div>
            <div>
              <span className="font-medium">From Email:</span> {emailConfig.fromEmail}
            </div>
            <div>
              <span className="font-medium">Admin Email:</span> {emailConfig.adminEmail}
            </div>
          </div>
        ) : (
          <p className="text-gray-500">Loading configuration...</p>
        )}
      </div>

      {/* Test Assignment Email */}
      <div className="mb-6 p-4 border border-gray-200 rounded-lg">
        <h4 className="font-medium text-gray-700 mb-3">🎯 Test Assignment Email</h4>
        <div className="flex gap-3">
          <input
            type="email"
            placeholder="Enter test email address"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            onClick={sendTestEmail}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {loading ? '📤' : '📧'} Send Test
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Sends a sample substitute assignment notification
        </p>
      </div>

      {/* Daily Summary Email */}
      <div className="mb-6 p-4 border border-gray-200 rounded-lg">
        <h4 className="font-medium text-gray-700 mb-3">📊 Daily Summary Email</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={summaryDate}
              onChange={(e) => setSummaryDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipients (comma-separated)
            </label>
            <input
              type="text"
              placeholder="admin@school.edu, office@school.edu"
              value={summaryRecipients}
              onChange={(e) => setSummaryRecipients(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            onClick={sendDailySummary}
            disabled={loading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? '📤' : '📊'} Send Daily Summary
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Sends daily coverage summary to office staff
        </p>
      </div>

      {/* Email Types Information */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">📬 Automatic Email Types</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Assignment Notifications:</strong> Sent to substitutes and teachers when assigned</li>
          <li>• <strong>Admin Alerts:</strong> Sent for uncovered periods and constraint violations</li>
          <li>• <strong>Emergency Overrides:</strong> Special notifications for emergency assignments</li>
          <li>• <strong>Daily Summaries:</strong> End-of-day reports for office staff</li>
        </ul>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-3 rounded-md text-sm ${
          message.includes('✅') 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Setup Instructions */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-medium text-yellow-800 mb-2">⚙️ Setup Instructions</h4>
        <div className="text-sm text-yellow-700 space-y-2">
          <p><strong>Development (Mailtrap):</strong></p>
          <ul className="ml-4 space-y-1">
            <li>1. Create account at mailtrap.io</li>
            <li>2. Get SMTP credentials from your inbox</li>
            <li>3. Update .env.local with your credentials</li>
          </ul>
          <p><strong>Production (SendGrid):</strong></p>
          <ul className="ml-4 space-y-1">
            <li>1. Create SendGrid account</li>
            <li>2. Generate API key</li>
            <li>3. Update EMAIL_PROVIDER=sendgrid in .env.local</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
