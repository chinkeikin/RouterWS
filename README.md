# WebSocket HTTP Router Service

一个运行在CentOS 7.6 Docker容器中的WebSocket和HTTP服务路由器，用于消息转发和服务状态监控。

## 功能特性

- **WebSocket服务**: 持久运行的WebSocket服务器，支持多客户端连接
- **HTTP服务**: RESTful API服务，提供消息发送和状态查询功能
- **消息转发**: HTTP接收到的消息通过WebSocket实时转发给所有连接的客户端
- **状态监控**: 提供服务器运行状态和运行时长查询
- **Docker支持**: 完全容器化，支持在CentOS 7.6环境中运行

## API接口

### HTTP接口

#### 1. 发送消息
- **URL**: `POST /api/sendmsg`
- **功能**: 接收JSON数据并通过WebSocket转发给所有连接的客户端
- **请求体**: JSON格式的任意数据
- **响应示例**:
```json
{
  "success": true,
  "message": "消息发送成功",
  "clientCount": 2,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### 2. 获取服务状态
- **URL**: `GET /api/status`
- **功能**: 获取服务器运行状态和总运行时长
- **响应示例**:
```json
{
  "status": "running",
  "startTime": "2024-01-01T10:00:00.000Z",
  "currentTime": "2024-01-01T12:00:00.000Z",
  "uptime": {
    "total_milliseconds": 7200000,
    "days": 0,
    "hours": 2,
    "minutes": 0,
    "seconds": 0,
    "formatted": "0天 2小时 0分钟 0秒"
  },
  "websocket": {
    "port": 8080,
    "connected_clients": 2
  },
  "http": {
    "port": 3000
  },
  "memory": {...},
  "version": "1.0.0"
}
```

### WebSocket接口

- **连接地址**: `ws://localhost:8080`
- **功能**: 接收从HTTP API转发的消息
- **消息格式**:
```json
{
  "type": "broadcast",
  "data": {...},  // 原始HTTP请求数据
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 快速开始

### 使用Docker Compose（推荐）

1. 克隆或下载项目文件
2. 在项目根目录执行：
```bash
docker-compose up -d
```

### 使用Docker

1. 构建镜像：
```bash
docker build -t websocket-router .
```

2. 运行容器：
```bash
docker run -d -p 3000:3000 -p 8080:8080 --name websocket-router websocket-router
```

### 本地开发

1. 安装依赖：
```bash
npm install
```

2. 启动服务：
```bash
npm start
```

或使用开发模式（自动重启）：
```bash
npm run dev
```

## 端口配置

- **HTTP服务**: 3000端口（可通过环境变量PORT修改）
- **WebSocket服务**: 8080端口（可通过环境变量WS_PORT修改）

## 环境变量

- `PORT`: HTTP服务端口（默认: 3000）
- `WS_PORT`: WebSocket服务端口（默认: 8080）
- `NODE_ENV`: 运行环境（默认: production）

## 测试示例

### 发送消息
```bash
curl -X POST http://localhost:3000/api/sendmsg \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello WebSocket!", "user": "test"}'
```

### 查询状态
```bash
curl http://localhost:3000/api/status
```

### WebSocket客户端测试
```javascript
const ws = new WebSocket('ws://localhost:8080');

ws.onopen = function() {
    console.log('WebSocket连接已建立');
};

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('收到消息:', data);
};

ws.onclose = function() {
    console.log('WebSocket连接已关闭');
};
```

## 技术栈

- **Node.js**: 运行时环境
- **Express**: HTTP服务框架
- **ws**: WebSocket库
- **Docker**: 容器化部署
- **CentOS 7.6**: 基础操作系统

## 许可证

MIT License