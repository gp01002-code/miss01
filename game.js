// Prism Run - js13kGames 2026 "Unicorns and Rainbows"
(function () {
  var C = ["#FF4D6D", "#FF8A3D", "#FFD93D", "#5CE07A", "#35D6D6", "#4D8CFF", "#B06BFF"];
  var RGB = [[255,77,109],[255,138,61],[255,217,61],[92,224,122],[53,214,214],[77,140,255],[176,107,255]];
  var cv = document.getElementById("c"), g = cv.getContext("2d");
  var CW = 480, CH = 540, OY = 92, FH = 380;
  var W = 420, F = 520, CAM = 520, BR = 17, TK = 0.34, G = 0.62;
  var V = 255, H = V * CAM * (CAM + W) / (F * W), HZ = FH / 2 - H * F / (CAM + W / 2) + OY;
  var yaw = 18 * Math.PI / 180, ca = Math.cos(yaw), sa = Math.sin(yaw);
  var dpr = window.devicePixelRatio || 1;
  cv.width = CW * dpr; cv.height = CH * dpr;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);

  function fit() {
    var w = window.innerWidth, h = window.innerHeight, s = Math.min(w / CW, h / CH);
    cv.style.width = (CW * s) + "px";
    cv.style.height = (CH * s) + "px";
  }
  window.addEventListener("resize", fit);
  fit();

  var stars = [];
  for (var i = 0; i < 60; i++) stars.push({
    x: Math.random() * CW, y: OY + Math.random() * FH * 0.5,
    r: Math.random() * 1.1 + 0.3, a: Math.random() * 0.5 + 0.2, p: Math.random() * 7
  });
  var sky = g.createLinearGradient(0, 0, 0, CH);
  sky.addColorStop(0, "#07060f"); sky.addColorStop(0.5, "#120e26"); sky.addColorStop(1, "#1b1338");

  var S = {}, btns = [], last = 0, fr = 0, TX = 0, TZ = 0, QX = 0, QZ = 0, mute = 0, AC = null, dg = null;
  var TILT = 0, cal = null, GX = 0, GY = 0, tiltSeen = 0, tiltOff = 0;
  var primaryBtn = null, xrOK = 0, inXR = 0, XGX = 0, XGZ = 0;

  function mod(n) { return ((n % 7) + 7) % 7; }
  function apo(v, o) { return o.k === "+" ? v + o.n : o.k === "-" ? v - o.n : v * o.n; }
  function lb(o) { return (o.k === "*" ? "\u00d7" : o.k) + o.n; }
  function rgba(i, a) { var c = RGB[i]; return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")"; }

  function audio() {
    if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (AC && AC.state === "suspended") AC.resume();
  }
  function beep(f, d, ty, vol, f2) {
    if (!AC || mute) return;
    try {
      var o = AC.createOscillator(), gn = AC.createGain(), t = AC.currentTime;
      o.type = ty || "square";
      o.frequency.setValueAtTime(f, t);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
      gn.gain.setValueAtTime(0, t);
      gn.gain.linearRampToValueAtTime(vol || 0.12, t + 0.012);
      gn.gain.exponentialRampToValueAtTime(0.0008, t + d);
      o.connect(gn); gn.connect(AC.destination);
      o.start(t); o.stop(t + d + 0.02);
    } catch (e) {}
  }
  var SCA = [0, 2, 4, 5, 7, 9, 11];
  function sPick(m) {
    beep(330 * Math.pow(2, SCA[m] / 12), 0.16, "triangle", 0.14);
    beep(660 * Math.pow(2, SCA[m] / 12), 0.09, "sine", 0.06);
  }
  function sWall() { beep(90, 0.07, "sine", 0.07); }
  function sWin() {
    [0, 4, 7, 12].forEach(function (n, i) {
      setTimeout(function () { beep(440 * Math.pow(2, n / 12), 0.28, "triangle", 0.12); }, i * 95);
    });
  }
  function sFail() { beep(200, 0.5, "sawtooth", 0.11, 60); }
  function sTick() { beep(880, 0.05, "square", 0.05); }

  function hAt(x, z) { return -((x - W / 2) * TX + (z - W / 2) * TZ) * TK; }
  function pj(x, z, h) {
    var a = x - W / 2, b = z - W / 2, rx = a * ca - b * sa, rz = a * sa + b * ca;
    var d = rz + W / 2, s = F / (d + CAM);
    return { x: CW / 2 + rx * s, y: HZ + (H - (h || 0)) * s, s: s, d: d };
  }
  function pg(x, z, up) { return pj(x, z, hAt(x, z) + (up || 0)); }
  function rop() {
    var p = [{k:"+",n:1},{k:"+",n:2},{k:"+",n:3},{k:"+",n:5},{k:"-",n:2},{k:"-",n:4},{k:"*",n:2}];
    return p[Math.floor(Math.random() * p.length)];
  }

  var TUT = [
    { v0: 1, tg: mod(4), T: 0, hint: "Roll into the prism. Its beam shows the colour you will become.",
      bs: [{ x: 230, z: 250, o: { k: "+", n: 3 } }] },
    { v0: 2, tg: mod(6), T: 0, hint: "You need both beads this time. Colour = your number mod 7.",
      bs: [{ x: 150, z: 280, o: { k: "+", n: 3 } }, { x: 300, z: 160, o: { k: "+", n: 1 } }] },
    { v0: 2, tg: mod(10), T: 45, hint: "Order matters. +3 then \u00d72 is not the same as \u00d72 then +3.",
      bs: [{ x: 140, z: 250, o: { k: "+", n: 3 } }, { x: 310, z: 210, o: { k: "*", n: 2 } }] },
    { v0: 3, tg: mod(12), T: 36, hint: "One bead is a trap. Beads come back a few seconds after you take them.",
      bs: [{ x: 130, z: 270, o: { k: "+", n: 5 } }, { x: 280, z: 300, o: { k: "*", n: 2 } },
           { x: 300, z: 150, o: { k: "-", n: 4 } }, { x: 190, z: 180, o: { k: "+", n: 1 } }] },
    { v0: 1, tg: mod(12), T: 42,
      hint: "Prisms split light. Each beam is the colour you become if you hit that face.",
      bs: [{ x: 145, z: 240, o: { k: "+", n: 5 }, o2: { k: "-", n: 2 }, ax: 0 },
           { x: 305, z: 235, o: { k: "*", n: 2 }, o2: { k: "+", n: 1 }, ax: 1.5708 }] }
  ];
  var SAFE = { v0: 2, tg: mod(((2 + 3) * 2) - 4), T: 32,
    bs: [{ x: 150, z: 150, o: { k: "+", n: 3 } }, { x: 300, z: 200, o: { k: "*", n: 2 } },
         { x: 180, z: 310, o: { k: "-", n: 4 } }, { x: 320, z: 330, o: { k: "+", n: 5 } },
         { x: 100, z: 230, o: { k: "*", n: 3 } }] };

  function gen() {
    for (var t = 0; t < 400; t++) {
      var v0 = 1 + Math.floor(Math.random() * 5), sol = [rop(), rop(), rop()], v = v0, ok = 1;
      for (var i = 0; i < 3; i++) { v = apo(v, sol[i]); if (v < 0) { ok = 0; break; } }
      if (!ok || mod(v) === mod(v0)) continue;
      var all = sol.concat([rop(), rop()]), bs = [], fail = 0;
      for (var i = 0; i < all.length; i++) {
        var placed = 0;
        for (var a = 0; a < 300; a++) {
          var x = 60 + Math.random() * (W - 120), z = 60 + Math.random() * (W - 120);
          if (Math.hypot(x - 60, z - W + 60) < 80) continue;
          if (Math.hypot(x - W + 70, z - 70) < 80) continue;
          var good = 1;
          for (var j = 0; j < bs.length; j++) if (Math.hypot(x - bs[j].x, z - bs[j].z) < 66) { good = 0; break; }
          if (good) { bs.push({ x: x, z: z, o: all[i], o2: rop(), ax: Math.random() * 6.283 }); placed = 1; break; }
        }
        if (!placed) { fail = 1; break; }
      }
      if (fail) continue;
      return { v0: v0, tg: mod(v), T: 32, bs: bs };
    }
    return SAFE;
  }
  function levelFor(n) { return n <= TUT.length ? TUT[n - 1] : gen(); }

  function start(lv) {
    if (!lv) lv = SAFE;
    S.lv = lv; S.v = lv.v0; S.x = 60; S.z = W - 60; S.vx = 0; S.vz = 0;
    S.st = 0; S.tr = []; S.fx = []; S.pa = [];
    S.fc = 1; S.T = lv.T || 0; S.T0 = lv.T || 0; S.shake = 0; S.warn = 0;
    QX = 0; QZ = 0; TX = 0; TZ = 0; dg = null;
    S.bs = lv.bs.map(function (b, i) { return { x: b.x, z: b.z, o: b.o, o2: b.o2 || b.o, ax: b.ax || 0, t: 0, ph: i * 1.7 }; });
    S.msg = lv.hint || "Tilt the board. Match the target colour, then reach the light.";
  }
  function toWorld(dx, dy) { return { x: dx * ca + (-dy) * sa, z: -dx * sa + (-dy) * ca }; }

  var K = {};
  window.addEventListener("keydown", function (e) {
    if (e.key.indexOf("Arrow") === 0) { K[e.key] = 1; e.preventDefault(); }
  });
  window.addEventListener("keyup", function (e) { K[e.key] = 0; });

  function oriAngle() {
    var a = (screen.orientation && screen.orientation.angle);
    if (a == null) a = window.orientation || 0;
    return a;
  }
  window.addEventListener("deviceorientation", function (e) {
    if (e.beta == null && e.gamma == null) return;
    if (!tiltSeen) {
      tiltSeen = 1;
      var D0 = window.DeviceOrientationEvent;
      if (!(D0 && D0.requestPermission) && !tiltOff) TILT = 1;
    }
    var b = e.beta || 0, gm = e.gamma || 0, a = oriAngle(), rx, ry;
    if (a === 90) { rx = b; ry = -gm; }
    else if (a === -90 || a === 270) { rx = -b; ry = gm; }
    else { rx = gm; ry = b; }
    if (!cal) cal = { x: rx, y: ry };
    GX = Math.max(-1, Math.min(1, (rx - cal.x) / 22));
    GY = Math.max(-1, Math.min(1, (ry - cal.y) / 22));
  });
  function enableTilt() {
    cal = null; GX = 0; GY = 0;
    var D = window.DeviceOrientationEvent;
    if (D && D.requestPermission) {
      D.requestPermission().then(function (r) {
        TILT = r === "granted" ? 1 : 0;
        S.msg = TILT ? "Tilt controls on. Hold the phone how you like \u2014 that is level."
                     : "Tilt permission was denied. Drag to play instead.";
      }).catch(function () { TILT = 0; });
    } else {
      TILT = 1;
      S.msg = "Tilt controls on. Hold the phone how you like \u2014 that is level.";
    }
  }

  function pt(e) {
    var r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) * CW / r.width, y: (e.clientY - r.top) * CH / r.height };
  }
  cv.addEventListener("pointerdown", function (e) {
    audio();
    var p = pt(e);
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      if (p.x > b.x && p.x < b.x + b.w && p.y > b.y && p.y < b.y + b.h) { b.f(); return; }
    }
    if (S.st === 0 && p.y > OY && p.y < OY + FH) { cv.setPointerCapture(e.pointerId); dg = p; }
  });
  cv.addEventListener("pointermove", function (e) {
    if (!dg) return;
    var p = pt(e), dx = p.x - dg.x, dy = p.y - dg.y, l = Math.hypot(dx, dy);
    if (l > 70) { dx *= 70 / l; dy *= 70 / l; }
    var w = toWorld(dx / 70, dy / 70); QX = w.x; QZ = w.z;
  });
  function drop() { dg = null; QX = 0; QZ = 0; }
  cv.addEventListener("pointerup", drop);
  cv.addEventListener("pointercancel", drop);

  function rr(x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  function chip(x, y, lab, ci, txt) {
    g.fillStyle = "#15122a"; rr(x, y, 108, 44, 10); g.fill();
    g.strokeStyle = "#2a2547"; g.lineWidth = 1; g.stroke();
    g.textAlign = "left"; g.textBaseline = "middle";
    g.fillStyle = "#8d86b8"; g.font = "500 10px system-ui,sans-serif"; g.fillText(lab, x + 11, y + 13);
    g.beginPath(); g.arc(x + 19, y + 30, 7, 0, 7); g.fillStyle = C[ci]; g.fill();
    g.fillStyle = "#d9d3f5"; g.font = "600 13px system-ui,sans-serif"; g.fillText(txt, x + 32, y + 30);
  }
  function unicorn(p, R, m, ang, fc, T, sp) {
    g.globalCompositeOperation = "lighter";
    var og = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, R * 3.6);
    og.addColorStop(0, rgba(m, 0.55)); og.addColorStop(0.4, rgba(m, 0.2)); og.addColorStop(1, rgba(m, 0));
    g.fillStyle = og; g.fillRect(p.x - R * 3.8, p.y - R * 3.8, R * 7.6, R * 7.6);
    g.globalCompositeOperation = "source-over";
    g.save(); g.translate(p.x, p.y); g.scale(fc, 1);
    g.lineCap = "round";
    var dr = Math.min(0.55, sp * 0.12);
    for (var i = 0; i < 6; i++) {
      var a1 = Math.PI * 0.58 + i * 0.17;
      var wv = Math.sin(T * 3.1 + i * 0.85) * 0.26;
      var ln = R * (1.45 + 0.3 * Math.sin(T * 2.3 + i * 1.1));
      g.beginPath();
      g.moveTo(Math.cos(a1) * R * 0.72, Math.sin(a1) * R * 0.72 - R * 0.1);
      g.quadraticCurveTo(
        Math.cos(a1 + wv) * R * 1.1 - dr * R * 0.5, Math.sin(a1 + wv) * R * 1.1 - R * 0.2,
        Math.cos(a1 + wv * 2.1) * ln - dr * R, Math.sin(a1 + wv * 2.1) * ln - R * 0.3);
      g.strokeStyle = C[(m + i + 1) % 7];
      g.lineWidth = Math.max(1.3, R * 0.15); g.globalAlpha = 0.9; g.stroke();
    }
    for (var i = 0; i < 4; i++) {
      var a2 = Math.PI * 1.02 + i * 0.12;
      var wv2 = Math.sin(T * 2.7 + i * 1.3) * 0.3;
      var ln2 = R * (1.35 + 0.28 * Math.sin(T * 2.1 + i));
      g.beginPath();
      g.moveTo(Math.cos(a2) * R * 0.8, Math.sin(a2) * R * 0.8);
      g.quadraticCurveTo(
        Math.cos(a2 + wv2) * R * 1.05 - dr * R * 0.6, Math.sin(a2 + wv2) * R * 1.05 + R * 0.16,
        Math.cos(a2 + wv2 * 2) * ln2 - dr * R * 1.2, Math.sin(a2 + wv2 * 2) * ln2 + R * 0.3);
      g.strokeStyle = C[(m + i + 3) % 7];
      g.lineWidth = Math.max(1.2, R * 0.13); g.globalAlpha = 0.85; g.stroke();
    }
    g.globalAlpha = 1;
    var sg = g.createRadialGradient(-R * 0.35, -R * 0.4, R * 0.1, 0, 0, R);
    sg.addColorStop(0, "#ffffff"); sg.addColorStop(0.35, C[m]); sg.addColorStop(1, rgba(m, 0.85));
    g.beginPath(); g.arc(0, 0, R, 0, 7); g.fillStyle = sg; g.fill();
    g.save();
    g.beginPath(); g.arc(0, 0, R * 0.96, 0, 7); g.clip();
    g.beginPath();
    g.moveTo(-R * 0.48, R * 0.86);
    g.quadraticCurveTo(-R * 0.5, R * 0.02, -R * 0.2, -R * 0.4);
    g.lineTo(-R * 0.3, -R * 0.82);
    g.lineTo(-R * 0.02, -R * 0.5);
    g.quadraticCurveTo(R * 0.3, -R * 0.54, R * 0.5, -R * 0.18);
    g.quadraticCurveTo(R * 0.72, R * 0.04, R * 0.6, R * 0.3);
    g.quadraticCurveTo(R * 0.42, R * 0.4, R * 0.18, R * 0.3);
    g.quadraticCurveTo(R * 0.02, R * 0.62, -R * 0.04, R * 0.9);
    g.closePath();
    g.fillStyle = "rgba(22,10,46,0.34)"; g.fill();
    g.restore();
    g.save(); g.translate(R * 0.14, 0); g.rotate(ang * 0.28);
    var hl = R * 1.5;
    g.beginPath(); g.moveTo(-R * 0.26, -R * 0.8); g.lineTo(R * 0.26, -R * 0.8); g.lineTo(0, -R * 0.8 - hl); g.closePath();
    var hg = g.createLinearGradient(0, -R * 0.8, 0, -R * 0.8 - hl);
    hg.addColorStop(0, "#fff6c9"); hg.addColorStop(1, "#ffffff");
    g.fillStyle = hg; g.fill();
    g.strokeStyle = "rgba(255,240,180,0.9)"; g.lineWidth = Math.max(0.8, R * 0.07);
    for (var i = 1; i <= 3; i++) {
      var t = i / 4, y = -R * 0.8 - hl * t, wd = R * 0.26 * (1 - t);
      g.beginPath(); g.moveTo(-wd, y); g.lineTo(wd, y - R * 0.1); g.stroke();
    }
    g.restore();
    g.restore();
    g.save(); g.translate(p.x, p.y);
    g.fillStyle = "rgba(255,255,255,0.9)";
    g.font = "700 " + Math.round(R * 0.6) + "px system-ui,sans-serif";
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(String(S.v), fc * R * 0.42, R * 0.5);
    g.restore();
  }
  function trail() {
    if (S.tr.length < 3) return;
    var P = [];
    for (var i = 0; i < S.tr.length; i++) { var q = pg(S.tr[i].x, S.tr[i].z, 3); P.push({ x: q.x, y: q.y, s: q.s }); }
    g.globalCompositeOperation = "lighter"; g.lineCap = "round";
    for (var b = 0; b < 7; b++) {
      g.beginPath();
      for (var i = 1; i < P.length - 1; i++) {
        var dx = P[i + 1].x - P[i - 1].x, dy = P[i + 1].y - P[i - 1].y, l = Math.hypot(dx, dy) || 1;
        var nx = -dy / l, ny = dx / l, off = (b - 3) * 2.6 * P[i].s;
        var x = P[i].x + nx * off, y = P[i].y + ny * off * 0.7;
        if (i === 1) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.strokeStyle = C[b]; g.globalAlpha = 0.42; g.lineWidth = 2.4; g.stroke();
    }
    g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
  }

  function tick(now) {
    var dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now; fr++;
    var T = fr * 0.05, m = mod(S.v);
    var kx = (K.ArrowRight ? 1 : 0) - (K.ArrowLeft ? 1 : 0);
    var ky = (K.ArrowDown ? 1 : 0) - (K.ArrowUp ? 1 : 0);
    if (S.st !== 0) { QX = 0; QZ = 0; }
    else if (kx || ky) {
      var kw = toWorld(kx, ky), kl = Math.hypot(kw.x, kw.z) || 1;
      QX = kw.x / kl; QZ = kw.z / kl;
    } else if (dg) {
      // pointer drag already set QX/QZ
    } else if (inXR) {
      var xw = toWorld(XGX, XGZ); QX = xw.x; QZ = xw.z;
    } else if (TILT) {
      var tw = toWorld(GX, GY); QX = tw.x; QZ = tw.z;
    } else { QX = 0; QZ = 0; }
    TX += (QX - TX) * 0.14; TZ += (QZ - TZ) * 0.14;

    if (S.st === 0) {
      if (S.T0 > 0) {
        S.T -= dt;
        if (S.T <= 6 && S.T > 0) { var w = Math.ceil(S.T); if (w !== S.warn) { S.warn = w; sTick(); } }
        if (S.T <= 0) { S.T = 0; S.st = 2; S.msg = "Out of time."; sFail(); }
      }
      S.vx += TX * G; S.vz += TZ * G;
      S.vx *= 0.965; S.vz *= 0.965;
      S.x += S.vx; S.z += S.vz;
      var hit = 0;
      if (S.x < BR) { S.x = BR; S.vx = -S.vx * 0.6; hit = 1; }
      if (S.x > W - BR) { S.x = W - BR; S.vx = -S.vx * 0.6; hit = 1; }
      if (S.z < BR) { S.z = BR; S.vz = -S.vz * 0.6; hit = 1; }
      if (S.z > W - BR) { S.z = W - BR; S.vz = -S.vz * 0.6; hit = 1; }
      if (hit && Math.hypot(S.vx, S.vz) > 1.2) sWall();
      S.tr.push({ x: S.x, z: S.z });
      if (S.tr.length > 30) S.tr.shift();
      for (var i = 0; i < S.bs.length; i++) {
        var b = S.bs[i];
        if (b.t > 0) { b.t--; continue; }
        if (Math.hypot(S.x - b.x, S.z - b.z) < BR + 19) {
          var ang = Math.atan2(S.z - b.z, S.x - b.x);
          var use = Math.cos(ang - b.ax) >= 0 ? b.o : b.o2;
          b.t = 190; S.v = apo(S.v, use);
          if (S.v > 999) S.v = 999;
          var nm = mod(S.v); S.shake = 7;
          S.fx.push({ x: b.x, z: b.z, t: 0, c: nm });
          for (var q = 0; q < 9; q++) {
            var an = Math.random() * 7, sp = 1 + Math.random() * 2.4;
            S.pa.push({ x: b.x, z: b.z, h: 46, vx: Math.cos(an) * sp, vz: Math.sin(an) * sp,
              vh: 2 + Math.random() * 3, t: 0, c: (nm + q) % 7 });
          }
          if (S.v < 0) { S.st = 2; S.msg = "Your number went negative. The light went out."; sFail(); }
          else { S.msg = "Hit the " + lb(use) + " face \u2192 " + S.v + "  \u00b7  mod 7 = " + nm; sPick(nm); }
        }
      }
      if (Math.hypot(S.x - (W - 70), S.z - 70) < 32 && mod(S.v) === S.lv.tg) {
        S.st = 1; S.bonus = Math.round(S.T) * 10; S.score += 100 + S.bonus;
        S.shake = 10; S.msg = "Colour matched."; sWin();
      }
    }
    for (var i = S.pa.length - 1; i >= 0; i--) {
      var pp = S.pa[i];
      pp.x += pp.vx; pp.z += pp.vz; pp.h += pp.vh; pp.vh -= 0.35; pp.t++;
      if (pp.h < 0 || pp.t > 50) S.pa.splice(i, 1);
    }
    if (S.shake > 0) S.shake *= 0.86;
    var jx = (Math.random() - 0.5) * S.shake, jy = (Math.random() - 0.5) * S.shake;

    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = sky; g.fillRect(0, 0, CW, CH);
    g.translate(jx, jy);
    for (var i = 0; i < stars.length; i++) {
      var st = stars[i];
      g.globalAlpha = st.a * (0.6 + 0.4 * Math.sin(T + st.p));
      g.fillStyle = "#cfc6ff"; g.beginPath(); g.arc(st.x, st.y, st.r, 0, 7); g.fill();
    }
    g.globalAlpha = 1;
    var cn = [[0, 0], [W, 0], [W, W], [0, W]], tp = [], bt = [];
    for (var i = 0; i < 4; i++) { tp.push(pg(cn[i][0], cn[i][1], 0)); bt.push(pg(cn[i][0], cn[i][1], -20)); }
    for (var i = 0; i < 4; i++) {
      var j = (i + 1) % 4;
      g.beginPath(); g.moveTo(tp[i].x, tp[i].y); g.lineTo(tp[j].x, tp[j].y);
      g.lineTo(bt[j].x, bt[j].y); g.lineTo(bt[i].x, bt[i].y); g.closePath();
      g.fillStyle = "#090715"; g.fill();
      g.strokeStyle = "rgba(150,130,255,0.16)"; g.lineWidth = 1; g.stroke();
    }
    g.beginPath(); g.moveTo(tp[0].x, tp[0].y);
    for (var i = 1; i < 4; i++) g.lineTo(tp[i].x, tp[i].y);
    g.closePath(); g.fillStyle = "#0d0a1c"; g.fill();
    g.strokeStyle = "rgba(160,140,255,0.30)"; g.lineWidth = 1.5; g.stroke();
    g.save(); g.clip();
    g.strokeStyle = "rgba(150,130,255,0.10)"; g.lineWidth = 1; g.beginPath();
    for (var i = 0; i <= 8; i++) {
      var t = i / 8 * W, p1 = pg(t, 0), p2 = pg(t, W), q1 = pg(0, t), q2 = pg(W, t);
      g.moveTo(p1.x, p1.y); g.lineTo(p2.x, p2.y); g.moveTo(q1.x, q1.y); g.lineTo(q2.x, q2.y);
    }
    g.stroke();
    var bp = pg(S.x, S.z, BR);
    g.globalCompositeOperation = "lighter";
    var lit = g.createRadialGradient(bp.x, bp.y, 0, bp.x, bp.y, 130 * bp.s);
    lit.addColorStop(0, rgba(m, 0.3)); lit.addColorStop(0.5, rgba(m, 0.1)); lit.addColorStop(1, rgba(m, 0));
    g.fillStyle = lit; g.fillRect(bp.x - 140 * bp.s, bp.y - 140 * bp.s, 280 * bp.s, 280 * bp.s);
    g.globalCompositeOperation = "source-over";
    trail();
    g.restore();

    var gp = pg(W - 70, 70), ents = [{ d: gp.d, k: 0 }, { d: bp.d, k: 2 }];
    for (var i = 0; i < S.bs.length; i++) {
      if (S.bs[i].t > 0 && S.bs[i].t >= 40) continue;
      ents.push({ d: pg(S.bs[i].x, S.bs[i].z).d, k: 1, b: S.bs[i] });
    }
    ents.sort(function (p, q) { return q.d - p.d; });
    g.textAlign = "center"; g.textBaseline = "middle";
    for (var i = 0; i < ents.length; i++) {
      var e = ents[i];
      if (e.k === 0) {
        var tgi = S.lv.tg, top = pg(W - 70, 70, 150), pul = 0.55 + 0.25 * Math.sin(T * 1.6);
        g.globalCompositeOperation = "lighter";
        var col = g.createLinearGradient(gp.x, gp.y, top.x, top.y);
        col.addColorStop(0, rgba(tgi, S.st === 1 ? 0.85 : 0.42)); col.addColorStop(1, rgba(tgi, 0));
        g.beginPath(); g.moveTo(gp.x - 30 * gp.s, gp.y); g.lineTo(gp.x + 30 * gp.s, gp.y);
        g.lineTo(top.x + 16 * top.s, top.y); g.lineTo(top.x - 16 * top.s, top.y); g.closePath();
        g.fillStyle = col; g.fill();
        var hg2 = g.createRadialGradient(gp.x, gp.y, 0, gp.x, gp.y, 60 * gp.s);
        hg2.addColorStop(0, rgba(tgi, 0.5)); hg2.addColorStop(1, rgba(tgi, 0));
        g.fillStyle = hg2; g.fillRect(gp.x - 64 * gp.s, gp.y - 64 * gp.s, 128 * gp.s, 128 * gp.s);
        g.globalCompositeOperation = "source-over";
        g.beginPath(); g.ellipse(gp.x, gp.y, 32 * gp.s, 24 * gp.s, 0, 0, 7);
        g.strokeStyle = rgba(tgi, pul); g.lineWidth = 2.5; g.stroke();
        g.fillStyle = rgba(tgi, 0.95); g.font = "700 13px system-ui,sans-serif";
        g.fillText("mod " + tgi, gp.x, gp.y - 3);
      } else if (e.k === 1) {
        var bb = e.b, al = bb.t > 0 ? (40 - bb.t) / 40 : 1;
        if (al < 0) al = 0;
        var bob = Math.sin(T * 1.3 + bb.ph) * 5, sh = pg(bb.x, bb.z), p = pg(bb.x, bb.z, 46 + bob);
        g.globalAlpha = 0.4 * al;
        g.beginPath(); g.ellipse(sh.x, sh.y, 15 * sh.s, 9 * sh.s, 0, 0, 7);
        g.fillStyle = "#05040c"; g.fill();
        g.globalAlpha = al;
        g.globalAlpha = al;
        var ux = Math.cos(bb.ax), uz = Math.sin(bb.ax);
        var ex = ux * ca - uz * sa, ey = (ux * sa + uz * ca) * 0.55;
        var el = Math.hypot(ex, ey) || 1; ex /= el; ey /= el;
        var R2 = 17 * p.s;
        var side = Math.cos(Math.atan2(S.z - bb.z, S.x - bb.x) - bb.ax) >= 0 ? 1 : -1;
        g.globalCompositeOperation = "lighter";
        for (var k = 0; k < 2; k++) {
          var dir = k ? -1 : 1, fop = k ? bb.o2 : bb.o, fv = apo(S.v, fop);
          var live = dir === side, aM = (live ? 1 : 0.34) * al;
          var neg = fv < 0, rc = neg ? [150, 142, 172] : RGB[mod(fv)];
          var cs = "rgba(" + rc[0] + "," + rc[1] + "," + rc[2] + ",";
          var dx0 = ex * dir, dy0 = ey * dir;
          var lg = g.createLinearGradient(p.x, p.y, p.x + dx0 * R2 * 4.4, p.y + dy0 * R2 * 4.4);
          lg.addColorStop(0, cs + (0.9 * aM) + ")");
          lg.addColorStop(0.4, cs + (0.42 * aM) + ")");
          lg.addColorStop(1, cs + "0)");
          g.strokeStyle = lg; g.lineCap = "round";
          for (var j = -3; j <= 3; j++) {
            var t = j / 3, an = t * 0.34, cn = Math.cos(an), sn = Math.sin(an);
            var rx = dx0 * cn - dy0 * sn, ry = dx0 * sn + dy0 * cn;
            var len = R2 * (4.1 - Math.abs(t) * 1.5), wd = R2 * (0.17 - Math.abs(t) * 0.055);
            g.lineWidth = Math.max(0.7, wd);
            g.beginPath();
            g.moveTo(p.x + rx * R2 * 0.12, p.y + ry * R2 * 0.12);
            g.lineTo(p.x + rx * len, p.y + ry * len);
            g.stroke();
          }
          if (live && !neg && mod(fv) === S.lv.tg) {
            g.strokeStyle = "rgba(255,255,255," + (0.5 * al) + ")";
            g.lineWidth = Math.max(0.8, R2 * 0.09);
            g.beginPath();
            g.moveTo(p.x + dx0 * R2 * 0.12, p.y + dy0 * R2 * 0.12);
            g.lineTo(p.x + dx0 * R2 * 3.6, p.y + dy0 * R2 * 3.6);
            g.stroke();
          }
          var fg = g.createRadialGradient(p.x + dx0 * R2 * 0.3, p.y + dy0 * R2 * 0.3, 0,
                                          p.x + dx0 * R2 * 0.3, p.y + dy0 * R2 * 0.3, R2 * 1.7);
          fg.addColorStop(0, cs + (0.45 * aM) + ")"); fg.addColorStop(1, cs + "0)");
          g.fillStyle = fg;
          g.fillRect(p.x + dx0 * R2 * 0.3 - R2 * 1.8, p.y + dy0 * R2 * 0.3 - R2 * 1.8, R2 * 3.6, R2 * 3.6);
          g.globalAlpha = aM;
          g.fillStyle = neg ? "#9b93b5" : C[mod(fv)];
          g.font = "700 " + Math.round(12 * p.s) + "px system-ui,sans-serif";
          g.fillText(lb(fop), p.x + dx0 * R2 * 3.1, p.y + dy0 * R2 * 3.1);
          g.globalAlpha = al;
        }
        g.globalCompositeOperation = "lighter";
        var kg = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, R2 * 1.3);
        kg.addColorStop(0, "rgba(255,255,255," + (0.95 * al) + ")");
        kg.addColorStop(0.22, "rgba(224,212,255," + (0.35 * al) + ")");
        kg.addColorStop(1, "rgba(190,170,255,0)");
        g.fillStyle = kg;
        g.fillRect(p.x - R2 * 1.35, p.y - R2 * 1.35, R2 * 2.7, R2 * 2.7);
        g.beginPath(); g.arc(p.x, p.y, R2 * 0.22, 0, 7);
        g.fillStyle = "rgba(255,255,255," + (0.95 * al) + ")"; g.fill();
        g.globalCompositeOperation = "source-over";
        g.globalAlpha = 1;
      } else {
        var sh = pg(S.x, S.z), R = BR * bp.s;
        g.globalAlpha = 0.45;
        g.beginPath(); g.ellipse(sh.x, sh.y, R, R * 0.6, 0, 0, 7);
        g.fillStyle = "#05040c"; g.fill();
        g.globalAlpha = 1;
        var vex = S.vx * ca - S.vz * sa;
        if (Math.abs(vex) > 0.3) S.fc = vex > 0 ? 1 : -1;
        unicorn(bp, R, m, Math.max(-1, Math.min(1, vex * 0.18)), S.fc || 1, T, Math.hypot(S.vx, S.vz));
      }
    }
    g.globalCompositeOperation = "lighter";
    for (var i = 0; i < S.pa.length; i++) {
      var pp = S.pa[i], q = pg(pp.x, pp.z, pp.h);
      g.globalAlpha = Math.max(0, 1 - pp.t / 50);
      g.beginPath(); g.arc(q.x, q.y, 2.6 * q.s, 0, 7); g.fillStyle = C[pp.c]; g.fill();
    }
    g.globalAlpha = 1;
    for (var i = S.fx.length - 1; i >= 0; i--) {
      var f = S.fx[i]; f.t++;
      var p = pg(f.x, f.z, 46), ra = (18 + f.t * 1.8) * p.s;
      g.beginPath(); g.ellipse(p.x, p.y, ra, ra * 0.66, 0, 0, 7);
      g.strokeStyle = rgba(f.c, Math.max(0, 1 - f.t / 28)); g.lineWidth = 2.5; g.stroke();
      if (f.t > 28) S.fx.splice(i, 1);
    }
    g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;

    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = "#0a0816"; g.fillRect(0, 0, CW, OY);
    chip(14, 8, "YOUR NUMBER", m, S.v + "  \u00b7  mod " + m);
    chip(130, 8, "TARGET", S.lv.tg, "mod " + S.lv.tg);
    g.textAlign = "right"; g.textBaseline = "middle";
    g.fillStyle = "#8d86b8"; g.font = "500 10px system-ui,sans-serif";
    g.fillText("LEVEL " + S.lvn, CW - 46, 19);
    g.fillStyle = "#efeaff"; g.font = "700 18px system-ui,sans-serif";
    g.fillText(String(S.score || 0), CW - 46, 39);
    var bw = CW - 92;
    if (S.T0 > 0) {
      var tpr = Math.max(0, S.T / S.T0);
      g.fillStyle = "#221c40"; rr(14, 70, bw, 7, 3.5); g.fill();
      var tc = tpr > 0.5 ? "#5CE07A" : tpr > 0.22 ? "#FFD93D" : "#FF4D6D";
      g.fillStyle = tc; rr(14, 70, Math.max(5, bw * tpr), 7, 3.5); g.fill();
      g.textAlign = "right"; g.fillStyle = tc; g.font = "600 12px system-ui,sans-serif";
      g.fillText(S.T.toFixed(1) + "s", CW - 16, 74);
    } else {
      g.fillStyle = "#221c40"; rr(14, 70, bw, 7, 3.5); g.fill();
      g.textAlign = "right"; g.fillStyle = "#6d66a0"; g.font = "600 11px system-ui,sans-serif";
      g.fillText("NO TIMER", CW - 16, 74);
    }
    g.fillStyle = "#0a0816"; g.fillRect(0, OY + FH, CW, CH - OY - FH);
    g.textAlign = "left"; g.textBaseline = "middle";
    g.fillStyle = "#9d96c8"; g.font = "500 12px system-ui,sans-serif";
    g.fillText(S.msg, 16, OY + FH + 22);

    btns = []; primaryBtn = null;
    function mk(x, y, w, h, t, f, pri) {
      btns.push({ x: x, y: y, w: w, h: h, f: f });
      if (pri) primaryBtn = f;
      g.fillStyle = pri ? "#3a2f6e" : "#1a1533"; rr(x, y, w, h, 9); g.fill();
      g.strokeStyle = pri ? "#6d5cc4" : "#2a2547"; g.lineWidth = 1; g.stroke();
      g.textAlign = "center"; g.textBaseline = "middle";
      g.fillStyle = pri ? "#efeaff" : "#b9b2e0"; g.font = "600 13px system-ui,sans-serif";
      g.fillText(t, x + w / 2, y + h / 2);
    }
    mk(CW - 36, 14, 26, 26, mute ? "\u2715" : "\u266a", function () { mute = !mute; }, 0);
    if (TILT) mk(CW - 68, 14, 26, 26, "\u2316", function () { cal = null; }, 0);
    if (S.st === 3) {
      g.fillStyle = "rgba(8,6,20,0.86)"; g.fillRect(0, OY, CW, FH);
      g.textAlign = "center"; g.textBaseline = "middle";
      g.fillStyle = "#efeaff"; g.font = "700 34px system-ui,sans-serif";
      g.fillText("PRISM RUN", CW / 2, OY + 92);
      for (var i = 0; i < 7; i++) { g.fillStyle = C[i]; g.fillRect(CW / 2 - 98 + i * 28, OY + 116, 22, 4); }
      g.fillStyle = "#b9b2e0"; g.font = "500 14px system-ui,sans-serif";
      g.fillText("Your number mod 7 is your colour.", CW / 2, OY + 152);
      g.fillText("Roll through operators to change it.", CW / 2, OY + 174);
      g.fillText("Reach the light in the matching colour.", CW / 2, OY + 196);
      g.fillStyle = "#6d66a0"; g.font = "500 12px system-ui,sans-serif";
      g.fillText(TILT ? "Tilt your phone to tilt the board  \u00b7  drag also works"
                      : "Drag to tilt the board  \u00b7  arrow keys also work", CW / 2, OY + 228);
      mk(CW / 2 - 80, OY + 252, 160, 42, "Start", function () {
        var D = window.DeviceOrientationEvent;
        if (!TILT && !tiltOff && D && D.requestPermission) enableTilt();
        S.score = 0; S.lvn = 1; start(levelFor(1));
      }, 1);
      if (xrOK) mk(CW / 2 - 80, OY + 304, 160, 32, "Enter VR", startXR, 0);
      else if (tiltSeen || (window.DeviceOrientationEvent && window.DeviceOrientationEvent.requestPermission)) {
        mk(CW / 2 - 80, OY + 304, 160, 32, TILT ? "Tilt controls: on" : "Tilt controls: off",
          function () { if (TILT) { TILT = 0; tiltOff = 1; } else { tiltOff = 0; enableTilt(); } }, 0);
      }
    } else if (S.st === 0) {
      mk(CW - 104, OY + FH + 40, 90, 30, "Retry", function () { start(S.lv); }, 0);
      mk(CW - 206, OY + FH + 40, 90, 30, "Skip", function () { S.lvn++; start(levelFor(S.lvn)); }, 0);
    } else {
      g.fillStyle = "rgba(8,6,20,0.72)"; g.fillRect(0, OY, CW, FH);
      g.textAlign = "center"; g.textBaseline = "middle";
      if (S.st === 1) {
        g.fillStyle = "#efeaff"; g.font = "700 26px system-ui,sans-serif";
        g.fillText("CLEARED", CW / 2, OY + FH / 2 - 52);
        g.fillStyle = "#9d96c8"; g.font = "500 14px system-ui,sans-serif";
        g.fillText(S.T0 > 0 ? ("Time bonus +" + S.bonus + "  \u00b7  Score " + S.score) : ("Score " + S.score),
          CW / 2, OY + FH / 2 - 22);
        mk(CW / 2 - 70, OY + FH / 2 + 6, 140, 38, "Next level",
          function () { S.lvn++; start(levelFor(S.lvn)); }, 1);
      } else {
        g.fillStyle = "#FF4D6D"; g.font = "700 26px system-ui,sans-serif";
        g.fillText("FAILED", CW / 2, OY + FH / 2 - 52);
        g.fillStyle = "#9d96c8"; g.font = "500 14px system-ui,sans-serif";
        g.fillText(S.msg, CW / 2, OY + FH / 2 - 22);
        mk(CW / 2 - 70, OY + FH / 2 + 6, 140, 38, "Try again", function () { start(S.lv); }, 1);
        mk(CW / 2 - 70, OY + FH / 2 + 52, 140, 32, "Main menu", function () { S.st = 3; }, 0);
      }
    }
  }

  if (navigator.xr && navigator.xr.isSessionSupported) {
    navigator.xr.isSessionSupported("immersive-vr").then(function (o) { xrOK = o ? 1 : 0; }, function () {});
  }
  window.PR = {
    W: W, BR: BR, CW: CW, CH: CH, OY: OY, RGB: RGB, canvas: cv,
    mod: mod, apply: apo,
    state: function () { return S; },
    tilt: function () { return [TX, TZ]; },
    step: function (t) { try { tick(t); } catch (e) {} },
    ctl: function (x, z) { XGX = x; XGZ = z; },
    press: function () { if (primaryBtn) primaryBtn(); },
    enterXR: function () { inXR = 1; ca = 1; sa = 0; audio(); },
    exitXR: function () {
      inXR = 0; XGX = 0; XGZ = 0;
      ca = Math.cos(yaw); sa = Math.sin(yaw);
      requestAnimationFrame(loop);
    }
  };
  function startXR() { if (window.XR3D) window.XR3D(); }
  function loop(now) { if (inXR) return; try { tick(now || 0); } catch (e) {} requestAnimationFrame(loop); }
  S.score = 0; S.lvn = 1; start(levelFor(1)); S.st = 3;
  requestAnimationFrame(loop);
})();
