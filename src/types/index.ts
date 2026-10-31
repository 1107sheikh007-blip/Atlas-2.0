export type UserRole = 'SUPER_ADMIN' | 'CENTER_MANAGER' | 'RECEPTIONIST' | 'DIAGNOSTIC_DOCTOR' | 'LAB_TECHNICIAN' | 'REFERRING_DOCTOR' | 'PATIENT';

export type DiagnosticCategory = 'Radiology' | 'Pathology' | 'Cardiology' | 'Specialized';

export type TestSampleType = 'Blood (EDTA)' | 'Blood (Serum)' | 'Urine' | 'Digital Imaging' | 'Ultrasound Scan' | 'MRI Scan' | 'CT Scan' | 'Swab';

export type ReferralStatus = 'APPROVED' | 'PENDING_APPROVAL' | 'REJECTED';

export type OrderStatus = 'ORDER_PLACED' | 'SAMPLE_COLLECTED' | 'IN_PROCESSING' | 'DOCTOR_REVIEW' | 'VERIFIED' | 'DISPATCHED';

export type PaymentStatus = 'PAID' | 'PARTIAL' | 'DUE';

export type PaymentMode = 'UPI / QR' | 'Cash' | 'Credit / Debit Card' | 'Insurance' | 'Due Credit' | 'Split Payment';

export interface CenterBranch {
  id: string;
  name: string;
  code: string;
  sheetName: string; // Tab name in Google Sheets e.g. "Apex_Hub_Orders"
  address: string;
  phone: string;
  isMain: boolean;
}

export interface UserSession {
  id: string;
  name: string;
  role: UserRole;
  assignedCenterId: string; // Center locked for this staff
  email: string;
  phone: string;
}

export interface AuthUser {
  id?: string;
  username: string;
  name: string;
  role: UserRole;
  designation: string;
  staffId?: string;
  assignedCenterId?: string;
  loginTimestamp?: string;
}

export interface ReferringDoctor {
  id: string;
  name: string;
  qualification: string;
  specialty: string;
  hospital: string;
  phone: string;
  email: string;
  commissionPct: number; // e.g. 15%
  status: ReferralStatus;
  addedByRole: 'RECEPTIONIST' | 'SUPER_ADMIN' | 'CENTER_MANAGER';
  addedAt: string;
  approvedAt?: string;
  totalReferralsCount: number;
  totalRevenueGenerated: number;
  totalCommissionEarned: number;
  payoutPaid: number;
  bankDetails?: string;
  notes?: string;
  affiliationType?: 'SELF' | 'ORGANIZATION';
  organizationName?: string;
  registrationNo?: string;
  welcomeSent?: boolean;
}

export type DoctorShiftType = 
  | 'Morning (8:00 AM - 2:00 PM)'
  | 'Evening (2:00 PM - 8:00 PM)'
  | 'Night (8:00 PM - 8:00 AM)'
  | 'Full Day (9:00 AM - 6:00 PM)'
  | 'On-Call (24x7 Emergency)'
  | 'Visiting Consultant (By Appointment)';

export type DoctorDutyStatus = 'ON_DUTY' | 'AVAILABLE_ON_CALL' | 'OFF_DUTY' | 'ON_LEAVE';

export interface DoctorRosterItem {
  id: string;
  name: string;
  qualification: string;
  specialty: string;
  department: string;
  phone: string;
  email?: string;
  registrationNo: string;
  centerId: string;
  centerCode?: string;
  roleType: 'CHIEF_CONSULTANT' | 'RESIDENT_PATHOLOGIST' | 'RESIDENT_RADIOLOGIST' | 'VISITING_SPECIALIST' | 'ON_CALL_EXPERT';
  shift: DoctorShiftType;
  workingDays: string[];
  status: DoctorDutyStatus;
  roomNo?: string;
  experienceYears?: number;
  emergencyAvailable?: boolean;
  notes?: string;
}

export interface DiagnosticTestItem {
  id: string;
  code: string;
  name: string;
  category: DiagnosticCategory;
  department: string;
  subDepartment?: string;
  sampleType: TestSampleType;
  price: number;
  costPrice?: number;
  b2bPrice?: number;
  tatHours: number;
  fastingRequired?: boolean;
  defaultTemplate?: string;
  parameters?: Array<{
    name: string;
    unit: string;
    normalRange: string;
    defaultValue?: string;
  }>;
}

