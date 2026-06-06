import json, re

with open('src/data/goldThread.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

issues = []

def check(nid, loc, s):
    if not s:
        return
    # unescaped % outside \% inside \text{}
    # find all \text{...} blocks
    for m in re.finditer(r'\\text\{([^}]*)\}', s):
        inner = m.group(1)
        # look for % not preceded by backslash
        if re.search(r'(?<!\\)%', inner):
            issues.append(f'{nid} [{loc}] unescaped % in \\text: {s[:100]}')
    # mismatched braces
    depth = 0
    for ch in s:
        if ch == '{': depth += 1
        elif ch == '}': depth -= 1
        if depth < 0:
            issues.append(f'{nid} [{loc}] unmatched }}: {s[:100]}')
            return
    if depth != 0:
        issues.append(f'{nid} [{loc}] unclosed brace (depth={depth}): {s[:100]}')
    # \begin without \end
    begins = re.findall(r'\\begin\{([^}]+)\}', s)
    ends   = re.findall(r'\\end\{([^}]+)\}', s)
    if sorted(begins) != sorted(ends):
        issues.append(f'{nid} [{loc}] begin/end mismatch: begins={begins} ends={ends}')

for node in data:
    nid = node['id']
    detail = node.get('detail', )
    for i, f in enumerate(detail.get('formulas', [])):
        check(nid, f'formulas[{i}]', f)
    for i, fs in enumerate(detail.get('formulas_steps', [])):
        check(nid, f'steps[{i}].formula', fs.get('formula', ''))
        for j, step in enumerate(fs.get('steps', [])):
            check(nid, f'steps[{i}][{j}].latex', step.get('latex', ''))
            check(nid, f'steps[{i}][{j}].note',  step.get('note', ''))

if issues:
    print(f'Found {len(issues)} issues:')
    for iss in issues:
        print(' ', iss)
else:
    print('No LaTeX issues found.')
