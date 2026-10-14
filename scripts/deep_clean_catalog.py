import csv
import re
import sys
import openpyxl

sys.stdout.reconfigure(encoding='utf-8')

def deep_clean_name(name):
    orig = name.strip()
    name = orig

    # 1. Remove empty parentheses ()
    name = re.sub(r'\s*\(\s*\)', '', name)

    # 2. Check if the string ends with a parenthetical expression that repeats the main name
    # We can match: string ends with ' ( ' + prefix + ' )'
    # Or string has form: A ( A )
    # Let's check all possible split points of outer parentheses
    # Balanced parenthesis matching from the end:
    if name.endswith(')'):
        depth = 0
        split_idx = -1
        for i in range(len(name) - 1, -1, -1):
            if name[i] == ')':
                depth += 1
            elif name[i] == '(':
                depth -= 1
                if depth == 0:
                    split_idx = i
                    break

        if split_idx > 0:
            left = name[:split_idx].strip()
            right = name[split_idx + 1:-1].strip()

            # Clean right from any leading/trailing spaces
            if left.lower() == right.lower():
                name = left
            elif right.lower().startswith(left.lower()):
                name = right
            elif left.lower().startswith(right.lower()) and len(right) > 5:
                # If left already contains right, e.g. "BLOOD UREA (UREA)" -> "BLOOD UREA"
                # But keep clinical qualifiers like "(Serum)", "(EDTA)", "(Urine)", "(Child)", "(Twins)"
                qualifiers = ['serum', 'edta', 'urine', 'child', 'twins', 'single', 'both', 'fluid', 'swab', 'fasting', 'prandial', 'random']
                if not any(q in right.lower() for q in qualifiers) and (right.lower() in left.lower()):
                    name = left
            elif left.lower() in right.lower():
                # E.g. "BODY FLUID(BRONCHIAL LAVAGE) ROUTINE & MICRO. (BODY FLUID(BRONCHIAL LAVAGE) ROUTINE & MICRO.)"
                name = left

    # 3. Additional medical typos and cleanup
    typos = [
        (r'\bCHOLESTROL\b', 'CHOLESTEROL'),
        (r'\bROUTEIN\b', 'ROUTINE'),
        (r'\bCREAT\b\)', 'CREATININE)'),
        (r'\bCHOL\b\)', 'CHOLESTEROL)'),
        (r'\bBODY FLUID\(PERICARDIAL\)ROUTEIN\b', 'BODY FLUID (PERICARDIAL) ROUTINE'),
        (r'\bBODY FLUID\(BRONCHIAL LAVAGE\)', 'BODY FLUID (BRONCHIAL LAVAGE)'),
        (r'\bBODY FLUID\(LIVER AB\.\)', 'BODY FLUID (LIVER ABSCESS)'),
        (r'\bBODY FLUID\(SYNOVIAL FLUID\)', 'BODY FLUID (SYNOVIAL FLUID)'),
        (r'\bBeta Thalassemia\(WB\)-OUTLAB', 'Beta Thalassemia (Whole Blood)'),
        (r'\bCEA-Carcino Embryonic Antigen \(CEA\)', 'CEA - Carcinoembryonic Antigen'),
        (r'\bBUN-Blood Urea Nitrogen \(BUN\)', 'BUN - Blood Urea Nitrogen'),
        (r'\bCRP - C Reactive Protein \(CRP\)', 'CRP - C-Reactive Protein'),
        (r'\bCOVID19 Qualitative by Real Time PCR', 'COVID-19 Qualitative by Real-Time PCR'),
        (r'\bASO titre Quantitative \(ASO\)', 'ASO Titre Quantitative'),
        (r'\bBLOOD UREA \(UREA\)', 'BLOOD UREA'),
        (r'\bCB NAAT / TB PCR \(CB NAAT\)', 'CB-NAAT / TB PCR (GeneXpert)'),
    ]

    for pat, rep in typos:
        name = re.sub(pat, rep, name, flags=re.IGNORECASE)

    # Clean whitespace
    name = re.sub(r'\s+', ' ', name).strip()
    name = re.sub(r'\s*\(\s*', ' (', name)
    name = re.sub(r'\s*\)\s*', ') ', name)
    name = re.sub(r'\s+', ' ', name).strip()

    return name

def main():
    with open('data/Master_Diagnostics_Price_List_1170.csv', mode='r', encoding='utf-8-sig') as f:
        tests = list(csv.DictReader(f))

    changed = []
    cleaned_tests = []
    for t in tests:
        orig = t['Test Name']
        cleaned = deep_clean_name(orig)
        if cleaned != orig:
            changed.append((t['Test ID'], orig, cleaned))
        t_clean = dict(t)
        t_clean['Test Name'] = cleaned
        cleaned_tests.append(t_clean)

    print(f"Deep cleaned {len(changed)} tests!")
    for tid, orig, clean in changed[:25]:
        print(f"[{tid}]")
        print(f"  BEFORE: {orig}")
        print(f"  AFTER:  {clean}")

    # Write cleaned CSV
    fieldnames = list(cleaned_tests[0].keys())
    with open('data/Master_Diagnostics_Price_List_1170.csv', mode='w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(cleaned_tests)

    # Write cleaned Excel
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = 'Master_Test_Catalog'
    ws.append(fieldnames)
    for t in cleaned_tests:
        ws.append([t[k] for k in fieldnames])
    wb.save('data/Master_Diagnostics_Price_List_1170.xlsx')

    print("\nSaved deeply cleaned CSV and Excel files.")

if __name__ == '__main__':
    main()
