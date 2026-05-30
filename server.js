// ========== 中国行政区划数据 API 服务 ==========
// 数据来源: 百度百科 infobox
// 启动: npm install && npm start
// 自动更新: 使用 Windows任务计划程序 或 系统crontab（见 setup_task.bat 或 crontab_config.txt）

const express = require('express');
const path = require('path');
const fs = require('fs');
const { scrapeAll, GAPS_FILE } = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'scraped_data.json');
const HISTORY_FILE = path.join(__dirname, 'update_history.json');

// ========== 更新历史 ==========
let updateHistory = [];

function loadHistory() {
  if (fs.existsSync(HISTORY_FILE)) {
    try { updateHistory = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')); } catch (e) {}
  }
  if (!Array.isArray(updateHistory)) updateHistory = [];
}
loadHistory();

function addHistoryEntry(type, details, source, results) {
  updateHistory.unshift({
    id: Date.now(),
    time: new Date().toISOString(),
    type: type,
    details: details || '',
    source: source || '',
    results: results || []
  });
  // 只保留最近100条
  if (updateHistory.length > 100) updateHistory = updateHistory.slice(0, 100);
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(updateHistory, null, 2));
}

// ========== 数据管理 ==========
let dataCache = { provinces: {}, cities: {}, lastUpdate: null };

function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      dataCache = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
      console.error('数据文件损坏:', e.message);
    }
  }
}
loadData();

function saveData() {
  dataCache.lastUpdate = new Date().toISOString();
  fs.writeFileSync(DATA_FILE, JSON.stringify(dataCache, null, 2));
}

// ========== API 路由 ==========
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// 获取所有省份数据
app.get('/api/provinces', (req, res) => {
  res.json({ code: 0, data: dataCache.provinces, lastUpdate: dataCache.lastUpdate });
});

// 获取所有城市数据
app.get('/api/cities', (req, res) => {
  res.json({ code: 0, data: dataCache.cities, lastUpdate: dataCache.lastUpdate });
});

// 获取完整数据
app.get('/api/all', (req, res) => {
  res.json({ code: 0, data: dataCache, lastUpdate: dataCache.lastUpdate });
});

// 获取更新历史
app.get('/api/history', (req, res) => {
  res.json({ code: 0, data: updateHistory });
});

// 手动触发抓取
app.post('/api/scrape', async (req, res) => {
  try {
    addHistoryEntry('scrape_start', '开始手动抓取数据(百度百科)...', '', []);
    const result = await scrapeAll();
    if (result) {
      const pCount = Object.keys(result.provinces).length;
      const cCount = Object.keys(result.cities).length;
      dataCache = result;
      saveData();
      addHistoryEntry('scrape_success', `百度百科抓取完成: ${pCount}省, ${cCount}市`, 
        [{ name: '百度百科 infobox', url: 'https://baike.baidu.com/' }], []);
      res.json({ code: 0, message: '抓取成功', provinces: pCount, cities: cCount });
    } else {
      addHistoryEntry('scrape_fail', '百度百科抓取失败', '', []);
      res.json({ code: -1, message: '抓取失败' });
    }
  } catch (e) {
    addHistoryEntry('scrape_error', '抓取异常: ' + e.message, '', []);
    res.json({ code: -1, message: e.message });
  }
});

// 获取数据空白报告
app.get('/api/gaps', (req, res) => {
  if (fs.existsSync(GAPS_FILE)) {
    try {
      const gaps = JSON.parse(fs.readFileSync(GAPS_FILE, 'utf8'));
      return res.json({ code: 0, data: gaps });
    } catch (e) {  }
  }
  res.json({ code: 0, data: { provinces: [], cities: [], total: 0 } });
});

// 提供前端静态文件
app.use(express.static(path.join(__dirname)));

// ========== 启动 ==========
addHistoryEntry('server_start', `服务启动: http://localhost:${PORT}`, '', []);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ 服务已启动: http://localhost:${PORT}`);
  console.log(`  数据接口: http://localhost:${PORT}/api/all`);
  console.log(`  更新历史: http://localhost:${PORT}/api/history`);
  console.log(`  数据空白: http://localhost:${PORT}/api/gaps`);
  console.log(`  手动抓取: POST http://localhost:${PORT}/api/scrape`);
  console.log(`  数据文件: ${DATA_FILE}`);
  console.log(`  数据来源: 百度百科 infobox`);
  console.log(`\n  自动更新: 使用 Windows任务计划程序 或 系统crontab`);
  console.log(`  见 setup_task.bat (Windows) 或 crontab_config.txt (Linux)`);
});
