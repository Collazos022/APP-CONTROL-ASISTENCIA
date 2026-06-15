/**
 * ASSAM - API Backend v1.1 (Control de Asistencia)
 */

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    const readSheet = (name, hasHeaders = true) => {
      const sheet = ss.getSheetByName(name);
      if (!sheet) return [];
      const data = sheet.getDataRange().getValues();
      if (!hasHeaders || data.length < 2) return [];
      const formulas = sheet.getDataRange().getFormulas();
      const headers = data[0];
      return data.slice(1).map((row, rowIndex) => {
        let obj = { _rowIndex: rowIndex + 2 };
        headers.forEach((h, i) => {
          if (h) {
            if (row[i] instanceof Date) {
              if (h === "Hora_Entrada" || h === "Hora_Salida") {
                obj[h] = Utilities.formatDate(row[i], ss.getSpreadsheetTimeZone(), "HH:mm");
              } else if (h === "Fecha") {
                obj[h] = Utilities.formatDate(row[i], ss.getSpreadsheetTimeZone(), "yyyy-MM-dd");
              } else {
                obj[h] = row[i].toISOString();
              }
            } else {
              obj[h] = row[i] !== "" ? row[i] : null;
            }
            if (formulas[rowIndex + 1][i] !== "") {
              if (!obj._formulas) obj._formulas = {};
              obj._formulas[h] = formulas[rowIndex + 1][i];
            }
          }
        });
        return obj;
      }).filter(r => r[headers[0]]); 
    };

    const getHeaders = (name) => {
      const sheet = ss.getSheetByName(name);
      if (!sheet) return [];
      const data = sheet.getDataRange().getValues();
      if (data.length === 0) return [];
      return data[0].filter(h => h !== "");
    };

    // Especial para cargos, leer columnas D y E de la pestaña Validacion
    const sheetCargos = ss.getSheetByName("Validacion");
    let cargosList = [];
    if (sheetCargos) {
       const cData = sheetCargos.getDataRange().getValues();
       for(let i=1; i<cData.length; i++){
          if(cData[i][3]) { // Columna D (índice 3)
            cargosList.push({
               Cargo: cData[i][3],
               Rol_App: cData[i][4] || "Empleado"
            });
          }
       }
    }

    return ContentService.createTextOutput(JSON.stringify({ 
      status: "success", 
      registros: readSheet("Registros_HT"), 
      usuarios: readSheet("USUARIOS"),
      cargos: cargosList,
      frentes: readSheet("FRENTES"),
      permisos: readSheet("PERMISOS"),
      headers: {
        REGISTROS: getHeaders("Registros_HT"),
        USUARIOS: getHeaders("USUARIOS"),
        CARGOS: ["Cargo", "Rol_App"],
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
      
      const emailIdx = headers.indexOf("Email_Usuario");
      const passwordIdx = headers.indexOf("Credencial");
      
      if (emailIdx === -1 || passwordIdx === -1) {
        throw new Error("Estructura de la tabla USUARIOS incorrecta. Faltan columnas Email_Usuario o Credencial.");
      }

      for (let i = 1; i < data.length; i++) {
        if (data[i][emailIdx] && data[i][emailIdx].toString().toLowerCase() === params.email.toLowerCase()) {
          if (data[i][passwordIdx] && data[i][passwordIdx].toString() === params.password.toString()) {
            
            const getVal = (colName) => {
              const idx = headers.findIndex(h => h.toString().trim().toLowerCase() === colName.toString().trim().toLowerCase());
              return idx !== -1 ? data[i][idx] : "";
            };

            const userObj = {
               id: getVal("Email_Usuario"), // Use email as unique identifier
               name: getVal("Nombre_Apellido"),
               email: getVal("Email_Usuario"),
               identificacion: getVal("Identificacion"),
               telefono: getVal("Telefono"),
               cargo: getVal("Cargo"),
               role: getVal("Rol_App") || "Empleado",
               avatar: getVal("Foto") || getVal("Avatar") || "avatar-1",
               huella: getVal("Huella_ID_Credencial") || ""
            };

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
      let data = sheet.getDataRange().getValues();
      let headers = data[0];
      
      const emailIdx = headers.indexOf("Email_Usuario");
      if (emailIdx === -1) throw new Error("Estructura de la tabla USUARIOS incorrecta (falta Email_Usuario).");

      for (let i = 1; i < data.length; i++) {
        if (data[i][emailIdx] && data[i][emailIdx].toString().toLowerCase() === params.email.toLowerCase()) {
          return ContentService.createTextOutput(JSON.stringify({
            status: "error",
            message: "El correo electrónico ya está registrado."
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }

      let role = "Empleado";
      const sheetCargos = ss.getSheetByName("Validacion");
      if (sheetCargos) {
        const cargosData = sheetCargos.getDataRange().getValues();
        for (let j = 1; j < cargosData.length; j++) {
          if (cargosData[j][3] && cargosData[j][3].toString().toLowerCase() === params.cargo.toLowerCase()) {
            role = cargosData[j][4] || "Empleado";
            break;
          }
        }
      }

      // Foto de un soldador por defecto de Unsplash
      const defaultAvatar = "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=150&auto=format&fit=crop";

      let newRow = [];
      headers.forEach(h => {
        if (h === "Nombre_Apellido") newRow.push(params.name);
        else if (h === "Identificacion") newRow.push(params.identificacion);
        else if (h === "Telefono") newRow.push(params.telefono);
        else if (h === "Cargo") newRow.push(params.cargo);
        else if (h === "Email_Usuario") newRow.push(params.email);
        else if (h === "Credencial") newRow.push(params.password);
        else if (h === "Rol_App") newRow.push(role);
        else if (h === "Fecha_Ingreso") newRow.push(new Date().toISOString().split('T')[0]);
        else if (h === "Estado") newRow.push("Activo");
        else if (h === "Foto") newRow.push(defaultAvatar);
        else if (h === "Huella_Registrada") newRow.push(params.huella ? "SI" : "NO");
        else if (h === "Huella_ID_Credencial") newRow.push(params.huella || "");
        else if (h === "Huella_Llave_Publica") newRow.push(params.huella ? "PUBLIC_KEY_SIMULATED" : "");
        else newRow.push("");
      });

      sheet.appendRow(newRow);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        user: { 
          id: params.email, 
          name: params.name, 
          email: params.email, 
          role: role, 
          cargo: params.cargo, 
          telefono: params.telefono, 
          avatar: defaultAvatar,
          huella: params.huella || ""
        }
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // -------------------------------------------------------------
    // ACCIÓN: ACTUALIZAR PERMISOS
    // -------------------------------------------------------------
    else if (params.type === 'update_permisos') {
      let sheet = ss.getSheetByName("PERMISOS");
      if (!sheet) {
        sheet = ss.insertSheet("PERMISOS");
      } else {
        sheet.clear();
      }
      
      const allRoles = ['Administrador', 'Editor', 'Aprobador', 'Empleado'];
      const headers = ["Modulo", ...allRoles];
      sheet.appendRow(headers);
      
      if (params.permisos && Array.isArray(params.permisos)) {
        params.permisos.forEach(p => {
           let row = [p.label];
           allRoles.forEach(r => {
             row.push(p.roles.includes(r) ? true : false);
           });
           sheet.appendRow(row);
        });
      }
      
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "success", 
        message: "Permisos actualizados correctamente"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // -------------------------------------------------------------
    // ACCIÓN: REGISTRO DE ASISTENCIA (CHECK-IN / CHECK-OUT)
    // -------------------------------------------------------------
    else if (params.type === 'check_in_out') {
      const sheet = ss.getSheetByName("Registros_HT");
      if (!sheet) throw new Error("La pestaña Registros_HT no existe.");
      let headers = sheet.getDataRange().getValues()[0];
      
      let signatureUrl = params.signatureBase64 || "";
      let nearestFront = "Fuera de Rango";
      let minDistance = null;
      
      const sheetFrentes = ss.getSheetByName("FRENTES");
      if (sheetFrentes && params.latitude && params.longitude) {
        const frentesData = sheetFrentes.getDataRange().getValues();
        const fHeaders = frentesData[0];
        const nameCol = fHeaders.indexOf("Frentes de trabajo");
        const coordsCol = fHeaders.indexOf("Coords");
        const radioCol = fHeaders.indexOf("Radio"); 

        if (nameCol !== -1 && coordsCol !== -1) {
          for (let k = 1; k < frentesData.length; k++) {
            const frenteName = frentesData[k][nameCol];
            const coordStr = frentesData[k][coordsCol];
            const radioKm = radioCol !== -1 ? parseFloat(frentesData[k][radioCol]) : 0.1;
            const radioVal = radioKm * 1000;
            
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

      const timestampStr = params.clientTime || new Date().toISOString();
      const todayStr = params.clientDate || (params.clientTime ? new Date().toISOString().split('T')[0] : timestampStr.split('T')[0]);

      const data = sheet.getDataRange().getValues();
      const emailIdx = headers.indexOf("Email_Usuario");
      const fechaIdx = headers.indexOf("Fecha");
      const horaEntradaIdx = headers.indexOf("Hora_Entrada");
      const horaSalidaIdx = headers.indexOf("Hora_Salida");
      const firmaEntradaIdx = headers.indexOf("Firma_Entrada");
      const firmaSalidaIdx = headers.indexOf("Firma_Salida");
      const comentarioEmpleadoIdx = headers.indexOf("Comentarios");
      const horasTrabajadasIdx = headers.indexOf("Horas_Trabajadas");
      const horasExtraIdx = headers.indexOf("Horas_Extra");
      const huellaEntradaIdx = headers.indexOf("Huella_Entrada");
      const huellaSalidaIdx = headers.indexOf("Huella_Salida");

      if (horasTrabajadasIdx === -1 || horasExtraIdx === -1) {
        throw new Error("Estructura de Registros_HT incorrecta (Faltan columnas requeridas: Horas_Trabajadas o Horas_Extra).");
      }

      let existingRowIdx = -1;
      let newRecId = "rec-" + Utilities.getUuid().substring(0, 8);

      // Buscar si el usuario tiene un turno ABIERTO hoy (sin Hora_Salida)
      // Buscamos de abajo hacia arriba para encontrar el más reciente
      for (let i = data.length - 1; i >= 1; i--) {
        if (emailIdx !== -1 && fechaIdx !== -1) {
           let rEmail = data[i][emailIdx];
           let rFecha = data[i][fechaIdx];
           let rFechaStr = rFecha instanceof Date ? Utilities.formatDate(rFecha, ss.getSpreadsheetTimeZone(), "yyyy-MM-dd") : String(rFecha).split('T')[0];
           if (rEmail === params.userId && rFechaStr === todayStr) { 
              let rHoraSalida = horaSalidaIdx !== -1 ? data[i][horaSalidaIdx] : "";
              // Solo actualizamos la fila si el turno actual sigue ABIERTO
              if (!rHoraSalida) {
                 existingRowIdx = i;
                 newRecId = data[i][headers.indexOf("ID_Registro")] || newRecId;
                 break;
              }
           }
        }
      }

      const isCheckIn = params.typeAction === 'Entrada';

      if (existingRowIdx !== -1) {
        // Update existing row (Salida)
        if (!isCheckIn) {
            if(horaSalidaIdx !== -1) sheet.getRange(existingRowIdx + 1, horaSalidaIdx + 1).setValue(timestampStr);
            if(firmaSalidaIdx !== -1) sheet.getRange(existingRowIdx + 1, firmaSalidaIdx + 1).setValue(signatureUrl);
            if(huellaSalidaIdx !== -1 && params.huellaStatus) sheet.getRange(existingRowIdx + 1, huellaSalidaIdx + 1).setValue(params.huellaStatus);
            if(comentarioEmpleadoIdx !== -1 && params.employeeComments) sheet.getRange(existingRowIdx + 1, comentarioEmpleadoIdx + 1).setValue(params.employeeComments);
            
            // Validar y asegurar que la fila 2 tenga las fórmulas correctas para evitar propagar errores
            const DEFAULT_FORMULA_TRABAJADAS = '=IF(OR(ISBLANK(Registro_HL[Hora_Entrada]), ISBLANK(Registro_HL[Hora_Salida])), "", ROUND(MOD(Registro_HL[Hora_Salida] - Registro_HL[Hora_Entrada], 1) * 24, 2))';
            const DEFAULT_FORMULA_EXTRA = '=IF(ISBLANK(Registro_HL[Horas_Trabajadas]), "", ROUND(MAX(0, Registro_HL[Horas_Trabajadas] - 10), 2))';
            
            try {
              const formula2Trabajadas = sheet.getRange(2, horasTrabajadasIdx + 1).getFormula();
              const formula2Extra = sheet.getRange(2, horasExtraIdx + 1).getFormula();
              
              if (!formula2Trabajadas || formula2Trabajadas.trim() === "" || formula2Trabajadas.includes("#ERROR") || formula2Trabajadas.includes("RC5") || formula2Trabajadas.includes("RC7") || formula2Trabajadas.includes("RC[-") || formula2Trabajadas.includes("RC9")) {
                sheet.getRange(2, horasTrabajadasIdx + 1).setFormula(DEFAULT_FORMULA_TRABAJADAS);
              }
              if (!formula2Extra || formula2Extra.trim() === "" || formula2Extra.includes("#ERROR") || formula2Extra.includes("RC5") || formula2Extra.includes("RC7") || formula2Extra.includes("RC[-") || formula2Extra.includes("RC9")) {
                sheet.getRange(2, horasExtraIdx + 1).setFormula(DEFAULT_FORMULA_EXTRA);
              }
            } catch(e) {
              // Fallback
            }
            
            // Copiar las fórmulas usando copyTo nativo de celdas desde la fila 2 para que Google Sheets haga el mapeo de tabla relativo
            try {
              const sourceRange = sheet.getRange(2, horasTrabajadasIdx + 1, 1, 2);
              const targetRange = sheet.getRange(existingRowIdx + 1, horasTrabajadasIdx + 1, 1, 2);
              sourceRange.copyTo(targetRange, SpreadsheetApp.CopyPasteType.PASTE_FORMULA, false);
            } catch(e) {
              // Fallback
            }
        } else {
            if(horaEntradaIdx !== -1) sheet.getRange(existingRowIdx + 1, horaEntradaIdx + 1).setValue(timestampStr);
            if(firmaEntradaIdx !== -1) sheet.getRange(existingRowIdx + 1, firmaEntradaIdx + 1).setValue(signatureUrl);
            if(huellaEntradaIdx !== -1 && params.huellaStatus) sheet.getRange(existingRowIdx + 1, huellaEntradaIdx + 1).setValue(params.huellaStatus);
            if(comentarioEmpleadoIdx !== -1 && params.employeeComments) sheet.getRange(existingRowIdx + 1, comentarioEmpleadoIdx + 1).setValue(params.employeeComments);
        }
      } else {
        // Create new row (Entrada)
        let newRow = [];
        headers.forEach(h => {
          if (h === "ID_Registro") newRow.push(newRecId);
          else if (h === "Email_Usuario") newRow.push(params.userId); // el userId del frontend es el email
          else if (h === "Fecha") newRow.push(todayStr);
          else if (h === "Frente_de_Trabajo") newRow.push(nearestFront);
          else if (h === "Hora_Entrada") newRow.push(isCheckIn ? timestampStr : "");
          else if (h === "Firma_Entrada") newRow.push(isCheckIn ? signatureUrl : "");
          else if (h === "Hora_Salida") newRow.push(!isCheckIn ? timestampStr : "");
          else if (h === "Firma_Salida") newRow.push(!isCheckIn ? signatureUrl : "");
          else if (h === "Aprobacion") newRow.push("Pendiente");
          else if (h === "Comentario") newRow.push("");
          else if (h === "Aprobador") newRow.push("");
          else if (h === "Comentarios") newRow.push(params.employeeComments || "");
          else if (h === "Horas_Trabajadas") newRow.push(""); // Se llenará con fórmula abajo
          else if (h === "Horas_Extra") newRow.push(""); // Se llenará con fórmula abajo
          // Si el usuario añade estas columnas, se llenarán:
          else if (h === "Latitud") newRow.push(params.latitude || ""); 
          else if (h === "Longitud") newRow.push(params.longitude || "");
          else if (h === "Huella_Entrada") newRow.push(isCheckIn ? (params.huellaStatus || "SIN_HUELLA") : "");
          else if (h === "Huella_Salida") newRow.push(!isCheckIn ? (params.huellaStatus || "SIN_HUELLA") : "");
          else newRow.push("");
        });
        sheet.appendRow(newRow);
        
        // Escribir fórmulas en la nueva fila creada copiando la fila 2 usando copyTo nativo
        const lastRow = sheet.getLastRow();
        if (lastRow > 2) {
          const DEFAULT_FORMULA_TRABAJADAS = '=IF(OR(ISBLANK(Registro_HL[Hora_Entrada]), ISBLANK(Registro_HL[Hora_Salida])), "", ROUND(MOD(Registro_HL[Hora_Salida] - Registro_HL[Hora_Entrada], 1) * 24, 2))';
          const DEFAULT_FORMULA_EXTRA = '=IF(ISBLANK(Registro_HL[Horas_Trabajadas]), "", ROUND(MAX(0, Registro_HL[Horas_Trabajadas] - 10), 2))';
          
          try {
            const formula2Trabajadas = sheet.getRange(2, horasTrabajadasIdx + 1).getFormula();
            const formula2Extra = sheet.getRange(2, horasExtraIdx + 1).getFormula();
            
            if (!formula2Trabajadas || formula2Trabajadas.trim() === "" || formula2Trabajadas.includes("#ERROR") || formula2Trabajadas.includes("RC5") || formula2Trabajadas.includes("RC7") || formula2Trabajadas.includes("RC[-") || formula2Trabajadas.includes("RC9")) {
              sheet.getRange(2, horasTrabajadasIdx + 1).setFormula(DEFAULT_FORMULA_TRABAJADAS);
            }
            if (!formula2Extra || formula2Extra.trim() === "" || formula2Extra.includes("#ERROR") || formula2Extra.includes("RC5") || formula2Extra.includes("RC7") || formula2Extra.includes("RC[-") || formula2Extra.includes("RC9")) {
              sheet.getRange(2, horasExtraIdx + 1).setFormula(DEFAULT_FORMULA_EXTRA);
            }
          } catch(e) {
            // Fallback
          }
          
          // Copiar las fórmulas usando copyTo nativo de celdas desde la fila 2
          try {
            const sourceRange = sheet.getRange(2, horasTrabajadasIdx + 1, 1, 2);
            const targetRange = sheet.getRange(lastRow, horasTrabajadasIdx + 1, 1, 2);
            sourceRange.copyTo(targetRange, SpreadsheetApp.CopyPasteType.PASTE_FORMULA, false);
          } catch(e) {
            // Fallback
          }
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        record: {
          id: newRecId,
          userId: params.userId,
          userName: params.userName,
          type: params.typeAction,
          timestamp: params.clientTime ? (todayStr + "T" + timestampStr + ":00") : timestampStr,
          latitude: params.latitude,
          longitude: params.longitude,
          distanceFromPost: minDistance,
          signatureUrl: signatureUrl,
          status: "Pendiente",
          userAvatar: params.userAvatar || "avatar-1",
          employeeComments: params.employeeComments || "",
          huellaStatus: params.huellaStatus || "SIN_HUELLA"
        }
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // -------------------------------------------------------------
    // ACCIÓN: ACTUALIZAR COMENTARIOS DEL EMPLEADO
    // -------------------------------------------------------------
    else if (params.type === 'update_employee_comment') {
      const sheet = ss.getSheetByName("Registros_HT");
      if (!sheet) throw new Error("La pestaña Registros_HT no existe.");
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      
      const idIdx = headers.indexOf("ID_Registro");
      const empCommIdx = headers.indexOf("Comentarios"); 
      const statusIdx = headers.indexOf("Aprobacion");
      const horaEntradaIdx = headers.indexOf("Hora_Entrada");
      const horaSalidaIdx = headers.indexOf("Hora_Salida");
      const horasTrabajadasIdx = headers.indexOf("Horas_Trabajadas");
      const horasExtraIdx = headers.indexOf("Horas_Extra");
      
      if (idIdx === -1 || empCommIdx === -1 || statusIdx === -1 || horaEntradaIdx === -1 || horaSalidaIdx === -1 || horasTrabajadasIdx === -1 || horasExtraIdx === -1) {
        throw new Error("Estructura de Registros_HT incorrecta (Faltan columnas requeridas).");
      }

      for (let i = 1; i < data.length; i++) {
        if (data[i][idIdx] && data[i][idIdx].toString() === params.recordId.toString()) {
          sheet.getRange(i + 1, empCommIdx + 1).setValue(params.employeeComments || "");
          if (params.checkInTime !== undefined) {
            sheet.getRange(i + 1, horaEntradaIdx + 1).setValue(params.checkInTime);
          }
          if (params.checkOutTime !== undefined) {
            sheet.getRange(i + 1, horaSalidaIdx + 1).setValue(params.checkOutTime);
          }
          
          // Escribir Fórmulas copiando de la fila 2 de la tabla usando copyTo nativo
          const DEFAULT_FORMULA_TRABAJADAS = '=IF(OR(ISBLANK(Registro_HL[Hora_Entrada]), ISBLANK(Registro_HL[Hora_Salida])), "", ROUND(MOD(Registro_HL[Hora_Salida] - Registro_HL[Hora_Entrada], 1) * 24, 2))';
          const DEFAULT_FORMULA_EXTRA = '=IF(ISBLANK(Registro_HL[Horas_Trabajadas]), "", ROUND(MAX(0, Registro_HL[Horas_Trabajadas] - 10), 2))';
          
          try {
            const formula2Trabajadas = sheet.getRange(2, horasTrabajadasIdx + 1).getFormula();
            const formula2Extra = sheet.getRange(2, horasExtraIdx + 1).getFormula();
            
            if (!formula2Trabajadas || formula2Trabajadas.trim() === "" || formula2Trabajadas.includes("#ERROR") || formula2Trabajadas.includes("RC5") || formula2Trabajadas.includes("RC7") || formula2Trabajadas.includes("RC[-") || formula2Trabajadas.includes("RC9")) {
              sheet.getRange(2, horasTrabajadasIdx + 1).setFormula(DEFAULT_FORMULA_TRABAJADAS);
            }
            if (!formula2Extra || formula2Extra.trim() === "" || formula2Extra.includes("#ERROR") || formula2Extra.includes("RC5") || formula2Extra.includes("RC7") || formula2Extra.includes("RC[-") || formula2Extra.includes("RC9")) {
              sheet.getRange(2, horasExtraIdx + 1).setFormula(DEFAULT_FORMULA_EXTRA);
            }
          } catch(e) {
            // Fallback
          }
          
          // Copiar las fórmulas usando copyTo nativo de celdas desde la fila 2
          try {
            const sourceRange = sheet.getRange(2, horasTrabajadasIdx + 1, 1, 2);
            const targetRange = sheet.getRange(i + 1, horasTrabajadasIdx + 1, 1, 2);
            sourceRange.copyTo(targetRange, SpreadsheetApp.CopyPasteType.PASTE_FORMULA, false);
          } catch(e) {
            // Fallback
          }

          if (data[i][statusIdx] === "Rechazado") {
            sheet.getRange(i + 1, statusIdx + 1).setValue("Pendiente");
          }
          return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      throw new Error("Registro no encontrado.");
    }

    // -------------------------------------------------------------
    // ACCIÓN: VALIDAR REGISTRO (APROBAR / RECHAZAR)
    // -------------------------------------------------------------
    else if (params.type === 'validate_record') {
      const sheet = ss.getSheetByName("Registros_HT");
      if (!sheet) throw new Error("La pestaña Registros_HT no existe.");
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      
      const idIdx = headers.indexOf("ID_Registro");
      const statusIdx = headers.indexOf("Aprobacion");
      const commentsIdx = headers.indexOf("Comentarios");
      const approvedByIdx = headers.indexOf("Aprobador");
      
      if (idIdx === -1 || statusIdx === -1 || commentsIdx === -1 || approvedByIdx === -1) {
        throw new Error("Estructura de Registros_HT incorrecta (Faltan columnas requeridas).");
      }

      for (let i = 1; i < data.length; i++) {
        if (data[i][idIdx] && data[i][idIdx].toString() === params.recordId.toString()) {
          sheet.getRange(i + 1, statusIdx + 1).setValue(params.status);
          sheet.getRange(i + 1, commentsIdx + 1).setValue(params.comments || "");
          sheet.getRange(i + 1, approvedByIdx + 1).setValue(params.approvedBy || "");
          return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
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
      let data = sheet.getDataRange().getValues();
      let headers = data[0];
      
      const idIdx = headers.indexOf("Email_Usuario");
      const nameIdx = headers.indexOf("Nombre_Apellido");
      const phoneIdx = headers.indexOf("Telefono");
      const passwordIdx = headers.indexOf("Credencial");
      const photoIdx = headers.indexOf("Foto");

      const registeredIdx = headers.indexOf("Huella_Registrada");
      const credIdIdx = headers.indexOf("Huella_ID_Credencial");
      const pubKeyIdx = headers.indexOf("Huella_Llave_Publica");
      
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
          if (photoIdx !== -1 && params.avatarUrl) {
            sheet.getRange(i + 1, photoIdx + 1).setValue(params.avatarUrl);
          }
          if (params.huella !== undefined) {
            if (registeredIdx !== -1) sheet.getRange(i + 1, registeredIdx + 1).setValue(params.huella ? "SI" : "NO");
            if (credIdIdx !== -1) sheet.getRange(i + 1, credIdIdx + 1).setValue(params.huella || "");
            if (pubKeyIdx !== -1) sheet.getRange(i + 1, pubKeyIdx + 1).setValue(params.huella ? "PUBLIC_KEY_SIMULATED" : "");
          }
          return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Usuario no encontrado." })).setMimeType(ContentService.MimeType.JSON);
      
    } else if (params.type === 'update_cargos') {
      const sheet = ss.getSheetByName("Validacion");
      if (!sheet) throw new Error("La pestaña Validacion no existe.");
      // params.cargos es un arreglo [{name, role}]
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][3]) { // Columna D es índice 3
          const cargoObj = params.cargos.find(c => c.name.toString().toLowerCase() === data[i][3].toString().toLowerCase());
          if (cargoObj) {
            sheet.getRange(i + 1, 5).setValue(cargoObj.role); // Columna E es índice 4, columna 5 en getRange
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
      
    } else if (params.type === 'update_frentes') {
      const sheet = ss.getSheetByName("FRENTES");
      if (!sheet) throw new Error("La pestaña FRENTES no existe.");
      
      // Limpiar datos existentes menos cabeceras
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.getRange(2, 1, lastRow - 1, 3).clearContent();
      }
      
      // Escribir los nuevos frentes (reemplazo completo)
      if (params.frentes && params.frentes.length > 0) {
        const rows = params.frentes.map(f => [f.name, f.coords, f.radio]);
        sheet.getRange(2, 1, rows.length, 3).setValues(rows);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
    }
    
    throw new Error("Tipo de acción no reconocida.");
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

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
