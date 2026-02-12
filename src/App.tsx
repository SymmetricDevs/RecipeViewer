import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import HomePage from './routes/HomePage';
import ItemsPage from './routes/ItemsPage';
import ItemDetailPage from './routes/ItemDetailPage';
import FluidsPage from './routes/FluidsPage';
import FluidDetailPage from './routes/FluidDetailPage';

function App() {
  return (
    <Router basename="/RecipeViewer">
      <div className="min-h-screen bg-gray-900">
        <Header />
        <main className="container mx-auto px-6 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/items" element={<ItemsPage />} />
            <Route path="/items/:id" element={<ItemDetailPage />} />
            <Route path="/fluids" element={<FluidsPage />} />
            <Route path="/fluids/:id" element={<FluidDetailPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
