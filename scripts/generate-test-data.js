const fs = require('fs');

const API_URL = 'https://script.google.com/macros/s/AKfycbxu5iBSSRYQPtjBJOl5eLfX8xHRnosxjYj-YmJ7O8JmDxS7EQZ_Ot2LPxaW40laI5iX/exec';

const users = [
  { type: 'register', email: 'carlos@assam.com', name: 'Carlos Gomez', phone: '3001112222', identificacion: '1001', role: 'Empleado', cargo: 'Ayudante', password: '123' },
  { type: 'register', email: 'ana@assam.com', name: 'Ana Martinez', phone: '3002223333', identificacion: '1002', role: 'Empleado', cargo: 'Soldador', password: '123' },
  { type: 'register', email: 'luis@assam.com', name: 'Luis Rodriguez', phone: '3003334444', identificacion: '1003', role: 'Empleado', cargo: 'Armador', password: '123' },
  { type: 'register', email: 'marta@assam.com', name: 'Marta Diaz', phone: '3004445555', identificacion: '1004', role: 'Empleado', cargo: 'Tubero', password: '123' },
  { type: 'register', email: 'pedro@assam.com', name: 'Pedro Sanchez', phone: '3005556666', identificacion: '1005', role: 'Empleado', cargo: 'Pintor', password: '123' }
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function generateData() {
  console.log("Registrando 5 usuarios de prueba...");
  for (const user of users) {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
      const data = await res.json();
      console.log(`Usuario ${user.name} registrado:`, data.status);
    } catch(e) {
      console.error(`Error registrando ${user.name}:`, e.message);
    }
    await sleep(2000); // 2 segundos de pausa para no saturar Apps Script
  }

  console.log("\nGenerando 10 registros de asistencia de prueba...");
  
  const dummySignature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  let dayOffset = 0;

  for (let i = 0; i < 10; i++) {
    const user = users[i % users.length];
    
    // Generar fechas en los últimos 5 días
    const d = new Date();
    d.setDate(d.getDate() - dayOffset);
    if (i % 2 !== 0) dayOffset++; // Avanza un día cada 2 registros

    const payload = {
      type: 'check_in_out',
      userId: user.email,
      typeAction: i % 2 === 0 ? 'Entrada' : 'Salida',
      timestamp: d.toISOString(),
      latitude: 4.60971 + (Math.random() * 0.01),
      longitude: -74.08175 + (Math.random() * 0.01),
      signatureUrl: dummySignature,
      employeeComments: 'Prueba ' + i
    };

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      console.log(`Registro ${i + 1} (${payload.typeAction}) para ${user.name} creado:`, data.status);
    } catch(e) {
      console.error(`Error creando registro para ${user.name}:`, e.message);
    }
    await sleep(2000); // 2 segundos de pausa para no saturar Apps Script
  }

  console.log("¡Proceso terminado!");
}

generateData();
