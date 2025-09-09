# Team Management App

## Overview
A React TypeScript application for team management with features including location management, member management, team generation, random picker, and coin toss functionality.

## Technology Stack
- **Frontend**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 5.4.2
- **Styling**: Tailwind CSS 3.4.1
- **Icons**: Lucide React
- **Package Manager**: npm

## Project Structure
```
project/
├── src/
│   ├── components/          # React components
│   │   ├── CoinToss.tsx
│   │   ├── Home.tsx
│   │   ├── LocationManager.tsx
│   │   ├── MemberManager.tsx
│   │   ├── RandomPicker.tsx
│   │   └── TeamGenerator.tsx
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   ├── App.tsx             # Main application component
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── tsconfig.json          # TypeScript configuration
```

## Development Setup
- **Development Server**: Runs on port 5000 (configured for Replit environment)
- **Host Configuration**: Set to 0.0.0.0 to work with Replit's proxy system
- **Build Command**: `npm run build`
- **Dev Command**: `npm run dev`

## Deployment Configuration
- **Target**: Autoscale (stateless React SPA)
- **Build**: `npm run build`
- **Serve**: Using `serve` package to serve static files from `dist/` directory

## Recent Changes
- **2025-09-09**: Initial Replit environment setup
  - Configured Vite for Replit proxy compatibility
  - Set up development workflow on port 5000
  - Configured deployment settings for production
  - All dependencies installed and build tested successfully

## Features
Based on the component structure, this app includes:
- Home dashboard
- Location management system
- Member/team member management
- Team generation functionality
- Random picker tool
- Coin toss utility

## Notes
- Application uses local storage for data persistence via dataManager utility
- Team balancing logic implemented in teamBalancer utility
- Fully responsive design with Tailwind CSS
- TypeScript for type safety throughout the application