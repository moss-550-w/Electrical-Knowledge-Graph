/**
 * 学习路径的 URL 分享编解码工具
 * 编码格式：紧凑 JSON { n:名称, s:策略, l:标签, i:[节点id...] } -> unicode 安全 base64
 */

/** unicode 安全 base64 编码 */
function b64encode(str) {
  return btoa(unescape(encodeURIComponent(str)))
}

/** unicode 安全 base64 解码 */
function b64decode(str) {
  return decodeURIComponent(escape(atob(str)))
}

/**
 * 路径对象 -> base64 串
 * @param {{name?:string,label?:string,strategy?:string,path?:Array,nodeIds?:Array}} p
 */
export function encodePath(p) {
  const ids = (p.nodeIds || (p.path || []).map((n) => n.id || n)).filter(Boolean)
  const payload = { n: p.name || p.label || '', s: p.strategy || '', l: p.label || '', i: ids }
  return b64encode(JSON.stringify(payload))
}

/**
 * base64 串 -> 元信息 { n, s, l, i:[...] }，失败返回 null
 */
export function decodePath(str) {
  try {
    const o = JSON.parse(b64decode(str))
    if (!o || !Array.isArray(o.i) || o.i.length === 0) return null
    return { n: o.n || '', s: o.s || '', l: o.l || '', i: o.i }
  } catch {
    return null
  }
}

/**
 * 构建可分享 URL（hash 路由，保留部署 base）
 */
export function buildShareUrl(p) {
  const base = window.location.href.split('#')[0]
  return `${base}#/?p=${encodeURIComponent(encodePath(p))}`
}

/**
 * 将分享元信息 / 已存路径还原为完整路径对象（供高亮、3D 复盘消费）
 * @param {{n?:string,s?:string,l?:string,i:Array}|{name,strategy,label,nodeIds}} meta
 * @param {Array} nodes - graphStore.nodes
 * @returns {{name,strategy,label,description,path:Array,nodeCount,difficulty}|null}
 */
export function rehydratePath(meta, nodes) {
  const ids = meta.i || meta.nodeIds || []
  if (!ids.length) return null
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  const path = ids
    .map((id) => nodeMap.get(id))
    .filter(Boolean)
    .map((n) => ({ id: n.id, name: n.name, level: n.level, category: n.category }))
  if (path.length === 0) return null
  return {
    name: meta.n || meta.name || meta.l || meta.label || '导入路径',
    strategy: meta.s || meta.strategy || '',
    label: meta.l || meta.label || meta.n || meta.name || '导入路径',
    description: '',
    path,
    nodeCount: path.length,
    difficulty: meta.difficulty || '',
  }
}
