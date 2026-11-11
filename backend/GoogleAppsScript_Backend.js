/**
 * ====================================================================================================
 * ATLAS DIAGNOSTICS CENTER & MEDICAL IMAGING HUB - COMPLETE ENTERPRISE CLOUD BACKEND
 * Version: 5.4.0 (Master Multi-Device Live Sync Edition)
 * Application: Atlas Diagnostics Center - Pathology & Radiology Management Suite (RIS / LIMS)
 * ====================================================================================================
 * 
 * QUICK SETUP & DEPLOYMENT INSTRUCTIONS:
 * 1. Open your master Google Spreadsheet (e.g. "Atlas Diagnostics Center Enterprise Database").
 * 2. In the top menu, go to: Extensions > Apps Script.
 * 3. Delete any existing code in the editor, and paste this ENTIRE script file.
 * 4. In the toolbar, select function "initializeAllAtlasSheets" and click "Run" (Authorize permissions if prompted).
 * 5. Click "Deploy" (top right) > "New deployment".
 * 6. Click the gear icon (Select type) > Choose "Web app".
 * 7. Configuration parameters:
 *    - Description: "Atlas Diagnostics Center Master Web App v5.4"
 *    - Execute as: "Me" (your Google Account)
 *    - Who has access: "Anyone" (allows front-desk, doctor cabins & mobile devices to sync securely)
 * 8. Click "Deploy", copy the generated "Web app URL", and paste it into the software's Cloud Settings.
 * ====================================================================================================
 */

// ==========================================
// 1. GLOBAL CONSTANTS & SHEET CONFIGURATIONS
// ==========================================

var APP_NAME = "Atlas Diagnostics Center";
var APP_VERSION = "5.4.0";

var SHEET_NAMES = {
  MASTER_TESTS: "Master_Test_Catalog",
  ORDERS_MAIN: "Orders_ATL_MAIN",
  ORDERS_METRO: "Orders_ATL_METRO",
  ORDERS_WEST: "Orders_ATL_WEST",
  PATIENTS: "Patients_Master",
  DOCTORS: "Referring_Doctors_Master",
  EXPENSES: "Operating_Expenses",
  APPOINTMENTS: "Appointments_Master",
  STAFF: "Staff_Employees_Master",
  ATTENDANCE: "Staff_Attendance_Logs",
  AUDIT_LOGS: "Audit_Activity_Logs",
  DAILY_SUMMARY: "Financial_Daily_Summary",
  DOCTOR_ROSTER: "Doctor_Roster_Master"
};

// ==========================================
// 2. HTTP GET REQUEST HANDLER (doGet)
// ==========================================

function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var action = params.action ? params.action.toUpperCase() : "PING";
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // Action: PING / HEALTH CHECK
    if (action === "PING" || action === "HEALTH" || action === "TEST_CONNECTION") {
      return createJsonResponse({
        status: "SUCCESS",
        application: APP_NAME,
        version: APP_VERSION,
        spreadsheetId: ss.getId(),
        spreadsheetName: ss.getName(),
        timestamp: new Date().toISOString()
      });
    }

    // Action: GET_TESTS (Catalog with 1,170 tests and live rates)
    if (action === "GET_TESTS") {
      var testSheet = ss.getSheetByName(SHEET_NAMES.MASTER_TESTS);
      if (!testSheet) {
        return createJsonResponse({ status: "EMPTY", message: "Master_Test_Catalog sheet not found.", tests: [] });
      }
      var testData = testSheet.getDataRange().getValues();
      if (testData.length <= 1) {
        return createJsonResponse({ status: "EMPTY", message: "Master_Test_Catalog is empty.", tests: [] });
      }

      var tests = [];
      for (var i = 1; i < testData.length; i++) {
        var row = testData[i];
        if (row[0] && row[1]) {
          tests.push({
            id: String(row[0]).trim(),
            code: String(row[0]).trim(),
            name: String(row[1]).trim(),
            category: String(row[2] || "Pathology").trim(),
            department: String(row[3] || "General").trim(),
            sampleType: String(row[4] || "Blood (Serum)").trim(),
            tatHours: Number(row[5]) || 4,
            price: Number(row[6]) || 0,
            b2bPrice: Number(row[7]) || 0,
            fastingRequired: row[8] === true || String(row[8]).toLowerCase() === "true",
            subDepartment: String(row[9] || "").trim(),
            lastUpdated: String(row[10] || new Date().toISOString())
          });
        }
      }

      return createJsonResponse({
        status: "SUCCESS",
        count: tests.length,
        tests: tests,
        timestamp: new Date().toISOString()
      });
    }

    // Action: GET_ORDERS (Reads all orders across center branch sheets)
    if (action === "GET_ORDERS" || action === "GET_ALL_ORDERS") {
      var allOrders = fetchAllOrdersFromSheets(ss);
      return createJsonResponse({
        status: "SUCCESS",
        count: allOrders.length,
        orders: allOrders,
        timestamp: new Date().toISOString()
      });
    }

    // Action: GET_PATIENTS (Reads registered patients)
    if (action === "GET_PATIENTS") {
      var patSheet = ss.getSheetByName(SHEET_NAMES.PATIENTS);
      var patients = fetchPatientsFromSheet(patSheet);
      return createJsonResponse({
        status: "SUCCESS",
        count: patients.length,
        patients: patients,
        timestamp: new Date().toISOString()
      });
    }

    // Action: GET_DOCTORS (Reads referring partners & organizations)
    if (action === "GET_DOCTORS" || action === "GET_REFERRALS") {
      var docSheet = ss.getSheetByName(SHEET_NAMES.DOCTORS);
      var doctors = fetchDoctorsFromSheet(docSheet);
      return createJsonResponse({
        status: "SUCCESS",
        count: doctors.length,
        doctors: doctors,
        timestamp: new Date().toISOString()
      });
    }

    // Action: GET_APPOINTMENTS
    if (action === "GET_APPOINTMENTS") {
      var aptSheet = ss.getSheetByName(SHEET_NAMES.APPOINTMENTS);
      var appointments = fetchAppointmentsFromSheet(aptSheet);
      return createJsonResponse({
        status: "SUCCESS",
        count: appointments.length,
        appointments: appointments,
        timestamp: new Date().toISOString()
      });
    }

    // Action: GET_STAFF
    if (action === "GET_STAFF") {
      var staffSheet = ss.getSheetByName(SHEET_NAMES.STAFF);
      var staffList = fetchStaffFromSheet(staffSheet);
      return createJsonResponse({
        status: "SUCCESS",
        count: staffList.length,
        staff: staffList,
        timestamp: new Date().toISOString()
      });
    }

    // Action: GET_DOCTOR_ROSTER
    if (action === "GET_DOCTOR_ROSTER") {
      var rosterSheet = ss.getSheetByName(SHEET_NAMES.DOCTOR_ROSTER);
      var roster = fetchDoctorRosterFromSheet(rosterSheet);
      return createJsonResponse({
        status: "SUCCESS",
        count: roster.length,
        doctorRoster: roster,
        timestamp: new Date().toISOString()
      });
    }

    // Action: GET_ALL_DATA (Complete Full-System Snapshot across all entities)
    if (action === "GET_ALL_DATA" || action === "FULL_SNAPSHOT") {
      var snapshotOrders = fetchAllOrdersFromSheets(ss);
      var snapshotPatients = fetchPatientsFromSheet(ss.getSheetByName(SHEET_NAMES.PATIENTS));
      var snapshotDoctors = fetchDoctorsFromSheet(ss.getSheetByName(SHEET_NAMES.DOCTORS));
      var snapshotAppointments = fetchAppointmentsFromSheet(ss.getSheetByName(SHEET_NAMES.APPOINTMENTS));
      var snapshotStaff = fetchStaffFromSheet(ss.getSheetByName(SHEET_NAMES.STAFF));
      var snapshotRoster = fetchDoctorRosterFromSheet(ss.getSheetByName(SHEET_NAMES.DOCTOR_ROSTER));

      var snapshotExpenses = [];
      var expS = ss.getSheetByName(SHEET_NAMES.EXPENSES);
      if (expS) {
        var expValues = expS.getDataRange().getValues();
        for (var ei = 1; ei < expValues.length; ei++) {
          var eR = expValues[ei];
          if (eR[0]) {
            snapshotExpenses.push({
              id: String(eR[0]).trim(),
              receiptNo: String(eR[1] || "").trim(),
              date: String(eR[2] || "").trim(),
              category: String(eR[3] || "").trim(),
              title: String(eR[4] || "").trim(),
              amount: Number(eR[5]) || 0,
              paymentMode: String(eR[6] || "Cash").trim(),
              centerCode: String(eR[7] || "ATL-MAIN").trim(),
              recordedByStaffName: String(eR[8] || "").trim(),
              notes: String(eR[9] || "").trim()
            });
          }
        }
      }

      return createJsonResponse({
        status: "SUCCESS",
        application: APP_NAME,
        version: APP_VERSION,
        orders: snapshotOrders,
        patients: snapshotPatients,
        doctors: snapshotDoctors,
        appointments: snapshotAppointments,
        expenses: snapshotExpenses,
        staff: snapshotStaff,
        doctorRoster: snapshotRoster,
        count: snapshotOrders.length,
        timestamp: new Date().toISOString()
      });
    }

    return createJsonResponse({
      status: "ONLINE",
      application: APP_NAME,
      version: APP_VERSION,
      message: "Atlas Diagnostics Center Cloud Backend ready. Actions: GET_ALL_DATA, GET_TESTS, GET_ORDERS, GET_PATIENTS, GET_DOCTORS, GET_APPOINTMENTS, GET_STAFF, GET_DOCTOR_ROSTER.",
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    return createJsonResponse({ status: "ERROR", message: err.toString(), stack: err.stack });
  }
}

