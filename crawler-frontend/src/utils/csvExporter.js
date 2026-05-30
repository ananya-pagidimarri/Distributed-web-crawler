/**
 * Converts an array of objects to a CSV string and triggers a browser download
 * @param {Array} data - Array of JSON objects
 * @param {String} filename - Name of the downloaded CSV file
 */
export const downloadCSV = (data, filename) => {
  if (!data || !data.length) return;

  // Extract headers
  const headers = Object.keys(data[0]);

  // Build CSV string
  const csvRows = [];
  csvRows.push(headers.join(','));

  for (const row of data) {
    const values = headers.map(header => {
      const escaped = ('' + row[header]).replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  
  // Trigger download
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
