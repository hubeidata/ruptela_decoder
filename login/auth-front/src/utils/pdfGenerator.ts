// Replica exacta de formatos oficiales
//Firmas y validaciones
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extender el tipo jsPDF para incluir autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface ReportData {
  fecha: string;
  hora: string;
  turno: 'Mañana' | 'Tarde' | 'Relevado';
  responsableNombre: string;
  controladorNombre: string;
  excavadoraInfo: any;
  volquetesInfo: any[];
}

// Función para agregar el encabezado común
const addHeader = (doc: jsPDF, reportNumber: string, reportCode: string, title: string) => {
  // Configurar fuente
  doc.setFont('helvetica', 'normal');
  
  // Rectángulo del encabezado
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(1);
  doc.rect(20, 20, 170, 30);
  
  // Líneas divisorias del encabezado
  doc.line(70, 20, 70, 50); // División vertical izquierda
  doc.line(140, 20, 140, 50); // División vertical derecha
  
  // Logo placeholder (círculo)
  doc.setDrawColor(0, 0, 0);
  doc.setFillColor(230, 230, 250);
  doc.circle(45, 35, 12, 'FD');
  doc.setFontSize(8);
  doc.text('MINERA', 41, 33);
  doc.text('SANTIAGO', 38, 37);
  doc.text('ANANEA', 40, 41);
  
  // Título de la empresa
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('COOPERATIVA MINERA SANTIAGO DE ANANEA LTDA.', 75, 30);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('RUC. 20115133285', 75, 35);
  
  // Información del documento
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Nº ${reportNumber}`, 145, 27);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Código: ${reportCode}`, 145, 32);
  doc.text('FLO ID: 38522', 145, 36);
  doc.text('FAIRTRADE', 145, 40);
  doc.text('Revisión: 01', 145, 44);
  
  // Título del reporte
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(title, 105, 60, { align: 'center' });
  
  return 70; // Retorna la posición Y donde termina el encabezado
};

// Función para agregar información del proceso
const addProcessInfo = (doc: jsPDF, yPosition: number, processInfo: any) => {
  const tableData = [
    ['Proceso:', processInfo.proceso, 'Vigente desde:'],
    ['Subproceso:', processInfo.subproceso, '01/03/2020'],
    ['Tarea:', processInfo.tarea, '']
  ];
  
  doc.autoTable({
    startY: yPosition,
    head: [],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [0, 0, 0]
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 30 },
      1: { cellWidth: 100 },
      2: { fontStyle: 'bold', cellWidth: 30, halign: 'right' },
      3: { cellWidth: 30 }
    },
    tableWidth: 170,
    margin: { left: 20 }
  });
  
  return doc.lastAutoTable.finalY + 10;
};

// Función para agregar información de turno
const addTurnInfo = (doc: jsPDF, yPosition: number, reportData: ReportData) => {
  // Encabezado de coordenadas y turno
  doc.rect(20, yPosition, 170, 15);
  doc.line(20, yPosition + 7, 190, yPosition + 7);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Coordenadas área de extracción / explotación', 25, yPosition + 4);
  doc.text('Fecha', 175, yPosition + 4);
  
  // Secciones de turno
  const turnY = yPosition + 7;
  doc.line(65, turnY, 65, turnY + 8);
  doc.line(110, turnY, 110, turnY + 8);
  doc.line(155, turnY, 155, turnY + 8);
  
  doc.text('Mañana', 30, turnY + 5);
  doc.text('Tarde', 78, turnY + 5);
  doc.text('Relevado', 120, turnY + 5);
  
  // Marcar el turno seleccionado
  let xMark = 45;
  if (reportData.turno === 'Tarde') xMark = 93;
  if (reportData.turno === 'Relevado') xMark = 138;
  
  doc.setFontSize(12);
  doc.text('X', xMark, turnY + 5);
  
  // Fecha
  doc.setFontSize(8);
  doc.text(new Date(reportData.fecha).toLocaleDateString('es-ES'), 160, turnY + 5);
  
  return turnY + 15;
};

