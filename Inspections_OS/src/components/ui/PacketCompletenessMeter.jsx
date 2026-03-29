/**
 * @param {{
 *   state: "complete"|"complete-with-waivers"|"incomplete"|"blocked"|"unknown"
 * }} props
 */
export default function PacketCompletenessMeter({ state }) {
  const tone =
    state === "complete"
      ? "ok"
      : state === "complete-with-waivers"
      ? "warn"
      : state === "unknown"
      ? "warn"
      : "fail";

  return (
    <div className="packet-meter">
      <div className="label">Packet Completeness</div>
      <div className={`badge ${tone}`}>{state}</div>
    </div>
  );
}

