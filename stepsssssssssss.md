**1.open PowerShell as Administrator and run:**



Get-ChildItem "D:\\Retention" -Force |

Remove-Item -Recurse -Force



**2.Then verify:**



Get-ChildItem "D:\\Retention" -Force



**3.Clean the database for the final demonstration**



USE FileRetentionSystemSecure2Shu;



**remove all customers, customer users, jobs and test logs.**



SET SQL\_SAFE\_UPDATES = 0;



DELETE FROM JOB\_STATUS\_HISTORY;

DELETE FROM DELETE\_LOGS;

DELETE FROM ERROR\_LOGS;

DELETE FROM SCHEDULER\_LOGS;



DELETE FROM JOB\_MASTER;



DELETE FROM USERS

WHERE username <> 'admin1';



DELETE FROM CUSTOMER\_MASTER;



SET SQL\_SAFE\_UPDATES = 1;



**Now verify:**

SELECT user\_id, username, role\_id, customer\_id, status

FROM USERS;

SELECT \* FROM ROLES;

SELECT \* FROM CUSTOMER\_MASTER;

SELECT \* FROM JOB\_MASTER;

SELECT \* FROM DELETE\_LOGS;

SELECT \* FROM ERROR\_LOGS;

SELECT \* FROM SCHEDULER\_LOGS;

SELECT \* FROM JOB\_STATUS\_HISTORY;



**4.Start the actual project**

**BACKEND**
cd "C:\\Users\\HP\\Desktop\\shubhangi code 2\\FileRetentionSystem-FINAL\\backend"

npm start

**what doe this means-"The Node.js/Express backend handles authentication, authorization, CRUD operations, reports and communication with MySQL."**



**FRONTEND**

cd "C:\\Users\\HP\\Desktop\\shubhangi code 2\\FileRetentionSystem-FINAL\\frontend"

npm run dev

**what does this mean-"The React frontend is the interface used by the Admin and Customer Users. It does not directly delete files."**



**5.Start your demonstration as Admin**

Username: admin1

Password: Admin1234
**what does this mean-"Admin has system-level access. Admin can configure customers, users and retention jobs and can view system-wide reports and logs."**



**6.Show Role Management**

**Role Management**

It should show:

Admin

Customer User
what does it mean-Explain:



"The system uses Role-Based Access Control. The roles are fixed system roles. Admin manages the system, while Customer Users are restricted to their own customer data."



**Also mention:**



"Role Management is display-only so nobody can rename or delete the Admin or Customer User roles and accidentally break authorization."



**7.Create the first customer login in User Management**

User Management → Add User

Create: Username: hdfc\_user

&#x20;       Temporary Password: Hdfc@2026!
**Result-**

hdfc\_user

Customer User

Customer: Not assigned

Status: Pending Customer Setup



**what does it mean**-"For the first login of a new client, Admin creates the account first. The password is not stored as plaintext. The backend hashes it using bcrypt."

"Because this user is not connected to a customer yet, the account remains in Pending Customer Setup."

**database has**

username = hdfc\_user

password = bcrypt hash

role = Customer User

customer\_id = NULL

status = 0



**8.Demonstrate that pending login is blocked**

**Logout and try:**

hdfc\_user

Hdfc@2026!

**result**-Customer setup is not complete.

"A Customer User cannot access the application until Admin links that account to a real customer. This prevents a customer-scoped account from getting a JWT without a valid customer."



&#x20;**LOGIN AS ADMIN**





**9.I. Create HDFC in Customer Master**



Go to:Customer Master → Add Customer

**The dropdown should show:**

hdfc\_user



**Enter:**

Registered Customer User: hdfc\_user

Customer Name: HDFC Bank

Description: Bank document retention

Status: Active



**10.now u want to delete customer HDFC**
For the demo to sir, Disable is the better feature. You can explain:



"Customers are not hard-deleted once they have jobs or audit history. Instead, Admin disables the customer so historical retention records remain intact."

U CAN DISABLE THEN U CAN UPDTAE AND STATUS DO ACTIVE



**11.Create the HDFC physical folder**

**Now create the customer folder.**

**PowerShell:**

New-Item -ItemType Directory -Force -Path "D:\\Retention\\HDFC Bank"



**Explain:**

"This represents the actual file-server folder belonging to the customer."



**12.K. Create two Job Master policies**

**Go to Job Master.**

**XML job**

Customer: HDFC Bank

Project: HDFC XML Retention

Folder Path: D:\\Retention\\HDFC Bank

File Type: XML

Retention Hours: 24

Status: Active

Exclude Folder: No



**PDF job**

Customer: HDFC Bank

Project: HDFC PDF Retention

Folder Path: D:\\Retention\\HDFC Bank

File Type: PDF

Retention Hours: 72

Status: Active

Exclude Folder: No



Explain:



"Retention is configured at the job level. Different file types belonging to the same customer can have different retention periods."



**L. Create realistic test files**

"New XML document" |

Out-File "D:\\Retention\\HDFC Bank\\new\_document.xml"



