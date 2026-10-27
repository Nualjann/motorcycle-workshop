import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';
import { 
  Package, Plus, Trash2, Edit2, TrendingUp, DollarSign, ArrowUpDown, ArrowUp, ArrowDown,
  ShoppingBag, Wrench, AlertTriangle, Search, X, Award, 
  FolderPlus, Users, Shield, UserCheck, UserPlus, Lock, AlertCircle, CheckCircle2, Menu, Settings,
  LayoutDashboard, ClipboardList, CircleDollarSign, Printer, RefreshCw, FileSpreadsheet,
  ChevronRight
} from 'lucide-react';

const DEFAULT_SETTINGS = {
  storeName: 'MotoFix Workshop', storeAddress: '', storePhone: '', taxId: '',
  receiptFooter: 'ขอบคุณที่ใช้บริการ', bankName: '', bankAccountName: '', bankAccountNumber: '',
  paperSize: '80mm', warrantyDays: '7', defaultWage: '100', trackingPrefix: 'RP',
  themeColor: 'blue', lowStockThreshold: '10'
};

function SystemSettingsForm({ settings, setSettings, onSaved }) {
  const [form, setForm] = useState({ ...DEFAULT_SETTINGS, ...(settings || {}) });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => setForm({ ...DEFAULT_SETTINGS, ...(settings || {}) }), [settings]);

  const updateField = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const presetTheme = ['blue', 'red'].includes(form.themeColor) ? form.themeColor : 'custom';
  const isCustomTheme = presetTheme === 'custom';
  const customThemeColor = /^#[0-9A-Fa-f]{6}$/.test(form.themeColor || '')
    ? form.themeColor
    : form.themeColor === 'emerald' ? '#059669' : form.themeColor === 'orange' ? '#ea580c' : '#2563eb';

  const saveSettings = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await axios.put('http://localhost:5000/api/settings', form);
      setSettings(response.data.settings);
      onSaved('บันทึกการตั้งค่าสำเร็จ');
    } catch (saveError) {
      setError(saveError.response?.data?.error || 'ไม่สามารถบันทึกการตั้งค่าได้');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={saveSettings} className="mt-6 space-y-6">
      {error && <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-sm">{error}</div>}
      <section className="border border-slate-200 rounded-lg p-5 space-y-4">
        <h4 className="font-bold text-slate-900">ข้อมูลร้าน</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            ['storeName', 'ชื่อร้าน'], ['storePhone', 'เบอร์โทรศัพท์'],
            ['storeAddress', 'ที่อยู่ร้าน'], ['taxId', 'เลขผู้เสียภาษี']
          ].map(([key, label]) => (
            <label key={key} className="text-sm font-semibold text-slate-700">
              {label}
              <input value={form[key] || ''} onChange={event => updateField(key, event.target.value)} className="mt-1.5 w-full border border-slate-300 rounded-md p-2.5 font-normal outline-none focus:ring-2 focus:ring-blue-500" />
            </label>
          ))}
        </div>
      </section>

      <section className="border border-slate-200 rounded-lg p-5 space-y-4">
        <h4 className="font-bold text-slate-900">ใบเสร็จ</h4>
        <label className="text-sm font-semibold text-slate-700 block">ข้อความท้ายใบเสร็จ
          <textarea value={form.receiptFooter || ''} onChange={event => updateField('receiptFooter', event.target.value)} rows="2" className="mt-1.5 w-full border border-slate-300 rounded-md p-2.5 font-normal outline-none focus:ring-2 focus:ring-blue-500" />
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm font-semibold text-slate-700">ขนาดกระดาษ
            <select value={form.paperSize || '80mm'} onChange={event => updateField('paperSize', event.target.value)} className="mt-1.5 w-full border border-slate-300 rounded-md p-2.5 font-normal bg-white">
              <option value="80mm">ใบเสร็จ 80 มม.</option>
              <option value="a4">กระดาษ A4</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">รับประกันงานซ่อม (วัน)
            <input type="number" min="0" max="100000" value={form.warrantyDays ?? '7'} onChange={event => updateField('warrantyDays', event.target.value)} className="mt-1.5 w-full border border-slate-300 rounded-md p-2.5 font-normal" />
          </label>
          <label className="text-sm font-semibold text-slate-700">เกณฑ์แจ้งเตือนสต็อกใกล้หมด (ชิ้น)
            <input type="number" min="0" max="100000" value={form.lowStockThreshold ?? '10'} onChange={event => updateField('lowStockThreshold', event.target.value)} className="mt-1.5 w-full border border-slate-300 rounded-md p-2.5 font-normal" />
          </label>
        </div>
      </section>

      <section className="border border-slate-200 rounded-lg p-5 space-y-4">
        <h4 className="font-bold text-slate-900">การชำระเงิน</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            ['bankName', 'ชื่อธนาคาร'], ['bankAccountName', 'ชื่อบัญชี'],
            ['bankAccountNumber', 'เลขบัญชี']
          ].map(([key, label]) => (
            <label key={key} className="text-sm font-semibold text-slate-700">
              {label}
              <input value={form[key] || ''} onChange={event => updateField(key, event.target.value)} className="mt-1.5 w-full border border-slate-300 rounded-md p-2.5 font-normal outline-none focus:ring-2 focus:ring-blue-500" />
            </label>
          ))}
        </div>
      </section>

      <section className="border border-slate-200 rounded-lg p-5 space-y-4">
        <h4 className="font-bold text-slate-900">หน้าตาระบบ</h4>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end max-w-xl">
          <label className="text-sm font-semibold text-slate-700">สีธีมสำเร็จรูป
            <select value={presetTheme} onChange={event => updateField('themeColor', event.target.value === 'custom' ? customThemeColor : event.target.value)} className="mt-1.5 w-full border border-slate-300 rounded-md p-2.5 font-normal bg-white">
              <option value="blue">น้ำเงิน</option>
              <option value="red">แดง</option>
              <option value="custom">กำหนดเอง</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">เลือกสีเอง
            <div className="mt-1.5 flex items-center gap-2">
              <input type="color" value={isCustomTheme ? customThemeColor : '#2563eb'} onChange={event => updateField('themeColor', event.target.value)} className="h-11 w-14 cursor-pointer rounded-md border border-slate-300 bg-white p-1" aria-label="เลือกสีธีม" />
              <input type="text" value={isCustomTheme ? customThemeColor : '#2563eb'} onChange={event => updateField('themeColor', event.target.value)} maxLength={7} placeholder="#2563EB" className="w-28 border border-slate-300 rounded-md p-2.5 font-mono font-normal uppercase" aria-label="รหัสสีธีม" />
            </div>
          </label>
        </div>
        <p className="text-xs text-slate-500">เลือกสีจากตัวเลือก หรือระบุรหัสสีรูปแบบ #RRGGBB</p>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-5 py-2.5 font-semibold disabled:opacity-50">
          {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
        </button>
        {settings?.updatedAt && <span className="text-xs text-slate-400">แก้ไขล่าสุด {new Date(settings.updatedAt).toLocaleString('th-TH')}</span>}
      </div>
    </form>
  );
}

