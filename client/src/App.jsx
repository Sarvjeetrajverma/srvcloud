import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Lock, Upload, FileText, LogOut, Download, Trash2, Image, File, Film, UserPlus, Search, Grid, List, Eye, X, FolderPlus, Folder, ChevronRight, ArrowLeft, Edit, Moon, Sun, Star, RotateCcw, Share2, Tag, User, Activity } from 'lucide-react';
import axios from 'axios';

// Automatically switch between Localhost (Dev) and Render (Production)
const API_URL = import.meta.env.PROD 
  ? 'https://<YOUR-RENDER-APP-NAME>.onrender.com/api' // REPLACE THIS with your actual Render URL
  : 'http://localhost:5000/api';

const MAX_STORAGE = 1 * 1024 * 1024 * 1024; // 1 GB Storage Limit

// --- Components ---

const Login = ({ setToken }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await axios.post(`${API_URL}/login`, { username, password });
      setToken(res.data.token);
      localStorage.setItem('token', res.data.token);
    } catch (err) {
      if (!err.response) {
        setError("Server not reachable. Is the backend running?");
      } else {
        setError(err.response.data || "An error occurred");
      }
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
      <form onSubmit={handleSubmit} className="p-8 bg-gray-800 rounded-lg shadow-xl w-96">
        <div className="flex justify-center mb-6 text-blue-400"><Lock size={48} /></div>
        <h2 className="text-2xl mb-6 text-center font-bold">Admin Vault</h2>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        <input 
          className="w-full mb-4 p-3 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
          type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} 
        />
        <input 
          className="w-full mb-6 p-3 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
          type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} 
        />
        <button className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded font-bold transition">Access Vault</button>
      </form>
    </div>
  );
};

