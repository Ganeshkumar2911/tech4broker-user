export function paginate(items, page, perPage) {
  const start = (page - 1) * perPage;
  const end = start + perPage;
  const data = items.slice(start, end);
  const total = items.length;
  const total_pages = Math.ceil(total / perPage);

  return {
    data,
    pagination: {
      page,
      per_page: perPage,
      total_items: total,
      total_pages
    },
    // Top-level fields for notifications store
    current_page: page,
    pages: total_pages,
    per_page: perPage,
    total: total
  };
}
