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
const ACCEPTED_FILE_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png']

export default function DriverVerificationPage({ session, onLogout }) {
  const [files, setFiles] = useState({})
  const [fileError, setFileError] = useState('')

  const handleFileChange = (documentId, file) => {
    if (!file) return

    const extension = file.name.split('.').pop()?.toLocaleLowerCase('en')
    if (!ACCEPTED_FILE_TYPES.includes(file.type) && !ACCEPTED_FILE_EXTENSIONS.includes(extension)) {
      setFileError('El archivo debe estar en formato PDF, JPG o PNG.')
      return
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      setFileError(file.size === 0
        ? 'El archivo está vacío. Selecciona uno que contenga el documento.'
        : 'El archivo no puede superar los 10 MB.')
      return
    }

    setFileError('')
    setFiles((current) => ({ ...current, [documentId]: file }))
  }

  const selectedCount = DOCUMENTS.filter((document) => files[document.id]).length

  return (
    <div className="page driver-verification">
      <Navbar session={session} onLogout={onLogout} />

      <main className="page__main driver-verification__main">
        <h1 className="driver-verification__title">Prepara tus documentos</h1>
        <p className="driver-verification__subtitle">
          La revisión de tu cuenta todavía no ha comenzado. Puedes revisar y seleccionar los documentos solicitados aquí.
        </p>

        <div className="driver-verification__grid">
          <section className="driver-verification__card" aria-labelledby="documents-title">
            <h2 id="documents-title" className="driver-verification__card-title">
              Carga de documentos
            </h2>

            <div>
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
                        {file ? 'Solo en este navegador' : 'No seleccionado'}
                      </span>

                      <label className="driver-verification__upload">
                        <Upload size={15} aria-hidden="true" />
                        <span>{file ? 'Cambiar archivo' : 'Subir archivo'}</span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                          aria-label={`${file ? 'Cambiar' : 'Subir'} ${document.label.toLowerCase()}`}
                          aria-describedby="driver-verification-file-hint"
                          onChange={(event) => handleFileChange(document.id, event.target.files?.[0])}
                        />
                      </label>
                      {file && (
                        <button
                          className="driver-verification__remove"
                          type="button"
                          aria-label={`Quitar archivo de ${document.label.toLowerCase()}`}
                          onClick={() => setFiles((current) => {
                            const next = { ...current }
                            delete next[document.id]
                            return next
                          })}
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>

              <p id="driver-verification-file-hint" className="driver-verification__file-hint">
                PDF, JPG o PNG · Máximo 10 MB por archivo · Asegúrate de que el documento esté vigente y legible.
              </p>

              {fileError && <p className="driver-verification__message" role="alert">{fileError}</p>}

              <p className="driver-verification__submit-note" role="note">
                El servidor todavía no permite enviar documentos. Los archivos que seleccionas solo se revisan localmente y no se guardan al salir.
              </p>
            </div>
          </section>

          <section className="driver-verification__card" aria-labelledby="progress-title">
            <h2 id="progress-title" className="driver-verification__card-title">
              Pasos para preparar tu cuenta
            </h2>

            <ol className="driver-verification__timeline">
              <VerificationStep
                title="Cuenta creada"
                description="Listo"
                status="complete"
              />
              <VerificationStep
                title="Selección de documentos"
                description={`${selectedCount} de ${DOCUMENTS.length} seleccionados en este navegador`}
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
              La carga segura aún no está disponible. Los archivos seleccionados se perderán al cerrar o recargar esta página; no se envían ni guardan en el servidor y la revisión no ha comenzado.
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
