import os
import sys
import unicodedata

sys.stdout.reconfigure(encoding='utf-8')

allowed_chars = {
    8377, # ₹
    8217, # '
    8216, # '
    8220, # "
    8221, # "
    8211, # -
    8212, # --
    8230, # ...
    160,  # NBSP
    183,  # middle dot
    8226, # bullet •
    177,  # ±
    176,  # °
    181,  # µ
    946,  # β
    945,  # α
    947,  # γ
}

findings = []
for folder in ['src', 'index.html']:
    if os.path.isfile(folder):
        files = [folder]
    else:
        files = []
        for root, dirs, f_list in os.walk(folder):
            for f in f_list:
                if f.endswith(('.ts', '.tsx', '.css', '.html', '.js')):
                    files.append(os.path.join(root, f))

    for p in files:
        p_clean = p.replace('\\', '/')
        with open(p, 'r', encoding='utf-8') as fp:
            for idx, line in enumerate(fp, 1):
                weird = [ch for ch in line if ord(ch) > 127 and ord(ch) not in allowed_chars]
                if weird:
                    names = [f'U+{ord(c):04X}:{unicodedata.name(c, "UNK")}' for c in set(weird)]
                    findings.append((p_clean, idx, weird, names, line.strip()))

print(f"Total occurrences found: {len(findings)}")
for p, idx, weird, names, line in findings:
    print(f"{p}:{idx} {set(weird)} ({names}) -> {line[:80]}")
