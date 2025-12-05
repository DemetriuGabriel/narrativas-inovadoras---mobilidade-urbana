# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# Map Scrollytelling Features

## Flexible Map Triggers (`<MapTrigger />`)

The application uses a decoupled "Trigger" system to control map movements ("FlyTo") independently of the visual content cards. This allows for precise timing control.

### Component Definition

The `MapTrigger` is a simple functional component that renders an invisible 1px line.

```jsx
const MapTrigger = ({ id, style }) => (
  <div 
    className="map-trigger" 
    id={id} 
    style={{ marginBottom: '10vh', height: '1px', width: '100%', pointerEvents: 'none', ...style }} 
  />
);
```

### Usage

**1. Standard Flow (Between Cards)**
Place the trigger *before* a card to move the map as the user scrolls towards the card.

```jsx
{/* Triggers map move to 'intro-1' location */}
<MapTrigger id="intro-1" />

<div className="section card-left">
  <h3>Card Title</h3>
  <p>Content...</p>
</div>
```

**2. Precise Timing (Inside Cards)**
Place the trigger *inside* a card (e.g., after the first paragraph) to trigger the map move only after the user has read part of the content.

*Note: The parent container must have `position: relative`.*

```jsx
<div className="section card-left" style={{ position: 'relative' }}>
  <p>First paragraph...</p>

  {/* Triggers map move when scrolling past this point */}
  <MapTrigger 
    id="mid-card-trigger" 
    style={{ position: 'absolute', top: '50%', marginBottom: 0 }} 
  />

  <p>Second paragraph...</p>
</div>
```
