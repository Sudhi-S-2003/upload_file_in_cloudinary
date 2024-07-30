// server.js
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer configuration
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads',
    format: async (req, file) => 'png', // supports promises as well
    public_id: (req, file) => file.filename,
  },
});

const upload = multer({ storage });

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const FileSchema = new mongoose.Schema({
  url: String,
  public_id: String,
});

const File = mongoose.model('File', FileSchema);

// Routes
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { path, filename } = req.file;
    const newFile = new File({ url: path, public_id: filename });
    await newFile.save();
    res.status(201).json(newFile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// fetch all images
app.get('/files', async (req, res) => {
  try {
    const files = await File.find({});
    res.status(200).json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete('/delete', async (req, res) => {
  try {
    const { public_id } = req.query;
    if (!public_id) {
      return res.status(400).json({ error: 'Public ID is required' });
    }
    console.log("Deleting file with public_id:", public_id);

    // Delete file from Cloudinary
    const result = await cloudinary.uploader.destroy(public_id);
    console.log("Cloudinary delete result:", result);

    if (result.result === 'ok') {
      // Delete file record from MongoDB
      await File.findOneAndDelete({ public_id });
      res.status(200).json({ message: 'File deleted successfully' });
    } else {
      res.status(404).json({ message: 'File not found on Cloudinary' });
    }
  } catch (err) {
    console.error("Error in delete route:", err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/update/:public_id', upload.single('file'), async (req, res) => {
  try {
    const { public_id } = req.params;
    if (!public_id) {
      return res.status(400).json({ error: 'Public ID is required' });
    }

    // Delete the old file from Cloudinary
    await cloudinary.uploader.destroy(public_id);

    // Upload the new file
    const result = await cloudinary.uploader.upload(req.file.path, {
      public_id: public_id, // Re-use the old public ID or assign a new one
      folder: 'uploads'
    });

    // Update the file record in MongoDB
    const updatedFile = await File.findOneAndUpdate(
      { public_id },
      { url: result.secure_url, public_id: result.public_id },
      { new: true }
    );

    if (updatedFile) {
      res.status(200).json(updatedFile);
    } else {
      res.status(404).json({ message: 'File not found' });
    }
  } catch (err) {
    console.error("Error in update route:", err);
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
