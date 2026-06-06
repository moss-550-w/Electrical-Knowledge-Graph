import json

STEPS = {
    "maxwell_equations": [
        {
            "formula": "\\nabla \\cdot \\mathbf{D} = \\rho",
            "steps": [
                {"latex": "\\text{高斯电场定律：空间中的电荷产生电场}", "note": "ρ 为自由电荷体密度"},
                {"latex": "\\oint_S \\mathbf{D}\\cdot d\\mathbf{S} = Q_{enc}", "note": "积分形式：闭合面内的总自由电荷"},
                {"latex": "\\nabla \\cdot \\mathbf{D} = \\rho", "note": "微分形式，由散度定理推导"}
            ]
        },
        {
            "formula": "\\nabla \\cdot \\mathbf{B} = 0",
            "steps": [
                {"latex": "\\text{高斯磁场定律：磁场无源（无磁单极子）}", "note": "磁力线总是闭合的"},
                {"latex": "\\oint_S \\mathbf{B}\\cdot d\\mathbf{S} = 0", "note": "穿入闭合面的磁通量等于穿出的"},
                {"latex": "\\nabla \\cdot \\mathbf{B} = 0", "note": "与电场不同，磁场散度恒为零"}
            ]
        },
        {
            "formula": "\\nabla \\times \\mathbf{E} = -\\frac{\\partial \\mathbf{B}}{\\partial t}",
            "steps": [
                {"latex": "\\text{法拉第电磁感应定律的微分形式}", "note": "变化的磁场产生电场"},
                {"latex": "\\oint_C \\mathbf{E}\\cdot d\\mathbf{l} = -\\frac{d\\Phi_B}{dt}", "note": "积分形式：感应电动势"},
                {"latex": "\\nabla \\times \\mathbf{E} = -\\frac{\\partial \\mathbf{B}}{\\partial t}", "note": "由 Stokes 定理转化为微分形式"}
            ]
        },
        {
            "formula": "\\nabla \\times \\mathbf{H} = \\mathbf{J} + \\frac{\\partial \\mathbf{D}}{\\partial t}",
            "steps": [
                {"latex": "\\text{安培-麦克斯韦定律：电流和变化电场产生磁场}", "note": "位移电流项是麦克斯韦的关键补充"},
                {"latex": "\\oint_C \\mathbf{H}\\cdot d\\mathbf{l} = I_{enc} + \\frac{d\\Phi_D}{dt}", "note": "传导电流 + 位移电流"},
                {"latex": "\\nabla \\times \\mathbf{H} = \\mathbf{J} + \\frac{\\partial \\mathbf{D}}{\\partial t}", "note": "预言了电磁波的存在"}
            ]
        }
    ],
    "fourier_analysis": [
        {
            "formula": "f(t) = a_0 + \\sum_{n=1}^{\\infty}(a_n \\cos n\\omega t + b_n \\sin n\\omega t)",
            "steps": [
                {"latex": "\\text{任意周期信号可分解为直流分量 + 各次谐波之和}", "note": "正弦和余弦构成完备正交基"},
                {"latex": "a_0 = \\frac{1}{T}\\int_0^T f(t)\\,dt", "note": "直流分量（零次谐波）"},
                {"latex": "f(t) = a_0 + \\sum_{n=1}^{\\infty}(a_n \\cos n\\omega t + b_n \\sin n\\omega t)", "note": "PWM 波形含大量高次谐波，傅里叶展开是 EMC 分析基础"}
            ]
        },
        {
            "formula": "a_n = \\frac{2}{T}\\int_0^T f(t)\\cos n\\omega t\\,dt, \\quad b_n = \\frac{2}{T}\\int_0^T f(t)\\sin n\\omega t\\,dt",
            "steps": [
                {"latex": "\\text{利用三角函数正交性：}\\int_0^T \\cos m\\omega t\\cos n\\omega t\\,dt = \\frac{T}{2}\\delta_{mn}", "note": "不同频率分量相互正交"},
                {"latex": "a_n = \\frac{2}{T}\\int_0^T f(t)\\cos n\\omega t\\,dt", "note": "对两边乘以 cos(nωt) 并积分，其余项为零"},
                {"latex": "b_n = \\frac{2}{T}\\int_0^T f(t)\\sin n\\omega t\\,dt", "note": "同理对 sin(nωt) 提取系数"}
            ]
        },
        {
            "formula": "F(\\omega) = \\int_{-\\infty}^{\\infty} f(t) e^{-j\\omega t}\\,dt",
            "steps": [
                {"latex": "\\text{傅里叶变换：将时域信号映射到频域}", "note": "适用于非周期信号"},
                {"latex": "e^{-j\\omega t} = \\cos\\omega t - j\\sin\\omega t", "note": "欧拉公式将正余弦统一"},
                {"latex": "F(\\omega) = \\int_{-\\infty}^{\\infty} f(t) e^{-j\\omega t}\\,dt", "note": "|F(ω)| 即频谱幅度，用于分析 PWM 谐波分布"}
            ]
        }
    ],
    "matrix_calculus": [
        {
            "formula": "\\frac{d}{dt}\\mathbf{x} = \\mathbf{A}\\mathbf{x} + \\mathbf{B}\\mathbf{u}",
            "steps": [
                {"latex": "\\text{状态空间方程：将高阶微分方程组写成一阶矩阵形式}", "note": "x 为状态向量，u 为输入向量"},
                {"latex": "\\text{例：}\\frac{d}{dt}\\begin{bmatrix}i_d\\\\i_q\\end{bmatrix} = \\mathbf{A}\\begin{bmatrix}i_d\\\\i_q\\end{bmatrix} + \\mathbf{B}\\begin{bmatrix}v_d\\\\v_q\\end{bmatrix}", "note": "PMSM dq 方程即为此形式"},
                {"latex": "\\frac{d}{dt}\\mathbf{x} = \\mathbf{A}\\mathbf{x} + \\mathbf{B}\\mathbf{u}", "note": "矩阵 A 的特征值决定系统稳定性"}
            ]
        },
        {
            "formula": "\\mathbf{y} = \\mathbf{C}\\mathbf{x} + \\mathbf{D}\\mathbf{u}",
            "steps": [
                {"latex": "\\text{输出方程：从状态量提取可观测输出}", "note": "C 选择哪些状态作为输出"},
                {"latex": "\\text{可观测性矩阵：}\\mathcal{O} = [\\mathbf{C}^T, (\\mathbf{CA})^T, ...]^T", "note": "满秩则系统完全可观"},
                {"latex": "\\mathbf{y} = \\mathbf{C}\\mathbf{x} + \\mathbf{D}\\mathbf{u}", "note": "电机控制中输出常取 id, iq 或转速"}
            ]
        },
        {
            "formula": "\\mathbf{A}^{-1} = \\frac{1}{\\det\\mathbf{A}}\\operatorname{adj}(\\mathbf{A})",
            "steps": [
                {"latex": "\\det\\mathbf{A} = \\sum_j a_{ij} C_{ij}", "note": "按任意行展开计算行列式"},
                {"latex": "\\operatorname{adj}(\\mathbf{A})_{ij} = C_{ji}", "note": "伴随矩阵是代数余子式矩阵的转置"},
                {"latex": "\\mathbf{A}^{-1} = \\frac{1}{\\det\\mathbf{A}}\\operatorname{adj}(\\mathbf{A})", "note": "det(A)≠0 时矩阵可逆，用于求解状态方程"}
            ]
        }
    ],
    "complex_numbers": [
        {
            "formula": "v(t) = V_m\\cos(\\omega t + \\phi) \\quad \\leftrightarrow \\quad \\dot{V} = \\frac{V_m}{\\sqrt{2}} e^{j\\phi}",
            "steps": [
                {"latex": "v(t) = V_m\\cos(\\omega t + \\phi) = \\operatorname{Re}[V_m e^{j(\\omega t+\\phi)}]", "note": "时域正弦量对应旋转相量"},
                {"latex": "\\dot{V} = \\frac{V_m}{\\sqrt{2}} e^{j\\phi} = \\frac{V_m}{\\sqrt{2}}(\\cos\\phi + j\\sin\\phi)", "note": "有效值相量：模为有效值，辐角为初相"},
                {"latex": "v(t) \\leftrightarrow \\dot{V}", "note": "相量法将微分方程转化为代数方程，简化 AC 电路计算"}
            ]
        },
        {
            "formula": "Z = R + jX = R + j(\\omega L - \\frac{1}{\\omega C})",
            "steps": [
                {"latex": "Z_R = R,\\quad Z_L = j\\omega L,\\quad Z_C = \\frac{1}{j\\omega C} = -\\frac{j}{\\omega C}", "note": "各元件阻抗"},
                {"latex": "X = X_L - X_C = \\omega L - \\frac{1}{\\omega C}", "note": "电抗：感抗与容抗之差"},
                {"latex": "Z = R + jX", "note": "谐振时 X=0，|Z|=R 最小，电流最大"}
            ]
        },
        {
            "formula": "\\dot{V} = Z\\dot{I}",
            "steps": [
                {"latex": "\\text{欧姆定律的相量形式}", "note": "与直流欧姆定律形式完全相同"},
                {"latex": "|\\dot{V}| = |Z||\\dot{I}|,\\quad \\angle\\dot{V} = \\angle Z + \\angle\\dot{I}", "note": "模相乘、辐角相加"},
                {"latex": "\\dot{V} = Z\\dot{I}", "note": "PMSM 电压方程在频域下的本质"}
            ]
        }
    ],
    "laplace_transform": [
        {
            "formula": "F(s) = \\mathcal{L}\\{f(t)\\} = \\int_0^\\infty f(t) e^{-st}\\,dt",
            "steps": [
                {"latex": "s = \\sigma + j\\omega \\in \\mathbb{C}", "note": "s 是复频率变量"},
                {"latex": "\\mathcal{L}\\{e^{at}\\} = \\frac{1}{s-a},\\quad \\mathcal{L}\\left\\{\\frac{df}{dt}\\right\\} = sF(s) - f(0^-)", "note": "常用变换对：微分变成乘 s"},
                {"latex": "F(s) = \\int_0^\\infty f(t) e^{-st}\\,dt", "note": "将时域微分方程转为 s 域代数方程"}
            ]
        },
        {
            "formula": "G_c(s) = K_p + \\frac{K_i}{s}",
            "steps": [
                {"latex": "u(t) = K_p e(t) + K_i \\int_0^t e(\\tau)d\\tau", "note": "PI 控制器时域表达式"},
                {"latex": "U(s) = K_p E(s) + \\frac{K_i}{s} E(s)", "note": "对两项分别取拉普拉斯变换"},
                {"latex": "G_c(s) = \\frac{U(s)}{E(s)} = K_p + \\frac{K_i}{s}", "note": "积分项 Ki/s 消除稳态误差，是电流环的核心"}
            ]
        },
        {
            "formula": "G_{cl}(s) = \\frac{G_c(s)G_p(s)}{1 + G_c(s)G_p(s)}",
            "steps": [
                {"latex": "E(s) = R(s) - Y(s),\\quad Y(s) = G_c G_p E(s)", "note": "闭环负反馈结构"},
                {"latex": "Y(s)(1 + G_c G_p) = G_c G_p R(s)", "note": "整理"},
                {"latex": "G_{cl}(s) = \\frac{G_c(s)G_p(s)}{1 + G_c(s)G_p(s)}", "note": "极点（分母为零的 s 值）决定闭环稳定性"}
            ]
        }
    ],
    "three_phase_ac": [
        {
            "formula": "v_a(t) = V_m\\cos\\omega t, \\; v_b(t) = V_m\\cos(\\omega t-120^\\circ), \\; v_c(t) = V_m\\cos(\\omega t+120^\\circ)",
            "steps": [
                {"latex": "\\text{三相对称：幅值相同，相位互差 120°}", "note": "三相之和恒为零"},
                {"latex": "v_a + v_b + v_c = V_m[\\cos\\theta + \\cos(\\theta-120^\\circ) + \\cos(\\theta+120^\\circ)] = 0", "note": "三相矢量和为零，中线电流为零"},
                {"latex": "v_a(t) = V_m\\cos\\omega t", "note": "a 相为参考相，b、c 各滞后 120°、超前 120°"}
            ]
        },
        {
            "formula": "V_L = \\sqrt{3}V_P",
            "steps": [
                {"latex": "V_{ab} = V_a - V_b = V_m\\cos\\omega t - V_m\\cos(\\omega t-120^\\circ)", "note": "线电压 = 两相电压之差"},
                {"latex": "V_{ab} = \\sqrt{3}V_m\\cos(\\omega t + 30^\\circ)", "note": "展开后利用和差化积"},
                {"latex": "V_L = \\sqrt{3}V_P", "note": "有效值关系，220V 相电压对应 380V 线电压"}
            ]
        },
        {
            "formula": "p_{total}(t) = P = \\sqrt{3}V_L I_L \\cos\\phi",
            "steps": [
                {"latex": "p_a = v_a i_a,\\; p_b = v_b i_b,\\; p_c = v_c i_c", "note": "三相瞬时功率"},
                {"latex": "p_{total} = p_a + p_b + p_c = \\frac{3}{2}V_m I_m \\cos\\phi = \\text{常数}", "note": "三相对称时瞬时功率为恒定值，无脉动"},
                {"latex": "P = \\sqrt{3}V_L I_L \\cos\\phi", "note": "恒定功率是三相系统优于单相的关键优势"}
            ]
        }
    ],
    "semiconductor_physics": [
        {
            "formula": "I = I_s(e^{V/V_T} - 1), \\quad V_T = \\frac{kT}{q}",
            "steps": [
                {"latex": "V_T = \\frac{kT}{q} \\approx 26\\,\\text{mV}\\;(T=300\\,\\text{K})", "note": "热电压，玻尔兹曼常数 k=1.38×10⁻²³ J/K"},
                {"latex": "\\text{正偏时：}V \\gg V_T \\Rightarrow I \\approx I_s e^{V/V_T}", "note": "电流随电压指数增长"},
                {"latex": "I = I_s(e^{V/V_T} - 1)", "note": "反偏时 V<0，I≈-Is（饱和电流），PN 结单向导电性的本质"}
            ]
        },
        {
            "formula": "W_d = \\sqrt{\\frac{2\\varepsilon_s(V_{bi} + V_R)}{q N_d}}",
            "steps": [
                {"latex": "\\text{耗尽层两侧空间电荷产生内建电场 }E_{bi}", "note": "阻止多子继续扩散"},
                {"latex": "\\text{泊松方程：}\\frac{dE}{dx} = \\frac{qN_d}{\\varepsilon_s}", "note": "反偏时 VR 增大，耗尽层展宽"},
                {"latex": "W_d = \\sqrt{\\frac{2\\varepsilon_s(V_{bi}+V_R)}{qN_d}}", "note": "IGBT 耐压层厚度设计的依据"}
            ]
        },
        {
            "formula": "BV \\propto N_d^{-3/4}",
            "steps": [
                {"latex": "\\text{击穿发生于耗尽层电场达到临界值 }E_{crit}", "note": "雪崩击穿机制"},
                {"latex": "BV = \\frac{\\varepsilon_s E_{crit}^2}{2qN_d}", "note": "掺杂浓度越低，耐压越高"},
                {"latex": "BV \\propto N_d^{-3/4}", "note": "高压 IGBT 采用低掺杂厚漂移层，与导通电阻有权衡"}
            ]
        }
    ],
    "magnetic_circuit": [
        {
            "formula": "\\mathcal{F} = Ni = \\Phi \\mathcal{R}",
            "steps": [
                {"latex": "\\text{安培定律：}\\oint \\mathbf{H}\\cdot d\\mathbf{l} = Ni", "note": "磁路中类比欧姆定律"},
                {"latex": "\\mathcal{F} = Ni\\text{（磁动势）},\\quad \\Phi\\text{（磁通量）},\\quad \\mathcal{R}\\text{（磁阻）}", "note": "磁动势 = 磁通 × 磁阻，类比电压 = 电流 × 电阻"},
                {"latex": "\\mathcal{F} = Ni = \\Phi\\mathcal{R}", "note": "Hopkinson 定律，电机磁路设计的基础"}
            ]
        },
        {
            "formula": "\\mathcal{R} = \\frac{l}{\\mu A}",
            "steps": [
                {"latex": "\\Phi = \\int_S \\mathbf{B}\\cdot d\\mathbf{S} = BA\\;(\\text{均匀截面})", "note": "磁通量与截面积和磁感应强度的关系"},
                {"latex": "H = \\frac{B}{\\mu} = \\frac{\\Phi}{\\mu A}", "note": "B=μH，μ 为磁导率"},
                {"latex": "\\mathcal{R} = \\frac{Hl}{\\Phi} = \\frac{l}{\\mu A}", "note": "气隙磁阻远大于硅钢磁阻，是电机磁路主要压降"}
            ]
        },
        {
            "formula": "B = \\frac{\\Phi}{A} = \\mu H",
            "steps": [
                {"latex": "\\mathbf{B} = \\mu_0\\mu_r\\mathbf{H}", "note": "μ₀=4π×10⁻⁷ H/m，硅钢 μr ≈ 1000~10000"},
                {"latex": "B = \\frac{\\Phi}{A}", "note": "磁通密度（磁感应强度）的定义"},
                {"latex": "B = \\mu H", "note": "硅钢在高 B 下饱和，μ 下降，是电机磁路非线性来源"}
            ]
        }
    ]
}

