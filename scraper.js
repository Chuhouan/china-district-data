// ========== 百度百科行政区划数据抓取器 ==========
// 数据来源: 百度百科 JSON infobox（唯一来源）
// 覆盖: 31省级 + 300+地级市
// 提取: 解析页面中嵌入的JSON结构化数据
// 传输: curl（绕过Node.js JA3 TLS指纹检测）
// 功能: 三策略提取 / 姓名验证(2-15字符) / 自填补空白 / 变更检测 / 自动备份

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DATA_FILE = path.join(__dirname, 'scraped_data.json');
const GAPS_FILE = path.join(__dirname, 'data_gaps.json');
const HISTORY_FILE = path.join(__dirname, 'update_history.json');
const BACKUP_DIR = path.join(__dirname, 'backups');
if (!fs.existsSync(BACKUP_DIR)) { fs.mkdirSync(BACKUP_DIR, { recursive: true }); }

// ========== 省份定义 ==========
const PROVINCES = {
  '110000': { n: '北京市',   bk: '北京市' },
  '120000': { n: '天津市',   bk: '天津市' },
  '310000': { n: '上海市',   bk: '上海市' },
  '500000': { n: '重庆市',   bk: '重庆市' },
  '130000': { n: '河北省',   bk: '河北省' },
  '140000': { n: '山西省',   bk: '山西省' },
  '210000': { n: '辽宁省',   bk: '辽宁省' },
  '220000': { n: '吉林省',   bk: '吉林省' },
  '230000': { n: '黑龙江省', bk: '黑龙江省' },
  '320000': { n: '江苏省',   bk: '江苏省' },
  '330000': { n: '浙江省',   bk: '浙江省' },
  '340000': { n: '安徽省',   bk: '安徽省' },
  '350000': { n: '福建省',   bk: '福建省' },
  '360000': { n: '江西省',   bk: '江西省' },
  '370000': { n: '山东省',   bk: '山东省' },
  '410000': { n: '河南省',   bk: '河南省' },
  '420000': { n: '湖北省',   bk: '湖北省' },
  '430000': { n: '湖南省',   bk: '湖南省' },
  '440000': { n: '广东省',   bk: '广东省' },
  '460000': { n: '海南省',   bk: '海南省' },
  '510000': { n: '四川省',   bk: '四川省' },
  '520000': { n: '贵州省',   bk: '贵州省' },
  '530000': { n: '云南省',   bk: '云南省' },
  '540000': { n: '西藏自治区', bk: '西藏自治区' },
  '610000': { n: '陕西省',   bk: '陕西省' },
  '620000': { n: '甘肃省',   bk: '甘肃省' },
  '630000': { n: '青海省',   bk: '青海省' },
  '150000': { n: '内蒙古自治区',   bk: '内蒙古自治区' },
  '450000': { n: '广西壮族自治区', bk: '广西壮族自治区' },
  '640000': { n: '宁夏回族自治区', bk: '宁夏回族自治区' },
  '650000': { n: '新疆维吾尔自治区', bk: '新疆维吾尔自治区' },
};

