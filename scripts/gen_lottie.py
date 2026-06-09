#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
原理动图生成器
- 程序化生成 17 个参数化 Lottie 动画原型 -> src/data/lottie/*.json
- 按 MAPPING 向 src/data/goldThread.json 注入 detail.anim 字段（保留已有的不覆盖）
- 自检：JSON 合法性、src 命中、覆盖率
"""
import json, math, os, sys
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
LOTTIE_DIR = os.path.join(ROOT, "src", "data", "lottie")
GOLD_JSON = os.path.join(ROOT, "src", "data", "goldThread.json")

W, H, FR = 360, 240, 30
CX, CY = 180, 120

# 颜色（归一化 RGB）
BLUE   = [0.251, 0.620, 1.000]
RED    = [0.910, 0.200, 0.200]
GREEN  = [0.404, 0.761, 0.137]
ORANGE = [0.902, 0.635, 0.235]
GRAY   = [0.545, 0.580, 0.620]
GOLD   = [0.902, 0.635, 0.090]
PURPLE = [0.600, 0.420, 0.900]
WHITE  = [0.860, 0.860, 0.900]

# ---------- 基础 helper ----------
def st(v):  # static property
    return {"a": 0, "k": v}

def _ez(o_=True):
    return ({"x": [0.4], "y": [0]}, {"x": [0.6], "y": [1]})

def kf(frames, linear=False):
    """frames: [(t, value_or_list), ...] -> animated property"""
    out = []
    n = len(frames)
    for i, (t, s) in enumerate(frames):
        d = {"t": t, "s": s if isinstance(s, list) else [s]}
        if i < n - 1:
            if linear:
                d["o"] = {"x": [0], "y": [0]}
                d["i"] = {"x": [1], "y": [1]}
            else:
                d["o"] = {"x": [0.4], "y": [0]}
                d["i"] = {"x": [0.6], "y": [1]}
        out.append(d)
    return {"a": 1, "k": out}

def tr(p=(0, 0), a=(0, 0), s=(100, 100), r=0, o=100):
    return {"ty": "tr", "p": st(list(p)), "a": st(list(a)),
            "s": st(list(s)), "r": st(r), "o": st(o)}

def fill(c, o=100):
    return {"ty": "fl", "c": st(c), "o": st(o), "r": 1, "nm": "fill"}

def stroke(c, w=2, o=100):
    return {"ty": "st", "c": st(c), "o": st(o), "w": st(w), "lc": 2, "lj": 2, "nm": "stroke"}

def rect(cx, cy, w, h, r=0):
    return {"ty": "rc", "d": 1, "s": st([w, h]), "p": st([cx, cy]), "r": st(r)}

def ellipse(cx, cy, w, h=None):
    return {"ty": "el", "d": 1, "s": st([w, h if h is not None else w]), "p": st([cx, cy])}

def path(verts, closed=False):
    n = len(verts)
    z = [[0, 0]] * n
    return {"ty": "sh", "d": 1, "ks": st({"i": z, "o": z,
            "v": [[round(x, 2), round(y, 2)] for x, y in verts], "c": closed})}

def group(name, items):
    return {"ty": "gr", "nm": name, "it": items}

def layer(ind, name, shapes, ks_over=None, op=120):
    ks = {"o": st(100), "r": st(0), "p": st([CX, CY, 0]),
          "a": st([CX, CY, 0]), "s": st([100, 100, 100])}
    if ks_over:
        ks.update(ks_over)
    return {"ddd": 0, "ind": ind, "ty": 4, "nm": name, "sr": 1,
            "ks": ks, "ao": 0, "shapes": shapes, "ip": 0, "op": op, "st": 0, "bm": 0}

def anim(name, layers, op=120):
    return {"v": "5.7.0", "fr": FR, "ip": 0, "op": op, "w": W, "h": H,
            "nm": name, "ddd": 0, "assets": [], "layers": layers}

# ---------- 曲线采样 ----------
def sine_verts(x0, x1, ymid, amp, cycles, n=64, phase=0.0):
    out = []
    for k in range(n + 1):
        x = x0 + (x1 - x0) * k / n
        y = ymid - amp * math.sin(phase + 2 * math.pi * cycles * k / n)
        out.append((x, y))
    return out

def fn_verts(fn, x0, x1, n=64):
    return [(x0 + (x1 - x0) * k / n, fn(k / n)) for k in range(n + 1)]

def square_verts(x0, x1, yhi, ylo, periods):
    seg = (x1 - x0) / periods
    v = [(x0, ylo)]
    for p in range(periods):
        a = x0 + p * seg
        v += [(a, ylo), (a, yhi), (a + seg / 2, yhi), (a + seg / 2, ylo), (a + seg, ylo)]
    return v

# ---------- 通用图层 ----------
def curve_layer(ind, verts, color, w=2.5, op=120, closed=False, o=100, name="curve"):
    return layer(ind, name, [group("c", [path(verts, closed), stroke(color, w, 100), tr()])],
                 {"o": st(o)}, op)

def fillpath_layer(ind, verts, color, op=120, o=100, name="fp"):
    return layer(ind, name, [group("c", [path(verts, True), fill(color, o), tr()])],
                 {"o": st(o)}, op)

def axes_layer(ind, op=120, x0=44, x1=320, y0=44, ybase=196, xleft=60):
    g = group("axes", [path([(x0, ybase), (x1, ybase)]),
                       path([(xleft, y0), (xleft, ybase + 8)]),
                       stroke(GRAY, 1.2, 80), tr()])
    return layer(ind, "axes", [g], {"o": st(75)}, op)

def follow_dot_layer(ind, pts, color, op=120, r=9, samples=22):
    n = len(pts) - 1
    frames = []
    for k in range(samples + 1):
        idx = round(n * k / samples)
        x, y = pts[idx]
        frames.append((round(op * k / samples), [round(x, 2), round(y, 2), 0]))
    sh = group("dot", [ellipse(0, 0, r), fill(color), tr()])
    ks = {"o": st(100), "r": st(0), "p": kf(frames, linear=True),
          "a": st([0, 0, 0]), "s": st([100, 100, 100])}
    return layer(ind, "dot", [sh], ks, op)

def scan_layer(ind, x0, x1, ymid, half=78, op=120, color=BLUE):
    sh = group("scan", [path([(0, ymid - half), (0, ymid + half)]), stroke(color, 1.2, 55), tr()])
    ks = {"o": st(60), "r": st(0),
          "p": kf([(0, [x0, 0, 0]), (op, [x1, 0, 0])], linear=True),
          "a": st([0, 0, 0]), "s": st([100, 100, 100])}
    return layer(ind, "scan", [sh], ks, op)

def bar_layer(ind, bx, base_y, bw, full_h, color, sy_frames, op=120, o=100):
    g = group("bar", [rect(bx, base_y - full_h / 2.0, bw, full_h, 3), fill(color, o), tr()])
    ks = {"o": st(100), "r": st(0), "p": st([bx, base_y, 0]), "a": st([bx, base_y, 0]),
          "s": kf([(t, [100, sy, 100]) for t, sy in sy_frames])}
    return layer(ind, "bar", [g], ks, op)

def label_dot(ind, x, y, color, r=11, op=120):
    return layer(ind, "lab", [group("d", [ellipse(x, y, r), fill(color), tr()])], None, op)

# =================== 15 个原型 ===================
def make_switching_pulse():
    op = 90
    base = curve_layer(3, [(40, 150), (320, 150)], GRAY, 1.2, op, o=60, name="base")
    wave = curve_layer(2, square_verts(50, 310, 70, 150, 4), ORANGE, 3, op, name="wave")
    scan = scan_layer(1, 50, 310, 110, half=70, op=op, color=BLUE)
    return anim("switching_pulse", [scan, wave, base], op)

def make_pwm_compare():
    op = 120
    # 三角载波
    tri = []
    for k in range(9):
        x = 50 + (260) * k / 8
        tri.append((x, 70 if k % 2 == 0 else 150))
    carrier = curve_layer(3, tri, GRAY, 2, op, o=80, name="carrier")
    sine = curve_layer(2, sine_verts(50, 310, 110, 36, 1.0), BLUE, 2.5, op, name="mod")
    # 输出脉冲
    pulse = curve_layer(4, square_verts(50, 310, 185, 205, 4), ORANGE, 2.5, op, name="pulse")
    scan = scan_layer(1, 50, 310, 130, half=95, op=op, color=ORANGE)
    return anim("pwm_compare", [scan, sine, carrier, pulse], op)

def make_three_phase_sine():
    op = 120
    a = curve_layer(4, sine_verts(40, 320, 120, 60, 1.5, phase=0), RED, 2.5, op, name="a")
    b = curve_layer(3, sine_verts(40, 320, 120, 60, 1.5, phase=2 * math.pi / 3), GREEN, 2.5, op, name="b")
    c = curve_layer(2, sine_verts(40, 320, 120, 60, 1.5, phase=4 * math.pi / 3), BLUE, 2.5, op, name="c")
    scan = scan_layer(1, 40, 320, 120, half=72, op=op)
    return anim("three_phase_sine", [scan, a, b, c], op)

def make_fourier_harmonics():
    op = 150
    h1 = sine_verts(40, 320, 120, 55, 1.0)
    h3 = sine_verts(40, 320, 120, 55 / 3.0, 3.0)
    h5 = sine_verts(40, 320, 120, 55 / 5.0, 5.0)
    summ = []
    n = 64
    for k in range(n + 1):
        x = 40 + 280 * k / n
        s = 0.0
        for m in (1, 3, 5, 7, 9):
            s += math.sin(2 * math.pi * m * k / n) / m
        summ.append((x, 120 - 55 * 4 / math.pi * s / 1.27))
    L1 = curve_layer(4, h1, BLUE, 2, op, name="h1")
    L3 = layer(3, "h3", [group("c", [path(h3), stroke(GRAY, 1.5), tr()])],
               {"o": kf([(0, 0), (40, 70), (op, 70)])}, op)
    L5 = layer(2, "h5", [group("c", [path(h5), stroke(GRAY, 1.5), tr()])],
               {"o": kf([(0, 0), (70, 60), (op, 60)])}, op)
    Ls = layer(1, "sum", [group("c", [path(summ), stroke(ORANGE, 3), tr()])],
               {"o": kf([(0, 0), (110, 100), (op, 100)])}, op)
    return anim("fourier_harmonics", [Ls, L5, L3, L1], op)

def _step_resp(t):
    # 欠阻尼阶跃响应，归一到约 [0,1.1]
    return 1 - math.exp(-4.5 * t) * math.cos(7.5 * t)

def make_feedback_loop():
    op = 120
    verts = fn_verts(lambda t: 190 - max(0.0, min(1.15, _step_resp(t))) * 120, 60, 320)
    target = curve_layer(4, [(60, 70), (320, 70)], GREEN, 1.5, op, o=70, name="target")
    ax = axes_layer(5, op)
    curve = curve_layer(2, verts, BLUE, 3, op, name="resp")
    dot = follow_dot_layer(1, verts, ORANGE, op, r=8)
    return anim("feedback_loop", [dot, curve, target, ax], op)

def make_kalman_estimate():
    op = 120
    truth = [(40 + 280 * k / 64, 120 - 45 * math.sin(2 * math.pi * 0.75 * k / 64)) for k in range(65)]
    # 噪声折线（确定性伪噪声）
    noisy = []
    for k, (x, y) in enumerate(truth):
        j = 22 * math.sin(k * 2.399) * math.cos(k * 1.27)
        noisy.append((x, y + j))
    nl = curve_layer(3, noisy, GRAY, 1.2, op, o=70, name="noisy")
    est = curve_layer(2, truth, ORANGE, 3, op, name="est")
    dot = follow_dot_layer(1, truth, BLUE, op, r=8)
    return anim("kalman_estimate", [dot, est, nl], op)

def make_soc_gauge():
    op = 120
    shell = layer(3, "shell", [group("s", [rect(180, 120, 70, 130, 8), stroke(GREEN, 3), tr()]),
                               group("cap", [rect(180, 50, 26, 10, 3), fill(GREEN), tr()])], None, op)
    fillbar = bar_layer(1, 180, 182, 58, 116, GREEN,
                        [(0, 35), (40, 95), (75, 95), (110, 40), (op, 35)], op, o=45)
    return anim("soc_gauge", [fillbar, shell], op)

def make_cell_balance():
    op = 120
    xs = [96, 138, 180, 222, 264]
    init = [95, 55, 80, 40, 70]
    bars = []
    for i, (x, h0) in enumerate(zip(xs, init)):
        frames = [(0, h0), (45, h0), (95, 68), (op, 68)]
        col = GREEN if i % 2 == 0 else BLUE
        bars.append(bar_layer(i + 1, x, 192, 30, 120, col,
                              [(t, sy) for t, sy in frames], op))
    base = curve_layer(6, [(70, 192), (290, 192)], GRAY, 1.5, op, o=60, name="base")
    return anim("cell_balance", bars + [base], op)

def make_cccv_curve():
    op = 120
    cur = fn_verts(lambda t: 190 - (1.0 if t < 0.5 else math.exp(-6 * (t - 0.5))) * 120, 60, 320)
    vol = fn_verts(lambda t: 190 - (0.3 + 1.4 * t if t < 0.5 else min(1.05, 1.0 + 0.1 * (t - 0.5))) * 120, 60, 320)
    ax = axes_layer(4, op)
    lc = curve_layer(3, cur, ORANGE, 3, op, name="I")
    lv = curve_layer(2, vol, BLUE, 3, op, name="V")
    dot = follow_dot_layer(1, vol, GREEN, op, r=7)
    return anim("cccv_curve", [dot, lc, lv, ax], op)

def make_rc_curve():
    op = 120
    verts = fn_verts(lambda t: 190 - (1 - math.exp(-3.2 * t)) * 120, 60, 320)
    ax = axes_layer(3, op)
    cur = curve_layer(2, verts, BLUE, 3, op, name="rc")
    dot = follow_dot_layer(1, verts, ORANGE, op, r=8)
    return anim("rc_curve", [dot, cur, ax], op)

def make_rectifier_wave():
    op = 120
    ac = curve_layer(3, sine_verts(40, 320, 76, 28, 2.0), BLUE, 2.5, op, name="ac")
    rect_v = [(40 + 280 * k / 96, 188 - 30 * abs(math.sin(2 * math.pi * 2.0 * k / 96))) for k in range(97)]
    base = curve_layer(4, [(40, 188), (320, 188)], GRAY, 1.2, op, o=60, name="base")
    rc = curve_layer(2, rect_v, ORANGE, 2.5, op, name="rect")
    scan = scan_layer(1, 40, 320, 120, half=88, op=op)
    return anim("rectifier_wave", [scan, ac, rc, base], op)

def make_resonance_lc():
    op = 120
    fL = lambda t: 25 + 70 * (0.5 + 0.5 * math.cos(2 * math.pi * t))
    fC = lambda t: 25 + 70 * (0.5 + 0.5 * math.cos(2 * math.pi * t + math.pi))
    fr = [(round(op * k / 16), 0) for k in range(17)]
    barL = bar_layer(1, 142, 192, 44, 120, BLUE,
                     [(round(op * k / 16), fL(k / 16)) for k in range(17)], op)
    barC = bar_layer(2, 218, 192, 44, 120, ORANGE,
                     [(round(op * k / 16), fC(k / 16)) for k in range(17)], op)
    base = curve_layer(3, [(90, 192), (270, 192)], GRAY, 1.5, op, o=60, name="base")
    return anim("resonance_lc", [barL, barC, base], op)

def make_em_wave():
    op = 120
    waveE = sine_verts(-130, 490, 100, 30, 5.0)
    waveB = sine_verts(-130, 490, 150, 22, 5.0, phase=math.pi)
    ks_move = {"o": st(100), "r": st(0),
               "p": kf([(0, [CX, CY, 0]), (op, [CX - 124, CY, 0])], linear=True),
               "a": st([CX, CY, 0]), "s": st([100, 100, 100])}
    lE = layer(1, "E", [group("c", [path(waveE), stroke(BLUE, 2.5), tr()])], ks_move, op)
    lB = layer(2, "B", [group("c", [path(waveB), stroke(RED, 2), tr()])], ks_move, op)
    axis = curve_layer(3, [(20, 125), (340, 125)], GRAY, 1, op, o=50, name="axis")
    return anim("em_wave", [lE, lB, axis], op)

def make_flux_loop():
    op = 120
    core_out = [(110, 60), (250, 60), (250, 180), (110, 180)]
    core_in = [(140, 90), (220, 90), (220, 150), (140, 150)]
    core = layer(3, "core", [group("o", [path(core_out, True), path(core_in, True),
                 fill(GRAY, 18), stroke(GRAY, 2), tr()])], None, op)
    loop_pts = [(125, 75), (235, 75), (235, 165), (125, 165), (125, 75)]
    dotframes = []
    # 沿矩形回路匀速：用 4 段，每段细分
    seq = []
    for i in range(4):
        x0, y0 = loop_pts[i]
        x1, y1 = loop_pts[i + 1]
        for s in range(8):
            seq.append((x0 + (x1 - x0) * s / 8, y0 + (y1 - y0) * s / 8))
    seq.append(loop_pts[0])
    dot = follow_dot_layer(1, seq, GOLD, op, r=8, samples=32)
    return anim("flux_loop", [dot, core], op)

def make_ion_shuttle():
    op = 120
    plL = layer(4, "pL", [group("p", [rect(70, 120, 12, 120, 2), fill(RED, 80), tr()])], None, op)
    plR = layer(5, "pR", [group("p", [rect(290, 120, 12, 120, 2), fill(BLUE, 80), tr()])], None, op)
    ions = []
    ys = [70, 105, 140, 170]
    for i, y in enumerate(ys):
        ph = i / len(ys)
        f = [(0, [80 + 200 * (0.5 + 0.5 * math.cos(2 * math.pi * ph)), y, 0])]
        for k in range(1, 17):
            t = k / 16
            x = 80 + 200 * (0.5 + 0.5 * math.cos(2 * math.pi * (t + ph)))
            f.append((round(op * t), [round(x, 2), y, 0]))
        sh = group("ion", [ellipse(0, 0, 13), fill(GREEN if i % 2 == 0 else ORANGE), tr()])
        ks = {"o": st(100), "r": st(0), "p": kf(f, linear=True),
              "a": st([0, 0, 0]), "s": st([100, 100, 100])}
        ions.append(layer(i + 1, "ion%d" % i, [sh], ks, op))
    return anim("ion_shuttle", ions + [plL, plR], op)

def make_mppt_climb():
    op = 120
    # P-V 功率曲线（钟形，峰在 t≈0.6）
    def pv(t):
        val = math.exp(-((t - 0.6) * 3.0) ** 2)
        return 190 - val * 128
    verts = fn_verts(pv, 52, 320, 80)
    ax = axes_layer(4, op)
    curve = curve_layer(3, verts, ORANGE, 3, op, name="pv")
    # 工作点：先沿曲线爬升到峰，再在峰顶做 P&O 小幅扰动
    climb = []
    for k in range(33):
        t = 0.6 * k / 32
        climb.append((52 + 268 * t, pv(t)))
    for k in range(1, 16):
        t = 0.6 + 0.05 * math.sin(k / 15 * 2 * math.pi * 2)
        climb.append((52 + 268 * t, pv(t)))
    dot = follow_dot_layer(1, climb, GREEN, op, r=9, samples=28)
    return anim("mppt_climb", [dot, curve, ax], op)

def make_pll_lock():
    op = 130
    # 电网参考正弦（灰，固定）：宽 280px 放 2 周期 → 140px/周期
    grid = sine_verts(40, 320, 120, 52, 2.0)
    gl = curve_layer(3, grid, GRAY, 2, op, o=65, name="grid")
    # VCO 输出（蓝）：更宽曲线同空间周期，整层水平平移由相位差归零（锁相）
    vco = sine_verts(-90, 450, 120, 52, 540 / 140.0)
    off = 70
    ks = {"o": st(100), "r": st(0),
          "p": kf([(0, [CX + off, CY, 0]),
                   (int(op * 0.65), [CX, CY, 0]),
                   (op, [CX, CY, 0])]),
          "a": st([CX, CY, 0]), "s": st([100, 100, 100])}
    vl = layer(1, "vco", [group("c", [path(vco), stroke(BLUE, 2.5), tr()])], ks, op)
    axis = curve_layer(4, [(40, 120), (320, 120)], GRAY, 1, op, o=40, name="axis")
    return anim("pll_lock", [vl, gl, axis], op)

def make_pv_iv_curve():
    op = 120
    # 光伏 I-V 特性：低压段近似恒流(Isc)，越过膝点后电流陡降至开路电压(Voc)
    def iv(t):
        I = 1.0 / (1.0 + math.exp(22.0 * (t - 0.74)))
        return 190 - I * 120
    verts = fn_verts(iv, 60, 320, 80)
    t_mpp = 0.68
    x_mpp = 60 + 260 * t_mpp
    y_mpp = iv(t_mpp)
    ax = axes_layer(5, op)
    # 最大功率矩形 V_mpp×I_mpp（淡入）
    recth = [(60, 190), (x_mpp, 190), (x_mpp, y_mpp), (60, y_mpp)]
    rectL = layer(4, "mpparea", [group("r", [path(recth, True), fill(GREEN, 16), tr()])],
                  {"o": kf([(0, 0), (40, 100), (op, 100)])}, op)
    curve = curve_layer(3, verts, ORANGE, 3, op, name="iv")
    mpp = label_dot(2, x_mpp, y_mpp, GREEN, r=8, op=op)
    # 工作点沿 I-V 曲线扫掠（Isc→Voc）
    dot = follow_dot_layer(1, verts, BLUE, op, r=7, samples=26)
    return anim("pv_iv_curve", [dot, mpp, curve, rectL, ax], op)

def make_grid_dq_inject():
    op = 120
    base_y = 196
    base = curve_layer(6, [(60, base_y), (320, base_y)], GRAY, 1.2, op, o=60, name="base")
    # id 有功电流：阶跃上升、略超调后稳定（PI 整定）
    id_bar = bar_layer(3, 150, 150, 46, 150, GREEN,
                       [(0, 12), (45, 92), (70, 100), (90, 94), (op, 94)], op, o=85)
    # iq 无功电流：恒为零（单位功率因数、有功无功解耦）
    iq_bar = bar_layer(2, 232, 150, 46, 150, BLUE,
                       [(0, 8), (op, 8)], op, o=70)
    # id* 指令参考线
    ref_y = base_y - 150 * 0.94
    ref = curve_layer(1, [(118, ref_y), (182, ref_y)], GREEN, 1.6, op, o=85, name="idref")
    return anim("grid_dq_inject", [ref, iq_bar, id_bar, base], op)

def make_islanding_trip():
    op = 140
    ymid = 120
    # 允许电压窗口（红色阈值带）+ 零轴
    bandU = curve_layer(6, [(40, ymid - 70), (320, ymid - 70)], RED, 1.2, op, o=35, name="bandU")
    bandL = curve_layer(5, [(40, ymid + 70), (320, ymid + 70)], RED, 1.2, op, o=35, name="bandL")
    axis = curve_layer(7, [(40, ymid), (320, ymid)], GRAY, 1, op, o=40, name="axis")
    # 电网参考（灰）：电网失电后淡出
    grid = sine_verts(40, 320, ymid, 50, 3.0)
    gl = layer(4, "grid", [group("c", [path(grid), stroke(GRAY, 2), tr()])],
               {"o": kf([(0, 65), (int(op * 0.5), 65), (int(op * 0.62), 0), (op, 0)])}, op)
    # 逆变器输出（蓝）：先同步，失电后电压塌缩→越限→跳闸（淡出）
    out = sine_verts(40, 320, ymid, 50, 3.0)
    ks = {"o": kf([(0, 100), (int(op * 0.8), 100), (int(op * 0.9), 0), (op, 0)]),
          "r": st(0), "p": st([CX, CY, 0]), "a": st([CX, CY, 0]),
          "s": kf([(0, [100, 100, 100]), (int(op * 0.5), [100, 100, 100]),
                   (int(op * 0.78), [100, 18, 100]), (op, [100, 0, 100])])}
    ol = layer(2, "out", [group("c", [path(out), stroke(BLUE, 2.5), tr()])], ks, op)
    # 跳闸指示（红点）：失电后亮起
    trip = layer(1, "trip", [group("d", [ellipse(296, 56, 26), fill(RED), tr()])],
                 {"o": kf([(0, 0), (int(op * 0.72), 0), (int(op * 0.82), 100), (op, 100)]),
                  "r": st(0), "p": st([CX, CY, 0]), "a": st([CX, CY, 0]), "s": st([100, 100, 100])}, op)
    return anim("islanding_trip", [trip, ol, gl, bandU, bandL, axis], op)

def make_pv_power_flow():
    op = 130
    yline = 120
    xs = [70, 150, 230, 305]
    cols = [ORANGE, BLUE, PURPLE, GREEN]
    names = ["pv", "boost", "inv", "grid"]
    bus = curve_layer(7, [(70, yline), (305, yline)], GRAY, 2, op, o=55, name="bus")
    # 四级方框：PV→Boost→逆变器→电网
    boxes = []
    for i, (x, c) in enumerate(zip(xs, cols)):
        boxes.append(layer(6 - i, "box_%s" % names[i],
                     [group("b", [rect(x, yline, 46, 40, 6), fill(c, 14), stroke(c, 2.4), tr()])],
                     None, op))
    # 太阳（金色）置于 PV 上方
    sun = layer(2, "sun", [group("s", [ellipse(70, 56, 26), fill(GOLD, 90), tr()])], None, op)
    # 能量包沿母线 PV→Grid 流动
    pts = [(70 + (305 - 70) * k / 40.0, yline) for k in range(41)]
    pkt = follow_dot_layer(1, pts, GOLD, op, r=9, samples=30)
    return anim("pv_power_flow", [pkt, sun] + boxes + [bus], op)

ARCHETYPES = {
    "switching_pulse": make_switching_pulse,
    "pwm_compare": make_pwm_compare,
    "three_phase_sine": make_three_phase_sine,
    "fourier_harmonics": make_fourier_harmonics,
    "feedback_loop": make_feedback_loop,
    "kalman_estimate": make_kalman_estimate,
    "soc_gauge": make_soc_gauge,
    "cell_balance": make_cell_balance,
    "cccv_curve": make_cccv_curve,
    "rc_curve": make_rc_curve,
    "rectifier_wave": make_rectifier_wave,
    "resonance_lc": make_resonance_lc,
    "em_wave": make_em_wave,
    "flux_loop": make_flux_loop,
    "ion_shuttle": make_ion_shuttle,
    "mppt_climb": make_mppt_climb,
    "pll_lock": make_pll_lock,
    "pv_iv_curve": make_pv_iv_curve,
    "grid_dq_inject": make_grid_dq_inject,
    "islanding_trip": make_islanding_trip,
    "pv_power_flow": make_pv_power_flow,
}

# =================== 节点 -> (原型, caption) 映射 ===================
MAPPING = {
    # 复用已有原型
    "ac_motor_principles": ("rotating_field", "三相绕组通入对称电流，合成磁场矢量（蓝箭头）以同步速旋转——这是所有交流电机产生转矩的统一原理。"),
    "pmsm_math_model": ("rotating_field", "定子电流合成的旋转磁场矢量匀速回转，正是 PMSM 数学模型中 dq 旋转坐标系所跟踪的对象。"),
    "complex_numbers": ("rotating_field", "旋转矢量（相量）匀速回转，其在实轴的投影即正弦量——相量法把正弦稳态的微分方程化为复数代数。"),
    "space_vector": ("rotating_field", "三相量被统一为一个在复平面匀速旋转的空间电压矢量，这是 SVPWM 与矢量控制共同的几何语言。"),
    "clark_transform": ("rotating_field", "三相轴上的电流被合成为单一空间矢量，Clarke 变换正是把三相投影到两相 αβ 平面、信息零损失。"),
    "park_transform": ("dq_rotation", "Park 变换把静止 αβ 分量旋转到随转子同步的 dq 坐标系（红/蓝轴），交变量在此变为直流，便于 PI 调节。"),
    "faraday_law": ("magnetic_coupling", "线圈中磁通脉动，在邻近线圈感应出电动势——法拉第定律 ℰ=-dΦ/dt 是变压器、电机、无线充电的共同根基。"),
    "bidirectional_dcdc": ("energy_flow", "能量在两端往复——双向 DC-DC 同一套开关管按占空比切换，实现升压放电与降压充电的双向流动。"),
    "pcs": ("energy_flow", "PCS 在电池与电网间双向搬运功率，毫秒间从充电切到放电、从有功切到无功，是储能并网的功率接口。"),
    "grid_storage_application": ("energy_flow", "低谷充电、尖峰放电——储能电站像电网的充电宝，能量在电池与电网间按调度往复流动，削峰填谷。"),
    # 新原型
    "igbt_mosfet": ("switching_pulse", "栅极信号驱动开关管在导通/关断间高速切换，输出方波电压——开关损耗与开关频率的权衡是功率器件的核心。"),
    "gate_drive": ("switching_pulse", "驱动电路把控制逻辑放大为驱动开关管的栅极脉冲，精确的死区与边沿决定开关效率与桥臂安全。"),
    "three_phase_inverter": ("switching_pulse", "六只开关管按节拍通断，把直流斩成一系列方波脉冲，合成可调频调幅的三相交流。"),
    "power_electronics_basics": ("switching_pulse", "电力电子的本质是开关：器件在通/断两态间高频切换，用占空比编码出目标电压波形。"),
    "wpt_hf_inverter": ("switching_pulse", "原边全桥把直流斩成 85kHz 高频方波激励谐振网络，软开关（ZVS）让高频切换依旧低损。"),
    "pwm_generation": ("pwm_compare", "三角载波与调制波（正弦）逐点比较，交点决定开关时刻——这就是 PWM 把模拟指令编码为数字脉宽的原理。"),
    "digital_electronics_basics": ("pwm_compare", "数字电路在高/低两个电平间切换，时钟与逻辑门的脉冲时序是 PWM、采样与控制器的硬件基础。"),
    "opamp_comparator": ("pwm_compare", "比较器把输入与参考阈值逐点比较，输出在高低电平间翻转——是 PWM 生成与过流保护的判决核心。"),
    "three_phase_ac": ("three_phase_sine", "三相电压互差 120° 依次达到峰值，任意时刻三相瞬时值之和恒为零——这是三相系统功率平稳的根源。"),
    "fourier_analysis": ("fourier_harmonics", "基波叠加 3、5、7 次谐波，波形逐步逼近方波——傅里叶分析把任意周期信号分解为正弦谐波之和。"),
    "pi_controller": ("feedback_loop", "阶跃指令下输出快速上升、略有超调后稳定到目标——PI 的比例项提供速度、积分项消除稳态误差。"),
    "current_loop": ("feedback_loop", "电流环在百微秒内把实际电流拉到指令值，是 FOC 最内层、决定系统动态上限的闭环。"),
    "speed_loop": ("feedback_loop", "速度环将转速误差转化为转矩指令，级联驱动内层电流环，构成电机的速度闭环。"),
    "control_theory_basics": ("feedback_loop", "反馈把输出误差送回输入持续修正，使系统快速、无静差地跟踪目标——这是自动控制的核心思想。"),
    "kalman_filter": ("kalman_estimate", "灰色抖动是带噪测量，橙线是滤波估计——卡尔曼把不可靠测量与物理模型加权融合，给出每步最优估计。"),
    "ekf_soc": ("kalman_estimate", "电池电压-电量是非线性曲线，EKF 在工作点把它线性化逐步跟踪，从含噪测量中稳稳估出 SOC。"),
    "soc_estimation": ("soc_gauge", "电量条随充放电升降——SOC 看不见摸不着，只能靠电流积分加电压校正一点点推算剩余电量。"),
    "soh_estimation": ("soc_gauge", "随循环老化，可用容量上限逐步缩水——SOH 长期跟踪容量衰减与内阻增长，判断电池剩余寿命。"),
    "bms_architecture": ("soc_gauge", "BMS 逐毫伏盯着每节电芯的电压温度，实时决定均衡、断电与剩余电量，是电池系统的神经中枢。"),
    "cell_balancing": ("cell_balance", "几节电量不齐的电芯像掉队的队列，均衡电路把跑太快的拽住或把能量匀给慢的，让全组步调一致。"),
    "battery_charging": ("cccv_curve", "前段恒流（电流平、电压升）猛灌求速度，后段恒压（电压平、电流降）细灌防过充——这就是 CC-CV。"),
    "lithium_battery_model": ("rc_curve", "插枪瞬间电压跳变（内阻 R0），随后缓升（RC 极化）——电池等效电路用这条充电曲线实时推演电量。"),
    "circuit_theory": ("rc_curve", "电容经电阻充电，电压按指数趋于稳态——RC 一阶响应是理解所有电路动态过程的基石。"),
    "wpt_efficiency_kq": ("rc_curve", "传输效率随 kQ 积单调上升并趋于饱和——提升耦合系数 k 与线圈品质因数 Q 是无线传能高效的唯一路径。"),
    "wpt_secondary_rectifier": ("rectifier_wave", "上方高频交流经整流翻折为下方单向凸包——副边整流把隔空传来的交流抚平为给电池充电的直流。"),
    "wpt_resonant_compensation": ("resonance_lc", "能量在电感与电容间交替振荡——谐振补偿让松耦合线圈在 85kHz 谐振，抵消漏感无功、实现近单位功率因数。"),
    "maxwell_equations": ("em_wave", "变化的电场激发磁场、变化的磁场激发电场，相互滋生向前传播——这正是麦克斯韦方程组预言的电磁波。"),
    "magnetic_circuit": ("flux_loop", "磁通沿铁芯回路循环，如电流沿电路——磁路的磁动势、磁阻与磁通对应电路的电压、电阻与电流。"),
    "battery_electrochemistry": ("ion_shuttle", "充放电时锂离子在正负极间往返穿梭、嵌入脱出，把化学能与电能相互转换——这是锂电池储能的微观本质。"),
    # 光伏并网主线
    "mppt": ("mppt_climb", "工作点沿 P-V 功率曲线向上攀爬，逼近顶端最大功率点后在其附近小幅扰动——MPPT 像爬山者反复试探，始终榨取当前光照下的最大发电功率。"),
    "pll": ("pll_lock", "逆变器输出正弦（蓝）从与电网（灰）错相起步，逐步平移直至完全重合——锁相环把相位误差驱至零，使并网电流与电网电压严格同步。"),
    "pv_array_model": ("pv_iv_curve", "工作点沿光伏 I-V 曲线从短路电流(Isc)扫向开路电压(Voc)：低压段近似恒流，越过膝点后电流陡降，绿色矩形 Vmpp×Impp 面积最大处即最大功率点。"),
    "grid_inverter_control": ("grid_dq_inject", "dq 电流环把并网电流解耦为两路：有功分量 id（绿）阶跃整定、略超调后稳定；无功分量 iq（蓝）始终压在零——实现单位功率因数、有功无功互不干扰的并网注入。"),
    "islanding_detection": ("islanding_trip", "电网（灰）正常时逆变器输出（蓝）与之同步；一旦电网失电，本地电压塌缩越过红色保护阈值，孤岛检测在两秒内触发跳闸（红灯）切断逆变器，保护检修人员安全。"),
    "pv_grid_system": ("pv_power_flow", "金色能量包从太阳照射的光伏阵列出发，依次流经 Boost 升压(MPPT)、并网逆变器、注入电网——一条贯通光电转换、功率变换与并网控制的完整能量链路。"),
}

def main():
    os.makedirs(LOTTIE_DIR, exist_ok=True)
    # 1) 生成原型文件
    for name, fn in ARCHETYPES.items():
        data = fn()
        with open(os.path.join(LOTTIE_DIR, name + ".json"), "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    print("生成原型:", len(ARCHETYPES), "个")

    # 2) 注入 anim 字段
    gold = json.load(open(GOLD_JSON, encoding="utf-8"))
    injected = 0
    for n in gold:
        d = n.get("detail")
        if not isinstance(d, dict):
            continue
        nid = n["id"]
        if nid in MAPPING and "anim" not in d:
            src, cap = MAPPING[nid]
            d["anim"] = {"type": "lottie", "src": src, "caption": cap}
            injected += 1
    with open(GOLD_JSON, "w", encoding="utf-8") as f:
        json.dump(gold, f, ensure_ascii=False, indent=2)
    print("注入 anim:", injected, "个")

    # 3) 自检
    gold = json.load(open(GOLD_JSON, encoding="utf-8"))
    files = {os.path.splitext(f)[0] for f in os.listdir(LOTTIE_DIR) if f.endswith(".json")}
    has = [n for n in gold if isinstance(n.get("detail"), dict) and "anim" in n["detail"]]
    miss = [n["id"] for n in has if n["detail"]["anim"]["src"] not in files]
    for f in files:
        json.load(open(os.path.join(LOTTIE_DIR, f + ".json"), encoding="utf-8"))  # 合法性
    cov = len(has) / len(gold) * 100
    print("=" * 40)
    print("总节点 %d | 带动图 %d | 覆盖率 %.1f%%" % (len(gold), len(has), cov))
    print("素材文件 %d 个" % len(files))
    print("悬挂 src:", miss if miss else "无")
    assert not miss, "存在未命中素材的 src"
    assert cov > 70, "覆盖率未达 70%%"
    print("自检通过 [OK]")

if __name__ == "__main__":
    main()
