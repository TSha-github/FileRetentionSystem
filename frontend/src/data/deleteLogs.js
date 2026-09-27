const deleteLogs = [
  {
    delete_log_id: 1,
    customer_name: "HDFC",
    project_name: "Aadhaar Printing",
    file_name: "cust001.xml",
    file_type: "XML",
    deleted_at: "2026-07-06 08:30",
    retention_hours: 24,
    status: "Success",
  },
  {
    delete_log_id: 2,
    customer_name: "SBI",
    project_name: "Statements",
    file_name: "statement20.xml",
    file_type: "XML",
    deleted_at: "2026-07-06 09:30",
    retention_hours: 48,
    status: "Success",
  },
  {
    delete_log_id: 3,
    customer_name: "ICICI",
    project_name: "Reports",
    file_name: "report01.pdf",
    file_type: "PDF",
    deleted_at: "2026-07-08 11:20",
    retention_hours: 72,
    status: "Failed",
  },
];

export default deleteLogs;