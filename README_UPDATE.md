# 中国行政区划数据平台 - 更新说明

## 🎯 完成的改进

### ✅ 任务1: 改用系统级定时任务
**问题**: 原来的 `node-cron` 依赖服务器进程持续运行，关闭终端后定时任务停止。

**解决方案**:
- 创建 `setup_task.bat` - Windows批处理设置脚本
- 创建 `setup_task_scheduler.ps1` - PowerShell自动化脚本
- 移除 `server.js` 中的 `node-cron` 依赖

**使用方法**:
```bash
# Windows系统
双击运行 setup_task.bat
# 或
右键 setup_task_scheduler.ps1 -> 使用PowerShell运行

# Linux/macOS系统
crontab -e
# 添加: 0 3 * * * cd /path/to/project && node scraper.js
```

**优势**:
- ✅ 不依赖Node.js进程持续运行
- ✅ 系统重启后自动恢复
- ✅ 可以在用户未登录时执行
- ✅ 更可靠的定时执行

---

### ✅ 任务2: 扩展数据源配置
**问题**: 只配置了部分省份/城市的抓取规则。

**解决方案**:
- 创建 `DATA_SOURCES.md` - 数据源扩展指南
- 在 `scraper.js` 中添加完整的31个省份URL映射
- 提供3种扩展数据源的方法

**当前覆盖**:
- ✅ 中国经济网 - 31个省级领导数据
- ✅ 中国经济网 - 河南省、陕西省市级领导数据
- ✅ 百度百科 - 全国所有地级市人大/政协数据

**如何扩展**:
1. 打开 `scraper.js`
2. 在 `SOURCES` 数组中添加新的数据源配置
3. 参考 `DATA_SOURCES.md` 中的详细步骤

---

### ✅ 任务3: 改进抓取逻辑
**问题**: 缺乏容错机制、无法检测数据变更、失败后无日志。

**解决方案**:
重写 `scraper.js`，增加以下改进:

#### 1. 重试机制
```javascript
async function fetchUrl(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      // 抓取逻辑
      return resp.data;
    } catch (err) {
      if (i === retries - 1) {
        console.error(`  ✗ 抓取失败(重试${retries}次): ${err.message}`);
        return null;
      }
      console.log(`  重试 ${i + 1}/${retries}...`);
      await new Promise(r => setTimeout(r, 1000 * (i + 1))); // 指数退避
    }
  }
}
```

#### 2. 变更检测
```javascript
function detectChanges(oldData, newData) {
  const changes = { provinces: [], cities: [], total: 0 };
  
  // 对比新旧数据，记录所有变更
  // ...
  
  return changes;
}
```

#### 3. 自动备份
```javascript
function backupData(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(BACKUP_DIR, `backup_${timestamp}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
  
  // 只保留最近10个备份
  // ...
}
```

#### 4. 详细日志
- ✅ 记录每次抓取的详细信息
- ✅ 记录数据变更历史
- ✅ 记录失败原因
- ✅ 保存到 `update_history.json`

---

### ✅ 任务4: 云服务器部署指南
**问题**: 缺乏部署文档，无法真正24小时运行。

**解决方案**:
创建 `DEPLOYMENT_GUIDE.md`，包含:

#### 方案A: 腾讯云/阿里云部署
- 购买云服务器（¥50-100/月）
- 安装Node.js
- 上传项目代码
- 配置防火墙

#### 方案B: 使用PM2守护进程（推荐）
- 安装PM2: `npm install -g pm2`
- 启动服务: `pm2 start server.js --name "china-district-api"`
- 设置开机自启: `pm2 startup`
- 配置日志管理

#### 方案C: Docker容器化部署
- 创建Dockerfile
- 创建docker-compose.yml
- 构建并运行容器

#### 自动更新配置
```bash
# Linux crontab
crontab -e
# 添加: 0 3 * * * cd /path/to/project && node scraper.js >> logs/scraper.log 2>&1
```

---

## 📂 文件结构

```
c:\Users\63259\CodeBuddy\20260529212928\
│
├─ server.js                    # API服务器（已移除node-cron）
├─ scraper.js                   # 数据抓取器（已改进）
├─ package.json                 # 项目配置
│
├─ setup_task.bat               # Windows任务计划设置（新增）
├─ setup_task_scheduler.ps1     # PowerShell自动化脚本（新增）
├─ crontab_config.txt           # Linux crontab配置示例（新增）
│
├─ DATA_SOURCES.md             # 数据源扩展指南（新增）
├─ DEPLOYMENT_GUIDE.md         # 云服务器部署指南（新增）
├─ README_UPDATE.md             # 本文件（新增）
│
├─ scraped_data.json            # 抓取的数据
├─ update_history.json          # 更新历史
├─ backups/                     # 数据备份目录（自动创建）
│
└─ node_modules/                # 依赖包
```

---

## 🚀 快速开始

### 1. 测试抓取功能
```bash
cd c:\Users\63259\CodeBuddy\20260529212928
node scraper.js
```

### 2. 启动API服务器
```bash
npm start
# 或
node server.js
```

### 3. 设置自动更新

**Windows系统**:
```bash
# 方法1: 批处理（简单）
双击运行 setup_task.bat

