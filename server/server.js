require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http"); // Import http
const socketIo = require("socket.io"); // Import socket.io
const connectDB = require("./util/db");
const authRoutes = require("./routes/auth-route");
const contactRoute = require("./routes/contact-route");
const sensorRoutes = require("./routes/sensorRoutes");
const saveSensorRoute = require("./routes/sensordata-route");
const errorMiddleware = require("./middleware/error-middleware");
const twilio=require("twilio")

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000; // Allow for dynamic port assignment

// Connect to MongoDB
connectDB();

// CORS configuration
const corsOptions = {
  origin: "http://localhost:5173", 
  methods: "GET, POST, PUT, DELETE, PATCH, HEAD", 
  credentials: true, 
};

// Use CORS middleware
app.use(cors(corsOptions));
app.use(express.json());


// Create an HTTP server and integrate Socket.IO
const server = http.createServer(app);
const io = socketIo(server); // Create a Socket.IO server

// Define your routes
const accountSid="your ssid of twilio"
const authToken ="your auth twilio";
const client = twilio(accountSid, authToken);

// Add this endpoint to your Express server
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

// SMS endpoint with better error handling
app.post('/api/send-sms', (req, res) => {
  const { message, to } = req.body;

  client.messages
    .create({
      body: message,
      from: '+12029531659', // Your Twilio number
      to: to, // Recipient's phone number
    })
    .then(message => {
      res.status(200).json({ success: true, sid: message.sid });
    })
    .catch(err => {
      res.status(500).json({ success: false, error: err.message });
    });
});

app.use("/api/auth", authRoutes); // Auth routes
app.use("/api/form", contactRoute); // Contact routes
app.use("/api/data", sensorRoutes);
app.use("/api/data", saveSensorRoute);

// Make the Socket.IO instance available in the request object
app.use((req, res, next) => {
  req.io = io; // Attach the Socket.IO instance to the request
  next();
});

// Error handling middleware
//app.use(errorMiddleware); // Handle errors

// Start the server with Socket.IO
server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
