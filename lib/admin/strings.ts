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
    contentTools: "Herramientas de contenido",
    dashboard: "Panel",
    messages: "Mensajes",
    services: "Servicios",
    toggleNavigation: "Alternar navegación",
  },

  dashboard: {
    greeting: "Bienvenido a Conciencia Inquieta",
    noArticles: "Aún no hay artículos",
    published: "Publicados",
    quickActions: "Acciones rápidas",
    recentArticles: "Artículos recientes",
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
