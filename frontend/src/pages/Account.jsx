import { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import "../styles/userManagement.css";

function Account() {
  const [form, setForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setMessage(""); setError("");
    if (form.new_password.length < 8) return setError("New password must be at least 8 characters.");
    if (form.new_password !== form.confirm_password) return setError("New password and confirmation do not match.");
    setSaving(true);
    try {
      const response = await api.patch("/me/password", form);
      setMessage(response.data?.data?.message || "Password changed successfully.");
      setForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to change password.");
    } finally { setSaving(false); }
  };

  const update = (event) => setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));

  return <><Sidebar /><div className="main-content"><Navbar /><div className="user-container"><div className="page-header"><div><h1>Change Password</h1><p>Update your private password. Administrators cannot view it.</p></div></div>{message && <div className="success-message" role="status">{message}</div>}{error && <div className="error-message" role="alert">{error}</div>}<div className="user-form-container"><form onSubmit={submit}><div className="form-group"><label htmlFor="current_password">Current Password</label><input id="current_password" name="current_password" type="password" value={form.current_password} onChange={update} autoComplete="current-password" required /></div><div className="form-group"><label htmlFor="new_password">New Password</label><input id="new_password" name="new_password" type="password" value={form.new_password} onChange={update} autoComplete="new-password" minLength="8" required /></div><div className="form-group"><label htmlFor="confirm_password">Confirm New Password</label><input id="confirm_password" name="confirm_password" type="password" value={form.confirm_password} onChange={update} autoComplete="new-password" minLength="8" required /></div><div className="form-buttons"><button className="save-btn" type="submit" disabled={saving}>{saving ? "Changing..." : "Change Password"}</button></div></form></div></div></div></>;
}

export default Account;