export default function AdminDashboard({ parts, setParts, jobs, categories, setCategories, posSales = [], settings, setSettings }) {
  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [reportDateFrom, setReportDateFrom] = useState('');
  const [reportDateTo, setReportDateTo] = useState('');
  const analyticsPrintRef = useRef(null);
  const salesPrintRef = useRef(null);
  const handlePrintAnalytics = useReactToPrint({
    contentRef: salesPrintRef,
    pageStyle: '@page { size: A4; margin: 12mm; }'
  });
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ทั้งหมด');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [sortConfig, setSortConfig] = useState({ table: null, key: null, direction: 'asc' });

  // ==================== CUSTOM ALERTS & CONFIRMS ====================
  const [successAlert, setSuccessAlert] = useState('');
  const [importResultModal, setImportResultModal] = useState({ isOpen: false, imported: 0, updated: 0, duplicates: [], errors: [] });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, message: '', onConfirm: null });
  const importFileRef = useRef(null);
    const restoreFileRef = useRef(null);
  const [backupLoading, setBackupLoading] = useState(false);

  useEffect(() => {
    if (!successAlert) return undefined;

    const timeoutId = window.setTimeout(() => setSuccessAlert(''), 1500);
    return () => window.clearTimeout(timeoutId);
  }, [successAlert]);

  // ==================== USER MANAGEMENT ====================
  const [usersList, setUsersList] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); 
  const [userFormData, setUserFormData] = useState({ name: '', username: '', password: '', role: 'staff' });
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState('');

  const handleSort = (table, key) => {
    setSortConfig(current => ({
      table,
      key,
      direction: current.table === table && current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
    if (table === 'parts') setPartsPage(1);
  };

  const selectAdminTab = (tab) => {
    setActiveTab(tab);
    setIsAdminMenuOpen(false);
  };

  const getSortValue = (row, key) => {
    if (key === 'status') {
      if (typeof row.stock === 'number') return row.stock <= 2 ? 0 : row.stock < 10 ? 1 : 2;
      return row.status === 'active' ? 1 : 0;
    }
    return row[key] ?? '';
  };

  const sortRows = (rows, table, keys) => {
    if (sortConfig.table !== table || !keys.includes(sortConfig.key)) return rows;
    const multiplier = sortConfig.direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const first = getSortValue(a, sortConfig.key);
      const second = getSortValue(b, sortConfig.key);
      if (typeof first === 'number' && typeof second === 'number') return (first - second) * multiplier;
      return String(first).localeCompare(String(second), 'th', { numeric: true, sensitivity: 'base' }) * multiplier;
    });
  };

  const SortButton = ({ table, sortKey, children, className = '' }) => {
    const isActive = sortConfig.table === table && sortConfig.key === sortKey;
    const Icon = isActive ? (sortConfig.direction === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
    return (
      <button
        type="button"
        onClick={() => handleSort(table, sortKey)}
        className={`inline-flex items-center gap-1.5 hover:text-blue-600 transition ${className}`}
      >
        <span>{children}</span>
        <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} aria-hidden="true" />
      </button>
    );
  };

  useEffect(() => {
    const fetchUsers = async () => {
      if (activeTab === 'users') {
        try {
          const response = await axios.get('http://localhost:5000/api/auth/users');
          const usersWithStatus = response.data.map(u => ({ ...u, status: 'active' }));
          setUsersList(usersWithStatus);
        } catch (error) {
          console.error("Error fetching users:", error);
        }
      }
    };
    fetchUsers();
  }, [activeTab]);

  const handleOpenUserModal = (user = null) => {
    setUserError('');
    if (user) {
      setEditingUser(user);
      setUserFormData({ name: user.name, username: user.username, password: '', role: user.role });
    } else {
      setEditingUser(null);
      setUserFormData({ name: '', username: '', password: '', role: 'staff' });
    }
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setUserLoading(true);
    setUserError('');

    try {
      if (editingUser) {
        if (!userFormData.name) return setUserError('กรุณากรอกชื่อ-นามสกุล');
        if (userFormData.password && userFormData.password.length < 6) {
          return setUserError('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
        }
        const response = await axios.put(`http://localhost:5000/api/auth/users/${editingUser.id}`, {
          name: userFormData.name, role: userFormData.role, password: userFormData.password
        });
        setUsersList(usersList.map(u => u.id === editingUser.id ? { ...u, ...response.data.user } : u));
        setIsUserModalOpen(false);
        setSuccessAlert('แก้ไขข้อมูลสำเร็จ'); // <--- แจ้งเตือนแก้ไขสำเร็จ
      } else {
        if (!userFormData.name || !userFormData.username || !userFormData.password) {
          setUserLoading(false);
          return setUserError('กรุณากรอกข้อมูลให้ครบถ้วน');
        }
        const response = await axios.post('http://localhost:5000/api/auth/register', {
          username: userFormData.username, password: userFormData.password, name: userFormData.name, role: userFormData.role
        });
        const newUser = { ...response.data.user, status: 'active' };
        setUsersList([...usersList, newUser]);
        setIsUserModalOpen(false);
        setSuccessAlert('เพิ่มสำเร็จ'); // <--- แจ้งเตือนเพิ่มสำเร็จ
      }
    } catch (error) {
      setUserError(error.response?.data?.error || 'เกิดข้อผิดพลาดในการบันทึกบัญชี');
    } finally {
      setUserLoading(false);
    }
  };

  const handleDeleteUserClick = (id, username) => {
    if (username === 'admin') return setUserError('ไม่อนุญาตให้ลบบัญชี admin หลัก');
    
    // เรียกหน้าต่างยืนยันการลบ
    setConfirmDialog({
      isOpen: true,
      message: `ต้องการลบบัญชี "${username}" ใช่หรือไม่?`,
      onConfirm: async () => {
        try {
          await axios.delete(`http://localhost:5000/api/auth/users/${id}`);
          setUsersList(usersList.filter(u => u.id !== id));
          setConfirmDialog({ isOpen: false });
          setSuccessAlert('ลบสำเร็จ'); // <--- แจ้งเตือนลบสำเร็จ
        } catch (error) {
          setUserError('เกิดข้อผิดพลาดในการลบผู้ใช้งาน');
        }
      }
    });
  };

  // ==================== CALCULATION ====================
  const paidJobs = jobs.filter(j => j.paid);
  const repairRevenue = paidJobs.reduce((sum, j) => sum + j.total, 0);
  const posRevenue = posSales.reduce((sum, p) => sum + p.total, 0);
  const totalRevenue = repairRevenue + posRevenue;

  const salesMap = {};
  paidJobs.forEach(job => {
    job.partsUsed?.forEach(item => {
      if (!salesMap[item.name]) salesMap[item.name] = { name: item.name, qty: 0, revenue: 0 };
      salesMap[item.name].qty += item.qty;
      salesMap[item.name].revenue += (item.price * item.qty);
    });
  });

  posSales.forEach(order => {
    order.items?.forEach(item => {
      if (!salesMap[item.name]) salesMap[item.name] = { name: item.name, qty: 0, revenue: 0 };
      salesMap[item.name].qty += item.qty;
      salesMap[item.name].revenue += (item.price * item.qty);
    });
  });

  const topSellingProducts = Object.values(salesMap).sort((a, b) => b.qty - a.qty);
  const configuredThreshold = Number(settings?.lowStockThreshold);
  const lowStockThreshold = Number.isFinite(configuredThreshold) && configuredThreshold > 0 ? configuredThreshold : 10;
  const lowStockParts = parts.filter(p => Number(p.stock) <= lowStockThreshold);
  const totalStockValue = parts.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const pendingJobs = jobs.filter(job => !job.paid && job.status === 'รอคิว');
  const repairingJobs = jobs.filter(job => !job.paid && job.status === 'กำลังซ่อม');
  const unpaidJobs = jobs.filter(job => !job.paid);
  const recentJobs = [...jobs].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5);
  const recentPosSales = posSales.slice(0, 5);

  const isInReportRange = record => {
    const createdAt = new Date(record.createdAt || 0);
    const from = reportDateFrom ? new Date(`${reportDateFrom}T00:00:00`) : null;
    const to = reportDateTo ? new Date(`${reportDateTo}T23:59:59.999`) : null;
    return (!from || createdAt >= from) && (!to || createdAt <= to);
  };
  const reportPaidJobs = paidJobs.filter(isInReportRange);
  const reportPosSales = posSales.filter(isInReportRange);
  const reportSalesMap = {};
  [...reportPaidJobs, ...reportPosSales].forEach(record => {
    const items = record.partsUsed || record.items || [];
    items.forEach(item => {
      if (!reportSalesMap[item.name]) {
        reportSalesMap[item.name] = { 
          name: item.name, 
          qty: 0, 
          revenue: 0, 
          recordedCost: 0 
        };
      }
      const itemQty = Number(item.qty) || 0;
      const itemPrice = Number(item.price) || 0;
      const itemCost = Number(item.costPrice || 0);
      reportSalesMap[item.name].qty += itemQty;
      reportSalesMap[item.name].revenue += itemPrice * itemQty;
      reportSalesMap[item.name].recordedCost += itemCost * itemQty;
    });
  });
  const reportTopSellingProducts = Object.values(reportSalesMap).sort((a, b) => b.qty - a.qty);
  const reportRepairRevenue = reportPaidJobs.reduce((sum, job) => sum + (Number(job.total) || 0), 0);
  const reportPosRevenue = reportPosSales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);
  const reportTotalRevenue = reportRepairRevenue + reportPosRevenue;
  const reportPaymentMethods = ['เงินสด', 'โอนจ่าย'];
  const normalizeReportPaymentMethod = method => {
    const value = String(method || '').trim().toLowerCase();
    if (value === 'โอนจ่าย' || value === 'พร้อมเพย์' || value === 'qr' || value === 'promptpay') return 'โอนจ่าย';
    return 'เงินสด';
  };
  const reportPaymentBreakdown = [...reportPaidJobs, ...reportPosSales].reduce((summary, record) => {
    const method = normalizeReportPaymentMethod(record.paymentMethod);
    summary[method] += Number(record.total) || 0;
    return summary;
  }, Object.fromEntries(reportPaymentMethods.map(method => [method, 0])));
  const reportByMonth = [...reportPaidJobs, ...reportPosSales].reduce((summary, record) => {
    const month = new Date(record.createdAt || 0).toISOString().slice(0, 7);
    summary[month] = (summary[month] || 0) + (Number(record.total) || 0);
    return summary;
  }, {});

  const exportAnalyticsExcel = () => {
    const storeTitle = settings?.storeName || 'MotoFix Workshop';
    const storeAddr = settings?.storeAddress || '';
    const storeTel = settings?.storePhone ? `โทร. ${settings.storePhone}` : '';
    const storeTax = settings?.taxId ? `เลขประจำตัวผู้เสียภาษี: ${settings.taxId}` : '';
    const dateRangeStr = (reportDateFrom || reportDateTo)
      ? `ระหว่างวันที่: ${reportDateFrom || 'เริ่มต้น'} ถึง ${reportDateTo || 'ปัจจุบัน'}`
      : 'ช่วงเวลา: ข้อมูลการขายทั้งหมด';
    const printDateStr = `วันที่พิมพ์เอกสาร: ${new Date().toLocaleString('th-TH')}`;

    // Map ข้อมูลอะไหล่เพื่อดึงหมวดหมู่และราคาทุนจริง
    const partMap = {};
    parts.forEach(p => {
      partMap[p.name] = p;
    });

    // -------------------------------------------------------------
    // SHEET 1: สรุปยอดขายสินค้าและอะไหล่ (แบบทางการ)
    // -------------------------------------------------------------
    const totalQtySold = reportTopSellingProducts.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
    const totalRevenueSold = reportTopSellingProducts.reduce((sum, item) => sum + (Number(item.revenue) || 0), 0);
    let totalCostSold = 0;

    const sheet1Rows = [
      [storeTitle.toUpperCase()],
      [storeAddr ? `${storeAddr} ${storeTel}` : (storeTel || 'รายงานประจำสถานประกอบการ')],
      [storeTax ? storeTax : 'เอกสารสรุปยอดขายสินค้าและบริการ'],
      [''],
      ['รายงานสรุปยอดขายแยกตามรายการสินค้าและอะไหล่ (Sales Summary by Product)'],
      [`${dateRangeStr}    |    ${printDateStr}`],
      [''],
      [
        'ลำดับ',
        'ชื่อรายการสินค้า / อะไหล่',
        'หมวดหมู่',
        'จำนวนที่ขาย (ชิ้น)',
        'ราคาขายเฉลี่ย (บาท)',
        'ราคาทุนเฉลี่ย (บาท)',
        'ยอดขายรวม (บาท)',
        'ต้นทุนรวม (บาท)',
        'กำไรขั้นต้น (บาท)',
        'อัตรากำไร (%)'
      ]
    ];

    reportTopSellingProducts.forEach((item, index) => {
      const partInfo = partMap[item.name];
      const category = partInfo?.category || 'ทั่วไป';
      const avgPrice = item.qty > 0 ? Math.round(item.revenue / item.qty) : 0;
      
      // คำนวณต้นทุน:
      // 1) ใช้ต้นทุนที่บันทึกไว้ในบิลจริงขณะขาย (item.recordedCost) ถ้ามี
      // 2) ถ้าไม่มี ให้ดูจากข้อมูลอะไหล่ปัจจุบัน (partInfo.costPrice)
      // 3) ป้องกันกรณีราคาขายต่ำกว่าต้นทุนผิดปกติจากบิลเก่าที่ราคาขายเดิมน้อยกว่าราคาตลาดปัจจุบัน
      let totalCost = 0;
      let unitCost = 0;
      if (item.recordedCost && item.recordedCost > 0) {
        totalCost = item.recordedCost;
        unitCost = Math.round(totalCost / item.qty);
      } else if (partInfo && Number(partInfo.costPrice) > 0) {
        const currentPartCost = Number(partInfo.costPrice);
        // หากราคาทุนปัจจุบันสูงกว่าราคาขายจริงในอดีต (เช่น บิลเก่า 40 บาท แต่ต้นทุนอะไหล่ใหม่ 1,955 บาท)
        // แสดงว่าบิลเก่าขายด้วยราคาเดิม จึงให้ปรับสัดส่วนต้นทุนตามอัตราส่วนของอะไหล่ปัจจุบัน
        if (currentPartCost >= avgPrice && Number(partInfo.price) > 0) {
          const costRatio = currentPartCost / Number(partInfo.price);
          unitCost = Math.round(avgPrice * costRatio);
        } else {
          unitCost = currentPartCost;
        }
        totalCost = unitCost * item.qty;
      }

      const profit = item.revenue - totalCost;
      const profitMargin = item.revenue > 0 ? ((profit / item.revenue) * 100).toFixed(1) + '%' : '0.0%';

      totalCostSold += totalCost;

      sheet1Rows.push([
        index + 1,
        item.name,
        category,
        item.qty,
        avgPrice,
        unitCost,
        item.revenue,
        totalCost,
        profit,
        profitMargin
      ]);
    });

    const totalProfit = totalRevenueSold - totalCostSold;
    const totalProfitMargin = totalRevenueSold > 0 ? ((totalProfit / totalRevenueSold) * 100).toFixed(1) + '%' : '0.0%';

    sheet1Rows.push(['']);
    sheet1Rows.push([
      'รวมทั้งสิ้น',
      `รวมทั้งหมด ${reportTopSellingProducts.length} รายการสินค้า`,
      '-',
      totalQtySold,
      '-',
      '-',
      totalRevenueSold,
      totalCostSold,
      totalProfit,
      totalProfitMargin
    ]);
    sheet1Rows.push(['']);
    sheet1Rows.push(['', '', '', '', '', 'ลงชื่อผู้จัดทำรายงาน: ......................................................']);
    sheet1Rows.push(['', '', '', '', '', 'ลงชื่อผู้มีอำนาจอนุมัติ: ......................................................']);

    const ws1 = XLSX.utils.aoa_to_sheet(sheet1Rows);
    ws1['!cols'] = [
      { wch: 8 },   // ลำดับ
      { wch: 38 },  // ชื่อสินค้า
      { wch: 20 },  // หมวดหมู่
      { wch: 18 },  // จำนวนที่ขาย
      { wch: 18 },  // ราคาขายเฉลี่ย
      { wch: 18 },  // ราคาทุนเฉลี่ย
      { wch: 20 },  // ยอดขายรวม
      { wch: 20 },  // ต้นทุนรวม
      { wch: 20 },  // กำไรขั้นต้น
      { wch: 16 }   // อัตรากำไร
    ];

    // -------------------------------------------------------------
    // SHEET 2: สรุปภาพรวมและสถิติทางการเงิน (Financial Executive Summary)
    // -------------------------------------------------------------
    const sheet2Rows = [
      [storeTitle],
      ['รายงานสรุปภาพรวมรายได้และสถิติการดำเนินงาน (Executive Financial Summary)'],
      [`${dateRangeStr}    |    ${printDateStr}`],
      [''],
      ['ลำดับ', 'หัวข้อการวิเคราะห์และสรุปยอด', 'จำนวนเงิน / ตัวเลขสถิติ', 'หน่วยนับ', 'หมายเหตุ'],
      ['1', 'รายได้รวมสุทธิทุกช่องทาง (Total Gross Revenue)', reportTotalRevenue, 'บาท', 'รวมทั้งงานซ่อมและหน้าร้าน'],
      ['2', 'รายได้จากบริการงานซ่อม (Repair Service Revenue)', reportRepairRevenue, 'บาท', `จากรถที่รับบริการส่งมอบแล้ว ${reportPaidJobs.length} คัน`],
      ['3', 'รายได้จากการจำหน่ายสินค้าหน้าร้าน (POS Revenue)', reportPosRevenue, 'บาท', `จากบิลขายหน้าร้าน ${reportPosSales.length} รายการ`],
      ['4', 'ต้นทุนค่าอะไหล่รวมโดยประมาณ (Estimated Cost of Goods)', totalCostSold, 'บาท', 'คำนวณจากรายการอะไหล่ที่ขายออก'],
      ['5', 'กำไรขั้นต้นโดยประมาณ (Gross Profit)', totalProfit, 'บาท', 'รายได้รวม - ต้นทุนค่าอะไหล่'],
      ['6', 'อัตรากำไรขั้นต้นโดยเฉลี่ย (Gross Margin)', totalProfitMargin, '%', ''],
      ['7', 'จำนวนธุรกรรม/บิลทั้งหมด (Total Transactions)', reportPaidJobs.length + reportPosSales.length, 'บิล', ''],
      ['8', 'ยอดขายเฉลี่ยต่อบิล (Average Ticket Size)', (reportPaidJobs.length + reportPosSales.length > 0) ? Math.round(reportTotalRevenue / (reportPaidJobs.length + reportPosSales.length)) : 0, 'บาท/บิล', ''],
      ['9', 'จำนวนรายการสินค้าที่จำหน่ายได้ (Unique Products Sold)', reportTopSellingProducts.length, 'รายการ', ''],
      ['10', 'จำนวนชิ้นสินค้าที่จำหน่ายออกทั้งหมด (Total Units Sold)', totalQtySold, 'ชิ้น', ''],
      [''],
      ['สรุปยอดรายรับจำแนกตามช่องทางชำระเงิน'],
      ['ลำดับ', 'วิธีการชำระเงิน', 'ยอดเงินรวม (บาท)', 'สัดส่วน (%)', 'สถานะ'],
      ['1', 'เงินสด (Cash)', reportPaymentBreakdown['เงินสด'] || 0, reportTotalRevenue > 0 ? (((reportPaymentBreakdown['เงินสด'] || 0) / reportTotalRevenue) * 100).toFixed(1) + '%' : '0.0%', 'รับชำระสมบูรณ์'],
      ['2', 'เงินโอน / พร้อมเพย์ QR (Bank Transfer)', reportPaymentBreakdown['โอนจ่าย'] || 0, reportTotalRevenue > 0 ? (((reportPaymentBreakdown['โอนจ่าย'] || 0) / reportTotalRevenue) * 100).toFixed(1) + '%' : '0.0%', 'ตรวจสอบแล้ว']
    ];

    const ws2 = XLSX.utils.aoa_to_sheet(sheet2Rows);
    ws2['!cols'] = [
      { wch: 8 },
      { wch: 45 },
      { wch: 25 },
      { wch: 15 },
      { wch: 35 }
    ];

    // -------------------------------------------------------------
    // SHEET 3: บันทึกรายการบิลและใบเสร็จรับเงินทั้งหมด (Transaction Audit Log)
    // -------------------------------------------------------------
    const sheet3Rows = [
      [storeTitle],
      ['สมุดบันทึกรายการบิลและธุรกรรมการขาย (Sales & Job Transaction Ledger)'],
      [`${dateRangeStr}    |    ${printDateStr}`],
      [''],
      ['ลำดับ', 'ประเภทรายการ', 'เลขที่ใบเสร็จ/ใบงาน', 'ทะเบียนรถ / ลูกค้า', 'ช่างผู้รับผิดชอบ', 'ช่องทางชำระ', 'ยอดเงินรวม (บาท)', 'วัน-เวลาที่ทำรายการ']
    ];

    let billSeq = 1;
    reportPaidJobs.forEach(job => {
      sheet3Rows.push([
        billSeq++,
        'งานซ่อม',
        job.tracking,
        `${job.plate} (${job.customerName || 'ลูกค้าทั่วไป'})`,
        job.mechanic || 'ช่างประจำร้าน',
        job.paymentMethod || 'เงินสด',
        job.total,
        job.date
      ]);
    });

    reportPosSales.forEach(order => {
      sheet3Rows.push([
        billSeq++,
        'ขายหน้าร้าน POS',
        order.receiptNo,
        'ลูกค้าหน้าร้านทั่วไป',
        '-',
        order.paymentMethod || 'เงินสด',
        order.total,
        order.date
      ]);
    });

    sheet3Rows.push(['']);
    sheet3Rows.push([
      'รวมยอดบิลทั้งหมด',
      '-',
      `${billSeq - 1} รายการ`,
      '-',
      '-',
      '-',
      reportTotalRevenue,
      '-'
    ]);

    const ws3 = XLSX.utils.aoa_to_sheet(sheet3Rows);
    ws3['!cols'] = [
      { wch: 8 },
      { wch: 18 },
      { wch: 22 },
      { wch: 32 },
      { wch: 20 },
      { wch: 18 },
      { wch: 20 },
      { wch: 22 }
    ];

    // สร้าง Workbook และบันทึก
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, ws1, 'สรุปยอดขายแยกตามสินค้า');
    XLSX.utils.book_append_sheet(workbook, ws2, 'สรุปภาพรวมทางการเงิน');
    XLSX.utils.book_append_sheet(workbook, ws3, 'บันทึกบิลและธุรกรรมทั้งหมด');

    const cleanDate = new Date().toISOString().slice(0, 10);
    const fileName = `รายงานสรุปยอดขายทางการ_${storeTitle.replace(/[^A-Za-z0-9ก-๙]/g, '_')}_${cleanDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    setSuccessAlert('ส่งออกรายงานสรุปยอดขาย Excel แบบทางการเรียบร้อยแล้ว');
  };

  // ==================== CRUD หมวดหมู่ ====================
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleAddCategory = async (e) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) return alert('หมวดหมู่นี้มีอยู่แล้ว');
    
    try {
      await axios.post('http://localhost:5000/api/categories', { name: trimmed });
      setCategories([...categories, trimmed]);
      setNewCategoryName('');
      setSuccessAlert('เพิ่มหมวดหมู่สำเร็จ');
      setIsCategoryModalOpen(false);
    } catch (error) {
      alert(error.response?.data?.error || 'เกิดข้อผิดพลาดในการสร้างหมวดหมู่');
    }
  };

  const handleDeleteCategoryClick = (catToDelete) => {
    if (categories.length <= 1) return alert('ต้องมีหมวดหมู่อย่างน้อย 1 หมวดหมู่');
    setConfirmDialog({
      isOpen: true,
      message: `ต้องการลบหมวดหมู่ "${catToDelete}" ใช่หรือไม่?`,
      onConfirm: async () => {
        try {
          await axios.delete(`http://localhost:5000/api/categories/${encodeURIComponent(catToDelete)}`);
          setCategories(categories.filter(c => c !== catToDelete));
          if (filterCategory === catToDelete) setFilterCategory('ทั้งหมด');
          setConfirmDialog({ isOpen: false });
          setSuccessAlert('ลบหมวดหมู่สำเร็จ');
        } catch (error) {
          alert(error.response?.data?.error || 'ลบไม่ได้ อาจมีสินค้าที่ค้างอยู่ในหมวดนี้');
          setConfirmDialog({ isOpen: false });
        }
      }
    });
  };

  // ==================== CRUD สินค้า ====================
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [partImage, setPartImage] = useState('');
  const [partsPage, setPartsPage] = useState(1);
  const partsPerPage = 10;

  useEffect(() => {
    setPartsPage(1);
  }, [searchTerm, filterCategory, onlyLowStock]);
  const [formData, setFormData] = useState({ name: '', category: categories[0] || 'ทั่วไป', costPrice: '', price: '', stock: '', storageLocation: '' });

  const handleOpenAddModal = () => {
    setEditingPart(null);
    setPartImage('');
    setFormData({ name: '', category: categories[0] || 'ทั่วไป', costPrice: '', price: '', stock: '', storageLocation: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (part) => {
    setEditingPart(part);
    setPartImage(part.imageUrl || '');
    setFormData({ name: part.name, category: part.category, costPrice: part.costPrice || 0, price: part.price, stock: part.stock, storageLocation: part.storageLocation || '' });
    setIsModalOpen(true);
  };

  const handlePartImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      return alert('รูปภาพต้องมีขนาดไม่เกิน 5MB');
    }

    const reader = new FileReader();
    reader.onload = () => setPartImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleImportParts = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const sourceRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      const readColumn = (row, names) => {
        const wanted = names.map(name => name.trim().toLowerCase());
        const entry = Object.entries(row).find(([key]) => wanted.includes(String(key).trim().toLowerCase()));
        return entry?.[1] ?? '';
      };
      const rows = sourceRows.map(row => ({
        name: readColumn(row, ['name', 'ชื่อสินค้า', 'ชื่ออะไหล่']),
        category: readColumn(row, ['category', 'หมวดหมู่']),
        price: readColumn(row, ['price', 'ราคา']),
        stock: readColumn(row, ['stock', 'จำนวนสต็อก', 'สต็อก']),
        storageLocation: readColumn(row, ['storageLocation', 'ตำแหน่งจัดเก็บ', 'ที่จัดเก็บ']),
        imageUrl: readColumn(row, ['imageUrl', 'URL รูปภาพ', 'รูปภาพ']),
        costPrice: readColumn(row, ['costPrice', 'ราคาทุน'])
      }));
      const response = await axios.post('http://localhost:5000/api/parts/import', { rows });
      const partsResponse = await axios.get('http://localhost:5000/api/parts');
      setParts(partsResponse.data);
      const { imported = 0, updated = 0, duplicates = [], errors = [] } = response.data;
      
      setImportResultModal({
        isOpen: true,
        imported,
        updated,
        duplicates,
        errors
      });
    } catch (error) {
      alert(error.response?.data?.error || 'ไม่สามารถนำเข้าสินค้าจากไฟล์ได้');
    }
  };

  const downloadBackup = async () => {
    setBackupLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/admin/backup', { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `motofix-backup-${new Date().toISOString().slice(0, 10)}.sql`;
      link.click();
      URL.revokeObjectURL(url);
      setSuccessAlert('ดาวน์โหลดไฟล์สำรองข้อมูลสำเร็จ');
    } catch (error) {
      alert(error.response?.data?.error || 'ไม่สามารถสำรองฐานข้อมูลได้');
    } finally {
      setBackupLoading(false);
    }
  };

  const restoreBackup = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!window.confirm('การกู้คืนจะเขียนทับข้อมูลในฐานข้อมูล ต้องการดำเนินการต่อหรือไม่?')) return;
    try {
      const sql = await file.text();
      await axios.post('http://localhost:5000/api/admin/restore', { sql });
      setSuccessAlert('กู้คืนฐานข้อมูลสำเร็จ กรุณารีเฟรชหน้าเว็บ');
    } catch (error) {
      alert(error.response?.data?.error || 'ไม่สามารถกู้คืนฐานข้อมูลได้');
    }
  };

  const downloadImportTemplate = () => {
    const worksheet = XLSX.utils.json_to_sheet([
      { name: 'ผ้าเบรกหน้า', category: 'ระบบเบรก', costPrice: 200, price: 350, stock: 10, storageLocation: 'ชั้น A-01', imageUrl: '' }
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'สินค้า');
    XLSX.writeFile(workbook, 'motofix-import-template.xlsx');
  };

  const handleSavePart = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.stock) return alert('กรุณากรอกข้อมูลให้ครบถ้วน');

    try {
      if (editingPart) {
        // โหมดแก้ไข
        const res = await axios.put(`http://localhost:5000/api/parts/${editingPart.id}`, { ...formData, imageUrl: partImage });
        setParts(parts.map(p => p.id === editingPart.id ? res.data : p));
        setSuccessAlert('แก้ไขข้อมูลสินค้าสำเร็จ');
      } else {
        // โหมดเพิ่มใหม่
        const res = await axios.post(`http://localhost:5000/api/parts`, { ...formData, imageUrl: partImage });
        setParts([...parts, res.data]);
        setSuccessAlert('เพิ่มสำเร็จ');
      }
      setIsModalOpen(false);
    } catch (error) {
      alert(error.response?.data?.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลสินค้า');
    }
  };

  const handleDeletePartClick = (id) => {
    setConfirmDialog({
      isOpen: true,
      message: 'คุณต้องการลบอะไหล่ชิ้นนี้ออกจากคลังใช่หรือไม่?',
      onConfirm: async () => {
        try {
          await axios.delete(`http://localhost:5000/api/parts/${id}`);
          setParts(parts.filter(p => p.id !== id));
          setConfirmDialog({ isOpen: false });
          setSuccessAlert('ลบสำเร็จ');
        } catch (error) {
          alert('เกิดข้อผิดพลาดในการลบสินค้า');
        }
      }
    });
  };

  const filteredParts = parts.filter(p => {
    const matchCat = filterCategory === 'ทั้งหมด' || p.category === filterCategory;
    const query = searchTerm.trim().toLowerCase();
    const matchSearch = !query
      || p.name.toLowerCase().includes(query)
      || p.category.toLowerCase().includes(query);
    const matchLowStock = onlyLowStock ? Number(p.stock) <= lowStockThreshold : true;
    return matchCat && matchSearch && matchLowStock;
  });

  const totalPartsPages = Math.max(1, Math.ceil(filteredParts.length / partsPerPage));
  const currentPartsPage = Math.min(partsPage, totalPartsPages);
  const sortedParts = sortRows(filteredParts, 'parts', ['price', 'stock', 'storageLocation']);
  const paginatedParts = sortedParts.slice(
    (currentPartsPage - 1) * partsPerPage,
    currentPartsPage * partsPerPage
  );
  const filteredUsers = usersList.filter(user => {
    const query = userSearchTerm.trim().toLowerCase();
    if (!query) return true;
    return user.name?.toLowerCase().includes(query) || user.username?.toLowerCase().includes(query);
  });
  const displayedUsers = sortRows(filteredUsers, 'users', ['role', 'status']);

  return (
    <div className="min-h-screen p-4 md:p-6 md:pl-72 max-w-[1400px] mx-auto flex flex-col md:flex-row gap-6 items-start relative">
      
      {/* ========================================================= */}
      {/* แจ้งเตือนต่างๆ (Success / Confirm Modals) */}
      {/* ========================================================= */}

      {/* 1. Modal แจ้งเตือนสำเร็จ (เพิ่มสำเร็จ/ลบสำเร็จ) */}
      {successAlert && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none animate-in fade-in duration-200">
          <div className="bg-white border border-emerald-200 rounded-lg px-4 py-3 shadow-xl flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">{successAlert}</h3>
            <button 
              onClick={() => setSuccessAlert('')} 
              className="hidden"
            >
              ตกลง
            </button>
          </div>
        </div>
      )}

      {/* Modal สรุปผลการนำเข้า & แจ้งรายการที่ซ้ำ/อัปเดต */}
      {importResultModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[75] animate-in fade-in duration-200">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">สรุปผลการนำเข้า Excel</h3>
                  <p className="text-xs text-slate-500">ตรวจสอบและอัปเดตข้อมูลลงฐานข้อมูลเรียบร้อย</p>
                </div>
              </div>
              <button 
                onClick={() => setImportResultModal(prev => ({ ...prev, isOpen: false }))}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              {/* สรุปตัวเลข */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-emerald-600 font-semibold">รายการใหม่ที่เพิ่ม</p>
                  <p className="text-2xl font-bold text-emerald-700 mt-0.5">{importResultModal.imported} <span className="text-xs font-normal">รายการ</span></p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-amber-700 font-semibold">รายการที่ตรงกัน (อัปเดต)</p>
                  <p className="text-2xl font-bold text-amber-800 mt-0.5">{importResultModal.updated} <span className="text-xs font-normal">รายการ</span></p>
                </div>
              </div>

              {/* รายการที่ซ้ำกับฐานข้อมูล */}
              {importResultModal.duplicates.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      รายการที่ตรงกับในฐานข้อมูล (ไม่งอกซ้ำ แต่อัปเดตข้อมูลให้):
                    </span>
                    <span className="text-xs text-slate-400">{importResultModal.duplicates.length} รายการ</span>
                  </div>
                  <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-48 overflow-y-auto bg-slate-50/50 text-xs">
                    {importResultModal.duplicates.map((dup, idx) => (
                      <div key={idx} className="p-2.5 flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-800">{idx + 1}. {dup.name}</p>
                          <p className="text-[11px] text-slate-500">หมวดหมู่: {dup.category} · แถวที่ {dup.row}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="inline-block bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded text-[10px]">
                            ทุน ฿{dup.costPrice} / ขาย ฿{dup.price} (สต็อก: {dup.stock})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* รายการที่มีข้อผิดพลาด (ถ้ามี) */}
              {importResultModal.errors.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    รายการที่มีข้อผิดพลาด (ข้ามไป):
                  </span>
                  <div className="border border-rose-200 rounded-lg divide-y divide-rose-100 max-h-36 overflow-y-auto bg-rose-50/30 text-xs text-rose-700">
                    {importResultModal.errors.map((err, idx) => (
                      <div key={idx} className="p-2 flex justify-between">
                        <span>แถวที่ {err.row}: {err.name || ''}</span>
                        <span className="font-medium">{err.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setImportResultModal(prev => ({ ...prev, isOpen: false }))}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-5 py-2 rounded-lg text-sm transition shadow-sm"
              >
                รับทราบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal ยืนยันการลบ (ตกลง/ยกเลิก) */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-rose-600 border-b border-slate-100 pb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-slate-900">ยืนยันการลบ</h3>
            </div>
            <p className="text-sm text-slate-600 py-2">{confirmDialog.message}</p>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={confirmDialog.onConfirm} 
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2.5 rounded-md shadow-sm transition"
              >
                ตกลง
              </button>
              <button 
                onClick={() => setConfirmDialog({ isOpen: false })} 
                className="flex-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-semibold py-2.5 rounded-md transition"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ========================================================= */}
      {/* Sidebar เมนู */}
      {/* ========================================================= */}
      {/* แถบแฮมเบอร์เกอร์บนมือถือ (Mobile Navigation Header Bar) */}
      <div className="md:hidden w-full mb-3">
        <div 
          onClick={() => setIsAdminMenuOpen(true)}
          className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-2.5 px-3.5 shadow-sm flex items-center justify-between cursor-pointer transition active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Menu className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400 leading-tight">เมนูผู้ดูแลระบบ</p>
              <p className="text-sm font-bold text-slate-800 leading-tight mt-0.5">
                {activeTab === 'dashboard' && 'แดชบอร์ดภาพรวม'}
                {activeTab === 'stock' && 'คลังสินค้า & อะไหล่'}
                {activeTab === 'analytics' && 'สรุปยอดขาย'}
                {activeTab === 'users' && 'จัดการผู้ใช้งานระบบ'}
                {activeTab === 'settings' && 'ตั้งค่าระบบ'}
              </p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Backdrop Overlay บนมือถือ */}
      {isAdminMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-[70] bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          onClick={() => setIsAdminMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer เมนูบนมือถือ & Sidebar บน Desktop */}
      <aside 
        className={`
          ${isAdminMenuOpen ? 'fixed inset-y-0 left-0 z-[75] w-72 max-w-[85vw] animate-in slide-in-from-left duration-200 flex flex-col' : 'hidden'}
          md:block md:fixed md:inset-y-0 md:left-0 md:z-10 md:h-auto md:w-64 md:p-0 shrink-0
        `}
      >
        <div className="bg-white border-r border-slate-200 h-full w-full p-4 shadow-2xl md:shadow-none flex flex-col gap-2 overflow-y-auto">
          {/* Header เมนู */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 leading-tight">เมนูผู้ดูแลระบบ</h4>
                <p className="text-[11px] text-slate-400 leading-tight">MotoFix Workshop</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAdminMenuOpen(false)}
              className="md:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              aria-label="ปิดเมนู"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* รายการเมนูหลัก */}
          <div className="space-y-1 flex-1">
            <button 
              type="button"
              onClick={() => selectAdminTab('dashboard')} 
              className={`w-full px-3.5 py-3 rounded-lg font-semibold text-sm flex items-center gap-3 transition text-left ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <LayoutDashboard className="w-5 h-5 shrink-0" />
              <span>แดชบอร์ด</span>
            </button>

            <button 
              type="button"
              onClick={() => selectAdminTab('stock')} 
              className={`w-full px-3.5 py-3 rounded-lg font-semibold text-sm flex items-center gap-3 transition text-left ${activeTab === 'stock' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Package className="w-5 h-5 shrink-0" />
              <span>คลังสินค้า & อะไหล่</span>
            </button>

            <button 
              type="button"
              onClick={() => selectAdminTab('analytics')} 
              className={`w-full px-3.5 py-3 rounded-lg font-semibold text-sm flex items-center gap-3 transition text-left ${activeTab === 'analytics' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <TrendingUp className="w-5 h-5 shrink-0" />
              <span>สรุปยอดขาย</span>
            </button>

            <button 
              type="button"
              onClick={() => selectAdminTab('users')} 
              className={`w-full px-3.5 py-3 rounded-lg font-semibold text-sm flex items-center gap-3 transition text-left ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Users className="w-5 h-5 shrink-0" />
              <span>จัดการผู้ใช้งานระบบ</span>
            </button>
          </div>

          {/* เมนูด้านล่าง: ตั้งค่า */}
          <div className="pt-2 border-t border-slate-100 mt-auto">
            <button 
              type="button"
              onClick={() => selectAdminTab('settings')} 
              className={`w-full px-3.5 py-3 rounded-lg font-semibold text-sm flex items-center gap-3 transition text-left ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Settings className="w-5 h-5 shrink-0" />
              <span>ตั้งค่าระบบ</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 w-full">
        {/* Header แถบบน */}
        <div className="mb-6 border-b border-slate-200 pb-4">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {activeTab === 'dashboard' && 'แดชบอร์ดภาพรวม'}
            {activeTab === 'stock' && 'จัดการคลังสินค้า'}
            {activeTab === 'analytics' && 'รายงานการวิเคราะห์และยอดขาย'}
            {activeTab === 'users' && 'จัดการผู้ใช้งานระบบ (User Management)'}
            {activeTab === 'settings' && 'ตั้งค่าระบบ'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {activeTab === 'dashboard' && 'ภาพรวมคลังอะไหล่ งานซ่อม และรายได้ของร้าน'}
            {activeTab === 'stock' && 'ควบคุมรายการอะไหล่, สต็อกคงเหลือ และจัดการหมวดหมู่'}
            {activeTab === 'analytics' && 'สรุปยอดขายรายวันและสินค้าขายดีที่สุด'}
            {activeTab === 'users' && 'จัดการสิทธิ์การเข้าใช้งาน และเพิ่มพนักงานใหม่'}
            {activeTab === 'settings' && 'จัดการการตั้งค่าพื้นฐานของระบบ'}
          </p>
        </div>

        {/* --- แท็บ: จัดการคลังสินค้า --- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                <div className="flex items-center justify-between text-sm text-slate-500 font-semibold"><span>รายการอะไหล่</span><Package className="w-5 h-5 text-blue-600" /></div>
                <p className="text-3xl font-bold text-slate-900 mt-3">{parts.length.toLocaleString()}</p>
                <p className="text-xs text-slate-400 mt-1">มูลค่าสต็อก ฿{totalStockValue.toLocaleString()}</p>
              </div>
              <div onClick={() => { setOnlyLowStock(true); selectAdminTab('stock'); }} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm cursor-pointer hover:border-amber-400 transition">
                <div className="flex items-center justify-between text-sm text-slate-500 font-semibold"><span>อะไหล่ใกล้หมด</span><AlertTriangle className="w-5 h-5 text-amber-500" /></div>
                <p className="text-3xl font-bold text-amber-600 mt-3">{lowStockParts.length.toLocaleString()}</p>
                <p className="text-xs text-slate-400 mt-1">คงเหลือไม่เกิน {lowStockThreshold} ชิ้น (คลิกเพื่อดู)</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                <div className="flex items-center justify-between text-sm text-slate-500 font-semibold"><span>งานซ่อมที่ยังไม่ชำระ</span><Wrench className="w-5 h-5 text-indigo-500" /></div>
                <p className="text-3xl font-bold text-slate-900 mt-3">{unpaidJobs.length.toLocaleString()}</p>
                <p className="text-xs text-slate-400 mt-1">รอคิว {pendingJobs.length} · กำลังซ่อม {repairingJobs.length}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 text-white rounded-lg p-5 shadow-sm">
                <div className="flex items-center justify-between text-sm text-slate-300 font-semibold"><span>รายได้รวมที่ชำระแล้ว</span><CircleDollarSign className="w-5 h-5 text-emerald-400" /></div>
                <p className="text-3xl font-bold text-emerald-400 mt-3">฿{totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-slate-400 mt-1">งานซ่อม ฿{repairRevenue.toLocaleString()} · หน้าร้าน ฿{posRevenue.toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" />รายการอะไหล่ใกล้หมด</h3>
                  <button onClick={() => { setOnlyLowStock(true); selectAdminTab('stock'); }} className="text-sm text-blue-600 hover:text-blue-700 font-semibold">ดูคลังอะไหล่</button>
                </div>
                {lowStockParts.length ? (
                  <div className="divide-y divide-slate-100">
                    {[...lowStockParts].sort((a, b) => a.stock - b.stock).slice(0, 6).map(part => (
                      <div key={part.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="min-w-0"><p className="font-semibold text-sm text-slate-800 truncate">{part.name}</p><p className="text-xs text-slate-400">{part.category || 'ไม่ระบุหมวดหมู่'}</p></div>
                        <span className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-bold ${part.stock === 0 ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>เหลือ {part.stock}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="py-8 text-center text-sm text-slate-400">ไม่มีอะไหล่ใกล้หมด</p>}
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2"><ClipboardList className="w-5 h-5 text-blue-600" />งานซ่อมล่าสุด</h3>
                </div>
                {recentJobs.length ? (
                  <div className="divide-y divide-slate-100">
                    {recentJobs.map(job => (
                      <div key={job.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="min-w-0"><p className="font-semibold text-sm text-slate-800 truncate">{job.plate} · {job.customerName}</p><p className="text-xs text-slate-400">{job.tracking}</p></div>
                        <span className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-semibold ${job.paid ? 'bg-emerald-50 text-emerald-700' : job.status === 'กำลังซ่อม' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{job.paid ? 'ชำระแล้ว' : job.status}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="py-8 text-center text-sm text-slate-400">ยังไม่มีงานซ่อม</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2"><Award className="w-5 h-5 text-indigo-500" />อะไหล่ขายดี</h3>
                  <button onClick={() => selectAdminTab('analytics')} className="text-sm text-blue-600 hover:text-blue-700 font-semibold">ดูรายงาน</button>
                </div>
                {topSellingProducts.length ? topSellingProducts.slice(0, 5).map((item, index) => (
                  <div key={item.name} className="py-3 flex justify-between border-b last:border-0 border-slate-100 text-sm"><span className="text-slate-700">{index + 1}. {item.name}</span><span className="font-semibold text-slate-900">{item.qty} ชิ้น · ฿{item.revenue.toLocaleString()}</span></div>
                )) : <p className="py-8 text-center text-sm text-slate-400">ยังไม่มีข้อมูลการขาย</p>}
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-indigo-500" />ยอดขายหน้าร้านล่าสุด</h3>
                  <button onClick={() => selectAdminTab('analytics')} className="text-sm text-blue-600 hover:text-blue-700 font-semibold">ดูรายงาน</button>
                </div>
                {recentPosSales.length ? recentPosSales.map(sale => (
                  <div key={sale.id} className="py-3 flex justify-between border-b last:border-0 border-slate-100 text-sm"><span className="text-slate-700">{sale.receiptNo}<span className="block text-xs text-slate-400">{sale.date}</span></span><span className="font-semibold text-slate-900">฿{sale.total.toLocaleString()}</span></div>
                )) : <p className="py-8 text-center text-sm text-slate-400">ยังไม่มีรายการขายหน้าร้าน</p>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stock' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div onClick={() => setOnlyLowStock(false)} className={`border rounded-lg p-5 shadow-sm flex items-center justify-between cursor-pointer transition ${!onlyLowStock ? 'bg-white border-blue-600 ring-2 ring-blue-600/10' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                <div>
                  <p className="text-xs text-slate-500 font-semibold">รายการอะไหล่ทั้งหมด</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">{parts.length} <span className="text-sm font-normal">รายการ</span></h3>
                </div>
                <div className="w-12 h-12 rounded-md bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200"><Package className="w-6 h-6" /></div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-semibold">มูลค่าสต็อกคงเหลือรวม</p>
                  <h3 className="text-2xl font-bold text-blue-600 mt-1">฿{totalStockValue.toLocaleString()}</h3>
                </div>
                <div className="w-12 h-12 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600"><DollarSign className="w-6 h-6" /></div>
              </div>

              <div onClick={() => setOnlyLowStock(!onlyLowStock)} className={`border rounded-lg p-5 shadow-sm flex items-center justify-between cursor-pointer transition ${onlyLowStock ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20' : 'bg-white border-slate-200 hover:border-rose-300'}`}>
                <div>
                  <div className="flex items-center gap-1.5"><p className="text-xs text-rose-700 font-bold">สินค้าใกล้หมด</p>{onlyLowStock && <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded">กำลังกรอง</span>}</div>
                  <h3 className="text-2xl font-bold text-rose-600 mt-1">{lowStockParts.length} <span className="text-sm font-normal">รายการ</span></h3>
                </div>
                <div className="w-12 h-12 rounded-md bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600"><AlertTriangle className="w-6 h-6" /></div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-3">
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto flex-1">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input type="text" placeholder="ค้นหาชื่ออะไหล่หรือหมวดหมู่..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="w-full sm:w-auto border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                  <option value="ทั้งหมด">ทุกหมวดหมู่ ({categories.length})</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {onlyLowStock && (
                  <button onClick={() => setOnlyLowStock(false)} className="text-xs bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-200 px-3 py-2 rounded-md font-semibold flex items-center gap-1 w-full sm:w-auto justify-center"><X className="w-3.5 h-3.5" /> ล้างตัวกรองใกล้หมด</button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap lg:flex-nowrap gap-1.5 sm:gap-2 w-full lg:w-auto shrink-0">
                <button
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="flex-1 lg:flex-none border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-1.5 transition"
                >
                  <FolderPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0" />
                  <span>จัดการหมวดหมู่</span>
                </button>
                <input ref={importFileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleImportParts} className="hidden" />
                <button
                  onClick={() => importFileRef.current?.click()}
                  className="flex-1 lg:flex-none border border-emerald-300 hover:bg-emerald-50 text-emerald-700 font-semibold px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-1.5 transition"
                >
                  <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>นำเข้า Excel</span>
                </button>
                <button
                  onClick={downloadImportTemplate}
                  className="flex-1 lg:flex-none border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-1.5 transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                  <span>ไฟล์ตัวอย่าง</span>
                </button>
                <button
                  onClick={handleOpenAddModal}
                  className="flex-1 lg:flex-none bg-blue-600 hover:bg-blue-700 text-white font-semibold px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-1.5 shadow-sm transition"
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>เพิ่มสินค้า</span>
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                    <tr>
                      <th className="p-4">รูป</th>
                      <th className="p-4">ชื่ออะไหล่</th>
                      <th className="p-4">หมวดหมู่</th>
                      <th className="p-4"><SortButton table="parts" sortKey="storageLocation">ตำแหน่งจัดเก็บ</SortButton></th>
                      <th className="p-4 text-right">ราคาทุน</th>
                      <th className="p-4 text-right"><SortButton table="parts" sortKey="price" className="justify-end w-full">ราคาขาย</SortButton></th>
                      <th className="p-4 text-center"><SortButton table="parts" sortKey="stock" className="justify-center w-full">คงเหลือในคลัง</SortButton></th>
                      <th className="p-4 text-center">สถานะสต็อก</th>
                      <th className="p-4 text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedParts.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 transition">
                        <td className="p-4">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="w-12 h-12 object-cover rounded-md border border-slate-200" />
                          ) : (
                            <div className="w-12 h-12 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                        </td>
                        <td className="p-4 font-semibold text-slate-900">{p.name}</td>
                        <td className="p-4"><span className="bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-md text-xs font-medium">{p.category}</span></td>
                         <td className="p-4 text-slate-600">{p.storageLocation || '-'}</td>
                         <td className="p-4 text-right font-semibold text-slate-600">฿{(p.costPrice || 0).toLocaleString()}</td>
                         <td className="p-4 text-right font-semibold text-slate-800">฿{p.price.toLocaleString()}</td>
                        <td className="p-4 text-center font-bold"><span className={Number(p.stock) <= lowStockThreshold ? 'text-rose-600' : 'text-slate-800'}>{p.stock}</span></td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${Number(p.stock) === 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : Number(p.stock) <= lowStockThreshold ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                            {Number(p.stock) === 0 ? 'สต็อกหมด' : Number(p.stock) <= lowStockThreshold ? 'ใกล้หมด' : 'พร้อมจำหน่าย'}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button onClick={() => handleOpenEditModal(p)} className="p-1.5 text-slate-500 hover:text-blue-600 border border-slate-200 rounded-md hover:bg-blue-50 transition" title="แก้ไข"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDeletePartClick(p.id)} className="p-1.5 text-slate-500 hover:text-rose-600 border border-slate-200 rounded-md hover:bg-rose-50 transition" title="ลบ"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                    {filteredParts.length === 0 && (
                      <tr><td colSpan="9" className="text-center py-10 text-slate-500 text-sm">{onlyLowStock ? 'ไม่มีสินค้าใกล้หมดในขณะนี้' : 'ไม่พบข้อมูลสินค้าที่ค้นหา'}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {totalPartsPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm">
                  <span className="text-slate-500">หน้า {currentPartsPage} จาก {totalPartsPages}</span>
                  <div className="inline-flex rounded-md shadow-sm" role="group" aria-label="เปลี่ยนหน้ารายการอะไหล่">
                    <button
                      type="button"
                      aria-label="หน้าก่อนหน้า"
                      disabled={currentPartsPage === 1}
                      onClick={() => setPartsPage(page => Math.max(1, page - 1))}
                      className="w-10 h-9 flex items-center justify-center rounded-l-md border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    ><ArrowUp className="w-4 h-4 -rotate-90" /></button>
                    <span className="min-w-24 h-9 px-3 flex items-center justify-center border-y border-slate-300 bg-white text-slate-700 font-medium" aria-live="polite">
                      {currentPartsPage} of {totalPartsPages}
                    </span>
                    <button
                      type="button"
                      aria-label="หน้าถัดไป"
                      disabled={currentPartsPage === totalPartsPages}
                      onClick={() => setPartsPage(page => Math.min(totalPartsPages, page + 1))}
                      className="w-10 h-9 flex items-center justify-center rounded-r-md border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    ><ArrowUp className="w-4 h-4 rotate-90" /></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- แท็บ: Analytics --- */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* กล่องเอกสารทางการสำหรับพิมพ์ (จะถูกดึงไปพิมพ์เมื่อกดปุ่ม ไม่ใช่หน้าเว็บดิบๆ) */}
            <div style={{ display: 'none' }}>
              <div ref={salesPrintRef} className="p-8 text-slate-800 font-sans">
                {/* หัวเอกสาร */}
                <div className="text-center border-b border-slate-300 pb-4 mb-6">
                  <h1 className="text-2xl font-bold text-slate-900">{settings?.storeName || 'MotoFix Workshop'}</h1>
                  <p className="text-sm text-slate-500 mt-1">{settings?.storeAddress || ''} {settings?.storePhone ? `โทร. ${settings.storePhone}` : ''}</p>
                  <h2 className="text-lg font-bold text-slate-800 mt-3">รายงานสรุปยอดขายสินค้าและบริการ</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    ช่วงวันที่: <span className="font-semibold text-slate-700">{reportDateFrom || 'เริ่มต้น'} ถึง {reportDateTo || 'ปัจจุบัน'}</span> · วันที่พิมพ์: {new Date().toLocaleString('th-TH')}
                  </p>
                </div>

                {/* สรุปยอดรวม 3 ช่อง */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="border border-slate-300 rounded p-3 text-center bg-slate-50">
                    <p className="text-xs text-slate-500 font-semibold">ยอดขายรวมสุทธิ</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">฿{reportTotalRevenue.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{reportPaidJobs.length + reportPosSales.length} บิล</p>
                  </div>
                  <div className="border border-slate-300 rounded p-3 text-center bg-slate-50">
                    <p className="text-xs text-slate-500 font-semibold">งานซ่อม ({reportPaidJobs.length} คัน)</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">฿{reportRepairRevenue.toLocaleString()}</p>
                  </div>
                  <div className="border border-slate-300 rounded p-3 text-center bg-slate-50">
                    <p className="text-xs text-slate-500 font-semibold">ขายหน้าร้าน POS ({reportPosSales.length} บิล)</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">฿{reportPosRevenue.toLocaleString()}</p>
                  </div>
                </div>

                {/* ตารางสรุปยอดขายแต่ละรายการ */}
                <div className="mb-6">
                  <h3 className="font-bold text-sm text-slate-900 mb-2">ตารางสรุปยอดขายแยกตามรายการสินค้าและอะไหล่</h3>
                  <table className="w-full text-left text-xs border border-slate-300">
                    <thead className="bg-slate-100 border-b border-slate-300 font-bold">
                      <tr>
                        <th className="p-2 border-r border-slate-300 text-center w-12">ลำดับ</th>
                        <th className="p-2 border-r border-slate-300">ชื่อสินค้า / อะไหล่</th>
                        <th className="p-2 border-r border-slate-300 text-center w-24">จำนวนที่ขาย</th>
                        <th className="p-2 border-r border-slate-300 text-right w-28">ราคาเฉลี่ย/ชิ้น</th>
                        <th className="p-2 text-right w-32">ยอดขายรวม (บาท)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {reportTopSellingProducts.map((item, idx) => (
                        <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                          <td className="p-2 border-r border-slate-300 text-center">{idx + 1}</td>
                          <td className="p-2 border-r border-slate-300 font-medium">{item.name}</td>
                          <td className="p-2 border-r border-slate-300 text-center font-bold">{item.qty}</td>
                          <td className="p-2 border-r border-slate-300 text-right">฿{item.qty > 0 ? Math.round(item.revenue / item.qty).toLocaleString() : 0}</td>
                          <td className="p-2 text-right font-bold">฿{item.revenue.toLocaleString()}</td>
                        </tr>
                      ))}
                      {reportTopSellingProducts.length === 0 && (
                        <tr><td colSpan="5" className="p-4 text-center text-slate-400">ไม่มีข้อมูลการขายในช่วงเวลานี้</td></tr>
                      )}
                    </tbody>
                    <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold">
                      <tr>
                        <td colSpan="2" className="p-2 border-r border-slate-300 text-right">รวมยอดขายสินค้าทั้งหมด:</td>
                        <td className="p-2 border-r border-slate-300 text-center font-bold">{reportTopSellingProducts.reduce((sum, item) => sum + item.qty, 0)}</td>
                        <td className="p-2 border-r border-slate-300"></td>
                        <td className="p-2 text-right text-blue-700 font-bold">฿{reportTopSellingProducts.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* ตารางสรุปช่องทางชำระเงิน */}
                <div className="mb-6">
                  <h3 className="font-bold text-sm text-slate-900 mb-2">สรุปตามช่องทางชำระเงิน</h3>
                  <table className="w-full text-left text-xs border border-slate-300">
                    <thead className="bg-slate-100 border-b border-slate-300 font-bold">
                      <tr>
                        <th className="p-2 border-r border-slate-300">ช่องทางชำระ</th>
                        <th className="p-2 text-right w-40">ยอดเงินรวม (บาท)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {Object.entries(reportPaymentBreakdown).map(([method, amount], idx) => (
                        <tr key={idx}>
                          <td className="p-2 border-r border-slate-300 font-medium">{method}</td>
                          <td className="p-2 text-right font-bold">฿{amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ท้ายเอกสาร */}
                <div className="pt-8 mt-8 border-t border-slate-200 flex justify-between text-xs text-slate-500">
                  <p>พิมพ์จากระบบบริหารจัดการร้าน {settings?.storeName || 'MotoFix Workshop'}</p>
                  <p>ลงชื่อผู้ตรวจสอบ .....................................................</p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  ตั้งแต่:
                  <input type="date" value={reportDateFrom} onChange={event => setReportDateFrom(event.target.value)} className="border border-slate-300 rounded-md px-3 py-1.5 text-sm" />
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  ถึง:
                  <input type="date" value={reportDateTo} onChange={event => setReportDateTo(event.target.value)} className="border border-slate-300 rounded-md px-3 py-1.5 text-sm" />
                </label>
                {(reportDateFrom || reportDateTo) && (
                  <button type="button" onClick={() => { setReportDateFrom(''); setReportDateTo(''); }} className="text-xs text-slate-500 hover:text-slate-800 underline">
                    ล้างตัวกรอง
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={exportAnalyticsExcel} className="border border-emerald-400 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md px-4 py-2 text-sm font-semibold flex items-center gap-2 transition shadow-sm">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> ส่งออกสรุป Excel
                </button>
                <button type="button" onClick={handlePrintAnalytics} className="bg-slate-900 hover:bg-slate-800 text-white rounded-md px-4 py-2 text-sm font-semibold flex items-center gap-2 transition shadow-sm">
                  <Printer className="w-4 h-4" /> พิมพ์รายงานสรุปยอดขาย
                </button>
              </div>
            </div>
            
            <p className="hidden print:block text-sm text-slate-600">ช่วงรายงาน: {reportDateFrom || 'เริ่มต้น'} ถึง {reportDateTo || 'ปัจจุบัน'}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 text-white rounded-lg p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-4 -mt-4 opacity-10"><DollarSign className="w-32 h-32" /></div>
                <p className="text-sm text-slate-300 font-semibold relative z-10">รายได้รวมสุทธิ (ทุกช่องทาง)</p>
                <h3 className="text-3xl font-bold text-blue-400 mt-2 relative z-10">฿{reportTotalRevenue.toLocaleString()}</h3>
                <p className="text-xs text-slate-400 mt-2 relative z-10">จากบิลทั้งหมด {reportPaidJobs.length + reportPosSales.length} รายการ</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-2 text-slate-600 text-sm font-semibold"><Wrench className="w-4 h-4 text-blue-600" /> ยอดจากงานซ่อม ({reportPaidJobs.length} คัน)</div>
                <h3 className="text-2xl font-bold text-slate-900 mt-2">฿{reportRepairRevenue.toLocaleString()}</h3>
                <p className="text-xs text-emerald-600 font-semibold mt-1">✓ ปิดบิลส่งมอบรถแล้ว</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-2 text-slate-600 text-sm font-semibold"><ShoppingBag className="w-4 h-4 text-indigo-500" /> ยอดขายหน้าร้าน POS ({reportPosSales.length} บิล)</div>
                <h3 className="text-2xl font-bold text-slate-900 mt-2">฿{reportPosRevenue.toLocaleString()}</h3>
                <p className="text-xs text-slate-400 mt-1">ขายอะไหล่หน้าร้านโดยตรง</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3 mb-2">รายได้ตามช่องทางชำระเงิน</h3>
                {Object.entries(reportPaymentBreakdown).map(([method, amount]) => <div key={method} className="flex justify-between py-2 text-sm"><span>{method}</span><span className="font-semibold">฿{amount.toLocaleString()}</span></div>)}
                {!Object.keys(reportPaymentBreakdown).length && <p className="text-sm text-slate-400 py-3">ยังไม่มีข้อมูล</p>}
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3 mb-2">ยอดขายรายเดือน</h3>
                {Object.entries(reportByMonth).sort(([a], [b]) => b.localeCompare(a)).slice(0, 6).map(([month, amount]) => <div key={month} className="flex justify-between py-2 text-sm"><span>{month}</span><span className="font-semibold">฿{amount.toLocaleString()}</span></div>)}
                {!Object.keys(reportByMonth).length && <p className="text-sm text-slate-400 py-3">ยังไม่มีข้อมูล</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2"><Award className="w-5 h-5 text-blue-600" /> สินค้าและอะไหล่ขายดีที่สุด</h3>
                  <span className="text-xs text-slate-400 font-medium">คำนวณจากยอดขายจริง</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {reportTopSellingProducts.slice(0, 5).map((item, index) => (
                    <div key={index} className="py-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs border ${index === 0 ? 'bg-amber-50 border-amber-200 text-amber-700' : index === 1 ? 'bg-slate-100 border-slate-200 text-slate-600' : index === 2 ? 'bg-orange-50 border-orange-200 text-orange-700' : 'border-slate-100 text-slate-400'}`}>{index + 1}</span>
                        <div><p className="font-semibold text-sm text-slate-800">{item.name}</p><p className="text-xs text-slate-500">ขายได้จริง <span className="font-semibold text-slate-700">{item.qty}</span> ชิ้น</p></div>
                      </div>
                      <div className="text-right"><p className="font-bold text-sm text-blue-600">฿{item.revenue.toLocaleString()}</p><p className="text-[10px] text-slate-400">ยอดเงินรวม</p></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-base">ประวัติบิลที่ปิดยอด</h3>
                  <span className="text-xs text-slate-500 font-medium">{reportPaidJobs.length + reportPosSales.length} บิล</span>
                </div>
                <div className="divide-y divide-slate-100 space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {reportPaidJobs.map(job => (
                    <div key={`job-${job.id}`} className="pt-3 text-xs space-y-1.5">
                      <div className="flex justify-between font-bold text-slate-800"><span className="flex items-center gap-1.5"><Wrench className="w-3.5 h-3.5 text-blue-600" /> {job.plate}</span><span className="text-blue-600 font-bold">฿{job.total}</span></div>
                      <div className="flex justify-between text-slate-500"><span>{job.customerName} ({job.mechanic})</span><span>{job.date}</span></div>
                    </div>
                  ))}
                  {reportPosSales.map(order => (
                    <div key={`pos-${order.id}`} className="pt-3 text-xs space-y-1.5">
                      <div className="flex justify-between font-bold text-slate-800"><span className="flex items-center gap-1.5"><ShoppingBag className="w-3.5 h-3.5 text-indigo-500" /> {order.receiptNo}</span><span className="text-emerald-600 font-bold">฿{order.total}</span></div>
                      <div className="flex justify-between text-slate-500"><span>{order.paymentMethod}</span><span>{order.date}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- แท็บ: จัดการผู้ใช้ (User Management) --- */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" /> รายชื่อพนักงานในระบบ
                </h3>
                <p className="text-sm text-slate-500 mt-1">จัดการบัญชีการเข้าใช้งานของพนักงานและช่างทั้งหมด</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="search"
                    value={userSearchTerm}
                    onChange={e => setUserSearchTerm(e.target.value)}
                    placeholder="ค้นหาชื่อหรือ Username..."
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <button
                  onClick={() => handleOpenUserModal()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md text-sm flex items-center justify-center gap-2 shadow-sm transition shrink-0"
                >
                  <UserPlus className="w-4 h-4" /> เพิ่มพนักงานใหม่
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                    <tr>
                      <th className="p-4 w-12 text-center">#</th>
                      <th className="p-4">ชื่อ-นามสกุล / ชื่อเล่น</th>
                      <th className="p-4">ชื่อผู้ใช้งาน (Username)</th>
                      <th className="p-4"><SortButton table="users" sortKey="role">สิทธิ์การใช้งาน (Role)</SortButton></th>
                      <th className="p-4 text-center"><SortButton table="users" sortKey="status" className="justify-center w-full">สถานะ</SortButton></th>
                      <th className="p-4 text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedUsers.map((user, index) => (
                      <tr key={user.id} className="hover:bg-slate-50 transition">
                        <td className="p-4 text-center text-slate-400 font-medium">{index + 1}</td>
                        <td className="p-4 font-semibold text-slate-900">{user.name}</td>
                        <td className="p-4 text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <UserCheck className="w-4 h-4 text-slate-400" /> {user.username}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border flex items-center gap-1.5 w-max ${
                            user.role === 'admin' 
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {user.role === 'admin' ? <Shield className="w-3.5 h-3.5" /> : user.role === 'mechanic' ? <Wrench className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            {user.role === 'admin' ? 'แอดมิน (Admin)' : user.role === 'mechanic' ? 'ช่าง (Mechanic)' : 'พนักงาน (Staff)'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border inline-block ${
                            user.status === 'active' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {user.status === 'active' ? 'เปิดใช้งาน' : 'ระงับบัญชี'}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenUserModal(user)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 border border-slate-200 rounded-md hover:bg-blue-50 transition"
                            title="แก้ไขข้อมูล/รีเซ็ตรหัสผ่าน"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {user.username !== 'admin' && (
                            <button
                              onClick={() => handleDeleteUserClick(user.id, user.username)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 border border-slate-200 rounded-md hover:bg-rose-50 transition"
                              title="ลบผู้ใช้"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {displayedUsers.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center py-10 text-slate-500 text-sm">
                          {userSearchTerm ? 'ไม่พบผู้ใช้งานที่ค้นหา' : 'กำลังโหลดข้อมูลพนักงาน...'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">ตั้งค่าระบบ</h3>
                <p className="text-sm text-slate-500">เมนูสำหรับการตั้งค่าพื้นฐานของระบบ</p>
              </div>
            </div>
             <SystemSettingsForm settings={settings} setSettings={setSettings} onSaved={setSuccessAlert} />
             <p className="text-sm text-slate-500 mt-5">จัดการสำรองและกู้คืนข้อมูลระบบ โดยควรสำรองข้อมูลก่อนนำเข้าหรือแก้ไขข้อมูลจำนวนมาก</p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
               <div className="border border-slate-200 rounded-lg p-5 space-y-3">
                 <h4 className="font-bold text-slate-900">สำรองฐานข้อมูล</h4>
                 <p className="text-sm text-slate-500">ดาวน์โหลดข้อมูล PostgreSQL เป็นไฟล์ SQL เก็บไว้ใช้งานภายหลัง</p>
                 <button type="button" onClick={downloadBackup} disabled={backupLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-md py-2.5 text-sm font-semibold disabled:opacity-50">
                   {backupLoading ? 'กำลังสำรองข้อมูล...' : 'ดาวน์โหลดไฟล์สำรอง .sql'}
                 </button>
               </div>
               <div className="border border-rose-200 bg-rose-50/40 rounded-lg p-5 space-y-3">
                 <h4 className="font-bold text-slate-900">กู้คืนฐานข้อมูล</h4>
                 <p className="text-sm text-slate-500">เลือกไฟล์ `.sql` ที่สำรองไว้ การกู้คืนอาจเขียนทับข้อมูลปัจจุบัน</p>
                 <input ref={restoreFileRef} type="file" accept=".sql" onChange={restoreBackup} className="hidden" />
                 <button type="button" onClick={() => restoreFileRef.current?.click()} className="w-full border border-rose-300 text-rose-700 hover:bg-rose-100 rounded-md py-2.5 text-sm font-semibold">เลือกไฟล์เพื่อกู้คืน</button>
               </div>
             </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* Modals ย่อย: แก้ไข / เพิ่มหมวดหมู่ / เพิ่มสินค้า */}
      {/* ========================================================= */}

      {/* Modal: เพิ่ม/แก้ไข ผู้ใช้งาน */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                {editingUser ? <Edit2 className="w-5 h-5 text-blue-600" /> : <UserPlus className="w-5 h-5 text-blue-600" />}
                {editingUser ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงานใหม่'}
              </h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            {userError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> <span>{userError}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">ชื่อ-นามสกุล / ชื่อเล่น *</label>
                <input type="text" placeholder="เช่น ช่างบอย, สมชาย" value={userFormData.name} onChange={e => setUserFormData({ ...userFormData, name: e.target.value })} className="w-full border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">ชื่อผู้ใช้งาน (Username) {editingUser && '(ห้ามแก้ไข)'}</label>
                <input type="text" placeholder="ตั้งชื่อผู้ใช้ภาษาอังกฤษ/ตัวเลข" value={userFormData.username} onChange={e => setUserFormData({ ...userFormData, username: e.target.value })} disabled={editingUser !== null} className={`w-full border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none ${editingUser ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`} required />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">รหัสผ่าน (Password) {editingUser && <span className="text-slate-400 font-normal text-xs">(ปล่อยว่างถ้าไม่ต้องการเปลี่ยน)</span>}</label>
                <input type="password" minLength={6} placeholder={editingUser ? "เว้นว่างถ้าไม่ต้องการเปลี่ยน" : "ตั้งรหัสผ่าน"} value={userFormData.password} onChange={e => setUserFormData({ ...userFormData, password: e.target.value })} className="w-full border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" required={!editingUser} />
                {userFormData.password && userFormData.password.length < 6 && (
                  <p className="mt-1.5 text-xs text-red-600">รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร</p>
                )}
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">สิทธิ์การเข้าถึง (Role)</label>
                <select value={userFormData.role} onChange={e => setUserFormData({ ...userFormData, role: e.target.value })} disabled={editingUser?.username === 'admin'} className={`w-full border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white ${editingUser?.username === 'admin' ? 'bg-slate-100 cursor-not-allowed' : ''}`}>
                  <option value="mechanic">ช่าง (Mechanic)</option>
                  <option value="staff">พนักงาน (Staff)</option>
                  <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="submit" disabled={userLoading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-md shadow-sm transition disabled:opacity-50">
                  {userLoading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="px-5 py-2.5 border border-slate-300 rounded-md text-slate-600 font-semibold hover:bg-slate-50 transition">ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Category */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">จัดการหมวดหมู่สินค้า</h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input type="text" placeholder="ชื่อหมวดหมู่ใหม่" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md text-sm shadow-sm transition">+ เพิ่ม</button>
            </form>
            <div className="space-y-2 max-h-56 overflow-y-auto border-t border-slate-100 pt-3">
              <p className="text-sm font-semibold text-slate-600">หมวดหมู่ปัจจุบัน ({categories.length}):</p>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-md">
                {categories.map((cat, idx) => (
                  <div key={idx} className="p-2.5 flex justify-between items-center text-sm">
                    <span className="font-medium text-slate-800">{cat}</span>
                    <button onClick={() => handleDeleteCategoryClick(cat)} className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 rounded transition"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100">
              <button onClick={() => setIsCategoryModalOpen(false)} className="w-full border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-2.5 rounded-md text-sm transition">เสร็จสิ้น</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Part */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">{editingPart ? 'แก้ไขข้อมูลอะไหล่' : 'เพิ่มอะไหล่ใหม่เข้าคลัง'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSavePart} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">ชื่ออะไหล่ *</label>
                <input type="text" placeholder="เช่น ยางนอก IRC" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">หมวดหมู่</label>
                <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">ตำแหน่งจัดเก็บสินค้า</label>
                <input type="text" placeholder="เช่น ชั้น A-01 / ตู้ B-02" value={formData.storageLocation} onChange={e => setFormData({ ...formData, storageLocation: e.target.value })} className="w-full border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">รูปสินค้า</label>
                <input type="file" accept="image/*" onChange={handlePartImageChange} className="w-full border border-slate-300 rounded-md p-2 text-sm" />
                {partImage && <button type="button" onClick={() => setPartImage('')} className="mt-2 text-xs text-rose-600 hover:text-rose-700 font-semibold">× ลบรูปภาพ</button>}
                {partImage && <img src={partImage} alt="ตัวอย่างรูปสินค้า" className="mt-2 w-20 h-20 object-cover rounded-md border border-slate-200" />}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">ราคาทุน (บาท)</label>
                  <input type="number" min="0" placeholder="200" value={formData.costPrice} onChange={e => setFormData({ ...formData, costPrice: e.target.value })} className="w-full border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">ราคาขาย (บาท) *</label>
                  <input type="number" placeholder="150" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="w-full border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">จำนวนสต็อก (ชิ้น) *</label>
                  <input type="number" placeholder="10" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} className="w-full border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-md shadow-sm transition text-sm">{editingPart ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า'}</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 border border-slate-300 rounded-md text-slate-600 font-semibold hover:bg-slate-50 transition text-sm">ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
