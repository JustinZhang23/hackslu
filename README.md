# HackSLU 2026 - Crossword App

A React-based crossword puzzle application built with Vite and Tailwind CSS.

## Prerequisites

Before getting started, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git**

## Quick Start

### 1. Clone the repository

```bash
git clone <repository-url>
cd hackslu
```

### 2. Install dependencies

```bash
npm install
```

This installs all necessary packages including React, Tailwind CSS, UI components, and other dependencies.

### 3. Start the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173/`. The page will automatically reload when you make changes.

### 4. Build for production

```bash
npm run build
```

This creates an optimized production build in the `dist/` folder.

## Project Structure

```
hackslu/
├── src/
│   ├── app/
│   │   ├── App.tsx              # Main app component
│   │   └── components/          # Reusable React components
│   │       ├── CrosswordGrid.tsx
│   │       ├── CluesList.tsx
│   │       └── CustomCrosswordBuilder.tsx
│   ├── utils/
│   │   └── crosswordGenerator.ts # Crossword logic
│   └── styles/                  # CSS and Tailwind styles
├── backend/
│   └── app.py                   # Backend API (Python/Flask)
├── index.html                   # Entry HTML file
├── package.json                 # Dependencies and scripts
├── vite.config.ts              # Vite configuration
└── postcss.config.mjs           # PostCSS configuration
```

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, Radix UI components
- **Build Tool:** Vite
- **Backend:** Python (Flask)

## Development Tips

- Use `npm run dev` for active development with hot-reload
- Components are located in `src/app/components/`
- Styles are in `src/styles/`
- Tailwind CSS is configured and ready to use
- UI components from Radix UI are pre-installed

## Troubleshooting

**Port already in use?**
```bash
npm run dev -- --port 3000
```

**Dependencies not installed?**
```bash
npm install
```

**Vite not found?**
Make sure you're in the `hackslu` directory and dependencies are installed.

## Backend Setup

The backend is a Python Flask app located in `backend/app.py`. To set up:

```bash
# Install Python dependencies
pip install -r requirements.txt  # (if requirements.txt exists)

# Run the Flask server
python backend/app.py
```

---

Happy coding! 🚀