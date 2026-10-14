import csv
import re
import openpyxl
import pypdf

def main():
    with open('data/Master_Diagnostics_Price_List_1170.csv', mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        tests = list(reader)

    print(f"Total tests in master catalog: {len(tests)}")

    duplicated_names = []
    encoding_issues = []
    garbage_suffixes = []
    known_typos = []

    # Common medical test spelling typos
    typo_map = {
        r'\bSONOGARPHY\b': 'SONOGRAPHY',
        r'\bCOLOAR\b': 'COLOR',
        r'\bPROGRESTERONE\b': 'PROGESTERONE',
        r'\bPROTIEN\b': 'PROTEIN',
        r'\bANTOBODY\b': 'ANTIBODY',
        r'\bMITROCHONDRIAL\b': 'MITOCHONDRIAL',
        r'\bAdiponetin\b': 'Adiponectin',
        r'\bPERINIUM\b': 'PERINEUM',
        r'\bGASTROGRAFFIN\b': 'GASTROGRAFIN',
        r'\bPRA Ration\b': 'PRA Ratio',
        r'\bIgGM\b': 'IgM',
        r'\bANTIBODIE\b': 'ANTIBODIES',
        r'\bLUMBER SPINE\b': 'LUMBAR SPINE',
        r'\bNASO PHARYNX\b': 'NASOPHARYNX',
        r'\bTHYROID STIMULATIG\b': 'THYROID STIMULATING',
    }

    for idx, t in enumerate(tests):
        name = t['Test Name']
        tid = t['Test ID']

        # 1. Encoding issues (UTF-8 mojibake)
        if any(c in name for c in ['â', '€', '™', '']):
            encoding_issues.append((tid, name))

        # 2. Garbage suffix like (-1), (-2), etc.
        if re.search(r'\(\s*-\d+\s*\)', name):
            garbage_suffixes.append((tid, name))

        # 3. Repeated name in parentheses: e.g. "Test Name ( Test Name )" or "Test (Abbr) ( Test (Abbr) )"
        # Match pattern: A ( B ) where B is identical to A or B is inside A
        dup_match = re.search(r'^(.*?)\s*\(\s*(.*?)\s*\)$', name)
        if dup_match:
            left = dup_match.group(1).strip()
            right = dup_match.group(2).strip()
            # If right is identical to left, or right repeats words in left
            if left.lower() == right.lower():
                duplicated_names.append((tid, name, f"Exact duplicate: '{left}'"))
            elif right.lower() in left.lower():
                duplicated_names.append((tid, name, f"Right in Left: '{right}' in '{left}'"))
            elif left.lower() in right.lower():
                duplicated_names.append((tid, name, f"Left in Right: '{left}' in '{right}'"))

        # 4. Known typos
        for pat, fix in typo_map.items():
            if re.search(pat, name, flags=re.IGNORECASE):
                known_typos.append((tid, name, pat, fix))

    print(f"\n1. Duplicated parenthetical names found: {len(duplicated_names)}")
    for d in duplicated_names[:15]:
        print(f"   [{d[0]}] {d[1]}  --> {d[2]}")

    print(f"\n2. Encoding artifacts found: {len(encoding_issues)}")
    for e in encoding_issues[:10]:
        print(f"   [{e[0]}] {e[1]}")

    print(f"\n3. Garbage suffixes found: {len(garbage_suffixes)}")
    for g in garbage_suffixes[:10]:
        print(f"   [{g[0]}] {g[1]}")

    print(f"\n4. Known typos found: {len(known_typos)}")
    for k in known_typos[:15]:
        print(f"   [{k[0]}] {k[1]}  --> Typo: {k[2]} -> {k[3]}")

if __name__ == '__main__':
    main()