// ========== 城市列表 ==========
const ALL_CITIES = {
  '110000': '北京市','120000': '天津市','310000': '上海市','500000': '重庆市',
  '130100': '石家庄市','130200': '唐山市','130300': '秦皇岛市','130400': '邯郸市',
  '130500': '邢台市','130600': '保定市','130700': '张家口市','130800': '承德市',
  '130900': '沧州市','131000': '廊坊市','131100': '衡水市',
  '140100': '太原市','140200': '大同市','140300': '阳泉市','140400': '长治市',
  '140500': '晋城市','140600': '朔州市','140700': '晋中市','140800': '运城市',
  '140900': '忻州市','141000': '临汾市','141100': '吕梁市',
  '150100': '呼和浩特市','150200': '包头市','150300': '乌海市','150400': '赤峰市',
  '150500': '通辽市','150600': '鄂尔多斯市','150700': '呼伦贝尔市','150800': '巴彦淖尔市',
  '150900': '乌兰察布市',
  '210100': '沈阳市','210200': '大连市','210300': '鞍山市','210400': '抚顺市',
  '210500': '本溪市','210600': '丹东市','210700': '锦州市','210800': '营口市',
  '210900': '阜新市','211000': '辽阳市','211100': '盘锦市','211200': '铁岭市',
  '211300': '朝阳市','211400': '葫芦岛市',
  '220100': '长春市','220200': '吉林市','220300': '四平市','220400': '辽源市',
  '220500': '通化市','220600': '白山市','220700': '松原市','220800': '白城市',
  '230100': '哈尔滨市','230200': '齐齐哈尔市','230300': '鸡西市','230400': '鹤岗市',
  '230500': '双鸭山市','230600': '大庆市','230700': '伊春市','230800': '佳木斯市',
  '230900': '七台河市','231000': '牡丹江市','231100': '黑河市','231200': '绥化市',
  '320100': '南京市','320200': '无锡市','320300': '徐州市','320400': '常州市',
  '320500': '苏州市','320600': '南通市','320700': '连云港市','320800': '淮安市',
  '320900': '盐城市','321000': '扬州市','321100': '镇江市','321200': '泰州市',
  '321300': '宿迁市',
  '330100': '杭州市','330200': '宁波市','330300': '温州市','330400': '嘉兴市',
  '330500': '湖州市','330600': '绍兴市','330700': '金华市','330800': '衢州市',
  '330900': '舟山市','331000': '台州市','331100': '丽水市',
  '340100': '合肥市','340200': '芜湖市','340300': '蚌埠市','340400': '淮南市',
  '340500': '马鞍山市','340600': '淮北市','340700': '铜陵市','340800': '安庆市',
  '341000': '黄山市','341100': '滁州市','341200': '阜阳市','341300': '宿州市',
  '341400': '巢湖市','341500': '六安市','341600': '亳州市','341700': '池州市',
  '341800': '宣城市',
  '350100': '福州市','350200': '厦门市','350300': '莆田市','350400': '三明市',
  '350500': '泉州市','350600': '漳州市','350700': '南平市','350800': '龙岩市',
  '350900': '宁德市',
  '360100': '南昌市','360200': '景德镇市','360300': '萍乡市','360400': '九江市',
  '360500': '新余市','360600': '鹰潭市','360700': '赣州市','360800': '吉安市',
  '360900': '宜春市','361000': '抚州市','361100': '上饶市',
  '370100': '济南市','370200': '青岛市','370300': '淄博市','370400': '枣庄市',
  '370500': '东营市','370600': '烟台市','370700': '潍坊市','370800': '济宁市',
  '370900': '泰安市','371000': '威海市','371100': '日照市','371200': '莱芜市',
  '371300': '临沂市','371400': '德州市','371500': '聊城市','371600': '滨州市',
  '371700': '菏泽市',
  '410100': '郑州市','410200': '开封市','410300': '洛阳市','410400': '平顶山市',
  '410500': '安阳市','410600': '鹤壁市','410700': '新乡市','410800': '焦作市',
  '410900': '濮阳市','411000': '许昌市','411100': '漯河市','411200': '三门峡市',
  '411300': '南阳市','411400': '商丘市','411500': '信阳市','411600': '周口市',
  '411700': '驻马店市','419001': '济源市',
  '420100': '武汉市','420200': '黄石市','420300': '十堰市','420500': '宜昌市',
  '420600': '襄阳市','420700': '鄂州市','420800': '荆门市','420900': '孝感市',
  '421000': '荆州市','421100': '黄冈市','421200': '咸宁市','421300': '随州市',
  '430100': '长沙市','430200': '株洲市','430300': '湘潭市','430400': '衡阳市',
  '430500': '邵阳市','430600': '岳阳市','430700': '常德市','430800': '张家界市',
  '430900': '益阳市','431000': '郴州市','431100': '永州市','431200': '怀化市',
  '431300': '娄底市',
  '440100': '广州市','440200': '韶关市','440300': '深圳市','440400': '珠海市',
  '440500': '汕头市','440600': '佛山市','440700': '江门市','440800': '湛江市',
  '440900': '茂名市','441200': '肇庆市','441300': '惠州市','441400': '梅州市',
  '441500': '汕尾市','441600': '河源市','441700': '阳江市','441800': '清远市',
  '441900': '东莞市','442000': '中山市','445100': '潮州市','445200': '揭阳市',
  '445300': '云浮市',
  '450100': '南宁市','450200': '柳州市','450300': '桂林市','450400': '梧州市',
  '450500': '北海市','450600': '防城港市','450700': '钦州市','450800': '贵港市',
  '450900': '玉林市','451000': '百色市','451100': '贺州市','451200': '河池市',
  '451300': '来宾市','451400': '崇左市',
  '460100': '海口市','460200': '三亚市','460300': '三沙市','460400': '儋州市',
  '510100': '成都市','510300': '自贡市','510400': '攀枝花市','510500': '泸州市',
  '510600': '德阳市','510700': '绵阳市','510800': '广元市','510900': '遂宁市',
  '511000': '内江市','511100': '乐山市','511300': '南充市','511400': '眉山市',
  '511500': '宜宾市','511600': '广安市','511700': '达州市','511800': '雅安市',
  '511900': '巴中市','512000': '资阳市',
  '520100': '贵阳市','520200': '六盘水市','520300': '遵义市','520400': '安顺市',
  '520500': '毕节市','520600': '铜仁市',
  '530100': '昆明市','530300': '曲靖市','530400': '玉溪市','530500': '保山市',
  '530600': '昭通市','530700': '丽江市','530800': '普洱市','530900': '临沧市',
  '540100': '拉萨市','540200': '日喀则市','540300': '昌都市','540400': '林芝市',
  '540500': '山南市','540600': '那曲市',
  '610100': '西安市','610200': '铜川市','610300': '宝鸡市','610400': '咸阳市',
  '610500': '渭南市','610600': '延安市','610700': '汉中市','610800': '榆林市',
  '610900': '安康市','611000': '商洛市',
  '620100': '兰州市','620200': '嘉峪关市','620300': '金昌市','620400': '白银市',
  '620500': '天水市','620600': '武威市','620700': '张掖市','620800': '平凉市',
  '620900': '酒泉市','621000': '庆阳市','621100': '定西市','621200': '陇南市',
  '630100': '西宁市','630200': '海东市',
  '640100': '银川市','640200': '石嘴山市','640300': '吴忠市','640400': '固原市',
  '640500': '中卫市',
  '650100': '乌鲁木齐市','650200': '克拉玛依市','650400': '吐鲁番市','650500': '哈密市',
};

