// server/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = 5000;
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key_12345";

// Middleware
app.use(cors());
app.use(express.json());

module.exports = app;
// Debug Logging: See who is connecting
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url} from IP: ${req.ip}`);
  next();
});

// 1. Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/myfiles')
  .then(async () => {
    console.log('MongoDB Connected');
    // Auto-create the specific secure admin
    const username = "sarvjeetrajverma";
    const user = await User.findOne({ username });
    if (!user) {
      const hashedPassword = await bcrypt.hash("#Sarvjeett2", 10);
      await User.create({ username, password: hashedPassword });
      console.log(`Secure Admin '${username}' created.`);
    }
  })
  .catch(err => console.error(err));

// 2. Schemas
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Number }
});
const User = mongoose.model('User', UserSchema);

const FileSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  path: String,
  type: String,
  size: Number,
  isFolder: { type: Boolean, default: false },
  isFavorite: { type: Boolean, default: false },
  isTrash: { type: Boolean, default: false },
  shareToken: { type: String, default: null },
  tags: { type: [String], default: [] },
  parentId: { type: mongoose.Schema.Types.ObjectId, default: null },
  createdAt: { type: Date, default: Date.now }
});
const FileModel = mongoose.model('File', FileSchema);

// 3. Security Middleware (The Guard)
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(403).send("A token is required");
  try {
    const token = authHeader.split(" ")[1];
    if (!token) throw new Error("Token missing");
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    return res.status(401).send("Invalid Token");
  }
  return next();
};

// 4. File Storage Engine (Cloudinary)
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'my-private-cloud',
    resource_type: 'auto', // Allow images, videos, and raw files
    public_id: (req, file) => Date.now() + '-' + file.originalname.replace(/\.[^/.]+$/, ""),
  },
});
const upload = multer({ storage });

// --- ROUTES ---

// Rate Limiter: Max 100 requests per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many login attempts from this IP, please try again after 15 minutes"
});

// IP Whitelist Middleware
// Add the IP addresses you want to allow here.
// For local testing: '::1', '127.0.0.1'
// For mobile on WiFi: check your phone's IP (e.g., '192.168.1.5')
const ALLOWED_IPS = ['::1', '127.0.0.1']; 

const checkIpWhitelist = (req, res, next) => {
  let clientIp = req.ip || req.connection.remoteAddress;
  if (clientIp && clientIp.startsWith('::ffff:')) clientIp = clientIp.substr(7); // Handle IPv6 mapped IPv4

  if (ALLOWED_IPS.includes(clientIp)) {
    next();
  } else {
    res.status(403).send("Access denied: IP not whitelisted.");
  }
};

// Auth: Login
// Temporarily removed checkIpWhitelist to fix access issues
app.post('/api/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  
  if (!user) return res.status(400).send("Invalid Credentials");

  // Check Lockout
  if (user.lockUntil && user.lockUntil > Date.now()) {
    return res.status(403).send("Account is temporarily locked. Try again later.");
  }

  if (user && (await bcrypt.compare(password, user.password))) {
    // Reset attempts on success
    await User.findByIdAndUpdate(user._id, { loginAttempts: 0, lockUntil: null });
    const token = jwt.sign({ user_id: user._id, username }, JWT_SECRET, { expiresIn: "2h" });
    return res.json({ token });
  }

  // Increment attempts on failure
  const attempts = (user.loginAttempts || 0) + 1;
  let lockUntil = null;
  if (attempts >= 5) lockUntil = Date.now() + 30 * 60 * 1000; // Lock for 30 mins
  
  await User.findByIdAndUpdate(user._id, { loginAttempts: attempts, lockUntil });
  res.status(400).send(lockUntil ? "Account locked due to too many failed attempts." : "Invalid Credentials");
});

// Upload File (Protected)
app.post('/api/upload', verifyToken, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded');
  
  const newFile = await FileModel.create({
    filename: req.file.filename,
    originalName: req.file.originalname,
    path: req.file.path,
    type: req.file.mimetype,
    size: req.file.size,
    parentId: req.body.parentId && req.body.parentId !== 'null' ? req.body.parentId : null
  });
  res.json(newFile);
});

// Get All Files (Protected)
app.get('/api/files', verifyToken, async (req, res) => {
  const files = await FileModel.find().sort({ createdAt: -1 });
  res.json(files);
});

// Secure Download/View (Protected)
// This ensures only logged-in users can see the actual content
app.get('/api/file/:id', verifyToken, async (req, res) => {
  const file = await FileModel.findById(req.params.id);
  if (!file) return res.status(404).send("File not found");
  
  // Redirect to the Cloudinary URL
  res.redirect(file.path);
});

// Create Folder
app.post('/api/folder', verifyToken, async (req, res) => {
  const { name, parentId } = req.body;
  const folder = await FileModel.create({
    originalName: name,
    isFolder: true,
    parentId: parentId || null,
    size: 0,
    type: 'folder'
  });
  res.json(folder);
});

// Move File/Folder
app.put('/api/move', verifyToken, async (req, res) => {
  const { fileId, folderId } = req.body;
  if (fileId === folderId) return res.status(400).send("Cannot move folder into itself");
  await FileModel.findByIdAndUpdate(fileId, { parentId: folderId });
  res.json({ message: "Moved" });
});

// Rename File/Folder
app.put('/api/rename', verifyToken, async (req, res) => {
  const { id, newName } = req.body;
  if (!newName) return res.status(400).send("New name is required");
  await FileModel.findByIdAndUpdate(id, { originalName: newName });
  res.json({ message: "Renamed" });
});

// Toggle Favorite
app.put('/api/favorite/:id', verifyToken, async (req, res) => {
  const file = await FileModel.findById(req.params.id);
  if (!file) return res.status(404).send("File not found");
  file.isFavorite = !file.isFavorite;
  await file.save();
  res.json(file);
});

// Update Tags
app.put('/api/tags', verifyToken, async (req, res) => {
  const { id, tags } = req.body;
  if (!Array.isArray(tags)) return res.status(400).send("Tags must be an array");
  const file = await FileModel.findByIdAndUpdate(id, { tags }, { new: true });
  res.json(file);
});

// Generate Share Link
app.put('/api/share/:id', verifyToken, async (req, res) => {
  const file = await FileModel.findById(req.params.id);
  if (!file) return res.status(404).send("File not found");
  
  if (!file.shareToken) {
    file.shareToken = crypto.randomBytes(16).toString('hex');
    await file.save();
  }
  res.json({ shareToken: file.shareToken });
});

// Access Shared File (Public)
app.get('/share/:token', async (req, res) => {
  const file = await FileModel.findOne({ shareToken: req.params.token });
  if (!file) return res.status(404).send("Link expired or invalid");
  
  // Redirect to the Cloudinary URL
  res.redirect(file.path);
});

// Restore File (From Trash)
app.put('/api/restore/:id', verifyToken, async (req, res) => {
  const file = await FileModel.findById(req.params.id);
  if (!file) return res.status(404).send("File not found");
  file.isTrash = false;
  await file.save();
  res.json(file);
});

// Delete File (Protected)
app.delete('/api/file/:id', verifyToken, async (req, res) => {
  try {
    const file = await FileModel.findById(req.params.id);
    if (!file) return res.status(404).send("File not found");

    // Soft Delete (Move to Trash)
    if (!file.isTrash) {
      file.isTrash = true;
      await file.save();
      return res.json({ message: "Moved to trash", isTrash: true });
    }

    // Hard Delete (Permanent)
    const deleteRecursive = async (id) => {
      const target = await FileModel.findById(id);
      if (target && target.isFolder) {
        const children = await FileModel.find({ parentId: id });
        for (const child of children) await deleteRecursive(child._id);
      } else {
        // Delete from Cloudinary using the public_id stored in filename
        if (target.filename) {
           await cloudinary.uploader.destroy(target.filename);
        }
      }
      await FileModel.findByIdAndDelete(id);
    };
    await deleteRecursive(req.params.id);
    res.json({ message: "File deleted" });
  } catch (err) { res.status(500).send(err.message); }
});

// Auth: Update Credentials (Username/Password)
app.put('/api/profile/update', verifyToken, async (req, res) => {
  const { newUsername, currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.user_id);

  if (!user) return res.status(404).send("User not found");

  // Verify current password
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) return res.status(400).send("Incorrect current password");

  // Update Username
  if (newUsername && newUsername.trim() !== "" && newUsername !== user.username) {
    const existing = await User.findOne({ username: newUsername });
    if (existing) return res.status(400).send("Username already taken");
    user.username = newUsername;
  }

  // Update Password
  if (newPassword && newPassword.trim() !== "") {
    user.password = await bcrypt.hash(newPassword, 10);
  }

  await user.save();
  res.json({ message: "Profile updated successfully" });
});

// System Health Check
app.get('/api/health', verifyToken, (req, res) => {
  res.json({
    status: 'Online',
    uptime: process.uptime(),
    timestamp: new Date(),
    dbStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    memoryUsage: process.memoryUsage()
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));