// ==========================================
// 3. HTTP POST REQUEST HANDLER (doPost)
// ==========================================

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (err) {
    return createJsonResponse({ status: "ERROR", message: "Server lock timeout during write." });
  }

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ status: "ERROR", message: "Empty payload received." });
    }

    var payload = JSON.parse(e.postData.contents);
    var action = payload.action ? payload.action.toUpperCase() : "TEST_CONNECTION";
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. INITIALIZE ALL SHEETS & FORMATTING
    if (action === "INITIALIZE_SHEETS") {
      initializeAllAtlasSheets();
      return createJsonResponse({
        status: "SUCCESS",
        message: "Successfully initialized and styled all Atlas Diagnostics Center database sheets!"
      });
    }

    // 2. CREATE / SYNC SINGLE ORDER
    if (action === "CREATE_ORDER" || action === "SYNC_ORDER") {
      var ord = payload.order;
      if (!ord) return createJsonResponse({ status: "ERROR", message: "Order object is missing." });

      var centerCode = payload.centerCode || ord.centerCode || "ATL_MAIN";
      var sheetName = "Orders_" + centerCode.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();
      var orderSheet = getOrCreateSheet(ss, sheetName, getOrdersHeader());

      var headers = orderSheet.getRange(1, 1, 1, Math.max(orderSheet.getLastColumn(), 1)).getValues()[0];
      if (!headers || headers.length === 0 || !headers[0]) {
        headers = getOrdersHeader();
        orderSheet.appendRow(headers);
        styleHeaderRow(orderSheet, "#0369a1");
      }

      var targetUhid = ord.patientId || (ord.patient ? (ord.patient.uhid || ord.patient.id) : "");
      var targetName = ord.patient ? (ord.patient.name || "") : (ord.patientName || "");
      var existingRow = findOrderRowIndex(orderSheet, ord.id, ord.invoiceNumber, targetUhid, targetName);
      var rowData = buildOrderRowFromHeaders(headers, ord);

      if (existingRow > 0) {
        orderSheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
      } else {
        // Double-check if invoice already exists in sheet to update in place rather than creating duplicate
        var colInvIdx = -1;
        for (var hc = 0; hc < headers.length; hc++) {
          var hName = String(headers[hc] || "").toLowerCase().trim();
          if (hName.indexOf("invoice") >= 0 || hName === "inv" || hName.indexOf("bill no") >= 0) {
            colInvIdx = hc;
            break;
          }
        }
        var foundExistingInvRow = -1;
        if (colInvIdx >= 0 && ord.invoiceNumber) {
          var allSheetData = orderSheet.getDataRange().getValues();
          var targetInvClean = String(ord.invoiceNumber).trim().toUpperCase();
          for (var ar = 1; ar < allSheetData.length; ar++) {
            if (String(allSheetData[ar][colInvIdx] || "").trim().toUpperCase() === targetInvClean) {
              foundExistingInvRow = ar + 1;
              break;
            }
          }
        }
        if (foundExistingInvRow > 0) {
          orderSheet.getRange(foundExistingInvRow, 1, 1, rowData.length).setValues([rowData]);
        } else {
          orderSheet.appendRow(rowData);
        }
      }

      // Upsert patient into Patients_Master if patient object present
      if (ord.patient && (ord.patient.id || ord.patientId)) {
        upsertPatientRecord(ss, ord.patient);
      }

      return createJsonResponse({
        status: "SUCCESS",
        message: "Order #" + ord.invoiceNumber + " recorded successfully into sheet [" + sheetName + "]."
      });
    }

    // 3. ADD OPERATING EXPENSE
    if (action === "ADD_EXPENSE" || action === "SYNC_EXPENSE") {
      var exp = payload.expense;
      if (!exp) return createJsonResponse({ status: "ERROR", message: "Expense object is missing." });

      var expSheet = getOrCreateSheet(ss, SHEET_NAMES.EXPENSES, getExpensesHeader());
      var expIndex = findRowIndexByColumnValue(expSheet, 1, exp.id);
      var expRow = [
        exp.id,
        exp.receiptNo || ("VOU-" + Date.now().toString().slice(-4)),
        exp.date || new Date().toISOString(),
        exp.category || "Supplies",
        exp.title || "Operating Expense",
        exp.amount || 0,
        exp.paymentMode || "Cash",
        exp.centerCode || "ATL-MAIN",
        exp.recordedByStaffName || "Center Manager",
        exp.notes || "",
        new Date().toISOString()
      ];

      if (expIndex > 0) {
        expSheet.getRange(expIndex, 1, 1, expRow.length).setValues([expRow]);
      } else {
        expSheet.appendRow(expRow);
      }

      return createJsonResponse({
        status: "SUCCESS",
        message: "Expense voucher #" + exp.receiptNo + " recorded in Google Sheets."
      });
    }

    // 4. SYNC TEST CATALOG
    if (action === "SYNC_TEST_CATALOG") {
      var testList = payload.tests;
      if (!testList || !Array.isArray(testList)) {
        return createJsonResponse({ status: "ERROR", message: "Tests array is required." });
      }

      var catalogSheet = getOrCreateSheet(ss, SHEET_NAMES.MASTER_TESTS, getTestsHeader());
      catalogSheet.clearContents();
      catalogSheet.appendRow(getTestsHeader());
      styleHeaderRow(catalogSheet, "#0284c7");

      var rows = [];
      for (var ti = 0; ti < testList.length; ti++) {
        var t = testList[ti];
        rows.push([
          t.id || ("t-" + ti),
          t.name || "",
          t.category || "Pathology",
          t.department || "General",
          t.sampleType || "Blood (Serum)",
          t.tatHours || 4,
          t.price || 0,
          t.b2bPrice || 0,
          t.fastingRequired || false,
          t.subDepartment || "",
          new Date().toISOString()
        ]);
      }

      if (rows.length > 0) {
        catalogSheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
      }

      return createJsonResponse({
        status: "SUCCESS",
        message: "Synchronized " + rows.length + " tests into Master_Test_Catalog."
      });
    }

    // 5. UPDATE TEST PRICE
    if (action === "UPDATE_TEST_PRICE") {
      var singleTest = payload.test;
      if (!singleTest) return createJsonResponse({ status: "ERROR", message: "Test object is missing." });

      var tSheet = ss.getSheetByName(SHEET_NAMES.MASTER_TESTS);
      if (tSheet) {
        var tRowIndex = findRowIndexByColumnValue(tSheet, 1, singleTest.id);
        if (tRowIndex > 0) {
          tSheet.getRange(tRowIndex, 7).setValue(singleTest.price);
          tSheet.getRange(tRowIndex, 8).setValue(singleTest.b2bPrice || Math.round(singleTest.price * 0.18));
          tSheet.getRange(tRowIndex, 11).setValue(new Date().toISOString());
        }
      }

      return createJsonResponse({
        status: "SUCCESS",
        message: "Updated price for test: " + singleTest.name
      });
    }

    // 6. SYNC REFERRAL DOCTOR & APPROVE DOCTOR
    if (action === "SYNC_REFERRAL" || action === "ADD_DOCTOR" || action === "APPROVE_DOCTOR" || action === "UPDATE_DOCTOR") {
      var doc = payload.doctor;
      if (!doc && payload.doctorId) {
        doc = { id: payload.doctorId, status: "APPROVED" };
      }
      if (!doc) return createJsonResponse({ status: "ERROR", message: "Doctor object is missing." });
      if (action === "APPROVE_DOCTOR") {
        doc.status = "APPROVED";
      }
      upsertDoctorRecord(ss, doc);
      return createJsonResponse({
        status: "SUCCESS",
        message: "Doctor " + (doc.name || doc.id) + " synchronized and approved in master roster."
      });
    }

    // 7. SCHEDULE APPOINTMENT
    if (action === "SCHEDULE_APPOINTMENT" || action === "SYNC_APPOINTMENT") {
      var apt = payload.appointment;
      if (!apt) return createJsonResponse({ status: "ERROR", message: "Appointment object is missing." });
      upsertAppointmentRecord(ss, apt);
      return createJsonResponse({
        status: "SUCCESS",
        message: "Appointment #" + apt.id + " recorded for " + apt.patientName
      });
    }

    // 8. SYNC PATIENT
    if (action === "SYNC_PATIENT" || action === "ADD_PATIENT") {
      var pat = payload.patient;
      if (!pat) return createJsonResponse({ status: "ERROR", message: "Patient object is missing." });
      upsertPatientRecord(ss, pat);
      return createJsonResponse({
        status: "SUCCESS",
        message: "Patient " + pat.name + " (" + pat.id + ") recorded in Patients_Master."
      });
    }

    // 9. SYNC STAFF MEMBER
    if (action === "SYNC_STAFF" || action === "ADD_STAFF") {
      var staffMember = payload.staff;
      if (!staffMember) return createJsonResponse({ status: "ERROR", message: "Staff object is missing." });
      upsertStaffRecord(ss, staffMember);
      return createJsonResponse({
        status: "SUCCESS",
        message: "Staff employee " + staffMember.name + " synchronized in Staff_Employees_Master."
      });
    }

    // 10. SYNC DOCTOR ROSTER
    if (action === "SYNC_DOCTOR_ROSTER" || action === "ADD_ROSTER_DOCTOR") {
      var rosDoc = payload.rosterDoctor || payload.doctor;
      if (!rosDoc) return createJsonResponse({ status: "ERROR", message: "Doctor roster object is missing." });
      upsertRosterDoctorRecord(ss, rosDoc);
      return createJsonResponse({
        status: "SUCCESS",
        message: "Doctor " + rosDoc.name + " synchronized in Doctor_Roster_Master."
      });
    }

    // 11. FULL MULTI-CENTER BACKUP & SYNC ALL DATA
    if (action === "FULL_BACKUP" || action === "SYNC_ALL_DATA") {
      var bOrders = payload.orders || [];
      var bExpenses = payload.expenses || [];
      var bPatients = payload.patients || [];
      var bDoctors = payload.referrers || payload.doctors || [];
      var bAppointments = payload.appointments || [];
      var bStaff = payload.staffList || payload.staff || [];
      var bRoster = payload.doctorRoster || [];

      // Sync all orders
      for (var bi = 0; bi < bOrders.length; bi++) {
        var bOrd = bOrders[bi];
        var bCenter = bOrd.centerCode || "ATL_MAIN";
        var bSheet = getOrCreateSheet(ss, "Orders_" + bCenter.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase(), getOrdersHeader());
        var bHeaders = bSheet.getRange(1, 1, 1, Math.max(bSheet.getLastColumn(), 1)).getValues()[0];
        if (!bHeaders || bHeaders.length === 0 || !bHeaders[0]) {
          bHeaders = getOrdersHeader();
          bSheet.appendRow(bHeaders);
          styleHeaderRow(bSheet, "#0369a1");
        }

        var bUhid = bOrd.patientId || (bOrd.patient ? (bOrd.patient.uhid || bOrd.patient.id) : "");
        var bName = bOrd.patient ? (bOrd.patient.name || "") : (bOrd.patientName || "");
        var bExisting = findOrderRowIndex(bSheet, bOrd.id, bOrd.invoiceNumber, bUhid, bName);
        var bRow = buildOrderRowFromHeaders(bHeaders, bOrd);

        if (bExisting > 0) {
          bSheet.getRange(bExisting, 1, 1, bRow.length).setValues([bRow]);
        } else {
          bSheet.appendRow(bRow);
        }
      }

      // Sync all expenses
      for (var ei = 0; ei < bExpenses.length; ei++) {
        upsertExpenseRecord(ss, bExpenses[ei]);
      }

      // Sync all patients
      for (var pi = 0; pi < bPatients.length; pi++) {
        upsertPatientRecord(ss, bPatients[pi]);
      }

      // Sync all referring doctors
      for (var di = 0; di < bDoctors.length; di++) {
        upsertDoctorRecord(ss, bDoctors[di]);
      }

      // Sync all appointments
      for (var ai = 0; ai < bAppointments.length; ai++) {
        upsertAppointmentRecord(ss, bAppointments[ai]);
      }

      // Sync all staff members
      for (var si = 0; si < bStaff.length; si++) {
        upsertStaffRecord(ss, bStaff[si]);
      }

      // Sync doctor roster
      for (var ri = 0; ri < bRoster.length; ri++) {
        upsertRosterDoctorRecord(ss, bRoster[ri]);
      }

      // Purge tombstones (deleted items across all devices)
      var dOrders = payload.deletedOrderIds || [];
      if (dOrders.length > 0) {
        var allSheets = ss.getSheets();
        for (var sIdx = 0; sIdx < allSheets.length; sIdx++) {
          var oSheet = allSheets[sIdx];
          if (oSheet.getName().indexOf("Orders_") === 0) {
            for (var doi = 0; doi < dOrders.length; doi++) {
              deleteRowByColumnValue(oSheet, 1, dOrders[doi]);
              deleteRowByColumnValue(oSheet, 2, dOrders[doi]);
            }
          }
        }
      }

      var dPatients = payload.deletedPatientIds || [];
      if (dPatients.length > 0) {
        var patS = ss.getSheetByName(SHEET_NAMES.PATIENTS);
        if (patS) {
          for (var dpi = 0; dpi < dPatients.length; dpi++) {
            deleteRowByColumnValue(patS, 1, dPatients[dpi]);
          }
        }
      }

      var dExpenses = payload.deletedExpenseIds || [];
      if (dExpenses.length > 0) {
        var expS = ss.getSheetByName(SHEET_NAMES.EXPENSES);
        if (expS) {
          for (var dei = 0; dei < dExpenses.length; dei++) {
            deleteRowByColumnValue(expS, 1, dExpenses[dei]);
          }
        }
      }

      var dAppointments = payload.deletedAppointmentIds || [];
      if (dAppointments.length > 0) {
        var aptS = ss.getSheetByName(SHEET_NAMES.APPOINTMENTS);
        if (aptS) {
          for (var dai = 0; dai < dAppointments.length; dai++) {
            deleteRowByColumnValue(aptS, 1, dAppointments[dai]);
          }
        }
      }

      var dStaff = payload.deletedStaffIds || [];
      if (dStaff.length > 0) {
        var stfS = ss.getSheetByName(SHEET_NAMES.STAFF);
        if (stfS) {
          for (var dsi = 0; dsi < dStaff.length; dsi++) {
            deleteRowByColumnValue(stfS, 1, dStaff[dsi]);
          }
        }
      }

      var dRoster = payload.deletedDoctorRosterIds || [];
      if (dRoster.length > 0) {
        var rosS = ss.getSheetByName(SHEET_NAMES.DOCTOR_ROSTER);
        if (rosS) {
          for (var dri = 0; dri < dRoster.length; dri++) {
            deleteRowByColumnValue(rosS, 1, dRoster[dri]);
          }
        }
      }

      var dDoctors = payload.deletedDoctorIds || [];
      if (dDoctors.length > 0) {
        var refS = ss.getSheetByName(SHEET_NAMES.DOCTORS);
        if (refS) {
          for (var ddi = 0; ddi < dDoctors.length; ddi++) {
            deleteRowByColumnValue(refS, 1, dDoctors[ddi]);
          }
        }
      }

      // Purge any duplicates from sheets right after full backup
      try {
        purgeDuplicateOrdersFromAllSheets(ss);
      } catch(e) {}

      return createJsonResponse({
        status: "SUCCESS",
        message: "Full synchronization completed: " + bOrders.length + " orders, " + bPatients.length + " patients, " + bExpenses.length + " expenses, " + bDoctors.length + " doctors, " + bStaff.length + " staff, " + bRoster.length + " roster doctors."
      });
    }

    // 12. DELETE ORDER
    if (action === "DELETE_ORDER") {
      var delOrdId = payload.orderId;
      var delInv = payload.invoiceNumber;
      var sheets = ss.getSheets();
      for (var si = 0; si < sheets.length; si++) {
        if (sheets[si].getName().indexOf("Orders_") === 0) {
          if (delOrdId) deleteRowAnyColumn(sheets[si], delOrdId);
          if (delInv) deleteRowAnyColumn(sheets[si], delInv);
        }
      }
      return createJsonResponse({ status: "SUCCESS", message: "Deleted order " + (delInv || delOrdId) });
    }

    // 13. DELETE PATIENT
    if (action === "DELETE_PATIENT") {
      var delPatId = payload.patientId;
      var pSheet = ss.getSheetByName(SHEET_NAMES.PATIENTS);
      if (pSheet && delPatId) {
        deleteRowAnyColumn(pSheet, delPatId);
      }
      var oSheets = ss.getSheets();
      for (var oi = 0; oi < oSheets.length; oi++) {
        if (oSheets[oi].getName().indexOf("Orders_") === 0) {
          deleteRowAnyColumn(oSheets[oi], delPatId);
        }
      }
      return createJsonResponse({ status: "SUCCESS", message: "Deleted patient " + delPatId });
    }

    // 14. DELETE EXPENSE
    if (action === "DELETE_EXPENSE") {
      var delExpId = payload.expenseId;
      var expSheet = ss.getSheetByName(SHEET_NAMES.EXPENSES);
      if (expSheet && delExpId) {
        deleteRowAnyColumn(expSheet, delExpId);
      }
      return createJsonResponse({ status: "SUCCESS", message: "Deleted expense " + delExpId });
    }

    // 15. DELETE APPOINTMENT
    if (action === "DELETE_APPOINTMENT") {
      var delAptId = payload.appointmentId;
      var aptSheet = ss.getSheetByName(SHEET_NAMES.APPOINTMENTS);
      if (aptSheet && delAptId) {
        deleteRowAnyColumn(aptSheet, delAptId);
      }
      return createJsonResponse({ status: "SUCCESS", message: "Deleted appointment " + delAptId });
    }

    // 16. DELETE STAFF
    if (action === "DELETE_STAFF") {
      var delStaffId = payload.staffId;
      var staffSheet = ss.getSheetByName(SHEET_NAMES.STAFF);
      if (staffSheet && delStaffId) {
        deleteRowAnyColumn(staffSheet, delStaffId);
      }
      return createJsonResponse({ status: "SUCCESS", message: "Deleted staff member " + delStaffId });
    }

    // 17. DELETE DOCTOR ROSTER
    if (action === "DELETE_DOCTOR_ROSTER" || action === "DELETE_ROSTER_DOCTOR") {
      var delDocId = payload.doctorId || payload.rosterDoctorId;
      var rosterSheet = ss.getSheetByName(SHEET_NAMES.DOCTOR_ROSTER);
      if (rosterSheet && delDocId) {
        deleteRowAnyColumn(rosterSheet, delDocId);
      }
      return createJsonResponse({ status: "SUCCESS", message: "Deleted roster doctor " + delDocId });
    }

    // 18. DELETE REFERRING DOCTOR
    if (action === "DELETE_REFERRAL" || action === "DELETE_DOCTOR") {
      var delRefId = payload.doctorId;
      var docSheet = ss.getSheetByName(SHEET_NAMES.DOCTORS);
      if (docSheet && delRefId) {
        deleteRowAnyColumn(docSheet, delRefId);
      }
      return createJsonResponse({ status: "SUCCESS", message: "Deleted referring doctor " + delRefId });
    }

    // 19. CLEAR ALL DATA EXCEPT TEST CATALOG (KEEPS ALL 1,170 TESTS AND CLINICAL FORMATS)
    if (action === "CLEAR_ALL_DATA_EXCEPT_TESTS" || action === "PURGE_ALL_ORDERS_AND_PATIENTS") {
      var allSh = ss.getSheets();
      for (var si = 0; si < allSh.length; si++) {
        var shName = allSh[si].getName();
        if (shName.indexOf("Orders_") === 0) {
          var lr = allSh[si].getLastRow();
          if (lr > 1) allSh[si].deleteRows(2, lr - 1);
        }
      }
      var patSh = ss.getSheetByName(SHEET_NAMES.PATIENTS);
      if (patSh && patSh.getLastRow() > 1) patSh.deleteRows(2, patSh.getLastRow() - 1);

      var expSh = ss.getSheetByName(SHEET_NAMES.EXPENSES);
      if (expSh && expSh.getLastRow() > 1) expSh.deleteRows(2, expSh.getLastRow() - 1);

      var aptSh = ss.getSheetByName(SHEET_NAMES.APPOINTMENTS);
      if (aptSh && aptSh.getLastRow() > 1) aptSh.deleteRows(2, aptSh.getLastRow() - 1);

      // Clean Staff to only standard 4 authorized staff members
      var stfSh = ss.getSheetByName(SHEET_NAMES.STAFF);
      if (stfSh) {
        var staffArr = [
          { id: "emp-superadmin", name: "Mohsina Akhtar", role: "Super Admin", assignedCenterId: "ALL", shift: "All Hours (24/7)", monthlySalary: 0, username: "admin", password: "admin@123", phone: "9876543210", email: "admin@atlas.com", status: "Active", shiftStartTime: "09:00", shiftEndTime: "21:00", permissions: { canCreateInvoices: true, canCollectPayments: true, canProcessRefunds: true, canEditCatalog: true, canViewMISReports: true, canManageStaff: true, canManageReferrals: true, canAccessAppointments: true, canAuthorizeReports: true } },
          { id: "emp-tashmiya", name: "Tashmiya", role: "Receptionist", assignedCenterId: "cnt-01", shift: "Morning (8:00 AM - 4:00 PM)", monthlySalary: 16000, username: "TASHI", password: "Atlas@123", phone: "9455910933", email: "tashmiya@atlas.com", status: "Active", shiftStartTime: "08:00", shiftEndTime: "16:00", permissions: { canCreateInvoices: true, canCollectPayments: true, canAccessAppointments: true } },
          { id: "emp-rahul", name: "Rahul Patel", role: "Center Manager", assignedCenterId: "cnt-01", shift: "Custom (10:00 AM - 10:00 PM)", monthlySalary: 12000, username: "MANGE2", password: "Atlas@123", phone: "7000413530", email: "rahul@atlas.com", status: "Active", shiftStartTime: "10:00", shiftEndTime: "22:00", permissions: { canCreateInvoices: true, canCollectPayments: true, canProcessRefunds: true, canEditCatalog: true, canViewMISReports: true, canManageStaff: true, canManageReferrals: true, canAccessAppointments: true } },
          { id: "emp-khushi", name: "Khushi Singh", role: "Lab Technician", assignedCenterId: "cnt-01", shift: "Custom (10:00 AM - 08:30 PM)", monthlySalary: 20000, username: "KHUSHI-TECH3", password: "Atlas@123", phone: "9111229044", email: "khushi@atlas.com", status: "Active", shiftStartTime: "10:00", shiftEndTime: "20:30", permissions: { canAuthorizeReports: true } }
        ];
        for (var st = 0; st < staffArr.length; st++) {
          upsertStaffRecord(ss, staffArr[st]);
        }
      }

      return createJsonResponse({
        status: "SUCCESS",
        message: "Successfully cleared all patient data, orders, and expenses. Master Test Catalog (1,170 tests) retained completely intact and staff reset to 4 authorized accounts."
      });
    }

    // 19B. REPAIR DISCOUNT REASON COLUMN SHIFT ACROSS ALL CENTER SHEETS
    if (action === "ALIGN_DISCOUNT_REASON_COLUMNS" || action === "REPAIR_DISCOUNT_REASON_SHIFT") {
      var allSh = ss.getSheets();
      var repairedCount = 0;
      for (var s = 0; s < allSh.length; s++) {
        var sh = allSh[s];
        if (sh.getName().indexOf("Orders_") === 0) {
          var sData = sh.getDataRange().getValues();
          if (sData.length <= 1) continue;
          var sHeaders = sData[0];
          var discReasonCol = -1;
          for (var hc = 0; hc < sHeaders.length; hc++) {
            var hName = String(sHeaders[hc] || "").toLowerCase().trim();
            if (hName.indexOf("discount reason") >= 0 || hName.indexOf("discount note") >= 0) {
              discReasonCol = hc;
              break;
            }
          }
          if (discReasonCol >= 0) {
            for (var r = 1; r < sData.length; r++) {
              var sRow = sData[r];
              var valAtDiscReason = String(sRow[discReasonCol] || "").trim();
              var valAtDoctor = sRow[discReasonCol + 1];
              // Detect if Doctor name is shifted into Discount Reason and Subtotal (a number) is in Referring Doctor!
              var isDoctorInDiscReason = (
                valAtDiscReason.match(/^(DR\.|DOCTOR|NEW PAL|HOSPITAL|CLINIC)/i) ||
                (typeof valAtDoctor === "number" || (!isNaN(parseFloat(valAtDoctor)) && parseFloat(valAtDoctor) > 0))
              );
              if (isDoctorInDiscReason && (typeof valAtDoctor === "number" || !isNaN(parseFloat(valAtDoctor)))) {
                // Shift columns from discReasonCol to the right by 1 column
                var newRow = sRow.slice(0, discReasonCol);
                newRow.push(""); // Discount Reason becomes blank
                for (var sc = discReasonCol; sc < sRow.length - 1; sc++) {
                  newRow.push(sRow[sc]);
                }
                sh.getRange(r + 1, 1, 1, newRow.length).setValues([newRow]);
                repairedCount++;
              }
            }
          }
        }
      }
      return createJsonResponse({
        status: "SUCCESS",
        message: "Repaired " + repairedCount + " shifted order rows by restoring Discount Reason column alignment."
      });
    }

    // 19C. RESTORE CLEAN ORDERS FROM MASTER EXCEL / BACKUP
    if (action === "RESTORE_MASTER_ORDERS" || action === "OVERWRITE_ORDERS_MAIN") {
      var targetCenter = payload.centerCode || "ATL_MAIN";
      var sName = "Orders_" + targetCenter.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();
      var sh = ss.getSheetByName(sName);
      if (!sh) sh = getOrCreateSheet(ss, sName, getOrdersHeader());
      var rawRows = payload.rows || [];
      if (rawRows.length > 0) {
        var existingLastRow = sh.getLastRow();
        if (existingLastRow > 1) {
          sh.deleteRows(2, existingLastRow - 1);
        }
        sh.getRange(2, 1, rawRows.length, rawRows[0].length).setValues(rawRows);
        return createJsonResponse({
          status: "SUCCESS",
          message: "Successfully restored " + rawRows.length + " clean order rows into [" + sName + "]."
        });
      }
      return createJsonResponse({ status: "ERROR", message: "No rows provided to restore." });
    }

    // 20. REPAIR SHIFTED ORDER COLUMNS ACROSS ALL BRANCHES
    if (action === "REPAIR_ORDER_COLUMNS" || action === "FIX_SHIFTED_COLUMNS") {
      var allSh = ss.getSheets();
      var repairedCount = 0;
      for (var s = 0; s < allSh.length; s++) {
        var sh = allSh[s];
        if (sh.getName().indexOf("Orders_") === 0) {
          var sData = sh.getDataRange().getValues();
          if (sData.length <= 1) continue;
          var sHeaders = sData[0];
          for (var r = 1; r < sData.length; r++) {
            var sRow = sData[r];
            var isShifted = (
              String(sRow[1] || "").match(/^(CK|ATLS|INV|\d{10})/i) &&
              String(sRow[2] || "").indexOf("202") >= 0 &&
              String(sRow[2] || "").indexOf("T") >= 0
            );
            if (isShifted) {
              var repOrd = {
                id: String(sRow[0] || ("ATL-ORD-" + sRow[1])),
                invoiceNumber: String(sRow[1] || ""),
                createdAt: String(sRow[2] || ""),
                patientId: String(sRow[3] || ""),
                patient: {
                  id: String(sRow[3] || ""),
                  name: String(sRow[4] || ""),
                  age: Number(sRow[5]) || 0,
                  gender: String(sRow[6] || ""),
                  phone: String(sRow[7] || "")
                },
                tests: [{ id: "t-01", name: String(sRow[8] || "Diagnostic Test"), price: Number(sRow[9]) || 0 }],
                subtotal: Number(sRow[9]) || 0,
                discountAmount: Number(sRow[10]) || 0,
                totalAmount: Number(sRow[11]) || 0,
                paidAmount: Number(sRow[12]) || 0,
                dueAmount: Number(sRow[13]) || 0,
                paymentMode: String(sRow[14] || "Cash"),
                status: String(sRow[15] || "ORDER_PLACED"),
                referringDoctorName: String(sRow[16] || "Direct Walk-in"),
                commissionBeneficiaryName: String(sRow[17] || "Direct Walk-in"),
                createdByStaffName: String(sRow[18] || "Reception Desk"),
                barcode: String(sRow[19] || ("ATL-BAR-" + sRow[1]))
              };
              var repRow = buildOrderRowFromHeaders(sHeaders, repOrd);
              sh.getRange(r + 1, 1, 1, repRow.length).setValues([repRow]);
              repairedCount++;
            }
          }
        }
      }
      return createJsonResponse({
        status: "SUCCESS",
        message: "Repaired " + repairedCount + " shifted order rows across all center sheets."
      });
    }

    // 21. REPAIR DUPLICATE ORDER INVOICE NUMBERS ACROSS ALL BRANCHES
    if (action === "REPAIR_ORDER_SEQUENCES" || action === "REPAIR_DUPLICATE_INVOICES") {
      var allSh = ss.getSheets();
      var repairedSeqCount = 0;
      for (var s = 0; s < allSh.length; s++) {
        var sh = allSh[s];
        if (sh.getName().indexOf("Orders_") === 0) {
          var sData = sh.getDataRange().getValues();
          if (sData.length <= 1) continue;
          var sHeaders = sData[0];
          var colInvIdx = -1;
          var colIdIdx = -1;
          var colBarIdx = -1;
          for (var hc = 0; hc < sHeaders.length; hc++) {
            var hName = String(sHeaders[hc] || "").toLowerCase().trim();
            if (hName.indexOf("invoice") >= 0 || hName === "inv" || hName.indexOf("bill no") >= 0) colInvIdx = hc;
            if (hName.indexOf("order id") >= 0 || hName === "order #") colIdIdx = hc;
            if (hName.indexOf("barcode") >= 0) colBarIdx = hc;
          }
          if (colInvIdx >= 0) {
            var seenInvoices = {};
            var maxSeq = 0;
            // Find max existing sequence
            for (var r = 1; r < sData.length; r++) {
              var currInv = String(sData[r][colInvIdx] || "").trim();
              var seqMatch = currInv.match(/\.(\d+)$/);
              if (seqMatch) {
                var sn = parseInt(seqMatch[1], 10);
                if (!isNaN(sn) && sn > maxSeq) maxSeq = sn;
              }
            }
            // Now detect duplicates and resequence
            for (var r = 1; r < sData.length; r++) {
              var currInv = String(sData[r][colInvIdx] || "").trim();
              var invKey = currInv.toLowerCase();
              if (seenInvoices[invKey]) {
                maxSeq++;
                var datePrefix = "ATLS" + new Date().toISOString().slice(2, 10).replace(/-/g, "") + ".";
                if (currInv.match(/^[A-Z0-9]+\.\d+$/i)) {
                  datePrefix = currInv.split(".")[0] + ".";
                }
                var newInv = datePrefix + ("00000" + maxSeq).slice(-5);
                sh.getRange(r + 1, colInvIdx + 1).setValue(newInv);
                if (colIdIdx >= 0) sh.getRange(r + 1, colIdIdx + 1).setValue("ATL-ORD-" + newInv);
                if (colBarIdx >= 0) sh.getRange(r + 1, colBarIdx + 1).setValue("ATL-BAR-" + newInv);
                repairedSeqCount++;
              } else {
                seenInvoices[invKey] = true;
              }
            }
          }
        }
      }
      return createJsonResponse({
        status: "SUCCESS",
        message: "Repaired and resequenced " + repairedSeqCount + " colliding order invoices across all center sheets."
      });
    }

    // 22. PURGE DUPLICATE ORDERS ACROSS ALL BRANCHES IN GOOGLE SHEETS
    if (action === "PURGE_DUPLICATE_ORDERS" || action === "PURGE_DUPLICATES" || action === "DEDUPLICATE_SHEETS") {
      var purgeRes = purgeDuplicateOrdersFromAllSheets(ss);
      return createJsonResponse({
        status: "SUCCESS",
        purgedCount: purgeRes.purged,
        remainingCount: purgeRes.remaining,
        message: "Successfully purged " + purgeRes.purged + " duplicate entries from Google Sheets. Total clean unique orders remaining: " + purgeRes.remaining
      });
    }

    // 23. SEPARATE DOCTOR AND BENEFICIARY ENTITIES IN ORDERS SHEETS
    if (action === "SEPARATE_DOCTOR_AND_BENEFICIARY" || action === "CLEAN_BENEFICIARY_FROM_DOCTOR") {
      var sheetsList = ss.getSheets();
      var totalCleaned = 0;
      for (var sIdx = 0; sIdx < sheetsList.length; sIdx++) {
        var curSh = sheetsList[sIdx];
        var shName = curSh.getName();
        if (shName.indexOf("Orders_") === 0) {
          var sheetData = curSh.getDataRange().getValues();
          if (sheetData.length <= 1) continue;
          var headerList = sheetData[0].map(function(h) { return String(h || "").toLowerCase().trim(); });
          var docCol = -1;
          var benCol = -1;
          for (var cIdx = 0; cIdx < headerList.length; cIdx++) {
            var head = headerList[cIdx];
            if (head.indexOf("doctor") >= 0 || head.indexOf("referr") >= 0) docCol = cIdx;
            else if (head.indexOf("beneficiary") >= 0) benCol = cIdx;
          }

          if (docCol >= 0) {
            for (var rowIdx = 1; rowIdx < sheetData.length; rowIdx++) {
              var rawDocVal = String(sheetData[rowIdx][docCol] || "").trim();
              if (rawDocVal.indexOf(" | Ben: ") >= 0) {
                var splitParts = rawDocVal.split(" | Ben: ");
                var cleanDocName = splitParts[0].trim();
                var extractedBen = (splitParts[1] || "").trim();

                curSh.getRange(rowIdx + 1, docCol + 1).setValue(cleanDocName);
                if (benCol >= 0 && extractedBen && extractedBen !== "0") {
                  curSh.getRange(rowIdx + 1, benCol + 1).setValue(extractedBen);
                }
                totalCleaned++;
              }
            }
          }
        }
      }
      return createJsonResponse({
        status: "SUCCESS",
        cleanedCount: totalCleaned,
        message: "Successfully separated doctor and beneficiary across " + totalCleaned + " order entries in Google Sheets."
      });
    }

    return createJsonResponse({
      status: "SUCCESS",
      message: "Action [" + action + "] acknowledged."
    });

  } catch (err) {
    return createJsonResponse({ status: "ERROR", message: err.toString(), stack: err.stack });
  } finally {
    lock.releaseLock();
  }
}

