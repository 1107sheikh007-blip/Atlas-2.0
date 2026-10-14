import csv
import re
import json
import openpyxl

def clean_test_name(raw_name):
    name = raw_name.strip()

    # 1. Fix UTF-8 encoding corruptions
    name = name.replace('â €“', '-').replace('â€“', '-').replace('â€™', "'").replace('â€˜', "'").replace('â€', '')
    name = name.replace('\u00e2\u20ac\u201c', '-').replace('\u2013', '-').replace('\u2014', '-')

    # 2. Fix garbage suffix like ( -1 ), ( -2 )
    name = re.sub(r'\s*\(\s*-\d+\s*\)', '', name)

    # 3. Clean up duplicate parentheses / repeated names:
    # Pattern A: "Name (Abbr) ( Name (Abbr) )"
    nested_dup = re.search(r'^(.*?)\s*\(\s*(.*?)\s*\)\s*\(\s*(.*?)\s*\)\s*$', name)
    if nested_dup:
        part1 = nested_dup.group(1).strip()
        part2 = nested_dup.group(2).strip()
        part3 = nested_dup.group(3).strip()
        combined_left = f"{part1} ({part2})"
        if combined_left.lower() == part3.lower() or part1.lower() in part3.lower():
            name = combined_left
        elif part2.lower() == part3.lower():
            name = combined_left

    # Pattern B: "Name ( Name )" or "Name (Name-Something)"
    dup_match = re.search(r'^(.*?)\s*\(\s*(.*?)\s*\)$', name)
    if dup_match:
        left = dup_match.group(1).strip()
        right = dup_match.group(2).strip()
        if left.lower() == right.lower():
            name = left
        elif right.lower().startswith(left.lower()):
            name = right
        elif left.lower().endswith(right.lower()) and len(right) > 4:
            name = left
        elif right.lower() in left.lower() and len(right) > 10:
            name = left

    # Pattern C: Leftover duplicate words like "X ( X )"
    name = re.sub(r'\(\s*([A-Za-z0-9\s\.\/\-\+]+?)\s*\)\s*\(\s*\1\s*\)', r'(\1)', name, flags=re.IGNORECASE)

    # 4. Fix medical spelling typos
    typo_replacements = [
        (r'\bSONOGARPHY\b', 'SONOGRAPHY'),
        (r'\bCOLOAR\b', 'COLOR'),
        (r'\bPROGRESTERONE\b', 'PROGESTERONE'),
        (r'\bPROTIEN\b', 'PROTEIN'),
        (r'\bANTOBODY\b', 'ANTIBODY'),
        (r'\bANTIBODIE\b', 'ANTIBODIES'),
        (r'\bMITROCHONDRIAL\b', 'MITOCHONDRIAL'),
        (r'\bAdiponetin\b', 'Adiponectin'),
        (r'\bPERINIUM\b', 'PERINEUM'),
        (r'\bGASTROGRAFFIN\b', 'GASTROGRAFIN'),
        (r'\bLUMBER SPINE\b', 'LUMBAR SPINE'),
        (r'\bNASO PHARYNX\b', 'NASOPHARYNX'),
        (r'\bPRA Ration\b', 'PRA Ratio'),
        (r'\bIgGM\b', 'IgM'),
        (r'\bDOPLAR\b', 'DOPPLER'),
        (r'\bOBSTETRIC\s+DOPPLER\s+SCAN\s+\(TWINS\s*\)', 'OBSTETRIC DOPPLER SCAN (TWINS)'),
        (r'\bTARGET SCAN\s+\(\s*TWINS\)', 'TARGET SCAN (TWINS)'),
        (r'\bUPPERR\b', 'UPPER'),
        (r'\bTHYROID STIMULATIG\b', 'THYROID STIMULATING'),
        (r'\bTRI IODO THYRONINE\b', 'TRIIODOTHYRONINE'),
    ]

    for pat, rep in typo_replacements:
        name = re.sub(pat, rep, name, flags=re.IGNORECASE)

    # 5. Fix inconsistent casing for specific tests
    casing_fixes = {
        'ct chest': 'CT Chest',
        'CT  brain': 'CT Brain',
        'CT  PNS': 'CT PNS',
        'head ct scan': 'CT Head / Brain',
        'ct contrast 1': 'CT Contrast 1',
        'ct contrast 2': 'CT Contrast 2',
        'ct contrast 3': 'CT Contrast 3',
        'ct contrast 4': 'CT Contrast 4',
        'fnac': 'FNAC (Fine Needle Aspiration Cytology)',
        'ncv ncv': 'NCV (Nerve Conduction Velocity)'
    }
    name_clean = name.strip()
    if name_clean.lower() in casing_fixes:
        name = casing_fixes[name_clean.lower()]

    # 6. Specific special case cleanup for duplicated medical names
    special_fixes = {
        '24 Hrs Urinary Metabolic Profile (Urocare) ( 24 Hrs Urinary Metabolic Profile (Urocare) )': '24 Hrs Urinary Metabolic Profile (Urocare)',
        '24 Hrs. URINE PORPHYRINS (SRL) ( 24 Hrs. URINE PORPHYRINS (SRL) )': '24 Hrs. Urine Porphyrins (SRL)',
        '24-Hrs. URINE-(COPPER) ( 24-Hrs. URINE-(COPPER) )': '24-Hrs. Urine Copper',
        '2D ECHO ( ECHO CARDIOGRAPHY ) ( 2D ECHO ( ECHO CARDIOGRAPHY ) )': '2D Echo (Echocardiography)',
        '5-HIAA (Hydroxy Indole Acetic Acid) ( 5-HIAA (Hydroxy Indole Acetic Acid) )': '5-HIAA (5-Hydroxyindoleacetic Acid)',
        'ACA (Anti Cardiolipin Antibodies) IgG/Ig M ( ACA (Anti Cardiolipin Antibodies) IgG/Ig M )': 'ACA (Anti Cardiolipin Antibodies) IgG/IgM',
        'ACETONE (SERUM) ( ACETONE (SERUM) )': 'Acetone (Serum)',
        'ADA (Adenosine Deaminase) ( ADA )': 'ADA (Adenosine Deaminase)',
        'ADH (Anti diuretic hormone)Vasopressin plasma ( ADH (Anti diuretic hormone)Vasopressin plasma )': 'ADH (Antidiuretic Hormone) / Vasopressin Plasma',
        'ALPHA FETO PROTIEN (AFP) ( AFP ALPHA FETO PROTIEN- )': 'Alpha Fetoprotein (AFP)',
        'ALPHA FETO PROTIEN (AFP) ( AFP ALPHA FETO PROTIEN )': 'Alpha Fetoprotein (AFP)',
        'ALBUMIN (FLUID) ( ALBUMIN (FLUID) )': 'Albumin (Fluid)',
        'ALLERGY FOOD PANEL(VEG.) ( ALLERGY FOOD PANEL(VEG.) )': 'Allergy Food Panel (Vegetarian)',
        'ALLERGY FOODPANEL(VEG.NONVEG) ( ALLERGY FOODPANEL(VEG.NONVEG) )': 'Allergy Food Panel (Veg & Non-Veg)',
        'ALLERGY TEST COMPLETE PANEL(Mini) ( ALLERGY TEST COMPLETE PANEL(Mini) )': 'Allergy Test Complete Panel (Mini)',
        'Amino Acids Quantitative HPLC (Urine) ( Amino Acids Quantitative HPLC (Urine) )': 'Amino Acids Quantitative HPLC (Urine)',
        'Amoebiasis Antibodies-(IgG) ( Amoebiasis Antibodies-(IgG) )': 'Amoebiasis Antibodies (IgG)',
        'ANA(ELISA) ( ANA(ELISA) )': 'ANA (ELISA)',
        'Anti  HEV Antibody - IgM(Qualitative) ( HEV-IGM )': 'Anti HEV Antibody - IgM (Qualitative)',
        'Anti HAV â €“ IgG (Quantitative) ( Anti HAV â€“ IgG (Quantitative) )': 'Anti HAV - IgG (Quantitative)',
        'Anti HAV Antibody - IgM(Qualitative) ( HAV-IGM )': 'Anti HAV Antibody - IgM (Qualitative)',
        'Anti HBe ( HBe )': 'Anti HBe',
        'Anti HAV IgM (QUANTITATIVE)  ( Anti HAV IgM (QUANTITATIVE)  )': 'Anti HAV IgM (Quantitative)',
        'Anti HCV by ELISA ( Anti HCV ELISA )': 'Anti HCV by ELISA',
        'Anti Hepatitis C Virus (HCV)  ( HCV )': 'Anti Hepatitis C Virus (HCV)',
        'ANTI HEPATITIS E VIRUS (HEV) - IgM ( HEV IGM (QUANTITATIVE) )': 'Anti Hepatitis E Virus (HEV) - IgM (Quantitative)',
        'ANTI MITROCHONDRIAL ANTIBODY(AMA) ( AMA )': 'Anti Mitochondrial Antibody (AMA)',
        'Anti NMO(Neuromyelitis Optica Antibody) ( Anti NMO(Neuromyelitis Optica Antibody) )': 'Anti NMO (Neuromyelitis Optica Antibody)',
        'ANTI PHOSPHOLIPID ANTIBODY (APL) - IgG ( ANTI PHOSPHOLIPID ANTIBODY (APL) - IgG )': 'Anti Phospholipid Antibody (APL) - IgG',
        'ANTI PHOSPHOLIPID ANTIBODY (APL) - IgM ( ANTI PHOSPHOLIPID ANTIBODY (APL) - IgGM )': 'Anti Phospholipid Antibody (APL) - IgM',
        'ANTI SMOOTH MUSCLE ANTIBODIES(ASMA) ( ASMA )': 'Anti Smooth Muscle Antibodies (ASMA)',
        'ANTI SOLUBLE LIVER ANTIGEN (SLA) AB ( ANTI SOLUBLE LIVER ANTIGEN (SLA) AB )': 'Anti Soluble Liver Antigen (SLA) Antibody',
        'ANTI SPERM ANTIBODIES(ELISA) ( ANTI SPERM ANTIBODIES(ELISA) )': 'Anti Sperm Antibodies (ELISA)',
        'ANTI THYROGLOBULIN ANTIBODIES(Anti TG) ( ANTI THYROGLOBULIN ANTIBODIES(Anti TG) )': 'Anti Thyroglobulin Antibodies (Anti TG)',
        'Aldosterone/Renin Ratio Aldosterone/PRA Ration': 'Aldosterone / Renin Ratio (ARR)',
        'SAAG ( -1 )': 'Serum-Ascites Albumin Gradient (SAAG)',
        'ANA BY IFA ( -1 )': 'ANA by IFA',
        'ANCA C & ANCA-P ( -1 )': 'ANCA-C & ANCA-P',
        'ECG ( -1 )': 'ECG (Electrocardiogram)',
        'MATERNAL SCREENING - DUAL MARKER ( -1 )': 'Maternal Screening - Dual Marker',
        'SERUM PROTEIN ELECTROPHORESIS ( -1 )': 'Serum Protein Electrophoresis',
        'Air Sampling ( -1 )': 'Air Sampling / Quality Culture'
    }

    if name in special_fixes:
        name = special_fixes[name]

    # 7. Clean whitespace and parenthesis spacing
    name = re.sub(r'\s+', ' ', name)
    name = re.sub(r'\(\s+', '(', name)
    name = re.sub(r'\s+\)', ')', name)
    name = re.sub(r'\{\s*', '(', name)
    name = re.sub(r'\s*\}', ')', name)

    return name.strip()

def run_cleaning():
    with open('data/Master_Diagnostics_Price_List_1170.csv', mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        tests = list(reader)

    print(f"Loaded {len(tests)} tests for cleaning.")

    changed_tests = []
    cleaned_tests = []

    for t in tests:
        orig_name = t['Test Name']
        cleaned_name = clean_test_name(orig_name)

        if cleaned_name != orig_name:
            changed_tests.append((t['Test ID'], orig_name, cleaned_name))

        # Copy test with cleaned name
        t_clean = dict(t)
        t_clean['Test Name'] = cleaned_name
        cleaned_tests.append(t_clean)

    print(f"Successfully cleaned and improved {len(changed_tests)} test names!")
    print("\nSample Cleaned Tests (First 20):")
    for tid, orig, clean in changed_tests[:20]:
        print(f"[{tid}]")
        print(f"   OLD: {orig}")
        print(f"   NEW: {clean}")

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

    print("\nSaved updated CSV and Excel files.")

if __name__ == '__main__':
    run_cleaning()
