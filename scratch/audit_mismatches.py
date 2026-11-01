import urllib.request, json, re

res = urllib.request.urlopen('https://script.google.com/macros/s/AKfycbx7lf5tjL1_kmqGMmw2tpwaR33geHoCQECxG6tkwEAXcyBnaiu73wvOpQawusAZ8HE/exec?action=GET_ALL_DATA')
sheet_data = json.loads(res.read().decode('utf-8'))
orders = sheet_data.get('orders', [])
doctors = sheet_data.get('doctors', [])
patients = sheet_data.get('patients', [])

def norm(name):
    s = str(name or '').lower()
    s = re.sub(r'^(dr\.?|doctor|mr\.?|mrs\.?|ms\.?|prof\.?|pt\.?)\s*', '', s)
    s = re.sub(r'[^a-z0-9]', '', s)
    s = s.replace('sh', 's').strip()
    return s

registered_names = {norm(d.get('name')) for d in doctors if d.get('name')}
registered_orgs = {norm(d.get('organizationName')) for d in doctors if d.get('organizationName')}
registered_hosps = {norm(d.get('hospital')) for d in doctors if d.get('hospital')}
registered_all = registered_names | registered_orgs | registered_hosps

unknown_docs = {}
unknown_bens = {}

for o in orders:
    inv = o.get('invoiceNumber') or o.get('orderId')
    doc = (o.get('referringDoctorName') or '').strip()
    ben = (o.get('commissionBeneficiaryName') or '').strip()
    
    n_doc = norm(doc)
    n_ben = norm(ben)
    
    if n_doc and n_doc not in ['walkin', 'direct', 'self', 'atlasself']:
        if not any(n_doc in r or r in n_doc for r in registered_all if len(r) >= 3):
            unknown_docs[doc] = unknown_docs.get(doc, 0) + 1
            
    if n_ben and n_ben not in ['walkin', 'direct', 'self', 'atlasself']:
        if not any(n_ben in r or r in n_ben for r in registered_all if len(r) >= 3):
            unknown_bens[ben] = unknown_bens.get(ben, 0) + 1

print('=== UNMATCHED PRESCRIBING DOCTORS IN ORDERS ===')
for k, v in sorted(unknown_docs.items(), key=lambda x: -x[1]):
    print(f'  - "{k}": {v} orders')

print('\n=== UNMATCHED BENEFICIARIES IN ORDERS ===')
for k, v in sorted(unknown_bens.items(), key=lambda x: -x[1]):
    print(f'  - "{k}": {v} orders')

# Check orders with missing patient link
orders_missing_patients = []
patient_uhids = {p.get('uhid') for p in patients if p.get('uhid')}
for o in orders:
    p = o.get('patient') or {}
    uhid = p.get('uhid') or o.get('uhid')
    if not uhid or uhid not in patient_uhids:
        orders_missing_patients.append((o.get('invoiceNumber'), p.get('name'), uhid))

print(f'\n=== ORDERS WITH UNMATCHED / MISSING PATIENT UHID: {len(orders_missing_patients)} ===')
for item in orders_missing_patients[:10]:
    print(' ', item)
