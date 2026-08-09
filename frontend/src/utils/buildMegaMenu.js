export default function buildMegaMenu(children = [], columns = 3) {
  if (!children.length) return [];

  const result = [];

  const perColumn = Math.ceil(children.length / columns);

  for (let i = 0; i < columns; i++) {
    result.push(
      children.slice(
        i * perColumn,
        (i + 1) * perColumn
      )
    );
  }

  return result;
}