#!/bin/bash

# Funzione per mostrare il messaggio di aiuto
function show_help() {
    echo "Uso: $0 [start|stop|help] [-v] [-f]"
    echo ""
    echo "start        Avvia i container. Usa -v per eseguire in modalità non detach."
    echo "stop         Ferma i container. Usa -f per forzare lo stop."
    echo "help         Mostra questo messaggio di aiuto."
    echo ""
    echo "Opzione -v:"
    echo "  Avvia i container in modalità non detach (vedi i log nel terminale)."
    echo "Opzione -f:"
    echo "  Forza lo stop dei container (equivalente a docker-compose down --volumes --remove-orphans)."
}

# Verifica se non ci sono parametri
if [ $# -eq 0 ]; then
    show_help
    exit 1
fi

# Variabile per la modalità detach
DETACH=true
FORCE=false

# Gestione dei parametri
while getopts ":vf" opt; do
  case $opt in
    v) DETACH=false ;;  # Modalità non detach
    f) FORCE=true ;;    # Forza lo stop
    \?) show_help; exit 1 ;;
  esac
done

# Comando principale
shift $((OPTIND - 1))  # Rimuove i parametri già letti

ACTION=$1  # Il primo parametro (start, stop, help)

# Verifica quale versione di Docker Compose è disponibile
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
elif command -v docker compose &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    echo "Docker Compose non trovato. Assicurati di avere Docker Compose installato."
    exit 1
fi

case $ACTION in
  start)
    if [ "$DETACH" = false ]; then
        echo "Avvio dei container in modalità non detach..."
        $COMPOSE_CMD up
    else
        echo "Avvio dei container in modalità detach..."
        $COMPOSE_CMD up -d
    fi
    ;;

  stop)
    if [ "$FORCE" = true ]; then
        echo "Fermando i container forzatamente..."
        $COMPOSE_CMD down --volumes --remove-orphans
    else
        echo "Fermando i container..."
        $COMPOSE_CMD down
    fi
    ;;

  help)
    show_help
    ;;

  *)
    echo "Errore: azione non valida."
    show_help
    exit 1
    ;;
esac