// Generar PDF para Control de Origen
export const generateControlOrigenPDF = async (reportData: ReportData) => {
  const doc = new jsPDF();
  
  // Encabezado
  let yPos = addHeader(
    doc, 
    '0001813', 
    'GP1-02-01',
    'Registro control de origen de material y transporte'
  );
  
  // Información del proceso
  yPos = addProcessInfo(doc, yPos, {
    proceso: 'Operación y planta de procesamiento',
    subproceso: 'Obtención de material',
    tarea: 'Movimiento y traslado de material'
  });
  
  // Información de turno
  yPos = addTurnInfo(doc, yPos, reportData);
  
  // Información de excavadora y volquetes
  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Excavadora:', 25, yPos);
  doc.text('Volquetes:', 25, yPos + 15);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Placa: ${reportData.excavadoraInfo?.plate || 'N/A'}`, 70, yPos);
  doc.text(`Código: ${reportData.excavadoraInfo?.code || 'N/A'}`, 120, yPos);
  doc.text('Nombre del Operador: ___________________________', 70, yPos + 7);
  
  // Lista de volquetes
  let volqueteY = yPos + 15;
  doc.text('Placa       Código', 70, volqueteY);
  reportData.volquetesInfo.forEach((volquete, index) => {
    if (index < 3) { // Máximo 3 volquetes en la primera sección
      volqueteY += 7;
      doc.text(`${volquete.plate}    ${volquete.code}`, 70, volqueteY);
    }
  });
  
  volqueteY += 10;
  doc.text('Nombre del Operador: ___________________________', 70, volqueteY);
  
  // Tabla de cargas
  yPos = volqueteY + 20;
  const tableHeaders = [
    'Nº de Carga', 'Hora de Inicio', 'Hora de término', 'Mº extraidos', 
    'Código del Volquete cargado', 'Observaciones'
  ];
  
  const tableData = [];
  for (let i = 1; i <= 25; i++) {
    tableData.push([i.toString(), '', '', '', '', '']);
  }
  
  doc.autoTable({
    startY: yPos,
    head: [tableHeaders],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 2
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' },
      1: { cellWidth: 25 },
      2: { cellWidth: 25 },
      3: { cellWidth: 25 },
      4: { cellWidth: 35 },
      5: { cellWidth: 40 }
    },
    margin: { left: 20, right: 20 }
  });
  
  // Total de material extraído
  const finalY = doc.lastAutoTable.finalY + 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Total de material extraído: ___________________', 25, finalY);
  
  // Firmas
  const signatureY = finalY + 20;
  doc.line(25, signatureY, 90, signatureY);
  doc.line(125, signatureY, 190, signatureY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Firma Operador de Excavadora', 30, signatureY + 5);
  doc.text('Firma del Controlador', 135, signatureY + 5);
  
  doc.text(`Nombre: ${reportData.responsableNombre}`, 25, signatureY + 12);
  doc.text(`Nombre: ${reportData.controladorNombre}`, 125, signatureY + 12);
  
  // Descargar PDF
  doc.save(`Registro_Control_Origen_${reportData.fecha}_${reportData.hora.replace(':', '')}.pdf`);
};

// Generar PDF para Ingreso al Chute
export const generateIngresoCrutePDF = async (reportData: ReportData) => {
  const doc = new jsPDF();
  
  // Encabezado
  let yPos = addHeader(
    doc, 
    '0003443', 
    'GP1-03-01-01',
    'Registro de Ingreso de material al chute'
  );
  
  // Información del proceso
  yPos = addProcessInfo(doc, yPos, {
    proceso: 'Proceso Gravimétrico y cosecha de pre-concentrado',
    subproceso: 'Vaciado de Volquetes a tolvas de acumulación en chute',
    tarea: 'Ingreso de material aurífero al chute'
  });
  
  // Información de turno
  yPos = addTurnInfo(doc, yPos, reportData);
  
  // Personal
  yPos += 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('PERSONAL', 25, yPos);
  doc.text('Nombre', 70, yPos);
  doc.text('Cargo', 150, yPos);
  
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.text('Responsable:', 25, yPos);
  doc.text(reportData.responsableNombre, 70, yPos);
  
  yPos += 7;
  doc.text('Controlador:', 25, yPos);
  doc.text(reportData.controladorNombre, 70, yPos);
  
  // Tabla de viajes
  yPos += 20;
  const tableHeaders = [
    'Nº de Viaje', 'RECEPCIÓN\nMATERIAL\nHORA', 'CÓDIGO DEL\nVOLQUETE', 
    'DESCARGA DE MATERIAL\nMº', 'OBSERVACIONES'
  ];
  
  const subHeaders = ['', '', '', 'Chute 1', 'Chute 2', 'Chute 3', ''];
  
  const tableData = [];
  for (let i = 1; i <= 25; i++) {
    tableData.push([i.toString(), '', '', '', '', '', '']);
  }
  
  doc.autoTable({
    startY: yPos,
    head: [tableHeaders, subHeaders],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 2
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' },
      1: { cellWidth: 25 },
      2: { cellWidth: 30 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25 },
      5: { cellWidth: 25 },
      6: { cellWidth: 30 }
    },
    margin: { left: 20, right: 20 }
  });
  
  // Total de material procesado
  const finalY = doc.lastAutoTable.finalY + 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Total material (Mº) procesados en el turno: ___________________', 25, finalY);
  
  // Firmas
  const signatureY = finalY + 20;
  doc.line(25, signatureY, 90, signatureY);
  doc.line(125, signatureY, 190, signatureY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Firma de Responsable', 35, signatureY + 5);
  doc.text('Firma del Controlador', 135, signatureY + 5);
  
  doc.text(`Nombre: ${reportData.responsableNombre}`, 25, signatureY + 12);
  doc.text(`Nombre: ${reportData.controladorNombre}`, 125, signatureY + 12);
  
  // Descargar PDF
  doc.save(`Registro_Ingreso_Chute_${reportData.fecha}_${reportData.hora.replace(':', '')}.pdf`);
};