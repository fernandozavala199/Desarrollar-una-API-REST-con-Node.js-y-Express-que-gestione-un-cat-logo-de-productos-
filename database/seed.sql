-- Datos iniciales de prueba (Productos del Catálogo)
INSERT INTO productos (nombre, descripcion, categoria, precio) VALUES
('Laptop Pro 16"', 'Laptop de alto rendimiento con procesador de 10 núcleos, 32GB RAM y 1TB SSD', 'Computación', 1499.99),
('Mouse Inalámbrico Ergonómico', 'Mouse óptico recargable con conectividad Bluetooth 5.0 y sensor de 4000 DPI', 'Accesorios', 39.50),
('Teclado Mecánico RGB', 'Teclado mecánico con switches red lineales, iluminación RGB y estructura de aluminio', 'Accesorios', 89.99),
('Monitor Curvo 27" QHD', 'Monitor para diseño y gaming con resolución 2560x1440, 144Hz y panel IPS', 'Monitores', 320.00),
('Auriculares con Cancelación de Ruido', 'Auriculares inalámbricos over-ear con cancelación activa de ruido y 30h de batería', 'Audio', 199.90),
('Cámara Web 4K Ultra HD', 'Webcam profesional con micrófono dual estéreo y corrección automática de luz', 'Computación', 115.00)
ON CONFLICT DO NOTHING;
