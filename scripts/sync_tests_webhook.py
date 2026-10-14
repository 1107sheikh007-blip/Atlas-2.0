import csv
import json
import urllib.request
import sys

def main():
    tests = []
    with open('data/Master_Diagnostics_Price_List_1170.csv', mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # find price column
            price = 0
            b2b = 0
            for k, v in row.items():
                if 'Standard MRP' in k:
                    try:
                        price = float(v)
                    except:
                        price = 0
                elif 'B2B' in k:
                    try:
                        b2b = float(v)
                    except:
                        b2b = 0

            tests.append({
                'id': row.get('Test ID', ''),
                'name': row.get('Test Name', ''),
                'category': row.get('Category', 'Pathology'),
                'department': row.get('Department', 'General'),
                'sampleType': row.get('Sample Type', ''),
                'tatHours': int(row['TAT (Hours)']) if row.get('TAT (Hours)', '').isdigit() else 4,
                'price': price,
                'b2bPrice': b2b or price,
                'fastingRequired': row.get('Fasting Required', '').strip().lower() == 'yes'
            })

    print(f"Prepared {len(tests)} tests to sync.")
    url = 'https://script.google.com/macros/s/AKfycbzJTcM5BSIGM5lGgyXVju3fMl9sovknr0hLKTSRaBX3wE5l_ayZfpOwj3rGF34EMF8y/exec'

    payload = json.dumps({'action': 'SYNC_TEST_CATALOG', 'tests': tests}).encode('utf-8')
    print(f"Payload size: {len(payload) / 1024:.2f} KB")

    req = urllib.request.Request(
        url,
        data=payload,
        headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'}
    )

    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            content = resp.read().decode('utf-8')
            print("Response:", content)
    except Exception as e:
        print("Error during sync:", e)

if __name__ == '__main__':
    main()
