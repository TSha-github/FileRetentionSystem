const assert = require("assert");
const bcrypt = require("bcrypt");
const Module = require("module");

process.env.JWT_SECRET = "deterministic-test-secret";

const originalLoad = Module._load;

function normalizeSql(sql) {
  return String(sql || "")
    .replace(/\s+/g, " ")
    .trim();
}

function loadServiceWithDb(servicePath, fakeDb) {
  delete require.cache[require.resolve(servicePath)];

  Module._load = function patchedLoad(
    request,
    parent,
    isMain
  ) {
    if (request === "../config/db") {
      return fakeDb;
    }

    return originalLoad.call(
      this,
      request,
      parent,
      isMain
    );
  };

  try {
    return require(servicePath);
  } finally {
    Module._load = originalLoad;
  }
}

function createMasterDb() {
  const db = {
    users: [],
    roles: [
      {
        role_id: 1,
        role_name: "Admin",
      },
      {
        role_id: 2,
        role_name: "Customer User",
      },
    ],
    customers: [],
    nextUserId: 1,
    nextCustomerId: 1,
  };

  function userView(user) {
    const role = db.roles.find(
      (item) => item.role_id === user.role_id
    );

    const customer = db.customers.find(
      (item) =>
        item.customer_id === user.customer_id
    );

    return {
      user_id: user.user_id,
      username: user.username,
      role_id: user.role_id,
      role_name: role?.role_name,
      role: role?.role_name,
      customer_id: user.customer_id,
      customer_name:
        customer?.customer_name || null,
      status_flag: user.status ? 1 : 0,
      status:
        role?.role_name === "Customer User" &&
        user.customer_id === null
          ? "Pending Customer Setup"
          : user.status
            ? "Active"
            : "Inactive",
      created_at: user.created_at,
    };
  }

  function customerView(customer) {
    return {
      ...customer,
      id: customer.customer_id,
      name: customer.customer_name,
      status_flag: customer.status ? 1 : 0,
      status: customer.status
        ? "Active"
        : "Inactive",
    };
  }

  db.query = async (sql, params = []) => {
    const normalizedSql = normalizeSql(sql);

    if (
      normalizedSql.startsWith(
        "SELECT user_id FROM USERS WHERE username = ?"
      )
    ) {
      const user = db.users.find(
        (item) =>
          item.username === params[0] &&
          (
            params.length === 1 ||
            item.user_id !== Number(params[1])
          )
      );

      return user
        ? [{ user_id: user.user_id }]
        : [];
    }

    if (
      normalizedSql.startsWith(
        "SELECT role_id FROM ROLES WHERE role_name = ?"
      )
    ) {
      const role = db.roles.find(
        (item) =>
          item.role_name === params[0]
      );

      return role
        ? [{ role_id: role.role_id }]
        : [];
    }

    if (
      normalizedSql.startsWith(
        "SELECT role_name FROM ROLES WHERE role_id = ?"
      )
    ) {
      const role = db.roles.find(
        (item) =>
          item.role_id === Number(params[0])
      );

      return role
        ? [{ role_name: role.role_name }]
        : [];
    }

    if (
      normalizedSql.startsWith(
        "SELECT customer_id FROM CUSTOMER_MASTER WHERE customer_id = ?"
      )
    ) {
      return db.customers
        .filter(
          (item) =>
            item.customer_id ===
            Number(params[0])
        )
        .map((item) => ({
          customer_id:
            item.customer_id,
        }));
    }

    if (
      normalizedSql.startsWith(
        "SELECT u.user_id, u.username"
      )
    ) {
      const user = db.users.find(
        (item) =>
          item.user_id ===
          Number(params[0])
      );

      return user
        ? [userView(user)]
        : [];
    }

    if (
      normalizedSql.startsWith(
        "UPDATE USERS SET"
      )
    ) {
      const userId = Number(
        params[params.length - 1]
      );

      const user = db.users.find(
        (item) =>
          item.user_id === userId
      );

      if (!user) {
        throw new Error(
          "User not found during update"
        );
      }

      let valueIndex = 0;

      if (
        normalizedSql.includes(
          "username = ?"
        )
      ) {
        user.username =
          params[valueIndex++];
      }

      if (
        normalizedSql.includes(
          "role_id = ?"
        )
      ) {
        user.role_id = Number(
          params[valueIndex++]
        );
      }

      if (
        normalizedSql.includes(
          "customer_id = ?"
        )
      ) {
        const value =
          params[valueIndex++];

        user.customer_id =
          value === null ||
          value === undefined
            ? null
            : Number(value);
      }

      if (
        normalizedSql.includes(
          "status = ?"
        )
      ) {
        user.status = Boolean(
          params[valueIndex++]
        );
      }

      if (
        normalizedSql.includes(
          "password = ?"
        )
      ) {
        user.password =
          params[valueIndex++];
      }

      return {
        affectedRows: 1,
      };
    }

    if (
      normalizedSql.startsWith(
        "INSERT INTO USERS"
      )
    ) {
      const [
        username,
        password,
        role_id,
        customer_id,
        status,
      ] = params;

      if (
        db.users.some(
          (item) =>
            item.username === username
        )
      ) {
        const error = new Error(
          "Duplicate entry for username"
        );

        error.code =
          "ER_DUP_ENTRY";

        error.message =
          "Duplicate entry for username";

        throw error;
      }

      const user = {
        user_id:
          db.nextUserId++,

        username,
        password,

        role_id:
          Number(role_id),

        customer_id:
          customer_id === null ||
          customer_id === undefined
            ? null
            : Number(customer_id),

        status:
          Boolean(status),

        created_at:
          new Date().toISOString(),
      };

      db.users.push(user);

      return {
        insertId:
          user.user_id,
      };
    }

    if (
      normalizedSql.startsWith(
        "SELECT customer_id, customer_id AS id"
      )
    ) {
      const customer =
        db.customers.find(
          (item) =>
            item.customer_id ===
            Number(params[0])
        );

      return customer
        ? [customerView(customer)]
        : [];
    }

    throw new Error(
      `Unexpected master test query: ${sql}`
    );
  };

  db.transaction =
    async (callback) => {
      const usersSnapshot =
        db.users.map(
          (item) => ({
            ...item,
          })
        );

      const customersSnapshot =
        db.customers.map(
          (item) => ({
            ...item,
          })
        );

      const nextCustomerIdSnapshot =
        db.nextCustomerId;

const connection = {
  execute: async (
    sql,
    params = []
  ) => {
    const normalizedSql = String(sql || "")
      .replace(/\s+/g, " ")
      .trim();

    if (
      normalizedSql.includes(
        "SELECT customer_id FROM CUSTOMER_MASTER"
      ) &&
      normalizedSql.includes(
        "LOWER(TRIM(customer_name)) = LOWER(TRIM(?))"
      )
    ) {
      const name = String(params[0] || "")
        .trim()
        .toLowerCase();

      const existing = db.customers.find(
        (customer) =>
          String(customer.customer_name || "")
            .trim()
            .toLowerCase() === name
      );

      return existing
        ? [[{ customer_id: existing.customer_id }]]
        : [[]];
    }
         

 

          // ==========================================
          // LOAD / CHECK PENDING CUSTOMER USER
          // ==========================================

          if (
            normalizedSql.includes(
              "SELECT u.user_id, u.customer_id, u.status, r.role_name"
            )
          ) {
            const user =
              db.users.find(
                (item) =>
                  item.user_id ===
                  Number(params[0])
              );

            if (!user) {
              return [[]];
            }

            const role =
              db.roles.find(
                (item) =>
                  item.role_id ===
                  user.role_id
              );

            return [
              [
                {
                  user_id:
                    user.user_id,

                  customer_id:
                    user.customer_id,

                  status:
                    user.status
                      ? 1
                      : 0,

                  role_name:
                    role?.role_name,
                },
              ],
            ];
          }

          // ==========================================
          // INSERT CUSTOMER
          // ==========================================

          if (
            normalizedSql.startsWith(
              "INSERT INTO CUSTOMER_MASTER"
            )
          ) {
            let customer_name;
            let description;
            let folder_path = null;
            let status;

            if (
              normalizedSql.includes(
                "folder_path"
              )
            ) {
              [
                customer_name,
                description,
                folder_path,
                status,
              ] = params;
            } else {
              [
                customer_name,
                description,
                status,
              ] = params;
            }

            const customer = {
              customer_id:
                db.nextCustomerId++,

              customer_name,

              description,

              folder_path,

              status:
                Boolean(status),

              created_at:
                new Date()
                  .toISOString(),
            };

            db.customers.push(
              customer
            );

            return [
              {
                insertId:
                  customer.customer_id,
              },
            ];
          }

          // ==========================================
          // LINK CUSTOMER USER + ACTIVATE
          // ==========================================

          if (
            normalizedSql.startsWith(
              "UPDATE USERS SET customer_id = ?, status = 1"
            )
          ) {
            const newCustomerId =
              Number(params[0]);

            const userId =
              Number(params[1]);

            const user =
              db.users.find(
                (item) =>
                  item.user_id ===
                  userId
              );

            if (!user) {
              throw new Error(
                "User disappeared during transaction"
              );
            }

            if (
              user.customer_id !== null ||
              user.status !== false
            ) {
              return [
                {
                  affectedRows: 0,
                },
              ];
            }

            user.customer_id =
              newCustomerId;

            user.status =
              true;

            return [
              {
                affectedRows: 1,
              },
            ];
          }

          throw new Error(
            `Unexpected transaction query: ${sql}`
          );
        },
      };

      try {
        return await callback(
          connection
        );
      } catch (error) {
        db.users =
          usersSnapshot;

        db.customers =
          customersSnapshot;

        db.nextCustomerId =
          nextCustomerIdSnapshot;

        throw error;
      }
    };

  return db;
}

