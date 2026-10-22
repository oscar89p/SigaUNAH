# Generación segura del hash del primer administrador

El backend usa `argon2.verify()` del paquete `argon2` versión `0.45.1`. El hash debe ser un string PHC Argon2id. Se usan explícitamente los valores predeterminados efectivos del paquete:

- algoritmo: `argon2id`
- versión: `19` (`0x13`)
- memoria: `65536` KiB
- iteraciones: `3`
- paralelismo: `4`
- longitud del hash: `32` bytes
- salt aleatorio generado por la librería

Desde `backend/`, pedir la contraseña por entrada estándar. El siguiente comando no incluye la contraseña en el historial:

```bash
read -r -s -p 'Contraseña: ' P; printf '\n'; printf '%s' "$P" | node --input-type=module -e 'import argon2 from "argon2"; let p=""; process.stdin.setEncoding("utf8"); process.stdin.on("data", c => p += c); process.stdin.on("end", async () => { const h = await argon2.hash(p, { type: argon2.argon2id, version: 0x13, memoryCost: 65536, timeCost: 3, parallelism: 4, hashLength: 32 }); process.stdout.write(`${h}\n`); });'; unset P
```

El resultado debe comenzar con:

```text
$argon2id$v=19$m=65536,t=3,p=4$
```

Pegar únicamente ese resultado en `@ClaveHash` del script SQL. Nunca pegar la contraseña original en el script, en el historial, en un ticket o en logs.
