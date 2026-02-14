# BioPath Frontend

Modern, minimalist React + Tailwind CSS frontend for the BioPath Chemical-Target-Pathway Analysis Platform.

## Features

- **PubChem Autocomplete**: Smart compound search with real-time suggestions
- **Interactive Visualizations**: Recharts-powered pathway impact charts
- **Modern UI**: Clean, minimalist design inspired by Stripe/Linear
- **Fast**: Built with Vite for lightning-fast development
- **Type-Safe**: Full TypeScript support
- **Responsive**: Works beautifully on all devices

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- BioPath backend running on `http://localhost:8000`

### Installation

1. Fix npm permissions (if needed):
```bash
sudo chown -R $(whoami) ~/.npm
```

2. Install dependencies:
```bash
cd biopath-frontend
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

## Usage

1. **Search for a compound**: Start typing an ingredient name (e.g., "ibu" for ibuprofen)
2. **Select from suggestions**: Click on a compound from the PubChem autocomplete dropdown
3. **Analyze**: Click "Analyze Compound" to start the analysis
4. **View results**: Explore targets, pathways, and biological impacts

## Project Structure

```
src/
├── api/                  # API client and endpoints
│   ├── client.ts        # Axios configuration
│   ├── endpoints.ts     # BioPath API methods
│   ├── pubchem.ts       # PubChem autocomplete
│   └── types.ts         # TypeScript interfaces
├── components/
│   ├── common/          # Reusable UI components
│   │   ├── AutocompleteInput.tsx
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── LoadingOverlay.tsx
│   │   └── LoadingSpinner.tsx
│   └── analysis/        # Feature-specific components
│       ├── AnalysisForm.tsx
│       ├── CompoundInfo.tsx
│       ├── PathwaysList.tsx
│       ├── SummaryCard.tsx
│       └── TargetsList.tsx
├── hooks/               # Custom React hooks
│   ├── useAnalysisSync.ts
│   └── usePubChemSearch.ts
└── utils/               # Utility functions
    ├── colors.ts        # Tier color mappings
    └── formatters.ts    # Data formatting
```

## Configuration

Edit `.env` to customize:

```env
VITE_API_URL=http://localhost:8000  # BioPath backend URL
```

## Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Integration with FastAPI

To serve the frontend from FastAPI:

1. Build the frontend:
```bash
npm run build
```

2. Copy `dist/` contents to your FastAPI project

3. Update `app/main.py`:
```python
from fastapi.staticfiles import StaticFiles

app.mount("/", StaticFiles(directory="frontend/dist", html=True), name="frontend")
```

4. Restart FastAPI and visit `http://localhost:8000`

## Key Technologies

- **React 18**: UI library
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first styling
- **Vite**: Build tool
- **React Query**: Server state management
- **Recharts**: Data visualization
- **Framer Motion**: Animations
- **Axios**: HTTP client

## Design System

### Color Palette
- **Primary**: Blue (#0ea5e9) - CTAs and links
- **Tier A**: Green (#10b981) - Measured evidence
- **Tier B**: Yellow (#f59e0b) - Inferred pathways
- **Tier C**: Gray (#6b7280) - Predicted targets

### Typography
- **Headlines**: Inter, font-semibold
- **Body**: Inter, regular
- **Code**: JetBrains Mono (for chemical notation)

## Troubleshooting

### npm install fails with EACCES
Fix npm permissions:
```bash
sudo chown -R $(whoami) ~/.npm
```

Or use sudo (not recommended):
```bash
sudo npm install
```

### API requests fail
- Ensure backend is running on `http://localhost:8000`
- Check `.env` file has correct `VITE_API_URL`
- Verify CORS is enabled in FastAPI backend

### PubChem autocomplete not working
- Check internet connection
- PubChem may have rate limits - try again in a moment
- Ensure you type at least 2 characters

## License

MIT License - See parent project for details
