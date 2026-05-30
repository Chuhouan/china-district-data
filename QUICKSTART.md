# 🚀 快速开始指南

## 📋 已完成的工作

### ✅ 1. 系统级定时任务（替代node-cron）
**问题**: 原来的定时任务依赖服务器进程，关闭终端后就停止了。

**解决方案**:
- ✅ 创建 `setup_task.bat` - Windows批处理设置脚本
- ✅ 创建 `setup_task_scheduler.ps1` - PowerShell自动化脚本
- ✅ 更新 `server.js` - 移除node-cron依赖
- ✅ 创建 `crontab_config.txt` - Linux系统配置示例

**优势**:
- 不依赖Node.js进程持续运行
- 系统重启后自动恢复
- 可以在用户未登录时执行
- 更可靠的定时执行

---

### ✅ 2. 扩展数据源配置
**问题**: 只配置了部分省份/城市的抓取规则。

**解决方案**:
- ✅ 更新 `scraper.js` - 添加完整的31个省份URL映射
- ✅ 创建 `DATA_SOURCES.md` - 数据源扩展指南
- ✅ 提供3种扩展数据源的方法

**当前覆盖**:
- 中国经济网 - 31个省级领导数据 ✅
- 中国经济网 - 河南省、陕西省市级领导数据 ✅
- 百度百科 - 全国所有地级市人大/政协数据 ✅

---

### ✅ 3. 改进抓取逻辑
**问题**: 缺乏容错机制、无法检测数据变更、失败后无日志。

**解决方案** - 重写 `scraper.js`:

#### 新增功能:
1. **重试机制** - 失败自动重试3次，指数退避
2. **变更检测** - 自动检测数据变更并记录
3. **自动备份** - 每次抓取前自动备份，保留最近10个备份
4. **详细日志** - 记录每次抓取的详细信息和错误
5. **更新历史** - 保存到 `update_history.json`

---

### ✅ 4. 云服务器部署指南
**问题**: 缺乏部署文档，无法真正24小时运行。

**解决方案** - 创建 `DEPLOYMENT_GUIDE.md`:

#### 提供3种部署方案:
1. **方案A**: 腾讯云/阿里云部署 - 完整步骤
2. **方案B**: 使用PM2守护进程 - 推荐，简单可靠
3. **方案C**: Docker容器化部署 - 适合容器化环境

#### 包含内容:
- 云服务器购买建议
- Node.js安装步骤
- 项目代码上传方法
- PM2进程管理
- crontab自动更新配置
- 监控与维护指南
- 故障排查手册

---

## 🎯 如何使用

### 第一步: 测试抓取功能
```bash
cd c:\Users\63259\CodeBuddy\20260529212928
node scraper.js
```

**预期输出**:
```
===== 开始多源数据抓取 =====
  时间: 2026-05-30T10:30:00.000Z
  已有数据: 5 省, 0 市

[中国经济网-省级] 开始抓取...
  (1/31) 110000... ✓ 北京市
  (2/31) 120000... ✓ 天津市
  ...
  
[百度百科-地市人大政协] 开始自动抓取各地市人大/政协数据...
  需要抓取 300/300 个城市
  ...

===== 抓取完成 =====
  省份: 31
  城市: 300
  成功: 31
  失败: 0
  数据文件: c:\Users\63259\CodeBuddy\20260529212928\scraped_data.json
  
===== 数据变更检测 =====
  共 5 处变更
  ...
```

### 第二步: 启动API服务器
```bash
npm start
```

**预期输出**:
```
✓ 服务已启动: http://localhost:3000
  数据接口: http://localhost:3000/api/all
  更新历史: http://localhost:3000/api/history
  手动抓取: POST http://localhost:3000/api/scrape
  数据源配置: http://localhost:3000/api/sources
  数据文件: c:\Users\63259\CodeBuddy\20260529212928\scraped_data.json

  自动更新: 使用 Windows任务计划程序 或 系统crontab
  见 setup_task.bat (Windows) 或 crontab_config.txt (Linux)
```

### 第三步: 设置自动更新

#### Windows系统（推荐）:
```bash
# 方法1: 批处理（简单）
双击运行 setup_task.bat
# 选择选项 1 (每天凌晨3点自动运行)

# 方法2: PowerShell（自动化）
右键 setup_task_scheduler.ps1 -> 使用PowerShell运行
# 将以管理员身份创建系统任务
```

#### Linux/macOS系统:
```bash
# 编辑 crontab
crontab -e

# 添加以下行（每天凌晨3点执行）:
0 3 * * * cd /path/to/project && /usr/bin/node scraper.js >> /path/to/logs/scraper.log 2>&1

# 保存退出
```

### 第四步: 验证自动更新

#### Windows系统:
```powershell
# 查看任务
schtasks /Query /TN "ChinaDistrictDataAutoUpdate"

# 手动运行测试
schtasks /Run /TN "ChinaDistrictDataAutoUpdate"

# 查看执行结果
type update_history.json
```

#### Linux/macOS系统:
```bash
# 查看crontab配置
crontab -l

# 手动测试执行
cd /path/to/project && node scraper.js

# 查看日志
tail -f logs/scraper.log
```

---

## 📂 文件说明

### 核心文件:
| 文件 | 说明 |
|------|------|
| `server.js` | API服务器（已移除node-cron） |
| `scraper.js` | 数据抓取器（已改进） |
| `package.json` | 项目配置 |

### 自动更新配置:
| 文件 | 说明 |
|------|------|
| `setup_task.bat` | Windows任务计划设置（批处理） |
| `setup_task_scheduler.ps1` | Windows任务计划设置（PowerShell） |
| `crontab_config.txt` | Linux crontab配置示例 |

### 文档:
| 文件 | 说明 |
|------|------|
| `README_UPDATE.md` | 详细更新说明 |
| `QUICKSTART.md` | 本文件 - 快速开始指南 |
| `DATA_SOURCES.md` | 数据源扩展指南 |
| `DEPLOYMENT_GUIDE.md` | 云服务器部署指南 |

### 数据文件:
| 文件 | 说明 |
|------|------|
| `scraped_data.json` | 抓取的数据 |
| `update_history.json` | 更新历史 |
| `backups/` | 数据备份目录 |

---

## 🔧 常用命令

### 抓取数据:
```bash
# 手动抓取
node scraper.js

# 查看抓取历史
type update_history.json
```

### 管理API服务:
```bash
# 启动服务
npm start

# 测试API
curl http://localhost:3000/api/all
curl http://localhost:3000/api/history
```

### Windows任务计划:
```powershell
# 查看任务
schtasks /Query /TN "ChinaDistrictDataAutoUpdate"

# 手动运行
schtasks /Run /TN "ChinaDistrictDataAutoUpdate"

# 删除任务
schtasks /Delete /TN "ChinaDistrictDataAutoUpdate" /F
```

### Linux crontab:
```bash
# 编辑crontab
crontab -e

# 查看crontab
crontab -l

# 查看执行日志
tail -f logs/scraper.log
```

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

## 📞 需要帮助？

- **查看文档**: 阅读 `README_UPDATE.md` 获取详细说明
- **查看日志**: 检查 `update_history.json` 中的错误记录
- **测试抓取**: 运行 `node scraper.js` 查看控制台输出
- **扩展数据源**: 参考 `DATA_SOURCES.md`
- **部署到云端**: 参考 `DEPLOYMENT_GUIDE.md`

---

**🎊 恭喜！你现在拥有一个真正能自动更新的数据抓取系统了！**
