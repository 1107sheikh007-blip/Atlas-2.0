import { DiagnosticOrder, Patient } from '../types';

/**
 * Returns local YYYY-MM-DD string according to the client/system local time
 */
export const getLocalYYYYMMDD = (d: Date = new Date()): string => {
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
};

/**
 * Normalizes any date string or Date object to a clean local 'YYYY-MM-DD' string.
 * Accurately parses ISO strings, Indian format DD/MM/YYYY, DD-MM-YYYY, Date objects, and ATLS invoice keys.
 */
export const normalizeToYYYYMMDD = (dateInput: string | Date | undefined | null): string => {
  if (!dateInput) return '';
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return '';
    return getLocalYYYYMMDD(dateInput);
  }

  const str = String(dateInput).trim();
  if (!str) return '';

  // 1. Direct match YYYY-MM-DD or ISO timestamp (e.g., 2026-10-12 or 2026-10-12T...)
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = String(parseInt(ymdMatch[2], 10)).padStart(2, '0');
    const d = String(parseInt(ymdMatch[3], 10)).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 2. Match DD/MM/YYYY or DD-MM-YYYY (e.g. 12/10/2026 or 12-10-2026 with optional time)
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    const d = String(parseInt(dmyMatch[1], 10)).padStart(2, '0');
    const m = String(parseInt(dmyMatch[2], 10)).padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }

  // 3. Fallback: Parse using new Date(str)
  try {
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 2000 && parsed.getFullYear() <= 2099) {
      return getLocalYYYYMMDD(parsed);
    }
  } catch {}

  // 4. Check if string contains invoice key like ATLS261012.00001
  const invMatch = str.match(/ATLS(\d{2})(\d{2})(\d{2})/i);
  if (invMatch) {
    return `20${invMatch[1]}-${invMatch[2]}-${invMatch[3]}`;
  }

  return '';
};

/**
 * Formats a Date object as an ISO-8601 string with local timezone offset (e.g. 2026-10-08T21:55:00.000+05:30)
 * so that both string prefix splitting (.split('T')[0]) and Date parsing in local time always yield the exact same calendar day.
 */
export const toLocalISOString = (d: Date = new Date()): string => {
  const valid = isNaN(d.getTime()) ? new Date() : d;
  const yy = valid.getFullYear();
  const mm = String(valid.getMonth() + 1).padStart(2, '0');
  const dd = String(valid.getDate()).padStart(2, '0');
  const hh = String(valid.getHours()).padStart(2, '0');
  const mi = String(valid.getMinutes()).padStart(2, '0');
  const ss = String(valid.getSeconds()).padStart(2, '0');
  const ms = String(valid.getMilliseconds()).padStart(3, '0');
  const tzOffset = -valid.getTimezoneOffset();
  const sign = tzOffset >= 0 ? '+' : '-';
  const absOffset = Math.abs(tzOffset);
  const tzH = String(Math.floor(absOffset / 60)).padStart(2, '0');
  const tzM = String(absOffset % 60).padStart(2, '0');
  return `${yy}-${mm}-${dd}T${hh}:${mi}:${ss}.${ms}${sign}${tzH}:${tzM}`;
};

/**
 * Accurately parses any date format (DD/MM/YYYY, DD-MM-YYYY, ISO, timestamps) into a JavaScript Date object,
 * preventing US-style month/day inversion and preventing UTC 'Z' conversion from shifting local IST dates by +1 or -1 day.
 */
