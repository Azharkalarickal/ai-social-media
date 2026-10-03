import React from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast() {
  const { toasts, removeToast } = useAuth();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.type === 'success' && <CheckCircle2 size={18} color="#38bdf8" />}
          {t.type === 'error' && <AlertCircle size={18} color="#ef4444" />}
          {t.type === 'info' && <Info size={18} color="#a855f7" />}
          <span style={{ flex: 1 }}>{t.message}</span>
          <button 
            onClick={() => removeToast(t.id)} 
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 2 }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
