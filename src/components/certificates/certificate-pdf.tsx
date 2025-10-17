import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  Image,
} from '@react-pdf/renderer'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { CertificateData } from '@/lib/certificates'
import { styles } from './certificate-styles'

/**
 * Función que crea el Document para generar el PDF
 * Esta se puede llamar directamente desde los API routes
 */
export function createCertificatePDF(data: CertificateData) {
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
