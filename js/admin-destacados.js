// Sobrescribe la función vieja que no funciona
VV.admin.loadFeaturedRequests = async function() {
    const container = document.getElementById('featured-requests-list');
    if (!container) return;
    
    try {
        const { data, error } = await supabase
            .from('featured_requests')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        if (!data || data.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:var(--gray-500);padding:2rem;">No hay solicitudes de destacados pendientes.</p>';
            return;
        }
        
        container.innerHTML = data.map(req => `
            <div style="background:white;padding:1rem;border-radius:8px;margin-bottom:0.5rem;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
                    <strong>${req.product_name || 'Sin nombre'}</strong>
                    <span style="background:#f59e0b;color:white;padding:0.25rem 0.75rem;border-radius:20px;font-size:0.75rem;">PENDIENTE</span>
                </div>
                <div style="font-size:0.85rem;color:var(--gray-600);margin-bottom:0.5rem;">
                    📍 ${req.neighborhood || 'Sin barrio'} | 👤 ${req.user_name || 'Sin nombre'} | 💰 $${req.product_price || '0'}
                </div>
                <div style="font-size:0.9rem;margin-bottom:0.75rem;">${req.message || 'Sin mensaje'}</div>
                <div style="display:flex;gap:0.5rem;">
                    <button onclick="VV.admin.approveFeatured('${req.id}')" style="background:#10b981;color:white;border:none;padding:0.5rem 1rem;border-radius:6px;cursor:pointer;">
                        <i class="fas fa-check"></i> Aprobar
                    </button>
                    <button onclick="VV.admin.rejectFeatured('${req.id}')" style="background:#ef4444;color:white;border:none;padding:0.5rem 1rem;border-radius:6px;cursor:pointer;">
                        <i class="fas fa-times"></i> Rechazar
                    </button>
                </div>
            </div>
        `).join('');
        
    } catch (err) {
        console.error('Error cargando destacados:', err);
        container.innerHTML = '<p style="text-align:center;color:#ef4444;">Error al cargar solicitudes.</p>';
    }
};

VV.admin.approveFeatured = async function(id) {
    await supabase.from('featured_requests').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', id);
    VV.admin.loadFeaturedRequests();
    VV.utils.showSuccess('Destacado aprobado');
};

VV.admin.rejectFeatured = async function(id) {
    await supabase.from('featured_requests').update({ status: 'rejected', reviewed_at: new Date().toISOString() }).eq('id', id);
    VV.admin.loadFeaturedRequests();
    VV.utils.showSuccess('Destacado rechazado');
};

console.log('✅ Fix de destacados cargado');
