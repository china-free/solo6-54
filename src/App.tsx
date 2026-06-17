import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import FeatureDetail from '@/pages/FeatureDetail';
import FeatureForm from '@/pages/FeatureForm';
import HistoryPage from '@/pages/HistoryPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/features/new" element={<FeatureForm />} />
        <Route path="/features/:id" element={<FeatureDetail />} />
        <Route path="/features/:id/edit" element={<FeatureForm />} />
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
    </Router>
  );
}
