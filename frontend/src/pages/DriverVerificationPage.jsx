import { useState } from 'react'
import { Circle, CircleCheck, CircleDot, FileText, Upload } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import '../styles/PublishCargoPage.css'
import './DriverVerificationPage.css'

const DOCUMENTS = [
  { id: 'license', label: 'Licencia de conducir' },
  { id: 'circulation', label: 'Permiso de circulación' },
  { id: 'insurance', label: 'Seguro obligatorio' },
]

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ACCEPTED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

export default function DriverVerificationPage({ session, onLogout }) {
  const [files, setFiles] = useState({})
  const [fileError, setFileError] = useState('')
  const [submitMessage, setSubmitMessage] = useState('')

  const handleFileChange = (documentId, file) => {
    setFileError('')
    setSubmitMessage('')

    if (!file) {
      setFiles((current) => {
        const next = { ...current }
        delete next[documentId]
        return next
      })
      return
    }

    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      setFiles((current) => {
        const next = { ...current }
        delete next[documentId]
        return next
      })
      setFileError('El archivo debe estar en formato PDF, JPG o PNG.')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setFiles((current) => {
        const next = { ...current }
        delete next[documentId]
        return next
      })
      setFileError('El archivo no puede superar los 10 MB.')
      return
    }

    setFiles((current) => ({ ...current, [documentId]: file }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const missingDocuments = DOCUMENTS.filter((document) => !files[document.id])

    if (missingDocuments.length > 0) {
      setSubmitMessage(`Selecciona los documentos pendientes: ${missingDocuments.map((document) => document.label).join(', ')}.`)
      return
    }

    setSubmitMessage('La carga segura de documentos aún no está habilitada. No se envió ningún archivo.')
  }

  const selectedCount = DOCUMENTS.filter((document) => files[document.id]).length

  return (
    <div className="page driver-verification">
      <Navbar session={session} onLogout={onLogout} />

      <main className="page__main driver-verification__main">
        <h1 className="driver-verification__title">Tu verificación está en curso</h1>
        <p className="driver-verification__subtitle">
          Sube tus documentos para que un administrador verifique tu camión.
        </p>

        <div className="driver-verification__grid">
          <section className="driver-verification__card" aria-labelledby="documents-title">
            <h2 id="documents-title" className="driver-verification__card-title">
              Carga de documentos
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="driver-verification__document-list">
                {DOCUMENTS.map((document) => {
                  const file = files[document.id]

                  return (
                    <div className="driver-verification__document" key={document.id}>
                      <div className="driver-verification__document-info">
                        <FileText size={17} aria-hidden="true" />
                        <div className="driver-verification__document-copy">
                          <span>{document.label}</span>
                          {file && <span className="driver-verification__filename">{file.name}</span>}
                        </div>
                      </div>

                      <span className={`driver-verification__badge ${file ? 'driver-verification__badge--selected' : ''}`}>
                        {file ? 'Seleccionado' : 'Pendiente'}
                      </span>

                      <label className="driver-verification__upload">
                        <Upload size={15} aria-hidden="true" />
                        <span>{file ? 'Cambiar archivo' : 'Subir archivo'}</span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                          aria-label={`${file ? 'Cambiar' : 'Subir'} ${document.label.toLowerCase()}`}
                          onChange={(event) => handleFileChange(document.id, event.target.files?.[0])}
                        />
                      </label>
                    </div>
                  )
                })}
              </div>

              <p className="driver-verification__file-hint">
                PDF, JPG o PNG · Máximo 10 MB por archivo
              </p>

              {fileError && <p className="driver-verification__message" role="alert">{fileError}</p>}
              {submitMessage && <p className="driver-verification__message" role="status">{submitMessage}</p>}

              <button className="driver-verification__submit" type="submit">
                Enviar documentos
              </button>
            </form>
          </section>

          <section className="driver-verification__card" aria-labelledby="progress-title">
            <h2 id="progress-title" className="driver-verification__card-title">
              Estado de la verificación
            </h2>

            <ol className="driver-verification__timeline">
              <VerificationStep
                title="Cuenta creada"
                description="Listo"
                status="complete"
              />
              <VerificationStep
                title="Selección de documentos"
                description={selectedCount === DOCUMENTS.length ? 'Listos para enviar' : `${selectedCount} de ${DOCUMENTS.length} seleccionados`}
                status="current"
              />
              <VerificationStep
                title="Revisión del administrador"
                description="Pendiente"
                status="pending"
              />
              <VerificationStep
                title="Cuenta verificada"
                description="Pendiente"
                status="pending"
                last
              />
            </ol>

            <p className="driver-verification__notice">
              La carga segura todavía no está conectada. Los archivos que selecciones permanecen en este navegador y no se envían ni se guardan.
            </p>
          </section>
        </div>
      </main>

      <Footer tagline="Matching de carga y transporte en Chiloé" />
    </div>
  )
}

function VerificationStep({ title, description, status, last = false }) {
  const Icon = status === 'complete' ? CircleCheck : status === 'current' ? CircleDot : Circle

  return (
    <li className={`driver-verification__step driver-verification__step--${status}${last ? ' driver-verification__step--last' : ''}`}>
      <Icon className="driver-verification__step-icon" size={18} aria-hidden="true" />
      <div>
        <p className="driver-verification__step-title">{title}</p>
        <p className="driver-verification__step-description">{description}</p>
      </div>
    </li>
  )
}
