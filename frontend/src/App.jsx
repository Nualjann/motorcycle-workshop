import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import StaffWorkspace from './pages/StaffWorkspace';
import CustomerTrack from './pages/CustomerTrack';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  });

  const [activePage, setActivePage] = useState(() => {
    if (new URLSearchParams(window.location.search).get('track')) return 'customer';
    const token = localStorage.getItem('token');
    if (!token || !currentUser) return 'login';
    return currentUser.role === 'admin' ? 'admin' : 'workspace';
  });

  // ==================== State เก็บข้อมูลจาก Database ====================
  const [categories, setCategories] = useState([]);
  const [parts, setParts] = useState([]);
  const [posSales, setPosSales] = useState([]); // <--- ลบ Mock Data ทิ้งแล้ว
  const [jobs, setJobs] = useState([]);         // <--- ลบ Mock Data ทิ้งแล้ว
  const [mechanics, setMechanics] = useState([]);
  const [settings, setSettings] = useState(null);

  const themeColors = {
    blue: '#2563eb',
    emerald: '#059669',
    orange: '#ea580c',
    red: '#dc2626'
  };

  useEffect(() => {
    const configuredColor = settings?.themeColor || 'blue';
    const customColor = /^#[0-9A-Fa-f]{6}$/.test(configuredColor) ? configuredColor : null;
    const color = customColor || themeColors[configuredColor] || themeColors.blue;
    document.documentElement.style.setProperty('--theme-primary', color);
    document.documentElement.style.setProperty('--theme-primary-hover', customColor || themeColors[configuredColor] || themeColors.blue);
    document.documentElement.dataset.theme = customColor ? 'custom' : configuredColor;
    document.documentElement.dataset.paperSize = settings?.paperSize || '80mm';
  }, [settings]);

  // ==================== ดึงข้อมูลทั้งหมดตอนเปิดเว็บ ====================
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !currentUser) {
      setActivePage('login');
      return undefined;
    }

    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    axios.get('http://localhost:5000/api/auth/me')
      .then(response => setCurrentUser(response.data.user))
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common.Authorization;
        setCurrentUser(null);
        setActivePage('login');
      });
    return undefined;
  }, []);

  useEffect(() => {
    const loadAllData = async () => {
      if (!currentUser) return;
      try {
        const [catRes, partRes, jobRes, posRes, usersRes, settingsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/categories'),
          axios.get('http://localhost:5000/api/parts'),
          axios.get('http://localhost:5000/api/jobs'),  // ดึงงานซ่อม
          axios.get('http://localhost:5000/api/pos'),    // ดึงยอดขาย POS
          axios.get('http://localhost:5000/api/users'),
          axios.get('http://localhost:5000/api/settings')
        ]);
        setCategories(catRes.data);
        setParts(partRes.data);
        setJobs(jobRes.data);
        setPosSales(posRes.data);
        setSettings(settingsRes.data);
        const mechanicList = usersRes.data.filter(u => u.role === 'mechanic');
        setMechanics(mechanicList);
      } catch (error) {
        console.error("โหลดข้อมูลล้มเหลว:", error);
      }
    };
    loadAllData();
  }, [currentUser]);

  const handleLogin = (userData) => {
    const token = localStorage.getItem('token');
    if (token) axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    setCurrentUser(userData);
    if (userData.role === 'admin') {
      setActivePage('admin');
    } else {
      setActivePage('workspace');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common.Authorization;
    setCurrentUser(null);
    setActivePage('login');
  };

  if (activePage === 'login') {
    return (
      <Login 
        onLogin={handleLogin}
        onLoginSuccess={handleLogin}
        onGoToCustomerTrack={() => setActivePage('customer')} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <Navbar 
        currentUser={currentUser}
        activePage={activePage}
        setActivePage={setActivePage}
        onLogout={handleLogout}
        onGoToLogin={() => setActivePage('login')}
      />
      
      <main className="flex-1">
        {/* หน้า 1: ลูกค้าเช็คสถานะงานซ่อม (ไม่ต้องล็อกอิน) */}
        {activePage === 'customer' && <CustomerTrack />}

        {/* หน้า 2: หน้าร้าน POS และ คิวงานซ่อม & เบิกอะไหล่ (สำหรับช่าง/แคชเชียร์) */}
        {activePage === 'workspace' && (
          currentUser ? (
            <StaffWorkspace 
              parts={parts} 
              setParts={setParts} 
              jobs={jobs} 
              setJobs={setJobs} 
              categories={categories}
              posSales={posSales}
              setPosSales={setPosSales}
              mechanics={mechanics}
            />
          ) : (
            <div className="p-8 text-center">
              <p className="text-slate-600 mb-4">กรุณาเข้าสู่ระบบก่อนเข้าใช้งานหน้าร้าน</p>
              <button 
                onClick={() => setActivePage('login')}
                className="bg-amber-500 text-slate-950 font-bold px-6 py-2 rounded-xl text-sm"
              >
                ไปหน้าเข้าสู่ระบบ
              </button>
            </div>
          )
        )}

        {/* หน้า 3: แอดมิน จัดการสต็อก หมวดหมู่ และรายงานยอดขาย */}
        {activePage === 'admin' && (
          currentUser?.role === 'admin' ? (
            <AdminDashboard 
              parts={parts} 
              setParts={setParts} 
              jobs={jobs} 
              categories={categories}
              setCategories={setCategories}
              posSales={posSales}
              mechanics={mechanics}
              settings={settings}
              settings={settings}
              setSettings={setSettings}
            />  
          ) : (
            <div className="p-8 text-center text-rose-600 font-bold">
              เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถเข้าถึงหน้านี้ได้
            </div>
          )
        )}
      </main>
    </div>
  );
}