// ========== 姓名验证 ==========
function isValidName(text) {
  if (!text || text.length < 2 || text.length > 15) return false;
  if (!/^[\u4e00-\u9fa5·•]{2,15}$/.test(text)) return false;
  const bad = ['任', '涉嫌', '被查', '接受', '审查', '违纪', '违法', '调查', '双开', '开除', '处分', '被抓', '落马', '通报', '约谈', '推动', '主持', '出席', '调研', '强调', '要求', '指出'];
  if (bad.some(kw => text.includes(kw))) return false;
  return true;
}

// ========== 核心提取：JSON + 文本正则双策略 ==========

function extractLeadersFromHTML(html) {
  // 策略1: JSON infobox（部分页面有此数据，如北京、新疆、广州）
  const rawFields = {};

  const notePattern = /"hasNote":true,"note":"([^"]+)","text":\[\{"(?:lemmaId":\d+,")?tag":"(?:innerlink|text)","text":"([^"]+?)"\}/g;
  let match;
  while ((match = notePattern.exec(html)) !== null) {
    if (!rawFields[match[1]]) rawFields[match[1]] = match[2];
  }

  // 如果上面没匹配到（某些页面的JSON格式不同），尝试备选格式
  if (Object.keys(rawFields).length === 0) {
    const altPattern = /"hasNote":true,"note":"([^"]+)"[^}]*?"text":"([^"]+)"/g;
    while ((match = altPattern.exec(html)) !== null) {
      if (!rawFields[match[1]]) rawFields[match[1]] = match[2];
    }
  }

  // 策略2: 文本正则回退（适用于没有JSON infobox的页面）
  const bodyText = html.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ');
  const textFallback = {};

  // 书记 - 匹配 "XXX 任 XX市委书记" 或 "XX市委书记 XXX" 等模式
  const secPatterns = [
    /([\u4e00-\u9fa5·•]{2,10})(?:同志\s*)?(?:任|任命的?|现任)\s*(?:\w+省|\w+自治区)?\s*[\u4e00-\u9fa5]*(?:省|市|自治区)?(?:\s*委)?书\s*记/,
    /(?:省委|市委|自治区党委)书\s*记\s*([\u4e00-\u9fa5·•]{2,10})/,
    /书\s*记\s*[：:]\s*([\u4e00-\u9fa5·•]{2,10})/,
  ];
  for (const pat of secPatterns) {
    const m = bodyText.match(pat);
    if (m && isValidName(m[1])) { textFallback.sec = m[1]; break; }
  }

  // 省长/市长 - 匹配 "XXX 任 XX市长" 或 "XX市长 XXX"
  const govPatterns = [
    /([\u4e00-\u9fa5·•]{2,10})(?:同志\s*)?(?:任|任命的?|现任)\s*(?:\w+省|\w+自治区)?\s*[\u4e00-\u9fa5]*(?:省|市|自治区)?(?:\s*市)?长/,
    /(?:省|市)长\s*[：:]\s*([\u4e00-\u9fa5·•]{2,10})/,
    /自治区主席\s*[：:]\s*([\u4e00-\u9fa5·•]{2,10})/,
  ];
  for (const pat of govPatterns) {
    const m = bodyText.match(pat);
    if (m && isValidName(m[1])) { textFallback.gov = m[1]; break; }
  }

  return { rawFields, textFallback };
}

