import base64
from PIL import Image

gen_path = r"C:\Users\1107s\.gemini\antigravity\brain\926cfc17-5f84-45d1-a86f-0add9518d160\atlas_logo_enhanced_1790749762734.jpg"
img = Image.open(gen_path)
print("Enhanced Logo Dimensions:", img.size)

# Resize to standard crisp 1024x1024 if needed
img = img.resize((1024, 1024), Image.Resampling.LANCZOS)

# Save PNG and JPEG formats across public and src
img.save("src/assets/logo.png", "PNG", optimize=True)
img.save("src/assets/logo.jpeg", "JPEG", quality=95, optimize=True)
img.save("public/logo.png", "PNG", optimize=True)
img.save("public/logo.jpeg", "JPEG", quality=95, optimize=True)
img.save("data/logo_enhanced.png", "PNG", optimize=True)

with open("src/assets/logo.png", "rb") as f:
    b64_png = base64.b64encode(f.read()).decode("utf-8")

with open("src/assets/logo.ts", "w", encoding="utf-8") as f:
    f.write('export const ATLAS_LOGO_DATA_URI = "data:image/png;base64,' + b64_png + '";\n')

print("Successfully generated ultra high-res logo and updated src/assets/logo.ts")
