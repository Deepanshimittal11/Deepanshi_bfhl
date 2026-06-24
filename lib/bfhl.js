const EDGE_PATTERN = /^([A-Z])->([A-Z])$/;

function isValidEdge(entry) {
  const trimmed = entry.trim();
  const match = trimmed.match(EDGE_PATTERN);
  if (!match) return false;
  const [, parent, child] = match;
  return parent !== child;
}

function parseEdge(entry) {
  const trimmed = entry.trim();
  const match = trimmed.match(EDGE_PATTERN);
  if (!match) return null;
  const [, parent, child] = match;
  if (parent === child) return null;
  return { parent, child };
}

class UnionFind {
  constructor() {
    this.parent = new Map();
  }

  find(node) {
    if (!this.parent.has(node)) {
      this.parent.set(node, node);
    }
    if (this.parent.get(node) !== node) {
      this.parent.set(node, this.find(this.parent.get(node)));
    }
    return this.parent.get(node);
  }

  union(a, b) {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA !== rootB) {
      this.parent.set(rootB, rootA);
    }
  }

  components() {
    const groups = new Map();
    for (const node of this.parent.keys()) {
      const root = this.find(node);
      if (!groups.has(root)) {
        groups.set(root, new Set());
      }
      groups.get(root).add(node);
    }
    return groups;
  }
}

function buildNestedTree(node, childrenMap) {
  const children = childrenMap.get(node) || [];
  if (children.length === 0) {
    return { [node]: {} };
  }
  const childTrees = {};
  for (const child of children) {
    const subtree = buildNestedTree(child, childrenMap);
    Object.assign(childTrees, subtree);
  }
  return { [node]: childTrees };
}

function hasCycleInComponent(nodes, componentEdges) {
  const adj = new Map();
  for (const node of nodes) {
    adj.set(node, []);
  }
  for (const { parent, child } of componentEdges) {
    adj.get(parent).push(child);
  }

  const visiting = new Set();
  const visited = new Set();

  function dfs(node) {
    if (visiting.has(node)) return true;
    if (visited.has(node)) return false;
    visiting.add(node);
    for (const child of adj.get(node) || []) {
      if (dfs(child)) return true;
    }
    visiting.delete(node);
    visited.add(node);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node)) {
      if (dfs(node)) return true;
    }
  }
  return false;
}

function calculateDepth(root, childrenMap) {
  function depth(node) {
    const children = childrenMap.get(node) || [];
    if (children.length === 0) return 1;
    return 1 + Math.max(...children.map(depth));
  }
  return depth(root);
}

function processComponent(nodes, edges) {
  const componentEdges = edges.filter(
    (e) => nodes.has(e.parent) && nodes.has(e.child)
  );

  const cyclic = hasCycleInComponent(nodes, componentEdges);

  if (cyclic) {
    const parentsOfComponent = new Set(componentEdges.map((e) => e.child));
    const roots = [...nodes].filter((n) => !parentsOfComponent.has(n));

    let root;
    if (roots.length === 0) {
      root = [...nodes].sort()[0];
    } else {
      root = roots.sort()[0];
    }

    return [{ root, tree: {}, has_cycle: true }];
  }

  const childToParent = new Map();
  const childrenMap = new Map();

  for (const { parent, child } of componentEdges) {
    if (childToParent.has(child)) continue;
    childToParent.set(child, parent);
    if (!childrenMap.has(parent)) {
      childrenMap.set(parent, []);
    }
    childrenMap.get(parent).push(child);
  }

  const roots = [...nodes].filter((n) => !childToParent.has(n));
  const sortedRoots = roots.sort();

  const hierarchies = [];
  for (const root of sortedRoots) {
    hierarchies.push({
      root,
      tree: buildNestedTree(root, childrenMap),
      depth: calculateDepth(root, childrenMap),
    });
  }

  return hierarchies;
}

function processBfhlData(data) {
  const invalid_entries = [];
  const duplicate_edges = [];
  const seenEdges = new Set();
  const validEdges = [];
  const componentOrder = [];
  const uf = new UnionFind();

  for (const entry of data) {
    if (!isValidEdge(entry)) {
      invalid_entries.push(entry);
      continue;
    }

    const parsed = parseEdge(entry);
    const normalized = `${parsed.parent}->${parsed.child}`;

    if (seenEdges.has(normalized)) {
      if (!duplicate_edges.includes(normalized)) {
        duplicate_edges.push(normalized);
      }
      continue;
    }

    seenEdges.add(normalized);
    validEdges.push({ ...parsed, original: normalized });
    uf.union(parsed.parent, parsed.child);

    const compRoot = uf.find(parsed.parent);
    if (!componentOrder.includes(compRoot)) {
      componentOrder.push(compRoot);
    }
  }

  const componentGroups = uf.components();
  const hierarchies = [];
  const seenRoots = new Set();

  for (const compRoot of componentOrder) {
    const nodes = componentGroups.get(compRoot);
    if (!nodes) continue;

    const componentHierarchies = processComponent(nodes, validEdges);
    for (const h of componentHierarchies) {
      if (!seenRoots.has(h.root)) {
        seenRoots.add(h.root);
        hierarchies.push(h);
      }
    }
  }

  for (const [, nodes] of componentGroups) {
    const componentHierarchies = processComponent(nodes, validEdges);
    for (const h of componentHierarchies) {
      if (!seenRoots.has(h.root)) {
        seenRoots.add(h.root);
        hierarchies.push(h);
      }
    }
  }

  const nonCyclicTrees = hierarchies.filter((h) => !h.has_cycle);
  const cyclicGroups = hierarchies.filter((h) => h.has_cycle);

  let largest_tree_root = "";
  if (nonCyclicTrees.length > 0) {
    nonCyclicTrees.sort((a, b) => {
      const depthDiff = (b.depth ?? 0) - (a.depth ?? 0);
      if (depthDiff !== 0) return depthDiff;
      return a.root.localeCompare(b.root);
    });
    largest_tree_root = nonCyclicTrees[0].root;
  }

  return {
    hierarchies,
    invalid_entries,
    duplicate_edges,
    summary: {
      total_trees: nonCyclicTrees.length,
      total_cycles: cyclicGroups.length,
      largest_tree_root,
    },
  };
}

function buildBfhlResponse(data) {
  const result = processBfhlData(data);
  return {
    user_id: process.env.USER_ID || "fullname_ddmmyyyy",
    email_id: process.env.EMAIL_ID || "your.email@college.edu",
    college_roll_number: process.env.COLLEGE_ROLL_NUMBER || "YOUR_ROLL_NUMBER",
    ...result,
  };
}

module.exports = { processBfhlData, buildBfhlResponse };
