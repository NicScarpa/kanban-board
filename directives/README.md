# Directives (Livello 1)

Questa cartella contiene le **Standard Operating Procedures (SOP)** in formato Markdown.

## Cosa sono le direttive?

Le direttive definiscono:
- **Obiettivi**: Cosa deve essere fatto
- **Input**: Dati o risorse necessarie
- **Tool/Script**: Quali script di esecuzione usare
- **Output**: Risultati attesi
- **Casi limite**: Scenari edge e come gestirli

## Come creare una nuova direttiva

1. Crea un file `.md` con nome descrittivo (es. `scrape_website.md`)
2. Usa il seguente template:

```markdown
# Nome della Direttiva

## Obiettivo
[Cosa deve fare questa direttiva]

## Input
- [Elenco degli input necessari]

## Script di Esecuzione
- `execution/nome_script.py` - [Descrizione]

## Output
- [Risultati attesi]

## Casi Limite
- [Scenario 1]: [Come gestirlo]
- [Scenario 2]: [Come gestirlo]

## Note
[Informazioni aggiuntive, limiti API scoperti, ecc.]
```

## Principi

- Le direttive sono **documenti vivi**: aggiornale quando impari qualcosa di nuovo
- Scrivi come se stessi istruendo un dipendente di medio livello
- Includi sempre i casi limite e gli errori comuni
