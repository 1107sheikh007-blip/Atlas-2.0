import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  getOrderPaymentSplit
} from '../../utils/dateUtils';
import {
  Crown,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  UserCheck,
  Award,
  Receipt,
  Building2,
  Zap,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  Sliders,
  ChevronRight,
  PieChart,
  ShieldCheck,
  Sparkles,
  Wallet,
  ArrowLeft,
  AlertCircle,
  FileSpreadsheet,
  MapPin,
  Phone,
  Lock,
  Trash2,
  RotateCcw,
  ShieldAlert,
  FileText,
  X,
  Activity as ActivityIcon,
  Search,
  Filter,
  Calendar,
  Edit3,
  Upload,
  Image as ImageIcon,
  Check,
  Send,
  Share2,
  Key,
  Eye,
  LogOut,
  AlertTriangle,
  Timer,
  UserX,
  UploadCloud,
  DownloadCloud,
  Wifi,
  WifiOff,
  QrCode,
  CreditCard,
  Banknote,
  Printer,
  Download,
  Loader2,
  RefreshCw,
  UserPlus
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { printElement } from '../../utils/printUtility';
import { useDiagnostic } from '../../context/DiagnosticContext';
import {
  ReferringDoctor,
  StaffEmployee,
  OperatingExpense,
  DiagnosticTestItem,
  DiagnosticCategory,
  TestSampleType,
  DiagnosticOrder,
  PaymentMode,
  OrderStatus,
  PatientAppointment,
  AppointmentStatus
} from '../../types';
import { GoogleSheetsModal } from '../common/GoogleSheetsModal';
import { InvoiceReceiptModal } from '../common/InvoiceReceiptModal';
import { ReportPrintView } from '../common/ReportPrintView';
import { SearchableSelect } from '../common/SearchableSelect';
import { DateRangeFilter, DatePresetType, isDateInSelectedRange, computePresetDates } from '../common/DateRangeFilter';
import { ReceptionPortal } from '../reception/ReceptionPortal';
import { EditPatientModal } from '../patient/EditPatientModal';
import { Patient } from '../../types';
import { resolveTestSubDepartment } from '../../data/initialData';
import { DoctorRosterTab } from './DoctorRosterTab';

export function parseCleanTime(val?: string, isEnd = false, fallback = '09:00 AM'): string {
  if (!val) return fallback;
  const cleaned = String(val).trim();
  const rangeMatch = cleaned.match(/(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)\s*[-–]\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)/i);
  if (rangeMatch) {
    const time = isEnd ? rangeMatch[2].trim() : rangeMatch[1].trim();
    return time.includes(':') ? time : `${time}:00`;
  }
  const singleMatch = cleaned.match(/(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)/i);
  if (singleMatch) {
    const time = singleMatch[1].trim();
    return time.includes(':') ? time : `${time}:00`;
  }
  return cleaned.replace(/^Custom\s*\(?/i, '').replace(/\)?$/i, '').trim() || fallback;
}

export function calculateWorkingHours(shift?: string, startTime?: string, endTime?: string): string {
  if (!shift && !startTime && !endTime) return '8 hrs';

  const sStr = String(shift || '');
  if (sStr.includes('24/7') || sStr.toLowerCase().includes('all hours')) return '24 hrs';

  let start = startTime ? parseCleanTime(startTime, false, '') : '';
  let end = endTime ? parseCleanTime(endTime, true, '') : '';

  if (!start || !end) {
    const match = sStr.match(/(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)\s*[-–]\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)/i);
    if (match) {
      if (!start) start = match[1].trim();
      if (!end) end = match[2].trim();
    }
  }

  const parseToMinutes = (timeStr: string): number | null => {
    if (!timeStr) return null;
    const match = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM|am|pm)?/i);
    if (!match) return null;
    let hours = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    const modifier = match[3] ? match[3].toUpperCase() : null;

    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    return hours * 60 + minutes;
  };

  const startMin = parseToMinutes(start);
  const endMin = parseToMinutes(end);

  if (startMin !== null && endMin !== null) {
    let diff = endMin - startMin;
    if (diff <= 0) diff += 1440;
    const hours = diff / 60;
    return Number.isInteger(hours) ? `${hours} hrs` : `${hours.toFixed(1)} hrs`;
  }

  if (sStr.includes('Morning')) return '8 hrs';
  if (sStr.includes('Evening')) return '8 hrs';
  if (sStr.includes('Night')) return '8 hrs';
  if (sStr.includes('General')) return '9 hrs';

  return '8 hrs';
}

