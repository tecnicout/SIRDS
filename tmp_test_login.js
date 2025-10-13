(async () => {
  try {
    const fetch = globalThis.fetch || (await import('node-fetch')).default;
  const loginRes = await fetch('http://127.0.0.1:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'murcia21.gmz@gmail.com', password: 'murcia21' })
    });
    const loginText = await loginRes.text();
    console.log('LOGIN STATUS', loginRes.status);
    try { console.log('LOGIN BODY', JSON.parse(loginText)); } catch { console.log('LOGIN BODY', loginText); }

    if (loginRes.ok) {
      const loginJson = JSON.parse(loginText);
      const token = loginJson.data && loginJson.data.token;
      if (!token) return console.log('No token in response');
  const meRes = await fetch('http://127.0.0.1:3001/api/auth/me', {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const meText = await meRes.text();
      console.log('ME STATUS', meRes.status);
      try { console.log('ME BODY', JSON.parse(meText)); } catch { console.log('ME BODY', meText); }
    }
  } catch (err) {
    console.error('ERROR', err);
  }
})();
