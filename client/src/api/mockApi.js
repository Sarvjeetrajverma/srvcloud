// Mock API for GitHub Pages - stores data in localStorage
// This allows the app to work as a static demo

const STORAGE_KEYS = {
  USER: 'mock_user',
  FILES: 'mock_files',
  TOKEN: 'mock_token'
};

// Initialize default data
const initializeData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USER)) {
    // Default admin credentials (username: sarvjeetrajverma, password: #Sarvjeett2)
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({
      username: 'sarvjeetrajverma',
      password: '#Sarvjeett2'
    }));
  }
  if (!localStorage.getItem(STORAGE_KEYS.FILES)) {
    localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify([]));
  }
};

// Generate a simple mock token
const generateToken = (username) => {
  return btoa(JSON.stringify({ username, timestamp: Date.now() }));
};

// Validate token
const validateToken = (token) => {
  try {
    const decoded = JSON.parse(atob(token));
    return decoded;
  } catch {
    return null;
  }
};

// Mock API functions
export const mockApi = {
  // Login
  login: async (username, password) => {
    initializeData();
    const storedUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER));
    
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    
    if (username === storedUser.username && password === storedUser.password) {
      const token = generateToken(username);
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      return { token };
    }
    throw new Error('Invalid Credentials');
  },

  // Logout
  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  },

  // Verify token
  verifyToken: (token) => {
    const user = validateToken(token);
    if (!user) {
      throw new Error('Invalid Token');
    }
    return user;
  },

  // Get all files
  getFiles: async (token) => {
    mockApi.verifyToken(token);
    await new Promise(resolve => setTimeout(resolve, 300));
    const files = JSON.parse(localStorage.getItem(STORAGE_KEYS.FILES) || '[]');
    return files;
  },

  // Upload file (simulated - stores file info in localStorage)
  uploadFile: async (token, file, parentId = null) => {
    mockApi.verifyToken(token);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const files = JSON.parse(localStorage.getItem(STORAGE_KEYS.FILES) || '[]');
    
    const newFile = {
      _id: 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      filename: file.name,
      originalName: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size || 0,
      isFolder: false,
      isFavorite: false,
      isTrash: false,
      parentId: parentId,
      tags: [],
      createdAt: new Date().toISOString(),
      // For images, we can store as base64 (limited size)
      data: file.type.startsWith('image/') ? await fileToBase64(file) : null
    };
    
    files.push(newFile);
    localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files));
    return newFile;
  },

  // Create folder
  createFolder: async (token, name, parentId = null) => {
    mockApi.verifyToken(token);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const files = JSON.parse(localStorage.getItem(STORAGE_KEYS.FILES) || '[]');
    
    const newFolder = {
      _id: 'folder_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      filename: name,
      originalName: name,
      type: 'folder',
      size: 0,
      isFolder: true,
      isFavorite: false,
      isTrash: false,
      parentId: parentId,
      tags: [],
      createdAt: new Date().toISOString()
    };
    
    files.push(newFolder);
    localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files));
    return newFolder;
  },

  // Delete file
  deleteFile: async (token, fileId) => {
    mockApi.verifyToken(token);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let files = JSON.parse(localStorage.getItem(STORAGE_KEYS.FILES) || '[]');
    const fileIndex = files.findIndex(f => f._id === fileId);
    
    if (fileIndex === -1) throw new Error('File not found');
    
    const file = files[fileIndex];
    
    if (file.isTrash) {
      // Permanent delete
      if (file.isFolder) {
        // Delete all children recursively
        const deleteRecursive = (parentId) => {
          files = files.filter(f => {
            if (f.parentId === parentId) {
              if (f.isFolder) deleteRecursive(f._id);
              return false;
            }
            return true;
          });
        };
        deleteRecursive(fileId);
      }
      files = files.filter(f => f._id !== fileId);
    } else {
      // Soft delete (move to trash)
      files[fileIndex].isTrash = true;
    }
    
    localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files));
    return { message: file.isTrash ? 'File deleted' : 'Moved to trash' };
  },

  // Restore file
  restoreFile: async (token, fileId) => {
    mockApi.verifyToken(token);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const files = JSON.parse(localStorage.getItem(STORAGE_KEYS.FILES) || '[]');
    const fileIndex = files.findIndex(f => f._id === fileId);
    
    if (fileIndex === -1) throw new Error('File not found');
    
    files[fileIndex].isTrash = false;
    localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files));
    return files[fileIndex];
  },

  // Toggle favorite
  toggleFavorite: async (token, fileId) => {
    mockApi.verifyToken(token);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const files = JSON.parse(localStorage.getItem(STORAGE_KEYS.FILES) || '[]');
    const fileIndex = files.findIndex(f => f._id === fileId);
    
    if (fileIndex === -1) throw new Error('File not found');
    
    files[fileIndex].isFavorite = !files[fileIndex].isFavorite;
    localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files));
    return files[fileIndex];
  },

  // Update tags
  updateTags: async (token, fileId, tags) => {
    mockApi.verifyToken(token);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const files = JSON.parse(localStorage.getItem(STORAGE_KEYS.FILES) || '[]');
    const fileIndex = files.findIndex(f => f._id === fileId);
    
    if (fileIndex === -1) throw new Error('File not found');
    
    files[fileIndex].tags = tags;
    localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files));
    return files[fileIndex];
  },

  // Rename file
  renameFile: async (token, fileId, newName) => {
    mockApi.verifyToken(token);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const files = JSON.parse(localStorage.getItem(STORAGE_KEYS.FILES) || '[]');
    const fileIndex = files.findIndex(f => f._id === fileId);
    
    if (fileIndex === -1) throw new Error('File not found');
    
    files[fileIndex].originalName = newName;
    files[fileIndex].filename = newName;
    localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files));
    return { message: 'Renamed' };
  },

  // Move file
  moveFile: async (token, fileId, folderId) => {
    mockApi.verifyToken(token);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const files = JSON.parse(localStorage.getItem(STORAGE_KEYS.FILES) || '[]');
    const fileIndex = files.findIndex(f => f._id === fileId);
    
    if (fileIndex === -1) throw new Error('File not found');
    if (fileId === folderId) throw new Error('Cannot move folder into itself');
    
    files[fileIndex].parentId = folderId;
    localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files));
    return { message: 'Moved' };
  },

  // Generate share link (simulated)
  generateShareLink: async (token, fileId) => {
    mockApi.verifyToken(token);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const files = JSON.parse(localStorage.getItem(STORAGE_KEYS.FILES) || '[]');
    const file = files.find(f => f._id === fileId);
    
    if (!file) throw new Error('File not found');
    
    const shareToken = 'share_' + Math.random().toString(36).substr(2, 16);
    return { shareToken };
  },

  // Update profile
  updateProfile: async (token, newUsername, newPassword, currentPassword) => {
    mockApi.verifyToken(token);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const storedUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER));
    
    if (currentPassword !== storedUser.password) {
      throw new Error('Incorrect current password');
    }
    
    if (newUsername) storedUser.username = newUsername;
    if (newPassword) storedUser.password = newPassword;
    
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(storedUser));
    return { message: 'Profile updated successfully' };
  },

  // Health check
  healthCheck: async (token) => {
    mockApi.verifyToken(token);
    return {
      status: 'Online',
      uptime: 0,
      timestamp: new Date().toISOString(),
      dbStatus: 'Connected (Mock)',
      memoryUsage: { rss: 1024 * 1024 * 50 }
    };
  },

  // Get file for download/preview
  getFile: async (token, fileId) => {
    mockApi.verifyToken(token);
    const files = JSON.parse(localStorage.getItem(STORAGE_KEYS.FILES) || '[]');
    const file = files.find(f => f._id === fileId);
    
    if (!file) throw new Error('File not found');
    
    return file;
  },

  // Check if running on GitHub Pages (mock mode)
  isMockMode: () => {
    return true; // Always use mock mode for GitHub Pages
  }
};

// Helper function to convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

// Initialize data on module load
initializeData();

export default mockApi;
