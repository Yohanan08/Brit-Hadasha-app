/* Tarjetas para compartir: se dibujan en canvas con los colores del ministerio */
(function () {
  const C = {
    navy: '#0D223D', navyDeep: '#081729', navyLift: '#16345C',
    gold: '#CBA33F', goldSoft: '#E6CF8C', ivory: '#F3EFE9', ivoryDim: 'rgba(243,239,233,.72)'
  };
  const SIZES = {
    post: [1080, 1350],
    story: [1080, 1920],
    og: [1200, 630]
  };
  let logoImg = null;
  function loadLogo(base) {
    if (logoImg) return Promise.resolve(logoImg);
    return new Promise(res => {
      const im = new Image();
      im.onload = () => { logoImg = im; res(im); };
      im.onerror = () => res(null);
      im.src = (base || '') + 'img/logo-mark.png';
    });
  }
  async function fontsReady() {
    if (!document.fonts) return;
    try {
      await Promise.all([
        document.fonts.load('600 80px "Cormorant Garamond"'),
        document.fonts.load('500 80px "Cormorant Garamond"'),
        document.fonts.load('italic 500 40px "Cormorant Garamond"'),
        document.fonts.load('italic 400 40px "Literata"'),
        document.fonts.load('400 40px "Literata"'),
        document.fonts.load('600 40px "Literata"'),
        document.fonts.load('400 40px "Frank Ruhl Libre"')
      ]);
    } catch (e) {}
  }

  function wrap(ctx, text, maxW) {
    const words = text.split(/\s+/).filter(Boolean);
    const lines = []; let line = '';
    for (const w of words) {
      const t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; }
      else line = t;
    }
    if (line) lines.push(line);
    return lines;
  }
  // Busca el tamaño de letra más grande que cabe en maxLines
  function fit(ctx, text, fontFn, maxW, maxLines, start, min) {
    let size = start, lines;
    for (; size >= min; size -= 2) {
      ctx.font = fontFn(size);
      lines = wrap(ctx, text, maxW);
      if (lines.length <= maxLines) return { size, lines };
    }
    ctx.font = fontFn(min);
    lines = wrap(ctx, text, maxW);
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      let last = lines[maxLines - 1];
      while (ctx.measureText(last + '…').width > maxW && last.includes(' ')) last = last.slice(0, last.lastIndexOf(' '));
      lines[maxLines - 1] = last.replace(/[,;:.\s]+$/, '') + '…';
    }
    return { size: min, lines };
  }

  function background(ctx, W, H) {
    ctx.fillStyle = C.navy; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W / 2, H * 0.28, 10, W / 2, H * 0.28, Math.max(W, H) * 0.75);
    g.addColorStop(0, 'rgba(40,78,128,.55)'); g.addColorStop(1, 'rgba(8,23,41,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const g2 = ctx.createLinearGradient(0, H * 0.6, 0, H);
    g2.addColorStop(0, 'rgba(8,23,41,0)'); g2.addColorStop(1, 'rgba(8,23,41,.65)');
    ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
    // Marco doble dorado
    const m = Math.round(W * 0.035);
    ctx.strokeStyle = 'rgba(203,163,63,.85)'; ctx.lineWidth = 3;
    ctx.strokeRect(m, m, W - 2 * m, H - 2 * m);
    ctx.strokeStyle = 'rgba(203,163,63,.35)'; ctx.lineWidth = 1.5;
    ctx.strokeRect(m + 12, m + 12, W - 2 * m - 24, H - 2 * m - 24);
    // Esquinas
    ctx.fillStyle = C.gold;
    [[m, m], [W - m, m], [m, H - m], [W - m, H - m]].forEach(([x, y]) => diamond(ctx, x, y, 9));
  }
  function diamond(ctx, x, y, r) {
    ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath(); ctx.fill();
  }
  function divider(ctx, cx, y, half) {
    ctx.strokeStyle = C.gold; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - half, y); ctx.lineTo(cx - 18, y); ctx.moveTo(cx + 18, y); ctx.lineTo(cx + half, y); ctx.stroke();
    ctx.fillStyle = C.gold; diamond(ctx, cx, y, 8);
  }
  function spaced(ctx, text, x, y, spacing) {
    // texto centrado con espaciado entre letras
    const chars = [...text];
    const widths = chars.map(c => ctx.measureText(c).width);
    const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
    let cx = x - total / 2;
    ctx.textAlign = 'left';
    chars.forEach((c, i) => { ctx.fillText(c, cx, y); cx += widths[i] + spacing; });
    ctx.textAlign = 'center';
  }
  function qr(ctx, text, x, y, size) {
    if (typeof qrcode !== 'function') return false;
    const q = qrcode(0, 'M'); q.addData(text); q.make();
    const n = q.getModuleCount(); const pad = Math.round(size * 0.07);
    const cell = (size - pad * 2) / n;
    ctx.fillStyle = C.ivory; roundRect(ctx, x, y, size, size, 14); ctx.fill();
    ctx.fillStyle = C.navy;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c))
      ctx.fillRect(Math.floor(x + pad + c * cell), Math.floor(y + pad + r * cell), Math.ceil(cell), Math.ceil(cell));
    return true;
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function shortUrl(u) { return u.replace(/^https?:\/\//, '').replace(/\/$/, ''); }

  /* data: { kicker, title, quote, ref, url, chapter } */
  async function draw(canvas, data, format, base) {
    await fontsReady();
    const logo = await loadLogo(base);
    const [W, H] = SIZES[format] || SIZES.post;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center';
    background(ctx, W, H);
    if (format === 'og') return drawLandscape(ctx, W, H, data, logo);

    const cx = W / 2, inner = W - 200;
    const story = format === 'story';
    let y = story ? 170 : 120;
    if (logo) {
      const lw = W - 200, lh = lw * logo.height / logo.width;
      ctx.drawImage(logo, cx - lw / 2, y, lw, lh); y += lh;
    }
    y += story ? 80 : 50;
    ctx.fillStyle = C.gold; ctx.font = '600 30px "Literata", Georgia, serif';
    spaced(ctx, data.kicker.toUpperCase(), cx, y, 5);
    const top = y + 20;
    const qrSize = story ? 230 : 190;
    const bottomZone = story ? 470 : 330;
    const bottom = H - bottomZone + (story ? 60 : 30);
    // Medidas (primer paso) para centrar el bloque central
    const t = data.title ? fit(ctx, data.title, s => `600 ${s}px "Cormorant Garamond", Georgia, serif`, inner, 3, story ? 108 : 94, 58) : null;
    const tlh = t ? t.size * 1.08 : 0;
    const titleH = t ? t.size * 0.82 + (t.lines.length - 1) * tlh : 0;
    const gapA = story ? 70 : 50, gapB = story ? 80 : 62, gapC = story ? 66 : 50;
    const maxQ = (bottom - top) - titleH - gapA - gapB - gapC - 50;
    const q = fit(ctx, '“' + data.quote + '”', s => `italic 400 ${s}px "Literata", Georgia, serif`, inner - 20,
      Math.max(2, Math.floor(maxQ / 64)), story ? 54 : 48, 28);
    const qlh = q.size * 1.45;
    const quoteH = q.size + (q.lines.length - 1) * qlh;
    const total = titleH + gapA + gapB + quoteH + gapC + 30;
    y = top + Math.max(30, ((bottom - top) - total) / 2);
    if (t) {
      ctx.fillStyle = C.ivory; ctx.font = `600 ${t.size}px "Cormorant Garamond", Georgia, serif`;
      t.lines.forEach((l, i) => ctx.fillText(l, cx, y + t.size * 0.82 + i * tlh));
      y += titleH;
    }
    y += gapA;
    divider(ctx, cx, y, 150);
    y += gapB - q.size;
    ctx.font = `italic 400 ${q.size}px "Literata", Georgia, serif`;
    ctx.fillStyle = C.ivory;
    q.lines.forEach((l, i) => ctx.fillText(l, cx, y + q.size + i * qlh));
    y += quoteH + gapC;
    ctx.fillStyle = C.goldSoft; ctx.font = '500 42px "Cormorant Garamond", Georgia, serif';
    ctx.fillText(data.ref, cx, y + 10);

    // Pie: QR + llamada
    const by = H - bottomZone + (story ? 120 : 70);
    const blockW = qrSize + 40 + 520;
    const bx = cx - blockW / 2;
    const hasQR = qr(ctx, data.url, bx, by, qrSize);
    ctx.textAlign = 'left';
    const tx = hasQR ? bx + qrSize + 40 : cx - 260;
    ctx.fillStyle = C.ivory; ctx.font = '600 42px "Cormorant Garamond", Georgia, serif';
    ctx.fillText('Lee el estudio completo', tx, by + qrSize * 0.36);
    ctx.fillStyle = C.ivoryDim; ctx.font = '400 26px "Literata", Georgia, serif';
    ctx.fillText('Brit Hadasha · Besoráh de Mattityahu', tx, by + qrSize * 0.36 + 46);
    ctx.fillStyle = C.gold; ctx.font = '600 24px "Literata", Georgia, serif';
    const su = shortUrl(data.url);
    ctx.fillText(su.length > 42 ? su.slice(0, 41) + '…' : su, tx, by + qrSize * 0.36 + 92);
    ctx.textAlign = 'center';
    return canvas;
  }

  function drawLandscape(ctx, W, H, data, logo) {
    const cx = W / 2;
    let y = 64;
    if (logo) { const lw = 720, lh = lw * logo.height / logo.width; ctx.drawImage(logo, cx - lw / 2, y, lw, lh); y += lh; }
    y += 40;
    ctx.fillStyle = C.gold; ctx.font = '600 22px "Literata", Georgia, serif';
    spaced(ctx, data.kicker.toUpperCase(), cx, y, 4);
    y += 22;
    const t = fit(ctx, data.title, s => `600 ${s}px "Cormorant Garamond", Georgia, serif`, W - 200, 2, 78, 50);
    ctx.fillStyle = C.ivory; ctx.font = `600 ${t.size}px "Cormorant Garamond", Georgia, serif`;
    t.lines.forEach((l, i) => ctx.fillText(l, cx, y + t.size * 0.9 + i * t.size * 1.05));
    y += t.size * 0.9 + (t.lines.length - 1) * t.size * 1.05 + 38;
    divider(ctx, cx, y, 120); y += 30;
    const q = fit(ctx, '“' + data.quote + '”', s => `italic 400 ${s}px "Literata", Georgia, serif`, W - 240, 2, 30, 22);
    ctx.font = `italic 400 ${q.size}px "Literata", Georgia, serif`; ctx.fillStyle = C.ivory;
    q.lines.forEach((l, i) => ctx.fillText(l, cx, y + q.size + i * q.size * 1.4));
    y += q.size + (q.lines.length - 1) * q.size * 1.4 + 40;
    ctx.fillStyle = C.goldSoft; ctx.font = '500 30px "Cormorant Garamond", Georgia, serif';
    ctx.fillText(data.ref, cx, Math.min(y, H - 56));
  }

  window.ShareCard = { draw, SIZES, colors: C };
})();
