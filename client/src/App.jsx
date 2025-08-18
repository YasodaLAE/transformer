// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TransformerListPage from './pages/TransformerListPage';
import TransformerDetailPage from './pages/TransformerDetailPage';
import DashboardPage from './pages/DashboardPage';
import Layout from './components/Layout';

function App() {
    return (
        <Router>
            <Layout>
                <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/transformers" element={<TransformerListPage />} />
                    <Route path="/transformers/:id" element={<TransformerDetailPage />} />
                </Routes>
            </Layout>
        </Router>
    );
}

export default App;