export interface Patient {
  id: string; // UHID e.g. ATL-P-10024
  name: string;
  title?: 'Mr.' | 'Mrs.' | 'Ms.' | 'Mast.' | 'Baby' | 'Dr.' | string;
  firstName?: string;
  lastName?: string;
  age: number;
  ageMonths?: number;
  ageDays?: number;
  ageDisplay?: string;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email?: string;
  address?: string;
  bloodGroup?: string;
  abhaId?: string;
  registeredAt: string;
  registeredCenterId?: string;
  beneficiaryId?: string; // Auto-linked referring doctor for commission
  referringDoctorId?: string;
  referringDoctorName?: string;
  commissionBeneficiaryId?: string;
  commissionBeneficiaryName?: string;
  welcomeSent?: boolean;
  isDeleted?: boolean;
  deletionPendingApproval?: boolean;
  deletedByStaffName?: string;
  deletionReason?: string;
  deletionRequestedAt?: string;
  syncedToGoogleSheets?: boolean;
}

export interface DiagnosticOrder {
  id: string; // e.g. ATL-ORD-2026-1042
  invoiceNumber: string;
  patientId: string;
  patient: Patient;
  referringDoctorId?: string;
  referringDoctorName?: string;
  doctorAffiliation?: string;
  commissionBeneficiaryId?: string;
  commissionBeneficiaryName?: string;
  centerId: string;
  centerCode?: string;
  tests: DiagnosticTestItem[];
  subtotal: number;
  discountPct: number;
  discountAmount: number;
  discountReason?: string;
  gstAmount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentMode: PaymentMode;
  splitPaymentDetails?: {
    cashAmount: number;
    onlineAmount: number;
    onlineMode?: 'UPI / QR' | 'Card' | 'Bank Transfer';
  };
  paymentStatus: PaymentStatus;
  barcode: string; // Sample/Test ID Barcode
  status: OrderStatus;
  createdAt: string;
  appointmentDate?: string;
  appointmentTime?: string;
  sampleCollected?: boolean;
  sampleCollectedAt?: string;
  sampleCollectedBy?: string;
  createdByStaffId?: string;
  createdByStaffName?: string; // Admin-only staff audit tracking
  reportReadyAt?: string;
  dispatchedAt?: string;
  whatsappSent: boolean;
  smsSent: boolean;
  notes?: string;
  patientStatusRemark?: string;
  hasMissedAppointment?: boolean;
  missedAppointmentNotes?: string;
  refundAmount?: number;
  refundReason?: string;
  refundMode?: PaymentMode;
  refundedAt?: string;
  refundedByStaffName?: string;
  isRefunded?: boolean;
  refundStatus?: 'NONE' | 'PARTIAL_REFUND' | 'FULL_REFUND';
  syncedToGoogleSheets?: boolean;
  isDeleted?: boolean;
  deletionPendingApproval?: boolean;
  deletedByStaffName?: string;
  deletionReason?: string;
  deletionRequestedAt?: string;
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  actionType: 'ORDER_CREATED' | 'ORDER_MODIFIED' | 'SAMPLE_COLLECTED' | 'PAYMENT_RECEIVED' | 'ORDER_REFUNDED' | 'REPORT_DRAFTED' | 'REPORT_AUTHORIZED' | 'REPORT_DISPATCHED' | 'PATIENT_REGISTERED' | 'DOCTOR_REGISTERED' | 'DOCTOR_APPROVED' | 'STAFF_ADDED' | 'STAFF_UPDATED' | 'STAFF_LOGIN' | 'STAFF_LOGOUT' | 'EXPENSE_LOGGED' | 'TEST_ADDED' | 'TEST_MODIFIED' | 'TEST_DELETED' | 'SYNC_PERFORMED' | 'DELETION_REQUESTED' | 'DELETION_APPROVED' | 'DELETION_REJECTED' | 'APPOINTMENT_SCHEDULED' | 'APPOINTMENT_UPDATED' | 'APPOINTMENT_CANCELLED';
  actorName: string;
  actorRole: UserRole;
  centerId?: string;
  centerCode?: string;
  details: string;
  metadata?: Record<string, any>;
}

export interface StaffAttendanceLog {
  id: string;
  staffId: string;
  staffName: string;
  role: string;
  centerId: string;
  centerCode: string;
  loginAt: string;
  logoutAt?: string;
  durationMinutes?: number;
  status: 'ONLINE' | 'LOGGED_OUT';
}

