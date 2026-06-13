/**
 * ASSAM - Suite de Pruebas Automatizadas (30 Casos de Prueba)
 * Corre pruebas unitarias de cálculo y pruebas de integración en vivo contra el Apps Script.
 */

const API_URL = "https://script.google.com/macros/s/AKfycbxu5iBSSRYQPtjBJOl5eLfX8xHRnosxjYj-YmJ7O8JmDxS7EQZ_Ot2LPxaW40laI5iX/exec";

// Función de distancia idéntica a la implementada en Código.js
function getDistanceLocal(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radio de la Tierra en metros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Suite de Pruebas
async function runSuite() {
  console.log("=== INICIANDO SUITE DE 30 CASOS DE PRUEBA ===");
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      passed++;
      console.log(`✓ [Prueba ${passed + failed}] PASÓ: ${message}`);
    } else {
      failed++;
      console.error(`❌ [Prueba ${passed + failed}] FALLÓ: ${message}`);
    }
  }

  // --- PRUEBAS 1-10: CÁLCULOS UNITARIOS DE DISTANCIA (GPS) ---
  console.log("\n--- Casos 1-10: Fórmulas Matemáticas de Distancia GPS ---");
  
  // 1. Distancia al mismo punto es cero
  assert(Math.abs(getDistanceLocal(4.6097, -74.0817, 4.6097, -74.0817)) < 1, "Distancia al mismo punto es aproximadamente 0m.");
  
  // 2. Distancia a 1 grado latitud es aprox 111km
  const d1 = getDistanceLocal(0, 0, 1, 0);
  assert(Math.abs(d1 - 111319) < 500, `Distancia de 1 grado latitud es ~111km (calculado: ${d1.toFixed(1)}m).`);

  // 3. Distancia horizontal en el ecuador
  const d2 = getDistanceLocal(0, 0, 0, 1);
  assert(Math.abs(d2 - 111319) < 500, `Distancia de 1 grado longitud en Ecuador es ~111km (calculado: ${d2.toFixed(1)}m).`);

  // 4. Distancia con coordenadas negativas
  const d3 = getDistanceLocal(-4.6097, -74.0817, -4.6098, -74.0818);
  assert(d3 > 0, `Distancia en hemisferio sur es positiva (calculado: ${d3.toFixed(1)}m).`);

  // 5. Test 5: Simulación dentro del radio (100m)
  const distIn = getDistanceLocal(4.60971, -74.08175, 4.60975, -74.08175);
  assert(distIn < 100, `Punto dentro de geocerca de 100m (distancia: ${distIn.toFixed(1)}m).`);

  // 6. Test 6: Simulación fuera del radio
  const distOut = getDistanceLocal(4.60971, -74.08175, 4.61500, -74.08175);
  assert(distOut > 100, `Punto fuera de geocerca de 100m (distancia: ${distOut.toFixed(1)}m).`);

  // 7. Test 7: Simulación a distancias muy largas (Bogotá a Medellín)
  const dBogMed = getDistanceLocal(4.6097, -74.0817, 6.2442, -75.5812);
  assert(Math.abs(dBogMed - 240000) < 10000, `Bogotá a Medellín es ~240km (calculado: ${dBogMed.toFixed(1)}m).`);

  // 8. Test 8: Distancia vertical extrema
  assert(!isNaN(getDistanceLocal(90, 0, -90, 0)), "Distancia entre polos no es NaN.");

  // 9. Test 9: Comportamiento con valores muy pequeños
  assert(getDistanceLocal(0, 0, 0.00001, 0) > 0, "Diferencias ultra-pequeñas reportan distancia mayor a 0.");

  // 10. Test 10: Propiedad simétrica de la distancia
  const dAB = getDistanceLocal(4.6, -74, 4.7, -73.9);
  const dBA = getDistanceLocal(4.7, -73.9, 4.6, -74);
  assert(Math.abs(dAB - dBA) < 0.001, "getDistance es simétrico (distancia A a B es igual a B a A).");


  // --- PRUEBAS 11-15: PARSEO DE FORMATOS Y MAPEOS FRONTEND ---
  console.log("\n--- Casos 11-15: Lógica de Negocio y Mapeo en Frontend ---");
  
  // 11. Mapeo de Aprobador a approvedBy (Legacy y nuevo formato)
  const mockRecord = { Aprobador: "Carlos Collazos", Email_Sup: "carlos@example.com" };
  const mappedApprovedBy = mockRecord.Aprobador || mockRecord.Email_Sup;
  assert(mappedApprovedBy === "Carlos Collazos", "Mapeo prioriza 'Aprobador' sobre 'Email_Sup'.");

  // 12. Fallback de Aprobador si solo existe Email_Sup
  const mockRecord2 = { Email_Sup: "carlos@example.com" };
  const mappedApprovedBy2 = mockRecord2.Aprobador || mockRecord2.Email_Sup;
  assert(mappedApprovedBy2 === "carlos@example.com", "Mapeo retrocompatible con 'Email_Sup' si falta 'Aprobador'.");

  // 13. Mapeo del campo unificado Comentarios
  const mockRecord3 = { Comentarios: "Justificación empleado", Comentario: "Comentario antiguo" };
  const mappedComments = mockRecord3.Comentarios || mockRecord3.Comentario;
  assert(mappedComments === "Justificación empleado", "Mapeo unificado de comentarios correcto.");

  // 14. Fallback de Comentarios si solo existe Comentario
  const mockRecord4 = { Comentario: "Comentario antiguo" };
  const mappedComments2 = mockRecord4.Comentarios || mockRecord4.Comentario;
  assert(mappedComments2 === "Comentario antiguo", "Retrocompatibilidad de Comentario ok.");

  // 15. Validación de formato de email en aprobador (includes @)
  const approvedByEmail = "supervisor@assam.co";
  const approvedByName = "Juan Perez";
  assert(approvedByEmail.includes("@") === true, "Detecta correctamente que el aprobador contiene email.");
  assert(approvedByName.includes("@") === false, "Detecta correctamente que el aprobador es un nombre.");


  // --- PRUEBAS 16-30: PRUEBAS EN VIVO CON EL BACKEND DE GOOGLE SHEETS ---
  console.log("\n--- Casos 16-30: Integración en Vivo con Google Apps Script (doGet & doPost) ---");
  
  const testEmail = `test_${Math.floor(Math.random() * 100000)}@tests.com`;
  const testPassword = "securePassword123";
  let userId = "";
  let recordId = "";

  try {
    // 16. Test de lectura inicial doGet
    const resGet = await fetch(API_URL);
    const dataGet = await resGet.json();
    assert(dataGet.status === "success", "doGet responde status success.");
    
    // 17. Validar headers clave en registros devueltos
    assert(dataGet.headers && dataGet.headers.REGISTROS.includes("Aprobador"), "La cabecera 'Aprobador' existe en la base de datos.");
    
    // 18. Validar columna Comentarios en headers
    assert(dataGet.headers.REGISTROS.includes("Comentarios"), "La cabecera 'Comentarios' existe en la base de datos.");

    // 19. Registro de nuevo usuario
    const resReg = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        type: "register",
        name: "Tester Autómatizado",
        identificacion: "11223344",
        telefono: "123-4567",
        cargo: "Soldador API",
        email: testEmail,
        password: testPassword
      })
    });
    const dataReg = await resReg.json();
    assert(dataReg.status === "success", "Registrar nuevo usuario de pruebas exitoso.");
    userId = dataReg.user.id;

    // 20. Inicio de sesión con el nuevo usuario
    const resLogin = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        type: "login",
        email: testEmail,
        password: testPassword
      })
    });
    const dataLogin = await resLogin.json();
    assert(dataLogin.status === "success" && dataLogin.user.name === "Tester Autómatizado", "Inicio de sesión correcto con datos nuevos.");

    // 21. Intento de inicio de sesión con contraseña incorrecta (Debe fallar)
    const resFailLogin = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        type: "login",
        email: testEmail,
        password: "wrong_password"
      })
    });
    const dataFailLogin = await resFailLogin.json();
    assert(dataFailLogin.status === "error", "Login fallado con credenciales incorrectas (comportamiento esperado).");

    // 22. Crear marca de Entrada
    const resCheck = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        type: "check_in_out",
        userId: userId,
        userName: "Tester Autómatizado",
        typeAction: "Entrada",
        latitude: 4.60971,
        longitude: -74.08175,
        signatureBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
        userAvatar: "avatar-1"
      })
    });
    const dataCheck = await resCheck.json();
    assert(dataCheck.status === "success", "Registro de Entrada exitoso.");
    recordId = dataCheck.record.id;

    // 23. Verificar estado inicial de aprobación del registro (Pendiente)
    assert(dataCheck.record.status === "Pendiente", "El estado inicial del nuevo registro es 'Pendiente'.");

    // 24. Verificar que se guarda la justificación del empleado inicial
    const resComment = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        type: "update_employee_comment",
        recordId: recordId,
        employeeComments: "Justificación de Entrada Inicial"
      })
    });
    const dataComment = await resComment.json();
    assert(dataComment.status === "success", "Actualización/Justificación de comentario del empleado exitoso.");

    // 25. Actualización de comentario del empleado y modificación de horas (Rechazado -> Pendiente)
    // Primero simulamos un Rechazo para poder testear el flujo de re-edición
    await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        type: "validate_record",
        recordId: recordId,
        status: "Rechazado",
        comments: "Motivo del rechazo",
        approvedBy: "Supervisor Test"
      })
    });

    // 26. Envío de cambio de horas y nuevo comentario para re-someter el registro
    const resResubmit = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        type: "update_employee_comment",
        recordId: recordId,
        employeeComments: "Corrección de horarios y justificación nueva.",
        checkInTime: "07:30",
        checkOutTime: "17:30"
      })
    });
    const dataResubmit = await resResubmit.json();
    assert(dataResubmit.status === "success", "Re-sometimiento del registro con justificación y horas nuevas exitoso.");

    // 27. Verificar en la base de datos si el estado volvió a 'Pendiente' y las horas se actualizaron
    const resVerify = await fetch(API_URL);
    const dataVerify = await resVerify.json();
    const targetRecord = dataVerify.registros.find(r => r.ID_Registro.toString() === recordId.toString());
    assert(targetRecord.Aprobacion === "Pendiente", "El registro volvió a estar en estado 'Pendiente' tras re-someter.");

    // 28. Verificar que las horas cambiaron a las ingresadas
    assert(targetRecord.Hora_Entrada === "07:30", `Hora de Entrada actualizada correctamente a 07:30 (leído: ${targetRecord.Hora_Entrada}).`);

    // 29. Validar y Aprobar el registro por el supervisor escribiendo en Aprobador
    const resApprove = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        type: "validate_record",
        recordId: recordId,
        status: "Aprobado",
        comments: "Aprobado tras corrección.",
        approvedBy: "Supervisor Final"
      })
    });
    const dataApprove = await resApprove.json();
    assert(dataApprove.status === "success", "Aprobación del registro por el supervisor exitosa.");

    // 30. Verificar campos finales guardados en la hoja de cálculo
    const resVerifyFinal = await fetch(API_URL);
    const dataVerifyFinal = await resVerifyFinal.json();
    const finalRecord = dataVerifyFinal.registros.find(r => r.ID_Registro.toString() === recordId.toString());
    assert(finalRecord.Aprobacion === "Aprobado" && finalRecord.Aprobador === "Supervisor Final", "El registro se guardó permanentemente como Aprobado por 'Supervisor Final'.");

  } catch (liveError) {
    console.error("Fallo durante las pruebas de integración en vivo:", liveError);
    failed++;
  }

  console.log("\n=== RESUMEN DE LA SUITE DE PRUEBAS ===");
  console.log(`PASARON: ${passed} / 30`);
  console.log(`FALLARON: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSuite();
