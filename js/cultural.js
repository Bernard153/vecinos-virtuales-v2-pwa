// ========== MÓDULO CULTURAL INTEGRADOR - PARTE 1 ==========

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
            console.log(`\n🔍 Probando tipo: "\${typeValue}"`);
            
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
                    console.log(`   ❌ "\${typeValue}" NO funciona:`, error.message);
                } else {
                    console.log(`   ✅ "\${typeValue}" FUNCIONA!`);
                    // Eliminar el test
                    await supabase.from('cultural_posts').delete().eq('id', data.id);
                    console.log(`   🎉 VALOR CORRECTO ENCONTRADO: "\${typeValue}"`);
                    break;
                }
            } catch (err) {
                console.log(`   ❌ Error: \${err.message}`);
            }
        }
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    },
    
    // DIAGNÓSTICO: Probar conexión con Supabase
    async testSupabaseConnection() {
        console.log('🔍 DIAGNÓSTICO DE SUPABASE');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        try {
            // Test 1: Verificar que supabase esté definido
            console.log('1️⃣ Verificando cliente Supabase...');
            if (!window.supabase) {
                console.error('❌ Supabase no está inicializado');
                return;
            }
            console.log('✅ Cliente Supabase OK');
            
            // Test 2: Intentar leer datos (SELECT)
            console.log('2️⃣ Probando lectura de datos...');
            const { data: readData, error: readError } = await supabase
                .from('cultural_posts')
                .select('*')
                .limit(1);
            
            if (readError) {
                console.error('❌ Error leyendo datos:', readError);
            } else {
                console.log('✅ Lectura OK. Registros encontrados:', readData?.length || 0);
            }
            
            // Test 3: Intentar insertar un registro de prueba
            console.log('3️⃣ Probando inserción de datos...');
            const testPost = {
                title: 'TEST - Borrar',
                type: 'Fotografia',
                description: 'Test de conexión',
                media_type: null,
                media_url: null,
                author_id: VV.data.user.id,
                author_name: 'Test',
                author_number: '0000',
                neighborhood: VV.data.neighborhood
            };
            
            console.log('📤 Intentando insertar:', testPost);
            
            const { data: insertData, error: insertError } = await supabase
                .from('cultural_posts')
                .insert(testPost)
                .select()
                .single();
            
            if (insertError) {
                console.error('❌ Error insertando:', insertError);
                console.error('   Código:', insertError.code);
                console.error('   Mensaje:', insertError.message);
                console.error('   Detalles:', insertError.details);
                console.error('   Hint:', insertError.hint);
            } else {
                console.log('✅ Inserción OK:', insertData);
                
                // Eliminar el registro de prueba
                console.log('4️⃣ Limpiando registro de prueba...');
                await supabase
                    .from('cultural_posts')
                    .delete()
                    .eq('id', insertData.id);
                console.log('✅ Limpieza OK');
            }
            
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🏁 DIAGNÓSTICO COMPLETO');
            
        } catch (error) {
            console.error('❌ Error general:', error);
        }
    },
    
    // Mapeo de tipos a nombres legibles
    typeLabels: {
        'Fotografía': '📸 Fotografía',
        'Evento': '🎉 Evento',
        '🔄 Trueque': '🔄 Trueque'
    },
    
    // Obtener nombre legible del tipo
    getTypeLabel(type) {
        return this.typeLabels[type] || type;
    },
    
    // Cargar posts culturales
    load() {
        const container = document.getElementById('cultural-posts');
        
        // DEBUG: Ver qué tipos existen en la DB
        if (VV.data.culturalPosts.length > 0) {
            const existingTypes = [...new Set(VV.data.culturalPosts.map(p => p.type))];
            console.log('📊 Tipos existentes en DB:', existingTypes);
        }
        
        // Verificar si el usuario está en su barrio principal
        const homeNeighborhood = VV.data.user.home_neighborhood || VV.data.user.neighborhood;
        const currentNeighborhood = VV.data.user.current_neighborhood || VV.data.user.neighborhood;
        
        if (homeNeighborhood !== currentNeighborhood) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: var(--gray-50); border-radius: 12px;">
                    <i class="fas fa-lock" style="font-size: 3rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
                    <h3 style="color: var(--gray-700); margin-bottom: 0.5rem;">Acceso Restringido</h3>
                    <p style="color: var(--gray-600); margin-bottom: 1.5rem;">
                        Solo puedes publicar y comentar en tu barrio principal: <strong>\${homeNeighborhood}</strong>
                    </p>
                    <p style="color: var(--gray-500); font-size: 0.9rem;">
                        Actualmente estás visitando: <strong>\${currentNeighborhood}</strong>
                    </p>
                    <button onclick="VV.geo.returnToHomeNeighborhood()" class="btn-primary" style="margin-top: 1rem;">
                        <i class="fas fa-home"></i> Volver a \${homeNeighborhood}
                    </button>
                </div>
            `;
            return;
        }
        
        // Filtrar solo posts del mismo barrio
        const neighborhoodPosts = VV.data.culturalPosts.filter(p => 
            !p.neighborhood || p.neighborhood === VV.data.neighborhood
        );
        
        if (neighborhoodPosts.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--gray-600);">
                    <i class="fas fa-palette" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3>No hay publicaciones aún</h3>
                    <p>Comparte arte, eventos o propón un trueque</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = neighborhoodPosts.map(post => {
            const isOwner = (post.author_id || post.userId) === VV.data.user.id;
            const canModerate = VV.utils.canModerate();
            const mediaUrl = post.media_url || post.mediaUrl;
            const authorName = post.author_name || post.userName;
            
            return `
            <div class="cultural-card" style="background: white; border-radius: 16px; padding: 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.75rem;">
                <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-weight: bold; color: var(--gray-800); font-size: 1rem;">\${authorName}</span>
                        <span style="font-size: 0.75rem; color: var(--gray-500);">\${this.getTypeLabel(post.type)}</span>
                    </div>
                </div>
                
                <div class="card-body">
                    <h4 style="margin: 0 0 0.5rem 0; font-weight: bold; color: var(--gray-900);">\${post.title}</h4>
                    <p style="margin: 0; font-size: 0.9rem; color: var(--gray-600); line-height: 1.4;">\${post.description}</p>
                    \${mediaUrl ? \`<img src="\${mediaUrl}" style="width: 100%; border-radius: 12px; margin-top: 0.75rem; max-height: 250px; object-fit: cover;" />\` : ''}
                </div>

                <!-- 🌟 PIE DE TARJETA ACTUALIZADO: INTERACCIÓN Y BOTÓN DE REGALO -->
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--gray-100); padding-top: 0.5rem; margin-top: 0.5rem;">
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                    
    // ============================================================
    // INNOVACIÓN UNIFICADA: COFRE DE ESTIMULOS DE CULTURA REALES
    // ============================================================
    async abrirCofreCultura(publicacionId, creadorPostId, elementoBoton) {
        try {
            if (!VV.data.user || !VV.data.user.id) {
                alert('¡Hola! Para alentar a tus vecinos con regalos debes registrarte por WhatsApp.');
                return;
            }

            const usuarioIdActual = VV.data.user.id;

            const { data: billetera, error: errorBilletera } = await supabase
                .from('billeteras')
                .select('saldo_monedas')
                .eq('user_id', usuarioIdActual)
                .single();

            if (errorBilletera || !billetera) {
                alert('Tu billetera no está activa. Visita la sección Billetera para inicializar tu cuenta.');
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
                        <div>
                            <h3 style="font-weight: bold; font-size: 1.1rem; color: #1f2937; margin:0;">Alentar a tu Vecino 💝</h3>
                            <p style="font-size: 0.75rem; color: #9ca3af; margin:0;">Saldo actual: <span style="font-weight: bold; color: #16a34a;">🪙 \${billetera.saldo_monedas}</span></p>
                        </div>
                        <button onclick="document.getElementById('modal-tienda-cultura').style.opacity='0'; document.getElementById('cuerpo-modal-cultura').style.transform='translateY(100%)'; setTimeout(() => document.getElementById('modal-tienda-cultura').style.display='none', 300);" style="background: none; border: none; font-size: 1.2rem; color: #9ca3af; cursor: pointer;">✕</button>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; text-align: center;">
                        <button onclick="VV.cultural.procesarRegaloCultura('\${publicacionId}', '\${creadorPostId}', 'aplauso', 1, '👏', \${billetera.saldo_monedas})" style="border: 1px solid #e5e7eb; padding: 0.5rem; border-radius: 12px; background: #f9fafb; cursor: pointer; display: flex; flex-direction: column; align-items: center;">
                            <span style="font-size: 1.8rem;">👏</span><span style="font-size: 0.7rem; font-weight: bold; margin-top: 2px;">Aplauso</span><span style="font-size: 0.65rem; color: #d97706; font-weight: 600;">🪙 1</span>
                        </button>
                        <button onclick="VV.cultural.procesarRegaloCultura('\${publicacionId}', '\${creadorPostId}', 'rosa', 5, '🌹', \${billetera.saldo_monedas})" style="border: 1px solid #e5e7eb; padding: 0.5rem; border-radius: 12px; background: #f9fafb; cursor: pointer; display: flex; flex-direction: column; align-items: center;">
                            <span style="font-size: 1.8rem;">🌹</span><span style="font-size: 0.7rem; font-weight: bold; margin-top: 2px;">Rosa</span><span style="font-size: 0.65rem; color: #d97706; font-weight: 600;">🪙 5</span>
                        </button>
                        <button onclick="VV.cultural.procesarRegaloCultura('\${publicacionId}', '\${creadorPostId}', 'microfono', 20, '🎤', \${billetera.saldo_monedas})" style="border: 1px solid #e5e7eb; padding: 0.5rem; border-radius: 12px; background: #f9fafb; cursor: pointer; display: flex; flex-direction: column; align-items: center;">
                            <span style="font-size: 1.8rem;">🎤</span><span style="font-size: 0.7rem; font-weight: bold; margin-top: 2px;">Micro</span><span style="font-size: 0.65rem; color: #d97706; font-weight: 600;">🪙 20</span>
                        </button>
                        <button onclick="VV.cultural.procesarRegaloCultura('\${publicacionId}', '\${creadorPostId}', 'diamante', 50, '💎', \--${billetera.saldo_monedas})" style="border: 1px solid #e5e7eb; padding: 0.5rem; border-radius: 12px; background: #f9fafb; cursor: pointer; display: flex; flex-direction: column; align-items: center;">
                            <span style="font-size: 1.8rem;">💎</span><span style="font-size: 0.7rem; font-weight: bold; margin-top: 2px;">Diamante</span><span style="font-size: 0.65rem; color: #d97706; font-weight: 600;">🪙 50</span>
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

    // PROCESAMIENTO DE DESCUENTO Y REGISTRO EN SEGUNDO PLANO
    async procesarRegaloCultura(publicacionId, creadorPostId, nombreRegalo, costo, emoji, saldoActual) {
        if (saldoActual < costo) {
            alert('Saldo insuficiente. Visita la sección Billetera para recargar fondos.');
            return;
        }

        try {
            const usuarioIdActual = VV.data.user.id;

            // Restar fondos del emisor
            const { error: errorDescuento } = await supabase
                .from('billeteras')
                .update({ saldo_monedas: saldoActual - costo })
                .eq('user_id', usuarioIdActual);

            if (errorDescuento) throw errorDescuento;

            // Registrar en tabla unificada regalos_enviados
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

            // Inyectar XP de estatus al creador de la publicación
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

            // Cerrar el modal animado
            document.getElementById('modal-tienda-cultura').style.opacity = '0';
            document.getElementById('cuerpo-modal-cultura').style.transform = 'translateY(100%)';
            setTimeout(() => document.getElementById('modal-tienda-cultura').style.display = 'none', 300);

            VV.utils.showSuccess(`¡Has enviado un \${nombreRegalo}!`);
            
            // Lanzar emoji flotante al espacio
            const contenedor = document.createElement('div');
            contenedor.innerText = emoji;
            contenedor.style.cssText = 'position: fixed; font-size: 4rem; pointer-events: none; z-index: 99999; left: 50%; top: 50%; transform: translate(-50%, -50%); transition: all 1.5s ease-out; opacity: 1;';
            document.body.appendChild(contenedor);
            
            setTimeout(() => {
                contenedor.style.transform = 'translate(-50%, -250px) scale(1.6)';
                contenedor.style.opacity = '0';
            }, 50);
            setTimeout(() => { contenedor.remove(); }, 1500);

            // Recargar datos para refrescar la vista en tu app
            VV.cultural.load();

        } catch (err) {
            console.error("Fallo transaccional en cultura:", err);
            alert("No se pudo procesar tu regalo. Intenta nuevamente.");
        }
    }
};

console.log('✅ Módulo CULTURAL cargado');
