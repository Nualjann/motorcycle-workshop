import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, CheckCircle2, Clock, Wrench, AlertCircle, FileText, ShieldCheck, Bike } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function CustomerTrack() {
  const [tracking, setTracking] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tracking') || params.get('track') || '';
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!tracking.trim()) return;
    setLoading(true);
    const query = `search=${encodeURIComponent(tracking.trim())}`;
    axios.get(`${API_URL}/api/public/jobs/track?${query}`)
      .then(response => setResults(response.data.length > 0 ? response.data : 'NOT_FOUND'))
      .catch(() => setResults('NOT_FOUND'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialTracking = params.get('tracking') || params.get('track');
    const initialPhone = params.get('phone');
    if (!initialTracking || !initialPhone) return;
    setLoading(true);
    axios.get(`${API_URL}/api/public/jobs/track?identifier=${encodeURIComponent(initialTracking.trim())}&phone=${encodeURIComponent(initialPhone)}`)
      .then(response => setResults(response.data.length > 0 ? response.data : 'NOT_FOUND'))
      .catch(() => setResults('NOT_FOUND'))
      .finally(() => setLoading(false));
  }, []);

  const getStepLevel = (status) => status === 'เสร็จสิ้น' ? 3 : status === 'กำลังซ่อม' ? 2 : 1;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
      <div className="text-center space-y-3 mb-8">
        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto text-white shadow-sm">
          <Bike className="w-6 h-6" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">ระบบติดตามสถานะงานซ่อม</h2>
        <p className="text-sm text-slate-500">กรุณากรอก <span className="font-semibold text-slate-700">ทะเบียนรถหรือเบอร์โทรศัพท์</span></p>
      </div>

      <form onSubmit={handleSearch} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
        <div className="relative flex items-center">
          <Search className="w-5 h-5 text-slate-400 absolute left-3" />
          <input
            type="text"
            placeholder="ทะเบียนรถ หรือเบอร์โทรศัพท์ 10 หลัก"
            value={tracking}
            onChange={e => setTracking(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm focus:outline-none text-slate-800"
          />
        </div>
        <button type="submit" disabled={loading || !tracking.trim()} className="w-fit justify-self-end bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-md text-sm transition disabled:opacity-50">
          {loading ? 'กำลังค้นหา...' : 'ค้นหา'}
        </button>
      </form>

      {results === 'NOT_FOUND' && (
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg text-center space-y-2">
          <AlertCircle className="w-8 h-8 mx-auto text-slate-400" />
          <h4 className="font-semibold text-slate-800">ไม่พบข้อมูลงานซ่อม</h4>
          <p className="text-sm text-slate-500">ตรวจสอบความถูกต้องของทะเบียนรถหรือเบอร์โทรศัพท์อีกครั้ง</p>
        </div>
      )}

      {Array.isArray(results) && (
        <div className="space-y-6 mt-6">
          <p className="text-sm text-slate-500 font-medium border-b pb-2">พบข้อมูลงานซ่อม {results.length} รายการ</p>
          {results.map((job) => {
            const step = getStepLevel(job.status);
            return (
              <div key={job.id} className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-6">
                <div className="flex flex-wrap justify-between items-start gap-4 border-b pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded font-semibold border border-slate-200">
                        {job.tracking}
                      </span>
                      <span className="text-xs text-slate-500">รับรถ: {job.date}</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{job.plate}</h3>
                    <p className="text-sm text-slate-600 mt-1">เจ้าของรถ: {job.customerName} | โทร: {job.phone}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-md text-xs font-semibold inline-block border ${
                      job.status === 'เสร็จสิ้น' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      job.status === 'กำลังซ่อม' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      สถานะ: {job.status}
                    </span>
                    <p className="text-xs text-slate-500 mt-1.5">ช่างผู้รับผิดชอบ: {job.mechanic}</p>
                  </div>
                </div>

                <div className="py-2">
                  <div className="grid grid-cols-3 gap-2 text-center relative">
                    {/* Step 1 */}
                    <div className="flex flex-col items-center space-y-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">1. รับรถเข้าคิว</p>
                      </div>
                    </div>
                    {/* Step 2 */}
                    <div className="flex flex-col items-center space-y-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <Wrench className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">2. กำลังซ่อม</p>
                      </div>
                    </div>
                    {/* Step 3 */}
                    <div className="flex flex-col items-center space-y-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition ${step === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">3. เสร็จสิ้น</p>
                      </div>
                    </div>
                  </div>
                </div>

                {job.showFinancials && <div className="bg-slate-50 rounded-md border border-slate-200 p-5 space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700">อาการเสียที่แจ้ง:</h4>
                    <p className="text-sm text-slate-600 mt-1">{job.issue}</p>
                  </div>
                  <div className="border-t border-slate-200 pt-3">
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">รายการค่าใช้จ่าย:</h4>
                    <div className="space-y-2 text-sm text-slate-600">
                      {job.partsUsed?.length ? job.partsUsed.map((part, idx) => (
                        <div key={idx} className="flex justify-between gap-4">
                          <span>{part.name} × {part.qty} <span className="text-xs text-slate-400">(฿{part.price}/ชิ้น)</span></span>
                          <span className="font-medium text-slate-800">฿{part.price * part.qty}</span>
                        </div>
                      )) : <p className="text-xs text-slate-400">ยังไม่มีรายการเบิกอะไหล่</p>}
                      <div className="flex justify-between pt-1">
                        <span>ค่าบริการ / ค่าแรงช่าง</span>
                        <span className="font-medium text-slate-800">฿{job.wage}</span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-slate-300 pt-3 flex justify-between items-center">
                    <div>
                      <span className="text-sm font-semibold text-slate-700">ยอดชำระสุทธิ</span>
                      {job.paid && <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded border border-emerald-200">ชำระแล้ว</span>}
                    </div>
                    <span className="text-lg font-bold text-slate-900">฿{job.total}</span>
                  </div>
                </div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
