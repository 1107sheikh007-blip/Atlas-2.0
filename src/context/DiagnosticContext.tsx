import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  formatSafeDate,
  formatSafeTime,
  formatSafeDateTime,
  convert24To12HourTime,
  sanitizeOrderRecord,
  sanitizeOrdersCollection,
  parsePatientNameParts,
  getLocalYYYYMMDD,
  normalizeToYYYYMMDD,
  parseDateToISO,
  buildSafeISOFromLocalDateAndTime,
  getOrderPaymentSplit
} from '../utils/dateUtils';
import {
  UserRole,
  AuthUser,
  CenterBranch,
  ReferringDoctor,
  DiagnosticTestItem,
  Patient,
  DiagnosticOrder,
  DiagnosticReport,
  StaffEmployee,
  OperatingExpense,
  FinancialSummary,
  OrderStatus,
  PaymentMode,
  GoogleSheetsConfig,
  PendingDeletionItem,
  ActivityLogItem,
  StaffAttendanceLog,
  PatientAppointment,
  AppointmentStatus,
  DoctorRosterItem
} from '../types';
import {
  INITIAL_CENTERS,
  INITIAL_TESTS,
  resolveTestSubDepartment
} from '../data/initialData';
import {
  syncOrderToGoogleSheets,
  syncExpenseToGoogleSheets,
  syncReferringDoctorToGoogleSheets,
  syncAppointmentToGoogleSheets,
  syncPatientToGoogleSheets,
  syncStaffToGoogleSheets,
  syncDoctorRosterToGoogleSheets,
  deleteDoctorRosterFromGoogleSheets,
  deleteAppointmentFromGoogleSheets,
  deleteStaffFromGoogleSheets,
  deleteOrderFromGoogleSheets,
  deletePatientFromGoogleSheets,
  deleteExpenseFromGoogleSheets,
  deleteReferringDoctorFromGoogleSheets,
  deleteTestFromGoogleSheets,
  deleteAttendanceFromGoogleSheets,
  syncFullTestCatalogToGoogleSheets,
  updateTestPriceInGoogleSheets,
  fetchTestsFromGoogleSheets,
  fetchOrdersAndDataFromGoogleSheets,
  purgeDuplicateOrdersInGoogleSheets,
  syncFullBackupToGoogleSheets,
  setGoogleSheetsUrl,
  getGoogleSheetsUrl,
} from '../services/googleSheetsSync';

interface DiagnosticContextType {
  // Authentication & Session
  isAuthenticated: boolean;
  currentUser: AuthUser | null;
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;

  // Current session & Staff Login
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentStaffId: string;
  setCurrentStaffId: (id: string) => void;
  currentStaff?: StaffEmployee;
  
  // Center & Multi-Center
  selectedCenter: CenterBranch;
  setSelectedCenter: (center: CenterBranch) => void;
  centers: CenterBranch[];
  addCenter: (centerData: Omit<CenterBranch, 'id' | 'sheetName'>) => CenterBranch;
  isCenterLocked: boolean;
  
  // Catalogs & Test Manager
  tests: DiagnosticTestItem[];
  addTest: (test: Omit<DiagnosticTestItem, 'id'>) => void;
  updateTest: (id: string, updates: Partial<DiagnosticTestItem>) => void;
  deleteTest: (id: string) => void;
  syncCatalogToSheets: () => Promise<{ success: boolean; message: string }>;
  reloadCatalogFromSheets: () => Promise<{ success: boolean; message: string }>;
  
  // Referring Doctors & Approvals
  referrers: ReferringDoctor[];
  pendingReferrers: ReferringDoctor[];
  approvedReferrers: ReferringDoctor[];
  addReferringDoctor: (doc: Omit<ReferringDoctor, 'id' | 'totalReferralsCount' | 'totalRevenueGenerated' | 'totalCommissionEarned' | 'payoutPaid' | 'addedAt'>) => string;
  approveReferringDoctor: (id: string, commissionPct?: number, updatedFields?: Partial<ReferringDoctor>) => void;
  updateReferringDoctor: (id: string, updatedFields: Partial<ReferringDoctor>) => void;
  rejectReferringDoctor: (id: string) => void;
  deleteReferringDoctor?: (id: string) => void;
  updateDoctorCommission: (id: string, newPct: number) => void;
  recordDoctorPayout: (id: string, amount: number) => void;
  sendWelcomeDoctorWhatsApp: (doctor: Partial<ReferringDoctor> & { name: string; phone: string }) => string;

  // Doctor Duty Roster & Clinical Operations
  doctorRoster: DoctorRosterItem[];
  addDoctorToRoster: (doctor: Omit<DoctorRosterItem, 'id'>) => DoctorRosterItem;
  updateDoctorRoster: (id: string, updates: Partial<DoctorRosterItem>) => void;
  deleteDoctorFromRoster: (id: string) => void;
  getDoctorWhatsAppUrl: (doctor: DoctorRosterItem, templateType?: string, customMessage?: string) => string;

  // Patients
  patients: Patient[];
  allPatients: Patient[];
  deletedPatientIds: string[];
  registerPatient: (patientData: Omit<Patient, 'id' | 'registeredAt'>) => Patient;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  deletePatient: (patientId: string) => Promise<void>;
  sendWelcomePatientWhatsApp: (patient: Patient) => string;

  // Orders / Bills (Filtered by active center for staff)
  orders: DiagnosticOrder[];
  allOrders: DiagnosticOrder[];
  purgeDuplicateOrders: () => Promise<{ removedCount: number; totalRemaining: number }>;
  createOrder: (orderData: {
    patientId: string;
    patient?: Patient;
    testIds: string[];
    referringDoctorId?: string;
    referringDoctorName?: string;
    commissionBeneficiaryId?: string;
    commissionBeneficiaryName?: string;
    newDoctorDetails?: {
      name: string;
      specialty: string;
      qualification?: string;
      hospital: string;
      phone: string;
      email: string;
      affiliationType?: 'SELF' | 'ORGANIZATION';
      organizationName?: string;
    };
    discountPct: number;
    discountReason?: string;
    paidAmount: number;
    paymentMode: PaymentMode;
    splitPaymentDetails?: {
      cashAmount: number;
      onlineAmount: number;
      onlineMode?: 'UPI / QR' | 'Card' | 'Bank Transfer';
    };
    appointmentDate?: string;
    appointmentTime?: string;
    notes?: string;
    patientStatusRemark?: string;
    hasMissedAppointment?: boolean;
    missedAppointmentNotes?: string;
  }) => DiagnosticOrder;
  updateOrder: (orderId: string, updates: Partial<DiagnosticOrder>) => void;
  orderBeingEdited: DiagnosticOrder | null;
  startEditingOrder: (order: DiagnosticOrder) => void;
  cancelEditingOrder: () => void;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  markSampleCollected: (orderId: string, staffName?: string) => void;
  markPaymentReceived: (orderId: string, additionalAmount: number, paymentMode: PaymentMode) => void;
  processOrderRefund: (orderId: string, refundAmount: number, refundReason: string, refundMode: PaymentMode) => void;
  
  // Deletion requests and Admin Approval Gate
  pendingDeletions: PendingDeletionItem[];
  requestDeleteOrder: (orderId: string, reason?: string) => void;
  approveDeleteOrder: (orderId: string) => void;
  rejectDeleteOrder: (orderId: string) => void;

  requestDeletePatient: (patientId: string, reason?: string) => void;
  approveDeletePatient: (patientId: string) => void;
  rejectDeletePatient: (patientId: string) => void;

  requestDeleteExpense: (expenseId: string, reason?: string) => void;
  approveDeleteExpense: (expenseId: string) => void;
  rejectDeleteExpense: (expenseId: string) => void;

  requestDeleteAppointment: (appointmentId: string, reason?: string) => void;
  approveDeleteAppointment: (appointmentId: string) => void;
  rejectDeleteAppointment: (appointmentId: string) => void;

  // Appointments Hub
  appointments: PatientAppointment[];
  allAppointments: PatientAppointment[];
  addAppointment: (appointment: Omit<PatientAppointment, 'id' | 'createdAt'>) => PatientAppointment;
  updateAppointment: (id: string, updates: Partial<PatientAppointment>) => void;
  updateAppointmentStatus: (id: string, status: AppointmentStatus, notes?: string) => void;
  deleteAppointment: (id: string) => void;

  // Diagnostic Reports
  reports: DiagnosticReport[];
  getReportByOrderId: (orderId: string) => DiagnosticReport | undefined;
  saveReportDraft: (reportData: Partial<DiagnosticReport> & { orderId: string; testId: string }) => DiagnosticReport;
  authorizeReport: (reportId: string, doctorDetails: { name: string; specialty: string; regNo: string; signatureUrl?: string; sealUrl?: string }) => void;
  dispatchReportViaWhatsApp: (orderId: string, patientPhone: string) => string;
  dispatchReportViaEmail: (orderId: string) => void;

  // Staff & Payroll
  staff: StaffEmployee[];
  addStaff: (employee: Omit<StaffEmployee, 'id'>) => void;
  deleteStaff?: (id: string) => void;
  updateStaffHours: (id: string, hoursToAdd: number) => void;
  updateStaffStatus: (id: string, status: StaffEmployee['status']) => void;
  updateStaffCredentials: (id: string, updates: Partial<Omit<StaffEmployee, 'id'>>) => void;
  sendWelcomeStaffWhatsApp: (staffMember: StaffEmployee) => string;
  forceLogoutStaff: (staffId: string) => void;
  deleteAttendanceLog: (logId: string) => void;

  // Activity Log & Attendance Tracker
  activities: ActivityLogItem[];
  clearActivities: () => void;
  logActivity: (actionType: ActivityLogItem['actionType'], details: string, metadata?: Record<string, any>, centerId?: string) => void;
  attendanceLogs: StaffAttendanceLog[];

  // Expenses & Accounts
  expenses: OperatingExpense[];
  allExpenses: OperatingExpense[];
  addExpense: (expense: Omit<OperatingExpense, 'id'>) => void;
  financialSummary: FinancialSummary;

  // Google Sheets Config
  googleSheetsConfig: GoogleSheetsConfig;
  updateGoogleSheetsUrl: (url: string) => void;

  // Selected state for active views
  activePatientUHID?: string;
  setActivePatientUHID: (uhid: string | undefined) => void;
  activeReferrerId?: string;
  setActiveReferrerId: (refId: string | undefined) => void;
  activeReportToView?: DiagnosticReport;
  setActiveReportToView: (report: DiagnosticReport | undefined) => void;

  // Utility to reset or seed demo data
  resetAllData: () => void;

  // Network & Offline Status
  isOnline: boolean;
  unsyncedOrdersCount: number;
  syncOfflineQueue: () => Promise<{ syncedCount: number; failedCount: number }>;
  pullOrdersFromGoogleSheets: (forceNotify?: boolean) => Promise<{ success: boolean; count: number; message: string }>;
  
  // Real-Time Multi-Device Cloud Sync
  lastCloudSyncTime: string;
  cloudSyncStatus: 'SYNCED' | 'SYNCING' | 'OFFLINE';
  syncWithGlobalCloud: (forceNotify?: boolean) => Promise<{ success: boolean; count: number; message: string }>;
  pushCurrentStateToCloud: (overrides?: any) => Promise<void>;
  triggerFullTwoWaySync: (forceNotify?: boolean) => Promise<{ success: boolean; message: string }>;
  triggerDebouncedFullBackupToSheets: (delayMs?: number) => void;
}

const DiagnosticContext = createContext<DiagnosticContextType | undefined>(undefined);

const STORAGE_PREFIX = 'ATLAS_DIAG_SHEET_HARDWIRED_V15_';
const AUTH_STORAGE_KEY = 'ATLAS_DIAGNOSTICS_AUTH_USER_V12';

// Auto-purge stale cached data from earlier builds if needed
try {
  if (!localStorage.getItem(`${STORAGE_PREFIX}INITIALIZED`)) {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('ATLAS_DIAG_') && !k.startsWith(STORAGE_PREFIX) && k !== AUTH_STORAGE_KEY) {
        localStorage.removeItem(k);
      }
    });
    localStorage.setItem(`${STORAGE_PREFIX}INITIALIZED`, 'true');
  }
} catch (e) {
  console.warn(e);
}

export const synthesizeOrderActivity = (ord: DiagnosticOrder): ActivityLogItem => {
  const testNames = (ord.tests || []).map(t => t.name).join(', ') || 'Diagnostic Investigation';
  return {
    id: `act-ord-${ord.invoiceNumber || ord.id}`,
    timestamp: ord.createdAt || new Date().toISOString(),
    actionType: 'ORDER_CREATED',
    actorName: ord.createdByStaffName || 'Reception Desk',
    actorRole: 'RECEPTIONIST',
    centerId: ord.centerId || 'cnt-01',
    centerCode: ord.centerCode || 'ATL-MAIN',
    details: `Generated Bill #${ord.invoiceNumber} for ${ord.patient?.name || 'Patient'} (${testNames}) [₹${ord.totalAmount}] [Billed By: ${ord.createdByStaffName || 'Reception Desk'}] [Doctor: ${ord.referringDoctorName || 'Direct'}]`,
    metadata: {
      orderId: ord.id,
      invoiceNumber: ord.invoiceNumber,
      totalAmount: ord.totalAmount,
      paidAmount: ord.paidAmount,
      patientName: ord.patient?.name,
      doctorName: ord.referringDoctorName
    }
  };
};


