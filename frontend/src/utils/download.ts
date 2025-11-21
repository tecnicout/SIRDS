import { getToken } from './tokenStorage';

export async function downloadFile(url: string, params: Record<string, any> = {}, fallbackName = 'reporte.dat') {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
  });
  const token = getToken();
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
  const filename = cd && /filename="?([^";]+)"?/i.exec(cd)?.[1] ? RegExp.$1 : fallbackName;
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
