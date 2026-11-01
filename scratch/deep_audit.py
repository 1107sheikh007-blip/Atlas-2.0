import urllib.request, json, openpyxl, re

wb = openpyxl.load_workbook('Data/Atlas_Diagnostics_Orders_Master_Cleaned.xlsx', data_only=True)
ws = wb['Orders_ATL_MAIN']
rows = list(ws.iter_rows(values_only=True))
headers = rows[0]

res = urllib.request.urlopen('https://script.google.com/macros/s/AKfycbx7lf5tjL1_kmqGMmw2tpwaR33geHoCQECxG6tkwEAXcyBnaiu73wvOpQawusAZ8HE/exec?action=GET_ALL_DATA')
sheet_data = json.loads(res.read().decode('utf-8'))
sheet_orders = sheet_data.get('orders', [])

print(f'Excel rows: {len(rows)-1}, Sheet orders: {len(sheet_orders)}')

# Compare invoice numbers
excel_invs = {r[0]: r for r in rows[1:] if r[0]}
sheet_invs = {o.get('invoiceNumber'): o for o in sheet_orders if o.get('invoiceNumber')}

only_in_excel = set(excel_invs.keys()) - set(sheet_invs.keys())
only_in_sheet = set(sheet_invs.keys()) - set(excel_invs.keys())

print(f'Invoices only in Excel: {len(only_in_excel)}')
print(f'Invoices only in Sheets: {len(only_in_sheet)}')

# Value comparisons for matching invoices
diff_counts = {
    'patient_name': [],
    'referring_doc': [],
    'beneficiary': [],
    'total_amount': [],
    'paid_amount': [],
    'uhid': []
}

for inv, e_row in excel_invs.items():
    if inv not in sheet_invs: continue
    s_order = sheet_invs[inv]
    
    # Excel cols: 0:Inv, 1:Date, 2:UHID, 3:Patient, 8:Doc, 9:Total, 12:Paid, 18:Phone, 19:Ben
    e_uhid = str(e_row[2] or '').strip()
    s_uhid = str(s_order.get('uhid') or (s_order.get('patient') or {}).get('uhid') or '').strip()
    if e_uhid and s_uhid and e_uhid != s_uhid:
        diff_counts['uhid'].append((inv, e_uhid, s_uhid))
        
    e_pat = str(e_row[3] or '').strip().lower()
    s_pat = str((s_order.get('patient') or {}).get('name') or '').strip().lower()
    if e_pat != s_pat:
        diff_counts['patient_name'].append((inv, e_row[3], (s_order.get('patient') or {}).get('name')))
        
    e_doc = str(e_row[8] or '').strip().lower()
    s_doc = str(s_order.get('referringDoctorName') or '').strip().lower()
    if e_doc != s_doc:
        diff_counts['referring_doc'].append((inv, e_row[8], s_order.get('referringDoctorName')))
        
    e_ben = str(e_row[19] or '').strip().lower()
    s_ben = str(s_order.get('commissionBeneficiaryName') or '').strip().lower()
    if e_ben != s_ben:
        diff_counts['beneficiary'].append((inv, e_row[19], s_order.get('commissionBeneficiaryName')))
        
    e_tot = float(e_row[9] or 0)
    s_tot = float(s_order.get('totalAmount') or s_order.get('subtotal') or 0)
    if abs(e_tot - s_tot) > 1:
        diff_counts['total_amount'].append((inv, e_tot, s_tot))

print('\n=== COMPARISON BETWEEN EXCEL MASTER AND LIVE GOOGLE SHEETS ===')
for field, diffs in diff_counts.items():
    print(f'{field}: {len(diffs)} differences')
    for d in diffs[:4]:
        print(f'   Invoice {d[0]}: Excel="{d[1]}" vs Sheet="{d[2]}"')