// ==========================================
// 4. DATABASE INITIALIZATION & SCHEMA SETUP
// ==========================================

function initializeAllAtlasSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Master Test Catalog
  var testS = getOrCreateSheet(ss, SHEET_NAMES.MASTER_TESTS, getTestsHeader());
  styleHeaderRow(testS, "#0284c7");

  // 2. Orders Sheets for Branches
  var mainS = getOrCreateSheet(ss, SHEET_NAMES.ORDERS_MAIN, getOrdersHeader());
  styleHeaderRow(mainS, "#0369a1");

  var metroS = getOrCreateSheet(ss, SHEET_NAMES.ORDERS_METRO, getOrdersHeader());
  styleHeaderRow(metroS, "#0369a1");

  var westS = getOrCreateSheet(ss, SHEET_NAMES.ORDERS_WEST, getOrdersHeader());
  styleHeaderRow(westS, "#0369a1");

  // 3. Patients Master
  var patS = getOrCreateSheet(ss, SHEET_NAMES.PATIENTS, getPatientsHeader());
  styleHeaderRow(patS, "#4338ca");

  // 4. Referring Doctors Master
  var docS = getOrCreateSheet(ss, SHEET_NAMES.DOCTORS, getDoctorsHeader());
  styleHeaderRow(docS, "#059669");

  // 5. Operating Expenses
  var expS = getOrCreateSheet(ss, SHEET_NAMES.EXPENSES, getExpensesHeader());
  styleHeaderRow(expS, "#d97706");

  // 6. Appointments Master
  var aptS = getOrCreateSheet(ss, SHEET_NAMES.APPOINTMENTS, getAppointmentsHeader());
  styleHeaderRow(aptS, "#7c3aed");

  // 7. Staff Employees Master
  var staffS = getOrCreateSheet(ss, SHEET_NAMES.STAFF, getStaffHeader());
  styleHeaderRow(staffS, "#0f766e");

  // 8. Doctor Duty Roster Master
  var rosterS = getOrCreateSheet(ss, SHEET_NAMES.DOCTOR_ROSTER, getDoctorRosterHeader());
  styleHeaderRow(rosterS, "#6366f1");

  // 9. Staff Attendance Logs
  var attS = getOrCreateSheet(ss, SHEET_NAMES.ATTENDANCE, getAttendanceHeader());
  styleHeaderRow(attS, "#0f766e");

  // 10. Audit Logs
  var auditS = getOrCreateSheet(ss, SHEET_NAMES.AUDIT_LOGS, getAuditHeader());
  styleHeaderRow(auditS, "#475569");

  // Remove default "Sheet1" if empty
  var defSheet = ss.getSheetByName("Sheet1");
  if (defSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defSheet); } catch(e) {}
  }
}

