// import { useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";

// import Navbar from "../components/Navbar";
// import Sidebar from "../components/Sidebar";
// import api from "../services/api";

// import "../styles/customerMaster.css";

// const emptyForm = {
//   customer_name: "",
//   description: "",
//   status: true,
//   login_user_id: "",
// };

// const rowsFrom = (response) =>
//   Array.isArray(response?.data?.data)
//     ? response.data.data
//     : [];

// function CustomerMaster() {
//   const navigate = useNavigate();

//   const [customers, setCustomers] = useState([]);
//   const [pendingUsers, setPendingUsers] = useState([]);

//   const [form, setForm] = useState(emptyForm);

//   const [search, setSearch] = useState("");
//   const [showForm, setShowForm] = useState(false);
//   const [editingId, setEditingId] = useState(null);

//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState("");

//   // ==========================================
//   // LOAD CUSTOMERS
//   // ==========================================
//   const loadCustomers = async () => {
//     const response = await api.get("/customers");
//     setCustomers(rowsFrom(response));
//   };

//   // ==========================================
//   // LOAD PENDING CUSTOMER USERS
//   // ==========================================
//   const loadPendingUsers = async () => {
//     const response = await api.get(
//       "/users/pending-customer-users"
//     );

//     setPendingUsers(rowsFrom(response));
//   };

//   // ==========================================
//   // INITIAL LOAD
//   // ==========================================
//   useEffect(() => {
//     let active = true;

//     const load = async () => {
//       try {
//         setLoading(true);
//         setError("");

//         const [
//           customerResponse,
//           pendingResponse,
//         ] = await Promise.all([
//           api.get("/customers"),
//           api.get("/users/pending-customer-users"),
//         ]);

//         if (!active) return;

//         setCustomers(rowsFrom(customerResponse));
//         setPendingUsers(rowsFrom(pendingResponse));
//       } catch (requestError) {
//         if (!active) return;

//         setError(
//           requestError.response?.data?.message ||
//             "Failed to load customers."
//         );
//       } finally {
//         if (active) {
//           setLoading(false);
//         }
//       }
//     };

//     load();

//     return () => {
//       active = false;
//     };
//   }, []);

//   // ==========================================
//   // SEARCH
//   // ==========================================
//   const filteredCustomers = useMemo(() => {
//     const value = search.toLowerCase();

//     return customers.filter((customer) =>
//       `${customer.customer_name || customer.name || ""}
//        ${customer.description || ""}
//        ${customer.status || ""}`
//         .toLowerCase()
//         .includes(value)
//     );
//   }, [customers, search]);

//   // ==========================================
//   // OPEN ADD
//   // ==========================================
//   const openAdd = async () => {
//     setEditingId(null);
//     setForm(emptyForm);
//     setError("");

//     try {
//       await loadPendingUsers();
//       setShowForm(true);
//     } catch (requestError) {
//       setError(
//         requestError.response?.data?.message ||
//           "Unable to load pending Customer Users."
//       );
//     }
//   };

//   // ==========================================
//   // OPEN EDIT
//   // ==========================================
//   const openEdit = (customer) => {
//     setEditingId(
//       customer.customer_id ?? customer.id
//     );

//     setForm({
//       customer_name:
//         customer.customer_name ||
//         customer.name ||
//         "",
//       description: customer.description || "",
//       status:
//         customer.status === "Active" ||
//         customer.status_flag === 1 ||
//         customer.status === true,
//       login_user_id: "",
//     });

//     setError("");
//     setShowForm(true);
//   };

//   // ==========================================
//   // CLOSE
//   // ==========================================
//   const closeForm = () => {
//     setShowForm(false);
//     setEditingId(null);
//     setForm(emptyForm);
//     setError("");
//   };

//   // ==========================================
//   // CHANGE
//   // ==========================================
//   const handleChange = (event) => {
//     const {
//       name,
//       value,
//       type,
//       checked,
//     } = event.target;

//     setForm((previous) => ({
//       ...previous,
//       [name]:
//         type === "checkbox"
//           ? checked
//           : value,
//     }));
//   };