export const AdminDashboard: React.FC = () => {
  const {
    referrers,
    pendingReferrers,
    approvedReferrers,
    doctorRoster,
    approveReferringDoctor,
    rejectReferringDoctor,
    deleteReferringDoctor,
    updateReferringDoctor,
    updateDoctorCommission,
    recordDoctorPayout,
    sendWelcomeDoctorWhatsApp,
    addReferringDoctor,
    staff,
    addStaff,
    updateStaffHours,
    updateStaffStatus,
    updateStaffCredentials,
    sendWelcomeStaffWhatsApp,
    forceLogoutStaff,
    deleteAttendanceLog,
    activities,
    attendanceLogs,
    tests,
    addTest,
    updateTest,
    deleteTest,
    syncCatalogToSheets,
    reloadCatalogFromSheets,
    expenses,
    patients,
    updatePatient,
    allExpenses,
    allOrders,
    addExpense,
    financialSummary,
    selectedCenter,
    setSelectedCenter,
    centers,
    addCenter,
    googleSheetsConfig,
    pendingDeletions,
    approveDeleteOrder,
    rejectDeleteOrder,
    approveDeletePatient,
    rejectDeletePatient,
    approveDeleteExpense,
    rejectDeleteExpense,
    approveDeleteAppointment,
    rejectDeleteAppointment,
    getReportByOrderId,
    dispatchReportViaWhatsApp,
    requestDeleteOrder,
    processOrderRefund,
    markPaymentReceived,
    updateOrder,
    startEditingOrder,
    isOnline,
    unsyncedOrdersCount,
    syncOfflineQueue,
    pullOrdersFromGoogleSheets,
    purgeDuplicateOrders,
    appointments,
    updateAppointment,
    updateAppointmentStatus,
    deleteAppointment,
    currentRole,
    setCurrentRole,
    currentUser, deleteStaff, clearActivities } = useDiagnostic();

  const isSuperAdmin = currentRole === 'SUPER_ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  const handleSavePatientEdits = (updatedData: Partial<Patient>) => {
    if (!selectedPatientForEdit) return;
    updatePatient(selectedPatientForEdit.id, updatedData);
    setSelectedPatientForEdit(null);
  };


  const [isSyncingRadar, setIsSyncingRadar] = useState(false);

  // Active Admin Sub-tab
  const [activeTab, setActiveTab] = useState<
    'DASHBOARD' | 'ALL_ORDERS' | 'DOCTOR_ROSTER' | 'REFERRAL_LEADERBOARD' | 'TEST_CATALOG' | 'ATTENDANCE' | 'PAYROLL' | 'DELETION_APPROVALS' | 'EXPENSES' | 'BRANCHES' | 'ACTIVITY_LOG' | 'MIS_OVERVIEW'
  >('DASHBOARD');

  // Patient Orders view switcher: View Orders Ledger vs Register New Patient Order
  const [adminOrdersViewMode, setAdminOrdersViewMode] = useState<'LEDGER' | 'NEW_ORDER'>('LEDGER');

  // Interactive Dashboard Drill-down Modal States
  const [isFinancialDrilldownOpen, setIsFinancialDrilldownOpen] = useState(false);
  const [isStaffAttendanceDrilldownOpen, setIsStaffAttendanceDrilldownOpen] = useState(false);
  const [selectedDrilldownStaff, setSelectedDrilldownStaff] = useState<StaffEmployee | null>(null);
  const [isOrdersDrilldownOpen, setIsOrdersDrilldownOpen] = useState(false);
  const [ordersDrilldownSearch, setOrdersDrilldownSearch] = useState('');

  // Edit Scheduled Appointment Modal in Admin
  const [editingAdminAppointment, setEditingAdminAppointment] = useState<PatientAppointment | null>(null);
  const [editAdminAptName, setEditAdminAptName] = useState('');
  const [editAdminAptPhone, setEditAdminAptPhone] = useState('');
  const [editAdminAptAge, setEditAdminAptAge] = useState<number | ''>('');
  const [editAdminAptGender, setEditAdminAptGender] = useState('Male');
  const [editAdminAptDate, setEditAdminAptDate] = useState('');
  const [editAdminAptTime, setEditAdminAptTime] = useState('');
  const [editAdminAptDoctor, setEditAdminAptDoctor] = useState('');
  const [editAdminAptNotes, setEditAdminAptNotes] = useState('');
  const [editAdminAptStatus, setEditAdminAptStatus] = useState<AppointmentStatus>('SCHEDULED');

  // Custom commission % map per order/report (dynamic, no default hardcoded percentage)
  const [customCommissionMap, setCustomCommissionMap] = useState<Record<string, number>>({});

  // Sub-department filter for Diagnostic Test Catalog
  const [testSubDepartmentFilter, setTestSubDepartmentFilter] = useState<string>('ALL');

  // Edit Staff Credentials & Permissions Modal State
  const [editingStaff, setEditingStaff] = useState<StaffEmployee | null>(null);
  const [editStaffName, setEditStaffName] = useState('');
  const [editStaffRole, setEditStaffRole] = useState<StaffEmployee['role']>('Receptionist');
  const [editStaffCenterId, setEditStaffCenterId] = useState('cnt-01');
  const [editStaffShift, setEditStaffShift] = useState<string>('Morning (8:00 AM - 4:00 PM)');
  const [editStaffShiftCustom, setEditStaffShiftCustom] = useState(false);
  const [editStaffShiftStart, setEditStaffShiftStart] = useState('08:00 AM');
  const [editStaffShiftEnd, setEditStaffShiftEnd] = useState('04:00 PM');
  const [editStaffSalary, setEditStaffSalary] = useState<number | ''>(35000);
  const [editStaffUsername, setEditStaffUsername] = useState('');
  const [editStaffPassword, setEditStaffPassword] = useState('');
  const [editStaffPhone, setEditStaffPhone] = useState('');
  const [editStaffEmail, setEditStaffEmail] = useState('');
  const [editStaffPermissions, setEditStaffPermissions] = useState<NonNullable<StaffEmployee['permissions']>>({
    canCreateInvoices: true,
    canCollectPayments: true,
    canProcessRefunds: false,
    canEditCatalog: false,
    canViewMISReports: false,
    canApproveDeletions: false,
    canManageStaff: false,
    canManageReferrals: true,
    canAccessAppointments: true,
    canAuthorizeReports: false
  });

  // Guard: Center Managers cannot access restricted tabs (Staff Credentials, Doctor Approvals, Referral & Affiliation, Center Branches)
  useEffect(() => {
    if (!isSuperAdmin) {
      if (['PAYROLL', 'REFERRAL_LEADERBOARD', 'BRANCHES'].includes(activeTab)) {
        setActiveTab('DASHBOARD');
      }
    }
  }, [isSuperAdmin, activeTab]);

  const [isGSheetsModalOpen, setIsGSheetsModalOpen] = useState(false);

  // Dashboard Analytics Date Range Filter
  const [dashboardDateRange, setDashboardDateRange] = useState<DatePresetType>('ALL');
  const [dashboardStartDate, setDashboardStartDate] = useState<string>('');
  const [dashboardEndDate, setDashboardEndDate] = useState<string>('');

  // Financial MIS Overview Date Range & Branch Filters
  const [misDateRange, setMisDateRange] = useState<DatePresetType>('ALL');
  const [misStartDate, setMisStartDate] = useState<string>('');
  const [misEndDate, setMisEndDate] = useState<string>('');
  const [misCenterFilter, setMisCenterFilter] = useState<string>('ALL');

  // Orders Tab Filters & Modals
  const [orderSearch, setOrderSearch] = useState('');
  const [orderCenterFilter, setOrderCenterFilter] = useState('ALL');
  const [orderDateRange, setOrderDateRange] = useState<DatePresetType>('ALL');
  const [orderStartDate, setOrderStartDate] = useState<string>('');
  const [orderEndDate, setOrderEndDate] = useState<string>('');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState<'ALL' | 'PAID' | 'DUE'>('ALL');
  const [invoiceModalOrder, setInvoiceModalOrder] = useState<DiagnosticOrder | null>(null);
  const [reportPrintModalOrder, setReportPrintModalOrder] = useState<DiagnosticOrder | null>(null);

  // Add Center Branch Modal State
  const [isAddCenterModalOpen, setIsAddCenterModalOpen] = useState(false);
  const [centerName, setCenterName] = useState('');
  const [centerCode, setCenterCode] = useState('');
  const [centerAddress, setCenterAddress] = useState('');
  const [centerPhone, setCenterPhone] = useState('');
  const [centerIsMain, setCenterIsMain] = useState(false);

  // Approving & Editing Doctor State Modal & Editable Fields (Super Admin)
  const [approvingDoctor, setApprovingDoctor] = useState<ReferringDoctor | null>(null);
  const [isRegisterPartnerModalOpen, setIsRegisterPartnerModalOpen] = useState(false);
  const [newPartnerName, setNewPartnerName] = useState('');
  const [newPartnerSpecialty, setNewPartnerSpecialty] = useState('');
  const [newPartnerQualification, setNewPartnerQualification] = useState('');
  const [newPartnerHospital, setNewPartnerHospital] = useState('');
  const [newPartnerAffiliationType, setNewPartnerAffiliationType] = useState<'SELF' | 'ORGANIZATION'>('SELF');
  const [newPartnerOrgName, setNewPartnerOrgName] = useState('');
  const [newPartnerPhone, setNewPartnerPhone] = useState('');
  const [newPartnerEmail, setNewPartnerEmail] = useState('');
  const [newPartnerRegNo, setNewPartnerRegNo] = useState('');
  const [newPartnerNotes, setNewPartnerNotes] = useState('');
  const [editingApprovedDoctor, setEditingApprovedDoctor] = useState<ReferringDoctor | null>(null);
  const [editApproveName, setEditApproveName] = useState('');
  const [editApproveSpecialty, setEditApproveSpecialty] = useState('');
  const [editApproveQualification, setEditApproveQualification] = useState('');
  const [editApproveHospital, setEditApproveHospital] = useState('');
  const [editApproveAffiliationType, setEditApproveAffiliationType] = useState<'SELF' | 'ORGANIZATION'>('SELF');
  const [editApproveOrgName, setEditApproveOrgName] = useState('');
  const [editApprovePhone, setEditApprovePhone] = useState('');
  const [editApproveEmail, setEditApproveEmail] = useState('');
  const [editApproveRegNo, setEditApproveRegNo] = useState('');
  const [editApproveNotes, setEditApproveNotes] = useState('');

  // Admin Order Return & Refund Modal State
  const [adminRefundModalOrder, setAdminRefundModalOrder] = useState<DiagnosticOrder | null>(null);
  const [adminRefundAmount, setAdminRefundAmount] = useState<number | ''>('');
  const [adminRefundMode, setAdminRefundMode] = useState<PaymentMode>('Cash');
  const [adminRefundReason, setAdminRefundReason] = useState<string>('');

  // Referrals & Affiliations MIS Search Engine & Filter State
  const [referralDoctorFilter, setReferralDoctorFilter] = useState<string>('ALL');
  const [referralBeneficiaryFilter, setReferralBeneficiaryFilter] = useState<string>('ALL');
  const [referralViewMode, setReferralViewMode] = useState<'MIS_SEARCH' | 'PARTNER_SUMMARY' | 'PENDING_APPROVALS'>('PARTNER_SUMMARY');
  const [misViewMode, setMisViewMode] = useState<'ORDER' | 'TEST'>('ORDER');
  const [isPrintMISModalOpen, setIsPrintMISModalOpen] = useState(false);
  const [isGeneratingMISPdf, setIsGeneratingMISPdf] = useState(false);

  // Edit Commission Modal
  const [editingDoctor, setEditingDoctor] = useState<ReferringDoctor | null>(null);
  const [newCommissionRate, setNewCommissionRate] = useState<number>(15);

  // Record Payout Modal
  const [payoutDoctor, setPayoutDoctor] = useState<ReferringDoctor | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);

  // Add & Filter Expense Modal
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState<OperatingExpense['category']>('Electricity & Utilities');
  const [expAmount, setExpAmount] = useState<number | ''>('');
  const [expPaidTo, setExpPaidTo] = useState('');
  const [expMode, setExpMode] = useState<OperatingExpense['paymentMode']>('Cash');
  const [expCenterId, setExpCenterId] = useState<string>(centers[0]?.id || 'cnt-01');
  const [expReceiptNo, setExpReceiptNo] = useState('');
  const [expSearch, setExpSearch] = useState('');
  const [expCategoryFilter, setExpCategoryFilter] = useState<string>('ALL');
  const [expPaymentModeFilter, setExpPaymentModeFilter] = useState<string>('ALL');
  const [expDateRange, setExpDateRange] = useState<DatePresetType>('ALL');
  const [expStartDate, setExpStartDate] = useState<string>('');
  const [expEndDate, setExpEndDate] = useState<string>('');

  // Add Staff Modal with Credentials & Signature/Seal upload
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState<StaffEmployee['role']>('Receptionist');
  const [staffCenterId, setStaffCenterId] = useState<string>(centers[0]?.id || 'cnt-01');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('Atlas@123');
  const [staffShift, setStaffShift] = useState<string>('Morning (8:00 AM - 4:00 PM)');
  const [staffShiftCustom, setStaffShiftCustom] = useState(false);
  const [staffShiftStart, setStaffShiftStart] = useState('08:00 AM');
  const [staffShiftEnd, setStaffShiftEnd] = useState('04:00 PM');
  const [staffSalary, setStaffSalary] = useState<number | ''>(35000);
  const [staffSignatureUrl, setStaffSignatureUrl] = useState('');
  const [staffSealUrl, setStaffSealUrl] = useState('');
  const [staffRegNo, setStaffRegNo] = useState('');

  // Add & Edit Test Catalog Modal
  const [isAddTestModalOpen, setIsAddTestModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<DiagnosticTestItem | null>(null);
  const [testCode, setTestCode] = useState('');
  const [testName, setTestName] = useState('');
  const [testCategory, setTestCategory] = useState<DiagnosticCategory>('Pathology');
  const [testDepartment, setTestDepartment] = useState('Biochemistry');
  const [testSampleType, setTestSampleType] = useState<TestSampleType>('Tube (EDTA)');
  const [testPrice, setTestPrice] = useState<number | ''>(500);
  const [testTatHours, setTestTatHours] = useState<number | ''>(4);
  const [testSearch, setTestSearch] = useState('');
  const [testCategoryFilter, setTestCategoryFilter] = useState<string>('ALL');
  const [isPushingRates, setIsPushingRates] = useState(false);
  const [isPullingRates, setIsPullingRates] = useState(false);
  const [rateSyncMessage, setRateSyncMessage] = useState<string | null>(null);

  // Activity Log Search & Filters (Role, Staff Employee, Start Date & End Date, Action Type)
  const [activitySearch, setActivitySearch] = useState('');
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('ALL');
  const [activityRoleFilter, setActivityRoleFilter] = useState<string>('ALL');
  const [activityStaffFilter, setActivityStaffFilter] = useState<string>('ALL');
  const [activityDateRange, setActivityDateRange] = useState<DatePresetType>('ALL');
  const [activityStartDate, setActivityStartDate] = useState<string>('');
  const [activityEndDate, setActivityEndDate] = useState<string>('');

  // Referral Filter by Date Range & Affiliation
  const [referralDateRange, setReferralDateRange] = useState<DatePresetType>('ALL');
  const [referralStartDate, setReferralStartDate] = useState('');
  const [referralEndDate, setReferralEndDate] = useState('');
  const [referralAffiliationFilter, setReferralAffiliationFilter] = useState<'ALL' | 'SELF' | 'ORGANIZATION'>('ALL');
  const [referralSearch, setReferralSearch] = useState('');
  const [directoryDocSearch, setDirectoryDocSearch] = useState('');

  // Log Hours Modal
  const [loggingHoursStaff, setLoggingHoursStaff] = useState<StaffEmployee | null>(null);
  const [hoursToAdd, setHoursToAdd] = useState<number>(8);

  // Staff Attendance Hub Filters & View States
  const [attSearch, setAttSearch] = useState('');
  const [attCenterFilter, setAttCenterFilter] = useState('ALL');
  const [attRoleFilter, setAttRoleFilter] = useState('ALL');
  const [attStatusFilter, setAttStatusFilter] = useState<'ALL' | 'ONLINE_ONLY' | 'OVERTIME_ONLY'>('ALL');
  const [attLogDateFilter, setAttLogDateFilter] = useState<DatePresetType>('ALL');
  const [attLogStartDate, setAttLogStartDate] = useState<string>('');
  const [attLogEndDate, setAttLogEndDate] = useState<string>('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSyncRadar = async () => {
    setIsSyncingRadar(true);
    const { syncedCount, failedCount } = await syncOfflineQueue();
    setIsSyncingRadar(false);
    if (failedCount === 0) {
      showToast(`Successfully synchronized ${syncedCount} queued orders to Google Sheets!`);
    } else {
      showToast(`Synced ${syncedCount} orders, ${failedCount} failed to sync.`);
    }
  };

  const [isPullingOrders, setIsPullingOrders] = useState(false);
  const [referredOrdersModalDoc, setReferredOrdersModalDoc] = useState<ReferringDoctor | null>(null);

  const handlePullOrders = async () => {
    setIsPullingOrders(true);
    const res = await pullOrdersFromGoogleSheets(true);
    setIsPullingOrders(false);
    showToast(res.message);
  };

  // Due balance collection modal state
  const [adminDueCollectOrder, setAdminDueCollectOrder] = useState<DiagnosticOrder | null>(null);
  const [adminCollectAmount, setAdminCollectAmount] = useState<number>(0);
  const [adminCollectMode, setAdminCollectMode] = useState<PaymentMode>('Cash');

  const handleAdminCollectDueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminDueCollectOrder) return;
    const num = Number(adminCollectAmount);
    if (isNaN(num) || num <= 0 || num > adminDueCollectOrder.dueAmount) {
      showToast(`Please enter a valid collection amount up to ₹${adminDueCollectOrder.dueAmount.toLocaleString()}`);
      return;
    }
    markPaymentReceived(adminDueCollectOrder.id, num, adminCollectMode);
    showToast(`Collected ₹${num.toLocaleString()} payment (${adminCollectMode}) for Bill #${adminDueCollectOrder.invoiceNumber}`);
    setAdminDueCollectOrder(null);
    setAdminCollectAmount(0);
  };

  // Super Admin Edit Invoice & Patient Order Modal State
  const [editingInvoiceOrder, setEditingInvoiceOrder] = useState<DiagnosticOrder | null>(null);
  const [editPatientName, setEditPatientName] = useState('');
  const [selectedPatientForEdit, setSelectedPatientForEdit] = useState<Patient | null>(null);
  const [editPatientAge, setEditPatientAge] = useState(30);
  const [editPatientGender, setEditPatientGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [editPatientPhone, setEditPatientPhone] = useState('');
  const [editPatientAddress, setEditPatientAddress] = useState('');
  const [editDoctorId, setEditDoctorId] = useState('');
  const [editDoctorName, setEditDoctorName] = useState('');
  const [editBeneficiaryId, setEditBeneficiaryId] = useState('');
  const [editBeneficiaryName, setEditBeneficiaryName] = useState('');
  const [editSelectedTests, setEditSelectedTests] = useState<DiagnosticTestItem[]>([]);
  const [editTestSearch, setEditTestSearch] = useState('');
  const [editDiscountPct, setEditDiscountPct] = useState(0);
  const [editDiscountReason, setEditDiscountReason] = useState('');
  const [editPaidAmount, setEditPaidAmount] = useState(0);
  const [editPaymentMode, setEditPaymentMode] = useState<PaymentMode>('Cash');
  const [editOrderStatus, setEditOrderStatus] = useState<OrderStatus>('ORDER_PLACED');
  const [editNotes, setEditNotes] = useState('');
  const [editOrderDate, setEditOrderDate] = useState('');
  const [editOrderTime, setEditOrderTime] = useState('');

  const openEditInvoiceModal = (ord: DiagnosticOrder) => {
    setEditingInvoiceOrder(ord);
    setEditPatientName(ord.patient.name);
    setEditPatientAge(ord.patient.age || 30);
    setEditPatientGender(ord.patient.gender || 'Male');
    setEditPatientPhone(ord.patient.phone || '');
    setEditPatientAddress(ord.patient.address || '');
    setEditDoctorId(ord.referringDoctorId || '');
    setEditDoctorName(ord.referringDoctorName || 'Direct / Walk-in');
    setEditBeneficiaryId(ord.commissionBeneficiaryId || '');
    setEditBeneficiaryName(ord.commissionBeneficiaryName || '');
    setEditSelectedTests(ord.tests || []);
    setEditTestSearch('');
    setEditDiscountPct(ord.discountPct || 0);
    const admDiscVal = Number(ord.discountAmount) || 0;
    const fallbackAdmReason = admDiscVal > 0
      ? (ord.patientStatusRemark && ord.patientStatusRemark.trim()
          ? (ord.patientStatusRemark.toLowerCase().includes('concession') || ord.patientStatusRemark.toLowerCase().includes('discount')
              ? ord.patientStatusRemark.trim()
              : ord.patientStatusRemark.trim() + ' concession')
          : (ord.referringDoctorName ? ord.referringDoctorName + ' concession' : 'Doctor reference concession'))
      : '';
    setEditDiscountReason(ord.discountReason?.trim() || ord.notes?.trim() || fallbackAdmReason);
    setEditPaidAmount(ord.paidAmount || 0);
    setEditPaymentMode(ord.paymentMode || 'Cash');
    setEditOrderStatus(ord.status || 'ORDER_PLACED');
    setEditNotes(ord.notes || '');

    // Initialize entry date and time
    const initialDate = normalizeToYYYYMMDD(ord.appointmentDate || ord.createdAt) || getLocalYYYYMMDD();
    setEditOrderDate(initialDate);
    const parsedOrdDate = parseSafeDate(ord.createdAt);
    const fallback24Time = `${String(parsedOrdDate.getHours()).padStart(2, '0')}:${String(parsedOrdDate.getMinutes()).padStart(2, '0')}`;
    const initialTime = ord.appointmentTime ? convert12To24HourTime(ord.appointmentTime) : fallback24Time;
    setEditOrderTime(initialTime);
  };

  const filteredCatalogTestsForEdit = useMemo(() => {
    if (!editTestSearch.trim()) return [];
    const q = editTestSearch.toLowerCase();
    return tests
      .filter(t =>
        t.name.toLowerCase().includes(q) ||
        (t.code && t.code.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q)) ||
        (t.department && t.department.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [tests, editTestSearch]);

  const handleSaveEditedInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoiceOrder) return;
    if (!editPatientName.trim()) {
      showToast('Patient name is required.');
      return;
    }
    if (editSelectedTests.length === 0) {
      showToast('Please select at least one diagnostic test.');
      return;
    }

    const subtotal = editSelectedTests.reduce((sum, t) => sum + (Number(t.price) || 0), 0);
    const safeDiscountPct = Math.min(100, Math.max(0, Number(editDiscountPct) || 0));
    const discountAmount = Math.round(subtotal * (safeDiscountPct / 100));
    const totalAmount = Math.max(0, subtotal - discountAmount);
    const paidAmount = Math.min(totalAmount, Math.max(0, Number(editPaidAmount) || 0));
    const dueAmount = Math.max(0, totalAmount - paidAmount);
    const paymentStatus = dueAmount === 0 ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'DUE';

    // Compute updated date and timestamp safely in local time so it never shifts by 1 day
    const cleanDate = editOrderDate
      ? (normalizeToYYYYMMDD(editOrderDate) || editOrderDate)
      : (normalizeToYYYYMMDD(editingInvoiceOrder.appointmentDate || editingInvoiceOrder.createdAt) || getLocalYYYYMMDD());
    const cleanTime = editOrderTime.trim() || (editingInvoiceOrder.appointmentTime || '10:00');
    const updatedCreatedAt = buildSafeISOFromLocalDateAndTime(cleanDate, cleanTime, editingInvoiceOrder.createdAt);

    updateOrder(editingInvoiceOrder.id, {
      patient: {
        ...editingInvoiceOrder.patient,
        name: editPatientName.trim(),
        age: editPatientAge,
        gender: editPatientGender,
        phone: editPatientPhone.trim(),
        address: editPatientAddress.trim()
      },
      createdAt: updatedCreatedAt,
      appointmentDate: cleanDate,
      appointmentTime: cleanTime,
      referringDoctorId: editDoctorId || undefined,
      referringDoctorName: editDoctorName || 'Direct / Walk-in',
      commissionBeneficiaryId: editBeneficiaryId || editDoctorId || undefined,
      commissionBeneficiaryName: editBeneficiaryName || editDoctorName || 'Direct / Walk-in',
      tests: editSelectedTests,
      subtotal,
      discountPct: safeDiscountPct,
      discountAmount,
      discountReason: discountAmount > 0 ? (editDiscountReason.trim() || 'Admin adjusted concession') : undefined,
      totalAmount,
      paidAmount,
      dueAmount,
      paymentMode: editPaymentMode,
      paymentStatus,
      status: editOrderStatus,
      notes: editNotes.trim() || undefined
    });

    showToast(`Invoice #${editingInvoiceOrder.invoiceNumber} updated successfully!`);
    setEditingInvoiceOrder(null);
  };

  // Derived Staff Attendance & Shift Adherence Data
  const staffAttendanceCalculations = useMemo(() => {
    return staff.map(emp => {
      const empCenter = centers.find(c => c.id === emp.assignedCenterId) || centers[0];
      const isCurrentUser = currentUser?.staffId === emp.id || (currentUser?.username && emp.username && currentUser.username.toLowerCase() === emp.username.toLowerCase());
      const matchingLog = attendanceLogs.find(a => (a.staffId === emp.id || (currentUser?.staffId === emp.id && a.status === 'ONLINE')) && a.status === 'ONLINE');
      const isOnline = !!emp.isLoggedIn || isCurrentUser || !!matchingLog;
      const loginTimestamp = emp.lastLoginAt || matchingLog?.loginAt || (isCurrentUser ? new Date().toISOString() : undefined);
      
      const quotaHours = 8; // Standard 8 hours per shift
      const quotaMinutes = quotaHours * 60; // 480 mins
      
      let elapsedMinutes = 0;
      if (isOnline && loginTimestamp) {
        const loginMs = new Date(loginTimestamp).getTime();
        const nowMs = Date.now();
        elapsedMinutes = Math.max(0, Math.floor((nowMs - loginMs) / 60000));
      }
      
      const elapsedHours = Math.floor(elapsedMinutes / 60);
      const elapsedRemainMins = elapsedMinutes % 60;
      const isOvertime = isOnline && (elapsedMinutes > quotaMinutes);
      const overtimeTotalMins = isOvertime ? (elapsedMinutes - quotaMinutes) : 0;
      const overtimeHours = Math.floor(overtimeTotalMins / 60);
      const overtimeRemainMins = overtimeTotalMins % 60;
      
      const shiftProgressPct = Math.min(100, Math.round((elapsedMinutes / quotaMinutes) * 100));
      const monthlyTargetHours = 208; // 26 shifts * 8h
      const monthlyProgressPct = Math.min(100, Math.round((emp.workedHoursThisMonth / monthlyTargetHours) * 100));
      const monthlyOvertimeHours = Math.max(0, emp.workedHoursThisMonth - monthlyTargetHours);

      return {
        ...emp,
        center: empCenter,
        isOnline,
        loginTimestamp,
        logoutTimestamp: emp.lastLogoutAt,
        quotaHours,
        elapsedMinutes,
        elapsedHours,
        elapsedRemainMins,
        isOvertime,
        overtimeTotalMins,
        overtimeHours,
        overtimeRemainMins,
        shiftProgressPct,
        monthlyTargetHours,
        monthlyProgressPct,
        monthlyOvertimeHours,
        formattedActive: `${elapsedHours}h ${elapsedRemainMins}m`,
        formattedOvertime: `+${overtimeHours}h ${overtimeRemainMins}m`
      };
    });
  }, [staff, centers, attendanceLogs]);

  const visibleStaff = useMemo(() => {
    return staff.filter(emp => {
      // Exclude mock staff
      const nameL = (emp.name || '').toLowerCase();
      if (nameL.includes('anjali') || nameL.includes('siddharth')) return false;

      if (!isSuperAdmin) {
        if (
          emp.id === 'admin-01' ||
          (emp.role as string) === 'Center Director' ||
          (emp.role as string) === 'SUPER_ADMIN' ||
          emp.username === 'admin' ||
          nameL.includes('administrator') ||
          nameL.includes('super admin')
        ) {
          return false;
        }
      }
      return true;
    });
  }, [staff, isSuperAdmin]);

  const onlineStaffList = useMemo(() => {
    return staffAttendanceCalculations.filter(s => {
      const nameL = (s.name || '').toLowerCase();
      if (nameL.includes('anjali') || nameL.includes('siddharth')) return false;

      return s.isOnline;
    });
  }, [staffAttendanceCalculations]);

  const overtimeStaffList = useMemo(() => {
    return staffAttendanceCalculations.filter(s => {
      const nameL = (s.name || '').toLowerCase();
      if (nameL.includes('anjali') || nameL.includes('siddharth')) return false;

      if (!isSuperAdmin && ((s.role as string) === 'Center Director' || (s.role as string) === 'SUPER_ADMIN' || s.username === 'admin' || nameL.includes('admin'))) {
        return false;
      }
      return s.isOvertime;
    });
  }, [staffAttendanceCalculations, isSuperAdmin]);

  // Filtered Online Staff for Section 1
  const filteredOnlineStaff = useMemo(() => {
    return onlineStaffList.filter(s => {
      if (attCenterFilter !== 'ALL' && s.assignedCenterId !== attCenterFilter) return false;
      if (attRoleFilter !== 'ALL' && s.role !== attRoleFilter) return false;
      if (attSearch.trim()) {
        const q = attSearch.toLowerCase();
        const matchName = (s.name || '').toLowerCase().includes(q);
        const matchRole = (s.role || '').toLowerCase().includes(q);
        const matchPhone = (s.phone || '').toLowerCase().includes(q);
        const matchCenter = (s.center?.name || '').toLowerCase().includes(q) || (s.center?.code || '').toLowerCase().includes(q);
        if (!matchName && !matchRole && !matchPhone && !matchCenter) return false;
      }
      return true;
    });
  }, [onlineStaffList, attCenterFilter, attRoleFilter, attSearch]);

  // Filtered All Staff for Section 2
  const filteredStaffCompliance = useMemo(() => {
    return staffAttendanceCalculations.filter(s => {
      const nameL = (s.name || '').toLowerCase();
      if (nameL.includes('anjali') || nameL.includes('siddharth')) return false;
      if (attCenterFilter !== 'ALL' && s.assignedCenterId !== attCenterFilter) return false;
      if (attRoleFilter !== 'ALL' && s.role !== attRoleFilter) return false;
      if (attStatusFilter === 'ONLINE_ONLY' && !s.isOnline) return false;
      if (attStatusFilter === 'OVERTIME_ONLY' && !s.isOvertime && s.monthlyOvertimeHours === 0) return false;
      if (attSearch.trim()) {
        const q = attSearch.toLowerCase();
        const matchName = (s.name || '').toLowerCase().includes(q);
        const matchRole = (s.role || '').toLowerCase().includes(q);
        const matchPhone = (s.phone || '').toLowerCase().includes(q);
        const matchCenter = (s.center?.name || '').toLowerCase().includes(q) || (s.center?.code || '').toLowerCase().includes(q);
        if (!matchName && !matchRole && !matchPhone && !matchCenter) return false;
      }
      return true;
    });
  }, [staffAttendanceCalculations, attCenterFilter, attRoleFilter, attStatusFilter, attSearch, isSuperAdmin]);

  // Filtered Historical Attendance Logs for Section 3
  const filteredAttendanceLogs = useMemo(() => {
    return attendanceLogs.filter(log => {
      // Exclude mock staff
      const nameL = (log.staffName || '').toLowerCase();
      if (nameL.includes('anjali') || nameL.includes('siddharth') || log.id === 'att-01' || log.id === 'att-02') {
        return false;
      }

      // Center Manager cannot see attendance logs of Super Admin
      if (!isSuperAdmin) {
        if (
          log.staffId === 'admin-01' ||
          (log.role || '').toLowerCase().includes('super admin') ||
          (log.role || '').toLowerCase().includes('director') ||
          nameL.includes('administrator')
        ) {
          return false;
        }
      }
      if (attCenterFilter !== 'ALL' && log.centerId !== attCenterFilter) return false;
      if (attSearch.trim()) {
        const q = attSearch.toLowerCase();
        const matchName = nameL.includes(q);
        const matchRole = (log.role || '').toLowerCase().includes(q);
        const matchCode = (log.centerCode || '').toLowerCase().includes(q);
        if (!matchName && !matchRole && !matchCode) return false;
      }
      if (!isDateInSelectedRange(log.loginAt, attLogDateFilter, attLogStartDate, attLogEndDate)) return false;
      return true;
    });
  }, [attendanceLogs, attCenterFilter, attSearch, attLogDateFilter, attLogStartDate, attLogEndDate, isSuperAdmin]);

  // Filtered Orders for Interactive Dashboard based on Dashboard Date Filter
  const dashboardFilteredOrders = useMemo(() => {
    return allOrders.filter(o => {
      if (o.isDeleted || o.deletionPendingApproval) return false;
      if (!isSuperAdmin && o.centerId && o.centerId !== selectedCenter.id) return false;
      return (
        isDateInSelectedRange(o.createdAt, dashboardDateRange, dashboardStartDate, dashboardEndDate) ||
        (o.appointmentDate ? isDateInSelectedRange(o.appointmentDate, dashboardDateRange, dashboardStartDate, dashboardEndDate) : false)
      );
    });
  }, [allOrders, isSuperAdmin, selectedCenter.id, dashboardDateRange, dashboardStartDate, dashboardEndDate]);

  // Filtered Expenses for Interactive Dashboard based on Dashboard Date Filter
  const dashboardFilteredExpenses = useMemo(() => {
    return allExpenses.filter(e => {
      if (e.isDeleted || e.deletionPendingApproval) return false;
      if (!isSuperAdmin && e.centerId && e.centerId !== selectedCenter.id) return false;
      const expenseDate = e.date;
      return isDateInSelectedRange(expenseDate, dashboardDateRange, dashboardStartDate, dashboardEndDate);
    });
  }, [allExpenses, isSuperAdmin, selectedCenter.id, dashboardDateRange, dashboardStartDate, dashboardEndDate]);

  // Dashboard Aggregated Financial & Activity Metrics
  const dashboardMetrics = useMemo(() => {
    const totalMRP = dashboardFilteredOrders.reduce((sum, o) => sum + (o.subtotal || o.totalAmount || 0), 0);
    const totalPaid = dashboardFilteredOrders.reduce((sum, o) => sum + (o.paidAmount || 0), 0);
    const totalCash = dashboardFilteredOrders.reduce((sum, o) => {
      const split = getOrderPaymentSplit(o);
      const refund = o.refundMode === 'Cash' ? (o.refundAmount || 0) : 0;
      return sum + Math.max(0, split.cash - refund);
    }, 0);
    const totalOnline = dashboardFilteredOrders.reduce((sum, o) => {
      const split = getOrderPaymentSplit(o);
      const refund = o.refundMode && o.refundMode !== 'Cash' ? (o.refundAmount || 0) : 0;
      return sum + Math.max(0, split.online - refund);
    }, 0);
    const totalDue = dashboardFilteredOrders.reduce((sum, o) => sum + (o.dueAmount || 0), 0);
    const totalExp = dashboardFilteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const netPnL = totalPaid - totalExp;
    return {
      totalMRP,
      totalPaid,
      totalCash,
      totalOnline,
      totalDue,
      totalExp,
      netPnL,
      isProfit: netPnL >= 0,
      orderCount: dashboardFilteredOrders.length,
      expenseCount: dashboardFilteredExpenses.length
    };
  }, [dashboardFilteredOrders, dashboardFilteredExpenses]);

  const dashboardDateLabel = useMemo(() => {
    if (dashboardDateRange === 'ALL') return 'All-Time';
    if (dashboardDateRange === 'TODAY') return 'Today';
    if (dashboardDateRange === 'YESTERDAY') return 'Yesterday';
    if (dashboardDateRange === 'THIS_WEEK') return 'Past 7 Days';
    if (dashboardDateRange === 'THIS_MONTH') return 'This Month';
    if (dashboardDateRange === 'CUSTOM' && dashboardStartDate && dashboardEndDate) {
      return `${dashboardStartDate} to ${dashboardEndDate}`;
    }
    return 'Selected Period';
  }, [dashboardDateRange, dashboardStartDate, dashboardEndDate]);

  // Filtered Orders for Financial MIS Overview
  const misFilteredOrders = useMemo(() => {
    return allOrders.filter(o => {
      if (o.isDeleted || o.deletionPendingApproval) return false;
      if (misCenterFilter !== 'ALL' && o.centerId !== misCenterFilter) return false;
      return (
        isDateInSelectedRange(o.createdAt, misDateRange, misStartDate, misEndDate) ||
        (o.appointmentDate ? isDateInSelectedRange(o.appointmentDate, misDateRange, misStartDate, misEndDate) : false)
      );
    });
  }, [allOrders, misCenterFilter, misDateRange, misStartDate, misEndDate]);

  // Filtered Expenses for Financial MIS Overview
  const misFilteredExpenses = useMemo(() => {
    return allExpenses.filter(e => {
      if (e.isDeleted || e.deletionPendingApproval) return false;
      if (misCenterFilter !== 'ALL' && e.centerId !== misCenterFilter) return false;
      const expenseDate = e.date;
      return isDateInSelectedRange(expenseDate, misDateRange, misStartDate, misEndDate);
    });
  }, [allExpenses, misCenterFilter, misDateRange, misStartDate, misEndDate]);

  // Dynamically computed MIS Financial Metrics based on selected date filter
  const dynamicMisSummary = useMemo(() => {
    const grossRevenue = misFilteredOrders.reduce((sum, o) => sum + (o.subtotal || o.totalAmount), 0);
    const discountsGiven = misFilteredOrders.reduce((sum, o) => sum + (o.discountAmount || 0), 0);
    const netRevenue = grossRevenue - discountsGiven;
    const collectedAmount = misFilteredOrders.reduce((sum, o) => sum + (o.paidAmount || 0), 0);
    const pendingDueAmount = misFilteredOrders.reduce((sum, o) => sum + (o.dueAmount || 0), 0);

    const cashIncome = misFilteredOrders.reduce((sum, o) => {
      const split = getOrderPaymentSplit(o);
      const refund = o.refundMode === 'Cash' ? (o.refundAmount || 0) : 0;
      return sum + Math.max(0, split.cash - refund);
    }, 0);

    const onlineIncome = misFilteredOrders.reduce((sum, o) => {
      const split = getOrderPaymentSplit(o);
      const refund = o.refundMode && o.refundMode !== 'Cash' ? (o.refundAmount || 0) : 0;
      return sum + Math.max(0, split.online - refund);
    }, 0);

    const totalOperatingExpenses = misFilteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    const totalPayrollExpenses = isSuperAdmin ? staff.reduce((sum, emp) => sum + (emp.monthlySalary || 0), 0) : 0;
    const totalOutflow = totalOperatingExpenses + totalPayrollExpenses;
    const netProfit = collectedAmount - totalOperatingExpenses - (isSuperAdmin ? totalPayrollExpenses : 0);
    const profitMarginPct = collectedAmount > 0 ? Math.round((netProfit / collectedAmount) * 100) : 0;

    return {
      grossRevenue,
      discountsGiven,
      netRevenue,
      collectedAmount,
      pendingDueAmount,
      cashIncome,
      onlineIncome,
      totalOperatingExpenses,
      totalPayrollExpenses,
      totalOutflow,
      netProfit,
      profitMarginPct
    };
  }, [misFilteredOrders, misFilteredExpenses, isSuperAdmin, staff]);

  const openApproveDoctorModal = (doc: ReferringDoctor) => {
    setApprovingDoctor(doc);
    setEditApproveName(doc.name || '');
    setEditApproveSpecialty(doc.specialty || '');
    setEditApproveQualification(doc.qualification || '');
    setEditApproveHospital(doc.hospital || '');
    setEditApproveAffiliationType(doc.affiliationType || 'SELF');
    setEditApproveOrgName(doc.organizationName || '');
    setEditApprovePhone(doc.phone || '');
    setEditApproveEmail(doc.email || '');
    setEditApproveRegNo(doc.registrationNo || '');
    setEditApproveNotes(doc.notes || '');
  };

  const handleRegisterNewPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnerName.trim()) {
      showToast('Doctor / Partner name is mandatory.');
      return;
    }
    try {
      const createdId = addReferringDoctor({
        name: newPartnerName.trim(),
        specialty: newPartnerSpecialty.trim(),
        qualification: newPartnerQualification.trim(),
        hospital: newPartnerHospital.trim(),
        affiliationType: newPartnerAffiliationType,
        organizationName: newPartnerAffiliationType === 'ORGANIZATION' ? newPartnerOrgName.trim() : '',
        phone: newPartnerPhone.trim() || '',
        email: newPartnerEmail.trim() || '',
        registrationNo: newPartnerRegNo.trim() || undefined,
        notes: newPartnerNotes.trim() || undefined,
        commissionPct: 0,
        addedByRole: isSuperAdmin ? 'SUPER_ADMIN' : 'CENTER_MANAGER',
        status: 'APPROVED'
      });
      if (editingInvoiceOrder) {
        setEditBeneficiaryId(createdId);
        setEditBeneficiaryName(newPartnerAffiliationType === 'ORGANIZATION' && newPartnerOrgName.trim() ? newPartnerOrgName.trim() : newPartnerName.trim());
      }
      showToast(`Doctor / Beneficiary partner ${newPartnerName.trim()} registered in master and linked successfully!`);
      setIsRegisterPartnerModalOpen(false);
      setNewPartnerName('');
      setNewPartnerSpecialty('');
      setNewPartnerQualification('');
      setNewPartnerHospital('');
      setNewPartnerAffiliationType('SELF');
      setNewPartnerOrgName('');
      setNewPartnerPhone('');
      setNewPartnerEmail('');
      setNewPartnerRegNo('');
      setNewPartnerNotes('');
    } catch (err: any) {
      showToast('Failed to register doctor partner: ' + (err?.message || 'Error'));
    }
  };

  const handleConfirmApproval = () => {
    if (!isSuperAdmin) {
      showToast('Unauthorized: Only Super Admin can approve doctors.');
      setApprovingDoctor(null);
      return;
    }
    if (!approvingDoctor) return;
    approveReferringDoctor(approvingDoctor.id, 0, {
      name: editApproveName.trim() || approvingDoctor.name,
      specialty: editApproveSpecialty.trim() || approvingDoctor.specialty,
      qualification: editApproveQualification.trim() || approvingDoctor.qualification,
      hospital: editApproveHospital.trim() || approvingDoctor.hospital,
      affiliationType: editApproveAffiliationType,
      organizationName: editApproveAffiliationType === 'ORGANIZATION' ? editApproveOrgName.trim() : undefined,
      phone: editApprovePhone.trim() || approvingDoctor.phone,
      email: editApproveEmail.trim() || approvingDoctor.email,
      registrationNo: editApproveRegNo.trim() || undefined,
      notes: editApproveNotes.trim() || undefined
    });
    showToast(`${editApproveName || approvingDoctor.name} approved & activated in roster successfully!`);
    setApprovingDoctor(null);
  };

  const openEditApprovedDoctorModal = (doc: ReferringDoctor) => {
    setEditingApprovedDoctor(doc);
    setEditApproveName(doc.name || '');
    setEditApproveSpecialty(doc.specialty || '');
    setEditApproveQualification(doc.qualification || '');
    setEditApproveHospital(doc.hospital || '');
    setEditApproveAffiliationType(doc.affiliationType || 'SELF');
    setEditApproveOrgName(doc.organizationName || '');
    setEditApprovePhone(doc.phone || '');
    setEditApproveEmail(doc.email || '');
    setEditApproveRegNo(doc.registrationNo || '');
    setEditApproveNotes(doc.notes || '');
  };

  const handleSaveApprovedDoctorEdit = () => {
    if (!isSuperAdmin) {
      showToast('Unauthorized: Only Super Admin can edit doctor details.');
      setEditingApprovedDoctor(null);
      return;
    }
    if (!editingApprovedDoctor) return;
    if (updateReferringDoctor) {
      updateReferringDoctor(editingApprovedDoctor.id, {
        name: editApproveName.trim() || editingApprovedDoctor.name,
        specialty: editApproveSpecialty.trim() || editingApprovedDoctor.specialty,
        qualification: editApproveQualification.trim() || editingApprovedDoctor.qualification,
        hospital: editApproveHospital.trim() || editingApprovedDoctor.hospital,
        affiliationType: editApproveAffiliationType,
        organizationName: editApproveAffiliationType === 'ORGANIZATION' ? editApproveOrgName.trim() : undefined,
        phone: editApprovePhone.trim() || editingApprovedDoctor.phone,
        email: editApproveEmail.trim() || editingApprovedDoctor.email,
        registrationNo: editApproveRegNo.trim() || undefined,
        notes: editApproveNotes.trim() || undefined
      });
    }
    showToast(`Updated doctor profile for ${editApproveName || editingApprovedDoctor.name}`);
    setEditingApprovedDoctor(null);
  };

  const handleProcessAdminRefundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminRefundModalOrder) return;
    const numAmount = Number(adminRefundAmount);
    const existingRefund = adminRefundModalOrder.refundAmount || 0;
    const remainingPaid = Math.max(0, adminRefundModalOrder.paidAmount - existingRefund);

    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('Please enter a valid refund amount.');
      return;
    }
    if (numAmount > remainingPaid) {
      showToast(`Refund amount cannot exceed remaining collected balance of ₹${remainingPaid.toLocaleString()}.`);
      return;
    }
    if (!adminRefundReason.trim()) {
      showToast('Mandatory: Please provide a reason note for processing this return/refund.');
      return;
    }

    processOrderRefund(adminRefundModalOrder.id, numAmount, adminRefundReason.trim(), adminRefundMode);
    showToast(`Refund of ₹${numAmount.toLocaleString()} recorded for Bill #${adminRefundModalOrder.invoiceNumber}`);
    setAdminRefundModalOrder(null);
    setAdminRefundAmount('');
    setAdminRefundReason('');
  };

  const handleConfirmCommissionChange = () => {
    if (!isSuperAdmin) {
      showToast('Unauthorized: Only Super Admin can modify doctor commission rates.');
      setEditingDoctor(null);
      return;
    }
    if (!editingDoctor) return;
    const safeRate = Math.min(100, Math.max(0, newCommissionRate));
    updateDoctorCommission(editingDoctor.id, safeRate);
    showToast(`Updated commission for ${editingDoctor.name} to ${safeRate}%`);
    setEditingDoctor(null);
  };

  const handleConfirmPayout = () => {
    if (!payoutDoctor || payoutAmount <= 0) return;
    recordDoctorPayout(payoutDoctor.id, payoutAmount);
    showToast(`Recorded payout of ₹${payoutAmount.toLocaleString()} to ${payoutDoctor.name}`);
    setPayoutDoctor(null);
    setPayoutAmount(0);
  };

  const handlePrintMISReport = async () => {
    let element = document.getElementById('mis-report-printable-area');
    if (!element) {
      setIsPrintMISModalOpen(true);
      await new Promise(r => setTimeout(r, 200));
      element = document.getElementById('mis-report-printable-area');
    }
    printElement('mis-report-printable-area', {
      title: `Atlas_MIS_Commission_Report_${new Date().toISOString().split('T')[0]}`,
      pageSize: 'A4 portrait',
      pageMargin: '8mm 8mm'
    });
  };

  const handleDownloadMISPdf = async () => {
    setIsGeneratingMISPdf(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      const contentWidth = pageWidth - margin * 2; // 190mm

      // 1. Center Letterhead
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(15, 23, 42); // slate-900
      pdf.text('ATLAS DIAGNOSTICS CENTER', margin, 14);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(71, 85, 105); // slate-600
      pdf.text('Comprehensive Diagnostic Pathology & Medical Imaging Center', margin, 18.5);

      pdf.setFontSize(7.5);
      pdf.setTextColor(100, 116, 139); // slate-500
      const centerLoc = `Central Hub: ${selectedCenter.address}  |  Hotline: ${selectedCenter.phone}`;
      pdf.text(centerLoc, margin, 22.5);

      // Right-aligned official badge & timestamp
      pdf.setFillColor(241, 245, 249); // slate-100
      pdf.setDrawColor(203, 213, 225); // slate-300
      pdf.roundedRect(pageWidth - margin - 46, 9, 46, 8, 1.5, 1.5, 'FD');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(30, 41, 59);
      pdf.text('OFFICIAL MIS REPORT', pageWidth - margin - 23, 14.5, { align: 'center' });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(100, 116, 139);
      const nowStr = `Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      pdf.text(nowStr, pageWidth - margin, 21.5, { align: 'right' });

      // Horizontal separator line
      pdf.setDrawColor(15, 23, 42);
      pdf.setLineWidth(0.4);
      pdf.line(margin, 25, pageWidth - margin, 25);

      // 2. Clean Beneficiary Top Banner (Single clean header under letterhead)
      const currentBeneficiaryTitle = referralBeneficiaryFilter !== 'ALL'
        ? referralBeneficiaryFilter
        : referralDoctorFilter !== 'ALL'
          ? referralDoctorFilter
          : 'All Referring Partners & Beneficiaries';

      pdf.setFillColor(250, 245, 255); // purple-50
      pdf.setDrawColor(216, 180, 254); // purple-300
      pdf.setLineWidth(0.2);
      pdf.roundedRect(margin, 28, contentWidth, 9, 1.5, 1.5, 'FD');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(107, 33, 168); // purple-700
      pdf.text('BENEFICIARY:', margin + 4, 34);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9.5);
      pdf.setTextColor(59, 7, 100); // purple-950
      pdf.text(currentBeneficiaryTitle, margin + 40, 34);

      if (referralDateRange !== 'ALL' || (referralStartDate && referralEndDate)) {
        const dateLabel = referralDateRange === 'CUSTOM' && referralStartDate && referralEndDate ? `${referralStartDate} to ${referralEndDate}` : referralDateRange;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.setTextColor(71, 85, 105);
        pdf.text(`Period: ${dateLabel}`, pageWidth - margin - 4, 34, { align: 'right' });
      }

      // 3. AutoTable for Separated Diagnostic Line Items with MRP, Discount, Paid, Due & Billed By
      const tableHead = [
        [
          'S.No.',
          'Date & Inv #',
          'Patient Details',
          'Investigation',
          'MRP (Rs.)',
          'Discount (Rs.)',
          'Paid (Rs.)',
          'Due (Rs.)'
        ]
      ];

      const tableBody = misReportOrdersAsc.map(({ order: ord }, idx) => {
        const dateStr = formatSafeDate(ord.createdAt);
        const timeStr = formatSafeTime(ord.createdAt);
        const mrp = ord.subtotal || ord.totalAmount || 0;
        const discount = ord.discountAmount || 0;
        const paid = ord.paidAmount || 0;
        const due = ord.dueAmount || 0;
        const tests = (ord.tests && ord.tests.length > 0) ? ord.tests : [{ name: 'Diagnostic Services' }];
        const testsFormatted = tests.map(t => t.name).join('\n');

        return [
          String(idx + 1),
          `${dateStr}\n${timeStr}\n#${ord.invoiceNumber}`,
          `${ord.patient.name}\n${ord.patient.gender[0]}/${ord.patient.age} • ${ord.patient.phone}`,
          testsFormatted,
          `Rs. ${mrp.toLocaleString()}`,
          discount > 0 ? `Rs. ${discount.toLocaleString()}` : '-',
          `Rs. ${paid.toLocaleString()}`,
          due > 0 ? `Rs. ${due.toLocaleString()}` : '-'
        ];
      });

      if (tableBody.length === 0) {
        tableBody.push([
          {
            content: 'No referred diagnostic investigations found matching the selected filters.',
            colSpan: 7,
            styles: { halign: 'center', textColor: [148, 163, 184], fontStyle: 'italic', cellPadding: 8 }
          } as any
        ]);
      }

      autoTable(pdf, {
        head: tableHead,
        body: tableBody,
        foot: filteredReferralMISOrders.length > 0 ? [
          [
            { content: 'Total Summaries', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
            { content: `Rs. ${misOrderTotalMRP.toLocaleString()}`, styles: { halign: 'right', fontStyle: 'bold', textColor: [7, 89, 133] } },
            { content: `Rs. ${misOrderTotalDiscount.toLocaleString()}`, styles: { halign: 'right', fontStyle: 'bold' } },
            { content: `Rs. ${misOrderTotalPaid.toLocaleString()}`, styles: { halign: 'right', fontStyle: 'bold' } },
            { content: `Rs. ${misOrderTotalDue.toLocaleString()}`, styles: { halign: 'right', fontStyle: 'bold', textColor: [185, 28, 28] } },
          ]
        ] : undefined,
        startY: 40,
        margin: { left: margin, right: margin, bottom: 20 },
        theme: 'striped',
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontSize: 7.5,
          fontStyle: 'bold',
          cellPadding: 2.5
        },
        footStyles: {
          fillColor: [241, 245, 249],
          textColor: [15, 23, 42],
          fontSize: 8,
          fontStyle: 'bold',
          cellPadding: 2.5
        },
        bodyStyles: {
          fontSize: 7,
          textColor: [30, 41, 59],
          cellPadding: 2.2,
          lineColor: [226, 232, 240],
          lineWidth: 0.1
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' }, // S.No.
          1: { cellWidth: 24 }, // Date & Inv #
          2: { cellWidth: 40 }, // Patient Details
          3: { cellWidth: 48 }, // Investigation
          4: { cellWidth: 17, halign: 'right', fontStyle: 'bold' }, // MRP
          5: { cellWidth: 16, halign: 'right' }, // Discount
          6: { cellWidth: 17, halign: 'right' }, // Paid
          7: { cellWidth: 18, halign: 'right', fontStyle: 'bold', textColor: [185, 28, 28] } // Due
        },
        didDrawPage: (data) => {
          // Page Footer on every page
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(6.5);
          pdf.setTextColor(148, 163, 184);
          const pageStr = `Page ${data.pageNumber}`;
          pdf.text('Atlas Diagnostics Center Management System • Official Confidential MIS Audit', margin, pageHeight - 8);
          pdf.text(pageStr, pageWidth - margin, pageHeight - 8, { align: 'right' });
        }
      });

      // 4. Sign-off block at bottom of final page
      const finalY = (pdf as any).lastAutoTable?.finalY || 160;
      let signY = finalY + 12;
      if (signY > pageHeight - 25) {
        pdf.addPage();
        signY = 30;
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(30, 41, 59);
      const genByName = currentUser?.name || (isSuperAdmin ? 'Mohsina Akhtar' : 'Center Manager');
      pdf.text(`Report Prepared & Audited By: ${genByName}`, margin, signY);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text('Atlas Diagnostics Center MIS Commission Control', margin, signY + 4);

      // Signature line on right
      pdf.setDrawColor(148, 163, 184);
      pdf.setLineWidth(0.3);
      pdf.line(pageWidth - margin - 45, signY + 2, pageWidth - margin, signY + 2);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6.5);
      pdf.setTextColor(71, 85, 105);
      pdf.text('AUTHORIZED ACCOUNTS SIGNATURE', pageWidth - margin - 22.5, signY + 6, { align: 'center' });

      // Automatically open compiled PDF directly in a new tab
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const win = window.open(blobUrl, '_blank');
      if (!win) {
        const a = document.createElement('a');
        a.href = blobUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.click();
      }
      showToast('Compiled MIS Report opened in a new tab.');
    } catch (err) {
      console.error('MIS PDF Generation failed', err);
      showToast('Failed to compile PDF. You can also click Print -> Microsoft Print to PDF.');
    } finally {
      setIsGeneratingMISPdf(false);
    }
  };

  const handleOpenEditAdminAppointment = (apt: PatientAppointment) => {
    setEditingAdminAppointment(apt);
    setEditAdminAptName(apt.patientName);
    setEditAdminAptPhone(apt.patientPhone);
    setEditAdminAptAge(apt.patientAge !== undefined ? apt.patientAge : '');
    setEditAdminAptGender(apt.patientGender || 'Male');
    setEditAdminAptDate(apt.appointmentDate);
    setEditAdminAptTime(apt.appointmentTime);
    setEditAdminAptDoctor(apt.referringDoctorName || '');
    setEditAdminAptNotes(apt.notes || '');
    setEditAdminAptStatus(apt.status);
  };

  const handleSaveAdminAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdminAppointment) return;
    updateAppointment(editingAdminAppointment.id, {
      patientName: editAdminAptName,
      patientPhone: editAdminAptPhone,
      patientAge: editAdminAptAge !== '' ? Number(editAdminAptAge) : undefined,
      patientGender: editAdminAptGender,
      appointmentDate: editAdminAptDate,
      appointmentTime: editAdminAptTime,
      referringDoctorName: editAdminAptDoctor,
      notes: editAdminAptNotes,
      status: editAdminAptStatus
    });
    showToast(`Updated scheduled appointment for ${editAdminAptName}`);
    setEditingAdminAppointment(null);
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle || !expAmount || !expPaidTo) return;
    addExpense({
      title: expTitle,
      category: expCategory,
      amount: Number(expAmount),
      date: new Date().toISOString().split('T')[0],
      centerId: expCenterId,
      paidTo: expPaidTo,
      paymentMode: expMode,
      receiptNo: expReceiptNo || `EXP-${Date.now().toString().slice(-4)}`
    });
    showToast(`Added expense ₹${expAmount} (${expCategory})`);
    setIsAddExpenseModalOpen(false);
    setExpTitle('');
    setExpAmount('');
    setExpPaidTo('');
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName || !staffPhone || !staffSalary) return;
    const salary = Number(staffSalary);
    const hourly = Math.round(salary / 160);
    const username = staffUsername.trim() || staffName.toLowerCase().replace(/\s+/g, '');

    const cleanStart = parseCleanTime(staffShiftStart, false, '09:00 AM');
    const cleanEnd = parseCleanTime(staffShiftEnd, true, '05:00 PM');
    const finalShift = staffShiftCustom && cleanStart && cleanEnd
      ? `Custom (${cleanStart} - ${cleanEnd})`
      : staffShift;

    addStaff({
      name: staffName,
      role: staffRole,
      assignedCenterId: staffCenterId,
      phone: staffPhone,
      email: staffEmail.trim() || '',
      username,
      password: staffPassword || 'Atlas@123',
      shift: finalShift,
      shiftStartTime: cleanStart,
      shiftEndTime: cleanEnd,
      shiftTiming: `${cleanStart} - ${cleanEnd}`,
      monthlySalary: salary,
      hourlyRate: hourly,
      workedHoursThisMonth: 0,
      totalShiftsCompleted: 0,
      attendancePct: 100,
      joinedDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      signatureUrl: staffSignatureUrl || undefined,
      sealUrl: staffSealUrl || undefined,
      registrationNo: staffRegNo || undefined
    });

    showToast(`Created employee ${staffName} (Username: ${username})`);
    setIsAddStaffModalOpen(false);
    setStaffName('');
    setStaffPhone('');
    setStaffEmail('');
    setStaffUsername('');
    setStaffPassword('Atlas@123');
    setStaffSignatureUrl('');
    setStaffSealUrl('');
    setStaffRegNo('');
    setStaffSalary(35000);
    setStaffShift('Morning (8:00 AM - 4:00 PM)');
    setStaffShiftCustom(false);
  };

  const handleSaveTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      showToast('Unauthorized: Only Super Admin can modify test catalog or pricing.');
      setIsAddTestModalOpen(false);
      setEditingTest(null);
      return;
    }
    if (!testName.trim() || !testPrice) return;

    if (editingTest) {
      updateTest(editingTest.id, {
        name: testName.trim(),
        code: testCode.trim().toUpperCase() || editingTest.code,
        category: testCategory,
        department: testDepartment,
        sampleType: testSampleType,
        price: Number(testPrice),
        tatHours: Number(testTatHours) || 4
      });
      showToast(`Updated test "${testName}"`);
      setEditingTest(null);
    } else {
      const code = testCode.trim().toUpperCase() || `ATL-${testName.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
      addTest({
        code,
        name: testName.trim(),
        category: testCategory,
        department: testDepartment,
        sampleType: testSampleType,
        price: Number(testPrice),
        costPrice: Math.round(Number(testPrice) * 0.3),
        tatHours: Number(testTatHours) || 4,
        defaultTemplate: testCategory === 'Radiology' ? 'tpl-cxr' : 'tpl-cbc'
      });
      showToast(`Added test "${testName}" to catalog`);
      setIsAddTestModalOpen(false);
    }

    setTestName('');
    setTestCode('');
    setTestPrice(500);
    setTestTatHours(4);
  };

  const closeAddCenterModal = () => {
    setIsAddCenterModalOpen(false);
    setCenterName('');
    setCenterCode('');
    setCenterAddress('');
    setCenterPhone('');
    setCenterIsMain(false);
  };

  // Close modals on Escape key press (UI symmetry)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAddCenterModal();
        setIsAddStaffModalOpen(false);
        setIsAddExpenseModalOpen(false);
        setIsAddTestModalOpen(false);
        setEditingTest(null);
        setIsGSheetsModalOpen(false);
        setApprovingDoctor(null);
        setEditingDoctor(null);
        setPayoutDoctor(null);
        setLoggingHoursStaff(null);
        setAdminRefundModalOrder(null);
        setIsPrintMISModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    


  return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCreateCenter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!centerName.trim() || !centerCode.trim()) return;

    const newCenter = addCenter({
      name: centerName.trim(),
      code: centerCode.trim().toUpperCase(),
      address: centerAddress.trim() || 'Center Diagnostic Hub',
      phone: centerPhone.trim() || '+91 98765 43210',
      isMain: centerIsMain
    });

    showToast(`Added new diagnostic center "${newCenter.name}" (${newCenter.code})`);
    closeAddCenterModal();
  };

  // Helper to normalize doctor / partner names for fuzzy matching (removes Dr, Mr, punctuation)
  const normalizeRefName = useCallback((str?: string) => {
    if (!str) return '';
    const raw = str
      .toLowerCase()
      .replace(/^(dr\.?|doctor|mr\.?|mrs\.?|ms\.?|prof\.?|pt\.?)\s*/i, '')
      .replace(/[^a-z0-9]/g, '')
      .replace(/sh/g, 's')
      .trim();
    if (raw === 'galaxyhospital' || raw === 'galaxyhospitalkhajrana') return 'galaxyhospitalkhajrana';
    if (raw.includes('deepak') && (raw.includes('geeta') || raw.includes('gita'))) return 'deepakgitabhawan';
    if (raw.includes('irfan') && (raw.includes('thyro') || raw.includes('cear') || raw.includes('care'))) return 'irfanthyrocare';
    if (raw.includes('loyal') && raw.includes('multi')) return 'loyalmultispeciality';
    if (raw.includes('femida') || raw.includes('fehmida')) return 'femidaaasha';
    if (raw.includes('direct') && raw.includes('walkin')) return 'directwalkin';
    if (raw === 'walkin' || raw === 'direct') return 'directwalkin';
    return raw;
  }, []);

  // Matching helper to relate patient order with a doctor or organization partner
    const isOrderMatchingReferrer = useCallback((ord: DiagnosticOrder, r: ReferringDoctor) => {
    const rawDocName = (ord.referringDoctorName || '').trim();
    const rawBenName = (ord.commissionBeneficiaryName || '').trim();
    if (r.id === 'partner-direct-walkin' || normalizeRefName(r.name) === 'directwalkin') {
      const isDocWalkIn = !ord.referringDoctorId && (!rawDocName || /walk[\s-]*in|direct|^self$/i.test(rawDocName));
      const isBenWalkIn = !ord.commissionBeneficiaryId && (!rawBenName || /walk[\s-]*in|direct|^self$/i.test(rawBenName));
      return isDocWalkIn || isBenWalkIn;
    }
    // Only exclude as walk-in if NEITHER referring doctor NOR beneficiary is assigned to a real partner
    const isWalkInOrder = !ord.referringDoctorId && !ord.commissionBeneficiaryId && 
      (!rawDocName || /walk[\s-]*in|direct|^self$/i.test(rawDocName)) &&
      (!rawBenName || /walk[\s-]*in|direct|^self$/i.test(rawBenName));
    if (isWalkInOrder) return false;

    if (ord.referringDoctorId && ord.referringDoctorId === r.id) return true;
    if (ord.commissionBeneficiaryId && ord.commissionBeneficiaryId === r.id) return true;

    const normRName = normalizeRefName(r.name);
    const normROrg = normalizeRefName(r.organizationName);
    const normRHosp = normalizeRefName(r.hospital);

    const normDoc = normalizeRefName(ord.referringDoctorName);
    const normBen = normalizeRefName(ord.commissionBeneficiaryName);
    const normAff = normalizeRefName((ord as any).doctorAffiliation);

    const isValidToken = (s: string) => s.length >= 3 && !s.includes('walkin') && !s.includes('direct') && s !== 'self' && s !== 'independentpractice';

    // Exact or strong doctor name match
    if (isValidToken(normDoc) && isValidToken(normRName) && (normDoc === normRName || normDoc.includes(normRName) || normRName.includes(normDoc))) {
      return true;
    }

    // Beneficiary name match
    if (isValidToken(normBen) && isValidToken(normRName) && (normBen === normRName || normBen.includes(normRName) || normRName.includes(normBen))) {
      return true;
    }

    // Organization / Beneficiary match: ONLY apply if this doctor record 'r' is actually an organization/hospital partner entity itself!
    const isOrgPartnerEntity = r.affiliationType === 'ORGANIZATION' && ((r as any).role === 'Referral Partner' || r.specialty?.toLowerCase().includes('hospital') || r.specialty?.toLowerCase().includes('clinic') || r.specialty?.toLowerCase().includes('partner') || !r.name.toLowerCase().startsWith('dr.'));
    if (isOrgPartnerEntity) {
      if (isValidToken(normROrg)) {
        if ((isValidToken(normDoc) && normDoc === normROrg) ||
            (isValidToken(normBen) && normBen === normROrg) ||
            (isValidToken(normAff) && normAff === normROrg)) {
          return true;
        }
      }
      if (isValidToken(normRHosp)) {
        if ((isValidToken(normDoc) && normDoc === normRHosp) ||
            (isValidToken(normBen) && normBen === normRHosp) ||
            (isValidToken(normAff) && normAff === normRHosp)) {
          return true;
        }
      }
    }

    return false;
  }, [normalizeRefName]);

  // Strict Beneficiary-Only Matching helper: Commission strictly belongs to the Beneficiary, NOT the Prescribing Doctor (unless Doctor is Self-Beneficiary)
  const isOrderBeneficiaryMatching = useCallback((ord: DiagnosticOrder, r: ReferringDoctor) => {
    const rawBenName = (ord.commissionBeneficiaryName || '').trim();
    const rawDocName = (ord.referringDoctorName || '').trim();

    if (r.id === 'partner-direct-walkin' || normalizeRefName(r.name) === 'directwalkin') {
      const isBenWalkIn = !ord.commissionBeneficiaryId && (!rawBenName || /walk[\s-]*in|direct|^self$/i.test(rawBenName));
      return isBenWalkIn;
    }

    // Direct check if order beneficiary matches r
    if (ord.commissionBeneficiaryId && ord.commissionBeneficiaryId === r.id) return true;

    const normRName = normalizeRefName(r.name);
    const normROrg = normalizeRefName(r.organizationName);
    const normRHosp = normalizeRefName(r.hospital);

    const normBen = normalizeRefName(rawBenName);
    const normDoc = normalizeRefName(rawDocName);
    const isValidToken = (s: string) => s.length >= 3 && !s.includes('walkin') && !s.includes('direct') && s !== 'self' && s !== 'independentpractice';

    const isOrgEntity = r.affiliationType === 'ORGANIZATION' && (!r.name.toLowerCase().startsWith('dr.') || r.name.toLowerCase() === r.organizationName?.toLowerCase());

    // 1. If explicit beneficiary name exists on the order
    if (isValidToken(normBen)) {
      // Direct match with this partner's own name
      if (isValidToken(normRName) && normBen === normRName) return true;
      // If this partner is an organization entity itself, match its organization name
      if (isOrgEntity && isValidToken(normROrg) && normBen === normROrg) return true;
      // Otherwise, this doctor is NOT the beneficiary of this order!
      return false;
    }

    // 2. If no separate beneficiary is specified, the prescribing doctor is their own self-beneficiary
    if (ord.referringDoctorId && ord.referringDoctorId === r.id) return true;
    if (isValidToken(normDoc) && isValidToken(normRName) && normDoc === normRName) {
      return true;
    }

    return false;
  }, [normalizeRefName]);

  // Dynamically compile all unique Prescribing Doctors and Organizations from both registered roster and actual patient orders
  const availablePrescribingDoctors = useMemo(() => {
    const map = new Map<string, { name: string; count: number }>();
    const getCanonicalName = (rawName: string) => {
      const lower = rawName.trim().toLowerCase();
      if (lower === 'self' || lower === 'atlas self' || lower === 'dr. self') return 'ATLAS SELF';
      if (lower === 'galaxy hospital' || lower === 'galaxy hospital khajrana' || lower === 'galaxy hospital khajrana ') return 'Galaxy hospital khajrana';
      if (lower.includes('deepak') && (lower.includes('geeta') || lower.includes('gita'))) return 'DEEPAK GITA BHAWAN';
      if (lower.includes('irfan') && (lower.includes('thyro') || lower.includes('cear') || lower.includes('care'))) return 'IRFAN THYRO CARE';
      if (lower.includes('loyal') && lower.includes('multi')) return 'LOYAL MULTISPECIALITY';
      if (lower.includes('femida') || lower.includes('fehmida')) return 'FEMIDA AASHA';
      if (/^direct[\s/\\-]*walk[\s-]*in$/i.test(lower) || lower === 'walk-in' || lower === 'walkin' || lower === 'direct') return 'Direct Walk-in';
      return rawName.trim();
    };

    referrers.forEach(r => {
      const name = getCanonicalName(r.name || '');
      if (name) {
        const key = name.toLowerCase();
        if (!map.has(key)) map.set(key, { name, count: 0 });
      }
      const org = getCanonicalName(r.organizationName || '');
      if (org) {
        const key = org.toLowerCase();
        if (!map.has(key)) map.set(key, { name: org, count: 0 });
      }
    });
    allOrders.forEach(ord => {
      if (ord.isDeleted || ord.deletionPendingApproval) return;
      const rawName = (ord.referringDoctorName || '').trim();
      if (rawName) {
        const name = getCanonicalName(rawName);
        const key = name.toLowerCase();
        const existing = map.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          map.set(key, { name, count: 1 });
        }
      }
      const rawAff = ((ord as any).doctorAffiliation || '').trim();
      if (rawAff) {
        const aff = getCanonicalName(rawAff);
        const key = aff.toLowerCase();
        const existing = map.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          map.set(key, { name: aff, count: 1 });
        }
      }
    });
    // Only return beneficiaries that have at least 1 actual affiliated order
    return Array.from(map.values())
      .filter(b => b.count > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [referrers, allOrders]);

  // Dynamically compile all unique Commission Beneficiaries from both registered roster and actual patient orders
  const availableCommissionBeneficiaries = useMemo(() => {
    const map = new Map<string, { name: string; count: number }>();
    const getCanonicalName = (rawName: string) => {
      const lower = rawName.trim().toLowerCase();
      if (lower === 'self' || lower === 'atlas self' || lower === 'dr. self') return 'ATLAS SELF';
      if (lower === 'galaxy hospital' || lower === 'galaxy hospital khajrana' || lower === 'galaxy hospital khajrana ') return 'Galaxy hospital khajrana';
      if (lower.includes('deepak') && (lower.includes('geeta') || lower.includes('gita'))) return 'DEEPAK GITA BHAWAN';
      if (lower.includes('irfan') && (lower.includes('thyro') || lower.includes('cear') || lower.includes('care'))) return 'IRFAN THYRO CARE';
      if (lower.includes('loyal') && lower.includes('multi')) return 'LOYAL MULTISPECIALITY';
      if (lower.includes('femida') || lower.includes('fehmida')) return 'FEMIDA AASHA';
      if (/^direct[\s/\\-]*walk[\s-]*in$/i.test(lower) || lower === 'walk-in' || lower === 'walkin' || lower === 'direct') return 'Direct Walk-in';
      return rawName.trim();
    };

    referrers.forEach(r => {
      const name = getCanonicalName(r.name || '');
      if (name) {
        const key = name.toLowerCase();
        if (!map.has(key)) map.set(key, { name, count: 0 });
      }
      // If it's an organization partner entity, also list the org name
      const isOrgEntity = r.affiliationType === 'ORGANIZATION' || !r.name.toLowerCase().startsWith('dr.');
      if (isOrgEntity && r.organizationName) {
        const org = getCanonicalName(r.organizationName);
        const key = org.toLowerCase();
        if (!map.has(key)) map.set(key, { name: org, count: 0 });
      }
    });
    allOrders.forEach(ord => {
      if (ord.isDeleted || ord.deletionPendingApproval) return;
      const effectiveBenName = (ord.commissionBeneficiaryName || ord.referringDoctorName || '').trim();
      if (effectiveBenName) {
        const name = getCanonicalName(effectiveBenName);
        const key = name.toLowerCase();
        const existing = map.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          map.set(key, { name, count: 1 });
        }
      }
    });
    // Only return beneficiaries that have at least 1 actual affiliated order
    return Array.from(map.values())
      .filter(b => b.count > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [referrers, allOrders]);

  // Filtered Referrers with Date Range & Affiliation Filter
  const filteredReferrers = useMemo(() => {
    // Virtual Partner for Direct Walk-in patients
    const DIRECT_WALKIN_PARTNER: ReferringDoctor = {
      id: 'partner-direct-walkin',
      name: 'Direct Walk-in',
      specialty: 'Center Walk-in Patients',
      hospital: 'Atlas Diagnostics',
      phone: '',
      email: '',
      commissionPct: 0,
      affiliationType: 'SELF',
      organizationName: 'Direct Walk-in',
      status: 'APPROVED',
      totalReferralsCount: 0,
      totalRevenueGenerated: 0,
      totalCommissionEarned: 0,
      payoutPaid: 0,
      qualification: 'Walk-in Billing',
      addedByRole: 'SUPER_ADMIN',
      addedAt: '2026-01-01T00:00:00.000Z'
    };

    const isWalkInFiltered = 
      normalizeRefName(referralBeneficiaryFilter) === 'directwalkin' ||
      normalizeRefName(referralDoctorFilter) === 'directwalkin' ||
      (referralSearch && 'direct walk-in'.includes(referralSearch.toLowerCase().trim()));

    const baseList = isWalkInFiltered ? [...referrers, DIRECT_WALKIN_PARTNER] : referrers;
    // Check if DR. UMAIMA JAMALI exists in referrers to avoid duplicate SWATI row
    const hasUmaima = referrers.some(r => normalizeRefName(r.name) === 'umaimajamali');

    const seenRankKeys = new Set<string>();

    return baseList
      .filter(r => {
        // Deduplicate: If Umaima Jamali is present as an approved/registered doctor with SWATI AL-HAYAT, omit standalone SWATI partner row
        if (hasUmaima && normalizeRefName(r.name) === 'swati') {
          return false;
        }
        // Deduplicate repeated doctor records by normalized name
        const normKey = normalizeRefName(r.name);
        if (normKey) {
          if (seenRankKeys.has(normKey)) return false;
          seenRankKeys.add(normKey);
        }
        return true;
      })
      .map(r => {
      // Strict Beneficiary Matching: Orders and revenue belong strictly to the Beneficiary entity
      const beneficiaryOrders = allOrders.filter(o => 
        !o.isDeleted && !o.deletionPendingApproval &&
        isOrderBeneficiaryMatching(o, r) &&
        isDateInSelectedRange(o.createdAt, referralDateRange, referralStartDate, referralEndDate)
      );
      // Gross Bill Value / MRP Revenue of all affiliated orders
      const periodRevenue = beneficiaryOrders.reduce((sum, o) => sum + (o.subtotal || o.totalAmount || 0), 0);
      const periodCommission = Math.round(beneficiaryOrders.reduce((sum, o) => sum + (o.totalAmount * ((r.commissionPct || 15) / 100)), 0));
      const periodCount = beneficiaryOrders.length;
      return {
        ...r,
        totalRevenueGenerated: periodRevenue,
        totalReferralsCount: periodCount,
        totalCommissionEarned: periodCommission
      };
    }).filter(r => {
      if (referralDoctorFilter !== 'ALL') {
        const qDoc = normalizeRefName(referralDoctorFilter);
        const normR = normalizeRefName(r.name);
        const normOrg = normalizeRefName(r.organizationName);
        if (normR !== qDoc && normOrg !== qDoc && r.id !== referralDoctorFilter) return false;
      }
      if (referralBeneficiaryFilter !== 'ALL') {
        const qBen = normalizeRefName(referralBeneficiaryFilter);
        const normR = normalizeRefName(r.name);
        const normOrg = normalizeRefName(r.organizationName);
        // Only include if this partner itself is the beneficiary, or is an organization partner entity matching qBen
        const isOrgPartner = r.affiliationType === 'ORGANIZATION' && (r.name.toLowerCase() === r.organizationName?.toLowerCase() || !r.name.toLowerCase().startsWith('dr.'));
        if (r.id !== referralBeneficiaryFilter && normR !== qBen && (!isOrgPartner || normOrg !== qBen)) {
          return false;
        }
      }
      if (referralAffiliationFilter === 'SELF' && r.affiliationType === 'ORGANIZATION') return false;
      if (referralAffiliationFilter === 'ORGANIZATION' && r.affiliationType !== 'ORGANIZATION') return false;

      if (referralSearch) {
        const q = referralSearch.toLowerCase();
        const match = (r.name || '').toLowerCase().includes(q) ||
                      (r.hospital || '').toLowerCase().includes(q) ||
                      (r.organizationName && r.organizationName.toLowerCase().includes(q)) ||
                      (r.specialty || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [referrers, allOrders, isOrderMatchingReferrer, normalizeRefName, referralDoctorFilter, referralBeneficiaryFilter, referralDateRange, referralStartDate, referralEndDate, referralAffiliationFilter, referralSearch]);

  const sortedReferrers = [...filteredReferrers].sort((a, b) => b.totalRevenueGenerated - a.totalRevenueGenerated);
  const totalReferralGrossRevenue = sortedReferrers.reduce((sum, r) => sum + r.totalRevenueGenerated, 0);

  // Filtered Referral MIS Orders (Interactive Order-Level Search Engine & Commission Report)
  const filteredReferralMISOrders = useMemo(() => {
    return allOrders.filter(ord => {
      if (ord.isDeleted || ord.deletionPendingApproval) return false;
      const hasReferral = Boolean(
        ord.referringDoctorId ||
        ord.referringDoctorName ||
        ord.commissionBeneficiaryId ||
        ord.commissionBeneficiaryName ||
        (ord as any).doctorAffiliation
      );
      if (!hasReferral) return false;

      const normDoc = normalizeRefName(ord.referringDoctorName);
      const isWalkIn = !ord.referringDoctorId && (!ord.referringDoctorName || /walk[\s-]*in|direct|^self$/i.test(ord.referringDoctorName));
      const prescribingDoc = isWalkIn ? undefined : referrers.find(r =>
        (ord.referringDoctorId && r.id === ord.referringDoctorId) ||
        (normDoc.length >= 3 && normalizeRefName(r.name) === normDoc)
      );

      // 1. Prescribing Doctor / Org Filter
      if (referralDoctorFilter !== 'ALL') {
        const qDoc = normalizeRefName(referralDoctorFilter);
        const normAff = normalizeRefName((ord as any).doctorAffiliation || prescribingDoc?.organizationName || prescribingDoc?.hospital);
        const matchesDoc =
          (normDoc.length >= 3 && (normDoc === qDoc || normDoc.includes(qDoc))) ||
          (normAff.length >= 3 && (normAff === qDoc || normAff.includes(qDoc))) ||
          (ord.referringDoctorId && ord.referringDoctorId === referralDoctorFilter) ||
          (prescribingDoc && prescribingDoc.id === referralDoctorFilter);
        if (!matchesDoc) return false;
      }

      // 2. Commission Beneficiary Filter
      if (referralBeneficiaryFilter !== 'ALL') {
        const qBen = normalizeRefName(referralBeneficiaryFilter);
        // Effective beneficiary: explicit commissionBeneficiaryName, or fallback to prescribing doctor if none set
        const effectiveBenName = ord.commissionBeneficiaryName || ord.referringDoctorName || '';
        const normBen = normalizeRefName(effectiveBenName);
        const matchesBen =
          (normBen.length >= 3 && normBen === qBen) ||
          (ord.commissionBeneficiaryId && (ord.commissionBeneficiaryId === referralBeneficiaryFilter || normalizeRefName(ord.commissionBeneficiaryId) === qBen));
        if (!matchesBen) return false;
      }

      // 3. Affiliation Type Filter
      if (referralAffiliationFilter !== 'ALL') {
        const normAff = normalizeRefName((ord as any).doctorAffiliation || prescribingDoc?.organizationName);
        const isOrg = prescribingDoc?.affiliationType === 'ORGANIZATION' || Boolean(normAff);
        if (referralAffiliationFilter === 'SELF' && isOrg) return false;
        if (referralAffiliationFilter === 'ORGANIZATION' && !isOrg) return false;
      }

      // 4. Date Range Filter
      if (!isDateInSelectedRange(ord.createdAt, referralDateRange, referralStartDate, referralEndDate)) return false;

      // 5. Search Box: Search across Doctor Name, Affiliation, Patient Name, Phone, UHID, Invoice Number, Tests
      if (referralSearch.trim()) {
        const q = referralSearch.toLowerCase().trim();
        const docAffStr = ((ord as any).doctorAffiliation || prescribingDoc?.organizationName || prescribingDoc?.hospital || '').toLowerCase();
        const matchesPatient = (ord.patient?.name || '').toLowerCase().includes(q) ||
          (ord.patient?.phone || '').includes(q) ||
          (ord.patientId || '').toLowerCase().includes(q);
        const matchesDoctor = (ord.referringDoctorName || '').toLowerCase().includes(q) ||
          (ord.commissionBeneficiaryName || '').toLowerCase().includes(q) ||
          docAffStr.includes(q);
        const matchesInvoice = (ord.invoiceNumber || '').toLowerCase().includes(q);
        const matchesTests = (ord.tests || []).some(t => (t?.name || '').toLowerCase().includes(q));

        if (!matchesPatient && !matchesDoctor && !matchesInvoice && !matchesTests) return false;
      }

      return true;
    }).map(ord => {
      const normDoc = normalizeRefName(ord.referringDoctorName);
      const isWalkIn = !ord.referringDoctorId && (!ord.referringDoctorName || /walk[\s-]*in|direct|^self$/i.test(ord.referringDoctorName));
      const prescribingDoc = isWalkIn ? undefined : referrers.find(r =>
        (ord.referringDoctorId && r.id === ord.referringDoctorId) ||
        (normDoc.length >= 3 && normalizeRefName(r.name) === normDoc)
      );
      const beneficiaryDoc = (!isWalkIn && ord.commissionBeneficiaryId)
        ? referrers.find(r => r.id === ord.commissionBeneficiaryId)
        : (!isWalkIn && ord.commissionBeneficiaryName)
          ? referrers.find(r => {
              const nb = normalizeRefName(ord.commissionBeneficiaryName);
              return nb.length >= 3 && (normalizeRefName(r.name) === nb || normalizeRefName(r.organizationName) === nb || normalizeRefName(r.hospital) === nb);
            })
          : prescribingDoc;

      const doctorName = ord.referringDoctorName || prescribingDoc?.name || 'Direct Walk-in';
      const rawAffiliation = isWalkIn
        ? ''
        : ((ord as any).doctorAffiliation || prescribingDoc?.organizationName || prescribingDoc?.hospital || '');
      const doctorAffiliation = (rawAffiliation && !/^(independent practice|self|walk[\s-]*in|direct)$/i.test(rawAffiliation.trim()))
        ? rawAffiliation.trim()
        : '';
      const beneficiaryName = isWalkIn
        ? 'Direct Walk-in'
        : (ord.commissionBeneficiaryName || beneficiaryDoc?.organizationName || beneficiaryDoc?.name || doctorName);

      return {
        order: ord,
        doctorName,
        doctorAffiliation,
        beneficiaryName,
        beneficiaryOrg: doctorAffiliation,
        refDoc: beneficiaryDoc || prescribingDoc
      };
    });
  }, [allOrders, referrers, isOrderMatchingReferrer, normalizeRefName, referralDoctorFilter, referralBeneficiaryFilter, referralAffiliationFilter, referralDateRange, referralStartDate, referralEndDate, referralSearch]);

  // Test-level flattened rows for MIS report so Super Admin can view and assign commission per diagnostic investigation separately
  const misTestRows = useMemo(() => {
    return filteredReferralMISOrders.flatMap(({ order: ord, doctorName, doctorAffiliation, beneficiaryName, beneficiaryOrg, refDoc }) => {
      const tests = (ord.tests && ord.tests.length > 0)
        ? ord.tests
        : [{ id: 't-default', name: 'Diagnostic Investigation', code: 'DIAG', category: 'Pathology' as DiagnosticCategory, price: ord.totalAmount, tatHours: 4 }];

      return tests.map((t, idx) => {
        const testKey = `${ord.id}_${t.id || idx}`;
        const testPrice = t.price !== undefined && t.price !== null ? t.price : (tests.length > 0 ? Math.round(ord.totalAmount / tests.length) : ord.totalAmount);
        const commPct = customCommissionMap[testKey] !== undefined ? customCommissionMap[testKey] : 0;
        const commEarned = Math.round(testPrice * (commPct / 100));

        return {
          order: ord,
          test: t,
          testKey,
          testIndex: idx,
          testPrice,
          commPct,
          commEarned,
          doctorName,
          doctorAffiliation,
          beneficiaryName,
          beneficiaryOrg,
          refDoc,
          isFirstInOrder: idx === 0,
          totalTestsInOrder: tests.length
        };
      });
    });
  }, [filteredReferralMISOrders, customCommissionMap]);

  // Orders sorted in strict ASCENDING chronological order for MIS Report printing and viewing
  const misReportOrdersAsc = useMemo(() => {
    return [...filteredReferralMISOrders].sort((a, b) => {
      const timeA = new Date(a.order.createdAt || 0).getTime();
      const timeB = new Date(b.order.createdAt || 0).getTime();
      if (timeA !== timeB) return timeA - timeB;
      return (a.order.invoiceNumber || '').localeCompare(b.order.invoiceNumber || '');
    });
  }, [filteredReferralMISOrders]);

  // Consolidated Order Bill totals for Grouped MIS view
  const misOrderTotalMRP = useMemo(() => {
    return filteredReferralMISOrders.reduce((sum, { order }) => sum + (order.subtotal || order.totalAmount || 0), 0);
  }, [filteredReferralMISOrders]);

  const misOrderTotalDiscount = useMemo(() => {
    return filteredReferralMISOrders.reduce((sum, { order }) => sum + (order.discountAmount || 0), 0);
  }, [filteredReferralMISOrders]);

  const misOrderTotalPaid = useMemo(() => {
    return filteredReferralMISOrders.reduce((sum, { order }) => sum + (order.paidAmount || 0), 0);
  }, [filteredReferralMISOrders]);

  const misOrderTotalDue = useMemo(() => {
    return filteredReferralMISOrders.reduce((sum, { order }) => sum + (order.dueAmount || 0), 0);
  }, [filteredReferralMISOrders]);

  const resolveBilledByName = useCallback((ord: DiagnosticOrder): string => {
    const raw = (ord.createdByStaffName || '').trim();
    if (raw && !['reception desk', 'reception staff', 'receptionist', 'admin', 'desk', 'undefined', 'null'].includes(raw.toLowerCase())) {
      return raw.replace(/\s*\((Reception Staff|Super Admin|Center Manager|Receptionist)\)/i, '').trim() || raw;
    }
    if (ord.createdByStaffId) {
      const found = staff.find(s => s.id === ord.createdByStaffId);
      if (found && found.name) return found.name;
    }
    const rec = staff.find(s => s.role === 'Receptionist' || s.username === 'TASHI' || s.name.toLowerCase().includes('tash'));
    if (rec && rec.name) return rec.name;
    return 'Tashmiya';
  }, [staff]);

  // Breakdown of Referred Diagnostics by Modality per Doctor / Partner
  const doctorDiagnosticsBreakdown = useMemo(() => {
    const map = new Map<string, Record<string, number>>();
    allOrders.forEach(ord => {
      if (ord.isDeleted || ord.deletionPendingApproval) return;
      const docKey = (ord.referringDoctorName || '').trim().toLowerCase();
      if (!docKey) return;
      if (!map.has(docKey)) {
        map.set(docKey, { MRI: 0, CT: 0, USG: 0, XRay: 0, Pathology: 0, Cardiology: 0, Other: 0 });
      }
      const entry = map.get(docKey)!;
      ord.tests.forEach(t => {
        const cat = t.category;
        const dept = (t.department || '').toLowerCase();
        const sub = (t.subDepartment || '').toLowerCase();
        if (dept.includes('mri') || sub.includes('mri')) entry.MRI += 1;
        else if (dept.includes('ct') || sub.includes('ct')) entry.CT += 1;
        else if (dept.includes('ultrasound') || dept.includes('sonography') || sub.includes('usg')) entry.USG += 1;
        else if (dept.includes('x-ray') || sub.includes('x-ray')) entry.XRay += 1;
        else if (cat === 'Pathology' || dept.includes('pathology') || dept.includes('blood') || dept.includes('hematology')) entry.Pathology += 1;
        else if (cat === 'Cardiology' || dept.includes('cardio') || dept.includes('ecg') || dept.includes('echo')) entry.Cardiology += 1;
        else entry.Other += 1;
      });
    });
    return map;
  }, [allOrders]);

  const misTotalMRP = misTestRows.reduce((sum, item) => sum + item.testPrice, 0);
  const misTotalDiscount = misTestRows.reduce((sum, item) => {
    const mrp = item.testPrice;
    const ord = item.order;
    const d = ord.subtotal > 0 ? Math.round((ord.discountAmount || 0) * (mrp / ord.subtotal)) : (item.totalTestsInOrder === 1 ? (ord.discountAmount || 0) : 0);
    return sum + d;
  }, 0);
  const misTotalPaid = misTestRows.reduce((sum, item) => {
    const mrp = item.testPrice;
    const ord = item.order;
    const p = ord.subtotal > 0 ? Math.round((ord.paidAmount || 0) * (mrp / ord.subtotal)) : (item.totalTestsInOrder === 1 ? (ord.paidAmount || 0) : mrp);
    return sum + p;
  }, 0);
  const misTotalDue = Math.max(0, misTotalMRP - misTotalDiscount - misTotalPaid);
  const misGrossRevenue = misTotalMRP;
  const misTotalCommission = misTestRows.reduce((sum, item) => sum + item.commEarned, 0);
  const misTotalPaidOut = useMemo(() => {
    if (referralBeneficiaryFilter !== 'ALL') {
      const doc = referrers.find(
        r => r.name.toLowerCase() === referralBeneficiaryFilter.toLowerCase() ||
             (r.organizationName && r.organizationName.toLowerCase() === referralBeneficiaryFilter.toLowerCase()) ||
             r.id === referralBeneficiaryFilter
      );
      if (doc) return doc.payoutPaid || 0;
    }
    if (referralDoctorFilter !== 'ALL') {
      const doc = referrers.find(
        r => r.name.toLowerCase() === referralDoctorFilter.toLowerCase() || r.id === referralDoctorFilter
      );
      if (doc) return doc.payoutPaid || 0;
    }
    return referrers.reduce((s, r) => s + (r.payoutPaid || 0), 0);
  }, [referrers, referralDoctorFilter, referralBeneficiaryFilter]);
  const misBalancePayable = Math.max(0, misTotalCommission - misTotalPaidOut);

  // Filtered Activities with Employee/Role, Staff Member, Date Selection, Action Type, and Search
  const filteredActivities = useMemo(() => {
    return activities.filter(act => {
      // Security Guard: Center Manager cannot see activities or logins of Super Admin
      if (!isSuperAdmin) {
        if (
          act.actorRole === 'SUPER_ADMIN' ||
          act.metadata?.role === 'SUPER_ADMIN' ||
          (act.actorName || '').toLowerCase().includes('admin') ||
          (act.actorName || '').toLowerCase().includes('director') ||
          (act.details || '').toLowerCase().includes('administrator') ||
          (act.details || '').toLowerCase().includes('super admin')
        ) {
          return false;
        }
      }

      // 1. Action Type Filter
      if (activityTypeFilter !== 'ALL' && act.actionType !== activityTypeFilter) return false;

      // 2. Role / Employee Designation Filter
      if (activityRoleFilter !== 'ALL') {
        if (act.actorRole !== activityRoleFilter) return false;
      }

      // 3. Specific Employee / Staff Member Filter
      if (activityStaffFilter !== 'ALL') {
        const staffObj = staff.find(s => s.id === activityStaffFilter);
        const nameToMatch = staffObj ? staffObj.name.toLowerCase() : activityStaffFilter.toLowerCase();
        const actName = (act.actorName || '').toLowerCase();
        const staffIdMatch = act.metadata?.staffId === activityStaffFilter;
        if (!actName.includes(nameToMatch) && !staffIdMatch) {
          return false;
        }
      }

      // 4. Date Selection & Start/End Date Range Filter
      if (!isDateInSelectedRange(act.timestamp, activityDateRange, activityStartDate, activityEndDate)) return false;

      // 5. Search Text Filter
      if (activitySearch) {
        const q = activitySearch.toLowerCase();
        const match =
          (act.details || '').toLowerCase().includes(q) ||
          (act.actorName || '').toLowerCase().includes(q) ||
          (act.actorRole || '').toLowerCase().includes(q) ||
          (act.actionType || '').toLowerCase().includes(q) ||
          (act.centerCode && act.centerCode.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [
    activities,
    activityTypeFilter,
    activityRoleFilter,
    activityStaffFilter,
    activityDateRange,
    activityStartDate,
    activityEndDate,
    activitySearch,
    isSuperAdmin,
    staff
  ]);

  // Filtered Expenses with Category, Date Range, and Search
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      if (expCategoryFilter !== 'ALL' && exp.category !== expCategoryFilter) return false;
      if (expPaymentModeFilter !== 'ALL' && exp.paymentMode !== expPaymentModeFilter) return false;
      if (!isDateInSelectedRange(exp.date, expDateRange, expStartDate, expEndDate)) return false;
      if (expSearch) {
        const q = expSearch.toLowerCase();
        const match =
          (exp.title || '').toLowerCase().includes(q) ||
          (exp.receiptNo && exp.receiptNo.toLowerCase().includes(q)) ||
          (exp.paidTo && exp.paidTo.toLowerCase().includes(q)) ||
          (exp.category && exp.category.toLowerCase().includes(q)) ||
          (exp.paymentMode && exp.paymentMode.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [expenses, expCategoryFilter, expPaymentModeFilter, expDateRange, expStartDate, expEndDate, expSearch]);

  const totalFilteredExpensesAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Filtered Tests
  const filteredTests = useMemo(() => {
    return tests.filter(t => {
      if (testCategoryFilter !== 'ALL' && t.category !== testCategoryFilter) return false;
      const effectiveSub = (t.subDepartment || resolveTestSubDepartment(t) || '').trim();
      if (testSubDepartmentFilter !== 'ALL') {
        if (effectiveSub.toLowerCase() !== testSubDepartmentFilter.toLowerCase()) return false;
      }
      if (testSearch) {
        const q = testSearch.toLowerCase();
        return (t.name || '').toLowerCase().includes(q) ||
               (t.code || '').toLowerCase().includes(q) ||
               (t.department || '').toLowerCase().includes(q) ||
               effectiveSub.toLowerCase().includes(q);
      }
      return true;
    });
  }, [tests, testCategoryFilter, testSubDepartmentFilter, testSearch]);

  // Filtered Orders for Patient Orders Tab (Excludes quarantined deletions)
  const filteredAdminOrders = useMemo(() => {
    return allOrders.filter(ord => {
      if (ord.isDeleted || ord.deletionPendingApproval) return false;
      if (orderCenterFilter !== 'ALL' && ord.centerId !== orderCenterFilter) return false;
      if (orderPaymentFilter === 'PAID' && ord.dueAmount > 0) return false;
      if (orderPaymentFilter === 'DUE' && ord.dueAmount <= 0) return false;

      const isMatchDate =
        isDateInSelectedRange(ord.createdAt, orderDateRange, orderStartDate, orderEndDate) ||
        (ord.appointmentDate ? isDateInSelectedRange(ord.appointmentDate, orderDateRange, orderStartDate, orderEndDate) : false);
      if (!isMatchDate) return false;

      if (orderSearch) {
        const q = orderSearch.toLowerCase();
        const match =
          (ord.patient?.name || '').toLowerCase().includes(q) ||
          (ord.patientId || '').toLowerCase().includes(q) ||
          (ord.invoiceNumber || '').toLowerCase().includes(q) ||
          (ord.id || '').toLowerCase().includes(q) ||
          (ord.tests || []).some(t => (t?.name || '').toLowerCase().includes(q)) ||
          (ord.createdByStaffName && ord.createdByStaffName.toLowerCase().includes(q)) ||
          (ord.referringDoctorName && ord.referringDoctorName.toLowerCase().includes(q)) ||
          (ord.commissionBeneficiaryName && ord.commissionBeneficiaryName.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [allOrders, orderCenterFilter, orderPaymentFilter, orderDateRange, orderStartDate, orderEndDate, orderSearch]);

  const totalAdminOrdersMRP = Math.round(
    filteredAdminOrders.reduce(
      (sum, o) => sum + (o.subtotal || o.tests.reduce((s, t) => s + t.price, 0)),
      0
    )
  );
  const totalAdminOrdersDiscount = Math.round(filteredAdminOrders.reduce((sum, o) => sum + (o.discountAmount || 0), 0));
  const totalAdminOrdersPaid = Math.round(filteredAdminOrders.reduce((sum, o) => sum + (o.paidAmount || 0), 0));
  const totalAdminOrdersDue = Math.round(filteredAdminOrders.reduce((sum, o) => sum + (o.dueAmount || 0), 0));
  const totalAdminOrdersCash = Math.round(
    filteredAdminOrders.reduce((sum, o) => {
      const split = getOrderPaymentSplit(o);
      const refund = o.refundMode === 'Cash' ? (o.refundAmount || 0) : 0;
      return sum + Math.max(0, split.cash - refund);
    }, 0)
  );
  const totalAdminOrdersOnline = Math.round(
    filteredAdminOrders.reduce((sum, o) => {
      const split = getOrderPaymentSplit(o);
      const refund = o.refundMode && o.refundMode !== 'Cash' ? (o.refundAmount || 0) : 0;
      return sum + Math.max(0, split.online - refund);
    }, 0)
  );
  const totalAdminOrdersRefunds = Math.round(filteredAdminOrders.reduce((sum, o) => sum + (o.refundAmount || 0), 0));

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-sky-900 border border-sky-600 text-white rounded-2xl shadow-2xl animate-fade-in text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-cyan-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Command Banner Header */}
      <div className="p-5 sm:p-6 bg-white border border-sky-100 rounded-3xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-200 shadow-xs shrink-0">
            <Crown className="w-7 h-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Owner & Enterprise MIS Command Center
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                Full Multi-Branch Access
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Financial P&L, Patient Orders, Staff Attendance, Activity Audit Log, Test Catalog & Branch Management
            </p>
          </div>
        </div>

        {/* Right Info: Active Branch Hub indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2 text-xs">
            <Building2 className="w-4 h-4 text-sky-600 shrink-0" />
            <div className="flex flex-col text-left">
              <span className="text-[9px] uppercase font-bold text-slate-500 leading-none">Viewing Branch</span>
              <span className="font-extrabold text-slate-900 text-xs mt-0.5 whitespace-nowrap">
                {selectedCenter.name} ({selectedCenter.code})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dedicated Full-Width Tab Bar (Flex-wrap without slider/scrollbar) */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-xs">
        {[
          { id: 'DASHBOARD', label: 'Dashboard' },
          { id: 'ALL_ORDERS', label: `Patient Orders (${allOrders.length})` },
          { 
            id: 'DOCTOR_ROSTER', 
            label: `Doctor's Roster (${doctorRoster?.length ?? 0})`,
            badge: doctorRoster?.some(d => d.status === 'ON_DUTY'),
            badgeColor: 'bg-teal-400'
          },
          { 
            id: 'REFERRAL_LEADERBOARD', 
            label: `Referrals & Approvals ${pendingReferrers.length > 0 ? `(${pendingReferrers.length} Pending)` : ''}`,
            badge: pendingReferrers.length > 0,
            badgeColor: 'bg-amber-400'
          },
          { id: 'TEST_CATALOG', label: `Test Catalog (${tests.length})` },
          { 
            id: 'ATTENDANCE', 
            label: `Staff Attendance ${onlineStaffList.length > 0 ? `(${onlineStaffList.length} Online)` : ''}`,
            badge: onlineStaffList.length > 0,
            badgeColor: 'bg-emerald-400'
          },
          { id: 'PAYROLL', label: 'Staff Credentials' },
          { 
            id: 'DELETION_APPROVALS', 
            label: `Deletion Gate ${pendingDeletions.length > 0 ? `(${pendingDeletions.length})` : ''}`,
            badge: pendingDeletions.length > 0,
            badgeColor: 'bg-rose-500'
          },
          { id: 'EXPENSES', label: 'Expenses & AMC' },
          ...(isSuperAdmin ? [{ id: 'BRANCHES', label: `Center Branches (${centers.length})` }] : []),
          { id: 'ACTIVITY_LOG', label: 'Recent Activity Log' },
          { id: 'MIS_OVERVIEW', label: 'Financial MIS' },
        ].filter(tab => {
          if (!isSuperAdmin) {
            // Hide Staff Credentials, Deletion Gate, Referral & Approvals, and Center & Branches from Manager
            if (['DELETION_APPROVALS', 'PAYROLL', 'REFERRAL_LEADERBOARD', 'BRANCHES'].includes(tab.id)) {
              return false;
            }
          }
          return true;
        }).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>{tab.label}</span>
            {tab.badge && (
              <span className={`w-2 h-2 rounded-full ${tab.badgeColor || 'bg-amber-400'} animate-ping`} />
            )}
          </button>
        ))}
      </div>

      {/* TAB: INTERACTIVE CLICKABLE DASHBOARD */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6">

            {/* Executive Welcome & Live Ops Status Strip */}
          <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-3xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800">
                  Live Enterprise Command Hub
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-1.5">
                Executive Diagnostics Dashboard
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time Net P&L financial portal, live staff duty attendance roster, and total patient orders registry.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setCurrentRole('RECEPTIONIST')}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
                title="Create Patient Invoices, Book Appointments & Manage Billing"
              >
                <Plus className="w-4 h-4" />
                <span>+ Make New Invoice</span>
              </button>
              <button
                type="button"
                onClick={handlePullOrders}
                disabled={isPullingOrders}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 cursor-pointer disabled:opacity-60"
                title="Refresh and sync data directly from Google Sheets"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPullingOrders ? 'animate-spin' : ''}`} />
                <span>{isPullingOrders ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            </div>
          </div>
          {/* DASHBOARD REAL-TIME DATE RANGE FILTER CONTROL */}
          <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-xl border border-sky-200/50 dark:border-sky-800/50">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Dashboard Analytics Period:
                </span>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                  {dashboardDateRange === 'ALL'
                    ? 'All-Time Cumulative'
                    : dashboardDateRange === 'TODAY'
                      ? "Today's Live Statistics"
                      : dashboardDateRange === 'YESTERDAY'
                        ? "Yesterday's Performance"
                        : dashboardDateRange === 'THIS_WEEK'
                          ? 'Past 7 Days Window'
                          : dashboardDateRange === 'THIS_MONTH'
                            ? 'Current Month Overview'
                            : `${dashboardStartDate} to ${dashboardEndDate}`}
                  {' • '}
                  <span className="font-semibold text-slate-500 dark:text-slate-400">
                    {dashboardMetrics.orderCount} Orders ({dashboardMetrics.isProfit ? '+' : '-'}₹{Math.abs(dashboardMetrics.netPnL).toLocaleString()} Net)
                  </span>
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700/60">
                {[
                  { id: 'ALL', label: 'All Time' },
                  { id: 'TODAY', label: 'Today' },
                  { id: 'YESTERDAY', label: 'Yesterday' },
                  { id: 'THIS_WEEK', label: '7 Days' },
                  { id: 'THIS_MONTH', label: 'This Month' },
                  { id: 'CUSTOM', label: 'Custom' }
                ].map(chip => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => {
                      const newPreset = chip.id as DatePresetType;
                      setDashboardDateRange(newPreset);
                      if (newPreset !== 'CUSTOM') {
                        const dates = computePresetDates(newPreset);
                        setDashboardStartDate(dates.startDate);
                        setDashboardEndDate(dates.endDate);
                      } else {
                        const todayStr = getLocalYYYYMMDD();
                        if (!dashboardStartDate) setDashboardStartDate(todayStr);
                        if (!dashboardEndDate) setDashboardEndDate(todayStr);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-[11px] font-bold ${
                      dashboardDateRange === chip.id
                        ? 'bg-sky-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {dashboardDateRange === 'CUSTOM' && (
                <div className="flex items-center gap-1.5 animate-fade-in">
                  <input
                    type="date"
                    value={dashboardStartDate}
                    onChange={e => setDashboardStartDate(e.target.value)}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs cursor-pointer"
                  />
                  <span className="text-slate-400 text-xs">to</span>
                  <input
                    type="date"
                    value={dashboardEndDate}
                    onChange={e => setDashboardEndDate(e.target.value)}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs cursor-pointer"
                  />
                </div>
              )}

              {dashboardDateRange !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => {
                    setDashboardDateRange('ALL');
                    setDashboardStartDate('');
                    setDashboardEndDate('');
                  }}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  title="Reset to All-Time view"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* 3 CORE CLICKABLE TILES - Unified Clean Aesthetics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* TILE 1: NET PROFIT OR LOSS TILE (Clickable) */}
            {(() => {
              const isProfit = dashboardMetrics.isProfit;

              return (
                <div
                  onClick={() => setIsFinancialDrilldownOpen(true)}
                  className="relative overflow-hidden p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 active:scale-95 group"
                  title="Click to open complete Financial Profit & Loss Breakdown"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isProfit
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                          : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 animate-pulse'
                      }`}
                    >
                      {isProfit ? 'Net Operating Balance' : 'Net Loss (In Red)'}
                    </span>
                    <div
                      className={`p-2.5 rounded-2xl ${
                        isProfit
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                      }`}
                    >
                      {isProfit ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    </div>
                  </div>

                  <div className="mt-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      Net Balance ({dashboardDateLabel})
                    </span>
                    <div
                      className={`text-3xl sm:text-4xl font-black tracking-tight mt-1 ${
                        isProfit ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isProfit ? '+' : '-'}₹{Math.abs(dashboardMetrics.netPnL).toLocaleString()}
                    </div>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Incoming Revenue</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">₹{dashboardMetrics.totalPaid.toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Operating Expenses</span>
                      <span className="font-extrabold text-rose-600 dark:text-rose-400 text-sm">₹{dashboardMetrics.totalExp.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs font-bold text-sky-600 dark:text-sky-400 group-hover:translate-x-0.5 transition-transform">
                    <span>View full financial drill-down</span>
                    <span className="text-sm">→</span>
                  </div>
                </div>
              );
            })()}

            {/* TILE 2: LIVE STAFF ATTENDANCE TILE (Clickable) */}
            <div
              onClick={() => {
                setSelectedDrilldownStaff(null);
                setIsStaffAttendanceDrilldownOpen(true);
              }}
              className="relative overflow-hidden p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 active:scale-95 group"
              title="Click to view all logged-in staff and their individual activities & invoices"
            >
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800">
                  Live Staff Duty
                </span>
                <div className="p-2.5 rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Staff Logged In Right Now
                </span>
                <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                  {onlineStaffList.length}{' '}
                  <span className="text-base font-bold text-slate-400">/ {staff.length} Logged In</span>
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Online / Active</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">{onlineStaffList.length} On Duty</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Offline / Logged Out</span>
                  <span className="font-extrabold text-slate-500 dark:text-slate-400 text-sm">{Math.max(0, staff.length - onlineStaffList.length)} Staff</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs font-bold text-sky-600 dark:text-sky-400 group-hover:translate-x-0.5 transition-transform">
                <span>Inspect staff logins & attendance</span>
                <span className="text-sm">→</span>
              </div>
            </div>

            {/* TILE 3: TOTAL ORDERS PLACED TILE (Clickable) */}
            <div
              onClick={() => setIsOrdersDrilldownOpen(true)}
              className="relative overflow-hidden p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 active:scale-95 group"
              title="Click to view all orders, who generated them, and invoice pricing"
            >
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                  Total Orders Placed
                </span>
                <div className="p-2.5 rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <Receipt className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Orders Registered ({dashboardDateLabel})
                </span>
                <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                  {dashboardFilteredOrders.length}{' '}
                  <span className="text-base font-bold text-slate-400">Total Bookings</span>
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Total Tariff MRP</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">₹{dashboardMetrics.totalMRP.toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Total Collected</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">₹{dashboardMetrics.totalPaid.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs font-bold text-sky-600 dark:text-sky-400 group-hover:translate-x-0.5 transition-transform">
                <span>Inspect invoices, creators & prices</span>
                <span className="text-sm">→</span>
              </div>
            </div>
          </div>
          {/* Quick Operations Grid: Workstation Shortcuts & Collections Channel Balance */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Workstation Shortcuts - Spans 7 cols */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
                <Sliders className="w-4 h-4 text-sky-600" />
                <span>Workstation Shortcuts</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('ALL_ORDERS')}
                  className="w-full text-left p-3.5 rounded-2xl bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-slate-800 transition-all flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Receipt className="w-4 h-4 text-sky-600" />
                    <span>Patient Orders Registry</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">{allOrders.length}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('MIS_OVERVIEW')}
                  className="w-full text-left p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-800 transition-all flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <PieChart className="w-4 h-4 text-emerald-600" />
                    <span>Financial MIS & Revenue</span>
                  </div>
                  <span className="text-xs text-emerald-700 font-bold">P&L Portal</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('TEST_CATALOG')}
                  className="w-full text-left p-3.5 rounded-2xl bg-slate-50 hover:bg-cyan-50 border border-slate-200 hover:border-cyan-300 text-slate-800 transition-all flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <ActivityIcon className="w-4 h-4 text-cyan-600" />
                    <span>Test Catalog & Modalities</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">{tests.length} tests</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('EXPENSES')}
                  className="w-full text-left p-3.5 rounded-2xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-slate-800 transition-all flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Wallet className="w-4 h-4 text-amber-600" />
                    <span>Expenses & Operating AMC</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">{allExpenses.length} entries</span>
                </button>
              </div>
            </div>

            {/* Collections Cash vs Online Summary Widget - Spans 5 cols */}
            <div className="lg:col-span-5 p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    Collections Channel Balance
                  </span>
                  <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
                    Live Balance
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-3">
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">Cash Counter</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white mt-0.5 block">₹{totalAdminOrdersCash.toLocaleString()}</span>
                  </div>
                  <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/50">
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block uppercase font-bold">Online (UPI/POS)</span>
                    <span className="text-lg font-black text-emerald-700 dark:text-emerald-400 mt-0.5 block">₹{totalAdminOrdersOnline.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Pending Due Balance:</span>
                <span className="font-extrabold text-rose-600 dark:text-rose-400 text-sm">₹{totalAdminOrdersDue.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ALL PATIENT ORDERS & BILLS */}
      {activeTab === 'ALL_ORDERS' && (
        <div className="space-y-6">
          {/* Sub-view switcher: Orders Ledger vs Register New Patient Order */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-sky-100 rounded-2xl p-2 sm:p-2.5 shadow-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAdminOrdersViewMode('LEDGER')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  adminOrdersViewMode === 'LEDGER'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>Orders Ledger ({filteredAdminOrders.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setAdminOrdersViewMode('NEW_ORDER')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  adminOrdersViewMode === 'NEW_ORDER'
                    ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>+ Register Patient Order / New Bill</span>
              </button>
            </div>
            {adminOrdersViewMode === 'NEW_ORDER' && (
              <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Entries are auto-saved in real-time when switching tabs
              </span>
            )}
          </div>

          {adminOrdersViewMode === 'NEW_ORDER' ? (
            <div className="bg-transparent">
              <ReceptionPortal />
            </div>
          ) : (
            <>
              {/* Top Summary Metrics with Cash & Online Income Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="p-4 bg-white border border-sky-100 rounded-2xl shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Orders</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">{filteredAdminOrders.length}</span>
              <span className="text-[10px] text-slate-400">All active bookings</span>
            </div>

            <div className="p-4 bg-white border border-sky-100 rounded-2xl shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total MRP</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">₹{totalAdminOrdersMRP.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400">Gross test tariff</span>
            </div>

            <div className="p-4 bg-white border border-emerald-100 rounded-2xl shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                <Banknote className="w-3 h-3 text-emerald-600" /> Cash Income
              </span>
              <span className="text-xl font-black text-emerald-700 mt-1 block">₹{totalAdminOrdersCash.toLocaleString()}</span>
              <span className="text-[10px] text-emerald-600">Physical cash in counter</span>
            </div>

            <div className="p-4 bg-white border border-sky-100 rounded-2xl shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 flex items-center gap-1">
                <QrCode className="w-3 h-3 text-sky-600" /> Online Income
              </span>
              <span className="text-xl font-black text-sky-700 mt-1 block">₹{totalAdminOrdersOnline.toLocaleString()}</span>
              <span className="text-[10px] text-sky-600">UPI, QR & Card payments</span>
            </div>

            <div className="p-4 bg-white border border-sky-100 rounded-2xl shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">Total Collected</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">₹{totalAdminOrdersPaid.toLocaleString()}</span>
              <span className="text-[10px] text-slate-500">Collected in advance/full</span>
            </div>

            <div className="p-4 bg-white border border-amber-100 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">Due Balance</span>
                {totalAdminOrdersRefunds > 0 && (
                  <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1 rounded">
                    ₹{totalAdminOrdersRefunds.toLocaleString()} Ref
                  </span>
                )}
              </div>
              <span className="text-xl font-black text-rose-700 mt-1 block">₹{totalAdminOrdersDue.toLocaleString()}</span>
              <span className="text-[10px] text-rose-600">Pending collections</span>
            </div>
          </div>

          {/* Orders Filter and Search Bar */}
          <div className="bg-white border border-sky-100 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-sky-600" />
                  All Patient Orders & Audit Registry ({filteredAdminOrders.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete order ledger: Date, Patient Name, Referring Doctor, Investigation, MRP, Discount, Paid Amount, and Balance Due.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Make New Invoice Button (Manager and Admin can create invoices) */}
                <button
                  type="button"
                  onClick={() => setAdminOrdersViewMode('NEW_ORDER')}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                  title="Open Reception Desk to Create Patient Invoice"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>+ Make New Invoice</span>
                </button>

                <button
                  type="button"
                  onClick={handlePullOrders}
                  disabled={isPullingOrders}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-60"
                  title="Pull latest orders directly from Google Sheets"
                >
                  <DownloadCloud className={`w-3.5 h-3.5 ${isPullingOrders ? 'animate-bounce' : ''}`} />
                  <span>{isPullingOrders ? 'Pulling Orders...' : 'Pull from Sheets'}</span>
                </button>


                <span className="text-xs text-slate-500 font-bold ml-1">Filter Center:</span>
                <select
                  value={orderCenterFilter}
                  onChange={e => setOrderCenterFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="ALL">All Branches ({centers.length})</option>
                  {centers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
              {/* Search input */}
              <div className="relative w-full lg:w-96">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={e => setOrderSearch(e.target.value)}
                  placeholder="Search by Patient Name, Phone, UHID, Invoice or Test..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
                {/* Date Range Filter with conditional Start & End date pickers */}
                <DateRangeFilter
                  preset={orderDateRange}
                  startDate={orderStartDate}
                  endDate={orderEndDate}
                  onPresetChange={setOrderDateRange}
                  onStartDateChange={setOrderStartDate}
                  onEndDateChange={setOrderEndDate}
                />

                {/* Payment Status Filter */}
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                  {[
                    { id: 'ALL', label: 'All Payments' },
                    { id: 'PAID', label: 'Paid in Full' },
                    { id: 'DUE', label: 'Due Pending' }
                  ].map(pf => (
                    <button
                      key={pf.id}
                      onClick={() => setOrderPaymentFilter(pf.id as any)}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        orderPaymentFilter === pf.id
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {pf.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs min-w-[1300px]">
                <thead className="bg-sky-50/80 text-sky-900 uppercase text-[10px] tracking-wider border-b border-sky-100 font-extrabold">
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
                    <th className="p-3.5">Billed By</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAdminOrders.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-slate-400">
                        No orders found matching your search or filters.
                      </td>
                    </tr>
                  ) : (
                    filteredAdminOrders.map(ord => {
                      const rep = getReportByOrderId(ord.id);
                      const isReadyToDispatch = rep?.status === 'AUTHORIZED' || ord.status === 'VERIFIED' || ord.status === 'DISPATCHED';
                      const mrpValue = ord.subtotal || ord.tests.reduce((s, t) => s + t.price, 0);

                      return (
                        <tr key={ord.id} className="hover:bg-sky-50/30 transition-colors">
                          {/* 1. Date */}
                          <td className="p-3.5">
                            <span className="font-bold text-slate-900 block text-xs">
                              {formatSafeDate(ord.createdAt)}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {formatSafeTime(ord.createdAt)}
                            </span>
                            <span className="text-[10px] font-mono text-sky-700 font-semibold block mt-0.5">
                              #{ord.invoiceNumber}
                            </span>
                          </td>

                          {/* 2. Patient Name */}
                          <td className="p-3.5">
                            <span className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                              {ord.patient.name}
                              {isSuperAdmin && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const pt = patients.find(p => p.id === ord.patientId) || {
                                      id: ord.patientId,
                                      name: ord.patient.name,
                                      age: ord.patient.age,
                                      gender: ord.patient.gender as any,
                                      phone: ord.patient.phone,
                                      registeredAt: new Date().toISOString()
                                    };
                                    setSelectedPatientForEdit(pt);
                                  }}
                                  className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-sky-600 transition-colors"
                                  title="Edit Patient Demographics"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </span>
                            <span className="text-[11px] text-slate-500 block">
                              {ord.patient.gender[0]}/{ord.patient.age}y • {ord.patient.phone}
                            </span>
                            <span className="text-[10px] font-mono text-sky-600 block mt-0.5">
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
                              const refDoc = referrers.find(r => r.id === ord.referringDoctorId || isOrderMatchingReferrer(ord, r));
                              const resolvedBeneficiary = ord.commissionBeneficiaryName ||
                                refDoc?.organizationName ||
                                refDoc?.name ||
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
                          <td className="p-3.5 max-w-[220px]">
                            <div className="flex flex-wrap gap-1">
                              {ord.tests.map(t => (
                                <span
                                  key={t.id}
                                  className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200"
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
                                <span className="text-[10px] text-emerald-700 font-bold block">
                                  ({ord.discountPct}% off)
                                </span>
                                {ord.discountReason && (
                                  <span className="text-[10px] text-amber-800 block truncate max-w-[120px]" title={ord.discountReason}>
                                    {ord.discountReason}
                                  </span>
                                )}
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
                            {(() => {
                              const isSplit = ord.paymentMode === "Split Payment" || String(ord.paymentMode || "").toLowerCase().includes("split");
                              if (isSplit) {
                                const split = getOrderPaymentSplit(ord);
                                return (
                                  <div className="mt-0.5 space-y-0.5">
                                    <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                                      Split Payment
                                    </span>
                                    <span className="text-[10px] text-slate-600 font-semibold block whitespace-nowrap">
                                      Cash: ₹{split.cash.toLocaleString()} + UPI: ₹{split.online.toLocaleString()}
                                    </span>
                                  </div>
                                );
                              }
                              return (
                                <span className="text-[10px] text-slate-500 font-semibold block">
                                  {ord.paymentMode}
                                </span>
                              );
                            })()}
                          </td>

                          {/* 8. Due by Patient */}
                          <td className="p-3.5">
                            {ord.dueAmount > 0 ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setAdminDueCollectOrder(ord);
                                  setAdminCollectAmount(ord.dueAmount);
                                  setAdminCollectMode('Cash');
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 shadow-2xs transition-all cursor-pointer group"
                                title="Click to collect and settle pending due balance"
                              >
                                <span>₹{ord.dueAmount.toLocaleString()} DUE</span>
                                <span className="text-[10px] bg-amber-600 group-hover:bg-amber-700 text-white px-1.5 py-0.2 rounded font-bold">
                                  Collect
                                </span>
                              </button>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                ₹0 (Settled)
                              </span>
                            )}
                          </td>

                          {/* 9. Billed By */}
                          <td className="p-3.5">
                            <span className="font-bold text-slate-800 block text-xs">
                              {resolveBilledByName(ord)}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-100 px-1.5 py-0.2 rounded inline-block mt-0.5">
                              {ord.centerCode || 'ATL-MAIN'}
                            </span>
                          </td>

                          {/* 10. Actions */}
                          <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                            {/* Edit Invoice Button */}
                            <button
                              type="button"
                              onClick={() => {
                                startEditingOrder(ord);
                                setAdminOrdersViewMode('NEW_ORDER');
                              }}
                              title="Edit Invoice, Tests, Patient & Payments in Full Invoice Workspace"
                              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl transition-colors inline-flex items-center gap-1 text-xs font-bold shadow-xs cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                              <span>Edit</span>
                            </button>

                            {/* Invoice Receipt Modal */}
                            <button
                              type="button"
                              onClick={() => setInvoiceModalOrder(ord)}
                              title="View & Print Official Invoice"
                              className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl transition-colors inline-flex items-center gap-1 text-xs font-bold shadow-xs cursor-pointer"
                            >
                              <Receipt className="w-3.5 h-3.5 text-sky-600" />
                              <span>Invoice</span>
                            </button>

                            {/* Return & Refund Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setAdminRefundModalOrder(ord);
                                const remPaid = Math.max(0, ord.paidAmount - (ord.refundAmount || 0));
                                setAdminRefundAmount(remPaid > 0 ? remPaid : '');
                                setAdminRefundMode(ord.paymentMode || 'Cash');
                                setAdminRefundReason('');
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

                            {/* View Report if generated */}
                            {rep && (
                              <button
                                type="button"
                                onClick={() => setReportPrintModalOrder(ord)}
                                title="View & Print Official Medical Report"
                                className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition-colors inline-flex cursor-pointer"
                              >
                                <Eye className="w-4 h-4 text-sky-600" />
                              </button>
                            )}

                            {/* WhatsApp Dispatch */}
                            <button
                              type="button"
                              onClick={() => {
                                const waUrl = dispatchReportViaWhatsApp(ord.id, ord.patient.phone);
                                window.open(waUrl, '_blank');
                                showToast(`WhatsApp dispatched to ${ord.patient.name} (${ord.patient.phone})`);
                              }}
                              disabled={!isReadyToDispatch}
                              title={isReadyToDispatch ? '1-Click WhatsApp Dispatch' : 'Report not yet authorized'}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition-all shadow-xs ${
                                isReadyToDispatch
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>{ord.whatsappSent ? 'Resend WA' : 'WhatsApp'}</span>
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Permanently remove Order #${ord.invoiceNumber} (${ord.patient.name}) from database?`)) {
                                  approveDeleteOrder(ord.id);
                                  showToast(`Removed order #${ord.invoiceNumber}`);
                                }
                              }}
                              title="Delete Order"
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors inline-flex cursor-pointer"
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
            </>
          )}
        </div>
      )}

      {/* TAB: DOCTOR'S ROSTER & 1-CLICK WHATSAPP HUB (SUPER ADMIN & MANAGER EXCLUSIVE) */}
      {activeTab === 'DOCTOR_ROSTER' && (
        <DoctorRosterTab />
      )}

      {/* TAB: RECENT ACTIVITY AUDIT LOG */}
      {activeTab === 'ACTIVITY_LOG' && (
        <div className="bg-white border border-sky-100 rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ActivityIcon className="w-5 h-5 text-sky-600" />
                Live Staff & Operational Activity Audit Log
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete traceability: track bills generated, samples collected, doctor approvals, logins, and test dispatches.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
              {filteredActivities.length} Events Recorded
            </span>
          </div>

          {/* Comprehensive Multi-Filter Bar: Search, Employee/Role, Specific Staff, Start Date & End Date Range, Action Type */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-3">
            {/* Top Row: Search & Start/End Date Range Selection */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={activitySearch}
                  onChange={e => setActivitySearch(e.target.value)}
                  placeholder="Search audit log by staff name, action, UHID, or invoice..."
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                />
              </div>

              {/* Date Preset & Custom Start/End Range Filter */}
              <DateRangeFilter
                preset={activityDateRange}
                startDate={activityStartDate}
                endDate={activityEndDate}
                onPresetChange={setActivityDateRange}
                onStartDateChange={setActivityStartDate}
                onEndDateChange={setActivityEndDate}
              />
            </div>

            {/* Bottom Row: Role / Employee Type, Specific Staff, and Action Type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 items-center pt-2 border-t border-slate-200/60">
              {/* Role / Designation Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Employee Role / Access
                </label>
                <select
                  value={activityRoleFilter}
                  onChange={e => setActivityRoleFilter(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                >
                  <option value="ALL">All Roles (Everyone)</option>
                  <option value="RECEPTIONIST">Receptionist (Front-Desk)</option>
                  <option value="CENTER_MANAGER">Center Manager</option>
                  {isSuperAdmin && <option value="SUPER_ADMIN">Super Admin / Director</option>}
                  <option value="DIAGNOSTIC_DOCTOR">Doctor / Radiologist</option>
                  <option value="REFERRING_DOCTOR">Referring Partner Doctor</option>
                  <option value="PATIENT">Patient / Guest</option>
                </select>
              </div>

              {/* Specific Staff Employee Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Specific Staff Member
                </label>
                <SearchableSelect
                  value={activityStaffFilter}
                  onChange={setActivityStaffFilter}
                  placeholder="All Staff Members"
                  searchPlaceholder="Search staff member..."
                  className="w-full"
                  options={[
                    { value: 'ALL', label: 'All Staff Members' },
                    ...visibleStaff.map(emp => ({
                      value: emp.id,
                      label: `${emp.name} (${emp.role})`,
                      subLabel: emp.role
                    }))
                  ]}
                />
              </div>

              {/* Action Type Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Action / Event Type
                </label>
                <select
                  value={activityTypeFilter}
                  onChange={e => setActivityTypeFilter(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                >
                  <option value="ALL">All Actions</option>
                  <option value="ORDER_CREATED">Order / Bill Created</option>
                  <option value="SAMPLE_COLLECTED">Sample Collected</option>
                  <option value="PAYMENT_RECEIVED">Payment Received</option>
                  <option value="REPORT_AUTHORIZED">Report Authorized</option>
                  <option value="REPORT_DISPATCHED">Report Dispatched</option>
                  <option value="STAFF_LOGIN">Staff Login</option>
                  <option value="STAFF_LOGOUT">Staff Logout</option>
                  <option value="DOCTOR_APPROVED">Doctor Approved</option>
                  <option value="EXPENSE_LOGGED">Expense Logged</option>
                  <option value="PATIENT_REGISTERED">Patient Registered</option>
                  <option value="DELETION_REQUESTED">Deletion Requested</option>
                  <option value="DELETION_APPROVED">Deletion Approved</option>
                </select>
              </div>

              {/* Clear Filters Button */}
              <div className="flex items-end h-full">
                {(activityRoleFilter !== 'ALL' || activityStaffFilter !== 'ALL' || activityTypeFilter !== 'ALL' || activityDateRange !== 'ALL' || activityStartDate || activityEndDate || activitySearch) ? (
                  <button
                    type="button"
                    onClick={() => {
                      setActivitySearch('');
                      setActivityTypeFilter('ALL');
                      setActivityRoleFilter('ALL');
                      setActivityStaffFilter('ALL');
                      setActivityDateRange('ALL');
                      setActivityStartDate('');
                      setActivityEndDate('');
                    }}
                    className="w-full py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset All Filters
                  </button>
                ) : (
                  <div className="text-[11px] text-slate-400 font-medium px-2 py-1.5">
                    Showing {filteredActivities.length} logs
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activity Stream */}
          <div className="divide-y divide-slate-100 max-h-[550px] overflow-y-auto pr-1">
            {filteredActivities.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No activity logs matching your filter.
              </div>
            ) : (
              filteredActivities.map(act => (
                <div key={act.id} className="py-3.5 flex items-start justify-between gap-4 hover:bg-slate-50/60 transition-colors rounded-xl px-2">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl mt-0.5 ${
                      act.actionType === 'ORDER_CREATED' ? 'bg-sky-100 text-sky-800' :
                      act.actionType === 'SAMPLE_COLLECTED' ? 'bg-indigo-100 text-indigo-800' :
                      act.actionType === 'REPORT_AUTHORIZED' ? 'bg-emerald-100 text-emerald-800' :
                      act.actionType === 'STAFF_LOGIN' ? 'bg-teal-100 text-teal-800' :
                      act.actionType === 'STAFF_LOGOUT' ? 'bg-slate-200 text-slate-700' :
                      act.actionType.includes('DELETION') ? 'bg-rose-100 text-rose-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      <ActivityIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">{act.actorName}</span>
                        <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                          {act.actorRole}
                        </span>
                        {act.centerCode && (
                          <span className="text-[10px] font-mono text-sky-700 font-semibold">
                            [{act.centerCode}]
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 mt-1 font-medium">{act.details}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 text-[11px] text-slate-400">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    <span className="block text-[10px] text-slate-400">{new Date(act.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB: STAFF ATTENDANCE TRACKER & SHIFT COMPLIANCE */}
      {activeTab === 'ATTENDANCE' && (
        <div className="space-y-6">
          {/* Header & High-Level KPIs */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Clock className="w-5 h-5 text-teal-600" />
                  Staff Real-Time Attendance & Shift Compliance Hub
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Real-time branch active personnel tracking, accumulated working hours, shift timeslot adherence, and automatic overtime/unattended login detection.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  {onlineStaffList.length} Active Online Now
                </span>
                {overtimeStaffList.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    {overtimeStaffList.length} Overtime / Stale Alert
                  </span>
                )}
              </div>
            </div>

            {/* Top 4 KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Online Representatives</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-950">
                  {onlineStaffList.length} <span className="text-xs font-bold text-emerald-700">/ {staff.length} Staff</span>
                </div>
                <p className="text-[11px] text-emerald-700 font-medium">
                  Covering {new Set(onlineStaffList.map(s => s.assignedCenterId)).size} branch center(s) right now
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Shift Exceeded / Stale</span>
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-rose-950">
                  {overtimeStaffList.length} <span className="text-xs font-bold text-rose-700">Flagged Staff</span>
                </div>
                <p className="text-[11px] text-rose-700 font-medium">
                  Active session duration exceeded 8h allocated shift quota
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">Total Accumulated Hours</span>
                  <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                    <Timer className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-sky-950">
                  {staffAttendanceCalculations.reduce((acc, s) => acc + s.workedHoursThisMonth, 0)} <span className="text-xs font-bold text-sky-700">hrs</span>
                </div>
                <p className="text-[11px] text-sky-700 font-medium">
                  Cumulative monthly hours logged across all centers
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Attendance Adherence</span>
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-indigo-950">
                  {Math.round(staff.reduce((acc, s) => acc + (s.attendancePct || 100), 0) / (staff.length || 1))}%
                </div>
                <p className="text-[11px] text-indigo-700 font-medium">
                  Average shift punctuality & verified punch-in rate
                </p>
              </div>
            </div>

            {/* Global Search & Multi-Center Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={attSearch}
                  onChange={e => setAttSearch(e.target.value)}
                  placeholder="Search staff by name, phone, role, or center..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={attCenterFilter}
                  onChange={e => setAttCenterFilter(e.target.value)}
                  aria-label="Filter attendance by branch center"
                  className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="ALL">All Branch Centers ({centers.length})</option>
                  {centers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>

                <select
                  value={attRoleFilter}
                  onChange={e => setAttRoleFilter(e.target.value)}
                  aria-label="Filter attendance by staff designation"
                  className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="ALL">All Designations / Roles</option>
                  <option value="Receptionist">Receptionist</option>
                  <option value="Center Manager">Center Manager</option>{isSuperAdmin && <option value="Super Admin">Super Admin</option>}
                  <option value="Radiologist">Radiologist</option>
                  <option value="Pathologist">Pathologist</option>
                  <option value="Lab Technician">Lab Technician</option>
                  <option value="Phlebotomist">Phlebotomist</option>
                </select>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 1: LIVE ONLINE REPRESENTATIVES ROSTER                             */}
          {/* ========================================================================= */}
          <div className="bg-white border border-emerald-200 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                  </span>
                  <h4 className="font-extrabold text-slate-900 text-sm tracking-tight">
                    Section 1: Live Online Representatives Across Centers ({filteredOnlineStaff.length} Active)
                  </h4>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Active workstations currently clocked in. Shows exact punch-in timestamp, active duration counter, and allocated shift timeslot.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                {filteredOnlineStaff.length} Live Desk Sessions
              </span>
            </div>

            {filteredOnlineStaff.length === 0 ? (
              <div className="p-10 text-center space-y-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-500 mx-auto flex items-center justify-center">
                  <UserX className="w-6 h-6" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-800 text-sm">No Active Representatives Currently Online</h5>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {attSearch || attCenterFilter !== 'ALL' || attRoleFilter !== 'ALL'
                      ? 'No online staff match your active search filters.'
                      : 'All receptionists, managers, and doctors are currently logged out across all branches.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOnlineStaff.map(emp => {
                  return (
                    <div
                      key={`online-${emp.id}`}
                      className={`relative rounded-2xl p-5 border transition-all shadow-xs space-y-4 flex flex-col justify-between ${
                        emp.isOvertime
                          ? 'bg-rose-50/40 border-rose-300 ring-1 ring-rose-200'
                          : 'bg-white border-emerald-200 hover:border-emerald-300 hover:shadow-md'
                      }`}
                    >
                      {/* Top Row: Name, Role Badge, Center Hub */}
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                              {emp.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                            </div>
                            <div>
                              <h5 className="font-extrabold text-slate-900 text-sm leading-tight flex items-center gap-1.5">
                                {emp.name}
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              </h5>
                              <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                                {emp.phone}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${
                              emp.role === 'Center Manager'
                                ? 'bg-indigo-100 text-indigo-800'
                                : emp.role === 'Receptionist'
                                ? 'bg-sky-100 text-sky-800'
                                : emp.role.includes('Doctor') || emp.role === 'Radiologist' || emp.role === 'Pathologist'
                                ? 'bg-violet-100 text-violet-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {emp.role}
                          </span>
                        </div>

                        {/* Center Hub & Shift Allocation */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 text-[11px] font-semibold flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              Logged-in Branch:
                            </span>
                            <span className="font-extrabold text-sky-900 bg-sky-100/70 border border-sky-200 px-2 py-0.5 rounded-md text-[11px]">
                              {emp.center?.name || 'Center'} ({emp.center?.code || 'ATL-MAIN'})
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 text-[11px] font-semibold flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              Allocated Shift:
                            </span>
                            <span className="font-bold text-slate-800 text-[11px]">
                              {emp.shift || 'Morning (8 AM - 4 PM)'} (8h)
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                            <span className="text-slate-500 text-[11px] font-semibold flex items-center gap-1">
                              <Zap className="w-3.5 h-3.5 text-emerald-600" />
                              Punch-In Time:
                            </span>
                            <span className="font-mono font-bold text-emerald-800 text-[11px]">
                              {emp.loginTimestamp
                                ? new Date(emp.loginTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
                                : '08:30 AM'} (Today)
                            </span>
                          </div>
                        </div>

                        {/* Live Elapsed Duration & Progress Bar */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-700 flex items-center gap-1">
                              <Timer className="w-3.5 h-3.5 text-slate-500" />
                              Current Active Duration:
                            </span>
                            <span className={`font-mono font-extrabold ${emp.isOvertime ? 'text-rose-700' : 'text-emerald-700'}`}>
                              {emp.formattedActive}
                            </span>
                          </div>

                          {/* Progress Bar vs 8h quota */}
                          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                emp.isOvertime ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${emp.shiftProgressPct}%` }}
                            />
                          </div>

                          {/* Overtime Alert Flag / Compliance Badge */}
                          {emp.isOvertime ? (
                            <div className="p-2.5 bg-rose-100/80 border border-rose-300 rounded-xl space-y-1 text-rose-900 mt-2">
                              <div className="flex items-center gap-1.5 text-xs font-black text-rose-800">
                                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                                <span>Shift Exceeded: {emp.formattedOvertime} Overtime</span>
                              </div>
                              <p className="text-[11px] leading-tight text-rose-700 font-medium">
                                Staff has worked beyond the allocated 8h timeslot. Verify if actively working or left logged in without signing out.
                              </p>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between text-[11px] text-emerald-800 font-semibold pt-0.5">
                              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Within Shift Quota</span>
                              <span>{Math.max(0, 8 - emp.elapsedHours)}h {Math.max(0, 60 - emp.elapsedRemainMins)}m remaining</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bottom Action: Super Admin Force Sign-Out / Close Session */}
                      <div className="pt-3 border-t border-slate-100 flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Terminate active session for ${emp.name} at ${emp.center?.name}? This will record their logout timestamp.`)) {
                              forceLogoutStaff(emp.id);
                              showToast(`Active session ended for ${emp.name}. Logout time recorded.`);
                            }
                          }}
                          className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <LogOut className="w-3.5 h-3.5 text-rose-600" />
                          <span>Force Sign-Out / Close Session</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2: STAFF ACCUMULATED HOURS & SHIFT COMPLIANCE / OVERTIME WARNING */}
          {/* ========================================================================= */}
          <div className="bg-white border border-sky-100 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-sky-600" />
                  Section 2: Staff Working Hours Accumulated & Shift Timeslot Compliance
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Monthly cumulative hours worked, shift quota progress, and overtime or abandoned unattended login alerts.
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAttStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    attStatusFilter === 'ALL' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Staff ({staff.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAttStatusFilter('ONLINE_ONLY')}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    attStatusFilter === 'ONLINE_ONLY' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Online Now ({onlineStaffList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAttStatusFilter('OVERTIME_ONLY')}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    attStatusFilter === 'OVERTIME_ONLY' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Overtime / Exceeded ({overtimeStaffList.length})
                </button>
              </div>
            </div>

            {/* Staff Accumulated Hours Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStaffCompliance.map(emp => {
                return (
                  <div
                    key={`compliance-${emp.id}`}
                    className={`bg-white rounded-2xl p-5 border transition-all shadow-xs space-y-4 flex flex-col justify-between ${
                      emp.isOvertime
                        ? 'border-rose-300 ring-1 ring-rose-200 bg-rose-50/20'
                        : 'border-slate-200 hover:border-sky-300 hover:shadow-md'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Staff Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h5 className="font-extrabold text-slate-900 text-sm">{emp.name}</h5>
                            {emp.isOnline ? (
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Online Now" />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-slate-300" title="Offline" />
                            )}
                          </div>
                          <span className="text-[11px] text-sky-700 font-bold block mt-0.5">
                            {emp.role} • {emp.center?.code || 'ATL-MAIN'}
                          </span>
                        </div>

                        {emp.isOnline ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                            ONLINE
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium text-[10px]">
                            OFFLINE
                          </span>
                        )}
                      </div>

                      {/* Shift Timeslot & Rate Details */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 text-[11px] font-semibold">Assigned Shift Timeslot:</span>
                          <span className="font-extrabold text-slate-800 text-[11px]">
                            {emp.shift || 'Morning (8 AM - 4 PM)'}
                          </span>
                        </div>

                        {isSuperAdmin && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 text-[11px] font-semibold">Monthly Salary / Base Rate:</span>
                            <span className="font-extrabold text-slate-900 text-[11px]">
                              ₹{emp.monthlySalary?.toLocaleString() || 35000} (₹{emp.hourlyRate || 220}/hr)
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 text-[11px] font-semibold">Shifts Completed:</span>
                          <span className="font-bold text-sky-900 text-[11px]">
                            {emp.totalShiftsCompleted || 0} Shifts ({emp.attendancePct || 98}% Rate)
                          </span>
                        </div>
                      </div>

                      {/* Cumulative Working Hours & Monthly Target */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700">Accumulated Working Hours:</span>
                          <span className="font-mono font-black text-slate-900 text-sm">
                            {emp.workedHoursThisMonth} <span className="text-slate-400 font-normal text-xs">/ 208 hrs</span>
                          </span>
                        </div>

                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                          <div
                            className={`h-full rounded-full transition-all ${
                              emp.workedHoursThisMonth > 208
                                ? 'bg-amber-500'
                                : 'bg-sky-600'
                            }`}
                            style={{ width: `${emp.monthlyProgressPct}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>{emp.monthlyProgressPct}% of monthly quota</span>
                          {emp.monthlyOvertimeHours > 0 && (
                            <span className="font-bold text-amber-700">+{emp.monthlyOvertimeHours}h Monthly Overtime</span>
                          )}
                        </div>
                      </div>

                      {/* Overtime Alert or Compliance Note */}
                      {emp.isOvertime ? (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-rose-800">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>Extended Shift Duration Warning</span>
                          </div>
                          <p className="text-[11px] text-rose-700 leading-tight">
                            Staff is currently active for <strong>{emp.formattedActive}</strong> ({emp.formattedOvertime} beyond allocated 8h shift timeslot).
                          </p>
                          <p className="text-[10px] text-rose-600 italic">
                            Verify if staff is actively working or left account logged in without signing out (Iman Champaran Chhodi).
                          </p>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 font-bold">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Shift Compliance Verified
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-700">
                            {emp.isOnline ? 'Currently On Duty' : 'Logged Out Cleanly'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Controls: Log Shift Hours or Force Close */}
                    <div className="pt-3 border-t border-slate-100 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setLoggingHoursStaff(emp);
                          setHoursToAdd(8);
                        }}
                        className="flex-1 py-2 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-sky-600" />
                        <span>+ Adjust / Log Shift Hours</span>
                      </button>

                      {emp.isOnline && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Close session for ${emp.name}?`)) {
                              forceLogoutStaff(emp.id);
                              showToast(`Logged out ${emp.name}`);
                            }
                          }}
                          className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer"
                          title="Force End Stale Session"
                        >
                          <LogOut className="w-3.5 h-3.5 text-rose-600" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 3: ATTENDANCE SESSION TIMESHEETS & AUDIT LOG                      */}
          {/* ========================================================================= */}
          <div className="bg-white border border-sky-100 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  Section 3: Historical Attendance Timesheets & Session Audit Log ({filteredAttendanceLogs.length} Records)
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Chronological punch-in and logout timestamps, verified session durations, and compliance audits for every branch workstation.
                </p>
              </div>

              {/* Date Presets & Custom Start/End Range Filter */}
              <DateRangeFilter
                preset={attLogDateFilter}
                startDate={attLogStartDate}
                endDate={attLogEndDate}
                onPresetChange={setAttLogDateFilter}
                onStartDateChange={setAttLogStartDate}
                onEndDateChange={setAttLogEndDate}
              />
            </div>

            {filteredAttendanceLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-200">
                No attendance logs found matching current filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-sky-50/80 text-sky-900 uppercase text-[10px] tracking-wider border-b border-sky-100 font-black">
                    <tr>
                      <th className="p-3.5">Session ID & Date</th>
                      <th className="p-3.5">Staff Representative</th>
                      <th className="p-3.5">Branch Center Hub</th>
                      <th className="p-3.5">Punch-In (Login Time)</th>
                      <th className="p-3.5">Punch-Out (Logout Time)</th>
                      <th className="p-3.5">Duration Logged</th>
                      <th className="p-3.5">Shift Compliance</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAttendanceLogs.map(log => {
                      const isOnline = log.status === 'ONLINE';
                      const loginDate = new Date(log.loginAt);
                      const logoutDate = log.logoutAt ? new Date(log.logoutAt) : null;
                      const durationMins = log.durationMinutes || (isOnline ? Math.max(0, Math.floor((Date.now() - loginDate.getTime()) / 60000)) : 480);
                      const durHours = Math.floor(durationMins / 60);
                      const durMins = durationMins % 60;
                      const isOvertime = durationMins > 480;

                      return (
                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3.5">
                            <span className="font-mono text-slate-500 font-semibold block text-[11px]">
                              {log.id}
                            </span>
                            <span className="text-[11px] text-slate-700 font-bold block mt-0.5">
                              {loginDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </td>

                          <td className="p-3.5">
                            <span className="font-extrabold text-slate-900 block text-sm">{log.staffName}</span>
                            <span className="text-[11px] text-sky-700 font-semibold">{log.role}</span>
                          </td>

                          <td className="p-3.5">
                            <span className="px-2.5 py-1 rounded-lg bg-sky-100 text-sky-900 font-bold text-xs">
                              {log.centerCode || 'ATL-MAIN'}
                            </span>
                          </td>

                          <td className="p-3.5 text-slate-800 font-mono font-bold">
                            {loginDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </td>

                          <td className="p-3.5 font-mono">
                            {logoutDate ? (
                              <span className="text-slate-700 font-bold">
                                {logoutDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Active Session
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 font-mono font-extrabold text-slate-900">
                            {durHours > 0 ? `${durHours}h ${durMins}m` : `${durMins}m`}
                          </td>

                          <td className="p-3.5">
                            {isOnline ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                ONLINE NOW
                              </span>
                            ) : isOvertime ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                OVERTIME (+{Math.floor((durationMins - 480) / 60)}h)
                              </span>
                            ) : durationMins >= 420 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 font-bold text-[10px]">
                                <Check className="w-3 h-3 text-sky-600" />
                                STANDARD SHIFT
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium text-[10px]">
                                SHORT SESSION
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {isOnline && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Force close session for ${log.staffName}?`)) {
                                      forceLogoutStaff(log.staffId);
                                      showToast(`Ended session for ${log.staffName}`);
                                    }
                                  }}
                                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-lg text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                                >
                                  <LogOut className="w-3 h-3 text-rose-600" />
                                  <span>End Session</span>
                                </button>
                              )}
                              {isSuperAdmin && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Permanently delete attendance record #${log.id}?`)) {
                                      deleteAttendanceLog(log.id);
                                      showToast(`Deleted attendance record #${log.id}`);
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Attendance Log"
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
            )}
          </div>
        </div>
      )}

      {/* TAB: DIAGNOSTIC TEST CATALOG MANAGER */}
      {activeTab === 'TEST_CATALOG' && (
        <div className="bg-white border border-sky-100 rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sliders className="w-5 h-5 text-sky-600" />
                Diagnostic Test Catalog & Tariff Manager
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Add, update pricing, edit turnaround times (TAT), and organize test offerings across all modalities.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isSuperAdmin ? (
                <>
                  <button
                    type="button"
                    onClick={async () => {
                      setIsPushingRates(true);
                      setRateSyncMessage(null);
                      const res = await syncCatalogToSheets();
                      setIsPushingRates(false);
                      setRateSyncMessage(res.message);
                      setTimeout(() => setRateSyncMessage(null), 6000);
                    }}
                    disabled={isPushingRates}
                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 text-xs font-bold rounded-2xl transition-all cursor-pointer disabled:opacity-60"
                    title="Push all 1,170 test rates to Google Sheets [Master_Test_Catalog]"
                  >
                    <UploadCloud className={`w-3.5 h-3.5 text-indigo-600 ${isPushingRates ? 'animate-bounce' : ''}`} />
                    <span>{isPushingRates ? 'Pushing Rates...' : 'Push to Google Sheets'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      setIsPullingRates(true);
                      setRateSyncMessage(null);
                      const res = await reloadCatalogFromSheets();
                      setIsPullingRates(false);
                      setRateSyncMessage(res.message);
                      setTimeout(() => setRateSyncMessage(null), 6000);
                    }}
                    disabled={isPullingRates}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-all cursor-pointer disabled:opacity-60"
                    title="Fetch live rates modified in Google Sheets"
                  >
                    <DownloadCloud className={`w-3.5 h-3.5 text-sky-600 ${isPullingRates ? 'animate-spin' : ''}`} />
                    <span>{isPullingRates ? 'Fetching Rates...' : 'Pull Live Rates'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingTest(null);
                      setTestName('');
                      setTestCode('');
                      setTestPrice(500);
                      setTestTatHours(4);
                      setIsAddTestModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-2xl transition-all shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    + Add Test
                  </button>
                </>
              ) : (
                <div className="px-3.5 py-2 bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold rounded-2xl flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Standard Tariff (Super Admin Managed)</span>
                </div>
              )}
            </div>
          </div>

          {rateSyncMessage && (
            <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>{rateSyncMessage}</span>
            </div>
          )}

          {/* Search & Category Filter */}
          <div className="space-y-2.5">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={testSearch}
                  onChange={e => setTestSearch(e.target.value)}
                  placeholder="Search test by name, test code, department, or sub-department..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
                {['ALL', 'Radiology', 'Pathology', 'Cardiology', 'Specialized'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => {
                      setTestCategoryFilter(cat);
                      setTestSubDepartmentFilter('ALL');
                    }}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      testCategoryFilter === cat ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-Department Pills Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs flex-1">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 shrink-0 mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Sub-Section:
                </span>
                {[
                  { id: 'ALL', label: 'All Sub-Sections' },
                  ...(testCategoryFilter === 'Radiology'
                    ? [
                        { id: 'MRI', label: 'MRI Scans' },
                        { id: 'CT Scan', label: 'CT Scans' },
                        { id: 'USG / Ultrasound', label: 'USG / Ultrasound' },
                        { id: 'X-Ray', label: 'Digital X-Ray' },
                        { id: 'Dexa Scan', label: 'Dexa Scan' },
                        { id: 'Mammography', label: 'Mammography' }
                      ]
                    : testCategoryFilter === 'Pathology'
                    ? [
                        { id: 'Hematology & CBC', label: 'Hematology & CBC' },
                        { id: 'Biochemistry', label: 'Biochemistry' },
                        { id: 'Hormones & Thyroid', label: 'Hormones & Thyroid' },
                        { id: 'Microbiology & Serology', label: 'Microbiology & Serology' },
                        { id: 'Histopathology', label: 'Histopathology' },
                        { id: 'Urine & Stool Routine', label: 'Urine & Stool' }
                      ]
                    : testCategoryFilter === 'Cardiology'
                    ? [
                        { id: 'ECG', label: 'ECG' },
                        { id: 'Echo / TMT', label: 'Echo / 2D Echo' },
                        { id: 'Holter', label: 'Holter Monitoring' }
                      ]
                    : testCategoryFilter === 'Specialized'
                    ? [
                        { id: 'EEG', label: 'EEG (Brain Wave)' },
                        { id: 'NCV / EMG', label: 'NCV / EMG' }
                      ]
                    : [
                        { id: 'MRI', label: 'MRI' },
                        { id: 'CT Scan', label: 'CT' },
                        { id: 'USG / Ultrasound', label: 'USG' },
                        { id: 'X-Ray', label: 'X-Ray' },
                        { id: 'Hematology & CBC', label: 'CBC & Blood' },
                        { id: 'Biochemistry', label: 'Biochemistry' },
                        { id: 'Hormones & Thyroid', label: 'Thyroid & Hormones' },
                        { id: 'Microbiology & Serology', label: 'Microbiology' }
                      ])
                ].map(sub => {
                  const isActive = testSubDepartmentFilter === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setTestSubDepartmentFilter(sub.id)}
                      className={`px-2.5 py-1 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                        isActive
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                      }`}
                    >
                      {sub.label}
                    </button>
                  );
                })}
              </div>
              <span className="text-[11px] text-slate-500 font-medium shrink-0 self-end sm:self-auto">
                Showing <strong className="text-sky-700 font-black">{filteredTests.length}</strong> of {tests.length} tests
              </span>
            </div>
          </div>

          {/* Tests Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-sky-50 text-sky-900 uppercase text-[10px] tracking-wider border-b border-sky-100 font-bold">
                <tr>
                  <th className="p-3.5">Test Code & Name</th>
                  <th className="p-3.5">Category & Sub-Section</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Sample / Specimen</th>
                  <th className="p-3.5">TAT (Hours)</th>
                  <th className="p-3.5">Patient Price (₹)</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400">
                      <div className="max-w-sm mx-auto space-y-3">
                        <p className="font-bold text-slate-700 text-sm">No diagnostic tests found matching your selection.</p>
                        <p className="text-xs text-slate-500">Try choosing another sub-department or clearing your active filters.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setTestSubDepartmentFilter('ALL');
                            setTestCategoryFilter('ALL');
                            setTestSearch('');
                          }}
                          className="px-3.5 py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-800 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset Catalog Filters</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTests.map(t => {
                    const subLabel = t.subDepartment || resolveTestSubDepartment(t);
                    return (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="p-3.5">
                          <span className="font-bold text-slate-900 block text-sm">{t.name}</span>
                          <span className="font-mono text-sky-700 text-[10px] font-semibold">{t.code}</span>
                        </td>
                        <td className="p-3.5 space-y-1">
                          <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 font-bold text-[10px] inline-block">
                            {t.category}
                          </span>
                          {subLabel && (
                            <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 font-bold text-[10px] block w-fit">
                              {subLabel}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-700 font-medium">{t.department}</td>
                        <td className="p-3.5 text-slate-600">{t.sampleType}</td>
                        <td className="p-3.5 font-mono text-slate-800">{t.tatHours} hrs</td>
                        <td className="p-3.5 font-black text-sky-700 text-sm">₹{t.price.toLocaleString()}</td>
                        <td className="p-3.5 text-right space-x-1.5">
                          {isSuperAdmin ? (
                            <>
                              <button
                                onClick={() => {
                                  setEditingTest(t);
                                  setTestName(t.name);
                                  setTestCode(t.code);
                                  setTestCategory(t.category);
                                  setTestDepartment(t.department);
                                  setTestSampleType(t.sampleType);
                                  setTestPrice(t.price);
                                  setTestTatHours(t.tatHours);
                                  setIsAddTestModalOpen(true);
                                }}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                              >
                                Edit Price
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Remove test "${t.name}" from catalog?`)) {
                                    deleteTest(t.id);
                                    showToast(`Removed test ${t.name}`);
                                  }
                                }}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                              Locked
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 1: FINANCIAL MIS OVERVIEW */}
      {activeTab === 'MIS_OVERVIEW' && (
        <div className="space-y-6">
          {/* Multi-Center Network & Internet Status Monitor */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    Multi-Center Network & Outage Radar
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800 animate-pulse'
                    }`}>
                      {isOnline ? 'Cloud Sync Online' : 'Network Outage Detected'}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Live connection health across all diagnostic branch centers and Google Sheets database
                  </p>
                </div>
              </div>

              {unsyncedOrdersCount > 0 && (
                <button
                  type="button"
                  onClick={handleSyncRadar}
                  disabled={isSyncingRadar || !isOnline}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{isSyncingRadar ? 'Syncing...' : `Sync ${unsyncedOrdersCount} Queued Orders`}</span>
                </button>
              )}
            </div>

            {/* Centers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {centers.map(c => {
                const cOrders = allOrders.filter(o => o.centerId === c.id);
                const cUnsynced = cOrders.filter(o => !o.syncedToGoogleSheets && !o.isDeleted && !o.deletionPendingApproval).length;
                const cOnlineStaff = staff.filter(s => s.assignedCenterId === c.id && s.isLoggedIn).length;
                const isCurrentCenter = selectedCenter.id === c.id;
                const isCenterOffline = (!isOnline && isCurrentCenter) || cUnsynced > 0;

                return (
                  <div
                    key={c.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isCenterOffline
                        ? 'bg-amber-50/60 border-amber-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-sky-600" />
                        <div>
                          <span className="font-bold text-slate-900 text-xs block">{c.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">{c.code} • {c.sheetName}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                        isCenterOffline
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isCenterOffline ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
                        {isCenterOffline ? 'Sync Pending' : 'Live Synced'}
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-200/50 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">
                        Staff: <strong className="text-slate-700">{cOnlineStaff} active</strong>
                      </span>
                      {cUnsynced > 0 ? (
                        <span className="font-bold text-amber-700 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          {cUnsynced} orders waiting to push
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Google Sheet in sync
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Financial MIS Filter Bar */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 border border-sky-100 dark:border-slate-800 rounded-3xl shadow-xs">
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="p-2.5 bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300 rounded-2xl">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                  Financial Reporting Period & Filters
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Showing metrics for <strong className="text-slate-800 dark:text-slate-200">{misFilteredOrders.length} orders</strong> and <strong className="text-slate-800 dark:text-slate-200">{misFilteredExpenses.length} expense vouchers</strong>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">Branch:</span>
                <select
                  value={misCenterFilter}
                  onChange={e => setMisCenterFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="ALL">All Branches ({centers.length})</option>
                  {centers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>

              {/* Date Presets & Custom Start/End Range Filter */}
              <DateRangeFilter
                variant="chips"
                preset={misDateRange}
                startDate={misStartDate}
                endDate={misEndDate}
                onPresetChange={setMisDateRange}
                onStartDateChange={setMisStartDate}
                onEndDateChange={setMisEndDate}
              />

              {(misDateRange !== 'ALL' || misCenterFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setMisDateRange('ALL');
                    setMisStartDate('');
                    setMisEndDate('');
                    setMisCenterFilter('ALL');
                  }}
                  className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  title="Reset to All-Time view"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Top KPI Metrics Row */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${isSuperAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
            {/* Total Revenue & Collections Breakdown */}
            <div className="p-5 bg-white dark:bg-slate-900 border border-sky-100 dark:border-slate-800 rounded-3xl shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
                <span>Gross Billing & Collections</span>
                <div className="p-2 bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300 rounded-xl">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
                ₹{dynamicMisSummary.grossRevenue.toLocaleString()}
              </p>
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-medium">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 font-bold text-emerald-800 dark:text-emerald-400">
                    <Banknote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Cash Income:
                  </span>
                  <strong className="text-emerald-700 dark:text-emerald-300">₹{(dynamicMisSummary.cashIncome || 0).toLocaleString()}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 font-bold text-sky-800 dark:text-sky-400">
                    <QrCode className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" /> Online / UPI:
                  </span>
                  <strong className="text-sky-700 dark:text-sky-300">₹{(dynamicMisSummary.onlineIncome || 0).toLocaleString()}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span>Total Collected: <strong className="text-slate-900 dark:text-slate-100">₹{dynamicMisSummary.collectedAmount.toLocaleString()}</strong></span>
                  <span>Due: <strong className="text-amber-700 dark:text-amber-400">₹{dynamicMisSummary.pendingDueAmount.toLocaleString()}</strong></span>
                </div>
              </div>
            </div>

            {/* Total Operational Expenses */}
            <div className="p-5 bg-white dark:bg-slate-900 border border-sky-100 dark:border-slate-800 rounded-3xl shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
                <span>Operating Expenses</span>
                <div className="p-2 bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300 rounded-xl">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400">
                ₹{dynamicMisSummary.totalOperatingExpenses.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                Rent, Electricity, Reagents, AMC ({misFilteredExpenses.length} entries)
              </p>
            </div>

            {/* Total Payroll - Strictly visible only to Super Admin */}
            {isSuperAdmin && (
              <div className="p-5 bg-white dark:bg-slate-900 border border-sky-100 dark:border-slate-800 rounded-3xl shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
                  <span>Staff Salaries & Payroll</span>
                  <div className="p-2 bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300 rounded-xl">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-amber-700 dark:text-amber-400">
                  ₹{dynamicMisSummary.totalPayrollExpenses.toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {visibleStaff.length} Active Employees
                </p>
              </div>
            )}

            {/* Net Profit Margin */}
            <div className="p-5 bg-white dark:bg-slate-900 border border-sky-100 dark:border-slate-800 rounded-3xl shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
                <span>Net Operating Profit</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-xl">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                ₹{dynamicMisSummary.netProfit.toLocaleString()}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 font-medium">
                <span>Margin: <strong className="text-emerald-700 dark:text-emerald-400">{dynamicMisSummary.profitMarginPct}% of collections</strong></span>
              </div>
            </div>
          </div>

          {/* Outflow Breakdown & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-sky-100 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <PieChart className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                Expense & Cost Outflow Distribution ({misDateRange === 'ALL' ? 'All-Time' : misDateRange})
              </h3>

              <div className="space-y-3.5">
                {[
                  { label: 'Facility Rent (All Centers)', cat: 'Center Rent', color: 'bg-rose-500' },
                  ...(isSuperAdmin ? [{ label: 'Staff Salaries & Wages', cat: 'Staff Payroll', color: 'bg-amber-500' }] : []),
                  { label: 'Equipment AMC & Maintenance', cat: 'Equipment AMC & Maintenance', color: 'bg-purple-500' },
                  { label: 'Electricity & Commercial Power', cat: 'Electricity & Utilities', color: 'bg-sky-500' },
                  { label: 'Lab Reagents & Chemicals', cat: 'Lab Reagents & Chemicals', color: 'bg-emerald-500' },
                  { label: 'Stationery & IT Broadband', cat: 'Stationery & IT', color: 'bg-blue-500' }
                ].map(item => {
                  const itemAmount = item.cat === 'Staff Payroll'
                    ? dynamicMisSummary.totalPayrollExpenses
                    : misFilteredExpenses.filter(e => e.category === item.cat).reduce((s, e) => s + e.amount, 0);
                  const pct = dynamicMisSummary.totalOutflow > 0
                    ? Math.round((itemAmount / dynamicMisSummary.totalOutflow) * 100)
                    : 0;

                  return (
                    <div key={item.cat} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-700 dark:text-slate-300 font-bold">{item.label}</span>
                        <span className="text-slate-900 dark:text-slate-100 font-extrabold">₹{itemAmount.toLocaleString()} ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Multi-Center & Google Sheets Status Card */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-sky-100 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  Multi-Center Real-Time Health
                </h3>
                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsAddCenterModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Add Center
                  </button>
                )}
              </div>

              <div className="space-y-2.5 text-xs">
                {centers.map(c => {
                  const cOrders = misFilteredOrders.filter(o => o.centerId === c.id);
                  const cRevenue = cOrders.reduce((sum, o) => sum + o.totalAmount, 0);

                  return (
                    <div key={c.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-slate-100 block">{c.name}</span>
                          {c.isMain && (
                            <span className="px-1.5 py-0.2 text-[9px] font-black bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 rounded">
                              Main Hub
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-sky-700 dark:text-sky-400 font-mono">{c.sheetName}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-slate-900 dark:text-slate-100 block">₹{cRevenue.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">{cOrders.length} orders</span>
                      </div>
                    </div>
                  );
                })}

                {/* Multi-Center & Google Sheets Actions */}
                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  {isSuperAdmin && (
                    <button
                      onClick={() => setActiveTab('BRANCHES')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-900 font-bold rounded-2xl transition-all cursor-pointer"
                    >
                      <Building2 className="w-3.5 h-3.5 text-sky-600" />
                      Manage Branches ({centers.length})
                    </button>
                  )}
                  <button
                    onClick={() => setIsGSheetsModalOpen(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold rounded-2xl transition-all cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    Sheet Tabs & Backup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: STAFF DELETION APPROVAL GATE (Super Admin Only) */}
      {activeTab === 'DELETION_APPROVALS' && isSuperAdmin && (
        <div className="space-y-6">
          <div className="bg-white border border-rose-200 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  Staff Deletion Audit & Approval Gate ({pendingDeletions.length})
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Entries removed by reception or staff are safely quarantined here. Approving deletes them permanently; rejecting immediately restores them to active staff queues.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
                {pendingDeletions.length} Pending Actions
              </span>
            </div>

            {pendingDeletions.length === 0 ? (
              <div className="p-12 text-center space-y-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">All Records Clean & Verified</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    No deletion requests submitted by staff members.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] tracking-wider border-b border-slate-200 font-extrabold">
                    <tr>
                      <th className="p-4">Item Type & ID</th>
                      <th className="p-4">Record Details</th>
                      <th className="p-4">Financial Amount</th>
                      <th className="p-4">Staff Audit</th>
                      <th className="p-4 text-right">Admin Decision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingDeletions.map(item => (
                      <tr key={`${item.entityType}-${item.id}`} className="hover:bg-rose-50/30 transition-colors">
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                              item.entityType === 'ORDER'
                                ? 'bg-sky-100 text-sky-800'
                                : item.entityType === 'PATIENT'
                                ? 'bg-indigo-100 text-indigo-800'
                                : item.entityType === 'APPOINTMENT'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.entityType}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500 font-semibold block mt-1">
                            {item.id}
                          </span>
                        </td>

                        <td className="p-4">
                          <span className="font-bold text-slate-900 text-sm block">
                            {item.title}
                          </span>
                          <span className="text-slate-500 text-[11px] block mt-0.5">
                            {item.subtitle}
                          </span>
                        </td>

                        <td className="p-4">
                          {item.amount !== undefined ? (
                            <span className="font-extrabold text-slate-900 text-sm">
                              ₹{item.amount.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="p-4">
                          <span className="font-bold text-slate-800 block">
                            Requested By: {item.requestedBy}
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            {item.requestedAt}
                          </span>
                          <span className="inline-block text-[10px] text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded mt-1">
                            Reason: {item.reason}
                          </span>
                        </td>

                        <td className="p-4 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (item.entityType === 'ORDER') rejectDeleteOrder(item.id);
                              else if (item.entityType === 'PATIENT') rejectDeletePatient(item.id);
                              else if (item.entityType === 'EXPENSE') rejectDeleteExpense(item.id);
                              else if (item.entityType === 'APPOINTMENT') rejectDeleteAppointment(item.id);
                              showToast(`Restored ${item.title} back to active workstation!`);
                            }}
                            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-xl text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Reject & Restore</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Permanently delete ${item.title} from entire database?`)) {
                                if (item.entityType === 'ORDER') approveDeleteOrder(item.id);
                                else if (item.entityType === 'PATIENT') approveDeletePatient(item.id);
                                else if (item.entityType === 'EXPENSE') approveDeleteExpense(item.id);
                                else if (item.entityType === 'APPOINTMENT') approveDeleteAppointment(item.id);
                                showToast(`Permanently deleted ${item.title}`);
                              }
                            }}
                            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-white" />
                            <span>Approve Delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}


      {/* TAB 3: REFERRAL PARTNERS, AFFILIATIONS & MIS SEARCH ENGINE */}
      {activeTab === 'REFERRAL_LEADERBOARD' && (
        <div className="bg-white border border-sky-100 rounded-3xl p-6 shadow-xs space-y-5">
          {/* Header with View Toggle and Print MIS Report Button */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  Referral Partners, Affiliations & MIS Commission Engine
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
                  {filteredReferralMISOrders.length} Orders Logged
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Search order-level referral logs with patient names, filter by doctor & organization, verify decoupled commission beneficiaries, and generate MIS audit reports.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* View Switcher: Doctor Approvals vs Partner Summary vs MIS Search */}
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setReferralViewMode('PENDING_APPROVALS')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    referralViewMode === 'PENDING_APPROVALS'
                      ? 'bg-sky-600 text-white shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Doctor Approvals</span>
                  {pendingReferrers.length > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      referralViewMode === 'PENDING_APPROVALS' ? 'bg-amber-400 text-slate-900' : 'bg-amber-500 text-white'
                    }`}>
                      {pendingReferrers.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setReferralViewMode('PARTNER_SUMMARY')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    referralViewMode === 'PARTNER_SUMMARY'
                      ? 'bg-sky-600 text-white shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Beneficiary and Affiliations</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    referralViewMode === 'PARTNER_SUMMARY' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {approvedReferrers.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setReferralViewMode('MIS_SEARCH')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    referralViewMode === 'MIS_SEARCH'
                      ? 'bg-sky-600 text-white shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>MIS Search & Patient Logs</span>
                </button>
              </div>

              {/* Download PDF Button */}
              <button
                type="button"
                onClick={handleDownloadMISPdf}
                disabled={isGeneratingMISPdf}
                className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                title="Download compiled MIS Report as a PDF file"
              >
                {isGeneratingMISPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>{isGeneratingMISPdf ? 'Compiling PDF...' : 'Download PDF'}</span>
              </button>

              {/* Add Referral Partner Button (Super Admin & Manager) */}
              {(isSuperAdmin || currentRole === 'CENTER_MANAGER') && (
                <button
                  type="button"
                  onClick={() => setIsRegisterPartnerModalOpen(true)}
                  className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Add new Referring Doctor or Healthcare Partner directly"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Add Referral Partner</span>
                </button>
              )}

              {/* Print / Export MIS Report Button */}
              <button
                type="button"
                onClick={() => setIsPrintMISModalOpen(true)}
                className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Preview and print official compiled MIS Report"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print MIS Report</span>
              </button>
            </div>
          </div>

          {/* Super Admin Alert Banner when Doctors are Awaiting Approval */}
          {pendingReferrers.length > 0 && referralViewMode !== 'PENDING_APPROVALS' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-900">
                    {pendingReferrers.length} Referring Doctor{pendingReferrers.length > 1 ? 's' : ''} Awaiting Super Admin Approval
                  </h4>
                  <p className="text-[11px] text-amber-700">
                    Doctors registered by the front-desk reception must be reviewed and verified by Super Admin before activation in the doctor roster.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReferralViewMode('PENDING_APPROVALS')}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
              >
                Review Approvals ({pendingReferrers.length}) &rarr;
              </button>
            </div>
          )}

          {/* VIEW 0: PENDING APPROVALS & APPROVED ROSTER DIRECTORY */}
          {referralViewMode === 'PENDING_APPROVALS' && (
            <div className="space-y-6">
              <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      Pending Doctor Approvals ({pendingReferrers.length})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Front-desk added doctors require Super Admin verification and profile review before activation.
                    </p>
                  </div>

                  {/* Doctor Search for Pending Approvals */}
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={directoryDocSearch}
                      onChange={e => setDirectoryDocSearch(e.target.value)}
                      placeholder="Search doctor, clinic or contact..."
                      className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                    />
                    {directoryDocSearch && (
                      <button
                        type="button"
                        onClick={() => setDirectoryDocSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                        title="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {pendingReferrers.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
                    No doctors currently awaiting approval. All registered referring doctors are reviewed.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingReferrers
                      .filter(doc => {
                        if (!directoryDocSearch.trim()) return true;
                        const q = directoryDocSearch.toLowerCase();
                        return (
                          (doc.name || '').toLowerCase().includes(q) ||
                          (doc.specialty || '').toLowerCase().includes(q) ||
                          (doc.hospital || '').toLowerCase().includes(q) ||
                          (doc.organizationName || '').toLowerCase().includes(q) ||
                          (doc.phone || '').includes(q)
                        );
                      })
                      .map(doc => (
                      <div key={doc.id} className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3.5 shadow-2xs hover:border-sky-300 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-slate-900 text-sm">{doc.name}</h4>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                PENDING APPROVAL
                              </span>
                            </div>
                            {doc.qualification && (
                              <p className="text-xs font-bold text-indigo-700 mt-0.5">
                                {doc.qualification} {doc.registrationNo ? `• Reg: ${doc.registrationNo}` : ''}
                              </p>
                            )}
                            {(doc.specialty || doc.hospital) ? (
                              <p className="text-xs text-sky-700 font-semibold mt-0.5">
                                {[doc.specialty, doc.hospital].filter(Boolean).join(' • ')}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs shadow-2xs">
                          {doc.qualification ? (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 font-bold text-[11px]">Degree / Qualification:</span>
                              <span className="font-bold text-indigo-700">{doc.qualification}</span>
                            </div>
                          ) : null}
                          {doc.registrationNo ? (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 font-bold text-[11px]">Medical Council Reg. No:</span>
                              <span className="font-mono font-bold text-slate-800">{doc.registrationNo}</span>
                            </div>
                          ) : null}
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-bold text-[11px]">Association:</span>
                            <span className="font-bold text-slate-800">
                              {doc.affiliationType === 'ORGANIZATION' 
                                ? `Network: ${doc.organizationName || 'Partner Group'}`
                                : 'Independent Practice'}
                            </span>
                          </div>
                          {doc.hospital ? (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 font-bold text-[11px]">Hospital / Clinic:</span>
                              <span className="font-semibold text-slate-700">{doc.hospital}</span>
                            </div>
                          ) : null}
                          {doc.phone ? (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 font-bold text-[11px]">Contact Mobile:</span>
                              <span className="font-mono font-bold text-slate-700">{doc.phone}</span>
                            </div>
                          ) : null}
                          <div className="flex items-center justify-between pt-1.5 border-t border-slate-200">
                            <span className="text-amber-800 font-bold text-[11px]">Roster Status:</span>
                            <span className="font-bold text-amber-800 text-[11px] bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                              Awaiting Super Admin Approval
                            </span>
                          </div>
                        </div>

                        {isSuperAdmin ? (
                          <div className="pt-2 border-t border-slate-200 flex gap-2">
                            <button
                              onClick={() => openApproveDoctorModal(doc)}
                              className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              Review Details & Approve Doctor
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Permanently delete registration for ${doc.name}?`)) {
                                  deleteReferringDoctor?.(doc.id);
                                  showToast(`Deleted ${doc.name}`);
                                }
                              }}
                              className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1 transition-colors"
                              title="Permanently Delete Doctor Registration"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        ) : (
                          <div className="pt-2 border-t border-slate-200">
                            <div className="w-full py-2 bg-slate-100 border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5">
                              <Lock className="w-3.5 h-3.5 text-slate-500" />
                              Locked: Super Admin Approval Required
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Approved Referring Doctors Roster */}
              <div className="bg-white border border-sky-100 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    Approved Referring Doctors Directory ({approvedReferrers.length})
                  </h3>

                  {/* Doctor Search Input */}
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={directoryDocSearch}
                      onChange={e => setDirectoryDocSearch(e.target.value)}
                      placeholder="Search doctor name, clinic, specialty..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                    />
                    {directoryDocSearch && (
                      <button
                        type="button"
                        onClick={() => setDirectoryDocSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                        title="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-sky-50 text-sky-900 uppercase text-[10px] tracking-wider border-b border-sky-100 font-bold">
                      <tr>
                        <th className="p-3.5">Doctor & Specialty</th>
                        <th className="p-3.5">Affiliation & Clinic</th>
                        <th className="p-3.5">Contact & Registration</th>
                        <th className="p-3.5">Patients Referred</th>
                        <th className="p-3.5">Gross Revenue</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {approvedReferrers
                        .filter(doc => {
                          if (!directoryDocSearch.trim()) return true;
                          const q = directoryDocSearch.toLowerCase();
                          return (
                            (doc.name || '').toLowerCase().includes(q) ||
                            (doc.specialty || '').toLowerCase().includes(q) ||
                            (doc.hospital || '').toLowerCase().includes(q) ||
                            (doc.organizationName || '').toLowerCase().includes(q) ||
                            (doc.phone || '').includes(q)
                          );
                        })
                        .map(doc => (
                        <tr key={doc.id} className="hover:bg-slate-50">
                          <td className="p-3.5">
                            <span className="font-bold text-slate-900 block">{doc.name}</span>
                            <span className="text-[11px] text-slate-500">{doc.qualification}</span>
                          </td>
                          <td className="p-3.5 text-slate-700">
                            {doc.organizationName && doc.organizationName !== '0' && doc.organizationName !== 'None' ? (
                              <span className="text-purple-800 font-bold block">{doc.organizationName}</span>
                            ) : (doc.affiliationType === 'SELF' ? (
                              <span className="text-purple-800 font-bold block">{doc.name}</span>
                            ) : null)}
                            <span>{doc.hospital && doc.hospital !== '0' ? doc.hospital : 'Direct Clinic'}</span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-mono text-slate-800 font-bold block">{doc.phone || 'Not provided'}</span>
                            {doc.registrationNo ? (
                              <span className="text-[10px] text-teal-700 font-semibold block">Reg: {doc.registrationNo}</span>
                            ) : (
                              <span className="text-[10px] text-slate-400 block">Verified Practitioner</span>
                            )}
                          </td>
                          <td className="p-3.5 font-bold text-slate-900">
                            <button
                              type="button"
                              onClick={() => setReferredOrdersModalDoc(doc)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold border border-sky-200 transition-all cursor-pointer shadow-2xs hover:scale-105"
                              title="Click to view all referred patients"
                            >
                              <span>{doc.totalReferralsCount}</span>
                              <span className="text-[10px] font-semibold text-sky-600 underline">view</span>
                            </button>
                          </td>
                          <td className="p-3.5 font-black text-sky-700">₹{doc.totalRevenueGenerated.toLocaleString()}</td>
                          <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => {
                                const waUrl = sendWelcomeDoctorWhatsApp(doc);
                                window.open(waUrl, '_blank');
                                showToast(`Sent welcome message to ${doc.name}`);
                              }}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Share2 className="w-3.5 h-3.5" /> Welcome WA
                            </button>
                            {isSuperAdmin && (
                              <>
                                <button
                                  onClick={() => openEditApprovedDoctorModal(doc)}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Edit3 className="w-3 h-3 text-slate-500" />
                                  Edit Details
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to permanently remove Dr. ${doc.name} from approved doctors?`)) {
                                      deleteReferringDoctor?.(doc.id);
                                      showToast(`Removed Dr. ${doc.name} from approved doctors.`);
                                    }
                                  }}
                                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                                  title="Permanently Delete Doctor"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Delete</span>
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* MIS Search Engine & Multi-Filter Control Box */}
          {referralViewMode !== 'PENDING_APPROVALS' && (
            <>
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-3">
            {/* Top Row: Search Input across Patient Name, UHID, Phone, Doctor, Beneficiary, Tests */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={referralSearch}
                  onChange={e => setReferralSearch(e.target.value)}
                  placeholder="Search by Patient Name, Phone, UHID, Prescribing Doctor, Beneficiary, or Test..."
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                />
              </div>

              {/* Date Preset & Custom Start/End Range Filter */}
              <DateRangeFilter
                preset={referralDateRange}
                startDate={referralStartDate}
                endDate={referralEndDate}
                onPresetChange={setReferralDateRange}
                onStartDateChange={setReferralStartDate}
                onEndDateChange={setReferralEndDate}
              />
            </div>

            {/* Bottom Row: Prescribing Doctor Selector, Commission Beneficiary Selector, Affiliation Type Selector, and Clear */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center pt-2 border-t border-slate-200/60">
              {/* 1. Prescribing Doctor Filter Dropdown with Search */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Prescribing Doctor:
                </label>
                <SearchableSelect
                  value={referralDoctorFilter}
                  onChange={setReferralDoctorFilter}
                  placeholder={`All Prescribing Doctors (${availablePrescribingDoctors.length})`}
                  searchPlaceholder="Search doctor by name..."
                  className="w-full"
                  options={[
                    { value: 'ALL', label: `All Prescribing Doctors (${availablePrescribingDoctors.length})` },
                    ...availablePrescribingDoctors.map(doc => ({
                      value: doc.name,
                      label: `${doc.name} (${doc.count} orders)`,
                      subLabel: `${doc.count} referred orders`
                    }))
                  ]}
                />
              </div>

              {/* 2. Beneficiary Filter Dropdown with Search */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Beneficiary:
                </label>
                <SearchableSelect
                  value={referralBeneficiaryFilter}
                  onChange={setReferralBeneficiaryFilter}
                  placeholder={`All Beneficiaries (${availableCommissionBeneficiaries.length})`}
                  searchPlaceholder="Search beneficiary / clinic..."
                  className="w-full"
                  options={[
                    { value: 'ALL', label: `All Beneficiaries (${availableCommissionBeneficiaries.length})` },
                    ...availableCommissionBeneficiaries.map(ben => ({
                      value: ben.name,
                      label: `${ben.name} (${ben.count} orders)`,
                      subLabel: `${ben.count} affiliated orders`
                    }))
                  ]}
                />
              </div>

              {/* 3. Affiliation Type Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Affiliation / Network:
                </label>
                <div className="flex bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold shadow-2xs">
                  {[
                    { id: 'ALL', label: 'All Partners' },
                    { id: 'SELF', label: 'Independent' },
                    { id: 'ORGANIZATION', label: 'Organizations' }
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setReferralAffiliationFilter(f.id as any)}
                      className={`flex-1 py-1 rounded-lg text-center transition-all cursor-pointer ${
                        referralAffiliationFilter === f.id
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Clear Filters CTA */}
              <div className="flex items-end h-full">
                {(referralDoctorFilter !== 'ALL' || referralBeneficiaryFilter !== 'ALL' || referralAffiliationFilter !== 'ALL' || referralDateRange !== 'ALL' || referralStartDate || referralEndDate || referralSearch) ? (
                  <button
                    type="button"
                    onClick={() => {
                      setReferralSearch('');
                      setReferralDoctorFilter('ALL');
                      setReferralBeneficiaryFilter('ALL');
                      setReferralAffiliationFilter('ALL');
                      setReferralDateRange('ALL');
                      setReferralStartDate('');
                      setReferralEndDate('');
                    }}
                    className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    Reset All Filters
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400 italic py-2 block">
                    Showing all referral records ({filteredReferralMISOrders.length})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 5 High-Level MIS Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="p-4 bg-white border border-sky-100 rounded-2xl shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Referred Orders</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">{filteredReferralMISOrders.length}</span>
              <span className="text-[10px] text-slate-400">Total patient visits</span>
            </div>

            <div className="p-4 bg-white border border-sky-100 rounded-2xl shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 block">Gross Bill Value</span>
              <span className="text-xl font-black text-sky-700 mt-1 block">₹{misGrossRevenue.toLocaleString()}</span>
              <span className="text-[10px] text-sky-600">Referred invoice volume</span>
            </div>

            <div className="p-4 bg-white border border-emerald-100 rounded-2xl shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Commission Earned</span>
              <span className="text-xl font-black text-emerald-700 mt-1 block">₹{misTotalCommission.toLocaleString()}</span>
              <span className="text-[10px] text-emerald-600">Calculated partner share</span>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">Total Paid Out</span>
              <span className="text-xl font-black text-slate-800 mt-1 block">₹{misTotalPaidOut.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400">Disbursed settlements</span>
            </div>

            <div className="p-4 bg-white border border-amber-200 rounded-2xl shadow-xs col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">Net Due Balance</span>
              <span className="text-xl font-black text-amber-700 mt-1 block">₹{misBalancePayable.toLocaleString()}</span>
              <span className="text-[10px] text-amber-600">Pending disbursement</span>
            </div>
          </div>
        </>
      )}

          {/* VIEW 1: INTERACTIVE MIS SEARCH ENGINE & PATIENT COMMISSION LOGS */}
          {referralViewMode === 'MIS_SEARCH' && (
            <div className="space-y-3">
              {/* Beneficiary Heading Card (When a Beneficiary is Selected) */}
              {referralBeneficiaryFilter !== 'ALL' && (
                <div className="p-4 bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-widest text-purple-200 block">
                      BENEFICIARY STATEMENT
                    </span>
                    <h4 className="text-base font-black text-white">{referralBeneficiaryFilter}</h4>
                    <p className="text-xs text-purple-200 mt-0.5">
                      Assigned partner account statement for referred patient investigations.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/20 text-right">
                      <span className="text-[10px] text-purple-200 block">Total Patients</span>
                      <span className="text-sm font-bold text-white">{filteredReferralMISOrders.length}</span>
                    </div>
                    <div className="bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/20 text-right">
                      <span className="text-[10px] text-purple-200 block">Gross Billing</span>
                      <span className="text-sm font-bold text-white">₹{misGrossRevenue.toLocaleString()}</span>
                    </div>
                    <div className="bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/20 text-right">
                      <span className="text-[10px] text-emerald-200 block">Custom Commission</span>
                      <span className="text-sm font-bold text-emerald-300">₹{misTotalCommission.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setMisViewMode('ORDER')}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                      misViewMode === 'ORDER'
                        ? 'bg-white text-sky-900 shadow-xs border border-slate-200/80 font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Grouped by Order / Bill</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${misViewMode === 'ORDER' ? 'bg-sky-100 text-sky-800' : 'bg-slate-200 text-slate-600'}`}>
                      {filteredReferralMISOrders.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMisViewMode('TEST')}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                      misViewMode === 'TEST'
                        ? 'bg-white text-sky-900 shadow-xs border border-slate-200/80 font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Itemized by Investigation</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${misViewMode === 'TEST' ? 'bg-sky-100 text-sky-800' : 'bg-slate-200 text-slate-600'}`}>
                      {misTestRows.length}
                    </span>
                  </button>
                </div>

                <div className="text-[11px] text-slate-400">
                  {misViewMode === 'ORDER'
                    ? `Showing ${filteredReferralMISOrders.length} patient order bills with doctor & affiliation details`
                    : `Showing ${misTestRows.length} individual diagnostic investigation records and receptionist audit logs`}
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-sky-50 text-sky-900 uppercase text-[10px] tracking-wider border-b border-sky-100 font-extrabold">
                    <tr>
                      <th className="p-3.5">Date & Invoice</th>
                      <th className="p-3.5">Patient Details</th>
                      <th className="p-3.5">Doctor & Affiliation</th>
                      <th className="p-3.5">{misViewMode === 'ORDER' ? 'Investigation(s)' : 'Investigation'}</th>
                      <th className="p-3.5 text-right">MRP</th>
                      <th className="p-3.5 text-right">Discount</th>
                      <th className="p-3.5 text-right">Paid</th>
                      <th className="p-3.5 text-right">Due</th>
                      <th className="p-3.5">Billed By</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {misViewMode === 'ORDER' ? (
                      /* VIEW MODE A: ORDER / BILL GROUPED (1 row per invoice) */
                      filteredReferralMISOrders.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="p-8 text-center text-slate-400">
                            No referral records found matching your search query or doctor/organization filter.
                          </td>
                        </tr>
                      ) : (
                        filteredReferralMISOrders.map(({ order: ord, doctorName, doctorAffiliation, beneficiaryName, refDoc }) => {
                          const mrp = ord.subtotal || ord.totalAmount || 0;
                          const discount = ord.discountAmount || 0;
                          const paid = ord.paidAmount || 0;
                          const due = ord.dueAmount || 0;
                          const tests = ord.tests && ord.tests.length > 0 ? ord.tests : [{ id: 'd', name: 'Diagnostic Services', category: 'Pathology' as DiagnosticCategory }];

                          return (
                            <tr key={ord.id} className="hover:bg-sky-50/40 transition-colors">
                              {/* 1. Date & Invoice */}
                              <td className="p-3.5">
                                <span className="font-bold text-slate-900 block text-xs">
                                  {formatSafeDate(ord.createdAt)}
                                </span>
                                <span className="text-[10px] text-slate-400 block font-mono">
                                  {formatSafeTime(ord.createdAt)}
                                </span>
                                <span className="text-[10px] font-mono text-sky-700 font-semibold block mt-0.5">
                                  #{ord.invoiceNumber}
                                </span>
                              </td>

                              {/* 2. Patient Details */}
                              <td className="p-3.5">
                                <span className="font-bold text-slate-900 block text-sm">
                                  {ord.patient.name}
                                </span>
                                <span className="text-[11px] text-slate-500 block">
                                  {ord.patient.gender[0]}/{ord.patient.age}y • {ord.patient.phone}
                                </span>
                                <span className="text-[10px] font-mono text-sky-600 block mt-0.5">
                                  UHID: {ord.patientId}
                                </span>
                              </td>

                              {/* 3. Doctor & Affiliation */}
                              <td className="p-3.5">
                                <span className="font-bold text-slate-900 block text-xs">
                                  {doctorName}
                                </span>
                                {refDoc?.qualification && (
                                  <span className="text-[11px] text-slate-500 font-semibold block">
                                    {refDoc.qualification} {refDoc.registrationNo ? `• Reg: ${refDoc.registrationNo}` : ''}
                                  </span>
                                )}
                                {doctorAffiliation && (
                                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-medium">
                                    {doctorAffiliation}
                                  </span>
                                )}
                                {beneficiaryName && beneficiaryName !== doctorName && (
                                  <span className="inline-block mt-0.5 ml-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-medium" title="Commission Beneficiary">
                                    Ben: {beneficiaryName}
                                  </span>
                                )}
                              </td>

                              {/* 4. Investigation(s) */}
                              <td className="p-3.5 max-w-xs">
                                <div className="flex flex-wrap gap-1">
                                  {tests.map((t, tidx) => (
                                    <span
                                      key={`${t.id || tidx}`}
                                      className="inline-flex items-center px-1.5 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-100 text-[10px] font-semibold"
                                    >
                                      {t.name}
                                      {t.category && (
                                        <span className="text-[8px] text-sky-600 ml-1 font-normal opacity-80">
                                          ({t.category})
                                        </span>
                                      )}
                                    </span>
                                  ))}
                                </div>
                              </td>

                              {/* 5. MRP */}
                              <td className="p-3.5 font-bold text-slate-900 text-right whitespace-nowrap">
                                ₹{mrp.toLocaleString()}
                              </td>

                              {/* 6. Discount */}
                              <td className="p-3.5 font-semibold text-slate-600 text-right whitespace-nowrap">
                                {discount > 0 ? `₹${discount.toLocaleString()}` : '-'}
                              </td>

                              {/* 7. Paid */}
                              <td className="p-3.5 font-bold text-emerald-700 text-right whitespace-nowrap">
                                ₹{paid.toLocaleString()}
                              </td>

                              {/* 8. Due */}
                              <td className="p-3.5 font-bold text-rose-600 text-right whitespace-nowrap">
                                {due > 0 ? `₹${due.toLocaleString()}` : '-'}
                              </td>

                              {/* 9. Billed By */}
                              <td className="p-3.5">
                                <span className="font-bold text-slate-900 block text-xs">
                                  {resolveBilledByName(ord)}
                                </span>
                                <span className="text-[10px] text-slate-500 block font-medium">
                                  Reception Desk ({ord.centerCode || selectedCenter.code})
                                </span>
                              </td>

                              {/* 10. Actions */}
                              <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => setInvoiceModalOrder(ord)}
                                  className="px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                                  title="View Tax Invoice Receipt"
                                >
                                  Invoice
                                </button>
                                {refDoc && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const pendingBal = Math.max(0, refDoc.totalCommissionEarned - (refDoc.payoutPaid || 0));
                                      setPayoutDoctor(refDoc);
                                      setPayoutAmount(pendingBal);
                                    }}
                                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                                  >
                                    Disburse
                                  </button>
                                )}
                                {isSuperAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm(`Permanently remove Order #${ord.invoiceNumber} (${ord.patient.name}) from database?`)) {
                                        approveDeleteOrder(ord.id);
                                        showToast(`Removed order #${ord.invoiceNumber}`);
                                      }
                                    }}
                                    title="Permanently Delete Order"
                                    className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg transition-colors inline-flex cursor-pointer shadow-2xs align-middle"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )
                    ) : (
                      /* VIEW MODE B: ITEMIZED INVESTIGATION ROWS */
                      misTestRows.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="p-8 text-center text-slate-400">
                            No referral commission logs found matching your search query or doctor/organization filter.
                          </td>
                        </tr>
                      ) : (
                        misTestRows.map(({ order: ord, test, testKey, testIndex, testPrice, commEarned, doctorName, doctorAffiliation, beneficiaryName, refDoc, totalTestsInOrder }) => {
                          const pendingBalance = refDoc ? Math.max(0, refDoc.totalCommissionEarned - (refDoc.payoutPaid || 0)) : 0;
                          const mrp = testPrice;
                          const discount = ord.subtotal > 0 ? Math.round((ord.discountAmount || 0) * (mrp / ord.subtotal)) : (totalTestsInOrder === 1 ? (ord.discountAmount || 0) : 0);
                          const paid = ord.subtotal > 0 ? Math.round((ord.paidAmount || 0) * (mrp / ord.subtotal)) : (totalTestsInOrder === 1 ? (ord.paidAmount || 0) : mrp);
                          const due = Math.max(0, mrp - discount - paid);

                          return (
                            <tr key={testKey} className="hover:bg-sky-50/40 transition-colors">
                              {/* 1. Date & Invoice */}
                              <td className="p-3.5">
                                <span className="font-bold text-slate-900 block text-xs">
                                  {formatSafeDate(ord.createdAt)}
                                </span>
                                <span className="text-[10px] text-slate-400 block font-mono">
                                  {formatSafeTime(ord.createdAt)}
                                </span>
                                <span className="text-[10px] font-mono text-sky-700 font-semibold block mt-0.5">
                                  #{ord.invoiceNumber}
                                </span>
                              </td>

                              {/* 2. Patient Details */}
                              <td className="p-3.5">
                                <span className="font-bold text-slate-900 block text-sm">
                                  {ord.patient.name}
                                </span>
                                <span className="text-[11px] text-slate-500 block">
                                  {ord.patient.gender[0]}/{ord.patient.age}y • {ord.patient.phone}
                                </span>
                                <span className="text-[10px] font-mono text-sky-600 block mt-0.5">
                                  UHID: {ord.patientId}
                                </span>
                              </td>

                              {/* 3. Doctor & Affiliation */}
                              <td className="p-3.5">
                                <span className="font-bold text-slate-900 block text-xs">
                                  {doctorName}
                                </span>
                                {refDoc?.qualification && (
                                  <span className="text-[11px] text-slate-500 font-semibold block">
                                    {refDoc.qualification} {refDoc.registrationNo ? `• Reg: ${refDoc.registrationNo}` : ''}
                                  </span>
                                )}
                                {doctorAffiliation && (
                                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-medium">
                                    {doctorAffiliation}
                                  </span>
                                )}
                                {beneficiaryName && beneficiaryName !== doctorName && (
                                  <span className="inline-block mt-0.5 ml-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-medium">
                                    Ben: {beneficiaryName}
                                  </span>
                                )}
                              </td>

                              {/* 4. Investigation */}
                              <td className="p-3.5">
                                <span className="font-bold text-slate-900 block text-xs">
                                  {test.name}
                                </span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {test.category && (
                                    <span className="px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 text-[9px] font-bold">
                                      {test.category}
                                    </span>
                                  )}
                                  {totalTestsInOrder > 1 && (
                                    <span className="text-[9px] text-slate-400 font-medium">
                                      (Test {testIndex + 1} of {totalTestsInOrder})
                                    </span>
                                  )}
                                  {test.code && (
                                    <span className="text-[10px] font-mono text-slate-400">
                                      {test.code}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* 5. MRP */}
                              <td className="p-3.5 font-bold text-slate-900 text-right whitespace-nowrap">
                                ₹{mrp.toLocaleString()}
                              </td>

                              {/* 6. Discount */}
                              <td className="p-3.5 font-semibold text-slate-600 text-right whitespace-nowrap">
                                {discount > 0 ? `₹${discount.toLocaleString()}` : '-'}
                              </td>

                              {/* 7. Paid */}
                              <td className="p-3.5 font-bold text-emerald-700 text-right whitespace-nowrap">
                                ₹{paid.toLocaleString()}
                              </td>

                              {/* 8. Due */}
                              <td className="p-3.5 font-bold text-rose-600 text-right whitespace-nowrap">
                                {due > 0 ? `₹${due.toLocaleString()}` : '-'}
                              </td>

                              {/* 9. Billed By */}
                              <td className="p-3.5">
                                <span className="font-bold text-slate-900 block text-xs">
                                  {resolveBilledByName(ord)}
                                </span>
                                <span className="text-[10px] text-slate-500 block font-medium">
                                  Reception Desk ({ord.centerCode || selectedCenter.code})
                                </span>
                              </td>

                              {/* 10. Actions */}
                              <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => setInvoiceModalOrder(ord)}
                                  className="px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                                  title="View Tax Invoice Receipt"
                                >
                                  Invoice
                                </button>
                                {refDoc && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPayoutDoctor(refDoc);
                                      setPayoutAmount(pendingBalance > 0 ? pendingBalance : commEarned);
                                    }}
                                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                                  >
                                    Disburse
                                  </button>
                                )}
                                {isSuperAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm(`Permanently remove Order #${ord.invoiceNumber} (${ord.patient.name}) from database?`)) {
                                        approveDeleteOrder(ord.id);
                                        showToast(`Removed order #${ord.invoiceNumber}`);
                                      }
                                    }}
                                    title="Permanently Delete Order"
                                    className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg transition-colors inline-flex cursor-pointer shadow-2xs align-middle"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )
                    )}
                  </tbody>
                  {(misViewMode === 'ORDER' ? filteredReferralMISOrders.length > 0 : misTestRows.length > 0) && (
                    <tfoot className="bg-sky-50/70 border-t-2 border-sky-200 font-bold text-xs">
                      <tr>
                        <td colSpan={4} className="p-3.5 text-right uppercase tracking-wider text-slate-700 font-black">
                          Total Summaries:
                        </td>
                        <td className="p-3.5 text-right font-black text-sky-900 text-sm whitespace-nowrap">
                          ₹{(misViewMode === 'ORDER' ? misOrderTotalMRP : misTotalMRP).toLocaleString()}
                        </td>
                        <td className="p-3.5 text-right font-bold text-slate-700 whitespace-nowrap">
                          ₹{(misViewMode === 'ORDER' ? misOrderTotalDiscount : misTotalDiscount).toLocaleString()}
                        </td>
                        <td className="p-3.5 text-right font-bold text-emerald-800 whitespace-nowrap">
                          ₹{(misViewMode === 'ORDER' ? misOrderTotalPaid : misTotalPaid).toLocaleString()}
                        </td>
                        <td className="p-3.5 text-right font-bold text-rose-700 whitespace-nowrap">
                          ₹{(misViewMode === 'ORDER' ? misOrderTotalDue : misTotalDue).toLocaleString()}
                        </td>
                        <td className="p-3.5 text-center text-slate-400">-</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* VIEW 2: PARTNER SUMMARY LEADERBOARD */}
          {referralViewMode === 'PARTNER_SUMMARY' && (
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-sky-50 text-sky-900 uppercase text-[10px] tracking-wider border-b border-sky-100 font-bold">
                  <tr>
                    <th className="p-3.5">Rank</th>
                    <th className="p-3.5">Doctor & Organization</th>
                    <th className="p-3.5">Diagnostics Breakdown</th>
                    <th className="p-3.5">Affiliation</th>
                    <th className="p-3.5">Referred Patients</th>
                    <th className="p-3.5">Gross Revenue</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedReferrers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No referral partner records found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    sortedReferrers.map((doc, idx) => {
                      const bdown = doctorDiagnosticsBreakdown.get(doc.name.toLowerCase()) || { MRI: 0, CT: 0, USG: 0, XRay: 0, Pathology: 0, Cardiology: 0, Other: 0 };

                      return (
                        <tr key={doc.id} className="hover:bg-sky-50/40">
                          <td className="p-3.5 font-black text-sm text-slate-800">
                            #{idx + 1}
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-slate-900 block text-sm">{doc.name}</span>
                            {doc.qualification ? (
                              <span className="text-[11px] font-bold text-indigo-700 block mt-0.5">
                                {doc.qualification} {doc.registrationNo ? `• Reg: ${doc.registrationNo}` : ''}
                              </span>
                            ) : null}
                            <span className="text-[11px] text-sky-700 font-semibold">{doc.specialty} • {doc.hospital}</span>
                            {doc.organizationName && (
                              <span className="text-[10px] text-purple-700 font-bold block mt-0.5">Org: {doc.organizationName}</span>
                            )}
                          </td>
                          <td className="p-3.5 max-w-[200px]">
                            <div className="flex flex-wrap gap-1">
                              {bdown.MRI > 0 && <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 text-[10px] font-bold">MRI: {bdown.MRI}</span>}
                              {bdown.CT > 0 && <span className="px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800 text-[10px] font-bold">CT: {bdown.CT}</span>}
                              {bdown.USG > 0 && <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold">USG: {bdown.USG}</span>}
                              {bdown.XRay > 0 && <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">X-Ray: {bdown.XRay}</span>}
                              {bdown.Pathology > 0 && <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Path: {bdown.Pathology}</span>}
                              {bdown.Cardiology > 0 && <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">Echo: {bdown.Cardiology}</span>}
                              {bdown.MRI === 0 && bdown.CT === 0 && bdown.USG === 0 && bdown.XRay === 0 && bdown.Pathology === 0 && bdown.Cardiology === 0 && (
                                <span className="text-[10px] text-slate-400">General OPD</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              doc.affiliationType === 'ORGANIZATION'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {doc.affiliationType === 'ORGANIZATION' ? 'Organization' : 'Self / Independent'}
                            </span>
                          </td>
                          <td className="p-3.5 font-bold text-slate-900">
                            <button
                              type="button"
                              onClick={() => setReferredOrdersModalDoc(doc)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold border border-sky-200 transition-all cursor-pointer shadow-2xs hover:scale-105"
                              title="Click to view all referred patients"
                            >
                              <span>{doc.totalReferralsCount}</span>
                              <span className="text-[10px] font-semibold text-sky-600 underline">view</span>
                            </button>
                          </td>
                          <td className="p-3.5 font-black text-sky-700 text-sm">
                            ₹{doc.totalRevenueGenerated.toLocaleString()}
                          </td>
                          <td className="p-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {doc.phone && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const url = sendWelcomeDoctorWhatsApp(doc);
                                    window.open(url, '_blank');
                                    showToast(`WhatsApp welcome message drafted for ${doc.name}`);
                                  }}
                                  className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                                  title="Send WhatsApp Welcome / Statement"
                                >
                                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="hidden sm:inline">WhatsApp</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: EXPENSES & AMC */}
      {activeTab === 'EXPENSES' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 bg-white border border-sky-100 rounded-3xl shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-rose-600" />
                  Operational Expenses, Rent & AMC ({filteredExpenses.length})
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
                  Total: ₹{totalFilteredExpensesAmount.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Log recurring bills across centers and sync with accounting ledger.
              </p>
            </div>
            <button
              onClick={() => setIsAddExpenseModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-2xl transition-all shadow-xs cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </button>
          </div>

          {/* Expense Filter Bar */}
          <div className="bg-white border border-sky-100 rounded-3xl p-4 shadow-xs">
            <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={expSearch}
                  onChange={e => setExpSearch(e.target.value)}
                  placeholder="Search expense by title, vendor, voucher, or mode..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Category Selector */}
                <select
                  value={expCategoryFilter}
                  onChange={e => setExpCategoryFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  <option value="Electricity & Utilities">Electricity & Utilities</option>
                  <option value="Reagents & Lab Consumables">Reagents & Consumables</option>
                  <option value="Machine AMC & Maintenance">Machine AMC & Maintenance</option>
                  <option value="Clinic Rent & Rates">Clinic Rent & Rates</option>
                  <option value="Marketing & Outreach">Marketing & Outreach</option>
                  <option value="Admin & Miscellaneous">Admin & Misc</option>
                </select>

                {/* Payment Mode Selector */}
                <select
                  value={expPaymentModeFilter}
                  onChange={e => setExpPaymentModeFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs cursor-pointer"
                >
                  <option value="ALL">All Payment Modes</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>

                {/* Date Range Filter */}
                <DateRangeFilter
                  preset={expDateRange}
                  startDate={expStartDate}
                  endDate={expEndDate}
                  onPresetChange={setExpDateRange}
                  onStartDateChange={setExpStartDate}
                  onEndDateChange={setExpEndDate}
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-sky-100 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-sky-50 text-sky-900 uppercase text-[10px] tracking-wider border-b border-sky-100 font-bold">
                  <tr>
                    <th className="p-3.5">Expense & Voucher</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Paid To Vendor</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Payment Mode</th>
                    <th className="p-3.5">Amount (₹)</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No operational expenses logged matching active filters.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map(exp => (
                      <tr key={exp.id} className="hover:bg-slate-50">
                        <td className="p-3.5">
                          <span className="font-bold text-slate-900 block">{exp.title}</span>
                          <span className="font-mono text-slate-400 text-[10px]">{exp.receiptNo}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold">
                            {exp.category}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-700">{exp.paidTo}</td>
                        <td className="p-3.5 text-slate-500">{exp.date}</td>
                        <td className="p-3.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide border ${
                            exp.paymentMode === 'Cash'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : exp.paymentMode === 'UPI'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : exp.paymentMode === 'Card'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : exp.paymentMode === 'Bank Transfer'
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {exp.paymentMode === 'Cash' && <DollarSign className="w-3 h-3 text-emerald-600" />}
                            {exp.paymentMode === 'UPI' && <QrCode className="w-3 h-3 text-purple-600" />}
                            {exp.paymentMode === 'Card' && <CreditCard className="w-3 h-3 text-blue-600" />}
                            <span>{exp.paymentMode || 'Cash'}</span>
                          </span>
                        </td>
                        <td className="p-3.5 font-black text-rose-600 text-sm">
                          ₹{exp.amount.toLocaleString()}
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Remove expense voucher "${exp.title}" (₹${exp.amount})?`)) {
                                approveDeleteExpense(exp.id);
                                showToast(`Removed expense voucher`);
                              }
                            }}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors inline-flex cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: STAFF, CREDENTIALS & PAYROLL */}
      {activeTab === 'PAYROLL' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 bg-white border border-sky-100 rounded-3xl shadow-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-sky-600" />
                {isSuperAdmin ? 'Staff Members, Credentials & Monthly Payroll' : 'Staff Directory & Workstation Credentials'}
              </h3>
              <p className="text-xs text-slate-500">
                {isSuperAdmin
                  ? 'Create login usernames/passwords for your staff, upload doctor digital signatures & seals, and assign centers.'
                  : 'Staff accounts, assigned diagnostic centers, and workstation login credentials.'}
              </p>
            </div>
            <button
              onClick={() => setIsAddStaffModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-2xl transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              + Add Employee & Credentials
            </button>
          </div>

          <div className="bg-white border border-sky-100 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-sky-50 text-sky-900 uppercase text-[10px] tracking-wider border-b border-sky-100 font-bold">
                  <tr>
                    <th className="p-3.5">Employee & Role</th>
                    <th className="p-3.5">Assigned Center</th>
                    <th className="p-3.5">Login & Logout Time</th>
                    <th className="p-3.5">Login Username</th>
                    <th className="p-3.5">Login Password</th>
                    <th className="p-3.5">Digital Sign / Seal</th>
                    {isSuperAdmin && <th className="p-3.5">Monthly Salary</th>}
                    <th className="p-3.5 text-center">Working Hours</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleStaff.map(emp => {
                    const empCenter = centers.find(c => c.id === emp.assignedCenterId);

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50">
                        <td className="p-3.5">
                          <span className="font-bold text-slate-900 block text-sm">{emp.name}</span>
                          <span className="text-sky-700 text-[11px] font-semibold">{emp.role} • {emp.phone}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2.5 py-1 rounded-lg bg-sky-100 text-sky-900 font-bold text-xs inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-sky-600" />
                            {emp.assignedCenterId === 'ALL' ? 'GLOBAL' : (empCenter?.code || 'ATL-MAIN')}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-200/80 font-bold text-xs whitespace-nowrap shadow-2xs">
                            <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span>{emp.shiftTiming || emp.shift || 'General (9:00 AM - 6:00 PM)'}</span>
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                            {decodeURIComponent(String(emp.username || '')).trim() || emp.name.toLowerCase().replace(/\s+/g, '')}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-mono font-bold text-slate-500 bg-slate-50 px-2 py-0.5 border border-slate-200 rounded">
                            {emp.password || "Atlas@123"}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {emp.signatureUrl || emp.sealUrl ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Uploaded
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">Not Uploaded</span>
                          )}
                        </td>
                        {isSuperAdmin && (
                          <td className="p-3.5 font-bold text-slate-900">
                            ₹{emp.monthlySalary.toLocaleString()}
                          </td>
                        )}
                        <td className="p-3.5 text-center">
                          <span className="font-bold text-sky-700 bg-sky-50 border border-sky-200/80 px-2.5 py-1 rounded-lg text-xs inline-block shadow-2xs">
                            {calculateWorkingHours(emp.shift, emp.shiftStartTime, emp.shiftEndTime)}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                          {/* Send WhatsApp Credentials */}
                          <button
                            type="button"
                            onClick={() => {
                              const url = sendWelcomeStaffWhatsApp(emp);
                              window.open(url, '_blank');
                              showToast(`WhatsApp credentials drafted for ${emp.name}`);
                            }}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                            title="Send Workstation Login Credentials via WhatsApp"
                          >
                            <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </button>

                          {/* Edit Credentials & Permissions */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStaff(emp);
                              setEditStaffName(emp.name);
                              setEditStaffRole(emp.role);
                              setEditStaffCenterId(emp.assignedCenterId);
                              const isStandard = ['Morning (8:00 AM - 4:00 PM)', 'Morning (8 AM - 4 PM)', 'Evening (2:00 PM - 10:00 PM)', 'Evening (2 PM - 10 PM)', 'Night (10:00 PM - 6:00 AM)', 'Night (10 PM - 6 AM)', 'General (9:00 AM - 6:00 PM)', 'General Day (9 AM - 6 PM)'].includes(emp.shift || '');
                              if (isStandard) {
                                setEditStaffShiftCustom(false);
                                setEditStaffShift(emp.shift || 'Morning (8:00 AM - 4:00 PM)');
                                setEditStaffShiftStart(parseCleanTime(emp.shiftStartTime, false, emp.shift?.includes('8') ? '08:00 AM' : emp.shift?.includes('2') ? '02:00 PM' : emp.shift?.includes('10') ? '10:00 PM' : '09:00 AM'));
                                setEditStaffShiftEnd(parseCleanTime(emp.shiftEndTime, true, emp.shift?.includes('4') ? '04:00 PM' : emp.shift?.includes('10') ? '10:00 PM' : emp.shift?.includes('6') ? '06:00 AM' : '06:00 PM'));
                              } else {
                                setEditStaffShiftCustom(true);
                                setEditStaffShift(emp.shift || 'Custom');
                                setEditStaffShiftStart(parseCleanTime(emp.shiftStartTime || emp.shift, false, '10:00 AM'));
                                setEditStaffShiftEnd(parseCleanTime(emp.shiftEndTime || emp.shift, true, '10:00 PM'));
                              }
                              setEditStaffSalary(emp.monthlySalary !== undefined ? emp.monthlySalary : 12000);
                              setEditStaffUsername(decodeURIComponent(String(emp.username || '')).trim() || emp.name.toLowerCase().replace(/\s+/g, ''));
                              setEditStaffPassword(emp.password || 'Atlas@123');
                              setEditStaffPhone(emp.phone || '');
                              setEditStaffEmail(emp.email || '');
                              setEditStaffPermissions(emp.permissions || {
                                canCreateInvoices: true,
                                canCollectPayments: true,
                                canProcessRefunds: isSuperAdmin,
                                canEditCatalog: isSuperAdmin,
                                canViewMISReports: isSuperAdmin,
                                canApproveDeletions: isSuperAdmin,
                                canManageStaff: isSuperAdmin,
                                canManageReferrals: true,
                                canAccessAppointments: true,
                                canAuthorizeReports: emp.role === 'Pathologist' || emp.role === 'Radiologist'
                              });
                            }}
                            className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="Edit Credentials & Access Rights"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-sky-600" />
                            <span>Edit Credentials</span>
                          </button>

                          {isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete ${emp.name}?`)) {
                                  deleteStaff?.(emp.id);
                                  showToast(`${emp.name} deleted.`);
                                }
                              }}
                              className="px-2 py-1.5 ml-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer"
                              title="Delete Staff Member"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: CENTER BRANCHES */}
      {activeTab === 'BRANCHES' && isSuperAdmin && (
        <div className="space-y-6">
          <div className="bg-white border border-sky-100 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3.5 bg-sky-50 text-sky-600 rounded-2xl border border-sky-200">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Diagnostic Centers & Branch Network
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
                    {centers.length} Centers Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Multi-branch isolation, automatic Google Sheet tab routing, and center-level performance telemetry.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAddCenterModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              + Add Center Branch
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {centers.map(center => {
              const cOrders = allOrders.filter(o => o.centerId === center.id);
              const cRevenue = cOrders.reduce((sum, o) => sum + o.totalAmount, 0);
              const cStaff = staff.filter(s => s.assignedCenterId === center.id);
              const isSelected = selectedCenter.id === center.id;

              return (
                <div
                  key={center.id}
                  className={`bg-white border rounded-3xl p-5 shadow-xs flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'border-sky-500 ring-2 ring-sky-200 shadow-md'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2.5 rounded-2xl ${isSelected ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{center.name}</h4>
                          <span className="text-[10px] font-mono text-slate-500">{center.code}</span>
                        </div>
                      </div>
                      {center.isMain && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900">
                          Main Hub
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                      <div className="flex items-center gap-2 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span className="truncate">{center.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] pt-1 border-t border-slate-200/60 font-mono text-sky-800">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Tab: {center.sheetName}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                        <span className="text-slate-500 font-medium">Connection:</span>
                        {((!isOnline && isSelected) || cOrders.filter(o => !o.syncedToGoogleSheets && !o.isDeleted && !o.deletionPendingApproval).length > 0) ? (
                          <span className="font-bold text-amber-700 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                            {cOrders.filter(o => !o.syncedToGoogleSheets && !o.isDeleted && !o.deletionPendingApproval).length > 0
                              ? `${cOrders.filter(o => !o.syncedToGoogleSheets && !o.isDeleted && !o.deletionPendingApproval).length} pending sync`
                              : 'Offline (Local DB)'}
                          </span>
                        ) : (
                          <span className="font-bold text-emerald-700 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Cloud Linked
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Orders</span>
                        <span className="text-sm font-black text-slate-900">{cOrders.length}</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Revenue</span>
                        <span className="text-sm font-black text-emerald-600">₹{cRevenue.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-2 border-t border-slate-100">
                    {isSelected ? (
                      <div className="w-full py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Currently Active Workstation</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCenter(center);
                          showToast(`Switched active workstation to ${center.name}`);
                        }}
                        className="w-full py-2 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Building2 className="w-3.5 h-3.5 text-sky-600" />
                        <span>Switch Workstation Here</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: Add / Edit Diagnostic Test */}
      {isAddTestModalOpen && isSuperAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-900 text-base">
              {editingTest ? 'Edit Diagnostic Test Tariff' : 'Add New Diagnostic Test'}
            </h3>
            <form onSubmit={handleSaveTest} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Test Name *</label>
                <input
                  type="text"
                  required
                  value={testName}
                  onChange={e => setTestName(e.target.value)}
                  placeholder="e.g. Thyroid Stimulating Hormone (TSH)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category</label>
                  <select
                    value={testCategory}
                    onChange={e => setTestCategory(e.target.value as DiagnosticCategory)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  >
                    <option value="Pathology">Pathology</option>
                    <option value="Radiology">Radiology</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Specialized">Specialized</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Department</label>
                  <input
                    type="text"
                    value={testDepartment}
                    onChange={e => setTestDepartment(e.target.value)}
                    placeholder="e.g. Biochemistry"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Patient Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={testPrice}
                    onChange={e => setTestPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold text-sky-700"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">TAT (Hours)</label>
                  <input
                    type="number"
                    min={1}
                    value={testTatHours}
                    onChange={e => setTestTatHours(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Specimen / Sample Type</label>
                <select
                  value={testSampleType}
                  onChange={e => setTestSampleType(e.target.value as TestSampleType)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold"
                >
                  <optgroup label="Blood Specimens">
                    <option value="Tube (EDTA)">Tube (EDTA)</option>
                    <option value="Tube (Serum)">Tube (Serum)</option>
                    <option value="Tube (Clot Activator)">Tube (Clot Activator)</option>
                    <option value="Tube (Sodium Citrate)">Tube (Sodium Citrate)</option>
                    <option value="Tube (Sodium Heparin)">Tube (Sodium Heparin)</option>
                    <option value="Tube (Sodium Fluoride)">Tube (Sodium Fluoride)</option>
                    <option value="Tube (SST Gel)">Tube (SST Gel)</option>
                  </optgroup>
                  <optgroup label="Other Laboratory Specimens">
                    <option value="Urine">Urine</option>
                    <option value="Swab">Swab</option>
                  </optgroup>
                  <optgroup label="Radiology & Imaging Scans">
                    <option value="Digital Imaging">Digital Imaging</option>
                    <option value="Ultrasound Scan">Ultrasound Scan</option>
                    <option value="MRI Scan">MRI Scan</option>
                    <option value="CT Scan">CT Scan</option>
                  </optgroup>
                </select>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  Save Test
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddTestModalOpen(false);
                    setEditingTest(null);
                  }}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Staff & Credentials with Signature/Seal Upload */}
      {isAddStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xl my-6">
            <h3 className="font-bold text-slate-900 text-base">Add Staff Member & Credentials</h3>
            <form onSubmit={handleCreateStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={e => setStaffName(e.target.value)}
                  placeholder="e.g. Dr. Ananya Sen / Rahul Varma"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Staff Role</label>
                  <select
                    value={staffRole}
                    onChange={e => setStaffRole(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  >
                    <option value="Receptionist">Receptionist</option>
                    <option value="Radiologist">Radiologist</option>
                    <option value="Pathologist">Pathologist</option>
                    <option value="Lab Technician">Lab Technician</option>
                    <option value="Phlebotomist">Phlebotomist</option>
                    <option value="Center Manager">Center Manager</option>{isSuperAdmin && <option value="Super Admin">Super Admin</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Assigned Center *</label>
                  <select
                    value={staffCenterId}
                    onChange={e => setStaffCenterId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold"
                  >
                    {centers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Shift Timing Section */}
              <div className="p-3 bg-indigo-50/60 border border-indigo-200/80 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    Login & Logout Time:
                  </span>
                  <span className="text-[10px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200 shadow-2xs">
                    {staffShiftCustom ? `Custom (${parseCleanTime(staffShiftStart, false, '10:00 AM')} - ${parseCleanTime(staffShiftEnd, true, '10:00 PM')})` : staffShift}
                  </span>
                </div>

                {/* Quick Preset Shift Pills */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {[
                    { label: 'Morning (8 AM - 4 PM)', start: '08:00 AM', end: '04:00 PM', value: 'Morning (8:00 AM - 4:00 PM)' },
                    { label: 'Evening (2 PM - 10 PM)', start: '02:00 PM', end: '10:00 PM', value: 'Evening (2:00 PM - 10:00 PM)' },
                    { label: 'Night (10 PM - 6 AM)', start: '10:00 PM', end: '06:00 AM', value: 'Night (10:00 PM - 6:00 AM)' },
                    { label: 'General (9 AM - 6 PM)', start: '09:00 AM', end: '06:00 PM', value: 'General (9:00 AM - 6:00 PM)' },
                  ].map(p => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => {
                        setStaffShiftCustom(false);
                        setStaffShift(p.value);
                        setStaffShiftStart(p.start);
                        setStaffShiftEnd(p.end);
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        !staffShiftCustom && staffShift === p.value
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-white text-indigo-900 border border-indigo-200 hover:bg-indigo-50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setStaffShiftCustom(true)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      staffShiftCustom
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-white text-indigo-900 border border-indigo-200 hover:bg-indigo-50'
                    }`}
                  >
                    ⚙️ Custom Shift
                  </button>
                </div>

                {staffShiftCustom ? (
                  <div className="space-y-1.5 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Start Time</label>
                        <input
                          type="text"
                          value={staffShiftStart}
                          onChange={e => setStaffShiftStart(e.target.value)}
                          placeholder="10:00 AM"
                          className="w-full bg-white border border-indigo-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-0.5">End Time</label>
                        <input
                          type="text"
                          value={staffShiftEnd}
                          onChange={e => setStaffShiftEnd(e.target.value)}
                          placeholder="10:00 PM"
                          className="w-full bg-white border border-indigo-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[11px] text-slate-600 bg-white/80 p-2 rounded-xl border border-indigo-100">
                    <span>Working Schedule: <strong>{staffShiftStart} to {staffShiftEnd}</strong></span>
                    <button
                      type="button"
                      onClick={() => setStaffShiftCustom(true)}
                      className="text-xs text-indigo-600 font-bold hover:underline"
                    >
                      Customize Hours →
                    </button>
                  </div>
                )}
              </div>

              {/* Login Credentials Box */}
              <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-2.5">
                <span className="font-bold text-sky-950 text-xs flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-sky-600" />
                  Staff Login Credentials:
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Username *</label>
                    <input
                      type="text"
                      required
                      value={staffUsername}
                      onChange={e => setStaffUsername(e.target.value)}
                      placeholder="e.g. ananya.sen"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Password *</label>
                    <input
                      type="text"
                      required
                      value={staffPassword}
                      onChange={e => setStaffPassword(e.target.value)}
                      placeholder="Atlas@123"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Doctor Registration No & Signature / Seal (for Doctors) */}
              {(staffRole === 'Radiologist' || staffRole === 'Pathologist') && (
                <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-3">
                  <span className="font-bold text-purple-950 text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                    Doctor Digital Sign & Seal (Appears on Reports):
                  </span>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Medical Council Reg. No.</label>
                    <input
                      type="text"
                      value={staffRegNo}
                      onChange={e => setStaffRegNo(e.target.value)}
                      placeholder="e.g. DMC / 48291 / 2015"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Doctor Signature (PNG/JPG/Data URL)</label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => setStaffSignatureUrl(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full text-[10px] text-slate-500"
                      />
                      {staffSignatureUrl && (
                        <div className="mt-1 p-1 bg-white border border-slate-200 rounded flex items-center justify-between text-[9px] text-emerald-700 font-semibold">
                          <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-600 stroke-[3]" /> Signature Uploaded</span>
                          <button type="button" onClick={() => setStaffSignatureUrl('')} className="text-rose-600 font-bold">Remove</button>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Doctor Seal / Stamp</label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => setStaffSealUrl(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full text-[10px] text-slate-500"
                      />
                      {staffSealUrl && (
                        <div className="mt-1 p-1 bg-white border border-slate-200 rounded flex items-center justify-between text-[9px] text-emerald-700 font-semibold">
                          <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-600 stroke-[3]" /> Seal Uploaded</span>
                          <button type="button" onClick={() => setStaffSealUrl('')} className="text-rose-600 font-bold">Remove</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    value={staffPhone}
                    onChange={e => setStaffPhone(e.target.value)}
                    placeholder="+91 98XXX XXXXX"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email Address (Optional)</label>
                  <input
                    type="email"
                    value={staffEmail}
                    onChange={e => setStaffEmail(e.target.value)}
                    placeholder="e.g. employee@hospital.org"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              {isSuperAdmin && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Monthly Salary (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={staffSalary}
                    onChange={e => setStaffSalary(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  Create Staff Member
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddStaffModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Approve Doctor (Commission Removed, Full Profile Details Editable) */}
      {approvingDoctor && isSuperAdmin && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in"
          onClick={e => {
            if (e.target === e.currentTarget) setApprovingDoctor(null);
          }}
        >
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Verify & Approve Doctor to Roster</h3>
                  <p className="text-[11px] text-slate-500">Edit and verify doctor credentials before activating in clinical roster</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApprovingDoctor(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Editable Doctor Details by Super Admin */}
            <div className="bg-sky-50/50 border border-sky-200 rounded-2xl p-4 space-y-3.5 text-xs">
              <span className="font-bold text-sky-950 text-xs block">
                Doctor Profile & Credentials (Editable by Super Admin):
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Doctor Full Name *</label>
                  <input
                    type="text"
                    value={editApproveName}
                    onChange={e => setEditApproveName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-sky-500"
                    placeholder="e.g. Dr. Rajesh Kumar"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Degree / Qualification *</label>
                  <input
                    type="text"
                    value={editApproveQualification}
                    onChange={e => setEditApproveQualification(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500"
                    placeholder="e.g. MBBS, MD Radiodiagnosis"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Medical Specialty *</label>
                  <input
                    type="text"
                    value={editApproveSpecialty}
                    onChange={e => setEditApproveSpecialty(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500"
                    placeholder="e.g. Consultant Radiologist, Sonologist"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Clinic / Hospital Name *</label>
                  <input
                    type="text"
                    value={editApproveHospital}
                    onChange={e => setEditApproveHospital(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500"
                    placeholder="e.g. City Hospital, Apollo Clinic"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Medical Council Reg. No</label>
                  <input
                    type="text"
                    value={editApproveRegNo}
                    onChange={e => setEditApproveRegNo(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:ring-2 focus:ring-sky-500"
                    placeholder="e.g. MP 13663 / MP 27139"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Affiliation / Association Type</label>
                  <select
                    value={editApproveAffiliationType}
                    onChange={e => setEditApproveAffiliationType(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="SELF">Self / Independent Practice</option>
                    <option value="ORGANIZATION">Hospital / Partner Organization</option>
                  </select>
                </div>
              </div>

              {editApproveAffiliationType === 'ORGANIZATION' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Organization / Beneficiary *</label>
                  <input
                    type="text"
                    value={editApproveOrgName}
                    onChange={e => setEditApproveOrgName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500"
                    placeholder="e.g. City Healthcare Group / Beneficiary Partner"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Mobile Phone / WhatsApp *</label>
                  <input
                    type="tel"
                    value={editApprovePhone}
                    onChange={e => setEditApprovePhone(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:ring-2 focus:ring-sky-500"
                    placeholder="+91 98XXX XXXXX"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editApproveEmail}
                    onChange={e => setEditApproveEmail(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500"
                    placeholder="doctor@hospital.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Operational Notes / Specialization Remarks</label>
                <input
                  type="text"
                  value={editApproveNotes}
                  onChange={e => setEditApproveNotes(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500"
                  placeholder="e.g. Morning OPD referrals, Emergency Sonography"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleConfirmApproval}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all"
              >
                <UserCheck className="w-4 h-4" />
                Confirm Details & Approve Doctor
              </button>
              <button
                type="button"
                onClick={() => setApprovingDoctor(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit Approved Doctor Details (Super Admin) */}
      
      {/* MODAL: Register New Doctor Partner */}
      {isRegisterPartnerModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in"
          onClick={e => {
            if (e.target === e.currentTarget) setIsRegisterPartnerModalOpen(false);
          }}
        >
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Add Referring Doctor / Healthcare Partner</h3>
                  <p className="text-[11px] text-slate-500">Register doctor to the active roster for clinical referral tracking</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterPartnerModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterNewPartner} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Doctor Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newPartnerName}
                    onChange={e => setNewPartnerName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-sky-500"
                    placeholder="e.g. Dr. Rajesh Kumar"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Degree / Qualification</label>
                  <input
                    type="text"
                    value={newPartnerQualification}
                    onChange={e => setNewPartnerQualification(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500"
                    placeholder="e.g. MBBS, MD (Medicine)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Clinical Specialty</label>
                  <input
                    type="text"
                    value={newPartnerSpecialty}
                    onChange={e => setNewPartnerSpecialty(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500"
                    placeholder="e.g. Cardiology, Orthopedics"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Hospital / Clinic Name</label>
                  <input
                    type="text"
                    value={newPartnerHospital}
                    onChange={e => setNewPartnerHospital(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500"
                    placeholder="e.g. Apollo Hospital / Private Clinic"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Affiliation Entity Type</label>
                  <select
                    value={newPartnerAffiliationType}
                    onChange={e => setNewPartnerAffiliationType(e.target.value as 'SELF' | 'ORGANIZATION')}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="SELF">Individual Doctor (Self Practice)</option>
                    <option value="ORGANIZATION">Organization / Hospital / Polyclinic</option>
                  </select>
                </div>
                {newPartnerAffiliationType === 'ORGANIZATION' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Beneficiary Organization Name *</label>
                    <input
                      type="text"
                      required
                      value={newPartnerOrgName}
                      onChange={e => setNewPartnerOrgName(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-sky-500"
                      placeholder="e.g. City Health Polyclinic"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Mobile / WhatsApp</label>
                  <input
                    type="text"
                    value={newPartnerPhone}
                    onChange={e => setNewPartnerPhone(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500"
                    placeholder="10-digit number"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newPartnerEmail}
                    onChange={e => setNewPartnerEmail(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500"
                    placeholder="doctor@example.com"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Medical Reg No (MCI/SMC)</label>
                  <input
                    type="text"
                    value={newPartnerRegNo}
                    onChange={e => setNewPartnerRegNo(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500"
                    placeholder="e.g. MCI-98765"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Administrative Notes</label>
                <input
                  type="text"
                  value={newPartnerNotes}
                  onChange={e => setNewPartnerNotes(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500"
                  placeholder="Optional remarks or center association"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRegisterPartnerModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  Save & Activate Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingApprovedDoctor && isSuperAdmin && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in"
          onClick={e => {
            if (e.target === e.currentTarget) setEditingApprovedDoctor(null);
          }}
        >
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Edit Doctor Details</h3>
                  <p className="text-[11px] text-slate-500">Update doctor profile credentials, clinic, and contact information</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingApprovedDoctor(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Doctor Full Name *</label>
                  <input
                    type="text"
                    value={editApproveName}
                    onChange={e => setEditApproveName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-sky-500"
                    placeholder="e.g. Dr. Rajesh Kumar"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Degree / Qualification *</label>
                  <input
                    type="text"
                    value={editApproveQualification}
                    onChange={e => setEditApproveQualification(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500"
                    placeholder="e.g. MBBS, MD Radiodiagnosis"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Medical Specialty *</label>
                  <input
                    type="text"
                    value={editApproveSpecialty}
                    onChange={e => setEditApproveSpecialty(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500"
                    placeholder="e.g. Consultant Radiologist"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Clinic / Hospital Name *</label>
                  <input
                    type="text"
                    value={editApproveHospital}
                    onChange={e => setEditApproveHospital(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500"
                    placeholder="e.g. Apollo Hospital"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Medical Council Reg. No</label>
                  <input
                    type="text"
                    value={editApproveRegNo}
                    onChange={e => setEditApproveRegNo(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:ring-2 focus:ring-sky-500"
                    placeholder="e.g. MP 13663 / MP 27139"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Affiliation / Association Type</label>
                  <select
                    value={editApproveAffiliationType}
                    onChange={e => setEditApproveAffiliationType(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="SELF">Self / Independent Practice</option>
                    <option value="ORGANIZATION">Hospital / Partner Organization</option>
                  </select>
                </div>
              </div>

              {editApproveAffiliationType === 'ORGANIZATION' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Organization / Beneficiary *</label>
                  <input
                    type="text"
                    value={editApproveOrgName}
                    onChange={e => setEditApproveOrgName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500"
                    placeholder="e.g. City Healthcare Group / Beneficiary Partner"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Mobile Phone / WhatsApp *</label>
                  <input
                    type="tel"
                    value={editApprovePhone}
                    onChange={e => setEditApprovePhone(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:ring-2 focus:ring-sky-500"
                    placeholder="+91 98XXX XXXXX"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editApproveEmail}
                    onChange={e => setEditApproveEmail(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500"
                    placeholder="doctor@hospital.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Operational Notes / Specialization Remarks</label>
                <input
                  type="text"
                  value={editApproveNotes}
                  onChange={e => setEditApproveNotes(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500"
                  placeholder="e.g. Morning OPD referrals, Emergency Sonography"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSaveApprovedDoctorEdit}
                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all"
              >
                <Check className="w-4 h-4" />
                Save Doctor Changes
              </button>
              <button
                type="button"
                onClick={() => setEditingApprovedDoctor(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit Commission */}
      {editingDoctor && isSuperAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-900 text-sm">
              Update Commission: {editingDoctor.name}
            </h3>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">New Percentage (0 - 100%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={newCommissionRate}
                onChange={e => {
                  const val = Number(e.target.value);
                  setNewCommissionRate(Math.min(100, Math.max(0, isNaN(val) ? 0 : val)));
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-bold"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleConfirmCommissionChange}
                className="flex-1 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl"
              >
                Save
              </button>
              <button
                onClick={() => setEditingDoctor(null)}
                className="px-3 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Record Doctor Payout */}
      {payoutDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-900 text-sm">
              Record Referral Settlement: {payoutDoctor.name}
            </h3>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Payout Amount (₹)</label>
              <input
                type="number"
                value={payoutAmount}
                onChange={e => setPayoutAmount(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-emerald-700 font-bold"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleConfirmPayout}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl"
              >
                Record Payout
              </button>
              <button
                onClick={() => setPayoutDoctor(null)}
                className="px-3 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add Expense */}
      {isAddExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-900 text-base">Add Operational Expense</h3>
            <form onSubmit={handleCreateExpense} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Expense Title *</label>
                <input
                  type="text"
                  required
                  value={expTitle}
                  onChange={e => setExpTitle(e.target.value)}
                  placeholder="e.g. Center Commercial Power Bill"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category</label>
                  <select
                    value={expCategory}
                    onChange={e => setExpCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  >
                    <option value="Electricity & Utilities">Electricity & Utilities</option>
                    <option value="Center Rent">Center Rent</option>
                    <option value="Lab Reagents & Chemicals">Lab Reagents & Chemicals</option>
                    <option value="Equipment AMC & Maintenance">Equipment AMC & Maintenance</option>
                    <option value="Stationery & IT">Stationery & IT</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Center</label>
                  <select
                    value={expCenterId}
                    onChange={e => setExpCenterId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  >
                    {centers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={expAmount}
                    onChange={e => setExpAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 35000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Paid To Vendor *</label>
                  <input
                    type="text"
                    required
                    value={expPaidTo}
                    onChange={e => setExpPaidTo(e.target.value)}
                    placeholder="Vendor Name"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Payment Mode *</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {(['Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque'] as Array<OperatingExpense['paymentMode']>).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setExpMode(mode)}
                      className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        expMode === mode
                          ? 'bg-sky-600 text-white border-sky-600 shadow-xs ring-2 ring-sky-300'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  Save Expense
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddExpenseModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Log Hours */}
      {loggingHoursStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-900 text-sm">
              Log Working Shift: {loggingHoursStaff.name}
            </h3>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Hours to Add to Timesheet</label>
              <input
                type="number"
                min={1}
                max={24}
                value={hoursToAdd}
                onChange={e => setHoursToAdd(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-sky-700 font-bold"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  updateStaffHours(loggingHoursStaff.id, hoursToAdd);
                  showToast(`Logged ${hoursToAdd} hours for ${loggingHoursStaff.name}`);
                  setLoggingHoursStaff(null);
                }}
                className="flex-1 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl"
              >
                Add to Timesheet
              </button>
              <button
                onClick={() => setLoggingHoursStaff(null)}
                className="px-3 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit Staff Credentials & Permissions */}
      {editingStaff && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={e => {
            if (e.target === e.currentTarget) setEditingStaff(null);
          }}
        >
          <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-sky-50 text-sky-600 rounded-2xl border border-sky-100">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Edit Staff Credentials & Access Rights</h3>
                  <p className="text-[11px] text-slate-500">
                    Update workstation login credentials, shift assignments, and granular system permissions.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                if (!editingStaff) return;
                const cleanStart = parseCleanTime(editStaffShiftStart, false, '10:00 AM');
                const cleanEnd = parseCleanTime(editStaffShiftEnd, true, '10:00 PM');
                const finalShift = editStaffShiftCustom && cleanStart && cleanEnd
                  ? `Custom (${cleanStart} - ${cleanEnd})`
                  : editStaffShift;

                const cleanUName = decodeURIComponent(editStaffUsername.trim()).trim().replace(/\s+/g, '_');
                const cleanSalary = editStaffSalary !== '' ? Number(editStaffSalary) : undefined;

                updateStaffCredentials(editingStaff.id, {
                  name: editStaffName.trim(),
                  role: editStaffRole,
                  assignedCenterId: editStaffCenterId,
                  shift: finalShift,
                  shiftStartTime: cleanStart,
                  shiftEndTime: cleanEnd,
                  shiftTiming: `${cleanStart} - ${cleanEnd}`,
                  username: cleanUName,
                  password: editStaffPassword.trim(),
                  phone: editStaffPhone.trim(),
                  email: editStaffEmail.trim(),
                  ...(isSuperAdmin && cleanSalary !== undefined ? { monthlySalary: cleanSalary, hourlyRate: Math.round(cleanSalary / 160) } : {}),
                  ...(isSuperAdmin ? { permissions: editStaffPermissions } : {})
                });
                showToast(`Updated workstation credentials for ${editStaffName}`);
                setEditingStaff(null);
              }}
              className="space-y-4 text-xs"
            >
              {/* Row 1: Name & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editStaffName}
                    onChange={e => setEditStaffName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Role / Designation *</label>
                  <select
                    value={editStaffRole}
                    onChange={e => setEditStaffRole(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold"
                  >
                    <option value="Receptionist">Receptionist (Front Desk)</option>
                    <option value="Phlebotomist">Phlebotomist (Sample Collector)</option>
                    <option value="Radiologist">Radiologist (MD / DMRD)</option>
                    <option value="Pathologist">Pathologist (MD / DNB)</option>
                    <option value="Lab Technician">Lab Technician (DMLT / BMLT)</option>
                    <option value="Center Manager">Center Manager (Operations)</option>
                    <option value="Accountant">Accountant / Cashier</option>
                    {isSuperAdmin && <><option value="Center Director">Center Director (Executive)</option><option value="Super Admin">Super Admin</option></>}
                  </select>
                </div>
              </div>

              {/* Row 2: Assigned Center & Shift */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Assigned Diagnostic Center *</label>
                  <select
                    value={editStaffCenterId}
                    onChange={e => setEditStaffCenterId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold"
                  >
                    {centers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-700 font-bold">Assigned Shift *</label>
                    <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200 shadow-2xs">
                      {editStaffShiftCustom ? `Custom (${parseCleanTime(editStaffShiftStart, false, '10:00 AM')} - ${parseCleanTime(editStaffShiftEnd, true, '10:00 PM')})` : editStaffShift}
                    </span>
                  </div>

                  {/* Quick Preset Shift Pills */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {[
                      { label: 'Morning (8 AM - 4 PM)', start: '08:00 AM', end: '04:00 PM', value: 'Morning (8:00 AM - 4:00 PM)' },
                      { label: 'Evening (2 PM - 10 PM)', start: '02:00 PM', end: '10:00 PM', value: 'Evening (2:00 PM - 10:00 PM)' },
                      { label: 'Night (10 PM - 6 AM)', start: '10:00 PM', end: '06:00 AM', value: 'Night (10:00 PM - 6:00 AM)' },
                      { label: 'General (9 AM - 6 PM)', start: '09:00 AM', end: '06:00 PM', value: 'General (9:00 AM - 6:00 PM)' },
                    ].map(p => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => {
                          setEditStaffShiftCustom(false);
                          setEditStaffShift(p.value);
                          setEditStaffShiftStart(p.start);
                          setEditStaffShiftEnd(p.end);
                        }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          !editStaffShiftCustom && editStaffShift === p.value
                            ? 'bg-sky-600 text-white shadow-2xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setEditStaffShiftCustom(true)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        editStaffShiftCustom
                          ? 'bg-sky-600 text-white shadow-2xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      ⚙️ Custom Shift
                    </button>
                  </div>

                  {editStaffShiftCustom ? (
                    <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200 space-y-1.5">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Start Time</label>
                          <input
                            type="text"
                            value={editStaffShiftStart}
                            onChange={e => setEditStaffShiftStart(e.target.value)}
                            placeholder="10:00 AM"
                            className="w-full bg-white border border-indigo-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-0.5">End Time</label>
                          <input
                            type="text"
                            value={editStaffShiftEnd}
                            onChange={e => setEditStaffShiftEnd(e.target.value)}
                            placeholder="10:00 PM"
                            className="w-full bg-white border border-indigo-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <span>Working Hours: <strong>{editStaffShiftStart} to {editStaffShiftEnd}</strong></span>
                      <button
                        type="button"
                        onClick={() => setEditStaffShiftCustom(true)}
                        className="text-xs text-sky-600 font-bold hover:underline cursor-pointer"
                      >
                        Customize Hours →
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Row 3: Login Username & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 bg-sky-50/50 border border-sky-100 rounded-2xl">
                <div>
                  <label className="block text-sky-900 font-bold mb-1">Workstation Login Username *</label>
                  <input
                    type="text"
                    required
                    value={editStaffUsername}
                    onChange={e => setEditStaffUsername(e.target.value)}
                    placeholder="e.g. rahul.sharma"
                    className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-sky-900 font-bold mb-1">Workstation Login Password *</label>
                  <input
                    type="text"
                    required
                    value={editStaffPassword}
                    onChange={e => setEditStaffPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Row 4: Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mobile Phone (WhatsApp) *</label>
                  <input
                    type="tel"
                    required
                    value={editStaffPhone}
                    onChange={e => setEditStaffPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editStaffEmail}
                    onChange={e => setEditStaffEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              {/* Row 5: Super Admin Only - Monthly Salary */}
              {isSuperAdmin && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <label className="block text-slate-800 font-bold mb-1">
                    Monthly Salary (₹ INR) <span className="text-slate-400 font-normal text-[10px]">(Visible only to Super Admin)</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editStaffSalary}
                    onChange={e => setEditStaffSalary(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold"
                  />
                </div>
              )}

              {/* Row 6: Super Admin Only - Granular Access Permissions Matrix */}
              {isSuperAdmin && (
                <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-purple-950 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                      Granular Feature Permissions Gate (Super Admin Only)
                    </span>
                    <span className="text-[10px] text-purple-700 font-semibold">
                      Control access rights for this employee profile
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                    {[
                      { key: 'canCreateInvoices', label: 'Create Invoices & Patient Bills' },
                      { key: 'canCollectPayments', label: 'Collect Dues & Settle Payments' },
                      { key: 'canProcessRefunds', label: 'Process Returns & Refunds' },
                      { key: 'canEditCatalog', label: 'Edit Test Catalog & Tariffs' },
                      { key: 'canViewMISReports', label: 'Access Financial & Referral MIS' },
                      { key: 'canApproveDeletions', label: 'Approve / Reject Deletion Gate' },
                      { key: 'canManageStaff', label: 'Manage Staff Accounts & Roster' },
                      { key: 'canManageReferrals', label: 'Register & Manage Referring Doctors' },
                      { key: 'canAccessAppointments', label: 'Book & Reschedule Appointments' },
                      { key: 'canAuthorizeReports', label: 'Sign & Authorize Diagnostic Reports' }
                    ].map(perm => (
                      <label key={perm.key} className="flex items-center gap-2 p-2 bg-white rounded-xl border border-purple-100 hover:border-purple-300 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          checked={!!editStaffPermissions[perm.key as keyof typeof editStaffPermissions]}
                          onChange={e => {
                            const checked = e.target.checked;
                            setEditStaffPermissions(prev => ({
                              ...prev,
                              [perm.key]: checked
                            }));
                          }}
                          className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                        <span className="font-semibold text-slate-800 text-[11px]">{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer transition-all"
                >
                  Save Credentials & Access Rights
                </button>
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Center Branch */}
      {isAddCenterModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          onClick={e => {
            if (e.target === e.currentTarget) closeAddCenterModal();
          }}
        >
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Add Diagnostic Center</h3>
                  <p className="text-[11px] text-slate-500">Register branch and auto-provision Google Sheet tab</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeAddCenterModal}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCenter} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Center Branch Name *</label>
                <input
                  type="text"
                  required
                  value={centerName}
                  onChange={e => {
                    const val = e.target.value;
                    setCenterName(val);
                    if (!centerCode || centerCode.startsWith('ATL-')) {
                      const suffix = val.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase();
                      if (suffix) setCenterCode(`ATL-${suffix}`);
                    }
                  }}
                  placeholder="e.g. Atlas Diagnostics Center - West Hub"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Center Code *</label>
                <input
                  type="text"
                  required
                  value={centerCode}
                  onChange={e => setCenterCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ATL-WEST"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Physical Address</label>
                <input
                  type="text"
                  value={centerAddress}
                  onChange={e => setCenterAddress(e.target.value)}
                  placeholder="e.g. Sector 18, Commercial Complex"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={centerPhone}
                  onChange={e => setCenterPhone(e.target.value)}
                  placeholder="+91 98765 00000"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="centerMainCheckbox"
                  checked={centerIsMain}
                  onChange={e => setCenterIsMain(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                />
                <label htmlFor="centerMainCheckbox" className="text-xs text-slate-700 font-bold cursor-pointer">
                  Designate as Central Diagnostic Hub (Main Center)
                </label>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  Create Center Branch
                </button>
                <button
                  type="button"
                  onClick={closeAddCenterModal}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Patient Demographics Modal (Universal Admin Level) */}
      {selectedPatientForEdit && (
        <EditPatientModal
          patient={selectedPatientForEdit}
          onClose={() => setSelectedPatientForEdit(null)}
          onSave={handleSavePatientEdits}
        />
      )}

      {/* Invoice Receipt Modal */}
      {invoiceModalOrder && (
        <InvoiceReceiptModal
          order={invoiceModalOrder}
          center={centers.find(c => c.id === invoiceModalOrder.centerId) || selectedCenter}
          onClose={() => setInvoiceModalOrder(null)}
        />
      )}

      {/* Report Print View Modal */}
      {reportPrintModalOrder && (
        <ReportPrintView
          report={getReportByOrderId(reportPrintModalOrder.id) || {
            id: `REP-${reportPrintModalOrder.id.slice(-4)}`,
            orderId: reportPrintModalOrder.id,
            testId: reportPrintModalOrder.tests[0]?.id || 't1',
            testName: reportPrintModalOrder.tests.map(t => t.name).join(', '),
            patientId: reportPrintModalOrder.patientId,
            patientName: reportPrintModalOrder.patient.name,
            patientAge: reportPrintModalOrder.patient.age,
            patientGender: reportPrintModalOrder.patient.gender,
            category: reportPrintModalOrder.tests[0]?.category || 'Pathology',
            findingsHtml: '<p>Standard report verification completed.</p>',
            impression: 'Investigation reported within normal limits.',
            doctorName: 'Dr. Rekha Khanna',
            doctorSpecialty: 'MBBS MD Radiodiagnosis',
            doctorRegistrationNo: 'MP 13663',
            status: 'AUTHORIZED',
            attachments: []
          }}
          order={reportPrintModalOrder}
          center={centers.find(c => c.id === reportPrintModalOrder.centerId) || selectedCenter}
          onClose={() => setReportPrintModalOrder(null)}
        />
      )}

      {/* Return & Refund Modal for Admin & Center Manager */}
      {adminRefundModalOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={e => {
            if (e.target === e.currentTarget) setAdminRefundModalOrder(null);
          }}
        >
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Process Return & Refund</h3>
                  <p className="text-[11px] text-slate-500">Bill #{adminRefundModalOrder.invoiceNumber} • {adminRefundModalOrder.patient.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAdminRefundModalOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Total Order Billed:</span>
                <span className="font-bold text-slate-900">₹{adminRefundModalOrder.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Amount Paid:</span>
                <span className="font-bold text-emerald-700">₹{adminRefundModalOrder.paidAmount.toLocaleString()}</span>
              </div>
              {adminRefundModalOrder.refundAmount ? (
                <div className="flex justify-between text-rose-600">
                  <span className="font-semibold">Previously Refunded:</span>
                  <span className="font-bold">-₹{adminRefundModalOrder.refundAmount.toLocaleString()}</span>
                </div>
              ) : null}
              <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
                <span className="text-slate-700">Max Refundable Balance:</span>
                <span className="text-slate-900">
                  ₹{Math.max(0, adminRefundModalOrder.paidAmount - (adminRefundModalOrder.refundAmount || 0)).toLocaleString()}
                </span>
              </div>
            </div>

            <form onSubmit={handleProcessAdminRefundSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Refund Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={Math.max(0, adminRefundModalOrder.paidAmount - (adminRefundModalOrder.refundAmount || 0))}
                  value={adminRefundAmount}
                  onChange={e => setAdminRefundAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Enter amount to refund"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-black text-sm focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Refund Payment Mode *</label>
                <select
                  value={adminRefundMode}
                  onChange={e => setAdminRefundMode(e.target.value as PaymentMode)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  <option value="Cash">Cash (Immediate Counter Refund)</option>
                  <option value="UPI">UPI / Digital Transfer</option>
                  <option value="Card">Card Reversal</option>
                  <option value="Due Balance">Adjust / Credit Note</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Reason for Refund / Cancellation *
                </label>
                <textarea
                  required
                  rows={2}
                  value={adminRefundReason}
                  onChange={e => setAdminRefundReason(e.target.value)}
                  placeholder="e.g. Patient requested sample cancellation, machine technical calibration delay, billing discrepancy..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer"
                >
                  Confirm & Process Refund
                </button>
                <button
                  type="button"
                  onClick={() => setAdminRefundModalOrder(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print / Export MIS Report Modal */}
      {isPrintMISModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={e => {
            if (e.target === e.currentTarget) setIsPrintMISModalOpen(false);
          }}
        >
          <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            {/* Header / Actions */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  Referral Partner MIS Commission Audit Report
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isGeneratingMISPdf}
                  onClick={handleDownloadMISPdf}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                  title="Export compiled PDF directly"
                >
                  {isGeneratingMISPdf ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>{isGeneratingMISPdf ? 'Compiling PDF...' : 'Download PDF'}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintMISReport}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                  title="Print isolated document to printer or Save as PDF"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print to Paper / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintMISModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  title="Close modal (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Document Content */}
            <div id="mis-report-printable-area" className="space-y-6 text-slate-900 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200">
              {/* Center Letterhead */}
              <div className="flex items-start justify-between pb-4 border-b-2 border-slate-900">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900">
                    ATLAS DIAGNOSTICS CENTER
                  </h1>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">
                    Comprehensive Diagnostic Pathology & Medical Imaging Center
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Central Hub: {selectedCenter.address} • Hotline: {selectedCenter.phone}
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-black uppercase tracking-wider text-slate-800 border border-slate-200 block">
                    Official MIS Report
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-1 font-mono">
                    Generated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Clean Beneficiary Banner at the Top */}
              <div className="py-2.5 px-4 bg-purple-50 rounded-xl border border-purple-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-purple-700">BENEFICIARY:</span>
                  <h2 className="text-base font-black text-purple-950">
                    {referralBeneficiaryFilter !== 'ALL'
                      ? referralBeneficiaryFilter
                      : referralDoctorFilter !== 'ALL'
                        ? referralDoctorFilter
                        : 'All Referring Partners & Beneficiaries'}
                  </h2>
                </div>
                {(referralDateRange !== 'ALL' || (referralStartDate && referralEndDate)) && (
                  <div className="text-right text-xs text-slate-600">
                    <span className="font-semibold text-slate-500 text-[10px] uppercase mr-1">Period:</span>
                    <span className="font-bold text-slate-800">
                      {referralDateRange === 'CUSTOM' ? `${referralStartDate} to ${referralEndDate}` : referralDateRange}
                    </span>
                  </div>
                )}
              </div>

              {/* Table of Individual Diagnostic Investigations */}
              <div className="overflow-x-auto border border-slate-300 rounded-2xl">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 text-slate-800 uppercase text-[9px] font-black tracking-wider border-b border-slate-300">
                    <tr>
                      <th className="p-2.5 text-center w-10">S.No.</th>
                      <th className="p-2.5">Date & Invoice</th>
                      <th className="p-2.5">Patient Details</th>
                      <th className="p-2.5">Investigation</th>
                      <th className="p-2.5 text-right">MRP</th>
                      <th className="p-2.5 text-right">Discount</th>
                      <th className="p-2.5 text-right">Paid</th>
                      <th className="p-2.5 text-right">Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {misReportOrdersAsc.map(({ order: ord }, idx) => {
                      const mrp = ord.subtotal || ord.totalAmount || 0;
                      const discount = ord.discountAmount || 0;
                      const paid = ord.paidAmount || 0;
                      const due = ord.dueAmount || 0;
                      const tests = (ord.tests && ord.tests.length > 0) ? ord.tests : [{ id: 't-d', name: 'Diagnostic Services' }];

                      return (
                        <tr key={ord.id}>
                          <td className="p-2.5 text-center font-bold text-slate-500 font-mono text-[10px]">
                            {idx + 1}
                          </td>
                          <td className="p-2.5 font-mono text-[10px]">
                            <span className="font-bold text-slate-900 block">
                              {formatSafeDate(ord.createdAt)}
                            </span>
                            <span className="text-slate-400 block text-[9px]">
                              {formatSafeTime(ord.createdAt)}
                            </span>
                            <span className="block font-bold text-sky-700">#{ord.invoiceNumber}</span>
                          </td>
                          <td className="p-2.5">
                            <span className="font-bold text-slate-900 block">{ord.patient.name}</span>
                            <span className="text-[10px] text-slate-500">{ord.patient.gender[0]}/{ord.patient.age} • {ord.patient.phone}</span>
                          </td>
                          <td className="p-2.5">
                            <div className="space-y-0.5">
                              {tests.map((t, tidx) => (
                                <span key={t.id || tidx} className="block font-semibold text-slate-900 text-xs">
                                  {t.name}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-2.5 font-bold text-slate-900 text-right">₹{mrp.toLocaleString()}</td>
                          <td className="p-2.5 font-semibold text-slate-600 text-right">{discount > 0 ? `₹${discount.toLocaleString()}` : '-'}</td>
                          <td className="p-2.5 font-bold text-emerald-700 text-right">₹{paid.toLocaleString()}</td>
                          <td className="p-2.5 font-bold text-rose-600 text-right">{due > 0 ? `₹${due.toLocaleString()}` : '-'}</td>
                        </tr>
                      );
                    })}
                    {filteredReferralMISOrders.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                          No referred diagnostic investigations found matching the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {filteredReferralMISOrders.length > 0 && (
                    <tfoot className="bg-slate-100/80 font-bold border-t-2 border-slate-300 text-[11px]">
                      <tr>
                        <td colSpan={4} className="p-2.5 text-right uppercase tracking-wider text-slate-700 font-black">
                          Total Summaries:
                        </td>
                        <td className="p-2.5 text-right font-black text-sky-900">
                          ₹{misOrderTotalMRP.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-right font-bold text-slate-700">
                          ₹{misOrderTotalDiscount.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-right font-bold text-emerald-800">
                          ₹{misOrderTotalPaid.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-right font-bold text-rose-700">
                          ₹{misOrderTotalDue.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Sign-off Strip */}
              <div className="pt-8 flex items-center justify-between text-xs text-slate-500 border-t border-slate-200">
                <div>
                  <p className="font-semibold text-slate-800">Generated by: {currentUser?.name || (isSuperAdmin ? 'Mohsina Akhtar' : 'Center Manager')}</p>
                  <p className="text-[10px] text-slate-400">Atlas Diagnostics Center Management System</p>
                </div>
                <div className="text-right">
                  <div className="w-36 border-b border-slate-400 mb-1" />
                  <p className="text-[10px] font-bold text-slate-700 uppercase">Authorized Accounts Signature</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collect Balance Due Modal */}
      {adminDueCollectOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span>Collect Due Payment</span>
              <span className="text-sky-600 font-mono text-xs">#{adminDueCollectOrder.invoiceNumber}</span>
            </h3>
            <p className="text-xs text-slate-500">
              Patient: <strong className="text-slate-800">{adminDueCollectOrder.patient.name}</strong> • Pending Due: <strong className="text-amber-700">₹{adminDueCollectOrder.dueAmount.toLocaleString()}</strong>
            </p>

            <form onSubmit={handleAdminCollectDueSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Collection Amount (₹)
                </label>
                <input
                  type="number"
                  min={1}
                  max={adminDueCollectOrder.dueAmount}
                  value={adminCollectAmount}
                  onChange={e => setAdminCollectAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Payment Mode
                </label>
                <select
                  value={adminCollectMode}
                  onChange={e => setAdminCollectMode(e.target.value as PaymentMode)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI / QR">UPI / QR</option>
                  <option value="Credit / Debit Card">Credit / Debit Card</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Record Payment & Settle
                </button>
                <button
                  type="button"
                  onClick={() => setAdminDueCollectOrder(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Super Admin Edit Invoice & Order Modal */}
      {editingInvoiceOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-2xl my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-amber-600" />
                  <span>Edit Invoice & Patient Order</span>
                  <span className="text-sky-700 font-mono text-xs bg-sky-100 px-2 py-0.5 rounded-md font-bold">
                    #{editingInvoiceOrder.invoiceNumber}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Super Admin overrides: modify patient info, add/remove diagnostic tests, update discount, payment and doctor commissions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingInvoiceOrder(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <form id="edit-invoice-form" onSubmit={handleSaveEditedInvoice} className="overflow-y-auto pr-1 space-y-5 flex-1">
              {/* Section 1: Patient Information */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-sky-600" />
                  <span>1. Patient Demographics</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Full Patient Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editPatientName}
                      onChange={e => setEditPatientName(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Age & Gender
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={editPatientAge}
                        onChange={e => setEditPatientAge(Number(e.target.value) || 1)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                        placeholder="Age"
                      />
                      <select
                        value={editPatientGender}
                        onChange={e => setEditPatientGender(e.target.value as any)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-2 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Phone Number (WhatsApp)
                    </label>
                    <input
                      type="tel"
                      value={editPatientPhone}
                      onChange={e => setEditPatientPhone(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="+91 9876543210"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Address / Area
                    </label>
                    <input
                      type="text"
                      value={editPatientAddress}
                      onChange={e => setEditPatientAddress(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="e.g. Khajrana, Indore"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1 text-sky-700">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Entry Date & Time (Shown Date)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        required
                        value={editOrderDate}
                        onChange={e => setEditOrderDate(e.target.value)}
                        className="w-full bg-white border border-sky-300 rounded-xl px-2.5 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                      <input
                        type="time"
                        value={editOrderTime}
                        onChange={e => setEditOrderTime(e.target.value)}
                        className="w-full bg-white border border-sky-300 rounded-xl px-2.5 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Referring Doctor & Commission Beneficiary */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>2. Referring Doctor & Beneficiary Partner</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Prescribing / Referring Doctor
                    </label>
                    <select
                      value={editDoctorId || (editDoctorName === 'Direct / Walk-in' ? '' : editDoctorName)}
                      onChange={e => {
                        const val = e.target.value;
                        if (!val) {
                          setEditDoctorId('');
                          setEditDoctorName('Direct / Walk-in');
                        } else {
                          const doc = referrers.find(r => r.id === val);
                          if (doc) {
                            setEditDoctorId(doc.id);
                            setEditDoctorName(doc.name);
                            if (!editBeneficiaryId) {
                              setEditBeneficiaryId(doc.id);
                              setEditBeneficiaryName(doc.name);
                            }
                          } else {
                            setEditDoctorId('');
                            setEditDoctorName(val);
                          }
                        }
                      }}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="">Direct / Walk-in (Self)</option>
                      {approvedReferrers.map(doc => (
                        <option key={doc.id} value={doc.id}>
                          {doc.name} ({doc.specialty || doc.hospital || `${doc.commissionPct}%`})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-600 uppercase">
                        Beneficiary Partner
                      </label>
                      {isSuperAdmin ? (
                        <button
                          type="button"
                          onClick={() => {
                            setNewPartnerAffiliationType('ORGANIZATION');
                            setNewPartnerName('');
                            setNewPartnerOrgName('');
                            setNewPartnerSpecialty('Beneficiary Partner');
                            setNewPartnerHospital('Direct Clinic');
                            setNewPartnerPhone('');
                            setNewPartnerEmail('');
                            setNewPartnerRegNo('');
                            setNewPartnerNotes('Added via invoice quick edit');
                            setIsRegisterPartnerModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded-lg border border-sky-200 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add New</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-amber-700 font-semibold lowercase tracking-normal flex items-center gap-1">
                          <Lock className="w-3 h-3" /> super admin only
                        </span>
                      )}
                    </div>
                    {isSuperAdmin ? (
                      <select
                        value={editBeneficiaryId || (editBeneficiaryName === 'Direct / Walk-in' ? '' : editBeneficiaryName)}
                        onChange={e => {
                          const val = e.target.value;
                          if (!val) {
                            setEditBeneficiaryId('');
                            setEditBeneficiaryName('Direct / Walk-in');
                          } else {
                            const doc = referrers.find(r => r.id === val);
                            if (doc) {
                              setEditBeneficiaryId(doc.id);
                              setEditBeneficiaryName(doc.organizationName || doc.name);
                            } else {
                              setEditBeneficiaryId('');
                              setEditBeneficiaryName(val);
                            }
                          }
                        }}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                      >
                        <option value="">Same as Doctor / Walk-in</option>
                        {approvedReferrers.map(doc => (
                          <option key={doc.id} value={doc.id}>
                            {doc.organizationName ? `${doc.organizationName} (${doc.name})` : doc.name} ({doc.commissionPct}% Share)
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium flex items-center justify-between cursor-not-allowed select-none">
                        <span className="truncate">{editBeneficiaryName || 'Same as Doctor / Walk-in'}</span>
                        <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1.5" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 3: Diagnostic Tests & Investigations */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <ActivityIcon className="w-4 h-4 text-purple-600" />
                    <span>3. Diagnostic Tests & Investigations ({editSelectedTests.length})</span>
                  </h4>
                  <span className="text-xs font-bold text-slate-800">
                    Gross Subtotal: ₹{editSelectedTests.reduce((s, t) => s + (Number(t.price) || 0), 0).toLocaleString()}
                  </span>
                </div>

                {/* Selected Tests Tags */}
                <div className="flex flex-wrap gap-1.5 p-3 bg-white border border-slate-200 rounded-xl min-h-[48px]">
                  {editSelectedTests.map((t, idx) => (
                    <span
                      key={t.id || idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-900 border border-sky-200 text-xs font-semibold"
                    >
                      <span>{t.name}</span>
                      <span className="font-bold text-sky-700">₹{t.price}</span>
                      <button
                        type="button"
                        onClick={() => setEditSelectedTests(prev => prev.filter((_, i) => i !== idx))}
                        className="p-0.5 hover:bg-sky-200 rounded-full text-sky-700 cursor-pointer ml-0.5"
                        title="Remove Test"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {editSelectedTests.length === 0 && (
                    <span className="text-xs text-rose-500 font-medium">
                      No tests selected. Please search and add tests below.
                    </span>
                  )}
                </div>

                {/* Search & Add Tests from 1,170 Test Catalog */}
                <div className="relative">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={editTestSearch}
                      onChange={e => setEditTestSearch(e.target.value)}
                      placeholder="Search catalog to add tests (e.g. MRI Brain, CBC, USG, Lipid, Thyroid, CT)..."
                      className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  {filteredCatalogTestsForEdit.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                      {filteredCatalogTestsForEdit.map(t => {
                        const isAlready = editSelectedTests.some(st => st.id === t.id || st.name.toLowerCase() === t.name.toLowerCase());
                        return (
                          <div
                            key={t.id}
                            className="p-2.5 flex items-center justify-between hover:bg-sky-50 transition-colors text-xs"
                          >
                            <div>
                              <p className="font-bold text-slate-800">{t.name}</p>
                              <p className="text-[10px] text-slate-500">
                                {t.category} • {t.department || t.subDepartment || 'Diagnostics'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900">₹{t.price}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!isAlready) {
                                    setEditSelectedTests(prev => [...prev, t]);
                                  }
                                  setEditTestSearch('');
                                }}
                                disabled={isAlready}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                                  isAlready
                                    ? 'bg-slate-100 text-slate-400 cursor-default'
                                    : 'bg-sky-600 hover:bg-sky-500 text-white cursor-pointer'
                                }`}
                              >
                                <Plus className="w-3 h-3" />
                                <span>{isAlready ? 'Added' : 'Add Test'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 4: Pricing, Discount & Payments */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-indigo-600" />
                  <span>4. Pricing, Concession & Payment Settlement</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Discount Concession (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={editDiscountPct}
                      onChange={e => setEditDiscountPct(Number(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Discount Reason
                    </label>
                    <input
                      type="text"
                      value={editDiscountReason}
                      onChange={e => setEditDiscountReason(e.target.value)}
                      placeholder="e.g. VIP / Senior Citizen"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Paid Amount (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editPaidAmount}
                      onChange={e => setEditPaidAmount(Number(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={editPaymentMode}
                      onChange={e => setEditPaymentMode(e.target.value as PaymentMode)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI / QR">UPI / QR</option>
                      <option value="Credit / Debit Card">Credit / Debit Card</option>
                      <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>

                {/* Calculation Summary Strip */}
                {(() => {
                  const subtotal = editSelectedTests.reduce((sum, t) => sum + (Number(t.price) || 0), 0);
                  const safeDiscountPct = Math.min(100, Math.max(0, Number(editDiscountPct) || 0));
                  const discountAmount = Math.round(subtotal * (safeDiscountPct / 100));
                  const totalAmount = Math.max(0, subtotal - discountAmount);
                  const paidAmount = Math.min(totalAmount, Math.max(0, Number(editPaidAmount) || 0));
                  const dueAmount = Math.max(0, totalAmount - paidAmount);

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200">
                      <div className="p-2.5 bg-white border border-slate-200 rounded-xl">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Gross Subtotal</span>
                        <span className="text-sm font-extrabold text-slate-800">₹{subtotal.toLocaleString()}</span>
                      </div>
                      <div className="p-2.5 bg-white border border-slate-200 rounded-xl">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Discount ({safeDiscountPct}%)</span>
                        <span className="text-sm font-extrabold text-rose-600">-₹{discountAmount.toLocaleString()}</span>
                      </div>
                      <div className="p-2.5 bg-white border border-sky-200 rounded-xl">
                        <span className="text-[10px] font-bold uppercase text-sky-700 block">Net Total Bill</span>
                        <span className="text-sm font-extrabold text-sky-900">₹{totalAmount.toLocaleString()}</span>
                      </div>
                      <div className="p-2.5 bg-white border border-slate-200 rounded-xl">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Remaining Due</span>
                        <span className={`text-sm font-extrabold ${dueAmount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                          ₹{dueAmount.toLocaleString()} {dueAmount === 0 && '(Settled)'}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Section 5: Order Status & Notes */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-teal-600" />
                  <span>5. Workflow Status & Clinical Notes</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Diagnostic Workflow Status
                    </label>
                    <select
                      value={editOrderStatus}
                      onChange={e => setEditOrderStatus(e.target.value as OrderStatus)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="ORDER_PLACED">Order Placed (Sample Pending)</option>
                      <option value="SAMPLE_COLLECTED">Sample Collected (In Lab / Scanning)</option>
                      <option value="PROCESSING">Processing / Analysis</option>
                      <option value="RESULT_ENTERED">Result Entered (Doctor Review)</option>
                      <option value="VERIFIED">Verified & Authorized (Report Ready)</option>
                      <option value="DISPATCHED">Dispatched to Patient</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Clinical Notes / Reception Remarks
                    </label>
                    <input
                      type="text"
                      value={editNotes}
                      onChange={e => setEditNotes(e.target.value)}
                      placeholder="Special instructions or clinical remarks..."
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 flex-shrink-0">
              <button
                type="button"
                onClick={() => setEditingInvoiceOrder(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-invoice-form"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save & Synchronize Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL 1: FINANCIAL PROFIT & LOSS DRILL-DOWN MODAL */}
      {isFinancialDrilldownOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={e => {
            if (e.target === e.currentTarget) setIsFinancialDrilldownOpen(false);
          }}
        >
          <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-fade-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-2xl border border-emerald-200 dark:border-emerald-800/60">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-slate-100 text-lg">
                    Financial Profit & Loss Ledger Drill-Down
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Comprehensive ledger breakdown of gross billing, collected revenue, and operational expenses for <strong className="text-slate-700 dark:text-slate-300 font-bold">{dashboardDateLabel}</strong> ({dashboardMetrics.orderCount} orders).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFinancialDrilldownOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors cursor-pointer"
                title="Close modal (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* P&L Key Summary Cards */}
            {(() => {
              const isProfit = dashboardMetrics.isProfit;

              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Total Tariff MRP</span>
                      <span className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1 block">₹{dashboardMetrics.totalMRP.toLocaleString()}</span>
                      <span className="text-[10px] text-slate-400">Gross billed value</span>
                    </div>

                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 block">Incoming Revenue</span>
                      <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-1 block">₹{dashboardMetrics.totalPaid.toLocaleString()}</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Total collected</span>
                    </div>

                    <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-400 block">Operating Expenses</span>
                      <span className="text-xl font-black text-rose-700 dark:text-rose-300 mt-1 block">₹{dashboardMetrics.totalExp.toLocaleString()}</span>
                      <span className="text-[10px] text-rose-600 dark:text-rose-400">{dashboardFilteredExpenses.length} expense vouchers</span>
                    </div>

                    <div className={`p-4 rounded-2xl border ${isProfit ? 'bg-emerald-100/70 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800/60' : 'bg-rose-100/70 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800/60'}`}>
                      <span className={`text-[10px] font-black uppercase tracking-wider block ${isProfit ? 'text-emerald-900 dark:text-emerald-300' : 'text-rose-900 dark:text-rose-300'}`}>
                        {isProfit ? 'Net Operating Profit' : 'Net Operating Loss'}
                      </span>
                      <span className={`text-2xl font-black mt-1 block ${isProfit ? 'text-emerald-800 dark:text-emerald-400' : 'text-rose-800 dark:text-rose-400'}`}>
                        {isProfit ? '+' : '-'}₹{Math.abs(dashboardMetrics.netPnL).toLocaleString()}
                      </span>
                      <span className="text-[10px] font-bold opacity-80">
                        {isProfit ? 'Profitable operation' : 'Negative cashflow'}
                      </span>
                    </div>
                  </div>

                  {/* Payment Channel Breakdown & Due Balances */}
                  <div className="p-5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl space-y-4">
                    <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      <span>Payment Modes & Counter Channels ({dashboardDateLabel})</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Cash in Counter</span>
                        <span className="text-lg font-black text-emerald-700 dark:text-emerald-400 mt-0.5 block">₹{dashboardMetrics.totalCash.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">Physical currency collected</span>
                      </div>

                      <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Online / UPI / QR / Card</span>
                        <span className="text-lg font-black text-sky-700 dark:text-sky-400 mt-0.5 block">₹{dashboardMetrics.totalOnline.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">Bank deposits & digital gateways</span>
                      </div>

                      <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Outstanding Due Balance</span>
                        <span className="text-lg font-black text-rose-700 dark:text-rose-400 mt-0.5 block">₹{dashboardMetrics.totalDue.toLocaleString()}</span>
                        <span className="text-[10px] text-rose-600 dark:text-rose-400">Receivables pending from patients</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setIsFinancialDrilldownOpen(false);
                    setActiveTab('MIS_OVERVIEW');
                  }}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  Open Full Financial MIS Tab →
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsFinancialDrilldownOpen(false);
                    setActiveTab('EXPENSES');
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Open Expenses Ledger →
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsFinancialDrilldownOpen(false)}
                className="w-full sm:w-auto px-5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close & Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: STAFF ATTENDANCE & INDIVIDUAL ACTIVITY DRILL-DOWN MODAL */}
      {isStaffAttendanceDrilldownOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={e => {
            if (e.target === e.currentTarget) {
              setSelectedDrilldownStaff(null);
              setIsStaffAttendanceDrilldownOpen(false);
            }
          }}
        >
          <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-fade-in">
            {/* VIEW A: Grid of all staff members (Transparent Green for Logged In, Transparent Red for Offline) */}
            {!selectedDrilldownStaff ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 rounded-2xl border border-sky-200 dark:border-sky-800/60">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 dark:text-slate-100 text-lg">
                        Staff Duty Roster & Attendance Status
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {onlineStaffList.length} staff currently logged in. Click on any staff member's tile to inspect their login time and work done.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsStaffAttendanceDrilldownOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors cursor-pointer"
                    title="Close modal (Esc)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Staff Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {staff.map(member => {
                    const isMemberOnline = member.status === 'Active' || onlineStaffList.some(o => o.id === member.id);
                    const memberCenter = centers.find(c => c.id === member.assignedCenterId);

                    return (
                      <div
                        key={member.id}
                        onClick={() => setSelectedDrilldownStaff(member)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer hover:scale-[1.02] hover:shadow-md active:scale-95 space-y-3 ${
                          isMemberOnline
                            ? 'bg-emerald-500/10 dark:bg-emerald-950/30 border-emerald-500/30 dark:border-emerald-600/40 hover:border-emerald-500/60 text-emerald-950 dark:text-emerald-200'
                            : 'bg-rose-500/10 dark:bg-rose-950/30 border-rose-500/30 dark:border-rose-600/40 hover:border-rose-500/60 text-rose-950 dark:text-rose-200'
                        }`}
                        title={`Click to inspect work & invoices generated by ${member.name}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                              isMemberOnline ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                            }`}>
                              {member.name.charAt(0)}
                            </div>
                            <div>
                              <span className="font-black text-slate-900 dark:text-slate-100 text-sm block leading-tight">
                                {member.name}
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                                {member.role}
                              </span>
                            </div>
                          </div>

                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            isMemberOnline
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'bg-rose-600 text-white'
                          }`}>
                            {isMemberOnline ? 'Logged In' : 'Offline'}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 grid grid-cols-2 gap-1 text-[11px] text-slate-600 dark:text-slate-300">
                          <div>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 block uppercase font-bold">Shift</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{member.shift.split(' ')[0]}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 block uppercase font-bold">Branch</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{memberCenter?.code || 'Main Hub'}</span>
                          </div>
                        </div>

                        <div className="pt-1 flex items-center justify-between text-[10px] font-bold text-sky-700 dark:text-sky-400">
                          <span>Inspect work & invoices</span>
                          <span>→</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsStaffAttendanceDrilldownOpen(false)}
                    className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Close & Return to Dashboard
                  </button>
                </div>
              </div>
            ) : (
              /* VIEW B: Individual Staff Login Time & Generated Invoices / Entries */
              (() => {
                const member = selectedDrilldownStaff;
                const memberCenter = centers.find(c => c.id === member.assignedCenterId);
                const isMemberOnline = member.status === 'Active' || onlineStaffList.some(o => o.id === member.id);

                // Orders created by this staff member
                const staffOrders = allOrders.filter(
                  o => !o.isDeleted && (o.createdByStaffId === member.id || o.createdByStaffName === member.name)
                );
                const staffBilledGross = staffOrders.reduce((s, o) => s + (o.subtotal || o.totalAmount), 0);
                const staffPaidTotal = staffOrders.reduce((s, o) => s + (o.paidAmount || 0), 0);

                // Find staff's latest login timestamp
                const staffLoginAct = activities.find(
                  a => a.actorName === member.name && (a.actionType.includes('LOGIN') || a.details.toLowerCase().includes('logged in'))
                );
                const loginTimeDisplay = staffLoginAct
                  ? `${new Date(staffLoginAct.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}, ${new Date(staffLoginAct.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Active today on morning duty';

                // Activities performed by this staff member
                const staffActivities = activities.filter(
                  a => a.actorName === member.name || a.metadata?.staffId === member.id
                );

                return (
                  <div className="space-y-6">
                    {/* Header with explicit Back to previous tile & Close buttons */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedDrilldownStaff(null)}
                          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Back to All Staff Tiles</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDrilldownStaff(null);
                          setIsStaffAttendanceDrilldownOpen(false);
                        }}
                        className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors cursor-pointer"
                        title="Close modal (Esc)"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Staff Profile Overview Card */}
                    <div className="p-5 bg-gradient-to-r from-slate-900 to-sky-950 text-white rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                          isMemberOnline ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                        }`}>
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-black">{member.name}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              isMemberOnline ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                            }`}>
                              {isMemberOnline ? 'Active On Duty' : 'Offline'}
                            </span>
                          </div>
                          <p className="text-xs text-sky-200/80 mt-0.5">
                            {member.role} • {member.shift} • Branch: {memberCenter?.name || 'Main Center'}
                          </p>
                        </div>
                      </div>

                      {/* Login Timestamp Requirement */}
                      <div className="bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-2xl border border-white/15 text-left sm:text-right">
                        <span className="text-[10px] uppercase font-bold text-sky-300 block">Logged In Timestamp</span>
                        <span className="text-sm font-black text-white mt-0.5 block flex items-center gap-1 sm:justify-end">
                          <Clock className="w-3.5 h-3.5 text-cyan-300" />
                          {loginTimeDisplay}
                        </span>
                      </div>
                    </div>

                    {/* Performance Summary Metrics */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Invoices Generated</span>
                        <span className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 block">{staffOrders.length}</span>
                        <span className="text-[10px] text-slate-400">Total bills created</span>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Gross Tariff Billed</span>
                        <span className="text-2xl font-black text-sky-800 dark:text-sky-400 mt-1 block">₹{staffBilledGross.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400">Total bill value</span>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 block">Revenue Collected</span>
                        <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1 block">₹{staffPaidTotal.toLocaleString()}</span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Collected in advance/full</span>
                      </div>
                    </div>

                    {/* Table of Invoices & Work Done by this Staff Member */}
                    <div className="space-y-3">
                      <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                        <span>Invoices Generated by {member.name} ({staffOrders.length})</span>
                      </h4>

                      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl max-h-72 overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-sky-50 dark:bg-slate-800 text-sky-900 dark:text-sky-200 uppercase text-[10px] tracking-wider border-b border-sky-100 dark:border-slate-700 font-extrabold sticky top-0">
                            <tr>
                              <th className="p-3">Invoice #</th>
                              <th className="p-3">Date & Time</th>
                              <th className="p-3">Patient Details</th>
                              <th className="p-3">Tests Included</th>
                              <th className="p-3 text-right">Billed Amt</th>
                              <th className="p-3 text-right">Payment</th>
                              <th className="p-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {staffOrders.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="p-6 text-center text-slate-400 text-xs">
                                  No patient invoices generated by this staff member yet today.
                                </td>
                              </tr>
                            ) : (
                              staffOrders.map(ord => (
                                <tr key={ord.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60">
                                  <td className="p-3 font-mono font-bold text-sky-700 dark:text-sky-400">
                                    #{ord.invoiceNumber}
                                  </td>
                                  <td className="p-3 text-slate-600 dark:text-slate-300 text-[11px]">
                                    {formatSafeDate(ord.createdAt)}{' '}
                                    {formatSafeTime(ord.createdAt)}
                                  </td>
                                  <td className="p-3">
                                    <span className="font-bold text-slate-900 dark:text-slate-100 block">{ord.patient.name}</span>
                                    <span className="text-[10px] text-slate-400">{ord.patient.phone}</span>
                                  </td>
                                  <td className="p-3 text-slate-600 dark:text-slate-300 text-[11px] max-w-xs truncate">
                                    {ord.tests.map(t => t.name).join(', ')}
                                  </td>
                                  <td className="p-3 text-right font-bold text-slate-900 dark:text-slate-100">
                                    ₹{ord.totalAmount.toLocaleString()}
                                  </td>
                                  <td className="p-3 text-right">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                      ord.dueAmount === 0 ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                                    }`}>
                                      {ord.dueAmount === 0 ? 'Paid' : `Due ₹${ord.dueAmount}`}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => setInvoiceModalOrder(ord)}
                                      className="px-2 py-1 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-800 dark:text-sky-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                    >
                                      Receipt
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Recent Activities Performed */}
                    <div className="space-y-2">
                      <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider text-slate-500">
                        Recent Activity Log by {member.name}
                      </h4>
                      <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-3 max-h-36 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50 text-xs">
                        {staffActivities.length === 0 ? (
                          <div className="p-3 text-center text-slate-400 text-xs">
                            No recent audit activities recorded for this staff member.
                          </div>
                        ) : (
                          staffActivities.slice(0, 8).map(act => (
                            <div key={act.id} className="py-2 flex items-center justify-between text-slate-700 dark:text-slate-300">
                              <span>{act.details}</span>
                              <span className="text-[10px] text-slate-400 shrink-0 ml-2 font-mono">
                                {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Symmetrical Controls Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setSelectedDrilldownStaff(null)}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back to Staff Tiles</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDrilldownStaff(null);
                          setIsStaffAttendanceDrilldownOpen(false);
                        }}
                        className="px-5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Close & Return to Dashboard
                      </button>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: TOTAL ORDERS PLACED MASTER REGISTRY DRILL-DOWN MODAL */}
      {isOrdersDrilldownOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={e => {
            if (e.target === e.currentTarget) setIsOrdersDrilldownOpen(false);
          }}
        >
          <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-fade-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 rounded-2xl border border-indigo-200 dark:border-indigo-800/60">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-slate-100 text-lg">
                    Total Orders & Invoices Master Registry
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Showing orders & test pricing for <strong className="text-slate-700 dark:text-slate-300 font-bold">{dashboardDateLabel}</strong> ({dashboardFilteredOrders.length} orders).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOrdersDrilldownOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors cursor-pointer"
                title="Close modal (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* High-level Summary Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Total Orders</span>
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 block">{dashboardFilteredOrders.length}</span>
                <span className="text-[10px] text-slate-400">Registered bookings</span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Invoices Generated</span>
                <span className="text-2xl font-black text-sky-800 dark:text-sky-400 mt-1 block">{dashboardFilteredOrders.filter(o => o.invoiceNumber).length}</span>
                <span className="text-[10px] text-slate-400">Official tax receipts</span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Total Tariff MRP</span>
                <span className="text-2xl font-black text-indigo-900 dark:text-indigo-400 mt-1 block">₹{dashboardMetrics.totalMRP.toLocaleString()}</span>
                <span className="text-[10px] text-slate-400">Gross test tariff</span>
              </div>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 block">Total Collected</span>
                <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1 block">₹{dashboardMetrics.totalPaid.toLocaleString()}</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Net payments received</span>
              </div>
            </div>

            {/* Search Filter */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={ordersDrilldownSearch}
                onChange={e => setOrdersDrilldownSearch(e.target.value)}
                placeholder="Search orders by invoice number, patient name, phone, doctor, or staff creator..."
                className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-900"
              />
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-sky-50 dark:bg-slate-800 text-sky-900 dark:text-sky-200 uppercase text-[10px] tracking-wider border-b border-sky-100 dark:border-slate-700 font-extrabold sticky top-0">
                  <tr>
                    <th className="p-3.5">Invoice #</th>
                    <th className="p-3.5">Date & Time</th>
                    <th className="p-3.5">Patient Details</th>
                    <th className="p-3.5">Generated By</th>
                    <th className="p-3.5">Investigations</th>
                    <th className="p-3.5 text-right">Price (₹)</th>
                    <th className="p-3.5 text-right">Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {dashboardFilteredOrders
                    .filter(o => {
                      if (o.isDeleted) return false;
                      if (!ordersDrilldownSearch.trim()) return true;
                      const q = ordersDrilldownSearch.toLowerCase().trim();
                      return (
                        (o.invoiceNumber || '').toLowerCase().includes(q) ||
                        (o.patient?.name || '').toLowerCase().includes(q) ||
                        (o.patient?.phone || '').includes(q) ||
                        (o.createdByStaffName || '').toLowerCase().includes(q) ||
                        (o.referringDoctorName || '').toLowerCase().includes(q) ||
                        (o.tests || []).some(t => t.name.toLowerCase().includes(q))
                      );
                    })
                    .map(ord => (
                      <tr key={ord.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60">
                        <td className="p-3.5 font-mono font-bold text-sky-700 dark:text-sky-400">
                          #{ord.invoiceNumber}
                        </td>
                        <td className="p-3.5 text-slate-600 dark:text-slate-300 text-[11px]">
                          {formatSafeDate(ord.createdAt)}{' '}
                          <span className="block text-[10px] text-slate-400">
                            {formatSafeTime(ord.createdAt)}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-slate-900 dark:text-slate-100 block">{ord.patient.name}</span>
                          <span className="text-[10px] text-slate-400">{ord.patient.gender[0]}/{ord.patient.age} • {ord.patient.phone}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs">
                            {resolveBilledByName(ord)}
                          </span>
                          <span className="text-[10px] text-slate-400">Counter Desk</span>
                        </td>
                        <td className="p-3.5 text-slate-600 dark:text-slate-300 text-[11px] max-w-xs truncate">
                          {(ord.tests || []).map(t => t.name).join(', ')}
                        </td>
                        <td className="p-3.5 text-right font-bold text-slate-900 dark:text-slate-100">
                          ₹{ord.totalAmount.toLocaleString()}
                        </td>
                        <td className="p-3.5 text-right">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                            ord.dueAmount === 0 ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                          }`}>
                            {ord.dueAmount === 0 ? 'Paid' : `Due ₹${ord.dueAmount}`}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setIsOrdersDrilldownOpen(false);
                              setInvoiceModalOrder(ord);
                            }}
                            className="px-2.5 py-1 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            Invoice
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsOrdersDrilldownOpen(false)}
                className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close & Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT SCHEDULED APPOINTMENT MODAL (Super Admin & Manager) */}
      {editingAdminAppointment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={e => {
            if (e.target === e.currentTarget) setEditingAdminAppointment(null);
          }}
        >
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                  Edit Scheduled Appointment
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingAdminAppointment(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveAdminAppointment} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Patient Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editAdminAptName}
                  onChange={e => setEditAdminAptName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={editAdminAptPhone}
                    onChange={e => setEditAdminAptPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Age & Gender
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Age"
                      value={editAdminAptAge}
                      onChange={e => setEditAdminAptAge(e.target.value ? Number(e.target.value) : '')}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <select
                      value={editAdminAptGender}
                      onChange={e => setEditAdminAptGender(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Appointment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={editAdminAptDate}
                    onChange={e => setEditAdminAptDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                      Appointment Time *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setEditAdminAptDate(getLocalYYYYMMDD());
                        setEditAdminAptTime(getCurrent12HourTime());
                        showToast(`Synced appointment time to current time (${getCurrent12HourTime()})`);
                      }}
                      className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                      title="Sync to current live clock"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                      <span>Sync to Current Time</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={editAdminAptTime}
                    onChange={e => setEditAdminAptTime(e.target.value)}
                    placeholder="e.g. 10:30 AM"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Referring Doctor
                  </label>
                  <input
                    type="text"
                    value={editAdminAptDoctor}
                    onChange={e => setEditAdminAptDoctor(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Sharma"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Appointment Status
                  </label>
                  <select
                    value={editAdminAptStatus}
                    onChange={e => setEditAdminAptStatus(e.target.value as AppointmentStatus)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Clinical Notes / Remarks
                </label>
                <textarea
                  rows={2}
                  value={editAdminAptNotes}
                  onChange={e => setEditAdminAptNotes(e.target.value)}
                  placeholder="Clinical history, fasting scan requirements, or special instructions..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingAdminAppointment(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Sheets Live Database Modal */}
      {isGSheetsModalOpen && (
        <GoogleSheetsModal onClose={() => setIsGSheetsModalOpen(false)} />
      )}

      {/* Referred Patients Drill-Down Modal */}
      {referredOrdersModalDoc && (() => {
        const matchingOrders = allOrders.filter(
          o => !o.isDeleted && !o.deletionPendingApproval && isOrderBeneficiaryMatching(o, referredOrdersModalDoc)
        );
        const totalPaid = matchingOrders.reduce((sum, o) => sum + (o.paidAmount || 0), 0);
        const totalBilled = matchingOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setReferredOrdersModalDoc(null)}
          >
            <div
              className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-900 text-white flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-sky-200 block">
                    REFERRED PATIENT LOGS
                  </span>
                  <h3 className="text-lg font-black text-white mt-0.5 flex items-center gap-2">
                    {referredOrdersModalDoc.name}
                    {referredOrdersModalDoc.organizationName && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                        {referredOrdersModalDoc.organizationName}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-sky-100 mt-1">
                    Showing all {matchingOrders.length} patient orders referred by {referredOrdersModalDoc.name}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="hidden sm:block text-right bg-white/10 px-3 py-1.5 rounded-xl border border-white/20">
                    <span className="text-[10px] text-sky-200 block">Total Billed</span>
                    <span className="text-sm font-bold text-white">₹{totalBilled.toLocaleString()}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReferredOrdersModalDoc(null)}
                    className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                    title="Close (Esc)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Table Body */}
              <div className="p-6 overflow-y-auto flex-1">
                {matchingOrders.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <p className="font-semibold text-sm">No referred orders found for this doctor.</p>
                    <p className="text-xs text-slate-500 mt-1">Orders booked under this doctor or affiliated clinic will appear here.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-sky-50 text-sky-900 uppercase text-[10px] tracking-wider border-b border-sky-100 font-bold">
                        <tr>
                          <th className="p-3.5">#</th>
                          <th className="p-3.5">Patient Details</th>
                          <th className="p-3.5">Investigation(s)</th>
                          <th className="p-3.5">Doctor Name</th>
                          <th className="p-3.5 text-right">Paid Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {matchingOrders.map((ord, idx) => {
                          const patientName = ord.patient?.name || (ord as any).patientName || 'Unknown Patient';
                          const tests = ord.tests || [];
                          const docName = ord.referringDoctorName || referredOrdersModalDoc.name;

                          return (
                            <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3.5 font-bold text-slate-400">
                                {idx + 1}
                              </td>
                              <td className="p-3.5">
                                <span className="font-bold text-slate-900 block text-xs">
                                  {patientName}
                                </span>
                                <span className="text-[11px] text-slate-500 block">
                                  {ord.patient?.gender ? `${ord.patient.gender}, ` : ''}{ord.patient?.age ? `${ord.patient.age}Y • ` : ''}
                                  UHID: {ord.patient?.id || (ord as any).uhid || 'N/A'}
                                </span>
                                {ord.invoiceNumber && (
                                  <span className="text-[10px] font-mono font-semibold text-sky-700 block mt-0.5">
                                    Inv: {ord.invoiceNumber}
                                  </span>
                                )}
                              </td>
                              <td className="p-3.5 max-w-xs">
                                <div className="flex flex-wrap gap-1">
                                  {tests.map((t, tidx) => (
                                    <span
                                      key={`${t.id || tidx}`}
                                      className="inline-flex items-center px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-100 text-[10px] font-semibold"
                                    >
                                      {t.name}
                                    </span>
                                  ))}
                                  {tests.length === 0 && (
                                    <span className="text-[11px] text-slate-400 italic">Standard Diagnostic</span>
                                  )}
                                </div>
                              </td>
                              <td className="p-3.5">
                                <span className="font-bold text-slate-900 block">{docName}</span>
                                {ord.commissionBeneficiaryName && ord.commissionBeneficiaryName !== docName && (
                                  <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                                    Ben: {ord.commissionBeneficiaryName}
                                  </span>
                                )}
                              </td>
                              <td className="p-3.5 text-right font-black text-slate-900 whitespace-nowrap">
                                ₹{(ord.paidAmount || ord.totalAmount || 0).toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-800 text-xs">
                        <tr>
                          <td colSpan={4} className="p-3.5 text-right uppercase tracking-wider text-[11px] text-slate-500">
                            Total Collected ({matchingOrders.length} Patients):
                          </td>
                          <td className="p-3.5 text-right font-black text-sky-800 text-sm">
                            ₹{totalPaid.toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-mono">Esc</kbd> to close
                </span>
                <button
                  type="button"
                  onClick={() => setReferredOrdersModalDoc(null)}
                  className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
