import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios'; // <-- เพิ่ม axios
import QRCode from 'qrcode';
import { 
  ShoppingCart, Wrench, Plus, ArrowLeft, 
  QrCode, Banknote, Printer, CheckCircle2, Clock, 
  Trash2, PackagePlus, FileText, DollarSign, Package,
  AlertCircle, Check, Tag, Menu, Search, Minus
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

export default function StaffWorkspace({ 
  parts, 
  setParts, 
  jobs, 
  setJobs, 
  categories = [], 
  posSales, 
  setPosSales,
  mechanics = [],
  settings = {}
}) {
  const configuredDefaultWage = Number(settings.defaultWage);
  // Keep the on-screen receipt readable; print styles reduce it to 80mm.
  const receiptStyle = { width: '100%', maxWidth: '100%' };
  const [mainMode, setMainMode] = useState('pos');
  const [isStaffMenuOpen, setIsStaffMenuOpen] = useState(false);

  const selectStaffMode = (mode) => {
    setMainMode(mode);
    if (mode === 'pos') setPosStep('browse');
    if (mode === 'repair') setRepairStep('list');
    setIsStaffMenuOpen(false);
  };

  // POS State
  const [posStep, setPosStep] = useState('browse');
  const [posSearchTerm, setPosSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [cashReceived, setCashReceived] = useState('');
  const [receiptData, setReceiptData] = useState(null);
  const [posSlipImage, setPosSlipImage] = useState('');
  const [posSlipRef, setPosSlipRef] = useState('');
  const [posSlipStatus, setPosSlipStatus] = useState('idle');
  const [posSlipMessage, setPosSlipMessage] = useState('');

  // Repair State
  const [repairStep, setRepairStep] = useState('list');
  const [jobSearchTerm, setJobSearchTerm] = useState('');
  const [jobView, setJobView] = useState('active');
  const [jobDateFrom, setJobDateFrom] = useState('');
  const [jobDateTo, setJobDateTo] = useState('');
  const [jobsPage, setJobsPage] = useState(1);
  const jobsPerPage = 9;
  useEffect(() => setJobsPage(1), [jobView, jobSearchTerm, jobDateFrom, jobDateTo]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isEditingIssue, setIsEditingIssue] = useState(false);
  const [issueDraft, setIssueDraft] = useState('');
  const [selectedPartToUse, setSelectedPartToUse] = useState('');
  const [isPartSearchOpen, setIsPartSearchOpen] = useState(false);
  const [partSearchTerm, setPartSearchTerm] = useState('');
  const [repairPaymentMethod, setRepairPaymentMethod] = useState('');
  const [repairCashReceived, setRepairCashReceived] = useState('');
  const [repairSlipImage, setRepairSlipImage] = useState('');
  const [repairSlipRef, setRepairSlipRef] = useState('');
  const [repairSlipStatus, setRepairSlipStatus] = useState('idle');
  const [repairSlipMessage, setRepairSlipMessage] = useState('');
  const [jobQrCode, setJobQrCode] = useState('');

  const selectPosPaymentMethod = method => {
    setPaymentMethod(method);
    setPosSlipStatus('idle');
    setPosSlipMessage('');
    setPosSlipRef('');
  };

  const selectRepairPaymentMethod = method => {
    setRepairPaymentMethod(method);
    setRepairSlipStatus('idle');
    setRepairSlipMessage('');
    setRepairSlipRef('');
  };

  useEffect(() => {
    if (repairStep !== 'job-ticket' || !selectedJob?.tracking) {
      setJobQrCode('');
      return undefined;
    }
    let active = true;
    const trackingUrl = `${window.location.origin}?track=${encodeURIComponent(selectedJob.tracking)}`;
    QRCode.toDataURL(trackingUrl, { width: 180, margin: 1 })
      .then(url => { if (active) setJobQrCode(url); })
      .catch(() => { if (active) setJobQrCode(''); });
    return () => { active = false; };
  }, [repairStep, selectedJob?.tracking]);

  // ฟอร์มเปิดใบซ่อมใหม่ (ค่าเริ่มต้น 100 บาท)
  const [newJobForm, setNewJobForm] = useState({
    plate: '',
    customerName: '',
    phone: '',
    issue: '',
    mechanic: '',
    wage: Number.isFinite(configuredDefaultWage) ? configuredDefaultWage : 100
  });

  useEffect(() => {
    if (Number.isFinite(configuredDefaultWage)) {
      setNewJobForm(current => ({ ...current, wage: configuredDefaultWage }));
    }
  }, [configuredDefaultWage]);

  const getJobEstimate = (job) => {
    if (!job) return 0;
    const partsTotal = (job.partsUsed || []).reduce((sum, item) => {
      const price = Number(item.price) || 0;
      const qty = Number(item.qty) || 0;
      return sum + price * qty;
    }, 0);
    return partsTotal + (Number(job.wage) || 0);
  };

  const printRef = useRef(null);
  const jobTicketRef = useRef(null);
  const printPageStyle = '@page { size: 80mm auto; margin: 0; }';
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    pageStyle: printPageStyle,
  });
  const handlePrintJobTicket = useReactToPrint({
    contentRef: jobTicketRef,
    pageStyle: printPageStyle,
  });

  // ใช้หมวดหมู่เดียวกับหน้าแอดมิน
  const categoryList = ['ทั้งหมด', ...categories];

  // ค้นหาอะไหล่ที่เลือกอยู่ปัจจุบันสำหรับ Preview
  const activeSelectedPart = parts.find(p => p.id === Number(selectedPartToUse));
  const searchableParts = parts.filter(part =>
    part.name.toLowerCase().includes(partSearchTerm.trim().toLowerCase())
  );

  // ==================== POS LOGIC ====================
  const addToCart = (part) => {
    if (part.stock <= 0) return alert('สินค้าในคลังหมด!');
    const exist = cart.find(c => c.id === part.id);
    if (exist) {
      if (exist.qty >= part.stock) return alert('จำนวนสินค้าเกินสต็อกคงเหลือ');
      setCart(cart.map(c => c.id === part.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { ...part, qty: 1 }]);
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(c => c.id !== id));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const readSlipImage = (file, setImage, setStatus, setMessage) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setStatus('error');
      setMessage('กรุณาเลือกไฟล์สลิป JPG, PNG หรือ WEBP');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setStatus('error');
      setMessage('ไฟล์สลิปต้องมีขนาดไม่เกิน 8MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { setImage(reader.result); setStatus('ready'); setMessage('พร้อมตรวจสอบสลิป'); };
    reader.readAsDataURL(file);
  };

  const verifyPaymentSlip = async (image, amount, setStatus, setMessage, setReference) => {
    if (!image) return setMessage('กรุณาอัปโหลดสลิปก่อนตรวจสอบ');
    setReference?.('');
    setStatus('checking');
    setMessage('กำลังตรวจสอบสลิป...');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/payments/verify-slip', { slipImage: image, amount }, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      setReference?.(response.data.transRef || '');
      setStatus('verified');
      setMessage(`ตรวจสอบสำเร็จ ยอดเงิน ฿${response.data.amount}`);
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.error || 'สลิปไม่ผ่านการตรวจสอบ');
    }
  };

  // 🔴 1. แก้ไข: คิดเงินหน้าร้าน POS ให้ยิงเข้า DB
  const confirmPOSPayment = async () => {
    if (cart.length === 0) return;
    if (!paymentMethod) return setPosSlipMessage('กรุณาเลือกวิธีชำระเงินก่อน');

    const posData = {
      items: cart.map(item => ({ id: item.id, qty: item.qty, price: item.price })),
      paymentMethod: paymentMethod === 'cash' ? 'เงินสด' : 'โอนจ่าย'
    };
    if (paymentMethod === 'qr') posData.paymentTransRef = posSlipRef;

    try {
      // บันทึกบิล POS และตัดสต็อกผ่าน API
      const response = await axios.post('http://localhost:5000/api/pos', posData);
      
      // อัปเดต state แบบ Real-time
      setPosSales([response.data, ...posSales]);
      
      // ดึงสต็อกอะไหล่ใหม่ (เพราะ API ตัดสต็อกไปแล้ว)
      const partsRes = await axios.get('http://localhost:5000/api/parts');
      setParts(partsRes.data);

      setReceiptData({
        title: 'ใบเสร็จรับเงิน (ขายหน้าร้าน)',
        ...response.data, // ดึงข้อมูลที่ได้จาก API (มี receiptNo แล้ว)
        wage: 0,
        cashReceived: paymentMethod === 'cash' ? Number(cashReceived) : cartTotal,
        change: paymentMethod === 'cash' ? (Number(cashReceived) - cartTotal) : 0
      });

      setCart([]);
      setCashReceived('');
      setPosSlipImage('');
      setPosSlipRef('');
      setPosSlipStatus('idle');
      setPosSlipMessage('');
      setPaymentMethod('');
      setPosStep('receipt');
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการบันทึกการขาย');
      console.error(error);
    }
  };

  // ==================== REPAIR LOGIC ====================
  // 🔴 2. แก้ไข: เปิดใบงานซ่อมใหม่ ให้ยิงเข้า DB
  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!newJobForm.plate || !newJobForm.issue) return alert('กรุณากรอกทะเบียนรถและอาการเสีย');
    if (!/^\d{10}$/.test(newJobForm.phone)) return alert('กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก');

    try {
      const response = await axios.post('http://localhost:5000/api/jobs', newJobForm);
      setJobs([response.data, ...jobs]); // นำใบงานใหม่ไปต่อหัวคิวเดิม
      
      setSelectedJob(response.data);
      setNewJobForm({ plate: '', customerName: '', phone: '', issue: '', mechanic: 'ช่างเอก', wage: Number.isFinite(configuredDefaultWage) ? configuredDefaultWage : 100 });
      setRepairStep('job-ticket');
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการเปิดใบงานซ่อม');
      console.error(error);
    }
  };

  // 🔴 3. แก้ไข: อัปเดตสถานะงานซ่อม
  const updateJobStatus = async (newStatus) => {
    if (!selectedJob) return;
    try {
      const response = await axios.put(`http://localhost:5000/api/jobs/${selectedJob.id}/status`, { status: newStatus });
      setSelectedJob(response.data);
      setJobs(jobs.map(j => j.id === response.data.id ? response.data : j));
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
  };

  const handleUpdateWage = (newWage) => {
    if (!selectedJob) return;
    const wageValue = Number(newWage) || 0;
    const updated = { ...selectedJob, wage: wageValue, total: getJobEstimate({ ...selectedJob, wage: wageValue }) };
    setSelectedJob(updated);
  };

  const handleUsePartInRepair = async () => {
    if (!selectedPartToUse || !selectedJob) return;
    try {
      const response = await axios.post('http://localhost:5000/api/jobs/use-part', {
        jobId: selectedJob.id,
        partId: Number(selectedPartToUse)
      });
      setSelectedJob(response.data);
      setJobs(currentJobs => currentJobs.map(job => job.id === response.data.id ? response.data : job));
      const partsRes = await axios.get('http://localhost:5000/api/parts');
      setParts(partsRes.data);
      setSelectedPartToUse('');
    } catch (error) {
      alert(error.response?.data?.error || 'เบิกอะไหล่ไม่สำเร็จ');
    }
  };

  const adjustUsedPartQty = async (partId, change) => {
    if (!selectedJob) return;
    const inventoryPart = parts.find(part => part.id === partId);
    if (change > 0 && (!inventoryPart || inventoryPart.stock <= 0)) return alert('อะไหล่ในคลังไม่เพียงพอ');
    try {
      const endpoint = change < 0 ? 'remove-part' : 'use-part';
      const response = await axios.post(`http://localhost:5000/api/jobs/${endpoint}`, {
        jobId: selectedJob.id,
        partId
      });
      setSelectedJob(response.data);
      setJobs(currentJobs => currentJobs.map(job => job.id === response.data.id ? response.data : job));
      const partsRes = await axios.get('http://localhost:5000/api/parts');
      setParts(partsRes.data);
    } catch (error) {
      alert(error.response?.data?.error || (change < 0 ? 'ลบรายการเบิกไม่สำเร็จ' : 'เบิกอะไหล่ไม่สำเร็จ'));
    }
  };
  // 🔴 4. แก้ไข: คิดเงิน/ปิดบิลงานซ่อม
  const confirmRepairPayment = async () => {
    if (!selectedJob) return;
    if (!repairPaymentMethod) return setRepairSlipMessage('กรุณาเลือกวิธีชำระเงินก่อน');

    try {
      const checkoutData = {
        wage: selectedJob.wage,
        total: getJobEstimate(selectedJob),
        paymentMethod: repairPaymentMethod === 'cash' ? 'เงินสด' : 'โอนจ่าย',
        paymentTransRef: repairPaymentMethod === 'cash' ? undefined : repairSlipRef,
      };

      const response = await axios.put(`http://localhost:5000/api/jobs/${selectedJob.id}/close`, checkoutData);
      
      setSelectedJob(response.data);
      setJobs(jobs.map(j => j.id === response.data.id ? response.data : j));

      // ดึงสต็อกอะไหล่ใหม่
      const partsRes = await axios.get('http://localhost:5000/api/parts');
      setParts(partsRes.data);

      setReceiptData({
        title: 'ใบเสร็จรับเงิน / ส่งมอบงานซ่อม',
        receiptNo: `REP-${response.data.tracking}`,
        plate: response.data.plate,
        customerName: response.data.customerName,
        mechanic: response.data.mechanic,
        date: new Date().toLocaleString('th-TH'),
        items: [...response.data.partsUsed],
        wage: response.data.wage,
        total: response.data.total,
        paymentMethod: response.data.paymentMethod || (repairPaymentMethod === 'cash' ? 'เงินสด' : 'โอนจ่าย'),
        cashReceived: repairPaymentMethod === 'cash' ? Number(repairCashReceived) : response.data.total,
        change: repairPaymentMethod === 'cash' ? (Number(repairCashReceived) - response.data.total) : 0
      });

      setRepairCashReceived('');
      setRepairSlipImage('');
      setRepairSlipRef('');
      setRepairPaymentMethod('');
      setRepairStep('receipt');
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการปิดบิลงานซ่อม');
      console.error(error);
    }
  };

  const categoryFilteredParts = selectedCategory === 'ทั้งหมด' 
    ? parts 
    : parts.filter(p => p.category === selectedCategory);

// ... (ส่วน return() ที่เป็น UI ด้านล่างให้คงไว้เหมือนเดิม ไม่ต้องแก้ครับ) ...

  const normalizedPosSearch = posSearchTerm.trim().toLowerCase();
  const filteredParts = categoryFilteredParts.filter(part => {
    if (!normalizedPosSearch) return true;
    return `${part.name} ${part.category}`.toLowerCase().includes(normalizedPosSearch);
  });

  const normalizedJobSearch = jobSearchTerm.trim().toLowerCase();
  const filteredJobs = jobs.filter(job => {
    if (jobView === 'archive' ? !job.archived : job.archived) return false;
    const matchesText = !normalizedJobSearch || [job.plate, job.tracking, job.customerName, job.phone, job.issue, job.mechanic, job.status]
      .filter(Boolean)
      .some(value => String(value).toLowerCase().includes(normalizedJobSearch));
    const created = new Date(job.createdAt);
    const afterFrom = !jobDateFrom || created >= new Date(`${jobDateFrom}T00:00:00`);
    const beforeTo = !jobDateTo || created <= new Date(`${jobDateTo}T23:59:59.999`);
    return matchesText && afterFrom && beforeTo;
  });
  const totalJobsPages = Math.max(1, Math.ceil(filteredJobs.length / jobsPerPage));
  const currentJobsPage = Math.min(jobsPage, totalJobsPages);
  const paginatedJobs = filteredJobs.slice((currentJobsPage - 1) * jobsPerPage, currentJobsPage * jobsPerPage);

  const archiveJob = async (event, job) => {
    event.stopPropagation();
    try {
      const response = await axios.put(`http://localhost:5000/api/jobs/${job.id}/archive`);
      setJobs(currentJobs => currentJobs.map(item => item.id === response.data.id ? { ...item, archived: true } : item));
    } catch (error) {
      alert(error.response?.data?.error || 'ไม่สามารถเก็บงานเข้าประวัติได้');
    }
  };

  const saveJobIssue = async () => {
    if (!selectedJob) return;
    try {
      const response = await axios.put(`http://localhost:5000/api/jobs/${selectedJob.id}/issue`, { issue: issueDraft });
      setSelectedJob(response.data);
      setJobs(currentJobs => currentJobs.map(job => job.id === response.data.id ? response.data : job));
      setIsEditingIssue(false);
    } catch (error) {
      alert(error.response?.data?.error || 'ไม่สามารถแก้ไขอาการเสียได้');
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6 md:pl-72 max-w-[1400px] mx-auto flex flex-col md:flex-row gap-6 items-start relative">
      
      {/* ========================================================= */}
      {/* แถบเมนูด้านซ้าย (Sidebar Layout) */}
      {/* ========================================================= */}
      <div className="md:hidden w-full flex justify-start mb-2 relative z-[55]">
        <button
          type="button"
          onClick={() => setIsStaffMenuOpen(true)}
          className="w-11 h-11 bg-slate-900 text-white rounded-lg flex items-center justify-center shadow-sm"
          aria-label="เปิดเมนูพนักงาน"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
      {isStaffMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[1px]"
          onClick={() => setIsStaffMenuOpen(false)}
          aria-hidden="true"
        />
      )}
      <div className={`${isStaffMenuOpen ? 'fixed top-32 left-0 z-50 h-[calc(100vh-8rem)] w-max min-w-[220px] max-w-[85vw] animate-in fade-in slide-in-from-left duration-200' : 'hidden'} md:block md:fixed md:inset-y-0 md:left-0 md:z-10 md:h-auto md:w-64 md:p-0 shrink-0`}>
        <div className="bg-white border border-slate-200 border-l-4 border-l-blue-600 rounded-none h-full w-full md:w-64 p-3 shadow-2xl flex flex-col gap-2 overflow-y-auto">
          <div className="hidden md:flex px-3 py-3 text-slate-600 items-center gap-3 whitespace-nowrap">
            <Menu className="w-5 h-5 shrink-0" />
            <span className="font-semibold text-sm">เมนูพนักงาน</span>
          </div>
          <h3 className="hidden">
            เมนูพนักงาน
          </h3>
          <button
            onClick={() => selectStaffMode('pos')}
            className={`px-4 py-3 rounded-md font-semibold text-sm flex items-center gap-3 transition whitespace-nowrap ${
              mainMode === 'pos' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <ShoppingCart className="w-5 h-5 shrink-0" /> 
            <span>ระบบหน้าร้าน</span>
          </button>
          <button
            onClick={() => selectStaffMode('repair')}
            className={`px-4 py-3 rounded-md font-semibold text-sm flex items-center gap-3 transition whitespace-nowrap ${
              mainMode === 'repair' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-5 h-5 shrink-0" /> 
            <span>ระบบงานซ่อม</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* พื้นที่เนื้อหาหลักด้านขวา (Main Content) */}
      {/* ========================================================= */}
      <div className="flex-1 w-full">
        {mainMode === 'pos' && (
          <div>
            {posStep === 'browse' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div className="relative">
                    <input
                      type="search"
                      value={posSearchTerm}
                      onChange={e => setPosSearchTerm(e.target.value)}
                      placeholder="ค้นหาชื่อสินค้า หรือหมวดหมู่..."
                      className="w-full h-10 pl-9 pr-3 border border-slate-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {categoryList.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition border ${
                          selectedCategory === cat ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {filteredParts.map(part => (
                      <div key={part.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col justify-between hover:border-blue-400 transition group">
                        <div>
                          <div className="bg-slate-50 border border-slate-100 rounded-md h-24 flex items-center justify-center mb-3 group-hover:bg-blue-50 transition overflow-hidden">
                            {part.imageUrl ? (
                              <img src={part.imageUrl} alt={part.name} className="w-full h-full object-cover" />
                            ) : (
                              <Wrench className="w-8 h-8 text-slate-300 group-hover:text-blue-300" />
                            )}
                          </div>
                          <h4 className="font-bold text-slate-800 text-sm line-clamp-2" title={part.name}>{part.name}</h4>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 mt-1 inline-block">{part.category}</span>
                          <p className="text-xs text-slate-500 mt-1">คงเหลือ: <span className="font-semibold text-slate-700">{part.stock}</span> ชิ้น</p>
                          <p className="text-base font-bold text-blue-600 mt-1">฿{part.price}</p>
                        </div>
                        <button
                          onClick={() => addToCart(part)}
                          disabled={part.stock <= 0}
                          className="mt-3 w-full bg-slate-900 hover:bg-slate-800 text-white py-1.5 rounded-md text-xs font-semibold disabled:opacity-40"
                        >
                          + ใส่ตะกร้า
                        </button>
                      </div>
                    ))}
                    {filteredParts.length === 0 && (
                      <div className="col-span-full py-12 text-center text-sm text-slate-400 bg-white border border-dashed border-slate-300 rounded-lg">
                        ไม่พบสินค้าที่ค้นหา
                      </div>
                    )}
                  </div>
                </div>

                {/* Cart Sidebar */}
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm h-fit space-y-4">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-blue-600" /> รายการสั่งซื้อ
                  </h3>
                  <div className="divide-y max-h-96 overflow-y-auto space-y-2">
                    {cart.map(item => (
                      <div key={item.id} className="pt-2 flex justify-between items-center text-sm">
                        <div className="max-w-[150px]">
                          <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                          <p className="text-xs text-slate-500">฿{item.price} x {item.qty}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-900">฿{item.price * item.qty}</span>
                          <button onClick={() => removeFromCart(item.id)} className="text-rose-500 hover:text-rose-700">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {cart.length === 0 && <p className="text-sm text-slate-400 text-center py-8">ยังไม่มีสินค้าในตะกร้า</p>}
                  </div>
                  <div className="border-t pt-4 space-y-3">
                    <div className="flex justify-between text-base font-bold">
                      <span>ยอดรวมทั้งสิ้น</span>
                      <span className="text-blue-600 text-xl">฿{cartTotal}</span>
                    </div>
                    <button
                      onClick={() => { if (cart.length > 0) setPosStep('checkout'); }}
                      disabled={cart.length === 0}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-md shadow-sm transition disabled:opacity-40"
                    >
                      ดำเนินการชำระเงิน
                    </button>
                  </div>
                </div>
              </div>
            )}

            {posStep === 'checkout' && (
              <div className="max-w-4xl bg-white border border-slate-200 rounded-lg p-6 md:p-8 shadow-sm">
                <button 
                  onClick={() => setPosStep('browse')}
                  className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6 font-medium"
                >
                  <ArrowLeft className="w-4 h-4" /> กลับไปเลือกสินค้า
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-slate-50 border border-slate-100 p-5 rounded-lg space-y-3">
                    <h4 className="font-bold text-slate-800 text-sm">สรุปยอดชำระ</h4>
                    <div className="divide-y divide-slate-200">
                      {cart.map(item => (
                        <div key={item.id} className="py-2 flex justify-between text-sm">
                          <span className="truncate max-w-[200px]">{item.name} x {item.qty}</span>
                          <span className="font-medium">฿{item.price * item.qty}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-slate-300 pt-3 flex justify-between font-bold text-lg">
                      <span>ยอดรวมสุทธิ</span>
                      <span className="text-blue-600">฿{cartTotal}</span>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <h4 className="font-bold text-slate-800 text-sm">เลือกช่องทางชำระเงิน</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => selectPosPaymentMethod('cash')}
                        className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition ${
                          paymentMethod === 'cash' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Banknote className="w-7 h-7 text-emerald-600" />
                        <span className="text-xs font-bold">เงินสด</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => selectPosPaymentMethod('qr')}
                        className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition ${
                          paymentMethod === 'qr' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <QrCode className="w-7 h-7 text-indigo-600" />
                        <span className="text-xs font-bold">โอนจ่าย</span>
                      </button>
                    </div>

                    {!paymentMethod ? (
                      <p className="text-sm text-slate-500 text-center border border-dashed border-slate-300 rounded-lg p-4">กรุณาเลือกวิธีชำระเงิน</p>
                    ) : paymentMethod === 'cash' ? (
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700">รับเงินมา (บาท)</label>
                        <input
                          type="number"
                          placeholder="ระบุจำนวนเงินที่รับ"
                          value={cashReceived}
                          onChange={e => setCashReceived(e.target.value)}
                          className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        {Number(cashReceived) >= cartTotal && (
                          <p className="text-xs text-emerald-600 font-bold">
                            เงินทอน: ฿{Number(cashReceived) - cartTotal}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="border border-dashed border-slate-300 rounded-lg p-4 text-center bg-slate-50 space-y-2">
                         <p className="text-xs text-slate-500">โอนเงินผ่านบัญชีธนาคาร แล้วอัปโหลดสลิป</p>
                         <input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => readSlipImage(event.target.files?.[0], setPosSlipImage, setPosSlipStatus, setPosSlipMessage)} className="w-full text-xs text-slate-600" />
                         {posSlipImage && <img src={posSlipImage} alt="ตัวอย่างสลิปการโอนเงิน" className="max-h-56 max-w-full mx-auto rounded-md border border-slate-200 object-contain" />}
                         <button type="button" onClick={() => verifyPaymentSlip(posSlipImage, cartTotal, setPosSlipStatus, setPosSlipMessage, setPosSlipRef)} disabled={!posSlipImage || posSlipStatus === 'checking'} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-md py-2 text-xs font-semibold disabled:opacity-40">{posSlipStatus === 'checking' ? 'กำลังตรวจสอบ...' : 'ตรวจสอบสลิป'}</button>
                         {posSlipMessage && <p className={`text-xs font-semibold ${posSlipStatus === 'verified' ? 'text-emerald-600' : posSlipStatus === 'error' ? 'text-rose-600' : 'text-slate-600'}`}>{posSlipMessage}</p>}
                       </div>
                    )}

                    <button
                      onClick={confirmPOSPayment}
                       disabled={!paymentMethod || (paymentMethod === 'cash' ? Number(cashReceived) < cartTotal : posSlipStatus !== 'verified' || !posSlipRef)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-md shadow-sm transition disabled:opacity-40"
                    >
                      ยืนยันการชำระเงิน
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* สลิป POS */}
            {posStep === 'receipt' && receiptData && (
              <div className="max-w-md mx-auto space-y-4">
                <button 
                  onClick={() => setPosStep('browse')}
                  className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 font-medium"
                >
                  <ArrowLeft className="w-4 h-4" /> ทำรายการขายต่อไป
                </button>

                <div ref={printRef} style={receiptStyle} className="receipt-print bg-white border border-slate-200 rounded-lg p-6 shadow-sm font-mono text-slate-800 text-xs">
                  <div className="text-center pb-4 border-b border-dashed border-slate-300">
                    <h3 className="font-bold text-base font-sans">{settings.storeName || 'MOTOFIX SERVICE'}</h3>
                    <p className="text-[11px] text-slate-500">{settings.storePhone ? `โทร. ${settings.storePhone}` : ''}</p>
                    <p className="font-bold mt-2">{receiptData.title}</p>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>เลขที่: {receiptData.receiptNo}</span>
                      <span>{receiptData.date}</span>
                    </div>
                  </div>

                  <div className="py-3 space-y-2 border-b border-dashed border-slate-300">
                    {receiptData.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="truncate max-w-[200px]">{item.name} x{item.qty}</span>
                        <span>฿{item.price * item.qty}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 space-y-1.5">
                    <div className="flex justify-between font-bold text-sm">
                      <span>ยอดรวมสุทธิ</span>
                      <span>฿{receiptData.total}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>วิธีชำระ</span>
                      <span>{receiptData.paymentMethod}</span>
                    </div>
                    {receiptData.paymentMethod === 'เงินสด' && (
                      <>
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>รับเงิน</span>
                          <span>฿{receiptData.cashReceived}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>เงินทอน</span>
                          <span>฿{receiptData.change}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="text-center pt-6 text-[10px] text-slate-400 font-sans">
                    {settings.receiptFooter || 'ขอบคุณที่ใช้บริการ'}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handlePrint}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-md flex items-center justify-center gap-2 text-sm shadow-sm"
                  >
                    <Printer className="w-4 h-4" /> พิมพ์ใบเสร็จ
                  </button>
                  <button
                    onClick={() => setPosStep('browse')}
                    className="px-6 py-2 border border-slate-300 rounded-md text-sm font-medium hover:bg-slate-50"
                  >
                    เสร็จสิ้น
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {mainMode === 'repair' && (
          <div>
            {repairStep === 'list' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center flex-wrap gap-3 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-blue-600" /> จัดการงานซ่อม
                  </h3>
                  <div className="relative flex-1 min-w-[220px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="search"
                      value={jobSearchTerm}
                      onChange={e => setJobSearchTerm(e.target.value)}
                      placeholder="ค้นหาทะเบียน เลขงาน หรือลูกค้า..."
                      className="w-full h-9 pl-9 pr-3 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full lg:w-auto">
                    <input type="date" value={jobDateFrom} onChange={e => setJobDateFrom(e.target.value)} className="h-9 border border-slate-300 rounded-md px-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="วันที่เริ่มต้น" />
                    <span className="text-xs text-slate-400">ถึง</span>
                    <input type="date" value={jobDateTo} onChange={e => setJobDateTo(e.target.value)} className="h-9 border border-slate-300 rounded-md px-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="วันที่สิ้นสุด" />
                  </div>
                  <button
                    onClick={() => setRepairStep('create')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md text-sm flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Plus className="w-4 h-4" /> เปิดใบงานซ่อมใหม่
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setJobView('active')} className={`px-3 py-1.5 rounded-md text-xs font-semibold border ${jobView === 'active' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300'}`}>งานปัจจุบัน</button>
                  <button type="button" onClick={() => setJobView('archive')} className={`px-3 py-1.5 rounded-md text-xs font-semibold border ${jobView === 'archive' ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-600 border-slate-300'}`}>คลังประวัติ</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {paginatedJobs.map(job => (
                    <div
                      key={job.id}
                      onClick={() => { setSelectedJob(job); setRepairStep('detail'); }}
                      className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:border-blue-400 transition cursor-pointer flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-slate-900 text-base">{job.plate}</span>
                          <div className="flex gap-1.5">
                            {job.paid && (
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                                ชำระแล้ว
                              </span>
                            )}
                            <span className={`text-[11px] px-2.5 py-0.5 rounded border font-bold ${
                              job.status === 'เสร็จสิ้น' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              job.status === 'กำลังซ่อม' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}>
                              {job.status}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-1">{job.tracking}</p>
                        <p className="text-xs text-slate-500 mt-1">วันที่เปิดงาน: {job.date || new Date(job.createdAt).toLocaleString('th-TH')}</p>
                        {job.archived && <p className="text-xs text-slate-500 mt-1">วิธีชำระเงิน: <span className="font-semibold text-slate-700">{job.paymentMethod || '-'}</span></p>}
                        <p className="text-sm text-slate-600 mt-2 line-clamp-2">อาการ: {job.issue}</p>
                      </div>

                      <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-xs text-slate-500">
                        <span>ช่าง: {job.mechanic}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-600 text-sm">฿{getJobEstimate(job)}</span>
                          {jobView === 'active' && job.status === 'เสร็จสิ้น' && job.paid && (
                            <button type="button" onClick={event => archiveJob(event, job)} className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 border border-slate-200 rounded px-2 py-1">เก็บประวัติ</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredJobs.length === 0 && (
                    <div className="col-span-full py-12 text-center text-sm text-slate-400 bg-white border border-dashed border-slate-300 rounded-lg">
                      ไม่พบงานซ่อมที่ค้นหา
                    </div>
                  )}
                </div>
                {totalJobsPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button type="button" onClick={() => setJobsPage(page => Math.max(1, page - 1))} disabled={currentJobsPage === 1} className="px-3 py-1.5 rounded-md border border-slate-300 text-sm disabled:opacity-40">ก่อนหน้า</button>
                    {Array.from({ length: totalJobsPages }, (_, index) => index + 1).map(page => (
                      <button key={page} type="button" onClick={() => setJobsPage(page)} className={`w-8 h-8 rounded-md text-sm font-semibold ${page === currentJobsPage ? 'bg-blue-600 text-white' : 'border border-slate-300 text-slate-600 hover:bg-slate-50'}`}>{page}</button>
                    ))}
                    <button type="button" onClick={() => setJobsPage(page => Math.min(totalJobsPages, page + 1))} disabled={currentJobsPage === totalJobsPages} className="px-3 py-1.5 rounded-md border border-slate-300 text-sm disabled:opacity-40">ถัดไป</button>
                  </div>
                )}
              </div>
            )}

            {repairStep === 'create' && (
              <div className="max-w-2xl bg-white border border-slate-200 rounded-lg p-6 md:p-8 shadow-sm">
                <button 
                  onClick={() => setRepairStep('list')}
                  className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6 font-medium"
                >
                  <ArrowLeft className="w-4 h-4" /> ย้อนกลับ
                </button>

                <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <FileText className="w-5 h-5 text-blue-600" /> แบบฟอร์มรับรถ/เปิดใบงานซ่อม
                </h3>

                <form onSubmit={handleCreateJob} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">ทะเบียนรถ *</label>
                      <input
                        type="text"
                        placeholder="เช่น 1กข 1234 กทม"
                        value={newJobForm.plate}
                        onChange={e => setNewJobForm({ ...newJobForm, plate: e.target.value })}
                        className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">ชื่อลูกค้า</label>
                      <input
                        type="text"
                        placeholder="ชื่อลูกค้า"
                        value={newJobForm.customerName}
                        onChange={e => setNewJobForm({ ...newJobForm, customerName: e.target.value })}
                        className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">เบอร์โทรศัพท์ *</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="กรอกเบอร์โทรศัพท์ 10 หลัก"
                        value={newJobForm.phone}
                        onChange={e => setNewJobForm({ ...newJobForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                        className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                      />
                      {newJobForm.phone.length > 0 && newJobForm.phone.length < 10 && (
                        <p className="text-xs text-rose-600 mt-1">กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">ช่างผู้รับผิดชอบ *</label>
                      <select
                        value={newJobForm.mechanic}
                        onChange={e => setNewJobForm({ ...newJobForm, mechanic: e.target.value })}
                        className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        required // 🟢 บังคับให้ต้องเลือกช่างก่อนเปิดบิล
                      >
                        <option value="">-- กรุณาเลือกช่าง --</option>
                        {/* 🟢 วนลูปรายชื่อช่างจากฐานข้อมูลมาแสดง */}
                        {mechanics.map(mech => (
                          <option key={mech.id} value={mech.name}>
                            {mech.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">ค่าแรงเริ่มต้น (บาท)</label>
                      <input
                        type="number"
                        value={newJobForm.wage}
                        onChange={e => setNewJobForm({ ...newJobForm, wage: e.target.value })}
                        className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">รายละเอียดอาการเสีย *</label>
                    <textarea
                      rows={3}
                      placeholder="ระบุอาการ เช่น สตาร์ทไม่ติด, มีเสียงดังที่ล้อหลัง"
                      value={newJobForm.issue}
                      onChange={e => setNewJobForm({ ...newJobForm, issue: e.target.value })}
                      className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-md shadow-sm text-sm transition"
                    >
                      บันทึกใบงาน
                    </button>
                    <button
                      type="button"
                      onClick={() => setRepairStep('list')}
                      className="px-6 py-2.5 border border-slate-300 rounded-md text-sm font-medium hover:bg-slate-50"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </form>
              </div>
            )}

            {repairStep === 'job-ticket' && selectedJob && (
              <div className="max-w-md mx-auto space-y-4">
                <div ref={jobTicketRef} className="print-ticket bg-white border border-slate-200 rounded-lg p-6 shadow-sm print:shadow-none print:border-0">
                  <div className="text-center border-b border-dashed border-slate-300 pb-4">
                        <h2 className="font-bold text-xl text-slate-900">MOTOFIX SERVICE</h2>
                    <p className="text-sm text-slate-500 mt-1">ใบรับรถ / ใบส่งซ่อม</p>
                    <p className="font-mono font-bold text-blue-700 text-lg mt-3">{selectedJob.tracking}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 py-5 text-sm">
                    <div><p className="text-xs text-slate-500">ทะเบียนรถ</p><p className="font-bold text-slate-900 mt-1">{selectedJob.plate}</p></div>
                    <div><p className="text-xs text-slate-500">วันที่รับรถ</p><p className="font-semibold text-slate-900 mt-1">{selectedJob.date || new Date(selectedJob.createdAt).toLocaleString('th-TH')}</p></div>
                    <div><p className="text-xs text-slate-500">ชื่อลูกค้า</p><p className="font-semibold text-slate-900 mt-1">{selectedJob.customerName || '-'}</p></div>
                    <div><p className="text-xs text-slate-500">เบอร์โทรศัพท์</p><p className="font-semibold text-slate-900 mt-1">{selectedJob.phone || '-'}</p></div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-md p-4">
                    <p className="text-xs font-semibold text-slate-500">อาการเสียที่แจ้ง</p>
                    <p className="text-sm text-slate-900 mt-2 whitespace-pre-wrap">{selectedJob.issue}</p>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 mt-5 pt-4 text-sm">
                    <span>ช่างผู้รับผิดชอบ: <strong>{selectedJob.mechanic}</strong></span>
                    <span>สถานะ: <strong>{selectedJob.status}</strong></span>
                  </div>
                  <div className="text-center border-t border-dashed border-slate-300 mt-5 pt-5">
                    {jobQrCode ? <img src={jobQrCode} alt="QR Code สำหรับตรวจสอบสถานะงานซ่อม" className="w-36 h-36 mx-auto" /> : <div className="w-36 h-36 mx-auto border border-slate-200 rounded-md" />}
                    <p className="text-[11px] text-slate-500 mt-2">สแกนเพื่อเช็กสถานะงานซ่อม</p>
                  </div>
                  <p className="text-center text-xs text-slate-400 mt-8">กรุณานำใบนี้มาแสดงเมื่อติดต่อรับรถ</p>
                </div>
                <div className="flex flex-wrap gap-2 print:hidden">
                  <button type="button" onClick={handlePrintJobTicket} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md py-2.5 text-sm font-semibold flex items-center justify-center gap-2"><Printer className="w-4 h-4" /> พิมพ์ใบส่งซ่อม</button>
                  <button type="button" onClick={() => setRepairStep('detail')} className="px-5 border border-slate-300 rounded-md text-sm font-semibold">ดูรายละเอียดงาน</button>
                  <button type="button" onClick={() => setRepairStep('list')} className="px-5 border border-slate-300 rounded-md text-sm font-semibold">กลับรายการงาน</button>
                </div>
              </div>
            )}

            {repairStep === 'detail' && selectedJob && (
              <div className="space-y-6">
                <button 
                  onClick={() => setRepairStep('list')}
                  className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 font-medium"
                >
                  <ArrowLeft className="w-4 h-4" /> ย้อนกลับไปรายการซ่อม
                </button>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* ข้อมูลรถ & ลูกค้า */}
                  <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4 h-fit">
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-mono bg-slate-100 border border-slate-200 text-slate-700 px-2 py-1 rounded font-semibold">
                          {selectedJob.tracking}
                        </span>
                        {selectedJob.paid && (
                          <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded">
                            ชำระเงินแล้ว
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-xl text-slate-900 mt-3">{selectedJob.plate}</h3>
                       <p className="text-sm text-slate-500 mt-1">ลูกค้า: {selectedJob.customerName} ({selectedJob.phone})</p>
                       <p className="text-xs text-slate-500 mt-2">วันที่เปิดงาน: <span className="font-semibold text-slate-700">{selectedJob.date || new Date(selectedJob.createdAt).toLocaleString('th-TH')}</span></p>
                       <button
                         type="button"
                         onClick={() => setRepairStep('job-ticket')}
                         className="mt-3 w-full border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md py-2 text-sm font-semibold"
                       >
                         ดูใบเปิดงาน
                       </button>
                     </div>

                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-md">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-700">อาการเสียที่แจ้ง:</p>
                        {!selectedJob.paid && !selectedJob.archived && !isEditingIssue && (
                          <button type="button" onClick={() => { setIssueDraft(selectedJob.issue); setIsEditingIssue(true); }} className="text-xs text-blue-600 hover:text-blue-800 font-semibold">แก้ไข</button>
                        )}
                      </div>
                      {isEditingIssue ? (
                        <div className="mt-2 space-y-2">
                          <textarea value={issueDraft} onChange={event => setIssueDraft(event.target.value)} rows={4} maxLength={500} className="w-full border border-blue-300 rounded-md p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus />
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setIsEditingIssue(false)} className="px-3 py-1.5 border border-slate-300 rounded-md text-xs font-semibold">ยกเลิก</button>
                            <button type="button" onClick={saveJobIssue} className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold">บันทึก</button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-800 mt-1">{selectedJob.issue}</p>
                      )}
                      <p className="text-xs text-slate-500 mt-3">ช่างดูแล: <span className="font-medium text-slate-700">{selectedJob.mechanic}</span></p>
                    </div>

                    {selectedJob.status === 'เสร็จสิ้น' && !selectedJob.paid && (
                      <button
                        onClick={() => setRepairStep('checkout')}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-md shadow-sm transition flex items-center justify-center gap-2 text-sm mt-4"
                      >
                        <DollarSign className="w-4 h-4" /> คิดเงิน / ปิดบิล
                      </button>
                    )}
                  </div>

                  {/* ส่วนการทำงานของช่าง */}
                  <div className="md:col-span-2 space-y-6">
                    {/* เปลี่ยนสถานะงาน */}
                    <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-3">
                      <h4 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">เปลี่ยนสถานะงานซ่อม</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={() => updateJobStatus('รอคิว')}
                          className={`p-3 rounded-md border text-xs font-semibold flex flex-col items-center gap-2 transition ${
                            selectedJob.status === 'รอคิว' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Clock className="w-4 h-4" /> รอคิว
                        </button>
                        <button
                          onClick={() => updateJobStatus('กำลังซ่อม')}
                          className={`p-3 rounded-md border text-xs font-semibold flex flex-col items-center gap-2 transition ${
                            selectedJob.status === 'กำลังซ่อม' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Wrench className="w-4 h-4" /> กำลังซ่อม
                        </button>
                        <button
                          onClick={() => updateJobStatus('เสร็จสิ้น')}
                          className={`p-3 rounded-md border text-xs font-semibold flex flex-col items-center gap-2 transition ${
                            selectedJob.status === 'เสร็จสิ้น' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" /> เสร็จสิ้น
                        </button>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-5">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                          <PackagePlus className="w-4 h-4 text-blue-600" /> เบิกอะไหล่สำหรับงานซ่อม
                        </h4>
                        <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">ตัดสต็อกทันทีเมื่อเบิก</span>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-3">
                        <label className="block text-sm font-semibold text-slate-700">
                          เลือกรายการอะไหล่ในคลัง
                        </label>
                        {isPartSearchOpen && (
                          <input
                            type="search"
                            value={partSearchTerm}
                            onChange={e => setPartSearchTerm(e.target.value)}
                            placeholder="พิมพ์ชื่อสินค้าเพื่อค้นหา..."
                            autoFocus
                            className="w-full h-10 border border-blue-300 rounded-md px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 transition"
                          />
                        )}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                          <div className="relative flex-1">
                            <select
                              value={selectedPartToUse}
                              onChange={e => setSelectedPartToUse(e.target.value)}
                              className="w-full h-10 border border-slate-300 rounded-md px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 transition cursor-pointer"
                            >
                              <option value="">-- กรุณาเลือกอะไหล่ที่จะเบิก --</option>
                              {searchableParts.map(p => (
                                <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                                  [{p.category}] {p.name} (คงเหลือ {p.stock}) — ฿{p.price}
                                </option>
                              ))}
                              {searchableParts.length === 0 && (
                                <option value="" disabled>ไม่พบสินค้าที่ค้นหา</option>
                              )}
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setIsPartSearchOpen(value => !value);
                              if (isPartSearchOpen) setPartSearchTerm('');
                            }}
                            className="h-10 px-4 rounded-md text-sm font-semibold border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-2 transition shrink-0"
                          >
                            <Search className="w-4 h-4 text-blue-600" />
                            {isPartSearchOpen ? 'ปิดค้นหา' : 'ค้นหาสินค้า'}
                          </button>
                          <button
                            onClick={handleUsePartInRepair}
                            disabled={!selectedPartToUse}
                            className="h-10 px-5 rounded-md text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-2 transition disabled:opacity-40 shrink-0"
                          >
                            <Plus className="w-4 h-4 text-blue-400" />
                            <span>เบิกอะไหล่</span>
                          </button>
                        </div>
                        {activeSelectedPart && (
                          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium border border-blue-100">
                              หมวดหมู่: {activeSelectedPart.category}
                            </span>
                            <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium">
                              คงเหลือ {activeSelectedPart.stock} ชิ้น
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className="flex justify-between items-center text-sm font-semibold text-slate-800">
                          <span>รายการอะไหล่ที่เบิกใช้แล้ว ({selectedJob.partsUsed.length} รายการ)</span>
                        </div>
                        <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
                          {selectedJob.partsUsed.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                              {selectedJob.partsUsed.map((p, i) => (
                                <div key={i} className="p-3 flex justify-between items-center text-sm hover:bg-slate-50 transition">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                      {i + 1}
                                    </span>
                                    <span className="font-medium text-slate-800 truncate">{p.name}</span>
                                  </div>
                                  <div className="flex items-center gap-3 shrink-0">
                                    <div className="flex items-center border border-slate-200 rounded-md overflow-hidden">
                                      <button
                                        type="button"
                                        onClick={() => adjustUsedPartQty(p.id, -1)}
                                        className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition"
                                        aria-label={`ลดจำนวน ${p.name}`}
                                      >
                                        <Minus className="w-3.5 h-3.5" />
                                      </button>
                                      <span className="min-w-8 text-center text-xs font-semibold text-slate-700">x{p.qty}</span>
                                      <button
                                        type="button"
                                        onClick={() => adjustUsedPartQty(p.id, 1)}
                                        className="w-7 h-7 flex items-center justify-center text-blue-600 hover:bg-blue-50 transition"
                                        aria-label={`เพิ่มจำนวน ${p.name}`}
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    <span className="font-semibold text-slate-900">฿{p.price * p.qty}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="py-6 text-center text-sm text-slate-400">
                              ยังไม่มีการเบิกอะไหล่สำหรับรถคันนี้
                            </div>
                          )}
                        </div>

                        <div className="bg-white border border-slate-200 rounded-md p-3 flex justify-between items-center text-sm shadow-sm">
                          <div>
                            <span className="font-semibold text-slate-800">ค่าบริการ / ค่าแรงช่าง</span>
                          </div>
                          <div className="flex items-center gap-1.5 border border-slate-300 rounded px-2 py-1">
                            <span className="text-slate-400 font-semibold">฿</span>
                            <input
                              type="number"
                              value={selectedJob.wage}
                              onChange={e => handleUpdateWage(e.target.value)}
                              className="w-20 text-right font-bold text-slate-800 focus:outline-none text-sm bg-transparent"
                            />
                          </div>
                        </div>

                        <div className="flex justify-between items-center font-bold text-slate-900 pt-3 px-1 border-t border-slate-100">
                          <span className="text-sm text-slate-600">ยอดรวมประเมินทั้งหมด</span>
                          <span className="text-blue-600 text-xl">฿{getJobEstimate(selectedJob)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {repairStep === 'checkout' && selectedJob && (
              <div className="max-w-4xl bg-white border border-slate-200 rounded-lg p-6 md:p-8 shadow-sm">
                <button 
                  onClick={() => setRepairStep('detail')}
                  className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6 font-medium"
                >
                  <ArrowLeft className="w-4 h-4" /> ย้อนกลับ
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-slate-50 border border-slate-100 p-5 rounded-lg space-y-3 h-fit">
                    <div className="border-b border-slate-200 pb-3">
                      <h4 className="font-bold text-slate-800 text-sm">สรุปบิลงานซ่อม ({selectedJob.plate})</h4>
                      <p className="text-xs text-slate-500 mt-0.5">รหัสงาน: {selectedJob.tracking}</p>
                    </div>
                    <div className="divide-y divide-slate-200">
                      {selectedJob.partsUsed.map((item, idx) => (
                        <div key={idx} className="py-2.5 flex justify-between text-sm">
                          <span className="truncate max-w-[200px] text-slate-700">{item.name} x {item.qty}</span>
                          <span className="font-semibold text-slate-900">฿{item.price * item.qty}</span>
                        </div>
                      ))}
                      <div className="py-2.5 flex justify-between text-sm font-semibold text-slate-800">
                        <span>ค่าแรงช่าง ({selectedJob.mechanic})</span>
                        <span>฿{selectedJob.wage}</span>
                      </div>
                    </div>
                    <div className="border-t border-slate-300 pt-3 flex justify-between font-bold text-lg">
                      <span>ยอดรวมสุทธิ</span>
                      <span className="text-blue-600">฿{getJobEstimate(selectedJob)}</span>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <h4 className="font-bold text-slate-800 text-sm">เลือกวิธีชำระเงินค่างานซ่อม</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => selectRepairPaymentMethod('cash')}
                        className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition ${
                          repairPaymentMethod === 'cash' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Banknote className="w-7 h-7 text-emerald-600" />
                        <span className="text-sm font-semibold">เงินสด</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => selectRepairPaymentMethod('qr')}
                        className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition ${
                          repairPaymentMethod === 'qr' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <QrCode className="w-7 h-7 text-indigo-600" />
                        <span className="text-sm font-semibold">โอนจ่าย</span>
                      </button>
                    </div>

                    {!repairPaymentMethod ? (
                      <p className="text-sm text-slate-500 text-center border border-dashed border-slate-300 rounded-lg p-4">กรุณาเลือกวิธีชำระเงิน</p>
                    ) : repairPaymentMethod === 'cash' ? (
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">รับเงินมา (บาท)</label>
                        <input
                          type="number"
                          placeholder="ระบุจำนวนเงินที่รับ"
                          value={repairCashReceived}
                          onChange={e => setRepairCashReceived(e.target.value)}
                          className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        {Number(repairCashReceived) >= getJobEstimate(selectedJob) && (
                          <p className="text-xs text-emerald-600 font-bold">
                            เงินทอน: ฿{Number(repairCashReceived) - getJobEstimate(selectedJob)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="border border-dashed border-slate-300 rounded-lg p-4 text-center bg-slate-50 space-y-2">
                         <p className="text-xs text-slate-500">โอนเงินผ่านบัญชีธนาคาร แล้วอัปโหลดสลิป</p>
                         <input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => readSlipImage(event.target.files?.[0], setRepairSlipImage, setRepairSlipStatus, setRepairSlipMessage)} className="w-full text-xs text-slate-600" />
                         {repairSlipImage && <img src={repairSlipImage} alt="ตัวอย่างสลิปการโอนเงิน" className="max-h-56 max-w-full mx-auto rounded-md border border-slate-200 object-contain" />}
                         <button type="button" onClick={() => verifyPaymentSlip(repairSlipImage, getJobEstimate(selectedJob), setRepairSlipStatus, setRepairSlipMessage, setRepairSlipRef)} disabled={!repairSlipImage || repairSlipStatus === 'checking'} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-md py-2 text-xs font-semibold disabled:opacity-40">{repairSlipStatus === 'checking' ? 'กำลังตรวจสอบ...' : 'ตรวจสอบสลิป'}</button>
                         {repairSlipMessage && <p className={`text-xs font-semibold ${repairSlipStatus === 'verified' ? 'text-emerald-600' : repairSlipStatus === 'error' ? 'text-rose-600' : 'text-slate-600'}`}>{repairSlipMessage}</p>}
                       </div>
                    )}

                    <button
                      onClick={confirmRepairPayment}
                       disabled={!repairPaymentMethod || (repairPaymentMethod === 'cash' ? Number(repairCashReceived) < getJobEstimate(selectedJob) : repairSlipStatus !== 'verified' || !repairSlipRef)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-md shadow-sm transition disabled:opacity-40 text-sm"
                    >
                      ยืนยันปิดบิล & พิมพ์ใบเสร็จ
                    </button>
                  </div>
                </div>
              </div>
            )}

            {repairStep === 'receipt' && receiptData && (
              <div className="max-w-md mx-auto space-y-4">
                <button 
                  onClick={() => setRepairStep('list')}
                  className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 font-medium"
                >
                  <ArrowLeft className="w-4 h-4" /> กลับหน้ารายการคิวงานซ่อม
                </button>

                <div ref={printRef} style={receiptStyle} className="receipt-print bg-white border border-slate-200 rounded-lg p-6 shadow-sm font-mono text-slate-800 text-xs">
                  <div className="text-center pb-4 border-b border-dashed border-slate-300">
                    <h3 className="font-bold text-base font-sans">{settings.storeName || 'MOTOFIX SERVICE'}</h3>
                    <p className="text-[11px] text-slate-500">{settings.storePhone ? `โทร. ${settings.storePhone}` : ''}</p>
                    <p className="font-bold mt-2">{receiptData.title}</p>
                    <div className="text-[10px] text-slate-500 mt-1 space-y-0.5">
                      <div>เลขที่: {receiptData.receiptNo}</div>
                      <div>ทะเบียนรถ: {receiptData.plate}</div>
                      <div>ช่างผู้ซ่อม: {receiptData.mechanic}</div>
                      <div>{receiptData.date}</div>
                    </div>
                  </div>

                  <div className="py-3 space-y-2 border-b border-dashed border-slate-300">
                    <p className="font-bold text-[11px]">รายการค่าใช้จ่าย:</p>
                    {receiptData.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{item.name} x{item.qty}</span>
                        <span>฿{item.price * item.qty}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-slate-600">
                      <span>ค่าแรงและค่าบริการ</span>
                      <span>฿{receiptData.wage}</span>
                    </div>
                  </div>

                  <div className="pt-3 space-y-1.5">
                    <div className="flex justify-between font-bold text-sm">
                      <span>ยอดรวมสุทธิ</span>
                      <span>฿{receiptData.total}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>วิธีชำระ</span>
                      <span>{receiptData.paymentMethod}</span>
                    </div>
                    {receiptData.paymentMethod === 'เงินสด' && (
                      <>
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>รับเงิน</span>
                          <span>฿{receiptData.cashReceived}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>เงินทอน</span>
                          <span>฿{receiptData.change}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="text-center pt-6 text-[10px] text-slate-400 font-sans">
                    {`รับประกันงานซ่อม ${settings.warrantyDays || 7} วัน ${settings.receiptFooter || 'ขอบคุณที่ไว้วางใจ'}`}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handlePrint}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-md flex items-center justify-center gap-2 text-sm shadow-sm"
                  >
                    <Printer className="w-4 h-4" /> พิมพ์ใบเสร็จงานซ่อม
                  </button>
                  <button
                    onClick={() => setRepairStep('list')}
                    className="px-6 py-2.5 border border-slate-300 rounded-md text-sm font-medium hover:bg-slate-50"
                  >
                    เสร็จสิ้น
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
