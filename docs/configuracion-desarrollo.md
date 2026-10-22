# Configuración local de autenticación

Para desarrollo local se debe usar un archivo `.env` no versionado con:

```text
AUTH_COOKIE_SECURE=false
AUTH_ALLOWED_ORIGINS=http://localhost:5173
```

En ambientes públicos se debe usar HTTPS, `AUTH_COOKIE_SECURE=true` y configurar explícitamente:

```text
AUTH_ALLOWED_ORIGINS=https://sigaunah.systemstc.app
```

No se deben copiar credenciales reales, contraseñas ni valores de producción a ejemplos o documentación.
