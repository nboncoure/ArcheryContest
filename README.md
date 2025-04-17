# Archery Contest Manager

A desktop application built with Vue 3, TypeScript, and Electron to help manage archery competitions.

## Features

- Competition management (creation, editing, deletion)
- Archer registration and management
- Target assignment and configuration
- CSV/Excel import of archer data
- Session management for multi-day competitions
- Support for various bow types and age categories

## Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)

## Getting Started

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/nboncoure/ArcheryContest.git
cd ArcheryContest
pnpm install
```

### Development

The project supports two development modes:

#### Browser Development (with hot-reload)

```bash
pnpm dev
```

This will start the development server and open your default browser at http://localhost:3344.

#### Electron Development (with hot-reload)

```bash
pnpm dev:electron
```

This will start the Electron application connected to the development server, allowing hot-reload functionality.

### Building

#### For Web

```bash
pnpm build
```

This builds the application for web browsers. The output will be in the `dist` directory.

#### For Desktop (Electron)

```bash
pnpm build:electron
```

This builds the Electron application. The output will be in the `release` directory.

### Preview

To preview the built application:

```bash
# Preview web version
pnpm preview

# Preview Electron version
pnpm electron:preview
```

## Project Structure

```
archery-contest-manager/
├── dist/                    # Build output for web
├── dist-electron/           # Build output for Electron main and preload scripts
├── electron/                # Electron main and preload scripts
│   ├── main/                # Main process code
│   └── preload/             # Preload scripts
├── public/                  # Static assets
├── release/                 # Built Electron applications
└── src/                     # Application source code
    ├── components/          # Vue components
    ├── constants/           # Application constants and static data
    ├── services/            # Business logic services
    ├── stores/              # Pinia stores
    ├── types/               # TypeScript type definitions
    ├── utils/               # Utility functions
    └── views/               # Vue views
```

## Technology Stack

- **Frontend**: Vue 3 with Composition API
- **State Management**: Pinia
- **UI Framework**: Tailwind CSS with HeadlessUI
- **Desktop Framework**: Electron
- **Build Tool**: Vite
- **Language**: TypeScript

## Importing Archers

The application supports importing archers from CSV or Excel files with the following columns:

- NOM (Last name)
- Prénom (First name)
- Club
- N° Licence (License number)
- Année nais. (Birth year)
- Cat_age (Age category)
- Sexe (Gender)
- Arme (Bow type)
- Débutant (Beginner)
- Handicapé (Disabled)
- N° Départ (Session number)

Age categories and bow types follow the 2024-2025 French Archery Federation standards.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Vue.js](https://vuejs.org/)
- [Electron](https://www.electronjs.org/)
- [Pinia](https://pinia.vuejs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [HeadlessUI](https://headlessui.dev/)
- [Vite](https://vitejs.dev/)