//   // ==========================================
//   // SAVE CUSTOMER
//   // ==========================================
//   const submit = async (event) => {
//     event.preventDefault();

//     setError("");

//     const customerName =
//       form.customer_name.trim();

//     if (!customerName) {
//       setError("Customer name is required.");
//       return;
//     }

//     // New customer MUST have a pending user
//     if (
//       !editingId &&
//       !form.login_user_id
//     ) {
//       setError(
//         "Please select a registered pending Customer User."
//       );
//       return;
//     }

//     setSaving(true);

//     try {
//       if (editingId) {
//         // EDIT EXISTING CUSTOMER
//         await api.patch(
//           `/customers/${editingId}`,
//           {
//             customer_name: customerName,
//             description:
//               form.description.trim(),
//             status: form.status,
//           }
//         );

//         await loadCustomers();

//         closeForm();
//       } else {
//         // CREATE + LINK PENDING USER
//         const loginUserId = Number(
//           form.login_user_id
//         );

//         if (
//           !Number.isSafeInteger(loginUserId) ||
//           loginUserId <= 0
//         ) {
//           setError(
//             "Please select a valid registered Customer User."
//           );
//           return;
//         }

//         await api.post("/customers", {
//           customer_name: customerName,
//           description:
//             form.description.trim(),
//           status: form.status,

//           // IMPORTANT:
//           // send NUMBER, not string/null
//           login_user_id: loginUserId,
//         });

//         await Promise.all([
//           loadCustomers(),
//           loadPendingUsers(),
//         ]);

//         closeForm();

//         alert(
//           "Customer created and Customer User linked successfully."
//         );

//         // Change this path only if your actual
//         // Job Master route uses another URL.
//         navigate("/job-master");
//       }
//     } catch (requestError) {
//       setError(
//         requestError.response?.data?.message ||
//           "Unable to save customer."
//       );
//     } finally {
//       setSaving(false);
//     }
//   };

//   // ==========================================
//   // DELETE CUSTOMER
//   // ==========================================
// const disableCustomer = async (customer) => {
//   const id = customer.customer_id ?? customer.id;
//   const name = customer.customer_name || customer.name;

//   if (!window.confirm(`Disable ${name}?`)) {
//     return;
//   }

//   setError("");

//   try {
//     await api.patch(`/customers/${id}`, {
//       status: false,
//     });

//     await loadCustomers();
//   } catch (requestError) {
//     setError(
//       requestError.response?.data?.message ||
//         "Unable to disable customer."
//     );
//   }
// };

//   return (
//     <>
//       <Sidebar />

//       <div className="main-content">
//         <Navbar />

//         <div className="customer-container">

//           {/* HEADER */}
//           <div className="customer-header">
//             <div>
//               <h2>Customer Master</h2>

//               <p>
//                 Create a customer by linking
//                 a registered pending Customer User.
//               </p>
//             </div>

//             <button
//               className="add-btn"
//               onClick={openAdd}
//             >
//               + Add Customer
//             </button>
//           </div>

//           {/* ERROR */}
//           {error && (
//             <div
//               className="error-message"
//               role="alert"
//             >
//               {error}
//             </div>
//           )}

//           {/* SEARCH */}
//           <div className="search-box">
//             <input
//               type="search"
//               placeholder="Search customers..."
//               value={search}
//               onChange={(event) =>
//                 setSearch(
//                   event.target.value
//                 )
//               }
//             />
//           </div>

//           {/* ADD / EDIT POPUP */}
//           {showForm && (
//             <div className="popup">
//               <form
//                 className="popup-content"
//                 onSubmit={submit}
//               >
//                 <h2>
//                   {editingId
//                     ? "Edit Customer"
//                     : "Add Customer"}
//                 </h2>

//                 {/* PENDING USER FIRST */}
//                 {!editingId && (
//                   <div className="form-group">
//                     <label
//                       htmlFor="login_user_id"
//                     >
//                       Registered Customer User
//                     </label>

//                     {pendingUsers.length > 0 ? (
//                       <>
//                         <select
//                           id="login_user_id"
//                           name="login_user_id"
//                           value={
//                             form.login_user_id
//                           }
//                           onChange={
//                             handleChange
//                           }
//                           required
//                         >
//                           <option value="">
//                             Select Customer User
//                           </option>