// ==========================================
// 5. SCHEMA HEADERS
// ==========================================

function getTestsHeader() {
  return ["Test ID", "Test / Investigation Name", "Category", "Department", "Sample Type", "TAT (Hours)", "MRP Price (₹)", "B2B Rate (₹)", "Fasting Required", "Sub-Section", "Last Synced At"];
}

function getOrdersHeader() {
  return [
    "Invoice No",
    "Date & Time",
    "UHID",
    "Patient Name",
    "Age/Gender",
    "Phone",
    "Tests Ordered",
    "Discount Reason",
    "Referring Doctor",
    "Subtotal (₹)",
    "Discount (₹)",
    "Net Total (₹)",
    "Paid (₹)",
    "Due Balance (₹)",
    "Payment Mode",
    "Status",
    "Commission Beneficiary",
    "Billed By",
    "Barcode",
    "Intake Remark",
    "Sync Timestamp"
  ];
}

function getPatientsHeader() {
  return ["UHID", "Patient Full Name", "Age", "Gender", "Mobile / WhatsApp", "Email Address", "Residential Address", "ABDM / ABHA ID", "Registration Date"];
}

function getDoctorsHeader() {
  return ["Doctor ID", "Doctor Name", "Degree / Qualification", "Specialty / Department", "Hospital / Clinic Name", "Registration No", "Phone", "Email", "Commission (%)", "Affiliation Type", "Organization Name", "Status", "Total Referrals", "Revenue Generated (₹)", "Commission Earned (₹)", "Payout Paid (₹)", "Last Updated"];
}

function getExpensesHeader() {
  return ["Expense ID", "Voucher #", "Date", "Category", "Expense Title", "Amount (₹)", "Payment Mode", "Center Code", "Recorded By", "Notes", "Recorded At"];
}

function getAppointmentsHeader() {
  return ["Appointment ID", "Patient Name", "Phone", "Email", "Age", "Gender", "Date", "Time Slot", "Requested Tests", "Referring Doctor", "Center ID", "Status", "Notes", "Scheduled At"];
}

function getStaffHeader() {
  return [
    "Staff ID", 
    "Employee Name", 
    "Role", 
    "Assigned Center", 
    "Shift", 
    "Monthly Salary (₹)", 
    "Username", 
    "Password", 
    "Phone", 
    "Email", 
    "Status", 
    "Shift Start", 
    "Shift End", 
    "Permissions", 
    "Last Updated"
  ];
}

function ensureStaffHeaders(sheet) {
  if (!sheet) return;
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) {
    sheet.appendRow(getStaffHeader());
    styleHeaderRow(sheet, "#0369a1");
    return;
  }
  var headers = sheet.getRange(1, 1, 1, Math.max(lastCol, 1)).getValues()[0];
  var headerLower = headers.map(function(h) { return String(h || "").toLowerCase().trim(); });

  if (headerLower.indexOf("password") === -1 && headerLower.indexOf("pass") === -1 && headerLower.indexOf("pwd") === -1) {
    sheet.getRange(1, lastCol + 1).setValue("Password");
    lastCol++;
  }
  if (headerLower.indexOf("permissions") === -1) {
    sheet.getRange(1, lastCol + 1).setValue("Permissions");
    lastCol++;
  }
  if (headerLower.indexOf("last updated") === -1 && headerLower.indexOf("updated") === -1) {
    sheet.getRange(1, lastCol + 1).setValue("Last Updated");
    lastCol++;
  }
}

function getDoctorRosterHeader() {
  return ["Doctor ID", "Doctor Name", "Qualification", "Specialty / Department", "Center ID", "Phone", "Email", "Reg No", "Role Type", "Shift Timing", "Working Days", "Duty Status", "Room No", "Emergency Available", "Notes", "Last Updated"];
}

function getAttendanceHeader() {
  return ["Log ID", "Staff ID", "Employee Name", "Designation", "Center Code", "Login Timestamp", "Logout Timestamp", "Duration (Minutes)", "Status"];
}

function getAuditHeader() {
  return ["Log ID", "Timestamp", "Action Type", "Actor Name", "Actor Role", "Center Code", "Details"];
}

// ==========================================
// 6. HELPER FUNCTIONS & DATA ACCESS
// ==========================================

function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers && headers.length > 0) {
      sheet.appendRow(headers);
    }
  }
  return sheet;
}

function styleHeaderRow(sheet, bgColor) {
  var lastCol = sheet.getLastColumn() || 1;
  var headerRange = sheet.getRange(1, 1, 1, lastCol);
  headerRange.setBackground(bgColor);
  headerRange.setFontColor("#ffffff");
  headerRange.setFontWeight("bold");
  headerRange.setFontSize(10);
  headerRange.setWrap(true);
  sheet.setFrozenRows(1);
}

function findRowIndexByColumnValue(sheet, colIndex, valueToFind) {
  if (!valueToFind) return -1;
  var data = sheet.getDataRange().getValues();
  var strFind = String(valueToFind).trim().toLowerCase();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][colIndex - 1]).trim().toLowerCase() === strFind) {
      return i + 1;
    }
  }
  return -1;
}

function deleteRowByColumnValue(sheet, colIndex, valueToFind) {
  if (!sheet || !valueToFind) return false;
  var strFind = String(valueToFind).trim().toLowerCase();
  var data = sheet.getDataRange().getValues();
  var deleted = false;
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][colIndex - 1]).trim().toLowerCase() === strFind) {
      sheet.deleteRow(i + 1);
      deleted = true;
    }
  }
  return deleted;
}

function deleteRowAnyColumn(sheet, valueToFind) {
  if (!sheet || !valueToFind) return false;
  var strFind = String(valueToFind).trim().toLowerCase();
  var data = sheet.getDataRange().getValues();
  var deleted = false;
  for (var i = data.length - 1; i >= 1; i--) {
    var row = data[i];
    for (var c = 0; c < row.length; c++) {
      var cellVal = String(row[c] || "").trim().toLowerCase();
      if (cellVal === strFind || cellVal === ("atl-ord-" + strFind) || cellVal === ("atl-bar-" + strFind)) {
        sheet.deleteRow(i + 1);
        deleted = true;
        break;
      }
    }
  }
  return deleted;
}

