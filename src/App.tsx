import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { ClassDetail } from './components/ClassDetail';
import { PasswordModal } from './components/PasswordModal';
import { LetterModule } from './components/LetterModule';
import { generateMockData } from './lib/mock-data';
import { ClassData, Reason, DashboardClassSummary, Student } from './types';
import { fetchDashboardData, fetchClassMonthlyData, saveClassMonthlyData } from './services/api';
import { Loader2, AlertCircle } from 'lucide-react';

export default function App() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardClassSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [activeMonthIdx, setActiveMonthIdx] = useState<number | null>(null);
  const [activeStudents, setActiveStudents] = useState<Student[]>([]);
  const [isFetchingMonth, setIsFetchingMonth] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  
  // Password Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingClassId, setPendingClassId] = useState<string | null>(null);
  const [pendingMonthIdx, setPendingMonthIdx] = useState<number | null>(null);

  const [showLetterModule, setShowLetterModule] = useState(false);
  const [targetLetterStudentId, setTargetLetterStudentId] = useState<string | null>(null);

  useEffect(() => {
    // Initialize mock data on mount for details (fallback)
    setClasses(generateMockData());
    
    // Fetch real dashboard data
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchDashboardData(2026);
      setDashboardData(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuatkan data dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectClass = async (classId: string, monthIdx: number) => {
    const dashboardEntry = dashboardData.find(d => d.kelas_id === classId);
    const monthNames = [
      'JANUARI', 'FEBRUARI', 'MAC', 'APRIL', 'MEI', 'JUN',
      'JULAI', 'OGOS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DISEMBER'
    ];
    const monthStatus = dashboardEntry?.status_bulanan[monthNames[monthIdx]];
    const isCompleted = monthStatus === 'SELESAI';
    
    if (isCompleted) {
      setIsFetchingMonth(true);
      try {
        const students = await fetchClassMonthlyData(classId, monthIdx);
        setActiveStudents(students);
        setActiveClassId(classId);
        setActiveMonthIdx(monthIdx);
        setIsUnlocked(false);
      } catch (err: any) {
        alert(err.message || "Gagal memuatkan data.");
      } finally {
        setIsFetchingMonth(false);
      }
    } else {
      setPendingClassId(classId);
      setPendingMonthIdx(monthIdx);
      setIsModalOpen(true);
    }
  };

  const handleUnlockRequest = () => {
    if (!activeClassId) return;
    setPendingClassId(activeClassId);
    setPendingMonthIdx(activeMonthIdx);
    setIsModalOpen(true);
  };

  const handlePasswordSuccess = async () => {
    setIsModalOpen(false);
    setIsUnlocked(true);
    if (pendingClassId && pendingMonthIdx !== null) {
      setIsFetchingMonth(true);
      try {
        const students = await fetchClassMonthlyData(pendingClassId, pendingMonthIdx);
        setActiveStudents(students);
        setActiveClassId(pendingClassId);
        setActiveMonthIdx(pendingMonthIdx);
        setPendingClassId(null);
        setPendingMonthIdx(null);
      } catch (err: any) {
        alert(err.message || "Gagal memuatkan data.");
      } finally {
        setIsFetchingMonth(false);
      }
    }
  };

  const activeClassSummary = dashboardData.find(c => c.kelas_id === activeClassId);
  const activeClass: ClassData | null = activeClassId ? {
    id: activeClassId,
    name: activeClassSummary?.nama_kelas || activeClassId,
    monthlyRecords: [{
      month: activeMonthIdx || 0,
      isCompleted: dashboardData.find(d => d.kelas_id === activeClassId)?.status_bulanan[[
        'JANUARI', 'FEBRUARI', 'MAC', 'APRIL', 'MEI', 'JUN',
        'JULAI', 'OGOS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DISEMBER'
      ][activeMonthIdx || 0]] === 'SELESAI',
      students: activeStudents
    }]
  } : null;
  
  const activeMonthData = activeClass?.monthlyRecords[0];
  const pendingClassName = dashboardData.find(c => c.kelas_id === pendingClassId)?.nama_kelas || '';

  const handleUpdateDays = (studentId: string, days: number | '') => {
    setActiveStudents(prev => prev.map(s => s.id === studentId ? { ...s, consecutiveAbsentDays: days } : s));
  };

  const handleUpdateReason = (studentId: string, reason: Reason) => {
    setActiveStudents(prev => prev.map(s => s.id === studentId ? { ...s, reason } : s));
  };

  const handleSaveClass = async () => {
    if (activeClassId === null || activeMonthIdx === null) return;
    
    setIsSaving(true);
    try {
      const summary = dashboardData.find(d => d.kelas_id === activeClassId);
      await saveClassMonthlyData(
        2026,
        activeMonthIdx,
        activeClassId,
        summary?.nama_kelas || activeClassId,
        activeStudents
      );
      
      alert('Data kelas berjaya disimpan');
      
      // Refresh dashboard to reflect changes
      await loadDashboard();
      
      // Reset view to dashboard
      setActiveClassId(null);
      setActiveMonthIdx(null);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan data');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="font-sans antialiased text-slate-900">
      {showLetterModule && targetLetterStudentId ? (
        <LetterModule 
          studentId={targetLetterStudentId}
          onBack={() => {
            setShowLetterModule(false);
            setTargetLetterStudentId(null);
          }}
        />
      ) : !activeClassId ? (
        isLoading ? (
          <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">MEMUATKAN DATA DASHBOARD...</p>
          </div>
        ) : error ? (
          <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full text-center">
              <div className="bg-red-50 text-red-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">Ralat Sistem</h2>
              <p className="text-slate-500 font-medium mb-8 leading-relaxed">{error}</p>
              <button 
                onClick={loadDashboard}
                className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-widest"
              >
                Cuba Lagi
              </button>
            </div>
          </div>
        ) : (
          <>
            <Dashboard 
              classesSummary={dashboardData} 
              onSelectClass={handleSelectClass} 
            />
            {isFetchingMonth && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center z-50">
                <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                  <p className="text-sm font-black text-slate-800 uppercase tracking-widest">MEMUATKAN REKOD...</p>
                </div>
              </div>
            )}
          </>
        )
      ) : activeClass && activeMonthData ? (
        <ClassDetail 
          classData={activeClass}
          monthData={activeMonthData} 
          isUnlocked={isUnlocked}
          isSaving={isSaving}
          onUnlock={handleUnlockRequest}
          onBack={() => {
            setActiveClassId(null);
            setActiveMonthIdx(null);
          }}
          onUpdateReason={handleUpdateReason}
          onUpdateDays={handleUpdateDays}
          onSaveClass={handleSaveClass}
          onLetterModule={(studentId) => {
            setTargetLetterStudentId(studentId);
            setShowLetterModule(true);
          }}
        />
      ) : null}

      <PasswordModal 
        isOpen={isModalOpen}
        classId={pendingClassId || ''}
        className={pendingClassName}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handlePasswordSuccess}
      />

      <footer className="w-full py-8 text-center text-xs font-black text-slate-400 uppercase tracking-widest border-t border-slate-200 bg-slate-50 mt-12">
        <p>@ HAK MILIK UNIT HEM SK SG ABONG</p>
        <p className="mt-1 text-slate-300">MODERATOR: ACAP GARANG</p>
      </footer>
    </div>
  );
}