export const DiagnosticProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const isAuthenticated = !!currentUser;

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    if (currentUser?.designation === 'Lab Technician' || currentUser?.role === 'LAB_TECHNICIAN' || currentUser?.username === 'KHUSHI-TECH3' || (currentUser?.name && currentUser.name.toLowerCase().includes('khushi'))) {
      return 'LAB_TECHNICIAN';
    }
    return currentUser?.role || 'RECEPTIONIST';
  });

  // Ensure active Lab Tech session updates to LAB_TECHNICIAN immediately
  useEffect(() => {
    if (currentUser && (currentUser.designation === 'Lab Technician' || currentUser.username === 'KHUSHI-TECH3' || (currentUser.name && currentUser.name.toLowerCase().includes('khushi')))) {
      if (currentUser.role !== 'LAB_TECHNICIAN' || currentRole !== 'LAB_TECHNICIAN') {
        const updatedUser: AuthUser = { ...currentUser, role: 'LAB_TECHNICIAN', designation: 'Lab Technician' };
        setCurrentUser(updatedUser);
        setCurrentRole('LAB_TECHNICIAN');
        try { localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser)); } catch(e){}
      }
    }
  }, [currentUser, currentRole]);

  const [centers, setCenters] = useState<CenterBranch[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}CENTERS`);
      if (saved) {
        const parsed: CenterBranch[] = JSON.parse(saved);
        return parsed.map(c => {
          if (c.id === 'cnt-01' || c.address === 'Main Health Hub, Central Road' || c.phone === '+91 98765 43210' || c.name === 'Atlas Diagnostics' || c.name === 'Atlas Diagnostic Center') {
            return {
              ...c,
              name: c.id === 'cnt-01' ? 'Atlas Diagnostics Center' : c.name,
              address: 'Ganesh Market, 106, Ganeshpuri, Khajrana, Indore, Madhya Pradesh 452016',
              phone: '9111246208, 9111246308'
            };
          }
          return c;
        });
      }
      return INITIAL_CENTERS;
    } catch {
      return INITIAL_CENTERS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}CENTERS`, JSON.stringify(centers));
    } catch (e) {
      console.warn(e);
    }
  }, [centers]);

  const addCenter = (centerData: Omit<CenterBranch, 'id' | 'sheetName'>): CenterBranch => {
    const rawCode = centerData.code?.trim() || `ATL-${Date.now().toString().slice(-4)}`;
    const cleanCode = rawCode.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    const newCenter: CenterBranch = {
      ...centerData,
      id: `cnt-${Date.now().toString().slice(-4)}`,
      code: cleanCode,
      sheetName: `Orders_${cleanCode.replace(/[^a-zA-Z0-9]/g, '_')}`
    };
    setCenters(prev => [...prev, newCenter]);
    logActivity('TEST_MODIFIED', `Added new branch center: ${newCenter.name} (${newCenter.code})`, { centerId: newCenter.id });
    return newCenter;
  };

  const [selectedCenter, setSelectedCenter] = useState<CenterBranch>(() => centers[0] || INITIAL_CENTERS[0]);
  const [currentStaffId, setCurrentStaffId] = useState<string>(() => {
    return currentUser?.staffId || 'emp-01';
  });

  // Activity Log State
  const [activities, setActivities] = useState<ActivityLogItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}ACTIVITIES`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}ACTIVITIES`, JSON.stringify(activities));
    } catch (e) {
      console.warn(e);
    }
  }, [activities]);

  const logActivity = (
    actionType: ActivityLogItem['actionType'],
    details: string,
    metadata?: Record<string, any>,
    centerId?: string
  ): ActivityLogItem => {
    const newAct: ActivityLogItem = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      actionType,
      actorName: currentUser?.name || 'System Operator',
      actorRole: currentRole,
      centerId: centerId || selectedCenter.id,
      centerCode: selectedCenter.code,
      details,
      metadata
    };
    setActivities(prev => {
      const next = [newAct, ...prev.filter(a => a.id !== newAct.id)].slice(0, 300);
      try {
        localStorage.setItem(`${STORAGE_PREFIX}ACTIVITIES`, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });
    return newAct;
  };

  // Staff Attendance Logs - Clean, zero mock data
  const [attendanceLogs, setAttendanceLogs] = useState<StaffAttendanceLog[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}ATTENDANCE`);
      if (saved) {
        const parsed: StaffAttendanceLog[] = JSON.parse(saved);
        return parsed.filter(a =>
          a.staffName !== 'Anjali Sharma' &&
          a.staffName !== 'Dr. Siddharth Mukherjee' &&
          a.id !== 'att-01' &&
          a.id !== 'att-02'
        );
      }
      return [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}ATTENDANCE`, JSON.stringify(attendanceLogs));
    } catch (e) {
      console.warn(e);
    }
  }, [attendanceLogs]);

  const [tests, setTests] = useState<DiagnosticTestItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}TESTS`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((t: DiagnosticTestItem) => {
            const rawSub = String(t.subDepartment || '').trim();
            const isDateString = rawSub.includes('GMT') || rawSub.includes(':') || rawSub.includes('2026') || rawSub.includes('Standard Time');
            return {
              ...t,
              subDepartment: (!rawSub || isDateString) ? resolveTestSubDepartment(t) : rawSub
            };
          });
        }
      }
      return INITIAL_TESTS;
    } catch {
      return INITIAL_TESTS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}TESTS`, JSON.stringify(tests));
    } catch (e) {
      console.warn(e);
    }
  }, [tests]);

  // Two-way sync: Check Google Sheets for live rate adjustments on load
  useEffect(() => {
    let isMounted = true;
    const checkLiveRates = async () => {
      try {
        const res = await fetchTestsFromGoogleSheets();
        if (isMounted && res.success && res.tests && res.tests.length > 0) {
          const liveDelTests: Set<string> = (() => {
            try {
              const s = localStorage.getItem(`${STORAGE_PREFIX}DELETED_TEST_IDS`);
              const arr: string[] = s ? JSON.parse(s) : [];
              return new Set(arr.map(x => String(x).trim().toLowerCase()));
            } catch {
              return new Set();
            }
          })();
          const sanitized = res.tests
            .filter(t => !liveDelTests.has(String(t.id || '').trim().toLowerCase()) && !liveDelTests.has(String(t.code || '').trim().toLowerCase()) && !liveDelTests.has(String(t.name || '').trim().toLowerCase()))
            .map(t => {
              const rawSub = String(t.subDepartment || '').trim();
              const isDateString = rawSub.includes('GMT') || rawSub.includes(':') || rawSub.includes('2026') || rawSub.includes('Standard Time');
              return {
                ...t,
                subDepartment: (!rawSub || isDateString) ? resolveTestSubDepartment(t) : rawSub
              };
            });
          
          setTests(prev => {
            // Retain any newly added/local tests that are not yet returned in Google Sheets
            const fetchedIds = new Set(sanitized.map(t => String(t.id || '').trim().toLowerCase()));
            const fetchedCodes = new Set(sanitized.map(t => String(t.code || '').trim().toLowerCase()));
            const fetchedNames = new Set(sanitized.map(t => String(t.name || '').trim().toLowerCase()));
            
            const localOnlyTests = prev.filter(t => {
              const id = String(t.id || '').trim().toLowerCase();
              const code = String(t.code || '').trim().toLowerCase();
              const name = String(t.name || '').trim().toLowerCase();
              const isDeleted = liveDelTests.has(id) || liveDelTests.has(code) || liveDelTests.has(name);
              return !isDeleted && !fetchedIds.has(id) && (!code || !fetchedCodes.has(code)) && (!name || !fetchedNames.has(name));
            });

            return [...localOnlyTests, ...sanitized];
          });
        }
      } catch {
        // Offline mode: gracefully falls back to local storage
      }
    };
    checkLiveRates();
    return () => { isMounted = false; };
  }, []);

  const [deletedOrderIds, setDeletedOrderIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}DELETED_ORDER_IDS`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [deletedPatientIds, setDeletedPatientIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}DELETED_PATIENT_IDS`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [deletedExpenseIds, setDeletedExpenseIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}DELETED_EXPENSE_IDS`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [deletedAppointmentIds, setDeletedAppointmentIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}DELETED_APPOINTMENT_IDS`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [deletedDoctorRosterIds, setDeletedDoctorRosterIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}DELETED_DOCTOR_ROSTER_IDS`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [deletedStaffIds, setDeletedStaffIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}DELETED_STAFF_IDS`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [deletedReferrerIds, setDeletedReferrerIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}DELETED_REFERRER_IDS`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [deletedTestIds, setDeletedTestIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}DELETED_TEST_IDS`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [deletedAttendanceIds, setDeletedAttendanceIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}DELETED_ATTENDANCE_IDS`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Real-time live tombstone getters that read directly from storage to prevent stale closure issues in interval loops
  const getLiveDeletedOrderIds = React.useCallback((): Set<string> => {
    try {
      const s = localStorage.getItem(`${STORAGE_PREFIX}DELETED_ORDER_IDS`);
      const arr: string[] = s ? JSON.parse(s) : [];
      return new Set(
        arr.map(x => String(x).trim().toLowerCase())
      );
    } catch {
      return new Set();
    }
  }, []);

  const getLiveDeletedPatientIds = React.useCallback((): Set<string> => {
    try {
      const s = localStorage.getItem(`${STORAGE_PREFIX}DELETED_PATIENT_IDS`);
      const arr: string[] = s ? JSON.parse(s) : [];
      return new Set(arr.map(x => String(x).trim().toLowerCase()));
    } catch {
      return new Set();
    }
  }, []);

  const getLiveDeletedExpenseIds = React.useCallback((): Set<string> => {
    try {
      const s = localStorage.getItem(`${STORAGE_PREFIX}DELETED_EXPENSE_IDS`);
      const arr: string[] = s ? JSON.parse(s) : [];
      return new Set(arr.map(x => String(x).trim().toLowerCase()));
    } catch {
      return new Set();
    }
  }, []);

  const getLiveDeletedAppointmentIds = React.useCallback((): Set<string> => {
    try {
      const s = localStorage.getItem(`${STORAGE_PREFIX}DELETED_APPOINTMENT_IDS`);
      const arr: string[] = s ? JSON.parse(s) : [];
      return new Set(arr.map(x => String(x).trim().toLowerCase()));
    } catch {
      return new Set();
    }
  }, []);

  const getLiveDeletedStaffIds = React.useCallback((): Set<string> => {
    try {
      const s = localStorage.getItem(`${STORAGE_PREFIX}DELETED_STAFF_IDS`);
      const arr: string[] = s ? JSON.parse(s) : [];
      return new Set(arr.map(x => String(x).trim().toLowerCase()));
    } catch {
      return new Set();
    }
  }, []);

  const getLiveDeletedDoctorRosterIds = React.useCallback((): Set<string> => {
    try {
      const s = localStorage.getItem(`${STORAGE_PREFIX}DELETED_DOCTOR_ROSTER_IDS`);
      const arr: string[] = s ? JSON.parse(s) : [];
      return new Set(arr.map(x => String(x).trim().toLowerCase()));
    } catch {
      return new Set();
    }
  }, []);

  const getLiveDeletedReferrerIds = React.useCallback((): Set<string> => {
    try {
      const s = localStorage.getItem(`${STORAGE_PREFIX}DELETED_REFERRER_IDS`);
      const arr: string[] = s ? JSON.parse(s) : [];
      return new Set(arr.map(x => String(x).trim().toLowerCase()));
    } catch {
      return new Set();
    }
  }, []);

  const getLiveDeletedTestIds = React.useCallback((): Set<string> => {
    try {
      const s = localStorage.getItem(`${STORAGE_PREFIX}DELETED_TEST_IDS`);
      const arr: string[] = s ? JSON.parse(s) : [];
      return new Set(arr.map(x => String(x).trim().toLowerCase()));
    } catch {
      return new Set();
    }
  }, []);

  const getLiveDeletedAttendanceIds = React.useCallback((): Set<string> => {
    try {
      const s = localStorage.getItem(`${STORAGE_PREFIX}DELETED_ATTENDANCE_IDS`);
      const arr: string[] = s ? JSON.parse(s) : [];
      return new Set(arr.map(x => String(x).trim().toLowerCase()));
    } catch {
      return new Set();
    }
  }, []);

  const [referrers, setReferrers] = useState<ReferringDoctor[]>(() => {
    try {
      const savedDel = localStorage.getItem(`${STORAGE_PREFIX}DELETED_REFERRER_IDS`);
      const delList: string[] = savedDel ? JSON.parse(savedDel) : [];
      const saved = localStorage.getItem(`${STORAGE_PREFIX}REFERRERS`);
      const list = saved ? JSON.parse(saved) : [];
      return list.filter((r: ReferringDoctor) => r.name !== 'Dr. Siddharth Mukherjee' && !delList.includes(r.id));
    } catch {
      return [];
    }
  });

  const [doctorRoster, setDoctorRoster] = useState<DoctorRosterItem[]>(() => {
    try {
      const savedDel = localStorage.getItem(`${STORAGE_PREFIX}DELETED_DOCTOR_ROSTER_IDS`);
      const delList: string[] = savedDel ? JSON.parse(savedDel) : [];
      const saved = localStorage.getItem(`${STORAGE_PREFIX}DOCTOR_ROSTER`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Purge mock seed doctors, deleted IDs, and old doctors
          const valid = parsed.filter((d: DoctorRosterItem) => {
            const idLower = String(d.id || '').trim().toLowerCase();
            const nameLower = String(d.name || '').trim().toLowerCase();
            if (idLower.startsWith('doc-ros-0')) return false;
            if (delList.includes(d.id) || delList.includes(idLower)) return false;
            if (nameLower.includes('rahul sharma') || nameLower.includes('sameer khan') || nameLower.includes('bhavna singhal') || nameLower.includes('siddharth mukherjee')) return false;
            return true;
          });
          if (valid.length > 0) return valid;
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}DOCTOR_ROSTER`, JSON.stringify(doctorRoster));
    } catch (e) {
      console.warn(e);
    }
  }, [doctorRoster]);

  const [patients, setPatients] = useState<Patient[]>(() => {
    try {
      const savedDel = localStorage.getItem(`${STORAGE_PREFIX}DELETED_PATIENT_IDS`);
      const delList: string[] = savedDel ? JSON.parse(savedDel) : [];
      const saved = localStorage.getItem(`${STORAGE_PREFIX}PATIENTS`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((p: Patient) => !delList.includes(p.id));
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  const [allOrders, setAllOrders] = useState<DiagnosticOrder[]>(() => {
    try {
      const savedDeleted = localStorage.getItem(`${STORAGE_PREFIX}DELETED_ORDER_IDS`);
      const delList: string[] = savedDeleted ? JSON.parse(savedDeleted) : [];
      // Auto-blacklist legacy corrupted ghost orders and deleted orders
      const legacyGhostInvoices = [
        'INV-FB-CK2610-2900-261011',
        'INV-FB-MOHSIN-0-261011',
        'INV-FB-AH2610-4100-261011',
        'INV-2026-2277',
        'INV-2026-1051',
        'ATL-ORD-INV-2026-2277',
        'ATL-ORD-INV-2026-1051'
      ];
      legacyGhostInvoices.forEach(inv => {
        if (!delList.includes(inv)) delList.push(inv);
      });
      try { localStorage.setItem(`${STORAGE_PREFIX}DELETED_ORDER_IDS`, JSON.stringify(delList)); } catch(e){}

      const saved = localStorage.getItem(`${STORAGE_PREFIX}ORDERS`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed.filter((o: DiagnosticOrder) => {
            const inv = String(o.invoiceNumber || '');
            const id = String(o.id || '');
            if (inv.startsWith('INV-FB-') || id.includes('INV-FB-')) return false;
            return !delList.includes(o.id) && !delList.includes(o.invoiceNumber);
          });
          const sanitized = sanitizeOrdersCollection(filtered);
          try {
            localStorage.setItem(`${STORAGE_PREFIX}ORDERS`, JSON.stringify(sanitized));
          } catch (e) {}
          return sanitized;
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}ORDERS`, JSON.stringify(allOrders));
    } catch (e) {
      console.warn(e);
    }
  }, [allOrders]);

  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  const [reports, setReports] = useState<DiagnosticReport[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}REPORTS`);
    return saved ? JSON.parse(saved) : [];
  });

  const CLEAN_STAFF: StaffEmployee[] = [
    {
      id: 'emp-superadmin',
      name: 'Mohsina Akhtar',
      role: 'Super Admin',
      assignedCenterId: 'ALL',
      phone: '9876543210',
      email: 'admin@atlas.com',
      username: 'admin',
      password: 'admin@123',
      status: 'Active',
      shift: 'All Hours (24/7)',
      monthlySalary: 0,
      hourlyRate: 0,
      workedHoursThisMonth: 0,
      totalShiftsCompleted: 0,
      attendancePct: 100,
      joinedDate: '2025-01-01',
      permissions: {
        canCreateInvoices: true, canCollectPayments: true, canProcessRefunds: true,
        canEditCatalog: true, canViewMISReports: true, canManageStaff: true,
        canManageReferrals: true, canAccessAppointments: true, canAuthorizeReports: true
      }
    },
    {
      id: 'emp-tashmiya',
      name: 'Tashmiya',
      role: 'Receptionist',
      assignedCenterId: 'cnt-01',
      phone: '9455910933',
      email: 'tashmiya@atlas.com',
      username: 'TASHI',
      password: 'Atlas@123',
      status: 'Active',
      shift: 'Morning (8:00 AM - 4:00 PM)',
      monthlySalary: 16000,
      hourlyRate: 100,
      workedHoursThisMonth: 0,
      totalShiftsCompleted: 0,
      attendancePct: 100,
      joinedDate: '2025-01-01',
      permissions: { canCreateInvoices: true, canCollectPayments: true, canAccessAppointments: true }
    },
    {
      id: 'emp-rahul',
      name: 'Rahul Patel',
      role: 'Center Manager',
      assignedCenterId: 'cnt-01',
      phone: '7000413530',
      email: 'rahul@atlas.com',
      username: 'RAHUL_MGR',
      password: 'Atlas@123',
      status: 'Active',
      shift: 'Custom (10:00 AM - 10:00 PM)',
      monthlySalary: 12000,
      hourlyRate: 75,
      workedHoursThisMonth: 0,
      totalShiftsCompleted: 0,
      attendancePct: 100,
      joinedDate: '2025-01-01',
      permissions: {
        canCreateInvoices: true, canCollectPayments: true, canProcessRefunds: true,
        canEditCatalog: true, canViewMISReports: true, canManageStaff: true,
        canManageReferrals: true, canAccessAppointments: true
      }
    },
    {
      id: 'emp-khushi',
      name: 'Khushi Singh',
      role: 'Lab Technician',
      assignedCenterId: 'cnt-01',
      phone: '9111229044',
      email: 'khushi@atlas.com',
      username: 'KHUSHI-TECH3',
      password: 'Atlas@123',
      status: 'Active',
      shift: 'Custom (10:00 AM - 08:30 PM)',
      monthlySalary: 20000,
      hourlyRate: 125,
      workedHoursThisMonth: 0,
      totalShiftsCompleted: 0,
      attendancePct: 100,
      joinedDate: '2025-01-01',
      permissions: { canAuthorizeReports: true }
    }
  ];

  // In-memory cache tracking recently modified staff and order records to lock them from stale background overwrites
  const dirtyStaffUpdatesRef = React.useRef<Map<string, { staff: StaffEmployee; timestamp: number }>>(new Map());
  const dirtyOrderUpdatesRef = React.useRef<Map<string, { order: DiagnosticOrder; timestamp: number }>>(new Map());
  const staffRef = React.useRef<StaffEmployee[]>([]);


  const deduplicateAndCleanStaff = React.useCallback((list: StaffEmployee[]): StaffEmployee[] => {
    const result: StaffEmployee[] = [];
    const idMap = new Map<string, number>(); // lower(id) -> index in result
    const userMap = new Map<string, number>(); // lower(username) -> index in result
    const phoneMap = new Map<string, number>(); // 10-digit phone -> index in result
    const now = Date.now();

    for (const raw of list) {
      if (!raw || (!raw.name && !raw.username && !raw.id)) continue;

      // Filter legacy demo test accounts
      const nameLower = (raw.name || '').trim().toLowerCase();
      if (
        nameLower === 'anjali sharma' ||
        nameLower === 'dr. siddharth mukherjee' ||
        nameLower.includes('sarah jenkins')
      ) {
        continue;
      }

      const idKey = (raw.id || '').trim().toLowerCase();
      const userKey = (raw.username || '').trim().toLowerCase();
      const phoneDigits = (raw.phone || '').replace(/[^0-9]/g, '');
      const phoneKey = phoneDigits.length >= 10 ? phoneDigits.slice(-10) : '';

      // Check if we already have this employee by ID, Username, or Phone
      let existingIdx = -1;
      if (idKey && idMap.has(idKey)) {
        existingIdx = idMap.get(idKey)!;
      } else if (userKey && userMap.has(userKey)) {
        existingIdx = userMap.get(userKey)!;
      } else if (phoneKey && phoneMap.has(phoneKey)) {
        existingIdx = phoneMap.get(phoneKey)!;
      }

      if (existingIdx >= 0) {
        // Merge into existing record in-place - DO NOT CREATE A DUPLICATE!
        const existing = result[existingIdx];

        // Conflict Protection: If existing was modified locally within the last 5 minutes (300,000ms),
        // or if existing.updatedAt is more recent than raw.updatedAt, preserve local user edits!
        const dirtyEntry = (idKey && dirtyStaffUpdatesRef.current.get(idKey)) ||
                           (userKey && dirtyStaffUpdatesRef.current.get(userKey)) ||
                           (phoneKey && dirtyStaffUpdatesRef.current.get(phoneKey)) ||
                           (existing.id && dirtyStaffUpdatesRef.current.get(existing.id.toLowerCase())) ||
                           (existing.username && dirtyStaffUpdatesRef.current.get(existing.username.toLowerCase()));

        const isRecentlyEdited = !!dirtyEntry && (now - dirtyEntry.timestamp < 300000);

        const existingTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
        const rawTime = raw.updatedAt ? new Date(raw.updatedAt).getTime() : 0;
        const existingIsNewer = existingTime > 0 && existingTime >= rawTime;

        const protectExisting = isRecentlyEdited || existingIsNewer;

        // Priority for custom password: never overwrite a non-empty password with undefined, empty or default
        let mergedPassword = existing.password || 'Atlas@123';
        if (raw.password && raw.password.trim() !== '') {
          if (!protectExisting && (raw.password !== 'Atlas@123' || !existing.password || existing.password === 'Atlas@123')) {
            mergedPassword = raw.password.trim();
          }
        }

        // Username merge
        let mergedUsername = existing.username || '';
        if (!protectExisting && raw.username && raw.username.trim() !== '') {
          mergedUsername = raw.username.trim();
        } else if (!mergedUsername && raw.username) {
          mergedUsername = raw.username.trim();
        } else if (!mergedUsername) {
          mergedUsername = (raw.name || existing.name || '').toLowerCase().replace(/\s+/g, '');
        }

        // Monthly salary merge: preserve local configured salary
        let mergedSalary = existing.monthlySalary ?? 0;
        if (protectExisting) {
          mergedSalary = existing.monthlySalary ?? raw.monthlySalary ?? 0;
        } else if (raw.monthlySalary !== undefined && raw.monthlySalary > 0) {
          mergedSalary = raw.monthlySalary;
        } else if (existing.monthlySalary !== undefined && existing.monthlySalary > 0) {
          mergedSalary = existing.monthlySalary;
        }

        // Hourly rate merge
        let mergedHourly = existing.hourlyRate ?? 0;
        if (protectExisting) {
          mergedHourly = existing.hourlyRate ?? raw.hourlyRate ?? Math.round(mergedSalary / 160);
        } else if (raw.hourlyRate !== undefined && raw.hourlyRate > 0) {
          mergedHourly = raw.hourlyRate;
        } else {
          mergedHourly = Math.round(mergedSalary / 160);
        }

        // Phone merge
        let mergedPhone = existing.phone || '';
        if (!protectExisting && raw.phone && raw.phone.trim() !== '') {
          mergedPhone = raw.phone.trim();
        } else if (!mergedPhone && raw.phone) {
          mergedPhone = raw.phone.trim();
        }

        const merged: StaffEmployee = {
          ...existing,
          ...raw,
          // Always preserve non-empty ID
          id: existing.id || raw.id,
          name: protectExisting ? existing.name : ((raw.name && raw.name.trim() !== '') ? raw.name.trim() : existing.name),
          role: protectExisting ? (existing.role || raw.role || 'Receptionist') : (raw.role || existing.role || 'Receptionist'),
          assignedCenterId: protectExisting ? (existing.assignedCenterId || raw.assignedCenterId || 'cnt-01') : (raw.assignedCenterId || existing.assignedCenterId || 'cnt-01'),
          username: mergedUsername,
          password: mergedPassword,
          phone: mergedPhone,
          email: protectExisting ? (existing.email || raw.email || '') : ((raw.email !== undefined && raw.email !== '') ? raw.email.trim() : existing.email),
          status: protectExisting ? (existing.status || raw.status || 'Active') : (raw.status || existing.status || 'Active'),
          shift: protectExisting ? (existing.shift || raw.shift || 'Morning (8:00 AM - 4:00 PM)') : (raw.shift || existing.shift || 'Morning (8:00 AM - 4:00 PM)'),
          shiftStartTime: protectExisting ? (existing.shiftStartTime || raw.shiftStartTime) : (raw.shiftStartTime || existing.shiftStartTime),
          shiftEndTime: protectExisting ? (existing.shiftEndTime || raw.shiftEndTime) : (raw.shiftEndTime || existing.shiftEndTime),
          shiftTiming: protectExisting ? (existing.shiftTiming || raw.shiftTiming) : (raw.shiftTiming || existing.shiftTiming),
          monthlySalary: mergedSalary,
          hourlyRate: mergedHourly,
          workedHoursThisMonth: Math.max(raw.workedHoursThisMonth || 0, existing.workedHoursThisMonth || 0),
          totalShiftsCompleted: Math.max(raw.totalShiftsCompleted || 0, existing.totalShiftsCompleted || 0),
          permissions: protectExisting ? (existing.permissions || raw.permissions) : (raw.permissions || existing.permissions),
          signatureUrl: existing.signatureUrl || raw.signatureUrl,
          sealUrl: existing.sealUrl || raw.sealUrl,
          registrationNo: existing.registrationNo || raw.registrationNo,
          updatedAt: protectExisting ? (existing.updatedAt || new Date().toISOString()) : (raw.updatedAt || existing.updatedAt || new Date().toISOString())
        };

        result[existingIdx] = merged;
        if (merged.id) idMap.set(merged.id.toLowerCase(), existingIdx);
        if (merged.username) userMap.set(merged.username.toLowerCase(), existingIdx);
        if (phoneKey) phoneMap.set(phoneKey, existingIdx);
      } else {
        // New unique record
        const employee: StaffEmployee = {
          ...raw,
          id: raw.id || `emp-${Date.now()}`,
          name: (raw.name || '').trim(),
          role: raw.role || 'Receptionist',
          assignedCenterId: raw.assignedCenterId || 'cnt-01',
          username: (raw.username && raw.username.trim() !== '') ? raw.username.trim() : (raw.name || '').toLowerCase().replace(/\s+/g, ''),
          password: (raw.password && raw.password.trim() !== '') ? raw.password.trim() : 'Atlas@123',
          status: raw.status || 'Active',
          shift: raw.shift || 'Morning (8:00 AM - 4:00 PM)',
          monthlySalary: raw.monthlySalary || 0,
          hourlyRate: raw.hourlyRate || Math.round((raw.monthlySalary || 0) / 160),
          updatedAt: raw.updatedAt || new Date().toISOString()
        };
        const idx = result.length;
        result.push(employee);
        if (employee.id) idMap.set(employee.id.toLowerCase(), idx);
        if (employee.username) userMap.set(employee.username.toLowerCase(), idx);
        if (phoneKey) phoneMap.set(phoneKey, idx);
      }
    }

    return result;
  }, []);

  const [staff, setStaff] = useState<StaffEmployee[]>(() => {
    try {
      const savedDel = localStorage.getItem(`${STORAGE_PREFIX}DELETED_STAFF_IDS`);
      const delList: string[] = savedDel ? JSON.parse(savedDel) : [];
      const saved = localStorage.getItem(`${STORAGE_PREFIX}STAFF`);
      let list: StaffEmployee[] = saved ? JSON.parse(saved) : CLEAN_STAFF;
        
      if (!localStorage.getItem('STAFF_PURGED_V7')) {
        localStorage.setItem('STAFF_PURGED_V7', 'true');
        list = CLEAN_STAFF;
        try { localStorage.setItem(`${STORAGE_PREFIX}STAFF`, JSON.stringify(CLEAN_STAFF)); } catch(e){}
      }
      const deduplicated = deduplicateAndCleanStaff(list).filter(s => !delList.includes(s.id));
      return deduplicated.length > 0 ? deduplicated : CLEAN_STAFF;
    } catch {
      return CLEAN_STAFF;
    }
  });

  const [allExpenses, setAllExpenses] = useState<OperatingExpense[]>(() => {
    try {
      const savedDel = localStorage.getItem(`${STORAGE_PREFIX}DELETED_EXPENSE_IDS`);
      const delList: string[] = savedDel ? JSON.parse(savedDel) : [];
      const saved = localStorage.getItem(`${STORAGE_PREFIX}EXPENSES`);
      const list: OperatingExpense[] = saved ? JSON.parse(saved) : [];
      return list.filter(e => !delList.includes(e.id));
    } catch {
      return [];
    }
  });

  const [allAppointments, setAllAppointments] = useState<PatientAppointment[]>(() => {
    try {
      const savedDel = localStorage.getItem(`${STORAGE_PREFIX}DELETED_APPOINTMENT_IDS`);
      const delList: string[] = savedDel ? JSON.parse(savedDel) : [];
      const saved = localStorage.getItem(`${STORAGE_PREFIX}APPOINTMENTS`);
      const list: PatientAppointment[] = saved ? JSON.parse(saved) : [];
      return list.filter(a => !delList.includes(a.id));
    } catch {
      return [];
    }
  });

  // Persistent references for immediate, race-condition-free Google Sheets synchronization
  const ordersRef = React.useRef<DiagnosticOrder[]>(allOrders);
  ordersRef.current = allOrders;
  const expensesRef = React.useRef<OperatingExpense[]>(allExpenses);
  expensesRef.current = allExpenses;
  const patientsRef = React.useRef<Patient[]>(patients);
  patientsRef.current = patients;
  const referrersRef = React.useRef<ReferringDoctor[]>(referrers);
  referrersRef.current = referrers;
  const appointmentsRef = React.useRef<PatientAppointment[]>(allAppointments);
  appointmentsRef.current = allAppointments;
  const rosterRef = React.useRef<DoctorRosterItem[]>(doctorRoster);
  rosterRef.current = doctorRoster;
  const testsRef = React.useRef<DiagnosticTestItem[]>(tests);
  testsRef.current = tests;

  const deletedOrdersRef = React.useRef<string[]>(deletedOrderIds);
  deletedOrdersRef.current = deletedOrderIds;
  const deletedPatientsRef = React.useRef<string[]>(deletedPatientIds);
  deletedPatientsRef.current = deletedPatientIds;
  const deletedExpensesRef = React.useRef<string[]>(deletedExpenseIds);
  deletedExpensesRef.current = deletedExpenseIds;
  const deletedAppointmentsRef = React.useRef<string[]>(deletedAppointmentIds);
  deletedAppointmentsRef.current = deletedAppointmentIds;
  const deletedStaffRef = React.useRef<string[]>(deletedStaffIds);
  deletedStaffRef.current = deletedStaffIds;
  const deletedRosterRef = React.useRef<string[]>(deletedDoctorRosterIds);
  deletedRosterRef.current = deletedDoctorRosterIds;
  const deletedReferrersRef = React.useRef<string[]>(deletedReferrerIds);
  deletedReferrersRef.current = deletedReferrerIds;
  const deletedTestsRef = React.useRef<string[]>(deletedTestIds);
  deletedTestsRef.current = deletedTestIds;
  const deletedAttendanceRef = React.useRef<string[]>(deletedAttendanceIds);
  deletedAttendanceRef.current = deletedAttendanceIds;

  const [googleSheetsConfig, setGoogleSheetsConfig] = useState<GoogleSheetsConfig>(() => ({
    webAppUrl: getGoogleSheetsUrl(),
    autoSyncEnabled: true,
    syncStatus: 'SUCCESS'
  }));

  const unsyncedOrdersCount = useMemo(() => {
    const unsyncedOrd = allOrders.filter(o => !o.syncedToGoogleSheets && !o.isDeleted && !o.deletionPendingApproval).length;
    const unsyncedPat = patients.filter(p => !p.syncedToGoogleSheets && !p.isDeleted).length;
    const unsyncedExp = allExpenses.filter(e => !e.syncedToGoogleSheets && !e.isDeleted).length;
    const unsyncedApt = allAppointments.filter(a => !(a as any).syncedToGoogleSheets).length;
    return unsyncedOrd + unsyncedPat + unsyncedExp + unsyncedApt;
  }, [allOrders, patients, allExpenses, allAppointments]);

  const syncOfflineQueue = async (): Promise<{ syncedCount: number; failedCount: number }> => {
    if (!navigator.onLine) {
      return { syncedCount: 0, failedCount: 0 };
    }
    let syncedCount = 0;
    let failedCount = 0;

    // 1. Sync pending orders directly to Google Sheets
    const pendingOrders = allOrders.filter(o => !o.syncedToGoogleSheets && !o.isDeleted && !o.deletionPendingApproval);
    for (const ord of pendingOrders) {
      try {
        const res = await syncOrderToGoogleSheets(ord, ord.centerCode || selectedCenter.code);
        if (res.success) {
          syncedCount++;
          setAllOrders(prev => prev.map(o => o.id === ord.id ? { ...o, syncedToGoogleSheets: true } : o));
        } else {
          failedCount++;
        }
      } catch {
        failedCount++;
      }
    }

    // 2. Sync pending patients directly to Google Sheets
    const pendingPatients = patients.filter(p => !p.syncedToGoogleSheets && !p.isDeleted);
    for (const pat of pendingPatients) {
      try {
        const res = await syncPatientToGoogleSheets(pat);
        if (res.success) {
          syncedCount++;
          setPatients(prev => prev.map(p => p.id === pat.id ? { ...p, syncedToGoogleSheets: true } : p));
        } else {
          failedCount++;
        }
      } catch {
        failedCount++;
      }
    }

    // 3. Sync pending expenses directly to Google Sheets
    const pendingExpenses = allExpenses.filter(e => !e.syncedToGoogleSheets && !e.isDeleted);
    for (const exp of pendingExpenses) {
      try {
        const res = await syncExpenseToGoogleSheets(exp);
        if (res.success) {
          syncedCount++;
          setAllExpenses(prev => prev.map(e => e.id === exp.id ? { ...e, syncedToGoogleSheets: true } : e));
        } else {
          failedCount++;
        }
      } catch {
        failedCount++;
      }
    }

    // 4. Sync pending appointments directly to Google Sheets
    const pendingAppointments = allAppointments.filter(a => !(a as any).syncedToGoogleSheets);
    for (const apt of pendingAppointments) {
      try {
        const res = await syncAppointmentToGoogleSheets(apt);
        if (res.success) {
          syncedCount++;
          setAllAppointments(prev => prev.map(a => a.id === apt.id ? { ...a, syncedToGoogleSheets: true } : a));
        } else {
          failedCount++;
        }
      } catch {
        failedCount++;
      }
    }

    if (syncedCount > 0) {
      triggerDebouncedFullBackupToSheets(200);
      logActivity(
        'SYNC_PERFORMED',
        `Synchronized ${syncedCount} records directly with Google Sheets.`
      );
    }

    return { syncedCount, failedCount };
  };

  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<string>(new Date().toISOString());
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'SYNCED' | 'SYNCING' | 'OFFLINE'>('SYNCED');

  const pushCurrentStateToCloud = async (_overrides?: any) => {
    // Hardwired directly to Google Sheets - zero third-party cloud hub dependency
  };

  const syncWithGlobalCloud = async (
    forceNotify: boolean = false
  ): Promise<{ success: boolean; count: number; message: string }> => {
    return pullOrdersFromGoogleSheets(forceNotify);
  };

  /**
   * Deep Purge and Deduplication Engine: Eliminates duplicate cloned records from Google Sheets
   * and local memory, restoring clean, uniform orders across all devices.
   */
  const purgeDuplicateOrders = async (): Promise<{ removedCount: number; totalRemaining: number }> => {
    let removedCount = 0;
    let totalRemaining = 0;

    // 1. First clean local state and cache
    setAllOrders(prev => {
      const cleaned = sanitizeOrdersCollection(prev, patients);
      removedCount = Math.max(0, prev.length - cleaned.length);
      totalRemaining = cleaned.length;
      try {
        localStorage.setItem(`${STORAGE_PREFIX}ORDERS`, JSON.stringify(cleaned));
      } catch (e) {
        console.warn(e);
      }
      pushCurrentStateToCloud({ orders: cleaned });
      return cleaned;
    });

    // 2. Physically purge duplicate rows in Google Sheets
    if (navigator.onLine) {
      try {
        await purgeDuplicateOrdersInGoogleSheets();
        // 3. Immediately pull the cleaned, deduplicated sheets data so this device reflects exact sheet state
        await pullOrdersFromGoogleSheets(false);
      } catch (err) {
        console.warn('Error purging duplicate orders from Google Sheets:', err);
      }
    }

    logActivity('SYNC_PERFORMED', `Purged duplicate order records in Google Sheets and local state (${removedCount} duplicate items removed, ${totalRemaining} clean orders active).`);
    return { removedCount, totalRemaining };
  };

  /**
   * Pulls existing orders, patients, doctors, appointments, staff & roster explicitly from Google Sheets
   * and synchronizes to local state and Cloud Hub
   */
  const pullOrdersFromGoogleSheets = async (
    forceNotify: boolean = false
  ): Promise<{ success: boolean; count: number; message: string }> => {
    if (!navigator.onLine) {
      setCloudSyncStatus('OFFLINE');
      return { success: false, count: 0, message: 'Device is offline' };
    }
    try {
      const sheetRes = await fetchOrdersAndDataFromGoogleSheets();
      let totalNewOrUpdated = 0;

      const liveDelOrders = getLiveDeletedOrderIds();
      const liveDelPatients = getLiveDeletedPatientIds();
      const liveDelExpenses = getLiveDeletedExpenseIds();
      const liveDelAppointments = getLiveDeletedAppointmentIds();
      const liveDelStaff = getLiveDeletedStaffIds();
      const liveDelRoster = getLiveDeletedDoctorRosterIds();
      const liveDelReferrers = getLiveDeletedReferrerIds();

      if (sheetRes.success) {
        // 1. ORDERS
        if (sheetRes.orders !== undefined) {
          const availablePatients = (sheetRes.patients && sheetRes.patients.length > 0) ? sheetRes.patients : patients;
          const preSanitized = sanitizeOrdersCollection(sheetRes.orders || [], availablePatients);
          const cleanSheetOrders = preSanitized
            .filter((o: any) => {
              const inv = String(o.invoiceNumber || '');
              const id = String(o.id || '');
              return !inv.startsWith('INV-FB-') && !id.includes('INV-FB-');
            })
            .filter((o: DiagnosticOrder) => {
              const oId = String(o.id || '').trim().toLowerCase();
              const oInv = String(o.invoiceNumber || '').trim().toLowerCase();
              return !liveDelOrders.has(oId) && !liveDelOrders.has(oInv) && !oInv.startsWith('inv-fb-');
            });

          setAllOrders(prev => {
            const sheetMap = new Map<string, DiagnosticOrder>();
            cleanSheetOrders.forEach(so => {
              const soId = String(so.id || '').trim().toLowerCase();
              const soInv = String(so.invoiceNumber || '').trim().toLowerCase();
              const dirtyEntry =
                dirtyOrderUpdatesRef.current.get(soId) ||
                dirtyOrderUpdatesRef.current.get(soInv);
              const isRecentlyEdited = !!dirtyEntry && (Date.now() - dirtyEntry.timestamp < 180000);
              sheetMap.set(so.id, isRecentlyEdited ? { ...so, ...dirtyEntry.order } : { ...so, syncedToGoogleSheets: true });
            });

            // Preserve local orders that are dirty, un-synced, or pending sheet write
            prev.forEach(po => {
              const poId = String(po.id || '').trim().toLowerCase();
              const poInv = String(po.invoiceNumber || '').trim().toLowerCase();
              const dirtyEntry = dirtyOrderUpdatesRef.current.get(poId) || dirtyOrderUpdatesRef.current.get(poInv);
              if (dirtyEntry && (Date.now() - dirtyEntry.timestamp < 180000)) {
                sheetMap.set(po.id, dirtyEntry.order);
              } else if (po.syncedToGoogleSheets === false && !sheetMap.has(po.id)) {
                sheetMap.set(po.id, po);
              }
            });

            const combined = Array.from(sheetMap.values());
            const cleaned = sanitizeOrdersCollection(combined, availablePatients);
            try {
              localStorage.setItem(`${STORAGE_PREFIX}ORDERS`, JSON.stringify(cleaned));
            } catch (e) {
              console.warn(e);
            }
            return cleaned;
          });
        }

        // 2. PATIENTS
        if (sheetRes.patients !== undefined) {
          const cleanPatients = (sheetRes.patients || []).filter((p: Patient) => !liveDelPatients.has(String(p.id || '').trim().toLowerCase()));
          setPatients(cleanPatients);
          try {
            localStorage.setItem(`${STORAGE_PREFIX}PATIENTS`, JSON.stringify(cleanPatients));
          } catch (e) {
            console.warn(e);
          }
        }

        // 3. EXPENSES
        if (sheetRes.expenses !== undefined) {
          const cleanExpenses = (sheetRes.expenses || []).filter((e: OperatingExpense) => !liveDelExpenses.has(String(e.id || '').trim().toLowerCase()));
          setAllExpenses(cleanExpenses);
          try {
            localStorage.setItem(`${STORAGE_PREFIX}EXPENSES`, JSON.stringify(cleanExpenses));
          } catch (e) {
            console.warn(e);
          }
        }

        // 4. REFERRING DOCTORS
        if (sheetRes.doctors !== undefined) {
          const cleanDocs = (sheetRes.doctors || []).filter((d: ReferringDoctor) => !liveDelReferrers.has(String(d.id || '').trim().toLowerCase()));
          setReferrers(cleanDocs);
          try {
            localStorage.setItem(`${STORAGE_PREFIX}REFERRERS`, JSON.stringify(cleanDocs));
          } catch (e) {
            console.warn(e);
          }
        }

        // 5. APPOINTMENTS
        if (sheetRes.appointments !== undefined) {
          const cleanAppointments = (sheetRes.appointments || [])
            .filter((a: PatientAppointment) => !liveDelAppointments.has(String(a.id || '').trim().toLowerCase()))
            .map(a => ({
              ...a,
              appointmentTime: a.appointmentTime ? convert24To12HourTime(a.appointmentTime) : a.appointmentTime
            }));
          setAllAppointments(cleanAppointments);
          try {
            localStorage.setItem(`${STORAGE_PREFIX}APPOINTMENTS`, JSON.stringify(cleanAppointments));
          } catch (e) {
            console.warn(e);
          }
        }

        // 6. STAFF
        if (sheetRes.staff !== undefined) {
          const cleanStaff = (sheetRes.staff || [])
            .filter((s: StaffEmployee) => !liveDelStaff.has(String(s.id || '').trim().toLowerCase()))
            .map(s => ({
              ...s,
              shiftStartTime: s.shiftStartTime ? convert24To12HourTime(s.shiftStartTime) : s.shiftStartTime,
              shiftEndTime: s.shiftEndTime ? convert24To12HourTime(s.shiftEndTime) : s.shiftEndTime
            }));
          const cleanedStaff = deduplicateAndCleanStaff(cleanStaff);
          setStaff(cleanedStaff);
          try {
            localStorage.setItem(`${STORAGE_PREFIX}STAFF`, JSON.stringify(cleanedStaff));
          } catch (e) {
            console.warn(e);
          }
        }

        // 7. DOCTOR ROSTER
        if (sheetRes.doctorRoster !== undefined) {
          const cleanRoster = (sheetRes.doctorRoster || []).filter((d: DoctorRosterItem) => {
            const idLower = String(d.id || '').trim().toLowerCase();
            const nameLower = String(d.name || '').trim().toLowerCase();
            if (liveDelRoster.has(idLower)) return false;
            if (idLower.startsWith('doc-ros-0')) return false;
            if (nameLower.includes('rahul sharma') || nameLower.includes('sameer khan')) return false;
            return true;
          });
          setDoctorRoster(cleanRoster);
          try {
            localStorage.setItem(`${STORAGE_PREFIX}DOCTOR_ROSTER`, JSON.stringify(cleanRoster));
          } catch (e) {
            console.warn(e);
          }
        }
      }

      setLastCloudSyncTime(new Date().toISOString());
      setCloudSyncStatus('SYNCED');

      if (forceNotify || totalNewOrUpdated > 0) {
        logActivity(
          'SYNC_PERFORMED',
          `Pulled records from Google Sheets (${totalNewOrUpdated} new/updated entries)`
        );
      }

      return {
        success: true,
        count: totalNewOrUpdated,
        message: `Successfully pulled ${totalNewOrUpdated} records from Google Sheets!`
      };
    } catch (err: any) {
      setCloudSyncStatus('OFFLINE');
      return {
        success: false,
        count: 0,
        message: `Failed to pull from Google Sheets: ${err.message || 'Network error'}`
      };
    }
  };

  // Automated debounced backup to Google Sheets disabled to prevent overwriting Google Sheets with stale browser cache and avoid lock contention
  const triggerDebouncedFullBackupToSheets = React.useCallback((_delayMs?: number, _overrideStaff?: StaffEmployee[]) => {
    // No-op: Data is synced atomically per action and pulled from Google Sheets
  }, []);

  const triggerFullTwoWaySync = async (forceNotify: boolean = true): Promise<{ success: boolean; message: string }> => {
    if (!navigator.onLine) {
      return { success: false, message: 'Device is offline' };
    }
    setCloudSyncStatus('SYNCING');
    try {
      // Pull latest directly from Google Sheets (Google Sheets is single source of truth)
      const res = await pullOrdersFromGoogleSheets(forceNotify);
      return { success: res.success, message: res.message };
    } catch (err: any) {
      setCloudSyncStatus('OFFLINE');
      return { success: false, message: `Sync error: ${err.message || 'Network issue'}` };
    }
  };

  // Automatic startup self-healing cleaner: Run deduplication immediately on boot
  useEffect(() => {
    setAllOrders(prev => {
      const cleaned = sanitizeOrdersCollection(prev, patients);
      if (cleaned.length !== prev.length) {
        try {
          localStorage.setItem(`${STORAGE_PREFIX}ORDERS`, JSON.stringify(cleaned));
        } catch (e) {
          console.warn(e);
        }
        pushCurrentStateToCloud({ orders: cleaned });
      }
      return cleaned;
    });
  }, [patients]);

  // Automatic startup doctor roster cleaner: Purge test/mock doctors on boot and record tombstones
  useEffect(() => {
    setDoctorRoster(prev => {
      const badDoctors = prev.filter(d => {
        const idLower = String(d.id || '').trim().toLowerCase();
        const nameLower = String(d.name || '').trim().toLowerCase();
        return idLower.startsWith('doc-ros-0') || nameLower.includes('rahul sharma') || nameLower.includes('sameer khan');
      });

      if (badDoctors.length > 0) {
        const badIds = badDoctors.map(d => d.id);
        const newDeleted = Array.from(new Set([...deletedDoctorRosterIds, ...badIds]));
        setDeletedDoctorRosterIds(newDeleted);
        try {
          localStorage.setItem(`${STORAGE_PREFIX}DELETED_DOCTOR_ROSTER_IDS`, JSON.stringify(newDeleted));
        } catch (e) {}

        badIds.forEach(id => {
          deleteDoctorRosterFromGoogleSheets(id).catch(() => {});
        });

        const cleaned = prev.filter(d => !badIds.includes(d.id));
        try {
          localStorage.setItem(`${STORAGE_PREFIX}DOCTOR_ROSTER`, JSON.stringify(cleaned));
        } catch (e) {}
        pushCurrentStateToCloud({ doctorRoster: cleaned });
        return cleaned;
      }
      return prev;
    });
  }, []);

  // Auto-backfill: Ensure every active order in the system has a corresponding activity audit entry
  useEffect(() => {
    if (allOrders.length === 0) return;
    setActivities(prev => {
      const existingInvoices = new Set(
        prev
          .filter(a => a.actionType === 'ORDER_CREATED' && a.metadata?.invoiceNumber)
          .map(a => a.metadata?.invoiceNumber)
      );

      const missingActs: ActivityLogItem[] = [];
      allOrders.forEach(ord => {
        if (ord.invoiceNumber && !existingInvoices.has(ord.invoiceNumber) && !ord.isDeleted && !ord.deletionPendingApproval) {
          missingActs.push(synthesizeOrderActivity(ord));
        }
      });

      if (missingActs.length > 0) {
        const sorted = [...missingActs, ...prev].slice(0, 300);
        try {
          localStorage.setItem(`${STORAGE_PREFIX}ACTIVITIES`, JSON.stringify(sorted));
        } catch (e) {
          console.warn(e);
        }
        return sorted;
      }
      return prev;
    });
  }, [allOrders]);

  // Multi-Device, Browser Storage & Google Sheets Continuous 5-Second Synchronization Engine
  useEffect(() => {
    // 1. Initial pull on startup from both Google Sheets and Cloud Hub
    pullOrdersFromGoogleSheets(false).catch(() => {});
    syncWithGlobalCloud(false).catch(() => {});

    // 2. Auto-pull when window gains focus or switching back to the tab
    const handleFocus = () => {
      if (navigator.onLine) {
        pullOrdersFromGoogleSheets(false).catch(() => {});
        syncWithGlobalCloud(false).catch(() => {});
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        pullOrdersFromGoogleSheets(false).catch(() => {});
        syncWithGlobalCloud(false).catch(() => {});
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 3. Automated 20-second continuous synchronization loop
    let isSyncActive = false;
    const intervalId = setInterval(async () => {
      if (navigator.onLine && !isSyncActive) {
        isSyncActive = true;
        try {
          await pullOrdersFromGoogleSheets(false);
          await syncOfflineQueue();
        } catch (e) {
          console.warn('Auto sync tick error:', e);
        } finally {
          isSyncActive = false;
        }
      }
    }, 10000);

    // 4. Instant cross-tab sync on the same computer via localStorage event
    const handleStorage = (e: StorageEvent) => {
      if (e.key === `${STORAGE_PREFIX}ORDERS` && e.newValue) {
        try {
          setAllOrders(JSON.parse(e.newValue));
        } catch {}
      }
      if (e.key === `${STORAGE_PREFIX}PATIENTS` && e.newValue) {
        try {
          setPatients(JSON.parse(e.newValue));
        } catch {}
      }
      if (e.key === `${STORAGE_PREFIX}EXPENSES` && e.newValue) {
        try {
          setAllExpenses(JSON.parse(e.newValue));
        } catch {}
      }
      if (e.key === `${STORAGE_PREFIX}APPOINTMENTS` && e.newValue) {
        try {
          setAllAppointments(JSON.parse(e.newValue));
        } catch {}
      }
      if (e.key === `${STORAGE_PREFIX}REFERRERS` && e.newValue) {
        try {
          setReferrers(JSON.parse(e.newValue));
        } catch {}
      }
      if (e.key === `${STORAGE_PREFIX}REPORTS` && e.newValue) {
        try {
          setReports(JSON.parse(e.newValue));
        } catch {}
      }
      if (e.key === `${STORAGE_PREFIX}STAFF` && e.newValue) {
        try {
          setStaff(JSON.parse(e.newValue));
        } catch {}
      }
      if (e.key === `${STORAGE_PREFIX}ACTIVITIES` && e.newValue) {
        try {
          setActivities(JSON.parse(e.newValue));
        } catch {}
      }
      if (e.key === `${STORAGE_PREFIX}DOCTOR_ROSTER` && e.newValue) {
        try {
          setDoctorRoster(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setCloudSyncStatus('SYNCING');
      logActivity('SYNC_PERFORMED', 'Connection restored. Synchronizing live with Google Sheets...');

      await syncOfflineQueue();

      try {
        const rateRes = await fetchTestsFromGoogleSheets();
        if (rateRes.success && rateRes.tests && rateRes.tests.length > 0) {
          const sanitized = rateRes.tests.map(t => ({
            ...t,
            subDepartment: t.subDepartment || resolveTestSubDepartment(t)
          }));
          setTests(sanitized);
        }
      } catch {}

      await pullOrdersFromGoogleSheets(true);
      await triggerFullTwoWaySync(false);

      setCloudSyncStatus('SYNCED');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setCloudSyncStatus('OFFLINE');
      logActivity('SYNC_PERFORMED', 'Internet connection lost. System paused until Google Sheets connection is restored.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [allOrders, patients, allExpenses, allAppointments, selectedCenter]);

  const updateGoogleSheetsUrl = (newUrl: string) => {
    try {
      const clean = newUrl.trim();
      setGoogleSheetsUrl(clean);
      setGoogleSheetsConfig(prev => ({ ...prev, webAppUrl: clean }));
      logActivity('SYNC_PERFORMED', `Updated Google Sheets Web App endpoint to: ${clean.slice(0, 35)}...`);
      pullOrdersFromGoogleSheets(true).catch(() => {});
    } catch (e) {
      console.warn(e);
    }
  };

  const [activePatientUHID, setActivePatientUHID] = useState<string | undefined>(undefined);
  const [activeReferrerId, setActiveReferrerId] = useState<string | undefined>(undefined);
  const [activeReportToView, setActiveReportToView] = useState<DiagnosticReport | undefined>(undefined);

  const currentStaff = staff.find(s => s.id === currentStaffId);

  useEffect(() => {
    if (currentRole !== 'SUPER_ADMIN' && currentStaff) {
      const assigned = centers.find(c => c.id === currentStaff.assignedCenterId);
      if (assigned) {
        setSelectedCenter(assigned);
      }
    }
  }, [currentStaffId, currentRole, currentStaff, centers]);

  const isCenterLocked = currentRole !== 'SUPER_ADMIN';

  // Dynamic Login Authentication
  const login = (userIn: string, passIn: string): { success: boolean; error?: string } => {
    const u = (userIn || "").trim();
    const p = (passIn || "").trim();
    const uLower = u.toLowerCase();
    const uAlpha = uLower.replace(/[^a-z0-9]/g, "");

    const recordLoginSuccess = (authUser: AuthUser, staffEmp?: StaffEmployee) => {
      setCurrentUser(authUser);
      setCurrentRole(authUser.role);
      if (authUser.staffId) {
        setCurrentStaffId(authUser.staffId);
      }
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
      } catch (e) {
        console.error(e);
      }

      if (staffEmp) {
        setStaff(prev => prev.map(s => s.id === staffEmp.id ? {
          ...s,
          isLoggedIn: true,
          lastLoginAt: new Date().toISOString()
        } : s));
      }

      const newAttLog: StaffAttendanceLog = {
        id: `att-${Date.now()}`,
        staffId: authUser.staffId || "admin-01",
        staffName: authUser.name,
        role: authUser.designation || authUser.role,
        centerId: authUser.assignedCenterId || selectedCenter.id,
        centerCode: selectedCenter.code,
        loginAt: new Date().toISOString(),
        status: "ONLINE"
      };
      setAttendanceLogs(prev => [newAttLog, ...prev]);

      logActivity("STAFF_LOGIN", `${authUser.name} (${authUser.designation}) logged into system`, {
        username: authUser.username,
        role: authUser.role
      });
    };

    const matchingStaff = staff.find(s => {
      const sUser = (s.username || "").toLowerCase();
      const sName = (s.name || "").toLowerCase();
      const sEmail = (s.email || "").toLowerCase();
      if (sUser === uLower || sName === uLower || sEmail === uLower) return true;
      if (sUser.replace(/[^a-z0-9]/g, "") === uAlpha || sName.replace(/[^a-z0-9]/g, "") === uAlpha) return true;
      if ((uAlpha.includes("khushi") || uAlpha === "khushitech3" || uAlpha === "khushitec3" || uAlpha === "khushipatel" || uAlpha === "khushibamnele") &&
          (sName.includes("khushi") || sUser.includes("khushi"))) {
        return true;
      }
      return false;
    });

    if (matchingStaff) {
      const expectedPassword = (matchingStaff.password && matchingStaff.password.trim() !== '') ? matchingStaff.password.trim() : "Atlas@123";
      const pTrimmed = p.trim();
      const pClean = p.toLowerCase().replace(/\s/g, "");
      const expectedClean = expectedPassword.toLowerCase().replace(/\s/g, "");

      const isExactMatch = pTrimmed === expectedPassword;
      const isCleanMatch = pClean === expectedClean;
      // If a custom password has been set and is NOT Atlas@123/admin@123, STRICTLY require that custom password!
      const hasCustomPassword = expectedPassword !== "Atlas@123" && expectedPassword !== "admin@123";
      const isDefaultFallback = !hasCustomPassword && (pClean === "atlas@123" || pClean === "atlas123");
      const isAdminFallback = !hasCustomPassword && uLower === "admin" && pClean === "admin@123";

      if (isExactMatch || isCleanMatch || (!hasCustomPassword && (isDefaultFallback || isAdminFallback))) {
        let mappedRole: UserRole = "RECEPTIONIST";
        if (matchingStaff.role === "Super Admin" || matchingStaff.role === "Center Director") mappedRole = "SUPER_ADMIN";
        else if (matchingStaff.role === "Center Manager") mappedRole = "CENTER_MANAGER";
        else if (matchingStaff.role === "Radiologist" || matchingStaff.role === "Pathologist") mappedRole = "DIAGNOSTIC_DOCTOR";
        else if (matchingStaff.role === "Lab Technician" || matchingStaff.role === "Phlebotomist") mappedRole = "LAB_TECHNICIAN";
        
        recordLoginSuccess({
          username: matchingStaff.username || matchingStaff.name,
          name: matchingStaff.name,
          role: mappedRole,
          designation: matchingStaff.role,
          staffId: matchingStaff.id,
          assignedCenterId: matchingStaff.assignedCenterId
        }, matchingStaff);
        return { success: true };
      }
      return { success: false, error: `Incorrect password for ${matchingStaff.name}.` };
    }

    // Direct fallback for Khushi Singh (Lab Technician)
    if (uAlpha === "khushitech3" || uAlpha === "khushitec3" || uAlpha === "khushi" || uAlpha === "khushisingh" || uAlpha === "khushipatel" || uAlpha === "khushibamnele" || uAlpha === "labtech" || uAlpha === "labtechnician") {
      const pClean = p.toLowerCase().replace(/\s/g, "");
      if (pClean === "atlas@123" || pClean === "tech@123") {
        const emp = staff.find(s => (s.name && s.name.toLowerCase().includes("khushi")) || (s.username && s.username.toLowerCase().includes("khushi")));
        recordLoginSuccess({
          username: "KHUSHI-TECH3",
          name: emp?.name || "Khushi Singh",
          role: "LAB_TECHNICIAN",
          designation: "Lab Technician",
          staffId: emp?.id || "emp-khushi",
          assignedCenterId: emp?.assignedCenterId || "cnt-01"
        }, emp);
        return { success: true };
      }
      return { success: false, error: "Incorrect password for Khushi Singh (Lab Technician)." };
    }

    if (uLower === "admin") {
      const adminStaff = staff.find(s => (s.username || '').toLowerCase() === 'admin' || (s.role === 'Super Admin' || s.role === 'Center Director'));
      const activeAdminPass = adminStaff?.password?.trim() || 'admin@123';
      const pTrimmed = p.trim();
      const pClean = p.toLowerCase().replace(/\s/g, "");
      const activeClean = activeAdminPass.toLowerCase().replace(/\s/g, "");

      if (pTrimmed === activeAdminPass || pClean === activeClean) {
        recordLoginSuccess({
          username: adminStaff?.username || "admin",
          name: adminStaff?.name || "Mohsina Akhtar",
          role: "SUPER_ADMIN",
          designation: adminStaff?.role || "Center Director & Super Admin",
          staffId: adminStaff?.id || "emp-superadmin",
          assignedCenterId: adminStaff?.assignedCenterId || "ALL"
        }, adminStaff);
        return { success: true };
      }
      return { success: false, error: "Invalid credentials. Please verify your password." };
    }

    if (uLower === "manager" || uLower === "centermanager" || uLower === "branchmanager") {
      if (p === "Manager@123" || p === "manager@123" || p === "Atlas@123") {
        recordLoginSuccess({
          username: "manager",
          name: "Center Branch Manager",
          role: "CENTER_MANAGER",
          designation: "Operations & Branch Manager",
          staffId: "emp-mgr-01",
          assignedCenterId: "cnt-01"
        });
        return { success: true };
      }
      return { success: false, error: "Incorrect password for Manager. (Password: Manager@123)" };
    }

    if (uAlpha === "reception" || uAlpha === "receptionist" || uAlpha === "frontdesk") {
      if (p === "REC@123" || p === "rec@123") {
        const emp = staff.find(s => s.id === "emp-01");
        recordLoginSuccess({
          username: "reception",
          name: emp?.name || "Front-Desk Reception",
          role: "RECEPTIONIST",
          designation: "Patient Registration & Billing",
          staffId: "emp-01",
          assignedCenterId: "cnt-01"
        }, emp);
        return { success: true };
      }
      return { success: false, error: "Incorrect password for reception. (Password: REC@123)" };
    }

    if (uAlpha === "drradio" || uAlpha === "radio" || uAlpha === "radiologist" || uAlpha === "doctorradio") {
      if (p === "Radiologist@123") {
        const emp = staff.find(s => s.id === "emp-02");
        recordLoginSuccess({
          username: "Dr. Radio",
          name: emp?.name || "Consultant Radiologist",
          role: "DIAGNOSTIC_DOCTOR",
          designation: "Consultant Radiologist",
          staffId: "emp-02",
          assignedCenterId: "cnt-01"
        }, emp);
        return { success: true };
      }
      return { success: false, error: "Incorrect password for Dr. Radio. (Password: Radiologist@123)" };
    }

    // 5. Guest Patient Session// 5. Guest Patient Session
    if (uLower === 'patient_guest' || uLower === 'patient') {
      recordLoginSuccess({
        username: 'patient',
        name: 'Patient Guest Session',
        role: 'PATIENT',
        designation: 'Patient Report Viewer'
      });
      return { success: true };
    }

    return {
      success: false,
      error: 'Invalid username. Please enter your staff credentials or use admin / reception / Dr. Radio.'
    };
  };

  const logout = () => {
    if (currentUser?.staffId) {
      const now = new Date().toISOString();
      // Update staff logout time
      setStaff(prev => prev.map(s => s.id === currentUser.staffId ? {
        ...s,
        isLoggedIn: false,
        lastLogoutAt: now
      } : s));

      // Close open attendance session
      setAttendanceLogs(prev => prev.map(att => {
        if (att.staffId === currentUser.staffId && att.status === 'ONLINE') {
          const loginTime = new Date(att.loginAt).getTime();
          const logoutTime = new Date(now).getTime();
          const duration = Math.max(1, Math.round((logoutTime - loginTime) / 60000));
          return {
            ...att,
            logoutAt: now,
            durationMinutes: duration,
            status: 'LOGGED_OUT'
          };
        }
        return att;
      }));

      logActivity('STAFF_LOGOUT', `${currentUser.name} signed out of session`, {
        staffId: currentUser.staffId
      });
    }

    setCurrentUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
  };

  const orders = useMemo(() => {
    const activeOrders = allOrders.filter(o => !o.deletionPendingApproval && !o.isDeleted);
    if (currentRole === 'SUPER_ADMIN') {
      return activeOrders;
    }
    return activeOrders.filter(o => 
      !o.centerId || 
      o.centerId === 'ALL' || 
      o.centerId === selectedCenter.id || 
      o.centerCode === selectedCenter.code ||
      o.centerId === selectedCenter.code
    );
  }, [allOrders, currentRole, selectedCenter]);

  const activePatients = useMemo(() => {
    return patients.filter(p => !p.deletionPendingApproval && !p.isDeleted);
  }, [patients]);

  const expenses = useMemo(() => {
    const activeExp = allExpenses.filter(e => !e.deletionPendingApproval && !e.isDeleted);
    if (currentRole === 'SUPER_ADMIN') {
      return activeExp;
    }
    return activeExp.filter(e => e.centerId === selectedCenter.id);
  }, [allExpenses, currentRole, selectedCenter]);

  const appointments = useMemo(() => {
    const active = allAppointments.filter(a => !a.isDeleted && !a.deletionPendingApproval);
    if (currentRole === 'SUPER_ADMIN') {
      return active;
    }
    return active.filter(a => a.centerId === selectedCenter.id);
  }, [allAppointments, currentRole, selectedCenter]);

  // Pending Deletions List for Super Admin Approval Gate
  const pendingDeletions = useMemo<PendingDeletionItem[]>(() => {
    const list: PendingDeletionItem[] = [];

    // Orders pending deletion
    allOrders.forEach(o => {
      if (o.deletionPendingApproval) {
        list.push({
          id: o.id,
          entityType: 'ORDER',
          title: `Invoice #${o.invoiceNumber} (${o.patient?.name || 'Patient'})`,
          subtitle: `Tests: ${(o.tests || []).map(t => t.name).join(', ')} • Status: ${o.status}`,
          centerId: o.centerId,
          centerCode: o.centerCode,
          amount: o.totalAmount,
          requestedBy: o.deletedByStaffName || 'Staff Member',
          requestedAt: o.deletionRequestedAt || o.createdAt,
          reason: o.deletionReason || 'Staff deletion request',
          rawItem: o
        });
      }
    });

    // Patients pending deletion
    patients.forEach(p => {
      if (p.deletionPendingApproval) {
        list.push({
          id: p.id,
          entityType: 'PATIENT',
          title: `UHID: ${p.id} - ${p.name}`,
          subtitle: `Age: ${p.age}Y/${p.gender} • Mobile: ${p.phone}`,
          requestedBy: p.deletedByStaffName || 'Staff Member',
          requestedAt: p.deletionRequestedAt || p.registeredAt,
          reason: p.deletionReason || 'Staff deletion request',
          rawItem: p
        });
      }
    });

    // Expenses pending deletion
    allExpenses.forEach(e => {
      if (e.deletionPendingApproval) {
        list.push({
          id: e.id,
          entityType: 'EXPENSE',
          title: `Voucher #${e.receiptNo || e.id} - ${e.title}`,
          subtitle: `Category: ${e.category} • Paid To: ${e.paidTo}`,
          centerId: e.centerId,
          amount: e.amount,
          requestedBy: e.deletedByStaffName || 'Staff Member',
          requestedAt: e.deletionRequestedAt || e.date,
          reason: e.deletionReason || 'Staff deletion request',
          rawItem: e
        });
      }
    });

    // Appointments pending deletion
    allAppointments.forEach(a => {
      if (a.deletionPendingApproval) {
        list.push({
          id: a.id,
          entityType: 'APPOINTMENT',
          title: `Appointment #${a.id} - ${a.patientName}`,
          subtitle: `Date: ${a.appointmentDate} ${a.appointmentTime} • Tests: ${(a.testsRequested || []).join(', ')}`,
          centerId: a.centerId,
          requestedBy: a.deletedByStaffName || 'Staff Member',
          requestedAt: a.deletionRequestedAt || a.createdAt,
          reason: a.deletionReason || 'Staff deletion request',
          rawItem: a
        });
      }
    });

    return list;
  }, [allOrders, patients, allExpenses, allAppointments]);

  // Request & Approval Methods
  const requestDeleteOrder = (orderId: string, reason?: string) => {
    if (currentRole === 'SUPER_ADMIN' || currentRole === 'CENTER_MANAGER') {
      approveDeleteOrder(orderId);
      return;
    }
    setAllOrders(prev => {
      const updated = prev.map(o => {
        if (o.id === orderId || o.invoiceNumber === orderId) {
          return {
            ...o,
            isDeleted: true,
            deletionPendingApproval: true,
            deletedByStaffName: currentUser?.name || 'Reception Staff',
            deletionReason: reason || 'Staff deletion request from reception',
            deletionRequestedAt: new Date().toLocaleString()
          };
        }
        return o;
      });
      try {
        localStorage.setItem(`${STORAGE_PREFIX}ORDERS`, JSON.stringify(updated));
      } catch (e) {}
      pushCurrentStateToCloud({ orders: updated });
      return updated;
    });
    logActivity('DELETION_REQUESTED', `Staff requested deletion of Order #${orderId}: ${reason || 'Staff removal from reception'}`, {
      orderId,
      requestedBy: currentUser?.name || 'Reception Staff',
      requestedRole: currentUser?.role || 'RECEPTIONIST'
    });
  };

  const approveDeleteOrder = (orderId: string) => {
    const targetOrder = allOrders.find(o => o.id === orderId || o.invoiceNumber === orderId);
    const idsToBlacklist: string[] = [orderId];
    if (targetOrder?.invoiceNumber) idsToBlacklist.push(targetOrder.invoiceNumber);
    if (targetOrder?.id) idsToBlacklist.push(targetOrder.id);
    if (targetOrder?.barcode) idsToBlacklist.push(targetOrder.barcode);

    const currentSaved: string[] = (() => {
      try {
        const s = localStorage.getItem(`${STORAGE_PREFIX}DELETED_ORDER_IDS`);
        return s ? JSON.parse(s) : [];
      } catch {
        return [];
      }
    })();

    const newDeletedIds = Array.from(new Set([...currentSaved, ...deletedOrderIds, ...idsToBlacklist]));
    setDeletedOrderIds(newDeletedIds);
    try {
      localStorage.setItem(`${STORAGE_PREFIX}DELETED_ORDER_IDS`, JSON.stringify(newDeletedIds));
    } catch (e) {
      console.warn(e);
    }

    setAllOrders(prev => {
      const updated = prev.filter(o => {
        const oId = String(o.id || '').toLowerCase();
        const oInv = String(o.invoiceNumber || '').toLowerCase();
        return !idsToBlacklist.some(b => {
          const bLower = String(b).toLowerCase();
          return bLower === oId || bLower === oInv;
        });
      });
      try {
        localStorage.setItem(`${STORAGE_PREFIX}ORDERS`, JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      pushCurrentStateToCloud({ orders: updated });
      return updated;
    });

    deleteOrderFromGoogleSheets(orderId, targetOrder?.invoiceNumber, targetOrder?.centerCode, targetOrder?.barcode).catch(() => {});
    triggerDebouncedFullBackupToSheets(500);
    logActivity('DELETION_APPROVED', `Admin permanently deleted Order #${targetOrder?.invoiceNumber || orderId}`);
  };

  const rejectDeleteOrder = (orderId: string) => {
    setAllOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          isDeleted: false,
          deletionPendingApproval: false,
          deletedByStaffName: undefined,
          deletionReason: undefined,
          deletionRequestedAt: undefined
        };
      }
      return o;
    }));
    logActivity('DELETION_REJECTED', `Admin rejected deletion and restored Order #${orderId} to active queue`);
  };

  const requestDeletePatient = (patientId: string, reason?: string) => {
    if (currentRole === 'SUPER_ADMIN' || currentRole === 'CENTER_MANAGER') {
      approveDeletePatient(patientId);
      return;
    }
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        return {
          ...p,
          isDeleted: true,
          deletionPendingApproval: true,
          deletedByStaffName: currentUser?.name || 'Reception Staff',
          deletionReason: reason || 'Staff deletion request from reception',
          deletionRequestedAt: new Date().toLocaleString()
        };
      }
      return p;
    }));
    logActivity('DELETION_REQUESTED', `Staff requested deletion of Patient UHID ${patientId}: ${reason || 'Staff deletion request'}`, {
      patientId,
      requestedBy: currentUser?.name || 'Reception Staff'
    });
  };

  const approveDeletePatient = (patientId: string) => {
    const targetPatient = patients.find(p => p.id === patientId || (p as any).uhid === patientId);
    const idsToBlacklist: string[] = [patientId];
    if ((targetPatient as any)?.uhid) idsToBlacklist.push((targetPatient as any).uhid);
    if (targetPatient?.id) idsToBlacklist.push(targetPatient.id);
    if (targetPatient?.phone) idsToBlacklist.push(targetPatient.phone);

    setDeletedPatientIds(prev => {
      const currentSaved: string[] = (() => {
        try {
          const s = localStorage.getItem(`${STORAGE_PREFIX}DELETED_PATIENT_IDS`);
          return s ? JSON.parse(s) : [];
        } catch {
          return [];
        }
      })();
      const newDeleted = Array.from(new Set([...currentSaved, ...prev, ...idsToBlacklist]));
      try {
        localStorage.setItem(`${STORAGE_PREFIX}DELETED_PATIENT_IDS`, JSON.stringify(newDeleted));
      } catch (e) {}
      return newDeleted;
    });

    setPatients(prev => {
      const updated = prev.filter(p => !idsToBlacklist.includes(p.id) && (!(p as any).uhid || !idsToBlacklist.includes((p as any).uhid)));
      try {
        localStorage.setItem(`${STORAGE_PREFIX}PATIENTS`, JSON.stringify(updated));
      } catch (e) {}
      pushCurrentStateToCloud({ patients: updated });
      return updated;
    });

    // Also remove any orders associated with this patient
    setAllOrders(prev => {
      const updated = prev.filter(o => !idsToBlacklist.includes(o.patientId) && (!o.patient?.id || !idsToBlacklist.includes(o.patient.id)) && (!(o.patient as any)?.uhid || !idsToBlacklist.includes((o.patient as any).uhid)));
      try {
        localStorage.setItem(`${STORAGE_PREFIX}ORDERS`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Also remove any appointments associated with this patient
    setAllAppointments(prev => {
      const targetPhone = targetPatient?.phone?.replace(/[^0-9]/g, '').slice(-10);
      const updated = prev.filter(a => {
        if (idsToBlacklist.includes(a.id)) return false;
        if (targetPhone && a.patientPhone && a.patientPhone.replace(/[^0-9]/g, '').slice(-10) === targetPhone) return false;
        return true;
      });
      try {
        localStorage.setItem(`${STORAGE_PREFIX}APPOINTMENTS`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    const uhidValue = (targetPatient as any)?.uhid || targetPatient?.id || patientId;
    deletePatientFromGoogleSheets(patientId, uhidValue, targetPatient?.phone, targetPatient?.name).catch(() => {});
    triggerDebouncedFullBackupToSheets(500);
    logActivity('DELETION_APPROVED', `Admin approved permanent deletion of Patient UHID ${uhidValue}`);
  };

  const deletePatient = async (patientId: string): Promise<void> => {
    approveDeletePatient(patientId);
  };

  const rejectDeletePatient = (patientId: string) => {
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        return {
          ...p,
          isDeleted: false,
          deletionPendingApproval: false,
          deletedByStaffName: undefined,
          deletionReason: undefined,
          deletionRequestedAt: undefined
        };
      }
      return p;
    }));
    logActivity('DELETION_REJECTED', `Admin rejected deletion and restored Patient UHID ${patientId}`);
  };

  const requestDeleteExpense = (expenseId: string, reason?: string) => {
    if (currentRole === 'SUPER_ADMIN' || currentRole === 'CENTER_MANAGER') {
      approveDeleteExpense(expenseId);
      return;
    }
    setAllExpenses(prev => prev.map(e => {
      if (e.id === expenseId) {
        return {
          ...e,
          isDeleted: true,
          deletionPendingApproval: true,
          deletedByStaffName: currentUser?.name || 'Staff Member',
          deletionReason: reason || 'Staff deletion request',
          deletionRequestedAt: new Date().toLocaleString()
        };
      }
      return e;
    }));
    logActivity('DELETION_REQUESTED', `Staff requested removal of Expense #${expenseId}`);
  };

  const approveDeleteExpense = (expenseId: string) => {
    const targetExpense = allExpenses.find(e => e.id === expenseId || e.receiptNo === expenseId);
    const idsToBlacklist: string[] = [expenseId];
    if (targetExpense?.receiptNo) idsToBlacklist.push(targetExpense.receiptNo);
    if (targetExpense?.id) idsToBlacklist.push(targetExpense.id);

    const newDeleted = Array.from(new Set([...deletedExpenseIds, ...idsToBlacklist]));
    setDeletedExpenseIds(newDeleted);
    try {
      localStorage.setItem(`${STORAGE_PREFIX}DELETED_EXPENSE_IDS`, JSON.stringify(newDeleted));
    } catch (e) {}

    setAllExpenses(prev => {
      const updated = prev.filter(e => !idsToBlacklist.includes(e.id) && (!e.receiptNo || !idsToBlacklist.includes(e.receiptNo)));
      try {
        localStorage.setItem(`${STORAGE_PREFIX}EXPENSES`, JSON.stringify(updated));
      } catch (e) {}
      pushCurrentStateToCloud({ expenses: updated });
      return updated;
    });

    deleteExpenseFromGoogleSheets(expenseId, targetExpense?.receiptNo).catch(() => {});
    triggerDebouncedFullBackupToSheets(500);
    logActivity('DELETION_APPROVED', `Admin approved permanent deletion of Expense #${targetExpense?.receiptNo || expenseId}`);
  };

  const rejectDeleteExpense = (expenseId: string) => {
    setAllExpenses(prev => prev.map(e => {
      if (e.id === expenseId) {
        return {
          ...e,
          isDeleted: false,
          deletionPendingApproval: false,
          deletedByStaffName: undefined,
          deletionReason: undefined,
          deletionRequestedAt: undefined
        };
      }
      return e;
    }));
    logActivity('DELETION_REJECTED', `Admin restored Expense #${expenseId}`);
  };

  // Sync state changes to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}TESTS`, JSON.stringify(tests));
  }, [tests]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}REFERRERS`, JSON.stringify(referrers));
  }, [referrers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}PATIENTS`, JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}ORDERS`, JSON.stringify(allOrders));
  }, [allOrders]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}REPORTS`, JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    staffRef.current = staff;
    localStorage.setItem(`${STORAGE_PREFIX}STAFF`, JSON.stringify(staff));
  }, [staff]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}EXPENSES`, JSON.stringify(allExpenses));
  }, [allExpenses]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}APPOINTMENTS`, JSON.stringify(allAppointments));
    } catch (e) {
      console.warn(e);
    }
  }, [allAppointments]);

  const normalizeDocNameKey = (name?: string) =>
    String(name || '')
      .toLowerCase()
      .replace(/^(dr\.?|doctor|mr\.?|mrs\.?|ms\.?)\s*/i, '')
      .replace(/[^a-z0-9]/g, '')
      .replace(/sh/g, 's')
      .trim();

  const approvedReferrers = useMemo(() => {
    // Compute accurate live referral count & revenue from actual orders in the system
    const statsMap = new Map<string, { count: number; revenue: number }>();
    (allOrders || []).forEach(ord => {
      if (ord.isDeleted) return;
      const amt = Number(ord.totalAmount) || Number(ord.subtotal) || 0;
      const docKey = normalizeDocNameKey(ord.referringDoctorName);
      const benKey = normalizeDocNameKey(ord.commissionBeneficiaryName);

      const matchedKeys = new Set<string>();
      if (docKey) matchedKeys.add(docKey);
      if (benKey) matchedKeys.add(benKey);

      matchedKeys.forEach(k => {
        const cur = statsMap.get(k) || { count: 0, revenue: 0 };
        cur.count += 1;
        cur.revenue += amt;
        statsMap.set(k, cur);
      });
    });

    const seen = new Set<string>();
    return referrers
      .filter(r => r.status === 'APPROVED')
      .map(r => {
        const normKey = normalizeDocNameKey(r.name);
        const liveStats = normKey ? statsMap.get(normKey) : undefined;
        
        // If doctor is SELF and organizationName is '0' or empty, use doctor's name
        let cleanOrg = r.organizationName;
        if (r.affiliationType === 'SELF' && (!cleanOrg || cleanOrg === '0' || cleanOrg === 'None')) {
          cleanOrg = r.name;
        }

        // Clean specialty if corrupted by Google Sheet cell shift with PENDING_APPROVAL
        let cleanSpec = r.specialty;
        if (cleanSpec === 'PENDING_APPROVAL' || cleanSpec === 'APPROVED' || cleanSpec === '0') {
          cleanSpec = '';
        }

        const calculatedCount = liveStats ? liveStats.count : r.totalReferralsCount;
        const calculatedRev = liveStats ? liveStats.revenue : r.totalRevenueGenerated;

        return {
          ...r,
          specialty: cleanSpec,
          organizationName: cleanOrg,
          totalReferralsCount: calculatedCount,
          totalRevenueGenerated: calculatedRev
        };
      })
      .filter(r => {
        const key = normalizeDocNameKey(r.name) || r.id;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [referrers, allOrders]);

  const pendingReferrers = useMemo(() => {
    const approvedNameKeys = new Set(
      approvedReferrers.map(r => normalizeDocNameKey(r.name)).filter(Boolean)
    );
    const seenPending = new Set<string>();
    return referrers
      .filter(r => {
        if (r.status !== 'PENDING_APPROVAL') return false;
        const key = normalizeDocNameKey(r.name);
        // Never show a doctor in Pending Approval if a doctor with the same name is already Approved!
        if (key && approvedNameKeys.has(key)) return false;
        const dedupKey = key || r.id;
        if (seenPending.has(dedupKey)) return false;
        seenPending.add(dedupKey);
        return true;
      })
      .map(r => {
        // Sanitize any cell-shifted or madeup values from Google Sheets
        let cleanSpec = r.specialty;
        if (cleanSpec === 'PENDING_APPROVAL' || cleanSpec === 'APPROVED' || cleanSpec === '0') {
          cleanSpec = '';
        }
        let cleanQual = r.qualification;
        if (cleanQual === 'PENDING_APPROVAL' || cleanQual === 'APPROVED' || cleanQual === '0') {
          cleanQual = '';
        }
        let cleanReg = r.registrationNo;
        if (cleanReg === 'SELF' || cleanReg === 'ORGANIZATION' || cleanReg === 'PENDING_APPROVAL') {
          cleanReg = '';
        }
        let cleanPhone = r.phone;
        if (cleanPhone === r.name || cleanPhone === 'SELF' || cleanPhone === 'ORGANIZATION' || cleanPhone === 'PENDING_APPROVAL') {
          cleanPhone = '';
        }
        return {
          ...r,
          specialty: cleanSpec,
          qualification: cleanQual,
          registrationNo: cleanReg,
          phone: cleanPhone
        };
      });
  }, [referrers, approvedReferrers]);

  const addReferringDoctor = (docData: Omit<ReferringDoctor, 'id' | 'totalReferralsCount' | 'totalRevenueGenerated' | 'totalCommissionEarned' | 'payoutPaid' | 'addedAt'>) => {
    const normIncoming = normalizeDocNameKey(docData.name);
    const existingDoc = normIncoming.length >= 3
      ? referrers.find(r => normalizeDocNameKey(r.name) === normIncoming)
      : undefined;

    if (existingDoc) {
      const updatedExisting: ReferringDoctor = {
        ...existingDoc,
        qualification: docData.qualification?.trim() || existingDoc.qualification || '',
        registrationNo: docData.registrationNo?.trim() || existingDoc.registrationNo || '',
        specialty: docData.specialty?.trim() || existingDoc.specialty || '',
        hospital: docData.hospital?.trim() || existingDoc.hospital || '',
        phone: docData.phone?.trim() || existingDoc.phone || '',
        email: docData.email?.trim() || existingDoc.email || '',
        organizationName: docData.organizationName?.trim() || existingDoc.organizationName || '',
        status: existingDoc.status === 'APPROVED' ? 'APPROVED' : (docData.status || existingDoc.status)
      };
      setReferrers(prev => prev.map(r => r.id === existingDoc.id ? updatedExisting : r));
      syncReferringDoctorToGoogleSheets(updatedExisting).catch(() => {});
      triggerDebouncedFullBackupToSheets(300);
      return existingDoc.id;
    }

    const newId = `ref-${Date.now().toString().slice(-4)}`;
    const isSuperAdmin = currentRole === 'SUPER_ADMIN';
    const newDoc: ReferringDoctor = {
      ...docData,
      qualification: docData.qualification?.trim() || '',
      registrationNo: docData.registrationNo?.trim() || '',
      commissionPct: Math.min(100, Math.max(0, Number(docData.commissionPct) || 0)),
      id: newId,
      addedAt: new Date().toISOString(),
      totalReferralsCount: 0,
      totalRevenueGenerated: 0,
      totalCommissionEarned: 0,
      payoutPaid: 0,
      affiliationType: docData.affiliationType || 'SELF',
      organizationName: docData.organizationName || '',
      status: docData.status || (isSuperAdmin ? 'APPROVED' : 'PENDING_APPROVAL'),
      approvedAt: (docData.status === 'APPROVED' || isSuperAdmin) ? new Date().toISOString() : undefined
    };
    setReferrers(prev => [newDoc, ...prev]);
    pushCurrentStateToCloud({ referrers: [newDoc, ...referrers] });
    syncReferringDoctorToGoogleSheets(newDoc).catch(() => {});
    triggerDebouncedFullBackupToSheets(300);
    logActivity('DOCTOR_REGISTERED', `Added doctor partner ${newDoc.name} (${newDoc.hospital || newDoc.organizationName || 'Independent'})`, {
      doctorId: newId,
      status: newDoc.status
    });
    return newId;
  };

  const approveReferringDoctor = (id: string, commissionPct?: number, updatedFields?: Partial<ReferringDoctor>) => {
    const safeCommissionPct = Math.min(100, Math.max(0, Number(commissionPct) || 0));
    setReferrers(prev => {
      const targetDoc = prev.find(d => d.id === id);
      const targetNormName = normalizeDocNameKey(updatedFields?.name || targetDoc?.name);

      const next: ReferringDoctor[] = [];
      let primaryMerged: ReferringDoctor | null = null;

      prev.forEach(doc => {
        const isSameName = targetNormName.length >= 3 && normalizeDocNameKey(doc.name) === targetNormName;
        if (doc.id === id) {
          const mergedDoc: ReferringDoctor = {
            ...doc,
            ...(updatedFields || {}),
            status: 'APPROVED',
            commissionPct: safeCommissionPct,
            approvedAt: new Date().toISOString()
          };
          primaryMerged = mergedDoc;
          next.push(mergedDoc);
        } else if (isSameName) {
          // Skip duplicate pending record for the same doctor name
          return;
        } else {
          next.push(doc);
        }
      });

      if (primaryMerged) {
        const approvedToSync: ReferringDoctor = primaryMerged;
        syncReferringDoctorToGoogleSheets(approvedToSync).catch(() => {});
        logActivity('DOCTOR_APPROVED', `Approved doctor ${approvedToSync.name} into roster`, { doctorId: id });
      }

      try {
        localStorage.setItem(`${STORAGE_PREFIX}REFERRERS`, JSON.stringify(next));
      } catch {}
      pushCurrentStateToCloud({ referrers: next });
      triggerDebouncedFullBackupToSheets(300);
      return next;
    });
  };

  const updateReferringDoctor = (id: string, updatedFields: Partial<ReferringDoctor>) => {
    setReferrers(prev => {
      const next = prev.map(doc => {
        if (doc.id === id) {
          const mergedDoc: ReferringDoctor = {
            ...doc,
            ...updatedFields
          };
          syncReferringDoctorToGoogleSheets(mergedDoc).catch(() => {});
          logActivity('DOCTOR_REGISTERED', `Updated details for doctor ${mergedDoc.name}`, { doctorId: id });
          return mergedDoc;
        }
        return doc;
      });
      try {
        localStorage.setItem(`${STORAGE_PREFIX}REFERRERS`, JSON.stringify(next));
      } catch {}
      pushCurrentStateToCloud({ referrers: next });
      triggerDebouncedFullBackupToSheets(300);
      return next;
    });
  };

  const rejectReferringDoctor = (id: string) => {
    setReferrers(prev => prev.map(doc => {
      if (doc.id === id) {
        logActivity('DOCTOR_APPROVED', `Rejected doctor approval for ${doc.name}`, { doctorId: id });
        return { ...doc, status: 'REJECTED' };
      }
      return doc;
    }));
  };

  const deleteReferringDoctor = (id: string) => {
    const match = referrers.find(d => d.id === id);
    const idsToBlacklist: string[] = [id];
    if (match?.name) idsToBlacklist.push(match.name);
    if (match?.phone) idsToBlacklist.push(match.phone);

    const newDeleted = Array.from(new Set([...deletedReferrerIds, ...idsToBlacklist]));
    setDeletedReferrerIds(newDeleted);
    try {
      localStorage.setItem(`${STORAGE_PREFIX}DELETED_REFERRER_IDS`, JSON.stringify(newDeleted));
    } catch (e) {}

    setReferrers(prev => {
      const next = prev.filter(d => !idsToBlacklist.includes(d.id) && (!match?.name || d.name !== match.name));
      try {
        localStorage.setItem(`${STORAGE_PREFIX}REFERRERS`, JSON.stringify(next));
      } catch (e) {}
      pushCurrentStateToCloud({ referrers: next });
      logActivity('DELETION_APPROVED', `Deleted referring doctor ${match?.name || id}`, { doctorId: id });
      return next;
    });

    deleteReferringDoctorFromGoogleSheets(id, match?.name, match?.phone).catch(() => {});
    triggerDebouncedFullBackupToSheets(500);
  };

  const updateDoctorCommission = (id: string, newPct: number) => {
    const safePct = Math.min(100, Math.max(0, Number(newPct) || 0));
    setReferrers(prev => prev.map(doc => {
      if (doc.id === id) {
        logActivity('DOCTOR_APPROVED', `Updated commission for ${doc.name} to ${safePct}%`, { doctorId: id });
        return { ...doc, commissionPct: safePct };
      }
      return doc;
    }));
  };

  const recordDoctorPayout = (id: string, amount: number) => {
    setReferrers(prev => prev.map(doc => {
      if (doc.id === id) {
        logActivity('PAYMENT_RECEIVED', `Recorded payout of ₹${amount.toLocaleString()} to ${doc.name}`, { doctorId: id, amount });
        return { ...doc, payoutPaid: (doc.payoutPaid || 0) + amount };
      }
      return doc;
    }));
  };

  const getPatientInitials = (name: string): string => {
    const clean = (name || '').replace(/^(dr\.?|mr\.?|mrs\.?|ms\.?|master|shri|smt\.?)\s+/i, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length >= 2) {
      return parts[0].substring(0, 2).toUpperCase();
    } else if (parts.length === 1 && parts[0].length === 1) {
      return (parts[0] + 'X').toUpperCase();
    }
    return 'PT';
  };

  const sendWelcomeDoctorWhatsApp = (doctor: Partial<ReferringDoctor> & { name: string; phone: string }): string => {
    let cleanPhone = (doctor.phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;
    const msg = encodeURIComponent(
      `*WELCOME TO ATLAS DIAGNOSTICS CENTER PARTNER NETWORK*\n\n` +
      `Dear *${doctor.name}*,\n` +
      `We are pleased to welcome you and ${doctor.organizationName || doctor.hospital || 'your clinical practice'} to the Atlas Diagnostics Center & Medical Imaging Partner Network.\n\n` +
      `• *Doctor Name:* ${doctor.name}\n` +
      `• *Specialty:* ${doctor.specialty || 'Consultant'}\n` +
      `• *Affiliation / Clinic:* ${doctor.organizationName || doctor.hospital || 'Partner Clinic'}\n` +
      `• *Center Hub:* ${selectedCenter.name}\n` +
      `• *Hotline:* ${selectedCenter.phone}\n` +
      `• *Address:* ${selectedCenter.address}\n\n` +
      `You can now refer your patients for high-accuracy 3T MRI, 128-Slice CT, 4D Ultrasound, Digital X-Ray, and Automated Pathology with priority clinical reporting.\n\n` +
      `_Atlas Diagnostics Center - Apex Pathology & Imaging Network_`
    );
    const url = `https://wa.me/${cleanPhone}?text=${msg}`;
    if (doctor.id) {
      setReferrers(prev => prev.map(d => d.id === doctor.id ? { ...d, welcomeSent: true } : d));
    }
    return url;
  };

  const addDoctorToRoster = (doctorData: Omit<DoctorRosterItem, 'id'>): DoctorRosterItem => {
    const id = `DOC-ROS-${Date.now().toString().slice(-4)}`;
    const newDoc: DoctorRosterItem = {
      ...doctorData,
      id,
      centerId: doctorData.centerId || selectedCenter.id,
      centerCode: doctorData.centerCode || selectedCenter.code
    };
    setDoctorRoster(prev => [newDoc, ...prev]);
    pushCurrentStateToCloud({ doctorRoster: [newDoc, ...doctorRoster] });
    syncDoctorRosterToGoogleSheets(newDoc).catch(() => {});
    triggerDebouncedFullBackupToSheets(1000);
    logActivity('DOCTOR_REGISTERED', `Added ${newDoc.name} to Doctor Roster (${newDoc.department} - ${newDoc.shift})`, { doctorId: id });
    return newDoc;
  };

  const updateDoctorRoster = (id: string, updates: Partial<DoctorRosterItem>) => {
    setDoctorRoster(prev => {
      const next = prev.map(d => {
        if (d.id === id) {
          const updated = { ...d, ...updates };
          syncDoctorRosterToGoogleSheets(updated).catch(() => {});
          logActivity('DOCTOR_APPROVED', `Updated duty roster for ${updated.name} (${updated.status})`, { doctorId: id });
          return updated;
        }
        return d;
      });
      pushCurrentStateToCloud({ doctorRoster: next });
      triggerDebouncedFullBackupToSheets(1000);
      return next;
    });
  };

  const deleteDoctorFromRoster = (id: string) => {
    const match = doctorRoster.find(d => d.id === id);
    const idsToBlacklist: string[] = [id];
    if (match?.name) idsToBlacklist.push(match.name);
    if (match?.phone) idsToBlacklist.push(match.phone);

    setDeletedDoctorRosterIds(prev => {
      const currentSaved: string[] = (() => {
        try {
          const s = localStorage.getItem(`${STORAGE_PREFIX}DELETED_DOCTOR_ROSTER_IDS`);
          return s ? JSON.parse(s) : [];
        } catch {
          return [];
        }
      })();
      const newDeleted = Array.from(new Set([...currentSaved, ...prev, ...idsToBlacklist]));
      try {
        localStorage.setItem(`${STORAGE_PREFIX}DELETED_DOCTOR_ROSTER_IDS`, JSON.stringify(newDeleted));
      } catch (e) {}
      return newDeleted;
    });

    setDoctorRoster(prev => {
      if (match) {
        logActivity('DELETION_APPROVED', `Removed ${match.name} from Doctor Roster`, { doctorId: id });
      }
      const next = prev.filter(d => !idsToBlacklist.includes(d.id) && (!match?.name || d.name !== match.name));
      try {
        localStorage.setItem(`${STORAGE_PREFIX}DOCTOR_ROSTER`, JSON.stringify(next));
      } catch (e) {}
      pushCurrentStateToCloud({ doctorRoster: next });
      return next;
    });

    deleteDoctorRosterFromGoogleSheets(id, match?.name, match?.phone).catch(() => {});
    triggerDebouncedFullBackupToSheets(500);
  };

  const getDoctorWhatsAppUrl = (doctor: DoctorRosterItem, templateType = 'DUTY_REMINDER', customMessage = ''): string => {
    let cleanPhone = (doctor.phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;
    
    let text = '';
    const centerTitle = selectedCenter.name;
    const centerPhone = selectedCenter.phone;

    switch (templateType) {
      case 'CRITICAL_REPORT':
        text = `*URGENT CLINICAL REVIEW REQUIRED - ATLAS DIAGNOSTICS*\n\n` +
          `Dear *${doctor.name}*,\n\n` +
          `We have a high-priority / critical abnormal investigation pending your immediate expert review & authorization at *${centerTitle}*.\n\n` +
          `• *Specialty:* ${doctor.specialty}\n` +
          `• *Reporting Cabin:* ${doctor.roomNo || 'Digital Workstation'}\n` +
          `• *Center Hub:* ${centerTitle}\n\n` +
          `Please access your Doctor Workstation portal or notify the reception desk immediately.\n\n` +
          `_Atlas Diagnostics Center Urgent Clinical Alert_`;
        break;

      case 'EMERGENCY_PATIENT':
        text = `*EMERGENCY PATIENT ARRIVAL ALERT - ATLAS DIAGNOSTICS*\n\n` +
          `Dear *${doctor.name}*,\n\n` +
          `An emergency patient has arrived requiring urgent ${doctor.department} clinical attention / diagnostic scan at *${centerTitle}*.\n\n` +
          `• *Assigned Consultant:* ${doctor.name}\n` +
          `• *Shift / Status:* ${doctor.shift} (${doctor.status})\n` +
          `• *Reception Helpline:* ${centerPhone}\n\n` +
          `Kindly confirm your availability to attend to this case.\n\n` +
          `_Atlas Diagnostics Center Emergency Response_`;
        break;

      case 'ROSTER_UPDATE':
        text = `*DOCTOR DUTY ROSTER SCHEDULE - ATLAS DIAGNOSTICS*\n\n` +
          `Dear *${doctor.name}*,\n\n` +
          `Here is your updated duty roster schedule at *${centerTitle}*:\n\n` +
          `• *Shift Timing:* ${doctor.shift}\n` +
          `• *Working Days:* ${doctor.workingDays.join(', ')}\n` +
          `• *Department:* ${doctor.department}\n` +
          `• *Room / Suite:* ${doctor.roomNo || 'Consultant Suite'}\n` +
          `• *Current Status:* ${doctor.status}\n\n` +
          `Please inform administration in advance if any shift adjustments are needed.\n\n` +
          `_Atlas Diagnostics Center Administration_`;
        break;

      case 'CUSTOM':
        text = customMessage || `Dear ${doctor.name}, greetings from Atlas Diagnostics Center.`;
        break;

      case 'DUTY_REMINDER':
      default:
        text = `*DUTY ROSTER & SHIFT CHECK - ATLAS DIAGNOSTICS*\n\n` +
          `Dear *${doctor.name}*,\n\n` +
          `This is a gentle reminder regarding your duty schedule at *${centerTitle}*:\n\n` +
          `• *Duty Shift:* ${doctor.shift}\n` +
          `• *Department:* ${doctor.department}\n` +
          `• *Designation:* ${doctor.specialty}\n` +
          `• *Room:* ${doctor.roomNo || 'Doctor Cabin'}\n` +
          `• *Duty Status:* ${doctor.status}\n\n` +
          `Please confirm your availability. For any assistance, reach the administrative desk at ${centerPhone}.\n\n` +
          `_Atlas Diagnostics Center Medical Operations_`;
        break;
    }

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  const registerPatient = (patientData: Omit<Patient, 'id' | 'registeredAt'>): Patient => {
    let cleanName = (patientData.name || '').trim();
    let title = patientData.title || '';
    let firstName = patientData.firstName ? patientData.firstName.trim() : '';
    let lastName = patientData.lastName ? patientData.lastName.trim() : '';

    if (firstName) {
      cleanName = `${title ? title + ' ' : ''}${firstName}${lastName ? ' ' + lastName : ''}`.trim();
    } else if (cleanName) {
      const parsed = parsePatientNameParts(cleanName);
      if (!title) title = parsed.title;
      if (!firstName) firstName = parsed.firstName;
      if (!lastName) lastName = parsed.lastName;
    }

    const initials = getPatientInitials(cleanName);
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateStr = `${yy}${mm}${dd}`;

    let allKnownPatientsList = [...patients];
    try {
      const savedPat = localStorage.getItem(`${STORAGE_PREFIX}PATIENTS`);
      if (savedPat) {
        const parsed = JSON.parse(savedPat);
        if (Array.isArray(parsed)) {
          parsed.forEach((sp: Patient) => {
            if (!allKnownPatientsList.some(p => p.id === sp.id)) {
              allKnownPatientsList.push(sp);
            }
          });
        }
      }
    } catch {}

    const todayPatients = allKnownPatientsList.filter(p => (p.id || '').includes(dateStr));
    let nextPatSeq = todayPatients.length + 1;
    todayPatients.forEach(p => {
      const match = p.id.match(/\d{4}$/);
      if (match) {
        const seq = parseInt(match[0], 10);
        if (!isNaN(seq) && seq >= nextPatSeq) {
          nextPatSeq = seq + 1;
        }
      }
    });
    const uhid = `${initials}${dateStr}${String(nextPatSeq).padStart(4, '0')}`;

    const newPatient: Patient = {
      ...patientData,
      name: cleanName,
      title: title || (patientData.gender === 'Female' ? 'Mrs.' : 'Mr.'),
      firstName,
      lastName,
      id: uhid,
      registeredAt: new Date().toISOString(),
      registeredCenterId: selectedCenter.id,
      syncedToGoogleSheets: false
    };
    setPatients(prev => [newPatient, ...prev]);
    pushCurrentStateToCloud({ patients: [newPatient, ...patients] });
    syncPatientToGoogleSheets(newPatient).then(res => {
      if (res.success) {
        setPatients(prev => prev.map(p => p.id === newPatient.id ? { ...p, syncedToGoogleSheets: true } : p));
      }
    }).catch(() => {});
    triggerDebouncedFullBackupToSheets(1000);
    logActivity('PATIENT_REGISTERED', `Registered new patient: ${newPatient.name} (UHID: ${uhid})`, { uhid });
    return newPatient;
  };

  const updatePatient = (id: string, updates: Partial<Patient>) => {
    setPatients(prev => {
      const next = prev.map(p => {
        if (p.id !== id) return p;
        const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
        const canChangeDoctor = isSuperAdmin || !p.referringDoctorName;
        const merged = {
          ...p,
          ...updates,
          referringDoctorId: canChangeDoctor ? (updates.referringDoctorId !== undefined ? updates.referringDoctorId : p.referringDoctorId) : p.referringDoctorId,
          referringDoctorName: canChangeDoctor ? (updates.referringDoctorName !== undefined ? updates.referringDoctorName : p.referringDoctorName) : p.referringDoctorName,
          commissionBeneficiaryId: canChangeDoctor ? (updates.commissionBeneficiaryId !== undefined ? updates.commissionBeneficiaryId : p.commissionBeneficiaryId) : p.commissionBeneficiaryId,
          commissionBeneficiaryName: canChangeDoctor ? (updates.commissionBeneficiaryName !== undefined ? updates.commissionBeneficiaryName : p.commissionBeneficiaryName) : p.commissionBeneficiaryName,
        };
        const title = (merged.title || '').trim();
        const first = (merged.firstName || '').trim();
        const last = (merged.lastName || '').trim();
        if (first) {
          merged.name = [title, first, last].filter(Boolean).join(' ').trim();
        } else if (merged.name) {
          const parsed = parsePatientNameParts(merged.name);
          if (!merged.title) merged.title = parsed.title;
          if (!merged.firstName) merged.firstName = parsed.firstName;
          if (!merged.lastName) merged.lastName = parsed.lastName;
        }
        return merged;
      });
      const target = next.find(p => p.id === id);
      if (target) syncPatientToGoogleSheets(target).catch(() => {});
      return next;
    });
  };

  const sendWelcomePatientWhatsApp = (patient: Patient): string => {
    let cleanPhone = (patient.phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;
    const msg = encodeURIComponent(
      `*WELCOME TO ATLAS DIAGNOSTICS CENTER*\n\n` +
      `Dear *${patient.name}*,\n` +
      `Welcome to Atlas Diagnostics Center. Your permanent Patient UHID has been registered successfully:\n\n` +
      `• *Patient Name:* ${patient.name}\n` +
      `• *Permanent UHID:* ${patient.id}\n` +
      `• *Registered Mobile:* ${patient.phone}\n` +
      `• *Center Hub:* ${selectedCenter.name}\n` +
      `• *Hotline:* ${selectedCenter.phone}\n` +
      `• *Address:* ${selectedCenter.address}\n\n` +
      `You can use this UHID (${patient.id}) for all future diagnostic investigations, doctor consultations, and instant online report downloads.\n\n` +
      `_Thank you for choosing Atlas Diagnostics Center._`
    );
    const url = `https://wa.me/${cleanPhone}?text=${msg}`;
    setPatients(prev => prev.map(p => p.id === patient.id ? { ...p, welcomeSent: true } : p));
    return url;
  };

  const sendWelcomeStaffWhatsApp = (staffMember: StaffEmployee): string => {
    let cleanPhone = (staffMember.phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;
    const empCenter = centers.find(c => c.id === staffMember.assignedCenterId) || selectedCenter;
    const msg = encodeURIComponent(
      `*WELCOME TO ATLAS DIAGNOSTICS CENTER TEAM*\n\n` +
      `Dear *${staffMember.name}*,\n` +
      `Your workstation credentials for Atlas Diagnostics Center have been created successfully:\n\n` +
      `• *Staff ID:* ${staffMember.id}\n` +
      `• *Designation / Role:* ${staffMember.role}\n` +
      `• *Assigned Center:* ${empCenter.name} (${empCenter.code})\n` +
      `• *Shift Timing:* ${staffMember.shift}\n\n` +
      `*Workstation Login Credentials:*\n` +
      `• *Username:* ${staffMember.username || staffMember.name.toLowerCase().replace(/\s+/g, '')}\n` +
      `• *Password:* ${staffMember.password || 'Atlas@123'}\n\n` +
      `Please login and keep your credentials confidential.\n\n` +
      `_Atlas Diagnostics Center Administration_`
    );
    return `https://wa.me/${cleanPhone}?text=${msg}`;
  };

  const addAppointment = (aptData: Omit<PatientAppointment, 'id' | 'createdAt'>): PatientAppointment => {
    const newApt: PatientAppointment = {
      ...aptData,
      id: `ATL-APT-2026-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: new Date().toISOString(),
      centerId: aptData.centerId || selectedCenter.id,
      syncedToGoogleSheets: false
    };
    setAllAppointments(prev => [newApt, ...prev]);
    pushCurrentStateToCloud({ appointments: [newApt, ...allAppointments] });
    syncAppointmentToGoogleSheets(newApt).then(res => {
      if (res.success) {
        setAllAppointments(prev => prev.map(a => a.id === newApt.id ? { ...a, syncedToGoogleSheets: true } : a));
      }
    }).catch(() => {});
    triggerDebouncedFullBackupToSheets(1000);
    logActivity('APPOINTMENT_SCHEDULED', `Scheduled appointment for ${newApt.patientName} (${newApt.appointmentDate} at ${newApt.appointmentTime})`);
    return newApt;
  };

  const updateAppointment = (id: string, updates: Partial<PatientAppointment>) => {
    let updatedApt: PatientAppointment | null = null;
    let oldApt: PatientAppointment | null = null;

    setAllAppointments(prev => {
      const next = prev.map(a => {
        if (a.id === id) {
          oldApt = a;
          updatedApt = {
            ...a,
            ...updates,
            id: a.id,
            createdAt: a.createdAt
          };
          return updatedApt;
        }
        return a;
      });
      try {
        localStorage.setItem(`${STORAGE_PREFIX}APPOINTMENTS`, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      pushCurrentStateToCloud({ appointments: next });
      if (updatedApt) {
        syncAppointmentToGoogleSheets(updatedApt).catch(() => {});
      }
      triggerDebouncedFullBackupToSheets(1000);
      return next;
    });

    if (updatedApt) {
      const actorName = currentStaff?.name || currentUser?.name || 'Staff User';
      const actorRole = currentStaff?.role || currentUser?.role || 'RECEPTIONIST';
      const changes: string[] = [];
      if (updates.patientName && updates.patientName !== (oldApt as any)?.patientName) changes.push(`Name: ${updates.patientName}`);
      if (updates.patientPhone && updates.patientPhone !== (oldApt as any)?.patientPhone) changes.push(`Phone: ${updates.patientPhone}`);
      if (updates.appointmentDate && updates.appointmentDate !== (oldApt as any)?.appointmentDate) changes.push(`Date: ${updates.appointmentDate}`);
      if (updates.appointmentTime && updates.appointmentTime !== (oldApt as any)?.appointmentTime) changes.push(`Time: ${updates.appointmentTime}`);
      if (updates.status && updates.status !== (oldApt as any)?.status) changes.push(`Status: ${updates.status}`);
      if (updates.testsRequested) changes.push(`Tests: ${updates.testsRequested.join(', ')}`);
      if (updates.referringDoctorName && updates.referringDoctorName !== (oldApt as any)?.referringDoctorName) changes.push(`Dr: ${updates.referringDoctorName}`);

      const changeDesc = changes.length > 0 ? changes.join('; ') : 'Details modified';
      logActivity(
        'APPOINTMENT_UPDATED',
        `Updated appointment #${id} for ${(updatedApt as any).patientName} by ${actorName} (${actorRole}): ${changeDesc}`,
        { appointmentId: id, actor: actorName, role: actorRole, changes }
      );
    }
  };

  const updateAppointmentStatus = (id: string, status: AppointmentStatus, notes?: string) => {
    setAllAppointments(prev => {
      const next = prev.map(a => {
        if (a.id === id) {
          const mod = {
            ...a,
            status,
            isMissed: status === 'MISSED',
            notes: notes !== undefined ? notes : a.notes
          };
          syncAppointmentToGoogleSheets(mod).catch(() => {});
          return mod;
        }
        return a;
      });
      pushCurrentStateToCloud({ appointments: next });
      triggerDebouncedFullBackupToSheets(1000);
      return next;
    });
    logActivity('APPOINTMENT_UPDATED', `Updated appointment #${id} status to ${status}`);
  };

  const requestDeleteAppointment = (appointmentId: string, reason?: string) => {
    if (currentRole === 'SUPER_ADMIN' || currentRole === 'CENTER_MANAGER') {
      approveDeleteAppointment(appointmentId);
      return;
    }
    setAllAppointments(prev => {
      const updated = prev.map(a => {
        if (a.id === appointmentId) {
          return {
            ...a,
            isDeleted: true,
            deletionPendingApproval: true,
            deletedByStaffName: currentUser?.name || 'Reception Staff',
            deletionReason: reason || 'Staff deletion request from reception',
            deletionRequestedAt: new Date().toLocaleString()
          };
        }
        return a;
      });
      try {
        localStorage.setItem(`${STORAGE_PREFIX}APPOINTMENTS`, JSON.stringify(updated));
      } catch (e) {}
      pushCurrentStateToCloud({ appointments: updated });
      return updated;
    });
    logActivity('DELETION_REQUESTED', `Staff requested deletion of Appointment #${appointmentId}: ${reason || 'Staff removal from reception'}`, {
      appointmentId,
      requestedBy: currentUser?.name || 'Reception Staff',
      requestedRole: currentUser?.role || 'RECEPTIONIST'
    });
  };

  const approveDeleteAppointment = (appointmentId: string) => {
    const targetApt = allAppointments.find(a => a.id === appointmentId);
    const newDeleted = Array.from(new Set([...deletedAppointmentIds, appointmentId]));
    setDeletedAppointmentIds(newDeleted);
    try {
      localStorage.setItem(`${STORAGE_PREFIX}DELETED_APPOINTMENT_IDS`, JSON.stringify(newDeleted));
    } catch (e) {}

    setAllAppointments(prev => {
      const next = prev.filter(a => a.id !== appointmentId);
      try {
        localStorage.setItem(`${STORAGE_PREFIX}APPOINTMENTS`, JSON.stringify(next));
      } catch (e) {}
      pushCurrentStateToCloud({ appointments: next });
      return next;
    });

    deleteAppointmentFromGoogleSheets(appointmentId, targetApt?.patientPhone, targetApt?.patientName).catch(() => {});
    triggerDebouncedFullBackupToSheets(500);
    logActivity('DELETION_APPROVED', `Admin approved permanent deletion of Appointment #${appointmentId} (${targetApt?.patientName || 'Patient'})`);
  };

  const rejectDeleteAppointment = (appointmentId: string) => {
    setAllAppointments(prev => prev.map(a => {
      if (a.id === appointmentId) {
        return {
          ...a,
          isDeleted: false,
          deletionPendingApproval: false,
          deletedByStaffName: undefined,
          deletionReason: undefined,
          deletionRequestedAt: undefined
        };
      }
      return a;
    }));
    logActivity('DELETION_REJECTED', `Admin restored Appointment #${appointmentId}`);
  };

  const deleteAppointment = (id: string) => {
    if (currentRole === 'RECEPTIONIST') {
      requestDeleteAppointment(id, 'Receptionist removed appointment');
    } else {
      approveDeleteAppointment(id);
    }
  };

  const createOrder = ({
    patientId,
    patient: directPatient,
    testIds,
    referringDoctorId,
    referringDoctorName,
    commissionBeneficiaryId,
    commissionBeneficiaryName,
    newDoctorDetails,
    discountPct,
    discountReason,
    paidAmount,
    paymentMode,
    splitPaymentDetails,
    appointmentDate,
    appointmentTime,
    notes,
    patientStatusRemark,
    hasMissedAppointment,
    missedAppointmentNotes
  }: {
    patientId: string;
    patient?: Patient;
    testIds: string[];
    referringDoctorId?: string;
    referringDoctorName?: string;
    commissionBeneficiaryId?: string;
    commissionBeneficiaryName?: string;
    newDoctorDetails?: {
      name: string;
      specialty: string;
      qualification?: string;
      registrationNo?: string;
      hospital: string;
      phone: string;
      email: string;
      affiliationType?: 'SELF' | 'ORGANIZATION';
      organizationName?: string;
    };
    discountPct: number;
    discountReason?: string;
    paidAmount: number;
    paymentMode: PaymentMode;
    splitPaymentDetails?: {
      cashAmount: number;
      onlineAmount: number;
      onlineMode?: 'UPI / QR' | 'Card' | 'Bank Transfer';
    };
    appointmentDate?: string;
    appointmentTime?: string;
    notes?: string;
    patientStatusRemark?: string;
    hasMissedAppointment?: boolean;
    missedAppointmentNotes?: string;
  }): DiagnosticOrder => {
    let patient = directPatient || patients.find(p => p.id === patientId);
    if (!patient && patientId) {
      try {
        const saved = localStorage.getItem(`${STORAGE_PREFIX}PATIENTS`);
        if (saved) {
          const parsed = JSON.parse(saved);
          patient = parsed.find((p: Patient) => p.id === patientId);
        }
      } catch (e) {
        console.warn(e);
      }
    }
    const resolvedPatient: Patient = patient || {
      id: patientId,
      name: 'Patient',
      age: 30,
      gender: 'Male',
      phone: '',
      email: '',
      address: '',
      registeredAt: new Date().toISOString(),
      registeredCenterId: selectedCenter.id
    };

    let finalDoctorId = referringDoctorId;
    let finalDoctorName = referringDoctorName || '';

    if (newDoctorDetails && newDoctorDetails.name.trim()) {
      const cleanPhone = (newDoctorDetails.phone || '').replace(/\D/g, '');
      const cleanReg = (newDoctorDetails.registrationNo || '').trim().toLowerCase();
      const rawName = newDoctorDetails.name.trim().toLowerCase().replace(/^(dr\.?|doctor)\s+/i, '').replace(/[^\w\s]/g, '').trim();

      const existingDoc = referrers.find(r => {
        if (cleanPhone && cleanPhone.length >= 8 && r.phone && r.phone.replace(/\D/g, '') === cleanPhone) return true;
        if (cleanReg && r.registrationNo && r.registrationNo.trim().toLowerCase() === cleanReg) return true;
        if (rawName.length >= 3 && r.name) {
          const rName = r.name.toLowerCase().replace(/^(dr\.?|doctor)\s+/i, '').replace(/[^\w\s]/g, '').trim();
          if (rName === rawName) return true;
        }
        return false;
      });

      if (existingDoc) {
        finalDoctorId = existingDoc.id;
        finalDoctorName = existingDoc.name;
      } else {
        const createdId = addReferringDoctor({
          name: newDoctorDetails.name,
          specialty: newDoctorDetails.specialty || '',
          qualification: newDoctorDetails.qualification || '',
          registrationNo: newDoctorDetails.registrationNo || '',
          hospital: newDoctorDetails.hospital || '',
          phone: newDoctorDetails.phone || '',
          email: newDoctorDetails.email || '',
          commissionPct: 0,
          affiliationType: newDoctorDetails.affiliationType || 'SELF',
          organizationName: newDoctorDetails.organizationName || '',
          status: 'PENDING_APPROVAL',
          addedByRole: 'RECEPTIONIST'
        });
        finalDoctorId = createdId;
        finalDoctorName = newDoctorDetails.name;
      }
    } else if (finalDoctorId) {
      const doc = referrers.find(r => r.id === finalDoctorId);
      if (doc) {
        if (!finalDoctorName) finalDoctorName = doc.name;
      }
    }

    // Determine Doctor Affiliation (e.g. Clinic, Hospital, or Organization)
    const matchingDoc = referrers.find(r => (finalDoctorId && r.id === finalDoctorId) || (finalDoctorName && r.name.toLowerCase() === finalDoctorName.toLowerCase()));
    const finalDoctorAffiliation = (newDoctorDetails && (newDoctorDetails.organizationName || newDoctorDetails.hospital)) ||
      matchingDoc?.organizationName || matchingDoc?.hospital || '';

    // Determine Commission Beneficiary (the partner credited with the referral)
    const effectiveBeneficiaryId = commissionBeneficiaryId || finalDoctorId;
    let finalBeneficiaryName = commissionBeneficiaryName || '';
    if (!finalBeneficiaryName) {
      if (commissionBeneficiaryId && commissionBeneficiaryId !== finalDoctorId) {
        const bDoc = referrers.find(r => r.id === commissionBeneficiaryId);
        if (bDoc) finalBeneficiaryName = bDoc.organizationName || bDoc.name || '';
      } else if (matchingDoc && matchingDoc.organizationName) {
        finalBeneficiaryName = matchingDoc.organizationName;
      } else {
        finalBeneficiaryName = finalDoctorName || 'Direct / Walk-in';
      }
    }

    const selectedTests = tests.filter(t => testIds.includes(t.id));
    const subtotal = selectedTests.reduce((acc, t) => acc + t.price, 0);
    const safeDiscountPct = Math.min(100, Math.max(0, Number(discountPct) || 0));
    const discountAmount = Math.round(subtotal * (safeDiscountPct / 100));
    const totalAmount = Math.max(0, subtotal - discountAmount);
    const numericPaid = Math.round(Number(paidAmount) || 0);
    const dueAmount = Math.max(0, totalAmount - numericPaid);
    const paymentStatus = dueAmount === 0 ? 'PAID' : numericPaid > 0 ? 'PARTIAL' : 'DUE';

    // Back-date support: Use selected appointmentDate if provided, otherwise default to today
    const rawTargetDate = appointmentDate ? (normalizeToYYYYMMDD(appointmentDate) || getLocalYYYYMMDD()) : getLocalYYYYMMDD();
    let orderDateObj = new Date();
    if (rawTargetDate) {
      const [pY, pM, pD] = rawTargetDate.split('-');
      const yNum = parseInt(pY, 10);
      const mNum = parseInt(pM, 10) - 1;
      const dNum = parseInt(pD, 10);
      if (!isNaN(yNum) && !isNaN(mNum) && !isNaN(dNum)) {
        orderDateObj = new Date();
        orderDateObj.setFullYear(yNum, mNum, dNum);
      }
    }

    const yy = String(orderDateObj.getFullYear()).slice(-2);
    const mm = String(orderDateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(orderDateObj.getDate()).padStart(2, '0');
    const datePrefix = `ATLS${yy}${mm}${dd}.`;

    // 1. Gather all known orders across memory and localStorage
    let allOrdersSources: DiagnosticOrder[] = [...allOrders];
    try {
      const savedOrders = localStorage.getItem(`${STORAGE_PREFIX}ORDERS`);
      if (savedOrders) {
        const parsed = JSON.parse(savedOrders);
        if (Array.isArray(parsed)) {
          parsed.forEach((po: DiagnosticOrder) => {
            if (!allOrdersSources.some(o => o.id === po.id || o.invoiceNumber === po.invoiceNumber)) {
              allOrdersSources.push(po);
            }
          });
        }
      }
    } catch {}

    // 2. Read persistent monotonic counter for target date
    let persistentSeq = 0;
    try {
      const savedCounter = localStorage.getItem(`${STORAGE_PREFIX}LAST_INV_SEQ_${datePrefix}`);
      if (savedCounter) {
        persistentSeq = parseInt(savedCounter, 10) || 0;
      }
    } catch {}

    let nextInvSeq = Math.max(1, persistentSeq + 1);
    allOrdersSources.forEach(o => {
      if (o.invoiceNumber) {
        let rawNum = o.invoiceNumber;
        if (rawNum.startsWith(datePrefix)) {
          const seqPart = rawNum.slice(datePrefix.length);
          const seq = parseInt(seqPart, 10);
          if (!isNaN(seq) && seq >= nextInvSeq) {
            nextInvSeq = seq + 1;
          }
        } else if (rawNum.startsWith(`${yy}${mm}${dd}`)) {
          const seqPart = rawNum.slice(`${yy}${mm}${dd}`.length);
          const seq = parseInt(seqPart, 10);
          if (!isNaN(seq) && seq >= nextInvSeq) {
            nextInvSeq = seq + 1;
          }
        }
      }
    });

    // 3. Ensure candidate invoice is not taken by any order in memory, storage, or deleted tombstones
    const liveDelOrders = getLiveDeletedOrderIds();
    let candidateInvoice = `${datePrefix}${String(nextInvSeq).padStart(5, '0')}`;
    while (
      allOrdersSources.some(o => (o.invoiceNumber || '').trim().toLowerCase() === candidateInvoice.toLowerCase()) ||
      liveDelOrders.has(candidateInvoice.toLowerCase()) ||
      liveDelOrders.has(`atl-ord-${candidateInvoice}`.toLowerCase())
    ) {
      nextInvSeq++;
      candidateInvoice = `${datePrefix}${String(nextInvSeq).padStart(5, '0')}`;
    }

    // 4. Save updated monotonic sequence
    try {
      localStorage.setItem(`${STORAGE_PREFIX}LAST_INV_SEQ_${datePrefix}`, String(nextInvSeq));
    } catch {}

    const invoiceNumber = candidateInvoice;
    const orderId = `ATL-ORD-${invoiceNumber}`;
    const barcode = `ATL-BAR-${invoiceNumber}`;

    // Ensure this newly generated active invoice is removed from any deletion blacklist or tombstones
    try {
      const savedDel = localStorage.getItem(`${STORAGE_PREFIX}DELETED_ORDER_IDS`);
      if (savedDel) {
        const arr: string[] = JSON.parse(savedDel);
        const filtered = arr.filter(x => {
          const l = String(x).toLowerCase().trim();
          return l !== candidateInvoice.toLowerCase() && l !== orderId.toLowerCase();
        });
        localStorage.setItem(`${STORAGE_PREFIX}DELETED_ORDER_IDS`, JSON.stringify(filtered));
        setDeletedOrderIds(filtered);
      }
    } catch {}

    let creatorName = 'Tashmiya';
    let creatorId = 'emp-tashmiya';
    if (currentUser) {
      creatorId = currentUser.staffId || currentUser.id || 'emp-tashmiya';
      if (currentUser.role === 'SUPER_ADMIN') {
        creatorName = currentUser.name ? `${currentUser.name} (Super Admin)` : 'Super Admin';
      } else if (currentUser.role === 'CENTER_MANAGER') {
        creatorName = currentUser.name ? `${currentUser.name} (Center Manager)` : 'Center Manager';
      } else {
        creatorName = currentUser.name || 'Tashmiya';
      }
    } else {
      const rec = staff.find(s => s.role === 'Receptionist');
      if (rec && rec.name) {
        creatorId = rec.id;
        creatorName = rec.name;
      }
    }

    const newOrder: DiagnosticOrder = {
      id: orderId,
      invoiceNumber,
      patientId,
      patient: resolvedPatient,
      referringDoctorId: finalDoctorId,
      referringDoctorName: finalDoctorName || 'Direct / Walk-in',
      doctorAffiliation: finalDoctorAffiliation || undefined,
      commissionBeneficiaryId: effectiveBeneficiaryId,
      commissionBeneficiaryName: finalBeneficiaryName,
      centerId: selectedCenter.id,
      centerCode: selectedCenter.code,
      tests: selectedTests,
      subtotal,
      discountPct: safeDiscountPct,
      discountAmount,
      discountReason: discountAmount > 0 ? (discountReason || 'Authorized front-desk concession') : undefined,
      gstAmount: 0,
      totalAmount,
      paidAmount: numericPaid,
      dueAmount,
      paymentMode,
      splitPaymentDetails,
      paymentStatus,
      barcode,
      status: 'ORDER_PLACED', // Initial status before sample is collected
      createdAt: buildSafeISOFromLocalDateAndTime(rawTargetDate, appointmentTime),
      appointmentDate: rawTargetDate,
      appointmentTime: appointmentTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sampleCollected: false,
      createdByStaffId: creatorId,
      createdByStaffName: creatorName,
      whatsappSent: false,
      smsSent: false,
      notes,
      patientStatusRemark,
      hasMissedAppointment: !!hasMissedAppointment,
      missedAppointmentNotes,
      syncedToGoogleSheets: false
    };

    dirtyOrderUpdatesRef.current.set(orderId.toLowerCase(), { order: newOrder, timestamp: Date.now() });
    dirtyOrderUpdatesRef.current.set(invoiceNumber.toLowerCase(), { order: newOrder, timestamp: Date.now() });

    const newAct = logActivity('ORDER_CREATED', `Generated Bill #${newOrder.invoiceNumber} for ${resolvedPatient.name} (₹${totalAmount}) [Billed By: ${newOrder.createdByStaffName}] [Ref: ${newOrder.referringDoctorName}] [Beneficiary: ${newOrder.commissionBeneficiaryName}]`, {
      orderId,
      invoiceNumber: newOrder.invoiceNumber,
      totalAmount,
      billedBy: newOrder.createdByStaffName,
      referringDoctor: newOrder.referringDoctorName,
      commissionBeneficiary: newOrder.commissionBeneficiaryName
    });

    const nextOrders = [newOrder, ...allOrders];
    try {
      localStorage.setItem(`${STORAGE_PREFIX}ORDERS`, JSON.stringify(nextOrders));
    } catch (e) {
      console.warn(e);
    }
    setAllOrders(nextOrders);
    setPatients(prev => {
      const updatedPatient: Patient = {
        ...resolvedPatient,
        referringDoctorId: finalDoctorId || resolvedPatient.referringDoctorId,
        referringDoctorName: finalDoctorName || resolvedPatient.referringDoctorName,
        commissionBeneficiaryId: effectiveBeneficiaryId || resolvedPatient.commissionBeneficiaryId,
        commissionBeneficiaryName: finalBeneficiaryName || resolvedPatient.commissionBeneficiaryName
      };
      if (prev.some(p => p.id === resolvedPatient.id)) {
        return prev.map(p => p.id === resolvedPatient.id ? { ...p, ...updatedPatient } : p);
      }
      return [updatedPatient, ...prev];
    });

    // Live Sync to Google Sheets
    syncOrderToGoogleSheets(newOrder, selectedCenter.code).then(res => {
      if (res.success) {
        setAllOrders(prev => prev.map(o => (o.id === newOrder.id ? { ...o, syncedToGoogleSheets: true } : o)));
      }
    });
    triggerDebouncedFullBackupToSheets(1000);

    // Update Referrer totals - Commission goes specifically to the person who referred the patient to the center
    if (effectiveBeneficiaryId) {
      setReferrers(prev => prev.map(doc => {
        if (doc.id === effectiveBeneficiaryId) {
          const commEarned = doc.status === 'APPROVED' ? (totalAmount * (doc.commissionPct / 100)) : 0;
          return {
            ...doc,
            totalReferralsCount: doc.totalReferralsCount + 1,
            totalRevenueGenerated: doc.totalRevenueGenerated + totalAmount,
            totalCommissionEarned: doc.totalCommissionEarned + commEarned
          };
        }
        return doc;
      }));
    }

    return newOrder;
  };

  const processOrderRefund = (orderId: string, refundAmount: number, refundReason: string, refundMode: PaymentMode) => {
    const numAmount = Math.max(0, Number(refundAmount) || 0);
    if (!numAmount || !refundReason.trim()) return;

    setAllOrders(prev => prev.map(ord => {
      if (ord.id === orderId) {
        const existingRefund = ord.refundAmount || 0;
        const totalRefund = Math.min(ord.paidAmount, existingRefund + numAmount);
        const isFull = totalRefund >= ord.paidAmount;

        const updated: DiagnosticOrder = {
          ...ord,
          refundAmount: totalRefund,
          refundReason: refundReason.trim(),
          refundMode: refundMode || 'Cash',
          refundedAt: new Date().toISOString(),
          refundedByStaffName: currentUser?.name || 'Authorized Staff',
          isRefunded: true,
          refundStatus: isFull ? 'FULL_REFUND' : 'PARTIAL_REFUND'
        };

        logActivity(
          'ORDER_REFUNDED',
          `Processed ${isFull ? 'full' : 'partial'} refund of ₹${numAmount} for Order #${ord.invoiceNumber} (${ord.patient.name}). Reason: ${refundReason.trim()} [Mode: ${refundMode}]`,
          { orderId, refundAmount: numAmount, refundReason, refundMode, refundedBy: currentUser?.name }
        );

        syncOrderToGoogleSheets(updated, selectedCenter.code);
        triggerDebouncedFullBackupToSheets(1000);
        return updated;
      }
      return ord;
    }));
  };

  const markSampleCollected = (orderId: string, staffName?: string) => {
    const collector = staffName || currentUser?.name || 'Lab Phlebotomist';
    const now = new Date().toISOString();
    let updatedOrder: DiagnosticOrder | undefined;
    setAllOrders(prev => {
      const next = prev.map(ord => {
        if (ord.id === orderId) {
          updatedOrder = {
            ...ord,
            status: 'SAMPLE_COLLECTED' as OrderStatus,
            sampleCollected: true,
            sampleCollectedAt: now,
            sampleCollectedBy: collector
          };
          return updatedOrder;
        }
        return ord;
      });
      pushCurrentStateToCloud({ orders: next });
      return next;
    });
    logActivity('SAMPLE_COLLECTED', `Sample collected for Order #${orderId} by ${collector}`, { orderId, collector });
    if (updatedOrder) {
      syncOrderToGoogleSheets(updatedOrder, updatedOrder.centerCode || selectedCenter.code);
      triggerDebouncedFullBackupToSheets(1000);
    }
  };

  const updateOrder = (orderId: string, updates: Partial<DiagnosticOrder>) => {
    let updatedOrderRecord: DiagnosticOrder | undefined;
    setAllOrders(prev => {
      const next = prev.map(ord => {
        if (ord.id === orderId || ord.invoiceNumber === orderId) {
          const subtotal = updates.tests
            ? updates.tests.reduce((acc, t) => acc + (Number(t.price) || 0), 0)
            : (updates.subtotal !== undefined ? updates.subtotal : ord.subtotal);
          
          const discountPct = updates.discountPct !== undefined ? updates.discountPct : ord.discountPct;
          const discountAmount = updates.discountAmount !== undefined
            ? Math.round(updates.discountAmount)
            : Math.round(subtotal * (discountPct / 100));
          
          const totalAmount = updates.totalAmount !== undefined
            ? Math.round(updates.totalAmount)
            : Math.max(0, subtotal - discountAmount);
          
          const rawPaid = updates.paidAmount !== undefined ? updates.paidAmount : ord.paidAmount;
          const paidAmount = Math.round(Number(rawPaid) || 0);
          const dueAmount = Math.max(0, totalAmount - paidAmount);
          const paymentStatus = dueAmount === 0 ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'DUE';

          const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
          const canEditDoctor = isSuperAdmin || !ord.referringDoctorName;

          const finalReferringDoctorId = canEditDoctor
            ? (updates.referringDoctorId !== undefined ? updates.referringDoctorId : ord.referringDoctorId)
            : ord.referringDoctorId;
          const finalReferringDoctorName = canEditDoctor
            ? (updates.referringDoctorName !== undefined ? updates.referringDoctorName : ord.referringDoctorName)
            : ord.referringDoctorName;
          const finalCommissionBeneficiaryId = canEditDoctor
            ? (updates.commissionBeneficiaryId !== undefined ? updates.commissionBeneficiaryId : ord.commissionBeneficiaryId)
            : ord.commissionBeneficiaryId;
          const finalCommissionBeneficiaryName = canEditDoctor
            ? (updates.commissionBeneficiaryName !== undefined ? updates.commissionBeneficiaryName : ord.commissionBeneficiaryName)
            : ord.commissionBeneficiaryName;

          const resolvedPatient: Patient = updates.patient
            ? {
                ...ord.patient,
                ...updates.patient,
                referringDoctorId: canEditDoctor ? (updates.patient.referringDoctorId ?? ord.patient?.referringDoctorId) : ord.patient?.referringDoctorId,
                referringDoctorName: canEditDoctor ? (updates.patient.referringDoctorName ?? ord.patient?.referringDoctorName) : ord.patient?.referringDoctorName,
                commissionBeneficiaryId: canEditDoctor ? (updates.patient.commissionBeneficiaryId ?? ord.patient?.commissionBeneficiaryId) : ord.patient?.commissionBeneficiaryId,
                commissionBeneficiaryName: canEditDoctor ? (updates.patient.commissionBeneficiaryName ?? ord.patient?.commissionBeneficiaryName) : ord.patient?.commissionBeneficiaryName,
              }
            : ord.patient;

          const effectiveApptDate = updates.appointmentDate
            ? (normalizeToYYYYMMDD(updates.appointmentDate) || updates.appointmentDate)
            : (updates.createdAt ? normalizeToYYYYMMDD(updates.createdAt) : (ord.appointmentDate || normalizeToYYYYMMDD(ord.createdAt)));

          const targetCreatedAt = updates.createdAt
            ? parseDateToISO(updates.createdAt)
            : (updates.appointmentDate
                ? buildSafeISOFromLocalDateAndTime(effectiveApptDate, updates.appointmentTime || ord.appointmentTime, ord.createdAt)
                : ord.createdAt);

          updatedOrderRecord = {
            ...ord,
            ...updates,
            createdAt: targetCreatedAt,
            appointmentDate: effectiveApptDate || ord.appointmentDate,
            referringDoctorId: finalReferringDoctorId,
            referringDoctorName: finalReferringDoctorName,
            commissionBeneficiaryId: finalCommissionBeneficiaryId,
            commissionBeneficiaryName: finalCommissionBeneficiaryName,
            patient: resolvedPatient,
            subtotal,
            discountPct,
            discountAmount,
            totalAmount,
            paidAmount,
            dueAmount,
            paymentStatus,
            syncedToGoogleSheets: false
          };
          (updatedOrderRecord as any).updatedAt = new Date().toISOString();
          dirtyOrderUpdatesRef.current.set(String(updatedOrderRecord.id || '').trim().toLowerCase(), {
            order: updatedOrderRecord,
            timestamp: Date.now()
          });
          dirtyOrderUpdatesRef.current.set(String(updatedOrderRecord.invoiceNumber || '').trim().toLowerCase(), {
            order: updatedOrderRecord,
            timestamp: Date.now()
          });
          return updatedOrderRecord;
        }
        return ord;
      });
      try {
        localStorage.setItem(`${STORAGE_PREFIX}ORDERS`, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      pushCurrentStateToCloud({ orders: next });
      return next;
    });

    if (updatedOrderRecord) {
      logActivity(
        'ORDER_MODIFIED',
        `Admin edited Bill #${updatedOrderRecord.invoiceNumber} for ${updatedOrderRecord.patient.name} (Total: ₹${updatedOrderRecord.totalAmount}, Tests: ${updatedOrderRecord.tests.map(t => t.name).join(', ')})`,
        { orderId, invoiceNumber: updatedOrderRecord.invoiceNumber, updates }
      );
      syncOrderToGoogleSheets(updatedOrderRecord, updatedOrderRecord.centerCode || selectedCenter.code).then(res => {
        if (res.success) {
          setAllOrders(prev => {
            const next = prev.map(o => (o.id === updatedOrderRecord?.id ? { ...o, syncedToGoogleSheets: true } : o));
            try {
              localStorage.setItem(`${STORAGE_PREFIX}ORDERS`, JSON.stringify(next));
            } catch (e) {}
            return next;
          });
        }
      });
      triggerDebouncedFullBackupToSheets(1000);

      // If patient details changed, update patient record in patients state as well
      if (updates.patient && updatedOrderRecord.patientId) {
        setPatients(prev => prev.map(p => p.id === updatedOrderRecord?.patientId ? { ...p, ...updates.patient } : p));
      }
    }
  };

  const [orderBeingEdited, setOrderBeingEdited] = useState<DiagnosticOrder | null>(null);

  const startEditingOrder = React.useCallback((ord: DiagnosticOrder) => {
    setOrderBeingEdited(ord);
  }, []);

  const cancelEditingOrder = React.useCallback(() => {
    setOrderBeingEdited(null);
  }, []);

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setAllOrders(prev => {
      const next = prev.map(ord => {
        if (ord.id === orderId) {
          const mod = {
            ...ord,
            status: newStatus,
            reportReadyAt: (newStatus === 'VERIFIED' || newStatus === 'DISPATCHED') ? (ord.reportReadyAt || new Date().toISOString()) : ord.reportReadyAt,
            dispatchedAt: newStatus === 'DISPATCHED' ? new Date().toISOString() : ord.dispatchedAt
          };
          syncOrderToGoogleSheets(mod, mod.centerCode || selectedCenter.code);
          return mod;
        }
        return ord;
      });
      pushCurrentStateToCloud({ orders: next });
      triggerDebouncedFullBackupToSheets(1000);
      return next;
    });
  };

  const markPaymentReceived = (orderId: string, additionalAmount: number, paymentMode: PaymentMode) => {
    let updatedOrder: DiagnosticOrder | undefined;
    setAllOrders(prev => {
      const next = prev.map(ord => {
        if (ord.id === orderId) {
          const newPaid = ord.paidAmount + additionalAmount;
          const newDue = Math.max(0, ord.totalAmount - newPaid);
          updatedOrder = {
            ...ord,
            paidAmount: newPaid,
            dueAmount: newDue,
            paymentMode,
            paymentStatus: newDue === 0 ? 'PAID' : 'PARTIAL'
          };
          return updatedOrder;
        }
        return ord;
      });
      pushCurrentStateToCloud({ orders: next });
      return next;
    });

    logActivity('PAYMENT_RECEIVED', `Received ₹${additionalAmount} payment (${paymentMode}) for Bill #${updatedOrder?.invoiceNumber || orderId}`, { orderId, additionalAmount, paymentMode });

    if (updatedOrder) {
      syncOrderToGoogleSheets(updatedOrder, updatedOrder.centerCode || selectedCenter.code);
      triggerDebouncedFullBackupToSheets(1000);
    }
  };

  const getReportByOrderId = (orderId: string) => {
    return reports.find(r => r.orderId === orderId);
  };

  const saveReportDraft = (reportData: Partial<DiagnosticReport> & { orderId: string; testId: string }): DiagnosticReport => {
    const existingIndex = reports.findIndex(r => r.orderId === reportData.orderId && r.testId === reportData.testId);
    const order = allOrders.find(o => o.id === reportData.orderId);
    const test = tests.find(t => t.id === reportData.testId);

    const fullReport: DiagnosticReport = {
      id: existingIndex >= 0 ? reports[existingIndex].id : `REP-${Date.now().toString().slice(-6)}`,
      orderId: reportData.orderId,
      testId: reportData.testId,
      testName: test?.name || 'Diagnostic Investigation',
      patientId: order?.patientId || 'ATL-P-000',
      patientName: order?.patient?.name || 'Patient',
      patientAge: order?.patient?.age || 30,
      patientGender: order?.patient?.gender || 'Male',
      category: test?.category || 'Radiology',
      findingsHtml: reportData.findingsHtml || '<p>Report details in progress...</p>',
      impression: reportData.impression || '',
      recommendations: reportData.recommendations || 'Clinical correlation suggested.',
      doctorName: reportData.doctorName || 'Consultant Radiologist',
      doctorSpecialty: reportData.doctorSpecialty || 'Consultant Radiologist / Pathologist',
      doctorRegistrationNo: reportData.doctorRegistrationNo || 'DMC / 48291',
      doctorSignatureUrl: reportData.doctorSignatureUrl,
      doctorSealUrl: reportData.doctorSealUrl,
      status: reportData.status || 'DRAFT',
      authorizedAt: reportData.status === 'AUTHORIZED' ? new Date().toISOString() : undefined,
      attachments: reportData.attachments || [],
      analyzerGenerated: reportData.analyzerGenerated || false
    };

    if (existingIndex >= 0) {
      setReports(prev => {
        const updated = [...prev];
        updated[existingIndex] = fullReport;
        return updated;
      });
    } else {
      setReports(prev => [fullReport, ...prev]);
    }

    logActivity('REPORT_DRAFTED', `Saved clinical report draft for ${fullReport.patientName} (${fullReport.testName})`, {
      orderId: reportData.orderId,
      reportId: fullReport.id
    });

    return fullReport;
  };

  const authorizeReport = (
    reportId: string,
    doctorDetails: { name: string; specialty: string; regNo: string; signatureUrl?: string; sealUrl?: string }
  ) => {
    let affectedOrderId = '';
    setReports(prev => prev.map(rep => {
      if (rep.id === reportId) {
        affectedOrderId = rep.orderId;
        return {
          ...rep,
          status: 'AUTHORIZED',
          authorizedAt: new Date().toISOString(),
          doctorName: doctorDetails.name,
          doctorSpecialty: doctorDetails.specialty,
          doctorRegistrationNo: doctorDetails.regNo,
          doctorSignatureUrl: doctorDetails.signatureUrl || rep.doctorSignatureUrl,
          doctorSealUrl: doctorDetails.sealUrl || rep.doctorSealUrl
        };
      }
      return rep;
    }));

    if (affectedOrderId) {
      updateOrderStatus(affectedOrderId, 'VERIFIED');
    }

    logActivity('REPORT_AUTHORIZED', `Authorized & signed report #${reportId} by ${doctorDetails.name}`, {
      reportId,
      doctorName: doctorDetails.name
    });
  };

  const dispatchReportViaWhatsApp = (orderId: string, patientPhone: string): string => {
    const order = allOrders.find(o => o.id === orderId);
    const rep = reports.find(r => r.orderId === orderId);
    const cleanPhone = patientPhone.replace(/[^0-9]/g, '');
    let phoneWithCountry = cleanPhone;
    if (cleanPhone.length === 10) {
      phoneWithCountry = `91${cleanPhone}`;
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
      phoneWithCountry = `91${cleanPhone.slice(1)}`;
    }

    const message = encodeURIComponent(
      `*ATLAS DIAGNOSTICS CENTER & IMAGING HUB*\n\n` +
      `Dear *${order?.patient.name || 'Patient'}*,\n` +
      `Your diagnostic report for *${rep?.testName || (order?.tests.map(t => t.name).join(', ') || 'Diagnostic Test')}* is now *Ready & Authorized*.\n\n` +
      `• *UHID:* ${order?.patientId}\n` +
      `• *Bill / Sample ID:* ${order?.barcode}\n` +
      `• *Instant Report Download Link:* https://atlas-diagnostics.portal/report/${orderId}\n\n` +
      `For any query, please call: +91 98765 43210.\n` +
      `_Thank you for choosing Atlas Diagnostics Center._`
    );

    const whatsappUrl = `https://wa.me/${phoneWithCountry}?text=${message}`;

    setAllOrders(prev => prev.map(ord => (ord.id === orderId ? { ...ord, whatsappSent: true, status: 'DISPATCHED' } : ord)));
    logActivity('REPORT_DISPATCHED', `Dispatched report for Order #${orderId} (${order?.patient.name}) via WhatsApp to ${phoneWithCountry}`, {
      orderId,
      phone: phoneWithCountry
    });
    return whatsappUrl;
  };

  const dispatchReportViaEmail = (orderId: string) => {
    const order = allOrders.find(o => o.id === orderId);
    setAllOrders(prev => prev.map(ord => (ord.id === orderId ? { ...ord, smsSent: true, status: 'DISPATCHED' } : ord)));
    logActivity('REPORT_DISPATCHED', `Dispatched report for Order #${orderId} (${order?.patient.name}) via Email`, { orderId });
  };

  const addStaff = (employeeData: Omit<StaffEmployee, 'id'>) => {
    const newEmp: StaffEmployee = {
      ...employeeData,
      id: `emp-${Date.now().toString().slice(-4)}`
    };
    setStaff(prev => [newEmp, ...prev]);
    pushCurrentStateToCloud({ staff: [newEmp, ...staff] });
    syncStaffToGoogleSheets(newEmp).catch(() => {});
    triggerDebouncedFullBackupToSheets(1000);
    logActivity('STAFF_ADDED', `Registered employee: ${newEmp.name} (${newEmp.role}) with username: ${newEmp.username || 'auto'}`, {
      staffId: newEmp.id,
      role: newEmp.role
    });
  };

  const deleteStaff = (id: string) => {
    const match = staff.find(s => s.id === id);
    const idsToBlacklist: string[] = [id];
    if (match?.username) idsToBlacklist.push(match.username);
    if (match?.phone) idsToBlacklist.push(match.phone);

    const newDeleted = Array.from(new Set([...deletedStaffIds, ...idsToBlacklist]));
    setDeletedStaffIds(newDeleted);
    try {
      localStorage.setItem(`${STORAGE_PREFIX}DELETED_STAFF_IDS`, JSON.stringify(newDeleted));
    } catch (e) {}

    setStaff(prev => {
      const next = prev.filter(s => !idsToBlacklist.includes(s.id) && (!match?.username || s.username !== match.username));
      try {
        localStorage.setItem(`${STORAGE_PREFIX}STAFF`, JSON.stringify(next));
      } catch (e) {}
      pushCurrentStateToCloud({ staff: next });
      logActivity('STAFF_LOGOUT', `Removed staff member ${match?.name || id}`, { staffId: id });
      return next;
    });

    deleteStaffFromGoogleSheets(id, match?.username, match?.phone, match?.email).catch(() => {});
    triggerDebouncedFullBackupToSheets(500);
  };

  const updateStaffHours = (id: string, hoursToAdd: number) => {
    setStaff(prev => prev.map(emp => {
      if (emp.id === id) {
        const newHours = emp.workedHoursThisMonth + hoursToAdd;
        return {
          ...emp,
          workedHoursThisMonth: newHours,
          totalShiftsCompleted: emp.totalShiftsCompleted + Math.floor(hoursToAdd / 8)
        };
      }
      return emp;
    }));
  };

  const updateStaffStatus = (id: string, status: StaffEmployee['status']) => {
    setStaff(prev => prev.map(emp => (emp.id === id ? { ...emp, status } : emp)));
    triggerDebouncedFullBackupToSheets(1000);
  };

  const updateStaffCredentials = (id: string, updates: Partial<Omit<StaffEmployee, 'id'>>) => {
    const nowIso = new Date().toISOString();
    setStaff(prev => {
      let found = false;
      const updated = prev.map(emp => {
        if (emp.id === id) {
          found = true;
          return {
            ...emp,
            ...updates,
            id, // Ensure ID remains immutable
            updatedAt: nowIso
          };
        }
        return emp;
      });

      // If id didn't match directly, try matching by username or phone
      if (!found) {
        const uTarget = updates.username?.trim().toLowerCase();
        const pTarget = updates.phone ? updates.phone.replace(/[^0-9]/g, '').slice(-10) : '';
        const idx = updated.findIndex(e => {
          if (uTarget && e.username && e.username.trim().toLowerCase() === uTarget) return true;
          if (pTarget && e.phone && e.phone.replace(/[^0-9]/g, '').slice(-10) === pTarget) return true;
          return false;
        });
        if (idx >= 0) {
          found = true;
          updated[idx] = {
            ...updated[idx],
            ...updates,
            updatedAt: nowIso
          };
        }
      }

      // Run deduplication to guarantee zero duplicate / ghost records
      const cleaned = deduplicateAndCleanStaff(updated);
      staffRef.current = cleaned;

      const target = cleaned.find(e => e.id === id) ||
                     (updates.username ? cleaned.find(e => e.username && e.username.toLowerCase() === updates.username!.toLowerCase()) : undefined) ||
                     (updates.name ? cleaned.find(e => e.name && e.name.toLowerCase() === updates.name!.toLowerCase()) : undefined);

      if (target) {
        const nowTs = Date.now();
        if (target.id) dirtyStaffUpdatesRef.current.set(target.id.toLowerCase(), { staff: target, timestamp: nowTs });
        if (target.username) dirtyStaffUpdatesRef.current.set(target.username.toLowerCase(), { staff: target, timestamp: nowTs });
        if (target.phone) {
          const pDigits = target.phone.replace(/[^0-9]/g, '').slice(-10);
          if (pDigits) dirtyStaffUpdatesRef.current.set(pDigits, { staff: target, timestamp: nowTs });
        }
        syncStaffToGoogleSheets(target).catch(() => {});
      }

      try {
        localStorage.setItem(`${STORAGE_PREFIX}STAFF`, JSON.stringify(cleaned));
      } catch (e) {
        console.warn(e);
      }
      pushCurrentStateToCloud({ staff: cleaned });

      // Pass fresh cleaned staff array to backup, avoiding any stale closures
      triggerDebouncedFullBackupToSheets(500, cleaned);
      return cleaned;
    });

    logActivity(
      'STAFF_UPDATED',
      `Updated login credentials & profile for staff member (${updates.name || id})`,
      { staffId: id, updates }
    );
  };

  const forceLogoutStaff = (staffId: string) => {
    const now = new Date().toISOString();
    let staffName = '';
    let centerCode = '';

    setStaff(prev => prev.map(s => {
      if (s.id === staffId) {
        staffName = s.name;
        const center = centers.find(c => c.id === s.assignedCenterId);
        centerCode = center?.code || 'ATL-MAIN';
        return {
          ...s,
          isLoggedIn: false,
          lastLogoutAt: now
        };
      }
      return s;
    }));

    setAttendanceLogs(prev => prev.map(att => {
      if (att.staffId === staffId && att.status === 'ONLINE') {
        const loginTime = new Date(att.loginAt).getTime();
        const logoutTime = new Date(now).getTime();
        const duration = Math.max(1, Math.round((logoutTime - loginTime) / 60000));
        return {
          ...att,
          logoutAt: now,
          durationMinutes: duration,
          status: 'LOGGED_OUT'
        };
      }
      return att;
    }));

    logActivity('STAFF_LOGOUT', `Admin ended session for ${staffName || staffId} (Center: ${centerCode || 'ATL-MAIN'})`, {
      staffId,
      forcedBy: currentUser?.name || 'Super Admin'
    });
  };

  const clearActivities = () => { setActivities([]); try { localStorage.setItem(`${STORAGE_PREFIX}ACTIVITIES`, "[]"); } catch (e) {} };
  const deleteAttendanceLog = (logId: string) => {
    const newDeleted = Array.from(new Set([...deletedAttendanceIds, logId]));
    setDeletedAttendanceIds(newDeleted);
    try {
      localStorage.setItem(`${STORAGE_PREFIX}DELETED_ATTENDANCE_IDS`, JSON.stringify(newDeleted));
    } catch (e) {}

    setAttendanceLogs(prev => {
      const updated = prev.filter(a => a.id !== logId);
      try {
        localStorage.setItem(`${STORAGE_PREFIX}ATTENDANCE`, JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
    logActivity('SYNC_PERFORMED', `Admin deleted attendance record #${logId}`);
    deleteAttendanceFromGoogleSheets(logId).catch(() => {});
    triggerDebouncedFullBackupToSheets(500);
  };

  const addExpense = (expenseData: Omit<OperatingExpense, 'id'>) => {
    const newExp: OperatingExpense = {
      ...expenseData,
      id: `exp-${Date.now().toString().slice(-4)}`,
      syncedToGoogleSheets: false
    };
    setAllExpenses(prev => {
      const next = [newExp, ...prev];
      try {
        localStorage.setItem(`${STORAGE_PREFIX}EXPENSES`, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });
    pushCurrentStateToCloud({ expenses: [newExp, ...allExpenses] });
    logActivity('EXPENSE_LOGGED', `Logged expense voucher ₹${newExp.amount} (${newExp.category} - ${newExp.title} via ${newExp.paymentMode})`, {
      expenseId: newExp.id,
      amount: newExp.amount
    });
    // Live Sync to Google Sheets
    syncExpenseToGoogleSheets(newExp).then(res => {
      if (res.success) {
        setAllExpenses(prev => {
          const next = prev.map(e => (e.id === newExp.id ? { ...e, syncedToGoogleSheets: true } : e));
          try {
            localStorage.setItem(`${STORAGE_PREFIX}EXPENSES`, JSON.stringify(next));
          } catch (e) {}
          return next;
        });
      }
    }).catch(console.warn);
    triggerDebouncedFullBackupToSheets(1000);
  };

  const addTest = (testData: Omit<DiagnosticTestItem, 'id'>) => {
    const newT: DiagnosticTestItem = {
      ...testData,
      id: `t-${Date.now().toString().slice(-4)}`,
      subDepartment: testData.subDepartment || resolveTestSubDepartment(testData)
    };
    setTests(prev => {
      const next = [newT, ...prev];
      try {
        localStorage.setItem(`${STORAGE_PREFIX}TESTS`, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    // Immediately attempt individual test price update and trigger background full catalog sync
    updateTestPriceInGoogleSheets(newT).catch(console.warn);
    syncFullTestCatalogToGoogleSheets([newT, ...tests]).catch(console.warn);
    logActivity('TEST_ADDED', `Added new diagnostic test to catalog: ${newT.name} (₹${newT.price})`, { testId: newT.id });
  };

  const updateTest = (id: string, updates: Partial<DiagnosticTestItem>) => {
    let updatedItem: DiagnosticTestItem | undefined;
    setTests(prev => {
      const next = prev.map(t => {
        if (t.id === id) {
          const merged = { ...t, ...updates };
          updatedItem = {
            ...merged,
            subDepartment: updates.subDepartment || t.subDepartment || resolveTestSubDepartment(merged)
          };
          return updatedItem;
        }
        return t;
      });
      return next;
    });
    if (updatedItem) {
      updateTestPriceInGoogleSheets(updatedItem).catch(console.warn);
    }
    logActivity('TEST_MODIFIED', `Updated catalog test details for test #${id}`, { testId: id, updates });
  };

  const syncCatalogToSheets = async () => {
    const res = await syncFullTestCatalogToGoogleSheets(tests);
    logActivity('SYNC_PERFORMED', `Pushed ${tests.length} tests and price catalog to Google Sheets`);
    return res;
  };

  const reloadCatalogFromSheets = async () => {
    const res = await fetchTestsFromGoogleSheets();
    if (res.success && res.tests && res.tests.length > 0) {
      const liveDelTests = getLiveDeletedTestIds();
      const sanitized = res.tests
        .filter(t => !liveDelTests.has(String(t.id || '').trim().toLowerCase()) && !liveDelTests.has(String(t.code || '').trim().toLowerCase()) && !liveDelTests.has(String(t.name || '').trim().toLowerCase()))
        .map(t => ({
          ...t,
          subDepartment: t.subDepartment || resolveTestSubDepartment(t)
        }));
      setTests(prev => {
        const fetchedIds = new Set(sanitized.map(t => String(t.id || '').trim().toLowerCase()));
        const fetchedCodes = new Set(sanitized.map(t => String(t.code || '').trim().toLowerCase()));
        const fetchedNames = new Set(sanitized.map(t => String(t.name || '').trim().toLowerCase()));
        
        const localOnlyTests = prev.filter(t => {
          const id = String(t.id || '').trim().toLowerCase();
          const code = String(t.code || '').trim().toLowerCase();
          const name = String(t.name || '').trim().toLowerCase();
          const isDeleted = liveDelTests.has(id) || liveDelTests.has(code) || liveDelTests.has(name);
          return !isDeleted && !fetchedIds.has(id) && (!code || !fetchedCodes.has(code)) && (!name || !fetchedNames.has(name));
        });

        return [...localOnlyTests, ...sanitized];
      });
      logActivity('SYNC_PERFORMED', `Reloaded ${sanitized.length} tests and live prices from Google Sheets`);
      return { success: true, message: `Successfully updated ${sanitized.length} tests with live prices from Google Sheets!` };
    }
    return { success: false, message: res.message };
  };

  const deleteTest = (id: string) => {
    const t = tests.find(item => item.id === id || item.code === id);
    const idsToBlacklist: string[] = [id];
    if (t?.code) idsToBlacklist.push(t.code);
    if (t?.name) idsToBlacklist.push(t.name);

    const newDeleted = Array.from(new Set([...deletedTestIds, ...idsToBlacklist]));
    setDeletedTestIds(newDeleted);
    try {
      localStorage.setItem(`${STORAGE_PREFIX}DELETED_TEST_IDS`, JSON.stringify(newDeleted));
    } catch (e) {}

    setTests(prev => {
      const next = prev.filter(item => !idsToBlacklist.includes(item.id) && (!item.code || !idsToBlacklist.includes(item.code)));
      try {
        localStorage.setItem(`${STORAGE_PREFIX}TESTS`, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    logActivity('TEST_DELETED', `Removed test ${t?.name || id} from catalog`, { testId: id });
    deleteTestFromGoogleSheets(id, t?.name, t?.code).catch(() => {});
    triggerDebouncedFullBackupToSheets(500);
  };

  const financialSummary: FinancialSummary = useMemo(() => {
    const activeOrders = orders;
    const activeExpensesList = expenses;

    const grossRevenue = activeOrders.reduce((sum, o) => sum + o.subtotal, 0);
    const discountsGiven = activeOrders.reduce((sum, o) => sum + o.discountAmount, 0);
    const netRevenue = grossRevenue - discountsGiven;
    const collectedAmount = activeOrders.reduce((sum, o) => sum + o.paidAmount, 0);
    const pendingDueAmount = activeOrders.reduce((sum, o) => sum + o.dueAmount, 0);
    const totalRefunds = activeOrders.reduce((sum, o) => sum + (o.refundAmount || 0), 0);

    // Cash and Online breakdown with full split payment support
    const cashIncome = activeOrders.reduce((sum, o) => {
      const split = getOrderPaymentSplit(o);
      const refund = o.refundMode === 'Cash' ? (o.refundAmount || 0) : 0;
      return sum + Math.max(0, split.cash - refund);
    }, 0);

    const onlineIncome = activeOrders.reduce((sum, o) => {
      const split = getOrderPaymentSplit(o);
      const refund = o.refundMode && o.refundMode !== 'Cash' ? (o.refundAmount || 0) : 0;
      return sum + Math.max(0, split.online - refund);
    }, 0);

    const isCenterManager = currentRole === 'CENTER_MANAGER';

    const totalOperatingExpenses = activeExpensesList.reduce((sum, e) => sum + e.amount, 0);

    // Rule: Center Manager cannot see staff salary and payroll
    const totalPayrollExpenses = isCenterManager ? 0 : staff.reduce((sum, emp) => {
      if (currentRole === 'SUPER_ADMIN' || emp.assignedCenterId === selectedCenter.id) {
        return sum + emp.monthlySalary;
      }
      return sum;
    }, 0);

    const totalOutflow = totalOperatingExpenses + totalPayrollExpenses;
    const netProfit = collectedAmount - totalRefunds - totalOutflow;
    const netRealized = Math.max(0, collectedAmount - totalRefunds);
    const profitMarginPct = netRealized > 0 ? Math.round((netProfit / netRealized) * 100 * 10) / 10 : 0;

    return {
      grossRevenue,
      discountsGiven,
      netRevenue,
      collectedAmount,
      cashIncome,
      onlineIncome,
      totalRefunds,
      pendingDueAmount,
      totalOperatingExpenses,
      totalPayrollExpenses,
      totalOutflow,
      netProfit,
      profitMarginPct
    };
  }, [orders, expenses, staff, currentRole, selectedCenter]);

  const resetAllData = () => {
    localStorage.clear();
    setTests(INITIAL_TESTS);
    setReferrers([]);
    setPatients([]);
    setAllOrders([]);
    setReports([]);
    setStaff(CLEAN_STAFF);
    setAllExpenses([]);
    setCenters(INITIAL_CENTERS);
    setActivities([]);
    setAttendanceLogs([]);
    setDoctorRoster([]);
    pullOrdersFromGoogleSheets(true).catch(() => {});
  };

  return (
    <DiagnosticContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        login,
        logout,
        currentRole,
        setCurrentRole,
        currentStaffId,
        setCurrentStaffId,
        currentStaff,
        selectedCenter,
        setSelectedCenter,
        centers,
        addCenter,
        isCenterLocked,
        tests,
        addTest,
        updateTest,
        deleteTest,
        syncCatalogToSheets,
        reloadCatalogFromSheets,
        referrers,
        pendingReferrers,
        approvedReferrers,
        addReferringDoctor,
        approveReferringDoctor,
        updateReferringDoctor,
        rejectReferringDoctor,
        deleteReferringDoctor,
        updateDoctorCommission,
        recordDoctorPayout,
        sendWelcomeDoctorWhatsApp,
        doctorRoster,
        addDoctorToRoster,
        updateDoctorRoster,
        deleteDoctorFromRoster,
        getDoctorWhatsAppUrl,
        patients: activePatients,
        allPatients: patients,
        deletedPatientIds,
        registerPatient,
        updatePatient,
        deletePatient,
        sendWelcomePatientWhatsApp,
        orders,
        allOrders,
        purgeDuplicateOrders,
        createOrder,
        updateOrder,
        orderBeingEdited,
        startEditingOrder,
        cancelEditingOrder,
        updateOrderStatus,
        markSampleCollected,
        markPaymentReceived,
        processOrderRefund,
        pendingDeletions,
        requestDeleteOrder,
        approveDeleteOrder,
        rejectDeleteOrder,
        requestDeletePatient,
        approveDeletePatient,
        rejectDeletePatient,
        requestDeleteExpense,
        approveDeleteExpense,
        rejectDeleteExpense,
        requestDeleteAppointment,
        approveDeleteAppointment,
        rejectDeleteAppointment,
        appointments,
        allAppointments,
        addAppointment,
        updateAppointment,
        updateAppointmentStatus,
        deleteAppointment,
        reports,
        getReportByOrderId,
        saveReportDraft,
        authorizeReport,
        dispatchReportViaWhatsApp,
        dispatchReportViaEmail,
        staff,
        addStaff,
        deleteStaff,
        updateStaffHours,
        updateStaffStatus,
        updateStaffCredentials,
        sendWelcomeStaffWhatsApp,
        forceLogoutStaff,
        deleteAttendanceLog,
        activities,
        logActivity, clearActivities,
        attendanceLogs,
        expenses,
        allExpenses,
        addExpense,
        financialSummary,
        googleSheetsConfig,
        updateGoogleSheetsUrl,
        activePatientUHID,
        setActivePatientUHID,
        activeReferrerId,
        setActiveReferrerId,
        activeReportToView,
        setActiveReportToView,
        resetAllData,
        isOnline,
        unsyncedOrdersCount,
        syncOfflineQueue,
        pullOrdersFromGoogleSheets,
        lastCloudSyncTime,
        cloudSyncStatus,
        syncWithGlobalCloud,
        pushCurrentStateToCloud,
        triggerFullTwoWaySync,
        triggerDebouncedFullBackupToSheets
      }}
    >
      {children}
    </DiagnosticContext.Provider>
  );
};

export const useDiagnostic = () => {
  const context = useContext(DiagnosticContext);
  if (!context) {
    throw new Error('useDiagnostic must be used within a DiagnosticProvider');
  }
  return context;
};
