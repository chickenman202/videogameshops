/** Read a CSV file, including quotes and line breaks inside a cell. */
export function parseCsv(text: string): Record<string, string>[] {
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const table: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      table.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    table.push(row);
  }

  const header = table.shift() ?? [];
  return table
    .filter((cells) => cells.some((cell) => cell.trim()))
    .map((cells) => {
      const record: Record<string, string> = {};
      header.forEach((name, index) => {
        record[name] = cells[index] ?? "";
      });
      return record;
    });
}
