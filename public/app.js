const SAMPLE_INPUT = `A->B
A->C
B->D
C->E
E->F
X->Y
Y->Z
Z->X
P->Q
Q->R
G->H
G->H
G->I
hello
1->2
A->`;

const API_URL = window.API_URL || "/bfhl";

const form = document.getElementById("bfhl-form");
const nodesInput = document.getElementById("nodes");
const submitBtn = document.getElementById("submit-btn");
const errorBanner = document.getElementById("error-banner");
const resultsSection = document.getElementById("results");

nodesInput.value = SAMPLE_INPUT;

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function renderTreeNode(label, subtree) {
  const childEntries = Object.entries(subtree);
  let childrenHtml = "";

  if (childEntries.length > 0) {
    const childNodes = childEntries
      .map(([childLabel, childTree]) => renderTreeNode(childLabel, childTree))
      .join("");
    childrenHtml = `<div class="tree-children">${childNodes}</div>`;
  }

  return `
    <div class="tree-node">
      <span class="tree-label">${escapeHtml(label)}</span>
      ${childrenHtml}
    </div>
  `;
}

function renderHierarchyCard(hierarchy) {
  const cardClass = hierarchy.has_cycle ? "card-cycle" : "card-tree";
  const badge = hierarchy.has_cycle
    ? '<span class="badge badge-cycle">Cycle detected</span>'
    : `<span class="badge badge-tree">Depth: ${hierarchy.depth}</span>`;

  let bodyHtml;
  if (hierarchy.has_cycle) {
    bodyHtml = '<p class="cycle-msg">This group contains a cycle — tree is empty.</p>';
  } else {
    const rootKey = Object.keys(hierarchy.tree)[0];
    bodyHtml = rootKey
      ? renderTreeNode(rootKey, hierarchy.tree[rootKey] || {})
      : "";
  }

  return `
    <div class="card ${cardClass}">
      <div class="card-header">
        <h3>Root: ${escapeHtml(hierarchy.root)}</h3>
        ${badge}
      </div>
      <div class="card-body">${bodyHtml}</div>
    </div>
  `;
}

function renderResults(result) {
  const hierarchyCards = result.hierarchies.map(renderHierarchyCard).join("");

  let issuesHtml = "";
  if (result.invalid_entries.length > 0 || result.duplicate_edges.length > 0) {
    let blocks = "";

    if (result.invalid_entries.length > 0) {
      const items = result.invalid_entries
        .map((entry) => `<li><code>${escapeHtml(entry)}</code></li>`)
        .join("");
      blocks += `<div class="issue-block"><h3>Invalid Entries</h3><ul>${items}</ul></div>`;
    }

    if (result.duplicate_edges.length > 0) {
      const items = result.duplicate_edges
        .map((entry) => `<li><code>${escapeHtml(entry)}</code></li>`)
        .join("");
      blocks += `<div class="issue-block"><h3>Duplicate Edges</h3><ul>${items}</ul></div>`;
    }

    issuesHtml = `<div class="issues">${blocks}</div>`;
  }

  resultsSection.innerHTML = `
    <div class="summary-grid">
      <div class="stat">
        <span class="stat-value">${result.summary.total_trees}</span>
        <span class="stat-label">Valid Trees</span>
      </div>
      <div class="stat">
        <span class="stat-value">${result.summary.total_cycles}</span>
        <span class="stat-label">Cycles</span>
      </div>
      <div class="stat">
        <span class="stat-value">${escapeHtml(result.summary.largest_tree_root || "—")}</span>
        <span class="stat-label">Largest Tree Root</span>
      </div>
    </div>

    <div class="meta-row">
      <span><strong>User ID:</strong> ${escapeHtml(result.user_id)}</span>
      <span><strong>Email:</strong> ${escapeHtml(result.email_id)}</span>
      <span><strong>Roll No:</strong> ${escapeHtml(result.college_roll_number)}</span>
    </div>

    <h2>Hierarchies</h2>
    <div class="cards">${hierarchyCards}</div>
    ${issuesHtml}

    <details class="raw-json">
      <summary>Raw JSON response</summary>
      <pre>${escapeHtml(JSON.stringify(result, null, 2))}</pre>
    </details>
  `;

  resultsSection.classList.remove("hidden");
}

function showError(message) {
  errorBanner.innerHTML = `<strong>Error:</strong> ${escapeHtml(message)}`;
  errorBanner.classList.remove("hidden");
}

function hideError() {
  errorBanner.classList.add("hidden");
  errorBanner.textContent = "";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideError();
  resultsSection.classList.add("hidden");
  submitBtn.disabled = true;
  submitBtn.textContent = "Processing…";

  const data = nodesInput.value
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `Request failed (${res.status})`);
    }

    const result = await res.json();
    renderResults(result);
  } catch (err) {
    showError(err.message || "Something went wrong.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Analyze Hierarchy";
  }
});
