"use client";
import { useState } from 'react';

interface ScheduleRow {
  teacherName: string;
  department: string;
  period: string;
  subject: string;
  room: string;
  dayOfWeek?: string;
  isTeaching: string;
}

export default function ScheduleImport() {
  const [csvData, setCsvData] = useState<string>('');
  const [importedData, setImportedData] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvData(text);
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (csvText: string) => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const data: ScheduleRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row as ScheduleRow);
      }
    }
    
    setImportedData(data);
  };

  const handleImport = async () => {
    if (importedData.length === 0) {
      setError('No data to import');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // For demo purposes, we'll use mock school ID
      const schoolId = 'demo-school-id';
      
      const promises = importedData.map(row => 
        fetch('/api/schedule', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            teacherId: 'demo-teacher-id', // This would be resolved from teacher name
            schoolId: schoolId,
            period: row.period,
            subject: row.subject,
            room: row.room,
            dayOfWeek: row.dayOfWeek || null,
            isTeaching: row.isTeaching.toLowerCase() === 'true',
          }),
        })
      );

      await Promise.all(promises);
      setSuccess(`Successfully imported ${importedData.length} schedule entries!`);
      setImportedData([]);
      setCsvData('');
    } catch (error) {
      console.error('Error importing schedule:', error);
      setError('Failed to import schedule data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold text-indigo-800 mb-4">Import Master Schedule</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload CSV File
        </label>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Expected CSV Format:</h4>
        <div className="bg-gray-50 p-3 rounded text-sm font-mono">
          teacherName,department,period,subject,room,dayOfWeek,isTeaching<br/>
          John Smith,Math,Period 1,Algebra I,Rm 201,,true<br/>
          John Smith,Math,Period 2,Prep,Rm 201,,false<br/>
          Sarah Jones,English,Period 1,English 9,Rm 105,,true
        </div>
      </div>

      {importedData.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Preview ({importedData.length} entries):
          </h4>
          <div className="max-h-40 overflow-y-auto border border-gray-300 rounded">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-1 text-left">Teacher</th>
                  <th className="px-2 py-1 text-left">Period</th>
                  <th className="px-2 py-1 text-left">Subject</th>
                  <th className="px-2 py-1 text-left">Room</th>
                </tr>
              </thead>
              <tbody>
                {importedData.slice(0, 10).map((row, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-2 py-1">{row.teacherName}</td>
                    <td className="px-2 py-1">{row.period}</td>
                    <td className="px-2 py-1">{row.subject}</td>
                    <td className="px-2 py-1">{row.room}</td>
                  </tr>
                ))}
                {importedData.length > 10 && (
                  <tr>
                    <td colSpan={4} className="px-2 py-1 text-gray-500 text-center">
                      ... and {importedData.length - 10} more entries
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded">
          {success}
        </div>
      )}

      <button
        onClick={handleImport}
        disabled={loading || importedData.length === 0}
        className="w-full bg-indigo-700 text-white font-semibold py-2 rounded hover:bg-indigo-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Importing...' : 'Import Schedule'}
      </button>
    </div>
  );
} 