// ========== MÓDULO DE AUTENTICACIÓN POR CELULAR Y BARRIOS ==========

VV.auth = {
    neighborhoods: [],

    async checkExistingUser() {
        const saved = localStorage.getItem('vecinosVirtualesUser');
        if (saved) {
            const user = JSON.parse(saved);
            VV.data.user = user;
            VV.data.neighborhood = user.neighborhood;
            return true;
        }
        return false;
    },

    requestGeolocation() {
        VV.utils.showScreen('location-screen');
        const content = document.getElementById('location-content');
        content.innerHTML = '<div class="loading-spinner"></div><p>Buscando tu barrio...</p>';
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=es`);
                    const data = await res.json();
                    const city = data.city || 'Ciudad';
                    this.neighborhoods = ['Administrador', data.locality || 'Centro', city + ' Norte', city + ' Sur'];
                    this.showNeighborhoodSelection(city);
                },
                () => this.manualLocation()
            );
        } else { this.manualLocation(); }
    },

    manualLocation() {
        const content = document.getElementById('location-content');
        content.innerHTML = `
            <div class="auth-form">
                <input type="text" id="m-city" placeholder="Ciudad (Ej: Tucumán)">
                <input type="text" id="m-neigh" placeholder="Barrio (Ej: Yerba Buena)">
                <button class="btn-primary" onclick="VV.auth.processManual()">Buscar</button>
            </div>`;
    },

    processManual() {
        const city = document.getElementById('m-city').value;
        const neigh = document.getElementById('m-neigh').value;
        this.neighborhoods = ['Administrador', neigh || 'Centro', city + ' Norte'];
        this.showNeighborhoodSelection(city);
    },

    showNeighborhoodSelection(city) {
        const content = document.getElementById('location-content');
        content.innerHTML = `<h3>Barrios en ${city}:</h3><div id="n-list" class="neighborhoods-list"></div>`;
        document.getElementById('n-list').innerHTML = this.neighborhoods.map(n => `
            <div class="neighborhood-item" onclick="VV.auth.selectNeighborhood('${n.replace(/'/g, "\\'")}')">🏠 ${n}</div>
        `).join('');
    },

    selectNeighborhood(n) {
        VV.data.neighborhood = n;
        if (n === 'Administrador') {
            const p = prompt('Clave de Acceso:');
            if (p === '123456') { // Tu clave de soberanía
                return this.completeSession({ id:'admin', name:'Administrador Global', phone:'000', neighborhood:'Administrador', role:'admin', unique_number:'000' });
            }
            return alert('Acceso Denegado');
        }
        document.getElementById('login-selected-neighborhood').textContent = n;
        VV.utils.showScreen('login-screen');
        
        document.getElementById('login-form').onsubmit = async (e) => {
            e.preventDefault();
            const phone = document.getElementById('login-phone').value.trim();
            // Buscamos al usuario por teléfono y barrio
            const { data, error } = await supabase.from('users').select('*').eq('phone', phone).eq('neighborhood', n).single();
            if (data) this.completeSession(data);
            else this.goToRegister(phone);
        };
    },

    goToRegister(phone) {
        VV.utils.showScreen('registration-screen');
        document.getElementById('selected-neighborhood').textContent = VV.data.neighborhood;
        document.getElementById('user-phone').value = phone;
        document.getElementById('registration-form').onsubmit = async (e) => {
            e.preventDefault();
            const name = document.getElementById('user-name').value.trim();
            const newUser = {
                id: crypto.randomUUID(),
                name: name,
                phone: phone,
                neighborhood: VV.data.neighborhood,
                unique_number: Math.floor(100000 + Math.random() * 900000),
                role: 'user',
                home_neighborhood: VV.data.neighborhood,
                current_neighborhood: VV.data.neighborhood
            };
            const { error } = await supabase.from('users').insert(newUser);
            if (error) return alert("Este celular ya está registrado en otro barrio.");
            this.completeSession(newUser);
        };
    },

    completeSession(user) {
        const session = { 
            id: user.id, 
            name: user.name, 
            phone: user.phone, 
            neighborhood: user.neighborhood, 
            uniqueNumber: user.unique_number || user.uniqueNumber, 
            role: user.role 
        };
        localStorage.setItem('vecinosVirtualesUser', JSON.stringify(session));
        VV.data.user = session;
        this.startApp();
    },

    startApp() {
        VV.data.loadFromSupabase();
        const isAdmin = VV.data.user.role === 'admin';
        document.getElementById('header-neighborhood').textContent = VV.data.user.neighborhood;
        document.getElementById('welcome-name').textContent = VV.data.user.name;
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = isAdmin ? 'block' : 'none');
        VV.utils.showScreen('main-app');
        VV.utils.showSection('dashboard');
    },

    logout() {
        localStorage.removeItem('vecinosVirtualesUser');
        location.reload();
    }
};
