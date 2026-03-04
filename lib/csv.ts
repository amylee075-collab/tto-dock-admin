/**
 * CSV 파싱 (RFC 4180 스타일)
 * - UTF-8 BOM 제거
 * - 헤더 첫 줄로 컬럼명 매핑
 * - 쌍따옴표로 감싼 필드 내 쉼표/줄바꿈 허용
 */

const SEP = ",";

function stripBom(text: string): string {
  if (text.charCodeAt(0) === 0xfeff) return text.slice(1);
  return text;
}

function parseLine(line: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      let s = "";
      i += 1;
      while (i < line.length) {
        if (line[i] === '"') {
          if (line[i + 1] === '"') {
            s += '"';
            i += 2;
          } else {
            i += 1;
            break;
          }
        } else {
          s += line[i];
          i += 1;
        }
      }
      out.push(s);
    } else {
      let s = "";
      while (i < line.length && line[i] !== SEP) {
        s += line[i];
        i += 1;
      }
      out.push(s.trim());
      if (line[i] === SEP) i += 1;
    }
  }
  return out;
}

/** CSV 텍스트를 파싱해 첫 줄을 헤더로 사용하고, Record<string,string>[] 반환 */
export function parseCsvToObjects(csvText: string): Record<string, string>[] {
  const raw = stripBom(csvText).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];
  const header = parseLine(lines[0]);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const row: Record<string, string> = {};
    header.forEach((key, j) => {
      row[key.trim()] = values[j] ?? "";
    });
    rows.push(row);
  }
  return rows;
}
