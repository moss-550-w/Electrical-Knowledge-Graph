import json

with open('src/data/goldThread.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# ── clark_transform ────────────────────────────────────────────────────────────
clark = next(n for n in data if n['id'] == 'clark_transform')
clark['detail']['formulas_steps'] = [
    {
        'formula': r'\begin{bmatrix} x_\alpha \\ x_\beta \end{bmatrix} = \frac{2}{3}\begin{bmatrix} 1 & -\frac{1}{2} & -\frac{1}{2} \\ 0 & \frac{\sqrt{3}}{2} & -\frac{\sqrt{3}}{2} \end{bmatrix} \begin{bmatrix} x_a \\ x_b \\ x_c \end{bmatrix}',
        'steps': [
            {
                'latex': r'\text{目标：三相量（轴线互差 120°）等效为两相正交量，保持合成磁动势不变}',
                'note': 'α 轴与 a 相轴线重合'
            },
            {
                'latex': r'F_\alpha = x_a\cos 0^\circ + x_b\cos 120^\circ + x_c\cos 240^\circ = x_a - \tfrac{1}{2}x_b - \tfrac{1}{2}x_c',
                'note': '各相磁动势在 α 轴的投影之和'
            },
            {
                'latex': r'F_\beta = x_a\sin 0^\circ + x_b\sin 120^\circ + x_c\sin 240^\circ = \tfrac{\sqrt{3}}{2}x_b - \tfrac{\sqrt{3}}{2}x_c',
                'note': '利用 ia+ib+ic=0 可进一步化简'
            },
            {
                'latex': r'\text{等幅值原则：引入系数 }\tfrac{2}{3}\text{，使变换后幅值与原幅值相同}',
                'note': '也有等功率原则（系数 √(2/3)），取决于应用场景'
            },
            {
                'latex': r'\Rightarrow \text{Clarke 矩阵} = \tfrac{2}{3}\begin{bmatrix}1&-\tfrac{1}{2}&-\tfrac{1}{2}\\0&\tfrac{\sqrt{3}}{2}&-\tfrac{\sqrt{3}}{2}\end{bmatrix}',
                'note': '输出仍是交流量，需再经 Park 变换才能 DC 化'
            }
        ]
    }
]

# ── park_transform ─────────────────────────────────────────────────────────────
park = next(n for n in data if n['id'] == 'park_transform')
park['detail']['formulas_steps'] = [
    {
        'formula': r'\begin{bmatrix} x_d \\ x_q \end{bmatrix} = \begin{bmatrix} \cos\theta & \sin\theta \\ -\sin\theta & \cos\theta \end{bmatrix} \begin{bmatrix} x_\alpha \\ x_\beta \end{bmatrix}',
        'steps': [
            {
                'latex': r'\text{问题：}(x_\alpha, x_\beta)\text{ 仍是交流量，PI 控制器无法无静差跟踪正弦指令}',
                'note': '需要变换到随转子同步旋转的坐标系'
            },
            {
                'latex': r'\text{引入 dq 坐标系：d 轴与转子永磁体 N 极重合，以电角速度 }\omega_e\text{ 旋转}',
                'note': 'θ = ∫ωe dt，由编码器/观测器实时获取'
            },
            {
                'latex': r'x_d = x_\alpha\cos\theta + x_\beta\sin\theta \quad \text{（d 轴投影）}',
                'note': '将静止 αβ 矢量投影到旋转 dq 坐标系'
            },
            {
                'latex': r'x_q = -x_\alpha\sin\theta + x_\beta\cos\theta \quad \text{（q 轴投影，超前 d 轴 90°）}',
                'note': '本质是二维旋转矩阵（逆时针旋转 θ 角）'
            },
            {
                'latex': r'\text{在同步旋转系中，稳态时 }x_d, x_q\text{ 均为直流量，PI 控制器可实现零稳差}',
                'note': 'FOC 的核心优势：交流电机变成"直流电机"控制'
            }
        ]
    },
    {
        'formula': r'\theta = \int_0^t \omega_e(\tau)\,d\tau + \theta_0',
        'steps': [
            {
                'latex': r'\theta = \int_0^t \omega_e(\tau)\,d\tau + \theta_0 \quad \text{（转子电角度由角速度积分得到）}',
                'note': '初始角 θ₀ 由上电对齐或编码器零点决定'
            },
            {
                'latex': r'\omega_e = \frac{P}{2}\omega_m \quad \text{（电角速度 = 极对数 × 机械角速度）}',
                'note': '4极电机（P=4）：电角速度是机械角速度的 2 倍'
            },
            {
                'latex': r'\text{实际中 }\theta\text{ 由编码器/解算器/观测器提供——FOC 的控制精度完全依赖 }\theta\text{ 的准确性}',
                'note': '无位置传感器控制（Sensorless）的核心难题即为估计 θ'
            }
        ]
    }
]

# ── dq_transform ───────────────────────────────────────────────────────────────
dq = next(n for n in data if n['id'] == 'dq_transform')

# Fix formulas[2] corrupt \text{（逆Park）}
dq['detail']['formulas'][2] = (
    r'\begin{bmatrix} i_\alpha \\ i_\beta \end{bmatrix} = '
    r'\begin{bmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{bmatrix} '
    r'\begin{bmatrix} i_d \\ i_q \end{bmatrix} \quad \text{（逆 Park）}'
)

dq['detail']['formulas_steps'] = [
    {
        'formula': r'\begin{bmatrix} i_\alpha \\ i_\beta \end{bmatrix} = \frac{2}{3}\begin{bmatrix} 1 & -\frac{1}{2} & -\frac{1}{2} \\ 0 & \frac{\sqrt{3}}{2} & -\frac{\sqrt{3}}{2} \end{bmatrix} \begin{bmatrix} i_a \\ i_b \\ i_c \end{bmatrix} \quad \text{(Clarke)}',
        'steps': [
            {
                'latex': r'\text{目标：用两相正交量 }(i_\alpha, i_\beta)\text{ 等效三相量，保持合成磁动势不变}',
                'note': 'α 轴与 a 相轴线重合'
            },
            {
                'latex': r'F_\alpha = i_a \cdot 1 + i_b\cos 120^\circ + i_c\cos 240^\circ = i_a - \tfrac{1}{2}i_b - \tfrac{1}{2}i_c',
                'note': '各相磁动势在 α 轴投影之和'
            },
            {
                'latex': r'F_\beta = i_b\sin 120^\circ + i_c\sin 240^\circ = \tfrac{\sqrt{3}}{2}i_b - \tfrac{\sqrt{3}}{2}i_c',
                'note': '利用 ia+ib+ic=0 可进一步化简'
            },
            {
                'latex': r'\text{等幅值原则引入系数 }\tfrac{2}{3}\text{，使 }|\vec{i}_s|_{\alpha\beta} = |\vec{i}_s|_{abc}',
                'note': '保持电流矢量幅值不变'
            },
            {
                'latex': r'\Rightarrow \text{Clarke 变换矩阵} = \tfrac{2}{3}\begin{bmatrix}1&-\tfrac{1}{2}&-\tfrac{1}{2}\\0&\tfrac{\sqrt{3}}{2}&-\tfrac{\sqrt{3}}{2}\end{bmatrix}',
                'note': '输出 iα、iβ 仍为交流量'
            }
        ]
    },
    {
        'formula': r'\begin{bmatrix} i_d \\ i_q \end{bmatrix} = \begin{bmatrix} \cos\theta & \sin\theta \\ -\sin\theta & \cos\theta \end{bmatrix} \begin{bmatrix} i_\alpha \\ i_\beta \end{bmatrix} \quad \text{(Park)}',
        'steps': [
            {
                'latex': r'\text{问题：}(i_\alpha, i_\beta)\text{ 仍是交流量，PI 控制器无法无静差跟踪正弦指令}',
                'note': '需要变换到随转子同步旋转的坐标系'
            },
            {
                'latex': r'\text{引入 dq 坐标系：d 轴与转子永磁体 N 极重合，以电角速度 }\omega_e\text{ 旋转}',
                'note': 'θ = ∫ωe dt，由编码器/观测器实时获取'
            },
            {
                'latex': r'\text{将矢量从静止 }(\alpha\beta)\text{ 投影到旋转 }(dq)\text{：等同于坐标系逆时针旋转 }\theta\text{ 角}',
                'note': '旋转变换矩阵本质是二维旋转矩阵'
            },
            {
                'latex': r'i_d = i_\alpha\cos\theta + i_\beta\sin\theta, \quad i_q = -i_\alpha\sin\theta + i_\beta\cos\theta',
                'note': 'dq 系中稳态均为直流量，PI 可实现零稳差'
            },
            {
                'latex': r'\text{完整链路：}i_a, i_b, i_c \xrightarrow{\text{Clarke}} i_\alpha, i_\beta \xrightarrow{\text{Park}} i_d, i_q',
                'note': '逆变换（逆 Park + 逆 Clarke）用于将 vd、vq 还原为三相 PWM 指令'
            }
        ]
    },
    {
        'formula': r'\begin{bmatrix} i_\alpha \\ i_\beta \end{bmatrix} = \begin{bmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{bmatrix} \begin{bmatrix} i_d \\ i_q \end{bmatrix} \quad \text{（逆 Park）}',
        'steps': [
            {
                'latex': r'\text{逆 Park：将 PI 控制器输出的 }(v_d, v_q)\text{ 还原到静止 }(\alpha\beta)\text{ 系}',
                'note': '逆旋转矩阵 = 旋转矩阵的转置（正交矩阵性质）'
            },
            {
                'latex': r'\begin{bmatrix}\cos\theta & -\sin\theta\\\sin\theta & \cos\theta\end{bmatrix} = \begin{bmatrix}\cos\theta & \sin\theta\\-\sin\theta & \cos\theta\end{bmatrix}^T',
                'note': '顺时针旋转 θ 角，与 Park 变换方向相反'
            },
            {
                'latex': r'v_\alpha = v_d\cos\theta - v_q\sin\theta, \quad v_\beta = v_d\sin\theta + v_q\cos\theta',
                'note': '得到 vα、vβ 后再经逆 Clarke（或直接 SVPWM）输出三相电压'
            }
        ]
    }
]

with open('src/data/goldThread.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

# Verify no control chars remain
with open('src/data/goldThread.json', 'rb') as f:
    raw = f.read()
for c in [b'\x08', b'\x0b', b'\x0c']:
    n = raw.count(c)
    print(f'{c!r}: {n} occurrences')
print('Done.')
