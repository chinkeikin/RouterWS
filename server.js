const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const http = require('http');
const timeUtils = require('./utils/timeUtils');

const app = express();
const PORT = process.env.PORT || 3000;
const WS_PORT = process.env.WS_PORT || 9999;

// 服务启动时间
const startTime = timeUtils.getCurrentTime();
const timezone = process.env.TZ || timeUtils.DEFAULT_TIMEZONE;

// 中间件
app.use(cors());
app.use(express.json());

// 创建HTTP服务器
const server = http.createServer(app);

// 创建WebSocket服务器
const wss = new WebSocket.Server({ port: WS_PORT });

// 存储WebSocket连接
const clients = new Set();

// WebSocket连接处理
wss.on('connection', (ws, req) => {
    const clientIp = req.socket.remoteAddress || 'unknown';
    console.log(`新的WebSocket连接: ${clientIp}`);
    clients.add(ws);
    
    // 发送欢迎消息
    const welcomeTimestamp = timeUtils.createTimestamp();
    ws.send(JSON.stringify({
        type: 'welcome',
        message: '连接成功',
        timestamp: welcomeTimestamp.iso,
        localTime: welcomeTimestamp.local,
        timezone: welcomeTimestamp.timezone.timezone
    }));
    
    // 处理连接关闭
    ws.on('close', () => {
        console.log('WebSocket连接关闭');
        clients.delete(ws);
    });
    
    // 处理错误
    ws.on('error', (error) => {
        console.error('WebSocket错误:', error);
        clients.delete(ws);
    });
    
    // 处理客户端消息
    ws.on('message', (message) => {
        const messageStr = message.toString();
        
        // 处理ping消息
        if (messageStr === 'ping') {
            ws.send('pong');
            console.log('收到ping消息，已回复pong');
            return;
        }
        
        // 处理其他简单文本消息
        if (messageStr.length < 100 && !messageStr.startsWith('{') && !messageStr.startsWith('[')) {
            console.log('收到文本消息:', messageStr);
            return;
        }
        
        // 尝试解析JSON消息
        try {
            const data = JSON.parse(messageStr);
            console.log('收到JSON消息:', data);
        } catch (error) {
            console.log('收到非JSON消息:', messageStr);
        }
    });
});

// 广播消息给所有WebSocket客户端
function broadcastMessage(message) {
    const timestamp = timeUtils.createTimestamp();
    const messageStr = JSON.stringify({
        type: 'broadcast',
        data: message,
        timestamp: timestamp.iso,
        localTime: timestamp.local,
        timezone: timestamp.timezone.timezone
    });
    
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(messageStr);
        }
    });
    
    console.log(`消息已广播给 ${clients.size} 个客户端:`, message);
}

// HTTP路由

// POST /api/sendmsg - 接收消息并通过WebSocket转发
app.post('/api/sendmsg', (req, res) => {
    try {
        const messageData = req.body;
        
        if (!messageData) {
            return res.status(400).json({
                success: false,
                error: '请求体不能为空'
            });
        }
        
        // 通过WebSocket广播消息
        broadcastMessage(messageData);
        
        const responseTimestamp = timeUtils.createTimestamp();
        res.json({
            success: true,
            message: '消息发送成功',
            clientCount: clients.size,
            timestamp: responseTimestamp.iso,
            localTime: responseTimestamp.local,
            timezone: responseTimestamp.timezone.timezone
        });
        
    } catch (error) {
        console.error('处理sendmsg请求时出错:', error);
        res.status(500).json({
            success: false,
            error: '服务器内部错误'
        });
    }
});

// GET /api/status - 获取服务器状态
app.get('/api/status', (req, res) => {
    const now = timeUtils.getCurrentTime();
    const uptime = timeUtils.calculateUptime(startTime, now);
    const currentTimestamp = timeUtils.createTimestamp(now);
    const startTimestamp = timeUtils.createTimestamp(startTime);
    const timezoneInfo = timeUtils.getTimezoneInfo(timezone);
    
    res.json({
        status: 'running',
        time: {
            start: {
                iso: startTimestamp.iso,
                local: startTimestamp.local,
                compact: startTimestamp.compact,
                unix: startTimestamp.unix
            },
            current: {
                iso: currentTimestamp.iso,
                local: currentTimestamp.local,
                compact: currentTimestamp.compact,
                unix: currentTimestamp.unix
            },
            timezone: timezoneInfo
        },
        uptime: uptime,
        services: {
            websocket: {
                port: WS_PORT,
                connected_clients: clients.size,
                status: 'running'
            },
            http: {
                port: PORT,
                status: 'running'
            }
        },
        system: {
            memory: process.memoryUsage(),
            platform: process.platform,
            nodeVersion: process.version,
            pid: process.pid
        },
        version: '1.0.0'
    });
});

// 根路径
app.get('/', (req, res) => {
    res.json({
        message: 'WebSocket HTTP Router Service',
        version: '1.0.0',
        endpoints: {
            'POST /api/sendmsg': '发送消息到WebSocket客户端',
            'GET /api/status': '获取服务器状态'
        },
        websocket_url: `ws://localhost:${WS_PORT}`
    });
});

// 启动HTTP服务器
server.listen(PORT, () => {
    const startTimestamp = timeUtils.createTimestamp(startTime);
    const timezoneInfo = timeUtils.getTimezoneInfo(timezone);
    
    console.log(`HTTP服务器运行在端口 ${PORT}`);
    console.log(`WebSocket服务器运行在端口 ${WS_PORT}`);
    console.log(`服务启动时间: ${startTimestamp.local} (${timezoneInfo.timezone})`);
    console.log(`时区信息: ${timezoneInfo.timezone} ${timezoneInfo.offsetString}`);
    console.log('\n可用的API端点:');
    console.log(`  POST http://localhost:${PORT}/api/sendmsg - 发送消息`);
    console.log(`  GET  http://localhost:${PORT}/api/status - 获取状态`);
    console.log(`\nWebSocket连接地址: ws://localhost:${WS_PORT}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('收到SIGTERM信号，正在关闭服务器...');
    server.close(() => {
        console.log('HTTP服务器已关闭');
    });
    wss.close(() => {
        console.log('WebSocket服务器已关闭');
    });
});

process.on('SIGINT', () => {
    console.log('收到SIGINT信号，正在关闭服务器...');
    server.close(() => {
        console.log('HTTP服务器已关闭');
    });
    wss.close(() => {
        console.log('WebSocket服务器已关闭');
    });
    process.exit(0);
});