function createAuthDb(user) {
  const db = {
    user,
  };

  db.query = async (
    sql,
    params = []
  ) => {
    const normalizedSql =
      normalizeSql(sql);

    if (
      normalizedSql.includes(
        "WHERE u.username = ?"
      )
    ) {
      return db.user.username ===
        params[0]
        ? [
            {
              user_id:
                db.user.user_id,

              username:
                db.user.username,

              password:
                db.user.password,

              role_id:
                db.user.role_id,

              customer_id:
                db.user.customer_id,

              status:
                db.user.status,

              role_name:
                db.user.role_name,

              customer_name:
                db.user
                  .customer_name ||
                null,
            },
          ]
        : [];
    }

    if (
      normalizedSql.startsWith(
        "SELECT password, status FROM USERS"
      )
    ) {
      return [
        {
          password:
            db.user.password,

          status:
            db.user.status,
        },
      ];
    }

    if (
      normalizedSql.includes(
        "SELECT u.user_id, r.role_name"
      )
    ) {
      return [
        {
          user_id:
            db.user.user_id,

          role_name:
            db.user.role_name,
        },
      ];
    }

    if (
      normalizedSql.startsWith(
        "UPDATE USERS SET password = ?"
      )
    ) {
      db.user.password =
        params[0];

      return [
        {
          affectedRows: 1,
        },
      ];
    }

    throw new Error(
      `Unexpected auth test query: ${sql}`
    );
  };

  return db;
}

