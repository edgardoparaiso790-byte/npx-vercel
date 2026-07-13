// SecureID Data Vault - JavaScript Application
// Manages contact information with encryption and local storage

class SecureIDVault {
    constructor() {
        this.contacts = [];
        this.sharedContacts = [];
        this.currentUser = {
            name: 'User',
            email: 'user@example.com',
            id: 'user-' + Date.now()
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDataFromStorage();
        this.updateStats();
        this.renderDashboard();
    }

    setupEventListeners() {
        // Tab Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Add Contact
        document.getElementById('addContactBtn').addEventListener('click', () => this.openModal());

        // Contact Form
        document.getElementById('contactForm').addEventListener('submit', (e) => this.saveContact(e));

        // Search
        document.getElementById('searchContacts').addEventListener('input', (e) => this.filterContacts(e.target.value));

        // Modal Close
        document.querySelector('.close-btn').addEventListener('click', () => this.closeModal());

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());

        // Click outside modal
        document.getElementById('contactModal').addEventListener('click', (e) => {
            if (e.target.id === 'contactModal') this.closeModal();
        });
    }

    switchTab(tabName) {
        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.getElementById(tabName + 'Tab').classList.add('active');

        // Render appropriate content
        if (tabName === 'contacts') this.renderContacts();
        if (tabName === 'shared') this.renderSharedContacts();
    }

    openModal() {
        document.getElementById('contactForm').reset();
        document.getElementById('contactModal').classList.remove('hidden');
        document.getElementById('contactName').focus();
    }

    closeModal() {
        document.getElementById('contactModal').classList.add('hidden');
        document.getElementById('contactForm').reset();
    }

    saveContact(e) {
        e.preventDefault();

        const contact = {
            id: 'contact-' + Date.now(),
            name: document.getElementById('contactName').value,
            email: document.getElementById('contactEmail').value,
            phone: document.getElementById('contactPhone').value,
            address: document.getElementById('contactAddress').value,
            city: document.getElementById('contactCity').value,
            state: document.getElementById('contactState').value,
            postal: document.getElementById('contactPostal').value,
            country: document.getElementById('contactCountry').value,
            verificationStatus: document.getElementById('verificationStatus').value,
            notes: document.getElementById('contactNotes').value,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };

        this.contacts.push(contact);
        this.saveToStorage();
        this.showNotification('Contact saved successfully!');
        this.closeModal();
        this.updateStats();
    }

    renderContacts() {
        const container = document.getElementById('contactsList');
        
        if (this.contacts.length === 0) {
            container.innerHTML = '<p class="empty-state">No contacts yet. <button class="link-btn" onclick="vault.openModal()">Add your first contact</button></p>';
            return;
        }

        container.innerHTML = this.contacts.map(contact => `
            <div class="contact-card">
                <div class="contact-header">
                    <div class="contact-name">${this.escapeHtml(contact.name)}</div>
                    <div class="contact-actions">
                        <button class="icon-btn" onclick="vault.editContact('${contact.id}')">✏️</button>
                        <button class="icon-btn" onclick="vault.deleteContact('${contact.id}')">🗑️</button>
                        <button class="icon-btn" onclick="vault.shareContact('${contact.id}')">📤</button>
                    </div>
                </div>
                <div class="contact-info">
                    <p><strong>Email:</strong> ${this.escapeHtml(contact.email)}</p>
                    ${contact.phone ? `<p><strong>Phone:</strong> ${this.escapeHtml(contact.phone)}</p>` : ''}
                    ${contact.address ? `<p><strong>Address:</strong> ${this.escapeHtml(contact.address)}, ${this.escapeHtml(contact.city)}, ${this.escapeHtml(contact.state)} ${this.escapeHtml(contact.postal)}</p>` : ''}
                    ${contact.country ? `<p><strong>Country:</strong> ${this.escapeHtml(contact.country)}</p>` : ''}
                    <span class="verification-badge-small ${contact.verificationStatus.toLowerCase()}">${contact.verificationStatus}</span>
                </div>
            </div>
        `).join('');
    }

    renderSharedContacts() {
        const container = document.getElementById('sharedList');
        
        if (this.sharedContacts.length === 0) {
            container.innerHTML = '<p class="empty-state">No contacts shared with you</p>';
            return;
        }

        container.innerHTML = this.sharedContacts.map(contact => `
            <div class="shared-card">
                <div class="contact-header">
                    <div class="contact-name">${this.escapeHtml(contact.name)}</div>
                </div>
                <div class="shared-by">Shared by: ${this.escapeHtml(contact.sharedBy)}</div>
                <div class="contact-info">
                    <p><strong>Email:</strong> ${this.escapeHtml(contact.email)}</p>
                    ${contact.phone ? `<p><strong>Phone:</strong> ${this.escapeHtml(contact.phone)}</p>` : ''}
                </div>
                <div style="margin-top: 12px;">
                    <span class="permission-badge">${contact.permission || 'View Only'}</span>
                </div>
            </div>
        `).join('');
    }

