const reportsData = [
  {
    report_id: 1,
    customer_name: "HDFC",
    project_name: "HDFC Aadhaar Printing",
    file_type: "XML",
    files_processed: 25,
    files_deleted: 18,
    errors: 1,
    status: "Completed",
  },
  {
    report_id: 2,
    customer_name: "HDFC",
    project_name: "HDFC Loan Documents",
    file_type: "PDF",
    files_processed: 20,
    files_deleted: 15,
    errors: 0,
    status: "Completed",
  },
  {
    report_id: 3,
    customer_name: "SBI",
    project_name: "SBI Statements",
    file_type: "XML",
    files_processed: 22,
    files_deleted: 17,
    errors: 2,
    status: "Completed with Errors",
  },
  {
    report_id: 4,
    customer_name: "ICICI",
    project_name: "ICICI Reports",
    file_type: "PDF",
    files_processed: 10,
    files_deleted: 0,
    errors: 0,
    status: "Inactive",
  },
];

export default reportsData;