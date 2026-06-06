import json

with open('src/data/goldThread.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

node = next(n for n in data if n['id'] == 'faraday_law')
detail = node['detail']

# Fix formulas[1] corrupt \text content
detail['formulas'][1] = r'\mathcal{E} = Blv \quad \text{（运动电动势）}'

# Rewrite formulas_steps entirely
detail['formulas_steps'] = [
    {
        'formula': r'\mathcal{E} = -\frac{d\Phi}{dt} = -N\frac{d\phi}{dt}',
        'steps': [
            {
                'latex': r'\Phi = \iint_S \vec{B} \cdot d\vec{S} \quad \text{——穿过闭合回路的磁通量}',
                'note': '单位：Wb（韦伯）= V·s'
            },
            {
                'latex': r'\text{Faraday 实验：} |\mathcal{E}| \propto \frac{\Delta\Phi}{\Delta t} \text{，方向由 Lenz 定律决定}',
                'note': '感应电流总阻碍引起它的磁通变化'
            },
            {
                'latex': r'\text{负号来源——能量守恒：若 } \mathcal{E} \text{ 方向使磁通增大将无限自激（违反守恒）}',
                'note': '负号是 Lenz 定律的数学表达'
            },
            {
                'latex': r'\mathcal{E} = -\frac{d\Phi}{dt} = -N\frac{d\phi}{dt}',
                'note': 'N 匝线圈：每匝磁通 φ 叠加'
            }
        ]
    },
    {
        'formula': r'\mathcal{E} = Blv \quad \text{（运动电动势）}',
        'steps': [
            {
                'latex': r'f = qv \times B \quad \text{（洛伦兹力驱动导体内自由电荷定向运动）}',
                'note': '导体以速度 v 切割磁力线'
            },
            {
                'latex': r'\mathcal{E} = \int_0^l (v \times B) \cdot dl = Blv',
                'note': 'B⊥v⊥l 三者两两垂直时取最大值'
            },
            {
                'latex': r'\mathcal{E} = Blv',
                'note': 'PMSM 中 q 轴反电动势 = ωe·ψf，本质即此'
            }
        ]
    },
    {
        'formula': r'\oint_C \mathbf{E} \cdot d\mathbf{l} = -\frac{d}{dt}\iint_S \mathbf{B} \cdot d\mathbf{S}',
        'steps': [
            {
                'latex': r'\text{法拉第定律微分形式（来自麦克斯韦第三方程）}',
                'note': '积分形式到微分形式通过 Stokes 定理转化'
            },
            {
                'latex': r'\oint_C \mathbf{E} \cdot d\mathbf{l} = -\frac{d\Phi_B}{dt}',
                'note': '变化的磁场在周围空间产生感应电场'
            },
            {
                'latex': r'\oint_C \mathbf{E} \cdot d\mathbf{l} = -\frac{d}{dt}\iint_S \mathbf{B} \cdot d\mathbf{S}',
                'note': '电机中 ① 变压器电动势：绕组静止，dΦ/dt≠0；② 运动电动势：E=Blv'
            }
        ]
    }
]

with open('src/data/goldThread.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

# Verify: no control chars
with open('src/data/goldThread.json', 'rb') as f:
    raw = f.read()
for ctrl in [b'\x0b', b'\x0c']:
    count = raw.count(ctrl)
    print(f'Control char {ctrl!r}: {count} occurrences')
print('Done.')
