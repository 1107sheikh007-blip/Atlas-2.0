import openpyxl

wb = openpyxl.load_workbook('Data/Atlas_Diagnostics_Orders_Master_Cleaned.xlsx', data_only=True)
ws = wb['Orders_ATL_MAIN']
rows = list(ws.iter_rows(values_only=True))[1:]

diff_doc_ben = []
same_doc_ben = []
self_orders = []

for r in rows:
    if not r[0]: continue
    inv = r[0]
    doc = str(r[8] or '').strip()
    ben = str(r[19] or '').strip()
    total = r[9]
    
    if 'self' in ben.lower():
        self_orders.append((inv, doc, ben, total))
    elif doc.lower() != ben.lower():
        diff_doc_ben.append((inv, doc, ben, total))
    else:
        same_doc_ben.append((inv, doc, ben, total))

print(f'Total Valid Orders: {len(self_orders) + len(diff_doc_ben) + len(same_doc_ben)}')
print(f'1. Self-Beneficiary (Commission goes to Atlas Self / None): {len(self_orders)} orders')
print(f'2. Decoupled Beneficiary (Doctor prescribes, but Commission goes to separate Hospital / Organization / Person): {len(diff_doc_ben)} orders')
print(f'3. Self-Referred Doctor (Doctor is their own Beneficiary): {len(same_doc_ben)} orders')

print('\nSample Decoupled Orders (Doctor != Beneficiary):')
for item in diff_doc_ben[:8]:
    print(f'  Inv: {item[0]} | Prescribing Doctor: {item[1]} | Commission Beneficiary: {item[2]} | Amount: {item[3]}')
