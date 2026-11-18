/* Tarjetas para compartir con los colores de la bandera de Israel (sin código QR) */
(function () {
  const C = {
    blue: '#0038B8', blueDeep: '#00267D', white: '#FFFFFF', tint: '#EEF3FD',
    ink: '#12204A', gold: '#D4A62A', goldInk: '#9A7414'
  };
  const SIZES = { post: [1080, 1350], story: [1080, 1920], og: [1200, 630] };
  let cover = null;
  function loadCover(base) {
    if (cover) return Promise.resolve(cover);
    return new Promise(res => {
      const im = new Image();
      im.onload = () => { cover = im; res(im); };
      im.onerror = () => res(null);
      im.src = (base || '') + 'img/portada-512.jpg';
    });
  }
  async function fontsReady() {
    if (!document.fonts) return;
    try {
      await Promise.all([
        document.fonts.load('700 80px "Cormorant Garamond"'),
        document.fonts.load('600 80px "Cormorant Garamond"'),
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
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
    }
    if (line) lines.push(line);
    return lines;
  }
  function fit(ctx, text, fontFn, maxW, maxLines, start, min) {
    let lines;
    for (let size = start; size >= min; size -= 2) {
      ctx.font = fontFn(size); lines = wrap(ctx, text, maxW);
      if (lines.length <= maxLines) return { size, lines };
    }
    ctx.font = fontFn(min); lines = wrap(ctx, text, maxW);
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      let last = lines[maxLines - 1];
      while (ctx.measureText(last + '…').width > maxW && last.includes(' ')) last = last.slice(0, last.lastIndexOf(' '));
      lines[maxLines - 1] = last.replace(/[,;:.\s]+$/, '') + '…';
    }
    return { size: min, lines };
  }
  function star(ctx, cx, cy, r, color, width, fill) {
    const tri = (rot) => {
      ctx.beginPath();
      for (let k = 0; k < 3; k++) {
        const a = rot + k * 2 * Math.PI / 3;
        const x = cx + r * Math.sin(a), y = cy - r * Math.cos(a);
        k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.closePath();
      if (fill) { ctx.fillStyle = color; ctx.fill(); } else { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.stroke(); }
    };
    tri(0); tri(Math.PI);
  }
  function spaced(ctx, text, x, y, spacing) {
    const chars = [...text];
    const widths = chars.map(c => ctx.measureText(c).width);
    const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
    let cx = x - total / 2; ctx.textAlign = 'left';
    chars.forEach((c, i) => { ctx.fillText(c, cx, y); cx += widths[i] + spacing; });
    ctx.textAlign = 'center';
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function medallion(ctx, img, x, y, s) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,38,125,.35)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10;
    ctx.fillStyle = C.gold; roundRect(ctx, x - 7, y - 7, s + 14, s + 14, 34); ctx.fill();
    ctx.restore();
    ctx.fillStyle = C.white; roundRect(ctx, x - 3, y - 3, s + 6, s + 6, 30); ctx.fill();
    if (img) { ctx.save(); roundRect(ctx, x, y, s, s, 28); ctx.clip(); ctx.drawImage(img, x, y, s, s); ctx.restore(); }
  }
  function field(ctx, W, H, top, bottom, band) {
    ctx.fillStyle = C.white; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, Math.max(W, H) * .65);
    g.addColorStop(0, 'rgba(238,243,253,0)'); g.addColorStop(1, 'rgba(214,226,250,.9)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // Estrella de David grande, muy suave, en el centro (como en la bandera)
    ctx.save(); ctx.globalAlpha = .06; star(ctx, W / 2, H / 2 + band * .2, Math.min(W, H) * .42, C.blue, band * .5); ctx.restore();
    // Franjas azules
    ctx.fillStyle = C.blue; ctx.fillRect(0, top, W, band); ctx.fillRect(0, bottom, W, band);
    ctx.fillStyle = C.gold; ctx.fillRect(0, top + band, W, 4); ctx.fillRect(0, bottom - 4, W, 4);
  }
  function shortUrl(u) { return u.replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/\.html$/, ''); }

  /* data: { kicker, title, quote, ref, url, chapter, prophecy? } */
  async function draw(canvas, data, format, base) {
    await fontsReady();
    const img = await loadCover(base);
    const [W, H] = SIZES[format] || SIZES.post;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center';
    if (format === 'og') return drawLandscape(ctx, W, H, data, img);

    const story = format === 'story';
    const band = story ? 110 : 92, top = story ? 90 : 56, bottom = H - top - band;
    field(ctx, W, H, top, bottom, band);
    const cx = W / 2, inner = W - 180;

    // Texto dentro de la franja superior
    ctx.fillStyle = C.white; ctx.font = `600 ${story ? 34 : 30}px "Literata", Georgia, serif`;
    spaced(ctx, data.kicker.toUpperCase(), cx, top + band / 2 + 11, 4);
    // Franja inferior: ministerio y enlace
    ctx.font = `700 ${story ? 40 : 34}px "Cormorant Garamond", Georgia, serif`;
    ctx.fillText('Yeshúa La Torá Viviente', cx, bottom + band * .45);
    ctx.font = `600 ${story ? 26 : 22}px "Literata", Georgia, serif`; ctx.fillStyle = '#DCE6FF';
    ctx.fillText(shortUrl(data.url), cx, bottom + band * .82);

    // Medallón con la portada
    const ms = story ? 470 : 300;
    let y = top + band + (story ? 70 : 44);
    medallion(ctx, img, cx - ms / 2, y, ms);
    y += ms + (story ? 70 : 44);
    const areaTop = y, areaBottom = bottom - (story ? 60 : 36);

    // Medidas
    const t = fit(ctx, data.title, s => `700 ${s}px "Cormorant Garamond", Georgia, serif`, inner, 3, story ? 118 : 88, 52);
    const tlh = t.size * 1.04, titleH = t.size * .8 + (t.lines.length - 1) * tlh;
    let pr = null, prH = 0;
    if (data.prophecy) {
      pr = fit(ctx, data.prophecy, s => `italic 400 ${s}px "Literata", Georgia, serif`, inner - 40, 3, story ? 40 : 30, 22);
      prH = pr.size + (pr.lines.length - 1) * pr.size * 1.4 + (story ? 56 : 40);
    }
    const gapT = story ? 78 : 62, gapD = story ? 64 : 50;
    const room = (areaBottom - areaTop) - titleH - gapT - gapD - prH - 70;
    const q = fit(ctx, '“' + data.quote + '”', s => `italic 400 ${s}px "Literata", Georgia, serif`, inner, Math.max(2, Math.floor(room / ((story ? 60 : 46) * 1.45))), story ? 60 : 46, 26);
    const qlh = q.size * 1.45, quoteH = q.size + (q.lines.length - 1) * qlh;
    const total = titleH + gapT + gapD + prH + quoteH + 62;
    y = areaTop + Math.max(0, (areaBottom - areaTop - total) / 2);

    ctx.fillStyle = C.blue; ctx.font = `700 ${t.size}px "Cormorant Garamond", Georgia, serif`;
    t.lines.forEach((l, i) => ctx.fillText(l, cx, y + t.size * .8 + i * tlh));
    y += titleH + gapT;
    // Divisor con estrella
    ctx.strokeStyle = C.gold; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx - 170, y); ctx.lineTo(cx - 34, y); ctx.moveTo(cx + 34, y); ctx.lineTo(cx + 170, y); ctx.stroke();
    star(ctx, cx, y, 20, C.blue, 4);
    y += gapD;
    if (pr) {
      ctx.fillStyle = C.blue; ctx.font = `italic 400 ${pr.size}px "Literata", Georgia, serif`;
      pr.lines.forEach((l, i) => ctx.fillText(l, cx, y + pr.size * .85 + i * pr.size * 1.4));
      y += prH;
    }
    ctx.fillStyle = C.ink; ctx.font = `italic 400 ${q.size}px "Literata", Georgia, serif`;
    q.lines.forEach((l, i) => ctx.fillText(l, cx, y + q.size * .85 + i * qlh));
    y += quoteH + 62;
    ctx.fillStyle = C.goldInk; ctx.font = `700 ${story ? 44 : 38}px "Cormorant Garamond", Georgia, serif`;
    ctx.fillText(data.ref, cx, y);
    return canvas;
  }

  function drawLandscape(ctx, W, H, data, img) {
    const band = 52, top = 26, bottom = H - top - band;
    field(ctx, W, H, top, bottom, band);
    ctx.fillStyle = C.white; ctx.font = '600 20px "Literata", Georgia, serif';
    spaced(ctx, data.kicker.toUpperCase(), W / 2, top + band / 2 + 7, 3);
    ctx.font = '700 26px "Cormorant Garamond", Georgia, serif';
    ctx.fillText('Yeshúa La Torá Viviente · Ministerio Judío Mesiánico', W / 2, bottom + band / 2 + 9);
    const ms = 360, mx = 70, my = top + band + (bottom - top - band - ms) / 2;
    medallion(ctx, img, mx, my, ms);
    const colX = mx + ms + 60, colW = W - colX - 60, cx = colX + colW / 2;
    const t = fit(ctx, data.title, s => `700 ${s}px "Cormorant Garamond", Georgia, serif`, colW, 3, 66, 40);
    const q = fit(ctx, '“' + data.quote + '”', s => `italic 400 ${s}px "Literata", Georgia, serif`, colW, 4, 26, 19);
    const tH = t.size * .8 + (t.lines.length - 1) * t.size * 1.04, qH = q.size + (q.lines.length - 1) * q.size * 1.4;
    const total = tH + 40 + 34 + qH + 44;
    let y = top + band + (bottom - top - band - total) / 2;
    ctx.fillStyle = C.blue; ctx.font = `700 ${t.size}px "Cormorant Garamond", Georgia, serif`;
    t.lines.forEach((l, i) => ctx.fillText(l, cx, y + t.size * .8 + i * t.size * 1.04));
    y += tH + 40;
    ctx.strokeStyle = C.gold; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(cx - 120, y); ctx.lineTo(cx - 24, y); ctx.moveTo(cx + 24, y); ctx.lineTo(cx + 120, y); ctx.stroke();
    star(ctx, cx, y, 14, C.blue, 3);
    y += 34;
    ctx.fillStyle = C.ink; ctx.font = `italic 400 ${q.size}px "Literata", Georgia, serif`;
    q.lines.forEach((l, i) => ctx.fillText(l, cx, y + q.size * .85 + i * q.size * 1.4));
    y += qH + 44;
    ctx.fillStyle = C.goldInk; ctx.font = '700 30px "Cormorant Garamond", Georgia, serif';
    ctx.fillText(data.ref, cx, y);
  }

  window.ShareCard = { draw, SIZES, colors: C };
})();
