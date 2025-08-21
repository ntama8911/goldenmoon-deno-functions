import Layout from "./Layout.jsx";

import Home from "./Home";

import Results from "./Results";

import Admin from "./Admin";

import Support from "./Support";

import mybets from "./mybets";

import Register from "./Register";

import Auth from "./Auth";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Home: Home,
    
    Results: Results,
    
    Admin: Admin,
    
    Support: Support,
    
    mybets: mybets,
    
    Register: Register,
    
    Auth: Auth,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Home />} />
                
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/Results" element={<Results />} />
                
                <Route path="/Admin" element={<Admin />} />
                
                <Route path="/Support" element={<Support />} />
                
                <Route path="/mybets" element={<mybets />} />
                
                <Route path="/Register" element={<Register />} />
                
                <Route path="/Auth" element={<Auth />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}