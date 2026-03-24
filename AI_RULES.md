# AI Development Rules & Tech Stack

## Tech Stack
*   **Framework**: React (Functional components with Hooks)
*   **Language**: TypeScript (Strict type checking)
*   **Styling**: Tailwind CSS (Utility-first CSS)
*   **UI Components**: shadcn/ui (Radix UI primitives)
*   **Icons**: Lucide React
*   **Routing**: React Router (Client-side routing)
*   **Build Tool**: Vite

## Development Rules

### 1. Project Structure
*   All source code must reside in the `src/` directory.
*   **Pages**: Place route-level components in `src/pages/`.
*   **Components**: Place reusable UI elements in `src/components/`.
*   **Routing**: All routes must be defined and managed within `src/App.tsx`.
*   **Entry Point**: The main landing page is `src/pages/Index.tsx`.

### 2. Component Guidelines
*   **Size**: Keep components small and focused (ideally under 100 lines). Refactor into smaller sub-components if they grow too large.
*   **Naming**: Use PascalCase for component files (e.g., `Button.tsx`) and lowercase for directory names.
*   **Files**: Create a new file for every new component. Do not bundle multiple components in a single file.

### 3. Styling & UI
*   **Tailwind**: Use Tailwind CSS classes for all styling. Avoid inline styles or external CSS files unless absolutely necessary.
*   **shadcn/ui**: Always prioritize using existing shadcn/ui components. Do not reinvent basic UI elements like buttons, inputs, or dialogs.
*   **Responsiveness**: All designs must be mobile-first and fully responsive.
*   **Icons**: Use `lucide-react` for all iconography.

### 4. Coding Standards
*   **TypeScript**: Always define interfaces or types for component props and state. Avoid using `any`.
*   **No Placeholders**: Never use "TODO" comments or partial implementations. Every feature added must be fully functional.
*   **Simplicity**: Follow the KISS (Keep It Simple, Stupid) principle. Avoid over-engineering solutions.
*   **Error Handling**: Let errors bubble up naturally unless specific UI feedback is required. Use toast notifications for user-facing alerts.