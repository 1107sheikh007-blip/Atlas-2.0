import React, { useState, useMemo, useEffect } from 'react';
import {
  Stethoscope,
  Clock,
  Calendar,
  Building2,
  Phone,
  MessageCircle,
  Share2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Users,
  Edit3,
  Trash2,
  Lock,
  Eye,
  ShieldCheck,
  X,
  ExternalLink,
  MapPin,
  Sparkles,
  ChevronRight,
  UserCheck,
  HeartPulse
} from 'lucide-react';
import { useDiagnostic } from '../../context/DiagnosticContext';
import { DoctorRosterItem, DoctorShiftType, DoctorDutyStatus, CenterBranch, ReferringDoctor } from '../../types';
import { DoctorWhatsAppModal } from './DoctorWhatsAppModal';

export const DoctorRosterTab: React.FC = () => {
  const {
    currentUser,
    doctorRoster,
    addDoctorToRoster,
    updateDoctorRoster,
    deleteDoctorFromRoster,
    getDoctorWhatsAppUrl,
    selectedCenter,
    centers,
    referrers,
    sendWelcomeDoctorWhatsApp,
    approveReferringDoctor,
    updateReferringDoctor,
    deleteReferringDoctor
  } = useDiagnostic();

  // Role Security Check: Visible strictly to Super Admin and Center Manager
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isManager = currentUser?.role === 'CENTER_MANAGER';
  const canAccess = isSuperAdmin || isManager;

  // View state
  const [activeSubView, setActiveSubView] = useState<'DUTY_ROSTER' | 'WEEKLY_MATRIX' | 'REFERRING_PARTNERS'>('DUTY_ROSTER');
  const [viewLayout, setViewLayout] = useState<'CARDS' | 'TABLE'>('CARDS');

  // Center filter (Super Admin can select ALL or a specific center; Manager locked to their center)
  const [centerFilter, setCenterFilter] = useState<string>(isManager ? selectedCenter.id : 'ALL');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [shiftFilter, setShiftFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dayFilter, setDayFilter] = useState<string>('ALL');

  // Modals state
  const [whatsAppDoctor, setWhatsAppDoctor] = useState<DoctorRosterItem | null>(null);
  const [editingDoctor, setEditingDoctor] = useState<DoctorRosterItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [whatsAppPartner, setWhatsAppPartner] = useState<ReferringDoctor | null>(null);
  const [partnerDoctorModal, setPartnerDoctorModal] = useState<{
    doc: ReferringDoctor;
    isApproveMode: boolean;
  } | null>(null);
  const [refDocName, setRefDocName] = useState('');
  const [refDocQual, setRefDocQual] = useState('');
  const [refDocSpec, setRefDocSpec] = useState('');
  const [refDocHospital, setRefDocHospital] = useState('');
  const [refDocPhone, setRefDocPhone] = useState('');
  const [refDocEmail, setRefDocEmail] = useState('');
  const [refDocRegNo, setRefDocRegNo] = useState('');
  const [refDocAffiliation, setRefDocAffiliation] = useState<'SELF' | 'ORGANIZATION'>('SELF');
  const [refDocOrgName, setRefDocOrgName] = useState('');
  const [refDocNotes, setRefDocNotes] = useState('');

  const openPartnerDoctorModal = (doc: ReferringDoctor, isApprove: boolean) => {
    setPartnerDoctorModal({ doc, isApproveMode: isApprove });
    setRefDocName(doc.name || '');
    setRefDocQual(doc.qualification || '');
    setRefDocSpec(doc.specialty || '');
    setRefDocHospital(doc.hospital || '');
    setRefDocPhone(doc.phone || '');
    setRefDocEmail(doc.email || '');
    setRefDocRegNo(doc.registrationNo || '');
    setRefDocAffiliation(doc.affiliationType || 'SELF');
    setRefDocOrgName(doc.organizationName || '');
    setRefDocNotes(doc.notes || '');
  };

  const handleSavePartnerDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerDoctorModal) return;
    const { doc, isApproveMode } = partnerDoctorModal;
    const updatedData: Partial<ReferringDoctor> = {
      name: refDocName.trim() || doc.name,
      qualification: refDocQual.trim(),
      specialty: refDocSpec.trim(),
      hospital: refDocHospital.trim(),
      phone: refDocPhone.trim() || doc.phone,
      email: refDocEmail.trim(),
      registrationNo: refDocRegNo.trim() || undefined,
      affiliationType: refDocAffiliation,
      organizationName: refDocAffiliation === 'ORGANIZATION' ? refDocOrgName.trim() : undefined,
      notes: refDocNotes.trim() || undefined
    };

    if (isApproveMode) {
      approveReferringDoctor(doc.id, 0, updatedData);
      showToast(`${refDocName || doc.name} approved & added to roster!`);
    } else {
      if (updateReferringDoctor) {
        updateReferringDoctor(doc.id, updatedData);
      }
      showToast(`Updated profile for ${refDocName || doc.name}`);
    }
    setPartnerDoctorModal(null);
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Today's day name in English
  const todayName = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  }, []);

  // Center Scoped Roster
  const scopedRoster = useMemo(() => {
    if (isManager) {
      return doctorRoster.filter(
        d => d.centerId === selectedCenter.id || d.centerCode === selectedCenter.code || !d.centerId
      );
    }
    if (centerFilter !== 'ALL') {
      return doctorRoster.filter(
        d => d.centerId === centerFilter || (centers.find(c => c.id === centerFilter)?.code === d.centerCode)
      );
    }
    return doctorRoster;
  }, [doctorRoster, isManager, selectedCenter, centerFilter, centers]);

  // Filtered Roster list
  const filteredRoster = useMemo(() => {
    return scopedRoster.filter(doc => {
      // 1. Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = doc.name.toLowerCase().includes(q);
        const matchSpec = doc.specialty.toLowerCase().includes(q);
        const matchDept = doc.department.toLowerCase().includes(q);
        const matchPhone = doc.phone.replace(/[^0-9]/g, '').includes(q.replace(/[^0-9]/g, ''));
        const matchReg = (doc.registrationNo || '').toLowerCase().includes(q);
        if (!matchName && !matchSpec && !matchDept && !matchPhone && !matchReg) return false;
      }

      // 2. Department filter
      if (deptFilter !== 'ALL' && doc.department !== deptFilter) return false;

      // 3. Shift filter
      if (shiftFilter !== 'ALL' && !doc.shift.toLowerCase().includes(shiftFilter.toLowerCase())) return false;

      // 4. Status filter
      if (statusFilter !== 'ALL' && doc.status !== statusFilter) return false;

      // 5. Day of week filter
      if (dayFilter === 'TODAY') {
        if (!doc.workingDays.includes(todayName)) return false;
      } else if (dayFilter !== 'ALL') {
        if (!doc.workingDays.includes(dayFilter)) return false;
      }

      return true;
    });
  }, [scopedRoster, searchQuery, deptFilter, shiftFilter, statusFilter, dayFilter, todayName]);

  // Metrics computation
  const metrics = useMemo(() => {
    const total = scopedRoster.length;
    const onDutyToday = scopedRoster.filter(d => d.workingDays.includes(todayName) && d.status === 'ON_DUTY').length;
    const onCall = scopedRoster.filter(d => d.status === 'AVAILABLE_ON_CALL' || d.emergencyAvailable).length;
    const depts = new Set(scopedRoster.map(d => d.department)).size;
    return { total, onDutyToday, onCall, depts };
  }, [scopedRoster, todayName]);

  // Unique departments for filter
  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    doctorRoster.forEach(d => {
      if (d.department) set.add(d.department);
    });
    return Array.from(set).sort();
  }, [doctorRoster]);

  // All week days
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const PRESET_DOCTOR_SHIFTS: DoctorShiftType[] = [
    'Morning (8:00 AM - 2:00 PM)',
    'Evening (2:00 PM - 8:00 PM)',
    'Night (8:00 PM - 8:00 AM)',
    'Full Day (9:00 AM - 6:00 PM)',
    'On-Call (24x7 Emergency)',
    'Visiting Consultant (By Appointment)'
  ];

  // Add Doctor Form State
  const [newDocName, setNewDocName] = useState('');
  const [newDocQual, setNewDocQual] = useState('');
  const [newDocSpec, setNewDocSpec] = useState('');
  const [newDocDept, setNewDocDept] = useState('Radiology & Imaging');
  const [newDocPhone, setNewDocPhone] = useState('');
  const [newDocEmail, setNewDocEmail] = useState('');
  const [newDocReg, setNewDocReg] = useState('');
  const [newDocShift, setNewDocShift] = useState<string>('Morning (8:00 AM - 2:00 PM)');
  const [newDocCustomShift, setNewDocCustomShift] = useState('');
  const [newDocDays, setNewDocDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
  const [newDocStatus, setNewDocStatus] = useState<DoctorDutyStatus>('ON_DUTY');
  const [newDocRoom, setNewDocRoom] = useState('');
  const [newDocCenterId, setNewDocCenterId] = useState(selectedCenter.id);
  const [newDocNotes, setNewDocNotes] = useState('');

  const resetAddForm = () => {
    setNewDocName('');
    setNewDocQual('');
    setNewDocSpec('');
    setNewDocDept('Radiology & Imaging');
    setNewDocPhone('');
    setNewDocEmail('');
    setNewDocReg('');
    setNewDocShift('Morning (8:00 AM - 2:00 PM)');
    setNewDocCustomShift('');
    setNewDocDays(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
    setNewDocStatus('ON_DUTY');
    setNewDocRoom('');
    setNewDocCenterId(selectedCenter.id);
    setNewDocNotes('');
  };

  const handleCreateDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim() || !newDocPhone.trim()) {
      alert('Please provide Doctor Name and Mobile Number.');
      return;
    }

    const finalShift = newDocShift === 'CUSTOM'
      ? (newDocCustomShift.trim() || 'Custom Shift')
      : newDocShift;

    const created = addDoctorToRoster({
      name: newDocName.trim().startsWith('Dr.') ? newDocName.trim() : `Dr. ${newDocName.trim()}`,
      qualification: newDocQual.trim(),
      specialty: newDocSpec.trim() || newDocDept,
      department: newDocDept,
      phone: newDocPhone.trim(),
      email: newDocEmail.trim() || undefined,
      registrationNo: newDocReg.trim(),
      centerId: newDocCenterId,
      shift: finalShift as DoctorShiftType,
      workingDays: newDocDays.length > 0 ? newDocDays : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      status: newDocStatus,
      roomNo: newDocRoom.trim(),
      roleType: 'RESIDENT_PATHOLOGIST',
      emergencyAvailable: true,
      notes: newDocNotes.trim() || undefined
    });

    showToast(`Added ${created.name} to the Doctor Duty Roster!`);
    setIsAddModalOpen(false);
    resetAddForm();
  };

  // Edit Doctor Form State (Super Admin can edit ALL fields)
  const [editDocName, setEditDocName] = useState('');
  const [editDocQual, setEditDocQual] = useState('');
  const [editDocSpec, setEditDocSpec] = useState('');
  const [editDocDept, setEditDocDept] = useState('');
  const [editDocPhone, setEditDocPhone] = useState('');
  const [editDocEmail, setEditDocEmail] = useState('');
  const [editDocReg, setEditDocReg] = useState('');
  const [editDocShift, setEditDocShift] = useState<string>('Morning (8:00 AM - 2:00 PM)');
  const [editDocCustomShift, setEditDocCustomShift] = useState('');
  const [editDocDays, setEditDocDays] = useState<string[]>([]);
  const [editDocStatus, setEditDocStatus] = useState<DoctorDutyStatus>('ON_DUTY');
  const [editDocRoom, setEditDocRoom] = useState('');
  const [editDocCenterId, setEditDocCenterId] = useState('');
  const [editDocNotes, setEditDocNotes] = useState('');

  const openEditDoctor = (doc: DoctorRosterItem) => {
    setEditingDoctor(doc);
    setEditDocName(doc.name);
    setEditDocQual(doc.qualification || '');
    setEditDocSpec(doc.specialty || '');
    setEditDocDept(doc.department || 'Radiology & Imaging');
    setEditDocPhone(doc.phone || '');
    setEditDocEmail(doc.email || '');
    setEditDocReg(doc.registrationNo || '');
    if (PRESET_DOCTOR_SHIFTS.includes(doc.shift as DoctorShiftType)) {
      setEditDocShift(doc.shift);
      setEditDocCustomShift('');
    } else {
      setEditDocShift('CUSTOM');
      setEditDocCustomShift(doc.shift || '');
    }
    setEditDocDays([...doc.workingDays]);
    setEditDocStatus(doc.status);
    setEditDocRoom(doc.roomNo || '');
    setEditDocCenterId(doc.centerId || selectedCenter.id);
    setEditDocNotes(doc.notes || '');
  };

  const handleSaveEditDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;

    const finalShift = editDocShift === 'CUSTOM'
      ? (editDocCustomShift.trim() || 'Custom Shift')
      : editDocShift;

    updateDoctorRoster(editingDoctor.id, {
      name: editDocName.trim(),
      qualification: editDocQual.trim(),
      specialty: editDocSpec.trim(),
      department: editDocDept.trim(),
      phone: editDocPhone.trim(),
      email: editDocEmail.trim() || undefined,
      registrationNo: editDocReg.trim(),
      shift: finalShift as DoctorShiftType,
      workingDays: editDocDays,
      status: editDocStatus,
      roomNo: editDocRoom.trim(),
      centerId: editDocCenterId || editingDoctor.centerId,
      notes: editDocNotes.trim() || undefined
    });

    showToast(`Updated complete doctor profile & schedule for ${editDocName}`);
    setEditingDoctor(null);
  };

  const toggleEditDay = (day: string) => {
    setEditDocDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const toggleNewDay = (day: string) => {
    setNewDocDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  // Keyboard ESC listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setWhatsAppDoctor(null);
        setEditingDoctor(null);
        setIsAddModalOpen(false);
        setWhatsAppPartner(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Access Guard
  if (!canAccess) {
    return (
      <div className="max-w-lg mx-auto my-16 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-4 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">
          Doctor's Roster Restricted
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          The Doctor Duty Roster is restricted strictly to <strong>Super Administrators</strong> and <strong>Center Managers</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-800 text-xs font-bold animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-teal-200 text-xs font-bold backdrop-blur-xs border border-white/10">
              <Stethoscope className="w-4 h-4 text-teal-400" />
              <span>Doctor Duty Roster & Clinical Operations</span>
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              <span className="text-emerald-400 font-extrabold">
                {isSuperAdmin ? 'Master Enterprise View' : `Manager Scoped (${selectedCenter.code})`}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Doctors Shift Roster & 1-Click WhatsApp Hub
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Real-time consultant schedule, emergency on-call specialists, cabin allocation, and direct 1-click WhatsApp messaging for critical lab alerts and duty shifts.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 active:scale-95 text-white text-xs font-bold rounded-2xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Doctor to Roster</span>
            </button>
          </div>
        </div>

        {/* Real-Time Live Shift Strip */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-teal-200">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-400 shrink-0" />
            <span>
              Active Day Schedule: <strong className="text-white underline">{todayName}</strong>
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-emerald-300 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              {metrics.onDutyToday} Doctors On Duty Today
            </span>
            <span className="text-sky-300 font-semibold">
              ⚡ {metrics.onCall} Available On-Call
            </span>
          </div>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Doctors
            </span>
            <Users className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-800 dark:text-white">{metrics.total}</span>
            <span className="text-[11px] font-semibold text-slate-500">In Clinical Roster</span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
              On Duty Today
            </span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{metrics.onDutyToday}</span>
            <span className="text-[11px] font-semibold text-emerald-600">{todayName} Slots</span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
              On-Call Specialists
            </span>
            <HeartPulse className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-700 dark:text-amber-400">{metrics.onCall}</span>
            <span className="text-[11px] font-semibold text-amber-600">Emergency 24x7</span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600">
              Departments Covered
            </span>
            <Building2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-teal-700 dark:text-teal-400">{metrics.depts}</span>
            <span className="text-[11px] font-semibold text-teal-600">Lab & Imaging</span>
          </div>
        </div>
      </div>

      {/* Main Roster Sub-View Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveSubView('DUTY_ROSTER')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubView === 'DUTY_ROSTER'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Doctor Duty Roster ({scopedRoster.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubView('WEEKLY_MATRIX')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubView === 'WEEKLY_MATRIX'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Weekly Shift Matrix</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubView('REFERRING_PARTNERS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubView === 'REFERRING_PARTNERS'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Referring Partner Doctors ({referrers.length})</span>
          </button>
        </div>

        {/* View Layout Toggle: Cards vs Table */}
        {activeSubView === 'DUTY_ROSTER' && (
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewLayout('CARDS')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewLayout === 'CARDS'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Cards
            </button>
            <button
              type="button"
              onClick={() => setViewLayout('TABLE')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewLayout === 'TABLE'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Table
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SUB-VIEW 1: DOCTOR DUTY ROSTER                                            */}
      {/* ========================================================================= */}
      {activeSubView === 'DUTY_ROSTER' && (
        <div className="space-y-4">
          {/* Controls: Search, Center, Department, Shift, Status, Day Filter */}
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search doctor by name, specialty, mobile, department, or reg no..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-10 py-2.5 text-xs font-semibold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Super Admin Center Filter */}
              {isSuperAdmin && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 shrink-0">Center:</span>
                  <select
                    value={centerFilter}
                    onChange={e => setCenterFilter(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="ALL">All Diagnostic Centers ({centers.length})</option>
                    {centers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Day Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 shrink-0">Day:</span>
                <select
                  value={dayFilter}
                  onChange={e => setDayFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="TODAY">Today ({todayName})</option>
                  <option value="ALL">All 7 Days</option>
                  {weekDays.map(d => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Department:
              </span>
              <button
                type="button"
                onClick={() => setDeptFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  deptFilter === 'ALL'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                All Departments
              </button>
              {departmentsList.map(dept => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setDeptFilter(dept)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    deptFilter === dept
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {dept}
                </button>
              ))}

              {/* Status Filter Pills */}
              <div className="ml-auto flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-400 mr-1">Status:</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-200"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ON_DUTY">On Duty Now</option>
                  <option value="AVAILABLE_ON_CALL">Available On-Call</option>
                  <option value="OFF_DUTY">Off Duty</option>
                  <option value="ON_LEAVE">On Leave</option>
                </select>
              </div>
            </div>
          </div>

          {/* Doctors List: Cards vs Table View */}
          {scopedRoster.length === 0 ? (
            <div className="p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 mx-auto flex items-center justify-center">
                <Stethoscope className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">
                No Doctors in Roster Yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                The doctor roster is currently empty. Click below to add your center's radiologists, pathologists, or consultant specialists.
              </p>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="mt-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Doctor to Roster</span>
              </button>
            </div>
          ) : filteredRoster.length === 0 ? (
            <div className="p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">
                No Matching Doctors Found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No doctors match your active search query or shift filters. Try clearing your filters or add a new doctor.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setDeptFilter('ALL');
                  setShiftFilter('ALL');
                  setStatusFilter('ALL');
                  setDayFilter('ALL');
                }}
                className="px-4 py-2 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : viewLayout === 'CARDS' ? (
            /* DOCTOR CARDS GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRoster.map(doc => {
                const isOnDutyToday = doc.workingDays.includes(todayName);
                const statusColor =
                  doc.status === 'ON_DUTY'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : doc.status === 'AVAILABLE_ON_CALL'
                    ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                    : doc.status === 'ON_LEAVE'
                    ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300'
                    : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300';

                return (
                  <div
                    key={doc.id}
                    className="p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between group space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Card Top: Department & Status Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 text-[10px] font-extrabold uppercase tracking-wider border border-teal-200/60 dark:border-teal-800/40 truncate">
                          {doc.department}
                        </span>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${statusColor}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              doc.status === 'ON_DUTY'
                                ? 'bg-emerald-500 animate-pulse'
                                : doc.status === 'AVAILABLE_ON_CALL'
                                ? 'bg-amber-500'
                                : 'bg-slate-400'
                            }`}
                          />
                          {doc.status.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Doctor Profile Header */}
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-sky-600 text-white font-black flex items-center justify-center text-base shadow-sm shrink-0">
                          {doc.name.replace('Dr. ', '').charAt(0) || 'D'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-black text-slate-900 dark:text-white text-sm group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors truncate">
                            {doc.name}
                          </h3>
                          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                            {doc.qualification}
                          </p>
                          <p className="text-[11px] text-teal-700 dark:text-teal-400 font-medium truncate mt-0.5">
                            {doc.specialty}
                          </p>
                        </div>
                      </div>

                      {/* Doctor Operational Details */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-2 text-xs border border-slate-100 dark:border-slate-800">
                        {/* Shift & Time */}
                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                          <span className="flex items-center gap-1.5 font-medium text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            Shift Timing:
                          </span>
                          <span className="font-bold text-[11px] text-slate-900 dark:text-white">
                            {doc.shift}
                          </span>
                        </div>

                        {/* Room / Suite */}
                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                          <span className="flex items-center gap-1.5 font-medium text-[11px]">
                            <Building2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                            Cabin / Suite:
                          </span>
                          <span className="font-bold text-[11px] text-slate-900 dark:text-white truncate max-w-[170px]">
                            {doc.roomNo || 'Main Suite'}
                          </span>
                        </div>

                        {/* Phone */}
                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                          <span className="flex items-center gap-1.5 font-medium text-[11px]">
                            <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            Direct Mobile:
                          </span>
                          <span className="font-mono font-bold text-[11px] text-slate-900 dark:text-white">
                            {doc.phone}
                          </span>
                        </div>
                      </div>

                      {/* Working Days Chips */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Working Days:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {weekDays.map(day => {
                            const isWorking = doc.workingDays.includes(day);
                            const isToday = day === todayName;
                            return (
                              <span
                                key={day}
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  isToday && isWorking
                                    ? 'bg-emerald-600 text-white ring-1 ring-emerald-400'
                                    : isWorking
                                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 line-through'
                                }`}
                                title={isToday && isWorking ? 'On Duty Today' : day}
                              >
                                {day.slice(0, 3)}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Card Actions: WhatsApp, Edit, Call, Delete */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      {/* WhatsApp Connect Button */}
                      <button
                        type="button"
                        onClick={() => setWhatsAppDoctor(doc)}
                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Connect with Doctor via WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>

                      {/* Direct Call Anchor */}
                      <a
                        href={`tel:${doc.phone.replace(/[^0-9]/g, '')}`}
                        className="p-2 bg-slate-100 hover:bg-sky-50 dark:bg-slate-800 text-slate-700 hover:text-sky-700 rounded-xl transition-all cursor-pointer"
                        title="Direct Phone Call"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>

                      {/* Edit Duty Roster Button */}
                      <button
                        type="button"
                        onClick={() => openEditDoctor(doc)}
                        className="p-2 bg-slate-100 hover:bg-teal-50 dark:bg-slate-800 text-slate-700 hover:text-teal-700 rounded-xl transition-all cursor-pointer"
                        title="Edit Duty Roster Schedule"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button (Super Admin / Center Manager) */}
                      {canAccess && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Remove ${doc.name} from the active Doctor Roster?`)) {
                              deleteDoctorFromRoster(doc.id);
                              showToast(`Removed ${doc.name} from roster`);
                            }
                          }}
                          className="p-2 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl transition-all cursor-pointer"
                          title="Remove Doctor from Roster"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TABLE LEDGER VIEW */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Doctor Details</th>
                      <th className="py-3 px-4">Department & Specialty</th>
                      <th className="py-3 px-4">Shift & Timings</th>
                      <th className="py-3 px-4">Room / Suite</th>
                      <th className="py-3 px-4">Working Days</th>
                      <th className="py-3 px-4">Duty Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredRoster.map(doc => {
                      const isOnDutyToday = doc.workingDays.includes(todayName);
                      return (
                        <tr key={doc.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 font-bold flex items-center justify-center shrink-0">
                                {doc.name.replace('Dr. ', '').charAt(0)}
                              </div>
                              <div>
                                <strong className="font-bold text-slate-900 dark:text-white block text-sm">
                                  {doc.name}
                                </strong>
                                <span className="text-[11px] text-slate-500 block">
                                  {doc.qualification}
                                </span>
                                <span className="text-[10px] font-mono text-teal-700 block mt-0.5">
                                  📞 {doc.phone}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <strong className="font-bold text-slate-800 dark:text-slate-200 block">
                              {doc.department}
                            </strong>
                            <span className="text-[11px] text-slate-500">
                              {doc.specialty}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-teal-600" />
                              <span>{doc.shift}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                            {doc.roomNo || 'Main Suite'}
                          </td>

                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="flex flex-wrap gap-1">
                              {doc.workingDays.map(d => (
                                <span
                                  key={d}
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                    d === todayName
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  {d.slice(0, 3)}
                                </span>
                              ))}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1.5 ${
                                doc.status === 'ON_DUTY'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : doc.status === 'AVAILABLE_ON_CALL'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  doc.status === 'ON_DUTY' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                                }`}
                              />
                              {doc.status.replace('_', ' ')}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setWhatsAppDoctor(doc)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                                title="Open WhatsApp Chat"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>WhatsApp</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => openEditDoctor(doc)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                                title="Edit Doctor"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {canAccess && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`Remove ${doc.name} from the active Doctor Roster?`)) {
                                      deleteDoctorFromRoster(doc.id);
                                      showToast(`Removed ${doc.name} from roster`);
                                    }
                                  }}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:text-rose-700 rounded-xl transition-all cursor-pointer"
                                  title="Remove Doctor from Roster"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 2: WEEKLY SHIFT MATRIX (VISUAL SCHEDULE GRID)                    */}
      {/* ========================================================================= */}
      {activeSubView === 'WEEKLY_MATRIX' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                Weekly Doctor Shift & Modality Coverage Matrix
              </h3>
              <p className="text-xs text-slate-500">
                Visual day-by-day consultant duty allocation across morning, evening, and emergency night shifts.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Active Center:</span>
              <span className="px-3 py-1.5 bg-teal-50 text-teal-800 font-bold rounded-xl text-xs border border-teal-200">
                {selectedCenter.name} ({selectedCenter.code})
              </span>
            </div>
          </div>

          {/* Weekly Columns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {weekDays.map(day => {
              const isToday = day === todayName;
              const doctorsOnDay = scopedRoster.filter(d => d.workingDays.includes(day));

              return (
                <div
                  key={day}
                  className={`rounded-2xl border p-3.5 space-y-3 transition-all ${
                    isToday
                      ? 'bg-teal-50/50 dark:bg-teal-950/30 border-teal-400 dark:border-teal-700 ring-2 ring-teal-500/20'
                      : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                    <div>
                      <span className="font-extrabold text-slate-900 dark:text-white text-xs block">
                        {day}
                      </span>
                      {isToday && (
                        <span className="text-[9px] font-black uppercase text-teal-700 dark:text-teal-400 tracking-wider">
                          ● Today
                        </span>
                      )}
                    </div>
                    <span className="px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px]">
                      {doctorsOnDay.length}
                    </span>
                  </div>

                  {/* Doctors scheduled on this day */}
                  <div className="space-y-2">
                    {doctorsOnDay.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic text-center py-4">
                        On-Call Roster Only
                      </p>
                    ) : (
                      doctorsOnDay.map(doc => (
                        <div
                          key={doc.id}
                          className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs hover:shadow-xs transition-all space-y-1 group"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-slate-900 dark:text-white text-[11px] truncate">
                              {doc.name.replace('Dr. ', '')}
                            </span>
                            <button
                              type="button"
                              onClick={() => setWhatsAppDoctor(doc)}
                              className="text-emerald-600 hover:text-emerald-700 p-0.5"
                              title="WhatsApp Message"
                            >
                              <MessageCircle className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {doc.department}
                          </div>

                          <div className="text-[9px] font-semibold text-teal-700 dark:text-teal-400 truncate">
                            {doc.shift.split('(')[0].trim()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 3: REFERRING PARTNER DOCTORS DIRECTORY                           */}
      {/* ========================================================================= */}
      {activeSubView === 'REFERRING_PARTNERS' && (
        <div className="space-y-4">
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs space-y-3">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                Referring Physicians & Partner Clinics Network
              </h3>
              <p className="text-xs text-slate-500">
                Connected referring doctors who prescribe patients to Atlas Diagnostics. Connect instantly with them via WhatsApp.
              </p>
            </div>
          </div>

          {referrers.length === 0 ? (
            <div className="p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-3">
              <Users className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">No Referring Doctors Registered</h3>
              <p className="text-xs text-slate-500">Add referring doctors in the Doctor Approvals or Referrals workstation.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {referrers.map(ref => {
                const cleanPhone = (ref.phone || '').replace(/[^0-9]/g, '');
                return (
                  <div
                    key={ref.id}
                    className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-black text-slate-900 dark:text-white text-sm">
                          {ref.organizationName ? ref.organizationName : ref.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-semibold">{ref.qualification || 'Consultant Doctor'}</p>
                        <p className="text-[11px] text-teal-700 font-medium">{ref.specialty}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        ref.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}>
                        {ref.status === 'APPROVED' ? 'APPROVED' : 'PENDING APPROVAL'}
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-medium text-[11px]">{ref.organizationName ? 'Beneficiary Org:' : 'Clinic / Hospital:'}</span>
                        <span className="font-bold text-[11px] text-slate-900 truncate max-w-[150px]">
                          {ref.organizationName || ref.hospital || 'Private Clinic'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-medium text-[11px]">Phone:</span>
                        <span className="font-mono font-bold text-[11px] text-slate-900">{ref.phone}</span>
                      </div>
                      {ref.registrationNo && (
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="font-medium text-[11px]">Reg No:</span>
                          <span className="font-mono text-teal-700 font-bold text-[11px]">{ref.registrationNo}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      {isSuperAdmin && ref.status !== 'APPROVED' ? (
                        <button
                          type="button"
                          onClick={() => openPartnerDoctorModal(ref, true)}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Review & Approve Doctor</span>
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              const url = sendWelcomeDoctorWhatsApp(ref);
                              window.open(url, '_blank');
                            }}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </button>

                          {isSuperAdmin && (
                            <>
                              <button
                                type="button"
                                onClick={() => openPartnerDoctorModal(ref, false)}
                                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
                                title="Edit Doctor Details"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Permanently remove ${ref.name} from referring doctors network?`)) {
                                    if (deleteReferringDoctor) {
                                      deleteReferringDoctor(ref.id);
                                    }
                                    showToast(`Removed referring doctor ${ref.name}`);
                                  }
                                }}
                                className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl cursor-pointer transition-colors"
                                title="Delete Referring Doctor"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </>
                      )}

                      <a
                        href={`tel:${cleanPhone}`}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
                        title="Call"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: WHATSAPP CONNECT DIALOG                                          */}
      {/* ========================================================================= */}
      {whatsAppDoctor && (
        <DoctorWhatsAppModal
          doctor={whatsAppDoctor}
          center={selectedCenter}
          onClose={() => setWhatsAppDoctor(null)}
          onGetWhatsAppUrl={getDoctorWhatsAppUrl}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD DOCTOR TO ROSTER                                             */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="fixed inset-0" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 animate-scale-up my-8">
            <div className="bg-gradient-to-r from-teal-700 to-sky-800 p-6 text-white relative">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black">Add Doctor to Duty Roster</h3>
                  <p className="text-xs text-teal-100">Register in-house consultant, radiologist, or pathologist schedule</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateDoctor} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newDocName}
                    onChange={e => setNewDocName(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Sharma"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Qualifications</label>
                  <input
                    type="text"
                    value={newDocQual}
                    onChange={e => setNewDocQual(e.target.value)}
                    placeholder="e.g. MBBS, MD (Radiology), DMRD"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department *</label>
                  <select
                    value={newDocDept}
                    onChange={e => setNewDocDept(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Radiology & Imaging">Radiology & Imaging</option>
                    <option value="Pathology & Hematology">Pathology & Hematology</option>
                    <option value="Cardiology & Echo">Cardiology & Echo</option>
                    <option value="Microbiology & Serology">Microbiology & Serology</option>
                    <option value="Biochemistry & Molecular">Biochemistry & Molecular</option>
                    <option value="General Consultation">General Consultation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Specialty</label>
                  <input
                    type="text"
                    value={newDocSpec}
                    onChange={e => setNewDocSpec(e.target.value)}
                    placeholder="e.g. Consultant Radiologist & Sonologist"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Direct Mobile Number (WhatsApp) *</label>
                  <input
                    type="tel"
                    required
                    value={newDocPhone}
                    onChange={e => setNewDocPhone(e.target.value)}
                    placeholder="e.g. 9826012345"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Medical Council Reg. No</label>
                  <input
                    type="text"
                    value={newDocReg}
                    onChange={e => setNewDocReg(e.target.value)}
                    placeholder="e.g. MPMC / 48291 / 2014"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Shift Timing *</label>
                  <select
                    value={newDocShift}
                    onChange={e => setNewDocShift(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Morning (8:00 AM - 2:00 PM)">Morning (8:00 AM - 2:00 PM)</option>
                    <option value="Evening (2:00 PM - 8:00 PM)">Evening (2:00 PM - 8:00 PM)</option>
                    <option value="Night (8:00 PM - 8:00 AM)">Night (8:00 PM - 8:00 AM)</option>
                    <option value="Full Day (9:00 AM - 6:00 PM)">Full Day (9:00 AM - 6:00 PM)</option>
                    <option value="On-Call (24x7 Emergency)">On-Call (24x7 Emergency)</option>
                    <option value="Visiting Consultant (By Appointment)">Visiting Consultant</option>
                    <option value="CUSTOM">Custom (Specify Hours)</option>
                  </select>
                  {newDocShift === 'CUSTOM' && (
                    <input
                      type="text"
                      required
                      value={newDocCustomShift}
                      onChange={e => setNewDocCustomShift(e.target.value)}
                      placeholder="e.g. 10:00 AM - 04:00 PM"
                      className="mt-2 w-full px-3 py-1.5 bg-white border border-teal-400 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duty Status *</label>
                  <select
                    value={newDocStatus}
                    onChange={e => setNewDocStatus(e.target.value as DoctorDutyStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="ON_DUTY">On Duty Now</option>
                    <option value="AVAILABLE_ON_CALL">Available On-Call</option>
                    <option value="OFF_DUTY">Off Duty</option>
                    <option value="ON_LEAVE">On Leave</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cabin / Suite</label>
                  <input
                    type="text"
                    value={newDocRoom}
                    onChange={e => setNewDocRoom(e.target.value)}
                    placeholder="e.g. Ultrasound Suite A"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Working Days Checkboxes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Scheduled Working Days:</label>
                <div className="flex flex-wrap gap-2">
                  {weekDays.map(day => {
                    const isChecked = newDocDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleNewDay(day)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-teal-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Save & Add Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EDIT DOCTOR SCHEDULE & DUTY ROSTER                              */}
      {/* ========================================================================= */}
      {editingDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="fixed inset-0" onClick={() => setEditingDoctor(null)} />
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 animate-scale-up my-8">
            <div className="bg-gradient-to-r from-teal-700 to-sky-800 p-6 text-white relative">
              <button
                type="button"
                onClick={() => setEditingDoctor(null)}
                className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black">Edit Doctor Duty Roster</h3>
                  <p className="text-xs text-teal-100">{editingDoctor.name} • {editingDoctor.specialty}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveEditDoctor} className="p-6 space-y-4">
              {/* Doctor Name & Qualifications */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editDocName}
                    onChange={e => setEditDocName(e.target.value)}
                    placeholder="e.g. Dr. Shruti Verma"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Medical Qualifications</label>
                  <input
                    type="text"
                    value={editDocQual}
                    onChange={e => setEditDocQual(e.target.value)}
                    placeholder="e.g. MBBS, MD (Radio-diagnosis)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Department & Specialty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department *</label>
                  <input
                    type="text"
                    required
                    value={editDocDept}
                    onChange={e => setEditDocDept(e.target.value)}
                    placeholder="e.g. Radiology & Imaging"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Specialty</label>
                  <input
                    type="text"
                    value={editDocSpec}
                    onChange={e => setEditDocSpec(e.target.value)}
                    placeholder="e.g. Consultant Radiologist & Sonologist"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Contact Phone, Email & Reg No */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile (WhatsApp) *</label>
                  <input
                    type="tel"
                    required
                    value={editDocPhone}
                    onChange={e => setEditDocPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Council Reg No</label>
                  <input
                    type="text"
                    value={editDocReg}
                    onChange={e => setEditDocReg(e.target.value)}
                    placeholder="e.g. MPMC / 48291"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Email</label>
                  <input
                    type="email"
                    value={editDocEmail}
                    onChange={e => setEditDocEmail(e.target.value)}
                    placeholder="doctor@atlas.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Shift Timing with Custom Option & Duty Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Shift Timing *</label>
                  <select
                    value={editDocShift}
                    onChange={e => setEditDocShift(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Morning (8:00 AM - 2:00 PM)">Morning (8:00 AM - 2:00 PM)</option>
                    <option value="Evening (2:00 PM - 8:00 PM)">Evening (2:00 PM - 8:00 PM)</option>
                    <option value="Night (8:00 PM - 8:00 AM)">Night (8:00 PM - 8:00 AM)</option>
                    <option value="Full Day (9:00 AM - 6:00 PM)">Full Day (9:00 AM - 6:00 PM)</option>
                    <option value="On-Call (24x7 Emergency)">On-Call (24x7 Emergency)</option>
                    <option value="Visiting Consultant (By Appointment)">Visiting Consultant</option>
                    <option value="CUSTOM">Custom (Specify Hours)</option>
                  </select>
                  {editDocShift === 'CUSTOM' && (
                    <input
                      type="text"
                      required
                      value={editDocCustomShift}
                      onChange={e => setEditDocCustomShift(e.target.value)}
                      placeholder="e.g. 10:00 AM - 04:00 PM"
                      className="mt-2 w-full px-3 py-1.5 bg-white border border-teal-400 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Live Duty Status *</label>
                  <select
                    value={editDocStatus}
                    onChange={e => setEditDocStatus(e.target.value as DoctorDutyStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="ON_DUTY">On Duty Now</option>
                    <option value="AVAILABLE_ON_CALL">Available On-Call</option>
                    <option value="OFF_DUTY">Off Duty</option>
                    <option value="ON_LEAVE">On Leave</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cabin / Room Number</label>
                  <input
                    type="text"
                    value={editDocRoom}
                    onChange={e => setEditDocRoom(e.target.value)}
                    placeholder="e.g. Ultrasound Suite A"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Scheduled Working Days */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Scheduled Working Days:</label>
                <div className="flex flex-wrap gap-2">
                  {weekDays.map(day => {
                    const isChecked = editDocDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleEditDay(day)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-teal-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Operational Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Operational Notes / Specialization</label>
                <input
                  type="text"
                  value={editDocNotes}
                  onChange={e => setEditDocNotes(e.target.value)}
                  placeholder="e.g. Reporting on PACs server, emergency MRI calls"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDoctor(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Save Schedule Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL 4: APPROVE / EDIT REFERRING PARTNER DOCTOR (COMMISSION REMOVED) */}
      {partnerDoctorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="fixed inset-0" onClick={() => setPartnerDoctorModal(null)} />
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 animate-scale-up my-8">
            <div className={`p-6 text-white relative ${
              partnerDoctorModal.isApproveMode
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700'
                : 'bg-gradient-to-r from-teal-700 to-sky-800'
            }`}>
              <button
                type="button"
                onClick={() => setPartnerDoctorModal(null)}
                className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                  {partnerDoctorModal.isApproveMode ? (
                    <UserCheck className="w-5 h-5" />
                  ) : (
                    <Edit3 className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-black">
                    {partnerDoctorModal.isApproveMode ? 'Verify & Approve Doctor to Roster' : 'Edit Doctor Details'}
                  </h3>
                  <p className="text-xs text-teal-100">
                    {partnerDoctorModal.isApproveMode 
                      ? 'Review doctor credentials and activate in clinical roster' 
                      : 'Update doctor credentials, affiliation, and contact details'}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSavePartnerDoctor} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Doctor Full Name *</label>
                  <input
                    type="text"
                    required
                    value={refDocName}
                    onChange={e => setRefDocName(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Kumar"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Degree / Qualification</label>
                  <input
                    type="text"
                    value={refDocQual}
                    onChange={e => setRefDocQual(e.target.value)}
                    placeholder="e.g. MBBS, MD Radiodiagnosis"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Medical Specialty</label>
                  <input
                    type="text"
                    value={refDocSpec}
                    onChange={e => setRefDocSpec(e.target.value)}
                    placeholder="e.g. Consultant Radiologist"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Clinic / Hospital Name</label>
                  <input
                    type="text"
                    value={refDocHospital}
                    onChange={e => setRefDocHospital(e.target.value)}
                    placeholder="e.g. Apollo Hospital, City Clinic"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Medical Council Reg. No</label>
                  <input
                    type="text"
                    value={refDocRegNo}
                    onChange={e => setRefDocRegNo(e.target.value)}
                    placeholder="e.g. MP 13663 / MP 27139"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Affiliation / Association</label>
                  <select
                    value={refDocAffiliation}
                    onChange={e => setRefDocAffiliation(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="SELF">Self / Independent Practice</option>
                    <option value="ORGANIZATION">Hospital / Partner Network</option>
                  </select>
                </div>
              </div>

              {refDocAffiliation === 'ORGANIZATION' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Organization / Beneficiary *</label>
                  <input
                    type="text"
                    value={refDocOrgName}
                    onChange={e => setRefDocOrgName(e.target.value)}
                    placeholder="e.g. City Healthcare Group / Beneficiary Partner"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Mobile Phone / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={refDocPhone}
                    onChange={e => setRefDocPhone(e.target.value)}
                    placeholder="+91 98XXX XXXXX"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={refDocEmail}
                    onChange={e => setRefDocEmail(e.target.value)}
                    placeholder="doctor@hospital.com"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Operational Notes / Specialization Remarks</label>
                <input
                  type="text"
                  value={refDocNotes}
                  onChange={e => setRefDocNotes(e.target.value)}
                  placeholder="e.g. Morning OPD referrals, Emergency Sonography"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPartnerDoctorModal(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                    partnerDoctorModal.isApproveMode
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-teal-600 hover:bg-teal-500'
                  }`}
                >
                  {partnerDoctorModal.isApproveMode ? (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>Confirm Details & Approve Doctor</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save Doctor Details</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default DoctorRosterTab;

