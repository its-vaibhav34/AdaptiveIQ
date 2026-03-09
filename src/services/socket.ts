import { io } from "socket.io-client";

const BACKEND_URL = "http://localhost:5001";

const socket = io(BACKEND_URL, {
    path: "/socket.io",
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    transports: ["websocket", "polling"],
    autoConnect: true,
});

socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);
});

socket.on("disconnect", () => {
    console.log("❌ Socket disconnected");
});

socket.on("connect_error", (error) => {
    console.error("❌ Socket connection error:", error);
});

export default socket;
