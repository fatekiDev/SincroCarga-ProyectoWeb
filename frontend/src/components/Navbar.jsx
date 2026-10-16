import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, UserRound } from 'lucide-react';
import { getHomePath } from '../auth/session';
import logo from '../assets/logoprincipal.svg';
import LogoutButton from './LogoutButton';
import './Navbar.css';

const CLIENT_NAV_ITEMS = [
  { key: 'publicar', label: 'Publicar', path: '/publicar' },
  { key: 'matching', label: 'Matching', path: '/matching' },
  { key: 'pagos', label: 'Pagos seguros', path: '/pagos' },
];

export default function Navbar({ activeSection, session, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const initialName = session.name || (session.email || 'Mi cuenta').split('@')[0].replace(/[._-]+/g, ' ');
  const profileKey = `sincrocarga.profile.${session.id ?? session.email}`;
  const [savedProfile, setSavedProfile] = useState(() => {
    try {
      const storedProfile = JSON.parse(localStorage.getItem(profileKey) || 'null');
      return {
        name: storedProfile?.name || initialName,
        avatar: storedProfile?.avatar || '',
      };
    } catch (error) {
      console.error('No se pudo cargar la personalización local del perfil:', error);
      return { name: initialName, avatar: '' };
    }
  });
  const [profileOpen, setProfileOpen] = useState(false);
  const [draftName, setDraftName] = useState(savedProfile.name);
  const [draftAvatar, setDraftAvatar] = useState(savedProfile.avatar);
  const [profileError, setProfileError] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const isDriver = session.role === 'camionero';
  const isVerifiedDriver = isDriver
    && session.verificationStatus === 'Verificado'
    && session.carrierActive !== false;
  const navItems = isDriver && !isVerifiedDriver
    ? [{ key: 'verification', label: 'Verificación', path: '/verificacion' }]
    : isDriver
    ? [
      { key: 'inicio', label: 'Inicio', path: '/dashboard' },
      { key: 'publicar', label: 'Publicar espacio', path: '/publicar' },
      { key: 'matching', label: 'Buscar cargas', path: '/matching' },
      { key: 'viajes', label: 'Mis viajes', path: '/viajes' },
    ]
    : CLIENT_NAV_ITEMS;
  const user = {
    name: savedProfile.name || initialName,
    roleLabel: isDriver ? 'Camionero' : 'Cliente',
    initials: getInitials(savedProfile.name || initialName),
  };
  const homePath = getHomePath(session);

  const openProfileEditor = () => {
    setDraftName(savedProfile.name);
    setDraftAvatar(savedProfile.avatar);
    setProfileError('');
    setProfileMessage('');
    setProfileOpen(true);
  };

  const handleAvatarChange = (event) => {
    const [file] = event.target.files || [];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setProfileError('Selecciona una imagen válida.')
      return
    }
    if (file.size > 1024 * 1024) {
      setProfileError('La imagen debe pesar menos de 1 MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setDraftAvatar(reader.result)
        setProfileError('')
      } else {
        setProfileError('No se pudo leer la imagen seleccionada.')
      }
    }
    reader.onerror = () => setProfileError('No se pudo leer la imagen seleccionada.')
    reader.readAsDataURL(file)
  };

  const saveProfile = (event) => {
    event.preventDefault()
    const name = draftName.trim()
    if (!name) {
      setProfileError('Escribe el nombre que quieres mostrar.')
      return
    }
    try {
      const profile = { name, avatar: draftAvatar }
      localStorage.setItem(profileKey, JSON.stringify(profile))
      setSavedProfile(profile)
      setProfileMessage('Se guardó la personalización en este navegador.')
      setProfileOpen(false)
    } catch (error) {
      console.error('No se pudo guardar la personalización local del perfil:', error)
      setProfileError('No se pudo guardar. Prueba con una imagen más pequeña o libera espacio del navegador.')
    }
  };

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link to={homePath} className="navbar__brand" aria-label="SincroCarga, ir al inicio">
          <div className="navbar__logo">
            <img src={logo} alt="" aria-hidden="true" />
          </div>
          <div>
            <p className="navbar__brand-title">SincroCarga</p>
            <p className="navbar__brand-subtitle">Carga y transporte, sin viajes vacíos</p>
          </div>
        </Link>

        <nav
          id="authenticated-navigation"
          className={`navbar__links${menuOpen ? ' navbar__links--open' : ''}`}
          aria-label="Navegación principal"
        >
          {navItems.map((item) => {
            const isActive = item.key === activeSection;
            return (
              <Link
                key={item.key}
                to={item.path}
                className={`navbar__link ${isActive ? 'navbar__link--active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setMenuOpen(false)}
              >
                {isActive && <span className="navbar__dot" />}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          className="navbar__menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="authenticated-navigation"
          aria-label={menuOpen ? 'Cerrar navegación' : 'Abrir navegación'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span aria-hidden="true">{menuOpen ? '×' : '☰'}</span>
        </button>

        <div className="navbar__user">
          <div className="navbar__user-text">
            <p className="navbar__user-name">{user.name}</p>
            <p className="navbar__user-role">{user.roleLabel} · {session.email}</p>
          </div>
          <div className="navbar__avatar-wrap">
            <div className="navbar__avatar" aria-label={`Perfil de ${user.name}`}>
              {savedProfile.avatar
                ? <img src={savedProfile.avatar} alt="" />
                : <><span>{user.initials}</span><UserRound size={17} aria-hidden="true" /></>}
            </div>
            <button
              className="navbar__profile-edit"
              type="button"
              aria-label="Editar nombre y foto de perfil"
              onClick={openProfileEditor}
            >
              <Pencil size={12} aria-hidden="true" />
            </button>
          </div>
          {onLogout && <LogoutButton className="navbar__logout" onLogout={onLogout} />}
        </div>
      </div>
      {profileMessage && <p className="navbar__profile-message" role="status">{profileMessage}</p>}
      {profileOpen && (
        <div className="navbar__profile-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setProfileOpen(false)
        }}>
          <section className="navbar__profile-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-dialog-title">
            <h2 id="profile-dialog-title">Personaliza tu perfil</h2>
            <p>Este nombre y esta foto solo se guardan en este navegador; no modifican los datos de tu cuenta.</p>
            <form onSubmit={saveProfile}>
              <label className="navbar__profile-label" htmlFor="profile-display-name">Nombre para mostrar</label>
              <input
                id="profile-display-name"
                maxLength={80}
                required
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
              />
              <label className="navbar__profile-label" htmlFor="profile-avatar-file">Foto de perfil (opcional)</label>
              <input
                id="profile-avatar-file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
              />
              <p className="navbar__profile-hint">Si no eliges una foto, mostraremos tus iniciales. Imagen máxima: 1 MB.</p>
              {draftAvatar && (
                <button type="button" className="navbar__profile-remove" onClick={() => setDraftAvatar('')}>
                  Usar avatar predeterminado
                </button>
              )}
              {profileError && <p className="navbar__profile-error" role="alert">{profileError}</p>}
              <div className="navbar__profile-actions">
                <button type="button" onClick={() => setProfileOpen(false)}>Cancelar</button>
                <button type="submit">Guardar en este navegador</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </header>
  );
}

function getInitials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toLocaleUpperCase('es-CL')
    : (parts[0]?.slice(0, 2) || 'SC').toLocaleUpperCase('es-CL')
}
