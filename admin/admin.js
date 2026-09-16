const AdminAPI = {
  async request(path, options = {}) {
    const res = await fetch(`/api${path}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });

    let data = null;
    const text = await res.text();
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { error: text || 'Unexpected response' };
    }

    if (!res.ok) {
      throw new Error(data?.error || data?.message || `Request failed (${res.status})`);
    }
    return data;
  },

  async requestForm(path, options = {}) {
    const res = await fetch(`/api${path}`, {
      credentials: 'include',
      ...options
    });

    let data = null;
    const text = await res.text();
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { error: text || 'Unexpected response' };
    }

    if (!res.ok) {
      throw new Error(data?.error || data?.message || `Request failed (${res.status})`);
    }
    return data;
  },

  login(password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password })
    });
  },

  logout() {
    return this.request('/auth/logout', { method: 'POST' });
  },

  me() {
    return this.request('/auth/me');
  },

  getPosts() {
    return this.request('/posts');
  },

  createPost(formData) {
    return this.requestForm('/posts', { method: 'POST', body: formData });
  },

  updatePost(id, formData) {
    return this.requestForm(`/posts/${id}`, { method: 'PUT', body: formData });
  },

  deletePost(id) {
    return this.request(`/posts/${id}`, { method: 'DELETE' });
  },

  getSettings() {
    return this.request('/settings');
  },

  saveSettings(payload) {
    return this.request('/settings', { method: 'PUT', body: JSON.stringify(payload) });
  }
};

const AdminAuth = {
  async requireAuth() {
    try {
      const me = await AdminAPI.me();
      if (!me.authenticated) {
        window.location.href = 'login.html';
        return false;
      }
      return true;
    } catch {
      window.location.href = 'login.html';
      return false;
    }
  },

  async requireGuest() {
    try {
      const me = await AdminAPI.me();
      if (me.authenticated) {
        window.location.href = 'index.html';
      }
    } catch {
      // stay on login
    }
  }
};

const AdminApp = {
  settings: null,
  posts: [],
  editingPostId: null,

  async init() {
    const ok = await AdminAuth.requireAuth();
    if (!ok) return;

    document.querySelectorAll('[data-panel]').forEach((btn) => {
      btn.addEventListener('click', () => this.showPanel(btn.dataset.panel));
    });

    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
      await AdminAPI.logout();
      window.location.href = 'login.html';
    });

    this.bindPostForm();
    this.bindSettingsForms();

    await this.refreshAll();
    this.showPanel('posts');
  },

  showPanel(id) {
    document.querySelectorAll('.panel').forEach((el) => el.classList.toggle('active', el.id === `panel-${id}`));
    document.querySelectorAll('[data-panel]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.panel === id);
    });
  },

  async refreshAll() {
    const [posts, settings] = await Promise.all([
      AdminAPI.getPosts(),
      AdminAPI.getSettings()
    ]);
    this.posts = posts;
    this.settings = settings;
    this.renderPosts();
    this.fillSettingsForms();
  },

  bindPostForm() {
    const form = document.getElementById('postForm');
    const resetBtn = document.getElementById('postReset');

    document.getElementById('postImage')?.addEventListener('change', (e) => {
      this.previewLocalImage(e.target.files?.[0], 'postImagePreview');
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = this.buildPostFormData();
      try {
        if (this.editingPostId) {
          await AdminAPI.updatePost(this.editingPostId, formData);
        } else {
          await AdminAPI.createPost(formData);
        }
        this.editingPostId = null;
        form.reset();
        document.getElementById('postSection').value = 'news';
        this.clearPreview('postImagePreview');
        document.getElementById('postFormTitle').textContent = 'Add post';
        await this.refreshAll();
        this.flash('postStatus', 'Post saved.');
      } catch (err) {
        this.flash('postStatus', err.message, true);
      }
    });

    resetBtn?.addEventListener('click', () => {
      this.editingPostId = null;
      form.reset();
      document.getElementById('postSection').value = 'news';
      this.clearPreview('postImagePreview');
      document.getElementById('postFormTitle').textContent = 'Add post';
    });
  },

  buildPostFormData() {
    const formData = new FormData();
    formData.append('section', document.getElementById('postSection').value);
    formData.append('title', document.getElementById('postTitle').value.trim());
    formData.append('excerpt', document.getElementById('postExcerpt').value.trim());
    formData.append('content', document.getElementById('postContent').value.trim());
    formData.append('category', document.getElementById('postCategory').value.trim());
    formData.append('author', document.getElementById('postAuthor').value.trim());
    formData.append('imageUrl', document.getElementById('postImageUrl').value.trim());
    formData.append('featured', document.getElementById('postFeatured').checked ? 'true' : 'false');
    const file = document.getElementById('postImage')?.files?.[0];
    if (file) formData.append('image', file);
    return formData;
  },

  fillPostForm(item) {
    document.getElementById('postSection').value = item.section || 'news';
    document.getElementById('postTitle').value = item.title || '';
    document.getElementById('postExcerpt').value = item.excerpt || '';
    document.getElementById('postContent').value = item.content || '';
    document.getElementById('postCategory').value = item.category || '';
    document.getElementById('postAuthor').value = item.author || '';
    document.getElementById('postImageUrl').value = item.imageUrl || '';
    document.getElementById('postFeatured').checked = !!item.featured;
    const fileInput = document.getElementById('postImage');
    if (fileInput) fileInput.value = '';
    this.showRemotePreview('postImagePreview', item.imageUrl || '');
  },

  renderPosts() {
    const tbody = document.getElementById('postsTableBody');
    if (!tbody) return;

    tbody.innerHTML = this.posts.map((item) => `
      <tr>
        <td>
          <strong>${this.escape(item.title)}</strong><br>
          <span class="muted">${this.escape(item.category || '')}</span>
          ${item.imageUrl ? `<div class="image-preview" style="margin-top:0.5rem"><img src="${this.escapeAttr(item.imageUrl)}" alt=""></div>` : ''}
        </td>
        <td>${item.section === 'entertainment' ? 'Entertainment' : 'News'}</td>
        <td>${item.featured ? 'Yes' : 'No'}</td>
        <td class="row">
          <button type="button" class="secondary" data-edit-post="${item.id}">Edit</button>
          <button type="button" class="danger" data-del-post="${item.id}">Delete</button>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="4">No posts yet.</td></tr>';

    tbody.querySelectorAll('[data-edit-post]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = this.posts.find((n) => String(n.id) === btn.dataset.editPost);
        if (!item) return;
        this.editingPostId = item.id;
        this.fillPostForm(item);
        document.getElementById('postFormTitle').textContent = `Edit post`;
        this.showPanel('posts');
      });
    });

    tbody.querySelectorAll('[data-del-post]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this post?')) return;
        try {
          await AdminAPI.deletePost(btn.dataset.delPost);
          await this.refreshAll();
          this.flash('postStatus', 'Post deleted.');
        } catch (err) {
          this.flash('postStatus', err.message, true);
        }
      });
    });
  },

  previewLocalImage(file, previewId) {
    const preview = document.getElementById(previewId);
    if (!preview) return;
    if (!file) {
      this.clearPreview(previewId);
      return;
    }
    const url = URL.createObjectURL(file);
    preview.hidden = false;
    preview.style.display = '';
    preview.innerHTML = `<img src="${url}" alt="Preview">`;
  },

  clearPreview(previewId) {
    const preview = document.getElementById(previewId);
    if (!preview) return;
    preview.hidden = true;
    preview.style.display = 'none';
    preview.innerHTML = '';
  },

  showRemotePreview(previewId, imageUrl) {
    const preview = document.getElementById(previewId);
    if (!preview) return;
    if (!imageUrl) {
      this.clearPreview(previewId);
      return;
    }
    preview.hidden = false;
    preview.style.display = '';
    preview.innerHTML = `<img src="${this.escapeAttr(imageUrl)}" alt="Current image">`;
  },

  bindSettingsForms() {
    document.getElementById('stationForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const payload = {
          addressLines: document.getElementById('addressLines').value
            .split('\n').map((l) => l.trim()).filter(Boolean),
          studioPhone: document.getElementById('studioPhone').value.trim(),
          whatsapp: document.getElementById('whatsappNumbers').value
            .split(/[\n,]+/).map((l) => l.trim()).filter(Boolean),
          social: {
            facebook: document.getElementById('socialFacebook').value.trim(),
            instagram: document.getElementById('socialInstagram').value.trim(),
            youtube: document.getElementById('socialYoutube').value.trim()
          }
        };
        this.settings = await AdminAPI.saveSettings(payload);
        this.flash('stationStatus', 'Station info saved.');
      } catch (err) {
        this.flash('stationStatus', err.message, true);
      }
    });

    document.getElementById('heroForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const phrases = [...document.querySelectorAll('#phraseList input')]
          .map((input) => input.value.trim())
          .filter(Boolean);
        this.settings = await AdminAPI.saveSettings({ heroPhrases: phrases });
        this.fillSettingsForms();
        this.flash('heroStatus', 'Hero phrases saved.');
      } catch (err) {
        this.flash('heroStatus', err.message, true);
      }
    });

    document.getElementById('addPhraseBtn')?.addEventListener('click', () => {
      this.addPhraseInput('');
    });

    document.getElementById('streamsForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        this.settings = await AdminAPI.saveSettings({
          streams: {
            audio: document.getElementById('streamAudio').value.trim(),
            video: document.getElementById('streamVideo').value.trim()
          }
        });
        this.flash('streamsStatus', 'Stream URLs saved.');
      } catch (err) {
        this.flash('streamsStatus', err.message, true);
      }
    });
  },

  fillSettingsForms() {
    const s = this.settings || {};
    document.getElementById('addressLines').value = (s.addressLines || []).join('\n');
    document.getElementById('studioPhone').value = s.studioPhone || '';
    document.getElementById('whatsappNumbers').value = (s.whatsapp || []).join('\n');
    document.getElementById('socialFacebook').value = s.social?.facebook || '';
    document.getElementById('socialInstagram').value = s.social?.instagram || '';
    document.getElementById('socialYoutube').value = s.social?.youtube || '';
    document.getElementById('streamAudio').value = s.streams?.audio || '';
    document.getElementById('streamVideo').value = s.streams?.video || '';

    const list = document.getElementById('phraseList');
    list.innerHTML = '';
    (s.heroPhrases || []).forEach((phrase) => this.addPhraseInput(phrase));
    if (!(s.heroPhrases || []).length) this.addPhraseInput('');
  },

  addPhraseInput(value) {
    const list = document.getElementById('phraseList');
    const wrap = document.createElement('div');
    wrap.className = 'phrase-item';
    wrap.innerHTML = `
      <input type="text" value="${this.escapeAttr(value)}" placeholder="Welcome phrase">
      <button type="button" class="secondary">Remove</button>
    `;
    wrap.querySelector('button').addEventListener('click', () => wrap.remove());
    list.appendChild(wrap);
  },

  flash(id, message, isError = false) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = message;
    el.className = isError ? 'error' : 'success';
  },

  escape(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  escapeAttr(str) {
    return this.escape(str).replace(/'/g, '&#39;');
  }
};

window.AdminAPI = AdminAPI;
window.AdminAuth = AdminAuth;
window.AdminApp = AdminApp;
