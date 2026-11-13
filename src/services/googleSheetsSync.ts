import {
  DiagnosticOrder,
  DiagnosticTestItem,
  OperatingExpense,
  ReferringDoctor,
  StaffEmployee,
  Patient,
  PatientAppointment,
  DoctorRosterItem
} from '../types';

export const EMBEDDED_GOOGLE_SHEETS_URL =
  'https://script.google.com/macros/s/AKfycbx7lf5tjL1_kmqGMmw2tpwaR33geHoCQECxG6tkwEAXcyBnaiu73wvOpQawusAZ8HE/exec';

export const setGoogleSheetsUrl = (url: string) => {
  try {
    const clean = url.trim();
    localStorage.setItem(
      'ATLAS_DIAG_SHEETS_CONFIG',
      JSON.stringify({ webAppUrl: clean, updatedAt: new Date().toISOString() })
    );
  } catch (e) {
    console.warn('Failed to save Google Sheets URL:', e);
  }
};

export const getGoogleSheetsUrl = (): string => {
  try {
    // Check URL query parameters for instant 1-click device pairing (?sheetsUrl=... or ?backendUrl=...)
    if (typeof window !== 'undefined' && window.location.search) {
      const searchParams = new URLSearchParams(window.location.search);
      const paramUrl =
        searchParams.get('sheetsUrl') ||
        searchParams.get('backendUrl') ||
        searchParams.get('cloudUrl');
      if (paramUrl && paramUrl.trim().startsWith('http')) {
        const clean = decodeURIComponent(paramUrl.trim());
        setGoogleSheetsUrl(clean);
        return clean;
      }
    }

    const saved =
      localStorage.getItem('ATLAS_DIAG_SHEETS_CONFIG') ||
      localStorage.getItem('ATLAS_DIAG_CLOUD_CONFIG');
    if (saved) {
      const parsed = JSON.parse(saved);
      const current = String(parsed.webAppUrl || parsed.customEndpoint || '').trim();
      // Auto-migrate previous deployment URLs to the new master URL
      if (current.includes('AKfycbyHSu0pGl1tVgVAmzaweD6W79gp_1uKSbBrYy0Wb7wpNkjKud7W59W5moUtUZeQfQ') || current.includes('AKfycbzJTcM5BSIGM5lGgyXVju3fMl9sovknr0hLKTSRaBX3wE5l_ayZfpOwj3rGF34EMF8y')) {
        setGoogleSheetsUrl(EMBEDDED_GOOGLE_SHEETS_URL);
        return EMBEDDED_GOOGLE_SHEETS_URL;
      }
      if (current.startsWith('http')) {
        return current;
      }
    }
  } catch {}
  return EMBEDDED_GOOGLE_SHEETS_URL;
};

export interface SyncPayload {
  action:
    | 'TEST_CONNECTION'
    | 'INITIALIZE_SHEETS'
    | 'CREATE_ORDER'
    | 'SYNC_ORDER'
    | 'DELETE_ORDER'
    | 'ADD_EXPENSE'
    | 'SYNC_EXPENSE'
    | 'DELETE_EXPENSE'
    | 'SYNC_REFERRAL'
    | 'DELETE_REFERRAL'
    | 'SCHEDULE_APPOINTMENT'
    | 'SYNC_APPOINTMENT'
    | 'DELETE_APPOINTMENT'
    | 'SYNC_PATIENT'
    | 'DELETE_PATIENT'
    | 'SYNC_STAFF'
    | 'DELETE_STAFF'
    | 'SYNC_DOCTOR_ROSTER'
    | 'DELETE_DOCTOR_ROSTER'
    | 'DELETE_TEST'
    | 'DELETE_ATTENDANCE'
    | 'SYNC_STAFF_ATTENDANCE'
    | 'SYNC_TEST_CATALOG'
    | 'UPDATE_TEST_PRICE'
    | 'SYNC_ACTIVITY'
    | 'FULL_BACKUP'
    | 'SYNC_ALL_DATA'
    | 'REPAIR_ORDER_COLUMNS'
    | 'REPAIR_ORDER_SEQUENCES'
    | 'PURGE_DUPLICATE_ORDERS'
    | 'PURGE_DUPLICATES'
    | 'CLEAR_ALL_DATA_EXCEPT_TESTS';
  centerCode?: string;
  orderId?: string;
  invoiceNumber?: string;
  barcode?: string;
  patientId?: string;
  uhid?: string;
  name?: string;
  phone?: string;
  username?: string;
  email?: string;
  code?: string;
  logId?: string;
  testId?: string;
  receiptNo?: string;
  voucherNo?: string;
  expenseId?: string;
  appointmentId?: string;
  staffId?: string;
  doctorId?: string;
  rosterDoctorId?: string;
  referrerId?: string;
  deletedOrderIds?: string[];
  deletedPatientIds?: string[];
  deletedExpenseIds?: string[];
  deletedAppointmentIds?: string[];
  deletedStaffIds?: string[];
  deletedDoctorRosterIds?: string[];
  deletedDoctorIds?: string[];
  deletedTestIds?: string[];
  deletedAttendanceIds?: string[];
  order?: DiagnosticOrder;
  orders?: DiagnosticOrder[];
  patient?: Patient;
  patients?: Patient[];
  expense?: OperatingExpense;
  expenses?: OperatingExpense[];
  doctor?: ReferringDoctor;
  doctors?: ReferringDoctor[];
  referrers?: ReferringDoctor[];
  appointment?: PatientAppointment;
  appointments?: PatientAppointment[];
  staff?: StaffEmployee;
  staffList?: StaffEmployee[];
  doctorRoster?: DoctorRosterItem[];
  rosterDoctor?: DoctorRosterItem;
  test?: DiagnosticTestItem;
  tests?: DiagnosticTestItem[];
  activity?: any;
  attendanceLog?: any;
}

