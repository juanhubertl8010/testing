const io = require("socket.io-client");
const readline = require("readline");
const crypto = require("crypto");

const socket = io("http://localhost:3000");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "> "
});

let username = "";

// Hash the message using SHA-256
function hashMessage(message) {
    return crypto.createHash("sha256").update(message).digest("hex");
}

socket.on("connect", () => {
    console.log("Connected to the server");

    rl.question("Enter your username: ", (input) => {
        username = input;
        console.log(`Welcome, ${username} to the chat`);
        rl.prompt();

        rl.on("line", (message) => {
            if (message.trim()) {
                const messageHash = hashMessage(message);
                socket.emit("message", { username, message, hash: messageHash });
            }
            rl.prompt();
        });
    });
});

socket.on("message", (data) => {
    const { username: senderUsername, message: senderMessage, hash: receivedHash } = data;

    // Verify the integrity of the message
    const expectedHash = hashMessage(senderMessage);
    if (receivedHash === expectedHash) {
        // Only display the message if the hash matches
        if (senderUsername !== username) {
            console.log(`${senderUsername}: ${senderMessage}`);
        }
    } else {
        console.log(`Warning: Message from ${senderUsername} may have been tampered.`);
    }
    rl.prompt();
});

socket.on("disconnect", () => {
    console.log("Server disconnected, Exiting...");
    rl.close();
    process.exit(0);
});

rl.on("SIGINT", () => {
    console.log("\nExiting...");
    socket.disconnect();
    rl.close();
    process.exit(0);
});
