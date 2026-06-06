const fs = require('fs');
const path = 'src/data/goldThread.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));
const idx = {};
data.forEach((n, i) => { idx[n.id] = i; });

const steps = {
  clark_transform: [
    {
      formula: data[idx.clark_transform].detail.formulas[0],
      steps: [
        { latex: '\\text{物理本质：三相绕组（轴线互差120°）产生的磁动势，用两相正交绕组（αβ）等效}', note: '等效条件：合成磁动势大小和方向完全相同' },
        { latex: 'F_\\alpha = x_a\\cos0°+x_b\\cos120°+x_c\\cos240° = x_a-\\tfrac{1}{2}x_b-\\tfrac{1}{2}x_c', note: '各相在 α 轴（a 相轴线方向）上的投影之和' },
        { latex: 'F_\\beta = x_a\\sin0°+x_b\\sin120°+x_c\\sin240° = \\tfrac{\\sqrt{3}}{2}x_b-\\tfrac{\\sqrt{3}}{2}x_c', note: '各相在 β 轴（超前 α 轴 90°）上的投影' },
        { latex: '\\text{等幅值原则：乘以系数}\\tfrac{2}{3}\\text{，使变换后幅值与原三相幅值相同}', note: '也可用功率不变原则（系数√(2/3)），两者各有适用场景' },
        { latex: '\\Rightarrow \\text{Clarke 矩阵} = \\tfrac{2}{3}\\begin{bmatrix}1&-\\tfrac{1}{2}&-\\tfrac{1}{2}\\\\0&\\tfrac{\\sqrt{3}}{2}&-\\tfrac{\\sqrt{3}}{2}\\end{bmatrix}', note: '这就是为什么矩阵第一行是 [1,-1/2,-1/2]，第二行是 [0,√3/2,-√3/2]' }
      ]
    }
  ],
  park_transform: [
    {
      formula: data[idx.park_transform].detail.formulas[0],
      steps: [
        { latex: '\\text{问题：}(x_\\alpha,x_\\beta)\\text{ 在静止坐标系中是正弦量，PI 控制器无法无静差跟踪}', note: '直流量才能被 PI 无静差控制' },
        { latex: '\\text{引入 dq 坐标系：以}\\omega_e\\text{旋转，d 轴与转子磁场对齐，观察者随转子旋转}', note: '在旋转观察者眼中，正弦交流量变为恒定直流量' },
        { latex: 'x_d = x_\\alpha\\cos\\theta+x_\\beta\\sin\\theta\\quad\\text{（d 轴投影）}', note: '' },
        { latex: 'x_q = -x_\\alpha\\sin\\theta+x_\\beta\\cos\\theta\\quad\\text{（q 轴投影，超前 d 轴 90°）}', note: '' },
        { latex: '\\text{矩阵形式即为标准二维旋转矩阵（顺时针旋转}\\theta\\text{）}', note: '旋转矩阵满足正交性：逆矩阵=转置矩阵，逆变换只需转置' }
      ]
    },
    {
      formula: data[idx.park_transform].detail.formulas[1],
      steps: [
        { latex: '\\theta = \\int_0^t\\omega_e(\\tau)\\,d\\tau+\\theta_0\\text{：转子电角度由电角速度积分得到}', note: '' },
        { latex: '\\omega_e = \\tfrac{P}{2}\\omega_m\\text{：电角速度 = 极对数 × 机械角速度}', note: '' },
        { latex: '\\text{实际中}\\theta\\text{由编码器/旋变/观测器提供，FOC 的精度完全依赖}\\theta\\text{的准确性}', note: '无位置传感器 FOC（Sensorless）的核心挑战就在于估计 θ' }
      ]
    }
  ],
  space_vector: [
    {
      formula: data[idx.space_vector].detail.formulas[0],
      steps: [
        { latex: '\\vec{a}=e^{j120°}\\text{：单位旋转算子，将向量逆时针旋转120°}', note: '' },
        { latex: 'x_a\\text{在}0°\\text{方向，}x_b\\text{在}120°\\text{方向（乘}\\vec{a}\\text{），}x_c\\text{在}240°\\text{方向（乘}\\vec{a}^2\\text{）}', note: '将三个标量合并为一个旋转复矢量' },
        { latex: '\\vec{x}_s = \\tfrac{2}{3}(x_a+\\vec{a}x_b+\\vec{a}^2 x_c)\\text{：三相合成矢量}', note: '系数 2/3 保持等幅值，与 Clarke 变换完全等价' },
        { latex: '\\text{三相对称时（}x_a=X_m\\cos\\omega t\\text{ 等）：}|\\vec{x}_s|=X_m\\text{，}\\vec{x}_s\\text{匀速旋转}', note: '这就是"旋转磁场"的数学本质' }
      ]
    },
    {
      formula: data[idx.space_vector].detail.formulas[1],
      steps: [
        { latex: '\\vec{x}_s = x_\\alpha+jx_\\beta\\text{：空间矢量在直角坐标系中的表示}', note: '实部 = α 轴分量，虚部 = β 轴分量' },
        { latex: '= |\\vec{x}_s|e^{j\\theta_x}\\text{：极坐标表示，模值为幅值，辐角为相位}', note: '' },
        { latex: '\\text{空间矢量统一了三相量、αβ 量和 dq 量的描述框架}', note: 'Park 变换本质：将 αβ 矢量乘以 e^{-jθ}，即在复平面旋转 -θ 角' }
      ]
    }
  ],
  current_loop: [
    {
      formula: data[idx.current_loop].detail.formulas[0],
      steps: [
        { latex: 'u_d^*=(K_p+\\tfrac{K_i}{s})(i_d^*-i_d)-\\omega_e L_q i_q', note: '' },
        { latex: '\\text{第一项 PI 输出：消除}i_d\\text{误差}', note: '' },
        { latex: '\\text{第二项}-\\omega_e L_q i_q\\text{：前馈解耦，补偿 dq 交叉耦合干扰}', note: '不加解耦时，q 轴电流变化会通过 ωeLqiq 干扰 d 轴，两路相互耦合' },
        { latex: '\\text{加解耦后，d 轴等效为：}U_d = L_d\\tfrac{dI_d}{dt}+R_s I_d\\text{（纯一阶系统）}', note: '可独立设计 PI 参数，带宽约 fsw/10' }
      ]
    },
    {
      formula: data[idx.current_loop].detail.formulas[1],
      steps: [
        { latex: 'u_q^*=(K_p+\\tfrac{K_i}{s})(i_q^*-i_q)+\\omega_e(L_d i_d+\\psi_f)', note: '' },
        { latex: '\\text{前馈项}+\\omega_e(L_d i_d+\\psi_f)\\text{：补偿 q 轴中的反电动势和交叉耦合}', note: '' },
        { latex: '\\omega_e\\psi_f\\text{（反电动势）随转速线性增大，高速时占据大部分}u_q^*\\text{，影响控制余量}', note: '弱磁控制：当 uq 饱和时，注入负 id 以减小等效反电动势' }
      ]
    },
    {
      formula: data[idx.current_loop].detail.formulas[2],
      steps: [
        { latex: 'BW_{current}\\approx\\tfrac{f_{sw}}{10}\\text{：电流环带宽约为开关频率的1/10}', note: '' },
        { latex: '\\text{理由：PWM 更新频率为}f_{sw}\\text{，控制量每}T_{sw}\\text{更新一次，奈奎斯特限制了可控带宽}', note: '' },
        { latex: '\\text{例：}f_{sw}=10\\text{kHz}\\Rightarrow BW_{current}\\approx1\\text{kHz}', note: '速度环带宽需再低5~10倍，级联控制的频域分离原则' }
      ]
    }
  ],
  speed_loop: [
    {
      formula: data[idx.speed_loop].detail.formulas[0],
      steps: [
        { latex: 'i_q^*=(K_{p\\omega}+\\tfrac{K_{i\\omega}}{s})(\\omega_m^*-\\omega_m)\\text{：速度 PI 控制器输出为 q 轴电流给定}', note: '' },
        { latex: '\\text{速度误差→PI→}i_q^*\\text{（转矩电流）→电流环→电机转矩→速度}', note: '级联结构：外环产生内环的给定' },
        { latex: '\\text{积分限幅（Anti-windup）：限制}i_q^*\\text{不超过电机额定电流}', note: '防止快速升速时积分饱和导致超调' }
      ]
    },
    {
      formula: data[idx.speed_loop].detail.formulas[1],
      steps: [
        { latex: 'BW_{speed}\\approx\\tfrac{BW_{current}}{5}\\sim\\tfrac{BW_{current}}{10}', note: '' },
        { latex: '\\text{带宽分离原则：内外环带宽需相差 5-10 倍，保证控制稳定性}', note: '若两环带宽接近，内环动态会被外环"看见"，导致不稳定' },
        { latex: '\\text{例：电流环 1kHz，速度环 100~200Hz}', note: '机械时间常数远大于电气时间常数，这一分离在物理上也是合理的' }
      ]
    }
  ],
  ac_motor_principles: [
    {
      formula: data[idx.ac_motor_principles].detail.formulas[0],
      steps: [
        { latex: 'n_s=\\tfrac{60f}{p}\\text{（r/min）：旋转磁场每分钟转速}', note: '' },
        { latex: '\\text{电源每个周期（}1/f\\text{秒），磁场转过一对极距（360°/p对极 = 2/p圈）}', note: '' },
        { latex: '\\text{每秒转数：}\\tfrac{f}{p/2}=\\tfrac{2f}{p}\\text{（r/s）}\\Rightarrow\\text{每分钟：}n_s=\\tfrac{60f}{p}', note: 'p=2（一对极）时，50Hz 对应 3000 r/min；p=4 时 1500 r/min' }
      ]
    },
    {
      formula: data[idx.ac_motor_principles].detail.formulas[1],
      steps: [
        { latex: 's=\\tfrac{n_s-n}{n_s}\\text{：转差率 = 同步转速与实际转速之差/同步转速}', note: '' },
        { latex: '\\text{同步电机：}n=n_s\\Rightarrow s=0\\text{（精确同步，永磁体"锁住"磁场）}', note: '' },
        { latex: '\\text{感应电机：}n<n_s\\Rightarrow s>0\\text{（必须有相对运动才能感应电流产生转矩）}', note: '满载时 s≈0.03~0.08，空载时 s≈0' }
      ]
    },
    {
      formula: data[idx.ac_motor_principles].detail.formulas[2],
      steps: [
        { latex: 'T_e=kB_sB_r\\sin\\delta\\text{：转矩正比于定转子磁场的正弦夹角}', note: '' },
        { latex: '\\text{类比：两个磁铁相互作用，夹角 90° 时转矩最大；0° 时转矩为零}', note: '' },
        { latex: '\\text{矢量控制的精髓：强制维持}\\delta=90°\\text{（id=0 时 dq 轴正交），使转矩最大化}', note: '这就是为什么矢量控制比标量控制效率高的根本原因' }
      ]
    }
  ],
  rotating_magnetic_field: [
    {
      formula: data[idx.rotating_magnetic_field].detail.formulas[0],
      steps: [
        { latex: 'F_a(\\theta,t)=F_m\\cos\\theta\\cos\\omega t\\text{：单相绕组产生的脉振磁动势}', note: '' },
        { latex: '\\text{空间上}\\cos\\theta\\text{：沿轴线正弦分布（绕组结构决定）}', note: '' },
        { latex: '\\text{时间上}\\cos\\omega t\\text{：随电流正弦变化}', note: '两个方向都有余弦，所以叫"脉振"——在空间固定方向上幅值振动' }
      ]
    },
    {
      formula: data[idx.rotating_magnetic_field].detail.formulas[1],
      steps: [
        { latex: 'F_a+F_b+F_c\\text{：三相磁动势叠加}', note: '利用积化和差公式' },
        { latex: 'F_a=F_m\\cos\\theta\\cos\\omega t = \\tfrac{F_m}{2}[\\cos(\\theta-\\omega t)+\\cos(\\theta+\\omega t)]', note: '分解为正向旋转波和反向旋转波' },
        { latex: 'F_b=\\tfrac{F_m}{2}[\\cos(\\theta-\\omega t)+\\cos(\\theta+\\omega t-240°)]', note: 'b 相空间滞后120°，时间滞后120°' },
        { latex: 'F_c=\\tfrac{F_m}{2}[\\cos(\\theta-\\omega t)+\\cos(\\theta+\\omega t+240°)]', note: '' },
        { latex: '\\text{三个反向波叠加相消：}\\sum\\cos(\\theta+\\omega t+k\\cdot120°)=0', note: '' },
        { latex: '\\Rightarrow F_{total}=\\tfrac{3}{2}F_m\\cos(\\theta-\\omega t)\\text{：幅值恒为}\\tfrac{3}{2}F_m\\text{的旋转磁动势}', note: '这就是三相绕组能产生旋转磁场的数学证明' }
      ]
    },
    {
      formula: data[idx.rotating_magnetic_field].detail.formulas[2],
      steps: [
        { latex: '\\omega_s=2\\pi f\\text{（rad/s）：旋转磁场的电角速度}', note: '与电源频率完全对应' },
        { latex: '\\text{机械角速度：}\\Omega_s=\\tfrac{\\omega_s}{p/2}=\\tfrac{4\\pi f}{p}\\text{（rad/s）}', note: '' },
        { latex: '\\text{同步转速：}n_s=\\tfrac{60\\Omega_s}{2\\pi}=\\tfrac{60f}{p/2}=\\tfrac{120f}{p}\\text{（注：p 为总极数）}', note: '与之前公式等价，注意 p 的定义（极数 vs 极对数）要一致' }
      ]
    }
  ]
};

Object.entries(steps).forEach(([id, s]) => {
  if (idx[id] !== undefined) data[idx[id]].detail.formulas_steps = s;
});
fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
console.log('batch2 ok:', Object.keys(steps).join(', '));
