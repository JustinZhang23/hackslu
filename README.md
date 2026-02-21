# Crossword Generator (HackSLU 2026)

A high-performance, beautiful, and crash-resistant crossword construction tool. This app uses **Google Gemini 2.5 Flash** to extract concepts from presentations, PDFs, and images, automatically generating a playable crossword puzzle with an adaptive, professional UI.

## ✨ Features

- **Multimodal AI Extraction**: Upload PPTX, PDF, or JPG/PNG files. Gemini AI extracts key terms and generates contextual clues automatically.
- **Stable Layout Engine**: Uses a robust local generator to compute grid coordinates without the "White Screen of Death" crashes common in complex layout logic.
- **Professional UI**:
  - **Uniform Boundaries**: Smart neighbor-aware border logic for perfectly consistent 4px grid lines.
  - **Adaptive Layout**: Dynamically shifts clues below the grid for wide puzzles to maintain legibility.
  - **Visual Feedback**: Real-time "Check Answers" validation (green for correct, red for incorrect).
  - **Transparency**: Optimized grid rendering with transparent non-letter cells for a clean, glassmorphic aesthetic.
- **Teacher Tools**: Toggleable "Answer Key" and "Reveal Grid" modes for quick review.

## 🛠️ Tech Stack

- **Framework**: React 18 + Vite (TypeScript)
- **AI**: Google Generative AI (Gemini 2.5 Flash)
- **Styling**: Tailwind CSS (PostCSS)
- **Parsing**: JSZip (for PPTX structure extraction)

## 🚀 Quick Start

### 1. Requirements
- **Node.js**: v18 or newer
- **API Key**: A Google Gemini API Key (available at [Google AI Studio](https://aistudio.google.com/))

### 2. Installation
```bash
# Clone the repository
git clone <repository-url>
cd hackslu

# Install dependencies
npm install
```

### 3. Environment Setup
The app requires an API key configured via environment variables.

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Edit `.env` and add your key:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

### 4. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173` to start building puzzles.

## 📁 Project Structure

- `src/lib/gemini.ts`: AI inference and multimodal file parsing logic.
- `src/lib/generator.ts`: Mathematical crossword layout engine and grid cropping.
- `src/components/Uploader.tsx`: Drag-and-drop file processing interface.
- `src/components/CrosswordBoard.tsx`: The main interactive gameplay grid.

## 📦 Production Build
```bash
npm run build
```
The optimized production bundle will be generated in the `dist/` directory.

---
Built for HackSLU 2026 🚀
