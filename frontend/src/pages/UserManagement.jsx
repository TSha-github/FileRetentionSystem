import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import "../styles/userManagement.css";

const emptyForm = { username: "", password: "", role: "Customer User", customer_id: "", status: true };
const rowsFrom = (response) => (Array.isArray(response?.data?.data) ? response.data.data : []);
const roleOf = (user) => user?.role || user?.role_name || "";
const isAdmin = (user) => roleOf(user).toLowerCase() === "admin";
const isActive = (user) =>
  user?.status === "Active" ||
  user?.status === true ||
  user?.status === 1 ||
  user?.status === "1" ||
  user?.status_flag === 1 ||
  user?.status_flag === "1";
  const isPending = (user) =>
  roleOf(user) === "Customer User" &&
  !user?.customer_id;
function UserManagement() {
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [resetId, setResetId] = useState(null);
  const [resetPassword, setResetPassword] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
const [statusChangingId, setStatusChangingId] = useState(null);

  const loadData = async () => {
    const [usersResponse, customersResponse] = await Promise.all([api.get("/users"), api.get("/customers")]);
    setUsers(rowsFrom(usersResponse));
    setCustomers(rowsFrom(customersResponse));
  };

  useEffect(() => {
    let active = true;
    // The effect intentionally starts the initial remote data load.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || "Failed to load users and customers."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filteredUsers = useMemo(() => {
    const value = search.toLowerCase();
    return users.filter((user) => `${user.username} ${roleOf(user)} ${user.customer_name || ""} ${user.status || ""}`.toLowerCase().includes(value));
  }, [users, search]);

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setError(""); setShowForm(true); };
  const openEdit = (user) => {
    setEditingId(user.user_id);
    setForm({ username: user.username || "", password: "", role: roleOf(user) || "Customer User", customer_id: user.customer_id ?? "", status: isActive(user) });
    setError("");
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(emptyForm); };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((previous) => ({ ...previous, [name]: type === "checkbox" ? checked : value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const username = form.username.trim();
    if (!username) return setError("Username is required.");
    if (!editingId && !form.password.trim()) return setError("Temporary password is required when creating a user.");
    if (!editingId && form.password.length < 8) return setError("Password must be at least 8 characters.");
    if (editingId && form.password.trim() && form.password.length < 8) return setError("New password must be at least 8 characters.");

    const payload = { username, role: form.role };
    if (!editingId || form.password.trim()) payload.password = form.password;
    if (form.role === "Customer User") payload.customer_id = form.customer_id ? Number(form.customer_id) : null;
    if (form.role === "Admin") payload.customer_id = null;
    payload.status = form.role === "Customer User" && !form.customer_id ? false : form.status;

    setSaving(true);
    try {
      if (editingId) await api.patch(`/users/${editingId}`, payload);
      else await api.post("/users", payload);
      await loadData();
      closeForm();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save user.");
    } finally {
      setSaving(false);
    }
  };
const changeUserStatus = async (user, enable) => {
  setError("");
  setSuccess("");

  if (isAdmin(user)) {
    setError(
      "Admin users cannot be disabled from this screen."
    );
    return;
  }

  if (enable && isPending(user)) {
    setError(
      "This Customer User cannot be activated until Customer Master assigns a customer."
    );
    return;
  }

  if (enable && isActive(user)) {
    setError(
      "This user is already active."
    );
    return;
  }

  if (!enable && !isActive(user)) {
    setError(
      "This user is already disabled."
    );
    return;
  }

  const confirmed = window.confirm(
    enable
      ? `Activate "${user.username}"?\n\nThis user will be allowed to log in again.`
      : `Disable "${user.username}"?\n\nThis user will no longer be allowed to log in.`
  );

  if (!confirmed) {
    return;
  }

  setStatusChangingId(user.user_id);

  try {
    await api.patch(
      `/users/${user.user_id}`,
      {
        status: enable,
      }
    );
  } catch (requestError) {
    setError(
      requestError.response?.data?.error?.message ||
        requestError.response?.data?.message ||
        (enable
          ? "Unable to activate user."
          : "Unable to disable user.")
    );

    setStatusChangingId(null);
    return;
  }

  setSuccess(
    `"${user.username}" was ${
      enable ? "activated" : "disabled"
    } successfully.`
  );

  try {
    await loadData();
  } catch {
    setError(
      `The user was ${
        enable ? "activated" : "disabled"
      } successfully, but the user list could not be refreshed. Refresh the page.`
    );
  } finally {
    setStatusChangingId(null);
  }
};

  const submitReset = async (event) => {
    event.preventDefault();
    if (resetPassword.length < 8) return setError("Reset password must be at least 8 characters.");
    try {
      await api.patch(`/users/${resetId}/password`, { new_password: resetPassword });
      setResetId(null); setResetPassword(""); setError("");
    } catch (requestError) { setError(requestError.response?.data?.message || "Unable to reset password."); }
  };

  const customerSelection = form.role === "Customer User" ? (
    <div className="form-group">
      <label htmlFor="customer_id">Customer assignment</label>
      <select id="customer_id" name="customer_id" value={form.customer_id || ""} onChange={handleChange}>
        <option value="">New Customer / Pending Assignment</option>
        {customers.map((customer) => <option key={customer.customer_id} value={customer.customer_id}>{customer.customer_name || customer.name}</option>)}
      </select>
      {!form.customer_id && <small>Customer Setup Pending — this user cannot log in until Customer Master links a new customer.</small>}
    </div>
  ) : null;

  return (
    <>
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <div className="user-container">
          <div className="page-header"><div><h1>User Management</h1><p>Create pending users, assign customers, and manage access.</p></div><button className="add-user-btn" onClick={openAdd}>+ Add User</button></div>
          {error && <div className="error-message" role="alert">{error}</div>}
          {success && (
  <div className="success-message" role="status">
    {success}
  </div>
)}
          <div className="search-container"><input type="search" placeholder="Search users..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>

          {showForm && <div className="user-form-container">
            <h2>{editingId ? "Edit User" : "Add User"}</h2>
            <form onSubmit={submit}>
              <div className="form-group"><label htmlFor="username">Username</label><input id="username" name="username" value={form.username} onChange={handleChange} autoComplete="off" required /></div>
              <div className="form-group"><label htmlFor="password">{editingId ? "New temporary password (optional)" : "Temporary password"}</label><input id="password" name="password" type="password" value={form.password} onChange={handleChange} autoComplete="new-password" placeholder={editingId ? "Leave blank to keep existing password" : "At least 8 characters"} />{editingId && <small>Leave blank to preserve the existing bcrypt password hash.</small>}</div>
              <div className="form-group"><label htmlFor="role">Role</label><select id="role" name="role" value={form.role} onChange={handleChange}><option value="Admin">Admin</option><option value="Customer User">Customer User</option></select></div>
              {customerSelection}
              <div className="form-group checkbox-group"><label><input name="status" type="checkbox" checked={form.status} onChange={handleChange} disabled={form.role === "Customer User" && !form.customer_id} /> Active</label></div>
              <div className="form-buttons"><button className="save-btn" type="submit" disabled={saving}>{saving ? "Saving..." : editingId ? "Update User" : "Create User"}</button><button className="cancel-btn" type="button" onClick={closeForm}>Cancel</button></div>
            </form>
          </div>}

          <div className="table-container">{loading ? <p className="loading">Loading users...</p> : <table><thead><tr><th>ID</th><th>Username</th><th>Role</th><th>Customer</th><th>Status</th><th>Created At</th><th>Actions</th></tr></thead><tbody>{filteredUsers.length ? filteredUsers.map((user) => <tr key={user.user_id}><td>{user.user_id}</td><td>{user.username}</td><td>{roleOf(user)}</td><td>{user.customer_name || (user.customer_id ? user.customer_id : "Not assigned")}</td><td><span className={isActive(user) ? "status-active" : "status-inactive"}>{user.status || (isActive(user) ? "Active" : "Inactive")}</span></td><td>{user.created_at ? new Date(user.created_at).toLocaleString() : "-"}</td>
          <td>
  <button
    className="edit-btn"
    onClick={() => openEdit(user)}
  >
    Edit
  </button>

  {roleOf(user) === "Customer User" && (
    <button
      className="edit-btn"
      onClick={() => {
        setResetId(user.user_id);
        setResetPassword("");
      }}
    >
      Reset Password
    </button>
  )}

  {isAdmin(user) ? (
    <button
      className="delete-btn"
      disabled
      title="Admin account is protected"
    >
      Protected
    </button>
  ) : isPending(user) ? (
    <button
      className="delete-btn"
      disabled
      title="Customer assignment must be completed first"
    >
      Pending
    </button>
  ) : isActive(user) ? (
    <button
      className="delete-btn"
      disabled={
        statusChangingId === user.user_id
      }
      onClick={() =>
        changeUserStatus(user, false)
      }
    >
      {statusChangingId === user.user_id
        ? "Disabling..."
        : "Disable"}
    </button>
  ) : (
    <button
      className="edit-btn"
      disabled={
        statusChangingId === user.user_id
      }
      onClick={() =>
        changeUserStatus(user, true)
      }
    >
      {statusChangingId === user.user_id
        ? "Activating..."
        : "Activate"}
    </button>
  )}
</td></tr>) : <tr><td colSpan="7">No users found.</td></tr>}</tbody></table>}</div>

          {resetId && <div className="popup"><form className="popup-content" onSubmit={submitReset}><h2>Reset Customer User Password</h2><p>Enter a new temporary password. The existing password is never displayed.</p><input type="password" value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} placeholder="At least 8 characters" autoComplete="new-password" required /><div className="popup-buttons"><button type="submit">Reset Password</button><button type="button" onClick={() => { setResetId(null); setResetPassword(""); }}>Cancel</button></div></form></div>}
        </div>
      </div>
    </>
  );
}

export default UserManagement;
