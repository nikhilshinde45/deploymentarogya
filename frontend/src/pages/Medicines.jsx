import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2, Package, Pencil, Plus, Trash2 } from 'lucide-react';
import { useToast } from '../hooks/useToast';

const getAuth = () => {
  try {
    const raw = localStorage.getItem('userInfo');
    if (!raw) return { token: '', role: '' };
    const parsed = JSON.parse(raw);
    return {
      token: parsed?.token || '',
      role: parsed?.role || '',
    };
  } catch {
    return { token: '', role: '' };
  }
};

const stockLabel = (stock) => {
  if (stock <= 0) return { text: 'Out of stock', className: 'bg-red-50 text-red-700 ring-red-100' };
  if (stock < 10) return { text: 'Low stock', className: 'bg-amber-50 text-amber-800 ring-amber-100' };
  return { text: 'In stock', className: 'bg-emerald-50 text-emerald-800 ring-emerald-100' };
};

const emptyForm = {
  name: '',
  price: '',
  stock: '',
  pharmacy: '',
};

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
      setError(`${msg} Sign in as patient, doctor, or pharmacist.`);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row._id);
    setForm({
      name: row.name,
      price: String(row.price),
      stock: String(row.stock),
      pharmacy: row.pharmacy,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        name: form.name.trim(),
        pharmacy: form.pharmacy.trim(),
        price: Number(form.price),
        stock: parseInt(form.stock, 10),
      };
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-7 h-7 text-blue-600" />
            Medicine catalog
          </h1>
          <p className="text-gray-600 mt-1">
            Prices and stock availability. Pharmacists can manage inventory.
          </p>
        </div>
        {isPharmacist && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold shadow-sm hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add medicine
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="ui-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-blue-600">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="font-medium">Loading medicines…</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-100">
                  <th className="px-5 py-3 font-semibold text-gray-700">Name</th>
                  <th className="px-5 py-3 font-semibold text-gray-700">Pharmacy</th>
                  <th className="px-5 py-3 font-semibold text-gray-700 text-right">Price</th>
                  <th className="px-5 py-3 font-semibold text-gray-700 text-right">Stock</th>
                  <th className="px-5 py-3 font-semibold text-gray-700">Availability</th>
                  {isPharmacist && (
                    <th className="px-5 py-3 font-semibold text-gray-700 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isPharmacist ? 6 : 5}
                      className="px-5 py-12 text-center text-gray-500"
                    >
                      No medicines listed yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => {
                    const badge = stockLabel(row.stock);
                    return (
                      <tr key={row._id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'} hover:bg-blue-50/50 transition-colors`}>
                        <td className="px-5 py-3.5 font-medium text-gray-900">{row.name}</td>
                        <td className="px-5 py-3.5 text-gray-700">{row.pharmacy}</td>
                        <td className="px-5 py-3.5 text-right tabular-nums text-gray-900">
                          ${Number(row.price).toFixed(2)}
                        </td>
                        <td className="px-5 py-3.5 text-right tabular-nums text-gray-800">
                          {row.stock}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${badge.className}`}
                          >
                            {badge.text}
                          </span>
                        </td>
                        {isPharmacist && (
                          <td className="px-5 py-3.5 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openEdit(row)}
                                className="p-2 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                title="Edit"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(row._id)}
                                className="p-2 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors"
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
        )}
      </div>

      {modalOpen && isPharmacist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-gray-100 p-6 space-y-4"
            role="dialog"
            aria-modal="true"
          >
            <h2 className="text-lg font-bold text-gray-900">
              {editingId ? 'Edit medicine' : 'Add medicine'}
            </h2>
            <form className="space-y-3" onSubmit={submitForm}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  required
                  className="ui-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pharmacy</label>
                <input
                  required
                  className="ui-input"
                  value={form.pharmacy}
                  onChange={(e) => setForm({ ...form, pharmacy: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    className="ui-input"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="1"
                    className="ui-input"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  />
                </div>
              </div>
              {formError && <p className="text-sm text-red-600 font-medium">{formError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="ui-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="ui-btn-primary"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Medicines;
