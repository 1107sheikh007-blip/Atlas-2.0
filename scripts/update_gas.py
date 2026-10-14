with open('google_apps_script.js', 'r', encoding='utf-8') as f:
    gas = f.read()

with open('backend/CatalogData.js', 'r', encoding='utf-8') as f:
    cat = f.read()

# Replace old order headers in setupAllSheets
old_headers = '''  var orderHeaders = [
    "Date", "Patient Name", "Patient Investigation", "MRP (₹)", "Discount (₹)",
    "Paid Amount (₹)", "Due by Patient (₹)", "Invoice #", "Barcode", "UHID",
    "Age / Gender", "Phone", "Referrer / Partner", "Payment Mode", "Status",
    "Billed By", "Center Code"
  ];'''

new_headers = '''  var orderHeaders = [
    "Invoice No", "Date & Time", "UHID", "Patient Name", "Age/Gender", "Phone",
    "Tests Ordered", "Referring Doctor", "Subtotal (₹)", "Discount (₹)", "Net Total (₹)",
    "Paid (₹)", "Due (₹)", "Payment Mode", "Payment Status", "Barcode", "Diagnostic Status", "WhatsApp Sent"
  ];'''

if old_headers in gas:
    gas = gas.replace(old_headers, new_headers)
    print('Updated orderHeaders in setupAllSheets')
else:
    print('Warning: old_headers not found in gas')

# Replace appendOrderRow
old_append_start = 'function appendOrderRow(ss, ord, centerCode) {'
old_append_end = 'function appendExpenseRow(ss, exp) {'

idx1 = gas.find(old_append_start)
idx2 = gas.find(old_append_end)

if idx1 != -1 and idx2 != -1:
    new_append = '''function appendOrderRow(ss, ord, centerCode) {
  var spreadsheet = getSpreadsheet(ss);
  var cleanCode = (centerCode || "ATL_MAIN").replace(/[^a-zA-Z0-9]/g, "_");
  var sheetName = "Orders_" + cleanCode;
  var sheet = getOrCreateSheet(spreadsheet, sheetName);

  var testsList = (ord.tests || []).map(function(t) { return t.name; }).join(", ");
  var mrp = ord.subtotal || (ord.tests || []).reduce(function(s, t) { return s + (t.price || 0); }, 0);
  var discount = ord.discountAmount || 0;
  var netTotal = (ord.totalAmount !== undefined) ? ord.totalAmount : (mrp - discount);
  var paid = ord.paidAmount || 0;
  var due = (ord.dueAmount !== undefined) ? ord.dueAmount : Math.max(0, netTotal - paid);
  var invoiceNo = ord.invoiceNumber || ord.id || "";
  var dateStr = ord.createdAt || new Date().toISOString();
  var uhid = ord.patientId || (ord.patient ? ord.patient.id : "N/A");
  var patientName = ord.patient ? ord.patient.name : "N/A";
  var ageGender = ord.patient ? (ord.patient.age + "Y / " + ord.patient.gender) : "N/A";
  var phone = ord.patient ? ord.patient.phone : "N/A";
  var refDoc = ord.referringDoctorName || "Direct / Walk-in";
  var payMode = ord.paymentMode || "Cash";
  var payStatus = ord.paymentStatus || (due <= 0 ? "PAID" : (paid > 0 ? "PARTIAL" : "PENDING"));
  var barcode = ord.barcode || "N/A";
  var diagStatus = ord.status || "SAMPLE_COLLECTED";
  var whatsappSent = ord.whatsappSent ? "YES" : "NO";

  // Check existing header format
  var firstCell = sheet.getLastRow() > 0 ? String(sheet.getRange(1, 1).getValue()).trim() : "";

  var rowData;
  if (firstCell === "Date") {
    // Legacy header layout support
    rowData = [
      dateStr, patientName, testsList, mrp, discount, paid, due,
      invoiceNo, barcode, uhid, ageGender, phone, refDoc, payMode,
      diagStatus, ord.createdByStaffName || "Reception Staff", centerCode || "ATL-MAIN"
    ];
  } else {
    // Modern 18-column schema (User's Google Sheet default)
    rowData = [
      invoiceNo, dateStr, uhid, patientName, ageGender, phone,
      testsList, refDoc, mrp, discount, netTotal, paid, due,
      payMode, payStatus, barcode, diagStatus, whatsappSent
    ];
  }

  sheet.appendRow(rowData);

  var allOrdersSheet = spreadsheet.getSheetByName("Orders_ALL");
  if (allOrdersSheet && allOrdersSheet.getLastRow() > 0) {
    var allFirstCell = String(allOrdersSheet.getRange(1, 1).getValue()).trim();
    if (allFirstCell === "Date") {
      allOrdersSheet.appendRow([
        dateStr, patientName, testsList, mrp, discount, paid, due,
        invoiceNo, barcode, uhid, ageGender, phone, refDoc, payMode,
        diagStatus, ord.createdByStaffName || "Reception Staff", centerCode || "ATL-MAIN"
      ]);
    } else {
      allOrdersSheet.appendRow([
        invoiceNo, dateStr, uhid, patientName, ageGender, phone,
        testsList, refDoc, mrp, discount, netTotal, paid, due,
        payMode, payStatus, barcode, diagStatus, whatsappSent
      ]);
    }
  }
}

'''
    gas = gas[:idx1] + new_append + gas[idx2:]
    print('Updated appendOrderRow')
else:
    print('Warning: appendOrderRow slice not found')

# Append getMasterCatalogData at the bottom if not already in gas
if 'getMasterCatalogData' not in gas or 'return [["t-usg-001"' not in gas:
    gas = gas + '\n\n' + cat
    print('Appended getMasterCatalogData to gas')

with open('google_apps_script.js', 'w', encoding='utf-8') as f:
    f.write(gas)

with open('backend/GoogleAppsScript_Backend.js', 'w', encoding='utf-8') as f:
    f.write(gas)

print('Successfully updated google_apps_script.js and backend/GoogleAppsScript_Backend.js')