//                           {pendingUsers.map(
//                             (user) => (
//                               <option
//                                 key={
//                                   user.user_id
//                                 }
//                                 value={
//                                   user.user_id
//                                 }
//                               >
//                                 {
//                                   user.username
//                                 }
//                               </option>
//                             )
//                           )}
//                         </select>

//                         <small>
//                           Only pending,
//                           unassigned Customer
//                           Users are shown.
//                         </small>
//                       </>
//                     ) : (
//                       <div className="form-note">
//                         No unassigned Customer
//                         Users available. Create
//                         a Customer User in User
//                         Management first.
//                       </div>
//                     )}
//                   </div>
//                 )}

//                 {/* CUSTOMER NAME */}
//                 <input
//                   name="customer_name"
//                   value={
//                     form.customer_name
//                   }
//                   onChange={handleChange}
//                   placeholder="Customer Name"
//                   required
//                 />

//                 {/* DESCRIPTION */}
//                 <input
//                   name="description"
//                   value={form.description}
//                   onChange={handleChange}
//                   placeholder="Description"
//                 />

//                 {/* STATUS */}
//                 <select
//                   name="status"
//                   value={
//                     form.status
//                       ? "true"
//                       : "false"
//                   }
//                   onChange={(event) =>
//                     setForm(
//                       (previous) => ({
//                         ...previous,
//                         status:
//                           event.target
//                             .value ===
//                           "true",
//                       })
//                     )
//                   }
//                 >
//                   <option value="true">
//                     Active
//                   </option>

//                   <option value="false">
//                     Inactive
//                   </option>
//                 </select>

//                 {/* BUTTONS */}
//                 <div className="popup-buttons">
//                   <button
//                     type="submit"
//                     disabled={
//                       saving ||
//                       (!editingId &&
//                         pendingUsers.length ===
//                           0)
//                     }
//                   >
//                     {saving
//                       ? "Saving..."
//                       : editingId
//                         ? "Update"
//                         : "Save"}
//                   </button>

//                   <button
//                     type="button"
//                     onClick={closeForm}
//                   >
//                     Cancel
//                   </button>
//                 </div>
//               </form>
//             </div>
//           )}

//           {/* CUSTOMER TABLE */}
//           <table className="customer-table">
//             <thead>
//               <tr>
//                 <th>ID</th>
//                 <th>
//                   Customer Name
//                 </th>
//                 <th>Description</th>
//                 <th>Status</th>
//                 <th>Actions</th>
//               </tr>
//             </thead>

//             <tbody>
//               {loading ? (
//                 <tr>
//                   <td colSpan="5">
//                     Loading customers...
//                   </td>
//                 </tr>
//               ) : filteredCustomers.length >
//                 0 ? (
//                 filteredCustomers.map(
//                   (customer) => (
//                     <tr
//                       key={
//                         customer.customer_id ??
//                         customer.id
//                       }
//                     >
//                       <td>
//                         {customer.customer_id ??
//                           customer.id}
//                       </td>

//                       <td>
//                         {customer.customer_name ||
//                           customer.name}
//                       </td>

//                       <td>
//                         {customer.description ||
//                           "-"}
//                       </td>

//                       <td>
//                         <span
//                           className={
//                             customer.status ===
//                               "Active" ||
//                             customer.status_flag ===
//                               1
//                               ? "status-active"
//                               : "status-inactive"
//                           }
//                         >
//                           {customer.status ||
//                             "Inactive"}
//                         </span>
//                       </td>

//                       <td>
//                         <button
//                           className="edit-btn"
//                           onClick={() =>
//                             openEdit(
//                               customer
//                             )
//                           }
//                         >
//                           Edit
//                         </button>

//                   <button
//   className="delete-btn"
//   onClick={() => disableCustomer(customer)}
//   disabled={
//     customer.status === "Inactive" ||
//     customer.status_flag === 0
//   }
// >
//   {customer.status === "Inactive" ||
//   customer.status_flag === 0
//     ? "Disabled"
//     : "Disable"}
// </button>
//                       </td>
//                     </tr>
//                   )
//                 )
//               ) : (
//                 <tr>
//                   <td colSpan="5">
//                     No customers found.
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </>
//   );
// }

