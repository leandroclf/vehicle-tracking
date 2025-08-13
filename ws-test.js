const WebSocket = require("ws");
const ws = new WebSocket("ws://localhost:3002/ws?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");

ws.on("open", function open() {
  console.log("WebSocket conectado com sucesso!");
  ws.send(JSON.stringify({ type: "subscribe", topic: "vehicle_updates" }));
});

ws.on("message", function message(data) {
  console.log("Mensagem recebida:", data.toString());
});

ws.on("error", function error(err) {
  console.log("Erro WebSocket:", err.message);
});

ws.on("close", function close() {
  console.log("WebSocket desconectado");
});

setTimeout(() => {
  ws.close();
  process.exit(0);
}, 5000);