function buildOrderRowFromHeaders(headers, ord) {
  var row = [];
  var testsSummary = (ord.tests || []).map(function(t) { return t.name; }).join(", ");
  var pAge = ord.patient ? (ord.patient.age !== undefined ? ord.patient.age : "") : (ord.age !== undefined ? ord.age : "");
  var pGender = ord.patient ? (ord.patient.gender || "") : (ord.gender || "");
  var pName = ord.patient ? (ord.patient.name || "") : (ord.patientName || "");
  var pUhid = ord.patientId || (ord.patient ? (ord.patient.uhid || ord.patient.id) : "") || "";
  var pPhone = ord.patient ? (ord.patient.phone || "") : (ord.phone || "");

  for (var c = 0; c < headers.length; c++) {
    var h = String(headers[c] || "").toLowerCase().trim();
    if (!h) {
      row.push("");
      continue;
    }

    if (h.indexOf("invoice") >= 0 || h === "inv" || h.indexOf("bill no") >= 0 || h.indexOf("bill #") >= 0) {
      row.push(ord.invoiceNumber || ord.id || "");
    } else if (h.indexOf("order id") >= 0 || h === "order #" || h === "ord id") {
      row.push(ord.id || ord.invoiceNumber || "");
    } else if (h.indexOf("date") >= 0 || h.indexOf("time") >= 0) {
      row.push(ord.createdAt || new Date().toISOString());
    } else if (h.indexOf("uhid") >= 0 || h.indexOf("patient id") >= 0 || h === "pid") {
      row.push(pUhid);
    } else if (h.indexOf("age/gender") >= 0 || h.indexOf("age / gender") >= 0 || h.indexOf("age & gender") >= 0 || h === "age/sex") {
      var agCombined = "";
      if (pAge !== "" && pGender) agCombined = pAge + "Y / " + pGender;
      else if (pAge !== "") agCombined = pAge + "Y";
      else if (pGender) agCombined = pGender;
      row.push(agCombined);
    } else if (h === "age") {
      row.push(pAge !== "" ? pAge : "");
    } else if (h === "gender" || h === "sex") {
      row.push(pGender || "");
    } else if (h.indexOf("patient name") >= 0 || h === "patient" || h === "name" || h === "client" || h === "patient_name") {
      row.push(pName || "");
    } else if (h.indexOf("phone") >= 0 || h.indexOf("mobile") >= 0 || h.indexOf("contact") >= 0 || h.indexOf("whatsapp") >= 0) {
      row.push(pPhone || "");
    } else if (h.indexOf("test") >= 0 || h.indexOf("investigation") >= 0) {
      row.push(testsSummary || "Diagnostic Test");
    } else if (h.indexOf("doctor") >= 0 || h.indexOf("referr") >= 0) {
      row.push(ord.referringDoctorName || "Direct Walk-in");
    } else if (h.indexOf("beneficiary") >= 0) {
      row.push(ord.commissionBeneficiaryName || "");
    } else if (h.indexOf("subtotal") >= 0 || h.indexOf("mrp") >= 0 || h.indexOf("gross") >= 0) {
      row.push(Number(ord.subtotal) || 0);
    } else if (h.indexOf("discount reason") >= 0 || h.indexOf("discount note") >= 0 || h.indexOf("concession note") >= 0 || h.indexOf("concession reason") >= 0) {
      row.push(ord.discountReason || (Number(ord.discountAmount) > 0 ? (ord.patientStatusRemark ? ord.patientStatusRemark + " concession" : "Doctor reference concession") : ""));
    } else if (h.indexOf("discount") >= 0) {
      row.push(Number(ord.discountAmount) || 0);
    } else if (h.indexOf("net") >= 0 || h.indexOf("total") >= 0) {
      row.push(Number(ord.totalAmount) || ((Number(ord.subtotal) || 0) - (Number(ord.discountAmount) || 0)));
    } else if (h.indexOf("paid") >= 0) {
      row.push(Number(ord.paidAmount) !== undefined && !isNaN(Number(ord.paidAmount)) ? Number(ord.paidAmount) : (Number(ord.totalAmount) || 0));
    } else if (h.indexOf("due") >= 0 || h.indexOf("balance") >= 0) {
      row.push(Number(ord.dueAmount) || 0);
    } else if (h.indexOf("mode") >= 0 || h.indexOf("payment") >= 0) {
      row.push(ord.paymentMode || "Cash");
    } else if (h.indexOf("status") >= 0) {
      row.push(ord.status || "ORDER_PLACED");
    } else if (h.indexOf("billed by") >= 0 || h.indexOf("staff") >= 0 || h.indexOf("created by") >= 0 || h.indexOf("operator") >= 0) {
      row.push(ord.createdByStaffName || "Reception Desk");
    } else if (h.indexOf("barcode") >= 0) {
      row.push(ord.barcode || ("ATL-BAR-" + (ord.invoiceNumber || ord.id || Date.now())));
    } else if (h.indexOf("refund amount") >= 0) {
      row.push(Number(ord.refundAmount) || 0);
    } else if (h.indexOf("refund reason") >= 0) {
      row.push(ord.refundReason || "");
    } else if (h.indexOf("remark") >= 0 || h.indexOf("intake") >= 0) {
      row.push(ord.patientStatusRemark || "");
    } else if (h.indexOf("sync") >= 0 || h.indexOf("timestamp") >= 0 || h.indexOf("updated") >= 0) {
      row.push(new Date().toISOString());
    } else {
      row.push("");
    }
  }

  return row;
}

function findOrderRowIndex(sheet, orderId, invoiceNo, patientUhid, patientName) {
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return -1;
  var headers = data[0].map(function(h) { return String(h || "").toLowerCase().trim(); });

  var colInv = -1;
  var colId = -1;
  var colUhid = -1;
  var colName = -1;
  for (var c = 0; c < headers.length; c++) {
    var h = headers[c];
    if (h.indexOf("invoice") >= 0 || h === "inv" || h.indexOf("bill no") >= 0 || h.indexOf("bill #") >= 0) colInv = c;
    if (h.indexOf("order id") >= 0 || h === "order #" || h === "ord id") colId = c;
    if (h.indexOf("uhid") >= 0 || h.indexOf("patient id") >= 0 || h === "pid") colUhid = c;
    if (h.indexOf("patient name") >= 0 || h === "patient" || h === "name" || h === "patient_name") colName = c;
  }

  var targetInv = invoiceNo ? String(invoiceNo).trim().toLowerCase() : "";
  var targetId = orderId ? String(orderId).trim().toLowerCase() : "";
  var targetUhid = patientUhid ? String(patientUhid).trim().toLowerCase() : "";
  var targetName = patientName ? String(patientName).trim().toLowerCase() : "";

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rowInv = colInv >= 0 ? String(row[colInv] || "").trim().toLowerCase() : "";
    var rowId = colId >= 0 ? String(row[colId] || "").trim().toLowerCase() : "";
    var rowUhid = colUhid >= 0 ? String(row[colUhid] || "").trim().toLowerCase() : "";
    var rowName = colName >= 0 ? String(row[colName] || "").trim().toLowerCase() : "";

    var idMatch = (targetInv && colInv >= 0 && rowInv === targetInv) ||
                  (targetId && colId >= 0 && rowId === targetId);

    if (!idMatch) {
      for (var k = 0; k < Math.min(row.length, 3); k++) {
        var val = String(row[k] || "").trim().toLowerCase();
        if ((targetInv && val === targetInv) || (targetId && val === targetId)) {
          idMatch = true;
          break;
        }
      }
    }

    if (idMatch) {
      // If patient information is provided, verify it belongs to the same patient!
      if (targetUhid && rowUhid && targetUhid !== rowUhid) {
        // Different patient UHID! Collision, do NOT treat as the same order row!
        continue;
      }
      if (targetName && rowName && targetName !== rowName) {
        // Different patient name! Collision, do NOT treat as the same order row!
        continue;
      }
      return i + 1;
    }
  }
  return -1;
}

function upsertPatientRecord(ss, patient) {
  if (!patient || !patient.id) return;
  var pSheet = getOrCreateSheet(ss, SHEET_NAMES.PATIENTS, getPatientsHeader());
  var pIndex = findRowIndexByColumnValue(pSheet, 1, patient.id);
  var pRowData = [
    patient.id,
    patient.name || "",
    patient.age || 0,
    patient.gender || "Male",
    patient.phone || "",
    patient.email || "",
    patient.address || "",
    patient.abhaId || "",
    patient.registeredAt || new Date().toISOString()
  ];

  if (pIndex > 0) {
    pSheet.getRange(pIndex, 1, 1, pRowData.length).setValues([pRowData]);
  } else {
    pSheet.appendRow(pRowData);
  }
}

function ensureDoctorHeaders(sheet) {
  if (!sheet) return;
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) {
    sheet.appendRow(getDoctorsHeader());
    styleHeaderRow(sheet, "#059669");
    return;
  }
  var headers = sheet.getRange(1, 1, 1, Math.max(lastCol, 1)).getValues()[0];
  var headerLower = headers.map(function(h) { return String(h || "").toLowerCase().trim(); });

  var requiredCols = [
    { name: "Degree / Qualification", keys: ["degree / qualification", "qualification", "degree"] },
    { name: "Registration No", keys: ["registration no", "reg no", "registration"] },
    { name: "Status", keys: ["status", "approval status"] },
    { name: "Affiliation Type", keys: ["affiliation type", "affiliation"] },
    { name: "Organization Name", keys: ["organization name", "organization", "clinic name"] },
    { name: "Commission (%)", keys: ["commission (%)", "commission", "commission %"] },
    { name: "Total Referrals", keys: ["total referrals", "referrals"] },
    { name: "Revenue Generated (₹)", keys: ["revenue generated (₹)", "revenue", "revenue generated"] },
    { name: "Commission Earned (₹)", keys: ["commission earned (₹)", "commission earned"] },
    { name: "Payout Paid (₹)", keys: ["payout paid (₹)", "payout paid", "payout"] },
    { name: "Last Updated", keys: ["last updated", "updated at", "updated"] }
  ];

  for (var r = 0; r < requiredCols.length; r++) {
    var req = requiredCols[r];
    var found = false;
    for (var k = 0; k < req.keys.length; k++) {
      if (headerLower.indexOf(req.keys[k]) !== -1) {
        found = true;
        break;
      }
    }
    if (!found) {
      sheet.getRange(1, lastCol + 1).setValue(req.name);
      lastCol++;
      headers.push(req.name);
      headerLower.push(req.name.toLowerCase().trim());
    }
  }
}

function findDoctorRowIndex(sheet, targetId, targetName, targetPhone) {
  if (!sheet) return -1;
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return -1;
  var headers = data[0];
  var colMap = {};
  for (var h = 0; h < headers.length; h++) {
    colMap[String(headers[h] || "").trim().toLowerCase()] = h;
  }

  function getC(keys, fallbackIdx) {
    for (var k = 0; k < keys.length; k++) {
      if (colMap[keys[k]] !== undefined) return colMap[keys[k]];
    }
    for (var k2 = 0; k2 < keys.length; k2++) {
      for (var colKey in colMap) {
        if (colKey.indexOf(keys[k2]) >= 0 || keys[k2].indexOf(colKey) >= 0) return colMap[colKey];
      }
    }
    return fallbackIdx;
  }

  var cId = getC(["doctor id", "id"], 0);
  var cName = getC(["doctor name", "name"], 1);
  var cPhone = getC(["phone", "mobile"], 6);

  var normTId = String(targetId || "").trim().toLowerCase();
  var normTName = String(targetName || "").toLowerCase().replace(/^(dr\.?|mr\.?|mrs\.?|ms\.?)\s+/i, '').replace(/[^a-z0-9]/g, '').trim();
  var normTPhone = String(targetPhone || "").replace(/[^0-9]/g, '');

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rId = String(row[cId] || "").trim().toLowerCase();
    var rName = String(row[cName] || "").toLowerCase().replace(/^(dr\.?|mr\.?|mrs\.?|ms\.?)\s+/i, '').replace(/[^a-z0-9]/g, '').trim();
    var rPhone = String(row[cPhone] || "").replace(/[^0-9]/g, '');

    if (normTId && rId && normTId === rId) return i + 1;
    if (normTName && rName && normTName.length >= 3 && rName.length >= 3 && (normTName === rName || normTName.indexOf(rName) >= 0 || rName.indexOf(normTName) >= 0)) return i + 1;
    if (normTPhone && rPhone && normTPhone.length >= 10 && rPhone.length >= 10 && normTPhone.slice(-10) === rPhone.slice(-10)) return i + 1;
  }
  return -1;
}

function upsertDoctorRecord(ss, doc) {
  if (!doc || (!doc.id && !doc.name)) return;
  var docS = getOrCreateSheet(ss, SHEET_NAMES.DOCTORS, getDoctorsHeader());
  ensureDoctorHeaders(docS);

  var headers = docS.getRange(1, 1, 1, Math.max(docS.getLastColumn(), 1)).getValues()[0];
  var colMap = {};
  for (var h = 0; h < headers.length; h++) {
    colMap[String(headers[h] || "").trim().toLowerCase()] = h;
  }

  var dRowData = new Array(headers.length);
  for (var i = 0; i < headers.length; i++) dRowData[i] = "";

  var setCol = function(name, val) {
    var lower = name.toLowerCase();
    if (colMap[lower] !== undefined) {
      dRowData[colMap[lower]] = val;
      return;
    }
    for (var k in colMap) {
      if (k.indexOf(lower) >= 0 || lower.indexOf(k) >= 0) {
        dRowData[colMap[k]] = val;
        return;
      }
    }
  };

  setCol("Doctor ID", doc.id || ("ref-" + Date.now().toString().slice(-4)));
  setCol("Doctor Name", doc.name || "");
  setCol("Degree / Qualification", doc.qualification || "");
  setCol("Qualification", doc.qualification || "");
  setCol("Specialty / Department", doc.specialty || "");
  setCol("Hospital / Clinic Name", doc.hospital || "");
  setCol("Registration No", doc.registrationNo || "");
  setCol("Phone", doc.phone || "");
  setCol("Email", doc.email || "");
  setCol("Commission (%)", doc.commissionPct || 0);
  setCol("Affiliation Type", doc.affiliationType || "SELF");
  setCol("Organization Name", doc.organizationName || "");
  setCol("Status", doc.status || "APPROVED");
  setCol("Total Referrals", doc.totalReferralsCount || 0);
  setCol("Revenue Generated (₹)", doc.totalRevenueGenerated || 0);
  setCol("Commission Earned (₹)", doc.totalCommissionEarned || 0);
  setCol("Payout Paid (₹)", doc.payoutPaid || 0);
  setCol("Last Updated", new Date().toISOString());

  var dIndex = findDoctorRowIndex(docS, doc.id, doc.name, doc.phone);
  if (dIndex > 0) {
    docS.getRange(dIndex, 1, 1, dRowData.length).setValues([dRowData]);

    // Clean up any remaining duplicate rows for the same doctor
    var normName = String(doc.name || "").toLowerCase().replace(/^(dr\.?|mr\.?|mrs\.?|ms\.?)\s+/i, '').replace(/[^a-z0-9]/g, '').trim();
    if (normName.length >= 3) {
      var allRows = docS.getDataRange().getValues();
      var cNameIdx = colMap["doctor name"] !== undefined ? colMap["doctor name"] : 1;
      for (var rIdx = allRows.length - 1; rIdx >= 1; rIdx--) {
        if (rIdx + 1 === dIndex) continue;
        var rowDocName = String(allRows[rIdx][cNameIdx] || "").toLowerCase().replace(/^(dr\.?|mr\.?|mrs\.?|ms\.?)\s+/i, '').replace(/[^a-z0-9]/g, '').trim();
        if (rowDocName && rowDocName === normName) {
          docS.deleteRow(rIdx + 1);
        }
      }
    }
  } else {
    docS.appendRow(dRowData);
  }
}

