# 云服务器部署指南

## 目录
1. [部署架构](#部署架构)
2. [方案A: 腾讯云/阿里云部署](#方案a-腾讯云阿里云部署)
3. [方案B: 使用PM2守护进程](#方案b-使用pm2守护进程)
4. [方案C: Docker容器化部署](#方案c-docker容器化部署)
5. [自动更新配置](#自动更新配置)
6. [监控与维护](#监控与维护)

---

## 部署架构

```
┌─────────────────────────────────────────────────────────┐
│                    云服务器部署架构                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────┐         ┌─────────────┐              │
│  │   用户浏览器  │         │   定时任务    │              │
│  └──────┬──────┘         └──────┬──────┘              │
│         │                        │                      │
│         ▼                        ▼                      │
│  ┌─────────────────────────────────────────┐            │
│  │         Nginx (反向代理)                 │            │
│  └─────────────────┬───────────────────────┘            │
│                    │                                    │
│                    ▼                                    │
│  ┌─────────────────────────────────────────┐            │
│  │      Node.js (server.js)                │            │
│  │      - 端口: 3000                      │            │
│  │      - 静态文件服务                      │            │
│  │      - API接口                          │            │
│  └─────────────────┬───────────────────────┘            │
│                    │                                    │
│                    ▼                                    │
│  ┌─────────────────────────────────────────┐            │
│  │      数据文件                            │            │
│  │      - scraped_data.json                │            │
│  │      - update_history.json              │            │
│  │      - backups/                         │            │
│  └─────────────────────────────────────────┘            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 方案A: 腾讯云/阿里云部署

### 步骤1: 购买云服务器

**推荐配置**:
- **CPU**: 1核
- **内存**: 2GB
- **带宽**: 1-3Mbps
- **系统**: Ubuntu 20.04 / CentOS 7
- **成本**: ¥50-100/月

**购买链接**:
- 腾讯云: https://cloud.tencent.com/product/cvm
- 阿里云: https://www.aliyun.com/product/ecs

### 步骤2: 连接服务器

```bash
# Windows 使用 PowerShell 或 cmd
ssh root@你的服务器IP

# 输入密码后进入服务器命令行
```

### 步骤3: 安装Node.js

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js (推荐使用 nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
node --version  # 验证安装
```

### 步骤4: 上传项目代码

**方法1: 使用Git**
```bash
# 在服务器上
git clone https://github.com/你的用户名/你的仓库.git
cd 你的仓库
npm install
```

**方法2: 使用SCP上传**
```bash
# 在本地电脑上
scp -r c:\Users\63259\CodeBuddy\20260529212928 root@服务器IP:/home/
```

**方法3: 手动创建文件**
```bash
# 在服务器上创建目录
mkdir -p /home/china-district-data
cd /home/china-district-data

# 使用 nano 或 vim 创建文件
nano server.js
# 粘贴本地 server.js 的内容
# Ctrl+O 保存, Ctrl+X 退出

nano scraper.js
# 粘贴本地 scraper.js 的内容

nano package.json
# 粘贴本地 package.json 的内容

# 安装依赖
npm install
```

### 步骤5: 配置防火墙

```bash
# 开放3000端口
# 腾讯云/阿里云控制台 -> 安全组 -> 添加规则
# 协议: TCP, 端口: 3000, 来源: 0.0.0.0/0
```

### 步骤6: 启动服务

```bash
# 测试运行
node server.js

# 如果看到 "✓ 服务已启动: http://localhost:3000"
# 说明运行成功，按 Ctrl+C 停止
```

---

## 方案B: 使用PM2守护进程

### 安装PM2

```bash
npm install -g pm2
```

### 启动服务

```bash
cd /home/china-district-data
pm2 start server.js --name "china-district-api"
pm2 save  # 保存进程列表
pm2 startup  # 设置开机自启
```

### PM2常用命令

```bash
pm2 list              # 查看所有进程
pm2 logs china-district-api  # 查看日志
pm2 restart china-district-api  # 重启
pm2 stop china-district-api  # 停止
pm2 delete china-district-api  # 删除
```

### 配置自动更新（Linux crontab）

```bash
# 编辑 crontab
crontab -e

# 添加以下行（每天凌晨3点执行）
0 3 * * * cd /home/china-district-data && /usr/bin/node scraper.js >> /home/china-district-data/logs/scraper.log 2>&1

# 保存退出
```

---

## 方案C: Docker容器化部署

### 创建Dockerfile

```dockerfile
# 在项目目录创建 Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

### 创建docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3000

  scraper:
    build: .
    command: node scraper.js
    volumes:
      - ./data:/app/data
    restart: "no"
    environment:
      - NODE_ENV=production
```

### 构建并运行

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 配置自动更新（Docker方式）

```bash
# 编辑 crontab
crontab -e

# 添加以下行
0 3 * * * docker-compose -f /home/china-district-data/docker-compose.yml run --rm scraper
```

---

## 自动更新配置

### Linux/macOS系统（使用crontab）

```bash
# 编辑 crontab
crontab -e

# 添加以下行之一：

# 方案1: 每天凌晨3点执行
0 3 * * * cd /home/china-district-data && /usr/bin/node scraper.js >> /home/china-district-data/logs/scraper.log 2>&1

# 方案2: 每6小时执行一次
0 */6 * * * cd /home/china-district-data && /usr/bin/node scraper.js >> /home/china-district-data/logs/scraper.log 2>&1

# 方案3: 每小时执行一次（测试用）
0 * * * * cd /home/china-district-data && /usr/bin/node scraper.js >> /home/china-district-data/logs/scraper.log 2>&1

# 保存退出
```

### 创建日志目录

```bash
mkdir -p /home/china-district-data/logs
```

### 验证crontab配置

```bash
# 查看当前crontab配置
crontab -l

# 手动测试执行
cd /home/china-district-data && node scraper.js

# 查看日志
tail -f /home/china-district-data/logs/scraper.log
```

---

## 监控与维护

### 1. 日志管理

```bash
# 查看API服务日志
pm2 logs china-district-api

# 查看抓取日志
tail -f /home/china-district-data/logs/scraper.log

# 清理旧日志
pm2 flush
```

### 2. 数据备份

```bash
# 手动备份
cp /home/china-district-data/scraped_data.json /home/china-district-data/backups/backup_$(date +%Y%m%d).json

# 自动备份（添加到crontab）
0 2 * * * cp /home/china-district-data/scraped_data.json /home/china-district-data/backups/backup_$(date +%Y%m%d).json
```

### 3. 健康检查

创建健康检查脚本 `health_check.sh`:

```bash
#!/bin/bash

# 检查API是否可访问
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/all)

if [ $response -eq 200 ]; then
  echo "$(date): API正常"
else
  echo "$(date): API异常，尝试重启..."
  pm2 restart china-district-api
fi
```

添加到crontab（每5分钟检查一次）:
```bash
*/5 * * * * /home/china-district-data/health_check.sh >> /home/china-district-data/logs/health.log 2>&1
```

### 4. 告警配置

```bash
# 安装邮件发送工具
sudo apt install mailutils

# 创建告警脚本 alert.sh
#!/bin/bash

# 抓取失败告警
if [ $? -ne 0 ]; then
  echo "数据抓取失败，请检查服务器" | mail -s "警报: 数据抓取失败" your@email.com
fi
```

---

## 成本估算

| 项目 | 配置 | 月成本 |
|------|------|--------|
| 云服务器 | 1核2GB, 1Mbps | ¥50-100 |
| 域名 | .com/.cn | ¥10-60/年 |
| SSL证书 | 免费(Let's Encrypt) | ¥0 |
| 存储 | 20GB云硬盘 | ¥10-20 |
| **总计** | | **¥70-130/月** |

---

## 快速部署检查清单

- [ ] 购买云服务器
- [ ] 安装Node.js
- [ ] 上传项目代码
- [ ] 安装依赖 `npm install`
- [ ] 配置防火墙/安全组
- [ ] 测试运行 `node server.js`
- [ ] 安装PM2 `npm install -g pm2`
- [ ] 使用PM2启动服务
- [ ] 配置开机自启 `pm2 startup`
- [ ] 配置crontab自动更新
- [ ] 配置日志轮转
- [ ] 配置数据备份
- [ ] 配置健康检查
- [ ] 测试API访问
- [ ] 文档记录部署信息

---

## 故障排查

### 问题1: 服务无法启动

```bash
# 检查端口占用
lsof -i:3000

# 查看错误日志
pm2 logs china-district-api --lines 100

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install
```

### 问题2: 定时任务不执行

```bash
# 检查crontab日志
tail -f /var/log/syslog | grep CRON

# 手动执行测试
cd /home/china-district-data && node scraper.js

# 检查crontab配置
crontab -l
```

### 问题3: 数据抓取失败

```bash
# 检查网络连接
ping district.ce.cn
ping baike.baidu.com

# 检查日志
tail -f /home/china-district-data/logs/scraper.log

# 手动测试抓取
node scraper.js
```

---

## 安全建议

1. **使用非root用户运行服务**
   ```bash
   adduser appuser
   chown -R appuser:appuser /home/china-district-data
   su appuser
   pm2 start server.js
   ```

2. **配置防火墙**
   ```bash
   # 只开放必要端口
   ufw allow 22    # SSH
   ufw allow 3000  # API
   ufw enable
   ```

3. **使用Nginx反向代理**
   ```nginx
   # /etc/nginx/sites-available/china-district
   server {
     listen 80;
     server_name your-domain.com;
     
     location / {
       proxy_pass http://localhost:3000;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
     }
   }
   ```

4. **启用HTTPS**
   ```bash
   # 安装Certbot
   sudo apt install certbot python3-certbot-nginx
   
   # 获取证书
   sudo certbot --nginx -d your-domain.com
   ```

---

## 总结

推荐使用 **方案B (PM2 + crontab)**，因为：
- ✅ 配置简单
- ✅ 自动重启
- ✅ 日志管理方便
- ✅ 资源占用少
- ✅ 适合小型项目

部署完成后，你的服务将：
- ✅ 24小时运行
- ✅ 自动抓取更新数据
- ✅ 开机自动启动
- ✅ 异常自动重启
- ✅ 数据自动备份

---

**需要帮助？**
- 查看 `DEPLOYMENT_CHECKLIST.md` 获取详细步骤
- 查看 `TROUBLESHOOTING.md` 获取故障排查指南
- 联系开发者获取技术支持
