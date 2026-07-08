import { useState } from 'react'
import axios from 'axios'

// ==========================================
// 1. CONFIGURACIÓN DE TEMA (Paleta Institucional)
// ==========================================
const TEMA = {
  bgApp: '#F8FAFC',
  bgSidebar: '#FFFFFF',
  bgChat: '#F8FAFC',
  bgCardUser: '#E2E8F0',
  bgCardIA: '#FFFFFF',
  textoPrincipal: '#0F172A',
  textoSecundario: '#475569',
  borde: '#E2E8F0',
  azulInstitucional: '#0A2540',
  amarilloVial: '#FFC107',
  verdeExito: '#10B981',
}

// Mensaje inicial estático para evitar duplicación de código
const MENSAJE_BIENVENIDA = {
  id: 'bienvenida',
  rol: 'asistente',
  texto: 'Hola, soy tu asesor experto en movilidad y legislación de tránsito en Colombia. ⚖️\n\n¿Tienes una fotomulta, un comparendo o necesitas radicar un derecho de petición? Cuéntame tu caso y te daré la estrategia de defensa con su fundamento legal.',
  botonesRapidos: ['Impugnar Fotomulta', 'Prescripción de Comparendo', 'Audiencia de Tránsito']
}

// ==========================================
// 2. PROCESADOR NATIVO DE FORMATO (Markdown Ligero)
// ==========================================
const renderizarTextoLimpio = (texto) => {
  if (!texto) return '';
  
  const lineas = texto.split('\n');
  
  return lineas.map((linea, index) => {
    let contenido = linea;

    // Detectar citas en bloque (> Texto) -> Caja azul de énfasis jurídico
    if (contenido.trim().startsWith('>')) {
      const fraseCita = contenido.replace('>', '').trim().replace(/\*\*/g, '');
      return (
        <blockquote key={index} style={{ borderLeft: `4px solid ${TEMA.azulInstitucional}`, backgroundColor: '#F0F7FF', padding: '12px 16px', margin: '12px 0', borderRadius: '6px', color: TEMA.azulInstitucional, fontStyle: 'italic', fontWeight: '500' }}>
          {fraseCita}
        </blockquote>
      );
    }

    // Detectar títulos (###)
    if (contenido.trim().startsWith('###')) {
      const tituloLimpio = contenido.replace(/#/g, '').trim().replace(/\*\*/g, '');
      return <h3 key={index} style={{ color: TEMA.azulInstitucional, margin: '18px 0 8px 0', fontSize: '18px', fontWeight: '700' }}>{tituloLimpio}</h3>;
    }

    // Detectar viñetas (* o -)
    const esVineta = contenido.trim().startsWith('*') || contenido.trim().startsWith('-');
    
    // Procesar textos en negrita (**texto**)
    let partes = contenido.split(/\*\*([\s\S]*?)\*\*/g);
    const textoFormateado = partes.map((parte, idx) => {
      return idx % 2 === 1 ? <strong key={idx} style={{ color: TEMA.azulInstitucional, fontWeight: '700' }}>{parte}</strong> : parte;
    });

    if (esVineta) {
      const textoSinSimbolo = partes[0].trim().replace(/^[\*\-\s]+/, '');
      partes[0] = textoSinSimbolo;
      
      return (
        <ul key={index} style={{ margin: '4px 0 4px 20px', paddingLeft: '5px', listStyleType: 'disc' }}>
          <li style={{ color: TEMA.textoPrincipal, lineHeight: '1.7' }}>
            {partes.map((parte, idx) => idx % 2 === 1 ? <strong key={idx} style={{ color: TEMA.azulInstitucional }}>{parte}</strong> : parte)}
          </li>
        </ul>
      );
    }

    // Párrafo estándar
    return (
      <p key={index} style={{ margin: '0 0 8px 0', lineHeight: '1.7', minHeight: contenido.trim() === '' ? '12px' : 'auto' }}>
        {textoFormateado}
      </p>
    );
  });
};

// ==========================================
// 3. COMPONENTE PRINCIPAL
// ==========================================
function App() {
  const [busqueda, setBusqueda] = useState('')
  const [mensajes, setMensajes] = useState([MENSAJE_BIENVENIDA])
  const [cargando, setCargando] = useState(false)

  // Historial simulado para el panel lateral
  const historialChats = [
    { id: 1, titulo: 'Fotomulta Medellín - Calibración' },
    { id: 2, titulo: 'Prescripción Comparendo 2023' },
    { id: 3, titulo: 'Audiencia por comparendo operativo' }
  ]

  // Gestión de peticiones y envío de mensajes
  const manejarEnvio = async (textoAEnviar) => {
    const textoFinal = textoAEnviar || busqueda;
    if (!textoFinal.trim()) return

    const nuevoMensajeUsuario = { id: Date.now(), rol: 'usuario', texto: textoFinal }
    setMensajes(prev => [...prev, nuevoMensajeUsuario])
    setBusqueda('')
    setCargando(true)

    try {
      // 📡 CONECTADO AL CEREBRO REAL EN LA NUBE DE RENDER
      const respuesta = await axios.get(`https://ia-legal-transito-app.onrender.com/leyes/buscar?q=${textoFinal}`)
      const datos = respuesta.data.datos || []
      const textoGemini = respuesta.data.respuesta_ia

      let respuestaIA = ""
      
      if (textoGemini) {
        respuestaIA = textoGemini
      } 
      else if (datos.length > 0) {
        const ley = datos[0]
        respuestaIA = `### 🛡️ Estrategia de Defensa Legal Encontrada\n\n**Normatividad:** ${ley.tipo_norma} - ${ley.articulo}\n\n**Descripción:** ${ley.descripcion}\n\n> **Fundamento Jurídico de Defensa:** ${ley.argumento_defensa}\n\n**Conceptos clave recomendados para tu recurso:**\n${ley.terminos_legales.split(',').map(t => `- *${t.trim()}*`).join('\n')}\n\n*Recuerda que bajo la Ley 1843 de 2017 y la jurisprudencia de la Corte Constitucional, el debido proceso de notificación es de obligatorio cumplimiento.*`
      } 
      else {
        respuestaIA = `No encontré un argumento exacto en la base jurídica actual para "${textoFinal}". Sin embargo, como tu asesor experto, te sugiero revisar si el comparendo cumple con los términos de notificación física (5 días hábiles) según la Ley 1843 de 2017 o la caducidad según el artículo 161 del Código Nacional de Tránsito.`
      }

      setMensajes(prev => [...prev, { id: Date.now() + 1, rol: 'asistente', texto: respuestaIA }])

    } catch (err) {
      console.error(err)
      setMensajes(prev => [...prev, { id: Date.now() + 1, rol: 'asistente', texto: '❌ Hubo un error de conexión con el servidor de VíaLegal AI. Asegúrate de que el backend esté encendido.' }])
    } finally {
      setCargando(false)
    }
  }

  // Acción para limpiar y reiniciar la conversación
  const reiniciarConsulta = () => {
    setMensajes([MENSAJE_BIENVENIDA])
  }

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: TEMA.bgApp, color: TEMA.textoPrincipal, fontFamily: '"Segoe UI", Roboto, sans-serif', transition: 'all 0.3s ease' }}>
      
      {/* PANEL LATERAL IZQUIERDO */}
      <aside style={{ width: '280px', backgroundColor: TEMA.bgSidebar, borderRight: `1px solid ${TEMA.borde}`, display: 'flex', flexDirection: 'column', padding: '20px', justifyContent: 'space-between' }}>
        <div>
          {/* Logo Branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px' }}>
            <img 
              src="/logo.png.png" 
              alt="VíaLegal Logo" 
              style={{ width: '38px', height: '38px', borderRadius: '10px', objectFit: 'cover', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} 
            />
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: TEMA.azulInstitucional }}>VíaLegal AI</h2>
              <span style={{ fontSize: '11px', color: TEMA.verdeExito, fontWeight: '600', letterSpacing: '0.5px' }}>SISTEMA JURÍDICO INTELIGENTE</span>
            </div>
          </div>

          {/* Botón de reinicio */}
          <button style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px dashed ${TEMA.borde}`, backgroundColor: 'transparent', color: TEMA.textoPrincipal, fontSize: '14px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '25px', transition: 'background 0.2s' }} onClick={reiniciarConsulta}>
            <span>+</span> Nueva consulta
          </button>

          {/* Lista de Historial */}
          <div>
            <span style={{ fontSize: '11px', fontWeight: '700', color: TEMA.textoSecundario, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '10px' }}>Historial Reciente</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {historialChats.map(chat => (
                <div key={chat.id} style={{ padding: '10px', borderRadius: '8px', fontSize: '13px', color: TEMA.textoSecundario, cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', transition: 'all 0.2s' }}>
                  💬 {chat.titulo}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Info del Perfil del Usuario */}
        <div style={{ borderTop: `1px solid ${TEMA.borde}`, paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: TEMA.azulInstitucional, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>DC</div>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Cristian D.</span>
          </div>
        </div>
      </aside>

      {/* ÁREA CENTRAL DEL CHAT */}
      <section style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: TEMA.bgChat }}>
        
        {/* Barra superior de estado */}
        <header style={{ height: '60px', borderBottom: `1px solid ${TEMA.borde}`, display: 'flex', alignItems: 'center', padding: '0 30px', justifyContent: 'space-between', backgroundColor: TEMA.bgSidebar }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: TEMA.verdeExito }}></div>
            <span style={{ fontSize: '14px', fontWeight: '500', color: TEMA.textoSecundario }}>Jurisprudencia de Tránsito CO (Edición 2026)</span>
          </div>
          <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '20px', backgroundColor: TEMA.borde, fontWeight: '600' }}>Premium Asistente</span>
        </header>

        {/* Zona de Mensajes */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '40px 60px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
          {mensajes.map((msg) => (
            <div key={msg.id} style={{ display: 'flex', gap: '20px', maxWidth: '85%', alignSelf: msg.rol === 'usuario' ? 'flex-end' : 'flex-start', flexDirection: msg.rol === 'usuario' ? 'row-reverse' : 'row' }}>
              
              {/* Avatar Dinámico */}
              {msg.rol === 'usuario' ? (
                <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: '#64748B', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  👤
                </div>
              ) : (
                <img 
                  src="/robot.png.png" 
                  alt="AI Assistant" 
                  style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }} 
                />
              )}

              {/* Burbuja de Texto */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ backgroundColor: msg.rol === 'usuario' ? TEMA.bgCardUser : TEMA.bgCardIA, color: TEMA.textoPrincipal, padding: '16px 20px', borderRadius: msg.rol === 'usuario' ? '18px 18px 2px 18px' : '18px 18px 18px 2px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', border: `1px solid ${TEMA.borde}`, fontSize: '15px', wordWrap: 'break-word' }}>
                  
                  {msg.rol === 'asistente' ? (
                    <div>{renderizarTextoLimpio(msg.texto)}</div>
                  ) : (
                    <div style={{ whiteSpace: 'pre-line' }}>{msg.texto}</div>
                  )}

                </div>

                {/* Botones rápidos de interacción */}
                {msg.botonesRapidos && (
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '5px' }}>
                    {msg.botonesRapidos.map((btn, idx) => (
                      <button key={idx} onClick={() => manejarEnvio(btn)} style={{ padding: '8px 14px', borderRadius: '20px', border: `1px solid ${TEMA.azulInstitucional}`, backgroundColor: 'transparent', color: TEMA.textoPrincipal, fontSize: '13px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }}>
                        {btn}
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ))}

          {/* Indicador de carga */}
          {cargando && (
            <div style={{ display: 'flex', gap: '20px', alignSelf: 'flex-start' }}>
              <img 
                src="/robot.png.png" 
                alt="AI Assistant Loading" 
                style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} 
              />
              <div style={{ backgroundColor: TEMA.bgCardIA, color: TEMA.textoSecundario, padding: '12px 20px', borderRadius: '18px', border: `1px solid ${TEMA.borde}`, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: '500' }}>VíaLegal AI está estructurando la defensa...</span>
              </div>
            </div>
          )}
        </div>

        {/* INPUT DE ENTRADA */}
        <footer style={{ padding: '20px 60px 40px 60px', backgroundColor: 'transparent' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', display: 'flex', alignItems: 'center', backgroundColor: TEMA.bgSidebar, borderRadius: '16px', border: `1px solid ${TEMA.borde}`, padding: '8px 15px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
            
            <button style={{ border: 'none', backgroundColor: 'transparent', fontSize: '20px', cursor: 'pointer', padding: '0 10px', color: TEMA.textoSecundario }} title="Adjuntar comparendo o PDF (Próximamente)">
              📎
            </button>

            <input 
              type="text" 
              placeholder="Pregúntale a la IA sobre un fotocomparendo, derecho de petición, grúa..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && manejarEnvio()}
              style={{ flex: 1, border: 'none', backgroundColor: 'transparent', padding: '15px 10px', fontSize: '15px', color: TEMA.textoPrincipal, outline: 'none' }}
            />

            <button 
              onClick={() => manejarEnvio()}
              disabled={cargando || !busqueda.trim()}
              style={{ width: '45px', height: '45px', borderRadius: '12px', backgroundColor: busqueda.trim() ? TEMA.azulInstitucional : TEMA.borde, color: busqueda.trim() ? TEMA.amarilloVial : TEMA.textoSecundario, border: 'none', fontSize: '18px', cursor: busqueda.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
            >
              ➔
            </button>
          </div>
          <p style={{ fontSize: '11px', color: TEMA.textoSecundario, textAlign: 'center', marginTop: '10px' }}>
            VíaLegal AI puede cometer errores. Verifica la vigencia de los términos de la Secretaría de Movilidad local.
          </p>
        </footer>

      </section>

    </div>
  )
}

export default App