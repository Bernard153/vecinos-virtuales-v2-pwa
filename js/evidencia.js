// Visor de evidencia para alertas vecinales
VV.moderator.verEvidencia = async function(alertaId) {
    try {
        const { data: a, error } = await supabase
            .from('alertas_vecinales')
            .select('*')
            .eq('id', alertaId)
            .single();

        if (error) throw error;

        var photos = a.photos || [];
        var gpsPoints = a.gps_points || [];
        var time = new Date(a.created_at).toLocaleString('es-AR');

        var overlay = document.getElementById('evidencia-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'evidencia-overlay';
            document.body.appendChild(overlay);
        }

        var html = '<div style="background:white;border-radius:16px;max-width:600px;width:95%;max-height:90vh;overflow-y:auto;padding:1.5rem;">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">';
        html += '<h2 style="margin:0;color:#1e293b;font-size:1.25rem;">Evidencia de Alerta</h2>';
        html += '<button onclick="document.getElementById(\'evidencia-overlay\').style.display=\'none\';" style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:#64748b;">X</button>';
        html += '</div>';

        html += '<div style="background:#fef2f2;border-radius:8px;padding:0.75rem;margin-bottom:1rem;">';
        html += '<p style="margin:0 0 0.25rem 0;color:#1e293b;font-weight:bold;">' + (a.user_name || 'Vecino') + '</p>';
        html += '<p style="margin:0 0 0.25rem 0;color:#64748b;font-size:0.85rem;">' + time + (a.is_auto ? ' (AUTO-ENVIADA)' : '') + '</p>';
        html += '<p style="margin:0;color:#64748b;font-size:0.85rem;">' + (a.neighborhood || 'Sin barrio') + '</p>';
        html += '</div>';

        // Fotos
        html += '<h3 style="color:#1e293b;font-size:1rem;margin-bottom:0.5rem;">Fotos (' + photos.length + ')</h3>';
        if (photos.length > 0) {
            html += '<div style="display:flex;gap:0.5rem;overflow-x:auto;padding-bottom:0.5rem;">';
            for (var i = 0; i < photos.length; i++) {
                html += '<img src="' + photos[i] + '" style="width:200px;height:150px;object-fit:cover;border-radius:8px;cursor:pointer;" onclick="window.open(\'' + photos[i] + '\', \'_blank\')">';
            }
            html += '</div>';
        } else {
            html += '<p style="color:#64748b;">No hay fotos</p>';
        }

        html += '<hr style="margin:1rem 0;border:none;border-top:1px solid #e2e8f0;">';

        // Audio
        html += '<h3 style="color:#1e293b;font-size:1rem;margin-bottom:0.5rem;">Audio</h3>';
        if (a.audio_url) {
            html += '<audio controls src="' + a.audio_url + '" style="width:100%;margin-bottom:0.5rem;"></audio>';
        } else {
            html += '<p style="color:#64748b;">No hay audio</p>';
        }

        html += '<hr style="margin:1rem 0;border:none;border-top:1px solid #e2e8f0;">';

        // GPS
        html += '<h3 style="color:#1e293b;font-size:1rem;margin-bottom:0.5rem;">Recorrido GPS (' + gpsPoints.length + ' puntos)</h3>';
        if (gpsPoints.length > 0) {
            var lastPoint = gpsPoints[gpsPoints.length - 1];
            var firstPoint = gpsPoints[0];
            var mapsUrl = 'https://www.google.com/maps?q=' + lastPoint.lat + ',' + lastPoint.lng;
            var routeUrl = 'https://www.google.com/maps/dir/' + firstPoint.lat + ',' + firstPoint.lng + '/' + lastPoint.lat + ',' + lastPoint.lng;

            html += '<div style="background:#f8fafc;border-radius:8px;padding:0.75rem;margin-bottom:0.5rem;">';
            for (var j = 0; j < gpsPoints.length; j++) {
                var seconds = Math.round((gpsPoints[j].timestamp - gpsPoints[0].timestamp) / 1000);
                var mins = Math.floor(seconds / 60);
                var secs = seconds % 60;
                var timeStr = mins + ':' + secs.toString().padStart(2, '0');
                var color = j === 0 ? '#10b981' : j === gpsPoints.length - 1 ? '#ef4444' : '#f59e0b';
                html += '<div style="display:flex;align-items:center;gap:0.5rem;padding:0.25rem 0;border-bottom:1px solid #e2e8f0;">';
                html += '<div style="width:10px;height:10px;border-radius:50%;background:' + color + ';flex-shrink:0;"></div>';
                html += '<span style="font-size:0.8rem;color:#475569;flex:1;">' + timeStr + '</span>';
                html += '<span style="font-size:0.8rem;color:#64748b;">' + gpsPoints[j].lat.toFixed(5) + ', ' + gpsPoints[j].lng.toFixed(5) + '</span>';
                html += '</div>';
            }
            html += '</div>';
            html += '<div style="display:flex;gap:0.5rem;margin-top:0.5rem;">';
            html += '<a href="' + mapsUrl + '" target="_blank" style="flex:1;background:#3b82f6;color:white;padding:0.5rem;border-radius:8px;text-align:center;text-decoration:none;font-size:0.8rem;font-weight:bold;">Ver ubicacion</a>';
            html += '<a href="' + routeUrl + '" target="_blank" style="flex:1;background:#8b5cf6;color:white;padding:0.5rem;border-radius:8px;text-align:center;text-decoration:none;font-size:0.8rem;font-weight:bold;">Ver ruta</a>';
            html += '</div>';
        } else {
            html += '<p style="color:#64748b;">No hay datos GPS</p>';
        }

        html += '<hr style="margin:1rem 0;border:none;border-top:1px solid #e2e8f0;">';

        // Botones de accion
        if (a.status === 'pending') {
            html += '<div style="display:flex;gap:0.5rem;margin-top:1rem;">';
            html += '<button onclick="VV.moderator.approveAlerta(\'' + a.id + '\');document.getElementById(\'evidencia-overlay\').style.display=\'none\';" style="flex:1;background:#10b981;color:white;padding:0.75rem;border:none;border-radius:8px;cursor:pointer;font-weight:bold;">Aprobar</button>';
            html += '<button onclick="VV.moderator.rejectAlerta(\'' + a.id + '\');document.getElementById(\'evidencia-overlay\').style.display=\'none\';" style="flex:1;background:#ef4444;color:white;padding:0.75rem;border:none;border-radius:8px;cursor:pointer;font-weight:bold;">Rechazar</button>';
            html += '</div>';
        } else if (a.status === 'approved') {
            html += '<button onclick="VV.moderator.resolveAlerta(\'' + a.id + '\');document.getElementById(\'evidencia-overlay\').style.display=\'none\';" style="width:100%;background:#3b82f6;color:white;padding:0.75rem;border:none;border-radius:8px;cursor:pointer;font-weight:bold;margin-top:1rem;">Marcar como resuelta</button>';
        }

        html += '</div>';

        overlay.innerHTML = html;
        overlay.style.display = 'flex';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.background = 'rgba(0,0,0,0.8)';
        overlay.style.zIndex = '10010';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';

    } catch (err) {
        console.error('Error cargando evidencia:', err);
        alert('Error: ' + err.message);
    }
};