const tests = [];

function test(name, fn) {
  tests.push({
    name,
    fn,
  });
}

test(
  "creates a pending Customer User with a bcrypt hash and no customer",
  async () => {
    const db =
      createMasterDb();

    const service =
      loadServiceWithDb(
        "../services/masterService",
        db
      );

    const result =
      await service.createUser({
        username:
          "hdfc_user",

        password:
          "Hdfc@2026!",

        role:
          "Customer User",
      });

    assert.equal(
      result.customer_id,
      null
    );

    assert.equal(
      result.status,
      "Pending Customer Setup"
    );

    assert.equal(
      await bcrypt.compare(
        "Hdfc@2026!",
        db.users[0].password
      ),
      true
    );

    assert.notEqual(
      db.users[0].password,
      "Hdfc@2026!"
    );

    assert.equal(
      Object.prototype.hasOwnProperty.call(
        result,
        "password"
      ),
      false
    );
  }
);

test(
  "rejects duplicate usernames safely",
  async () => {
    const db =
      createMasterDb();

    const service =
      loadServiceWithDb(
        "../services/masterService",
        db
      );

    await service.createUser({
      username:
        "duplicate",

      password:
        "Password!1",

      role:
        "Customer User",
    });

    await assert.rejects(
      () =>
        service.createUser({
          username:
            "duplicate",

          password:
            "Password!2",

          role:
            "Customer User",
        }),

      (error) =>
        error.status === 409 &&
        error.code ===
          "USERNAME_EXISTS" &&
        error.message ===
          "Username already exists."
    );
  }
);

