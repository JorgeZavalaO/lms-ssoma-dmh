import { StyleSheet } from '@react-pdf/renderer'

export const styles = StyleSheet.create({
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
