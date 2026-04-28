import { ClassData, Student, Reason, MonthlyData } from '../types';

const classNames = [
  '1S', '1K', '1B',
  '2S', '2K', '2B',
  '3S', '3K', '3B',
  '4S', '4K', '4B',
  '5S', '5K', '5B',
  '6S', '6K', '6B'
];

const malayFirstNames = ['Ahmad', 'Muhammad', 'Nur', 'Siti', 'Amir', 'Farish', 'Aisyah', 'Puteri', 'Daniel', 'Irfan', 'Sofea', 'Qistina', 'Hakim', 'Afiq', 'Zara'];
const malayLastNames = ['Abu', 'Ali', 'Osman', 'Ridzuan', 'Firdaus', 'Ismail', 'Zulkifli', 'Rahim', 'Hafiz', 'Kamal', 'Saiful', 'Fauzi'];

function getRandomName() {
  const first = malayFirstNames[Math.floor(Math.random() * malayFirstNames.length)];
  const last = malayLastNames[Math.floor(Math.random() * malayLastNames.length)];
  const isMale = !first.includes('Nur') && !first.includes('Siti') && !first.includes('Aisyah') && !first.includes('Puteri') && !first.includes('Sofea') && !first.includes('Qistina') && !first.includes('Zara');
  const connector = isMale ? 'Bin' : 'Binti';
  return `${first} ${connector} ${last}`;
}

const generateStudents = (className: string, month: number): Student[] => {
  const students: Student[] = [];
  const numStudents = 25 + Math.floor(Math.random() * 5);

  for (let i = 0; i < numStudents; i++) {
    const r = Math.random();
    let absentDays: number | '' = '';
    let reason: Reason = null;

    if (r < 0.1) {
      absentDays = 3 + Math.floor(Math.random() * 3);
      reason = Math.random() > 0.5 ? 'ADA ALASAN' : 'TIADA ALASAN';
    } else if (r < 0.2) {
      absentDays = 1 + Math.floor(Math.random() * 2);
    } else {
      absentDays = 0;
    }

    students.push({
      id: `${className}-M${month}-S${i + 1}`,
      name: getRandomName(),
      consecutiveAbsentDays: absentDays,
      reason: reason,
    });
  }
  return students.sort((a, b) => a.name.localeCompare(b.name));
};

export const generateMockData = (): ClassData[] => {
  const currentMonthIdx = 3; // April (0-indexed)

  return classNames.map((name) => {
    const monthlyRecords: MonthlyData[] = [];

    for (let m = 0; m < 12; m++) {
      const isPast = m < currentMonthIdx;
      // Random completion for past months
      const isCompleted = isPast ? Math.random() > 0.3 : false;
      
      monthlyRecords.push({
        month: m,
        isCompleted: isCompleted,
        students: generateStudents(name, m)
      });
    }

    return {
      id: name,
      name: name,
      monthlyRecords: monthlyRecords
    };
  });
};
