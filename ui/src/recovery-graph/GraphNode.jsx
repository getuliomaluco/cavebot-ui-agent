export default function GraphNode({ rule, x, y }) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 300,
        padding: 10,
        border: "1px solid #ccc",
        borderRadius: 8
      }}
    >
      <strong>{rule.name}</strong>
    </div>
  );
}
