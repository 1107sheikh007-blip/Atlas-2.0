import csv
import collections
import sys

sys.stdout.reconfigure(encoding='utf-8')

def main():
    with open('data/Master_Diagnostics_Price_List_1170.csv', mode='r', encoding='utf-8-sig') as f:
        tests = list(csv.DictReader(f))

    names = [t['Test Name'].strip().upper() for t in tests]
    counts = collections.Counter(names)
    dups = {k: v for k, v in counts.items() if v > 1}
    print(f"Total test names that appear more than once: {len(dups)}")
    for k, v in dups.items():
        matches = [f"{t['Test ID']} ({t['Category']} / {t['Department']}, ₹{t['Standard MRP (₹)']})" for t in tests if t['Test Name'].strip().upper() == k]
        print(f"\n  • \"{k}\" ({v} times):")
        for m in matches:
            print(f"      - {m}")

if __name__ == '__main__':
    main()
