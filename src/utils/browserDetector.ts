export interface BrowserInfo {
  name: string;
  version: string;
  isMobile: boolean;
  isPC: boolean;
  type: 'standard' | 'baidu' | 'quark' | 'mi' | 'huawei' | 'oppo' | 'vivo' | 'other';
}

export function detectBrowser(): BrowserInfo {
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();
  
  let name = 'Unknown';
  let version = 'Unknown';
  let type: BrowserInfo['type'] = 'standard';
  let isMobile = false;
  let isPC = false;

  if (platform.includes('win') || platform.includes('mac') || platform.includes('linux')) {
    isPC = true;
  } else if (platform.includes('iphone') || platform.includes('ipad') || platform.includes('ipod') || userAgent.includes('mobile')) {
    isMobile = true;
  }

  if (userAgent.includes('micromessenger')) {
    name = '微信浏览器';
    type = 'standard';
  } else if (userAgent.includes('qqbrowser')) {
    name = 'QQ浏览器';
    type = 'standard';
  } else if (userAgent.includes('baidu') || userAgent.includes('baidubrowser')) {
    name = '百度浏览器';
    type = 'baidu';
  } else if (userAgent.includes('quark')) {
    name = '夸克浏览器';
    type = 'quark';
  } else if (userAgent.includes('miui') || userAgent.includes('xiaomi') || userAgent.includes('mi-browser')) {
    name = '小米浏览器';
    type = 'mi';
  } else if (userAgent.includes('huawei') || userAgent.includes('harmony')) {
    name = '华为浏览器';
    type = 'huawei';
  } else if (userAgent.includes('oppo') || userAgent.includes('coloros')) {
    name = 'OPPO浏览器';
    type = 'oppo';
  } else if (userAgent.includes('vivo') || userAgent.includes('funtouch')) {
    name = 'vivo浏览器';
    type = 'vivo';
  } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
    name = 'Safari';
    type = 'standard';
  } else if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
    name = 'Chrome';
    type = 'standard';
  } else if (userAgent.includes('edg')) {
    name = 'Edge';
    type = 'standard';
  } else if (userAgent.includes('firefox')) {
    name = 'Firefox';
    type = 'standard';
  } else if (userAgent.includes('opera') || userAgent.includes('opr')) {
    name = 'Opera';
    type = 'standard';
  } else {
    name = '其他浏览器';
    type = 'other';
  }

  const versionMatch = userAgent.match(/(chrome|firefox|safari|opera|edg|micromessenger|qqbrowser|baidu|quark|miui|huawei|oppo|vivo)\/?\s*([\d.]+)/i);
  if (versionMatch && versionMatch[2]) {
    version = versionMatch[2];
  }

  return {
    name,
    version,
    isMobile,
    isPC,
    type,
  };
}

export function getBrowserFixClass(): string {
  const browser = detectBrowser();
  
  switch (browser.type) {
    case 'baidu':
      return 'baidu-browser-fix';
    case 'quark':
      return 'quark-browser-fix';
    case 'mi':
      return 'mi-browser-fix';
    case 'huawei':
      return 'huawei-browser-fix';
    case 'oppo':
      return 'oppo-browser-fix';
    case 'vivo':
      return 'vivo-browser-fix';
    default:
      return '';
  }
}