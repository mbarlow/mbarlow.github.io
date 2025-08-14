const WebSocket = require('ws');
const ws = new WebSocket('ws://127.0.0.1:9222/devtools/page/B456C8F76D8B2FF34AA8675360D11E3D');

ws.on('open', function open() {
  console.log('🔗 Connected to Chrome DevTools');
  ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
  ws.send(JSON.stringify({ id: 2, method: 'Console.enable' }));
});

ws.on('message', function message(data) {
  const msg = JSON.parse(data);
  if (msg.method === 'Console.messageAdded') {
    const level = msg.params.message.level;
    const text = msg.params.message.text;
    console.log(`[${level}] ${text}`);
  } else if (msg.method === 'Runtime.consoleAPICalled') {
    const type = msg.params.type;
    const args = msg.params.args || [];
    const text = args.map(arg => arg.value || arg.description || JSON.stringify(arg)).join(' ');
    console.log(`[${type}] ${text}`);
  }
});

setTimeout(() => { 
  console.log('⏰ Monitoring console for 30 seconds...');
  setTimeout(() => {
    ws.close(); 
    process.exit(0); 
  }, 30000);
}, 1000);