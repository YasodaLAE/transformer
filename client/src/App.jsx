// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TransformerListPage from './pages/TransformerListPage';
import TransformerDetailPage from './pages/TransformerDetailPage';
import DashboardPage from './pages/DashboardPage';
import Layout from './components/Layout';
import InspectionPage from './pages/InspectionPage'

function App() {
    return (
        <Router>
            <Layout>
                <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/transformers" element={<TransformerListPage />} />
                    <Route path="/transformers/:id" element={<TransformerDetailPage />} />
                    <Route path="inspections/by-transformer/:transformerId" element={<InspectionPage/>}/>
                </Routes>
            </Layout>
        </Router>
    );
}

export default App;