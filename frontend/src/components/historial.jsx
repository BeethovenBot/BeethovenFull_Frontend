import { useEffect, useState } from 'react';

function Historial() {
  const [historial, setHistorial] = useState([]);

  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        const response = await fetch('https://beethoven.up.railway.app/historial');
        const raw = await response.json();

        // 💡 Si el backend devuelve string, parsearlo a objeto
        const data = typeof raw === 'string' ? JSON.parse(raw) : raw;

        // 💡 Validar que sea un array antes de guardar
        if (Array.isArray(data)) {
          setHistorial(data);
        } else {
          console.error('El historial no es un array:', data);
          setHistorial([]);
        }
      } catch (error) {
        console.error('Error al obtener historial:', error);
        setHistorial([]);
      }
    };

    fetchHistorial();

    const interval = setInterval(fetchHistorial, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-4xl mt-10">
      <h2 className="text-2xl font-bold mb-4 text-white">📜 Historial Reciente</h2>
      <div className="space-y-4 max-h-[500px] overflow-y-auto">
        {historial.length === 0 ? (
          <p className="text-gray-400">No hay entradas aún.</p>
        ) : (
          historial.map((entrada, index) => (
            <div key={index} className="bg-gray-800 text-white p-4 rounded-lg shadow">
              <p className="text-xs text-gray-400 mb-2">
                {new Date(entrada.timestamp).toLocaleString()}
              </p>
              <pre className="text-sm whitespace-pre-wrap">
                {JSON.stringify(entrada, null, 2)}
              </pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Historial;
