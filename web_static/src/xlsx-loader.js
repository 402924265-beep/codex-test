let xlsxPromise = null;

export function loadXlsx() {
  if (!xlsxPromise) {
    xlsxPromise = loadXlsxFromAvailableSource();
  }
  return xlsxPromise;
}

async function loadXlsxFromAvailableSource() {
  const moduleUrls = [
    "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/xlsx.mjs",
    "https://unpkg.com/xlsx@0.18.5/xlsx.mjs"
  ];

  for (const url of moduleUrls) {
    try {
      return await import(url);
    } catch (error) {
      console.warn(`XLSX module load failed: ${url}`, error);
    }
  }

  try {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js");
    if (window.XLSX) return window.XLSX;
  } catch (error) {
    console.warn("XLSX script fallback failed", error);
  }

  throw new Error("Excel解析库加载失败，请换个浏览器或网络后重试");
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`无法加载 ${src}`));
    document.head.appendChild(script);
  });
}