test(
  "links and activates a pending user transactionally",
  async () => {
    const db =
      createMasterDb();

    const service =
      loadServiceWithDb(
        "../services/masterService",
        db
      );

    const pending =
      await service.createUser({
        username:
          "hdfc_user",

        password:
          "Hdfc@2026!",

        role:
          "Customer User",
      });

    const customer =
      await service.createCustomer({
        customer_name:
          "HDFC Bank",

        description:
          "Test customer",

        folder_path:
          "D:\\Retention\\HDFC Bank",

        status:
          true,

        login_user_id:
          pending.user_id,
      });

    assert.equal(
      customer.customer_name,
      "HDFC Bank"
    );

    assert.equal(
      db.users[0].customer_id,
      customer.customer_id
    );

    assert.equal(
      db.users[0].status,
      true
    );

    const active =
      await service.getUser(
        pending.user_id
      );

    assert.equal(
      active.status,
      "Active"
    );
  }
);

test(
  "does not replace an existing password when the edit field is blank",
  async () => {
    const db =
      createMasterDb();

    const service =
      loadServiceWithDb(
        "../services/masterService",
        db
      );

    const created =
      await service.createUser({
        username:
          "existing",

        password:
          "Original!1",

        role:
          "Admin",
      });

    const originalHash =
      db.users[0].password;

    await service.updateUser(
      created.user_id,
      {
        username:
          "existing-renamed",

        password:
          "",
      }
    );

    assert.equal(
      db.users[0].password,
      originalHash
    );
  }
);

test(
  "blocks pending login and permits active login",
  async () => {
    const pendingDb =
      createAuthDb({
        user_id: 1,

        username:
          "pending",

        password:
          await bcrypt.hash(
            "Password!1",
            12
          ),

        role_id: 2,

        customer_id:
          null,

        status:
          false,

        role_name:
          "Customer User",
      });

    const pendingAuth =
      loadServiceWithDb(
        "../services/systemServices",
        pendingDb
      );

    await assert.rejects(
      () =>
        pendingAuth.login(
          "pending",
          "Password!1"
        ),

      (error) =>
        error.status === 403 &&
        error.code ===
          "CUSTOMER_ASSIGNMENT_REQUIRED"
    );

    const activeDb =
      createAuthDb({
        user_id: 2,

        username:
          "hdfc_user",

        password:
          await bcrypt.hash(
            "Password!1",
            12
          ),

        role_id: 2,

        customer_id:
          7,

        status:
          true,

        role_name:
          "Customer User",

        customer_name:
          "HDFC Bank",
      });

    const activeAuth =
      loadServiceWithDb(
        "../services/systemServices",
        activeDb
      );

    const result =
      await activeAuth.login(
        "hdfc_user",
        "Password!1"
      );

    assert.ok(
      result.token
    );

    assert.equal(
      result.user.customer_id,
      7
    );

    assert.equal(
      Object.prototype.hasOwnProperty.call(
        result.user,
        "password"
      ),
      false
    );
  }
);

