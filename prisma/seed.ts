import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Limpiar datos existentes (en orden inverso de dependencias)
  console.log('🗑️  Cleaning existing data...')
  await prisma.quizAttempt.deleteMany()
  await prisma.quizQuestion.deleteMany()
  await prisma.questionOption.deleteMany()
  await prisma.question.deleteMany()
  await prisma.quiz.deleteMany()
  await prisma.lessonProgress.deleteMany()
  await prisma.lesson.deleteMany()
  await prisma.unit.deleteMany()
  await prisma.progressAlert.deleteMany()
  await prisma.certificationRecord.deleteMany()
  await prisma.courseProgress.deleteMany()
  await prisma.enrollment.deleteMany()
  await prisma.enrollmentRule.deleteMany()
  await prisma.courseCollaboratorAssignment.deleteMany()
  await prisma.coursePositionAssignment.deleteMany()
  await prisma.courseAreaAssignment.deleteMany()
  await prisma.courseSiteAssignment.deleteMany()
  await prisma.courseVersion.deleteMany()
  await prisma.course.deleteMany()
  await prisma.notificationPreference.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.notificationTemplate.deleteMany()
  await prisma.user.deleteMany()
  await prisma.collaborator.deleteMany()
  await prisma.position.deleteMany()
  await prisma.area.deleteMany()
  await prisma.site.deleteMany()

  console.log('✅ Cleanup complete')

  // ========================================
  // A - ESTRUCTURA ORGANIZACIONAL
  // ========================================
  console.log('🏢 Creating organizational structure...')

  // A1 - Sedes
  const sites = await Promise.all([
    prisma.site.create({ data: { name: 'Lima - Sede Central', code: 'LIM-01' } }),
    prisma.site.create({ data: { name: 'Arequipa - Planta Sur', code: 'AQP-01' } }),
    prisma.site.create({ data: { name: 'Cusco - Operaciones', code: 'CUS-01' } }),
  ])

  // A2 - Áreas
  const areas = await Promise.all([
    prisma.area.create({ data: { name: 'Operaciones', code: 'OPS' } }),
    prisma.area.create({ data: { name: 'Seguridad y Salud', code: 'SSO' } }),
    prisma.area.create({ data: { name: 'Mantenimiento', code: 'MNT' } }),
    prisma.area.create({ data: { name: 'Recursos Humanos', code: 'RRH' } }),
    prisma.area.create({ data: { name: 'Administración', code: 'ADM' } }),
  ])

  // A3 - Puestos
  const positions = await Promise.all([
    prisma.position.create({ data: { name: 'Gerente', areaId: areas[0].id } }),
    prisma.position.create({ data: { name: 'Supervisor', areaId: areas[0].id } }),
    prisma.position.create({ data: { name: 'Operador', areaId: areas[0].id } }),
    prisma.position.create({ data: { name: 'Especialista SSOMA', areaId: areas[1].id } }),
    prisma.position.create({ data: { name: 'Inspector de Seguridad', areaId: areas[1].id } }),
    prisma.position.create({ data: { name: 'Técnico de Mantenimiento', areaId: areas[2].id } }),
    prisma.position.create({ data: { name: 'Analista RRHH', areaId: areas[3].id } }),
    prisma.position.create({ data: { name: 'Asistente Administrativo', areaId: areas[4].id } }),
  ])

  console.log('✅ Organizational structure created')

  // ========================================
  // B - COLABORADORES Y USUARIOS
  // ========================================
  console.log('👥 Creating collaborators and users...')

  const hashedPassword = await bcrypt.hash('password123', 10)

  // Superadmin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@ssoma.com',
      name: 'Administrador Sistema',
      hashedPassword,
      role: 'SUPERADMIN',
    },
  })

  // Colaboradores con usuarios
  const collaborators = await Promise.all([
    // Gerentes
    prisma.collaborator.create({
      data: {
        dni: '12345678',
        fullName: 'Carlos Rodríguez Pérez',
        email: 'carlos.rodriguez@empresa.com',
        siteId: sites[0].id,
        areaId: areas[0].id,
        positionId: positions[0].id,
        status: 'ACTIVE',
        entryDate: new Date('2020-01-15'),
        user: {
          create: {
            email: 'carlos.rodriguez@empresa.com',
            name: 'Carlos Rodríguez Pérez',
            hashedPassword,
            role: 'COLLABORATOR',
          },
        },
      },
    }),
    // Supervisores
    prisma.collaborator.create({
      data: {
        dni: '23456789',
        fullName: 'María Gonzales Torres',
        email: 'maria.gonzales@empresa.com',
        siteId: sites[0].id,
        areaId: areas[0].id,
        positionId: positions[1].id,
        status: 'ACTIVE',
        entryDate: new Date('2021-03-10'),
        user: {
          create: {
            email: 'maria.gonzales@empresa.com',
            name: 'María Gonzales Torres',
            hashedPassword,
            role: 'COLLABORATOR',
          },
        },
      },
    }),
    // Operadores
    prisma.collaborator.create({
      data: {
        dni: '34567890',
        fullName: 'Juan Mamani Quispe',
        email: 'juan.mamani@empresa.com',
        siteId: sites[0].id,
        areaId: areas[0].id,
        positionId: positions[2].id,
        status: 'ACTIVE',
        entryDate: new Date('2022-06-01'),
        user: {
          create: {
            email: 'juan.mamani@empresa.com',
            name: 'Juan Mamani Quispe',
            hashedPassword,
            role: 'COLLABORATOR',
          },
        },
      },
    }),
    prisma.collaborator.create({
      data: {
        dni: '45678901',
        fullName: 'Ana Flores Medina',
        email: 'ana.flores@empresa.com',
        siteId: sites[1].id,
        areaId: areas[0].id,
        positionId: positions[2].id,
        status: 'ACTIVE',
        entryDate: new Date('2022-08-15'),
        user: {
          create: {
            email: 'ana.flores@empresa.com',
            name: 'Ana Flores Medina',
            hashedPassword,
            role: 'COLLABORATOR',
          },
        },
      },
    }),
    // Especialista SSOMA
    prisma.collaborator.create({
      data: {
        dni: '56789012',
        fullName: 'Roberto Sánchez Vega',
        email: 'roberto.sanchez@empresa.com',
        siteId: sites[0].id,
        areaId: areas[1].id,
        positionId: positions[3].id,
        status: 'ACTIVE',
        entryDate: new Date('2019-11-20'),
        user: {
          create: {
            email: 'roberto.sanchez@empresa.com',
            name: 'Roberto Sánchez Vega',
            hashedPassword,
            role: 'ADMIN',
          },
        },
      },
    }),
    // Inspector de Seguridad
    prisma.collaborator.create({
      data: {
        dni: '67890123',
        fullName: 'Patricia Huamán Castro',
        email: 'patricia.huaman@empresa.com',
        siteId: sites[1].id,
        areaId: areas[1].id,
        positionId: positions[4].id,
        status: 'ACTIVE',
        entryDate: new Date('2021-02-15'),
        user: {
          create: {
            email: 'patricia.huaman@empresa.com',
            name: 'Patricia Huamán Castro',
            hashedPassword,
            role: 'COLLABORATOR',
          },
        },
      },
    }),
    // Técnicos
    prisma.collaborator.create({
      data: {
        dni: '78901234',
        fullName: 'Luis Ramírez Ochoa',
        email: 'luis.ramirez@empresa.com',
        siteId: sites[2].id,
        areaId: areas[2].id,
        positionId: positions[5].id,
        status: 'ACTIVE',
        entryDate: new Date('2020-09-10'),
        user: {
          create: {
            email: 'luis.ramirez@empresa.com',
            name: 'Luis Ramírez Ochoa',
            hashedPassword,
            role: 'COLLABORATOR',
          },
        },
      },
    }),
    // Analista RRHH
    prisma.collaborator.create({
      data: {
        dni: '89012345',
        fullName: 'Carmen López Silva',
        email: 'carmen.lopez@empresa.com',
        siteId: sites[0].id,
        areaId: areas[3].id,
        positionId: positions[6].id,
        status: 'ACTIVE',
        entryDate: new Date('2021-07-01'),
        user: {
          create: {
            email: 'carmen.lopez@empresa.com',
            name: 'Carmen López Silva',
            hashedPassword,
            role: 'COLLABORATOR',
          },
        },
      },
    }),
    // Asistente Administrativo
    prisma.collaborator.create({
      data: {
        dni: '90123456',
        fullName: 'Pedro Vargas Rojas',
        email: 'pedro.vargas@empresa.com',
        siteId: sites[0].id,
        areaId: areas[4].id,
        positionId: positions[7].id,
        status: 'ACTIVE',
        entryDate: new Date('2023-01-15'),
        user: {
          create: {
            email: 'pedro.vargas@empresa.com',
            name: 'Pedro Vargas Rojas',
            hashedPassword,
            role: 'COLLABORATOR',
          },
        },
      },
    }),
    // Más operadores sin usuario
    prisma.collaborator.create({
      data: {
        dni: '11111111',
        fullName: 'Jorge Apaza Cruz',
        email: 'jorge.apaza@empresa.com',
        siteId: sites[1].id,
        areaId: areas[0].id,
        positionId: positions[2].id,
        status: 'ACTIVE',
        entryDate: new Date('2023-03-20'),
      },
    }),
  ])

  console.log('✅ Collaborators and users created')

  // ========================================
  // C - CURSOS
  // ========================================
  console.log('📚 Creating courses...')

  const courses = await Promise.all([
    // Curso 1: Inducción SSOMA
    prisma.course.create({
      data: {
        code: 'SSOMA-001',
        name: 'Inducción en Seguridad y Salud Ocupacional',
        description: 'Curso de inducción obligatorio para todos los colaboradores sobre principios básicos de SSOMA',
        objective: 'Conocer los principios fundamentales de seguridad y salud en el trabajo',
        duration: 4,
        modality: 'ASYNCHRONOUS',
        validity: 12,
        status: 'PUBLISHED',
        currentVersion: 1,
        versions: {
          create: {
            version: 1,
            name: 'Inducción en Seguridad y Salud Ocupacional',
            description: 'Curso de inducción obligatorio para todos los colaboradores sobre principios básicos de SSOMA',
            objective: 'Conocer los principios fundamentales de seguridad y salud en el trabajo',
            duration: 4,
            modality: 'ASYNCHRONOUS',
            validity: 12,
            status: 'PUBLISHED',
            createdBy: adminUser.id,
          },
        },
      },
    }),
    // Curso 2: EPP
    prisma.course.create({
      data: {
        code: 'SSOMA-002',
        name: 'Uso Correcto de Equipos de Protección Personal',
        description: 'Capacitación sobre el uso adecuado de EPP en áreas de trabajo',
        objective: 'Identificar y usar correctamente los EPP según el tipo de riesgo',
        duration: 3,
        modality: 'ASYNCHRONOUS',
        validity: 12,
        status: 'PUBLISHED',
        currentVersion: 1,
        versions: {
          create: {
            version: 1,
            name: 'Uso Correcto de Equipos de Protección Personal',
            description: 'Capacitación sobre el uso adecuado de EPP en áreas de trabajo',
            objective: 'Identificar y usar correctamente los EPP según el tipo de riesgo',
            duration: 3,
            modality: 'ASYNCHRONOUS',
            validity: 12,
            status: 'PUBLISHED',
            createdBy: adminUser.id,
          },
        },
      },
    }),
    // Curso 3: Trabajo en altura
    prisma.course.create({
      data: {
        code: 'SSOMA-003',
        name: 'Trabajo Seguro en Altura',
        description: 'Procedimientos de seguridad para trabajos en altura',
        objective: 'Aplicar protocolos de seguridad para prevenir caídas en trabajos en altura',
        duration: 6,
        modality: 'BLENDED',
        validity: 12,
        status: 'PUBLISHED',
        currentVersion: 1,
        versions: {
          create: {
            version: 1,
            name: 'Trabajo Seguro en Altura',
            description: 'Procedimientos de seguridad para trabajos en altura',
            objective: 'Aplicar protocolos de seguridad para prevenir caídas en trabajos en altura',
            duration: 6,
            modality: 'BLENDED',
            validity: 12,
            status: 'PUBLISHED',
            createdBy: adminUser.id,
          },
        },
      },
    }),
    // Curso 4: Primeros auxilios
    prisma.course.create({
      data: {
        code: 'SSOMA-004',
        name: 'Primeros Auxilios Básicos',
        description: 'Técnicas básicas de primeros auxilios en el lugar de trabajo',
        objective: 'Responder adecuadamente ante emergencias médicas básicas',
        duration: 8,
        modality: 'SYNCHRONOUS',
        validity: 24,
        status: 'PUBLISHED',
        currentVersion: 1,
        versions: {
          create: {
            version: 1,
            name: 'Primeros Auxilios Básicos',
            description: 'Técnicas básicas de primeros auxilios en el lugar de trabajo',
            objective: 'Responder adecuadamente ante emergencias médicas básicas',
            duration: 8,
            modality: 'SYNCHRONOUS',
            validity: 24,
            status: 'PUBLISHED',
            createdBy: adminUser.id,
          },
        },
      },
    }),
    // Curso 5: Manejo de químicos
    prisma.course.create({
      data: {
        code: 'SSOMA-005',
        name: 'Manejo Seguro de Sustancias Químicas',
        description: 'Procedimientos para el manejo seguro de sustancias químicas peligrosas',
        objective: 'Manipular sustancias químicas minimizando riesgos',
        duration: 5,
        modality: 'ASYNCHRONOUS',
        validity: 12,
        status: 'PUBLISHED',
        currentVersion: 1,
        versions: {
          create: {
            version: 1,
            name: 'Manejo Seguro de Sustancias Químicas',
            description: 'Procedimientos para el manejo seguro de sustancias químicas peligrosas',
            objective: 'Manipular sustancias químicas minimizando riesgos',
            duration: 5,
            modality: 'ASYNCHRONOUS',
            validity: 12,
            status: 'PUBLISHED',
            createdBy: adminUser.id,
          },
        },
      },
    }),
  ])

  console.log('✅ Courses created')

  // ========================================
  // D - CONTENIDOS (Unidades y Lecciones)
  // ========================================
  console.log('📖 Creating course content...')

  // Contenido para Curso 1: Inducción SSOMA
  const unit1 = await prisma.unit.create({
    data: {
      courseId: courses[0].id,
      title: 'Introducción a la Seguridad y Salud Ocupacional',
      description: 'Conceptos básicos de SSOMA',
      order: 1,
      lessons: {
        create: [
          {
            title: '¿Qué es SSOMA?',
            description: 'Definición y alcance del sistema SSOMA',
            type: 'VIDEO',
            order: 1,
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            completionThreshold: 80,
            duration: 15,
          },
          {
            title: 'Marco Legal Peruano',
            description: 'Ley 29783 y normativa aplicable',
            type: 'PDF',
            order: 2,
            fileUrl: 'https://example.com/marco-legal.pdf',
            completionThreshold: 90,
            duration: 20,
          },
          {
            title: 'Derechos y Obligaciones',
            description: 'Derechos y obligaciones de trabajadores y empleadores',
            type: 'HTML',
            order: 3,
            htmlContent: '<h1>Derechos y Obligaciones</h1><p>Los trabajadores tienen derecho a...</p>',
            completionThreshold: 80,
            duration: 10,
          },
        ],
      },
    },
  })

  const unit2 = await prisma.unit.create({
    data: {
      courseId: courses[0].id,
      title: 'Identificación de Peligros y Riesgos',
      description: 'Cómo identificar peligros en el lugar de trabajo',
      order: 2,
      lessons: {
        create: [
          {
            title: 'Tipos de Peligros',
            description: 'Peligros físicos, químicos, biológicos y ergonómicos',
            type: 'VIDEO',
            order: 1,
            videoUrl: 'https://www.youtube.com/watch?v=example',
            completionThreshold: 80,
            duration: 20,
          },
          {
            title: 'Matriz IPER',
            description: 'Identificación de Peligros y Evaluación de Riesgos',
            type: 'PDF',
            order: 2,
            fileUrl: 'https://example.com/matriz-iper.pdf',
            completionThreshold: 90,
            duration: 25,
          },
        ],
      },
    },
  })

  // Contenido para Curso 2: EPP
  await prisma.unit.create({
    data: {
      courseId: courses[1].id,
      title: 'Equipos de Protección Personal',
      description: 'Tipos y uso de EPP',
      order: 1,
      lessons: {
        create: [
          {
            title: 'Protección de Cabeza',
            description: 'Cascos de seguridad',
            type: 'VIDEO',
            order: 1,
            videoUrl: 'https://www.youtube.com/watch?v=example2',
            completionThreshold: 80,
            duration: 10,
          },
          {
            title: 'Protección de Manos',
            description: 'Guantes según tipo de trabajo',
            type: 'VIDEO',
            order: 2,
            videoUrl: 'https://www.youtube.com/watch?v=example3',
            completionThreshold: 80,
            duration: 10,
          },
          {
            title: 'Protección Respiratoria',
            description: 'Mascarillas y respiradores',
            type: 'PDF',
            order: 3,
            fileUrl: 'https://example.com/proteccion-respiratoria.pdf',
            completionThreshold: 90,
            duration: 15,
          },
        ],
      },
    },
  })

  console.log('✅ Course content created')

  // ========================================
  // F - EVALUACIONES
  // ========================================
  console.log('📝 Creating quizzes and questions...')

  // Quiz para Curso 1
  const quiz1 = await prisma.quiz.create({
    data: {
      title: 'Evaluación Final - Inducción SSOMA',
      description: 'Evaluación de conocimientos sobre seguridad y salud ocupacional',
      instructions: 'Responde todas las preguntas. Necesitas 70% para aprobar.',
      courseId: courses[0].id,
      passingScore: 70,
      maxAttempts: 3,
      timeLimit: 30,
      shuffleQuestions: true,
      shuffleOptions: true,
      showCorrectAnswers: true,
      showFeedback: true,
      showScoreImmediately: true,
      status: 'PUBLISHED',
      createdBy: adminUser.id,
    },
  })

  // Preguntas para Quiz 1
  const questions = await Promise.all([
    prisma.question.create({
      data: {
        questionText: '¿Cuál es el objetivo principal de un Sistema de Gestión de Seguridad y Salud en el Trabajo?',
        type: 'SINGLE_CHOICE',
        points: 10,
        topic: 'Fundamentos SSOMA',
        difficulty: 3,
        correctFeedback: '¡Correcto! El objetivo principal es prevenir lesiones y enfermedades ocupacionales.',
        incorrectFeedback: 'Incorrecto. El enfoque debe ser preventivo.',
        createdBy: adminUser.id,
        options: {
          create: [
            { optionText: 'Prevenir lesiones y enfermedades ocupacionales', isCorrect: true, order: 1 },
            { optionText: 'Aumentar la producción', isCorrect: false, order: 2 },
            { optionText: 'Reducir costos operativos', isCorrect: false, order: 3 },
            { optionText: 'Cumplir con auditorías', isCorrect: false, order: 4 },
          ],
        },
      },
    }),
    prisma.question.create({
      data: {
        questionText: '¿Qué ley regula la Seguridad y Salud en el Trabajo en Perú?',
        type: 'SINGLE_CHOICE',
        points: 10,
        topic: 'Marco Legal',
        difficulty: 2,
        correctFeedback: '¡Correcto! La Ley 29783 es la Ley de Seguridad y Salud en el Trabajo.',
        incorrectFeedback: 'Incorrecto. Revisa el marco legal peruano.',
        createdBy: adminUser.id,
        options: {
          create: [
            { optionText: 'Ley 29783', isCorrect: true, order: 1 },
            { optionText: 'Ley 28015', isCorrect: false, order: 2 },
            { optionText: 'Ley 30222', isCorrect: false, order: 3 },
            { optionText: 'Ley 27444', isCorrect: false, order: 4 },
          ],
        },
      },
    }),
    prisma.question.create({
      data: {
        questionText: 'Selecciona todos los derechos de los trabajadores en materia de seguridad:',
        type: 'MULTIPLE_CHOICE',
        points: 10,
        topic: 'Derechos y Obligaciones',
        difficulty: 4,
        correctFeedback: '¡Excelente! Conoces los derechos fundamentales.',
        incorrectFeedback: 'Revisa los derechos de los trabajadores.',
        createdBy: adminUser.id,
        options: {
          create: [
            { optionText: 'Recibir información sobre riesgos', isCorrect: true, order: 1 },
            { optionText: 'Participar en la identificación de peligros', isCorrect: true, order: 2 },
            { optionText: 'Recibir capacitación gratuita', isCorrect: true, order: 3 },
            { optionText: 'Trabajar sin EPP si es incómodo', isCorrect: false, order: 4 },
          ],
        },
      },
    }),
    prisma.question.create({
      data: {
        questionText: 'La prevención de riesgos laborales es responsabilidad únicamente del empleador.',
        type: 'TRUE_FALSE',
        points: 10,
        topic: 'Responsabilidades',
        difficulty: 2,
        correctFeedback: '¡Correcto! Es una responsabilidad compartida.',
        incorrectFeedback: 'Falso. Tanto empleador como trabajador tienen responsabilidades.',
        createdBy: adminUser.id,
        options: {
          create: [
            { optionText: 'Verdadero', isCorrect: false, order: 1 },
            { optionText: 'Falso', isCorrect: true, order: 2 },
          ],
        },
      },
    }),
    prisma.question.create({
      data: {
        questionText: '¿Qué significa IPER?',
        type: 'SINGLE_CHOICE',
        points: 10,
        topic: 'Identificación de Riesgos',
        difficulty: 2,
        correctFeedback: '¡Correcto! IPER es la matriz fundamental de gestión de riesgos.',
        incorrectFeedback: 'Incorrecto. Revisa el concepto de IPER.',
        createdBy: adminUser.id,
        options: {
          create: [
            { optionText: 'Identificación de Peligros y Evaluación de Riesgos', isCorrect: true, order: 1 },
            { optionText: 'Inspección de Personal y Equipos de Rescate', isCorrect: false, order: 2 },
            { optionText: 'Índice de Pérdidas y Emergencias Reportadas', isCorrect: false, order: 3 },
            { optionText: 'Investigación de Problemas en el Trabajo', isCorrect: false, order: 4 },
          ],
        },
      },
    }),
  ])

  // Asociar preguntas al quiz
  await Promise.all(
    questions.map((question, index) =>
      prisma.quizQuestion.create({
        data: {
          quizId: quiz1.id,
          questionId: question.id,
          order: index + 1,
        },
      })
    )
  )

  // Quiz para Curso 2 (EPP)
  const quiz2 = await prisma.quiz.create({
    data: {
      title: 'Evaluación - Uso de EPP',
      description: 'Evaluación sobre el uso correcto de equipos de protección personal',
      instructions: 'Responde todas las preguntas. Necesitas 70% para aprobar.',
      courseId: courses[1].id,
      passingScore: 70,
      maxAttempts: 3,
      timeLimit: 20,
      shuffleQuestions: true,
      shuffleOptions: true,
      status: 'PUBLISHED',
      createdBy: adminUser.id,
    },
  })

  const eppQuestions = await Promise.all([
    prisma.question.create({
      data: {
        questionText: '¿Cuál es la función principal de un casco de seguridad?',
        type: 'SINGLE_CHOICE',
        points: 10,
        topic: 'EPP - Cabeza',
        difficulty: 2,
        createdBy: adminUser.id,
        options: {
          create: [
            { optionText: 'Proteger contra impactos en la cabeza', isCorrect: true, order: 1 },
            { optionText: 'Proteger del sol', isCorrect: false, order: 2 },
            { optionText: 'Identificar al trabajador', isCorrect: false, order: 3 },
          ],
        },
      },
    }),
    prisma.question.create({
      data: {
        questionText: 'Los guantes de látex protegen contra:',
        type: 'SINGLE_CHOICE',
        points: 10,
        topic: 'EPP - Manos',
        difficulty: 3,
        createdBy: adminUser.id,
        options: {
          create: [
            { optionText: 'Sustancias químicas y biológicas', isCorrect: true, order: 1 },
            { optionText: 'Cortes profundos', isCorrect: false, order: 2 },
            { optionText: 'Alto voltaje eléctrico', isCorrect: false, order: 3 },
            { optionText: 'Temperaturas extremas', isCorrect: false, order: 4 },
          ],
        },
      },
    }),
    prisma.question.create({
      data: {
        questionText: 'Es obligatorio usar protección respiratoria en áreas con presencia de polvo o gases.',
        type: 'TRUE_FALSE',
        points: 10,
        topic: 'EPP - Respiratorio',
        difficulty: 1,
        createdBy: adminUser.id,
        options: {
          create: [
            { optionText: 'Verdadero', isCorrect: true, order: 1 },
            { optionText: 'Falso', isCorrect: false, order: 2 },
          ],
        },
      },
    }),
  ])

  await Promise.all(
    eppQuestions.map((question, index) =>
      prisma.quizQuestion.create({
        data: {
          quizId: quiz2.id,
          questionId: question.id,
          order: index + 1,
        },
      })
    )
  )

  console.log('✅ Quizzes and questions created')

  // ========================================
  // E - INSCRIPCIONES Y REGLAS
  // ========================================
  console.log('📋 Creating enrollment rules and enrollments...')

  // Regla: Todos los operadores deben tomar Inducción SSOMA
  await prisma.enrollmentRule.create({
    data: {
      courseId: courses[0].id,
      positionId: positions[2].id, // Operador
      isActive: true,
      createdBy: adminUser.id,
    },
  })

  // Regla: Todos en área de Operaciones deben tomar EPP
  await prisma.enrollmentRule.create({
    data: {
      courseId: courses[1].id,
      areaId: areas[0].id, // Operaciones
      isActive: true,
      createdBy: adminUser.id,
    },
  })

  // Regla: Todos en área de Mantenimiento deben tomar Trabajo en Altura
  await prisma.enrollmentRule.create({
    data: {
      courseId: courses[2].id,
      areaId: areas[2].id, // Mantenimiento
      isActive: true,
      createdBy: adminUser.id,
    },
  })

  // Inscripciones manuales con estados variados
  const enrollments = []

  // Juan Mamani (Operador) - Curso completo y aprobado
  const enrollment1 = await prisma.enrollment.create({
    data: {
      courseId: courses[0].id,
      collaboratorId: collaborators[2].id,
      type: 'AUTOMATIC',
      status: 'COMPLETED',
      enrolledAt: new Date('2024-09-01'),
      startedAt: new Date('2024-09-02'),
      completedAt: new Date('2024-09-15'),
      expiresAt: new Date('2025-09-15'),
      progressPercent: 100,
    },
  })
  enrollments.push(enrollment1)

  // Ana Flores (Operador) - En progreso
  const enrollment2 = await prisma.enrollment.create({
    data: {
      courseId: courses[0].id,
      collaboratorId: collaborators[3].id,
      type: 'AUTOMATIC',
      status: 'ACTIVE',
      enrolledAt: new Date('2024-09-10'),
      startedAt: new Date('2024-09-12'),
      progressPercent: 45,
    },
  })
  enrollments.push(enrollment2)

  // Carlos Rodríguez (Gerente) - Curso EPP completado
  const enrollment3 = await prisma.enrollment.create({
    data: {
      courseId: courses[1].id,
      collaboratorId: collaborators[0].id,
      type: 'MANUAL',
      status: 'COMPLETED',
      enrolledAt: new Date('2024-08-01'),
      startedAt: new Date('2024-08-02'),
      completedAt: new Date('2024-08-10'),
      expiresAt: new Date('2025-08-10'),
      progressPercent: 100,
      enrolledBy: adminUser.id,
    },
  })
  enrollments.push(enrollment3)

  // María Gonzales (Supervisor) - Curso EPP en progreso
  const enrollment4 = await prisma.enrollment.create({
    data: {
      courseId: courses[1].id,
      collaboratorId: collaborators[1].id,
      type: 'AUTOMATIC',
      status: 'ACTIVE',
      enrolledAt: new Date('2024-09-15'),
      startedAt: new Date('2024-09-16'),
      progressPercent: 60,
    },
  })
  enrollments.push(enrollment4)

  // Luis Ramírez (Técnico) - Trabajo en Altura pendiente
  const enrollment5 = await prisma.enrollment.create({
    data: {
      courseId: courses[2].id,
      collaboratorId: collaborators[6].id,
      type: 'AUTOMATIC',
      status: 'PENDING',
      enrolledAt: new Date('2024-10-01'),
      progressPercent: 0,
    },
  })
  enrollments.push(enrollment5)

  // Patricia Huamán - Primeros Auxilios completado
  const enrollment6 = await prisma.enrollment.create({
    data: {
      courseId: courses[3].id,
      collaboratorId: collaborators[5].id,
      type: 'MANUAL',
      status: 'COMPLETED',
      enrolledAt: new Date('2024-07-01'),
      startedAt: new Date('2024-07-05'),
      completedAt: new Date('2024-07-20'),
      expiresAt: new Date('2026-07-20'),
      progressPercent: 100,
      enrolledBy: adminUser.id,
    },
  })
  enrollments.push(enrollment6)

  console.log('✅ Enrollments created')

  // ========================================
  // H - PROGRESO Y CUMPLIMIENTO
  // ========================================
  console.log('📊 Creating course progress...')

  // Progreso para Juan Mamani - Curso completo aprobado
  const progress1 = await prisma.courseProgress.create({
    data: {
      collaboratorId: collaborators[2].id,
      courseId: courses[0].id,
      enrollmentId: enrollment1.id,
      status: 'PASSED',
      progressPercent: 100,
      timeSpent: 7200, // 2 horas
      lastActivityAt: new Date('2024-09-15'),
      startedAt: new Date('2024-09-02'),
      completedAt: new Date('2024-09-15'),
      passedAt: new Date('2024-09-15'),
      expiresAt: new Date('2025-09-15'),
      certifiedAt: new Date('2024-09-15'),
    },
  })

  // Progreso para Ana Flores - En progreso
  await prisma.courseProgress.create({
    data: {
      collaboratorId: collaborators[3].id,
      courseId: courses[0].id,
      enrollmentId: enrollment2.id,
      status: 'IN_PROGRESS',
      progressPercent: 45,
      timeSpent: 3600, // 1 hora
      lastActivityAt: new Date('2024-10-15'),
      startedAt: new Date('2024-09-12'),
    },
  })

  // Progreso para Carlos Rodríguez - EPP completado
  const progress3 = await prisma.courseProgress.create({
    data: {
      collaboratorId: collaborators[0].id,
      courseId: courses[1].id,
      enrollmentId: enrollment3.id,
      status: 'PASSED',
      progressPercent: 100,
      timeSpent: 5400, // 1.5 horas
      lastActivityAt: new Date('2024-08-10'),
      startedAt: new Date('2024-08-02'),
      completedAt: new Date('2024-08-10'),
      passedAt: new Date('2024-08-10'),
      expiresAt: new Date('2025-08-10'),
      certifiedAt: new Date('2024-08-10'),
    },
  })

  // Progreso para María Gonzales - EPP en progreso
  await prisma.courseProgress.create({
    data: {
      collaboratorId: collaborators[1].id,
      courseId: courses[1].id,
      enrollmentId: enrollment4.id,
      status: 'IN_PROGRESS',
      progressPercent: 60,
      timeSpent: 4200,
      lastActivityAt: new Date('2024-10-16'),
      startedAt: new Date('2024-09-16'),
    },
  })

  // Progreso para Patricia - Primeros auxilios aprobado (próximo a vencer)
  const progress6 = await prisma.courseProgress.create({
    data: {
      collaboratorId: collaborators[5].id,
      courseId: courses[3].id,
      enrollmentId: enrollment6.id,
      status: 'PASSED',
      progressPercent: 100,
      timeSpent: 14400, // 4 horas
      lastActivityAt: new Date('2024-07-20'),
      startedAt: new Date('2024-07-05'),
      completedAt: new Date('2024-07-20'),
      passedAt: new Date('2024-07-20'),
      expiresAt: new Date('2025-11-20'), // Vence en 1 mes
      certifiedAt: new Date('2024-07-20'),
    },
  })

  console.log('✅ Course progress created')

  // ========================================
  // H - CERTIFICACIONES
  // ========================================
  console.log('🎓 Creating certifications...')

  await prisma.certificationRecord.create({
    data: {
      courseProgressId: progress1.id,
      collaboratorId: collaborators[2].id,
      courseId: courses[0].id,
      certificateNumber: 'CERT-SSOMA001-2024-001',
      issuedAt: new Date('2024-09-15'),
      expiresAt: new Date('2025-09-15'),
      isRecertification: false,
      isValid: true,
      verificationCode: 'VER-' + Math.random().toString(36).substring(7).toUpperCase(),
    },
  })

  await prisma.certificationRecord.create({
    data: {
      courseProgressId: progress3.id,
      collaboratorId: collaborators[0].id,
      courseId: courses[1].id,
      certificateNumber: 'CERT-SSOMA002-2024-001',
      issuedAt: new Date('2024-08-10'),
      expiresAt: new Date('2025-08-10'),
      isRecertification: false,
      isValid: true,
      verificationCode: 'VER-' + Math.random().toString(36).substring(7).toUpperCase(),
    },
  })

  await prisma.certificationRecord.create({
    data: {
      courseProgressId: progress6.id,
      collaboratorId: collaborators[5].id,
      courseId: courses[3].id,
      certificateNumber: 'CERT-SSOMA004-2024-001',
      issuedAt: new Date('2024-07-20'),
      expiresAt: new Date('2025-11-20'),
      isRecertification: false,
      isValid: true,
      verificationCode: 'VER-' + Math.random().toString(36).substring(7).toUpperCase(),
    },
  })

  console.log('✅ Certifications created')

  // ========================================
  // H - ALERTAS
  // ========================================
  console.log('⚠️ Creating alerts...')

  // Alerta de vencimiento próximo para Patricia
  await prisma.progressAlert.create({
    data: {
      collaboratorId: collaborators[5].id,
      courseId: courses[3].id,
      type: 'EXPIRING_SOON',
      severity: 2,
      title: 'Certificación por vencer',
      message: 'Tu certificación de Primeros Auxilios Básicos vencerá el 20 de noviembre de 2025',
      dueDate: new Date('2025-11-20'),
      isRead: false,
    },
  })

  // Alerta de curso pendiente para Luis
  await prisma.progressAlert.create({
    data: {
      collaboratorId: collaborators[6].id,
      courseId: courses[2].id,
      type: 'OVERDUE',
      severity: 2,
      title: 'Curso obligatorio pendiente',
      message: 'Debes iniciar el curso "Trabajo Seguro en Altura" lo antes posible',
      triggeredAt: new Date('2024-10-10'),
      isRead: false,
    },
  })

  console.log('✅ Alerts created')

  // ========================================
  // F - INTENTOS DE EVALUACIÓN
  // ========================================
  console.log('✍️ Creating quiz attempts...')

  // Juan Mamani aprobó en el primer intento
  await prisma.quizAttempt.create({
    data: {
      quizId: quiz1.id,
      collaboratorId: collaborators[2].id,
      attemptNumber: 1,
      status: 'PASSED',
      answers: JSON.stringify({
        [questions[0].id]: 0, // Primera opción (correcta)
        [questions[1].id]: 0, // Primera opción (correcta)
        [questions[2].id]: [0, 1, 2], // Múltiple (correctas)
        [questions[3].id]: 1, // Falso (correcto)
        [questions[4].id]: 0, // Primera opción (correcta)
      }),
      score: 90,
      pointsEarned: 45,
      pointsTotal: 50,
      startedAt: new Date('2024-09-14T10:00:00'),
      submittedAt: new Date('2024-09-14T10:25:00'),
      timeSpent: 1500, // 25 minutos
    },
  })

  // Carlos Rodríguez aprobó EPP
  await prisma.quizAttempt.create({
    data: {
      quizId: quiz2.id,
      collaboratorId: collaborators[0].id,
      attemptNumber: 1,
      status: 'PASSED',
      answers: JSON.stringify({
        [eppQuestions[0].id]: 0,
        [eppQuestions[1].id]: 0,
        [eppQuestions[2].id]: 0,
      }),
      score: 100,
      pointsEarned: 30,
      pointsTotal: 30,
      startedAt: new Date('2024-08-09T14:00:00'),
      submittedAt: new Date('2024-08-09T14:15:00'),
      timeSpent: 900, // 15 minutos
    },
  })

  // Ana Flores reprobó en el primer intento (aún no ha pasado)
  await prisma.quizAttempt.create({
    data: {
      quizId: quiz1.id,
      collaboratorId: collaborators[3].id,
      attemptNumber: 1,
      status: 'FAILED',
      answers: JSON.stringify({
        [questions[0].id]: 1, // Incorrecta
        [questions[1].id]: 0, // Correcta
        [questions[2].id]: [0, 1], // Parcialmente correcta
        [questions[3].id]: 0, // Incorrecta
        [questions[4].id]: 2, // Incorrecta
      }),
      score: 45,
      pointsEarned: 22,
      pointsTotal: 50,
      startedAt: new Date('2024-10-10T09:00:00'),
      submittedAt: new Date('2024-10-10T09:20:00'),
      timeSpent: 1200,
      requiresRemediation: true,
    },
  })

  console.log('✅ Quiz attempts created')

  // ========================================
  // I - NOTIFICACIONES
  // ========================================
  console.log('📬 Creating notification templates and notifications...')

  // Plantillas de notificación
  const templates = await Promise.all([
    prisma.notificationTemplate.create({
      data: {
        type: 'NEW_ENROLLMENT',
        name: 'Nueva Asignación de Curso',
        description: 'Notificación cuando se asigna un nuevo curso a un colaborador',
        subject: 'Nuevo curso asignado: {{courseName}}',
        bodyHtml: '<p>Hola {{collaboratorName}},</p><p>Se te ha asignado el curso <strong>{{courseName}}</strong>. Ingresa al sistema para comenzar.</p>',
        bodyText: 'Hola {{collaboratorName}}, se te ha asignado el curso {{courseName}}. Ingresa al sistema para comenzar.',
        isActive: true,
        defaultChannel: 'BOTH',
        priority: 'MEDIUM',
        availableVars: ['collaboratorName', 'courseName', 'courseDescription'],
      },
    }),
    prisma.notificationTemplate.create({
      data: {
        type: 'REMINDER_7_DAYS',
        name: 'Recordatorio 7 días antes de vencimiento',
        description: 'Recordatorio cuando faltan 7 días para que venza una certificación',
        subject: 'Certificación próxima a vencer - {{courseName}}',
        bodyHtml: '<p>Hola {{collaboratorName}},</p><p>Tu certificación de <strong>{{courseName}}</strong> vencerá el {{expirationDate}}. Recuerda renovarla a tiempo.</p>',
        bodyText: 'Hola {{collaboratorName}}, tu certificación de {{courseName}} vencerá el {{expirationDate}}. Recuerda renovarla a tiempo.',
        isActive: true,
        defaultChannel: 'BOTH',
        priority: 'HIGH',
        availableVars: ['collaboratorName', 'courseName', 'expirationDate'],
      },
    }),
    prisma.notificationTemplate.create({
      data: {
        type: 'CERTIFICATE_READY',
        name: 'Certificado Disponible',
        description: 'Notificación cuando un certificado está listo para descargar',
        subject: '¡Felicitaciones! Tu certificado está listo',
        bodyHtml: '<p>¡Felicitaciones {{collaboratorName}}!</p><p>Has completado exitosamente el curso <strong>{{courseName}}</strong>. Tu certificado está disponible para descargar.</p>',
        bodyText: '¡Felicitaciones {{collaboratorName}}! Has completado exitosamente el curso {{courseName}}. Tu certificado está disponible para descargar.',
        isActive: true,
        defaultChannel: 'BOTH',
        priority: 'MEDIUM',
        availableVars: ['collaboratorName', 'courseName', 'certificateNumber'],
      },
    }),
  ])

  // Obtener los usuarios creados para las notificaciones
  const userJuan = await prisma.user.findUnique({ where: { email: 'juan.mamani@empresa.com' } })
  const userAna = await prisma.user.findUnique({ where: { email: 'ana.flores@empresa.com' } })
  const userPatricia = await prisma.user.findUnique({ where: { email: 'patricia.huaman@empresa.com' } })

  // Notificaciones individuales
  if (userAna) {
    await prisma.notification.create({
      data: {
        userId: userAna.id,
        collaboratorId: collaborators[3].id,
        type: 'NEW_ENROLLMENT',
        templateId: templates[0].id,
        subject: 'Nuevo curso asignado: Inducción en Seguridad y Salud Ocupacional',
        bodyHtml: '<p>Hola Ana Flores Medina,</p><p>Se te ha asignado el curso <strong>Inducción en Seguridad y Salud Ocupacional</strong>. Ingresa al sistema para comenzar.</p>',
        bodyText: 'Hola Ana Flores Medina, se te ha asignado el curso Inducción en Seguridad y Salud Ocupacional. Ingresa al sistema para comenzar.',
        priority: 'MEDIUM',
        channel: 'BOTH',
        relatedCourseId: courses[0].id,
        relatedEnrollmentId: enrollment2.id,
        isRead: false,
        emailSent: true,
        emailSentAt: new Date('2024-09-10T08:00:00'),
      },
    })
  }

  if (userPatricia) {
    await prisma.notification.create({
      data: {
        userId: userPatricia.id,
        collaboratorId: collaborators[5].id,
        type: 'REMINDER_7_DAYS',
        templateId: templates[1].id,
        subject: 'Certificación próxima a vencer - Primeros Auxilios Básicos',
        bodyHtml: '<p>Hola Patricia Huamán Castro,</p><p>Tu certificación de <strong>Primeros Auxilios Básicos</strong> vencerá el 20/11/2025. Recuerda renovarla a tiempo.</p>',
        bodyText: 'Hola Patricia Huamán Castro, tu certificación de Primeros Auxilios Básicos vencerá el 20/11/2025. Recuerda renovarla a tiempo.',
        priority: 'HIGH',
        channel: 'BOTH',
        relatedCourseId: courses[3].id,
        isRead: false,
        emailSent: true,
        emailSentAt: new Date('2024-10-13T08:00:00'),
      },
    })
  }

  if (userJuan) {
    await prisma.notification.create({
      data: {
        userId: userJuan.id,
        collaboratorId: collaborators[2].id,
        type: 'CERTIFICATE_READY',
        templateId: templates[2].id,
        subject: '¡Felicitaciones! Tu certificado está listo',
        bodyHtml: '<p>¡Felicitaciones Juan Mamani Quispe!</p><p>Has completado exitosamente el curso <strong>Inducción en Seguridad y Salud Ocupacional</strong>. Tu certificado está disponible para descargar.</p>',
        bodyText: '¡Felicitaciones Juan Mamani Quispe! Has completado exitosamente el curso Inducción en Seguridad y Salud Ocupacional. Tu certificado está disponible para descargar.',
        priority: 'MEDIUM',
        channel: 'BOTH',
        relatedCourseId: courses[0].id,
        relatedEnrollmentId: enrollment1.id,
        isRead: true,
        readAt: new Date('2024-09-15T12:00:00'),
        emailSent: true,
        emailSentAt: new Date('2024-09-15T10:00:00'),
      },
    })
  }

  console.log('✅ Notifications created')

  // ========================================
  // RESUMEN
  // ========================================
  console.log('\n🎉 Seed completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`   - ${sites.length} sedes`)
  console.log(`   - ${areas.length} áreas`)
  console.log(`   - ${positions.length} puestos`)
  console.log(`   - ${collaborators.length} colaboradores`)
  console.log(`   - ${courses.length} cursos`)
  console.log(`   - ${enrollments.length} inscripciones`)
  console.log(`   - 2 quizzes con preguntas`)
  console.log(`   - 3 intentos de evaluación`)
  console.log(`   - 3 certificaciones`)
  console.log(`   - 3 plantillas de notificación`)
  console.log(`   - 3 notificaciones`)

  console.log('\n👤 Usuarios de prueba:')
  console.log('   Superadmin:')
  console.log('   - Email: admin@ssoma.com')
  console.log('   - Password: password123')
  console.log('\n   Admin/Especialista SSOMA:')
  console.log('   - Email: roberto.sanchez@empresa.com')
  console.log('   - Password: password123')
  console.log('\n   Colaboradores:')
  console.log('   - Email: juan.mamani@empresa.com (Curso completado)')
  console.log('   - Email: ana.flores@empresa.com (Curso en progreso)')
  console.log('   - Email: maria.gonzales@empresa.com (Curso en progreso)')
  console.log('   - Email: patricia.huaman@empresa.com (Certificación próxima a vencer)')
  console.log('   - Password para todos: password123')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error during seed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
