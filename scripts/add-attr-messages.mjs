// 临时脚本：把属性字典的翻译键注入 9 个 messages/*.json（幂等，重复运行覆盖同名键）。
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIR = join(import.meta.dirname, "..", "messages");
const LOCALES = ["es", "en", "fr", "de", "it", "pt", "nl", "pl", "zh"];

/** key → { locale: text } */
const T = {
  "admin.nav.attributes": {
    es: "Atributos", en: "Attributes", fr: "Attributs", de: "Attribute",
    it: "Attributi", pt: "Atributos", nl: "Attributen", pl: "Atrybuty", zh: "属性",
  },
  "admin.page.attributes": {
    es: "Diccionario de atributos", en: "Attribute dictionary",
    fr: "Dictionnaire d'attributs", de: "Attribut-Wörterbuch",
    it: "Dizionario degli attributi", pt: "Dicionário de atributos",
    nl: "Attributenwoordenboek", pl: "Słownik atrybutów", zh: "属性字典",
  },
  "admin.page.attributesSub": {
    es: "Claves de atributo y nombres en 9 idiomas unificados: compartidos por compatibilidad, especificaciones, IA e importación",
    en: "Unified attribute keys and 9-language names, shared by accessory matching, spec tables, AI intake and bulk import",
    fr: "Clés d'attribut et noms en 9 langues unifiés : partagés par la compatibilité, les spécifications, l'IA et l'import",
    de: "Einheitliche Attribut-Keys und Namen in 9 Sprachen – genutzt von Zubehör-Matching, Spezifikationen, KI-Erfassung und Import",
    it: "Chiavi attributo e nomi in 9 lingue unificati: condivisi da abbinamento accessori, specifiche, IA e importazione",
    pt: "Chaves de atributo e nomes em 9 idiomas unificados: compartilhados por compatibilidade, especificações, IA e importação",
    nl: "Uniforme attribuutsleutels en namen in 9 talen: gedeeld door accessoire-matching, specificaties, AI-invoer en import",
    pl: "Ujednolicone klucze atrybutów i nazwy w 9 językach: wspólne dla dopasowania akcesoriów, specyfikacji, AI i importu",
    zh: "统一属性 key 与 9 语言名称：供配件匹配、规格表、AI 录入与批量导入共用",
  },
  "admin.attr.addTitle": {
    es: "Nuevo atributo", en: "New attribute", fr: "Nouvel attribut", de: "Neues Attribut",
    it: "Nuovo attributo", pt: "Novo atributo", nl: "Nieuw attribuut", pl: "Nowy atrybut", zh: "新增属性",
  },
  "admin.attr.keyLabel": {
    es: "Clave (key)", en: "Key", fr: "Clé (key)", de: "Key",
    it: "Chiave (key)", pt: "Chave (key)", nl: "Sleutel (key)", pl: "Klucz (key)", zh: "属性 Key",
  },
  "admin.attr.keyPh": {
    es: "cct / pcbWidth", en: "cct / pcbWidth", fr: "cct / pcbWidth", de: "cct / pcbWidth",
    it: "cct / pcbWidth", pt: "cct / pcbWidth", nl: "cct / pcbWidth", pl: "cct / pcbWidth", zh: "cct / pcbWidth",
  },
  "admin.attr.keyHint": {
    es: "Empieza con letra; solo letras/números/guion bajo. No se puede cambiar después",
    en: "Starts with a letter; letters/digits/underscore only. Cannot be changed later",
    fr: "Commence par une lettre ; lettres/chiffres/underscore uniquement. Non modifiable ensuite",
    de: "Beginnt mit Buchstabe; nur Buchstaben/Ziffern/Unterstrich. Später nicht änderbar",
    it: "Inizia con una lettera; solo lettere/numeri/underscore. Non modificabile in seguito",
    pt: "Começa com letra; apenas letras/números/sublinhado. Não pode ser alterado depois",
    nl: "Begint met een letter; alleen letters/cijfers/underscore. Achteraf niet te wijzigen",
    pl: "Zaczyna się literą; tylko litery/cyfry/podkreślnik. Nie można później zmienić",
    zh: "字母开头，仅字母/数字/下划线；创建后不可修改",
  },
  "admin.attr.nameLabel": {
    es: "Nombre (multilingüe)", en: "Name (multilingual)", fr: "Nom (multilingue)",
    de: "Name (mehrsprachig)", it: "Nome (multilingue)", pt: "Nome (multilíngue)",
    nl: "Naam (meertalig)", pl: "Nazwa (wielojęzyczna)", zh: "显示名（多语言）",
  },
  "admin.attr.namePh": {
    es: "Temperatura de color", en: "Temperatura de color", fr: "Temperatura de color",
    de: "Temperatura de color", it: "Temperatura de color", pt: "Temperatura de color",
    nl: "Temperatura de color", pl: "Temperatura de color", zh: "如 Temperatura de color",
  },
  "admin.attr.nameHint": {
    es: "Escribe el nombre fuente en español (igual que el contenido del producto)",
    en: "Write the source name in Spanish (same as product source content)",
    fr: "Saisissez le nom source en espagnol (comme le contenu produit)",
    de: "Quellnamen auf Spanisch eingeben (wie der Produkt-Quellinhalt)",
    it: "Scrivi il nome sorgente in spagnolo (come il contenuto del prodotto)",
    pt: "Escreva o nome fonte em espanhol (igual ao conteúdo do produto)",
    nl: "Vul de bronnaam in het Spaans in (zoals de productbroninhoud)",
    pl: "Wpisz nazwę źródłową po hiszpańsku (jak treść źródłowa produktu)",
    zh: "源语言请用西语填写（与产品源内容一致）",
  },
  "admin.attr.typeLabel": {
    es: "Tipo", en: "Type", fr: "Type", de: "Typ", it: "Tipo", pt: "Tipo",
    nl: "Type", pl: "Typ", zh: "类型",
  },
  "admin.attr.typeText": {
    es: "Texto", en: "Text", fr: "Texte", de: "Text", it: "Testo", pt: "Texto",
    nl: "Tekst", pl: "Tekst", zh: "文本",
  },
  "admin.attr.typeNumber": {
    es: "Número", en: "Number", fr: "Nombre", de: "Zahl", it: "Numero", pt: "Número",
    nl: "Getal", pl: "Liczba", zh: "数字",
  },
  "admin.attr.typeSelect": {
    es: "Opciones", en: "Select", fr: "Options", de: "Auswahl", it: "Opzioni", pt: "Opções",
    nl: "Keuzelijst", pl: "Lista opcji", zh: "枚举",
  },
  "admin.attr.unitLabel": {
    es: "Unidad", en: "Unit", fr: "Unité", de: "Einheit", it: "Unità", pt: "Unidade",
    nl: "Eenheid", pl: "Jednostka", zh: "单位",
  },
  "admin.attr.unitPh": {
    es: "mm / V / W / K", en: "mm / V / W / K", fr: "mm / V / W / K", de: "mm / V / W / K",
    it: "mm / V / W / K", pt: "mm / V / W / K", nl: "mm / V / W / K", pl: "mm / V / W / K", zh: "mm / V / W / K",
  },
  "admin.attr.optionsLabel": {
    es: "Valores predefinidos", en: "Preset options", fr: "Valeurs prédéfinies",
    de: "Vordefinierte Werte", it: "Valori predefiniti", pt: "Valores predefinidos",
    nl: "Vooraf ingestelde waarden", pl: "Wartości predefiniowane", zh: "预设选项",
  },
  "admin.attr.optionsPh": {
    es: "Escribe y pulsa Enter", en: "Type and press Enter", fr: "Saisir puis Entrée",
    de: "Eingeben und Enter drücken", it: "Scrivi e premi Invio", pt: "Digite e pressione Enter",
    nl: "Typ en druk op Enter", pl: "Wpisz i naciśnij Enter", zh: "输入后回车添加",
  },
  "admin.attr.optionsHint": {
    es: "Valores físicos independientes del idioma, p. ej. 24V, IP65",
    en: "Language-independent physical values, e.g. 24V, IP65",
    fr: "Valeurs physiques indépendantes de la langue, ex. 24V, IP65",
    de: "Sprachunabhängige physikalische Werte, z. B. 24V, IP65",
    it: "Valori fisici indipendenti dalla lingua, es. 24V, IP65",
    pt: "Valores físicos independentes do idioma, ex. 24V, IP65",
    nl: "Taalonafhankelijke fysieke waarden, bijv. 24V, IP65",
    pl: "Wartości fizyczne niezależne od języka, np. 24V, IP65",
    zh: "语言无关的物理值，如 24V、IP65",
  },
  "admin.attr.create": {
    es: "Crear", en: "Create", fr: "Créer", de: "Erstellen", it: "Crea", pt: "Criar",
    nl: "Aanmaken", pl: "Utwórz", zh: "创建",
  },
  "admin.attr.created": {
    es: "Creado", en: "Created", fr: "Créé", de: "Erstellt", it: "Creato", pt: "Criado",
    nl: "Aangemaakt", pl: "Utworzono", zh: "已创建",
  },
  "admin.attr.saved": {
    es: "Guardado", en: "Saved", fr: "Enregistré", de: "Gespeichert", it: "Salvato", pt: "Salvo",
    nl: "Opgeslagen", pl: "Zapisano", zh: "已保存",
  },
  "admin.attr.translate": {
    es: "Traducir con IA", en: "AI translate", fr: "Traduire par IA", de: "KI-Übersetzung",
    it: "Traduci con IA", pt: "Traduzir com IA", nl: "AI-vertaling", pl: "Tłumacz AI", zh: "AI 翻译",
  },
  "admin.attr.translated": {
    es: "Traducciones generadas", en: "Translations generated", fr: "Traductions générées",
    de: "Übersetzungen erstellt", it: "Traduzioni generate", pt: "Traduções geradas",
    nl: "Vertalingen gegenereerd", pl: "Wygenerowano tłumaczenia", zh: "译名已生成",
  },
  "admin.attr.deleteConfirm": {
    es: "¿Eliminar el atributo «{name}»? Los datos ya guardados en los productos no se ven afectados; solo afecta a las sugerencias futuras y a los nombres traducidos.",
    en: "Delete attribute “{name}”? Data already saved on products is not affected; only future suggestions and translated names are.",
    fr: "Supprimer l'attribut « {name} » ? Les données déjà enregistrées sur les produits ne sont pas affectées ; seules les suggestions futures et les noms traduits le sont.",
    de: "Attribut „{name}“ löschen? Bereits gespeicherte Produktdaten bleiben unberührt; betroffen sind nur künftige Vorschläge und übersetzte Namen.",
    it: "Eliminare l'attributo «{name}»? I dati già salvati sui prodotti non vengono toccati; riguarda solo i suggerimenti futuri e i nomi tradotti.",
    pt: "Excluir o atributo “{name}”? Os dados já salvos nos produtos não são afetados; afeta apenas sugestões futuras e nomes traduzidos.",
    nl: "Attribuut '{name}' verwijderen? Al opgeslagen productgegevens blijven intact; alleen toekomstige suggesties en vertaalde namen worden beïnvloed.",
    pl: "Usunąć atrybut „{name}”? Dane zapisane w produktach pozostaną nienaruszone; wpłynie to tylko na przyszłe podpowiedzi i przetłumaczone nazwy.",
    zh: "删除属性「{name}」？产品里已保存的数据不受影响，仅影响之后的候选列表与多语言译名。",
  },
  "admin.attr.empty": {
    es: "Aún no hay atributos: precarga los habituales de LED o crea uno",
    en: "No attributes yet — preset common LED attributes or create one",
    fr: "Pas encore d'attributs : préchargez les attributs LED courants ou créez-en un",
    de: "Noch keine Attribute – übliche LED-Attribute vorbefüllen oder neu anlegen",
    it: "Ancora nessun attributo: precarica quelli LED comuni o creane uno",
    pt: "Ainda não há atributos: pré-carregue os comuns de LED ou crie um",
    nl: "Nog geen attributen – vul gangbare led-attributen vooraf in of maak er een aan",
    pl: "Brak atrybutów — wstaw typowe atrybuty LED lub utwórz nowy",
    zh: "还没有属性——可一键预置常用 LED 属性，或新增一个",
  },
  "admin.attr.seedDefaults": {
    es: "Precargar atributos comunes", en: "Preset common attributes",
    fr: "Précharger les attributs courants", de: "Übliche Attribute vorbefüllen",
    it: "Precarica attributi comuni", pt: "Pré-carregar atributos comuns",
    nl: "Gangbare attributen vooraf invullen", pl: "Wstaw typowe atrybuty", zh: "预置常用属性",
  },
  "admin.attr.seeded": {
    es: "{n} atributos comunes precargados", en: "{n} common attributes preset",
    fr: "{n} attributs courants préchargés", de: "{n} übliche Attribute vorbefüllt",
    it: "{n} attributi comuni precaricati", pt: "{n} atributos comuns pré-carregados",
    nl: "{n} gangbare attributen vooraf ingevuld", pl: "Wstawiono {n} typowych atrybutów",
    zh: "已预置 {n} 个常用属性",
  },
  "admin.attr.moveUp": {
    es: "Subir", en: "Move up", fr: "Monter", de: "Nach oben", it: "Sposta su",
    pt: "Mover para cima", nl: "Omhoog", pl: "W górę", zh: "上移",
  },
  "admin.attr.moveDown": {
    es: "Bajar", en: "Move down", fr: "Descendre", de: "Nach unten", it: "Sposta giù",
    pt: "Mover para baixo", nl: "Omlaag", pl: "W dół", zh: "下移",
  },
  "err.attrNotFound": {
    es: "El atributo no existe o no pertenece a la fábrica actual",
    en: "Attribute not found or not owned by the current factory",
    fr: "Attribut introuvable ou n'appartenant pas à l'usine actuelle",
    de: "Attribut nicht gefunden oder gehört nicht zur aktuellen Fabrik",
    it: "Attributo non trovato o non appartenente alla fabbrica corrente",
    pt: "Atributo não encontrado ou não pertence à fábrica atual",
    nl: "Attribuut niet gevonden of hoort niet bij de huidige fabriek",
    pl: "Atrybut nie istnieje lub nie należy do bieżącej fabryki",
    zh: "属性不存在或不属于当前工厂",
  },
  "err.attrKeyRequired": {
    es: "La clave del atributo es obligatoria", en: "Attribute key is required",
    fr: "La clé de l'attribut est obligatoire", de: "Attribut-Key ist erforderlich",
    it: "La chiave dell'attributo è obbligatoria", pt: "A chave do atributo é obrigatória",
    nl: "Attribuutsleutel is verplicht", pl: "Klucz atrybutu jest wymagany", zh: "属性 Key 必填",
  },
  "err.attrKeyInvalid": {
    es: "Clave no válida (empieza con letra; solo letras/números/guion bajo)",
    en: "Invalid key (must start with a letter; letters/digits/underscore only)",
    fr: "Clé invalide (commence par une lettre ; lettres/chiffres/underscore uniquement)",
    de: "Ungültiger Key (beginnt mit Buchstabe; nur Buchstaben/Ziffern/Unterstrich)",
    it: "Chiave non valida (inizia con lettera; solo lettere/numeri/underscore)",
    pt: "Chave inválida (começa com letra; apenas letras/números/sublinhado)",
    nl: "Ongeldige sleutel (begint met een letter; alleen letters/cijfers/underscore)",
    pl: "Nieprawidłowy klucz (zaczyna się literą; tylko litery/cyfry/podkreślnik)",
    zh: "属性 Key 格式不合法（字母开头，仅字母/数字/下划线）",
  },
  "err.attrKeyTaken": {
    es: "La clave «{key}» ya existe", en: "Key “{key}” already exists",
    fr: "La clé « {key} » existe déjà", de: "Key „{key}“ existiert bereits",
    it: "La chiave «{key}» esiste già", pt: "A chave “{key}” já existe",
    nl: "Sleutel '{key}' bestaat al", pl: "Klucz „{key}” już istnieje",
    zh: "属性 Key「{key}」已存在",
  },
  "prod.fromDict": {
    es: "Añadir del diccionario", en: "Add from dictionary", fr: "Ajouter du dictionnaire",
    de: "Aus Wörterbuch hinzufügen", it: "Aggiungi dal dizionario", pt: "Adicionar do dicionário",
    nl: "Toevoegen uit woordenboek", pl: "Dodaj ze słownika", zh: "从字典添加",
  },
  "prod.dict": {
    es: "Diccionario", en: "Dictionary", fr: "Dictionnaire", de: "Wörterbuch",
    it: "Dizionario", pt: "Dicionário", nl: "Woordenboek", pl: "Słownik", zh: "字典",
  },
  "prod.dictHint": {
    es: "Al vincular un atributo del diccionario, el nombre del parámetro usa la traducción del diccionario según el idioma",
    en: "When linked to a dictionary attribute, the parameter name uses the dictionary translation for each language",
    fr: "Lié à un attribut du dictionnaire, le nom du paramètre suit la traduction du dictionnaire selon la langue",
    de: "Mit einem Wörterbuch-Attribut verknüpft folgt der Parametername der Wörterbuch-Übersetzung je Sprache",
    it: "Collegato a un attributo del dizionario, il nome del parametro usa la traduzione del dizionario per ogni lingua",
    pt: "Vinculado a um atributo do dicionário, o nome do parâmetro usa a tradução do dicionário por idioma",
    nl: "Gekoppeld aan een woordenboekattribuut volgt de parameternaam de woordenboekvertaling per taal",
    pl: "Po powiązaniu z atrybutem słownika nazwa parametru używa tłumaczenia słownika dla każdego języka",
    zh: "关联字典属性后，参数名按界面/前台语言自动取字典译名",
  },
  "err.attrNameRequired": {
    es: "El nombre es obligatorio", en: "Name is required", fr: "Le nom est obligatoire",
    de: "Name ist erforderlich", it: "Il nome è obbligatorio", pt: "O nome é obrigatório",
    nl: "Naam is verplicht", pl: "Nazwa jest wymagana", zh: "显示名必填",
  },
};

for (const loc of LOCALES) {
  const file = join(DIR, `${loc}.json`);
  const data = JSON.parse(readFileSync(file, "utf8"));
  let added = 0;
  for (const [path, perLoc] of Object.entries(T)) {
    const text = perLoc[loc];
    if (text === undefined) throw new Error(`missing ${loc} for ${path}`);
    const parts = path.split(".");
    let node = data;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!(parts[i] in node)) node[parts[i]] = {};
      node = node[parts[i]];
    }
    node[parts[parts.length - 1]] = text;
    added++;
  }
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`${loc}.json: ${added} keys written`);
}
