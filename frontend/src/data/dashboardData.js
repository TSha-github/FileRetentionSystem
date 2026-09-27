const dashboardStats = {
  customers: 4,
  activeJobs: 3,
  deletedFiles: 120,
  errorLogs: 2,
  schedulerRuns: 15,
  users: 2,
};

const recentDeleteLogs = [
  ["customer1.xml", "HDFC", "Deleted"],
  ["loan.pdf", "SBI", "Deleted"],
  ["report.xml", "ICICI", "Deleted"],
];

const recentErrorLogs = [
  ["statement.xml", "File Locked"],
  ["loan.pdf", "Access Denied"],
  ["customer.xml", "Permission Error"],
];

export { dashboardStats, recentDeleteLogs, recentErrorLogs };