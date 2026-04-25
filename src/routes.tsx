import { createHashRouter } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PlayPage from './pages/PlayPage';

// Hash routing keeps deep links working on any static host
// (GitHub Pages, plain S3, file://) without server-side rewrites:
// URLs become https://host/.../#/play instead of https://host/.../play.
export const router = createHashRouter([
  { path: '/',     element: <HomePage /> },
  { path: '/play', element: <PlayPage /> },
]);
