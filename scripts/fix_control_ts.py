import json

with open('src/data/goldThread.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

node = next(n for n in data if n['id'] == 'control_theory_basics')
detail = node['detail']

detail['formulas'][2] = r't_s \approx \frac{4}{\zeta\omega_n} \quad \text{(2\%稳定时间)}'

detail['formulas_steps'][2] = {
    'formula': r't_s \approx \frac{4}{\zeta\omega_n} \quad \text{(2\%稳定时间)}',
    'steps': [
        {
            'latex': r'\text{二阶系统标准形式：}G(s) = \frac{\omega_n^2}{s^2 + 2\zeta\omega_n s + \omega_n^2}',
            'note': 'ζ 为阻尼比，ωn 为自然频率'
        },
        {
            'latex': r'\text{欠阻尼（0<ζ<1）时响应有超调，包络时间常数} = \frac{1}{\zeta\omega_n}',
            'note': r'超调量 OS\% = e^{-\pi\zeta/\sqrt{1-\zeta^2}} \times 100\%'
        },
        {
            'latex': r't_s \approx \frac{4}{\zeta\omega_n} \quad (2\%\text{准则})',
            'note': '调节时间与阻尼比和自然频率的乘积成反比'
        }
    ]
}

with open('src/data/goldThread.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print('Fixed:', detail['formulas'][2])
