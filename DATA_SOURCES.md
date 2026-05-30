# 数据源扩展配置指南

## 当前支持的数据源

### 1. 中国经济网 - 省级领导
- **数据源**: http://district.ce.cn/zt/rwk/
- **覆盖范围**: 31个省级行政区
- **更新频率**: 每日自动更新
- **数据字段**: 省委书记、省长、省委常委

### 2. 中国经济网 - 市级领导
- **数据源**: http://district.ce.cn/zt/rwk/sf/{省份缩写}/ds/
- **当前覆盖**: 河南省、陕西省
- **待扩展**: 其他省份的市级领导页面

### 3. 百度百科 - 地市人大政协
- **数据源**: https://baike.baidu.com/item/{城市名}
- **覆盖范围**: 全国所有地级市
- **数据字段**: 人大主任、政协主席

---

## 如何添加新的数据源

### 方法1: 添加更多省份的市级领导数据

编辑 `scraper.js` 中的 `SOURCES` 数组，在 `中国经济网-市级` 数据源中添加新的省份配置：

```javascript
// 在 scraper.js 第183行左右的 urls 对象中添加
urls: {
  '610000': 'http://district.ce.cn/zt/rwk/sf/sn/ds/202507/t20250731_2426655.shtml',  // 陕西
  '410000': 'http://district.ce.cn/zt/rwk/sf/ha/ds/202508/t20250802_2429040.shtml',  // 河南
  
  // 添加更多省份（示例）
  '110000': 'http://district.ce.cn/zt/rwk/sf/bj/ds/...',  // 北京
  '120000': 'http://district.ce.cn/zt/rwk/sf/tj/ds/...',  // 天津
  '130000': 'http://district.ce.cn/zt/rwk/sf/he/ds/...',  // 河北
  // ... 其他省份
},
```

同时，在 `cityMap` 中添加对应的城市列表：

```javascript
const cityMap = {
  '610000': [ /* 陕西城市 */ ],
  '410000': [ /* 河南城市 */ ],
  
  // 添加新省份的城市列表
  '110000': [
    { name: '东城区', adcode: '110101' },
    { name: '西城区', adcode: '110102' },
    // ... 更多城市
  ],
  // ... 其他省份
};
```

### 方法2: 添加新的数据源类型

在 `SOURCES` 数组中添加新的数据源对象：

```javascript
// 示例：添加中国政府网数据源
{
  name: '中国政府网-省级领导',
  type: 'custom-source',
  url: 'http://www.gov.cn/...',
  
  // 自定义抓取函数
  async run(dataCache) {
    console.log('  开始抓取中国政府网数据...');
    // 在这里实现抓取逻辑
    const html = await fetchUrl(this.url);
    const $ = cheerio.load(html);
    
    // 解析数据并更新 dataCache
    // ...
    
    console.log('  ✓ 完成');
  }
}
```

### 方法3: 使用API接口数据源

如果有官方API接口，可以直接调用：

```javascript
// 示例：添加民政部行政区划API
{
  name: '民政部API',
  type: 'api-source',
  
  async run(dataCache) {
    console.log('  开始调用民政部API...');
    try {
      const resp = await axios.get('https://apis.map.qq.com/...', {
        params: { key: 'YOUR_API_KEY' }
      });
      // 处理API返回的数据
      // ...
    } catch (e) {
      console.error('  ✗ API调用失败:', e.message);
    }
  }
}
```

---

## 数据源URL查找方法

### 中国经济网市级领导页面URL规律

1. 打开中国经济网省级页面（如 http://district.ce.cn/zt/rwk/sf/sn/index.shtml ）
2. 查找"各市领导"或"领导干部"链接
3. 复制链接地址，添加到 `urls` 配置中

### 百度百科页面URL

- 格式: `https://baike.baidu.com/item/{城市名}`
- 示例: `https://baike.baidu.com/item/北京市`

---

## 数据字段说明

| 字段 | 说明 | 示例 |
|------|------|------|
| `n` | 名称 | "北京市" |
| `sec` | 党委书记/省委书记 | "尹力" |
| `gov` | 省长/市长 | "殷勇" |
| `secComm` | 省委常委 | "XX、XX、XX" |
| `rd` | 人大主任 | "李秀领" |
| `cppcc` | 政协主席 | "魏小东" |

---

## 自动更新配置

### Windows系统（推荐）

运行 `setup_task.bat` 或 `setup_task_scheduler.ps1`

### Linux/macOS系统

编辑 crontab: `crontab -e`

添加以下行（每天凌晨3点执行）：
```
0 3 * * * cd /path/to/project && /usr/bin/node scraper.js >> /path/to/logs/scraper.log 2>&1
```

---

## 常见问题

### Q1: 如何知道数据源是否可用？

运行手动抓取测试：
```bash
node scraper.js
```

查看输出日志，检查是否有 ✗ 失败标记。

### Q2: 网页改版导致解析失败怎么办？

1. 检查网页HTML结构是否变化
2. 更新 `parseProvince()` 或 `parseCities()` 中的解析规则
3. 使用浏览器开发者工具查看新的CSS选择器

### Q3: 如何验证数据的准确性？

- 对比官方发布的领导干部名单
- 查看更新历史中的变更记录
- 定期人工抽查验证

---

## 扩展数据源检查清单

- [ ] 添加所有省份的市级领导数据源
- [ ] 添加直辖市的区级领导数据
- [ ] 添加县级领导数据（如果可用）
- [ ] 集成更多可靠数据源（如政府官网）
- [ ] 实现数据交叉验证机制
- [ ] 添加数据质量评分系统

---

**提示**: 添加新数据源后，运行 `node scraper.js` 测试是否正常工作。
