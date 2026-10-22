import React, { useState } from 'react';
import axios from 'axios';
import { Wrench, Lock, User, ArrowLeft, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function Login({ onLoginSuccess, onGoToCustomerTrack }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const getThaiErrorMessage = (error) => {
    const serverMessage = error.response?.data?.error;
    if (serverMessage) return serverMessage;
    return 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์';
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return setErrorMsg('กรุณากรอกข้อมูลให้ครบถ้วน');

    setLoading(true);
    setErrorMsg('');

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        username,
        password
      });

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      onLoginSuccess(user);
    } catch (error) {
      setErrorMsg(getThaiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // ปุ่มตัวช่วยกรอกสำหรับทดสอบ (ลบออกได้เมื่อใช้งานจริง)
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-sm border border-slate-200 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto shadow-sm text-white">
            <Wrench className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">MotoFix Workspace</h2>
          <p className="text-sm text-slate-500">กรุณาเข้าสู่ระบบด้วยบัญชีพนักงานเพื่อดำเนินการต่อ</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">ชื่อผู้ใช้งาน (Username)</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">รหัสผ่าน (Password)</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(value => !value)}
                aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                className="absolute right-3 top-2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-md shadow-sm transition disabled:opacity-50 text-sm mt-2"
          >
            {loading ? 'กำลังตรวจสอบข้อมูล...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            onClick={onGoToCustomerTrack}
            className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 font-medium transition"
          >
            <ArrowLeft className="w-4 h-4" /> ไปหน้าเช็คสถานะงานซ่อม
          </button>
        </div>
      </div>
    </div>
  );
}
