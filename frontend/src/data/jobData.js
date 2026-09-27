const jobData = [
  {
    job_id: 1,
    customer_name: "HDFC",
    project_name: "HDFC Aadhaar Printing",
    folder_path: "D:/Retention/HDFC/XML",
    file_type: "XML",
    retention_hours: 24,
    is_enabled: true,
    disable_reason: "",
    exclude_folder: false,
  },
  {
    job_id: 2,
    customer_name: "SBI",
    project_name: "SBI Statements",
    folder_path: "D:/Retention/SBI/XML",
    file_type: "XML",
    retention_hours: 48,
    is_enabled: true,
    disable_reason: "",
    exclude_folder: false,
  },
  {
    job_id: 3,
    customer_name: "ICICI",
    project_name: "ICICI Reports",
    folder_path: "D:/Retention/ICICI/PDF",
    file_type: "PDF",
    retention_hours: 120,
    is_enabled: false,
    disable_reason: "Maintenance",
    exclude_folder: true,
  },
];

export default jobData;