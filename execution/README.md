# Execution Scripts (Livello 3)

Questa cartella contiene gli **script Python deterministici** per l'esecuzione.

## Cosa sono gli script di esecuzione?

Gli script di esecuzione sono tool che:
- Gestiscono chiamate API
- Elaborano dati
- Eseguono operazioni su file
- Interagiscono con database

## Caratteristiche

- **Deterministici**: Stesso input = stesso output
- **Affidabili**: Gestione errori robusta
- **Testabili**: Facili da testare in isolamento
- **Ben commentati**: Codice documentato

## Struttura tipica di uno script

```python
"""
Nome Script: nome_script.py
Descrizione: Cosa fa questo script
Input: Cosa riceve
Output: Cosa produce
"""

import os
from dotenv import load_dotenv

# Carica variabili d'ambiente
load_dotenv()

def main():
    """Funzione principale."""
    # Implementazione
    pass

if __name__ == "__main__":
    main()
```

## Convenzioni

- Usa `python-dotenv` per caricare le variabili d'ambiente da `.env`
- Aggiungi docstring a ogni funzione
- Gestisci sempre le eccezioni
- Log degli errori per debugging