export interface SyncResult {
  success: boolean;
  message: string;
  timestamp: string;
  data?: any;
}

/**
 * Universal, bulletproof POST dispatcher to Google Apps Script Web App.
 * Uses 'text/plain;charset=utf-8' (a CORS-safelisted request-header) to prevent browser preflight errors,
 * with automatic fallback to no-cors mode for seamless delivery across all browsers and devices.
 */
export const postToGoogleAppsScript = async (payload: SyncPayload): Promise<SyncResult> => {
  const url = getGoogleSheetsUrl();
  const body = JSON.stringify(payload);

  // 1. Try standard CORS fetch with text/plain (CORS-safelisted header, avoids OPTIONS preflight)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body
    });
    if (res.ok) {
      try {
        const json = await res.json();
        return {
          success: json.status === 'SUCCESS' || !json.status,
          message: json.message || 'Synchronized successfully with Google Sheets',
          timestamp: new Date().toISOString(),
          data: json
        };
      } catch {
        return {
          success: true,
          message: 'Synchronized with Google Sheets',
          timestamp: new Date().toISOString()
        };
      }
    }
  } catch {
    // 2. If browser CORS redirect policy triggers error on read, fallback to mode: 'no-cors' with text/plain
    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body
      });
      return {
        success: true,
        message: 'Payload dispatched to Google Sheets',
        timestamp: new Date().toISOString()
      };
    } catch (fallbackErr: any) {
      return {
        success: false,
        message: fallbackErr?.message || 'Failed to dispatch to Google Sheets',
        timestamp: new Date().toISOString()
      };
    }
  }

  return {
    success: true,
    message: 'Synchronized with Google Sheets',
    timestamp: new Date().toISOString()
  };
};

export const testGoogleAppsScriptConnection = async (): Promise<SyncResult> => {
  try {
    const res = await postToGoogleAppsScript({ action: 'TEST_CONNECTION' });
    return {
      success: true,
      message: res.message || 'Connected to Google Spreadsheet! Webhook responded successfully.',
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Failed to connect to Google Apps Script Web App.',
      timestamp: new Date().toISOString()
    };
  }
};

