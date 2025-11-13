export async function downloadCsv(url: string, params: Record<string, any> = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
  });
  const token = localStorage.getItem('token');
  const fullUrl = query.toString() ? `${url}?${query.toString()}` : url;
  const res = await fetch(fullUrl, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : ''
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Error ${res.status}`);
  }
  const blob = await res.blob();
  const cd = res.headers.get('Content-Disposition');
  const fallbackName = 'export.csv';
  const filename = cd && /filename="?([^";]+)"?/i.exec(cd)?.[1] ? RegExp.$1 : fallbackName;
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
