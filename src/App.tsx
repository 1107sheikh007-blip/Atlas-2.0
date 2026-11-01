import React from 'react';
import { DiagnosticProvider, useDiagnostic } from './context/DiagnosticContext';
import { Header } from './components/common/Header';
import { LoginScreen } from './components/auth/LoginScreen';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ReceptionPortal } from './components/reception/ReceptionPortal';
import { DoctorWorkstation } from './components/doctor/DoctorWorkstation';
import { ReferringDoctorPortal } from './components/referral/ReferringDoctorPortal';
import { PatientPortal } from './components/patient/PatientPortal';

const MainContent: React.FC = () => {
  const { isAuthenticated, currentRole, selectedCenter, isOnline, pullOrdersFromGoogleSheets } = useDiagnostic();

  // Strict Online Gate: App stops working immediately when offline
  if (!isOnline) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-6 text-center select-none">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl border border-rose-200 space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m-3.536-3.536a4 4 0 010-5.656m-7.072 7.072a4 4 0 010-5.656m-3.536 9.192a9 9 0 010-12.728M3 3l18 18" />
            </svg>
          </div>
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-extrabold uppercase tracking-wider">
              Connection Required • System Halted
            </span>
            <h2 className="text-xl font-black text-slate-900">
              No Internet Connection
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Atlas Diagnostics Center connects directly to <strong>Google Sheets</strong> in real-time. An active connection is required to guarantee 100% data integrity across all workstations.
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 font-semibold">
            Please check your Wi-Fi or network cable. The workstation will automatically resume as soon as internet connectivity is restored.
          </div>
          <button
            type="button"
            onClick={() => {
              if (navigator.onLine) {
                pullOrdersFromGoogleSheets(true);
              } else {
                window.location.reload();
              }
            }}
            className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
          >
            Retry Google Sheets Connection
          </button>
        </div>
      </div>
    );
  }

  // If not logged in, show clean authentication screen
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] text-slate-800 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Header with Profile, Role Switcher, Google Sheets & Logout */}
      <Header />

      {/* Main Role Workstation Area */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto px-4 sm:px-6 py-4 sm:py-5">
        {(currentRole === 'SUPER_ADMIN' || currentRole === 'CENTER_MANAGER') && <AdminDashboard />}
        {currentRole === 'RECEPTIONIST' && <ReceptionPortal />}
        {(currentRole === 'DIAGNOSTIC_DOCTOR' || currentRole === 'LAB_TECHNICIAN') && <DoctorWorkstation />}
        {currentRole === 'REFERRING_DOCTOR' && <ReferringDoctorPortal />}
        {currentRole === 'PATIENT' && <PatientPortal />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3.5 mt-8 text-xs text-slate-500 shadow-xs">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-slate-700">Atlas Diagnostics Center</span>
            <span>•</span>
            <span>Center: <strong className="text-sky-700">{selectedCenter.name}</strong></span>
          </div>

          <div className="flex items-center gap-4 text-slate-500 font-medium">
            <span>Advanced Automated Diagnostic Lab</span>
            <span>•</span>
            <span>AERB Radiology Verified</span>
            <span>•</span>
            <span>ABDM Integrated</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <DiagnosticProvider>
      <MainContent />
    </DiagnosticProvider>
  );
}

export default App;
