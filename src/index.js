const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const Message = require("./models/Message"); // Import your message model
const app = express();

const userRoutes = require("./routes/User");
const productRoutes = require("./routes/Product");

const database = require("./config/database");
const cookieParser = require("cookie-parser");
const { cloudinaryConnect } = require("./config/cloudinary");
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const PORT = process.env.PORT || 4000;

// Database connect
database.connect();

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp",
  })
);
app.use(cors());

// Cloudinary connection
cloudinaryConnect();

// Routes
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/Product", productRoutes);

app.get("/", (req, res) => {
  return res.json({
    success: true,
    message: "Your server is up and running....",
  });
});

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Allow all origins; restrict this in production
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});

// Socket.IO connection
io.on("connection", (socket) => {
    console.log("New client connected");

    // Join a room
    socket.on("join room", (room) => {
        socket.join(room);
        console.log(`User joined room: ${room}`);

        // Notify the room when a user joins
        socket.to(room).emit("chat message", { message: `A new user has joined the room: ${room}`, room });
    });

    // Listen for chat messages
    socket.on("chat message", async (data) => {
        // Save the message to the database
        const message = new Message({
            senderId: data.senderId, // ID of the buyer or seller
            receiverId: data.receiverId, // ID of the seller or buyer
            room: data.room,
            message: data.message,
        });

        await message.save();

        // Emit the message to the room
        io.to(data.room).emit("chat message", data);

        // Respond back to the client with an acknowledgment
        socket.emit("message response", { message: `Server received your message: ${data.message}`, room: data.room });
    });

    // Retrieve messages for a specific seller
    socket.on("get messages", async (data) => {
        const messages = await Message.find({ 
            room: data.room, 
            $or: [
                { senderId: data.senderId, receiverId: data.receiverId },
                { senderId: data.receiverId, receiverId: data.senderId }
            ]
        }).sort({ timestamp: 1 }); // Sort messages by timestamp

        socket.emit("previous messages", messages);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
});

// Start the server
server.listen(PORT, () => {
  console.log(`App is running at http://localhost:${PORT}`);
});