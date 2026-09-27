import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import "../styles/roleManagement.css";

function RoleManagement() {
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api.get("/roles")
      .then((response) => { if (active) setRoles(Array.isArray(response?.data?.data) ? response.data.data : []); })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || "Unable to load roles."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filteredRoles = useMemo(() => roles.filter((role) => (role.role_name || "").toLowerCase().includes(search.toLowerCase())), [roles, search]);

  return <><Sidebar /><div className="main-content"><Navbar /><div className="role-container"><div className="role-header"><div><h2>Role Reference</h2><p>System roles are fixed and cannot be created, renamed, or deleted.</p></div></div>{error && <p className="error-message" role="alert">{error}</p>}<div className="search-box"><input type="search" placeholder="Search roles..." value={search} onChange={(event) => setSearch(event.target.value)} /></div><table className="role-table"><thead><tr><th>Role ID</th><th>Role Name</th><th>Status</th></tr></thead><tbody>{loading ? <tr><td colSpan="3">Loading roles...</td></tr> : filteredRoles.length ? filteredRoles.map((role) => <tr key={role.role_id}><td>{role.role_id}</td><td>{role.role_name}</td><td><span className="status-active">{role.status || "Active"}</span></td></tr>) : <tr><td colSpan="3">No roles found.</td></tr>}</tbody></table></div></div></>;
}

export default RoleManagement;
