import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database import conectar_db, buscar_leyes_por_palabra
from google import genai
from dotenv import load_dotenv

# 🔒 Cargamos las variables secretas del archivo .env apenas arranca el backend
load_dotenv()

app = FastAPI(title="VíaLegal AI - Cerebro Gemini Gratis")

# Configuramos CORS para que tu React se comunique sin bloqueos
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔒 PROTEGIDO: Jalamos la API Key de forma segura desde las variables de entorno
api_key_gemini = os.getenv("GEMINI_API_KEY")

# 🛠️ CORRECCIÓN: Evitamos que el cliente falle si la clave no se carga en local
client = None
if api_key_gemini:
    client = genai.Client(api_key=api_key_gemini)

@app.get("/")
def inicio():
    return {"mensaje": "El cerebro de VíaLegal AI con Gemini está en línea y optimizado"}

@app.get("/leyes/buscar")
def buscar_leyes(q: str):
    if not q:
        raise HTTPException(status_code=400, detail="Debes proporcionar un término de búsqueda.")
    
    # 1. Buscamos primero el fundamento legal en tu MySQL
    leyes_encontradas = buscar_leyes_por_palabra(q)
    
    # Construimos el bloque de texto con lo que encontramos en tu base de datos
    contexto_legal = ""
    if leyes_encontradas:
        for ley in leyes_encontradas:
            contexto_legal += f"Norma: {ley.get('tipo_norma')}, Artículo: {ley.get('articulo')}. Descripción: {ley.get('descripcion')}. Estrategia: {ley.get('argumento_defensa')}.\n"
    
    # 2. Si por alguna razón no se configuró el cliente, responde con MySQL
    if not client:
        return {
            "modo": "Local (MySQL)",
            "datos": leyes_encontradas,
            "respuesta_ia": "Modo conversacional desactivado. Asegúrate de configurar la clave de Gemini en Render o tu .env."
        }

    # 3. ¡Activamos el cerebro de Gemini con instrucciones directas y sueltas!
    try:
        # Creamos un mensaje directo combinando tu base de datos y la pregunta
        prompt_completo = (
            "Eres VíaLegal AI, un abogado experto en tránsito de Colombia. Tu labor es asesorar al ciudadano.\n\n"
            f"El usuario pregunta: {q}\n\n"
            f"Contexto de nuestra base de datos local (MySQL): {contexto_legal}\n\n"
            "INSTRUCCIÓN PARA TI:\n"
            "Si el contexto de MySQL contiene la solución, úsala. Si el contexto de MySQL NO contiene la respuesta exacta "
            "(como en este caso sobre no firmar un comparendo o inmovilizaciones), NO digas que no encontraste información. "
            "Usa de inmediato tus amplios conocimientos sobre el Código Nacional de Tránsito de Colombia (Ley 769 de 2002) "
            "para darle una respuesta completa, detallada y estructurada en viñetas. Explícale claramente qué leyes lo defienden "
            "y cuál es el procedimiento legal paso a paso que debe seguir."
        )

        # Hacemos la llamada limpia usando el cliente oficial
        respuesta = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt_completo
        )

        return {
            "modo": "Híbrido (MySQL + Gemini Gratis)",
            "datos": leyes_encontradas,
            "respuesta_ia": respuesta.text
        }

    except Exception as e:
        return {
            "modo": "Fallo AI - Caída a Local",
            "datos": leyes_encontradas,
            "respuesta_ia": f"Hola. Tuvimos un inconveniente al conectar con el módulo conversacional. Error: {str(e)}"
        }