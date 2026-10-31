import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  formatSafeDate,
  formatSafeTime,
  parseSafeDate,
  buildSafeISOFromLocalDateAndTime,
  getLocalYYYYMMDD,
  normalizeToYYYYMMDD,
  getCurrent12HourTime,
  getCurrent24HourTime,
  convert24To12HourTime,
  convert12To24HourTime,
  parsePatientNameParts
} from '../../utils/dateUtils';
import {
  UserPlus,
  Receipt,
  Barcode as BarcodeIcon,
  Send,
  Printer,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  Phone,
  Mail,
  User,
  CreditCard,
  QrCode,
  DollarSign,
  AlertTriangle,
  FileText,
  Share2,
  Check,
  ChevronDown,
  Sparkles,
  RefreshCw,
  Eye,
  MapPin,
  Lock,
  FileSpreadsheet,
  Trash2,
  Calendar,
  FlaskConical,
  MessageCircle,
  Building,
  Building2,
  X,
  Filter,
  Tag,
  RotateCcw,
  Banknote,
  Edit3,
  Save
} from 'lucide-react';
import { useDiagnostic } from '../../context/DiagnosticContext';
import { DiagnosticOrder, DiagnosticTestItem, PaymentMode, Patient, PatientAppointment, AppointmentStatus } from '../../types';
import { InvoiceReceiptModal } from '../common/InvoiceReceiptModal';
import { ReportPrintView } from '../common/ReportPrintView';
import { PatientDetailsModal } from '../patient/PatientDetailsModal';
import { EditPatientModal } from '../patient/EditPatientModal';
import { DateRangeFilter, DatePresetType, isDateInSelectedRange } from '../common/DateRangeFilter';

