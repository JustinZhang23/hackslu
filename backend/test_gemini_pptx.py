import os
import google.generativeai as genai

api_key = os.getenv("GEMINI_API_KEY") or os.getenv("VITE_GEMINI_API_KEY")
genai.configure(api_key=api_key)

model = genai.GenerativeModel("gemini-1.5-flash") # or 2.5-flash
# create a fake small zip file (pptx is a zip)
import zipfile, io
mem = io.BytesIO()
with zipfile.ZipFile(mem, 'w') as zf:
    zf.writestr('docProps/core.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>Test</dc:title></cp:coreProperties>')
fake_pptx = mem.getvalue()

try:
    response = model.generate_content([
        {"mime_type": "application/vnd.openxmlformats-officedocument.presentationml.presentation", "data": fake_pptx},
        "What is the title?"
    ])
    print("SUCCESS", response.text)
except Exception as e:
    print("FAILED", e)
