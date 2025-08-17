const express = require('express');
const multer = require("multer");
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

const app = express();
const upload = multer({ dest: "uploads/" });
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // For parsing application/json request bodies
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the 'public' directory


// MongoDB Connection
// IMPORTANT: Replace 'mongodb://localhost:27017/pauls_cleaning_crews' with your actual MongoDB connection string if it's hosted elsewhere or requires authentication.
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Mongoose Schemas
const appointmentSchema = new mongoose.Schema({
  clientName: { type: String, required: true },
  contactNumber: { type: String, required: true },
  location: { type: String }, // ✅ Added location field to the schema
  service: { type: String, required: true },
  date: { type: String, required: true }, // Storing as string for simplicity with HTML date input
  time: { type: String, required: true }, // Storing as string for simplicity with HTML time input
  notes: { type: String }
}, { timestamps: true }); // Adds createdAt and updatedAt timestamps

const complaintReportSchema = new mongoose.Schema({
  senderName: { type: String, required: true },
  senderEmail: { type: String },
  senderPhone: { type: String },
  message: { type: String, required: true },
  type: { type: String, enum: ['complaint', 'report'], required: true } // 'complaint' or 'report'
}, { timestamps: true });

// --- Job Application Schema ---
const JobApplicationSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    position: String,
    message: String,
    date: { type: Date, default: Date.now }
});

// --- NEW Media Schema ---
const mediaSchema = new mongoose.Schema({
  name: String,
  type: String,   // image/jpeg, video/mp4, etc
  path: String,   // relative URL for static serving
  uploadedAt: { type: Date, default: Date.now }
});

// Mongoose Models
const Appointment = mongoose.model('Appointment', appointmentSchema);
const ComplaintReport = mongoose.model('ComplaintReport', complaintReportSchema);
const JobApplication = mongoose.model('JobApplication', JobApplicationSchema); 
const Media = mongoose.model('Media', mediaSchema); // Define the model here


// Admin Credentials (FOR DEMONSTRATION PURPOSES ONLY - In a real app, use hashed passwords and JWTs/sessions)
const ADMIN_USERNAME = 'AdminPauls';
const ADMIN_PASSWORD = 'Adminpaul7685';

// Serve uploaded files publicly
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// File Upload Route
app.post("/upload", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        // Save metadata in DB
        const newMedia = new Media({
            name: req.file.originalname,
            type: req.file.mimetype,
            path: `/uploads/${req.file.filename}`
        });
        await newMedia.save();

        res.json({ message: "File uploaded successfully!", media: newMedia });
    } catch (err) {
        console.error("❌ Upload error:", err);
        res.status(500).json({ message: "Upload failed" });
    }
});

// Get all media (public)
app.get("/api/media", async (req, res) => {
    try {
        const media = await Media.find().sort({ uploadedAt: -1 });
        res.json(media);
    } catch (err) {
        console.error("❌ Error fetching media:", err);
        res.status(500).json({ message: "Error fetching media" });
    }
});



// Middleware to simulate admin authentication (for this demo, it just passes through)
// In a real application, this would verify a session token or JWT.
const isAdminAuthenticated = (req, res, next) => {
    // For this demo, we rely on the client-side admin.js to only send requests
    // if the user has successfully "logged in". A real app needs server-side session/token validation.
    next();
};

// API Routes

// File Upload Route
app.post("/upload", upload.single("file"), (req, res) => {
    // You can save file info to MongoDB here
    console.log(req.file);
    res.json({ message: "File uploaded successfully!" });
});

