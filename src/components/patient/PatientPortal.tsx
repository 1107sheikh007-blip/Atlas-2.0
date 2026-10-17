import React, { useState, useMemo } from 'react';
import {
  User,
  Users,
  Search,
  Phone,
  Calendar,
  Building2,
  Stethoscope,
  HeartHandshake,
  Receipt,
  Download,
  CheckCircle2,
  Clock,
  Edit3,
  Lock,
  ShieldCheck,
  Filter,
  X,
  Eye,
  ArrowUpDown,
  FileSpreadsheet,
  AlertCircle,
  Plus,
  Trash2,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { useDiagnostic } from '../../context/DiagnosticContext';
import { Patient, DiagnosticOrder } from '../../types';
import { formatSafeDate } from '../../utils/dateUtils';
import { PatientDetailsModal } from './PatientDetailsModal';
import { EditPatientModal } from './EditPatientModal';

export const PatientPortal: React.FC = () => {
  const {
    currentUser,
    currentRole,
    setCurrentRole,
    patients,
    allOrders,
    appointments,
    referrers,
    centers,
    selectedCenter,
    updatePatient,
    deletePatient,
    deletedPatientIds,
    getReportByOrderId
  } = useDiagnostic();

  // Role Checks
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isManager = currentUser?.role === 'CENTER_MANAGER';
  const canAccess = isSuperAdmin || isManager;
  const canEdit = isSuperAdmin; // ONLY Super Admin has access to edit!

  // Center filter for Super Admin (Manager is strictly locked to their center)
  const [adminCenterFilter, setAdminCenterFilter] = useState<string>('ALL');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<'ALL' | 'NAME' | 'UHID' | 'PHONE' | 'DOCTOR'>('ALL');
  const [genderFilter, setGenderFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('TABLE');
  const [sortBy, setSortBy] = useState<'RECENT' | 'NAME' | 'ORDERS'>('RECENT');

  // Modal State
  const [selectedPatientForDetails, setSelectedPatientForDetails] = useState<Patient | null>(null);
  const [selectedPatientForEdit, setSelectedPatientForEdit] = useState<Patient | null>(null);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [isDeletingPatient, setIsDeletingPatient] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleConfirmDeletePatient = async () => {
    if (!patientToDelete) return;
    setIsDeletingPatient(true);
    try {
      await deletePatient(patientToDelete.id);
      showToast(`Patient ${patientToDelete.name} (${patientToDelete.id}) permanently deleted.`);
      setPatientToDelete(null);
    } catch (err: any) {
      showToast(`Failed to delete patient: ${err?.message || 'Error occurred'}`);
    } finally {
      setIsDeletingPatient(false);
    }
  };

  // 1. Consolidated master list of all known patients (from database, orders, appointments)
  const masterPatientsList = useMemo(() => {
    const map = new Map<string, Patient>();
    const deletedSet = new Set((deletedPatientIds || []).map(id => String(id).trim().toLowerCase()));

    // Database registered patients
    (patients || []).forEach(p => {
      if (p && p.name && !p.isDeleted && !deletedSet.has(String(p.id).trim().toLowerCase())) {
        map.set(p.id, p);
      }
    });

    // Patients from past orders
    (allOrders || []).forEach(o => {
      if (o && o.patient && o.patient.name && !o.isDeleted) {
        const p = o.patient;
        const id = p.id || o.patientId || `PAT-${o.id}`;
        const idLower = String(id).trim().toLowerCase();
        const pIdLower = String(p.id || '').trim().toLowerCase();
        const oPatIdLower = String(o.patientId || '').trim().toLowerCase();

        if (!deletedSet.has(idLower) && !deletedSet.has(pIdLower) && !deletedSet.has(oPatIdLower)) {
          if (!map.has(id)) {
            map.set(id, {
              id,
              name: p.name,
              age: p.age || 30,
              gender: p.gender || 'Male',
              phone: p.phone || '',
              email: p.email || '',
              address: p.address || '',
              bloodGroup: p.bloodGroup,
              abhaId: p.abhaId,
              registeredAt: p.registeredAt || o.createdAt,
              registeredCenterId: o.centerId
            });
          }
        }
      }
    });

    // Patients from appointments
    (appointments || []).forEach(apt => {
      if (apt && apt.patientName) {
        const id = `UHID-APT-${apt.id}`;
        const idLower = String(id).trim().toLowerCase();
        const phoneLower = String(apt.patientPhone || '').trim().toLowerCase();

        if (!deletedSet.has(idLower) && !deletedSet.has(phoneLower)) {
          const existing = Array.from(map.values()).find(
            p => (apt.patientPhone && p.phone === apt.patientPhone) ||
                 (p.name.toLowerCase() === apt.patientName.toLowerCase())
          );
          if (!existing) {
            map.set(id, {
              id,
              name: apt.patientName,
              age: apt.patientAge || 30,
              gender: (apt.patientGender as any) || 'Male',
              phone: apt.patientPhone || '',
              email: apt.patientEmail || '',
              address: '',
              registeredAt: apt.createdAt || new Date().toISOString(),
              registeredCenterId: apt.centerId
            });
          }
        }
      }
    });

    return Array.from(map.values()).filter(p => !deletedSet.has(String(p.id).trim().toLowerCase()));
  }, [patients, allOrders, appointments, deletedPatientIds]);

  // 2. Precompute Affiliated Doctors and Order Statistics for each patient
  const patientMetadataMap = useMemo(() => {
    const meta = new Map<string, {
      doctors: Array<{ name: string; specialty?: string; hospital?: string }>;
      ordersCount: number;
      totalRevenue: number;
      lastVisitDate: string;
      centerIds: Set<string>;
    }>();

    masterPatientsList.forEach(p => {
      const initialDocs: Array<{ name: string; specialty?: string; hospital?: string }> = [];
      if (p.referringDoctorName && p.referringDoctorName !== 'Direct Walk-in') {
        const ref = referrers.find(
          r => r.id === p.referringDoctorId || r.name.toLowerCase() === p.referringDoctorName?.toLowerCase()
        );
        initialDocs.push({
          name: p.referringDoctorName,
          specialty: ref?.specialty || 'Assigned Referrer',
          hospital: p.commissionBeneficiaryName || ref?.organizationName || ref?.hospital || ''
        });
      }
      meta.set(p.id, {
        doctors: initialDocs,
        ordersCount: 0,
        totalRevenue: 0,
        lastVisitDate: p.registeredAt || '',
        centerIds: new Set(p.registeredCenterId ? [p.registeredCenterId] : [])
      });
    });

    (allOrders || []).forEach(o => {
      if (o.isDeleted) return;
      const pid = o.patientId || o.patient?.id;
      if (!pid) return;

      let entry = meta.get(pid);
      if (!entry && o.patient) {
        entry = {
          doctors: [],
          ordersCount: 0,
          totalRevenue: 0,
          lastVisitDate: o.createdAt,
          centerIds: new Set()
        };
        meta.set(pid, entry);
      }

      if (entry) {
        entry.ordersCount += 1;
        entry.totalRevenue += (o.totalAmount || 0);
        if (o.centerId) entry.centerIds.add(o.centerId);
        if (o.createdAt && (!entry.lastVisitDate || new Date(o.createdAt) > new Date(entry.lastVisitDate))) {
          entry.lastVisitDate = o.createdAt;
        }

        const docName = o.referringDoctorName?.trim();
        if (docName && docName !== 'Direct Walk-in' && !entry.doctors.some(d => d.name.toLowerCase() === docName.toLowerCase())) {
          const ref = referrers.find(r => r.name.toLowerCase() === docName.toLowerCase());
          entry.doctors.push({
            name: docName,
            specialty: ref?.specialty || 'Referring Doctor',
            hospital: ref?.organizationName || ref?.hospital || ''
          });
        }

        // Also check reporting doctor
        const rep = getReportByOrderId(o.id);
        if (rep?.doctorName && !entry.doctors.some(d => d.name.toLowerCase() === rep.doctorName.toLowerCase())) {
          entry.doctors.push({
            name: rep.doctorName,
            specialty: rep.doctorSpecialty || 'Consultant Specialist'
          });
        }
      }
    });

    (appointments || []).forEach(apt => {
      if (!apt.patientName) return;
      const p = masterPatientsList.find(
        pt => (apt.patientPhone && pt.phone === apt.patientPhone) || pt.name.toLowerCase() === apt.patientName.toLowerCase()
      );
      if (p) {
        const entry = meta.get(p.id);
        if (entry) {
          if (apt.centerId) entry.centerIds.add(apt.centerId);
          const doc = apt.referringDoctorName?.trim();
          if (doc && doc !== 'Direct Walk-in' && !entry.doctors.some(d => d.name.toLowerCase() === doc.toLowerCase())) {
            entry.doctors.push({ name: doc, specialty: 'Referring Doctor' });
          }
        }
      }
    });

    return meta;
  }, [masterPatientsList, allOrders, appointments, referrers, getReportByOrderId]);

  // 3. Center Access Filtering
  // - MANAGER: Scoped strictly to their particular center!
  // - SUPER ADMIN: Has access to ALL patients across all centers (with optional filter)
  const centerScopedPatients = useMemo(() => {
    if (isManager) {
      const managerCenterId = selectedCenter.id;
      return masterPatientsList.filter(p => {
        const meta = patientMetadataMap.get(p.id);
        if (!meta) return p.registeredCenterId === managerCenterId;
        return p.registeredCenterId === managerCenterId || meta.centerIds.has(managerCenterId);
      });
    }

    if (isSuperAdmin) {
      if (adminCenterFilter === 'ALL') return masterPatientsList;
      return masterPatientsList.filter(p => {
        const meta = patientMetadataMap.get(p.id);
        if (!meta) return p.registeredCenterId === adminCenterFilter;
        return p.registeredCenterId === adminCenterFilter || meta.centerIds.has(adminCenterFilter);
      });
    }

    return [];
  }, [masterPatientsList, patientMetadataMap, isManager, isSuperAdmin, selectedCenter.id, adminCenterFilter]);

  // 4. Search & Filter
  const filteredPatients = useMemo(() => {
    let result = centerScopedPatients;

    // Search Query Filter
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(p => {
        const meta = patientMetadataMap.get(p.id);
        const nameMatch = (p.name || '').toLowerCase().includes(q);
        const idMatch = (p.id || '').toLowerCase().includes(q);
        const phoneMatch = (p.phone || '').toLowerCase().includes(q);
        const docMatch = meta?.doctors.some(d => d.name.toLowerCase().includes(q) || (d.hospital || '').toLowerCase().includes(q));

        if (searchField === 'NAME') return nameMatch;
        if (searchField === 'UHID') return idMatch;
        if (searchField === 'PHONE') return phoneMatch;
        if (searchField === 'DOCTOR') return !!docMatch;
        return nameMatch || idMatch || phoneMatch || docMatch;
      });
    }

    // Gender Filter
    if (genderFilter !== 'ALL') {
      result = result.filter(p => p.gender?.toLowerCase() === genderFilter.toLowerCase());
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortBy === 'NAME') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sortBy === 'ORDERS') {
        const countA = patientMetadataMap.get(a.id)?.ordersCount || 0;
        const countB = patientMetadataMap.get(b.id)?.ordersCount || 0;
        return countB - countA;
      }
      // RECENT
      const dateA = new Date(patientMetadataMap.get(a.id)?.lastVisitDate || a.registeredAt || 0).getTime();
      const dateB = new Date(patientMetadataMap.get(b.id)?.lastVisitDate || b.registeredAt || 0).getTime();
      return dateB - dateA;
    });

    return result;
  }, [centerScopedPatients, searchQuery, searchField, genderFilter, sortBy, patientMetadataMap]);

  // Handle Edit Save from Super Admin
  const handleSavePatientEdits = (updatedData: Partial<Patient>) => {
    if (!selectedPatientForEdit) return;
    updatePatient(selectedPatientForEdit.id, updatedData);
    showToast(`Demographics for ${updatedData.name || selectedPatientForEdit.name} (UHID: ${selectedPatientForEdit.id}) updated successfully!`);
    
    // Refresh details modal if open
    if (selectedPatientForDetails && selectedPatientForDetails.id === selectedPatientForEdit.id) {
      setSelectedPatientForDetails(prev => prev ? { ...prev, ...updatedData } : null);
    }
  };

  // SECURITY GUARD: If neither Super Admin nor Manager, block access!
  if (!canAccess) {
    return (
      <div className="max-w-lg mx-auto my-16 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-4 shadow-xl animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
          <Lock className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Patients Portal Restricted
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            The Patients Portal and Master Clinical Directory contains protected demographic and medical records. Access is authorized strictly for <strong>Super Administrators</strong> and <strong>Center Managers</strong>.
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setCurrentRole(currentUser?.role || 'RECEPTIONIST')}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Return to Authorized Workstation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-800 text-xs font-bold animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sky-200 text-xs font-bold backdrop-blur-xs border border-white/10">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <span>Patients Master Directory & Clinical Histories</span>
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <span className="text-emerald-400 font-extrabold">
                {isSuperAdmin ? 'Super Admin Master Access' : `Center Manager Access (${selectedCenter.code})`}
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Patient Identification, Demographics & Clinical Network
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {isSuperAdmin
                ? 'Full multi-center authority: access all registered patients across all hubs, view doctor referral affiliations, review complete diagnostic order histories, and edit patient demographics.'
                : `Center Manager authority: view all patients registered or serviced at ${selectedCenter.name} (${selectedCenter.code}), inspect doctor referral connections, and review clinical histories in read-only mode.`}
            </p>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-center min-w-[130px]">
              <span className="text-[10px] uppercase font-bold text-sky-200 block tracking-wider">
                {isManager ? 'Center Patients' : 'Total Patients'}
              </span>
              <span className="text-2xl font-black text-white">{centerScopedPatients.length}</span>
            </div>
            <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-center min-w-[130px]">
              <span className="text-[10px] uppercase font-bold text-sky-200 block tracking-wider">
                Editable Role
              </span>
              <span className={`text-xs font-black px-2 py-1 rounded-lg inline-block mt-1 ${canEdit ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-slate-700/60 text-slate-300 border border-slate-600'}`}>
                {canEdit ? 'Super Admin (Full Edit)' : 'Manager (View Only)'}
              </span>
            </div>
          </div>
        </div>

        {/* Center Scoped Notice for Center Manager */}
        {isManager && (
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-sky-200">
            <Building2 className="w-4 h-4 text-sky-400 shrink-0" />
            <span>
              Restricted to active center: <strong>{selectedCenter.name} ({selectedCenter.code})</strong>. To maintain operational audit integrity, patient demographic edits are restricted to the Super Administrator.
            </span>
          </div>
        )}
      </div>

      {/* Control Bar: Search with Name, Center Selector, Filter Pills */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
        
        {/* Row 1: Search Inputs and Center Selector */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by Patient Name, UHID, Mobile number, or Affiliated Doctor..."
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-2xl pl-10 pr-10 py-2.5 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Clear Search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Super Admin Center Selector Filter */}
          {isSuperAdmin && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 shrink-0 hidden sm:inline">Center Hub:</span>
              <select
                value={adminCenterFilter}
                onChange={e => setAdminCenterFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="ALL">All Diagnostic Centers ({centers.length} Centers)</option>
                {centers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 shrink-0 hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="RECENT">Most Recent Activity</option>
              <option value="NAME">Patient Name (A-Z)</option>
              <option value="ORDERS">Most Test Orders</option>
            </select>
          </div>

          {/* View Mode Toggle: Cards vs Table */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('TABLE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'TABLE'
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Table View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('CARDS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'CARDS'
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Cards View
            </button>
          </div>
        </div>

        {/* Row 2: Search By Name Specific Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Target Field:
            </span>
            <button
              type="button"
              onClick={() => setSearchField('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                searchField === 'ALL'
                  ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-300 dark:border-sky-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              All Fields
            </button>
            <button
              type="button"
              onClick={() => setSearchField('NAME')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                searchField === 'NAME'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              👤 Search with Name Only
            </button>
            <button
              type="button"
              onClick={() => setSearchField('UHID')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                searchField === 'UHID'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              UHID Number
            </button>
            <button
              type="button"
              onClick={() => setSearchField('PHONE')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                searchField === 'PHONE'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Mobile / WhatsApp
            </button>
            <button
              type="button"
              onClick={() => setSearchField('DOCTOR')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                searchField === 'DOCTOR'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              👨‍⚕️ Affiliated Doctor
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Gender:</span>
            <select
              value={genderFilter}
              onChange={e => setGenderFilter(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 border-0 focus:outline-none"
            >
              <option value="ALL">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>

            <span className="font-bold text-sky-700 dark:text-sky-400 ml-2">
              Showing {filteredPatients.length} of {centerScopedPatients.length} Patients
            </span>
          </div>
        </div>
      </div>

      {/* Main Patients Directory Content */}
      {filteredPatients.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 mx-auto flex items-center justify-center">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white">
            No patients found matching your search criteria
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery
              ? `No records found for "${searchQuery}" in ${searchField === 'ALL' ? 'any field' : searchField.toLowerCase()}. Try searching with a different name, UHID, or mobile number.`
              : 'There are currently no patients registered in this center.'}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setSearchField('ALL'); setGenderFilter('ALL'); }}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Reset Search & Filters
            </button>
          )}
        </div>
      ) : viewMode === 'TABLE' ? (
        
        /* TABLE VIEW */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[10px] font-extrabold tracking-wider">
                  <th className="py-3.5 px-4">Patient Demographics</th>
                  <th className="py-3.5 px-4">UHID / Contact</th>
                  <th className="py-3.5 px-4">Affiliated Doctors</th>
                  <th className="py-3.5 px-4 text-center">Orders & Revenue</th>
                  <th className="py-3.5 px-4">Last Visit</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-800 dark:text-slate-200">
                {filteredPatients.map(p => {
                  const meta = patientMetadataMap.get(p.id);
                  const docs = meta?.doctors || [];

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-sky-50/60 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Name & Basic Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {p.name[0]?.toUpperCase() || 'P'}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 dark:text-white text-xs block group-hover:text-sky-600 transition-colors">
                              {p.name}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {p.gender} • {p.age} Y {p.bloodGroup && `• Blood: ${p.bloodGroup}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* UHID & Phone */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-mono font-bold text-sky-700 dark:text-sky-400 text-xs block">
                            {p.id}
                          </span>
                          <span className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                            {p.phone || 'No Phone'}
                          </span>
                        </div>
                      </td>

                      {/* Affiliated Doctors */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {docs.length === 0 ? (
                          <span className="text-slate-400 text-[11px] italic">Direct Walk-in</span>
                        ) : (
                          <div className="space-y-1">
                            {docs.slice(0, 2).map((d, di) => (
                              <div key={di} className="flex items-center gap-1.5 text-[11px]">
                                <Stethoscope className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                  {d.name}
                                </span>
                                {d.specialty && (
                                  <span className="text-[10px] text-slate-400 truncate">({d.specialty})</span>
                                )}
                              </div>
                            ))}
                            {docs.length > 2 && (
                              <span className="text-[10px] text-sky-700 font-bold block">
                                +{docs.length - 2} other doctors
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Orders & Revenue */}
                      <td className="py-3.5 px-4 text-center">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {meta?.ordersCount || 0} Orders
                          </span>
                          <span className="text-[10px] text-sky-700 dark:text-sky-400 font-mono font-semibold">
                            ₹{(meta?.totalRevenue || 0).toLocaleString()}
                          </span>
                        </div>
                      </td>

                      {/* Last Visit */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                        {formatSafeDate(meta?.lastVisitDate || p.registeredAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Details Button - Available to both Super Admin and Manager */}
                          <button
                            type="button"
                            onClick={() => setSelectedPatientForDetails(p)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-sky-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-sky-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                            title="View Full Patient Profile & Clinical Orders"
                          >
                            <Eye className="w-3.5 h-3.5 text-sky-600" />
                            <span>View Details</span>
                          </button>

                          {/* Edit & Delete Buttons - ONLY for Super Admin */}
                          {canEdit ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setSelectedPatientForEdit(p)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                                title="Super Admin Authorized Demographic Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setPatientToDelete(p)}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                                title="Permanently Delete Patient (Super Admin)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </>
                          ) : (
                            <span 
                              className="p-1.5 text-slate-400 cursor-not-allowed" 
                              title="Demographic edits restricted to Super Admin only"
                            >
                              <Lock className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                            </span>
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
      ) : (

        /* CARDS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map(p => {
            const meta = patientMetadataMap.get(p.id);
            const docs = meta?.doctors || [];

            return (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:border-sky-300 dark:hover:border-sky-700 transition-all space-y-4 flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                        {p.name[0]?.toUpperCase() || 'P'}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                          {p.name}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {p.gender} • {p.age} Y {p.bloodGroup && `• ${p.bloodGroup}`}
                        </p>
                      </div>
                    </div>

                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shrink-0">
                      {p.id}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="py-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" /> Mobile:
                      </span>
                      <strong className="text-slate-900 dark:text-slate-100">{p.phone || 'N/A'}</strong>
                    </div>

                    {p.address && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        📍 {p.address}
                      </p>
                    )}

                    {/* Affiliated Doctors Badge */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Affiliated Doctors:
                      </span>
                      {docs.length === 0 ? (
                        <span className="text-[11px] text-slate-400 italic">Direct Walk-in Registration</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {docs.slice(0, 2).map((d, di) => (
                            <span
                              key={di}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800"
                            >
                              <Stethoscope className="w-2.5 h-2.5" />
                              {d.name}
                            </span>
                          ))}
                          {docs.length > 2 && (
                            <span className="text-[10px] text-slate-400 font-bold self-center">
                              +{docs.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Orders Count & Revenue */}
                    <div className="flex items-center justify-between pt-2 text-[11px] text-slate-500">
                      <span>Investigative Orders:</span>
                      <strong className="text-sky-700 dark:text-sky-400 font-bold">
                        {meta?.ordersCount || 0} Orders (₹{(meta?.totalRevenue || 0).toLocaleString()})
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPatientForDetails(p)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-sky-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-sky-900 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-sky-600" />
                    <span>View Profile</span>
                  </button>

                  {canEdit && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedPatientForEdit(p)}
                        className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-1"
                        title="Super Admin Authorized Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPatientToDelete(p)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer flex items-center justify-center"
                        title="Permanently Delete Patient (Super Admin)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Patient Details Modal */}
      {selectedPatientForDetails && (
        <PatientDetailsModal
          patient={selectedPatientForDetails}
          orders={allOrders}
          center={selectedCenter}
          canEdit={canEdit}
          onClose={() => setSelectedPatientForDetails(null)}
          onEdit={(pt) => {
            setSelectedPatientForEdit(pt);
          }}
        />
      )}

      {/* Edit Patient Modal (Super Admin ONLY) */}
      {selectedPatientForEdit && (
        <EditPatientModal
          patient={selectedPatientForEdit}
          onClose={() => setSelectedPatientForEdit(null)}
          onSave={handleSavePatientEdits}
        />
      )}

      {/* Super Admin Delete Patient Confirmation Modal */}
      {patientToDelete && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => !isDeletingPatient && setPatientToDelete(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden p-6 space-y-5 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <button
                type="button"
                onClick={() => !isDeletingPatient && setPatientToDelete(null)}
                disabled={isDeletingPatient}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Delete Patient Record?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Are you sure you want to permanently delete patient <strong className="text-slate-900 dark:text-white font-black">{patientToDelete.name}</strong> (<span className="font-mono text-sky-700 dark:text-sky-400 font-bold">{patientToDelete.id}</span>)?
              </p>
              <div className="p-3 bg-rose-50/80 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 rounded-2xl text-[11px] text-rose-700 dark:text-rose-300 space-y-1 font-medium">
                <p>⚠️ <strong>Permanent Action:</strong> This record will be permanently deleted from this device and purged from the Google Sheets database.</p>
                {patientToDelete.phone && <p>• Phone: {patientToDelete.phone}</p>}
                {patientToDelete.registeredAt && <p>• Registered: {formatSafeDate(patientToDelete.registeredAt)}</p>}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPatientToDelete(null)}
                disabled={isDeletingPatient}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePatient}
                disabled={isDeletingPatient}
                className="flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isDeletingPatient ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting from Cloud...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Permanently Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default PatientPortal;
