import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-quic", "--ignore-certificate-errors"] });
const page = await browser.newPage();
await page.goto("https://goperfumaria.com.br/perfumes-masculinos/", { waitUntil: "networkidle2", timeout: 30000 });
await page.evaluate(async () => { for(let i=0;i<10;i++){window.scrollBy(0,500);await new Promise(r=>setTimeout(r,200));} });
await new Promise(r=>setTimeout(r,2000));

const info = await page.evaluate(() => {
  // Procura todos os links de produto
  const links = document.querySelectorAll('a[href*="/produtos/"]');
  if (links.length === 0) return { error: "Nenhum link de produto" };
  
  // Pega o primeiro link válido
  let firstLink = null;
  for (const l of links) {
    const href = l.href;
    if (href.includes("/produtos/") && !href.endsWith("/produtos/") && href.split("/produtos/")[1].length > 2) {
      firstLink = l;
      break;
    }
  }
  if (!firstLink) return { error: "Nenhum link válido" };
  
  // Sobe a árvore e olha as classes
  const parents = [];
  let el = firstLink;
  for (let i = 0; i < 6; i++) {
    if (!el.parentElement) break;
    el = el.parentElement;
    parents.push({
      tag: el.tagName,
      classes: el.className,
      hasImg: !!el.querySelector("img"),
      hasPrice: (el.textContent || "").match(/R\$\s*\d/g)?.length || 0,
    });
  }
  
  return {
    totalLinks: links.length,
    firstLink: firstLink.href,
    parents,
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