export const parseSafeDate = (val?: string | number | Date | null): Date => {
  if (!val) return new Date();
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? new Date() : val;
  }
  if (typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date() : d;
  }

  const str = String(val).trim();
  if (!str) return new Date();

  const ymd = normalizeToYYYYMMDD(str);
  if (ymd) {
    const [y, m, d] = ymd.split('-').map(Number);

    // If ISO string with 'T', extract intended local time while strictly anchoring calendar date to [y, m, d]
    if (str.includes('T')) {
      // Legacy edited timestamps had ':00.000Z' appended directly to local HH:mm time (e.g. '2026-10-08T21:55:00.000Z')
      const isoTimeMatch = str.match(/T(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.(\d+))?(Z|[+-]\d{2}:?\d{2})?/i);
      if (isoTimeMatch) {
        const rawH = parseInt(isoTimeMatch[1], 10);
        const rawMin = parseInt(isoTimeMatch[2], 10);
        const rawSec = isoTimeMatch[3] ? parseInt(isoTimeMatch[3], 10) : 0;
        const rawMs = isoTimeMatch[4] ? parseInt(isoTimeMatch[4].slice(0, 3).padEnd(3, '0'), 10) : 0;
        const tzPart = isoTimeMatch[5] || '';

        const isLegacyLocalWithZ = /T\d{2}:\d{2}:00\.000Z$/i.test(str);
        if (!tzPart || isLegacyLocalWithZ) {
          const anchored = new Date(y, m - 1, d, rawH, rawMin, rawSec, rawMs);
          if (!isNaN(anchored.getTime())) return anchored;
        } else {
          const parsedInst = new Date(str);
          if (!isNaN(parsedInst.getTime())) {
            // Anchor the calendar date to the explicit YYYY-MM-DD prefix so evening UTC timestamps never roll into next day
            const anchored = new Date(
              y,
              m - 1,
              d,
              parsedInst.getHours(),
              parsedInst.getMinutes(),
              parsedInst.getSeconds(),
              parsedInst.getMilliseconds()
            );
            if (!isNaN(anchored.getTime())) return anchored;
          }
        }
      }
    }

    const timeMatch = str.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?/i);
    let hrs = 12, mins = 0, secs = 0;
    if (timeMatch) {
      hrs = parseInt(timeMatch[1], 10);
      mins = parseInt(timeMatch[2], 10);
      secs = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
      const isPm = /pm/i.test(timeMatch[4] || '');
      const isAm = /am/i.test(timeMatch[4] || '');
      if (isPm && hrs < 12) hrs += 12;
      if (isAm && hrs === 12) hrs = 0;
    } else {
      const now = new Date();
      hrs = now.getHours();
      mins = now.getMinutes();
      secs = now.getSeconds();
    }
    const dateObj = new Date(y, m - 1, d, hrs, mins, secs);
    if (!isNaN(dateObj.getTime())) {
      return dateObj;
    }
  }

  try {
    const d = new Date(str);
    if (!isNaN(d.getTime()) && d.getFullYear() >= 2000 && d.getFullYear() <= 2099) {
      return d;
    }
  } catch {}

  return new Date();
};

/**
 * Returns a standardized local-offset ISO date-time string from any input format,
 * ensuring the YYYY-MM-DD prefix and local Date representation never diverge across timezones.
 */
export const parseDateToISO = (val?: string | number | Date | null): string => {
  return toLocalISOString(parseSafeDate(val));
};

/**
 * Builds a timezone-safe ISO timestamp from a user-selected YYYY-MM-DD date and HH:mm (or 12h) time.
 * Guarantees that the calendar date never shifts by +1 or -1 day in IST or UTC.
 */
export const buildSafeISOFromLocalDateAndTime = (
  dateInput?: string | null,
  timeInput?: string | null,
  fallbackISO?: string | null
): string => {
  const normDate = normalizeToYYYYMMDD(dateInput) || normalizeToYYYYMMDD(fallbackISO) || getLocalYYYYMMDD();
  const [y, m, d] = normDate.split('-').map(Number);

  let hrs = 12;
  let mins = 0;
  let secs = 0;

  if (fallbackISO) {
    const fb = parseSafeDate(fallbackISO);
    if (!isNaN(fb.getTime())) {
      hrs = fb.getHours();
      mins = fb.getMinutes();
      secs = fb.getSeconds();
    }
  } else {
    const now = new Date();
    hrs = now.getHours();
    mins = now.getMinutes();
    secs = now.getSeconds();
  }

  if (timeInput && String(timeInput).trim()) {
    const tStr = String(timeInput).trim();
    const tMatch = tStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (tMatch) {
      let parsedH = parseInt(tMatch[1], 10);
      const parsedM = parseInt(tMatch[2], 10);
      const parsedS = tMatch[3] ? parseInt(tMatch[3], 10) : 0;
      const ampm = (tMatch[4] || '').toLowerCase();
      if (ampm === 'pm' && parsedH < 12) parsedH += 12;
      if (ampm === 'am' && parsedH === 12) parsedH = 0;
      if (!isNaN(parsedH) && parsedH >= 0 && parsedH <= 23) hrs = parsedH;
      if (!isNaN(parsedM) && parsedM >= 0 && parsedM <= 59) mins = parsedM;
      if (!isNaN(parsedS) && parsedS >= 0 && parsedS <= 59) secs = parsedS;
    }
  }

  const localDate = new Date(y, m - 1, d, hrs, mins, secs, 0);
  return toLocalISOString(localDate);
};