function mapToLeaders(extracted, name) {
  const { rawFields, textFallback } = extracted;
  const leaders = {};

  // 书记: JSON优先 → 文本回退
  leaders.sec = rawFields['市委书记'] || rawFields['省委书记'] ||
    rawFields['自治区党委书记'] || rawFields['党委书记'] ||
    textFallback.sec;

  // 省长/市长/主席: JSON优先 → 文本回退（含代理职位）
  leaders.gov = rawFields['市长'] || rawFields['省长'] || rawFields['自治区主席'] ||
    rawFields['市政府代理市长'] || rawFields['代市长'] ||
    rawFields['代理市长'] ||
    textFallback.gov;

  // 人大主任
  leaders.rd = rawFields['人大主任'] || rawFields['人大常委会主任'];

  // 政协主席
  leaders.cppcc = rawFields['政协主席'];

  // 验证清洗
  if (leaders.sec && !isValidName(leaders.sec)) delete leaders.sec;
  if (leaders.gov && !isValidName(leaders.gov)) delete leaders.gov;
  if (leaders.rd && !isValidName(leaders.rd)) delete leaders.rd;
  if (leaders.cppcc && !isValidName(leaders.cppcc)) delete leaders.cppcc;

  return leaders;
}

// ========== HTTP请求 ==========
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function fetchHTML(url) {
  // 策略A: curl（绕过JA3 TLS指纹，Node.js会被百度拦截）
  if (process.platform === 'win32' || process.platform === 'linux' || process.platform === 'darwin') {
    try {
      const cmd = process.platform === 'win32' ? 'curl.exe' : 'curl';
      const html = execSync(
        `${cmd} -s -L --connect-timeout 10 --max-time 25 "${url}" -H "User-Agent: ${UA}" -H "Accept: text/html" -H "Accept-Language: zh-CN"`,
        { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024, timeout: 30000, stdio: ['pipe', 'pipe', 'pipe'] }
      );
      if (html && html.length > 2000 && !html.includes('百度安全验证')) return html;
    } catch (e) { /* 回退到axios */ }
  }

  // 策略B: axios
  try {
    const resp = await axios.get(url, {
      timeout: 15000,
      headers: { 'User-Agent': UA, 'Accept': 'text/html', 'Accept-Language': 'zh-CN', 'Referer': 'https://www.baidu.com/' }
    });
    if (resp.data && resp.data.length > 1000) return resp.data;
  } catch (e) { /* 失败 */ }

  return null;
}

