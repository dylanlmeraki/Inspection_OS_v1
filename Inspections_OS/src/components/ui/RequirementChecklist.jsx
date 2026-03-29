/**
 * @typedef {"field_data"|"document_artifact"|"signature_certification"|"source_verification"|"cadence_timing"} RequirementGroup
 */

/**
 * @param {{
 *   groups: Array<{
 *     key: RequirementGroup
 *     title: string
 *     items: Array<{ key: string, met: boolean, note?: string }>
 *   }>
 * }} props
 */
export default function RequirementChecklist({ groups }) {
  return (
    <div className="requirement-checklist">
      {groups.map((group) => (
        <div className="card" key={group.key}>
          <div className="label">{group.title}</div>
          <div className="list">
            {group.items.map((item) => (
              <div className="list-item" key={item.key}>
                <div className="row wrap">
                  <strong>{item.key}</strong>
                  <span className={`badge ${item.met ? "ok" : "fail"}`}>
                    {item.met ? "met" : "missing"}
                  </span>
                </div>
                {item.note ? <p className="small">{item.note}</p> : null}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

