import { useTimeline } from "../context/TimelineContext.jsx";

export default function TimelinePage() {
  const { events } = useTimeline();
  return (
    <pre>{JSON.stringify(events, null, 2)}</pre>
  );
}
