import React from 'react';
import { Wrench, ShoppingBag, BarChart3, Search, LogOut, UserCheck } from 'lucide-react';

export default function Navbar({ currentUser, activePage, setActivePage, onLogout, onGoToLogin }) {
  return (
    <nav className="bg-slate-900 text-white px-4 md:px-8 py-3 flex flex-wrap justify-between items-center shadow-sm sticky top-0 z-[60] border-b border-slate-800">
      <div 
        onClick={() => setActivePage('customer')} 
        className="flex items-center gap-2 text-lg md:text-xl font-bold text-white cursor-pointer tracking-tight"
      >
        <Wrench className="w-5 h-5 text-blue-500" /> MotoFix
      </div>

      <div className="flex items-center gap-2 mt-2 sm:mt-0">
        <button 
          onClick={() => setActivePage('customer')}
          className={`px-3 py-1.5 rounded-md text-xs md:text-sm font-medium flex items-center gap-1.5 transition ${
            activePage === 'customer' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Search className="w-4 h-4" /> <span className="hidden md:inline">เช็คสถานะ</span>
        </button>

        {currentUser ? (
          <>
            <button 
              onClick={() => setActivePage('workspace')}
              className={`px-3 py-1.5 rounded-md text-xs md:text-sm font-medium flex items-center gap-1.5 transition ${
                activePage === 'workspace' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4" /> <span className="hidden md:inline">หน้าร้าน</span>
            </button>

            {currentUser.role === 'admin' && (
              <button 
                onClick={() => setActivePage('admin')}
                className={`px-3 py-1.5 rounded-md text-xs md:text-sm font-medium flex items-center gap-1.5 transition ${
                  activePage === 'admin' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4" /> <span className="hidden md:inline">จัดการคลัง</span>
              </button>
            )}

            <div className="flex items-center gap-3 pl-3 ml-1 border-l border-slate-700">
              <span className="text-xs text-slate-300 hidden md:inline-block font-medium">
                {currentUser.name}
              </span>
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition"
                title="ออกจากระบบ"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={onGoToLogin}
            className="px-3 py-1.5 rounded-md text-xs md:text-sm font-medium border border-slate-600 hover:bg-slate-800 text-slate-300 transition flex items-center gap-1.5"
          >
            <UserCheck className="w-4 h-4" /> <span className="hidden md:inline">เข้าสู่ระบบ</span>
          </button>
        )}
      </div>
    </nav>
  );
}
