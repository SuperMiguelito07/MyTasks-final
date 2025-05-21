# MyTask - Aplicació de Gestió de Tasques

MyTask és una aplicació web per a la gestió de projectes i tasques personals i col·laboratives, desenvolupada amb React i Supabase.

## Descripció del Projecte

MyTask és una aplicació de gestió de tasques amb un tauler Kanban que permet als usuaris organitzar les seves tasques en tres columnes: "To Do", "Doing" i "Done". L'aplicació permet crear, editar i eliminar projectes i tasques, així com assignar tasques a usuaris i establir dates de venciment.

## Característiques Principals

- **Autenticació d'usuaris**: Registre i inici de sessió mitjançant Supabase
- **Gestió de projectes**: Creació, edició i eliminació de projectes
- **Gestió de tasques**: Creació, edició, eliminació i assignació de tasques
- **Tauler Kanban**: Visualització i gestió de tasques en format Kanban
- **Dates de venciment**: Assignació de dates de venciment a les tasques
- **Disseny responsive**: Adaptable a diferents dispositius

## Tecnologies Utilitzades

- **Frontend**: React, TypeScript, CSS
- **Backend**: Supabase (autenticació, base de dades, emmagatzematge)
- **Gestió d'estat**: Context API de React
- **Routing**: React Router

## Estructura de la Base de Dades

- **users**: Informació dels usuaris (id, name, email, created_at)
- **projects**: Projectes creats pels usuaris (id, name, description, owner_id, created_at, is_archived)
- **tasks**: Tasques associades als projectes (id, project_id, title, description, status, created_at, due_date, assigned_to, is_archived)
- **notifications**: Notificacions per als usuaris (id, user_id, message, read, created_at, related_task_id, related_project_id)

## Estat Actual del Projecte

S'han implementat les següents funcionalitats:

- Autenticació d'usuaris (registre i inici de sessió)
- Creació i gestió de projectes
- Creació i gestió de tasques
- Tauler Kanban per visualitzar i gestionar tasques
- Assignació de tasques a usuaris

## Pròxims Passos

- Implementació de notificacions en temps real
- Millora de la interfície d'usuari
- Implementació de filtres i cerca de tasques
- Millora de la gestió d'errors
- Tests unitaris i d'integració

## Configuració del Projecte

### Requisits Previs

- Node.js (v14 o superior)
- npm o yarn
- Compte a Supabase

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

3. Crea un fitxer `.env.local` a l'arrel del projecte amb les teves credencials de Supabase
   ```
   REACT_APP_SUPABASE_URL=https://your-supabase-url.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Inicia l'aplicació en mode desenvolupament
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

## Contribució

Les contribucions són benvingudes! Si vols contribuir al projecte, segueix aquests passos:

1. Fes un fork del repositori
2. Crea una branca per a la teva funcionalitat (`git checkout -b feature/amazing-feature`)
3. Fes commit dels teus canvis (`git commit -m 'Add some amazing feature'`)
4. Puja la branca (`git push origin feature/amazing-feature`)
5. Obre una Pull Request

## Llicència

Distribuït sota la llicència MIT. Consulta el fitxer `LICENSE` per a més informació.
