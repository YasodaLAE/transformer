// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TransformerListPage from './pages/TransformerListPage';
import TransformerDetailPage from './pages/TransformerDetailPage';
import DashboardPage from './pages/DashboardPage';
import Layout from './components/Layout';
import InspectionPage from './pages/InspectionPage'
import { AuthProvider } from './hooks/AuthContext';
import InspectionDetailPage from './pages/InspectionDetailPage';
import AllInspectionsPage from './pages/AllInspectionsPage';

function App() {
    return (
        <AuthProvider>
        <Router>
            <Layout>
                <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/transformers" element={<TransformerListPage />} />
                    <Route path="/transformers/:id" element={<TransformerDetailPage />} />
                    <Route path="inspections/by-transformer/:transformerId" element={<InspectionPage/>}/>
                    <Route path="/inspections/by-inspection/:inspectionId" element={<InspectionDetailPage />} />
                    <Route path="/inspections" element={<AllInspectionsPage />} />
                </Routes>
            </Layout>
        </Router>
        </AuthProvider>
    );
}

export default App;