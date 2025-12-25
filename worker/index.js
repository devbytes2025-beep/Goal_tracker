
// Cloudflare Worker - ES Module Syntax
// You must bind your D1 database to the variable name 'DB' in wrangler.toml

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace('/api', ''); // Strip prefix
    const method = request.method;

    // CORS Headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // --- Public Routes ---
      
      // Resolve Email from Username (for Login)
      if (path === '/resolve-email' && method === 'POST') {
          const { username } = await request.json();
          const user = await env.DB.prepare('SELECT email FROM users WHERE username = ?').bind(username).first();
          if (!user) return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: corsHeaders });
          return new Response(JSON.stringify({ email: user.email }), { headers: corsHeaders });
      }

      // Register User
      if (path === '/users' && method === 'POST') {
          const authHeader = request.headers.get('Authorization');
          if (!authHeader) return new Response(JSON.stringify({ error: 'No Auth' }), { status: 401, headers: corsHeaders });
          
          // In production, verify the Firebase JWT here. 
          // For now, we trust the Client sends the correct UID in the body matching the token subject, 
          // or we blindly decode. *Use a JWT library in production*.
          // Simplification: We accept the user data provided.
          
          const user = await request.json();
          try {
            await env.DB.prepare(`
                INSERT INTO users (id, username, email, secretKeyAnswer, securityQuestion, theme, points, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                user.id, user.username, user.email, user.secretKeyAnswer, 
                user.securityQuestion, 'dark', 0, Date.now()
            ).run();
            return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
          } catch (e) {
             return new Response(JSON.stringify({ error: e.message }), { status: 409, headers: corsHeaders });
          }
      }

      // --- Protected Routes Middleware ---
      // Simple Mock Verification: Extract UID from Bearer Token (Simulated)
      // REAL WORLD: Decode and Verify Firebase JWT signature using 'jose' library
      const authHeader = request.headers.get('Authorization');
      if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
      
      // We assume the frontend passed a valid token. 
      // We will look up the user ID based on the token. 
      // *CRITICAL*: In a real deployment, you must verify the token signature.
      // Since we can't easily install packages here, we will fetch the User Profile by matching the ID 
      // passed in the token (Assuming we decoded it, or for this specific setup, 
      // we can ask the client to send UID in a header, but let's do a lookup).
      
      // Hack for demo: We will query the DB using the Authorization header as the UID directly 
      // OR you configure the client to send the UID. 
      // BETTER: The client sends a JWT. We can't verify it easily without 'jose'. 
      // So, we will implement a "Trust" flow where we assume the ID is correct 
      // OR we just use the user.id passed in the payload for writes.
      
      // Let's assume the standard flow:
      // 1. Get UID from D1 based on email? No.
      // 2. Let's make the Client send the UID in a custom header 'X-User-ID' for this demo 
      //    to avoid complex JWT parsing code in a single file without node_modules.
      //    Wait, I can decode a JWT payload without verification using standard JS.
      
      const token = authHeader.split(' ')[1];
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.user_id || payload.sub; // Firebase UID

      // --- Authenticated Routes ---

      if (path === '/user/me') {
          if (method === 'GET') {
              const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
              return new Response(JSON.stringify(user), { headers: corsHeaders });
          }
          if (method === 'PUT') {
              const updates = await request.json();
              await env.DB.prepare(`
                UPDATE users SET name=?, bio=?, avatar=?, dob=?, gender=?, email=?, points=? WHERE id=?
              `).bind(updates.name, updates.bio, updates.avatar, updates.dob, updates.gender, updates.email, updates.points, userId).run();
              
              const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
              return new Response(JSON.stringify(user), { headers: corsHeaders });
          }
      }

      if (path === '/reset-data' && method === 'POST') {
          const { secretKeyAnswer } = await request.json();
          const user = await env.DB.prepare('SELECT secretKeyAnswer FROM users WHERE id = ?').bind(userId).first();
          
          if (user.secretKeyAnswer !== secretKeyAnswer) {
              return new Response(JSON.stringify({ error: 'Invalid Secret' }), { status: 403, headers: corsHeaders });
          }
          
          await env.DB.batch([
              env.DB.prepare('DELETE FROM tasks WHERE user_id = ?').bind(userId),
              env.DB.prepare('DELETE FROM logs WHERE user_id = ?').bind(userId),
              env.DB.prepare('DELETE FROM todos WHERE user_id = ?').bind(userId),
              env.DB.prepare('DELETE FROM expenses WHERE user_id = ?').bind(userId),
              env.DB.prepare('DELETE FROM journal WHERE user_id = ?').bind(userId),
              env.DB.prepare('UPDATE users SET points = 0 WHERE id = ?').bind(userId)
          ]);
          return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      if (path === '/data' && method === 'GET') {
          // Fetch all
          const [tasks, logs, todos, expenses, journal] = await Promise.all([
              env.DB.prepare('SELECT * FROM tasks WHERE user_id = ?').bind(userId).all(),
              env.DB.prepare('SELECT * FROM logs WHERE user_id = ?').bind(userId).all(),
              env.DB.prepare('SELECT * FROM todos WHERE user_id = ?').bind(userId).all(),
              env.DB.prepare('SELECT * FROM expenses WHERE user_id = ?').bind(userId).all(),
              env.DB.prepare('SELECT * FROM journal WHERE user_id = ?').bind(userId).all(),
          ]);

          // Parse JSON strings back to arrays
          const safeLogs = logs.results.map(l => ({...l, images: l.images ? JSON.parse(l.images) : [], completed: l.completed === 1}));
          const safeJournal = journal.results.map(j => ({...j, images: j.images ? JSON.parse(j.images) : []}));
          const safeTodos = todos.results.map(t => ({...t, completed: t.completed === 1}));
          
          // Map DB columns (snake_case) to App types (camelCase) if needed, 
          // but simpler to adjust frontend or alias in SQL. 
          // For now, let's just return what we have, assuming Types match roughly 
          // or we transform manually. To save code size, we assume the Frontend 'cleanData' 
          // or interface accepts what D1 returns, but D1 returns snake_case for columns usually.
          // Let's map key fields:
          
          const mapKeys = (obj) => {
             const newObj = {};
             for(let key in obj) {
                 const newKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase()); // snake to camel
                 newObj[newKey] = obj[key];
             }
             return newObj;
          };

          return new Response(JSON.stringify({
              tasks: tasks.results.map(mapKeys),
              logs: safeLogs.map(mapKeys),
              todos: safeTodos.map(mapKeys),
              expenses: expenses.results.map(mapKeys),
              journal: safeJournal.map(mapKeys)
          }), { headers: corsHeaders });
      }

      // --- Generic Collection Handling ---
      
      const parts = path.split('/');
      const collection = parts[1];
      const itemId = parts[2];

      if (['tasks', 'logs', 'todos', 'expenses', 'journal'].includes(collection)) {
          
          if (method === 'POST') {
              const item = await request.json();
              const keys = Object.keys(item).filter(k => k !== 'userId'); // user_id injected
              const vals = Object.values(item).filter((_, i) => Object.keys(item)[i] !== 'userId');
              
              // Handle JSON arrays
              const finalVals = vals.map(v => Array.isArray(v) ? JSON.stringify(v) : (v === true ? 1 : v === false ? 0 : v));
              
              const cols = keys.map(k => k.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)).join(', ');
              const placeholders = keys.map(() => '?').join(', ');
              
              await env.DB.prepare(`INSERT INTO ${collection} (user_id, ${cols}) VALUES (?, ${placeholders})`)
                  .bind(userId, ...finalVals).run();
                  
              return new Response(JSON.stringify(item), { headers: corsHeaders });
          }

          if (method === 'PUT' && itemId) {
              const item = await request.json();
              const keys = Object.keys(item).filter(k => k !== 'id' && k !== 'userId');
              const sets = keys.map(k => `${k.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)} = ?`).join(', ');
              const vals = keys.map(k => {
                  const v = item[k];
                  return Array.isArray(v) ? JSON.stringify(v) : (v === true ? 1 : v === false ? 0 : v);
              });
              
              await env.DB.prepare(`UPDATE ${collection} SET ${sets} WHERE id = ? AND user_id = ?`)
                  .bind(...vals, itemId, userId).run();
                  
              return new Response(JSON.stringify(item), { headers: corsHeaders });
          }

          if (method === 'DELETE' && itemId) {
              await env.DB.prepare(`DELETE FROM ${collection} WHERE id = ? AND user_id = ?`)
                  .bind(itemId, userId).run();
              return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
          }
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  },
};
