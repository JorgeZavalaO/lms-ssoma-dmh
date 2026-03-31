import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
  page: {
    // Reducido de 40 → 25 para ganar espacio vertical en A4 landscape
    padding: 25,
    backgroundColor: "#FFFFFF",
    fontFamily: "Helvetica",
  },
  border: {
    border: "3px solid #1e40af",
    // Reducido de 30 → 18 para ganar espacio interior
    padding: 18,
    height: "100%",
    position: "relative",
  },
  innerBorder: {
    border: "1px solid #3b82f6",
    // Reducido de 25 → 15; flexDirection: column para layout correcto
    padding: 15,
    height: "100%",
    flexDirection: "column",
  },
  header: {
    textAlign: "center",
    // Reducido de 30 → 12
    marginBottom: 12,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#1e40af",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 4,
  },
  mainContent: {
    // flexGrow: 1 ocupa el espacio disponible sin desbordar sobre el footer
    flexGrow: 1,
    marginTop: 6,
    marginBottom: 6,
  },
  certificationText: {
    fontSize: 12,
    textAlign: "center",
    // Reducido de 20 → 8
    marginBottom: 8,
    color: "#475569",
  },
  nameContainer: {
    // Reducido de 25 → 10
    marginBottom: 10,
    alignItems: "center",
  },
  nameLabel: {
    fontSize: 11,
    color: "#64748b",
    // Reducido de 5 → 3
    marginBottom: 3,
  },
  name: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0f172a",
    borderBottom: "2px solid #1e40af",
    paddingBottom: 5,
    minWidth: 300,
    textAlign: "center",
  },
  dniText: {
    fontSize: 10,
    color: "#64748b",
    // Reducido de 5 → 3
    marginTop: 3,
  },
  courseInfo: {
    // Reducido de 25 → 10 / 25 → 6
    marginTop: 10,
    marginBottom: 6,
  },
  courseLabel: {
    fontSize: 11,
    color: "#64748b",
    textAlign: "center",
    // Reducido de 8 → 5
    marginBottom: 5,
  },
  courseName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e40af",
    textAlign: "center",
    // Reducido de 15 → 8
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    // Reducido de 20 → 8
    marginTop: 8,
  },
  detailBox: {
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 10,
    color: "#64748b",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
  },
  footer: {
    // Eliminado position:'absolute'/bottom/left/right que causaban el solapamiento.
    // marginTop:'auto' empuja el footer al fondo del contenedor flex column.
    marginTop: "auto",
    paddingHorizontal: 40,
    paddingTop: 8,
    borderTop: "1px solid #e2e8f0",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  qrSection: {
    alignItems: "center",
  },
  qrCode: {
    // Reducido de 80 → 65 para compactar el footer
    width: 65,
    height: 65,
    marginBottom: 4,
  },
  verificationCode: {
    fontSize: 8,
    color: "#64748b",
    textAlign: "center",
  },
  signatureSection: {
    alignItems: "center",
    // Reducido de 10 → 6
    marginTop: 6,
  },
  signatureLine: {
    width: 200,
    borderTop: "1px solid #94a3b8",
    marginBottom: 5,
  },
  signatureText: {
    fontSize: 10,
    color: "#475569",
    textAlign: "center",
  },
  certificateNumber: {
    fontSize: 8,
    color: "#94a3b8",
    textAlign: "right",
    marginTop: 6,
  },
  watermark: {
    position: "absolute",
    // Coordenadas aproximadas al centro de la página landscape
    top: "30%",
    left: "18%",
    // Transform simplificado: react-pdf no soporta translate+rotate combinados
    transform: "rotate(-45deg)",
    fontSize: 96,
    // Color claro propio en lugar de opacity (más compatible con react-pdf)
    color: "#dbeafe",
    fontWeight: "bold",
  },
});