"Old XML document" |

Out-File "D:\\Retention\\HDFC Bank\\old\_document.xml"



"New PDF document" |

Out-File "D:\\Retention\\HDFC Bank\\new\_loan.pdf"



"Old PDF document" |

Out-File "D:\\Retention\\HDFC Bank\\old\_loan.pdf"



**Now make the XML older than 24 hours:**

(Get-Item "D:\\Retention\\HDFC Bank\\old\_document.xml").LastWriteTime =

(Get-Date).AddHours(-48)



**Make the PDF older than 72 hours:**

(Get-Item "D:\\Retention\\HDFC Bank\\old\_loan.pdf").LastWriteTime =

(Get-Date).AddHours(-96)



**Check:**

Get-ChildItem "D:\\Retention\\HDFC Bank" |

Select-Object Name, LastWriteTime



**Explain:**



"For demonstration purposes I manually changed the timestamps so I don't have to wait 24 or 72 hours."



**The intended state is:**

new\_document.xml → new

old\_document.xml → about 48 hours old



new\_loan.pdf → new

old\_loan.pdf → about 96 hours old



**N. Test the .exe database connection**

cd "C:\\Users\\HP\\Desktop\\mtl\_final\\FileRetentionSystem-FINAL\\console-app\\publish"



**RUN:**

.\\FileRetentionConsole.exe --check-db

explain:"

\--check-db verifies that the C# worker can communicate with the same MySQL database used by the application."

**O. Run a safe Dry Run**

**Run:**

.\\FileRetentionConsole.exe --dry-run

**Expected decisions:**

new\_document.xml → KEEP

old\_document.xml → DELETE



new\_loan.pdf → KEEP

old\_loan.pdf → DELETE



but:Files Deleted = 0

"Dry Run executes the entire decision logic but does not physically delete anything. It is a safety feature used before enabling destructive retention."



**P. Run the REAL retention process**

**Once the Dry Run looks correct:**



.\\FileRetentionConsole.exe



old\_document.xml → deleted

old\_loan.pdf → deleted



new\_document.xml → retained

new\_loan.pdf → retained



**SCHEDULER SUMMARY**

**Status          : Dry Run**

**Jobs Processed  : 2**

**Files Scanned   : 4**

**Files Retained  : 2**

**Files Deleted   : 0**

**Errors          : 0**



**--------------------------------------------**

**Q. Prove the files were physically deleted**



**run:**

Get-ChildItem "D:\\Retention\\HDFC Bank" |

Select-Object Name, LastWriteTime



only:

new\_document.xml

new\_loan.pdf



Explain:

"This proves the worker did not merely update the database. It actually removed the expired files from the filesystem."

**R. Show Delete Logs**

**Open:**

Delete Logs



old\_document.xml

HDFC Bank

XML

24 hrs

Success



old\_loan.pdf

HDFC Bank

PDF

72 hrs

Success



**S. Show Scheduler Logs**

**Open:**

Scheduler Logs

You should see





**V. Demonstrate Customer User login**



**Logout Admin.**



**Login:**



hdfc\_user

Hdfc@2026!



**Explain:**



"After customer assignment, the Customer User receives a normal JWT containing their role/customer context."





**W. Demonstrate Change Password**



As HDFC User open:

Change Password

Enter:



Current Password: Hdfc@2026!

New Password:hdfc@2026!

Confirm password:hdfc@2026!



**X. Demonstrate Admin Reset Password**



Login again as Admin.

Go to User Management and use:



current password:Admin@2026!

new password:admin@2026!





Explain:



"If the customer forgets their password, Admin does not recover the existing password. Admin only replaces it with a new temporary password."



That's an important security distinction.



**Z. Create a second customer to prove isolation**

username: sbi\_user

password:sbi2026!



"Customer isolation is enforced in the backend using the authenticated customer's customer\_id. It is not merely hidden in the frontend."



"My project is a multi-customer File Retention System. The Admin creates customer login accounts, links them to customers and configures retention jobs. Each job specifies the customer folder, file type and retention period."



"The C# worker is the actual retention executor. Windows Task Scheduler runs it every hour. It connects to MySQL, reads active jobs, scans the configured folder, filters the correct file type and compares each file's LastWriteTime against its retention period."



"Files still within retention are kept. Expired files are physically deleted. Every run is audited through Delete Logs, Error Logs and Scheduler Logs, and the results are visible in Dashboard and Reports."



"Customer Users are isolated by customer ID, so HDFC cannot access SBI's information. Passwords are hashed with bcrypt. Customers can change their own password, and Admin can only reset a forgotten password rather than viewing it."



**FEATURES!!!!!!!!!!!!!**

**Customer has jobs and cannot be deleted. Disable the customer instead.**

"Customers with existing retention jobs or audit history are not hard-deleted because that would break historical references. Instead, they are disabled so the system preserves audit integrity."



**job master**
For your project, a Job that has already processed files should ideally not be physically deleted. It should be retired/disabled, because Delete Logs, Error Logs and Job History may still reference its job\_id.