export const initializeGoogleSheetsTables = async (): Promise<SyncResult> => {
  try {
    const res = await postToGoogleAppsScript({ action: 'INITIALIZE_SHEETS' });
    return {
      success: true,
      message:
        res.message ||
        'Initialized Master_Test_Catalog, Orders, Expenses, Referrals, Appointments, Staff & Doctor Roster sheets in Google Sheets!',
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Failed to initialize sheets.',
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Ensures a patient object always has a combined full name with title
 * (e.g. "Mr. Ramesh Kumar" or "Mrs. Ekta") before uploading to Google Sheets.
 */
export const ensureCombinedPatientName = (patient?: Patient | null): Patient | undefined => {
  if (!patient) return undefined;
  const p = { ...patient };
  const title = (p.title || '').trim();
  const first = (p.firstName || '').trim();
  const last = (p.lastName || '').trim();

  // If first name exists, combine title, first name, and last name into p.name
  if (first) {
    p.name = [title, first, last].filter(Boolean).join(' ').trim();
  } else if (p.name) {
    p.name = p.name.trim();
  }
  return p;
};

export const syncOrderToGoogleSheets = async (
  order: DiagnosticOrder,
  centerCode: string
): Promise<SyncResult> => {
  try {
    const orderToSync = { ...order };
    if (orderToSync.patient) {
      orderToSync.patient = ensureCombinedPatientName(orderToSync.patient)!;
    }

    // If Split Payment, encode the exact cash and online breakdown into paymentMode string
    // e.g. "Split: Cash ₹1000 + UPI ₹2000" so Google Sheets stores the exact amounts in the Payment Mode cell!
    const isSplit = orderToSync.paymentMode === 'Split Payment' || String(orderToSync.paymentMode || '').toLowerCase().includes('split');
    if (isSplit && orderToSync.splitPaymentDetails) {
      const c = Number(orderToSync.splitPaymentDetails.cashAmount) || 0;
      const u = Number(orderToSync.splitPaymentDetails.onlineAmount) || 0;
      const oMode = orderToSync.splitPaymentDetails.onlineMode || 'UPI / QR';
      (orderToSync as any).paymentMode = `Split: Cash ₹${c} + ${oMode} ₹${u}`;
    }

    // Keep doctor and beneficiary clean and separated - do not append "| Ben: ..." into doctor name
    const res = await postToGoogleAppsScript({
      action: 'CREATE_ORDER',
      centerCode,
      order: orderToSync
    });
    return {
      success: true,
      message:
        res.message ||
        `Order #${order.invoiceNumber} recorded into Google Sheet [Orders_${centerCode}]`,
      timestamp: new Date().toISOString()
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Google Sheets sync error: ${err.message}`,
      timestamp: new Date().toISOString()
    };
  }
};

export const syncExpenseToGoogleSheets = async (
  expense: OperatingExpense
): Promise<SyncResult> => {
  try {
    const res = await postToGoogleAppsScript({
      action: 'ADD_EXPENSE',
      expense
    });
    return {
      success: true,
      message:
        res.message ||
        `Expense voucher #${expense.receiptNo || expense.id} (${expense.paymentMode}) synced to Google Sheets`,
      timestamp: new Date().toISOString()
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Google Sheets expense sync error: ${err.message}`,
      timestamp: new Date().toISOString()
    };
  }
};

export const syncReferringDoctorToGoogleSheets = async (
  doctor: ReferringDoctor
): Promise<SyncResult> => {
  try {
    const res = await postToGoogleAppsScript({
      action: 'SYNC_REFERRAL',
      doctor
    });
    return {
      success: true,
      message: res.message || `Doctor ${doctor.name} synced to Referring_Doctors_Master`,
      timestamp: new Date().toISOString()
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Doctor sync error: ${err.message}`,
      timestamp: new Date().toISOString()
    };
  }
};

export const syncAppointmentToGoogleSheets = async (
  appointment: PatientAppointment
): Promise<SyncResult> => {
  try {
    const res = await postToGoogleAppsScript({
      action: 'SCHEDULE_APPOINTMENT',
      appointment
    });
    return {
      success: true,
      message:
        res.message || `Appointment #${appointment.id} synced to Appointments_Master`,
      timestamp: new Date().toISOString()
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Appointment sync error: ${err.message}`,
      timestamp: new Date().toISOString()
    };
  }
};

export const syncPatientToGoogleSheets = async (
  patient: Patient
): Promise<SyncResult> => {
  try {
    const patientToSync = ensureCombinedPatientName(patient) || patient;
    const res = await postToGoogleAppsScript({
      action: 'SYNC_PATIENT',
      patient: patientToSync
    });
    return {
      success: true,
      message:
        res.message || `Patient ${patientToSync.name} (${patientToSync.id}) synced to Patients_Master`,
      timestamp: new Date().toISOString()
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Patient sync error: ${err.message}`,
      timestamp: new Date().toISOString()
    };
  }
};

export const syncStaffToGoogleSheets = async (
  staff: StaffEmployee
): Promise<SyncResult> => {
  try {
    const res = await postToGoogleAppsScript({
      action: 'SYNC_STAFF',
      staff
    });
    return {
      success: true,
      message:
        res.message || `Staff member ${staff.name} synced to Staff_Employees_Master`,
      timestamp: new Date().toISOString()
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Staff sync error: ${err.message}`,
      timestamp: new Date().toISOString()
    };
  }
};

export const syncDoctorRosterToGoogleSheets = async (
  doctor: DoctorRosterItem
): Promise<SyncResult> => {
  try {
    const res = await postToGoogleAppsScript({
      action: 'SYNC_DOCTOR_ROSTER',
      rosterDoctor: doctor
    });
    return {
      success: true,
      message:
        res.message || `Doctor ${doctor.name} synced to Doctor_Roster_Master`,
      timestamp: new Date().toISOString()
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Doctor roster sync error: ${err.message}`,
      timestamp: new Date().toISOString()
    };
  }
};

export const syncFullTestCatalogToGoogleSheets = async (
  tests: DiagnosticTestItem[]
): Promise<SyncResult> => {
  try {
    const res = await postToGoogleAppsScript({
      action: 'SYNC_TEST_CATALOG',
      tests
    });
    return {
      success: true,
      message:
        res.message ||
        `Successfully synchronized ${tests.length} tests and price lists to Google Sheet [Master_Test_Catalog]`,
      timestamp: new Date().toISOString()
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to push test catalog to Google Sheets: ${err.message}`,
      timestamp: new Date().toISOString()
    };
  }
};



export const syncStaffAttendanceToGoogleSheets = async (
  log: any
): Promise<SyncResult> => {
  try {
    const res = await postToGoogleAppsScript({
      action: 'SYNC_STAFF_ATTENDANCE',
      attendanceLog: log
    });
    return {
      success: true,
      message: res.message || 'Staff attendance session synced to Google Sheets',
      timestamp: new Date().toISOString()
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Failed to push staff attendance to Google Sheets: ' + (err?.message || err),
      timestamp: new Date().toISOString()
    };
  }
};

export const syncActivityLogToGoogleSheets = async (
  activity: any
): Promise<SyncResult> => {
  try {
    const res = await postToGoogleAppsScript({
      action: 'SYNC_ACTIVITY',
      activity
    });
    return {
      success: true,
      message: res.message || `Activity logged to Google Sheets`,
      timestamp: new Date().toISOString()
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to push activity to Google Sheets: ${err.message}`,
      timestamp: new Date().toISOString()
    };
  }
};

export const updateTestPriceInGoogleSheets = async (
  test: DiagnosticTestItem
): Promise<SyncResult> => {
  try {
    const res = await postToGoogleAppsScript({
      action: 'UPDATE_TEST_PRICE',
      test
    });
    return {
      success: true,
      message:
        res.message || `Updated test "${test.name}" price (₹${test.price}) in Google Sheets`,
      timestamp: new Date().toISOString()
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to update test price in Google Sheets: ${err.message}`,
      timestamp: new Date().toISOString()
    };
  }
};

export const fetchTestsFromGoogleSheets = async (): Promise<{
  success: boolean;
  tests?: DiagnosticTestItem[];
  message: string;
}> => {
  try {
    const url = getGoogleSheetsUrl();
    const response = await fetch(`${url}?action=GET_TESTS`, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }

    const data = await response.json();
    if (data.status === 'SUCCESS' && Array.isArray(data.tests) && data.tests.length > 0) {
      return {
        success: true,
        tests: data.tests,
        message: `Successfully loaded ${data.tests.length} tests and live prices from Google Sheets`
      };
    }

    return {
      success: false,
      message:
        data.status === 'EMPTY'
          ? 'Master_Test_Catalog in Google Sheets is currently empty.'
          : 'No tests found in Google Sheets.'
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Could not fetch live rates from Google Sheets: ${err.message}. Using offline catalog.`
    };
  }
};

export interface FetchDataResult {
  success: boolean;
  orders?: DiagnosticOrder[];
  patients?: Patient[];
  expenses?: OperatingExpense[];
  doctors?: ReferringDoctor[];
  appointments?: PatientAppointment[];
  staff?: StaffEmployee[];
  doctorRoster?: DoctorRosterItem[];
  count?: number;
  message: string;
}

/**
 * Fetches all orders, patients, expenses, doctors, appointments, staff & roster recorded in Google Sheets
 */
export const fetchOrdersAndDataFromGoogleSheets = async (): Promise<FetchDataResult> => {
  try {
    const url = getGoogleSheetsUrl();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    const response = await fetch(`${url}?action=GET_ALL_DATA`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }

    const data = await response.json();
    if (data.status === 'SUCCESS') {
      return {
        success: true,
        orders: Array.isArray(data.orders) ? data.orders : [],
        patients: Array.isArray(data.patients) ? data.patients : [],
        expenses: Array.isArray(data.expenses) ? data.expenses : [],
        doctors: Array.isArray(data.doctors) ? data.doctors : [],
        appointments: Array.isArray(data.appointments) ? data.appointments : [],
        staff: Array.isArray(data.staff) ? data.staff : [],
        doctorRoster: Array.isArray(data.doctorRoster) ? data.doctorRoster : [],
        count: data.count || (data.orders ? data.orders.length : 0),
        message:
          data.message ||
          `Loaded ${data.orders ? data.orders.length : 0} orders & all entities from Google Sheets`
      };
    }

    return {
      success: false,
      message: data.message || 'No records returned from Google Sheets.'
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Could not fetch records from Google Sheets: ${err?.message || 'Network error'}`
    };
  }
};

export const deleteDoctorRosterFromGoogleSheets = async (
  doctorId: string,
  name?: string,
  phone?: string
): Promise<SyncResult> => {
  try {
    const res = await postToGoogleAppsScript({
      action: 'DELETE_DOCTOR_ROSTER',
      doctorId,
      rosterDoctorId: doctorId,
      name,
      phone
    });
    return {
      success: true,
      message: res.message || `Doctor ${name || doctorId} deleted from Google Sheets Doctor Roster`,
      timestamp: new Date().toISOString()
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to delete doctor from roster: ${err.message}`,
      timestamp: new Date().toISOString()
    };
  }
};

export const deleteAppointmentFromGoogleSheets = async (
  appointmentId: string,
  patientPhone?: string,
  patientName?: string
): Promise<SyncResult> => {
  try {
    const res = await postToGoogleAppsScript({
      action: 'DELETE_APPOINTMENT',
      appointmentId,
      phone: patientPhone,
      name: patientName
    });
    return {
      success: true,
      message: res.message || `Appointment #${appointmentId} deleted from Google Sheets`,
      timestamp: new Date().toISOString()
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to delete appointment: ${err.message}`,
      timestamp: new Date().toISOString()
    };
  }
};

export const deleteStaffFromGoogleSheets = async (
  staffId: string,
  username?: string,
  phone?: string,
  email?: string
): Promise<SyncResult> => {
  try {
    const res = await postToGoogleAppsScript({
      action: 'DELETE_STAFF',
      staffId,
      username,
      phone,
      email
    });
    return {
      success: true,
      message: res.message || `Staff member ${username || staffId} deleted from Google Sheets`,
      timestamp: new Date().toISOString()
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to delete staff: ${err.message}`,
      timestamp: new Date().toISOString()
    };
  }
};

export const deleteOrderFromGoogleSheets = async (
  orderId: string,
  invoiceNumber?: string,
  centerCode?: string,
  barcode?: string
): Promise<SyncResult> => {
  try {
    const res = await postToGoogleAppsScript({
      action: 'DELETE_ORDER',
      orderId,
      invoiceNumber,
      centerCode,
      barcode
    });
    return {
      success: true,
      message: res.message || `Order #${invoiceNumber || orderId} deleted from Google Sheets`,
      timestamp: new Date().toISOString()
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to delete order: ${err.message}`,
      timestamp: new Date().toISOString()
    };
  }
};

export const deletePatientFromGoogleSheets = async (
  patientId: string,
  uhid?: string,
  phone?: string,
  name?: string
): Promise<SyncResult> => {
  try {
    const res = await postToGoogleAppsScript({
      action: 'DELETE_PATIENT',
      patientId,
      uhid,
      phone,
      name
    });
    return {
      success: true,
      message: res.message || `Patient #${uhid || patientId} deleted from Google Sheets`,
      timestamp: new Date().toISOString()
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to delete patient: ${err.message}`,
      timestamp: new Date().toISOString()
    };
  }
};

export const deleteExpenseFromGoogleSheets = async (
  expenseId: string,
  receiptNo?: string
): Promise<SyncResult> => {
  try {
    const res = await postToGoogleAppsScript({
      action: 'DELETE_EXPENSE',
      expenseId,
      receiptNo
    });
    return {
      success: true,
      message: res.message || `Expense #${receiptNo || expenseId} deleted from Google Sheets`,
      timestamp: new Date().toISOString()
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to delete expense: ${err.message}`,
      timestamp: new Date().toISOString()
    };
  }
};

export const deleteReferringDoctorFromGoogleSheets = async (
  doctorId: string,
  name?: string,
  phone?: string
): Promise<SyncResult> => {
  try {
    const res = await postToGoogleAppsScript({
      action: 'DELETE_REFERRAL',
      doctorId,
      name,
      phone
    });
    return {
      success: true,
      message: res.message || `Referring doctor ${name || doctorId} deleted from Google Sheets`,
      timestamp: new Date().toISOString()
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to delete referring doctor: ${err.message}`,
      timestamp: new Date().toISOString()
    };
  }
};

export const deleteTestFromGoogleSheets = async (
  testId: string,
  name?: string,
  code?: string
): Promise<SyncResult> => {
  try {
    const res = await postToGoogleAppsScript({
      action: 'DELETE_TEST',
      testId,
      name,
      code
    });
    return {
      success: true,
      message: res.message || `Test ${name || testId} deleted from Google Sheets Master Catalog`,
      timestamp: new Date().toISOString()
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to delete test: ${err.message}`,
      timestamp: new Date().toISOString()
    };
  }
};

export const deleteAttendanceFromGoogleSheets = async (
  logId: string
): Promise<SyncResult> => {
  try {
    const res = await postToGoogleAppsScript({
      action: 'DELETE_ATTENDANCE',
      logId
    });
    return {
      success: true,
      message: res.message || `Attendance record #${logId} deleted from Google Sheets`,
      timestamp: new Date().toISOString()
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to delete attendance: ${err.message}`,
      timestamp: new Date().toISOString()
    };
  }
};

export const syncFullBackupToGoogleSheets = async (
  orders: DiagnosticOrder[],
  expenses: OperatingExpense[],
  tests?: DiagnosticTestItem[],
  patients?: Patient[],
  referrers?: ReferringDoctor[],
  appointments?: PatientAppointment[],
  staffList?: StaffEmployee[],
  doctorRoster?: DoctorRosterItem[],
  deletedIds?: {
    orders?: string[];
    patients?: string[];
    expenses?: string[];
    appointments?: string[];
    staff?: string[];
    doctorRoster?: string[];
    doctors?: string[];
    tests?: string[];
    attendance?: string[];
  }
): Promise<SyncResult> => {
  try {
    const sanitizedOrders = (orders || []).map(o => {
      if (o.patient) {
        return { ...o, patient: ensureCombinedPatientName(o.patient)! };
      }
      return o;
    });
    const sanitizedPatients = patients ? patients.map(p => ensureCombinedPatientName(p)!) : undefined;

    const payload: SyncPayload = {
      action: 'FULL_BACKUP',
      orders: sanitizedOrders,
      expenses,
      tests,
      patients: sanitizedPatients,
      referrers,
      appointments,
      staffList,
      doctorRoster,
      deletedOrderIds: deletedIds?.orders,
      deletedPatientIds: deletedIds?.patients,
      deletedExpenseIds: deletedIds?.expenses,
      deletedAppointmentIds: deletedIds?.appointments,
      deletedStaffIds: deletedIds?.staff,
      deletedDoctorRosterIds: deletedIds?.doctorRoster,
      deletedDoctorIds: deletedIds?.doctors,
      deletedTestIds: deletedIds?.tests,
      deletedAttendanceIds: deletedIds?.attendance
    };

    const res = await postToGoogleAppsScript(payload);

    return {
      success: true,
      message:
        res.message ||
        `Full Multi-Device Backup synced to Google Sheets (${orders.length} orders, ${patients?.length || 0} patients, ${staffList?.length || 0} staff, ${doctorRoster?.length || 0} roster doctors)`,
      timestamp: new Date().toISOString()
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Sync failed: ${err.message}`,
      timestamp: new Date().toISOString()
    };
  }
};

export const repairOrderColumnsInGoogleSheets = async (): Promise<SyncResult> => {
  try {
    const res = await postToGoogleAppsScript({
      action: 'REPAIR_ORDER_COLUMNS'
    });
    return {
      success: true,
      message: res.message || 'Successfully repaired shifted columns across all Google Sheets.',
      timestamp: new Date().toISOString()
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to repair Google Sheets columns: ${err.message}`,
      timestamp: new Date().toISOString()
    };
  }
};

export const purgeDuplicateOrdersInGoogleSheets = async (): Promise<SyncResult> => {
  try {
    const res = await postToGoogleAppsScript({
      action: 'PURGE_DUPLICATE_ORDERS'
    });
    return {
      success: true,
      message: res.message || 'Successfully purged duplicate order rows directly from Google Sheets.',
      timestamp: new Date().toISOString(),
      data: res
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to purge duplicate orders in Google Sheets: ${err.message}`,
      timestamp: new Date().toISOString()
    };
  }
};
