# Guida alla Migrazione da localStorage a Supabase

## ✅ Stato della Migrazione

La migrazione del codice è **COMPLETA**. Tutti i file sono stati aggiornati per usare Supabase invece di localStorage.

## 🎯 Prossimi Passi

### 1. Backup dei Dati Attuali (OBBLIGATORIO)

**Prima di eseguire l'applicazione**, fai il backup dei dati esistenti:

```bash
# Avvia l'applicazione con la versione VECCHIA (prima della migrazione)
# Se hai già commitato, fai checkout del branch di backup:
git checkout backup-before-supabase

# Avvia il server
npm run dev

# Apri http://localhost:3000
# Apri Console del browser (F12)
# Copia e incolla il contenuto di frontend/lib/backup-data.ts
# Esegui:
backupAllData()

# Verrà scaricato un file JSON con tutti i tuoi dati
# SALVA QUESTO FILE in un posto sicuro!
```

### 2. Creare lo Schema Database in Supabase

1. Vai su https://supabase.com/dashboard
2. Accedi al tuo progetto `ryeetpsgagsfsuukmqsq`
3. Vai su **SQL Editor** (menu laterale)
4. Copia e incolla il contenuto del file `supabase-schema.sql`
5. Clicca **Run** per eseguire lo script
6. Verifica che le tabelle siano state create:
   - Vai su **Table Editor**
   - Dovresti vedere `projects` e `tasks`

### 3. Verificare le Environment Variables

Le variabili sono già configurate in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ryeetpsgagsfsuukmqsq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

✅ Già fatto! Il file è git-ignored per sicurezza.

### 4. Avviare l'Applicazione con Supabase

```bash
# Torna al branch main con il codice migrato
git checkout main

# Avvia l'applicazione
cd frontend
npm run dev

# Apri http://localhost:3000
```

### 5. Migrare i Dati da localStorage a Supabase

**Se hai dati esistenti da migrare**:

```bash
# Apri http://localhost:3000
# Apri Console del browser (F12)
# Copia e incolla il contenuto di frontend/lib/migrate-to-supabase.ts
# Esegui:

// Importa le funzioni (copia tutto il contenuto del file migrate-to-supabase.ts)
// Poi esegui:
await migrateLocalStorageToSupabase()

// Verifica che la migrazione sia andata a buon fine:
await verifyMigration()
```

**Output atteso**:
```
🚀 Starting migration from localStorage to Supabase...
📦 Found X projects and Y tasks
✅ Migrated project: Nome Progetto
✅ Migrated task: Nome Task
...
🎉 Migration completed!
📊 Results:
  Projects: X success, 0 failed
  Tasks: Y success, 0 failed

✅ Verification successful!
📊 Database contains:
  Projects: X
  Tasks: Y
```

### 6. Test dell'Applicazione

Testa le seguenti funzionalità:

1. **Dashboard Progetti**
   - Crea nuovo progetto
   - Rinomina progetto
   - Elimina progetto

2. **Kanban Board**
   - Crea nuova task
   - Modifica task esistente
   - Drag & drop task tra colonne
   - Elimina task

3. **Sincronizzazione**
   - Apri http://localhost:3000 in due browser diversi
   - Crea una task in Chrome
   - Ricarica Firefox (F5)
   - La task dovrebbe apparire anche in Firefox

### 7. Deploy su Railway

Una volta verificato che tutto funziona localmente:

```bash
# Commit delle modifiche
git add .
git commit -m "feat: migrate from localStorage to Supabase database

- Add @supabase/supabase-js dependency
- Create Supabase client module
- Rewrite storage.ts to use Supabase instead of localStorage
- Update components for async data operations
- Add loading/error states
- Add data migration script

BREAKING CHANGE: localStorage data is no longer used. Run migration script to import existing data.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

git push origin main
```

**Configurare Railway**:

