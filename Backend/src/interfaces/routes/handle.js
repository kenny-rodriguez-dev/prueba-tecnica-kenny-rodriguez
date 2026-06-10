// Helper compartido: ejecuta la función del servicio y maneja los errores
// Los servicios lanzan objetos { status, message } que aquí se convierten en respuesta HTTP
module.exports = (fn) => async (req, res) => {
  try {
    res.json(await fn(req));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message || 'Error interno del servidor' });
  }
};
