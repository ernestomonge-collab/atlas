# Configuración de AWS S3 para Atlas

Este documento explica cómo configurar AWS S3 para habilitar la subida de archivos adjuntos en Atlas.

## Requisitos Previos

- Una cuenta de AWS (https://aws.amazon.com)
- Acceso al AWS Management Console

## Pasos de Configuración

### 1. Crear un Bucket de S3

1. Inicia sesión en AWS Console
2. Navega a **S3** (puedes buscarlo en la barra de búsqueda)
3. Haz clic en **"Create bucket"**
4. Configura el bucket:
   - **Bucket name**: `atlas-attachments` (o el nombre que prefieras)
   - **AWS Region**: Selecciona la región más cercana (ej: `us-east-1`)
   - **Block Public Access settings**: Mantén todas las opciones marcadas (los archivos serán privados)
   - Deja las demás opciones por defecto
5. Haz clic en **"Create bucket"**

### 2. Configurar CORS (Cross-Origin Resource Sharing)

1. Abre el bucket recién creado
2. Ve a la pestaña **"Permissions"**
3. Desplázate hasta **"Cross-origin resource sharing (CORS)"**
4. Haz clic en **"Edit"**
5. Pega la siguiente configuración:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "DELETE"
        ],
        "AllowedOrigins": [
            "http://localhost:3030",
            "https://tu-dominio.com"
        ],
        "ExposeHeaders": [
            "ETag"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

6. Reemplaza `https://tu-dominio.com` con tu dominio de producción
7. Haz clic en **"Save changes"**

### 3. Crear un Usuario IAM con Permisos S3

1. Navega a **IAM** en AWS Console
2. En el menú lateral, haz clic en **"Users"**
3. Haz clic en **"Create user"**
4. Configura el usuario:
   - **User name**: `atlas-s3-uploader`
   - **Access type**: Marca **"Programmatic access"** (no necesita acceso a la consola)
5. Haz clic en **"Next: Permissions"**

### 4. Asignar Permisos al Usuario

1. Selecciona **"Attach existing policies directly"**
2. Haz clic en **"Create policy"** (se abre en una nueva pestaña)
3. En la pestaña **"JSON"**, pega la siguiente política:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AtlasS3Upload",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::atlas-attachments/*"
        },
        {
            "Sid": "AtlasS3List",
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::atlas-attachments"
        }
    ]
}
```

4. Reemplaza `atlas-attachments` con el nombre de tu bucket
5. Haz clic en **"Next: Tags"** (opcional)
6. Haz clic en **"Next: Review"**
7. Nombra la política: `AtlasS3UploadPolicy`
8. Haz clic en **"Create policy"**

### 5. Adjuntar la Política al Usuario

1. Regresa a la pestaña de creación del usuario
2. Haz clic en el botón de **"Refresh"** para ver la nueva política
3. Busca y selecciona **"AtlasS3UploadPolicy"**
4. Haz clic en **"Next: Tags"** (opcional)
5. Haz clic en **"Next: Review"**
6. Haz clic en **"Create user"**

### 6. Guardar las Credenciales

⚠️ **IMPORTANTE**: Esta es la única vez que podrás ver las credenciales.

1. En la pantalla de confirmación, verás:
   - **Access key ID**: AKIAIOSFODNN7EXAMPLE
   - **Secret access key**: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

2. **Copia estas credenciales** o descarga el archivo CSV

3. Agrega estas credenciales a tu archivo `.env.local`:

```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID="tu-access-key-id"
AWS_SECRET_ACCESS_KEY="tu-secret-access-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET_NAME="atlas-attachments"
```

### 7. Configuración de Bucket Policy (Opcional - para acceso público)

Si quieres que los archivos sean accesibles públicamente (no recomendado para archivos sensibles):

1. Ve al bucket en S3
2. Pestaña **"Permissions"**
3. **"Block public access"** → **"Edit"** → Desmarca todas las opciones
4. En **"Bucket policy"**, pega:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::atlas-attachments/*"
        }
    ]
}
```

⚠️ **Nota**: Esto hace que todos los archivos sean públicos. Para mayor seguridad, usa URLs presignadas (ya implementadas).

## Verificación

1. Reinicia el servidor de desarrollo:
```bash
npm run dev
```

2. Intenta subir un archivo adjunto en una tarea
3. Verifica que el archivo aparezca en tu bucket de S3

## Costos Estimados

- **Almacenamiento S3**: ~$0.023 por GB/mes
- **Transferencia de datos**: Primeros 100 GB/mes gratis
- Para una organización pequeña (~50 usuarios, 10 GB de archivos): **~$0.25/mes**

## Seguridad

✅ **Implementado**:
- Autenticación de usuarios antes de generar URLs presignadas
- Validación de permisos (solo usuarios de la organización)
- URLs presignadas con expiración de 5 minutos
- Límite de tamaño de archivo (50 MB)

🔒 **Recomendaciones adicionales**:
- Habilita versionado del bucket para recuperar archivos eliminados
- Configura lifecycle policies para archivar archivos antiguos
- Usa CloudFront para mejorar el rendimiento (opcional)
- Habilita logging del bucket para auditoría

## Troubleshooting

### Error: "Access Denied"
- Verifica que las credenciales AWS sean correctas
- Verifica que la política IAM tenga los permisos necesarios
- Asegúrate de que el nombre del bucket sea correcto

### Error: "CORS error"
- Verifica la configuración CORS del bucket
- Asegúrate de que tu dominio esté en la lista AllowedOrigins

### Error: "File upload is not configured"
- Verifica que las variables de entorno estén configuradas correctamente
- Reinicia el servidor después de cambiar el archivo .env.local

## Alternativas

Si no deseas usar AWS S3, puedes usar:
- **Cloudflare R2**: Compatible con S3, más económico
- **DigitalOcean Spaces**: Interfaz más simple, precios fijos
- **Backblaze B2**: Más económico para almacenamiento a largo plazo

El código es compatible con cualquier servicio compatible con S3.