# 方法2: PowerShell（推荐）
右键 setup_task_scheduler.ps1 -> 使用PowerShell运行
```

**Linux/macOS系统**:
```bash
crontab -e
# 添加以下行:
0 3 * * * cd /path/to/project && /usr/bin/node scraper.js >> logs/scraper.log 2>&1
```

### 4. 验证自动更新
```bash
# Windows
schtasks /Query /TN "ChinaDistrictDataAutoUpdate"

# Linux
crontab -l
```

---

## 📊 功能对比

| 功能 | 改进前 | 改进后 |
|------|--------|--------|
| 定时任务 | ❌ 依赖进程运行 | ✅ 系统级任务 |
| 重试机制 | ❌ 无 | ✅ 3次重试+指数退避 |
| 变更检测 | ❌ 无 | ✅ 自动检测并记录 |
| 数据备份 | ❌ 无 | ✅ 自动备份（保留10个） |
| 错误日志 | ❌ 静默失败 | ✅ 详细日志记录 |
| 数据源扩展 | ❌ 困难 | ✅ 简单（见DATA_SOURCES.md） |
| 云部署 | ❌ 无文档 | ✅ 完整指南 |
| 进程守护 | ❌ 无 | ✅ 支持PM2/Docker |

---

## 🔧 常用命令

### 抓取数据
```bash
# 手动抓取
node scraper.js

# 查看抓取日志
type update_history.json
```

### 管理API服务
```bash
# 启动服务
npm start

# 测试API
curl http://localhost:3000/api/all
curl http://localhost:3000/api/history
```

### Windows任务计划
```powershell
# 查看任务
schtasks /Query /TN "ChinaDistrictDataAutoUpdate"

# 手动运行
schtasks /Run /TN "ChinaDistrictDataAutoUpdate"

# 删除任务
schtasks /Delete /TN "ChinaDistrictDataAutoUpdate" /F
```

### Linux crontab
```bash
# 编辑crontab
crontab -e

# 查看crontab
crontab -l

# 查看执行日志
tail -f logs/scraper.log
```

---

## 📖 文档索引

| 文档 | 用途 |
|------|------|
| `README_UPDATE.md` | 本文件 - 更新说明 |
| `DATA_SOURCES.md` | 如何添加新的数据源 |
| `DEPLOYMENT_GUIDE.md` | 云服务器部署完整指南 |
| `crontab_config.txt` | Linux crontab配置示例 |
| `setup_task.bat` | Windows任务计划设置（批处理） |
| `setup_task_scheduler.ps1` | Windows任务计划设置（PowerShell） |

---

## ⚠️ 注意事项

1. **首次运行**:
   - 先运行 `node scraper.js` 抓取初始数据
   - 再运行 `npm start` 启动API服务

2. **自动更新**:
   - Windows: 必须以管理员身份运行 `setup_task.bat`
   - Linux: 确保 `logs/` 目录存在

3. **数据源失效**:
   - 如果某个数据源URL失效，查看 `update_history.json` 中的错误记录
   - 参考 `DATA_SOURCES.md` 更新URL

4. **百度百科反爬虫**:
   - 抓取速度已设置为随机延迟300-600ms
   - 如果仍被封，增加延迟时间

---

## 🎉 总结

现在你的系统已经具备:

✅ **真正的自动更新** - 使用系统级定时任务  
✅ **可靠的数据抓取** - 重试机制+变更检测  
✅ **数据安全** - 自动备份+历史记录  
✅ **易于扩展** - 详细的数据源扩展指南  
✅ **云端部署** - 完整的部署文档  

**下一步建议**:
1. 运行 `node scraper.js` 测试抓取功能
2. 运行 `setup_task.bat` 设置自动更新
3. 启动API服务 `npm start`
4. 访问 `http://localhost:3000/api/all` 验证数据
5. （可选）购买云服务器并参考 `DEPLOYMENT_GUIDE.md` 部署

---

**需要帮助？**
- 查看各文档的详细说明
- 检查 `update_history.json` 中的错误记录
- 运行 `node scraper.js` 查看控制台输出
