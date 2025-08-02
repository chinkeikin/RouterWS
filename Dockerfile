# 使用Node.js 16官方镜像作为基础镜像
FROM node:16-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json（如果存在）
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 3000 9999

# 创建非root用户
RUN adduser -D -s /bin/sh appuser && \
    chown -R appuser:appuser /app

# 切换到非root用户
USER appuser

# 启动应用
CMD ["npm", "start"]