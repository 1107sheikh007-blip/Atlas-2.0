import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  FileSpreadsheet,
  Building2,
  Stethoscope,
  UserPlus,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  Briefcase,
  X
} from 'lucide-react';
import { useDiagnostic } from '../../context/DiagnosticContext';
import { ThemeToggle } from '../common/ThemeToggle';
import { ATLAS_LOGO_DATA_URI } from '../../assets/logo';

export const LoginScreen: React.FC = () => {
  const { login, patients, orders, reports, setActivePatientUHID, setCurrentRole } = useDiagnostic();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Patient report lookup modal state
  const [isPatientLookupOpen, setIsPatientLookupOpen] = useState(false);
  const [patientLookupInput, setPatientLookupInput] = useState('');
  const [patientLookupError, setPatientLookupError] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = login(username, password);
      setIsLoading(false);
      if (!res.success) {
        setErrorMsg(res.error || 'Invalid credentials. Please verify username and password.');
      }
    }, 250);
  };

  const handlePatientSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPatientLookupError('');
    const query = patientLookupInput.trim().toUpperCase();

    if (!query) {
      setPatientLookupError('Please enter a valid UHID or Barcode number.');
      return;
    }

    // Find order or patient
    const matchedOrder = orders.find(
      o => o.barcode.toUpperCase() === query || o.patientId.toUpperCase() === query || o.invoiceNumber.toUpperCase() === query
    );
    const matchedPatient = patients.find(p => p.id.toUpperCase() === query || p.phone.includes(query));

    if (matchedOrder || matchedPatient) {
      const uhid = matchedOrder ? matchedOrder.patientId : matchedPatient?.id;
      setActivePatientUHID(uhid);
      setCurrentRole('PATIENT');
      // Login as guest patient session
      login('patient_guest', 'patient');
    } else {
      setPatientLookupError(`No records found for "${query}". If you just registered, please check your receipt or contact the reception.`);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex flex-col justify-between selection:bg-sky-500 selection:text-white font-sans">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 py-3.5 px-4 sm:px-8 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={ATLAS_LOGO_DATA_URI}
              alt="Atlas Diagnostics Center"
              className="h-11 w-auto max-w-[52px] object-contain rounded-xl shadow-sm bg-white p-0.5 border border-slate-100"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-slate-900 tracking-tight">
                  ATLAS<span className="text-sky-600 font-semibold"> DIAGNOSTICS CENTER</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold">
                  <ShieldCheck className="w-3 h-3 text-sky-600" /> Digital LIMS / RIS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Pathology & Radiology Enterprise Management Suite
              </p>
            </div>
          </div>

          {/* Top Bar Actions: Theme Toggle & Google Sheets Status */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Google Sheets Sync Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Login Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Hero / System Info */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-100/80 text-sky-800 text-xs font-bold border border-sky-200">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              Secure Diagnostic Workstation
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Laboratory & Radiology Information System
              </h1>
              <p className="text-sm text-slate-600 mt-2.5 leading-relaxed">
                Integrated patient intake, barcoded sample accessioning, NABL-standard automated pathology, AERB radiology reporting, and enterprise MIS.
              </p>
            </div>

            {/* Enterprise Highlights List */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3.5">
              <div className="flex items-center gap-3 text-xs text-slate-700 font-semibold">
                <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span>Patient Registration, Demographic Tracking & Barcode Generation</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-700 font-semibold">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <span>Continuous Google Sheets & Multi-Device Cloud Synchronization</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-700 font-semibold">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <span>Pathology & Radiology Workstation with 1-Click WhatsApp Delivery</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-700 font-semibold">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span>Multi-Doctor Referral Commission MIS & Real-Time Financial Audits</span>
              </div>
            </div>
          </div>

          {/* Right Login Card */}
          <div className="lg:col-span-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-lg shadow-slate-200/50">
              <div className="mb-6">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Sign In to Workstation
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your username and password to access the diagnostic system
                </p>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Username */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      autoCapitalize="none"
                      autoCorrect="off"
                      value={username}
                      onChange={e => {
                        setUsername(e.target.value);
                        setErrorMsg('');
                      }}
                      placeholder="Enter username"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoCapitalize="none"
                      autoCorrect="off"
                      value={password}
                      onChange={e => {
                        setPassword(e.target.value);
                        setErrorMsg('');
                      }}
                      placeholder="Enter password"
                      className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-extrabold rounded-2xl shadow-md shadow-sky-600/20 hover:shadow-lg hover:shadow-sky-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In to Workstation</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Patient Self-Service Report Download Link */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-500 font-medium">
                  Are you a Patient looking for test results?
                </div>
                <button
                  type="button"
                  onClick={() => setIsPatientLookupOpen(true)}
                  className="text-xs font-bold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Patient Report Download</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Patient Report Lookup Modal */}
      {isPatientLookupOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Patient Report Lookup</h3>
                  <p className="text-[11px] text-slate-500">Download verified medical report</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsPatientLookupOpen(false);
                  setPatientLookupError('');
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {patientLookupError && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium">
                {patientLookupError}
              </div>
            )}

            <form onSubmit={handlePatientSearch} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Enter UHID / Barcode / Invoice No
                </label>
                <input
                  type="text"
                  value={patientLookupInput}
                  onChange={e => setPatientLookupInput(e.target.value)}
                  placeholder="e.g. UHID-2026-101 or BC-987654"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 uppercase"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPatientLookupOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
                >
                  Find Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Atlas Diagnostics Center</span>
            <span>•</span>
            <span>Clean Operational Instance</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            Connected via Embedded Google Apps Script Engine
          </div>
        </div>
      </footer>
    </div>
  );
};