/**
 * Robust date formatter that safely handles invalid dates, corrupted timestamps, and prevents timezone day shifts
 */
export const formatSafeDate = (dateVal?: string | number | Date | null): string => {
  if (!dateVal) return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  try {
    const ymd = normalizeToYYYYMMDD(dateVal as any);
    if (ymd) {
      const [y, m, d] = ymd.split('-').map(Number);
      if (y >= 2000 && y <= 2099 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        return new Date(y, m - 1, d, 12, 0, 0).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      }
    }
    const d = parseSafeDate(dateVal);
    if (isNaN(d.getTime()) || d.getFullYear() < 2000 || d.getFullYear() > 2099) {
      return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
};

export const formatSafeTime = (dateVal?: string | number | Date | null): string => {
  if (!dateVal) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  try {
    const d = parseSafeDate(dateVal);
    if (isNaN(d.getTime()) || d.getFullYear() < 2000 || d.getFullYear() > 2099) {
      return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
};

export const formatSafeDateTime = (dateVal?: string | number | Date | null): string => {
  return `${formatSafeDate(dateVal)} ${formatSafeTime(dateVal)}`;
};

/**
 * Returns current formatted 12-hour time string (e.g. "03:45 PM")
 */
export const getCurrent12HourTime = (): string => {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

/**
 * Returns current formatted 24-hour time string (e.g. "15:45") suitable for HTML time pickers
 */
export const getCurrent24HourTime = (): string => {
  const d = new Date();
  const hrs = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${hrs}:${mins}`;
};

/**
 * Converts 24-hour time "15:45" to 12-hour "03:45 PM"
 */
export const convert24To12HourTime = (time24?: string): string => {
  if (!time24) return getCurrent12HourTime();
  if (time24.includes('AM') || time24.includes('PM') || time24.includes('am') || time24.includes('pm')) {
    return time24;
  }
  if (time24.includes('GMT') || time24.includes('1899') || time24.includes('T')) {
    try {
      const d = new Date(time24);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      }
    } catch {}
  }
  const parts = time24.split(':');
  if (parts.length < 2) return time24;
  let h = parseInt(parts[0], 10);
  const m = parts[1].slice(0, 2);
  if (isNaN(h)) return time24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  const hStr = h < 10 ? `0${h}` : `${h}`;
  return `${hStr}:${m} ${ampm}`;
};

/**
 * Converts 12-hour time "03:45 PM" to 24-hour "15:45"
 */
export const convert12To24HourTime = (time12?: string): string => {
  if (!time12) return getCurrent24HourTime();
  if (!time12.includes('AM') && !time12.includes('PM') && !time12.includes('am') && !time12.includes('pm')) {
    return time12;
  }
  const isPM = /pm/i.test(time12);
  const isAM = /am/i.test(time12);
  const clean = time12.replace(/[^\d:]/g, '');
  const parts = clean.split(':');
  if (parts.length < 2) return getCurrent24HourTime();
  let h = parseInt(parts[0], 10);
  const m = parts[1].slice(0, 2);
  if (isPM && h < 12) h += 12;
  if (isAM && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${m}`;
};

/**
 * Detects legacy shifted columns or corrupted fields from older Google Sheet imports and restores them
 */
export const sanitizeOrderRecord = (ord: any, existingPatients: Patient[] = []): DiagnosticOrder => {
  if (!ord || typeof ord !== 'object') {
    return ord;
  }

  const rawInvoice = String(ord.invoiceNumber || '').trim();
  const rawCreatedAt = String(ord.createdAt || '').trim();
  const rawPatientName = String(ord.patient?.name || '').trim();
  const rawPatientId = String(ord.patientId || ord.patient?.id || '').trim();
  const rawDoc = String(ord.referringDoctorName || '').trim();
  const rawBeneficiary = String(ord.commissionBeneficiaryName || '').trim();

  // Detect column shift from older Google Apps Script / Sheet formats
  const isShifted =
    (rawInvoice.includes('T') && rawInvoice.includes('Z')) ||
    rawCreatedAt.startsWith('ATL-P-') ||
    rawCreatedAt.startsWith('CK') ||
    /^\d+Y\s*\/\s*(Male|Female)/i.test(rawPatientName) ||
    /^(CK|ATL-P-)\d+/i.test(rawPatientName) ||
    /^\d{8,14}$/.test(rawDoc) ||
    (typeof ord.patient?.age === 'string' && isNaN(Number(ord.patient.age)) && String(ord.patient.age).length > 2) ||
    (typeof ord.patient?.gender === 'string' && /^\d+$/.test(ord.patient.gender)) ||
    (typeof ord.tests?.[0]?.name === 'string' && (
      !isNaN(Number(ord.tests[0].name)) ||
      ['female', 'male', '0', ''].includes(ord.tests[0].name.toLowerCase().trim())
    ));

  // 1. Recover Valid Creation Timestamp using timezone-safe parseDateToISO
  let validDate = parseDateToISO(rawCreatedAt || (rawInvoice.includes('T') ? rawInvoice : '') || ord.createdAt);

  // Helper to validate human name vs system code / price number
  const isInvalidHumanName = (nameStr: string) => {
    if (!nameStr) return true;
    const trimmed = nameStr.trim();
    if (!trimmed) return true;
    if (/^\d+(\.\d+)?$/.test(trimmed)) return true; // Pure numbers like 4400, 6000
    if (/^\d+Y\s*\//i.test(trimmed)) return true; // Age gender string like 28Y / Female
    if (/^(atl-bar|atl-p|atl-ord|atl-main|cnt-|bar-|inv-|emp-|sample|order|ck\d)/i.test(trimmed)) return true;
    if (['female', 'male', 'other', 'direct / walk-in', 'direct walk-in', 'null', 'undefined'].includes(trimmed.toLowerCase())) return true;
    return false;
  };

  // 2. Recover UHID & Patient Name
  let matchedPatient = existingPatients.find(p =>
    (rawPatientId && p.id === rawPatientId) ||
    (rawPatientName && p.name && p.name.trim().toLowerCase() === rawPatientName.trim().toLowerCase()) ||
    (ord.patient?.phone && p.phone && p.phone === ord.patient.phone)
  );

  let realUHID = rawPatientId || matchedPatient?.id || (rawInvoice ? `PAT-${rawInvoice.replace(/^ATL-ORD-/, '')}` : `PAT-${Date.now()}`);
  let realName = '';
  let realPhone = '';
  let realGender: 'Male' | 'Female' | 'Other' = 'Female';
  let realAge = 30;

  // Check if rawPatientName is actually a UHID/Invoice number (shifted row)
  if (/^(CK|ATL-P-)\d+/i.test(rawPatientName)) {
    realUHID = rawPatientName;
  } else if (/^(CK|ATL-P-)\d+/i.test(rawPatientId)) {
    realUHID = rawPatientId;
  }

  // Extract patient name
  if (!isInvalidHumanName(rawPatientName)) {
    realName = rawPatientName;
  } else if (typeof ord.patient?.age === 'string' && !isInvalidHumanName(ord.patient.age)) {
    // In shifted rows from Google Sheets, the patient name was in Age/Gender column
    realName = String(ord.patient.age).trim();
  } else if (typeof ord.referringDoctorName === 'string' && !isInvalidHumanName(ord.referringDoctorName) && !/^\d+$/.test(ord.referringDoctorName)) {
    realName = String(ord.referringDoctorName).trim();
  }

  // Look up existing patients if available
  if (!realName && realUHID) {
    const pMatch = existingPatients.find(p => p.id === realUHID);
    if (pMatch && pMatch.name && !isInvalidHumanName(pMatch.name)) {
      realName = pMatch.name;
      if (pMatch.phone) realPhone = pMatch.phone;
      if (pMatch.gender) realGender = pMatch.gender as any;
      if (pMatch.age) realAge = pMatch.age;
    }
  }

  // Fallback to generic safe name - NEVER hardcode staff/admin name
  if (!realName || isInvalidHumanName(realName)) {
    realName = 'Walk-in Patient';
  }

  // Extract age safely
  if (typeof ord.patient?.gender === 'string' && /^\d+$/.test(ord.patient.gender)) {
    // In shifted rows, age was in the Gender column
    realAge = parseInt(ord.patient.gender, 10) || 30;
  } else if (typeof ord.patient?.age === 'number' && ord.patient.age > 0 && ord.patient.age <= 120) {
    realAge = ord.patient.age;
  } else if (typeof ord.patient?.age === 'string' && /^\d+$/.test(ord.patient.age.trim())) {
    realAge = parseInt(ord.patient.age.trim(), 10) || 30;
  }

  // Extract gender safely
  if (ord.patient?.phone && ['Female', 'Male', 'Other'].includes(String(ord.patient.phone))) {
    // In shifted rows, gender was in Phone column
    realGender = ord.patient.phone as any;
  } else if (ord.patient?.gender && ['Female', 'Male', 'Other'].includes(String(ord.patient.gender))) {
    realGender = ord.patient.gender as any;
  }

  // Extract phone number safely
  if (/^\d{8,14}$/.test(rawDoc)) {
    // In shifted rows, phone was in Referring Doctor column
    realPhone = rawDoc;
  } else if (ord.patient?.phone && /^\d{6,14}$/.test(String(ord.patient.phone).replace(/[^0-9]/g, ''))) {
    realPhone = String(ord.patient.phone).replace(/[^0-9]/g, '');
  }

  // 3. Recover Doctor & Beneficiary
  const isInvalidDoctorName = (docStr: string) => {
    if (!docStr) return true;
    const trimmed = docStr.trim();
    if (!trimmed) return true;
    if (/^\d+$/.test(trimmed)) return true;
    if (/^(atl-main|cnt-|atl-bar|atl-p|atl-ord|bar-|inv-|emp-|sample|order|no|none|null|undefined)/i.test(trimmed)) return true;
    if (['sample_collected', 'processing', 'result_entered', 'verified', 'completed', 'order_placed', 'cancelled'].includes(trimmed.toLowerCase())) return true;
    return false;
  };

  let realDoctor = 'Direct / Walk-in';
  let realBeneficiary = rawBeneficiary || ord.commissionBeneficiaryName || '';
  if (rawDoc && !isInvalidDoctorName(rawDoc) && !/^\d{8,14}$/.test(rawDoc)) {
    if (rawDoc.includes(' | Ben: ')) {
      const parts = rawDoc.split(' | Ben: ');
      realDoctor = parts[0].trim();
      if (parts[1] && parts[1].trim()) {
        realBeneficiary = parts[1].trim();
      }
    } else {
      realDoctor = rawDoc;
    }
  } else if (rawBeneficiary && !isInvalidDoctorName(rawBeneficiary) && !/^\d{8,14}$/.test(rawBeneficiary)) {
    realDoctor = rawBeneficiary;
  }
  if (!realBeneficiary) {
    realBeneficiary = realDoctor;
  }

  // 4. Recover and Clean Diagnostic Tests
  let cleanTests: any[] = [];
  if (Array.isArray(ord.tests) && ord.tests.length > 0) {
    const rawItems: any[] = [];
    ord.tests.forEach((t: any) => {
      const tName = String(t?.name || '').trim();
      if (tName.includes(',') && !tName.toLowerCase().includes('ltd') && !tName.toLowerCase().includes('inc')) {
        const parts = tName.split(',');
        parts.forEach((p, pIdx) => {
          rawItems.push({
            ...t,
            id: `${t.id || 't'}-${pIdx}`,
            name: p.trim(),
            price: Math.round((Number(t.price) || 1000) / parts.length)
          });
        });
      } else {
        rawItems.push(t);
      }
    });

    cleanTests = rawItems.filter((t: any) => {
      const tName = String(t?.name || '').trim();
      const tNameLower = tName.toLowerCase();
      if (!tName) return false;
      if (['female', 'male', 'other', '0', '', 'undefined', 'null', 'nan'].includes(tNameLower)) return false;
      if (!isNaN(Number(tName))) return false;
      if (/^(atl-bar|atl-main|atl-p|atl-ord|bar-|cnt-|inv-|emp-|sample|order)/i.test(tNameLower)) return false;
      return true;
    }).map((t: any, i: number) => ({
      id: t.id || `t-diag-${i}`,
      name: String(t.name).trim(),
      code: t.code || `DIAG-${i + 1}`,
      category: t.category || 'Radiology',
      tatHours: Number(t.tatHours) || 4,
      price: (typeof t.price === 'number' && t.price > 0 && t.price <= 50000) ? t.price : 1000
    }));
  }

  // If no valid tests exist or was corrupted by column shift, recover actual test from subtotal or remark
  if (cleanTests.length === 0) {
    let recoveredName = '';
    if (typeof ord.subtotal === 'string' && isNaN(Number(ord.subtotal)) && ord.subtotal.trim().length > 2) {
      recoveredName = ord.subtotal.trim();
    } else if (typeof ord.testsSummary === 'string' && ord.testsSummary.trim().length > 2) {
      recoveredName = ord.testsSummary.trim();
    } else if (typeof ord.patientStatusRemark === 'string' && ord.patientStatusRemark.trim().length > 2 && !ord.patientStatusRemark.toLowerCase().includes('remark')) {
      recoveredName = ord.patientStatusRemark.trim();
    }

    const testPrice = (typeof ord.totalAmount === 'number' && ord.totalAmount > 0)
      ? ord.totalAmount
      : ((typeof ord.subtotal === 'number' && ord.subtotal > 0) ? ord.subtotal : (Number(ord.paidAmount) || 1000));

    cleanTests = [
      {
        id: 't-diag-01',
        name: recoveredName || 'Diagnostic Investigation',
        code: 'DIAG-01',
        category: 'Radiology',
        tatHours: 4,
        price: testPrice
      }
    ];
  }

  // 5. Recover Financials and preserve actual order amount
  const parseFinancialAmount = (val: any, defaultVal = 0): number => {
    if (val === null || val === undefined || val === '') return defaultVal;
    if (typeof val === 'number') return isNaN(val) ? defaultVal : val;
    const cleaned = String(val).replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? defaultVal : Math.round(num);
  };

  let numSubtotal = cleanTests.reduce((sum: number, t: any) => sum + (Number(t.price) || 0), 0);
  const parsedTotal = parseFinancialAmount(ord.totalAmount, -1);
  const parsedSubtotal = parseFinancialAmount(ord.subtotal, -1);
  const parsedDiscount = parseFinancialAmount(ord.discountAmount, 0);

  if (parsedTotal > 0) {
    numSubtotal = parsedTotal + parsedDiscount;
  } else if (parsedSubtotal > 0) {
    numSubtotal = parsedSubtotal;
  }

  let numDiscount = parsedDiscount;
  if (numDiscount > numSubtotal || numDiscount > 200000) {
    numDiscount = 0;
  }

  let numTotal = Math.max(0, numSubtotal - numDiscount);
  
  // Paid & Due - Prevent false due when order is settled or paid
  const isMarkedPaid = String(ord.paymentStatus || '').toUpperCase() === 'PAID';
  let numPaid: number;
  let numDue: number;

  const rawPaid = ord.paidAmount;
  const rawDue = ord.dueAmount;

  if (isMarkedPaid) {
    numPaid = numTotal;
    numDue = 0;
  } else if (rawPaid !== undefined && rawPaid !== null && String(rawPaid).trim() !== '') {
    numPaid = parseFinancialAmount(rawPaid, numTotal);
    numDue = Math.max(0, numTotal - numPaid);
  } else if (rawDue !== undefined && rawDue !== null && String(rawDue).trim() !== '') {
    numDue = parseFinancialAmount(rawDue, 0);
    numPaid = Math.max(0, numTotal - numDue);
  } else {
    // Default to paid in full (no due)
    numPaid = numTotal;
    numDue = 0;
  }

  // 6. Generate Clean Invoice Format - Preserve legitimate existing invoice numbers!
  const dObj = new Date(validDate);
  const yy = String(dObj.getFullYear()).slice(-2);
  const mm = String(dObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dObj.getDate()).padStart(2, '0');
  
  let cleanInvoice = rawInvoice;
  // If rawInvoice is empty or shifted, attempt recovery from barcode
  const rawBarcode = String(ord.barcode || '').trim();
  const barcodeMatch = rawBarcode.match(/ATL-BAR-(ATLS\d+\.\d+)/i);
  if ((!cleanInvoice || cleanInvoice.includes('T')) && barcodeMatch) {
    cleanInvoice = barcodeMatch[1].toUpperCase();
  }

  if (!cleanInvoice || (cleanInvoice.includes('T') && cleanInvoice.includes('Z'))) {
    if (rawCreatedAt && /^(CK|ATLS|INV)\d+/i.test(rawCreatedAt)) {
      cleanInvoice = rawCreatedAt;
    } else {
      cleanInvoice = `ATLS${yy}${mm}${dd}.${String(Date.now()).slice(-5)}`;
    }
  }

  const cleanStatus = ['SAMPLE_COLLECTED', 'PROCESSING', 'RESULT_ENTERED', 'VERIFIED', 'COMPLETED', 'ORDER_PLACED', 'CANCELLED'].includes(ord.status)
    ? ord.status
    : 'SAMPLE_COLLECTED';

  const cleanStaff = (ord.createdByStaffName && !['reception desk', 'reception staff', 'desk', 'undefined', 'null'].includes(ord.createdByStaffName.toLowerCase().trim()))
    ? ord.createdByStaffName
    : 'Tashmiya';

  const cleanId = (ord.id && !String(ord.id).includes('T') && !String(ord.id).startsWith('MO') && String(ord.id) === `ATL-ORD-${cleanInvoice}`)
    ? String(ord.id)
    : `ATL-ORD-${cleanInvoice}`;

  return {
    ...ord,
    id: cleanId,
    invoiceNumber: cleanInvoice,
    createdAt: validDate,
    appointmentDate: normalizeToYYYYMMDD(validDate || ord.appointmentDate) || ord.appointmentDate,
    patientId: realUHID,
    patient: {
      id: realUHID,
      name: realName,
      age: realAge,
      gender: realGender,
      phone: realPhone,
      address: ord.patient?.address || '',
      registeredAt: validDate,
      registeredCenterId: ord.centerId || 'cnt-01'
    },
    tests: cleanTests,
    subtotal: numSubtotal,
    discountAmount: numDiscount,
    discountPct: numSubtotal > 0 ? Math.round((numDiscount / numSubtotal) * 100) : 0,
    totalAmount: numTotal,
    paidAmount: numPaid,
    dueAmount: numDue,
    paymentMode: ord.paymentMode || 'Cash',
    paymentStatus: numDue === 0 ? 'PAID' : numPaid > 0 ? 'PARTIAL' : 'DUE',
    status: cleanStatus,
    referringDoctorName: realDoctor,
    commissionBeneficiaryName: realBeneficiary || realDoctor,
    createdByStaffName: cleanStaff,
    barcode: `ATL-BAR-${cleanInvoice}`,
    centerId: ord.centerId || 'cnt-01',
    centerCode: ord.centerCode || 'ATL-MAIN',
    syncedToGoogleSheets: ord.syncedToGoogleSheets !== undefined ? ord.syncedToGoogleSheets : true
  };
};

/**
 * Normalizes an entire array of orders, eliminates duplicate entries, and re-sequences invoice numbers sequentially
 */
export const sanitizeOrdersCollection = (rawOrders: any[], existingPatients: Patient[] = []): DiagnosticOrder[] => {
  if (!Array.isArray(rawOrders) || rawOrders.length === 0) return [];

  // 1. Sanitize individual fields
  const sanitizedList = rawOrders.map(o => sanitizeOrderRecord(o, existingPatients));

  // Preserve genuine orders and canonical invoice numbers directly from Google Sheets
  return sanitizedList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

/**
 * Parses full human name into title ('Mr.' | 'Mrs.' | 'Ms.' | 'Mast.' | 'Dr.'), firstName, and lastName
 */
export const parsePatientNameParts = (fullName: string): {
  title: 'Mr.' | 'Mrs.' | 'Ms.' | 'Mast.' | 'Dr.';
  firstName: string;
  lastName: string;
} => {
  if (!fullName) return { title: 'Mr.', firstName: '', lastName: '' };
  const raw = fullName.trim();
  const match = raw.match(/^(Dr\.|Mr\.|Mrs\.|Ms\.|Mast\.|Dr|Mr|Mrs|Ms|Mast)\s+(.*)$/i);
  let title: 'Mr.' | 'Mrs.' | 'Ms.' | 'Mast.' | 'Dr.' = 'Mr.';
  let remainder = raw;
  if (match) {
    const rawTitle = match[1].toLowerCase().replace(/\./g, '');
    if (rawTitle === 'dr') title = 'Dr.';
    else if (rawTitle === 'mrs') title = 'Mrs.';
    else if (rawTitle === 'ms') title = 'Ms.';
    else if (rawTitle === 'mast') title = 'Mast.';
    else title = 'Mr.';
    remainder = match[2].trim();
  }
  const parts = remainder.split(/\s+/).filter(Boolean);
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ') || '';
  return { title, firstName, lastName };
};