test(
  "changes passwords privately and rejects incorrect or mismatched values",
  async () => {
    const db =
      createAuthDb({
        user_id: 3,

        username:
          "hdfc_user",

        password:
          await bcrypt.hash(
            "OldPass!1",
            12
          ),

        role_id: 2,

        customer_id:
          7,

        status:
          true,

        role_name:
          "Customer User",
      });

    const auth =
      loadServiceWithDb(
        "../services/systemServices",
        db
      );

    const before =
      db.user.password;

    const success =
      await auth.changePassword(
        3,
        {
          current_password:
            "OldPass!1",

          new_password:
            "NewPass!2",

          confirm_password:
            "NewPass!2",
        }
      );

    assert.equal(
      success.message,
      "Password changed successfully."
    );

    assert.notEqual(
      db.user.password,
      before
    );

    assert.equal(
      await bcrypt.compare(
        "OldPass!1",
        db.user.password
      ),
      false
    );

    assert.equal(
      await bcrypt.compare(
        "NewPass!2",
        db.user.password
      ),
      true
    );

    await assert.rejects(
      () =>
        auth.changePassword(
          3,
          {
            current_password:
              "wrong",

            new_password:
              "Another!3",

            confirm_password:
              "Another!3",
          }
        ),

      (error) =>
        error.code ===
          "CURRENT_PASSWORD_INVALID"
    );

    await assert.rejects(
      () =>
        auth.changePassword(
          3,
          {
            current_password:
              "NewPass!2",

            new_password:
              "Another!3",

            confirm_password:
              "Mismatch!4",
          }
        ),

      (error) =>
        error.code ===
          "PASSWORD_MISMATCH"
    );
  }
);

test(
  "Admin reset replaces the hash without revealing the old password",
  async () => {
    const db =
      createAuthDb({
        user_id: 4,

        username:
          "hdfc_user",

        password:
          await bcrypt.hash(
            "OldPass!1",
            12
          ),

        role_id: 2,

        customer_id:
          7,

        status:
          true,

        role_name:
          "Customer User",
      });

    const auth =
      loadServiceWithDb(
        "../services/systemServices",
        db
      );

    const result =
      await auth.resetPassword(
        4,
        {
          new_password:
            "ResetPass!2",
        }
      );

    assert.equal(
      result.message,
      "Temporary password reset successfully."
    );

    assert.equal(
      await bcrypt.compare(
        "OldPass!1",
        db.user.password
      ),
      false
    );

    assert.equal(
      await bcrypt.compare(
        "ResetPass!2",
        db.user.password
      ),
      true
    );

    assert.equal(
      Object.prototype.hasOwnProperty.call(
        result,
        "password"
      ),
      false
    );

    assert.equal(
      Object.prototype.hasOwnProperty.call(
        result,
        "hash"
      ),
      false
    );
  }
);

test(
  "fixed role mutations are rejected",
  async () => {
    const db =
      createMasterDb();

    const service =
      loadServiceWithDb(
        "../services/masterService",
        db
      );

    assert.throws(
      () =>
        service.createRole({
          role_name:
            "Other",
        }),

      (error) =>
        error.status === 405 &&
        error.code ===
          "FIXED_ROLES"
    );

    assert.throws(
      () =>
        service.updateRole(
          1,
          {
            role_name:
              "Renamed",
          }
        ),

      (error) =>
        error.status === 405 &&
        error.code ===
          "FIXED_ROLES"
    );

    assert.throws(
      () =>
        service.deleteRole(
          1
        ),

      (error) =>
        error.status === 405 &&
        error.code ===
          "FIXED_ROLES"
    );
  }
);

(async () => {
  let passed = 0;

  for (const item of tests) {
    try {
      await item.fn();

      passed += 1;

      console.log(
        `PASS ${item.name}`
      );
    } catch (error) {
      console.error(
        `FAIL ${item.name}`
      );

      console.error(
        error.stack ||
        error.message
      );

      process.exitCode = 1;

      return;
    }
  }

  console.log(
    `Passed ${passed}/${tests.length} user-management tests.`
  );
})();

module.exports = {
  createMasterDb,
  createAuthDb,
};