function upsertAppointmentRecord(ss, apt) {
  if (!apt || !apt.id) return;
  var aptS = getOrCreateSheet(ss, SHEET_NAMES.APPOINTMENTS, getAppointmentsHeader());
  var aptIndex = findRowIndexByColumnValue(aptS, 1, apt.id);
  var aptRowData = [
    apt.id,
    apt.patientName || "",
    apt.patientPhone || "",
    apt.patientEmail || "",
    apt.patientAge || "",
    apt.patientGender || "Male",
    apt.appointmentDate ? ("'" + apt.appointmentDate) : "",
    apt.appointmentTime ? ("'" + apt.appointmentTime) : "",
    Array.isArray(apt.testsRequested) ? apt.testsRequested.join(", ") : String(apt.testsRequested || ""),
    apt.referringDoctorName || "Direct Walk-in",
    apt.centerId || "cnt-01",
    apt.status || "SCHEDULED",
    apt.notes || "",
    apt.createdAt || new Date().toISOString()
  ];

  if (aptIndex > 0) {
    aptS.getRange(aptIndex, 1, 1, aptRowData.length).setValues([aptRowData]);
  } else {
    aptS.appendRow(aptRowData);
  }
}

function upsertExpenseRecord(ss, exp) {
  if (!exp || !exp.id) return;
  var expS = getOrCreateSheet(ss, SHEET_NAMES.EXPENSES, getExpensesHeader());
  var eIndex = findRowIndexByColumnValue(expS, 1, exp.id);
  var eRowData = [
    exp.id,
    exp.receiptNo || "",
    exp.date || new Date().toISOString(),
    exp.category || "Supplies",
    exp.title || "Operating Expense",
    exp.amount || 0,
    exp.paymentMode || "Cash",
    exp.centerCode || "ATL-MAIN",
    exp.recordedByStaffName || "Center Manager",
    exp.notes || "",
    new Date().toISOString()
  ];

  if (eIndex > 0) {
    expS.getRange(eIndex, 1, 1, eRowData.length).setValues([eRowData]);
  } else {
    expS.appendRow(eRowData);
  }
}