const Profile = ({ token }) => {
  const [newUsername, setNewUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    try {
      await axios.put(`${API_URL}/profile/update`, 
        { newUsername, currentPassword, newPassword }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("Profile updated successfully!");
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setError(err.response?.data || "Failed to update profile");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
      <form onSubmit={handleUpdate} className="p-8 bg-gray-800 rounded-lg shadow-xl w-96 relative">
        <button type="button" onClick={() => navigate('/')} className="absolute top-4 left-4 text-gray-400 hover:text-white"><ArrowLeft size={24} /></button>
        <h2 className="text-2xl mb-6 text-center font-bold">Edit Profile</h2>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        {message && <p className="text-green-500 mb-4 text-center">{message}</p>}
        <label className="block text-sm text-gray-400 mb-1">New Username (Optional)</label>
        <input className="w-full mb-4 p-3 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500" type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} />
        <label className="block text-sm text-gray-400 mb-1">New Password (Optional)</label>
        <input className="w-full mb-4 p-3 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
        <label className="block text-sm text-gray-400 mb-1">Current Password (Required)</label>
        <input className="w-full mb-6 p-3 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
        <button className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded font-bold transition">Save Changes</button>
      </form>
    </div>
  );
};

const SystemHealth = ({ token }) => {
  const [health, setHealth] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await axios.get(`${API_URL}/health`, { headers: { Authorization: `Bearer ${token}` } });
        setHealth(res.data);
      } catch (err) { console.error(err); }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 3000); // Live update every 3s
    return () => clearInterval(interval);
  }, [token]);

  const formatUptime = (s) => {
    const d = Math.floor(s / (3600*24));
    const h = Math.floor(s % (3600*24) / 3600);
    const m = Math.floor(s % 3600 / 60);
    const sec = Math.floor(s % 60);
    return `${d}d ${h}h ${m}m ${sec}s`;
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
      <div className="p-8 bg-gray-800 rounded-lg shadow-xl w-96 relative">
        <button onClick={() => navigate('/')} className="absolute top-4 left-4 text-gray-400 hover:text-white"><ArrowLeft size={24} /></button>
        <div className="flex justify-center mb-6 text-green-400"><Activity size={48} /></div>
        <h2 className="text-2xl mb-6 text-center font-bold">System Health</h2>
        
        {!health ? <p className="text-center">Loading...</p> : (
          <div className="space-y-4">
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-400">Status</span>
              <span className="text-green-400 font-bold">{health.status}</span>
            </div>
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-400">Database</span>
              <span className={health.dbStatus === 'Connected' ? "text-green-400" : "text-red-400"}>{health.dbStatus}</span>
            </div>
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-400">Uptime</span>
              <span>{formatUptime(health.uptime)}</span>
            </div>
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-400">Memory (RSS)</span>
              <span>{(health.memoryUsage.rss / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            <div className="text-center text-xs text-gray-500 mt-4">
              Last Updated: {new Date(health.timestamp).toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Dashboard = ({ token, setToken }) => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('date-desc');
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [viewMode, setViewMode] = useState('grid');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, file: null });
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  // Calculate Storage Usage
  const totalUsed = files.reduce((acc, file) => acc + file.size, 0);
  const usagePercentage = Math.min((totalUsed / MAX_STORAGE) * 100, 100);

  // Recent Files Logic
  const recentFiles = files
    .filter(f => !f.isFolder)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  useEffect(() => {
    const handleClick = () => setContextMenu(prev => ({ ...prev, visible: false }));
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const fetchFiles = async () => {
    try {
      const res = await axios.get(`${API_URL}/files`, { headers: { Authorization: `Bearer ${token}` } });
      setFiles(res.data);
    } catch (err) {
      console.error("Failed to fetch files");
      if(err.response?.status === 401) logout();
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('parentId', currentFolder || '');

    try {
      await axios.post(`${API_URL}/upload`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      fetchFiles();
    } catch (err) {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const downloadFile = async (fileId, fileName) => {
    try {
      const res = await axios.get(`${API_URL}/file/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob', // Important for files
      });
      // Create a temporary download link
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      alert("Could not download file.");
    }
  };

  const deleteFile = async (fileId) => {
    const file = files.find(f => f._id === fileId);
    const isPermanent = file?.isTrash;
    if(!confirm(isPermanent ? "Permanently delete this file?" : "Move to trash?")) return;

    try {
      await axios.delete(`${API_URL}/file/${fileId}`, { headers: { Authorization: `Bearer ${token}` } });
      
      if (isPermanent) setFiles(files.filter(f => f._id !== fileId));
      else setFiles(files.map(f => f._id === fileId ? { ...f, isTrash: true } : f));

      if (selectedFiles.has(fileId)) {
        const newSelected = new Set(selectedFiles);
        newSelected.delete(fileId);
        setSelectedFiles(newSelected);
      }
    } catch (err) {
      alert("Failed to delete file");
    }
  };

  const restoreFile = async (fileId) => {
    try {
      await axios.put(`${API_URL}/restore/${fileId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setFiles(files.map(f => f._id === fileId ? { ...f, isTrash: false } : f));
    } catch (err) {
      alert("Failed to restore file");
    }
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('token');
  };

  const filteredFiles = files.filter(file => {
    // If searching, search everything globally
    const matchesSearch = file.originalName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (file.tags && file.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));
    
    // Trash View
    if (filter === 'trash') {
      return file.isTrash && (searchTerm ? matchesSearch : true);
    }

    // Hide trashed files from all other views
    if (file.isTrash) return false;

    if (searchTerm) return matchesSearch;

    // Favorites are global (ignore folder structure)
    if (filter === 'favorite') return file.isFavorite;

    // If not searching, filter by current folder
    if (currentFolder) {
      if (file.parentId !== currentFolder) return false;
    } else if (file.parentId) {
      return false; // Hide files in subfolders when at root
    }
    
    if (filter === 'all') return true;
    if (filter === 'image') return file.type.startsWith('image/');
    if (filter === 'video') return file.type.startsWith('video/');
    if (filter === 'doc') return file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text');
    return !file.type.startsWith('image/') && !file.type.startsWith('video/');
  }).sort((a, b) => {
    if (sortOption === 'date-desc') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortOption === 'date-asc') return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortOption === 'size-desc') return b.size - a.size;
    if (sortOption === 'size-asc') return a.size - b.size;
    return 0;
  }).sort((a, b) => {
    // Always show folders first
    return (b.isFolder === true) - (a.isFolder === true);
  });

  const areAllVisibleSelected = filteredFiles.length > 0 && filteredFiles.every(f => selectedFiles.has(f._id));

  const toggleSelectAll = () => {
    const newSelected = new Set(selectedFiles);
    if (areAllVisibleSelected) {
      filteredFiles.forEach(f => newSelected.delete(f._id));
    } else {
      filteredFiles.forEach(f => newSelected.add(f._id));
    }
    setSelectedFiles(newSelected);
  };

  const toggleSelectFile = (id) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedFiles(newSelected);
  };

  const deleteSelectedFiles = async () => {
    if (!confirm(`Delete ${selectedFiles.size} files?`)) return;
    try {
      await Promise.all(Array.from(selectedFiles).map(id => axios.delete(`${API_URL}/file/${id}`, { headers: { Authorization: `Bearer ${token}` } })));
      
      if (filter === 'trash') {
        setFiles(files.filter(f => !selectedFiles.has(f._id)));
      } else {
        setFiles(files.map(f => selectedFiles.has(f._id) ? { ...f, isTrash: true } : f));
      }
      setSelectedFiles(new Set());
    } catch (err) { alert("Failed to delete some files"); }
  };

  const handlePreview = async (file) => {
    if (!file.type.startsWith('image/')) return;
    
    try {
      const res = await axios.get(`${API_URL}/file/${file._id}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      setPreviewUrl(url);
      setPreviewFile(file);
    } catch (err) {
      alert("Failed to load preview");
    }
  };

  const closePreview = () => {
    if (previewUrl) window.URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewFile(null);
  };

  const createFolder = async () => {
    const name = prompt("Enter folder name:");
    if (!name) return;
    try {
      await axios.post(`${API_URL}/folder`, { name, parentId: currentFolder }, { headers: { Authorization: `Bearer ${token}` } });
      fetchFiles();
    } catch (err) { alert("Failed to create folder"); }
  };

  const moveFile = async (fileId, folderId) => {
    try {
      await axios.put(`${API_URL}/move`, { fileId, folderId }, { headers: { Authorization: `Bearer ${token}` } });
      fetchFiles();
    } catch (err) { alert("Failed to move file"); }
  };

  const renameFile = async (id, currentName) => {
    const newName = prompt("Enter new name:", currentName);
    if (!newName || newName === currentName) return;
    
    try {
      await axios.put(`${API_URL}/rename`, { id, newName }, { headers: { Authorization: `Bearer ${token}` } });
      setFiles(files.map(f => f._id === id ? { ...f, originalName: newName } : f));
    } catch (err) {
      alert("Failed to rename");
    }
  };

  const toggleFavorite = async (fileId) => {
    try {
      const res = await axios.put(`${API_URL}/favorite/${fileId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setFiles(files.map(f => f._id === fileId ? { ...f, isFavorite: res.data.isFavorite } : f));
    } catch (err) {
      alert("Failed to update favorite");
    }
  };

  const shareFile = async (fileId) => {
    try {
      const res = await axios.put(`${API_URL}/share/${fileId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      const link = `http://localhost:5000/share/${res.data.shareToken}`;
      prompt("Public Link (Copy this):", link);
    } catch (err) {
      alert("Failed to generate link");
    }
  };

  const manageTags = async (file) => {
    const currentTags = file.tags || [];
    const input = prompt("Enter tags (comma separated):", currentTags.join(", "));
    if (input === null) return;
    
    const newTags = input.split(',').map(t => t.trim()).filter(t => t);
    
    try {
      const res = await axios.put(`${API_URL}/tags`, { id: file._id, tags: newTags }, { headers: { Authorization: `Bearer ${token}` } });
      setFiles(files.map(f => f._id === file._id ? { ...f, tags: res.data.tags } : f));
    } catch (err) {
      alert("Failed to update tags");
    }
  };

  const handleDrop = (e, targetFolderId) => {
    e.preventDefault();
    const fileId = e.dataTransfer.getData("fileId");
    if (fileId && fileId !== targetFolderId) {
      moveFile(fileId, targetFolderId);
    }
  };

  // Breadcrumb helper
  const getBreadcrumbs = () => {
    const path = [];
    let curr = currentFolder;
    while (curr) {
      const folder = files.find(f => f._id === curr);
      if (folder) path.unshift(folder);
      curr = folder?.parentId;
    }
    return path;
  };

  const handleContextMenu = (e, file) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.pageX, y: e.pageY, file });
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8 transition-colors duration-200">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Lock className="text-blue-600" /> My Private Cloud
          </h1>
          <div className="flex items-center gap-4">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition">
              {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-gray-600 dark:text-gray-400" />}
            </button>
            <button onClick={() => navigate('/health')} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition" title="System Health">
              <Activity size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            <button onClick={() => navigate('/profile')} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition" title="Profile">
              <User size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            <button onClick={logout} className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
              <LogOut size={18} /> Logout
            </button>
          </div>
        </header>

        {/* Storage Usage Bar */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6 transition-colors">
          <div className="flex justify-between mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <span>Storage Used</span>
            <span>{formatSize(totalUsed)} / {formatSize(MAX_STORAGE)}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full transition-all duration-500 ${usagePercentage > 90 ? 'bg-red-500' : 'bg-blue-600'}`} 
              style={{ width: `${usagePercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Breadcrumbs & Actions */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 overflow-x-auto">
            <button onClick={() => setCurrentFolder(null)} className={`hover:text-blue-600 dark:hover:text-blue-400 ${!currentFolder ? 'font-bold text-blue-600 dark:text-blue-400' : ''}`}>Home</button>
            {getBreadcrumbs().map(folder => (
              <React.Fragment key={folder._id}>
                <ChevronRight size={16} />
                <button onClick={() => setCurrentFolder(folder._id)} className={`hover:text-blue-600 dark:hover:text-blue-400 ${currentFolder === folder._id ? 'font-bold text-blue-600 dark:text-blue-400' : ''}`}>
                  {folder.originalName}
                </button>
              </React.Fragment>
            ))}
          </div>
          <button onClick={createFolder} className="flex items-center gap-2 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 px-4 py-2 rounded hover:bg-blue-200 dark:hover:bg-blue-800">
            <FolderPlus size={18} /> New Folder
          </button>
        </div>

        {/* Upload Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8 transition-colors">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-10 h-10 mb-3 text-gray-400" />
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> to current folder</p>
            </div>
            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
          {uploading && <p className="text-center mt-2 text-blue-600 animate-pulse">Uploading...</p>}
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search files by name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Recent Files Section */}
        {!currentFolder && !searchTerm && recentFiles.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-3">Recent Files</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {recentFiles.map(file => (
                <div key={'recent-' + file._id} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition cursor-pointer" onClick={() => file.type.startsWith('image/') ? handlePreview(file) : null} onContextMenu={(e) => handleContextMenu(e, file)}>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-full ${file.type.startsWith('image/') ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                      {file.type.startsWith('image/') ? <Image size={20} /> : <FileText size={20} />}
                    </div>
                  </div>
                  <p className="font-medium text-gray-800 dark:text-gray-200 text-sm truncate" title={file.originalName}>{file.originalName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(file.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter & Sort */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex gap-4 overflow-x-auto pb-2 w-full md:w-auto">
            {[
              { id: 'all', label: 'All Files', icon: <FileText size={18} /> },
              { id: 'favorite', label: 'Favorites', icon: <Star size={18} /> },
              { id: 'trash', label: 'Trash', icon: <Trash2 size={18} /> },
              { id: 'image', label: 'Images', icon: <Image size={18} /> },
              { id: 'video', label: 'Media', icon: <Film size={18} /> },
              { id: 'doc', label: 'Documents', icon: <File size={18} /> },
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition whitespace-nowrap ${filter === tab.id ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <select 
              value={sortOption} 
              onChange={(e) => setSortOption(e.target.value)}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-blue-500 flex-1 md:flex-none"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="size-desc">Largest First</option>
              <option value="size-asc">Smallest First</option>
            </select>

            <div className="flex bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 p-1">
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-gray-200 dark:bg-gray-700 text-blue-600' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`} title="Grid View"><Grid size={20} /></button>
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-gray-200 dark:bg-gray-700 text-blue-600' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`} title="List View"><List size={20} /></button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {filteredFiles.length > 0 && (
          <div className="flex justify-between items-center mb-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm transition-colors">
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={areAllVisibleSelected} onChange={toggleSelectAll} className="w-5 h-5 cursor-pointer" />
              <span className="text-gray-700 dark:text-gray-300 font-medium">Select All</span>
            </div>
            {selectedFiles.size > 0 && (
              <button onClick={deleteSelectedFiles} className="flex items-center gap-2 text-red-600 hover:text-red-800 font-medium bg-red-50 dark:bg-red-900/30 px-3 py-1 rounded transition"><Trash2 size={18} /> Delete ({selectedFiles.size})</button>
            )}
          </div>
        )}

        {/* File List */}
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-3"}>
          {currentFolder && (
            <div 
              onClick={() => {
                const parent = files.find(f => f._id === currentFolder)?.parentId;
                setCurrentFolder(parent || null);
              }}
              className="bg-gray-200 dark:bg-gray-700 p-4 rounded-lg shadow hover:bg-gray-300 dark:hover:bg-gray-600 transition flex items-center gap-3 cursor-pointer border-2 border-transparent border-dashed"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, files.find(f => f._id === currentFolder)?.parentId || null)}
            >
              <ArrowLeft size={24} className="text-gray-600 dark:text-gray-300" />
              <span className="font-medium text-gray-700 dark:text-gray-300">.. (Back)</span>
            </div>
          )}
          {filteredFiles.map(file => (
            <div 
              key={file._id} 
              draggable 
              onContextMenu={(e) => handleContextMenu(e, file)}
              onDragStart={(e) => e.dataTransfer.setData("fileId", file._id)}
              onDragOver={(e) => file.isFolder ? e.preventDefault() : null}
              onDrop={(e) => file.isFolder ? handleDrop(e, file._id) : null}
              className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-lg transition flex justify-between items-center ${selectedFiles.has(file._id) ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''} ${file.isFolder ? 'border-l-4 border-blue-500' : ''}`}
            >
              <div className="flex items-center gap-3 flex-1 mr-4 overflow-hidden">
                <input type="checkbox" checked={selectedFiles.has(file._id)} onChange={() => toggleSelectFile(file._id)} className="w-5 h-5 flex-shrink-0 cursor-pointer" />
                <div className="truncate cursor-pointer" onClick={() => !file.isTrash && file.isFolder && setCurrentFolder(file._id)}>
                  <div className="flex items-center gap-2">
                    {file.isFolder ? <Folder className="text-blue-500 fill-blue-100 dark:fill-blue-900" /> : <FileText className="text-gray-400 dark:text-gray-500" />}
                    <p className="font-medium text-gray-800 dark:text-gray-200 truncate" title={file.originalName}>{file.originalName}</p>
                  </div>
                  {!file.isFolder && <p className="text-xs text-gray-500 dark:text-gray-400">{(file.size / 1024).toFixed(2)} KB • {new Date(file.createdAt).toLocaleDateString()}</p>}
                  {file.tags && file.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {file.tags.map(tag => <span key={tag} className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded-full">#{tag}</span>)}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {!file.isTrash && (
                  <button onClick={(e) => { e.stopPropagation(); toggleFavorite(file._id); }} className={`p-2 rounded-full ${file.isFavorite ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : 'text-gray-400 hover:text-yellow-500'}`}>
                    <Star size={18} fill={file.isFavorite ? "currentColor" : "none"} />
                  </button>
                )}
                {!file.isTrash && file.type.startsWith('image/') && (
                  <button onClick={() => handlePreview(file)} className="text-green-500 hover:text-green-700 p-2 bg-green-50 rounded-full" title="Preview">
                    <Eye size={18} />
                  </button>
                )}
                {file.isTrash ? (
                  <button onClick={() => restoreFile(file._id)} className="text-green-600 hover:text-green-800 p-2 bg-green-50 dark:bg-green-900/30 rounded-full" title="Restore"><RotateCcw size={18} /></button>
                ) : (
                  <button onClick={() => downloadFile(file._id, file.originalName)} className="text-blue-500 hover:text-blue-700 p-2 bg-blue-50 rounded-full"><Download size={18} /></button>
                )}
                <button onClick={() => deleteFile(file._id)} className="text-red-500 hover:text-red-700 p-2 bg-red-50 rounded-full"><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
          {filteredFiles.length === 0 && <p className="text-gray-500 col-span-full text-center py-10">No files found in this category.</p>}
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={closePreview}>
          <div className="relative max-w-full max-h-full" onClick={e => e.stopPropagation()}>
            <button onClick={closePreview} className="absolute -top-10 right-0 text-white hover:text-gray-300">
              <X size={32} />
            </button>
            <img src={previewUrl} alt="Preview" className="max-w-full max-h-[85vh] rounded shadow-2xl object-contain" />
            <p className="text-center text-white mt-2 font-medium">{previewFile?.originalName}</p>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu.visible && contextMenu.file && (
        <div 
          className="absolute bg-white dark:bg-gray-800 shadow-xl rounded-lg border border-gray-200 dark:border-gray-700 z-50 py-1 w-48"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          {!contextMenu.file.isTrash && (
            <>
              <button 
                onClick={() => {
                  if (contextMenu.file.isFolder) setCurrentFolder(contextMenu.file._id);
                  else if (contextMenu.file.type.startsWith('image/')) handlePreview(contextMenu.file);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-200"
              >
                {contextMenu.file.isFolder ? <Folder size={16} /> : <Eye size={16} />}
                {contextMenu.file.isFolder ? 'Open' : 'Preview'}
              </button>
              <button onClick={() => toggleFavorite(contextMenu.file._id)} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-200">
                <Star size={16} fill={contextMenu.file.isFavorite ? "currentColor" : "none"} className={contextMenu.file.isFavorite ? "text-yellow-500" : ""} /> {contextMenu.file.isFavorite ? 'Unstar' : 'Star'}
              </button>
              <button onClick={() => downloadFile(contextMenu.file._id, contextMenu.file.originalName)} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-200">
                <Download size={16} /> Download
              </button>
              <button onClick={() => shareFile(contextMenu.file._id)} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-200">
                <Share2 size={16} /> Share
              </button>
              <button onClick={() => manageTags(contextMenu.file)} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-200">
                <Tag size={16} /> Tags
              </button>
              <button onClick={() => renameFile(contextMenu.file._id, contextMenu.file.originalName)} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-200">
                <Edit size={16} /> Rename
              </button>
            </>
          )}

          {contextMenu.file.isTrash && (
            <button onClick={() => restoreFile(contextMenu.file._id)} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-green-600">
              <RotateCcw size={16} /> Restore
            </button>
          )}

          <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>

          <button 
            onClick={() => deleteFile(contextMenu.file._id)}
            className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 flex items-center gap-2"
          >
            <Trash2 size={16} /> {contextMenu.file.isTrash ? 'Delete Permanently' : 'Delete'}
          </button>
        </div>
      )}
    </div>
  );
};

// --- Main App & Routing ---

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!token ? <Login setToken={setToken} /> : <Navigate to="/" />} />
        <Route path="/" element={token ? <Dashboard token={token} setToken={setToken} /> : <Navigate to="/login" />} />
        <Route path="/profile" element={token ? <Profile token={token} /> : <Navigate to="/login" />} />
        <Route path="/health" element={token ? <SystemHealth token={token} /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;