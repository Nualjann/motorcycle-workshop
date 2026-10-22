import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, X } from 'lucide-react';

export default function ReceiptModal({ data, onClose }) {
  const printRef = useRef();
  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  if (!data) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800">พิมพ์เอกสาร</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        {/* ส่วนที่จะถูกพิมพ์ออกมา (จำลองสลิป 80mm) */}
        <div ref={printRef} className="p-4 border border-dashed rounded bg-slate-50 text-slate-900 text-sm font-mono">
          <div className="text-center pb-3 border-b border-dashed">
            <h4 className="font-bold text-base">MotoFix Service</h4>
            <p className="text-xs text-slate-500">โทร 081-XXX-XXXX</p>
            <p className="text-xs font-semibold mt-1">{data.title}</p>
          </div>
          <div className="py-3 space-y-1.5 border-b border-dashed">
            {data.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-xs">
                <span>{item.name} x{item.qty}</span>
                <span>฿{item.price * item.qty}</span>
              </div>
            ))}
          </div>
          <div className="pt-3 flex justify-between font-bold">
            <span>รวมเงิน</span>
            <span>฿{data.total}</span>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={handlePrint} className="flex-1 bg-slate-900 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5">
            <Printer className="w-4 h-4" /> พิมพ์สลิป
          </button>
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-slate-50">
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
