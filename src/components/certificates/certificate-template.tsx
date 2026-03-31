import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { CertificateData } from '@/lib/certificates'

// Estilos profesionales para el certificado
const styles = StyleSheet.create({
  page: {
    padding: 25,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  border: {
    border: '3px solid #1e40af',
    padding: 18,
    height: '100%',
    position: 'relative',
  },
  innerBorder: {
    border: '1px solid #3b82f6',
    padding: 15,
    height: '100%',
    flexDirection: 'column',
  },
  header: {
    textAlign: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  mainContent: {
    flexGrow: 1,
    marginTop: 6,
    marginBottom: 6,
  },
  certificationText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
    color: '#475569',
  },
  nameContainer: {
    marginBottom: 10,
    alignItems: 'center',
  },
  nameLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 3,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
    borderBottom: '2px solid #1e40af',
    paddingBottom: 5,
    minWidth: 300,
    textAlign: 'center',
  },
  dniText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 3,
  },
  courseInfo: {
    marginTop: 10,
    marginBottom: 6,
  },
  courseLabel: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 5,
  },
  courseName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e40af',
    textAlign: 'center',
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  detailBox: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  footer: {
    marginTop: 'auto',
    paddingHorizontal: 40,
    paddingTop: 8,
    borderTop: '1px solid #e2e8f0',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  qrSection: {
    alignItems: 'center',
  },
  qrCode: {
    width: 65,
    height: 65,
    marginBottom: 4,
  },
  verificationCode: {
    fontSize: 8,
    color: '#64748b',
    textAlign: 'center',
  },
  signatureSection: {
    alignItems: 'center',
    marginTop: 6,
  },
  signatureLine: {
    width: 200,
    borderTop: '1px solid #94a3b8',
    marginBottom: 5,
  },
  signatureText: {
    fontSize: 10,
    color: '#475569',
    textAlign: 'center',
  },
  certificateNumber: {
    fontSize: 8,
    color: '#94a3b8',
    textAlign: 'right',
    marginTop: 6,
  },
  watermark: {
    position: 'absolute',
    top: '30%',
    left: '18%',
    transform: 'rotate(-45deg)',
    fontSize: 96,
    color: '#dbeafe',
    fontWeight: 'bold',
  },
})

interface CertificateTemplateProps {
  data: CertificateData
}

export const CertificateTemplate: React.FC<CertificateTemplateProps> = ({
  data,
}) => {
  const formattedDate = format(new Date(data.issuedAt), "dd 'de' MMMM 'de' yyyy", {
    locale: es,
  })

  const expiryText = data.expiresAt
    ? `Válido hasta: ${format(new Date(data.expiresAt), "dd/MM/yyyy", { locale: es })}`
    : 'Certificado sin vencimiento'

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.border}>
          <View style={styles.innerBorder}>
            {/* Marca de agua */}
            <Text style={styles.watermark}>SSOMA</Text>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Certificado</Text>
              <Text style={styles.subtitle}>
                Sistema de Gestión de Capacitación SSOMA
              </Text>
              <Text style={styles.subtitle}>Distribuidora de Mangueras Hidráulicas S.A.C.</Text>
            </View>

            {/* Main Content */}
            <View style={styles.mainContent}>
              <Text style={styles.certificationText}>
                Se certifica que
              </Text>

              {/* Nombre del colaborador */}
              <View style={styles.nameContainer}>
                <Text style={styles.nameLabel}>Colaborador</Text>
                <Text style={styles.name}>{data.collaboratorName}</Text>
                <Text style={styles.dniText}>DNI: {data.collaboratorDni}</Text>
              </View>

              {/* Información del curso */}
              <View style={styles.courseInfo}>
                <Text style={styles.courseLabel}>
                  Ha completado satisfactoriamente el curso:
                </Text>
                <Text style={styles.courseName}>{data.courseName}</Text>

                {/* Detalles */}
                <View style={styles.detailsRow}>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>DURACIÓN</Text>
                    <Text style={styles.detailValue}>
                      {data.courseHours} horas
                    </Text>
                  </View>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>CALIFICACIÓN</Text>
                    <Text style={styles.detailValue}>
                      {data.score.toFixed(0)}%
                    </Text>
                  </View>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>FECHA DE EMISIÓN</Text>
                    <Text style={styles.detailValue}>{formattedDate}</Text>
                  </View>
                </View>
              </View>

              <Text
                style={{
                  fontSize: 9,
                  color: '#64748b',
                  textAlign: 'center',
                  marginTop: 6,
                }}
              >
                {expiryText}
              </Text>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <View style={styles.footerRow}>
                {/* QR Code */}
                <View style={styles.qrSection}>
                  <Image src={data.qrCodeDataUrl} style={styles.qrCode} />
                  <Text style={styles.verificationCode}>
                    Código: {data.verificationCode}
                  </Text>
                  <Text style={styles.verificationCode}>Verificar en:</Text>
                  <Text style={styles.verificationCode}>
                    {process.env.NEXT_PUBLIC_APP_URL || 'app.dmh.com'}/verify
                  </Text>
                </View>

                {/* Firma */}
                <View style={styles.signatureSection}>
                  <View style={styles.signatureLine} />
                  <Text style={styles.signatureText}>
                    Responsable de Capacitación
                  </Text>
                  <Text style={styles.signatureText}>SSOMA - DMH</Text>
                </View>
              </View>

              <Text style={styles.certificateNumber}>
                N° Certificado: {data.certificateNumber}
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}
