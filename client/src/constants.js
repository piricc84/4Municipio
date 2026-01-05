export const CATEGORIES = [
  { id: 'rifiuti', label: 'Rifiuti per strada', short: 'RF' },
  { id: 'luci', label: 'Guasti semafori o luci', short: 'LS' },
  { id: 'asfalto', label: 'Dissesto asfalto', short: 'AS' },
  { id: 'verde', label: 'Verde pubblico', short: 'VP' },
  { id: 'altro', label: 'Altro', short: 'AL' },
];

export const STATUS_OPTIONS = [
  { value: 'nuova', label: 'Nuova' },
  { value: 'in_lavorazione', label: 'In lavorazione' },
  { value: 'chiusa', label: 'Chiusa' },
];

export const CATEGORY_HINTS = {
  rifiuti: 'Indica tipo di rifiuti, volume e se ostacolano il passaggio.',
  luci: 'Specifica se si tratta di semaforo o illuminazione, e se e pericoloso.',
  asfalto: 'Descrivi buche, crepe o cedimenti e l\'eventuale rischio.',
  verde: 'Indica ramo pericolante, erba alta o manutenzione necessaria.',
  altro: 'Usa questa voce per segnalazioni diverse dalle categorie principali.',
};

export const ISSUE_PLACEHOLDERS = {
  rifiuti: 'Es. cumulo di sacchi e ingombranti sul marciapiede.',
  luci: 'Es. semaforo spento o lampione non funzionante.',
  asfalto: 'Es. buca profonda al centro della carreggiata.',
  verde: 'Es. ramo pericolante sopra il passaggio pedonale.',
  altro: 'Descrivi il problema principale.',
};
