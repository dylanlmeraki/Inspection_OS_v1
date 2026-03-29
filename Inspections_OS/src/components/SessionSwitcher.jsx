import { useMemo } from "react";
import { useMockSession } from "@/lib/mockSession.jsx";
import { localDb } from "@/lib/localDb";

/**
 * @param {string | null | undefined} userId
 */
function getProjectRoleSummary(userId) {
  if (!userId) return "No project membership";
  const memberships = localDb.listProjectMemberships().filter((item) => item.userId === userId);
  if (memberships.length === 0) return "No project membership";
  return memberships.map((item) => `${item.projectRole}@${item.projectId}`).join(", ");
}

export default function SessionSwitcher() {
  const { users, currentUser, setCurrentUserId } = useMockSession();
  const projectRoleSummary = useMemo(
    () => getProjectRoleSummary(currentUser?.id),
    [currentUser?.id]
  );

  return (
    <div className="session-switcher">
      <div className="label">Session</div>
      <select
        className="select"
        value={currentUser?.id || ""}
        onChange={(event) => setCurrentUserId(event.target.value)}
      >
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </select>
      <p className="small">
        Org role: {currentUser?.orgRole || "none"} | Project roles: {projectRoleSummary}
      </p>
    </div>
  );
}