export interface DiagnosticReport {
  id: string;
  orderId: string;
  testId: string;
  testName: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  category: DiagnosticCategory;
  findingsHtml: string;
  impression: string;
  recommendations?: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorRegistrationNo: string;
  doctorSignatureUrl?: string;
  doctorSealUrl?: string;
  status: 'DRAFT' | 'AUTHORIZED';
  authorizedAt?: string;
  attachments: Array<{
    id: string;
    name: string;
    url: string;
    size: string;
  }>;
  analyzerGenerated?: boolean;
  isDeleted?: boolean;
  deletionPendingApproval?: boolean;
  deletedByStaffName?: string;
  deletionReason?: string;
  deletionRequestedAt?: string;
}

export interface StaffPermissions {
  canCreateInvoices?: boolean;
  canCollectPayments?: boolean;
  canProcessRefunds?: boolean;
  canEditCatalog?: boolean;
  canViewMISReports?: boolean;
  canApproveDeletions?: boolean;
  canManageStaff?: boolean;
  canManageReferrals?: boolean;
  canAccessAppointments?: boolean;
  canAuthorizeReports?: boolean;
}

export interface StaffEmployee {
  id: string;
  name: string;
  role: 'Receptionist' | 'Radiologist' | 'Pathologist' | 'Lab Technician' | 'Phlebotomist' | 'Center Manager' | 'Super Admin' | 'Center Director' | 'Accountant';
  assignedCenterId: string; // Specific center assigned
  phone: string;
  email: string;
  username?: string;
  password?: string;
  shift: string;
  shiftStartTime?: string;
  shiftEndTime?: string;
  shiftTiming?: string;
  monthlySalary: number;
  hourlyRate: number;
  workedHoursThisMonth: number;
  totalShiftsCompleted: number;
  attendancePct: number;
  joinedDate: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  lastLoginAt?: string;
  lastLogoutAt?: string;
  isLoggedIn?: boolean;
  signatureUrl?: string; // Doctor Seal & Signature file/image (PNG, JPG, PDF)
  sealUrl?: string;
  registrationNo?: string;
  permissions?: StaffPermissions;
  updatedAt?: string;
}

export interface OperatingExpense {
  id: string;
  title: string;
  category: 'Electricity & Utilities' | 'Center Rent' | 'Lab Reagents & Chemicals' | 'Equipment AMC & Maintenance' | 'Staff Payroll' | 'Stationery & IT' | 'Miscellaneous';
  amount: number;
  date: string;
  centerId: string;
  paidTo: string;
  paymentMode: 'Bank Transfer' | 'UPI' | 'Cheque' | 'Cash' | 'Card';
  receiptNo?: string;
  syncedToGoogleSheets?: boolean;
  isDeleted?: boolean;
  deletionPendingApproval?: boolean;
  deletedByStaffName?: string;
  deletionReason?: string;
  deletionRequestedAt?: string;
}

export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'MISSED' | 'CANCELLED';

export interface PatientAppointment {
  id: string; // e.g. ATL-APT-2026-001
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  patientAge?: number;
  patientGender?: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // e.g. "10:30 AM"
  testsRequested: string[];
  referringDoctorName?: string;
  centerId: string;
  status: AppointmentStatus;
  notes?: string;
  isMissed?: boolean;
  createdAt: string;
  convertedOrderId?: string;
  syncedToGoogleSheets?: boolean;
}

export type DeletableEntityType = 'ORDER' | 'PATIENT' | 'EXPENSE' | 'REPORT';

export interface PendingDeletionItem {
  id: string;
  entityType: DeletableEntityType;
  title: string;
  subtitle: string;
  centerId?: string;
  centerCode?: string;
  amount?: number;
  requestedBy: string;
  requestedAt: string;
  reason?: string;
  rawItem: any;
}

export interface FinancialSummary {
  grossRevenue: number;
  discountsGiven: number;
  netRevenue: number;
  collectedAmount: number;
  cashIncome: number;
  onlineIncome: number;
  totalRefunds: number;
  pendingDueAmount: number;
  totalOperatingExpenses: number;
  totalPayrollExpenses: number;
  totalOutflow: number;
  netProfit: number;
  profitMarginPct: number;
}

export interface GoogleSheetsConfig {
  webAppUrl: string;
  sheetId?: string;
  autoSyncEnabled: boolean;
  lastSyncedAt?: string;
  syncStatus: 'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR';
  errorMessage?: string;
}
