import openpyxl
import pypdf
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

def compare_lists():
    # 1. Sonography list.xlsx
    wb = openpyxl.load_workbook('data/Sonography list.xlsx')
    ws = wb['Sheet1']
    excel_usg = []
    for r in list(ws.iter_rows(values_only=True))[1:]:
        if r and r[1]:
            excel_usg.append((str(r[1]).strip(), int(r[2]) if r[2] else 1000))

    print(f"Sonography list.xlsx: {len(excel_usg)} tests")

    # 2. Test Details (2).pdf pages 6 and 7 (USG section)
    reader2 = pypdf.PdfReader('data/Test Details (2).pdf')
    pdf_usg = []
    for p_num in [6, 7]:
        page = reader2.pages[p_num - 1]
        text = page.extract_text()
        for line in text.split('\n'):
            line = line.strip()
            if not line or 'Tests Rank' in line or 'Tests Short Name' in line:
                continue
            m = re.search(r'^(.*?)\s+([\d,]+)\s*$', line)
            if m:
                raw_name = m.group(1).strip()
                cleaned_name = re.sub(r'\s+\d+\s+(Radiology|Special\s+Test|Radio\s+CT|RADIO\s+MRI).*$', '', raw_name, flags=re.IGNORECASE).strip()
                cleaned_name = re.sub(r'\s+(Radiology|Special\s+Test|Radio\s+CT|RADIO\s+MRI)$', '', cleaned_name, flags=re.IGNORECASE).strip()
                rate = int(m.group(2).replace(',', ''))
                pdf_usg.append((cleaned_name, rate))

    print(f"Test Details (2).pdf USG pages: {len(pdf_usg)} tests")

    print("\nComparison between Sonography list.xlsx and Test Details (2).pdf:")
    excel_dict = {name.upper(): rate for name, rate in excel_usg}
    pdf_dict = {name.upper(): rate for name, rate in pdf_usg}

    diffs = []
    for name, rate in excel_dict.items():
        if name in pdf_dict:
            if pdf_dict[name] != rate:
                diffs.append(f"Price diff for '{name}': Excel has ₹{rate}, PDF had ₹{pdf_dict[name]}")
        else:
            diffs.append(f"Only in Excel: '{name}' (₹{rate})")

    for name, rate in pdf_dict.items():
        if name not in excel_dict:
            diffs.append(f"Only in PDF: '{name}' (₹{rate})")

    for d in diffs:
        print(" -", d)

if __name__ == '__main__':
    compare_lists()
