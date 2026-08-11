import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const els = {
  url: document.getElementById('sb-url'),
  key: document.getElementById('sb-key'),
  initBtn: document.getElementById('init-btn'),
  initStatus: document.getElementById('init-status'),
  email: document.getElementById('email'),
  password: document.getElementById('password'),
  loginBtn: document.getElementById('login-btn'),
  signupBtn: document.getElementById('signup-btn'),
  logoutBtn: document.getElementById('logout-btn'),
  authStatus: document.getElementById('auth-status'),
  sessionView: document.getElementById('session-view'),
  permissionsList: document.getElementById('permissions-list'),
  refreshUsersBtn: document.getElementById('refresh-users-btn'),
  usersView: document.getElementById('users-view'),
  targetUserId: document.getElementById('target-user-id'),
  roleKey: document.getElementById('role-key'),
  assignRoleBtn: document.getElementById('assign-role-btn'),
  removeRoleBtn: document.getElementById('remove-role-btn'),
  adminStatus: document.getElementById('admin-status')
};

let supabase = null;
let currentPermissions = [];

function setText(el, text) {
  if (el) el.textContent = text;
}

function pretty(value) {
  return JSON.stringify(value, null, 2);
}

function saveConfig() {
  localStorage.setItem('sb_url', els.url.value.trim());
  localStorage.setItem('sb_key', els.key.value.trim());
}

function loadConfig() {
  els.url.value = localStorage.getItem('sb_url') || '';
  els.key.value = localStorage.getItem('sb_key') || '';
}

function renderPermissions(items) {
  currentPermissions = items;
  if (!items.length) {
    els.permissionsList.innerHTML = '<span class="pill muted-pill">Sem permissões carregadas.</span>';
    return;
  }

  els.permissionsList.innerHTML = items
    .map(item => `<span class="pill">${item}</span>`)
    .join('');
}

async function loadPermissions() {
  if (!supabase) return;
  const { data, error } = await supabase.rpc('my_permissions');
  if (error) {
    setText(els.authStatus, `Falha ao carregar permissões: ${error.message}`);
    renderPermissions([]);
    return;
  }

  renderPermissions((data || []).map(item => item.permission_key));
}

async function loadUsers() {
  if (!supabase) return;
  const { data, error } = await supabase.rpc('admin_list_users');
  if (error) {
    setText(els.usersView, `Erro: ${error.message}`);
    return;
  }
  setText(els.usersView, pretty(data || []));
}

async function refreshSessionView() {
  if (!supabase) return;
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    setText(els.sessionView, `Erro ao ler sessão: ${error.message}`);
    return;
  }

  const session = data.session;
  if (!session) {
    setText(els.sessionView, 'Sem sessão.');
    setText(els.authStatus, 'Nenhuma sessão ativa.');
    renderPermissions([]);
    return;
  }

  setText(els.sessionView, pretty({
    user: {
      id: session.user.id,
      email: session.user.email
    },
    expires_at: session.expires_at,
    access_token_preview: session.access_token.slice(0, 32) + '...'
  }));

  setText(els.authStatus, `Sessão ativa para ${session.user.email}.`);
  await loadPermissions();
}

function initClient() {
  const url = els.url.value.trim();
  const key = els.key.value.trim();

  if (!url || !key) {
    setText(els.initStatus, 'Informe URL e publishable key.');
    return;
  }

  supabase = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  saveConfig();
  setText(els.initStatus, 'Cliente inicializado.');

  supabase.auth.onAuthStateChange(async () => {
    await refreshSessionView();
  });

  refreshSessionView();
}

async function signIn() {
  if (!supabase) return setText(els.authStatus, 'Inicialize o cliente primeiro.');
  const email = els.email.value.trim();
  const password = els.password.value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  setText(els.authStatus, error ? `Erro no login: ${error.message}` : 'Login realizado.');
}

async function signUp() {
  if (!supabase) return setText(els.authStatus, 'Inicialize o cliente primeiro.');
  const email = els.email.value.trim();
  const password = els.password.value;
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: email.split('@')[0]
      }
    }
  });
  setText(els.authStatus, error ? `Erro no cadastro: ${error.message}` : 'Cadastro enviado. Verifique confirmação, se habilitada.');
}

async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  setText(els.authStatus, error ? `Erro no logout: ${error.message}` : 'Logout realizado.');
  await refreshSessionView();
}

async function assignRole() {
  if (!supabase) return;
  const targetUserId = els.targetUserId.value.trim();
  const roleKey = els.roleKey.value;
  const { error } = await supabase.rpc('admin_assign_role', {
    target_user_id: targetUserId,
    role_key: roleKey
  });

  setText(els.adminStatus, error ? `Erro ao atribuir role: ${error.message}` : 'Role atribuída.');
  if (!error) await loadUsers();
}

async function removeRole() {
  if (!supabase) return;
  const targetUserId = els.targetUserId.value.trim();
  const roleKey = els.roleKey.value;
  const { error } = await supabase.rpc('admin_remove_role', {
    target_user_id: targetUserId,
    role_key: roleKey
  });

  setText(els.adminStatus, error ? `Erro ao remover role: ${error.message}` : 'Role removida.');
  if (!error) await loadUsers();
}

loadConfig();

els.initBtn.addEventListener('click', initClient);
els.loginBtn.addEventListener('click', signIn);
els.signupBtn.addEventListener('click', signUp);
els.logoutBtn.addEventListener('click', signOut);
els.refreshUsersBtn.addEventListener('click', loadUsers);
els.assignRoleBtn.addEventListener('click', assignRole);
els.removeRoleBtn.addEventListener('click', removeRole);

if (els.url.value && els.key.value) {
  initClient();
}