// export default CustomerMaster;

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import api from "../services/api";

import "../styles/customerMaster.css";

const emptyForm = {
  customer_name: "",
  description: "",
  folder_path: "",
  status: true,
  login_user_id: "",
};

function rowsFrom(response) {
  return Array.isArray(
    response?.data?.data
  )
    ? response.data.data
    : [];
}

function apiMessage(
  error,
  fallback
) {
  return (
    error?.response?.data?.error
      ?.message ||
    error?.response?.data?.message ||
    fallback
  );
}

function CustomerMaster() {
  const navigate =
    useNavigate();

  const [
    customers,
    setCustomers,
  ] = useState([]);

  const [
    pendingUsers,
    setPendingUsers,
  ] = useState([]);

  const [form, setForm] =
    useState(emptyForm);

  const [search, setSearch] =
    useState("");

  const [
    showForm,
    setShowForm,
  ] = useState(false);

  const [
    editingId,
    setEditingId,
  ] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // ==========================================
  // LOAD CUSTOMERS
  // ==========================================

  const loadCustomers =
    async () => {
      const response =
        await api.get(
          "/customers"
        );

      setCustomers(
        rowsFrom(response)
      );
    };

  // ==========================================
  // LOAD PENDING USERS
  // ==========================================

  const loadPendingUsers =
    async () => {
      const response =
        await api.get(
          "/users/pending-customer-users"
        );

      setPendingUsers(
        rowsFrom(response)
      );
    };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          customerResponse,
          pendingResponse,
        ] = await Promise.all([
          api.get("/customers"),
          api.get(
            "/users/pending-customer-users"
          ),
        ]);

        if (!active) return;

        setCustomers(
          rowsFrom(
            customerResponse
          )
        );

        setPendingUsers(
          rowsFrom(
            pendingResponse
          )
        );
      } catch (
        requestError
      ) {
        if (!active) return;

        setError(
          apiMessage(
            requestError,
            "Failed to load customers."
          )
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  // ==========================================
  // SEARCH
  // ==========================================

  const filteredCustomers =
    useMemo(() => {
      const value =
        search
          .trim()
          .toLowerCase();

      if (!value) {
        return customers;
      }

      return customers.filter(
        (customer) =>
          [
            customer.customer_id ??
              customer.id,

            customer.customer_name ||
              customer.name,

            customer.description,

            customer.status,
          ]
            .filter(
              (item) =>
                item !== null &&
                item !==
                  undefined
            )
            .join(" ")
            .toLowerCase()
            .includes(value)
      );
    }, [customers, search]);

  // ==========================================
  // OPEN ADD
  // ==========================================

  const openAdd =
    async () => {
      setEditingId(null);
      setForm(emptyForm);
      setError("");
      setSuccess("");

      try {
        await loadPendingUsers();

        setShowForm(true);
      } catch (
        requestError
      ) {
        setError(
          apiMessage(
            requestError,
            "Unable to load pending Customer Users."
          )
        );
      }
    };

  // ==========================================
  // OPEN EDIT
  // ==========================================

  const openEdit = (
    customer
  ) => {
    setEditingId(
      customer.customer_id ??
        customer.id
    );

    setForm({
      customer_name:
        customer.customer_name ||
        customer.name ||
        "",

      description:
        customer.description ||
        "",
        folder_path: customer.folder_path || "",

      status:
        customer.status ===
          "Active" ||
        customer.status_flag ===
          1 ||
        customer.status === true,

      login_user_id: "",
    });

    setError("");
    setSuccess("");

    setShowForm(true);
  };

  // ==========================================
  // CLOSE
  // ==========================================

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  // ==========================================
  // CHANGE
  // ==========================================

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm(
      (current) => ({
        ...current,

        [name]:
          type ===
          "checkbox"
            ? checked
            : value,
      })
    );
  };

  // ==========================================
  // SAVE CUSTOMER
  // ==========================================

  const submit = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const customerName =
      form.customer_name.trim();

    if (!customerName) {
      setError(
        "Customer name is required."
      );

      return;
    }

    if (
      !editingId &&
      !form.login_user_id
    ) {
      setError(
        "Please select a registered pending Customer User."
      );

      return;
    }

    setSaving(true);

    try {
      if (editingId) {
     await api.patch(
  `/customers/${editingId}`,
  {
    customer_name:
      customerName,

    description:
      form.description.trim(),

    folder_path:
      form.folder_path.trim(),

    status:
      form.status,
  }
);

        setSuccess(
          "Customer updated successfully."
        );

        closeForm();

        try {
          await loadCustomers();
        } catch {
          setError(
            "Customer was updated successfully, but the list could not be refreshed."
          );
        }

        return;
      }

      const loginUserId =
        Number(
          form.login_user_id
        );

      if (
        !Number.isSafeInteger(
          loginUserId
        ) ||
        loginUserId <= 0
      ) {
        setError(
          "Please select a valid registered Customer User."
        );

        return;
      }

 await api.post(
  "/customers",
  {
    customer_name:
      customerName,

    description:
      form.description.trim(),

    folder_path:
      form.folder_path.trim(),

    status:
      form.status,

    login_user_id:
      loginUserId,
  }
);

      setSuccess(
        "Customer created and Customer User linked successfully."
      );

      closeForm();

      try {
        await Promise.all([
          loadCustomers(),
          loadPendingUsers(),
        ]);
      } catch {
        setError(
          "Customer was created successfully, but the page could not refresh the latest data."
        );
      }

      /*
       * Continue onboarding.
       * Ensure this matches the actual
       * Job Master route in App.jsx.
       */
      navigate(
        "/job-master"
      );
    } catch (
      requestError
    ) {
      setError(
        apiMessage(
          requestError,
          editingId
            ? "Unable to update customer."
            : "Unable to create customer."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // DISABLE CUSTOMER
  // ==========================================

  const disableCustomer =
    async (customer) => {
      const id =
        customer.customer_id ??
        customer.id;

      const name =
        customer.customer_name ||
        customer.name;

      const active =
        customer.status ===
          "Active" ||
        customer.status_flag ===
          1 ||
        customer.status ===
          true;

      if (!active) {
        setError(
          `${name} is already inactive.`
        );

        return;
      }

      const confirmed =
        window.confirm(
          `Disable "${name}"?\n\n` +
            "The customer will remain in the database so historical jobs, logs and reports are preserved."
        );

      if (!confirmed) {
        return;
      }

      setError("");
      setSuccess("");

      /*
       * Disable is a PATCH, not hard DELETE.
       * This preserves historical relationships.
       */
      try {
        await api.patch(
          `/customers/${id}`,
          {
            status: false,
          }
        );
      } catch (
        requestError
      ) {
        setError(
          apiMessage(
            requestError,
            "Unable to disable customer."
          )
        );

        return;
      }

      setSuccess(
        `"${name}" was disabled successfully.`
      );

      try {
        await loadCustomers();
      } catch {
        setError(
          "The customer was disabled successfully, but the list could not be refreshed."
        );
      }
    };

  return (
    <>
      <Sidebar />

      <div className="main-content">
        <Navbar />

        <div className="customer-container">

          <div className="customer-header">
            <div>
              <h2>
                Customer Master
              </h2>

              <p>
                Create customers by
                linking registered
                pending Customer
                Users.
              </p>
            </div>

            <button
              className="add-btn"
              onClick={openAdd}
            >
              + Add Customer
            </button>
          </div>

          {success && (
            <div
              className="success-message"
              role="status"
            >
              {success}
            </div>
          )}

          {error && (
            <div
              className="error-message"
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="search-box">
            <input
              type="search"
              placeholder="Search customers..."
              value={search}
              onChange={(
                event
              ) =>
                setSearch(
                  event.target
                    .value
                )
              }
            />
          </div>

          {showForm && (
            <div className="popup">
              <form
                className="popup-content"
                onSubmit={submit}
              >
                <h2>
                  {editingId
                    ? "Edit Customer"
                    : "Add Customer"}
                </h2>

                {!editingId && (
                  <div className="form-group">
                    <label
                      htmlFor="login_user_id"
                    >
                      Registered
                      Customer User
                    </label>

                    {pendingUsers.length ? (
                      <>
                        <select
                          id="login_user_id"
                          name="login_user_id"
                          value={
                            form.login_user_id
                          }
                          onChange={
                            handleChange
                          }
                          required
                        >
                          <option value="">
                            Select
                            Customer User
                          </option>

                          {pendingUsers.map(
                            (user) => (
                              <option
                                key={
                                  user.user_id
                                }
                                value={
                                  user.user_id
                                }
                              >
                                {
                                  user.username
                                }
                              </option>
                            )
                          )}
                        </select>

                        <small>
                          Only pending,
                          unassigned
                          Customer Users
                          are shown.
                        </small>
                      </>
                    ) : (
                      <div className="form-note">
                        No unassigned
                        Customer Users
                        are available.
                        Create a Customer
                        User in User
                        Management first.
                      </div>
                    )}
                  </div>
                )}

                <label>
                  Customer Name
                </label>

             <input
  name="customer_name"
  value={form.customer_name}
  onChange={(event) => {
    const value = event.target.value;

    setForm((current) => ({
      ...current,
      customer_name: value,

      folder_path:
        editingId === null
          ? value.trim()
            ? `D:\\Retention\\${value}`
            : ""
          : current.folder_path,
    }));
  }}
  placeholder="Customer Name"
  required
/>

                <label>
  Description
</label>

<input
  name="description"
  value={form.description}
  onChange={handleChange}
  placeholder="Description"
/>

<label>
  Retention Folder Path
</label>

<input
  name="folder_path"
  value={form.folder_path}
  onChange={handleChange}
  placeholder="Folder path will be generated automatically"
  required
/>

<label>
  Status
</label>

                <select
                  name="status"
                  value={
                    form.status
                      ? "true"
                      : "false"
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,

                        status:
                          event
                            .target
                            .value ===
                          "true",
                      })
                    )
                  }
                >
                  <option value="true">
                    Active
                  </option>

                  <option value="false">
                    Inactive
                  </option>
                </select>

                <div className="popup-buttons">
                  <button
                    type="submit"
                    disabled={
                      saving ||
                      (!editingId &&
                        pendingUsers.length ===
                          0)
                    }
                  >
                    {saving
                      ? "Saving..."
                      : editingId
                        ? "Update"
                        : "Save"}
                  </button>

                  <button
                    type="button"
                    onClick={
                      closeForm
                    }
                    disabled={
                      saving
                    }
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <table className="customer-table">
            <thead>
              <tr>
                <th>ID</th>

                <th>
                  Customer Name
                </th>

                <th>
                  Description
                </th>

                <th>Status</th>
                

                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5">
                    Loading
                    customers...
                  </td>
                </tr>
              ) : filteredCustomers.length ? (
                filteredCustomers.map(
                  (
                    customer
                  ) => {
                    const id =
                      customer.customer_id ??
                      customer.id;

                    const active =
                      customer.status ===
                        "Active" ||
                      customer.status_flag ===
                        1 ||
                      customer.status ===
                        true;

                    return (
                      <tr key={id}>
                        <td>
                          {id}
                        </td>

                        <td>
                          {customer.customer_name ||
                            customer.name}
                        </td>

                        <td>
                          {customer.description ||
                            "-"}
                        </td>

                        <td>
                          <span
                            className={
                              active
                                ? "status-active"
                                : "status-inactive"
                            }
                          >
                            {active
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td>
                          <button
                            className="edit-btn"
                            onClick={() =>
                              openEdit(
                                customer
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="delete-btn"
                            disabled={
                              !active
                            }
                            onClick={() =>
                              disableCustomer(
                                customer
                              )
                            }
                          >
                            {active
                              ? "Disable"
                              : "Disabled"}
                          </button>
                        </td>
                      </tr>
                    );
                  }
                )
              ) : (
                <tr>
                  <td colSpan="5">
                    No customers
                    found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default CustomerMaster;