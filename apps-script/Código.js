/**
 * ASSAM - API Backend v1.1 (Control de Asistencia)
 */

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Función auxiliar para leer hojas dinámicamente
    const readSheet = (name, hasHeaders = true) => {
      const sheet = ss.getSheetByName(name);
      if (!sheet) return [];
      const data = sheet.getDataRange().getValues();
      if (!hasHeaders || data.length < 2) return [];
      const headers = data[0];
      return data.slice(1).map((row, rowIndex) => {
        let obj = { _rowIndex: rowIndex + 2 }; // Guardar la fila real (1-based index + headers)
        headers.forEach((h, i) => {
          if (h) {
            if (row[i] instanceof Date) {
              obj[h] = row[i].toISOString();
            } else {
              obj[h] = row[i] !== "" ? row[i] : null;
            }
          }
        });
        return obj;
      }).filter(r => r[headers[0]]); // Filtrar filas vacías
    };

    const getHeaders = (name) => {
      const sheet = ss.getSheetByName(name);
      if (!sheet) return [];
      const data = sheet.getDataRange().getValues();
      if (data.length === 0) return [];
      return data[0].filter(h => h !== "");
    };

    return ContentService.createTextOutput(JSON.stringify({ 
      status: "success", 
      registros: readSheet("REGISTROS"), 
      usuarios: readSheet("USUARIOS"),
      cargos: readSheet("CARGOS"),
      frentes: readSheet("FRENTES"),
      headers: {
        REGISTROS: getHeaders("REGISTROS"),
        USUARIOS: getHeaders("USUARIOS"),
        CARGOS: getHeaders("CARGOS"),
        FRENTES: getHeaders("FRENTES")
      }
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // -------------------------------------------------------------
    // ACCIÓN: LOGIN
    // -------------------------------------------------------------
    if (params.type === 'login') {
      const sheet = ss.getSheetByName("USUARIOS");
      if (!sheet) throw new Error("La pestaña USUARIOS no existe.");
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      
      const emailIdx = headers.indexOf("email");
      const passwordIdx = headers.indexOf("password");
      
      if (emailIdx === -1 || passwordIdx === -1) {
        throw new Error("Estructura de la tabla USUARIOS incorrecta.");
      }

      for (let i = 1; i < data.length; i++) {
        if (data[i][emailIdx] && data[i][emailIdx].toString().toLowerCase() === params.email.toLowerCase()) {
          if (data[i][passwordIdx] && data[i][passwordIdx].toString() === params.password.toString()) {
            // Generar objeto de usuario
            let userObj = {};
            headers.forEach((h, idx) => {
              if (h !== "password") {
                userObj[h] = data[i][idx];
              }
            });
            return ContentService.createTextOutput(JSON.stringify({
              status: "success",
              user: userObj
            })).setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Correo o contraseña incorrectos."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // -------------------------------------------------------------
    // ACCIÓN: REGISTRO
    // -------------------------------------------------------------
    else if (params.type === 'register') {
      const sheet = ss.getSheetByName("USUARIOS");
      if (!sheet) throw new Error("La pestaña USUARIOS no existe.");
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      
      const emailIdx = headers.indexOf("email");
      if (emailIdx === -1) throw new Error("Estructura de la tabla USUARIOS incorrecta (falta email).");

      // Verificar si el correo ya existe
      for (let i = 1; i < data.length; i++) {
        if (data[i][emailIdx] && data[i][emailIdx].toString().toLowerCase() === params.email.toLowerCase()) {
          return ContentService.createTextOutput(JSON.stringify({
            status: "error",
            message: "El correo electrónico ya está registrado."
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }

      // Obtener rol por defecto basado en cargo o asignar Empleado
      let role = "Empleado";
      const sheetCargos = ss.getSheetByName("CARGOS");
      if (sheetCargos) {
        const cargosData = sheetCargos.getDataRange().getValues();
        for (let j = 1; j < cargosData.length; j++) {
          if (cargosData[j][0] && cargosData[j][0].toString().toLowerCase() === params.cargo.toLowerCase()) {
            role = cargosData[j][1] || "Empleado";
            break;
          }
        }
      }

      // Asignar avatar aleatorio de los 3 predeterminados o vacio para foto URL en el futuro
      const avatars = ["avatar-1", "avatar-2", "avatar-3"];
      const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];

      const newId = "usr-" + Utilities.getUuid().substring(0, 8);
      
      // Crear fila correspondiente a las cabeceras
      let newRow = [];
      headers.forEach(h => {
        if (h === "id") newRow.push(newId);
        else if (h === "name") newRow.push(params.name);
        else if (h === "identificacion") newRow.push(params.identificacion);
        else if (h === "telefono") newRow.push(params.telefono);
        else if (h === "cargo") newRow.push(params.cargo);
        else if (h === "email") newRow.push(params.email);
        else if (h === "password") newRow.push(params.password);
        else if (h === "rol") newRow.push(role);
        else if (h === "avatar") newRow.push(params.avatarUrl || randomAvatar); // Soporte para foto guardada en celda
        else newRow.push("");
      });

      sheet.appendRow(newRow);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        user: { id: newId, name: params.name, email: params.email, role: role, cargo: params.cargo, telefono: params.telefono, avatar: params.avatarUrl || randomAvatar }
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // -------------------------------------------------------------
    // ACCIÓN: REGISTRO DE ASISTENCIA (CHECK-IN / CHECK-OUT)
    // -------------------------------------------------------------
    else if (params.type === 'check_in_out') {
      const sheet = ss.getSheetByName("REGISTROS");
      if (!sheet) throw new Error("La pestaña REGISTROS no existe.");
      const headers = sheet.getDataRange().getValues()[0];

      // 1. Guardar la firma digital directamente en la celda como código base64
      let signatureUrl = params.signatureBase64 || "";

      // 2. Calcular geocercas y distancia
      let nearestFront = "Fuera de geocerca";
      let minDistance = null;
      
      const sheetFrentes = ss.getSheetByName("FRENTES");
      if (sheetFrentes && params.latitude && params.longitude) {
        const frentesData = sheetFrentes.getDataRange().getValues();
        const fHeaders = frentesData[0];
        const nameCol = fHeaders.indexOf("frente");
        const coordsCol = fHeaders.indexOf("coords");
        const radioCol = fHeaders.indexOf("radio"); // Opcional, radio en metros (ej. 100)

        if (nameCol !== -1 && coordsCol !== -1) {
          for (let k = 1; k < frentesData.length; k++) {
            const frenteName = frentesData[k][nameCol];
            const coordStr = frentesData[k][coordsCol];
            const radioVal = radioCol !== -1 ? parseFloat(frentesData[k][radioCol]) || 100 : 100;
            
            if (coordStr && coordStr.indexOf(",") !== -1) {
              const coordsParts = coordStr.split(",");
              const fLat = parseFloat(coordsParts[0].trim());
              const fLon = parseFloat(coordsParts[1].trim());
              
              if (!isNaN(fLat) && !isNaN(fLon)) {
                const dist = getDistance(params.latitude, params.longitude, fLat, fLon);
                if (minDistance === null || dist < minDistance) {
                  minDistance = Math.round(dist);
                  if (dist <= radioVal) {
                    nearestFront = frenteName;
                  }
                }
              }
            }
          }
        }
      }

      // 3. Registrar marcas de entrada o salida
      const newRecId = "rec-" + Utilities.getUuid().substring(0, 8);
      const timestampStr = new Date().toISOString();

      let newRow = [];
      headers.forEach(h => {
        if (h === "id") newRow.push(newRecId);
        else if (h === "userId") newRow.push(params.userId);
        else if (h === "userName") newRow.push(params.userName);
        else if (h === "type") newRow.push(params.typeAction); // Entrada / Salida
        else if (h === "timestamp") newRow.push(timestampStr);
        else if (h === "latitude") newRow.push(params.latitude || "");
        else if (h === "longitude") newRow.push(params.longitude || "");
        else if (h === "distanceFromPost") newRow.push(minDistance);
        else if (h === "signatureUrl") newRow.push(signatureUrl);
        else if (h === "status") newRow.push("Pendiente");
        else if (h === "userAvatar") newRow.push(params.userAvatar || "avatar-1");
        else if (h === "comments") newRow.push(""); // Comentarios del supervisor
        else if (h === "approvedBy") newRow.push("");
        else if (h === "employeeComments") newRow.push(params.employeeComments || ""); // Comentarios del empleado
        else newRow.push("");
      });

      sheet.appendRow(newRow);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        record: {
          id: newRecId,
          userId: params.userId,
          userName: params.userName,
          type: params.typeAction,
          timestamp: timestampStr,
          latitude: params.latitude,
          longitude: params.longitude,
          distanceFromPost: minDistance,
          signatureUrl: signatureUrl,
          status: "Pendiente",
          userAvatar: params.userAvatar || "avatar-1",
          employeeComments: params.employeeComments || ""
        }
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // -------------------------------------------------------------
    // ACCIÓN: ACTUALIZAR COMENTARIOS DEL EMPLEADO (SOLICITUD DE MODIFICACIÓN)
    // -------------------------------------------------------------
    else if (params.type === 'update_employee_comment') {
      const sheet = ss.getSheetByName("REGISTROS");
      if (!sheet) throw new Error("La pestaña REGISTROS no existe.");
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      
      const idIdx = headers.indexOf("id");
      const empCommIdx = headers.indexOf("employeeComments");
      const statusIdx = headers.indexOf("status");
      
      if (idIdx === -1 || empCommIdx === -1) {
        throw new Error("Estructura de la tabla REGISTROS incorrecta (falta id o employeeComments).");
      }

      for (let i = 1; i < data.length; i++) {
        if (data[i][idIdx] && data[i][idIdx].toString() === params.recordId.toString()) {
          sheet.getRange(i + 1, empCommIdx + 1).setValue(params.employeeComments || "");
          
          // Si estaba rechazado, devolver el estado a "Pendiente" para revisión del supervisor
          if (statusIdx !== -1 && data[i][statusIdx] === "Rechazado") {
            sheet.getRange(i + 1, statusIdx + 1).setValue("Pendiente");
          }
          
          return ContentService.createTextOutput(JSON.stringify({
            status: "success"
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      throw new Error("Registro no encontrado.");
    }

    // -------------------------------------------------------------
    // ACCIÓN: VALIDAR REGISTRO (APROBAR / RECHAZAR)
    // -------------------------------------------------------------
    else if (params.type === 'validate_record') {
      const sheet = ss.getSheetByName("REGISTROS");
      if (!sheet) throw new Error("La pestaña REGISTROS no existe.");
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      
      const idIdx = headers.indexOf("id");
      const statusIdx = headers.indexOf("status");
      const commentsIdx = headers.indexOf("comments");
      const approvedByIdx = headers.indexOf("approvedBy");
      
      if (idIdx === -1 || statusIdx === -1 || commentsIdx === -1 || approvedByIdx === -1) {
        throw new Error("Estructura de la tabla REGISTROS incorrecta.");
      }

      for (let i = 1; i < data.length; i++) {
        if (data[i][idIdx] && data[i][idIdx].toString() === params.recordId.toString()) {
          sheet.getRange(i + 1, statusIdx + 1).setValue(params.status); // Aprobado / Rechazado
          sheet.getRange(i + 1, commentsIdx + 1).setValue(params.comments || "");
          sheet.getRange(i + 1, approvedByIdx + 1).setValue(params.approvedBy || "");
          
          return ContentService.createTextOutput(JSON.stringify({
            status: "success"
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      throw new Error("Registro no encontrado.");
    }

    // -------------------------------------------------------------
    // ACCIÓN: ACTUALIZAR PERFIL
    // -------------------------------------------------------------
    else if (params.type === 'update_profile') {
      const sheet = ss.getSheetByName("USUARIOS");
      if (!sheet) throw new Error("La pestaña USUARIOS no existe.");
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      
      const idIdx = headers.indexOf("id");
      const nameIdx = headers.indexOf("name");
      const phoneIdx = headers.indexOf("telefono");
      const passwordIdx = headers.indexOf("password");
      const avatarIdx = headers.indexOf("avatar");
      
      if (idIdx === -1 || nameIdx === -1 || phoneIdx === -1 || passwordIdx === -1) {
        throw new Error("Estructura de la tabla USUARIOS incorrecta.");
      }

      for (let i = 1; i < data.length; i++) {
        if (data[i][idIdx] && data[i][idIdx].toString() === params.userId.toString()) {
          sheet.getRange(i + 1, nameIdx + 1).setValue(params.name);
          sheet.getRange(i + 1, phoneIdx + 1).setValue(params.telefono);
          if (params.password) {
            sheet.getRange(i + 1, passwordIdx + 1).setValue(params.password);
          }
          if (params.avatarUrl && avatarIdx !== -1) {
            sheet.getRange(i + 1, avatarIdx + 1).setValue(params.avatarUrl);
          }
          return ContentService.createTextOutput(JSON.stringify({
            status: "success"
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      throw new Error("Usuario no encontrado.");
    }

    // -------------------------------------------------------------
    // ACCIÓN: ACTUALIZAR CONFIGURACIÓN DE CARGOS
    // -------------------------------------------------------------
    else if (params.type === 'update_cargos') {
      const sheet = ss.getSheetByName("CARGOS");
      if (!sheet) throw new Error("La pestaña CARGOS no existe.");
      
      // Limpiar datos anteriores (excepto cabecera)
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.deleteRows(2, lastRow - 1);
      }
      
      const items = params.cargos; // Array de { name, role }
      items.forEach(item => {
        sheet.appendRow([item.name, item.role]);
      });
      
      return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // -------------------------------------------------------------
    // ACCIÓN: ACTUALIZAR CONFIGURACIÓN DE FRENTES
    // -------------------------------------------------------------
    else if (params.type === 'update_frentes') {
      const sheet = ss.getSheetByName("FRENTES");
      if (!sheet) throw new Error("La pestaña FRENTES no existe.");
      
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.deleteRows(2, lastRow - 1);
      }
      
      const items = params.frentes; // Array de { name, coords, radio }
      items.forEach(item => {
        sheet.appendRow([item.name, item.coords, item.radio || 100]);
      });
      
      return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    throw new Error("Tipo de acción no reconocida.");
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Fórmula de Haversine para distancia entre dos coordenadas GPS en metros
 */
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radio de la Tierra en metros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c;
  return d;
}
