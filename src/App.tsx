import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { HomePage } from './pages/HomePage';
import { RecipesPage } from './pages/RecipesPage';
import { WeekPage } from './pages/WeekPage';
import { SettingsPage } from './pages/SettingsPage';
import { useFirestoreSync } from './hooks/useFirestoreSync';

function AppContent() {
  useFirestoreSync();

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto bg-gray-50">
      <div className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/week" element={<WeekPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
