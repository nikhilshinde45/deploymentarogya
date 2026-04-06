import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Loader2, Package, Pencil, Plus, Trash2, Search, X,
  Pill, Store, IndianRupee, Boxes, AlertCircle, Filter,
  ChevronLeft, ChevronRight, Eye, XCircle
} from 'lucide-react';
import { useToast } from '../hooks/useToast';

const getAuth = () => {
  try {
    const raw = localStorage.getItem('userInfo');
    if (!raw) return { token: '', role: '' };
    const parsed = JSON.parse(raw);
    return { token: parsed?.token || '', role: parsed?.role || '' };
  } catch {
    return { token: '', role: '' };
  }
};

const stockLabel = (stock) => {
  if (stock <= 0) return { text: 'Out of stock', bg: 'bg-red-50', color: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' };
  if (stock < 10) return { text: 'Low stock', bg: 'bg-amber-50', color: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' };
  return { text: 'In stock', bg: 'bg-emerald-50', color: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' };
};

const emptyForm = { name: '', price: '', stock: '', pharmacy: '' };
const PAGE_SIZE = 8;

const Medicines = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const { pushToast } = useToast();

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // 'all' | 'instock' | 'low' | 'out'
  const [currentPage, setCurrentPage] = useState(1);

  // Detail view
  const [viewDetail, setViewDetail] = useState(null);

  const { role } = getAuth();
  const isPharmacist = role === 'pharmacist';

  const authHeaders = () => {
    const t = getAuth().token;
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/medicines', { headers: authHeaders() });
      setRows(res.data.data || []);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Unable to load medicines.';
      setError(msg);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filtered + searched rows
  const filteredRows = useMemo(() => {
    let filtered = rows;

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(q) || r.pharmacy.toLowerCase().includes(q)
      );
    }

    // Stock filter
    if (stockFilter === 'instock') filtered = filtered.filter(r => r.stock >= 10);
    else if (stockFilter === 'low') filtered = filtered.filter(r => r.stock > 0 && r.stock < 10);
    else if (stockFilter === 'out') filtered = filtered.filter(r => r.stock <= 0);

    return filtered;
  }, [rows, searchQuery, stockFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const paginatedRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset page when search/filter changes
  useEffect(() => { setCurrentPage(1); }, [searchQuery, stockFilter]);

  // Stats
  const totalMedicines = rows.length;
  const inStockCount = rows.filter(r => r.stock > 0).length;
  const outOfStockCount = rows.filter(r => r.stock <= 0).length;
  const uniquePharmacies = new Set(rows.map(r => r.pharmacy)).size;

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (row) => {
    setEditingId(row._id);
    setForm({ name: row.name, price: String(row.price), stock: String(row.stock), pharmacy: row.pharmacy });
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditingId(null); setForm(emptyForm); setFormError(''); };

  const submitForm = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const payload = { name: form.name.trim(), pharmacy: form.pharmacy.trim(), price: Number(form.price), stock: parseInt(form.stock, 10) };
      if (editingId) {
        await axios.put(`/api/medicines/${editingId}`, payload, { headers: authHeaders() });
      } else {
        await axios.post('/api/medicines', payload, { headers: authHeaders() });
      }
      closeModal();
      await load();
      pushToast(editingId ? 'Medicine updated successfully' : 'Medicine added successfully', 'success');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Save failed.';
      setFormError(msg);
      pushToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this medicine from the catalog?')) return;
    try {
      await axios.delete(`/api/medicines/${id}`, { headers: authHeaders() });
      await load();
      pushToast('Medicine deleted successfully', 'success');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Delete failed.';
      setError(msg);
      pushToast(msg, 'error');
    }
  };

  // Skeleton loader
  const SkeletonRow = () => (
    <tr className="animate-pulse">
      {[...Array(isPharmacist ? 6 : 5)].map((_, i) => (
        <td key={i} className="px-5 py-4"><div className="h-4 bg-gray-200 rounded-lg w-3/4" /></td>
      ))}
    </tr>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6" style={{ animation: 'pageIn 0.4s ease-out' }}>
      {/* ── Page Header ── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Pill className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Medicine Catalog</h1>
                <p className="text-blue-100 text-sm mt-0.5">Browse medicines, prices, and stock availability</p>
              </div>
            </div>
            {isPharmacist && (
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-blue-700 font-semibold shadow-lg hover:shadow-xl hover:bg-blue-50 active:scale-[0.97] transition-all duration-200"
              >
                <Plus className="w-5 h-5" />
                Add Medicine
              </button>
            )}
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
          {[
            { label: 'Total Medicines', value: totalMedicines, icon: Package, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
            { label: 'In Stock', value: inStockCount, icon: Boxes, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
            { label: 'Out of Stock', value: outOfStockCount, icon: AlertCircle, iconBg: 'bg-red-50', iconColor: 'text-red-600' },
            { label: 'Pharmacies', value: uniquePharmacies, icon: Store, iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
          ].map((stat) => (
            <div key={stat.label} className="px-5 py-4 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
              <div className={`w-9 h-9 rounded-lg ${stat.iconBg} flex items-center justify-center shrink-0`}>
                <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-900 leading-tight">{stat.value}</p>
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Search & Filter Bar ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search medicines or pharmacies..."
            className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          {[
            { key: 'all', label: 'All' },
            { key: 'instock', label: 'In Stock' },
            { key: 'low', label: 'Low Stock' },
            { key: 'out', label: 'Out of Stock' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setStockFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                stockFilter === f.key
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Medicine</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Pharmacy</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">Price</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">Stock</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                  {isPharmacist && <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
              </tbody>
            </table>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Medicine</th>
                    <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Pharmacy</th>
                    <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">Price</th>
                    <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">Stock</th>
                    <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                    {isPharmacist && <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={isPharmacist ? 6 : 5} className="px-5 py-16 text-center">
                        <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 font-medium">
                          {searchQuery || stockFilter !== 'all'
                            ? 'No medicines match your search or filter.'
                            : 'No medicines listed yet.'
                          }
                        </p>
                        {(searchQuery || stockFilter !== 'all') && (
                          <button
                            onClick={() => { setSearchQuery(''); setStockFilter('all'); }}
                            className="mt-3 text-xs text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                          >
                            Clear all filters
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((row, index) => {
                      const badge = stockLabel(row.stock);
                      return (
                        <tr
                          key={row._id}
                          className={`group cursor-pointer transition-all duration-200 ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'
                          } hover:bg-blue-50/50 hover:shadow-sm`}
                          style={{ animation: `rowIn 0.3s ease-out ${index * 0.04}s both` }}
                          onClick={() => setViewDetail(row)}
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors shrink-0">
                                <Pill className="w-4 h-4 text-blue-600" />
                              </div>
                              <span className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{row.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Store className="w-3.5 h-3.5 text-gray-400" />
                              {row.pharmacy}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className="inline-flex items-center gap-1 font-semibold text-gray-900 tabular-nums">
                              <IndianRupee className="w-3.5 h-3.5 text-gray-400" />
                              {Number(row.price).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className="font-semibold text-gray-800 tabular-nums">{row.stock}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${badge.bg} ${badge.color} ${badge.border}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                              {badge.text}
                            </span>
                          </td>
                          {isPharmacist && (
                            <td className="px-5 py-4 text-right">
                              <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); openEdit(row); }}
                                  className="p-2 rounded-lg text-gray-500 hover:bg-blue-100 hover:text-blue-700 transition-all"
                                  title="Edit"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleDelete(row._id); }}
                                  className="p-2 rounded-lg text-gray-500 hover:bg-red-100 hover:text-red-700 transition-all"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ── */}
            {filteredRows.length > PAGE_SIZE && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm">
                <p className="text-gray-500">
                  Showing <span className="font-semibold text-gray-700">{(currentPage - 1) * PAGE_SIZE + 1}</span>–<span className="font-semibold text-gray-700">{Math.min(currentPage * PAGE_SIZE, filteredRows.length)}</span> of <span className="font-semibold text-gray-700">{filteredRows.length}</span>
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                        currentPage === i + 1
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── View Detail Modal ── */}
      {viewDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setViewDetail(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden"
            style={{ animation: 'modalIn 0.22s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Pill className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{viewDetail.name}</h2>
                  <p className="text-blue-100 text-xs">{viewDetail.pharmacy}</p>
                </div>
              </div>
              <button
                onClick={() => setViewDetail(null)}
                className="text-white/80 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100/60">
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <IndianRupee className="w-3 h-3" /> Price
                  </p>
                  <p className="text-xl font-extrabold text-gray-900">₹{Number(viewDetail.price).toFixed(2)}</p>
                </div>
                <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100/60">
                  <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Boxes className="w-3 h-3" /> Stock
                  </p>
                  <p className="text-xl font-extrabold text-gray-900">{viewDetail.stock} <span className="text-sm font-medium text-gray-500">units</span></p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <Store className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pharmacy</p>
                  <p className="text-sm font-semibold text-gray-900">{viewDetail.pharmacy}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border ${stockLabel(viewDetail.stock).bg} ${stockLabel(viewDetail.stock).color} ${stockLabel(viewDetail.stock).border}`}>
                  <span className={`w-2 h-2 rounded-full ${stockLabel(viewDetail.stock).dot}`} />
                  {stockLabel(viewDetail.stock).text}
                </span>
                {viewDetail.updatedAt && (
                  <span className="text-[11px] text-gray-400">
                    Updated: {new Date(viewDetail.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add/Edit Modal ── */}
      {modalOpen && isPharmacist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={closeModal}>
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full relative overflow-hidden"
            style={{ animation: 'modalIn 0.22s ease-out' }}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${editingId ? 'bg-amber-100' : 'bg-blue-100'}`}>
                  {editingId ? <Pencil className="w-4 h-4 text-amber-600" /> : <Plus className="w-4 h-4 text-blue-600" />}
                </div>
                <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Medicine' : 'Add Medicine'}</h2>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-700 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form className="p-6 space-y-4" onSubmit={submitForm}>
              <div className="space-y-1.5">
                <label className="text-xs font-bold tracking-wide text-gray-500 uppercase">Medicine Name</label>
                <input
                  required
                  className="ui-input text-sm"
                  value={form.name}
                  placeholder="e.g. Paracetamol 500mg"
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold tracking-wide text-gray-500 uppercase">Pharmacy</label>
                <input
                  required
                  className="ui-input text-sm"
                  value={form.pharmacy}
                  placeholder="e.g. Apollo Pharmacy"
                  onChange={(e) => setForm({ ...form, pharmacy: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold tracking-wide text-gray-500 uppercase">Price (₹)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    className="ui-input text-sm"
                    value={form.price}
                    placeholder="0.00"
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold tracking-wide text-gray-500 uppercase">Stock</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="1"
                    className="ui-input text-sm"
                    value={form.stock}
                    placeholder="0"
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  />
                </div>
              </div>
              {formError && (
                <div className="text-sm text-red-600 font-medium bg-red-50 rounded-lg px-3 py-2 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {formError}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 ui-btn-secondary text-sm">Cancel</button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${
                    editingId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pageIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes rowIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default Medicines;
