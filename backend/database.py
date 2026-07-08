import mysql.connector
import sys
import os
from dotenv import load_config # Asegúrate de tener load_dotenv() al inicio de tu proyecto principal

def conectar_db():
    try:
        conexion = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'asistente_ia'),        
            password=os.getenv('DB_PASSWORD'),  
            database=os.getenv('DB_NAME', 'ia_legal_transito')   
        )
        return conexion
    except mysql.connector.Error as error:
        print(f"\n❌ ERROR CRÍTICO DE MYSQL: {error}\n", file=sys.stderr)
        return None

def buscar_leyes_por_palabra(palabra: str):
    conexion = conectar_db()
    if not conexion:
        return None
    
    try:
        # dictionary=True hace que los resultados vengan como diccionarios limpios para FastAPI
        cursor = conexion.cursor(dictionary=True) 
        
        # Buscamos coincidencias en la columna palabras_clave
        query = "SELECT * FROM leyes_transito WHERE palabras_clave LIKE %s"
        valor_busqueda = f"%{palabra.lower()}%"
        
        cursor.execute(query, (valor_busqueda,))
        resultados = cursor.fetchall()
        
        cursor.close()
        conexion.close()
        return resultados
    except Exception as e:
        print(f"❌ Error al buscar en la base de datos: {e}")
        return None