export const ReceptionPortal: React.FC = () => {
  const {
    patients,
    tests,
    approvedReferrers,
    pendingReferrers,
    referrers,
    orders,
    allOrders,
    selectedCenter,
    currentStaff,
    registerPatient,
    sendWelcomePatientWhatsApp,
    sendWelcomeDoctorWhatsApp,
    createOrder,
    markSampleCollected,
    markPaymentReceived,
    processOrderRefund,
    financialSummary,
    dispatchReportViaWhatsApp,
    getReportByOrderId,
    requestDeleteOrder,
    approveDeleteOrder,
    requestDeletePatient,
    addReferringDoctor,
    appointments,
    addAppointment,
    updateAppointment,
    updateAppointmentStatus,
    deleteAppointment,
    purgeDuplicateOrders,
    currentUser,
    currentRole,
    updatePatient,
    orderBeingEdited,
    startEditingOrder,
    cancelEditingOrder,
    updateOrder
  } = useDiagnostic();

  const isSuperAdmin = currentRole === 'SUPER_ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  // Tab State
  const [activeTab, setActiveTab] = useState<'REGISTRATION' | 'ORDERS_QUEUE' | 'APPOINTMENTS'>('REGISTRATION');

  // Draft persistence storage key & loader
  const DRAFT_STORAGE_KEY = 'ATL_PATIENT_ORDER_DRAFT';
  

    const initialDraft = useMemo(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  }, []);

  // Patient Status & Missed Appointment on Invoice
  const [patientStatusRemark, setPatientStatusRemark] = useState<string>(() => {
    const saved = initialDraft?.patientStatusRemark;
    if (saved === 'Standard Walk-in / OPD') return 'Standard Walk-in';
    return saved || 'Standard Walk-in';
  });
  const [customStatusRemark, setCustomStatusRemark] = useState<string>(initialDraft?.customStatusRemark || '');
  const [hasMissedAppointment, setHasMissedAppointment] = useState<boolean>(initialDraft?.hasMissedAppointment ?? false);
  const [missedAppointmentNotes, setMissedAppointmentNotes] = useState<string>(initialDraft?.missedAppointmentNotes || '');

  // Appointments Tab Management
  const [aptSearch, setAptSearch] = useState('');
  const [aptStatusFilter, setAptStatusFilter] = useState<string>('ALL');
  const [aptDateFilter, setAptDateFilter] = useState<'ALL' | 'TODAY' | 'UPCOMING'>('TODAY');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [newAptPatientName, setNewAptPatientName] = useState('');
  const [newAptPatientPhone, setNewAptPatientPhone] = useState('');
  const [newAptPatientEmail, setNewAptPatientEmail] = useState('');
  const [newAptPatientAge, setNewAptPatientAge] = useState<number | ''>('');
  const [newAptPatientGender, setNewAptPatientGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [newAptDate, setNewAptDate] = useState<string>(() => getLocalYYYYMMDD());
  const [newAptTime, setNewAptTime] = useState<string>(() => getCurrent12HourTime());
  const [newAptTest, setNewAptTest] = useState<string>('');
  const [newAptDoctor, setNewAptDoctor] = useState<string>('');
  const [newAptNotes, setNewAptNotes] = useState<string>('');

  const handleSavePatientEdits = (updatedData: Partial<Patient>) => {
      if (!selectedPatientForEdit) return;
      updatePatient(selectedPatientForEdit.id, updatedData);
      setSelectedPatientForEdit(null);
      // Refresh selected patient details if they were currently selected
      if (selectedPatientId === selectedPatientForEdit.id) {
        const parsed = parsePatientNameParts(updatedData.name || newName);
        const titleVal = (updatedData.title as any) || parsed.title || (updatedData.gender === 'Female' ? 'Mrs.' : 'Mr.');
        setNewTitle(titleVal);
        setNewFirstName(updatedData.firstName !== undefined ? updatedData.firstName : parsed.firstName);
        setNewLastName(updatedData.lastName !== undefined ? updatedData.lastName : parsed.lastName);
        setNewName(updatedData.name || newName);
        setNewAge(updatedData.age !== undefined ? updatedData.age : newAge);
        setNewPhone(updatedData.phone || newPhone);
        setNewGender(updatedData.gender || newGender);
        setNewEmail(updatedData.email || newEmail);
        setNewAddress(updatedData.address || newAddress);
        setNewAbhaId(updatedData.abhaId || newAbhaId);
      }
    };

    const handleOpenScheduleModal = () => {
    setNewAptDate(getLocalYYYYMMDD());
    setNewAptTime(getCurrent12HourTime());
    setIsScheduleModalOpen(true);
  };
  
  // Order Registration Form State
  const [patientSearch, setPatientSearch] = useState(initialDraft?.patientSearch || '');
  const [isPatientSearchFocused, setIsPatientSearchFocused] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(initialDraft?.selectedPatientId || '');
  
  // New Patient Form fields
  const [newTitle, setNewTitle] = useState<'Mr.' | 'Mrs.' | 'Ms.' | 'Mast.' | 'Baby' | 'Dr.'>(() => {
    if (initialDraft?.newTitle) return initialDraft.newTitle;
    if (initialDraft?.newName) return parsePatientNameParts(initialDraft.newName).title;
    return 'Mr.';
  });
  const [newFirstName, setNewFirstName] = useState<string>(() => {
    if (initialDraft?.newFirstName !== undefined) return initialDraft.newFirstName;
    if (initialDraft?.newName) return parsePatientNameParts(initialDraft.newName).firstName;
    return '';
  });
  const [newLastName, setNewLastName] = useState<string>(() => {
    if (initialDraft?.newLastName !== undefined) return initialDraft.newLastName;
    if (initialDraft?.newName) return parsePatientNameParts(initialDraft.newName).lastName;
    return '';
  });
  const [newName, setNewName] = useState<string>(() => {
    if (initialDraft?.newName) return initialDraft.newName;
    const parts = [
      initialDraft?.newTitle || 'Mr.',
      initialDraft?.newFirstName || '',
      initialDraft?.newLastName || ''
    ].filter(Boolean);
    return parts.join(' ').trim();
  });

  const handleTitleChange = (val: 'Mr.' | 'Mrs.' | 'Ms.' | 'Mast.' | 'Baby' | 'Dr.') => {
    setNewTitle(val);
    if (val === 'Mr.' || val === 'Mast.') {
      setNewGender('Male');
    } else if (val === 'Mrs.' || val === 'Ms.') {
      setNewGender('Female');
    }
    const combined = [val, newFirstName.trim(), newLastName.trim()].filter(Boolean).join(' ').trim();
    setNewName(combined);
  };

  const handleFirstNameChange = (val: string) => {
    setNewFirstName(val);
    const combined = [newTitle, val.trim(), newLastName.trim()].filter(Boolean).join(' ').trim();
    setNewName(combined);
  };

  const handleLastNameChange = (val: string) => {
    setNewLastName(val);
    const combined = [newTitle, newFirstName.trim(), val.trim()].filter(Boolean).join(' ').trim();
    setNewName(combined);
  };

  const [newAge, setNewAge] = useState<number | ''>(initialDraft?.newAge !== undefined ? initialDraft.newAge : '');
  const [newAgeMonths, setNewAgeMonths] = useState<number | ''>(initialDraft?.newAgeMonths !== undefined ? initialDraft.newAgeMonths : '');
  const [newAgeDays, setNewAgeDays] = useState<number | ''>(initialDraft?.newAgeDays !== undefined ? initialDraft.newAgeDays : '');
  const [newGender, setNewGender] = useState<'Male' | 'Female' | 'Other'>(initialDraft?.newGender || 'Male');
  const [newPhone, setNewPhone] = useState(initialDraft?.newPhone || '');
  const [newEmail, setNewEmail] = useState(initialDraft?.newEmail || '');
  const [newAddress, setNewAddress] = useState(initialDraft?.newAddress || '');
  const [newAbhaId, setNewAbhaId] = useState(initialDraft?.newAbhaId || '');
  const [viewingPatientDetails, setViewingPatientDetails] = useState<Patient | null>(null);
  const [selectedPatientForEdit, setSelectedPatientForEdit] = useState<Patient | null>(null);
    

  // Consolidated master list of all known patients (from patients table, orders, and appointments)
  const allKnownPatients = useMemo(() => {
    const map = new Map<string, Patient>();
    // 1. Existing patients in database
    (patients || []).forEach(p => {
      if (p && p.name && !p.isDeleted) {
        map.set(p.id, p);
      }
    });
    // 2. Patients from past orders ledger
    (allOrders || []).forEach(o => {
      if (o && o.patient && o.patient.name && !o.isDeleted) {
        const p = o.patient;
        const id = p.id || o.patientId || `PAT-${o.id}`;
        if (!map.has(id)) {
          map.set(id, {
            id,
            name: p.name,
            age: p.age || 30,
            gender: p.gender || 'Male',
            phone: p.phone || '',
            email: p.email || '',
            address: p.address || '',
            registeredAt: p.registeredAt || o.createdAt,
            registeredCenterId: o.centerId
          });
        }
      }
    });
    // 3. Patients from appointments
    (appointments || []).forEach(apt => {
      if (apt && apt.patientName) {
        const existing = Array.from(map.values()).find(
          p => (apt.patientPhone && p.phone === apt.patientPhone) ||
               (p.name.toLowerCase() === apt.patientName.toLowerCase())
        );
        if (!existing) {
          const id = `UHID-APT-${apt.id}`;
          map.set(id, {
            id,
            name: apt.patientName,
            age: apt.patientAge || 30,
            gender: (apt.patientGender as any) || 'Male',
            phone: apt.patientPhone || '',
            email: apt.patientEmail || '',
            address: '',
            registeredAt: apt.createdAt || new Date().toISOString()
          });
        }
      }
    });
    return Array.from(map.values());
  }, [patients, allOrders, appointments]);

  // Real-time filter for returning patient search
  const filteredPatientsForSearch = useMemo(() => {
    const q = (patientSearch || '').trim().toLowerCase();
    const cleanDigits = q.replace(/\D/g, '');
    if (!q) {
      return isPatientSearchFocused ? allKnownPatients.slice(0, 8) : [];
    }
    return allKnownPatients.filter(p => {
      const nameMatch = (p.name || '').toLowerCase().includes(q);
      const idMatch = (p.id || '').toLowerCase().includes(q);
      const rawPhone = (p.phone || '').toLowerCase();
      const phoneDigits = rawPhone.replace(/\D/g, '');
      const phoneMatch = rawPhone.includes(q) || (cleanDigits.length >= 2 && phoneDigits.includes(cleanDigits));
      const emailMatch = (p.email || '').toLowerCase().includes(q);
      const abhaMatch = (p.abhaId || '').toLowerCase().includes(q);
      return nameMatch || idMatch || phoneMatch || emailMatch || abhaMatch;
    }).slice(0, 15);
  }, [allKnownPatients, patientSearch, isPatientSearchFocused]);

  // Appointment Date & Time
  const [appointmentDate, setAppointmentDate] = useState<string>(initialDraft?.appointmentDate || getLocalYYYYMMDD());
  const [appointmentTime, setAppointmentTime] = useState<string>(
    initialDraft?.appointmentTime || getCurrent24HourTime()
  );

  const handleSyncOrderAppointmentTimeToNow = () => {
    setAppointmentDate(getLocalYYYYMMDD());
    setAppointmentTime(getCurrent24HourTime());
    showToast(`Appointment time synced to current time (${getCurrent12HourTime()})`);
  };

  // Selected Tests
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>(initialDraft?.selectedTestIds || []);
  const [testSearch, setTestSearch] = useState('');
  const [testModalityFilter, setTestModalityFilter] = useState<string>('ALL');
  const [testDepartmentFilter, setTestDepartmentFilter] = useState<string>('ALL');
  const [showSelectedOnly, setShowSelectedOnly] = useState<boolean>(false);

  // Departments List extracted from catalog
  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    tests.forEach(t => {
      if (t.department) set.add(t.department);
    });
    return Array.from(set).sort();
  }, [tests]);

  // Modality category counts
  const modalityCounts = useMemo(() => {
    return {
      ALL: tests.length,
      USG: tests.filter(t => (t.department || '').toLowerCase().includes('ultrasound') || (t.department || '').toLowerCase().includes('sonography')).length,
      MRI: tests.filter(t => (t.department || '').toLowerCase().includes('mri') || (t.department || '').toLowerCase().includes('magnetic')).length,
      CT: tests.filter(t => (t.department || '').toLowerCase().includes('computed') || (t.department || '').toLowerCase().includes('ct')).length,
      XRAY: tests.filter(t => (t.department || '').toLowerCase().includes('x-ray') || (t.department || '').toLowerCase().includes('radiography')).length,
      PATH: tests.filter(t => t.category === 'Pathology').length,
      CARD: tests.filter(t => t.category === 'Cardiology' || (t.department || '').toLowerCase().includes('cardio') || (t.department || '').toLowerCase().includes('ecg') || (t.department || '').toLowerCase().includes('echo')).length,
      NEURO: tests.filter(t => t.category === 'Specialized' || (t.department || '').toLowerCase().includes('neuro')).length,
    };
  }, [tests]);

  // Filtered test catalog for Reception
  const filteredTests = useMemo(() => {
    return tests.filter(t => {
      // 1. Show selected only toggle
      if (showSelectedOnly && !selectedTestIds.includes(t.id)) {
        return false;
      }

      const deptLower = (t.department || '').toLowerCase();

      // 2. Modality Quick Filter
      if (testModalityFilter === 'USG') {
        if (!deptLower.includes('ultrasound') && !deptLower.includes('sonography')) return false;
      } else if (testModalityFilter === 'MRI') {
        if (!deptLower.includes('mri') && !deptLower.includes('magnetic')) return false;
      } else if (testModalityFilter === 'CT') {
        if (!deptLower.includes('computed') && !deptLower.includes('ct')) return false;
      } else if (testModalityFilter === 'XRAY') {
        if (!deptLower.includes('x-ray') && !deptLower.includes('radiography')) return false;
      } else if (testModalityFilter === 'PATH') {
        if (t.category !== 'Pathology') return false;
      } else if (testModalityFilter === 'CARD') {
        if (t.category !== 'Cardiology' && !deptLower.includes('cardio') && !deptLower.includes('ecg') && !deptLower.includes('echo')) return false;
      } else if (testModalityFilter === 'NEURO') {
        if (t.category !== 'Specialized' && !deptLower.includes('neuro')) return false;
      }

      // 3. Department Dropdown Filter
      if (testDepartmentFilter !== 'ALL' && t.department !== testDepartmentFilter) {
        return false;
      }

      // 4. Text Search
      if (testSearch.trim()) {
        const query = testSearch.toLowerCase().trim();
        const matchesName = (t.name || '').toLowerCase().includes(query);
        const matchesCode = (t.code || '').toLowerCase().includes(query);
        const matchesDept = deptLower.includes(query);
        const matchesSample = (t.sampleType || '').toLowerCase().includes(query);
        const matchesId = (t.id || '').toLowerCase().includes(query);
        if (!matchesName && !matchesCode && !matchesDept && !matchesSample && !matchesId) {
          return false;
        }
      }

      return true;
    });
  }, [tests, testModalityFilter, testDepartmentFilter, testSearch, showSelectedOnly, selectedTestIds]);

  // Referring Doctor selection & Standalone Modal
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(initialDraft?.selectedDoctorId || '');
  const [isAddingNewDoctor, setIsAddingNewDoctor] = useState(false);
  const [isStandaloneDoctorModalOpen, setIsStandaloneDoctorModalOpen] = useState(false);
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newDoctorQualification, setNewDoctorQualification] = useState('');
  const [newDoctorSpecialty, setNewDoctorSpecialty] = useState('');
  const [newDoctorHospital, setNewDoctorHospital] = useState('');
  const [newDoctorRegNo, setNewDoctorRegNo] = useState('');
  const [newDoctorPhone, setNewDoctorPhone] = useState('');
  const [newDoctorEmail, setNewDoctorEmail] = useState('');
  const [newDoctorAffiliationType, setNewDoctorAffiliationType] = useState<'SELF' | 'ORGANIZATION'>('SELF');
  const [newDoctorOrganizationName, setNewDoctorOrganizationName] = useState('');
  const [newDoctorNotes, setNewDoctorNotes] = useState('');

  // Real-time duplicate doctor detection across master referrers roster
  const matchedExistingDoctors = useMemo(() => {
    const rawName = newDoctorName.trim().toLowerCase().replace(/^(dr\.?|doctor)\s+/i, '').replace(/[^\w\s]/g, '').trim();
    const cleanPhone = newDoctorPhone.replace(/\D/g, '');
    const cleanReg = newDoctorRegNo.trim().toLowerCase();

    if (!rawName && cleanPhone.length < 8 && !cleanReg) return [];

    return (referrers || []).filter(r => {
      // 1. Phone match
      if (cleanPhone.length >= 8 && r.phone) {
        const rPhone = r.phone.replace(/\D/g, '');
        if (rPhone && (rPhone.includes(cleanPhone) || cleanPhone.includes(rPhone))) return true;
      }
      // 2. Medical Registration number match
      if (cleanReg && r.registrationNo) {
        const rReg = r.registrationNo.trim().toLowerCase();
        if (rReg && (rReg === cleanReg || rReg.includes(cleanReg))) return true;
      }
      // 3. Normalized Name match
      if (rawName.length >= 3 && r.name) {
        const rName = r.name.toLowerCase().replace(/^(dr\.?|doctor)\s+/i, '').replace(/[^\w\s]/g, '').trim();
        if (rName === rawName || (rawName.length >= 4 && (rName.includes(rawName) || rawName.includes(rName)))) return true;
      }
      return false;
    });
  }, [newDoctorName, newDoctorPhone, newDoctorRegNo, referrers]);

  // Searchable Doctor Selector state & references
  const [doctorSearchQuery, setDoctorSearchQuery] = useState('');
  const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false);
  const doctorDropdownRef = useRef<HTMLDivElement>(null);

  // Decoupled Prescribing Doctor vs Referring Person / Beneficiary Partner
  const [isBeneficiaryDifferent, setIsBeneficiaryDifferent] = useState(initialDraft?.isBeneficiaryDifferent ?? false);
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<string>(initialDraft?.selectedBeneficiaryId || '');
  const [beneficiarySearchQuery, setBeneficiarySearchQuery] = useState('');
  const [isBeneficiaryDropdownOpen, setIsBeneficiaryDropdownOpen] = useState(false);
  const beneficiaryDropdownRef = useRef<HTMLDivElement>(null);

  // Close doctor & beneficiary dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (doctorDropdownRef.current && !doctorDropdownRef.current.contains(event.target as Node)) {
        setIsDoctorDropdownOpen(false);
      }
      if (beneficiaryDropdownRef.current && !beneficiaryDropdownRef.current.contains(event.target as Node)) {
        setIsBeneficiaryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Selected Doctor & Beneficiary Objects
  const selectedDoctorObj = useMemo(() => {
    if (!selectedDoctorId) return null;
    return referrers.find(r => r.id === selectedDoctorId) || null;
  }, [selectedDoctorId, referrers]);

  const selectedBeneficiaryObj = useMemo(() => {
    if (!selectedBeneficiaryId) return null;
    return referrers.find(r => r.id === selectedBeneficiaryId) || null;
  }, [selectedBeneficiaryId, referrers]);

  const isDocHardlinkedToPatientOrOrder = Boolean(
    (orderBeingEdited && (orderBeingEdited.referringDoctorId || orderBeingEdited.referringDoctorName)) ||
    (selectedPatientId && (patients.find(p => p.id === selectedPatientId)?.referringDoctorId || patients.find(p => p.id === selectedPatientId)?.referringDoctorName))
  );
  const canModifyPrescribingDoctor = isSuperAdmin || !isDocHardlinkedToPatientOrOrder;

  // Filtered lists for Doctor Combobox
  const filteredDoctors = useMemo(() => {
    const query = doctorSearchQuery.trim().toLowerCase();
    const match = (doc: any) => {
      if (!query) return true;
      const name = (doc.name || '').toLowerCase();
      const spec = (doc.specialty || '').toLowerCase();
      const hosp = (doc.hospital || '').toLowerCase();
      const org = (doc.organizationName || '').toLowerCase();
      const phone = (doc.phone || '').toLowerCase();
      const reg = (doc.registrationNumber || '').toLowerCase();
      return name.includes(query) || spec.includes(query) || hosp.includes(query) || org.includes(query) || phone.includes(query) || reg.includes(query);
    };
    return {
      approved: approvedReferrers.filter(match),
      pending: pendingReferrers.filter(match)
    };
  }, [doctorSearchQuery, approvedReferrers, pendingReferrers]);

  const filteredBeneficiaries = useMemo(() => {
    const query = beneficiarySearchQuery.trim().toLowerCase();
    if (!query) return referrers;
    return referrers.filter(r => {
      const name = (r.name || '').toLowerCase();
      const spec = (r.specialty || '').toLowerCase();
      const hosp = (r.hospital || '').toLowerCase();
      const org = (r.organizationName || '').toLowerCase();
      const phone = (r.phone || '').toLowerCase();
      return name.includes(query) || spec.includes(query) || hosp.includes(query) || org.includes(query) || phone.includes(query);
    });
  }, [beneficiarySearchQuery, referrers]);

  // Billing & Payment
  const [customTariff, setCustomTariff] = useState<number | null>(null);
  const [discountPct, setDiscountPct] = useState<number>(initialDraft?.discountPct !== undefined ? initialDraft.discountPct : 0);
  const [discountReason, setDiscountReason] = useState(initialDraft?.discountReason || '');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(initialDraft?.paymentMode || 'UPI / QR');
  const [paidAmount, setPaidAmount] = useState<number | ''>(initialDraft?.paidAmount !== undefined ? initialDraft.paidAmount : '');
  const [splitCashAmount, setSplitCashAmount] = useState<number | ''>('');
  const [splitOnlineAmount, setSplitOnlineAmount] = useState<number | ''>('');
  const [splitOnlineMode, setSplitOnlineMode] = useState<'UPI / QR' | 'Card' | 'Bank Transfer'>('UPI / QR');
  const [orderNotes, setOrderNotes] = useState(initialDraft?.orderNotes || '');

  // Pre-fill full invoice editing workspace when editing an existing order
  useEffect(() => {
    if (orderBeingEdited) {
      setActiveTab('REGISTRATION');
      setSelectedPatientId(orderBeingEdited.patientId || '');
      const parsed = parsePatientNameParts(orderBeingEdited.patient?.name || '');
      const titleVal = (orderBeingEdited.patient?.title as any) || parsed.title || (orderBeingEdited.patient?.gender === 'Female' ? 'Mrs.' : 'Mr.');
      const firstVal = orderBeingEdited.patient?.firstName || parsed.firstName || '';
      const lastVal = orderBeingEdited.patient?.lastName || parsed.lastName || '';
      setNewTitle(titleVal);
      setNewFirstName(firstVal);
      setNewLastName(lastVal);
      const combined = [titleVal, firstVal, lastVal].filter(Boolean).join(' ').trim() || (orderBeingEdited.patient?.name || '');
      setNewName(combined);
      setNewAge(orderBeingEdited.patient?.age !== undefined ? orderBeingEdited.patient.age : '');
      setNewAgeMonths(orderBeingEdited.patient?.ageMonths !== undefined ? orderBeingEdited.patient.ageMonths : '');
      setNewAgeDays(orderBeingEdited.patient?.ageDays !== undefined ? orderBeingEdited.patient.ageDays : '');
      setNewGender(orderBeingEdited.patient?.gender || 'Male');
      setNewPhone(orderBeingEdited.patient?.phone || '');
      setNewEmail(orderBeingEdited.patient?.email || '');
      setNewAddress(orderBeingEdited.patient?.address || '');
      setNewAbhaId(orderBeingEdited.patient?.abhaId || '');

      // Smart catalog matching for tests: match by id, code, or name
      const matchedTestIds: string[] = [];
      const orderTests = Array.isArray(orderBeingEdited.tests) ? orderBeingEdited.tests : [];
      orderTests.forEach(ot => {
        if (!ot) return;
        // 1. Direct ID in catalog
        const matchById = tests.find(ct => ct.id === ot.id);
        if (matchById) {
          if (!matchedTestIds.includes(matchById.id)) matchedTestIds.push(matchById.id);
          return;
        }
        // 2. Case-insensitive Name or Code match in catalog
        const otName = (ot.name || '').trim().toLowerCase();
        const otCode = (ot.code || '').trim().toLowerCase();
        const matchByNameOrCode = tests.find(ct => {
          const ctName = (ct.name || '').trim().toLowerCase();
          const ctCode = (ct.code || '').trim().toLowerCase();
          return (otName && ctName === otName) || (otCode && ctCode === otCode);
        });
        if (matchByNameOrCode) {
          if (!matchedTestIds.includes(matchByNameOrCode.id)) matchedTestIds.push(matchByNameOrCode.id);
          return;
        }
        // 3. Fallback: preserve the test's own ID so it remains active
        if (ot.id && !matchedTestIds.includes(ot.id)) {
          matchedTestIds.push(ot.id);
        }
      });
      setSelectedTestIds(matchedTestIds);

      // 1. Resolve matching doctor by ID or by name from live referrers
      const matchedDoc = referrers.find(r =>
        (orderBeingEdited.referringDoctorId && r.id === orderBeingEdited.referringDoctorId) ||
        (orderBeingEdited.referringDoctorName && r.name.toLowerCase() === orderBeingEdited.referringDoctorName.toLowerCase())
      );
      setSelectedDoctorId(matchedDoc ? matchedDoc.id : (orderBeingEdited.referringDoctorId || ''));

      // 2. Resolve linked beneficiary
      const isDiff = Boolean(
        orderBeingEdited.commissionBeneficiaryName &&
        orderBeingEdited.referringDoctorName &&
        orderBeingEdited.commissionBeneficiaryName.toLowerCase() !== orderBeingEdited.referringDoctorName.toLowerCase()
      );
      setIsBeneficiaryDifferent(isDiff);
      const matchedBen = isDiff ? referrers.find(r =>
        (orderBeingEdited.commissionBeneficiaryId && r.id === orderBeingEdited.commissionBeneficiaryId) ||
        (r.organizationName && r.organizationName.toLowerCase() === orderBeingEdited.commissionBeneficiaryName?.toLowerCase()) ||
        (r.name.toLowerCase() === orderBeingEdited.commissionBeneficiaryName?.toLowerCase())
      ) : null;
      setSelectedBeneficiaryId(matchedBen ? matchedBen.id : (orderBeingEdited.commissionBeneficiaryId || ''));
      setDiscountPct(orderBeingEdited.discountPct || 0);
      setDiscountReason(orderBeingEdited.discountReason || '');
      setPaymentMode(orderBeingEdited.paymentMode || 'UPI / QR');
      setPaidAmount(orderBeingEdited.paidAmount !== undefined ? orderBeingEdited.paidAmount : '');
      if (orderBeingEdited.paymentMode === 'Split Payment' && orderBeingEdited.splitPaymentDetails) {
        setSplitCashAmount(orderBeingEdited.splitPaymentDetails.cashAmount !== undefined ? orderBeingEdited.splitPaymentDetails.cashAmount : '');
        setSplitOnlineAmount(orderBeingEdited.splitPaymentDetails.onlineAmount !== undefined ? orderBeingEdited.splitPaymentDetails.onlineAmount : '');
        setSplitOnlineMode(orderBeingEdited.splitPaymentDetails.onlineMode || 'UPI / QR');
      } else {
        setSplitCashAmount('');
        setSplitOnlineAmount('');
        setSplitOnlineMode('UPI / QR');
      }
      setOrderNotes(orderBeingEdited.notes || '');
      setCustomTariff(orderBeingEdited.subtotal || orderBeingEdited.totalAmount || null);
      const normEditDate = normalizeToYYYYMMDD(orderBeingEdited.appointmentDate || orderBeingEdited.createdAt);
      if (normEditDate) {
        setAppointmentDate(normEditDate);
      }
      if (orderBeingEdited.appointmentTime) {
        setAppointmentTime(convert12To24HourTime(orderBeingEdited.appointmentTime));
      } else if (orderBeingEdited.createdAt) {
        const d = parseSafeDate(orderBeingEdited.createdAt);
        setAppointmentTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
      }
      setPatientStatusRemark(orderBeingEdited.patientStatusRemark || 'Standard Walk-in');
      setHasMissedAppointment(Boolean(orderBeingEdited.hasMissedAppointment));
      setMissedAppointmentNotes(orderBeingEdited.missedAppointmentNotes || '');
    }
  }, [orderBeingEdited, tests]);

  // Continuous Auto-Save of Order Draft to localStorage
  useEffect(() => {
    if (orderBeingEdited) return; // Do not overwrite regular registration draft while editing existing order
    const hasAnyContent = Boolean(
      selectedPatientId ||
      newFirstName.trim() ||
      newName.trim() ||
      newPhone.trim() ||
      selectedTestIds.length > 0 ||
      selectedDoctorId ||
      orderNotes.trim() ||
      discountPct > 0 ||
      (paidAmount !== '' && Number(paidAmount) > 0)
    );

    if (hasAnyContent) {
      const draft = {
        patientStatusRemark,
        customStatusRemark,
        hasMissedAppointment,
        missedAppointmentNotes,
        patientSearch,
        selectedPatientId,
        newTitle,
        newFirstName,
        newLastName,
        newName,
        newAge,
        newGender,
        newPhone,
        newEmail,
        newAddress,
        newAbhaId,
        appointmentDate,
        appointmentTime,
        selectedTestIds,
        selectedDoctorId,
        isBeneficiaryDifferent,
        selectedBeneficiaryId,
        discountPct,
        discountReason,
        paymentMode,
        paidAmount,
        orderNotes
      };
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      } catch (e) {
        console.error('Failed to auto-save patient order draft', e);
      }
    }
  }, [
    patientStatusRemark,
    customStatusRemark,
    hasMissedAppointment,
    missedAppointmentNotes,
    patientSearch,
    selectedPatientId,
    newTitle,
    newFirstName,
    newLastName,
    newName,
    newAge,
    newAgeMonths,
    newAgeDays,
    newGender,
    newPhone,
    newEmail,
    newAddress,
    newAbhaId,
    appointmentDate,
    appointmentTime,
    selectedTestIds,
    selectedDoctorId,
    isBeneficiaryDifferent,
    selectedBeneficiaryId,
    discountPct,
    discountReason,
    paymentMode,
    paidAmount,
    orderNotes
  ]);

  const handleClearDraft = () => {
    if (window.confirm('Clear all unsaved patient information and selected tests from this draft?')) {
      setSelectedPatientId('');
      setPatientSearch('');
      setNewTitle('Mr.');
      setNewFirstName('');
      setNewLastName('');
      setNewName('');
      setNewAge('');
      setNewAgeMonths('');
      setNewAgeDays('');
      setNewGender('Male');
      setNewPhone('');
      setNewEmail('');
      setNewAddress('');
      setNewAbhaId('');
      setSelectedTestIds([]);
      setSelectedDoctorId('');
      setIsBeneficiaryDifferent(false);
      setSelectedBeneficiaryId('');
      setDiscountPct(0);
      setDiscountReason('');
      setPaidAmount('');
      setOrderNotes('');
      setPatientStatusRemark('Standard Walk-in');
      setCustomStatusRemark('');
      setHasMissedAppointment(false);
      setMissedAppointmentNotes('');
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {}
      showToast('Patient order draft cleared.');
    }
  };

  // Edit Scheduled Appointment Modal State in Reception
  const [editingAppointment, setEditingAppointment] = useState<PatientAppointment | null>(null);
  const [editAptName, setEditAptName] = useState('');
  const [editAptPhone, setEditAptPhone] = useState('');
  const [editAptAge, setEditAptAge] = useState<number | ''>('');
  const [editAptGender, setEditAptGender] = useState('Male');
  const [editAptEmail, setEditAptEmail] = useState('');
  const [editAptDate, setEditAptDate] = useState('');
  const [editAptTime, setEditAptTime] = useState('');
  const [editAptDoctor, setEditAptDoctor] = useState('');
  const [editAptTest, setEditAptTest] = useState('');
  const [editAptNotes, setEditAptNotes] = useState('');
  const [editAptStatus, setEditAptStatus] = useState<AppointmentStatus>('SCHEDULED');

  const handleOpenEditAppointment = (apt: PatientAppointment) => {
    setEditingAppointment(apt);
    setEditAptName(apt.patientName);
    setEditAptPhone(apt.patientPhone);
    setEditAptAge(apt.patientAge !== undefined ? apt.patientAge : '');
    setEditAptGender(apt.patientGender || 'Male');
    setEditAptEmail(apt.patientEmail || '');
    setEditAptDate(apt.appointmentDate);
    setEditAptTime(apt.appointmentTime);
    setEditAptDoctor(apt.referringDoctorName || '');
    setEditAptTest((apt.testsRequested || []).join(', '));
    setEditAptNotes(apt.notes || '');
    setEditAptStatus(apt.status);
  };

  const handleSaveAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppointment) return;
    updateAppointment(editingAppointment.id, {
      patientName: editAptName,
      patientPhone: editAptPhone,
      patientAge: editAptAge !== '' ? Number(editAptAge) : undefined,
      patientGender: editAptGender,
      patientEmail: editAptEmail,
      appointmentDate: editAptDate,
      appointmentTime: editAptTime,
      referringDoctorName: editAptDoctor,
      testsRequested: editAptTest ? editAptTest.split(',').map(s => s.trim()).filter(Boolean) : editingAppointment.testsRequested,
      notes: editAptNotes,
      status: editAptStatus
    });
    showToast(`Updated scheduled appointment for ${editAptName}`);
    setEditingAppointment(null);
  };

  // Modals & Popups
  const [invoiceModalOrder, setInvoiceModalOrder] = useState<DiagnosticOrder | null>(null);
  const [reportPrintModalOrder, setReportPrintModalOrder] = useState<DiagnosticOrder | null>(null);
  const [dueCollectOrder, setDueCollectOrder] = useState<DiagnosticOrder | null>(null);
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [collectMode, setCollectMode] = useState<PaymentMode>('Cash');

  // Return & Refund Modal State
  const [refundModalOrder, setRefundModalOrder] = useState<DiagnosticOrder | null>(null);
  const [refundAmount, setRefundAmount] = useState<number | ''>('');
  const [refundMode, setRefundMode] = useState<PaymentMode>('Cash');
  const [refundReason, setRefundReason] = useState<string>('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [queueSearch, setQueueSearch] = useState('');
  const [queueStatusFilter, setQueueStatusFilter] = useState<string>('ALL');
  const [queueDateRange, setQueueDateRange] = useState<DatePresetType>('TODAY');
  const [queueStartDate, setQueueStartDate] = useState<string>('');
  const [queueEndDate, setQueueEndDate] = useState<string>('');

  const handleRegisterDoctorDirectly = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoctorName.trim()) {
      showToast('Please enter the doctor\'s full name.');
      return;
    }

    if (matchedExistingDoctors.length > 0) {
      const match = matchedExistingDoctors[0];
      const chooseExisting = window.confirm(
        `Doctor "${match.name}" already exists in the master roster (${match.specialty || 'Consultant'}${match.hospital ? ` at ${match.hospital}` : ''})!\n\n` +
        `• Click "OK" to SELECT this existing doctor (Recommended to avoid duplicate records).\n` +
        `• Click "Cancel" if this is a different doctor and you wish to submit a separate new registration.`
      );
      if (chooseExisting) {
        setSelectedDoctorId(match.id);
        if (!isBeneficiaryDifferent) setSelectedBeneficiaryId(match.id);
        setIsAddingNewDoctor(false);
        setIsStandaloneDoctorModalOpen(false);
        setNewDoctorName('');
        setNewDoctorQualification('');
        setNewDoctorSpecialty('');
        setNewDoctorHospital('');
        setNewDoctorRegNo('');
        setNewDoctorPhone('');
        setNewDoctorEmail('');
        setNewDoctorOrganizationName('');
        setNewDoctorNotes('');
        showToast(`Linked to existing doctor: ${match.name} (${match.id})`);
        return;
      }
    }

    const createdId = addReferringDoctor({
      name: newDoctorName.trim(),
      qualification: newDoctorQualification.trim(),
      specialty: newDoctorSpecialty.trim(),
      hospital: newDoctorHospital.trim() || '',
      registrationNo: newDoctorRegNo.trim(),
      phone: newDoctorPhone.trim(),
      email: newDoctorEmail.trim() || '',
      notes: newDoctorNotes.trim(),
      commissionPct: 0, // Commission is allotted by Super Admin upon approval
      affiliationType: newDoctorAffiliationType,
      organizationName: newDoctorAffiliationType === 'ORGANIZATION' ? newDoctorOrganizationName.trim() : undefined,
      status: 'PENDING_APPROVAL',
      addedByRole: 'RECEPTIONIST'
    });

    showToast(`${newDoctorName.trim()} registered! Submitted for Super Admin approval & commission allotment.`);
    
    if (newDoctorPhone.trim()) {
      sendWelcomeDoctorWhatsApp({
        name: newDoctorName.trim(),
        phone: newDoctorPhone.trim(),
        specialty: newDoctorSpecialty.trim() || '',
        hospital: newDoctorHospital.trim() || '',
      });
    }

    setSelectedDoctorId(createdId);
    setIsAddingNewDoctor(false);
    setIsStandaloneDoctorModalOpen(false);
    setNewDoctorName('');
    setNewDoctorQualification('');
    setNewDoctorSpecialty('');
    setNewDoctorHospital('');
    setNewDoctorRegNo('');
    setNewDoctorPhone('');
    setNewDoctorEmail('');
    setNewDoctorOrganizationName('');
    setNewDoctorNotes('');
  };

  // Selected tests memo: includes catalog matches AND any preserved tests from orderBeingEdited
  const selectedTests: DiagnosticTestItem[] = useMemo(() => {
    const catalogMatched = tests.filter(t => selectedTestIds.includes(t.id));
    if (orderBeingEdited && Array.isArray(orderBeingEdited.tests)) {
      const extraFromOrder = orderBeingEdited.tests.filter(ot => {
        if (!selectedTestIds.includes(ot.id)) return false;
        const existsInCatalog = catalogMatched.some(ct => 
          ct.id === ot.id || 
          (ct.name && ot.name && ct.name.trim().toLowerCase() === ot.name.trim().toLowerCase())
        );
        return !existsInCatalog;
      });
      return [...catalogMatched, ...extraFromOrder];
    }
    return catalogMatched;
  }, [tests, selectedTestIds, orderBeingEdited]);

  const computedSubtotal = selectedTests.reduce((sum, t) => sum + (Number(t.price) || 0), 0);
  const subtotal = computedSubtotal > 0
    ? computedSubtotal
    : (customTariff !== null ? customTariff : (orderBeingEdited ? (orderBeingEdited.subtotal || orderBeingEdited.totalAmount || 0) : 0));
  const safeDiscountPct = Math.min(100, Math.max(0, discountPct));
  const discountAmount = Math.round(subtotal * (safeDiscountPct / 100));
  const netTotal = Math.max(0, subtotal - discountAmount);
  const numericPaid = paymentMode === 'Split Payment'
    ? Math.round((Number(splitCashAmount) || 0) + (Number(splitOnlineAmount) || 0))
    : (paidAmount === '' ? netTotal : Math.round(Number(paidAmount) || 0));
  const balanceDue = Math.max(0, netTotal - numericPaid);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSelectExistingPatient = (p: Patient) => {
    setSelectedPatientId(p.id);
    const parsed = parsePatientNameParts(p.name || '');
    const titleVal = (p.title as any) || parsed.title || (p.gender === 'Female' ? 'Mrs.' : 'Mr.');
    const firstVal = p.firstName || parsed.firstName || '';
    const lastVal = p.lastName || parsed.lastName || '';
    setNewTitle(titleVal);
    setNewFirstName(firstVal);
    setNewLastName(lastVal);
    const fullCombined = [titleVal, firstVal, lastVal].filter(Boolean).join(' ').trim() || p.name;
    setNewName(fullCombined);
    setNewAge(p.age !== undefined && p.age !== null ? p.age : '');
    setNewAgeMonths(p.ageMonths !== undefined && p.ageMonths !== null ? p.ageMonths : '');
    setNewAgeDays(p.ageDays !== undefined && p.ageDays !== null ? p.ageDays : '');
    setNewGender(p.gender);
    setNewPhone(p.phone);
    setNewEmail(p.email || '');
    setNewAddress(p.address || '');
    setNewAbhaId(p.abhaId || '');
    setPatientSearch('');
    const lastOrderForPatient = allOrders.find(o => o.patientId === p.id || o.patient?.phone === p.phone);
    const targetDocId = p.referringDoctorId || p.beneficiaryId || lastOrderForPatient?.referringDoctorId;
    const targetDocName = p.referringDoctorName || lastOrderForPatient?.referringDoctorName;
    const targetBenId = p.commissionBeneficiaryId || lastOrderForPatient?.commissionBeneficiaryId;
    const targetBenName = p.commissionBeneficiaryName || lastOrderForPatient?.commissionBeneficiaryName;

    if (targetDocId || targetDocName) {
      const matchDoc = referrers.find(r => (targetDocId && r.id === targetDocId) || (targetDocName && r.name.toLowerCase() === targetDocName.toLowerCase()));
      if (matchDoc) {
        setSelectedDoctorId(matchDoc.id);
      }
    }
    if (targetBenName && targetDocName && targetBenName.toLowerCase() !== targetDocName.toLowerCase()) {
      setIsBeneficiaryDifferent(true);
      const matchBen = referrers.find(r => (targetBenId && r.id === targetBenId) || (targetBenName && (r.organizationName?.toLowerCase() === targetBenName.toLowerCase() || r.name.toLowerCase() === targetBenName.toLowerCase())));
      if (matchBen) {
        setSelectedBeneficiaryId(matchBen.id);
      }
    }
  };

  // Keyboard Escape handler for UI symmetry
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsStandaloneDoctorModalOpen(false);
        setIsScheduleModalOpen(false);
        setDueCollectOrder(null);
        setInvoiceModalOrder(null);
        setReportPrintModalOrder(null);
        setRefundModalOrder(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleScheduleAppointmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAptPatientName.trim() || !newAptPatientPhone.trim()) {
      showToast('Please provide patient name and phone number.');
      return;
    }

    addAppointment({
      patientName: newAptPatientName.trim(),
      patientPhone: newAptPatientPhone.trim(),
      patientEmail: newAptPatientEmail.trim() || undefined,
      patientAge: newAptPatientAge === '' ? undefined : Number(newAptPatientAge),
      patientGender: newAptPatientGender,
      appointmentDate: newAptDate,
      appointmentTime: newAptTime,
      testsRequested: newAptTest.trim() ? [newAptTest.trim()] : ['General Diagnostic Evaluation'],
      referringDoctorName: newAptDoctor.trim() || 'Direct Walk-in',
      centerId: selectedCenter.id,
      status: 'SCHEDULED',
      notes: newAptNotes.trim() || undefined
    });

    showToast(`Appointment booked for ${newAptPatientName} on ${newAptDate} at ${newAptTime}`);
    setIsScheduleModalOpen(false);

    setNewAptPatientName('');
    setNewAptPatientPhone('');
    setNewAptPatientEmail('');
    setNewAptPatientAge('');
    setNewAptPatientGender('Male');
    setNewAptTest('');
    setNewAptDoctor('');
    setNewAptNotes('');
  };

  const handleConvertAppointmentToOrder = (apt: any) => {
    // 1. Look for existing patient with matching phone or name
    const existingPatient = patients.find(p => (p.phone && p.phone === apt.patientPhone) || (p.name && (p.name || '').toLowerCase() === (apt.patientName || '').toLowerCase()));
    if (existingPatient) {
      handleSelectExistingPatient(existingPatient);
    } else {
      setSelectedPatientId('');
      const parsed = parsePatientNameParts(apt.patientName || '');
      const titleVal = (apt.patientGender === 'Female' ? 'Mrs.' : 'Mr.') as any;
      setNewTitle(titleVal);
      setNewFirstName(parsed.firstName);
      setNewLastName(parsed.lastName);
      const fullCombined = [titleVal, parsed.firstName, parsed.lastName].filter(Boolean).join(' ').trim() || (apt.patientName || '');
      setNewName(fullCombined);
      setNewPhone(apt.patientPhone || '');
      setNewEmail(apt.patientEmail || '');
      setNewAge(apt.patientAge || '');
      setNewGender(apt.patientGender || 'Male');
    }

    // 2. Select any matching tests from test catalog
    const matchedTestIds: string[] = [];
    (apt.testsRequested || []).forEach((reqTestName: string) => {
      const found = tests.find(t => (t.name || '').toLowerCase() === (reqTestName || '').toLowerCase() || (t.code || '').toLowerCase() === (reqTestName || '').toLowerCase());
      if (found && !matchedTestIds.includes(found.id)) {
        matchedTestIds.push(found.id);
      }
    });
    if (matchedTestIds.length > 0) {
      setSelectedTestIds(matchedTestIds);
    }

    // 3. Select doctor if matching
    if (apt.referringDoctorName && apt.referringDoctorName !== 'Direct Walk-in') {
      const doc = referrers.find(r => (r.name || '').toLowerCase().includes(apt.referringDoctorName.toLowerCase()));
      if (doc) setSelectedDoctorId(doc.id);
    }

    // 4. Set appointment date & time
    if (apt.appointmentDate) setAppointmentDate(apt.appointmentDate);
    if (apt.appointmentTime) setAppointmentTime(apt.appointmentTime);

    // 5. Patient status remark and missed appointment status
    if (apt.status === 'MISSED' || apt.isMissed) {
      setHasMissedAppointment(true);
      setMissedAppointmentNotes(`Prior appointment was missed on ${apt.appointmentDate} (${apt.appointmentTime})`);
      setPatientStatusRemark('Standard Walk-in');
    } else {
      setHasMissedAppointment(false);
      setMissedAppointmentNotes('');
    }

    if (apt.notes) {
      setOrderNotes(apt.notes);
    }

    // 6. Switch to Registration tab
    setActiveTab('REGISTRATION');
    showToast(`Loaded appointment for ${apt.patientName}. Proceed with billing.`);
  };

  const filteredAppointments = useMemo(() => {
    const todayStr = getLocalYYYYMMDD();
    return appointments.filter(apt => {
      const aptDateNorm = normalizeToYYYYMMDD(apt.appointmentDate);
      if (aptDateFilter === 'TODAY' && aptDateNorm !== todayStr) return false;
      if (aptDateFilter === 'UPCOMING' && aptDateNorm < todayStr) return false;
      if (aptStatusFilter !== 'ALL' && apt.status !== aptStatusFilter) return false;

      if (aptSearch.trim()) {
        const q = aptSearch.toLowerCase().trim();
        const matchName = (apt.patientName || '').toLowerCase().includes(q);
        const matchPhone = (apt.patientPhone || '').includes(q);
        const matchDoctor = (apt.referringDoctorName || '').toLowerCase().includes(q);
        const matchTest = (apt.testsRequested || []).some(t => (t || '').toLowerCase().includes(q));
        const matchNotes = (apt.notes || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchDoctor && !matchTest && !matchNotes) return false;
      }

      return true;
    });
  }, [appointments, aptDateFilter, aptStatusFilter, aptSearch]);

  const handleToggleTest = (testId: string) => {
    setSelectedTestIds(prev => 
      prev.includes(testId) ? prev.filter(id => id !== testId) : [...prev, testId]
    );
  };

  const handleCreateOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const combinedFullName = [newTitle, newFirstName.trim(), newLastName.trim()].filter(Boolean).join(' ').trim() || newName.trim();

      if (!selectedPatientId && (!newFirstName.trim() || !newPhone.trim() || (newAge === '' && newAgeMonths === '' && newAgeDays === ''))) {
        showToast('Please provide patient first name, age (years, months, or days), and phone number.');
        return;
      }

      if (selectedTestIds.length === 0) {
        showToast('Please select at least one diagnostic test.');
        return;
      }

      let finalPatient: Patient | undefined;
      let finalPatientId = selectedPatientId;
      if (selectedPatientId) {
        finalPatient = patients.find(p => p.id === selectedPatientId);
      } else {
        finalPatient = registerPatient({
          name: combinedFullName,
          title: newTitle,
          firstName: newFirstName.trim(),
          lastName: newLastName.trim(),
          age: Number(newAge) || 0,
          ageMonths: Number(newAgeMonths) || 0,
          ageDays: Number(newAgeDays) || 0,
          ageDisplay: [Number(newAge) > 0 ? `${Number(newAge)}Y` : '', Number(newAgeMonths) > 0 ? `${Number(newAgeMonths)}M` : '', Number(newAgeDays) > 0 ? `${Number(newAgeDays)}D` : ''].filter(Boolean).join(' ') || `${Number(newAge) || 0}Y`,
          gender: newGender,
          phone: newPhone.trim(),
          email: newEmail.trim() || '',
          address: newAddress.trim() || '',
          abhaId: newAbhaId.trim() || undefined
        });
        finalPatientId = finalPatient.id;
        if (finalPatient.phone) {
          sendWelcomePatientWhatsApp(finalPatient);
        }
      }

      const finalStatusRemark = patientStatusRemark === 'Custom Remark' ? customStatusRemark.trim() : patientStatusRemark;

      if (orderBeingEdited) {
        const docObj = selectedDoctorId ? referrers.find(r => r.id === selectedDoctorId) : undefined;
        const beneficiaryObj = (isBeneficiaryDifferent && selectedBeneficiaryId) ? referrers.find(r => r.id === selectedBeneficiaryId) : undefined;

        const updatedPatientData = {
          ...orderBeingEdited.patient,
          name: combinedFullName || orderBeingEdited.patient.name,
          title: newTitle,
          firstName: newFirstName.trim() || orderBeingEdited.patient.firstName,
          lastName: newLastName.trim() || orderBeingEdited.patient.lastName,
          age: (newAge !== '' ? Number(newAge) : (orderBeingEdited.patient?.age || 0)) || 0,
          ageMonths: (newAgeMonths !== '' ? Number(newAgeMonths) : (orderBeingEdited.patient?.ageMonths || 0)) || 0,
          ageDays: (newAgeDays !== '' ? Number(newAgeDays) : (orderBeingEdited.patient?.ageDays || 0)) || 0,
          ageDisplay: [
            (newAge !== '' ? Number(newAge) : (orderBeingEdited.patient?.age || 0)) > 0 ? `${(newAge !== '' ? Number(newAge) : (orderBeingEdited.patient?.age || 0))}Y` : '',
            (newAgeMonths !== '' ? Number(newAgeMonths) : (orderBeingEdited.patient?.ageMonths || 0)) > 0 ? `${(newAgeMonths !== '' ? Number(newAgeMonths) : (orderBeingEdited.patient?.ageMonths || 0))}M` : '',
            (newAgeDays !== '' ? Number(newAgeDays) : (orderBeingEdited.patient?.ageDays || 0)) > 0 ? `${(newAgeDays !== '' ? Number(newAgeDays) : (orderBeingEdited.patient?.ageDays || 0))}D` : ''
          ].filter(Boolean).join(' ') || `${(newAge !== '' ? Number(newAge) : (orderBeingEdited.patient?.age || 0)) || 0}Y`,
          gender: newGender || orderBeingEdited.patient.gender || 'Male',
          phone: newPhone.trim() || orderBeingEdited.patient.phone || '',
          email: newEmail.trim() || orderBeingEdited.patient.email || '',
          address: newAddress.trim() || orderBeingEdited.patient.address || '',
          abhaId: newAbhaId.trim() || orderBeingEdited.patient.abhaId || undefined,
        };

        if (selectedPatientId && updatePatient) {
          updatePatient(selectedPatientId, updatedPatientData);
        }

        // Compute updated createdAt safely in local time so it never shifts by 1 day
        const normDate = normalizeToYYYYMMDD(appointmentDate || orderBeingEdited.appointmentDate || orderBeingEdited.createdAt) || getLocalYYYYMMDD();
        const updatedCreatedAt = buildSafeISOFromLocalDateAndTime(normDate, appointmentTime, orderBeingEdited.createdAt);

        updateOrder(orderBeingEdited.id, {
          patientId: finalPatientId,
          patient: updatedPatientData,
          createdAt: updatedCreatedAt,
          tests: selectedTests.length > 0 ? selectedTests : (orderBeingEdited.tests || []),
          subtotal: subtotal,
          discountPct: safeDiscountPct,
          discountAmount,
          discountReason: discountAmount > 0 ? (discountReason || 'Authorized front-desk concession') : undefined,
          totalAmount: netTotal,
          paidAmount: numericPaid,
          dueAmount: balanceDue,
          paymentMode,
          splitPaymentDetails: paymentMode === 'Split Payment' ? {
            cashAmount: Number(splitCashAmount) || 0,
            onlineAmount: Number(splitOnlineAmount) || 0,
            onlineMode: splitOnlineMode
          } : undefined,
          paymentStatus: balanceDue === 0 ? 'PAID' : (numericPaid > 0 ? 'PARTIAL' : 'DUE'),
          referringDoctorId: selectedDoctorId || orderBeingEdited.referringDoctorId || undefined,
          referringDoctorName: docObj ? docObj.name : (selectedDoctorId ? selectedDoctorId : (orderBeingEdited.referringDoctorName || 'Direct Walk-in')),
          commissionBeneficiaryId: isBeneficiaryDifferent && selectedBeneficiaryId ? selectedBeneficiaryId : (docObj ? docObj.id : (orderBeingEdited.commissionBeneficiaryId || undefined)),
          commissionBeneficiaryName: isBeneficiaryDifferent && selectedBeneficiaryId 
            ? (beneficiaryObj ? (beneficiaryObj.organizationName || beneficiaryObj.name) : (orderBeingEdited.commissionBeneficiaryName || undefined)) 
            : (docObj ? (docObj.organizationName || docObj.name) : (orderBeingEdited.commissionBeneficiaryName || undefined)),
          appointmentDate: normDate,
          appointmentTime,
          notes: orderNotes,
          patientStatusRemark: finalStatusRemark || undefined,
          hasMissedAppointment,
          missedAppointmentNotes: hasMissedAppointment ? missedAppointmentNotes : undefined
        });

        const invoiceNum = orderBeingEdited.invoiceNumber;
        cancelEditingOrder();

        // Reset Form
        setSelectedPatientId('');
        setNewTitle('Mr.');
        setNewFirstName('');
        setNewLastName('');
        setNewName('');
        setNewAge('');
        setNewAgeMonths('');
        setNewAgeDays('');
        setNewPhone('');
        setNewEmail('');
        setNewAddress('');
        setNewAbhaId('');
        setSelectedTestIds([]);
        setSelectedDoctorId('');
        setIsBeneficiaryDifferent(false);
        setSelectedBeneficiaryId('');
        setIsAddingNewDoctor(false);
        setNewDoctorName('');
        setDiscountPct(0);
        setDiscountReason('');
        setPaidAmount('');
        setSplitCashAmount('');
        setSplitOnlineAmount('');
        setSplitOnlineMode('UPI / QR');
        setOrderNotes('');
        setCustomTariff(null);
        setPatientStatusRemark('Standard Walk-in');
        setCustomStatusRemark('');
        setHasMissedAppointment(false);
        setMissedAppointmentNotes('');
        try {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        } catch {}

        showToast(`Invoice #${invoiceNum} successfully updated!`);
        setActiveTab('ORDERS_QUEUE');
        return;
      }

      const effectiveDoc = selectedDoctorId ? referrers.find(r => r.id === selectedDoctorId) : undefined;
      const effectiveBen = (isBeneficiaryDifferent && selectedBeneficiaryId) ? referrers.find(r => r.id === selectedBeneficiaryId) : undefined;

      const createdOrder = createOrder({
        patientId: finalPatientId,
        patient: finalPatient,
        testIds: selectedTestIds,
        referringDoctorId: selectedDoctorId || undefined,
        commissionBeneficiaryId: isBeneficiaryDifferent && selectedBeneficiaryId ? selectedBeneficiaryId : (effectiveDoc ? effectiveDoc.id : undefined),
        commissionBeneficiaryName: isBeneficiaryDifferent && selectedBeneficiaryId 
          ? (effectiveBen ? (effectiveBen.organizationName || effectiveBen.name) : undefined) 
          : (effectiveDoc ? (effectiveDoc.organizationName || effectiveDoc.name) : undefined),
        discountPct,
        discountReason: discountPct > 0 ? (discountReason || 'Authorized front-desk concession') : undefined,
        paidAmount: numericPaid,
        paymentMode,
        splitPaymentDetails: paymentMode === 'Split Payment' ? {
          cashAmount: Number(splitCashAmount) || 0,
          onlineAmount: Number(splitOnlineAmount) || 0,
          onlineMode: splitOnlineMode
        } : undefined,
        appointmentDate,
        appointmentTime,
        notes: orderNotes,
        patientStatusRemark: finalStatusRemark || undefined,
        hasMissedAppointment,
        missedAppointmentNotes: hasMissedAppointment ? missedAppointmentNotes : undefined
      });

      // Reset Form
      setSelectedPatientId('');
      setNewTitle('Mr.');
      setNewFirstName('');
      setNewLastName('');
      setNewName('');
      setNewAge('');
      setNewAgeMonths('');
      setNewAgeDays('');
      setNewPhone('');
      setNewEmail('');
      setNewAddress('');
      setNewAbhaId('');
      setSelectedTestIds([]);
      setSelectedDoctorId('');
      setIsBeneficiaryDifferent(false);
      setSelectedBeneficiaryId('');
      setIsAddingNewDoctor(false);
      setNewDoctorName('');
      setDiscountPct(0);
      setDiscountReason('');
      setPaidAmount('');
      setOrderNotes('');
      setCustomTariff(null);
      setPatientStatusRemark('Standard Walk-in');
      setCustomStatusRemark('');
      setHasMissedAppointment(false);
      setMissedAppointmentNotes('');
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {}

      setInvoiceModalOrder(createdOrder);
      const isBackDate = appointmentDate && appointmentDate !== getLocalYYYYMMDD();
      if (isBackDate) {
        setQueueDateRange('ALL');
        showToast(`Patient registered! Back-date Bill #${createdOrder.invoiceNumber} recorded for ${appointmentDate}.`);
      } else {
        showToast(`Patient registered! Bill #${createdOrder.invoiceNumber} created (Status: Sample Pending).`);
      }
      setActiveTab('ORDERS_QUEUE');
    } catch (err: any) {
      console.error('Failed to generate invoice:', err);
      showToast(`Error: ${err?.message || 'Failed to generate invoice. Please try again.'}`);
    }
  };

  const handleSendWhatsApp = (order: DiagnosticOrder) => {
    const whatsappUrl = dispatchReportViaWhatsApp(order.id, order.patient.phone);
    window.open(whatsappUrl, '_blank');
    showToast(`WhatsApp report message opened for ${order.patient.name} (${order.patient.phone})`);
  };

  const handleCollectDueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dueCollectOrder || collectAmount <= 0) return;
    markPaymentReceived(dueCollectOrder.id, collectAmount, collectMode);
    showToast(`Payment of ₹${collectAmount} recorded for Bill #${dueCollectOrder.invoiceNumber}`);
    setDueCollectOrder(null);
    setCollectAmount(0);
  };

  const handleProcessRefundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundModalOrder) return;
    const numAmount = Number(refundAmount);
    const existingRefund = refundModalOrder.refundAmount || 0;
    const remainingPaid = Math.max(0, refundModalOrder.paidAmount - existingRefund);

    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('Please enter a valid refund amount.');
      return;
    }
    if (numAmount > remainingPaid) {
      showToast(`Refund amount cannot exceed remaining collected balance of ₹${remainingPaid.toLocaleString()}.`);
      return;
    }
    if (!refundReason.trim()) {
      showToast('Mandatory: Please provide a reason note for processing this return/refund.');
      return;
    }

    processOrderRefund(refundModalOrder.id, numAmount, refundReason.trim(), refundMode);
    showToast(`Refund of ₹${numAmount.toLocaleString()} recorded for Bill #${refundModalOrder.invoiceNumber}`);
    setRefundModalOrder(null);
    setRefundAmount('');
    setRefundReason('');
  };

  const filteredOrders = orders.filter(ord => {
    if (ord.isDeleted || ord.deletionPendingApproval) return false;

    const dateMatches = 
      isDateInSelectedRange(ord.createdAt, queueDateRange, queueStartDate, queueEndDate) ||
      (ord.appointmentDate && isDateInSelectedRange(ord.appointmentDate, queueDateRange, queueStartDate, queueEndDate));

    const q = (queueSearch || '').toLowerCase().trim();
    if (q) {
      const matchesSearch = 
        (ord.patient?.name || '').toLowerCase().includes(q) ||
        (ord.patientId || '').toLowerCase().includes(q) ||
        (ord.id || '').toLowerCase().includes(q) ||
        ((ord.invoiceNumber || '').toLowerCase().includes(q)) ||
        (ord.barcode || '').toLowerCase().includes(q) ||
        (ord.referringDoctorName || '').toLowerCase().includes(q) ||
        (ord.commissionBeneficiaryName || '').toLowerCase().includes(q);
      
      // If user is searching explicitly (e.g. typing invoice number or name), prioritize showing the match
      if (matchesSearch && q.length >= 2) {
        if (queueStatusFilter === 'ALL') return true;
        return ord.status === queueStatusFilter;
      }
      if (!matchesSearch) return false;
    }

    if (!dateMatches) return false;
    if (queueStatusFilter === 'ALL') return true;
    return ord.status === queueStatusFilter;
  });

  const queueCashIncome = useMemo(() => {
    return filteredOrders
      .reduce((sum, o) => {
        if (o.paymentMode === 'Cash') {
          return sum + (o.paidAmount - (o.refundAmount || 0));
        }
        if (o.paymentMode === 'Split Payment' && o.splitPaymentDetails) {
          return sum + (Number(o.splitPaymentDetails.cashAmount) || 0);
        }
        return sum;
      }, 0);
  }, [filteredOrders]);

  const queueOnlineIncome = useMemo(() => {
    return filteredOrders
      .reduce((sum, o) => {
        if (o.paymentMode === 'Split Payment' && o.splitPaymentDetails) {
          return sum + (Number(o.splitPaymentDetails.onlineAmount) || 0);
        }
        if (o.paymentMode !== 'Cash' && o.paymentMode !== 'Split Payment') {
          return sum + (o.paidAmount - (o.refundAmount || 0));
        }
        return sum;
      }, 0);
  }, [filteredOrders]);

  const queueTotalRefunds = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (o.refundAmount || 0), 0);
  }, [filteredOrders]);

  const queueTotalDue = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (o.dueAmount || 0), 0);
  }, [filteredOrders]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-sky-900 border border-sky-600 text-white rounded-2xl shadow-2xl animate-fade-in text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-cyan-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner with Receptionist & Center Status */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-white border border-sky-100 rounded-3xl shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl border border-sky-100">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Front-Desk Reception Station
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold">
                {selectedCenter.code}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Operating for <strong>{selectedCenter.name}</strong> • Active Staff: <strong>{currentStaff?.name || 'Reception Staff'}</strong>
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('REGISTRATION')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'REGISTRATION'
                ? (orderBeingEdited ? 'bg-amber-600 text-white shadow-xs' : 'bg-sky-600 text-white shadow-xs')
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {orderBeingEdited ? (
              <>
                <Edit3 className="w-4 h-4 text-amber-200" />
                <span>Editing Bill #{orderBeingEdited.invoiceNumber}</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>New Patient & Bill</span>
              </>
            )}
          </button>
          <button
            onClick={() => setActiveTab('ORDERS_QUEUE')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ORDERS_QUEUE'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Center Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('APPOINTMENTS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'APPOINTMENTS'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Appointments ({appointments.length})
          </button>
        </div>
      </div>

      {/* TAB 1: REGISTRATION & BILLING */}
      {activeTab === 'REGISTRATION' && (
        <form onSubmit={handleCreateOrderSubmit} className="space-y-6">
          {orderBeingEdited && (
            <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-amber-600/20 border border-amber-400/40 animate-fade-in">
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 bg-white/20 rounded-2xl shrink-0 backdrop-blur-xs">
                  <Edit3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-black text-sm sm:text-base flex items-center gap-2 flex-wrap">
                    <span>Editing Invoice:</span>
                    <span className="font-mono bg-black/25 px-2.5 py-0.5 rounded-lg text-xs font-black">
                      #{orderBeingEdited.invoiceNumber}
                    </span>
                    <span className="text-amber-100 font-bold">• Patient: {orderBeingEdited.patient.name}</span>
                  </div>
                  <p className="text-xs text-amber-100 mt-1">
                    You have full access to change patient details, add/remove diagnostic tests, update referring doctor, or adjust prices and discounts. Click &ldquo;Update Invoice&rdquo; at the bottom when finished.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    cancelEditingOrder();
                    setSelectedPatientId('');
                    setPatientSearch('');
                    setNewTitle('Mr.');
                    setNewFirstName('');
                    setNewLastName('');
                    setNewName('');
                    setNewAge('');
                    setNewPhone('');
                    setNewEmail('');
                    setNewAddress('');
                    setNewAbhaId('');
                    setSelectedTestIds([]);
                    setSelectedDoctorId('');
                    setIsBeneficiaryDifferent(false);
                    setSelectedBeneficiaryId('');
                    setDiscountPct(0);
                    setDiscountReason('');
                    setPaidAmount('');
                    setOrderNotes('');
                    setCustomTariff(null);
                    showToast('Cancelled invoice editing.');
                  }}
                  className="px-4 py-2 bg-white text-amber-900 hover:bg-amber-50 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  Cancel Editing
                </button>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left 7 Columns: Patient Demographics & Tests */}
            <div className="lg:col-span-7 space-y-6">
              {/* Patient Intake Card */}
              <div className="bg-white border border-sky-100 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <User className="w-4 h-4 text-sky-600" />
                    1. Patient Identification & Demographics
                  </h3>
                  <div className="flex items-center gap-2">
                    {(Boolean(newName || selectedPatientId || selectedTestIds.length > 0 || selectedDoctorId)) && (
                      <>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Auto-saved Draft
                        </span>
                        <button
                          type="button"
                          onClick={handleClearDraft}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                          title="Reset and clear current registration draft"
                        >
                          Clear Draft
                        </button>
                      </>
                    )}
                    <span className="text-[11px] font-semibold text-slate-400">
                      Walk-in / OPD / IPD
                    </span>
                  </div>
                </div>

                {/* Patient Search Autocomplete */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={patientSearch}
                    onFocus={() => setIsPatientSearchFocused(true)}
                    onBlur={() => setTimeout(() => setIsPatientSearchFocused(false), 250)}
                    onChange={e => {
                      setPatientSearch(e.target.value);
                      setIsPatientSearchFocused(true);
                    }}
                    placeholder="Search returning patient by Name, Phone, or UHID (or click to see recent)..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-10 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all font-medium"
                  />
                  {patientSearch && (
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setPatientSearch('');
                      }}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {isPatientSearchFocused && (
                    <div className="absolute z-30 top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100 animate-fade-in">
                      {filteredPatientsForSearch.length > 0 ? (
                        <>
                          <div className="px-3.5 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                            <span>{patientSearch.trim() ? 'Matching Patients' : 'Recent Registered Patients'}</span>
                            <span className="text-[9px] text-sky-700 font-semibold">{filteredPatientsForSearch.length} found</span>
                          </div>
                          {filteredPatientsForSearch.map(p => (
                            <div
                              key={p.id}
                              className="p-3 hover:bg-sky-50 flex justify-between items-center text-xs transition-colors group"
                            >
                              <div
                                className="flex-1 cursor-pointer"
                                onMouseDown={() => {
                                  handleSelectExistingPatient(p);
                                  setIsPatientSearchFocused(false);
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 group-hover:text-sky-900">{p.name}</span>
                                  <span className="text-[10px] text-slate-500 font-semibold">({p.gender?.[0] || 'M'}/{p.age}y)</span>
                                </div>
                                <p className="text-[11px] text-sky-700 font-mono mt-0.5">
                                  UHID: {p.id} {p.phone && `• 📞 ${p.phone}`}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 ml-2">
                                <button
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setViewingPatientDetails(p);
                                    setIsPatientSearchFocused(false);
                                  }}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                                  title="View Demographics & History (Read Only)"
                                >
                                  <Eye className="w-3 h-3 text-slate-500" />
                                  Details
                                </button>
                                <button
                                  type="button"
                                  onMouseDown={() => {
                                    handleSelectExistingPatient(p);
                                    setIsPatientSearchFocused(false);
                                  }}
                                  className="px-2.5 py-1 bg-sky-100 group-hover:bg-sky-600 group-hover:text-white text-sky-800 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                                >
                                  Select Patient
                                </button>
                              </div>
                            </div>
                          ))}
                        </>
                      ) : (
                        <div className="p-4 text-center text-xs text-slate-500 space-y-1">
                          <p className="font-bold text-slate-700">No patient found matching "{patientSearch}"</p>
                          <p className="text-[11px] text-slate-400">
                            Fill in the demographic fields below to register as a new patient.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {selectedPatientId && (
                  <div className="p-3 bg-sky-50 border border-sky-200 rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                      <div>
                        <span className="font-bold text-sky-900 block">Existing Patient: {newName}</span>
                        <span className="text-[10px] text-sky-700 font-mono">UHID: {selectedPatientId}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const matched = allKnownPatients.find(p => p.id === selectedPatientId) || {
                            id: selectedPatientId,
                            name: newName,
                            age: Number(newAge) || 0,
                            gender: newGender,
                            phone: newPhone,
                            email: newEmail,
                            address: newAddress,
                            abhaId: newAbhaId,
                            registeredAt: new Date().toISOString()
                          };
                          setViewingPatientDetails(matched);
                        }}
                        className="px-2.5 py-1 bg-white border border-sky-300 text-sky-800 font-bold rounded-xl text-[10px] hover:bg-sky-50 transition-all cursor-pointer shadow-xs flex items-center gap-1"
                        title="View Full History & Demographics (Read Only)"
                      >
                        <Eye className="w-3 h-3 text-sky-600" />
                        View Details
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const reason = prompt(
                            `Request deletion for Patient UHID ${selectedPatientId} (${newName})?\n\nNote: This entry will be quarantined and sent to the Super Admin Deletion Gate for approval.\n\nReason for deletion (optional):`
                          );
                          if (reason !== null) {
                            requestDeletePatient(selectedPatientId, reason || 'Requested by reception staff');
                            showToast(`Patient UHID ${selectedPatientId} deletion requested. Sent to Super Admin Deletion Gate.`);
                            setSelectedPatientId('');
                            setNewTitle('Mr.');
                            setNewFirstName('');
                            setNewLastName('');
                            setNewName('');
                            setNewAge('');
                            setNewPhone('');
                            setNewEmail('');
                            setNewAddress('');
                            setNewAbhaId('');
                          }
                        }}
                        className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-xl text-[10px] hover:bg-rose-100 transition-all cursor-pointer shadow-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3 text-rose-600" />
                        Request Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPatientId('');
                          setNewTitle('Mr.');
                          setNewFirstName('');
                          setNewLastName('');
                          setNewName('');
                          setNewAge('');
                          setNewPhone('');
                          setNewEmail('');
                          setNewAddress('');
                          setNewAbhaId('');
                        }}
                        className="px-2.5 py-1 bg-white border border-sky-200 text-sky-700 font-bold rounded-xl text-[10px] hover:bg-sky-100 transition-all cursor-pointer shadow-xs"
                      >
                        Clear / New Patient
                      </button>
                    </div>
                  </div>
                )}

                {/* Patient Intake Fields */}
                {/* Patient Intake Fields */}
                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                    {/* Title Dropdown */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                        Title *
                      </label>
                      <select
                        value={newTitle}
                        onChange={e => handleTitleChange(e.target.value as any)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                      >
                        <option value="Mr.">Mr.</option>
                        <option value="Mrs.">Mrs.</option>
                        <option value="Ms.">Ms.</option>
                        <option value="Mast.">Mast.</option>
                        <option value="Baby">Baby</option>
                        <option value="Dr.">Dr.</option>
                      </select>
                    </div>

                    {/* First Name */}
                    <div className="sm:col-span-5">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newFirstName}
                        onChange={e => handleFirstNameChange(e.target.value)}
                        placeholder="e.g. Ramesh"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-800"
                      />
                    </div>

                    {/* Last Name */}
                    <div className="sm:col-span-5">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={newLastName}
                        onChange={e => handleLastNameChange(e.target.value)}
                        placeholder="e.g. Kumar"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-800"
                      />
                    </div>
                  </div>

                  {/* Returning Record Autodetection Pill */}
                  {(() => {
                    const firstTrim = newFirstName.trim().toLowerCase();
                    const fullTrim = newName.trim().toLowerCase();
                    if ((firstTrim.length >= 3 || fullTrim.length >= 3) && !selectedPatientId) {
                      const matched = allKnownPatients.find(p => {
                        const pNameLower = (p.name || '').toLowerCase();
                        return (
                          (fullTrim.length >= 3 && pNameLower.includes(fullTrim)) ||
                          (firstTrim.length >= 3 && pNameLower.includes(firstTrim))
                        );
                      });
                      if (matched) {
                        return (
                          <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-center justify-between text-[11px] animate-fade-in">
                            <span className="text-sky-800 dark:text-sky-300 font-semibold truncate mr-2">
                              Record found for <strong>{matched.name}</strong> ({matched.phone || matched.id})
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSelectExistingPatient(matched)}
                              className="px-2.5 py-0.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[10px] font-bold cursor-pointer shrink-0 transition-colors"
                            >
                              Autofill
                            </button>
                          </div>
                        );
                      }
                    }
                    return null;
                  })()}

                  {/* Combined Full Name Preview Badge (Google Sheets & Invoice sync string) */}
                  <div className="px-3 py-1.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-800/40 text-[11px] flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      Combined Name for Google Sheets &amp; Bill:
                    </span>
                    <span className="font-bold text-sky-700 dark:text-sky-300">
                      {[newTitle, newFirstName.trim(), newLastName.trim()].filter(Boolean).join(' ') || '—'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                        Age (Yrs) *
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        max={120}
                        value={newAge}
                        onChange={e => setNewAge(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="e.g. 42"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                        Gender *
                      </label>
                      <select
                        value={newGender}
                        onChange={e => setNewGender(e.target.value as any)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                        Mobile (WhatsApp) *
                      </label>
                      <input
                        type="tel"
                        required
                        value={newPhone}
                        onChange={e => setNewPhone(e.target.value)}
                        placeholder="+91 98765 00000"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-800"
                      />
                      {(() => {
                        const cleanNum = newPhone.replace(/\D/g, '');
                        if (cleanNum.length >= 7 && !selectedPatientId) {
                          const matched = allKnownPatients.find(p => (p.phone || '').replace(/\D/g, '').endsWith(cleanNum.slice(-10)));
                          if (matched) {
                            return (
                              <div className="mt-1.5 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between text-[11px] animate-fade-in">
                                <span className="text-amber-800 dark:text-amber-300 font-semibold truncate mr-2">
                                  Returning Patient: <strong>{matched.name}</strong>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleSelectExistingPatient(matched)}
                                  className="px-2.5 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold cursor-pointer shrink-0 transition-colors"
                                >
                                  Autofill
                                </button>
                              </div>
                            );
                          }
                        }
                        return null;
                      })()}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                        ABDM / ABHA ID
                      </label>
                      <input
                        type="text"
                        value={newAbhaId}
                        onChange={e => setNewAbhaId(e.target.value)}
                        placeholder="91-XXXX-XXXX-XXXX"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Appointment Schedule Date & Time */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-sky-600" /> Appointment / Order Date
                        </label>
                        <span className="text-[10px] text-slate-400 font-semibold">Today</span>
                      </div>
                      <input
                        type="date"
                        value={appointmentDate}
                        onChange={e => setAppointmentDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-sky-600" /> Appointment Time
                        </label>
                        <button
                          type="button"
                          onClick={handleSyncOrderAppointmentTimeToNow}
                          className="px-2 py-0.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                          title="Sync appointment time to current clock"
                        >
                          <Sparkles className="w-2.5 h-2.5 text-sky-600" />
                          <span>Sync Current Time</span>
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={appointmentTime}
                          onChange={e => setAppointmentTime(e.target.value)}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium"
                        />
                        <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2.5 py-2 rounded-xl border border-sky-200 whitespace-nowrap shadow-2xs">
                          {convert24To12HourTime(appointmentTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Referring Doctor Card */}
              <div className="bg-white border border-sky-100 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Send className="w-4 h-4 text-cyan-600" />
                    2. Referring Doctor / Partner Organization
                  </h3>

                </div>

                <div ref={doctorDropdownRef} className="relative">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Select Prescribing / Clinical Doctor
                  </label>

                  {/* If doctor is selected and dropdown is not active, display doctor summary card */}
                  {selectedDoctorObj && !isDoctorDropdownOpen ? (
                    <div className="p-3 bg-sky-50/80 border border-sky-200 rounded-2xl flex items-center justify-between gap-3 transition-all">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700 font-bold shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                            <span>{selectedDoctorObj.name}</span>
                            {selectedDoctorObj.organizationName && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 shrink-0">
                                Ben: {selectedDoctorObj.organizationName}
                              </span>
                            )}
                            {selectedDoctorObj.specialty && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200 shrink-0">
                                {selectedDoctorObj.specialty}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {selectedDoctorObj.hospital ? `${selectedDoctorObj.hospital} • ` : ''}
                            {selectedDoctorObj.phone ? `${selectedDoctorObj.phone}` : 'Active Roster'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {canModifyPrescribingDoctor ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setIsDoctorDropdownOpen(true);
                                setDoctorSearchQuery('');
                              }}
                              className="px-2.5 py-1 text-[11px] font-bold text-sky-700 bg-white hover:bg-sky-50 border border-sky-200 rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1"
                            >
                              <Search className="w-3 h-3 text-sky-600" />
                              Change
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDoctorId('');
                                if (!isBeneficiaryDifferent) setSelectedBeneficiaryId('');
                                setDoctorSearchQuery('');
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                              title="Reset to Direct Walk-in / Self Referred"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-xl text-[10px] font-bold text-amber-800 shrink-0" title="Only Super Admin can change a hard-linked referring doctor">
                            <Lock className="w-3 h-3 text-amber-600" />
                            <span>Hard-Linked</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Search input with live dropdown */
                    <div className="relative">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          value={doctorSearchQuery}
                          onChange={e => {
                            setDoctorSearchQuery(e.target.value);
                            setIsDoctorDropdownOpen(true);
                          }}
                          onFocus={() => setIsDoctorDropdownOpen(true)}
                          placeholder="Search doctor by name, specialty, or clinic..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-10 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all font-medium"
                        />
                        {doctorSearchQuery ? (
                          <button
                            type="button"
                            onClick={() => setDoctorSearchQuery('')}
                            className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsDoctorDropdownOpen(prev => !prev)}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Dropdown Menu */}
                      {isDoctorDropdownOpen && (
                        <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-72 overflow-y-auto divide-y divide-slate-100 animate-fade-in">
                          {/* Walk-in Option */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDoctorId('');
                              if (!isBeneficiaryDifferent) setSelectedBeneficiaryId('');
                              setIsDoctorDropdownOpen(false);
                              setDoctorSearchQuery('');
                            }}
                            className={`w-full text-left px-3.5 py-2.5 hover:bg-sky-50 transition-colors flex items-center justify-between cursor-pointer ${
                              !selectedDoctorId ? 'bg-sky-50/80 font-bold text-sky-800' : 'text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-semibold">
                                🚶
                              </div>
                              <div>
                                <div className="text-xs font-bold">Direct Walk-in / Self Referred</div>
                                <div className="text-[10px] text-slate-400">Patient came directly without a referral doctor</div>
                              </div>
                            </div>
                            {!selectedDoctorId && <Check className="w-4 h-4 text-sky-600 shrink-0" />}
                          </button>

                          {/* Approved Doctors */}
                          {filteredDoctors.approved.length > 0 && (
                            <div className="p-1.5">
                              <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Approved Referring Doctors ({filteredDoctors.approved.length})
                              </div>
                              {filteredDoctors.approved.map(doc => {
                                const isSelected = selectedDoctorId === doc.id;
                                return (
                                  <button
                                    key={doc.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedDoctorId(doc.id);
                                      if (!isBeneficiaryDifferent) setSelectedBeneficiaryId(doc.id);
                                      setIsDoctorDropdownOpen(false);
                                      setDoctorSearchQuery('');
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-xl transition-colors flex items-center justify-between cursor-pointer ${
                                      isSelected ? 'bg-sky-50 text-sky-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                                    }`}
                                  >
                                    <div className="min-w-0 pr-2">
                                      <div className="text-xs font-bold truncate flex items-center gap-1.5">
                                        <span>{doc.name}</span>
                                        {doc.organizationName && (
                                          <span className="text-[10px] font-bold text-purple-700">
                                            (Org: {doc.organizationName})
                                          </span>
                                        )}
                                        {doc.specialty && (
                                          <span className="text-[10px] font-normal text-slate-500">
                                            • {doc.specialty}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[10px] text-slate-400 truncate">
                                        {doc.hospital || 'Direct'} {doc.phone ? `(${doc.phone})` : ''}
                                      </div>
                                    </div>
                                    {isSelected && <Check className="w-4 h-4 text-sky-600 shrink-0" />}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* Pending Doctors */}
                          {filteredDoctors.pending.length > 0 && (
                            <div className="p-1.5">
                              <div className="px-2.5 py-1 text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                                Pending Super Admin Approval ({filteredDoctors.pending.length})
                              </div>
                              {filteredDoctors.pending.map(doc => {
                                const isSelected = selectedDoctorId === doc.id;
                                return (
                                  <button
                                    key={doc.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedDoctorId(doc.id);
                                      if (!isBeneficiaryDifferent) setSelectedBeneficiaryId(doc.id);
                                      setIsDoctorDropdownOpen(false);
                                      setDoctorSearchQuery('');
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-xl transition-colors flex items-center justify-between cursor-pointer ${
                                      isSelected ? 'bg-amber-50 text-amber-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                                    }`}
                                  >
                                    <div className="min-w-0 pr-2">
                                      <div className="text-xs font-bold truncate flex items-center gap-1.5">
                                        <span>{doc.name}</span>
                                        {doc.organizationName && (
                                          <span className="text-[10px] font-bold text-amber-800">
                                            (Org: {doc.organizationName})
                                          </span>
                                        )}
                                        {doc.specialty && (
                                          <span className="text-[10px] font-normal text-amber-700">
                                            • {doc.specialty} [Awaiting Approval]
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[10px] text-slate-400 truncate">
                                        {doc.hospital || 'Direct'}
                                      </div>
                                    </div>
                                    {isSelected && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* No results */}
                          {filteredDoctors.approved.length === 0 && filteredDoctors.pending.length === 0 && (
                            <div className="p-4 text-center">
                              <p className="text-xs text-slate-500">
                                No doctors found matching "{doctorSearchQuery}"
                              </p>
                              <p className="mt-2 text-[11px] text-slate-400">
                                Contact Super Admin / Manager to add doctors to the roster.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Decoupled Commission Beneficiary Selector */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none">
                    <input
                      type="checkbox"
                      checked={isBeneficiaryDifferent}
                      onChange={e => {
                        const checked = e.target.checked;
                        setIsBeneficiaryDifferent(checked);
                        if (!checked) {
                          setSelectedBeneficiaryId('');
                        }
                      }}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Referrer / Beneficiary is different from Prescribing Doctor</span>
                  </label>

                  {isBeneficiaryDifferent && (
                    <div className="p-3 bg-cyan-50/70 border border-cyan-200 rounded-2xl space-y-2 animate-fade-in" ref={beneficiaryDropdownRef}>
                      <label className="block text-[11px] font-bold text-cyan-900 uppercase">
                        Select Person / Partner Referring Patient (Beneficiary) *
                      </label>
                      {selectedBeneficiaryObj && !isBeneficiaryDropdownOpen ? (
                        <div className="p-2.5 bg-white border border-cyan-300 rounded-xl flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {selectedBeneficiaryObj.organizationName || selectedBeneficiaryObj.name}
                              <span className="text-[10px] text-cyan-700 ml-1 font-semibold">
                                ({selectedBeneficiaryObj.specialty})
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {selectedBeneficiaryObj.hospital || 'Direct'} • {selectedBeneficiaryObj.commissionPct}% commission
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setIsBeneficiaryDropdownOpen(true);
                                setBeneficiarySearchQuery('');
                              }}
                              className="px-2 py-0.5 text-[10px] font-bold text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-lg cursor-pointer"
                            >
                              Change
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedBeneficiaryId('');
                                setBeneficiarySearchQuery('');
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                              title="Clear beneficiary"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                          <input
                            type="text"
                            value={beneficiarySearchQuery}
                            onChange={e => {
                              setBeneficiarySearchQuery(e.target.value);
                              setIsBeneficiaryDropdownOpen(true);
                            }}
                            onFocus={() => setIsBeneficiaryDropdownOpen(true)}
                            placeholder="Search beneficiary partner by name, clinic..."
                            className="w-full bg-white border border-cyan-300 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
                          />
                          {beneficiarySearchQuery && (
                            <button
                              type="button"
                              onClick={() => setBeneficiarySearchQuery('')}
                              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isBeneficiaryDropdownOpen && (
                            <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-cyan-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                              {filteredBeneficiaries.map(r => {
                                const isSelected = selectedBeneficiaryId === r.id;
                                return (
                                  <button
                                    key={r.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedBeneficiaryId(r.id);
                                      setIsBeneficiaryDropdownOpen(false);
                                      setBeneficiarySearchQuery('');
                                    }}
                                    className={`w-full text-left px-3 py-2 text-xs hover:bg-cyan-50 flex items-center justify-between cursor-pointer ${
                                      isSelected ? 'bg-cyan-50 font-bold text-cyan-900' : 'text-slate-700'
                                    }`}
                                  >
                                    <div className="min-w-0 pr-2">
                                      <div className="font-semibold truncate">
                                        {r.organizationName || r.name} — {r.specialty}
                                      </div>
                                      <div className="text-[10px] text-slate-400 truncate">
                                        {r.hospital || 'Direct'} • {r.commissionPct}% commission
                                      </div>
                                    </div>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-600 shrink-0" />}
                                  </button>
                                );
                              })}
                              {filteredBeneficiaries.length === 0 && (
                                <div className="p-2.5 text-center text-xs text-slate-500">
                                  No beneficiary partners found
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      <p className="text-[10px] text-cyan-800 font-medium">
                        Patient prescription will attribute to the prescribing doctor above, while referral revenue and commission calculations will credit directly to this selected beneficiary partner.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Diagnostic Test Selector Card with Multi-Filter Suite */}
              <div className="bg-white border border-sky-100 rounded-3xl p-6 shadow-xs space-y-4">
                {/* Header with Search and Selection Toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        3. Select Diagnostic Tests
                      </h3>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Showing {filteredTests.length} of {tests.length} tests
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View Selected Only Toggle */}
                    <button
                      type="button"
                      onClick={() => setShowSelectedOnly(prev => !prev)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        showSelectedOnly
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : selectedTestIds.length > 0
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}
                      title="Filter list to show only selected tests"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Selected ({selectedTestIds.length})</span>
                    </button>

                    {/* Department Dropdown Filter */}
                    <div className="relative">
                      <select
                        value={testDepartmentFilter}
                        onChange={e => setTestDepartmentFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer max-w-[150px] truncate"
                        title="Filter by Clinical Department"
                      >
                        <option value="ALL">All Departments</option>
                        {departmentsList.map(dept => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Search Input */}
                    <div className="relative w-44">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                      <input
                        type="text"
                        value={testSearch}
                        onChange={e => setTestSearch(e.target.value)}
                        placeholder="Search tests..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-7 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                      {testSearch && (
                        <button
                          type="button"
                          onClick={() => setTestSearch('')}
                          className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modality Quick Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 shrink-0 mr-1 flex items-center gap-1">
                    <Filter className="w-3 h-3" /> Quick Filter:
                  </span>
                  {[
                    { id: 'ALL', label: 'All Tests', count: modalityCounts.ALL },
                    { id: 'USG', label: 'Sonography / USG', count: modalityCounts.USG },
                    { id: 'MRI', label: 'MRI Scans', count: modalityCounts.MRI },
                    { id: 'CT', label: 'CT Scans', count: modalityCounts.CT },
                    { id: 'XRAY', label: 'Digital X-Ray', count: modalityCounts.XRAY },
                    { id: 'PATH', label: 'Pathology & Blood', count: modalityCounts.PATH },
                    { id: 'CARD', label: 'Cardiology (Echo/ECG)', count: modalityCounts.CARD },
                    { id: 'NEURO', label: 'Neuro (EEG/EMG/NCV)', count: modalityCounts.NEURO },
                  ].map(pill => {
                    const isActive = testModalityFilter === pill.id;
                    return (
                      <button
                        key={pill.id}
                        type="button"
                        onClick={() => {
                          setTestModalityFilter(pill.id);
                          setShowSelectedOnly(false);
                        }}
                        className={`px-2.5 py-1 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                          isActive
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                        }`}
                      >
                        <span>{pill.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                          isActive ? 'bg-sky-800 text-sky-100' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {pill.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Tests Mini Chips Bar (Quick Review) */}
                {selectedTestIds.length > 0 && (
                  <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-extrabold text-emerald-950 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Selected for Bill ({selectedTestIds.length} tests):
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedTestIds([])}
                        className="text-rose-600 hover:text-rose-800 font-bold hover:underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {selectedTestIds.map(tid => {
                        const testItem = tests.find(t => t.id === tid);
                        if (!testItem) return null;
                        return (
                          <span
                            key={tid}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-emerald-300 text-emerald-950 text-[11px] font-bold rounded-xl shadow-2xs"
                          >
                            <span className="truncate max-w-[200px]">{testItem.name}</span>
                            <span className="text-emerald-700 font-extrabold">₹{testItem.price}</span>
                            <button
                              type="button"
                              onClick={() => handleToggleTest(tid)}
                              className="text-slate-400 hover:text-rose-600 p-0.5 rounded-full cursor-pointer"
                              title="Remove test"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Test Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {filteredTests.length === 0 ? (
                    <div className="col-span-2 p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <p className="font-bold text-slate-700 text-xs">No diagnostic tests match your active filter.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setTestSearch('');
                          setTestModalityFilter('ALL');
                          setTestDepartmentFilter('ALL');
                          setShowSelectedOnly(false);
                        }}
                        className="px-3 py-1 bg-sky-600 text-white font-bold rounded-lg text-xs hover:bg-sky-700 transition-all cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  ) : (
                    filteredTests.map(t => {
                      const isSelected = selectedTestIds.includes(t.id);
                      return (
                        <div
                          key={t.id}
                          onClick={() => handleToggleTest(t.id)}
                          className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between select-none ${
                            isSelected
                              ? 'bg-sky-50 border-sky-500 shadow-xs ring-1 ring-sky-300'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <span className="font-bold text-xs text-slate-900 block truncate" title={t.name}>
                              {t.name}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                              <span className="px-1.5 py-0.2 bg-slate-200/70 text-slate-700 rounded-md font-semibold truncate max-w-[130px]">
                                {t.department || t.category}
                              </span>
                              <span>•</span>
                              <span>TAT: {t.tatHours}h</span>
                              {t.fastingRequired && (
                                <span className="text-amber-700 font-extrabold bg-amber-100 px-1 rounded text-[9px]">
                                  Fasting
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0 pl-2">
                            <span className="font-extrabold text-xs text-sky-800">₹{t.price.toLocaleString()}</span>
                            <div className="mt-1 flex justify-end">
                              {isSelected ? (
                                <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px] font-bold shadow-2xs">
                                  <Check className="w-3 h-3 text-white stroke-[3]" />
                                </span>
                              ) : (
                                <span className="w-5 h-5 rounded-full border border-slate-300 hover:border-slate-400 block transition-colors" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Billing Summary & Payment Collection */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white border border-sky-100 rounded-3xl p-6 shadow-xs space-y-5 sticky top-24">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-sky-600" />
                    4. Bill Calculation & Concession
                  </h3>
                  <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-lg">
                    {selectedCenter.code}
                  </span>
                </div>

                {/* Selected Tests Summary Table */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">
                    Selected Items:
                  </span>
                  {selectedTests.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-400">
                      Select tests on the left to compute total bill.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {selectedTests.map(t => (
                        <div key={t.id} className="flex justify-between items-center text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className="text-slate-800 font-medium truncate max-w-[200px]" title={t.name}>{t.name}</span>
                            {t.code && <span className="text-[10px] text-slate-400 font-mono">{t.code}</span>}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-bold text-slate-900">₹{t.price}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedTestIds(prev => prev.filter(id => id !== t.id))}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Remove test"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Discount & Totals */}
                <div className="p-4 bg-sky-50/50 rounded-2xl border border-sky-100 space-y-3 text-xs">
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>Subtotal (MRP Tariff):</span>
                    <span className="font-bold text-slate-900">₹{subtotal.toFixed(2)}</span>
                  </div>

                  {/* Two-Way Synchronized: Charged Amount (₹) vs Discount (%) */}
                  <div className="p-3 bg-white border border-sky-200 rounded-xl space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                          Charged Amount (Final Price ₹)
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-500">₹</span>
                          <input
                            type="number"
                            min={0}
                            value={subtotal > 0 ? netTotal : (customTariff !== null ? customTariff : '')}
                            onChange={e => {
                              const inputVal = e.target.value;
                              if (inputVal === '') {
                                if (subtotal <= 0) setCustomTariff(null);
                                setDiscountPct(0);
                                return;
                              }
                              const val = Number(inputVal);
                              if (isNaN(val)) return;

                              if (subtotal <= 0) {
                                setCustomTariff(val);
                                setDiscountPct(0);
                                return;
                              }

                              const clamped = Math.max(0, val);
                              if (clamped <= subtotal) {
                                const deducted = subtotal - clamped;
                                const newPct = Number(((deducted / subtotal) * 100).toFixed(2));
                                setDiscountPct(newPct);
                              } else {
                                setCustomTariff(clamped);
                                setDiscountPct(0);
                              }
                            }}
                            placeholder={subtotal > 0 ? String(subtotal) : '0'}
                            className="w-full bg-slate-50 border border-sky-300 rounded-xl pl-7 pr-3 py-1.5 text-xs font-black text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                          />
                        </div>
                        <span className="text-[9px] text-slate-500 mt-0.5 block">
                          Direct price agreed with patient
                        </span>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                          Or Discount Rate (%)
                        </label>
                        <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-500">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step="any"
                            value={discountPct === 0 ? '' : discountPct}
                            onChange={e => {
                              const val = e.target.value === '' ? 0 : Number(e.target.value);
                              setDiscountPct(Math.min(100, Math.max(0, isNaN(val) ? 0 : val)));
                            }}
                            placeholder="0"
                            className="w-full text-xs font-black text-slate-900 focus:outline-none bg-transparent"
                          />
                          <span className="text-[10px] font-bold text-slate-500">%</span>
                        </div>
                        <span className="text-[9px] text-slate-500 mt-0.5 block">
                          Percentage concession
                        </span>
                      </div>
                    </div>

                    {/* Quick Percentage Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400">Presets:</span>
                      {[0, 5, 10, 15, 20].map(pct => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setDiscountPct(pct)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                            Math.round(discountPct) === pct
                              ? 'bg-sky-600 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {discountPct > 0 && (
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-emerald-600 font-bold">
                        <span>Discount Concession:</span>
                        <span>- ₹{discountAmount.toFixed(2)} ({discountPct}% off)</span>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-amber-800 uppercase mb-0.5">
                          Discount Note / Reason * (Audited by Admin)
                        </label>
                        <input
                          type="text"
                          required
                          value={discountReason}
                          onChange={e => setDiscountReason(e.target.value)}
                          placeholder="e.g. Senior Citizen / Doctor reference concession"
                          className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1 text-xs text-slate-900"
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-sky-200/80 flex justify-between items-center text-sm font-extrabold text-slate-900">
                    <span>Net Bill Amount:</span>
                    <span className="text-lg text-sky-700 font-black">₹{netTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Mode & Amount */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Payment Mode
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {(['UPI / QR', 'Cash', 'Credit / Debit Card', 'Due Credit', 'Split Payment'] as PaymentMode[]).map(mode => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            setPaymentMode(mode);
                            if (mode === 'Split Payment') {
                              if (splitCashAmount === '' && splitOnlineAmount === '') {
                                const half = Math.floor(netTotal / 2);
                                setSplitCashAmount(half);
                                setSplitOnlineAmount(netTotal - half);
                              }
                            }
                          }}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border text-left transition-all cursor-pointer ${
                            paymentMode === mode
                              ? 'bg-sky-600 text-white border-sky-600 shadow-xs ring-2 ring-sky-300'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  {paymentMode === 'Split Payment' ? (
                    <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between pb-1 border-b border-sky-100">
                        <span className="text-[11px] font-extrabold text-sky-900 uppercase">
                          Split Payment Breakdown
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const half = Math.floor(netTotal / 2);
                              setSplitCashAmount(half);
                              setSplitOnlineAmount(netTotal - half);
                            }}
                            className="text-[10px] bg-white text-sky-700 px-2 py-0.5 rounded-lg border border-sky-300 hover:bg-sky-50 font-bold cursor-pointer"
                          >
                            50/50 Split
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const cash = Number(splitCashAmount) || 0;
                              setSplitOnlineAmount(Math.max(0, netTotal - cash));
                            }}
                            className="text-[10px] bg-sky-600 text-white px-2 py-0.5 rounded-lg font-bold hover:bg-sky-500 cursor-pointer"
                          >
                            Fill Remainder
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                            💵 Cash Amount (₹) *
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={splitCashAmount}
                            onChange={e => {
                              const val = e.target.value === '' ? '' : Number(e.target.value);
                              setSplitCashAmount(val);
                            }}
                            placeholder="0"
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                            📱 Online / UPI Amount (₹) *
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={splitOnlineAmount}
                            onChange={e => {
                              const val = e.target.value === '' ? '' : Number(e.target.value);
                              setSplitOnlineAmount(val);
                            }}
                            placeholder="0"
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                          Online Channel / Mode
                        </label>
                        <select
                          value={splitOnlineMode}
                          onChange={e => setSplitOnlineMode(e.target.value as any)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                        >
                          <option value="UPI / QR">UPI / QR Code</option>
                          <option value="Card">Debit / Credit Card (POS Machine)</option>
                          <option value="Bank Transfer">Bank Transfer / NEFT / IMPS</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-sky-100 text-xs">
                        <span className="text-slate-600">Total Collected Now:</span>
                        <span className="font-black text-sky-950">₹{numericPaid.toFixed(2)} / ₹{netTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-bold text-slate-600 uppercase">
                          Amount Paid Now (₹)
                        </label>
                        <button
                          type="button"
                          onClick={() => setPaidAmount(netTotal)}
                          className="text-[10px] text-sky-600 hover:underline font-bold cursor-pointer"
                        >
                          Full Paid (₹{netTotal})
                        </button>
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={netTotal > 0 ? netTotal : undefined}
                        value={paidAmount}
                        onChange={e => setPaidAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder={`Full amount ₹${netTotal}`}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  )}

                  {balanceDue > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900 font-bold">
                      <span>Pending Due Balance:</span>
                      <span>₹{balanceDue.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Patient Clinical Status Remark & Missed Appointment */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Patient Clinical / Intake Status Remark
                    </label>
                    <select
                      value={patientStatusRemark}
                      onChange={e => setPatientStatusRemark(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="Standard Walk-in">Standard Walk-in</option>
                      <option value="Doctor OPD">Doctor OPD</option>
                      <option value="IPD / Hospital Processing">IPD / Hospital Processing</option>
                      <option value="Custom Remark">Custom Remark...</option>
                    </select>
                  </div>

                  {patientStatusRemark === 'Custom Remark' && (
                    <input
                      type="text"
                      value={customStatusRemark}
                      onChange={e => setCustomStatusRemark(e.target.value)}
                      placeholder="Enter custom patient status remark..."
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  )}

                  {/* Missed Appointment Indicator */}
                  <div className="pt-2 border-t border-slate-200">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasMissedAppointment}
                        onChange={e => setHasMissedAppointment(e.target.checked)}
                        className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                      />
                      <span>Record Prior Missed / Rescheduled Appointment</span>
                    </label>
                    {hasMissedAppointment && (
                      <div className="mt-2">
                        <input
                          type="text"
                          value={missedAppointmentNotes}
                          onChange={e => setMissedAppointmentNotes(e.target.value)}
                          placeholder="e.g. Patient missed scheduled slot; rescheduled to today"
                          className="w-full bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className={`w-full flex items-center justify-center gap-2 py-3.5 text-white font-black rounded-2xl text-sm shadow-md transition-all active:scale-95 cursor-pointer ${
                    orderBeingEdited
                      ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 shadow-amber-600/20'
                      : 'bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 shadow-sky-600/20'
                  }`}
                >
                  {orderBeingEdited ? (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Update Invoice (Bill #{orderBeingEdited.invoiceNumber})</span>
                    </>
                  ) : (
                    <>
                      <Receipt className="w-5 h-5" />
                      <span>Generate Invoice & Register Order</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: LIVE CENTER ORDERS QUEUE & SAMPLE COLLECTION */}
      {activeTab === 'ORDERS_QUEUE' && (
        <div className="space-y-4">
          {/* Real-Time Queue Financial Metrics Row (Cash vs Online Breakdown) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 bg-white border border-sky-100 rounded-2xl shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Queue Orders</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">{filteredOrders.length}</span>
              <span className="text-[10px] text-slate-400">Total Billed: ₹{filteredOrders.reduce((s, o) => s + (o.totalAmount || 0), 0).toLocaleString()}</span>
            </div>

            <div className="p-4 bg-white border border-emerald-100 rounded-2xl shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                <Banknote className="w-3 h-3 text-emerald-600" /> Cash Income
              </span>
              <span className="text-xl font-black text-emerald-700 mt-1 block">₹{queueCashIncome.toLocaleString()}</span>
              <span className="text-[10px] text-emerald-600">Physical cash collected</span>
            </div>

            <div className="p-4 bg-white border border-sky-100 rounded-2xl shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 flex items-center gap-1">
                <QrCode className="w-3 h-3 text-sky-600" /> Online Income
              </span>
              <span className="text-xl font-black text-sky-700 mt-1 block">₹{queueOnlineIncome.toLocaleString()}</span>
              <span className="text-[10px] text-sky-600">UPI, QR & Card transactions</span>
            </div>

            <div className="p-4 bg-white border border-amber-100 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">Pending Dues</span>
                {queueTotalRefunds > 0 && (
                  <span className="text-[10px] font-bold text-rose-600">₹{queueTotalRefunds.toLocaleString()} Ref</span>
                )}
              </div>
              <span className="text-xl font-black text-amber-700 mt-1 block">₹{queueTotalDue.toLocaleString()}</span>
              <span className="text-[10px] text-amber-600">Balance to collect at desk</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-3 p-4 bg-white border border-sky-100 rounded-3xl shadow-xs">
            <div className="relative w-full lg:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={queueSearch}
                onChange={e => setQueueSearch(e.target.value)}
                placeholder="Search patient, doctor, UHID or invoice..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
              {/* Date Range Preset & Custom Selector */}
              <DateRangeFilter
                preset={queueDateRange}
                startDate={queueStartDate}
                endDate={queueEndDate}
                onPresetChange={setQueueDateRange}
                onStartDateChange={setQueueStartDate}
                onEndDateChange={setQueueEndDate}
              />

              {/* Status Pills */}
              <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                {[
                  { label: 'All', val: 'ALL' },
                  { label: 'Pending Sample', val: 'ORDER_PLACED' },
                  { label: 'Sample Collected', val: 'SAMPLE_COLLECTED' },
                  { label: 'Doctor Review', val: 'DOCTOR_REVIEW' },
                  { label: 'Authorized PDF', val: 'VERIFIED' },
                  { label: 'Dispatched', val: 'DISPATCHED' }
                ].map(f => (
                  <button
                    key={f.val}
                    onClick={() => setQueueStatusFilter(f.val)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      queueStatusFilter === f.val
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white border border-sky-100 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-sky-50/70 text-sky-900 uppercase text-[10px] tracking-wider border-b border-sky-100 font-black">
                  <tr>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Patient Name</th>
                    <th className="p-3.5">Prescribing Doctor</th>
                    <th className="p-3.5">Beneficiary Name</th>
                    <th className="p-3.5">Patient Investigation</th>
                    <th className="p-3.5">MRP</th>
                    <th className="p-3.5">Discount</th>
                    <th className="p-3.5">Paid Amount</th>
                    <th className="p-3.5">Due by Patient</th>
                    <th className="p-3.5">Workflow Status</th>
                    <th className="p-3.5 text-right">Instant Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-slate-400">
                        No orders matching filter in {selectedCenter.name}.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(ord => {
                      const rep = getReportByOrderId(ord.id);
                      const isReadyToDispatch = rep?.status === 'AUTHORIZED' || ord.status === 'VERIFIED' || ord.status === 'DISPATCHED';
                      const isSamplePending = ord.status === 'ORDER_PLACED' || !ord.sampleCollected;
                      const mrpValue = ord.subtotal || ord.tests.reduce((s, t) => s + t.price, 0);

                      return (
                        <tr key={ord.id} className="hover:bg-sky-50/40 transition-colors">
                          {/* 1. Date */}
                          <td className="p-3.5">
                            <span className="font-bold text-slate-900 block text-xs">
                              {formatSafeDate(ord.createdAt)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {formatSafeTime(ord.createdAt)}
                            </span>
                            <span className="font-mono text-sky-700 text-[10px] font-semibold block mt-0.5">
                              #{ord.invoiceNumber}
                            </span>
                          </td>

                          {/* 2. Patient Name */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 block text-sm">{ord.patient.name}</span>
                              <button
                                type="button"
                                onClick={() => setViewingPatientDetails(ord.patient)}
                                title="View Patient Details & History (Read Only)"
                                className="p-1 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <span className="text-slate-500 text-[11px] block">
                              {ord.patient.gender[0]}/{ord.patient.age}y • {ord.patient.phone}
                            </span>
                            <span className="font-mono text-[10px] text-sky-600 block mt-0.5">
                              UHID: {ord.patientId}
                            </span>
                          </td>

                          {/* 3. Prescribing Doctor */}
                          <td className="p-3.5">
                            <span className="font-bold text-slate-800 text-xs block">
                              {ord.referringDoctorName || 'Direct Walk-in'}
                            </span>
                            {ord.isRefunded && (
                              <span className="mt-1 px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[9px] font-bold inline-block">
                                ₹{ord.refundAmount} Refunded ({ord.refundStatus === 'FULL_REFUND' ? 'Full' : 'Partial'})
                              </span>
                            )}
                          </td>

                          {/* 3B. Beneficiary Name */}
                          <td className="p-3.5">
                            {(() => {
                              const matchedDoc = referrers.find(r => r.id === ord.referringDoctorId || r.name.toLowerCase() === (ord.referringDoctorName || '').toLowerCase());
                              const resolvedBeneficiary = ord.commissionBeneficiaryName ||
                                matchedDoc?.organizationName ||
                                matchedDoc?.name ||
                                ord.referringDoctorName;
                              return resolvedBeneficiary ? (
                                <span className="font-bold text-sky-800 text-xs block bg-sky-50 px-2 py-1 rounded-lg border border-sky-200">
                                  {resolvedBeneficiary}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs block">—</span>
                              );
                            })()}
                          </td>

                          {/* 4. Patient Investigation */}
                          <td className="p-3.5 max-w-[200px]">
                            <div className="flex flex-wrap gap-1">
                              {ord.tests.map(t => (
                                <span
                                  key={t.id}
                                  className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200 truncate"
                                >
                                  {t.name}
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* 5. MRP */}
                          <td className="p-3.5 font-bold text-slate-900 text-sm">
                            ₹{mrpValue.toLocaleString()}
                          </td>

                          {/* 6. Discount */}
                          <td className="p-3.5">
                            {ord.discountAmount > 0 ? (
                              <div>
                                <span className="font-bold text-slate-900 text-xs block">
                                  ₹{ord.discountAmount.toLocaleString()}
                                </span>
                                <span className="text-[10px] text-emerald-700 font-semibold block">
                                  ({ord.discountPct}% off)
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-medium">₹0 (0%)</span>
                            )}
                          </td>

                          {/* 7. Paid Amount */}
                          <td className="p-3.5">
                            <span className="font-extrabold text-slate-900 text-sm block">
                              ₹{ord.paidAmount.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium block">
                              {ord.paymentMode}
                            </span>
                          </td>

                          {/* 8. Due by Patient */}
                          <td className="p-3.5">
                            {ord.dueAmount > 0 ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setDueCollectOrder(ord);
                                  setCollectAmount(ord.dueAmount);
                                }}
                                className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded text-[10px] font-bold hover:bg-amber-200 cursor-pointer block"
                              >
                                Due: ₹{ord.dueAmount} (Collect)
                              </button>
                            ) : (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold inline-block">
                                PAID
                              </span>
                            )}
                          </td>

                          {/* 9. Workflow Status */}
                          <td className="p-3.5">
                            {isSamplePending ? (
                              <button
                                type="button"
                                onClick={() => {
                                  markSampleCollected(ord.id);
                                  showToast(`Sample collected for ${ord.patient.name} (${ord.invoiceNumber})`);
                                }}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                              >
                                <FlaskConical className="w-3.5 h-3.5" />
                                <span>Collect Sample</span>
                              </button>
                            ) : (
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                  ord.status === 'DISPATCHED'
                                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                    : ord.status === 'VERIFIED'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : ord.status === 'DOCTOR_REVIEW'
                                    ? 'bg-sky-100 text-sky-800 border border-sky-200'
                                    : 'bg-teal-100 text-teal-800 border border-teal-200'
                                }`}
                              >
                                {ord.status === 'DISPATCHED' && <Check className="w-3 h-3" />}
                                {ord.status.replace('_', ' ')}
                              </span>
                            )}
                          </td>

                          {/* 10. Instant Actions */}
                          <td className="p-3.5 text-right space-x-1.5">
                            {/* Edit Invoice Button */}
                            <button
                              type="button"
                              onClick={() => {
                                startEditingOrder(ord);
                                setActiveTab('REGISTRATION');
                              }}
                              title="Edit Patient, Tests, Doctor, or Pricing"
                              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl transition-colors inline-flex items-center gap-1 text-xs font-bold shadow-xs cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                              <span>Edit</span>
                            </button>

                            {/* View & Print Tax Invoice */}
                            <button
                              type="button"
                              onClick={() => setInvoiceModalOrder(ord)}
                              title="View & Print Diagnostic Tax Invoice"
                              className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl transition-colors inline-flex items-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer"
                            >
                              <Receipt className="w-3.5 h-3.5 text-sky-600" />
                              <span>Invoice</span>
                            </button>

                            {/* Return & Refund Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setRefundModalOrder(ord);
                                const remPaid = Math.max(0, ord.paidAmount - (ord.refundAmount || 0));
                                setRefundAmount(remPaid > 0 ? remPaid : '');
                                setRefundMode(ord.paymentMode || 'Cash');
                                setRefundReason('');
                              }}
                              disabled={ord.refundStatus === 'FULL_REFUND' || ord.paidAmount <= 0}
                              title={ord.refundStatus === 'FULL_REFUND' ? 'Order fully refunded' : 'Return & Refund Payment'}
                              className={`px-2.5 py-1.5 rounded-xl transition-all inline-flex items-center gap-1 text-xs font-bold shadow-xs cursor-pointer ${
                                ord.refundStatus === 'FULL_REFUND'
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                  : ord.isRefunded
                                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                              }`}
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                              <span>{ord.isRefunded ? 'Refund More' : 'Refund'}</span>
                            </button>

                            {/* View Full Report */}
                            {rep && (
                              <button
                                type="button"
                                onClick={() => setReportPrintModalOrder(ord)}
                                title="View & Print Official Medical Report"
                                className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition-colors inline-flex cursor-pointer"
                              >
                                <Eye className="w-4 h-4 text-sky-600" />
                              </button>
                            )}

                            {/* 1-Click WhatsApp Button for Report Dispatch */}
                            <button
                              type="button"
                              onClick={() => handleSendWhatsApp(ord)}
                              disabled={!isReadyToDispatch}
                              title={isReadyToDispatch ? "1-Click WhatsApp Dispatch" : "Report not yet authorized by doctor"}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-xs ${
                                isReadyToDispatch
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95 cursor-pointer'
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>{ord.whatsappSent ? 'Resend WA' : 'WhatsApp'}</span>
                            </button>

                            {/* Request Deletion Button */}
                            <button
                              type="button"
                              onClick={() => {
                                const reason = prompt(
                                  `Remove Order #${ord.invoiceNumber} (${ord.patient.name}) from your reception queue?\n\nNote: It will be removed from your screen immediately, and permanently purged only after Admin approval.\n\nReason for removal (optional):`
                                );
                                if (reason !== null) {
                                  requestDeleteOrder(ord.id, reason || 'Removed by staff at reception');
                                  showToast(`Order #${ord.invoiceNumber} removed from your view. Awaiting Admin approval.`);
                                }
                              }}
                              title="Delete / Remove Order (Requires Admin Approval)"
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors inline-flex cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: APPOINTMENTS DESK                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'APPOINTMENTS' && (
        <div className="space-y-6">
          {/* Header & Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Total Appointments
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-800">{appointments.length}</span>
                <span className="text-xs font-semibold text-slate-500">All registered</span>
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 block mb-1">
                Today's Schedule
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-sky-700">
                  {appointments.filter(a => normalizeToYYYYMMDD(a.appointmentDate) === getLocalYYYYMMDD()).length}
                </span>
                <span className="text-xs font-semibold text-sky-600">Active slots</span>
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block mb-1">
                Confirmed / Pending
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-emerald-700">
                  {appointments.filter(a => a.status === 'SCHEDULED' || a.status === 'CONFIRMED').length}
                </span>
                <span className="text-xs font-semibold text-emerald-600">Awaiting arrival</span>
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 block mb-1">
                Missed Appointments
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-rose-700">
                  {appointments.filter(a => a.status === 'MISSED').length}
                </span>
                <span className="text-xs font-semibold text-rose-600">Requires follow-up</span>
              </div>
            </div>
          </div>

          {/* Filter Bar & Schedule Button */}
          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
              {/* Date Presets */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
                <button
                  type="button"
                  onClick={() => setAptDateFilter('TODAY')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    aptDateFilter === 'TODAY'
                      ? 'bg-white text-sky-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setAptDateFilter('UPCOMING')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    aptDateFilter === 'UPCOMING'
                      ? 'bg-white text-sky-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Upcoming
                </button>
                <button
                  type="button"
                  onClick={() => setAptDateFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    aptDateFilter === 'ALL'
                      ? 'bg-white text-sky-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Dates
                </button>
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={aptStatusFilter}
                  onChange={e => setAptStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-hidden focus:border-sky-500 cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="MISSED">Missed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {/* Search Field */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={aptSearch}
                  onChange={e => setAptSearch(e.target.value)}
                  placeholder="Search by patient, phone, doctor, test..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-sky-500"
                />
              </div>

              {(aptSearch || aptStatusFilter !== 'ALL' || aptDateFilter !== 'TODAY') && (
                <button
                  type="button"
                  onClick={() => {
                    setAptSearch('');
                    setAptStatusFilter('ALL');
                    setAptDateFilter('TODAY');
                  }}
                  className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Book Appointment CTA */}
            <button
              type="button"
              onClick={handleOpenScheduleModal}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer ml-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>
          </div>

          {/* Appointments Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Scheduled Appointments ({filteredAppointments.length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Manage patient arrivals, mark attendance, or convert directly to diagnostic billing
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-3.5">Slot / Token</th>
                    <th className="p-3.5">Patient Details</th>
                    <th className="p-3.5">Requested Tests</th>
                    <th className="p-3.5">Referring Doctor</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Notes</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-10 text-center">
                        <div className="max-w-xs mx-auto space-y-2">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                            <Calendar className="w-5 h-5" />
                          </div>
                          <p className="text-slate-600 font-bold text-sm">No Appointments Found</p>
                          <p className="text-slate-400 text-xs">
                            No appointments match your active search filters or date range.
                          </p>
                          <button
                            type="button"
                            onClick={handleOpenScheduleModal}
                            className="mt-3 px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Schedule Appointment Now</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map(apt => {
                      const statusColor =
                        apt.status === 'CONFIRMED'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : apt.status === 'SCHEDULED'
                          ? 'bg-sky-50 text-sky-800 border-sky-200'
                          : apt.status === 'COMPLETED'
                          ? 'bg-purple-50 text-purple-800 border-purple-200'
                          : apt.status === 'MISSED'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200';

                      return (
                        <tr key={apt.id} className="hover:bg-slate-50/60 transition-colors">
                          {/* Slot / Token */}
                          <td className="p-3.5 align-top">
                            <div className="flex items-center gap-1.5 font-bold text-slate-900">
                              <Calendar className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                              <span>{apt.appointmentDate}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{apt.appointmentTime}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                              {apt.id}
                            </span>
                          </td>

                          {/* Patient Details */}
                          <td className="p-3.5 align-top">
                            <div className="font-bold text-slate-900 text-sm">{apt.patientName}</div>
                            <div className="flex items-center gap-2 text-slate-500 text-[11px] mt-0.5">
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {apt.patientPhone}
                              </span>
                              {(apt.patientAge || apt.patientGender) && (
                                <span>
                                  • {apt.patientAge ? `${apt.patientAge}y` : ''} {apt.patientGender || ''}
                                </span>
                              )}
                            </div>
                            {apt.patientEmail && (
                              <div className="text-[10px] text-slate-400 mt-0.5">{apt.patientEmail}</div>
                            )}
                          </td>

                          {/* Requested Tests */}
                          <td className="p-3.5 align-top">
                            <div className="flex flex-wrap gap-1">
                              {(apt.testsRequested || ['General Evaluation']).map((tName, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-medium"
                                >
                                  {tName}
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* Referring Doctor */}
                          <td className="p-3.5 align-top">
                            <div className="font-medium text-slate-800">
                              {apt.referringDoctorName || 'Direct Walk-in'}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="p-3.5 align-top">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${statusColor}`}
                            >
                              {apt.status === 'CONFIRMED' && <Check className="w-3 h-3" />}
                              {apt.status === 'MISSED' && <AlertTriangle className="w-3 h-3" />}
                              {apt.status === 'SCHEDULED' && <Clock className="w-3 h-3" />}
                              {apt.status}
                            </span>
                          </td>

                          {/* Notes */}
                          <td className="p-3.5 align-top max-w-[200px]">
                            {apt.notes ? (
                              <span className="text-slate-600 text-[11px] line-clamp-2" title={apt.notes}>
                                {apt.notes}
                              </span>
                            ) : (
                              <span className="text-slate-300 text-[11px]">-</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-3.5 align-top text-right space-x-1.5 whitespace-nowrap">
                            {/* Status Quick Transitions */}
                            {apt.status === 'SCHEDULED' && (
                              <button
                                type="button"
                                onClick={() => {
                                  updateAppointmentStatus(apt.id, 'CONFIRMED');
                                  showToast(`Appointment confirmed for ${apt.patientName}`);
                                }}
                                title="Confirm Appointment"
                                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-all"
                              >
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Confirm</span>
                              </button>
                            )}

                            {(apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED') && (
                              <button
                                type="button"
                                onClick={() => {
                                  updateAppointmentStatus(apt.id, 'MISSED');
                                  showToast(`Marked ${apt.patientName} as Missed`);
                                }}
                                title="Mark as Missed Appointment"
                                className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-all"
                              >
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                <span>Missed</span>
                              </button>
                            )}

                            {apt.status === 'CONFIRMED' && (
                              <button
                                type="button"
                                onClick={() => {
                                  updateAppointmentStatus(apt.id, 'COMPLETED');
                                  showToast(`Marked ${apt.patientName} as Completed`);
                                }}
                                title="Mark as Completed"
                                className="px-2 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-all"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                                <span>Done</span>
                              </button>
                            )}

                            {/* Convert to Bill / Registration */}
                            {apt.status !== 'COMPLETED' && (
                              <button
                                type="button"
                                onClick={() => handleConvertAppointmentToOrder(apt)}
                                title="Convert directly to Patient Bill & Order"
                                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                                <span>Convert to Bill</span>
                              </button>
                            )}

                            {/* Edit Scheduled Appointment */}
                            {apt.status !== 'COMPLETED' && (
                              <button
                                type="button"
                                onClick={() => handleOpenEditAppointment(apt)}
                                title="Edit Scheduled Appointment Details"
                                className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-all shadow-xs active:scale-95"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-white" />
                                <span>Edit</span>
                              </button>
                            )}

                            {/* Delete Appointment */}
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Delete appointment for ${apt.patientName}?`)) {
                                  deleteAppointment(apt.id);
                                  showToast(`Appointment for ${apt.patientName} deleted`);
                                }
                              }}
                              title="Delete Appointment"
                              className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 rounded-xl transition-all inline-flex cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tax Invoice & Diagnostic Bill Modal */}
      {invoiceModalOrder && (
        <InvoiceReceiptModal
          order={invoiceModalOrder}
          center={selectedCenter}
          onClose={() => setInvoiceModalOrder(null)}
        />
      )}

      {/* Report Print View Modal */}
      {reportPrintModalOrder && (
        <ReportPrintView
          report={getReportByOrderId(reportPrintModalOrder.id) || {
            id: `REP-${reportPrintModalOrder.id.slice(-4)}`,
            orderId: reportPrintModalOrder.id,
            testId: reportPrintModalOrder.tests[0].id,
            testName: reportPrintModalOrder.tests.map(t => t.name).join(', '),
            patientId: reportPrintModalOrder.patientId,
            patientName: reportPrintModalOrder.patient.name,
            patientAge: reportPrintModalOrder.patient.age,
            patientGender: reportPrintModalOrder.patient.gender,
            category: reportPrintModalOrder.tests[0].category,
            findingsHtml: '<p>Standard report verification completed.</p>',
            impression: 'Investigation reported within normal limits.',
            doctorName: 'Dr. Rekha Khanna',
            doctorSpecialty: 'MBBS MD Radiodiagnosis',
            doctorRegistrationNo: 'MP 13663',
            status: 'AUTHORIZED',
            attachments: []
          }}
          order={reportPrintModalOrder}
          center={selectedCenter}
          onClose={() => setReportPrintModalOrder(null)}
        />
      )}

      {/* Collect Balance Due Modal */}
      {dueCollectOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-900 text-sm">
              Collect Due Payment: {dueCollectOrder.invoiceNumber}
            </h3>
            <p className="text-xs text-slate-500">
              Patient: <strong className="text-slate-800">{dueCollectOrder.patient.name}</strong> • Due: <strong className="text-amber-700">₹{dueCollectOrder.dueAmount}</strong>
            </p>

            <form onSubmit={handleCollectDueSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Collection Amount (₹)
                </label>
                <input
                  type="number"
                  min={1}
                  max={dueCollectOrder.dueAmount}
                  value={collectAmount}
                  onChange={e => setCollectAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Payment Mode
                </label>
                <select
                  value={collectMode}
                  onChange={e => setCollectMode(e.target.value as PaymentMode)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI / QR">UPI / QR</option>
                  <option value="Credit / Debit Card">Credit / Debit Card</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Record Payment
                </button>
                <button
                  type="button"
                  onClick={() => setDueCollectOrder(null)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Standalone Doctor Intake & Roster Approval Submission */}
      {isStandaloneDoctorModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          onClick={e => {
            if (e.target === e.currentTarget) setIsStandaloneDoctorModalOpen(false);
          }}
        >
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Register Doctor to Partner Roster</h3>
                  <p className="text-[11px] text-slate-500">Submits doctor for Super Admin approval & commission allotment</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsStandaloneDoctorModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterDoctorDirectly} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Doctor Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newDoctorName}
                    onChange={e => setNewDoctorName(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Kumar"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Degree / Qualification</label>
                  <input
                    type="text"
                    value={newDoctorQualification}
                    onChange={e => setNewDoctorQualification(e.target.value)}
                    placeholder="e.g. MBBS, MD Radiodiagnosis"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Duplicate Doctor Alert & 1-Click Select Option */}
              {matchedExistingDoctors.length > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/80 rounded-2xl space-y-2.5 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      Doctor Already Available in Roster ({matchedExistingDoctors.length} Match)
                    </span>
                    <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold">Avoid duplicate entries</span>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {matchedExistingDoctors.map(matchedDoc => (
                      <div key={matchedDoc.id} className="p-2.5 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-slate-900 dark:text-white text-xs truncate">{matchedDoc.name}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold ${matchedDoc.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                              {matchedDoc.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {matchedDoc.specialty || 'Consultant'} {matchedDoc.hospital ? `• ${matchedDoc.hospital}` : ''} {matchedDoc.registrationNo ? `• Reg: ${matchedDoc.registrationNo}` : ''}
                          </p>
                          {matchedDoc.phone && <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">Phone: {matchedDoc.phone}</p>}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDoctorId(matchedDoc.id);
                            if (!isBeneficiaryDifferent) setSelectedBeneficiaryId(matchedDoc.id);
                            setIsAddingNewDoctor(false);
                            setIsStandaloneDoctorModalOpen(false);
                            setNewDoctorName('');
                            setNewDoctorQualification('');
                            setNewDoctorSpecialty('');
                            setNewDoctorHospital('');
                            setNewDoctorRegNo('');
                            setNewDoctorPhone('');
                            setNewDoctorEmail('');
                            setNewDoctorOrganizationName('');
                            setNewDoctorNotes('');
                            showToast(`Selected existing doctor from roster: ${matchedDoc.name} (${matchedDoc.id})`);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer shrink-0 flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Select This Doctor
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Medical Specialty</label>
                  <input
                    type="text"
                    value={newDoctorSpecialty}
                    onChange={e => setNewDoctorSpecialty(e.target.value)}
                    placeholder="e.g. Consultant Radiologist"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Clinic / Hospital Name</label>
                  <input
                    type="text"
                    value={newDoctorHospital}
                    onChange={e => setNewDoctorHospital(e.target.value)}
                    placeholder="e.g. Apollo Hospital, City Clinic"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Medical Council Reg. No</label>
                  <input
                    type="text"
                    value={newDoctorRegNo}
                    onChange={e => setNewDoctorRegNo(e.target.value)}
                    placeholder="e.g. MP 13663 / MP 27139"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Affiliation / Association</label>
                  <select
                    value={newDoctorAffiliationType}
                    onChange={e => setNewDoctorAffiliationType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="SELF">Self / Independent Practice</option>
                    <option value="ORGANIZATION">Hospital / Partner Network</option>
                  </select>
                </div>
              </div>

              {newDoctorAffiliationType === 'ORGANIZATION' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Organization / Beneficiary *</label>
                  <input
                    type="text"
                    required
                    value={newDoctorOrganizationName}
                    onChange={e => setNewDoctorOrganizationName(e.target.value)}
                    placeholder="e.g. City Healthcare Group / Beneficiary Partner"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Mobile Phone / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={newDoctorPhone}
                    onChange={e => setNewDoctorPhone(e.target.value)}
                    placeholder="+91 98XXX XXXXX"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newDoctorEmail}
                    onChange={e => setNewDoctorEmail(e.target.value)}
                    placeholder="doctor@hospital.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Operational Notes / Specialization Remarks</label>
                <input
                  type="text"
                  value={newDoctorNotes}
                  onChange={e => setNewDoctorNotes(e.target.value)}
                  placeholder="e.g. Morning OPD referrals, Emergency Sonography"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
                <span className="font-bold text-amber-900 text-xs shrink-0">Commission Policy:</span>
                <span>Commission % will be reviewed and allotted exclusively by the Super Admin in the Doctor Approvals Roster.</span>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer transition-all"
                >
                  Submit for Super Admin Approval
                </button>
                <button
                  type="button"
                  onClick={() => setIsStandaloneDoctorModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Book / Schedule New Appointment */}
      {isScheduleModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={e => {
            if (e.target === e.currentTarget) setIsScheduleModalOpen(false);
          }}
        >
          <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Book Patient Appointment</h3>
                  <p className="text-[11px] text-slate-500">
                    Schedule diagnostic scans, clinical appointments, and sample collections
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleScheduleAppointmentSubmit} className="space-y-3.5 text-xs">
              {/* Patient Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Patient Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newAptPatientName}
                    onChange={e => setNewAptPatientName(e.target.value)}
                    placeholder="e.g. Sumanth Varma"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mobile / WhatsApp Number *</label>
                  <input
                    type="tel"
                    required
                    value={newAptPatientPhone}
                    onChange={e => setNewAptPatientPhone(e.target.value)}
                    placeholder="e.g. 98480 22338"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Age</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={newAptPatientAge}
                    onChange={e => setNewAptPatientAge(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 34"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Gender</label>
                  <select
                    value={newAptPatientGender}
                    onChange={e => setNewAptPatientGender(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newAptPatientEmail}
                    onChange={e => setNewAptPatientEmail(e.target.value)}
                    placeholder="e.g. patient@gmail.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              {/* Slot Schedule */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Appointment Date *</label>
                  <input
                    type="date"
                    required
                    value={newAptDate}
                    onChange={e => setNewAptDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-700 font-bold">Appointment Time *</label>
                    <button
                      type="button"
                      onClick={() => {
                        setNewAptDate(getLocalYYYYMMDD());
                        setNewAptTime(getCurrent12HourTime());
                        showToast(`Appointment time synced to current time: ${getCurrent12HourTime()}`);
                      }}
                      className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                      title="Sync time slot to current clock"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                      <span>Sync to Current Time</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value={['08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM'].includes(newAptTime) ? newAptTime : 'CUSTOM'}
                      onChange={e => {
                        if (e.target.value !== 'CUSTOM') {
                          setNewAptTime(e.target.value);
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold text-xs"
                    >
                      <option value="CUSTOM">⚡ Custom / Current ({newAptTime})</option>
                      <option value="08:00 AM">08:00 AM (Fasting / Early Blood)</option>
                      <option value="08:30 AM">08:30 AM</option>
                      <option value="09:00 AM">09:00 AM</option>
                      <option value="09:30 AM">09:30 AM</option>
                      <option value="10:00 AM">10:00 AM (Morning Slot)</option>
                      <option value="10:30 AM">10:30 AM</option>
                      <option value="11:00 AM">11:00 AM</option>
                      <option value="11:30 AM">11:30 AM</option>
                      <option value="12:00 PM">12:00 PM (Noon Slot)</option>
                      <option value="02:00 PM">02:00 PM</option>
                      <option value="03:00 PM">03:00 PM</option>
                      <option value="04:00 PM">04:00 PM (Evening Slot)</option>
                      <option value="05:00 PM">05:00 PM</option>
                      <option value="06:00 PM">06:00 PM</option>
                      <option value="07:00 PM">07:00 PM</option>
                    </select>
                    <input
                      type="text"
                      value={newAptTime}
                      onChange={e => setNewAptTime(e.target.value)}
                      placeholder="e.g. 03:45 PM"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Test / Clinical Request */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Requested Investigation / Test</label>
                  <input
                    type="text"
                    value={newAptTest}
                    onChange={e => setNewAptTest(e.target.value)}
                    placeholder="e.g. USG Whole Abdomen, MRI Brain, Lipid Profile"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Referring Doctor / Clinic</label>
                  <input
                    type="text"
                    value={newAptDoctor}
                    onChange={e => setNewAptDoctor(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Reddy / Self"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Pre-test Notes / Preparation</label>
                <input
                  type="text"
                  value={newAptNotes}
                  onChange={e => setNewAptNotes(e.target.value)}
                  placeholder="e.g. Overnight fasting required, full bladder for USG, brings prior MRI film"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer transition-all active:scale-95"
                >
                  Confirm Appointment Slot
                </button>
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Return & Refund Order Payment */}
      {refundModalOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={e => {
            if (e.target === e.currentTarget) setRefundModalOrder(null);
          }}
        >
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xl my-8 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Record Return & Refund</h3>
                  <p className="text-[11px] text-slate-500">
                    Process patient refund, select payment mode, and document mandatory reason note
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRefundModalOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Order Brief Summary */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold">
                <span className="text-slate-900 text-sm">{refundModalOrder.patient.name}</span>
                <span className="text-sky-700 font-mono">Bill #{refundModalOrder.invoiceNumber}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-200/60 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Total Bill:</span>
                  <span className="font-bold text-slate-800">₹{refundModalOrder.totalAmount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Total Paid:</span>
                  <span className="font-bold text-emerald-700">₹{refundModalOrder.paidAmount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Prior Refunds:</span>
                  <span className="font-bold text-rose-600">₹{(refundModalOrder.refundAmount || 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] font-semibold flex items-center justify-between">
                <span>Maximum Refundable Balance:</span>
                <span className="font-black text-amber-950">
                  ₹{Math.max(0, refundModalOrder.paidAmount - (refundModalOrder.refundAmount || 0)).toLocaleString()}
                </span>
              </div>
            </div>

            <form onSubmit={handleProcessRefundSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Refund Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={Math.max(0, refundModalOrder.paidAmount - (refundModalOrder.refundAmount || 0))}
                    value={refundAmount}
                    onChange={e => setRefundAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Enter amount to refund"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Refund Payment Mode *
                  </label>
                  <select
                    value={refundMode}
                    onChange={e => setRefundMode(e.target.value as PaymentMode)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="Cash">Cash (Physical Counter Cash)</option>
                    <option value="UPI / QR">UPI / QR Transfer</option>
                    <option value="Card">Debit / Credit Card Reversal</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Reason Note for Return & Refund (Mandatory) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  placeholder="e.g. Patient requested cancellation before scan, test duplicate billing corrected, patient non-fasting unable to wait..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  This reason will be logged in the permanent audit trail, synced to Google Sheets, and printed on the amended invoice.
                </span>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Confirm & Issue Refund</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRefundModalOrder(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Scheduled Appointment */}
      {editingAppointment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={e => {
            if (e.target === e.currentTarget) setEditingAppointment(null);
          }}
        >
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 space-y-4 shadow-2xl my-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Edit Scheduled Appointment
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    ID: {editingAppointment.id} • Modifying scheduled booking
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingAppointment(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAppointment} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Patient Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editAptName}
                    onChange={e => setEditAptName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mobile / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={editAptPhone}
                    onChange={e => setEditAptPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Age</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={editAptAge}
                    onChange={e => setEditAptAge(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Gender</label>
                  <select
                    value={editAptGender}
                    onChange={e => setEditAptGender(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Booking Status</label>
                  <select
                    value={editAptStatus}
                    onChange={e => setEditAptStatus(e.target.value as AppointmentStatus)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="MISSED">MISSED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Email Address</label>
                <input
                  type="email"
                  value={editAptEmail}
                  onChange={e => setEditAptEmail(e.target.value)}
                  placeholder="e.g. patient@gmail.com"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Appointment Date *</label>
                  <input
                    type="date"
                    required
                    value={editAptDate}
                    onChange={e => setEditAptDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-700 font-bold">Time Slot *</label>
                    <button
                      type="button"
                      onClick={() => {
                        setEditAptDate(getLocalYYYYMMDD());
                        setEditAptTime(getCurrent12HourTime());
                        showToast(`Time slot synced to current time (${getCurrent12HourTime()})`);
                      }}
                      className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                      title="Set to current clock"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                      <span>Sync to Current Time</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value={['08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM'].includes(editAptTime) ? editAptTime : 'CUSTOM'}
                      onChange={e => {
                        if (e.target.value !== 'CUSTOM') {
                          setEditAptTime(e.target.value);
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                    >
                      <option value="CUSTOM">⚡ Custom / Current ({editAptTime})</option>
                      <option value="08:00 AM">08:00 AM (Fasting / Early Blood)</option>
                      <option value="08:30 AM">08:30 AM</option>
                      <option value="09:00 AM">09:00 AM</option>
                      <option value="09:30 AM">09:30 AM</option>
                      <option value="10:00 AM">10:00 AM (Morning Slot)</option>
                      <option value="10:30 AM">10:30 AM</option>
                      <option value="11:00 AM">11:00 AM</option>
                      <option value="11:30 AM">11:30 AM</option>
                      <option value="12:00 PM">12:00 PM (Noon Slot)</option>
                      <option value="02:00 PM">02:00 PM</option>
                      <option value="03:00 PM">03:00 PM</option>
                      <option value="04:00 PM">04:00 PM (Evening Slot)</option>
                      <option value="05:00 PM">05:00 PM</option>
                      <option value="06:00 PM">06:00 PM</option>
                      <option value="07:00 PM">07:00 PM</option>
                    </select>
                    <input
                      type="text"
                      value={editAptTime}
                      onChange={e => setEditAptTime(e.target.value)}
                      placeholder="e.g. 03:45 PM"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold text-xs focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Requested Investigation / Test</label>
                  <input
                    type="text"
                    value={editAptTest}
                    onChange={e => setEditAptTest(e.target.value)}
                    placeholder="e.g. USG Whole Abdomen, MRI Brain"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Referring Doctor</label>
                  <input
                    type="text"
                    value={editAptDoctor}
                    onChange={e => setEditAptDoctor(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Reddy / Walk-in"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Pre-test Notes / Preparation</label>
                <input
                  type="text"
                  value={editAptNotes}
                  onChange={e => setEditAptNotes(e.target.value)}
                  placeholder="e.g. 8-hr fasting required, prior reports requested"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer transition-all active:scale-95"
                >
                  Save & Update Appointment
                </button>
                <button
                  type="button"
                  onClick={() => setEditingAppointment(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient Clinical History & Details Modal (Read Only for Reception) */}
      {selectedPatientForEdit && (
          <EditPatientModal
            patient={selectedPatientForEdit}
            onClose={() => setSelectedPatientForEdit(null)}
            onSave={handleSavePatientEdits}
          />
        )}

        {/* Patient Clinical History & Details Modal (Read Only for Reception) */}
        {viewingPatientDetails && (
        <PatientDetailsModal
          patient={viewingPatientDetails}
          orders={allOrders || orders}
          center={selectedCenter}
          canEdit={false}
          onClose={() => setViewingPatientDetails(null)}
        />
      )}
    </div>
  );
};
