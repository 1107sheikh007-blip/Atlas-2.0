import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Regex for common emojis
emoji_pattern = re.compile(
    "["
    "\U0001F600-\U0001F64F"  # emoticons
    "\U0001F300-\U0001F5FF"  # symbols & pictographs
    "\U0001F680-\U0001F6FF"  # transport & map
    "\U0001F1E0-\U0001F1FF"  # flags (iOS)
    "\U00002702-\U000027B0"
    "\U000024C2-\U0001F251"
    "\U0001F900-\U0001F9FF"  # supplemental symbols
    "\U0001FA70-\U0001FAFF"  # medical symbols etc (stethoscope, etc)
    "\U00002600-\U000026FF"  # misc symbols
    "]+", flags=re.UNICODE
)

results = []
for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            path = os.path.join(root, file).replace('\\', '/')
            with open(path, 'r', encoding='utf-8') as f:
                for line_idx, line in enumerate(f, 1):
                    matches = emoji_pattern.findall(line)
                    # Filter out allowed symbols
                    emojis = [m for m in matches if m not in ['\u20b9']]
                    if emojis:
                        results.append((path, line_idx, emojis, line.strip()))

print(f"Total lines with emojis in src/: {len(results)}")
for path, line_no, emojis, text in results:
    print(f"{path}:{line_no} [{', '.join(emojis)}] -> {text}")
