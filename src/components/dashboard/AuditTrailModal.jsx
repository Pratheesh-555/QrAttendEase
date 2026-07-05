import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, AlertCircle, CheckCircle, Clock, Filter, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { classApi } from '../../api/classApi';

const eventStyles = {
  session_started: {
    label: 'Session Started',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: CheckCircle
  },
  session_refreshed: {
    label: 'Token Refreshed',
    badge: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    icon: RefreshCw
  },
  mark_success: {
    label: 'Mark Success',
    badge: 'bg-green-100 text-green-700 border-green-200',
    icon: CheckCircle
  },
  mark_duplicate: {
    label: 'Duplicate Blocked',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: AlertCircle
  },
  mark_rejected: {
    label: 'Rejected',
    badge: 'bg-red-100 text-red-700 border-red-200',
    icon: AlertCircle
  },
  mark_invalid: {
    label: 'Invalid Token',
    badge: 'bg-red-100 text-red-700 border-red-200',
    icon: AlertCircle
  },
  session_expired: {
    label: 'Session Expired',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: Clock
  }
};

const AuditTrailModal = ({ isOpen, onClose, classes = [], initialClassId = 'all' }) => {
  const [selectedClassId, setSelectedClassId] = useState(initialClassId);
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setSelectedClassId(initialClassId);
  }, [isOpen, initialClassId]);

  useEffect(() => {
    if (!isOpen) return;

    const loadAudits = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await classApi.getAttendanceAudit(selectedClassId === 'all' ? null : selectedClassId);
        setAudits(Array.isArray(response.audits) ? response.audits : []);
      } catch (fetchError) {
        console.error('Failed to load audit trail:', fetchError);
        setError('Unable to load audit trail right now.');
        setAudits([]);
      } finally {
        setLoading(false);
      }
    };

    loadAudits();
  }, [isOpen, selectedClassId]);

  const filteredCount = useMemo(() => audits.length, [audits]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 10 }}
          className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="h-6 w-6 text-cyan-300" />
                  <h2 className="text-xl font-semibold">Attendance Audit Trail</h2>
                </div>
                <p className="mt-1 text-sm text-slate-300">Review token issuance, scan attempts, and attendance outcomes.</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg border border-white/15 bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Class Filter</label>
                <div className="relative">
                  <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    value={selectedClassId}
                    onChange={(event) => setSelectedClassId(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-9 pr-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-900"
                  >
                    <option value="all">All Classes</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Events Shown</p>
                    <p className="text-lg font-semibold text-slate-900">{filteredCount}</p>
                  </div>
                  <ShieldCheck className="h-8 w-8 text-emerald-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="max-h-[calc(90vh-210px)] overflow-y-auto bg-slate-50 px-6 py-5">
            {loading && (
              <div className="flex items-center justify-center py-16 text-slate-500">
                Loading audit trail...
              </div>
            )}

            {!loading && error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {!loading && !error && audits.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-slate-500">
                No audit events found for this filter.
              </div>
            )}

            {!loading && !error && audits.length > 0 && (
              <div className="space-y-3">
                {audits.map((audit) => {
                  const style = eventStyles[audit.eventType] || eventStyles.mark_rejected;
                  const Icon = style.icon;

                  return (
                    <div key={audit._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${style.badge}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-semibold text-slate-900">{style.label}</h3>
                              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${style.badge}`}>
                                {audit.eventType}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-slate-600">{audit.detail || 'No additional details'}</p>
                            <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2 lg:grid-cols-3">
                              <div>
                                <span className="font-medium text-slate-700">Class:</span> {audit.className || 'Unknown'}
                              </div>
                              <div>
                                <span className="font-medium text-slate-700">Actor:</span> {audit.actorName || audit.actorEmail || 'System'}
                              </div>
                              <div>
                                <span className="font-medium text-slate-700">Token Prefix:</span> {audit.qrTokenHashPrefix || 'n/a'}
                              </div>
                              <div>
                                <span className="font-medium text-slate-700">IP:</span> {audit.ipAddress || 'n/a'}
                              </div>
                              <div className="sm:col-span-2 lg:col-span-1">
                                <span className="font-medium text-slate-700">Time:</span> {audit.createdAt ? format(new Date(audit.createdAt), 'PPpp') : 'n/a'}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                          {audit.userAgent ? audit.userAgent.slice(0, 48) : 'node'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AuditTrailModal;