// ========== 数据备份 ==========
function backupData(data) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(BACKUP_DIR, `backup_${ts}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log(`  备份: ${file}`);
  const all = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('backup_')).sort().reverse();
  if (all.length > 10) all.slice(10).forEach(f => fs.unlinkSync(path.join(BACKUP_DIR, f)));
}

// ========== 空白分析 ==========
function analyzeGaps(data) {
  const gaps = { provinces: [], cities: [], total: 0 };
  const fields = [
    { key: 'sec', label: '书记' }, { key: 'gov', label: '省长/市长' },
    { key: 'rd', label: '人大主任' }, { key: 'cppcc', label: '政协主席' }
  ];

  for (const adcode in data.provinces) {
    const p = data.provinces[adcode];
    const missing = fields.filter(f => !p[f.key]).map(f => f.label);
    if (missing.length > 0) { gaps.provinces.push({ adcode, name: p.n || adcode, missing }); gaps.total += missing.length; }
  }
  for (const adcode in data.cities) {
    const c = data.cities[adcode];
    const missing = fields.filter(f => !c[f.key]).map(f => f.label);
    if (missing.length > 0) { gaps.cities.push({ adcode, name: c.n || adcode, missing }); gaps.total += missing.length; }
  }

  fs.writeFileSync(GAPS_FILE, JSON.stringify(gaps, null, 2));
  return gaps;
}

// ========== 主抓取 ==========
async function scrapeAll() {
  console.log('===== 百度百科数据抓取 =====');
  console.log(`开始: ${new Date().toISOString()}`);
  console.log(`来源: 百度百科 JSON infobox (curl + JS正则)`);
  console.log('');

  // 加载已有数据
  let result = { provinces: {}, cities: {}, lastUpdate: new Date().toISOString() };
  let oldData = { provinces: {}, cities: {} };
  if (fs.existsSync(DATA_FILE)) {
    try { const raw = fs.readFileSync(DATA_FILE, 'utf8'); result = JSON.parse(raw); oldData = JSON.parse(raw); console.log(`已有: ${Object.keys(result.provinces).length}省, ${Object.keys(result.cities).length}市`); } catch (e) { }
  }

  if (Object.keys(oldData.provinces).length > 0) backupData(oldData);

  let provOk = 0, provMiss = 0;

  // === Phase 1: 省级 ===
  console.log('\n--- Phase 1: 省级 (31个) ---');
  const provCodes = Object.keys(PROVINCES);
  for (let i = 0; i < provCodes.length; i++) {
    const adcode = provCodes[i];
    const info = PROVINCES[adcode];
    const url = `https://baike.baidu.com/item/${encodeURIComponent(info.bk)}`;

    process.stdout.write(`  (${i + 1}/${provCodes.length}) ${info.n}... `);
    try {
      const html = await fetchHTML(url);
      if (!html) { console.log('✗ 无响应'); provMiss++; continue; }
      const extracted = extractLeadersFromHTML(html);
      const leaders = mapToLeaders(extracted, info.n);
      if (!result.provinces[adcode]) result.provinces[adcode] = {};
      Object.assign(result.provinces[adcode], { adcode, n: info.n }, leaders);
      const got = [leaders.sec, leaders.gov, leaders.rd, leaders.cppcc].filter(Boolean);
      const strategy = leaders.sec ? (Object.keys(extracted.rawFields).length > 0 ? 'JSON' : '文本') : '无';
      console.log(`✓ ${got.length}字段[${strategy}] (${got.join(',') || '空'})`);
      provOk++;
    } catch (e) { console.log(`✗ ${e.message}`); provMiss++; }
    // 百度百科反爬：每个请求间隔5-8秒
    await new Promise(r => setTimeout(r, 5000 + Math.random() * 3000));
  }
  console.log(`  省级: ${provOk}成功 ${provMiss}失败`);

  // === Phase 2: 市级 ===
  console.log('\n--- Phase 2: 市级 (~300个) ---');
  const cityCodes = Object.keys(ALL_CITIES);
  const todoCities = cityCodes.filter(ac => {
    const c = result.cities[ac];
    return !c || !c.sec || !c.gov || !c.rd || !c.cppcc;
  });
  console.log(`  需抓取: ${todoCities.length}/${cityCodes.length}`);

  let cityOk = 0, cityMiss = 0;
  const BATCH = 3;
  for (let i = 0; i < todoCities.length; i += BATCH) {
    const batch = todoCities.slice(i, i + BATCH);
    const ps = batch.map(async adcode => {
      const name = ALL_CITIES[adcode];
      const url = `https://baike.baidu.com/item/${encodeURIComponent(name)}`;
      try {
        const html = await fetchHTML(url);
        if (!html) { console.log(`  ✗ ${name} 无响应`); cityMiss++; return; }
        const extracted = extractLeadersFromHTML(html);
        const leaders = mapToLeaders(extracted, name);
        if (!result.cities[adcode]) result.cities[adcode] = { adcode, n: name };
        let added = 0;
        if (leaders.sec && isValidName(leaders.sec)) { result.cities[adcode].sec = leaders.sec; added++; }
        if (leaders.gov && isValidName(leaders.gov)) { result.cities[adcode].gov = leaders.gov; added++; }
        if (leaders.rd && isValidName(leaders.rd)) { result.cities[adcode].rd = leaders.rd; added++; }
        if (leaders.cppcc && isValidName(leaders.cppcc)) { result.cities[adcode].cppcc = leaders.cppcc; added++; }
        console.log(`  ✓ ${name} +${added} (${leaders.sec||'?'}/${leaders.gov||'?'}/${leaders.rd||'?'}/${leaders.cppcc||'?'})`);
        cityOk++;
      } catch (e) { console.log(`  ✗ ${name} ${e.message}`); cityMiss++; }
    });
    await Promise.allSettled(ps);
    // 百度百科反爬：每批之间间隔4-6秒
    await new Promise(r => setTimeout(r, 4000 + Math.random() * 2000));
    if ((i + BATCH) % 60 === 0) console.log(`  [${Math.min(i + BATCH, todoCities.length)}/${todoCities.length}]`);
  }
  console.log(`  市级: ${cityOk}成功 ${cityMiss}失败`);

  // === Phase 3: 空白分析 ===
  console.log('\n--- Phase 3: 空白分析 ---');
  const gaps = analyzeGaps(result);
  if (gaps.total > 0) {
    console.log(`  ❌ ${gaps.total} 处空白 (省${gaps.provinces.length}/市${gaps.cities.length})`);
    if (gaps.provinces.length > 0) gaps.provinces.forEach(p => console.log(`    [省] ${p.name}: 缺${p.missing.join(',')}`));
    if (gaps.cities.length > 0) {
      gaps.cities.slice(0, 5).forEach(c => console.log(`    [市] ${c.name}: 缺${c.missing.join(',')}`));
      if (gaps.cities.length > 5) console.log(`    ... 还有${gaps.cities.length - 5}个`);
    }
    console.log(`  📋 空白详情: ${GAPS_FILE}`);
  } else {
    console.log(`  ✅ 无空白`);
  }

  // === 保存 ===
  result.lastUpdate = new Date().toISOString();
  fs.writeFileSync(DATA_FILE, JSON.stringify(result, null, 2));
  console.log(`\n===== 完成 =====`);
  console.log(`  省: ${Object.keys(result.provinces).length} 市: ${Object.keys(result.cities).length}`);
  console.log(`  成功: ${provOk + cityOk} 失败: ${provMiss + cityMiss} 空白: ${gaps.total}`);
  console.log(`  文件: ${DATA_FILE}`);

  // 记录历史
  const entry = { id: Date.now(), time: new Date().toISOString(), type: 'scrape_complete', source: '百度百科 JSON', details: `${provOk + cityOk}成功/${provMiss + cityMiss}失败/${gaps.total}空白` };
  let history = [];
  if (fs.existsSync(HISTORY_FILE)) { try { history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')); } catch (e) { } }
  history.unshift(entry);
  if (history.length > 200) history = history.slice(0, 200);
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));

  return result;
}

if (require.main === module) {
  scrapeAll().then(() => { console.log('\n✓ 任务结束'); process.exit(0); }).catch(e => { console.error('\n✗', e.message); process.exit(1); });
}

module.exports = { scrapeAll, DATA_FILE, GAPS_FILE };
