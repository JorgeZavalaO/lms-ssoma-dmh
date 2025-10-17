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
    padding: 40,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  border: {
    border: '3px solid #1e40af',
    padding: 30,
    height: '100%',
    position: 'relative',
  },
  innerBorder: {
    border: '1px solid #3b82f6',
    padding: 25,
    height: '100%',
  },
  header: {
    textAlign: 'center',
    marginBottom: 30,
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
    marginTop: 20,
    marginBottom: 20,
  },
  certificationText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
    color: '#475569',
  },
  nameContainer: {
    marginBottom: 25,
    alignItems: 'center',
  },
  nameLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 5,
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
    marginTop: 5,
  },
  courseInfo: {
    marginTop: 25,
    marginBottom: 25,
  },
  courseLabel: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 8,
  },
  courseName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e40af',
    textAlign: 'center',
    marginBottom: 15,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
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
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    paddingHorizontal: 60,
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
    width: 80,
    height: 80,
    marginBottom: 5,
  },
  verificationCode: {
    fontSize: 8,
    color: '#64748b',
    textAlign: 'center',
  },
  signatureSection: {
    alignItems: 'center',
    marginTop: 10,
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
    marginTop: 10,
  },
  watermark: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(-45deg)',
    fontSize: 100,
    color: '#f1f5f9',
    opacity: 0.1,
    zIndex: -1,
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
              <Text style={styles.subtitle}>DMH Construcciones y Servicios</Text>
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
                  marginTop: 15,
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