function upsertStaffRecord(ss, staffMember) {
  if (!staffMember || (!staffMember.id && !staffMember.username)) return;
  var sSheet = getOrCreateSheet(ss, SHEET_NAMES.STAFF, getStaffHeader());
  ensureStaffHeaders(sSheet);

  var sData = sSheet.getDataRange().getValues();
  var headers = sData[0];
  var colMap = {};
  for (var c = 0; c < headers.length; c++) {
    colMap[String(headers[c] || "").toLowerCase().trim()] = c + 1; // 1-based index
  }

  function getCol(keys, fallbackIdx) {
    for (var k = 0; k < keys.length; k++) {
      if (colMap[keys[k]] !== undefined) return colMap[keys[k]];
    }
    for (var k2 = 0; k2 < keys.length; k2++) {
      for (var colKey in colMap) {
        if (colKey.indexOf(keys[k2]) >= 0 || keys[k2].indexOf(colKey) >= 0) {
          return colMap[colKey];
        }
      }
    }
    return fallbackIdx;
  }

  var cId = getCol(["staff id", "id"], 1);
  var cName = getCol(["employee name", "name"], 2);
  var cRole = getCol(["role", "designation"], 3);
  var cCenter = getCol(["assigned center", "center id", "center"], 4);
  var cShift = getCol(["shift"], 5);
  var cSalary = getCol(["monthly salary (₹)", "monthly salary", "salary", "monthly salary (?)", "monthly salary (rs)"], 6);
  var cUser = getCol(["username", "user", "login username"], 7);
  var cPass = getCol(["password", "pass", "pwd", "login password"], 8);
  var cPhone = getCol(["phone", "mobile", "mobile phone", "contact"], 9);
  var cEmail = getCol(["email", "email address"], 10);
  var cStatus = getCol(["status"], 11);
  var cStart = getCol(["shift start", "start time"], 12);
  var cEnd = getCol(["shift end", "end time"], 13);
  var cPerm = getCol(["permissions"], 14);
  var cUpdated = getCol(["last updated", "updated at", "updated"], 15);

  var targetId = String(staffMember.id || "").trim().toLowerCase();
  var targetUser = String(staffMember.username || "").trim().toLowerCase();
  var targetPhone = String(staffMember.phone || "").replace(/[^0-9]/g, "");

  var foundRowIdx = -1;
  var dupRowsToDelete = [];

  for (var i = 1; i < sData.length; i++) {
    var row = sData[i];
    var rId = String(row[cId - 1] || "").trim().toLowerCase();
    var rUser = String(row[cUser - 1] || "").trim().toLowerCase();
    var rPhone = String(row[cPhone - 1] || "").replace(/[^0-9]/g, "");

    var isMatch = false;
    if (targetId && rId && targetId === rId) isMatch = true;
    else if (targetUser && rUser && targetUser === rUser) isMatch = true;
    else if (targetPhone.length >= 10 && rPhone.length >= 10 && targetPhone === rPhone) isMatch = true;

    if (isMatch) {
      if (foundRowIdx === -1) {
        foundRowIdx = i + 1;
      } else {
        dupRowsToDelete.push(i + 1);
      }
    }
  }

  // Delete duplicate rows in reverse order
  for (var d = dupRowsToDelete.length - 1; d >= 0; d--) {
    sSheet.deleteRow(dupRowsToDelete[d]);
  }

  var rowLen = Math.max(headers.length, 15);
  var rowData = new Array(rowLen).fill("");

  rowData[cId - 1] = staffMember.id || "";
  rowData[cName - 1] = staffMember.name || "";
  rowData[cRole - 1] = staffMember.role || "Receptionist";
  rowData[cCenter - 1] = staffMember.assignedCenterId || "cnt-01";
  rowData[cShift - 1] = staffMember.shift || "";
  rowData[cSalary - 1] = staffMember.monthlySalary !== undefined ? staffMember.monthlySalary : 0;
  rowData[cUser - 1] = staffMember.username || "";
  if (cPass > 0) rowData[cPass - 1] = staffMember.password || "Atlas@123";
  rowData[cPhone - 1] = staffMember.phone || "";
  rowData[cEmail - 1] = staffMember.email || "";
  rowData[cStatus - 1] = staffMember.status || "Active";
  rowData[cStart - 1] = staffMember.shiftStartTime ? ("'" + staffMember.shiftStartTime) : "";
  rowData[cEnd - 1] = staffMember.shiftEndTime ? ("'" + staffMember.shiftEndTime) : "";
  if (cPerm > 0) rowData[cPerm - 1] = staffMember.permissions ? (typeof staffMember.permissions === "string" ? staffMember.permissions : JSON.stringify(staffMember.permissions)) : "";
  if (cUpdated > 0) rowData[cUpdated - 1] = staffMember.updatedAt || new Date().toISOString();

  if (foundRowIdx > 0) {
    sSheet.getRange(foundRowIdx, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sSheet.appendRow(rowData);
  }
}

function upsertRosterDoctorRecord(ss, doc) {
  if (!doc || !doc.id) return;
  var rSheet = getOrCreateSheet(ss, SHEET_NAMES.DOCTOR_ROSTER, getDoctorRosterHeader());
  var rIndex = findRowIndexByColumnValue(rSheet, 1, doc.id);
  var rRowData = [
    doc.id,
    doc.name || "",
    doc.qualification || "",
    doc.specialty || doc.department || "",
    doc.centerId || "cnt-01",
    doc.phone || "",
    doc.email || "",
    doc.registrationNo || "",
    doc.roleType || "VISITING_SPECIALIST",
    doc.shift || "",
    Array.isArray(doc.workingDays) ? doc.workingDays.join(", ") : String(doc.workingDays || ""),
    doc.status || "ON_DUTY",
    doc.roomNo || "",
    doc.emergencyAvailable ? "YES" : "NO",
    doc.notes || "",
    new Date().toISOString()
  ];

  if (rIndex > 0) {
    rSheet.getRange(rIndex, 1, 1, rRowData.length).setValues([rRowData]);
  } else {
    rSheet.appendRow(rRowData);
  }
}

function fetchPatientsFromSheet(patSheet) {
  var patients = [];
  if (!patSheet) return patients;
  var pData = patSheet.getDataRange().getValues();
  for (var p = 1; p < pData.length; p++) {
    var pRow = pData[p];
    if (pRow[0]) {
      patients.push({
        id: String(pRow[0]).trim(),
        name: String(pRow[1] || "").trim(),
        age: Number(pRow[2]) || 0,
        gender: String(pRow[3] || "Male").trim(),
        phone: String(pRow[4] || "").trim(),
        email: String(pRow[5] || "").trim(),
        address: String(pRow[6] || "").trim(),
        abhaId: String(pRow[7] || "").trim(),
        registeredAt: String(pRow[8] || new Date().toISOString())
      });
    }
  }
  return patients;
}

function fetchDoctorsFromSheet(docSheet) {
  var doctors = [];
  if (!docSheet) return doctors;
  var dData = docSheet.getDataRange().getValues();
  if (dData.length <= 1) return doctors;
  var headers = dData[0];
  var colMap = {};
  for (var h = 0; h < headers.length; h++) {
    colMap[String(headers[h] || "").trim().toLowerCase()] = h;
  }

  var docMap = {};

  for (var d = 1; d < dData.length; d++) {
    var dRow = dData[d];
    var getVal = function(name, defaultIdx, defaultVal) {
      var lower = name.toLowerCase();
      // Strict exact column match first
      if (colMap[lower] !== undefined && dRow[colMap[lower]] !== undefined && dRow[colMap[lower]] !== "") {
        return dRow[colMap[lower]];
      }
      // Specific exact match patterns
      for (var k in colMap) {
        if (k === lower && dRow[colMap[k]] !== undefined && dRow[colMap[k]] !== "") {
          return dRow[colMap[k]];
        }
      }
      return defaultIdx >= 0 && defaultIdx < dRow.length && dRow[defaultIdx] !== undefined && dRow[defaultIdx] !== "" ? dRow[defaultIdx] : defaultVal;
    };

    var docName = String(getVal("Doctor Name", 1, dRow[1] || dRow[0] || "")).trim();
    if (!docName) continue;

    var rawStatus = String(getVal("Status", 7, "")).trim().toUpperCase();
    var finalStatus = "APPROVED";
    if (rawStatus === "PENDING_APPROVAL" || rawStatus === "PENDING") {
      finalStatus = "PENDING_APPROVAL";
    } else if (rawStatus === "REJECTED") {
      finalStatus = "REJECTED";
    }

    var docId = String(getVal("Doctor ID", 16, dRow[16] || ("ref-" + d))).trim();
    if (!docId) docId = "ref-" + d;

    var rawPhone = String(getVal("Phone", 4, "")).trim();
    if (rawPhone === docName || rawPhone === "SELF" || rawPhone === "ORGANIZATION" || rawPhone === "PENDING_APPROVAL") {
      rawPhone = "";
    }
    var rawRegNo = String(getVal("Registration No", 14, "")).trim();
    if (rawRegNo === "SELF" || rawRegNo === "ORGANIZATION" || rawRegNo === "PENDING_APPROVAL") {
      rawRegNo = "";
    }

    var item = {
      id: docId,
      name: docName,
      qualification: String(getVal("Degree / Qualification", 13, "")).trim(),
      specialty: String(getVal("Specialty / Department", 2, "")).trim(),
      hospital: String(getVal("Hospital / Clinic Name", 3, "")).trim(),
      registrationNo: rawRegNo,
      phone: rawPhone,
      email: String(getVal("Email", 17, "")).trim(),
      commissionPct: Number(getVal("Commission (%)", 15, 0)) || 0,
      affiliationType: String(getVal("Affiliation Type", 5, "SELF")).trim(),
      organizationName: String(getVal("Organization Name", 6, "")).trim(),
      status: finalStatus,
      totalReferralsCount: Number(getVal("Total Referrals", 8, 0)) || 0,
      totalRevenueGenerated: Number(getVal("Revenue Generated (₹)", 9, 0)) || 0,
      totalCommissionEarned: Number(getVal("Commission Earned (₹)", 10, 0)) || 0,
      payoutPaid: Number(getVal("Payout Paid (₹)", 11, 0)) || 0
    };

    var normNameKey = docName.toLowerCase().replace(/^(dr\.?|mr\.?|mrs\.?|ms\.?)\s+/i, '').replace(/[^a-z0-9]/g, '').trim();
    var lookupKey = normNameKey.length >= 3 ? normNameKey : docId.toLowerCase();

    if (!docMap[lookupKey]) {
      docMap[lookupKey] = item;
      doctors.push(item);
    } else {
      var existing = docMap[lookupKey];
      // If either record is APPROVED, the doctor is APPROVED
      if (item.status === "APPROVED" || existing.status === "APPROVED") {
        existing.status = "APPROVED";
      }
      if (!existing.qualification) {
        existing.qualification = item.qualification || existing.qualification;
      }
      if (!existing.registrationNo && item.registrationNo) {
        existing.registrationNo = item.registrationNo;
      }
      if (!existing.organizationName && item.organizationName) {
        existing.organizationName = item.organizationName;
      }
      if (!existing.hospital && item.hospital) {
        existing.hospital = item.hospital;
      }
      if (!existing.phone && item.phone) {
        existing.phone = item.phone;
      }
      existing.totalReferralsCount = Math.max(existing.totalReferralsCount, item.totalReferralsCount);
      existing.totalRevenueGenerated = Math.max(existing.totalRevenueGenerated, item.totalRevenueGenerated);
      existing.totalCommissionEarned = Math.max(existing.totalCommissionEarned, item.totalCommissionEarned);
      existing.payoutPaid = Math.max(existing.payoutPaid, item.payoutPaid);
    }
  }
  return doctors;
}

function formatTimeCell(val) {
  if (!val) return "";
  if (val instanceof Date) {
    var hrs = val.getHours();
    var mins = val.getMinutes();
    var ampm = hrs >= 12 ? "PM" : "AM";
    hrs = hrs % 12;
    hrs = hrs ? hrs : 12;
    var hrsStr = hrs < 10 ? "0" + hrs : String(hrs);
    var minStr = mins < 10 ? "0" + mins : String(mins);
    return hrsStr + ":" + minStr + " " + ampm;
  }
  var s = String(val).trim();
  if (s.indexOf("GMT") >= 0 || s.indexOf("1899") >= 0) {
    var d = new Date(s);
    if (!isNaN(d.getTime())) {
      var h = d.getHours();
      var m = d.getMinutes();
      var ap = h >= 12 ? "PM" : "AM";
      h = h % 12;
      h = h ? h : 12;
      var hS = h < 10 ? "0" + h : String(h);
      var mS = m < 10 ? "0" + m : String(m);
      return hS + ":" + mS + " " + ap;
    }
  }
  return s;
}

function fetchAppointmentsFromSheet(aptSheet) {
  var appointments = [];
  if (!aptSheet) return appointments;
  var aData = aptSheet.getDataRange().getValues();
  for (var a = 1; a < aData.length; a++) {
    var aRow = aData[a];
    if (aRow[0]) {
      appointments.push({
        id: String(aRow[0]).trim(),
        patientName: String(aRow[1] || "").trim(),
        patientPhone: String(aRow[2] || "").trim(),
        patientEmail: String(aRow[3] || "").trim(),
        patientAge: Number(aRow[4]) || undefined,
        patientGender: String(aRow[5] || "Male").trim(),
        appointmentDate: String(aRow[6] || "").trim(),
        appointmentTime: formatTimeCell(aRow[7]),
        testsRequested: String(aRow[8] || "").split(",").map(function(s) { return s.trim(); }),
        referringDoctorName: String(aRow[9] || "Direct Walk-in").trim(),
        centerId: String(aRow[10] || "cnt-01").trim(),
        status: String(aRow[11] || "SCHEDULED").trim(),
        notes: String(aRow[12] || "").trim()
      });
    }
  }
  return appointments;
}

function fetchStaffFromSheet(staffSheet) {
  var staff = [];
  if (!staffSheet) return staff;
  ensureStaffHeaders(staffSheet);
  var sData = staffSheet.getDataRange().getValues();
  if (sData.length <= 1) return staff;

  var headers = sData[0];
  var colMap = {};
  for (var c = 0; c < headers.length; c++) {
    colMap[String(headers[c] || "").toLowerCase().trim()] = c;
  }

  function getCol(keys, fallbackIdx) {
    for (var k = 0; k < keys.length; k++) {
      if (colMap[keys[k]] !== undefined) return colMap[keys[k]];
    }
    for (var k2 = 0; k2 < keys.length; k2++) {
      for (var colKey in colMap) {
        if (colKey.indexOf(keys[k2]) >= 0 || keys[k2].indexOf(colKey) >= 0) {
          return colMap[colKey];
        }
      }
    }
    return fallbackIdx;
  }

  var cId = getCol(["staff id", "id"], 0);
  var cName = getCol(["employee name", "name"], 1);
  var cRole = getCol(["role", "designation"], 2);
  var cCenter = getCol(["assigned center", "center id", "center"], 3);
  var cShift = getCol(["shift"], 4);
  var cSalary = getCol(["monthly salary (₹)", "monthly salary", "salary", "monthly salary (?)", "monthly salary (rs)"], 5);
  var cUser = getCol(["username", "user", "login username"], 6);
  var cPass = getCol(["password", "pass", "pwd", "login password"], -1);
  var cPhone = getCol(["phone", "mobile", "mobile phone", "contact"], 7);
  var cEmail = getCol(["email", "email address"], 8);
  var cStatus = getCol(["status"], 9);
  var cStart = getCol(["shift start", "start time"], 10);
  var cEnd = getCol(["shift end", "end time"], 11);
  var cPerm = getCol(["permissions"], -1);
  var cUpdated = getCol(["last updated", "updated at", "updated"], -1);

  var seenMap = {};

  for (var s = 1; s < sData.length; s++) {
    var sRow = sData[s];
    var sId = String(sRow[cId] || "").trim();
    var sUser = String(sRow[cUser] || "").trim();
    var sPhone = String(sRow[cPhone] || "").replace(/[^0-9]/g, "");
    if (!sId && !sUser) continue;

    var sPassVal = cPass >= 0 ? String(sRow[cPass] || "").trim() : "";
    var sPermVal = undefined;
    if (cPerm >= 0 && sRow[cPerm]) {
      try { sPermVal = JSON.parse(sRow[cPerm]); } catch (e) {}
    }

    var rawSal = cSalary >= 0 ? String(sRow[cSalary] || "").replace(/[^0-9.]/g, "") : "";
    var numSal = rawSal ? Number(rawSal) : 0;
    var salVal = numSal > 0 ? numSal : (cSalary >= 0 && String(sRow[cSalary] || "").trim() !== "" ? 0 : 35000);

    var staffObj = {
      id: sId || ("emp-" + sUser.toLowerCase()),
      name: String(sRow[cName] || "").trim(),
      role: String(sRow[cRole] || "Receptionist").trim(),
      assignedCenterId: String(sRow[cCenter] || "cnt-01").trim(),
      shift: String(sRow[cShift] || "Morning (8:00 AM - 4:00 PM)").trim(),
      monthlySalary: salVal,
      hourlyRate: Math.round(salVal / 160),
      username: sUser,
      password: sPassVal || "Atlas@123",
      phone: String(sRow[cPhone] || "").trim(),
      email: String(sRow[cEmail] || "").trim(),
      status: String(sRow[cStatus] || "Active").trim(),
      shiftStartTime: formatTimeCell(sRow[cStart]),
      shiftEndTime: formatTimeCell(sRow[cEnd]),
      permissions: sPermVal,
      updatedAt: (cUpdated >= 0 && sRow[cUpdated]) ? String(sRow[cUpdated]).trim() : ""
    };

    var dedupKey = sId ? sId.toLowerCase() : sUser.toLowerCase();
    if (!seenMap[dedupKey]) {
      seenMap[dedupKey] = staffObj;
      staff.push(staffObj);
    } else {
      var exist = seenMap[dedupKey];
      if (sPassVal && sPassVal !== "Atlas@123") exist.password = sPassVal;
      if (staffObj.name) exist.name = staffObj.name;
      if (staffObj.role) exist.role = staffObj.role;
      if (staffObj.monthlySalary > 0) {
        exist.monthlySalary = staffObj.monthlySalary;
        exist.hourlyRate = staffObj.hourlyRate;
      }
      if (staffObj.phone) exist.phone = staffObj.phone;
      if (sPermVal) exist.permissions = sPermVal;
    }
  }

  return staff;
}

function fetchDoctorRosterFromSheet(rosterSheet) {
  var roster = [];
  if (!rosterSheet) return roster;
  var rData = rosterSheet.getDataRange().getValues();
  for (var r = 1; r < rData.length; r++) {
    var rRow = rData[r];
    if (rRow[0]) {
      roster.push({
        id: String(rRow[0]).trim(),
        name: String(rRow[1] || "").trim(),
        qualification: String(rRow[2] || "").trim(),
        specialty: String(rRow[3] || "").trim(),
        department: String(rRow[3] || "Radiology & Imaging").trim(),
        centerId: String(rRow[4] || "cnt-01").trim(),
        phone: String(rRow[5] || "").trim(),
        email: String(rRow[6] || "").trim(),
        registrationNo: String(rRow[7] || "").trim(),
        roleType: String(rRow[8] || "VISITING_SPECIALIST").trim(),
        shift: String(rRow[9] || "Morning (8:00 AM - 2:00 PM)").trim(),
        workingDays: String(rRow[10] || "").split(",").map(function(w) { return w.trim(); }),
        status: String(rRow[11] || "ON_DUTY").trim(),
        roomNo: String(rRow[12] || "").trim(),
        emergencyAvailable: String(rRow[13]).toUpperCase() === "YES" || rRow[13] === true,
        notes: String(rRow[14] || "").trim()
      });
    }
  }
  return roster;
}

function purgeDuplicateOrdersFromAllSheets(ss) {
  var sheets = ss.getSheets();
  var totalPurged = 0;
  var totalRemaining = 0;

  for (var s = 0; s < sheets.length; s++) {
    var curSheet = sheets[s];
    var name = curSheet.getName();

    if (name.indexOf("Orders_") === 0) {
      var data = curSheet.getDataRange().getValues();
      if (data.length <= 1) continue;

      var headerRowRaw = data[0];
      var headerRow = headerRowRaw.map(function(h) { return String(h || "").toLowerCase().trim(); });

      var colInv = -1, colDate = -1, colUhid = -1, colName = -1, colPhone = -1, colTests = -1;
      for (var c = 0; c < headerRow.length; c++) {
        var h = headerRow[c];
        if (h.indexOf("invoice") >= 0 || h === "inv" || h.indexOf("bill no") >= 0 || h.indexOf("bill #") >= 0) colInv = c;
        else if ((h.indexOf("date") >= 0 || h.indexOf("time") >= 0) && h.indexOf("sync") < 0) colDate = c;
        else if (h.indexOf("uhid") >= 0 || h.indexOf("patient id") >= 0 || h === "pid") colUhid = c;
        else if (h.indexOf("patient name") >= 0 || h === "patient" || h === "name" || h === "client" || h === "patient_name") colName = c;
        else if (h.indexOf("phone") >= 0 || h.indexOf("mobile") >= 0 || h.indexOf("contact") >= 0 || h.indexOf("whatsapp") >= 0) colPhone = c;
        else if (h.indexOf("test") >= 0 || h.indexOf("investigation") >= 0) colTests = c;
      }

      var seenInvoices = {};
      var seenSignatures = {};
      var seenTimestampPatients = {};
      var uniqueRows = [];
      var duplicatesInSheet = 0;

      for (var r = 1; r < data.length; r++) {
        var row = data[r];
        if (!row || (!row[0] && !row[1] && !row[2])) continue;

        var rawInv = colInv >= 0 ? String(row[colInv] || "").trim().toUpperCase() : String(row[0] || "").trim().toUpperCase();
        var rawDate = colDate >= 0 ? String(row[colDate] || "").trim() : String(row[1] || "").trim();
        var rawName = colName >= 0 ? String(row[colName] || "").trim() : "";
        var rawPhone = colPhone >= 0 ? String(row[colPhone] || "").replace(/[^0-9]/g, "").slice(-10) : "";
        var rawTests = colTests >= 0 ? String(row[colTests] || "").trim().toLowerCase() : "";

        var normName = rawName.toLowerCase()
          .replace(/^(dr|mr|mrs|ms|mast)\.?\s+/i, "")
          .replace(/[^a-z]/g, "")
          .trim();

        var dateSubstr = rawDate.indexOf("T") >= 0 ? rawDate.split("T")[0] : rawDate.slice(0, 10);
        var testKey = rawTests.replace(/[^a-z0-9]/g, "").slice(0, 40);

        var invKey = rawInv ? ("INV_" + rawInv) : "";
        var sigKey = (normName && (rawPhone || dateSubstr)) ? ("SIG_" + normName + "_" + rawPhone + "_" + dateSubstr + "_" + testKey) : "";
        var timeKey = (rawDate && normName) ? ("TIME_" + rawDate.slice(0, 19) + "_" + normName) : "";

        var isDuplicate = false;
        if (invKey && seenInvoices[invKey]) {
          isDuplicate = true;
        } else if (sigKey && seenSignatures[sigKey]) {
          isDuplicate = true;
        } else if (timeKey && seenTimestampPatients[timeKey]) {
          isDuplicate = true;
        }

        if (isDuplicate) {
          duplicatesInSheet++;
          continue;
        }

        if (invKey) seenInvoices[invKey] = true;
        if (sigKey) seenSignatures[sigKey] = true;
        if (timeKey) seenTimestampPatients[timeKey] = true;
        uniqueRows.push(row);
      }

      if (duplicatesInSheet > 0) {
        totalPurged += duplicatesInSheet;
        var lastRow = curSheet.getLastRow();
        if (lastRow > 1) {
          curSheet.deleteRows(2, lastRow - 1);
        }
        if (uniqueRows.length > 0) {
          curSheet.getRange(2, 1, uniqueRows.length, uniqueRows[0].length).setValues(uniqueRows);
        }
      }
      totalRemaining += uniqueRows.length;
    }
  }

  return { purged: totalPurged, remaining: totalRemaining };
}

function fetchAllOrdersFromSheets(ss) {
  try {
    purgeDuplicateOrdersFromAllSheets(ss);
  } catch(e) {}
  var orders = [];
  var sheets = ss.getSheets();

  for (var s = 0; s < sheets.length; s++) {
    var curSheet = sheets[s];
    var name = curSheet.getName();

    if (name.indexOf("Orders_") === 0) {
      var data = curSheet.getDataRange().getValues();
      if (data.length <= 1) continue;

      var headerRowRaw = data[0];
      var headerRow = headerRowRaw.map(function(h) { return String(h || "").toLowerCase().trim(); });

      var colId = -1, colInv = -1, colDate = -1, colUhid = -1, colName = -1, colAge = -1, colGender = -1, colPhone = -1;
      var colTests = -1, colSubtotal = -1, colDiscount = -1, colTotal = -1, colPaid = -1, colDue = -1, colPayMode = -1;
      var colStatus = -1, colDoc = -1, colBeneficiary = -1, colStaff = -1, colBarcode = -1, colRemark = -1, colDiscountReason = -1;

      for (var c = 0; c < headerRow.length; c++) {
        var h = headerRow[c];
        if (h.indexOf("order id") >= 0 || h === "order #" || h === "ord id") colId = c;
        else if (h.indexOf("invoice") >= 0 || h === "inv" || h.indexOf("bill no") >= 0 || h.indexOf("bill #") >= 0) colInv = c;
        else if ((h.indexOf("date") >= 0 || h.indexOf("time") >= 0) && h.indexOf("sync") < 0) colDate = c;
        else if (h.indexOf("uhid") >= 0 || h.indexOf("patient id") >= 0 || h === "pid") colUhid = c;
        else if (h.indexOf("patient name") >= 0 || h === "patient" || h === "name" || h === "client" || h === "patient_name") colName = c;
        else if (h.indexOf("age/gender") >= 0 || h.indexOf("age / gender") >= 0 || h.indexOf("age & gender") >= 0 || h === "age/sex") { colAge = c; colGender = c; }
        else if (h === "age") colAge = c;
        else if (h === "gender" || h === "sex") colGender = c;
        else if (h.indexOf("phone") >= 0 || h.indexOf("mobile") >= 0 || h.indexOf("contact") >= 0 || h.indexOf("whatsapp") >= 0) colPhone = c;
        else if (h.indexOf("test") >= 0 || h.indexOf("investigation") >= 0) colTests = c;
        else if (h.indexOf("subtotal") >= 0 || h.indexOf("mrp") >= 0 || h.indexOf("gross") >= 0) colSubtotal = c;
        else if (h.indexOf("discount reason") >= 0 || h.indexOf("discount note") >= 0 || h.indexOf("concession reason") >= 0 || h.indexOf("concession note") >= 0) colDiscountReason = c;
        else if (h.indexOf("discount") >= 0) colDiscount = c;
        else if (h.indexOf("net") >= 0 || h.indexOf("total") >= 0) colTotal = c;
        else if (h.indexOf("paid") >= 0) colPaid = c;
        else if (h.indexOf("due") >= 0 || h.indexOf("balance") >= 0) colDue = c;
        else if (h.indexOf("mode") >= 0 || h.indexOf("payment") >= 0) colPayMode = c;
        else if (h.indexOf("status") >= 0) colStatus = c;
        else if (h.indexOf("doctor") >= 0 || h.indexOf("referr") >= 0) colDoc = c;
        else if (h.indexOf("beneficiary") >= 0) colBeneficiary = c;
        else if (h.indexOf("billed by") >= 0 || h.indexOf("staff") >= 0 || h.indexOf("operator") >= 0) colStaff = c;
        else if (h.indexOf("barcode") >= 0) colBarcode = c;
        else if (h.indexOf("remark") >= 0 || h.indexOf("intake") >= 0) colRemark = c;
      }

      for (var r = 1; r < data.length; r++) {
        var row = data[r];
        if (!row || (!row[0] && !row[1] && !row[2])) continue;

        // Detect old shifted row bug:
        // Invoice is in Col 1 (e.g. CK...), Date is in Col 2 (ISO string), UHID is in Col 3, Name is in Col 4
        var isOldShiftedRow = (
          (colInv === 0 || colInv === -1) &&
          String(row[1] || "").match(/^(CK|ATLS|INV|\d{10})/i) &&
          String(row[2] || "").indexOf("202") >= 0 &&
          String(row[2] || "").indexOf("T") >= 0
        );

        var rawId = "";
        var rawInv = "";
        var rawDate = "";
        var rawUhid = "";
        var rawName = "";
        var pAge = 30;
        var pGender = "Male";
        var pPhone = "";
        var tName = "Diagnostic Test";
        var subtotal = 0;
        var discount = 0;
        var total = 0;
        var paid = 0;
        var due = 0;
        var payMode = "Cash";
        var status = "ORDER_PLACED";
        var docName = "Direct Walk-in";
        var beneficiary = "Direct Walk-in";
        var billedBy = "Reception Desk";
        var barcode = "";
        var remark = "";

        if (isOldShiftedRow) {
          rawId = String(row[0] || "");
          rawInv = String(row[1] || "");
          rawDate = String(row[2] || "");
          rawUhid = String(row[3] || "");
          rawName = String(row[4] || "");
          pAge = Number(row[5]) || 0;
          pGender = String(row[6] || "");
          pPhone = String(row[7] || "");
          var parseFin = function(v, d) {
            if (v === null || v === undefined || v === "") return d;
            if (typeof v === "number") return isNaN(v) ? d : v;
            var c = String(v).replace(/[^0-9.-]/g, "");
            var n = parseFloat(c);
            return isNaN(n) ? d : Math.round(n);
          };

          tName = String(row[8] || "Diagnostic Test");
          subtotal = parseFin(row[9], 0);
          discount = parseFin(row[10], 0);
          total = parseFin(row[11], Math.max(0, subtotal - discount));
          paid = parseFin(row[12], total);
          due = parseFin(row[13], Math.max(0, total - paid));
          if (paid >= total) due = 0;
          payMode = String(row[14] || "Cash");
          status = String(row[15] || "ORDER_PLACED");
          docName = String(row[16] || "Direct Walk-in");
          beneficiary = String(row[17] || "");
          billedBy = String(row[18] || "Reception Desk");
          barcode = String(row[19] || ("ATL-BAR-" + rawInv));
          remark = String(row[22] || "");

          // In-place auto-repair directly on Google Sheet!
          try {
            var repairedOrd = {
              id: rawId || ("ATL-ORD-" + rawInv),
              invoiceNumber: rawInv,
              createdAt: rawDate,
              patientId: rawUhid,
              patient: { id: rawUhid, name: rawName, age: pAge, gender: pGender, phone: pPhone },
              tests: [{ id: "t-01", name: tName, price: subtotal }],
              subtotal: subtotal,
              discountAmount: discount,
              totalAmount: total,
              paidAmount: paid,
              dueAmount: due,
              paymentMode: payMode,
              status: status,
              referringDoctorName: docName,
              commissionBeneficiaryName: beneficiary,
              createdByStaffName: billedBy,
              barcode: barcode,
              patientStatusRemark: remark
            };
            var repairedRowData = buildOrderRowFromHeaders(headerRowRaw, repairedOrd);
            curSheet.getRange(r + 1, 1, 1, repairedRowData.length).setValues([repairedRowData]);
          } catch(eRep) {}
        } else {
          rawId = colId >= 0 ? String(row[colId] || "") : "";
          rawInv = colInv >= 0 ? String(row[colInv] || "") : String(row[0] || "");
          rawDate = colDate >= 0 ? String(row[colDate] || "") : "";
          rawUhid = colUhid >= 0 ? String(row[colUhid] || "") : "";
          rawName = colName >= 0 ? String(row[colName] || "") : "";

          // Age & Gender
          if (colAge >= 0 && colAge === colGender) {
            var agStr = String(row[colAge] || "");
            var aMatch = agStr.match(/(\d+)Y?/i);
            if (aMatch) pAge = parseInt(aMatch[1], 10);
            if (agStr.toLowerCase().indexOf("female") >= 0) pGender = "Female";
            else if (agStr.toLowerCase().indexOf("other") >= 0) pGender = "Other";
            else if (agStr.toLowerCase().indexOf("male") >= 0) pGender = "Male";
          } else {
            pAge = colAge >= 0 ? (Number(row[colAge]) || 30) : 30;
            pGender = colGender >= 0 ? String(row[colGender] || "Male") : "Male";
          }

          var parseFin = function(v, d) {
            if (v === null || v === undefined || v === "") return d;
            if (typeof v === "number") return isNaN(v) ? d : v;
            var c = String(v).replace(/[^0-9.-]/g, "");
            var n = parseFloat(c);
            return isNaN(n) ? d : Math.round(n);
          };

          pPhone = colPhone >= 0 ? String(row[colPhone] || "") : "";
          tName = colTests >= 0 ? String(row[colTests] || "Diagnostic Test") : "Diagnostic Test";
          subtotal = colSubtotal >= 0 ? parseFin(row[colSubtotal], 0) : 0;
          discount = colDiscount >= 0 ? parseFin(row[colDiscount], 0) : 0;
          total = colTotal >= 0 ? parseFin(row[colTotal], Math.max(0, subtotal - discount)) : Math.max(0, subtotal - discount);
          paid = colPaid >= 0 && row[colPaid] !== "" && row[colPaid] !== null ? parseFin(row[colPaid], total) : total;
          due = colDue >= 0 && row[colDue] !== "" && row[colDue] !== null ? parseFin(row[colDue], Math.max(0, total - paid)) : Math.max(0, total - paid);
          if (paid >= total) due = 0;
          payMode = colPayMode >= 0 ? String(row[colPayMode] || "Cash") : "Cash";
          status = colStatus >= 0 ? String(row[colStatus] || "ORDER_PLACED") : "ORDER_PLACED";
          docName = colDoc >= 0 ? String(row[colDoc] || "Direct Walk-in") : "Direct Walk-in";
          beneficiary = colBeneficiary >= 0 ? String(row[colBeneficiary] || "") : "";
          billedBy = colStaff >= 0 ? String(row[colStaff] || "Reception Desk") : "Reception Desk";
          barcode = colBarcode >= 0 ? String(row[colBarcode] || "") : "";
          remark = colRemark >= 0 ? String(row[colRemark] || "") : "";
        }

        var cleanInv = rawInv;
        // Only recover from barcode if rawInv is missing or contains an invalid date string
        if ((!cleanInv || cleanInv.indexOf("T") >= 0 || cleanInv.length < 5) && barcode && /ATL-BAR-(ATLS\d+\.\d+)/i.test(barcode)) {
          var bMatch = barcode.match(/ATL-BAR-(ATLS\d+\.\d+)/i);
          if (bMatch && bMatch[1]) {
            cleanInv = bMatch[1].toUpperCase();
          }
        } else if (!cleanInv || cleanInv.indexOf("T") >= 0) {
          var dObj = new Date(rawDate);
          if (isNaN(dObj.getTime()) || dObj.getFullYear() < 2000) dObj = new Date();
          var yy = String(dObj.getFullYear()).slice(-2);
          var mm = String(dObj.getMonth() + 1);
          if (mm.length < 2) mm = "0" + mm;
          var dd = String(dObj.getDate());
          if (dd.length < 2) dd = "0" + dd;
          var numStr = rawId.replace(/[^0-9]/g, "").slice(-5) || "00001";
          while (numStr.length < 5) numStr = "0" + numStr;
          cleanInv = "ATLS" + yy + mm + dd + "." + numStr;
        }

        var cleanId = rawId;
        if (!cleanId || cleanId.indexOf("T") >= 0) {
          cleanId = "ATL-ORD-" + cleanInv;
        }

        var cleanStaff = billedBy || "Reception Desk";

        var splitTests = [];
        if (tName && tName.indexOf(",") >= 0) {
          var tParts = tName.split(",");
          for (var ti = 0; ti < tParts.length; ti++) {
            var tpName = tParts[ti].trim();
            if (tpName) {
              splitTests.push({
                id: "t-0" + (ti + 1),
                name: tpName,
                price: Math.round(subtotal / Math.max(1, tParts.length))
              });
            }
          }
        }
        if (splitTests.length === 0) {
          splitTests = [{ id: "t-01", name: tName || "Diagnostic Test", price: subtotal }];
        }

        var apptDateStr = "";
        if (rawDate) {
          if (rawDate.indexOf("T") >= 0) {
            apptDateStr = rawDate.split("T")[0];
          } else {
            var dParsed = new Date(rawDate);
            if (!isNaN(dParsed.getTime())) {
              var pY = dParsed.getFullYear();
              var pM = String(dParsed.getMonth() + 1);
              if (pM.length < 2) pM = "0" + pM;
              var pD = String(dParsed.getDate());
              if (pD.length < 2) pD = "0" + pD;
              apptDateStr = pY + "-" + pM + "-" + pD;
            }
          }
        }

        orders.push({
          id: cleanId,
          invoiceNumber: cleanInv,
          createdAt: rawDate || new Date().toISOString(),
          appointmentDate: apptDateStr || undefined,
          patientId: rawUhid || "",
          patient: {
            id: rawUhid || "",
            name: rawName || "",
            age: pAge,
            gender: pGender,
            phone: pPhone
          },
          tests: splitTests,
          subtotal: subtotal,
          discountAmount: discount,
          totalAmount: total,
          paidAmount: paid,
          dueAmount: due,
          paymentMode: payMode,
          paymentStatus: due <= 0 ? "PAID" : (paid > 0 ? "PARTIAL" : "DUE"),
          status: status,
          referringDoctorName: docName,
          commissionBeneficiaryName: beneficiary || undefined,
          createdByStaffName: cleanStaff,
          barcode: barcode || ("ATL-BAR-" + cleanInv),
          patientStatusRemark: remark,
          discountReason: colDiscountReason >= 0 ? String(row[colDiscountReason] || "") : (discount > 0 ? (remark ? remark + " concession" : "Doctor reference concession") : ""),
          refundAmount: 0,
          refundReason: "",
          centerCode: (name.replace("Orders_", "").replace(/_/g, "-") || "ATL-MAIN"),
          syncedToGoogleSheets: true
        });
      }
    }
  }

  return orders;
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
