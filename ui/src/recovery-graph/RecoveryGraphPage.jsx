import { useRecovery } from "../context/RecoveryContext.jsx";
import { buildRecoveryGraph } from "./GraphLayout.js";
import GraphNode from "./GraphNode.jsx";

export default function RecoveryGraphPage() {
  const { rules } = useRecovery();
  const nodes = buildRecoveryGraph(rules);

  return (
    <div style={{ position: "relative", height: 600 }}>
      {nodes.map((n, i) => (
        <GraphNode key={i} {...n} />
      ))}
    </div>
  );
}
