// Test the date validation logic
const today = new Date();
console.log('Today:', today.toDateString());
console.log('Day of week:', ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()]);

// Test the getNextWeekday function
const getNextWeekday = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  
  console.log('Current day of week:', dayOfWeek);
  
  // If it's Saturday (6) or Sunday (0), move to Monday
  if (dayOfWeek === 6) {
    today.setDate(today.getDate() + 2); // Saturday -> Monday
    console.log('Saturday detected, moving to Monday');
  } else if (dayOfWeek === 0) {
    today.setDate(today.getDate() + 1); // Sunday -> Monday
    console.log('Sunday detected, moving to Monday');
  } else {
    console.log('Weekday detected, keeping same date');
  }
  
  return today.toISOString().split("T")[0];
};

const defaultDate = getNextWeekday();
console.log('Default date for form:', defaultDate);

// Test some specific dates
const testDates = [
  '2025-07-06', // Sunday
  '2025-07-07', // Monday
  '2025-07-12', // Saturday
  '2025-07-14', // Monday
];

testDates.forEach(dateStr => {
  const dateObj = new Date(dateStr);
  const dayOfWeek = dateObj.getDay();
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  console.log(`${dateStr} (${dayName}): ${isWeekend ? '❌ Weekend' : '✅ Weekday'}`);
}); 