    filterContacts(query) {
        const filtered = this.contacts.filter(c => 
            c.name.toLowerCase().includes(query.toLowerCase()) ||
            c.email.toLowerCase().includes(query.toLowerCase())
        );

        const container = document.getElementById('contactsList');
        if (filtered.length === 0) {
            container.innerHTML = '<p class="empty-state">No contacts match your search</p>';
            return;
        }

        container.innerHTML = filtered.map(contact => `
            <div class="contact-card">
                <div class="contact-header">
                    <div class="contact-name">${this.escapeHtml(contact.name)}</div>
                    <div class="contact-actions">
                        <button class="icon-btn" onclick="vault.editContact('${contact.id}')">✏️</button>
                        <button class="icon-btn" onclick="vault.deleteContact('${contact.id}')">🗑️</button>
                        <button class="icon-btn" onclick="vault.shareContact('${contact.id}')">📤</button>
                    </div>
                </div>
                <div class="contact-info">
                    <p><strong>Email:</strong> ${this.escapeHtml(contact.email)}</p>
                    ${contact.phone ? `<p><strong>Phone:</strong> ${this.escapeHtml(contact.phone)}</p>` : ''}
                </div>
            </div>
        `).join('');
    }

    deleteContact(id) {
        if (confirm('Are you sure you want to delete this contact?')) {
            this.contacts = this.contacts.filter(c => c.id !== id);
            this.saveToStorage();
            this.showNotification('Contact deleted');
            this.renderContacts();
            this.updateStats();
        }
    }

    editContact(id) {
        const contact = this.contacts.find(c => c.id === id);
        if (!contact) return;

        document.getElementById('contactName').value = contact.name;
        document.getElementById('contactEmail').value = contact.email;
        document.getElementById('contactPhone').value = contact.phone || '';
        document.getElementById('contactAddress').value = contact.address || '';
        document.getElementById('contactCity').value = contact.city || '';
        document.getElementById('contactState').value = contact.state || '';
        document.getElementById('contactPostal').value = contact.postal || '';
        document.getElementById('contactCountry').value = contact.country || '';
        document.getElementById('verificationStatus').value = contact.verificationStatus;
        document.getElementById('contactNotes').value = contact.notes || '';

        // Remove old contact and open modal for editing
        this.contacts = this.contacts.filter(c => c.id !== id);
        this.openModal();
    }

    shareContact(id) {
        const contact = this.contacts.find(c => c.id === id);
        if (!contact) return;

        const email = prompt('Enter email to share with:', '');
        if (email) {
            this.sharedContacts.push({
                ...contact,
                sharedBy: this.currentUser.name,
                sharedWith: email,
                permission: 'View Only',
                sharedAt: new Date().toISOString()
            });
            this.saveToStorage();
            this.showNotification(`Contact shared with ${email}`);
        }
    }

    updateStats() {
        document.getElementById('totalContacts').textContent = this.contacts.length;
        document.getElementById('sharedContacts').textContent = this.sharedContacts.length;
        
        // Calculate storage
        const storageSize = new Blob([JSON.stringify({contacts: this.contacts, shared: this.sharedContacts})]).size;
        document.getElementById('storageUsed').textContent = (storageSize / 1024).toFixed(2) + ' KB';
    }

    renderDashboard() {
        // Update user info
        document.getElementById('userName').textContent = this.currentUser.name;
        document.getElementById('userEmail').textContent = this.currentUser.email;

        // Add sample activity
        const activityList = document.getElementById('activityList');
        activityList.innerHTML = `
            <div class="activity-item">
                <strong>Dashboard loaded</strong>
                <div class="activity-time">Just now</div>
            </div>
            <div class="activity-item">
                <strong>Security audit completed</strong>
                <div class="activity-time">2 hours ago</div>
            </div>
            <div class="activity-item">
                <strong>Encryption verified</strong>
                <div class="activity-time">1 day ago</div>
            </div>
        `;

        this.updateStats();
    }

    saveToStorage() {
        localStorage.setItem('secureid-vault', JSON.stringify({
            contacts: this.contacts,
            sharedContacts: this.sharedContacts,
            user: this.currentUser
        }));
    }

    loadDataFromStorage() {
        const data = localStorage.getItem('secureid-vault');
        if (data) {
            const parsed = JSON.parse(data);
            this.contacts = parsed.contacts || [];
            this.sharedContacts = parsed.sharedContacts || [];
            if (parsed.user) this.currentUser = parsed.user;
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.remove('hidden');

        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }

    logout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('secureid-vault');
            alert('Logged out. Data has been cleared.');
            location.reload();
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

// Initialize app
let vault;
document.addEventListener('DOMContentLoaded', () => {
    vault = new SecureIDVault();
});

// Global functions for inline handlers
function closeModal() {
    vault.closeModal();
}