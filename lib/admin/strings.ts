/**
 * Central Spanish (es-ES) copy for the Conciencia Inquieta admin UI.
 *
 * Single source of truth for all admin-facing strings. The admin is
 * single-language (Spanish), so there is no i18n library and no runtime
 * locale switching — just this typed, `as const` dictionary. Import `t`
 * (or the default export) and read the strings you need; keep every new
 * admin string here rather than hardcoding it in components.
 *
 * Editorial register: magazine/professional, "tú"/neutral, not overly formal.
 * "Conciencia Inquieta" (brand) and the "/articulos/" URL fragment stay as-is.
 */

export const t = {
  common: {
    cancel: "Cancelar",
    delete: "Eliminar",
    deleting: "Eliminando...",
    draft: "Borrador",
    min: "min",
    minRead: "min de lectura",
    published: "Publicado",
    read: "Leído",
    saving: "Guardando...",
    signOut: "Cerrar sesión",
  },

  nav: {
    admin: "Admin",
    articles: "Artículos",
    bookings: "Reservas",
    contentTools: "Herramientas de contenido",
    dashboard: "Panel",
    messages: "Mensajes",
    services: "Servicios",
    subscribers: "Suscriptores",
    toggleNavigation: "Alternar navegación",
  },

  dashboard: {
    greeting: "Bienvenido a Conciencia Inquieta",
    newService: "Nuevo servicio",
    noArticles: "Aún no hay artículos",
    pendingBookings: "Reservas sin leer",
    published: "Publicados",
    quickActions: "Acciones rápidas",
    recentArticles: "Artículos recientes",
    services: "Servicios",
    subscribers: "Suscriptores",
    subtitle: "Administración de la revista digital — artículos, categorías y autoras",
    totalArticles: "Artículos totales",
    writeArticle: "Escribir un artículo",
  },

  articles: {
    empty: "Aún no hay artículos. Crea tu primer artículo para empezar.",
    newArticle: "Nuevo artículo",
    title: "Artículos",
    tableAuthor: "Autora",
    tableCategory: "Categoría",
    tableImage: "Imagen",
    tablePublished: "Publicado",
    tableReadingTime: "Tiempo de lectura",
    tableStatus: "Estado",
    tableTitle: "Título",
  },

  editor: {
    altPlaceholder: "Describe la imagen para lectores de pantalla",
    author: "Autora",
    authorPlaceholder: "Selecciona una autora",
    backToArticles: "Artículos",
    category: "Categoría",
    categoryPlaceholder: "Selecciona una categoría",
    categoryRequired: "La categoría es obligatoria",
    confirmDeleteMessage: "¿Seguro que quieres eliminar este artículo? Esta acción no se puede deshacer.",
    confirmDeleteTitle: "Eliminar artículo",
    content: "Contenido",
    contentPlaceholder: "Escribe el artículo en Markdown...",
    deleteArticle: "Eliminar artículo",
    discard: "Descartar",
    featuredImage: "Imagen destacada",
    featuredImageAlt: "Texto alternativo de la imagen",
    metaDescription: "Meta descripción",
    metaDescriptionPlaceholder: "Descripción breve para los resultados de búsqueda",
    metaTitle: "Meta título",
    metaTitlePlaceholder: "Título de página personalizado para los buscadores",
    previewEmpty: "La vista previa aparecerá aquí...",
    publish: "Publicar",
    publishDate: "Fecha de publicación",
    published: "Publicado",
    publishing: "Publicación",
    restore: "Restaurar",
    restoreDraftPrompt: "Encontramos un borrador sin guardar. ¿Quieres restaurarlo?",
    saveDraft: "Guardar borrador",
    seo: "SEO",
    slugPlaceholder: "titulo-del-articulo",
    subtitle: "Subtítulo / entradilla",
    subtitlePlaceholder: "Una o dos frases — se muestran bajo el título y como resumen en la tarjeta",
    tags: "Etiquetas",
    tagsPlaceholder: "Añade una etiqueta y pulsa Enter",
    titlePlaceholder: "Título del artículo",
    titleRequired: "El título es obligatorio",
    toastCreated: "Artículo creado correctamente",
    toastDeleteFailed: "No se pudo eliminar el artículo",
    toastError: "Algo salió mal",
    toastSaved: "Artículo guardado correctamente",
    unsavedWarning: "Tienes cambios sin guardar.",
  },

  messages: {
    empty: "Aún no hay mensajes.",
    subtitle: "Mensajes del formulario de contacto del sitio público",
    title: "Mensajes",
  },

  subscribers: {
    count: "suscriptores",
    empty: "Aún no hay suscriptores.",
    exportCsv: "Exportar CSV",
    subtitle: "Personas suscritas al boletín desde el sitio público",
    title: "Suscriptores",
  },

  services: {
    empty: "Aún no hay servicios. Crea tu primer servicio para empezar.",
    newService: "Nuevo servicio",
    title: "Servicios",
    tableImage: "Imagen",
    tablePrice: "Precio",
    tableStatus: "Estado",
    tableTitle: "Título",
    tableUpdated: "Actualizado",
  },

  serviceEditor: {
    addImage: "Añadir imagen",
    backToServices: "Servicios",
    confirmDeleteMessage: "¿Seguro que quieres eliminar este servicio? Esta acción no se puede deshacer.",
    confirmDeleteTitle: "Eliminar servicio",
    coverBadge: "Portada",
    deleteService: "Eliminar servicio",
    description: "Descripción",
    descriptionPlaceholder: "Describe el servicio con detalle. Puedes usar Markdown ligero (negrita, listas, enlaces).",
    images: "Imágenes",
    imagesHint: "La primera imagen es la portada. Arrastra, haz clic o pega para subir. JPG, PNG, WebP o GIF · máx. 10 MB.",
    imageAlt: "Texto alternativo de las imágenes",
    imageAltPlaceholder: "Describe las imágenes para lectores de pantalla",
    makeCover: "Hacer portada",
    price: "Precio (opcional)",
    pricePlaceholder: "Ej. Desde 50€ · Consultar · 80€/sesión",
    published: "Publicado",
    publishing: "Publicación",
    remove: "Quitar",
    saveDraft: "Guardar borrador",
    publish: "Publicar",
    slugPlaceholder: "nombre-del-servicio",
    sortOrder: "Orden",
    sortOrderHint: "Menor primero",
    summary: "Resumen",
    summaryPlaceholder: "Una o dos frases — se muestran en la tarjeta del servicio",
    titlePlaceholder: "Título del servicio",
    titleRequired: "El título es obligatorio",
    toastCreated: "Servicio creado correctamente",
    toastDeleteFailed: "No se pudo eliminar el servicio",
    toastError: "Algo salió mal",
    toastSaved: "Servicio guardado correctamente",
    uploadError: "No se pudo subir la imagen. Inténtalo de nuevo.",
    uploading: "Subiendo...",
  },

  bookings: {
    empty: "Aún no hay solicitudes de reserva.",
    phone: "Teléfono",
    service: "Servicio",
    subtitle: "Solicitudes de reserva enviadas desde la página de servicios",
    title: "Reservas",
  },

  login: {
    email: "Correo electrónico",
    password: "Contraseña",
    passwordPlaceholder: "Introduce tu contraseña",
    signIn: "Iniciar sesión",
    signingIn: "Iniciando sesión...",
    title: "Portal de administración",
  },
} as const;

export default t;
