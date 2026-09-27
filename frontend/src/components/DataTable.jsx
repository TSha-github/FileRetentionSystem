import "../styles/table.css";

function DataTable({ title, headers, data }) {
  return (
    <div className="table-card">
      <h2>{title}</h2>

      <table>
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index}>{header}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data && data.length > 0 ? (
            data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {headers.map((header, cellIndex) => (
                  <td key={cellIndex}>
                    {row[header] ?? "-"}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={headers.length}>
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;