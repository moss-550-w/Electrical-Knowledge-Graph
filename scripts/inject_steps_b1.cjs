const fs = require('fs');
const path = 'src/data/goldThread.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));
const idx = {};
data.forEach((n, i) => { idx[n.id] = i; });

const steps = {
  pmsm_vector_control: [
    {
      formula: data[idx.pmsm_vector_control].detail.formulas[0],
      steps: [
        { latex: '\\text{目标：将三相电流}(i_a,i_b,i_c)\\text{变换为旋转坐标系}(i_d,i_q)', note: '让交流电机像直流电机一样控制' },
        { latex: '\\text{步骤①：Clarke——三相}\\to\\text{两相静止}(\\alpha\\beta)', note: '' },
        { latex: '\\text{步骤②：Park——将}(\\alpha\\beta)\\text{按转子角}\\theta\\text{旋转到}(dq)', note: 'θ 由编码器实时获取' },
        { latex: 'i_d = \\tfrac{2}{3}[i_a\\cos\\theta+i_b\\cos(\\theta-120^\\circ)+i_c\\cos(\\theta+120^\\circ)]', note: '两步合并即为题目矩阵公式' },
        { latex: 'i_q = \\tfrac{2}{3}[-i_a\\sin\\theta-i_b\\sin(\\theta-120^\\circ)-i_c\\sin(\\theta+120^\\circ)]', note: 'd 轴控制磁通，q 轴控制转矩，完全解耦' }
      ]
    },
    {
      formula: data[idx.pmsm_vector_control].detail.formulas[1],
      steps: [
        { latex: 'T_e = \\tfrac{3P}{4}(\\psi_d i_q - \\psi_q i_d)', note: '由功率守恒推导：电磁功率 = 转矩 × 角速度' },
        { latex: '\\psi_d = L_d i_d + \\psi_f,\\quad \\psi_q = L_q i_q', note: '永磁体产生的磁链 ψf 仅在 d 轴' },
        { latex: 'T_e = \\tfrac{3P}{4}[(L_d i_d+\\psi_f)i_q - L_q i_q i_d]', note: '' },
        { latex: '= \\tfrac{3P}{4}[\\psi_f i_q + (L_d-L_q)i_d i_q]', note: '第一项：永磁转矩；第二项：磁阻转矩（凸极效应）' },
        { latex: '\\text{贴装式 PMSM}(L_d=L_q)\\Rightarrow T_e = \\tfrac{3P}{4}\\psi_f i_q', note: '转矩仅由 iq 决定，控制最简洁' }
      ]
    },
    {
      formula: data[idx.pmsm_vector_control].detail.formulas[2],
      steps: [
        { latex: 'J\\tfrac{d\\omega_m}{dt} = T_e - T_L - B\\omega_m', note: '牛顿第二定律在旋转系统中的类比' },
        { latex: 'T_e\\text{：电磁力矩（驱动）；}T_L\\text{：负载阻力矩；}B\\omega_m\\text{：粘性摩擦}', note: '' },
        { latex: '\\text{稳态}(\\dot{\\omega}=0)\\Rightarrow T_e = T_L + B\\omega_m', note: '电机转矩等于负载加摩擦' },
        { latex: '\\text{加速：}T_e>T_L,\\quad \\tfrac{d\\omega_m}{dt}=\\tfrac{T_e-T_L-B\\omega_m}{J}', note: 'J 越大加速越慢，惯量匹配是伺服设计关键' }
      ]
    }
  ],
  three_phase_inverter: [
    {
      formula: data[idx.three_phase_inverter].detail.formulas[0],
      steps: [
        { latex: '\\text{设上管}S_x=1\\text{，下管}S_x=0\\text{；上管输出接}+V_{dc}\\text{，下管接地}', note: '' },
        { latex: 'v_{xO} = S_x \\cdot V_{dc}\\quad(O\\text{为直流母线负极})', note: '' },
        { latex: '\\text{三相负载中性点电位：}V_N = \\tfrac{1}{3}(v_{aO}+v_{bO}+v_{cO}) = \\tfrac{V_{dc}}{3}(S_a+S_b+S_c)', note: 'Y 型对称负载，中性点浮动' },
        { latex: 'v_a = v_{aO}-V_N = \\tfrac{V_{dc}}{3}(2S_a-S_b-S_c)', note: '' },
        { latex: '\\text{整理为矩阵：对角元为}2\\text{，其余为}-1\\text{——即题目中的系数矩阵}', note: '三相互为参考，所以每项都包含其他两相' }
      ]
    },
    {
      formula: data[idx.three_phase_inverter].detail.formulas[1],
      steps: [
        { latex: 'S_x\\in\\{0,1\\}\\text{：每桥臂仅两态，上下管互补导通（不能同时=死区保护）}', note: '' },
        { latex: '\\text{三桥臂独立：}2^3=8\\text{种开关组合}', note: '6个非零电压矢量 + 2个零矢量，SVPWM 在其间切换' }
      ]
    }
  ],
  igbt_mosfet: [
    {
      formula: data[idx.igbt_mosfet].detail.formulas[0],
      steps: [
        { latex: '\\text{功率器件损耗 = 通态损耗 + 开关损耗}', note: '两类分别优化，是器件选型的核心' },
        { latex: 'P_{cond} = I_{rms}^2 R_{on}\\text{：电流流过导通电阻，焦耳定律}', note: 'SiC MOSFET 的 Rds(on) 远小于 Si，通态损耗低' },
        { latex: 'P_{sw} = \\tfrac{1}{2}V_{ds}I_d(t_{on}+t_{off})f_{sw}\\text{：每次开关有电压电流交叠}', note: '线性近似下的三角形交叠面积' },
        { latex: 'f_{sw}\\uparrow\\Rightarrow P_{sw}\\uparrow\\text{，高频变换器散热是主要挑战}', note: 'SiC/GaN 宽禁带器件能在更高频率下保持低损耗' }
      ]
    },
    {
      formula: data[idx.igbt_mosfet].detail.formulas[1],
      steps: [
        { latex: 'E_{sw}=\\int_0^{t_{sw}}v(t)\\cdot i(t)\\,dt\\text{：开关过程中电压与电流同时存在的乘积}', note: '' },
        { latex: '\\text{关断时：}v\\text{ 从 0 升至 }V_{dc}\\text{，}i\\text{ 从 }I_d\\text{ 降至 0，近似三角形}', note: 'IGBT 还有拖尾电流，使实际损耗更大' },
        { latex: '\\Rightarrow E_{sw}\\approx\\tfrac{1}{2}V_{dc}I_d t_{sw}', note: '这就是前一公式 1/2 系数的物理来源' }
      ]
    }
  ],
  gate_drive: [
    {
      formula: data[idx.gate_drive].detail.formulas[0],
      steps: [
        { latex: '\\text{栅极等效为电容}C_{iss}\\text{，充电电流}I=C\\tfrac{dV}{dt}\\text{，电流越大开关越快}', note: '' },
        { latex: '\\text{峰值电流由驱动电压差除以总电阻决定：}I_{peak}=\\tfrac{\\Delta V_{gs}}{R_{total}}', note: '' },
        { latex: 'R_{total}=R_{gate}(\\text{外部可调})+R_{g(int)}(\\text{芯片内部，固定})', note: '增大 Rgate 可降低 di/dt 和 EMI，但开关变慢损耗增大' }
      ]
    },
    {
      formula: data[idx.gate_drive].detail.formulas[1],
      steps: [
        { latex: 't_{sw}\\approx\\tfrac{Q_g}{I_{gate(avg)}}\\text{：开关时间 = 总电荷 ÷ 平均充电电流}', note: '类比"充满水桶的时间 = 容量 ÷ 流量"' },
        { latex: 'Q_g\\text{ 由 datasheet 给出，含米勒平台阶段（Cgd 充电最耗时）}', note: '米勒效应是栅极驱动设计最需关注的特性' },
        { latex: '\\text{要快}\\Rightarrow\\text{大}I_{gate}\\Rightarrow\\text{小}R_{gate}\\Rightarrow\\text{大 di/dt，EMI 增大}', note: '这是驱动设计的核心权衡' }
      ]
    },
    {
      formula: data[idx.gate_drive].detail.formulas[2],
      steps: [
        { latex: 'P_{gate}=Q_g\\cdot V_{gs}\\cdot f_{sw}\\text{：每次开关消耗能量}Q_g V_{gs}\\text{，每秒}f_{sw}\\text{次}', note: '' },
        { latex: '\\text{充电能量：}E=\\tfrac{1}{2}C_{iss}V_{gs}^2=Q_g V_{gs}\\text{（线性电容）}', note: '放电时能量耗散在驱动电阻上，不可回收' },
        { latex: '\\text{结论：频率越高驱动损耗越大，驱动 IC 需要散热设计}', note: '600V/30A 场景下，驱动损耗可达数瓦' }
      ]
    }
  ],
  opamp_comparator: [
    {
      formula: data[idx.opamp_comparator].detail.formulas[0],
      steps: [
        { latex: '\\text{运放同相端接地，输入从反相端经}R_{in}\\text{进入，负反馈通过}R_f\\text{回到反相端}', note: '' },
        { latex: '\\text{虚短：}V_+ = V_- = 0\\Rightarrow R_{in}\\text{上电流}i=\\tfrac{V_{in}}{R_{in}}', note: '虚短是深度负反馈的结论，不是真正短路' },
        { latex: '\\text{虚断：}i\\text{全部流过}R_f\\Rightarrow V_{out} = -i\\cdot R_f = -\\tfrac{R_f}{R_{in}}V_{in}', note: '负号来源：电流从输出流向反相端' }
      ]
    },
    {
      formula: data[idx.opamp_comparator].detail.formulas[1],
      steps: [
        { latex: '\\text{同相放大：输入从}+\\text{端进，负反馈从输出经}R_f,R_1\\text{分压回}-\\text{端}', note: '' },
        { latex: '\\text{虚短：}V_- = V_{in}\\Rightarrow\\text{反馈分压}=V_{in}\\Rightarrow V_{out}\\cdot\\tfrac{R_1}{R_1+R_f}=V_{in}', note: '' },
        { latex: '\\Rightarrow V_{out} = \\left(1+\\tfrac{R_f}{R_1}\\right)V_{in}', note: '增益 ≥ 1，最小为 1（跟随器，Rf=0）' }
      ]
    },
    {
      formula: data[idx.opamp_comparator].detail.formulas[2],
      steps: [
        { latex: '\\text{差分放大将两个反相放大电路叠加：对}V_1\\text{反相，对}V_2\\text{同相}', note: '' },
        { latex: '\\text{叠加定理：}V_{out}=V_{out}(V_2\\text{单独})+V_{out}(V_1\\text{单独})', note: '线性电路可以叠加' },
        { latex: '= \\tfrac{R_f}{R_1}V_2 + (-\\tfrac{R_f}{R_1}V_1) = \\tfrac{R_f}{R_1}(V_2-V_1)', note: '用于差分信号采集，共模信号被消除（CMRR）' }
      ]
    }
  ],
  pwm_generation: [
    {
      formula: data[idx.pwm_generation].detail.formulas[0],
      steps: [
        { latex: 'D=\\tfrac{T_{on}}{T_{period}}\\text{：占空比 = 高电平时间 ÷ 总周期}', note: '0到1之间的数，D=0.5表示50%高电平' },
        { latex: '\\text{面积等效原理：}V_{avg}=\\tfrac{1}{T}\\int_0^T v\\,dt=D\\cdot V_{high}', note: 'PWM 通过占空比控制等效平均电压' },
        { latex: '\\text{实现方式：}V_{ref}\\text{（模拟）与载波（三角波}V_{max}\\text{）比较}', note: 'Vref > 载波时输出高，否则输出低' },
        { latex: 'D=\\tfrac{V_{ref}}{V_{max}}\\Rightarrow V_{avg}=D\\cdot V_{dc}=\\tfrac{V_{ref}}{V_{max}}V_{dc}', note: '这就是 PWM 调压的数学本质' }
      ]
    },
    {
      formula: data[idx.pwm_generation].detail.formulas[1],
      steps: [
        { latex: 'v_{avg}=\\tfrac{1}{T_s}\\int_0^{T_s}v(\\tau)\\,d\\tau\\text{：一个周期内的时间平均值}', note: '' },
        { latex: '\\text{PWM 输出为高低电平：}v_{avg}=\\tfrac{T_{on}}{T_s}V_{high}+\\tfrac{T_{off}}{T_s}\\cdot 0=D\\cdot V_{dc}', note: '惯性负载（电感/电机）起到低通滤波作用，响应的是平均值' }
      ]
    },
    {
      formula: data[idx.pwm_generation].detail.formulas[2],
      steps: [
        { latex: 'f_{sw}=\\tfrac{f_{clk}}{(ARR+1)(PSC+1)}\\text{：MCU 定时器产生 PWM 的频率公式}', note: '' },
        { latex: 'f_{clk}\\text{：系统时钟（如 168MHz）；PSC：预分频器；ARR：自动重装载值}', note: '' },
        { latex: '\\text{例：}f_{clk}=168\\text{MHz，PSC=0，ARR=999}\\Rightarrow f_{sw}=168\\text{kHz}', note: '168MHz/1000 = 168kHz，典型电驱用10~20kHz' }
      ]
    }
  ],
  power_electronics_basics: [
    {
      formula: data[idx.power_electronics_basics].detail.formulas[0],
      steps: [
        { latex: 'V_{out}=D\\cdot V_{in}\\text{（Buck 降压）：由伏秒平衡推导}', note: '稳态时电感两端电压的时间积分为零' },
        { latex: '\\text{开通时：}V_L=V_{in}-V_{out}\\text{，电感储能；关断时：}V_L=-V_{out}\\text{，电感放能}', note: '' },
        { latex: '\\text{稳态}\\Rightarrow(V_{in}-V_{out})\\cdot DT_s = V_{out}(1-D)T_s', note: '开通时间的伏秒积 = 关断时间的伏秒积' },
        { latex: '\\Rightarrow V_{out}=D\\cdot V_{in}\\quad(0\\leq D\\leq 1)', note: '占空比控制输出，D<1 → 降压' }
      ]
    },
    {
      formula: data[idx.power_electronics_basics].detail.formulas[1],
      steps: [
        { latex: 'V_{out}=\\tfrac{1}{1-D}V_{in}\\text{（Boost 升压）}', note: '同样由伏秒平衡推导' },
        { latex: '\\text{开通：}V_L=V_{in}\\text{；关断：}V_L=V_{in}-V_{out}', note: '注意关断时输出侧二极管导通' },
        { latex: 'V_{in}\\cdot DT_s=(V_{out}-V_{in})(1-D)T_s', note: '' },
        { latex: '\\Rightarrow V_{out}=\\tfrac{1}{1-D}V_{in}\\geq V_{in}', note: 'D 越大升压比越大；D→1 时理论无穷大，实际受损耗限制' }
      ]
    },
    {
      formula: data[idx.power_electronics_basics].detail.formulas[2],
      steps: [
        { latex: '\\eta=\\tfrac{P_{out}}{P_{in}}\\times100\\%\\text{：输出功率与输入功率之比}', note: '' },
        { latex: 'P_{loss}=P_{in}-P_{out}=P_{cond}+P_{sw}+P_{core}+P_{gate}+\\cdots', note: '损耗以热量形式耗散，决定散热器尺寸' },
        { latex: '\\text{理想变换器}\\eta=100\\%\\text{；实际开关电源：}\\eta\\approx85\\%\\sim97\\%', note: '宽禁带器件（SiC/GaN）可将 η 提升至 98%+' }
      ]
    }
  ],
  pmsm_math_model: [
    {
      formula: data[idx.pmsm_math_model].detail.formulas[0],
      steps: [
        { latex: 'u_d=R_s i_d+L_d\\tfrac{di_d}{dt}-\\omega_e L_q i_q\\text{：d 轴电压方程}', note: '' },
        { latex: 'u_q=R_s i_q+L_q\\tfrac{di_q}{dt}+\\omega_e(L_d i_d+\\psi_f)\\text{：q 轴电压方程}', note: '' },
        { latex: '\\text{三项含义：①}R_s i\\text{：电阻压降；②}L\\tfrac{di}{dt}\\text{：感应电动势；③}\\omega_e\\psi\\text{：旋转耦合项}', note: '' },
        { latex: '\\omega_e L_q i_q\\text{（d 轴）和}\\omega_e L_d i_d\\text{（q 轴）\\text{：dq 轴交叉耦合，需前馈解耦}}', note: '这就是电流环设计中必须加解耦项的原因' },
        { latex: '\\omega_e\\psi_f\\text{（q 轴）：转速越高，反电动势越大，限制弱磁前的最高转速}', note: '弱磁控制通过注入负 id 来抑制反电动势' }
      ]
    },
    {
      formula: data[idx.pmsm_math_model].detail.formulas[1],
      steps: [
        { latex: 'T_e=\\tfrac{3P}{4}[\\psi_f i_q+(L_d-L_q)i_d i_q]', note: '与 pmsm_vector_control 中推导相同' },
        { latex: '\\text{id=0 控制策略：令}i_d=0\\Rightarrow T_e=\\tfrac{3P}{4}\\psi_f i_q', note: '转矩正比于 iq，控制最简单' },
        { latex: 'L_d\\neq L_q\\text{（凸极）时，磁阻转矩项}(L_d-L_q)i_d i_q\\neq 0', note: 'IPMSM（内置式）可通过注入适当 id 提升转矩密度' }
      ]
    },
    {
      formula: data[idx.pmsm_math_model].detail.formulas[2],
      steps: [
        { latex: '\\omega_e=\\tfrac{P}{2}\\omega_m\\text{：电角速度 = 极对数 × 机械角速度}', note: '' },
        { latex: '\\text{原因：一对磁极对应一个电气周期，}P/2\\text{ 对磁极对应 }P/2\\text{ 个电气周期/转}', note: '' },
        { latex: '\\text{例：4极电机（P=4，2对极），机械转一圈对应 2 个电气周期}', note: '极对数越多，相同机械转速下电气频率越高，控制带宽要求越高' }
      ]
    }
  ]
};

Object.entries(steps).forEach(([id, s]) => {
  if (idx[id] !== undefined) data[idx[id]].detail.formulas_steps = s;
});
fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
console.log('batch1 ok:', Object.keys(steps).join(', '));
