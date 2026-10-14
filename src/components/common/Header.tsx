import React, { useState } from 'react';
import {
  Activity,
  Building2,
  Crown,
  UserPlus,
  Stethoscope,
  HeartHandshake,
  User,
  ChevronDown,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  MapPin,
  Lock,
  FileSpreadsheet,
  Zap,
  CheckCircle2,
  Users,
  LogOut,
  Briefcase,
  FlaskConical
} from 'lucide-react';
import { useDiagnostic } from '../../context/DiagnosticContext';
import { UserRole } from '../../types';
import { ThemeToggle } from './ThemeToggle';
import { ATLAS_LOGO_DATA_URI } from '../../assets/logo';

export const Header: React.FC = () => {
  const {
    currentUser,
    logout,
    currentRole,
    setCurrentRole,
    currentStaffId,
    setCurrentStaffId,
    currentStaff,
    selectedCenter,
    setSelectedCenter,
    centers,
    isCenterLocked,
    pendingReferrers,
    pendingDeletions,
    orders
  } = useDiagnostic();

  const [isPersonaMenuOpen, setIsPersonaMenuOpen] = useState(false);

  const doctorQueueCount = orders.filter(o => o.status === 'DOCTOR_REVIEW' || o.status === 'IN_PROCESSING').length;
  const adminPendingCount = pendingReferrers.length + (pendingDeletions ? pendingDeletions.length : 0);

  const roleConfig: Record<UserRole, { label: string; icon: React.ReactNode; color: string }> = {
    SUPER_ADMIN: {
      label: 'Super Admin',
      icon: <Crown className="w-3.5 h-3.5" />,
      color: 'bg-amber-500 text-white shadow-xs'
    },
    CENTER_MANAGER: {
      label: 'Center Manager',
      icon: <Briefcase className="w-3.5 h-3.5" />,
      color: 'bg-teal-600 text-white shadow-xs'
    },
    RECEPTIONIST: {
      label: 'Reception Desk',
      icon: <UserPlus className="w-3.5 h-3.5" />,
      color: 'bg-sky-600 text-white shadow-xs'
    },
    DIAGNOSTIC_DOCTOR: {
      label: 'Doctor Workstation',
      icon: <Stethoscope className="w-3.5 h-3.5" />,
      color: 'bg-emerald-600 text-white shadow-xs'
    },
    LAB_TECHNICIAN: {
      label: 'Lab Technician',
      icon: <FlaskConical className="w-3.5 h-3.5" />,
      color: 'bg-emerald-600 text-white shadow-xs'
    },
    REFERRING_DOCTOR: {
      label: 'Referring Partner',
      icon: <HeartHandshake className="w-3.5 h-3.5" />,
      color: 'bg-emerald-600 text-white shadow-xs'
    },
    PATIENT: {
      label: 'Patients Portal',
      icon: <Users className="w-3.5 h-3.5" />,
      color: 'bg-indigo-600 text-white shadow-xs'
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <img
              src={ATLAS_LOGO_DATA_URI}
              alt="Atlas Diagnostics Center"
              className="h-10 w-auto max-w-[48px] object-contain rounded-lg shadow-xs bg-white p-0.5 border border-slate-100"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                  ATLAS<span className="text-sky-600 font-semibold"> DIAGNOSTICS CENTER</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[9px] font-bold">
                  <ShieldCheck className="w-2.5 h-2.5 text-sky-600" /> Digital LIMS / RIS
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium hidden sm:block leading-tight">
                <span className="font-bold text-sky-700 uppercase tracking-wider">clearity in every image...!</span> • Pathology & Radiology Management Suite
              </p>
            </div>
          </div>

          {/* Center / Branch Badge */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            {isCenterLocked ? (
              <div className="flex items-center gap-2 bg-sky-50/80 border border-sky-200 px-3 py-1.5 rounded-2xl text-xs">
                <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
                <div className="flex flex-col text-left">
                  <span className="text-[9px] uppercase font-bold text-sky-800 leading-none">
                    Active Center
                  </span>
                  <span className="font-extrabold text-slate-900 text-xs mt-0.5 whitespace-nowrap">
                    {selectedCenter.code} ({selectedCenter.name.split(' - ')[1]?.split(' ')[0] || 'Main Hub'})
                  </span>
                </div>
                <span className="ml-1 p-1 bg-sky-200/70 rounded-md text-sky-800" title="Center locked to staff profile">
                  <Lock className="w-3 h-3" />
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-2xl text-xs">
                <MapPin className="w-4 h-4 text-sky-600" />
                <span className="text-slate-500 font-bold">Branch:</span>
                <select
                  value={selectedCenter.id}
                  onChange={e => {
                    const found = centers.find(c => c.id === e.target.value);
                    if (found) setSelectedCenter(found);
                  }}
                  className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer"
                >
                  {centers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.isMain ? '(Main Hub)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Right Actions: Theme Toggle, Quick Invoice, Role Views, User Badge & Logout */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Dark Mode / Light Mode Toggle */}
            <ThemeToggle className="py-1 px-2.5 rounded-xl text-xs" />

            {/* Quick Invoice Button for Center Manager */}
            {currentUser?.role === 'CENTER_MANAGER' && (
              currentRole === 'CENTER_MANAGER' ? (
                <button
                  type="button"
                  onClick={() => setCurrentRole('RECEPTIONIST')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-all active:scale-95"
                  title="Create Patient Invoices, Book Appointments & Manage Billing"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Make Invoice</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setCurrentRole('CENTER_MANAGER')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-all active:scale-95"
                  title="Return to Center Manager Dashboard"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Back to Manager</span>
                </button>
              )
            )}

            {/* Admin / Manager Persona Switcher Dropdown */}
            {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'CENTER_MANAGER') ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsPersonaMenuOpen(prev => !prev)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                    roleConfig[currentRole]?.color || 'bg-slate-100 text-slate-800'
                  }`}
                  title="Switch Workstation Persona"
                >
                  {roleConfig[currentRole]?.icon}
                  <span>{roleConfig[currentRole]?.label}</span>
                  {(adminPendingCount > 0 || doctorQueueCount > 0) && (
                    <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping" />
                  )}
                  <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                </button>

                {/* Persona Switcher Dropdown Menu */}
                {isPersonaMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsPersonaMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 z-50 animate-fade-in space-y-1">
                      <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                        Switch Workstation View
                      </div>
                      {(currentUser.role === 'SUPER_ADMIN'
                        ? (['SUPER_ADMIN', 'CENTER_MANAGER', 'RECEPTIONIST', 'LAB_TECHNICIAN', 'PATIENT'] as UserRole[])
                        : (['CENTER_MANAGER', 'RECEPTIONIST', 'LAB_TECHNICIAN', 'PATIENT'] as UserRole[])
                      ).map(role => {
                        const config = roleConfig[role];
                        const isActive = currentRole === role;
                        const hasPending = role === 'SUPER_ADMIN' && adminPendingCount > 0;
                        const hasQueue = (role === 'DIAGNOSTIC_DOCTOR' || role === 'LAB_TECHNICIAN') && doctorQueueCount > 0;

                        return (
                          <button
                            key={role}
                            type="button"
                            onClick={() => {
                              setCurrentRole(role);
                              setIsPersonaMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isActive
                                ? 'bg-sky-50 text-sky-900 border border-sky-200'
                                : 'text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`p-1.5 rounded-lg ${config.color}`}>
                                {config.icon}
                              </span>
                              <span>{config.label}</span>
                            </div>

                            {hasPending && (
                              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-black text-[9px] animate-pulse">
                                {adminPendingCount}
                              </span>
                            )}
                            {hasQueue && (
                              <span className="px-1.5 py-0.5 rounded-full bg-cyan-600 text-white font-black text-[9px]">
                                {doctorQueueCount}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Non-Admin User Badge */
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-xl text-xs">
                <div className="w-5 h-5 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center text-[9px]">
                  {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-extrabold text-slate-900 leading-tight text-xs">
                    {currentUser?.name || 'User'}
                  </span>
                  <span className="text-[9px] text-slate-500 leading-none">
                    {currentUser?.designation || currentUser?.role}
                  </span>
                </div>
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={() => {
                if (confirm('Are you sure you want to sign out?')) {
                  logout();
                }
              }}
              title="Sign Out"
              className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <LogOut className="w-3 h-3 text-rose-600" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
