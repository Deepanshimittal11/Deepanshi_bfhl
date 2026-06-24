const { processBfhlData } = require("../lib/bfhl");

let passed = true;

// Helper assert function
function assertDeepEqual(actual, expected, message) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    console.error(`FAIL: ${message}\nExpected: ${expectedStr}\nGot: ${actualStr}`);
    passed = false;
  }
}

// ----------------------------------------------------
// Test 1: Original Example Data
// ----------------------------------------------------
console.log("Running Test 1: Original Example Data...");
const exampleData = [
  "A->B", "A->C", "B->D", "C->E", "E->F",
  "X->Y", "Y->Z", "Z->X",
  "P->Q", "Q->R",
  "G->H", "G->H", "G->I",
  "hello", "1->2", "A->",
];
const result1 = processBfhlData(exampleData);

assertDeepEqual(result1.invalid_entries, ["hello", "1->2", "A->"], "Test 1 invalid_entries");
assertDeepEqual(result1.duplicate_edges, ["G->H"], "Test 1 duplicate_edges");
assertDeepEqual(result1.summary, { total_trees: 3, total_cycles: 1, largest_tree_root: "A" }, "Test 1 summary");

assertDeepEqual(result1.hierarchies[0].root, "A", "Test 1 hierarchy 0 root");
assertDeepEqual(result1.hierarchies[0].depth, 4, "Test 1 hierarchy 0 depth");
assertDeepEqual(result1.hierarchies[1].root, "X", "Test 1 hierarchy 1 root");
assertDeepEqual(result1.hierarchies[1].has_cycle, true, "Test 1 hierarchy 1 cycle");
assertDeepEqual(result1.hierarchies[2].root, "P", "Test 1 hierarchy 2 root");
assertDeepEqual(result1.hierarchies[2].depth, 3, "Test 1 hierarchy 2 depth");
assertDeepEqual(result1.hierarchies[3].root, "G", "Test 1 hierarchy 3 root");
assertDeepEqual(result1.hierarchies[3].depth, 2, "Test 1 hierarchy 3 depth");

// ----------------------------------------------------
// Test 2: Cycle with a tail
// ----------------------------------------------------
console.log("Running Test 2: Cycle with a tail...");
const cycleWithTailData = ["A->X", "X->Y", "Y->Z", "Z->X"];
const result2 = processBfhlData(cycleWithTailData);

assertDeepEqual(result2.summary, { total_trees: 0, total_cycles: 1, largest_tree_root: "" }, "Test 2 summary");
assertDeepEqual(result2.hierarchies, [
  { root: "A", tree: {}, has_cycle: true }
], "Test 2 hierarchies");

// ----------------------------------------------------
// Test 3: Diamond Case
// ----------------------------------------------------
console.log("Running Test 3: Diamond Case...");
const diamondData = ["A->D", "B->D"];
const result3 = processBfhlData(diamondData);

assertDeepEqual(result3.summary, { total_trees: 2, total_cycles: 0, largest_tree_root: "A" }, "Test 3 summary");
assertDeepEqual(result3.hierarchies, [
  { root: "A", tree: { "A": { "D": {} } }, depth: 2 },
  { root: "B", tree: { "B": {} }, depth: 1 }
], "Test 3 hierarchies");

// ----------------------------------------------------
// Test 4: Diamond with other connections
// ----------------------------------------------------
console.log("Running Test 4: Diamond with other connections...");
const diamondWithConnectionsData = ["A->D", "B->D", "B->C"];
const result4 = processBfhlData(diamondWithConnectionsData);

assertDeepEqual(result4.summary, { total_trees: 2, total_cycles: 0, largest_tree_root: "A" }, "Test 4 summary");
assertDeepEqual(result4.hierarchies, [
  { root: "A", tree: { "A": { "D": {} } }, depth: 2 },
  { root: "B", tree: { "B": { "C": {} } }, depth: 2 }
], "Test 4 hierarchies");

console.log(passed ? "\n✓ All tests passed!" : "\n✗ Some tests failed.");
process.exit(passed ? 0 : 1);
