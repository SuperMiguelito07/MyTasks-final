# MyTask - Aplicació de Gestió de Tasques

MyTask és una aplicació web per a la gestió de projectes i tasques personals i col·laboratives, desenvolupada amb React i Supabase. L'aplicació és completament responsive i es pot utilitzar tant en ordinadors d'escriptori com en dispositius mòbils.

## Descripció del Projecte

MyTask és una aplicació de gestió de tasques amb un tauler Kanban que permet als usuaris organitzar les seves tasques en tres columnes: "To Do", "Doing" i "Done". L'aplicació permet crear, editar i eliminar projectes i tasques, així com assignar tasques a usuaris i establir dates de venciment.

## Característiques Principals

- **Autenticació d'usuaris**: Registre i inici de sessió mitjançant Supabase
- **Gestió de projectes**: Creació, edició i eliminació de projectes
- **Gestió de tasques**: Creació, edició, eliminació i assignació de tasques
- **Tauler Kanban**: Visualització i gestió de tasques en format Kanban
- **Dates de venciment**: Assignació de dates de venciment a les tasques
- **Disseny responsive**: Completament adaptable a dispositius mòbils i d'escriptori
- **Notificacions**: Sistema de notificacions per correu electrònic i SMS
- **Interacció tàctil**: Suport per a interaccions tàctils en dispositius mòbils

## Tecnologies Utilitzades

- **Frontend**: React, TypeScript, CSS
- **Backend**: Supabase (autenticació, base de dades, emmagatzematge)
- **Gestió d'estat**: Context API de React
- **Routing**: React Router
- **Notificacions**: SendGrid (correu electrònic), Twilio (SMS)
- **Desplegament**: Netlify

## Estructura de la Base de Dades

- **users**: Informació dels usuaris (id, name, email, phone_number, created_at)
- **projects**: Projectes creats pels usuaris (id, name, description, owner_id, created_at, is_archived)
- **tasks**: Tasques associades als projectes (id, project_id, title, description, status, created_at, due_date, assigned_to, is_archived)
- **notifications**: Notificacions per als usuaris (id, user_id, message, read, created_at, related_task_id, related_project_id)
- **user_preferences**: Preferències de notificació dels usuaris (id, user_id, email_notifications, sms_notifications)
- **email_logs**: Registre de correus enviats (id, user_id, subject, sent_at, status)
- **sms_logs**: Registre de SMS enviats (id, user_id, message, sent_at, status)

## Estat Actual del Projecte

S'han implementat les següents funcionalitats:

- Autenticació d'usuaris (registre i inici de sessió)
- Creació i gestió de projectes
- Creació i gestió de tasques
- Tauler Kanban per visualitzar i gestionar tasques
- Assignació de tasques a usuaris
- Sistema de notificacions per correu electrònic i SMS
- Disseny responsive per a dispositius mòbils
- Interacció tàctil per a dispositius mòbils

## Pròxims Passos

- Implementació de notificacions en temps real amb Supabase Realtime
- Millora dels filtres i cerca de tasques
- Implementació d'estadístiques i gràfics de rendiment
- Tests unitaris i d'integració
- Millora de l'accessibilitat

## Configuració del Projecte

### Requisits Previs

- Node.js (v14 o superior)
- npm o yarn
- Compte a Supabase
- Compte a SendGrid (opcional, per a notificacions per correu)
- Compte a Twilio (opcional, per a notificacions per SMS)

### Instal·lació

1. Clona el repositori
   ```
   git clone https://github.com/yourusername/mytask.git
   cd mytask
   ```

2. Instal·la les dependències
   ```
   npm install
   ```

3. Crea un fitxer `.env.local` a l'arrel del projecte amb les teves credencials
   ```
   # Supabase
   REACT_APP_SUPABASE_URL=https://your-supabase-url.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
   
   # SendGrid (opcional)
   REACT_APP_SENDGRID_API_KEY=your-sendgrid-api-key
   REACT_APP_SENDER_EMAIL=your-sender-email@example.com
   
   # Twilio (opcional)
   REACT_APP_TWILIO_ACCOUNT_SID=your-twilio-account-sid
   REACT_APP_TWILIO_AUTH_TOKEN=your-twilio-auth-token
   REACT_APP_TWILIO_PHONE_NUMBER=your-twilio-phone-number
   ```

4. Configura la base de dades executant l'script SQL inclòs
   ```
   psql -h your-supabase-host -U postgres -d postgres -f complete_database_setup.sql
   ```
   
   O importa l'script a través de l'editor SQL de Supabase.

5. Inicia l'aplicació en mode desenvolupament
   ```
   npm start
   ```

## Scripts Disponibles

### `npm start`

Executa l'aplicació en mode desenvolupament.
Obre [http://localhost:3000](http://localhost:3000) per veure-la al navegador.

### `npm run build`

Compila l'aplicació per a producció a la carpeta `build`.
Optimitza la compilació per obtenir el millor rendiment.

## Desplegament a Netlify

L'aplicació està configurada per a ser desplegada fàcilment a Netlify:

1. Crea un compte a [Netlify](https://www.netlify.com/) si encara no en tens un.

2. Connecta el teu repositori de GitHub, GitLab o Bitbucket a Netlify.

3. Configura el desplegament amb els següents paràmetres:
   - Build command: `npm run build`
   - Publish directory: `build`

4. Configura les variables d'entorn a Netlify:
   - REACT_APP_SUPABASE_URL
   - REACT_APP_SUPABASE_ANON_KEY
   - REACT_APP_SENDGRID_API_KEY (opcional)
   - REACT_APP_SENDER_EMAIL (opcional)
   - REACT_APP_TWILIO_ACCOUNT_SID (opcional)
   - REACT_APP_TWILIO_AUTH_TOKEN (opcional)
   - REACT_APP_TWILIO_PHONE_NUMBER (opcional)

5. Desplega l'aplicació i accedeix a la URL proporcionada per Netlify.

## Contribució

Les contribucions són benvingudes! Si vols contribuir al projecte, segueix aquests passos:

1. Fes un fork del repositori
2. Crea una branca per a la teva funcionalitat (`git checkout -b feature/amazing-feature`)
3. Fes commit dels teus canvis (`git commit -m 'Add some amazing feature'`)
4. Puja la branca (`git push origin feature/amazing-feature`)
5. Obre una Pull Request

## Llicència

Distribuït sota la llicència MIT. Consulta el fitxer `LICENSE` per a més informació.