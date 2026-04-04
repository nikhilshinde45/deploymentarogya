import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  Loader2, Pencil, Plus, Search, Shield, Stethoscope,
  Trash2, Users, X, Pill, Eye, EyeOff, Upload, ImageIcon
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useToast } from '../hooks/useToast';

/* ── helpers ──────────────────────────────────── */

const getUserInfo = () => {
  try {
    return JSON.parse(localStorage.getItem('userInfo') || '{}') || {};
  } catch {
    return {};
  }
};

const emptyForm = {
  name: '',
  email: '',
  password: '',
  specialization: '',
  experience: '',
  bio: '',
};

/* ── component ────────────────────────────────── */

const AdminDashboard = () => {
  const { pushToast } = useToast();
  const userInfo = useMemo(() => getUserInfo(), []);
  const token = userInfo?.token || '';
  const role = userInfo?.role || '';
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  /* state */
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ── fetch doctors ──────────────────────────── */

  const loadDoctors = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/doctors', { headers: authHeaders });
      setDoctors(res.data.data || []);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Unable to load doctors.';
      setError(msg);
      pushToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (role !== 'admin') {
      setError('Access denied: admin role required.');
      setLoading(false);
      return;
    }
    loadDoctors();
  }, [role, loadDoctors]);

  /* ── filtered list ──────────────────────────── */

  const filtered = useMemo(() => {
    if (!search.trim()) return doctors;
    const q = search.toLowerCase();
    return doctors.filter(
      (d) =>
        d.name?.toLowerCase().includes(q) ||
        d.email?.toLowerCase().includes(q) ||
        d.specialization?.toLowerCase().includes(q) ||
        d.doctorId?.toLowerCase().includes(q)
    );
  }, [doctors, search]);

  /* ── modal helpers ──────────────────────────── */

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setShowPassword(false);
    setImageFile(null);
    setImagePreview('');
    setModalOpen(true);
  };

  const openEdit = (doc) => {
    setEditingId(doc._id);
    setForm({
      name: doc.name || '',
      email: doc.email || '',
      password: '',
      specialization: doc.specialization || '',
      experience: String(doc.experience ?? ''),
      bio: doc.bio || '',
    });
    setFormError('');
    setShowPassword(false);
    setImageFile(null);
    setImagePreview(doc.profileImage || '');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setImageFile(null);
    setImagePreview('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFormError('Please select a valid image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError('Image must be under 5 MB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setFormError('');
  };

  /* ── submit (create / update) ───────────────── */

  const submitForm = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');

    // Require image on create
    if (!editingId && !imageFile) {
      setFormError('Profile image is required');
      setSaving(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', form.name.trim());
      formData.append('email', form.email.trim());
      formData.append('specialization', form.specialization.trim());
      formData.append('experience', Number(form.experience));
      formData.append('bio', form.bio.trim());

      if (imageFile) {
        formData.append('profileImage', imageFile);
      }

      if (editingId) {
        if (form.password) formData.append('password', form.password);
        await axios.put(`/api/admin/doctors/${editingId}`, formData, {
          headers: { ...authHeaders, 'Content-Type': 'multipart/form-data' },
        });
        pushToast('Doctor updated successfully', 'success');
      } else {
        formData.append('password', form.password);
        await axios.post('/api/admin/doctors', formData, {
          headers: { ...authHeaders, 'Content-Type': 'multipart/form-data' },
        });
        pushToast('Doctor added successfully', 'success');
      }
      closeModal();
      await loadDoctors();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Save failed.';
      setFormError(msg);
      pushToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  /* ── delete ─────────────────────────────────── */

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/admin/doctors/${deleteConfirm._id}`, {
        headers: authHeaders,
      });
      pushToast('Doctor deleted successfully', 'success');
      setDeleteConfirm(null);
      await loadDoctors();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Delete failed.';
      pushToast(msg, 'error');
    } finally {
      setDeleting(false);
    }
  };

  /* ── render ─────────────────────────────────── */

  if (loading) {
    return (
      <DashboardLayout active="admin">
        <div className="flex items-center gap-2 text-blue-600 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading admin dashboard…</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout active="admin">
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl p-5">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* ── stat cards ─────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{doctors.length}</p>
                <p className="text-xs text-gray-500">Total Doctors</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {[...new Set(doctors.map((d) => d.specialization))].length}
                </p>
                <p className="text-xs text-gray-500">Specializations</p>
              </div>
            </div>
          </div>
          <Link
            to="/medicines"
            className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:border-blue-200 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-100 transition-colors">
                <Pill className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                  View Medicines
                </p>
                <p className="text-xs text-gray-500">Browse available inventory</p>
              </div>
            </div>
          </Link>
        </div>

        {/* ── toolbar ────────────────────────── */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Doctor Management
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Add, edit, or remove doctors from the platform.
              </p>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold shadow-sm hover:bg-blue-700 transition-colors shrink-0"
            >
              <Plus className="w-5 h-5" />
              Add Doctor
            </button>
          </div>

          {/* search */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, specialization, or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition-all"
            />
          </div>
        </div>

        {/* ── doctor table ───────────────────── */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-100">
                  <th className="px-5 py-3 font-semibold text-gray-700">Doctor</th>
                  <th className="px-5 py-3 font-semibold text-gray-700">ID</th>
                  <th className="px-5 py-3 font-semibold text-gray-700">Specialization</th>
                  <th className="px-5 py-3 font-semibold text-gray-700 text-center">Exp (yrs)</th>
                  <th className="px-5 py-3 font-semibold text-gray-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-gray-500">
                      {doctors.length === 0
                        ? 'No doctors added yet. Click "Add Doctor" to get started.'
                        : 'No doctors match your search.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((doc, idx) => (
                    <tr
                      key={doc._id}
                      className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'} hover:bg-blue-50/50 transition-colors`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {doc.profileImage ? (
                            <img
                              src={doc.profileImage}
                              alt={doc.name}
                              className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                              {doc.name?.[0]?.toUpperCase() || 'D'}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{doc.name}</p>
                            <p className="text-xs text-gray-500">{doc.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-100">
                          {doc.doctorId || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-700">{doc.specialization}</td>
                      <td className="px-5 py-3.5 text-center tabular-nums text-gray-800">{doc.experience}</td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(doc)}
                            className="p-2 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm(doc)}
                            className="p-2 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── add/edit modal ──────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-gray-100 p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? 'Edit Doctor' : 'Add New Doctor'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form className="space-y-3" onSubmit={submitForm}>
              {/* name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition-all"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Dr. John Doe"
                />
              </div>

              {/* email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  required
                  type="email"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition-all"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="doctor@example.com"
                />
              </div>

              {/* password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingId ? 'New Password (leave blank to keep current)' : 'Password *'}
                </label>
                <div className="relative">
                  <input
                    required={!editingId}
                    type={showPassword ? 'text' : 'password'}
                    className="w-full px-3 py-2 pr-10 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition-all"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder={editingId ? '••••••••' : 'Min 6 characters'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* specialization + experience */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialization *</label>
                  <input
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition-all"
                    value={form.specialization}
                    onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                    placeholder="Cardiology"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience (yrs) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition-all"
                    value={form.experience}
                    onChange={(e) => setForm({ ...form, experience: e.target.value })}
                    placeholder="5"
                  />
                </div>
              </div>

              {/* bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition-all resize-none"
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Short description of the doctor…"
                />
              </div>

              {/* profile image upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Image {!editingId && '*'}
                </label>
                <label
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-blue-50/50 hover:border-blue-300 transition-all group"
                >
                  {imagePreview ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-16 h-16 rounded-full object-cover ring-2 ring-white shadow-md"
                      />
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-700">
                          {imageFile ? imageFile.name : 'Current image'}
                        </p>
                        <p className="text-xs text-blue-600 group-hover:underline">Click to change</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-gray-400 group-hover:text-blue-500 transition-colors">
                      <Upload className="w-6 h-6" />
                      <span className="text-sm font-medium">Click to upload image</span>
                      <span className="text-xs">JPG, PNG, WebP — max 5 MB</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              </div>

              {formError && (
                <p className="text-sm text-red-600 font-medium bg-red-50 rounded-lg px-3 py-2">{formError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {saving ? 'Saving…' : editingId ? 'Update Doctor' : 'Add Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── delete confirmation ────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full border border-gray-100 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Delete Doctor</h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-gray-700">
              Are you sure you want to remove{' '}
              <span className="font-semibold">{deleteConfirm.name}</span> ({deleteConfirm.doctorId}) from the system?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;
