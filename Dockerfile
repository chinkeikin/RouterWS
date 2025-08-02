# 使用CentOS 7.6作为基础镜像
FROM centos:7.6.1810

# 设置工作目录
WORKDIR /app

# 安装Node.js和npm
RUN yum update -y && \
    curl -sL https://rpm.nodesource.com/setup_16.x | bash - && \
    yum install -y nodejs && \
    yum clean all

# 复制package.json和package-lock.json（如果存在）
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 3000 8080

# 创建非root用户
RUN useradd -m -s /bin/bash appuser && \
    chown -R appuser:appuser /app

# 切换到非root用户
USER appuser

# 启动应用
CMD ["npm", "start"]