// Get all reports (public, optional)
app.get('/api/reports', async (req, res) => {
  try {
    const reports = await ComplaintReport.find({ type: 'report' }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Admin Login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    res.json({ success: true, message: 'Login successful' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// --- PUBLIC API ROUTES ---

// Create Appointment (Public)
app.post("/api/appointments", async (req, res) => {
    try {
        const newAppointment = new Appointment({
            clientName: req.body.clientName,
            contactNumber: req.body.contactNumber,
            location: req.body.location, // Now correctly mapped to schema
            service: req.body.service,
            date: req.body.date,
            time: req.body.time,
            notes: req.body.notes
        });

        await newAppointment.save();
        res.status(201).json({ message: "Appointment created successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error saving appointment." });
    }
});

// Get All Appointments (Public - sorted by date and time)
app.get('/api/appointments', async (req, res) => {
  try {
    // Fetch all appointments, sorted by date and time for a logical display order
    const appointments = await Appointment.find().sort({ date: 1, time: 1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments.', error: error.message });
  }
});

// Delete Appointment (Public)
// ✅ Added this delete route as requested
app.delete('/api/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid appointment ID' });
    }

    const deletedAppointment = await Appointment.findByIdAndDelete(id);
    if (!deletedAppointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ message: 'Error deleting appointment', error: error.message });
  }
});

// Submit Complaint/Report (Public)
app.post('/api/complaints', async (req, res) => {
  try {
    const newComplaintReport = new ComplaintReport(req.body);
    await newComplaintReport.save();
    res.status(201).json(newComplaintReport);
  } catch (error) {
    res.status(400).json({ message: 'Error submitting complaint/report', error: error.message });
  }
});

// Submit Job Application (Public)
app.post('/api/job-applications', async (req, res) => {
  console.log('📩 Incoming job application data:', req.body);

    try {
        const { name, email, phone, position, message } = req.body;
        const application = new JobApplication({ name, email, phone, position, message });
        await application.save();
        res.json({ success: true, message: 'Application submitted successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error submitting application.' });
    }
});


// --- ADMIN API ROUTES (Require isAdminAuthenticated middleware) ---

// Create Appointment (Admin)
app.post('/api/admin/appointments', isAdminAuthenticated, async (req, res) => {
  try {
    // Admin can potentially send more complete data, so directly use req.body
    const newAppointment = new Appointment(req.body);
    await newAppointment.save();
    res.status(201).json(newAppointment);
  } catch (error) {
    res.status(400).json({ message: 'Error creating appointment', error: error.message });
  }
});

// Get All Appointments (Admin - sorted by date and time)
app.get('/api/admin/appointments', isAdminAuthenticated, async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({ date: 1, time: 1 }); // Sort by date and time
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments', error: error.message });
  }
});

// Delete Appointment (Admin only)
app.delete('/api/admin/appointments/:id', isAdminAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Appointment.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting appointment', error: error.message });
  }
});

// Get All Complaints/Reports (Admin only)
app.get('/api/admin/complaints', isAdminAuthenticated, async (req, res) => {
  try {
    const complaints = await ComplaintReport.find().sort({ createdAt: -1 }); // Sort by newest first
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching complaints/reports', error: error.message });
  }
});

// Delete Complaint/Report (Admin only)
app.delete('/api/admin/complaints/:id', isAdminAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await ComplaintReport.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ message: 'Report/Complaint not found' });
    }
    res.json({ message: 'Report/Complaint deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting report/complaint', error: error.message });
  }
});

// Get All Job Applications (Admin only)
app.get('/api/admin/job-applications', isAdminAuthenticated, async (req, res) => {
    try {
        const applications = await JobApplication.find().sort({ date: -1 });
        res.json(applications);
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching applications.' });
    }
});

// Delete Job Application (Admin only)
app.delete('/api/admin/job-applications/:id', isAdminAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await JobApplication.findByIdAndDelete(id);
        if (!result) {
            return res.status(404).json({ message: 'Job application not found' });
        }
        res.json({ message: 'Job application deleted successfully' });
    } catch (error) {
        console.error('Error deleting job application:', error);
        res.status(500).json({ message: 'Error deleting job application', error: error.message });
    }
});


// Serve admin.html for the /admin route
app.get('/*admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});