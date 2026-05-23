// ============================================================
// MÓDULO CULTURAL COMPLETO Y CORREGIDO - PARTE A
// ============================================================

VV.cultural = {
    // SOLUCIÓN TEMPORAL: Intentar con diferentes valores de tipo
    async testAllTypes() {
        console.log('🧪 PROBANDO DIFERENTES VALORES DE TIPO');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        const typesToTest = [
            'Fotografia', 'Fotografía', 
            'Arte', 'Cultural', 'Deporte',
            'photography', 'art', 'sport',
            'foto', 'imagen', 'post'
        ];
        
        for (const typeValue of typesToTest) {
            console.log(`\n🔍 Probando tipo: "${typeValue}"`);
            
            try {
                const { data, error } = await supabase
                    .from('cultural_posts')
                    .insert({
                        title: 'TEST',
                        type: typeValue,
                        description: 'Test',
                        author_id: VV.data.user.id,
                        author_name: 'Test',
                        author_number: '0000',
                        neighborhood: VV.data.neighborhood
                    })
                    .select()
                    .single();
                
                if (error) {
                    console.log(`   ❌ "${typeValue}" NO funciona:`, error.message);
                } else {
                    console.log(`   ✅ "${typeValue}" FUNCIONA!`);
                    await supabase.from('cultural_posts').delete().eq('id', data.id);
                    console.log(`   🎉 VALOR CORRECTO ENCONTRADO: "${typeValue}"`);
                    break;
                }
            } catch (err) {
                console.log(`   ❌ Error: ${err.message}`);
            }
        }
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    },
    
    // DIAGNÓSTICO: Probar conexión con Supabase
    async testSupabaseConnection() {
        console.log('🔍 DIAGNÓSTICO DE SUPABASE');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        try {
            if (!window.supabase) {
                console.error('❌ Supabase no está inicializado');
                return;
            }
            console.log('✅ Cliente Supabase OK');
            
            const { data: readData, error: readError } = await supabase
                .from('cultural_posts')
                .select('*')
                .limit(1);
            
            if (readError) {
                console.error('❌ Error leyendo datos:', readError);
            } else {
                console.log('✅ Lectura OK. Registros encontrados:', readData?.length || 0);
            }
            
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        } catch (error) {
            console.error('❌ Error general:', error);
        }
    },
    
    typeLabels: {
        'Fotografía': '📸 Fotografía',
        'Evento': '🎉 Evento',
        '🔄 Trueque': '🔄 Trueque'
    },
    
    getTypeLabel(type) {
        return this.typeLabels[type] || type;
    },
    // Cargar posts culturales amalgamados con el cofre de estímulos
    load() {
        const container = document.getElementById('cultural-posts');
        if (!container) return;
        
        if (VV.data.culturalPosts.length > 0) {
            const existingTypes = [...new Set(VV.data.culturalPosts.map(p => p.type))];
            console.log('📊 Tipos existentes en DB:', existingTypes);
        }
        
        const homeNeighborhood = VV.data.user.home_neighborhood || VV.data.user.neighborhood;
        const currentNeighborhood = VV.data.user.current_neighborhood || VV.data.user.neighborhood;
        
        if (homeNeighborhood !== currentNeighborhood) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: #f9fafb; border-radius: 12px;">
                    <h3 style="color: #374151; margin-bottom: 0.5rem;">Acceso Restringido</h3>
                    <p style="color: #4b5563;">Solo puedes publicar y comentar en tu barrio principal: <strong>${homeNeighborhood}</strong></p>
                </div>
            `;
            return;
        }
        
        const neighborhoodPosts = VV.data.culturalPosts.filter(p => 
            !p.neighborhood || p.neighborhood === VV.data.neighborhood
        );
        
        if (neighborhoodPosts.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #4b5563;">
                    <h3>No hay publicaciones aún</h3>
                    <p>Comparte arte, eventos o propón un trueque</p>
                </div>
            `;
            return;
        }
        
        // Renderizamos tu tarjeta combinando tus datos base con el botón del Cofre
        container.innerHTML = neighborhoodPosts.map(post => {
            const isOwner = (post.author_id || post.userId) === VV.data.user.id;
            const canModerate = VV.utils.canModerate();
            const mediaUrl = post.media_url || post.mediaUrl;
            const authorName = post.author_name || post.userName;
            const post_author_id = post.author_id || post.userId;
            
            return `
            <div class="cultural-card" style="background: white; border-radius: 16px; padding: 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-bottom: 1rem; border: 1px solid #e5e7eb; text-align: left;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-weight: bold; color: #1f2937; font-size: 1rem;">${authorName}</span>
                        <span style="font-size: 0.75rem; color: #6b7280;">${this.getTypeLabel(post.type)}</span>
                    </div>
                </div>
                <div style="margin-bottom: 0.75rem;">
                    <h4 style="margin: 0 0 0.5rem 0; font-weight: bold; color: #111827;">${post.title}</h4>
                    <p style="margin: 0; font-size: 0.9rem; color: #4b5563; line-height: 1.4;">${post.description}</p>
                    ${mediaUrl ? `<img src="${mediaUrl}" style="width: 100%; border-radius: 12px; margin-top: 0.75rem; max-height: 250px; object-fit: cover;" />` : ''}
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f3f4f6; padding-top: 0.5rem;">
                    <button onclick="VV.cultural.abrirCofreCultura('${post.id}', '${post_author_id}', this)" style="background: #d97706; color: white; border: none; width: 36px; height: 36px; border-radius: 50%; font-size: 1.1rem; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center;" title="Enviar un estímulo (Rosa, Aplauso o Diamante)">
                        🎁
                    </button>
                    ${isOwner || canModerate ? `
                        <button onclick="VV.cultural.deletePost('${post.id}')" style="background: none; border: none; color: #dc2626; cursor: pointer; font-size: 0.85rem;">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    ` : ''}
                </div>
            </div>
            `;
        }).join('');
    },
    // 🎁 ENVIAR ESTÍMULOS DE CULTURA (ROSAS/DIAMANTES) CON MONEDAS REALES
    async abrirCofreCultura(publicacionId, creadorPostId, elementoBoton) {
        try {
            if (!VV.data.user || !VV.data.user.id) {
                alert('¡Hola! Para enviar regalos y alentar a tus vecinos debes registrarte por WhatsApp.');
                return;
            }

            const usuarioIdActual = VV.data.user.id;

            const { data: billetera, error: errorBilletera } = await supabase
                .from('billeteras')
                .select('saldo_monedas')
                .eq('user_id', usuarioIdActual)
                .single();

            if (errorBilletera || !billetera) {
                alert('Tu billetera no está activa. Pásate por la sección Billetera para inicializar tu cuenta.');
                return;
            }

            let modal = document.getElementById('modal-tienda-cultura');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'modal-tienda-cultura';
                modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 99999; display: flex; align-items: flex-end; justify-content: center; opacity: 0; transition: opacity 0.3s;';
                document.body.appendChild(modal);
            }

            modal.innerHTML = `
                <div style="background: white; width: 100%; max-width: 400px; border-radius: 24px 24px 0 0; padding: 1.5rem; box-shadow: 0 -8px 24px rgba(0,0,0,0.2); transform: translateY(100%); transition: transform 0.3s;" id="cuerpo-modal-cultura">
                    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f3f4f6; padding-bottom: 0.5rem; margin-bottom: 1rem;">
                        <div style="text-align: left;">
                            <h3 style="font-weight: bold; font-size: 1.1rem; color: #1f2937; margin:0;">Alentar a tu Vecino 💝</h3>
                            <p style="font-size: 0.75rem; color: #9ca3af; margin:0;">Saldo actual: <span style="font-weight: bold; color: #16a34a;">🪙 ${billetera.saldo_monedas}</span></p>
                        </div>
                        <button onclick="document.getElementById('modal-tienda-cultura').style.opacity='0'; document.getElementById('cuerpo-modal-cultura').style.transform='translateY(100%)'; setTimeout(() => document.getElementById('modal-tienda-cultura').style.display='none', 300);" style="background: none; border: none; font-size: 1.2rem; color: #9ca3af; cursor: pointer;">✕</button>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; text-align: center;">
                        <button onclick="VV.cultural.procesarRegaloCultura('${publicacionId}', '${creadorPostId}', 'aplauso', 1, '👏', ${billetera.saldo_monedas})" style="border: 1px solid #e5e7eb; padding: 0.5rem; border-radius: 12px; background: #f9fafb; cursor: pointer; display: flex; flex-direction: column; align-items: center;">
                            <span style="font-size: 1.8rem;">👏</span><span style="font-size: 0.7rem; font-weight: bold; margin-top: 2px; color: #374151;">Aplauso</span><span style="font-size: 0.65rem; color: #d97706; font-weight: 600;">🪙 1</span>
                        </button>
                        <button onclick="VV.cultural.procesarRegaloCultura('${publicacionId}', '${creadorPostId}', 'rosa', 5, '🌹', ${billetera.saldo_monedas})" style="border: 1px solid #e5e7eb; padding: 0.5rem; border-radius: 12px; background: #f9fafb; cursor: pointer; display: flex; flex-direction: column; align-items: center;">
                            <span style="font-size: 1.8rem;">🌹</span><span style="font-size: 0.7rem; font-weight: bold; margin-top: 2px; color: #374151;">Rosa</span><span style="font-size: 0.65rem; color: #d97706; font-weight: 600;">🪙 5</span>
                        </button>
                        <button onclick="VV.cultural.procesarRegaloCultura('${publicacionId}', '${creadorPostId}', 'microfono', 20, '🎤', ${billetera.saldo_monedas})" style="border: 1px solid #e5e7eb; padding: 0.5rem; border-radius: 12px; background: #f9fafb; cursor: pointer; display: flex; flex-direction: column; align-items: center;">
                            <span style="font-size: 1.8rem;">🎤</span><span style="font-size: 0.7rem; font-weight: bold; margin-top: 2px; color: #374151;">Micro</span><span style="font-size: 0.65rem; color: #d97706; font-weight: 600;">🪙 20</span>
                        </button>
                        <button onclick="VV.cultural.procesarRegaloCultura('${publicacionId}', '${creadorPostId}', 'diamante', 50, '💎', ${billetera.saldo_monedas})" style="border: 1px solid #e5e7eb; padding: 0.5rem; border-radius: 12px; background: #f9fafb; cursor: pointer; display: flex; flex-direction: column; align-items: center;">
                            <span style="font-size: 1.8rem;">💎</span><span style="font-size: 0.7rem; font-weight: bold; margin-top: 2px; color: #374151;">Diamante</span><span style="font-size: 0.65rem; color: #d97706; font-weight: 600;">🪙 50</span>
                        </button>
                    </div>
                </div>
            `;

            modal.style.display = 'flex';
            setTimeout(() => {
                modal.style.opacity = '1';
                document.getElementById('cuerpo-modal-cultura').style.transform = 'translateY(0)';
            }, 10);

        } catch (err) {
            console.error("Error al abrir tienda cultural:", err);
        }
    },

    // PROCESAMIENTO DE TRANSACCIONES DE RECONOCIMIENTO ARTÍSTICO
    async procesarRegaloCultura(publicacionId, creadorPostId, nombreRegalo, costo, emoji, saldoActual) {
        if (saldoActual < costo) {
            alert('Saldo insuficiente. Visita la sección Billetera para recargar fondos.');
            return;
        }

        try {
            const usuarioIdActual = VV.data.user.id;

            const { error: errorDescuento } = await supabase
                .from('billeteras')
                .update({ saldo_monedas: saldoActual - costo })
                .eq('user_id', usuarioIdActual);

            if (errorDescuento) throw errorDescuento;

            const { error: errorHistorial } = await supabase
                .from('regalos_enviados')
                .insert([{
                    emisor_id: usuarioIdActual,
                    receptor_id: creadorPostId,
                    tipo_regalo: nombreRegalo,
                    costo_monedas: costo,
                    modulo_origen: 'cultura',
                    publicacion_id: publicacionId
                }]);

            if (errorHistorial) throw errorHistorial;

            const { data: billeteraReceptor } = await supabase
                .from('billeteras')
                .select('puntos_xp')
                .eq('user_id', creadorPostId)
                .single();
            
            if (billeteraReceptor) {
                await supabase
                    .from('billeteras')
                    .update({ puntos_xp: billeteraReceptor.puntos_xp + (costo * 10) })
                    .eq('user_id', creadorPostId);
            }

            document.getElementById('modal-tienda-cultura').style.opacity = '0';
            document.getElementById('cuerpo-modal-cultura').style.transform = 'translateY(100%)';
            setTimeout(() => document.getElementById('modal-tienda-cultura').style.display = 'none', 300);

            VV.utils.showSuccess(`¡Has enviado un ${nombreRegalo}!`);
            VV.cultural.load();

        } catch (err) {
            console.error("Fallo transaccional en cultura:", err);
            alert("No se pudo procesar tu regalo. Intenta nuevamente.");
        }
    }
};

console.log('✅ Módulo CULTURAL cargado de manera óptima y amalgamado');
