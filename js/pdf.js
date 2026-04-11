export function baixarPDF(lista) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.text("Catálogo", 10, 10);
  doc.save("catalogo.pdf");
}