1. Vai su Railway Dashboard → Il tuo progetto
2. Settings → Variables
3. Aggiungi queste variabili:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://ryeetpsgagsfsuukmqsq.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5ZWV0cHNnYWdzZnN1dWttcXNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MTEwNDcsImV4cCI6MjA4NTE4NzA0N30.RekM-pOU9jRhl3dX_sFdTzoXqiHsd--yTQc2vGaIBQ4
   ```
4. Railway farà il redeploy automaticamente

**Verifica produzione**:
- Apri l'URL di produzione Railway
- Crea un progetto e una task
- Verifica che i dati siano visibili anche da localhost (dopo reload)

## 📋 Modifiche Apportate

### File Nuovi

1. ✅ `frontend/lib/supabase.ts` - Client Supabase
2. ✅ `frontend/lib/database.types.ts` - TypeScript types per DB
3. ✅ `frontend/lib/migrate-to-supabase.ts` - Script migrazione dati
4. ✅ `frontend/lib/backup-data.ts` - Script backup localStorage
5. ✅ `frontend/lib/restore-data.ts` - Script ripristino backup
6. ✅ `frontend/components/ProjectCardWrapper.tsx` - Wrapper async per ProjectCard
7. ✅ `supabase-schema.sql` - Schema completo database
8. ✅ `.env.local` - Environment variables (git-ignored)

### File Modificati

1. ✅ `frontend/lib/storage.ts` - **Completamente riscritto** per usare Supabase async
2. ✅ `frontend/components/KanbanBoard.tsx` - Aggiunto async/await, loading states, debounce
3. ✅ `frontend/app/page.tsx` - Aggiornati handler con async/await
4. ✅ `frontend/app/project/[id]/page.tsx` - Aggiunto async fetch del progetto
5. ✅ `frontend/package.json` - Aggiunta dipendenza `@supabase/supabase-js`

### File Backup

1. ✅ `frontend/lib/storage.ts.BACKUP` - Backup originale
2. ✅ `frontend/components/KanbanBoard.tsx.BACKUP` - Backup originale
3. ✅ `frontend/app/page.tsx.BACKUP` - Backup originale

## 🔄 Rollback (Se Necessario)

Se qualcosa va storto e vuoi tornare alla versione localStorage:

```bash
# Opzione A: Tornare al branch di backup
git checkout backup-before-supabase

# Opzione B: Ripristinare file specifici
cp frontend/lib/storage.ts.BACKUP frontend/lib/storage.ts
cp frontend/components/KanbanBoard.tsx.BACKUP frontend/components/KanbanBoard.tsx
cp frontend/app/page.tsx.BACKUP frontend/app/page.tsx

# Ripristina dati localStorage
# Apri browser console e usa la funzione restoreFromBackup()
# (vedi frontend/lib/restore-data.ts per istruzioni)
```

## 🎯 Comportamento Finale

- ✅ Tutti i dati sono salvati in PostgreSQL (Supabase)
- ✅ Sincronizzazione automatica tra localhost e produzione
- ✅ Dati condivisi tra tutti i browser/dispositivi
- ✅ Persistenza affidabile (nessun rischio di perdita dati)
- ✅ Pronto per funzionalità future (auth, real-time, multi-utente)

## 📊 Schema Database

### Tabella: `projects`
- `id` (UUID, PK)
- `name` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### Tabella: `tasks`
- `id` (UUID, PK)
- `title` (TEXT)
- `description` (TEXT)
- `priority` (TEXT: low/medium/high/urgent)
- `tags` (TEXT[])
- `prompt` (TEXT, nullable)
- `attachments` (JSONB)
- `status` (TEXT: planning/error/in-progress/human-review/ai-review/done)
- `order` (INTEGER, nullable)
- `project_id` (UUID, FK → projects.id, CASCADE DELETE)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

## 🚨 Note Importanti

1. **localStorage non è più usato** - Tutti i dati sono ora in Supabase
2. **Migrazione obbligatoria** - Se hai dati esistenti, esegui lo script di migrazione
3. **Connessione internet richiesta** - L'app ora necessita di connessione per funzionare
4. **Real-time sync non ancora implementato** - Serve F5 per vedere modifiche da altri client (feature futura)

## 🆘 Troubleshooting

### Problema: "Missing Supabase environment variables"

**Soluzione**: Verifica che `.env.local` esista nella root del progetto e contenga le variabili corrette.

### Problema: "Failed to load projects/tasks"

**Soluzione**: 
1. Verifica che lo schema database sia stato creato correttamente in Supabase
2. Verifica che le RLS policies permettano accesso pubblico
3. Controlla la console browser per errori dettagliati

### Problema: Dati non si sincronizzano tra browser

**Soluzione**: 
- Questo è normale! La sincronizzazione real-time non è ancora implementata
- Ricarica la pagina (F5) per vedere le modifiche più recenti
- Feature futura: Supabase Realtime subscriptions

### Problema: Voglio tornare a localStorage

**Soluzione**: Vedi sezione "Rollback" sopra

## 📚 Risorse

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

## ✅ Checklist Finale

Prima di considerare la migrazione completa:

- [ ] Schema database creato in Supabase
- [ ] Backup dati localStorage scaricato
- [ ] Applicazione avviata e testata localmente
- [ ] Dati migrati da localStorage a Supabase (se necessario)
- [ ] CRUD progetti funziona (create, read, update, delete)
- [ ] CRUD task funziona (create, read, update, delete)
- [ ] Drag & drop task funziona
- [ ] Environment variables configurate su Railway
- [ ] Deploy su Railway completato
- [ ] Applicazione production testata e funzionante

---

**Migrazione completata da Claude Sonnet 4.5 il 28 Gennaio 2026**
