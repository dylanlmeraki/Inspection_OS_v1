import { NavLink, Outlet, useLocation } from "react-router-dom";
import SessionSwitcher from "@/components/SessionSwitcher";
import { PRIMARY_NAV, findRouteMeta } from "@/lib/routeRegistry";
import {
  prefetchExportCenterRoute,
  prefetchExportRuntime,
} from "@/lib/exportRuntimeLoader";

function isActiveRoot(pathname, to) {
  if (to === "/dashboard") return pathname.startsWith("/dashboard");
  return pathname === to || pathname.startsWith(`${to}/`);
}

export default function ControlPlaneLayout() {
  const location = useLocation();
  const routeMeta = findRouteMeta(location.pathname);
  const denialState = location.state?.deniedAction
    ? {
        action: location.state.deniedAction,
        code: location.state.deniedCode,
        reason: location.state.deniedReason,
      }
    : null;

  return (
    <div className="app-shell control-plane-shell">
      <header className="card control-plane-header">
        <div className="control-plane-header-main">
          <h1 className="title">Inspection.OS Control Plane</h1>
          <p className="subtitle">
            Wizard - Gate - Transition - Export sequence preserved with route/action guards,
            manifest defensibility, and deterministic local fixtures.
          </p>
          <div className="nav">
            {PRIMARY_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={isActiveRoot(location.pathname, item.to) ? "active-link" : ""}
                onMouseEnter={() => {
                  if (item.to === "/exports") {
                    prefetchExportCenterRoute();
                    prefetchExportRuntime({ includePdf: true });
                  }
                }}
                onFocus={() => {
                  if (item.to === "/exports") {
                    prefetchExportCenterRoute();
                    prefetchExportRuntime({ includePdf: true });
                  }
                }}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
          {routeMeta ? (
            <p className="small">
              Route: <span className="code">{location.pathname}</span> | Title: {routeMeta.title}
            </p>
          ) : null}
          {denialState ? (
            <div className="ambiguity-note">
              <strong>Access denied</strong>
              <p className="small">
                {denialState.code}: {denialState.reason}
              </p>
              <p className="small">Action: {denialState.action}</p>
            </div>
          ) : null}
        </div>
        <SessionSwitcher />
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

