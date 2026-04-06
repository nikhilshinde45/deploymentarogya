import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Loader2, Pencil, Plus, Search, Shield, Stethoscope, Users, User, LayoutDashboard,
  Trash2, X, Eye, EyeOff, Upload, Pill
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

const emptyDoctorForm = {
  name: '',
  email: '',
  password: '',
  specialization: '',
  experience: '',
  bio: '',
};

const emptyPharmForm = {
  name: '',
  email: '',
  password: '',
  licenseNumber: '',
  experience: '',
  phone: '',
  address: '',
};

/* ── component ────────────────────────────────── */

const AdminDashboard = () => {
  const { pushToast } = useToast();
  const userInfo = useMemo(() => getUserInfo(), []);
  const token = userInfo?.token || '';
  const role = userInfo?.role || '';
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const [activeTab, setActiveTab] = useState('doctors'); // 'doctors' | 'pharmacists'
  const [error, setError] = useState('');

  /* ── doctor state ───────────────────────────── */
  const [doctors, setDoctors] = useState([]);
  const [docLoading, setDocLoading] = useState(true);
  const [docSearch, setDocSearch] = useState('');

  /* ── pharmacist state ───────────────────────── */
  const [pharmacists, setPharmacists] = useState([]);
  const [pharmLoading, setPharmLoading] = useState(true);
  const [pharmSearch, setPharmSearch] = useState('');

  /* ── shared modal state ─────────────────────── */
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('doctor'); // 'doctor' | 'pharmacist'
  const [editingId, setEditingId] = useState(null);
  
  const [docForm, setDocForm] = useState(emptyDoctorForm);
  const [pharmForm, setPharmForm] = useState(emptyPharmForm);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ── fetch data ─────────────────────────────── */

  const loadDoctors = useCallback(async () => {
    setDocLoading(true);
    try {
      const res = await axios.get('/api/doctors', { headers: authHeaders });
      setDoctors(res.data.data || []);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Unable to load doctors.';
      setError(msg);
      pushToast(msg, 'error');
    } finally {
      setDocLoading(false);
    }
  }, []);

  const loadPharmacists = useCallback(async () => {
    setPharmLoading(true);
    try {
      const res = await axios.get('/api/admin/pharmacists', { headers: authHeaders });
      setPharmacists(res.data.data || []);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Unable to load pharmacists.';
      setError(msg);
      pushToast(msg, 'error');
    } finally {
      setPharmLoading(false);
    }
  }, []);

  useEffect(() => {
    if (role !== 'admin') {
      setError('Access denied: admin role required.');
      setDocLoading(false);
      setPharmLoading(false);
      return;
    }
    loadDoctors();
    loadPharmacists();
  }, [role, loadDoctors, loadPharmacists]);

  /* ── filtered lists ─────────────────────────── */

  const filteredDoctors = useMemo(() => {
    if (!docSearch.trim()) return doctors;
    const q = docSearch.toLowerCase();
    return doctors.filter(
      (d) =>
        d.name?.toLowerCase().includes(q) ||
        d.email?.toLowerCase().includes(q) ||
        d.specialization?.toLowerCase().includes(q) ||
        d.doctorId?.toLowerCase().includes(q)
    );
  }, [doctors, docSearch]);

  const filteredPharmacists = useMemo(() => {
    if (!pharmSearch.trim()) return pharmacists;
    const q = pharmSearch.toLowerCase();
    return pharmacists.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.licenseNumber?.toLowerCase().includes(q) ||
        p.pharmacistId?.toLowerCase().includes(q) ||
        p.phone?.includes(q)
    );
  }, [pharmacists, pharmSearch]);

  /* ── file upload helper ─────────────────────── */

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

  /* ── modal helpers ──────────────────────────── */

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setDocForm(emptyDoctorForm);
    setPharmForm(emptyPharmForm);
    setFormError('');
    setImageFile(null);
    setImagePreview('');
  };

  const openCreateDoctor = () => {
    setModalType('doctor');
    setEditingId(null);
    setDocForm(emptyDoctorForm);
    setFormError('');
    setShowPassword(false);
    setImageFile(null);
    setImagePreview('');
    setModalOpen(true);
  };

  const openEditDoctor = (doc) => {
    setModalType('doctor');
    setEditingId(doc._id);
    setDocForm({
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

  const openCreatePharmacist = () => {
    setModalType('pharmacist');
    setEditingId(null);
    setPharmForm(emptyPharmForm);
    setFormError('');
    setShowPassword(false);
    setImageFile(null);
    setImagePreview('');
    setModalOpen(true);
  };

  const openEditPharmacist = (ph) => {
    setModalType('pharmacist');
    setEditingId(ph._id);
    setPharmForm({
      name: ph.name || '',
      email: ph.email || '',
      password: '',
      licenseNumber: ph.licenseNumber || '',
      experience: String(ph.experience ?? ''),
      phone: ph.phone || '',
      address: ph.address || '',
    });
    setFormError('');
    setShowPassword(false);
    setImageFile(null);
    setImagePreview(ph.profileImage || '');
    setModalOpen(true);
  };

  /* ── submit (create / update) ───────────────── */

  const submitForm = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');

    try {
      const formData = new FormData();
      
      if (modalType === 'doctor') {
        if (!editingId && !imageFile) {
          throw new Error('Profile image is required for doctors.');
        }
        formData.append('name', docForm.name.trim());
        formData.append('specialization', docForm.specialization.trim());
        formData.append('experience', Number(docForm.experience));
        formData.append('bio', docForm.bio.trim());

        if (imageFile) formData.append('profileImage', imageFile);

        if (editingId) {
          await axios.put(`/api/admin/doctors/${editingId}`, formData, {
            headers: { ...authHeaders, 'Content-Type': 'multipart/form-data' },
          });
          pushToast('Doctor updated successfully', 'success');
        } else {
          formData.append('email', docForm.email.trim());
          formData.append('password', docForm.password);
          await axios.post('/api/admin/doctors', formData, {
            headers: { ...authHeaders, 'Content-Type': 'multipart/form-data' },
          });
          pushToast('Doctor added successfully', 'success');
        }
        await loadDoctors();

      } else { // pharmacist
        formData.append('name', pharmForm.name.trim());
        formData.append('licenseNumber', pharmForm.licenseNumber.trim());
        if (pharmForm.experience) formData.append('experience', Number(pharmForm.experience));
        if (pharmForm.phone) formData.append('phone', pharmForm.phone.trim());
        if (pharmForm.address) formData.append('address', pharmForm.address.trim());

        if (imageFile) formData.append('profileImage', imageFile);

        if (editingId) {
          await axios.put(`/api/admin/pharmacists/${editingId}`, formData, {
            headers: { ...authHeaders, 'Content-Type': 'multipart/form-data' },
          });
          pushToast('Pharmacist updated successfully', 'success');
        } else {
          formData.append('email', pharmForm.email.trim());
          formData.append('password', pharmForm.password);
          await axios.post('/api/admin/pharmacists', formData, {
            headers: { ...authHeaders, 'Content-Type': 'multipart/form-data' },
          });
          pushToast('Pharmacist added successfully', 'success');
        }
        await loadPharmacists();
      }

      closeModal();
    } catch (err) {
      const msg = err.message || err?.response?.data?.message || 'Save failed.';
      setFormError(msg);
      pushToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  /* ── delete ─────────────────────────────────── */

  const confirmDelete = (item, type) => {
    setModalType(type);
    setDeleteConfirm(item);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      if (modalType === 'doctor') {
        await axios.delete(`/api/admin/doctors/${deleteConfirm._id}`, { headers: authHeaders });
        pushToast(`Doctor deleted successfully`, 'success');
        await loadDoctors();
      } else {
        await axios.delete(`/api/admin/pharmacists/${deleteConfirm._id}`, { headers: authHeaders });
        pushToast(`Pharmacist deleted successfully`, 'success');
        await loadPharmacists();
      }
      setDeleteConfirm(null);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Delete failed.';
      pushToast(msg, 'error');
    } finally {
      setDeleting(false);
    }
  };

  /* ── renders ────────────────────────────────── */

  if (docLoading && pharmLoading) {
    return (
      <DashboardLayout active="admin">
        <div className="flex items-center gap-2 text-blue-600 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading dashboard data…</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout active="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
              <Shield className="w-7 h-7 text-blue-600" /> Administrative Dashboard
          </h1>
          <p className="text-gray-500 mt-1">Manage system personnel and platform configurations.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl p-5">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* ── Tabs ──────────────────────────────── */}
        <div className="flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('doctors')}
            className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'doctors' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            <Stethoscope className="w-4 h-4" /> Manage Doctors
          </button>
          <button
            onClick={() => setActiveTab('pharmacists')}
            className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'pharmacists' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            <Pill className="w-4 h-4" /> Manage Pharmacists
          </button>
        </div>

        {/* ── Tab Content ───────────────────────── */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden p-5">
          {activeTab === 'doctors' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Stethoscope className="w-6 h-6 text-blue-600" />
                      Doctor Roster
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={openCreateDoctor}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold shadow-sm hover:bg-blue-700 transition-colors shrink-0"
                >
                  <Plus className="w-5 h-5" />
                  Add Doctor
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, specialization, or ID…"
                  value={docSearch}
                  onChange={(e) => setDocSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition-all"
                />
              </div>

              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-gray-100 uppercase tracking-wider text-xs">
                        <th className="px-6 py-4 font-bold text-gray-600">Doctor Profile</th>
                        <th className="px-6 py-4 font-bold text-gray-600">ID</th>
                        <th className="px-6 py-4 font-bold text-gray-600">Specialization</th>
                        <th className="px-6 py-4 font-bold text-gray-600 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredDoctors.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-5 py-12 text-center text-gray-500">No doctors match.</td>
                        </tr>
                      ) : (
                        filteredDoctors.map((doc, idx) => (
                          <tr key={doc._id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'} hover:bg-blue-50/50 transition-colors`}>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                {doc.profileImage ? (
                                  <img src={doc.profileImage} alt={doc.name} className="w-12 h-12 rounded-full object-cover ring-4 ring-white shadow-sm" />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">{doc.name?.[0]}</div>
                                )}
                                <div>
                                  <p className="font-bold text-gray-900">{doc.name}</p>
                                  <p className="text-sm text-gray-500">{doc.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">{doc.doctorId || '—'}</span>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-700">{doc.specialization}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="inline-flex gap-1.5">
                                <button type="button" onClick={() => openEditDoctor(doc)} className="p-2.5 rounded-xl text-gray-500 hover:bg-blue-50 hover:text-blue-700 shadow-sm border border-transparent hover:border-blue-100"><Pencil className="w-4 h-4" /></button>
                                <button type="button" onClick={() => confirmDelete(doc, 'doctor')} className="p-2.5 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-700 shadow-sm border border-transparent hover:border-red-100"><Trash2 className="w-4 h-4" /></button>
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
          )}

          {activeTab === 'pharmacists' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Pill className="w-6 h-6 text-purple-600" />
                      Pharmacist Roster
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={openCreatePharmacist}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 text-white font-semibold shadow-sm hover:bg-purple-700 transition-colors shrink-0"
                >
                  <Plus className="w-5 h-5" />
                  Add Pharmacist
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, license, phone, or ID…"
                  value={pharmSearch}
                  onChange={(e) => setPharmSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-400 focus:ring-1 focus:ring-purple-200 outline-none transition-all"
                />
              </div>

              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-gray-100 uppercase tracking-wider text-xs">
                        <th className="px-6 py-4 font-bold text-gray-600">Profile</th>
                        <th className="px-6 py-4 font-bold text-gray-600">ID</th>
                        <th className="px-6 py-4 font-bold text-gray-600">License #</th>
                        <th className="px-6 py-4 font-bold text-gray-600 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredPharmacists.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-5 py-12 text-center text-gray-500">No pharmacists match.</td>
                        </tr>
                      ) : (
                        filteredPharmacists.map((ph, idx) => (
                          <tr key={ph._id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'} hover:bg-purple-50/50 transition-colors`}>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                {ph.profileImage ? (
                                  <img src={ph.profileImage} alt={ph.name} className="w-12 h-12 rounded-full object-cover ring-4 ring-white shadow-sm" />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">{ph.name?.[0]}</div>
                                )}
                                <div>
                                  <p className="font-bold text-gray-900">{ph.name}</p>
                                  <p className="text-sm text-gray-500">{ph.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex rounded-full bg-purple-50 px-3 py-1 text-sm font-bold text-purple-700">{ph.pharmacistId || '—'}</span>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-700">{ph.licenseNumber || '—'}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="inline-flex gap-1.5">
                                <button type="button" onClick={() => openEditPharmacist(ph)} className="p-2.5 rounded-xl text-gray-500 hover:bg-purple-50 hover:text-purple-700 shadow-sm border border-transparent hover:border-purple-100"><Pencil className="w-4 h-4" /></button>
                                <button type="button" onClick={() => confirmDelete(ph, 'pharmacist')} className="p-2.5 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-700 shadow-sm border border-transparent hover:border-red-100"><Trash2 className="w-4 h-4" /></button>
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
          )}
        </div>
      </div>

      {/* ── Form Modal ──────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-gray-100 p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                {editingId ? <Pencil className="w-5 h-5 text-blue-600"/> : <Plus className="w-5 h-5 text-blue-600"/>}
                {editingId ? `Edit ${modalType === 'doctor' ? 'Doctor' : 'Pharmacist'} Profile` : `Add New ${modalType === 'doctor' ? 'Doctor' : 'Pharmacist'}`}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form className="space-y-5 mt-4" onSubmit={submitForm}>
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Profile Image {!editingId && modalType === 'doctor' ? <span className="text-blue-600">*</span> : <span className="text-gray-400 font-normal ml-1">(Optional)</span>}
                </label>
                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50/80 hover:bg-blue-50/50 hover:border-blue-400 transition-all group relative overflow-hidden">
                  {imagePreview ? (
                    <div className="absolute inset-0 w-full h-full p-4 flex flex-col sm:flex-row items-center justify-center gap-4 bg-white/60 backdrop-blur-sm z-10 transition-colors mx-auto text-center sm:text-left">
                      <img src={imagePreview} alt="Preview" className="w-20 h-20 rounded-full object-cover ring-4 ring-white shadow-md bg-white shrink-0" />
                      <div>
                        <p className="text-base font-bold text-gray-800">{imageFile ? imageFile.name : 'Current Image'}</p>
                        <p className="text-sm font-semibold text-blue-600 mt-0.5 underline decoration-blue-200">Click to change</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2.5 text-gray-400 group-hover:text-blue-600 transition-colors">
                      <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center border border-gray-100 group-hover:border-blue-200"><Upload className="w-6 h-6" /></div>
                      <span className="block text-sm font-semibold">Upload Image</span>
                    </div>
                  )}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageChange} />
                </label>
              </div>

              {/* Shared fields */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name <span className="text-blue-600">*</span></label>
                <input
                  required
                  className="w-full px-4 py-2.5 text-base border-2 border-gray-100 rounded-xl bg-gray-50/50 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none"
                  value={modalType === 'doctor' ? docForm.name : pharmForm.name}
                  onChange={(e) => modalType === 'doctor' ? setDocForm({...docForm, name: e.target.value}) : setPharmForm({...pharmForm, name: e.target.value})}
                />
              </div>

              {editingId ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                  <p className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed">
                    {modalType === 'doctor' ? docForm.email : pharmForm.email}
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address <span className="text-blue-600">*</span></label>
                  <input
                    required type="email"
                    className="w-full px-4 py-2.5 text-base border-2 border-gray-100 rounded-xl bg-gray-50/50 focus:border-blue-400 focus:ring-4 outline-none"
                    value={modalType === 'doctor' ? docForm.email : pharmForm.email}
                    onChange={(e) => modalType === 'doctor' ? setDocForm({...docForm, email: e.target.value}) : setPharmForm({...pharmForm, email: e.target.value})}
                  />
                </div>
              )}

              {!editingId && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password <span className="text-blue-600">*</span></label>
                  <div className="relative">
                    <input
                      required type={showPassword ? 'text' : 'password'}
                      className="w-full px-4 py-2.5 pr-11 text-base border-2 border-gray-100 rounded-xl bg-gray-50/50 focus:border-blue-400 focus:ring-4 outline-none"
                      value={modalType === 'doctor' ? docForm.password : pharmForm.password}
                      onChange={(e) => modalType === 'doctor' ? setDocForm({...docForm, password: e.target.value}) : setPharmForm({...pharmForm, password: e.target.value})}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Type-specific fields */}
              {modalType === 'doctor' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Specialization <span className="text-blue-600">*</span></label>
                    <input
                      required
                      className="w-full px-4 py-2.5 text-base border-2 border-gray-100 rounded-xl bg-gray-50/50 focus:border-blue-400 focus:ring-4 outline-none"
                      value={docForm.specialization}
                      onChange={(e) => setDocForm({...docForm, specialization: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Experience (Yrs) <span className="text-blue-600">*</span></label>
                    <input
                      required type="number"
                      className="w-full px-4 py-2.5 text-base border-2 border-gray-100 rounded-xl bg-gray-50/50 focus:border-blue-400 focus:ring-4 outline-none"
                      value={docForm.experience}
                      onChange={(e) => setDocForm({...docForm, experience: e.target.value})}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">License Number <span className="text-blue-600">*</span></label>
                    <input
                      required
                      className="w-full px-4 py-2.5 text-base border-2 border-gray-100 rounded-xl bg-gray-50/50 focus:border-blue-400 focus:ring-4 outline-none"
                      value={pharmForm.licenseNumber}
                      onChange={(e) => setPharmForm({...pharmForm, licenseNumber: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Experience (Yrs)</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2.5 text-base border-2 border-gray-100 rounded-xl bg-gray-50/50 focus:border-blue-400 focus:ring-4 outline-none"
                      value={pharmForm.experience}
                      onChange={(e) => setPharmForm({...pharmForm, experience: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {formError && (
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg font-medium">{formError}</p>
              )}

              <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-gray-100">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={saving} className="px-6 py-2.5 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-gray-900">Confirm Deletion</h3>
            <p className="text-sm text-gray-700">Are you sure you want to remove <span className="font-semibold">{deleteConfirm.name}</span>?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 bg-gray-100 rounded-xl font-medium">Cancel</button>
              <button onClick={handleDelete} className="px-5 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700">{deleting ? '...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;
