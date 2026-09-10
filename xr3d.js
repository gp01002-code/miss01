// Minimal real-3D WebXR scene for the 13KB build.
(function () {
  function mul(a, b, o) {
    for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) {
      for (var v = 0, k = 0; k < 4; k++) v += a[k * 4 + j] * b[i * 4 + k];
      o[i * 4 + j] = v;
    }
    return o;
  }
  function trs(o, px, py, pz, sx, sy, sz, rx, rz) {
    var cx = Math.cos(rx), ax = Math.sin(rx), cz = Math.cos(rz), az = Math.sin(rz);
    o[0] = cz * sx; o[1] = az * sx; o[2] = 0; o[3] = 0;
    o[4] = -az * cx * sy; o[5] = cz * cx * sy; o[6] = ax * sy; o[7] = 0;
    o[8] = az * ax * sz; o[9] = -cz * ax * sz; o[10] = cx * sz; o[11] = 0;
    o[12] = px; o[13] = py; o[14] = pz; o[15] = 1;
    return o;
  }
  function boxG() {
    var p = [], n = [], x = [], f = [[0,0,1],[0,0,-1],[1,0,0],[-1,0,0],[0,1,0],[0,-1,0]];
    for (var i = 0; i < 6; i++) {
      var d = f[i], u, v;
      if (d[1]) { u = [1,0,0]; v = [0,0,d[1]]; }
      else if (d[0]) { u = [0,0,-d[0]]; v = [0,1,0]; }
      else { u = [d[2],0,0]; v = [0,1,0]; }
      var b = p.length / 3;
      for (var c = 0; c < 4; c++) {
        var su = c === 1 || c === 2 ? 1 : -1, sv = c > 1 ? 1 : -1;
        p.push(d[0] + u[0]*su + v[0]*sv, d[1] + u[1]*su + v[1]*sv, d[2] + u[2]*su + v[2]*sv);
        n.push(d[0], d[1], d[2]);
      }
      x.push(b, b+1, b+2, b, b+2, b+3);
    }
    return [p, n, x];
  }
  function sphG(sg, rg) {
    var p = [], n = [], x = [];
    for (var r = 0; r <= rg; r++) {
      var ph = r / rg * Math.PI, s = Math.sin(ph), c = Math.cos(ph);
      for (var q = 0; q <= sg; q++) {
        var t = q / sg * 6.2832, a = s * Math.cos(t), b = s * Math.sin(t);
        p.push(a, c, b); n.push(a, c, b);
      }
    }
    for (var r = 0; r < rg; r++) for (var q = 0; q < sg; q++) {
      var i = r * (sg + 1) + q, j = i + sg + 1;
      x.push(i, j, i+1, i+1, j, j+1);
    }
    return [p, n, x];
  }
  function octG() {
    var v = [[0,1,0],[0,-1,0],[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]];
    var t = [[0,4,2],[0,2,5],[0,5,3],[0,3,4],[1,2,4],[1,5,2],[1,3,5],[1,4,3]];
    var p = [], n = [], x = [];
    for (var i = 0; i < 8; i++) {
      var a = v[t[i][0]], b = v[t[i][1]], c = v[t[i][2]];
      var q = [a[0]+b[0]+c[0], a[1]+b[1]+c[1], a[2]+b[2]+c[2]];
      var l = Math.hypot(q[0], q[1], q[2]);
      [a,b,c].forEach(function (w) { p.push(w[0], w[1], w[2]); n.push(q[0]/l, q[1]/l, q[2]/l); });
      x.push(i*3, i*3+1, i*3+2);
    }
    return [p, n, x];
  }
  function discG(sg) {
    var p = [0,0,0], n = [0,1,0], x = [];
    for (var i = 0; i <= sg; i++) {
      var a = i / sg * 6.2832;
      p.push(Math.cos(a), 0, Math.sin(a)); n.push(0, 1, 0);
      if (i) x.push(0, i, i+1);
    }
    return [p, n, x];
  }
  function gridG(k) {
    var p = [], n = [], x = [], c = 0;
    for (var i = 0; i <= k; i++) {
      var t = -1 + 2 * i / k;
      p.push(t,0,-1, t,0,1, -1,0,t, 1,0,t);
      for (var q = 0; q < 4; q++) n.push(0, 1, 0);
      x.push(c, c+1, c+2, c+3); c += 4;
    }
    return [p, n, x];
  }
  function starG(k) {
    var p = [], n = [], x = [];
    for (var i = 0; i < k; i++) {
      var u = Math.random(), a = Math.random() * 6.2832, r = Math.sqrt(1 - u*u), R = 9 + Math.random()*6;
      p.push(Math.cos(a)*r*R, u*R*0.85 + 0.5, Math.sin(a)*r*R);
      n.push(0, 1, 0); x.push(i);
    }
    return [p, n, x];
  }

  window.XR3D = function () {
    var P = window.PR, gl, c = document.createElement("canvas");
    gl = c.getContext("webgl", { xrCompatible: true, antialias: true, alpha: false });
    if (!gl || !navigator.xr) return;
    function pr(v, f) {
      function s(t, y) { var o = gl.createShader(t); gl.shaderSource(o, y); gl.compileShader(o); return o; }
      var o = gl.createProgram();
      gl.attachShader(o, s(gl.VERTEX_SHADER, v)); gl.attachShader(o, s(gl.FRAGMENT_SHADER, f));
      gl.linkProgram(o); return o;
    }
    var SP = pr(
      "attribute vec3 p,n;uniform mat4 m,d;uniform float z;varying vec3 v;" +
      "void main(){v=mat3(d[0].xyz,d[1].xyz,d[2].xyz)*n;gl_PointSize=z;gl_Position=m*vec4(p,1.);}",
      "precision mediump float;varying vec3 v;uniform vec3 c;uniform float e,a;" +
      "void main(){float l=max(dot(normalize(v),normalize(vec3(.35,1.,.45))),0.);" +
      "gl_FragColor=vec4(mix(c*(.3+.85*l),c,e),a);}");
    var TP = pr(
      "attribute vec3 p;uniform mat4 m;uniform vec2 u;varying vec2 t;" +
      "void main(){t=vec2(p.x*.5+.5,mix(u.x,u.y,p.y*.5+.5));gl_Position=m*vec4(p,1.);}",
      "precision mediump float;varying vec2 t;uniform sampler2D s;" +
      "void main(){gl_FragColor=texture2D(s,t);}");
    function up(g) {
      function b(t, d, T) { var o = gl.createBuffer(); gl.bindBuffer(t, o); gl.bufferData(t, new T(d), gl.STATIC_DRAW); return o; }
      return { p: b(gl.ARRAY_BUFFER, g[0], Float32Array), n: b(gl.ARRAY_BUFFER, g[1], Float32Array),
               i: b(gl.ELEMENT_ARRAY_BUFFER, g[2], Uint16Array), c: g[2].length };
    }
    var BX = up(boxG()), SP2 = up(sphG(12, 8)), OC = up(octG()),
        DC = up(discG(20)), GR = up(gridG(8)), ST = up(starG(200)),
        QD = up([[-1,-1,0, 1,-1,0, -1,1,0, 1,1,0], [0,0,1, 0,0,1, 0,0,1, 0,0,1], [0,1,2,1,3,2]]);
    var tx = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tx);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    var W = P.W, S2 = 0.0017, BXp = 0, BY = 1, BZ = -1, YW = 0;
    var md = new Float32Array(16), mv = new Float32Array(16), tm = new Float32Array(16);
    var gp = new Float32Array(16), rm = new Float32Array(16), ym = new Float32Array(16);
    var vw = new Float32Array(16);
    var U = {}, i;
    "m d c e a z".split(" ").forEach(function (k) { U[k] = gl.getUniformLocation(SP, k); });
    var AP = gl.getAttribLocation(SP, "p"), AN = gl.getAttribLocation(SP, "n");
    var TM = gl.getUniformLocation(TP, "m"), TU = gl.getUniformLocation(TP, "u"),
        TA = gl.getAttribLocation(TP, "p");

    function draw(g, m, col, e, a, mode, z) {
      mul(vw, m, mv);
      gl.uniformMatrix4fv(U.m, false, mv); gl.uniformMatrix4fv(U.d, false, m);
      gl.uniform3fv(U.c, col); gl.uniform1f(U.e, e || 0);
      gl.uniform1f(U.a, a === undefined ? 1 : a); gl.uniform1f(U.z, z || 2);
      gl.bindBuffer(gl.ARRAY_BUFFER, g.p); gl.enableVertexAttribArray(AP);
      gl.vertexAttribPointer(AP, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, g.n); gl.enableVertexAttribArray(AN);
      gl.vertexAttribPointer(AN, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.i);
      gl.drawElements(mode === undefined ? gl.TRIANGLES : mode, g.c, gl.UNSIGNED_SHORT, 0);
    }
    function ob(g, x, z, y, sx, sy, sz, col, e, a, mode) {
      trs(md, (x - W/2)*S2, y*S2, (z - W/2)*S2, sx*S2, sy*S2, sz*S2, 0, 0);
      draw(g, mul(gp, md, tm), col, e, a, mode);
    }
    function rgb(k) { var q = P.RGB[k]; return [q[0]/255, q[1]/255, q[2]/255]; }
    function bl(on) { if (on) { gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false); }
                      else { gl.depthMask(true); gl.disable(gl.BLEND); } }

    navigator.xr.requestSession("immersive-vr", { optionalFeatures: ["local-floor"] }).then(function (se) {
      P.enterXR();
      se.updateRenderState({ baseLayer: new XRWebGLLayer(se, gl, { antialias: true }) });
      se.addEventListener("select", function () { P.press(); });
      se.addEventListener("squeeze", function () { cal = {}; org = 0; });
      se.addEventListener("end", function () { P.exitXR(); });
      var cal = {}, org = 0, fr = 0;
      se.requestReferenceSpace("local-floor").catch(function () {
        return se.requestReferenceSpace("local");
      }).then(function (rf) {
        se.requestAnimationFrame(function fn(t, f) {
          se.requestAnimationFrame(fn);
          try { frame(t, f); } catch (err) {}
        });
        function frame(t, f) {
          var po = f.getViewerPose(rf);
          if (!po) return;
          fr++;
          if (!org) {
            var h = po.transform.position, hm = po.transform.matrix;
            var fx = -hm[8], fz = -hm[10], fl = Math.hypot(fx, fz) || 1;
            fx /= fl; fz /= fl; org = 1;
            BXp = h.x + fx * 0.8; BY = h.y - 0.45; BZ = h.z + fz * 0.8;
            YW = Math.atan2(-fx, -fz);
          }
          var src = se.inputSources, hd = [];
          for (i = 0; i < src.length; i++) {
            if (!src[i].gripSpace) continue;
            var q = f.getPose(src[i].gripSpace, rf);
            if (q) { var m = q.transform.matrix;
              hd.push({ h: src[i].handedness, ux: m[4], uz: m[6], x: m[12], y: m[13], z: m[14] }); }
          }
          if (hd.length) {
            var rw;
            if (hd.length > 1) {
              var L = hd[0], R = hd[1];
              if (L.h === "right" || R.h === "left") { var s3 = L; L = R; R = s3; }
              var sp = Math.max(0.16, Math.hypot(R.x - L.x, R.z - L.z));
              rw = { x: (L.ux + R.ux)/2 - (R.y - L.y)/sp*0.55, z: -(L.uz + R.uz)/2, n: 2 };
            } else rw = { x: hd[0].ux, z: -hd[0].uz, n: 1 };
            var ck = "c" + rw.n;
            if (!cal[ck]) cal[ck] = rw;
            P.ctl(Math.max(-1, Math.min(1, (rw.x - cal[ck].x)*2.8)),
                  Math.max(-1, Math.min(1, (rw.z - cal[ck].z)*2.8)));
          }
          P.step(t);
          var S = P.state(), T = P.tilt(), M2 = P.mod(S.v), uc = rgb(M2);
          var la = se.renderState.baseLayer;
          gl.bindFramebuffer(gl.FRAMEBUFFER, la.framebuffer);
          gl.enable(gl.DEPTH_TEST);
          gl.clearColor(0.027, 0.023, 0.059, 1);
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          if (fr % 2 === 0) {
            gl.bindTexture(gl.TEXTURE_2D, tx);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, P.canvas);
          }
          trs(rm, 0, 0, 0, 1, 1, 1, 0.3 - T[1]*0.42, -T[0]*0.42);
          var cy = Math.cos(YW), sy = Math.sin(YW);
          ym[0]=cy; ym[1]=0; ym[2]=-sy; ym[3]=0; ym[4]=0; ym[5]=1; ym[6]=0; ym[7]=0;
          ym[8]=sy; ym[9]=0; ym[10]=cy; ym[11]=0; ym[12]=BXp; ym[13]=BY; ym[14]=BZ; ym[15]=1;
          mul(ym, rm, gp);
          for (var v = 0; v < po.views.length; v++) {
            var V = po.views[v], vp = la.getViewport(V);
            gl.viewport(vp.x, vp.y, vp.width, vp.height);
            mul(V.projectionMatrix, V.transform.inverse.matrix, vw);
            gl.useProgram(SP); bl(0);
            gl.depthMask(false);
            draw(ST, new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]),
                 [0.8,0.76,1], 1, 1, gl.POINTS, 2.2);
            gl.depthMask(true);
            ob(BX, W/2, W/2, -16, W/2, 16, W/2, [0.05,0.038,0.115], 0);
            bl(1);
            ob(GR, W/2, W/2, 1, W/2, 1, W/2, [0.42,0.36,0.9], 1, 0.5, gl.LINES);
            bl(0);
            var ws = S.w || [];
            for (i = 0; i < ws.length; i++)
              ob(BX, ws[i][0], ws[i][1], 17, ws[i][2], 17, ws[i][3], [0.14,0.11,0.32], 0.1);
            var gc = rgb(S.lv.tg);
            bl(1);
            ob(BX, W-70, 70, 80, 26, 80, 26, gc, 1, S.st === 1 ? 0.4 : 0.22);
            ob(DC, W-70, 70, 3, 60, 1, 60, gc, 1, 0.12);
            ob(DC, W-70, 70, 5, 34, 1, 34, gc, 1, 0.2);
            ob(DC, S.x, S.z, 2, 120, 1, 120, uc, 1, 0.08);
            ob(DC, S.x, S.z, 4, 56, 1, 56, uc, 1, 0.13);
            for (i = 0; i < S.tr.length; i += 2) {
              var tp = S.tr[i], k = i / S.tr.length;
              ob(OC, tp.x, tp.z, 8, 11*k, 5*k, 11*k, rgb((M2+i)%7), 1, 0.45*k);
            }
            for (i = 0; i < S.pa.length; i++) {
              var pa = S.pa[i], pk = Math.max(0, 1 - pa.t/50);
              ob(OC, pa.x, pa.z, pa.h, 5*pk, 5*pk, 5*pk, rgb(pa.c), 1, pk*0.9);
            }
            ob(SP2, S.x, S.z, P.BR, P.BR*2.2, P.BR*2.2, P.BR*2.2, uc, 1, 0.12);
            bl(0);
            ob(SP2, S.x, S.z, P.BR, P.BR, P.BR, P.BR, uc, 0.5);
            ob(OC, S.x, S.z, P.BR*2.1, P.BR*0.3, P.BR*1.3, P.BR*0.3, [1,0.96,0.82], 0.9);
            for (i = 0; i < S.bs.length; i++) {
              var b2 = S.bs[i];
              if (b2.t > 40) continue;
              var al = b2.t > 0 ? (40 - b2.t)/40 : 1;
              var f1 = P.apply(S.v, b2.o), f2 = P.apply(S.v, b2.o2);
              ob(OC, b2.x, b2.z, 44, 13, 19, 13, [0.92,0.9,1], 0.85, al);
              bl(1);
              var ux2 = Math.cos(b2.ax)*46, uz2 = Math.sin(b2.ax)*46;
              ob(BX, b2.x+ux2, b2.z+uz2, 44, 40, 4, 4,
                 f1 < 0 ? [0.55,0.53,0.62] : rgb(P.mod(f1)), 1, 0.65*al);
              ob(BX, b2.x-ux2, b2.z-uz2, 44, 40, 4, 4,
                 f2 < 0 ? [0.55,0.53,0.62] : rgb(P.mod(f2)), 1, 0.65*al);
              ob(DC, b2.x, b2.z, 3, 28, 1, 28, [0.6,0.55,1], 1, 0.09*al);
              bl(0);
            }
            gl.useProgram(TP);
            var fu = S.st !== 0, pw = fu ? 0.34 : 0.42;
            gl.uniform2f(TU, fu ? 0 : 1 - P.OY/P.CH, 1);
            trs(md, 0, 0.46, -0.2, pw, fu ? pw*P.CH/P.CW : pw*P.OY/P.CW, 1, 0, 0);
            mul(vw, mul(ym, md, tm), mv);
            gl.uniformMatrix4fv(TM, false, mv);
            gl.bindTexture(gl.TEXTURE_2D, tx);
            gl.bindBuffer(gl.ARRAY_BUFFER, QD.p); gl.enableVertexAttribArray(TA);
            gl.vertexAttribPointer(TA, 3, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, QD.i);
            gl.drawElements(gl.TRIANGLES, QD.c, gl.UNSIGNED_SHORT, 0);
          }
        }
      });
    }, function () {});
  };
})();