STEPS.update({
    "control_theory_basics": [
        {
            "formula": "G(s) = \\frac{Y(s)}{U(s)} = \\frac{b_ms^m + ... + b_0}{a_n s^n + ... + a_0}",
            "steps": [
                {"latex": "\\text{传递函数：系统输出与输入的拉普拉斯变换之比（零初始条件）}", "note": "描述线性时不变系统的频域特性"},
                {"latex": "\\text{分母多项式} = 0 \\Rightarrow \\text{特征方程，根即为极点}", "note": "极点决定系统的稳定性和动态特性"},
                {"latex": "G(s) = \\frac{Y(s)}{U(s)}", "note": "电流环、速度环均可用此框架建模"}
            ]
        },
        {
            "formula": "\\text{PM} = 180^\\circ + \\angle G_{open}(j\\omega_c)",
            "steps": [
                {"latex": "\\omega_c\\text{：增益穿越频率，}|G_{open}(j\\omega_c)| = 1\\,(0\\,\\text{dB})", "note": "Bode 图上幅频曲线过 0dB 的频率"},
                {"latex": "\\angle G_{open}(j\\omega_c)\\text{：此频率下的相位}", "note": "若相位为 -180° 则 PM=0°，临界稳定"},
                {"latex": "\\text{PM} = 180^\\circ + \\angle G_{open}(j\\omega_c)", "note": "PM > 45° 为工程设计目标，保证足够稳定裕度"}
            ]
        },
        {
            "formula": "t_s \\approx \\frac{4}{\\zeta\\omega_n}",
            "steps": [
                {"latex": "\\text{二阶系统标准形式：}G(s) = \\frac{\\omega_n^2}{s^2 + 2\\zeta\\omega_n s + \\omega_n^2}", "note": "ζ 为阻尼比，ωn 为自然频率"},
                {"latex": "\\text{欠阻尼时（0<ζ<1）响应有超调，包络线时间常数} = \\frac{1}{\\zeta\\omega_n}", "note": "超调量 OS% = e^{-\\pi\\zeta/\\sqrt{1-\\zeta^2}} \\times 100\\%"},
                {"latex": "t_s \\approx \\frac{4}{\\zeta\\omega_n}\\;(2\\%\\text{准则})", "note": "调节时间与阻尼比和自然频率的乘积成反比"}
            ]
        }
    ],
    "circuit_theory": [
        {
            "formula": "\\sum_{k} i_k = 0",
            "steps": [
                {"latex": "\\text{KCL（基尔霍夫电流定律）：节点处电荷守恒}", "note": "流入节点的电流之和等于流出的"},
                {"latex": "\\text{对任意节点：}i_1 + i_2 + ... = i_{n+1} + i_{n+2} + ...", "note": "电流不能在节点积累"},
                {"latex": "\\sum_k i_k = 0", "note": "电路分析列方程的基本依据之一"}
            ]
        },
        {
            "formula": "\\sum_{k} v_k = 0",
            "steps": [
                {"latex": "\\text{KVL（基尔霍夫电压定律）：回路中能量守恒}", "note": "沿任意闭合回路电压之和为零"},
                {"latex": "\\text{任意回路：}v_1 + v_2 + ... + v_n = 0", "note": "电位是单值函数，沿回路一圈回到原点"},
                {"latex": "\\sum_k v_k = 0", "note": "与 KCL 联立可求解任意线性电路"}
            ]
        },
        {
            "formula": "v_L = L\\frac{di}{dt}, \\quad i_C = C\\frac{dv}{dt}",
            "steps": [
                {"latex": "v_L = L\\frac{di}{dt}", "note": "电感：电流不能突变，储存磁能 W=½LI²"},
                {"latex": "i_C = C\\frac{dv}{dt}", "note": "电容：电压不能突变，储存电能 W=½CV²"},
                {"latex": "\\text{在 s 域：}V_L = sLI,\\quad I_C = sCV", "note": "拉普拉斯变换后即为阻抗形式 ZL=sL, ZC=1/sC"}
            ]
        }
    ],
    "linear_algebra": [
        {
            "formula": "\\mathbf{A}\\mathbf{x} = \\mathbf{b}",
            "steps": [
                {"latex": "\\text{线性方程组的矩阵形式}", "note": "n 个方程，n 个未知数"},
                {"latex": "\\text{若}\\det\\mathbf{A}\\neq 0\\Rightarrow \\mathbf{x} = \\mathbf{A}^{-1}\\mathbf{b}\\text{（唯一解）}", "note": "矩阵可逆 ↔ 方程组有唯一解"},
                {"latex": "\\mathbf{A}\\mathbf{x} = \\mathbf{b}", "note": "Park/Clarke 变换矩阵的逆变换即为此结构"}
            ]
        },
        {
            "formula": "\\mathbf{A} = \\mathbf{P}\\mathbf{\\Lambda}\\mathbf{P}^{-1}",
            "steps": [
                {"latex": "\\mathbf{A}\\mathbf{v}_i = \\lambda_i\\mathbf{v}_i", "note": "特征值方程：λi 为特征值，vi 为特征向量"},
                {"latex": "\\mathbf{P} = [\\mathbf{v}_1, \\mathbf{v}_2, ...],\\quad \\mathbf{\\Lambda} = \\text{diag}(\\lambda_1, \\lambda_2, ...)", "note": "特征向量构成变换矩阵 P"},
                {"latex": "\\mathbf{A} = \\mathbf{P}\\mathbf{\\Lambda}\\mathbf{P}^{-1}", "note": "特征值即为系统极点，决定状态方程的动态响应"}
            ]
        },
        {
            "formula": "\\mathbf{x}^* = (\\mathbf{A}^T\\mathbf{A})^{-1}\\mathbf{A}^T\\mathbf{b}",
            "steps": [
                {"latex": "\\min_{\\mathbf{x}} \\|\\mathbf{A}\\mathbf{x} - \\mathbf{b}\\|^2", "note": "超定方程组（方程数>未知数）的最小二乘解"},
                {"latex": "\\frac{\\partial}{\\partial\\mathbf{x}}\\|\\mathbf{A}\\mathbf{x}-\\mathbf{b}\\|^2 = 2\\mathbf{A}^T(\\mathbf{A}\\mathbf{x}-\\mathbf{b}) = 0", "note": "对 x 求梯度并令其为零"},
                {"latex": "\\mathbf{x}^* = (\\mathbf{A}^T\\mathbf{A})^{-1}\\mathbf{A}^T\\mathbf{b}", "note": "电机参数辨识、观测器设计均用到此公式"}
            ]
        }
    ],
    "electronics_basics": [
        {
            "formula": "A_v = -g_m R_L",
            "steps": [
                {"latex": "g_m = \\frac{\\partial I_D}{\\partial V_{GS}}\\bigg|_{Q}", "note": "跨导：MOSFET 小信号模型的核心参数"},
                {"latex": "v_{out} = -g_m v_{gs} \\cdot R_L", "note": "输出电压 = 受控电流源电流 × 负载电阻，负号表示反相"},
                {"latex": "A_v = \\frac{v_{out}}{v_{in}} = -g_m R_L", "note": "共源极放大器，驱动 IC 内部运放级即为此结构"}
            ]
        },
        {
            "formula": "A_f = \\frac{A}{1 + A\\beta}",
            "steps": [
                {"latex": "\\text{负反馈：}V_{err} = V_{in} - \\beta V_{out}", "note": "β 为反馈系数，将输出采样后送回输入"},
                {"latex": "V_{out} = A \\cdot V_{err} = A(V_{in} - \\beta V_{out})", "note": "展开并整理"},
                {"latex": "A_f = \\frac{V_{out}}{V_{in}} = \\frac{A}{1+A\\beta}", "note": "深度负反馈（Aβ≫1）时 Af≈1/β，增益稳定"}
            ]
        },
        {
            "formula": "\\text{CMRR} = \\left|\\frac{A_{dm}}{A_{cm}}\\right|",
            "steps": [
                {"latex": "A_{dm}\\text{：差模增益（放大差分信号）},\\quad A_{cm}\\text{：共模增益（抑制共同干扰）}", "note": "理想运放 Acm=0"},
                {"latex": "\\text{CMRR}_{dB} = 20\\log_{10}\\left|\\frac{A_{dm}}{A_{cm}}\\right|", "note": "典型运放 CMRR > 80dB"},
                {"latex": "\\text{CMRR} = \\left|\\frac{A_{dm}}{A_{cm}}\\right|", "note": "电流采样电路 CMRR 决定测量精度，影响 FOC 控制质量"}
            ]
        }
    ],
    "digital_electronics_basics": [
        {
            "formula": "Q_{n+1} = D",
            "steps": [
                {"latex": "\\text{D 触发器：时钟边沿到来时，输出跟随输入 D}", "note": "最基本的时序逻辑单元"},
                {"latex": "\\text{上升沿触发：}Q_{n+1} = D_n", "note": "建立时间和保持时间是时序约束的来源"},
                {"latex": "Q_{n+1} = D", "note": "寄存器、移位寄存器、状态机均由 D 触发器构成"}
            ]
        },
        {
            "formula": "Q_{n+1} = J\\overline{Q_n} + \\overline{K}Q_n",
            "steps": [
                {"latex": "\\text{JK 触发器真值表：J=0,K=0→保持；J=1,K=0→置1；J=0,K=1→清0；J=1,K=1→翻转}", "note": "解决了 SR 触发器的禁止态"},
                {"latex": "Q_{n+1} = J\\overline{Q_n} + \\overline{K}Q_n", "note": "特征方程直接描述状态转移"},
                {"latex": "\\text{令 J=K：}Q_{n+1} = J\\oplus Q_n", "note": "T 触发器，常用于计数器"}
            ]
        },
        {
            "formula": "D = \\frac{V_{ref}}{2^N - 1}",
            "steps": [
                {"latex": "\\text{N 位 ADC 的量化步长}\\Delta = \\frac{V_{ref}}{2^N - 1}", "note": "分辨率：全量程分为 2^N-1 个等级"},
                {"latex": "\\text{量化误差最大为}\\pm\\frac{\\Delta}{2}", "note": "12位 ADC：4096级，步长约为 Vref/4095"},
                {"latex": "D = \\frac{V_{ref}}{2^N - 1}", "note": "电机电流采样 ADC 精度直接影响 FOC 控制带宽"}
            ]
        }
    ],
    "solid_state_physics": [
        {
            "formula": "E_g \\approx 1.12\\,\\text{eV (Si)}, \\quad E_g \\approx 0.67\\,\\text{eV (Ge)}",
            "steps": [
                {"latex": "\\text{禁带宽度 Eg：价带顶到导带底的能量差}", "note": "决定半导体的导电特性和工作温度范围"},
                {"latex": "\\text{Si: }E_g=1.12\\,\\text{eV},\\quad\\text{SiC: }E_g=3.26\\,\\text{eV},\\quad\\text{GaN: }E_g=3.4\\,\\text{eV}", "note": "宽禁带半导体耐高压、高温，适合 IGBT 替代品"},
                {"latex": "E_g(T) = E_g(0) - \\frac{\\alpha T^2}{T+\\beta}", "note": "Eg 随温度升高而减小，高温漏电流增大"}
            ]
        },
        {
            "formula": "n_i = \\sqrt{N_c N_v} e^{-E_g/2kT}",
            "steps": [
                {"latex": "n_i\\text{：本征载流子浓度，Si 室温下} n_i \\approx 1.5\\times10^{10}\\,\\text{cm}^{-3}", "note": "纯净半导体的电子和空穴浓度相等"},
                {"latex": "n_i = \\sqrt{N_c N_v} e^{-E_g/2kT}", "note": "Nc、Nv 为导带、价带有效态密度"},
                {"latex": "\\text{温度每升高 10°C，}n_i\\text{ 约翻倍}", "note": "高温导致漏电流指数增大，是 IGBT 热设计的关键约束"}
            ]
        }
    ],
    "vector_calculus": [
        {
            "formula": "\\nabla f = \\frac{\\partial f}{\\partial x}\\hat{i} + \\frac{\\partial f}{\\partial y}\\hat{j} + \\frac{\\partial f}{\\partial z}\\hat{k}",
            "steps": [
                {"latex": "\\text{梯度：标量场中变化率最大的方向和大小}", "note": "∇f 指向 f 增大最快的方向"},
                {"latex": "\\nabla\\cdot\\mathbf{F} = \\frac{\\partial F_x}{\\partial x}+\\frac{\\partial F_y}{\\partial y}+\\frac{\\partial F_z}{\\partial z}", "note": "散度：向量场在某点的源强度，∇·B=0 即磁场无源"},
                {"latex": "\\nabla f = \\frac{\\partial f}{\\partial x}\\hat{i} + \\frac{\\partial f}{\\partial y}\\hat{j} + \\frac{\\partial f}{\\partial z}\\hat{k}", "note": "∇算子是麦克斯韦方程组微分形式的数学基础"}
            ]
        },
        {
            "formula": "\\iint_S \\mathbf{F}\\cdot d\\mathbf{S} = \\iiint_V \\nabla\\cdot\\mathbf{F}\\,dV",
            "steps": [
                {"latex": "\\text{高斯散度定理：体积分与面积分的桥梁}", "note": "将体积内散度积分转化为闭合面上的通量"},
                {"latex": "\\text{斯托克斯定理：}\\oint_C \\mathbf{F}\\cdot d\\mathbf{l} = \\iint_S (\\nabla\\times\\mathbf{F})\\cdot d\\mathbf{S}", "note": "将旋度面积分转化为边界线积分"},
                {"latex": "\\iint_S \\mathbf{F}\\cdot d\\mathbf{S} = \\iiint_V \\nabla\\cdot\\mathbf{F}\\,dV", "note": "麦克斯韦方程组的微分形式与积分形式正是通过这两个定理互相转化的"}
            ]
        }
    ]
})

with open('src/data/goldThread.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for node in data:
    if node['id'] in STEPS:
        node['detail']['formulas_steps'] = STEPS[node['id']]
        print(f'Patched: {node["id"]}')

with open('src/data/goldThread.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print('Done (batch 1).')
