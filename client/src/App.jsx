// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TransformerListPage from './pages/TransformerListPage';
import TransformerDetailPage from './pages/TransformerDetailPage';
import DashboardPage from './pages/DashboardPage';
import Layout from './components/Layout';
import InspectionPage from './pages/InspectionPage'
import { AuthProvider } from './hooks/AuthContext'; // Import the provider
import InspectionDetailPage from './pages/InspectionDetailPage';
import AllInspectionsPage from './pages/AllInspectionsPage'; // <-- Import the new page


function App() {
    return (
        <AuthProvider>
        <Router>
            <Layout>
                <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/transformers" element={<TransformerListPage />} />
                    <Route path="/inspections" element={<AllInspectionsPage />} /> {/* <-- Add this new route */}
                    <Route path="/transformers/:id" element={<TransformerDetailPage />} />
                    <Route path="inspections/by-transformer/:transformerId" element={<InspectionPage/>}/>
                    <Route path="/inspections/by-inspection/:inspectionId" element={<InspectionDetailPage />} />
                </Routes>
            </Layout>
        </Router>
        </AuthProvider>
    );
}

export default App;