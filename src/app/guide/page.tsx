import Link from "next/link";
import { Hero } from "@/components/layout/hero";
import { translate } from "@/lib/translations";
import { readAccessData } from "@/lib/access-store";
import { ArrowLeft, CirclePlus, Compass, Crosshair, Eclipse, FileText, Hammer, Info, LogOut, Mail, MailCheck, Orbit, Pencil, Reply, RotateCcw, Search, Siren, Trash2, Trophy, UserRound, X, type LucideIcon } from "lucide-react";
import { ExplorerBuilderStationExamples, RangerStationExamples } from "./station-examples";
import { BuilderMissionExamples, ExplorerMissionExamples, RangerMissionExamples } from "./mission-examples";
import { MissionTabsExample } from "./mission-tabs-example";
import { StationTabsExample } from "./station-tabs-example";
import { AddressValidationExample } from "./address-validation-example";
import { StationFormExample } from "./station-form-example";
import { guideStationInit } from "./station-init";
import { PlanetFiltersExample } from "./planet-filters-example";
import { createPlanetListExamplePlanet, PlanetListExample } from "./planet-list-example";
import { PlanetStationHeadingExample } from "./planet-station-heading-example";
import { emptyPlanetFilterValues } from "@/components/forms/planet-filters";
import { LocaleProvider } from "@/components/providers/locale-provider";

export const dynamic = "force-dynamic";

const specialtyIcons = {
  ranger: { icon: Compass, color: "#5fd68a", name: "Ranger" },
  explorer: { icon: Search, color: "#4d9bff", name: "Esploratore" },
  builder: { icon: Hammer, color: "#ffb45d", name: "Costruttore" },
} as const;

const commonButtons: { label: string; icon: LucideIcon; color: string; meaning: string }[] = [
  { label: "Modifica", icon: Pencil, color: "#d0d4d0", meaning: "Modifica la missione o la stazione. Compare solo se l'hai creata tu o se ti è assegnata." },
  { label: "Elimina", icon: Trash2, color: "#ef8067", meaning: "Elimina la missione, la stazione o il messaggio. Ti viene chiesta una conferma." },
  { label: "Riapri missione", icon: RotateCcw, color: "#ef8067", meaning: "Riporta in corso una missione che avevi completato." },
  { label: "Segna come letto", icon: MailCheck, color: "#d0d4d0", meaning: "Segna un messaggio come letto." },
  { label: "Rispondi", icon: Reply, color: "#d0d4d0", meaning: "Apre il campo per rispondere a un messaggio." },
  { label: "Chiudi / Annulla", icon: X, color: "#d0d4d0", meaning: "Chiude una finestra o annulla l'azione in corso." },
  { label: "Il mio profilo", icon: UserRound, color: "#d0d4d0", meaning: "Nell'header: apre il tuo profilo." },
  { label: "Esci", icon: LogOut, color: "#d0d4d0", meaning: "Nell'header: disconnette dall'account." },
];

const buttons: ReadonlyArray<{ label: string; specialty: ReadonlyArray<"ranger" | "explorer" | "builder">; icon: LucideIcon; color: string; meaning: string; crossed?: boolean }> = [
  { label: "Vai alla stazione", specialty: ["ranger", "explorer", "builder"], icon: Orbit, color: "#6cb4ff", meaning: "Porta alla scheda stazione collegata." },
  { label: "Vai alle missioni collegate", specialty: ["ranger", "explorer", "builder"], icon: Crosshair, color: "#72d1c4", meaning: "Porta alla scheda missione collegata." },
  { label: "Crea missione dalla stazione", specialty: ["ranger"], icon: CirclePlus, color: "#72d1c4", meaning: "Crea una missione per il sistema di una propria stazione, per Esploratori e/o Costruttori non preassegnata" },
  { label: "Crea missione dalla stazione", specialty: ["builder", "explorer"], icon: CirclePlus, color: "#72d1c4", meaning: "Crea una missione per il sistema per la propria specializzazione, assegnata a se stessi." },
  { label: "Missione già in corso per la tua categoria", specialty: ["ranger"], icon: CirclePlus, color: "#4f6f6a", crossed: true, meaning: "Al posto di «Crea missione dalla stazione» se esistono gia' missioni per Esploratori e Costruttori su quel sistema." },
  { label: "Missione già in corso per la tua categoria", specialty: ["explorer", "builder"], icon: CirclePlus, color: "#4f6f6a", crossed: true, meaning: "Al posto di «Crea missione dalla stazione» se esiste già una missione per la tua specializzazione su quel sistema." },
  { label: "Vai al pianeta", specialty: ["ranger", "explorer", "builder"], icon: Eclipse, color: "#b48cf2", meaning: "Porta al pianeta collegato." },
  { label: "Note di missione o stazione", specialty: ["ranger", "explorer", "builder"], icon: FileText, color: "#e4b478", meaning: "Mostra le note scritte su una missione o una stazione." },
  { label: "Note del pianeta", specialty: ["ranger", "explorer", "builder"], icon: Info, color: "#ff8400", meaning: "Mostra le note condivise sul pianeta." },
  { label: "Richiedi intervento Ranger", specialty: ["builder", "explorer"], icon: Compass, color: "#5fd68a", meaning: "Sulla missione completata, crea una missione per i Ranger non assegnata." },
  { label: "Richiedi intervento Esploratori", specialty: ["builder", "ranger"], icon: Search, color: "#4d9bff", meaning: "Sulla missione completata, crea una missione per gli Esploratori non assegnata." },
  { label: "Richiedi intervento Costruttori", specialty: ["ranger", "explorer"], icon: Hammer, color: "#ffb45d", meaning: "Sulla missione completata, crea una missione per i Costruttori non assegnata." },
  { label: "Richiedi aiuto", specialty: ["ranger", "explorer", "builder"], icon: Siren, color: "#f5c518", meaning: "Invia una richiesta d'aiuto per il pianeta." },
];

const specialties = [
  { name: "Ranger", icon: Compass, color: "#5fd68a", tasks: "Stazione aggiunta, Stazione riscattata, Sistema rinominato" },
  { name: "Esploratore", icon: Search, color: "#4d9bff", tasks: "Stazione aggiunta, Mappato, Pianeti classificati, Dati caricati" },
  { name: "Costruttore", icon: Hammer, color: "#ffb45d", tasks: "Stazione aggiunta, Edifici costruiti, Basi caricate" },
];


const sections = [
  { name: "Stazioni", icon: Orbit, color: "#6cb4ff", tasks: "Consulti o aggiungi stazioni spaziali, crei le missioni per quel sistema" },
  { name: "Missioni", icon: Crosshair, color: "#72d1c4", tasks: "Consulti le missioni disponibili per te, prendi in carico quelle libere o inizi quelle assegnate, spunta le tue voci e completa la missione" },
  { name: "Pianeti", icon: Eclipse, color: "#b48cf2", tasks: "Consulti e filtri per proprietà i pianeti dell'archivio e trovi la stazione associata" },
  { name: "Classifica", icon: Trophy, color: "#e040c8", tasks: "Vedi la posizione dei membri e i totali dell'alleanza." },
  { name: "Richieste d'aiuto", icon: Siren, color: "#f5c518", tasks: "Consulti le richieste di tutti e rispondi. Le richieste si inviano dalla scheda di un pianeta" },
  { name: "Messaggi", icon: Mail, color: "#8f9bff", tasks: "Leggi e rispondi ai messaggi privati, segnali come letti o li elimini. Si scrivono dal profilo di un membro, su una stazione o una missione" },
];

export default async function GuideRoute() {
  const { alliance } = await readAccessData();
  const sample = guideStationInit;
  const planetExample = await createPlanetListExamplePlanet();

  return <div className="guide-root">
    <Hero settings={alliance} subtitle="Cosa puoi fare, pagina per pagina" title="Guida">
      <Link className="banner-add" data-tooltip="Torna all'app" href="/"><ArrowLeft size={17} /> <span className="banner-add-label">Torna all&apos;app</span></Link>
    </Hero>
    <nav aria-label="Indice della guida" className="guide-index">
      <strong>Indice</strong>
      <ul>
        <li><a className="guide-index-basics" href="#nozioni-di-base"><Info aria-hidden="true" size={15} />Nozioni di base</a>
          <ul>
            <li><a href="#sezioni">Sezioni</a></li>
            <li><a href="#specializzazioni">Specializzazioni</a></li>
            <li><a href="#legenda">Legenda dei pulsanti</a></li>
            <li><a href="#pulsanti-comuni">Pulsanti generali</a></li>
            <li><a href="#primo-accesso">Primo accesso e profilo</a></li>
          </ul>
        </li>
        <li><a className="guide-index-stations" href="#stazioni"><Orbit aria-hidden="true" size={15} />Stazioni</a>
          <ul>
            <li><a href="#stazioni-funzionamento">Come funziona una stazione</a></li>
            <li><a href="#stazioni-creazione">Creare una stazione</a>
              <ul><li><a href="#stazioni-controlli-indirizzo-portale">Controlli sull&apos;indirizzo portale</a></li></ul>
            </li>
            <li><a href="#stazioni-lista">La lista delle stazioni</a>
              <ul>
                <li><a href="#stazioni-lista-tab">Tab</a></li>
                <li><a href="#stazioni-lista-ranger">Ranger</a></li>
                <li><a href="#stazioni-lista-esploratori-costruttori">Esploratori e Costruttori</a></li>
              </ul>
            </li>
          </ul>
        </li>
        <li><a className="guide-index-missions" href="#missioni"><Crosshair aria-hidden="true" size={15} />Missioni</a>
          <ul>
            <li><a href="#missioni-funzionamento">Come funziona una missione</a></li>
            <li><a href="#missioni-lista">La lista delle missioni</a>
              <ul>
                <li><a href="#missioni-lista-tab">Tab</a></li>
                <li><a href="#missioni-lista-esploratori">Esploratori</a></li>
                <li><a href="#missioni-lista-costruttori">Costruttori</a></li>
                <li><a href="#missioni-lista-ranger">Ranger</a></li>
              </ul>
            </li>
          </ul>
        </li>
        <li><a className="guide-index-planets" href="#pianeti"><Eclipse aria-hidden="true" size={15} />Pianeti</a>
          <ul>
            <li><a href="#pianeti-funzionamento">Come funziona un pianeta</a></li>
            <li><a href="#pianeti-lista">La lista dei pianeti</a>
              <ul>
                <li><a href="#pianeti-ricerca-filtri">Ricerca e filtri</a></li>
                <li><a href="#pianeti-sistema">Il sistema</a></li>
                <li><a href="#pianeti-lista-pianeti">I pianeti</a></li>
                <li><a href="#pianeti-scheda">Scheda pianeta</a></li>
              </ul>
            </li>
          </ul>
        </li>
      </ul>
    </nav>
    <LocaleProvider fixedLocale="it">
    <main className="guide-page">

    <section id="nozioni-di-base">
      <h2><Info aria-hidden="true" size={20} />Nozioni di base</h2>

      <section id="sezioni">
        <h3>Sezioni</h3>
        <div className="guide-table-wrap"><table className="guide-table">
          <thead><tr><th>Sezioni</th><th>Icona</th><th>A cosa serve</th></tr></thead>
          <tbody>{sections.map((section) => <tr key={section.name}>
            <td><strong style={{ color: section.color }}>{section.name}</strong></td>
            <td><span className="guide-icon" style={{ color: section.color, borderColor: section.color }}><section.icon size={16} /></span></td>
            <td>{section.tasks}</td>
          </tr>)}</tbody>
        </table></div>
      </section>

      <section id="specializzazioni">
        <h3>Specializzazioni</h3>
        <div className="guide-table-wrap"><table className="guide-table">
          <thead><tr><th>Specializzazione</th><th>Icona</th><th>Compiti</th></tr></thead>
          <tbody>{specialties.map((specialty) => <tr key={specialty.name}>
            <td><strong style={{ color: specialty.color }}>{specialty.name}</strong></td>
            <td><span className="guide-icon" style={{ color: specialty.color, borderColor: specialty.color }}><specialty.icon size={16} /></span></td>
            <td>{specialty.tasks}</td>
          </tr>)}</tbody>
        </table></div>
      </section>

      <section id="legenda">
        <h3>Legenda dei pulsanti</h3>
        <p>Le icone sono quelle dei pulsanti che portano da una sezione all&apos;altra o aprono un dettaglio.</p>
        <div className="guide-table-wrap"><table className="guide-table">
          <thead><tr><th>Pulsante</th><th>Icona</th><th>Significato</th><th>Specializzazione</th></tr></thead>
          <tbody>{buttons.map((button) => <tr key={`${button.label}:${button.specialty.join()}`}>
            <td>{button.label}</td>
            <td><span className={`guide-icon${button.crossed ? " guide-icon-crossed" : ""}`} style={{ color: button.color, borderColor: button.color === "#4f6f6a" ? "#394548" : button.color }}><button.icon size={16} /></span></td>
            <td>{button.meaning}</td>
            <td>{(["ranger", "explorer", "builder"] as const).map((key) => {
              if (!button.specialty.includes(key)) return <span aria-hidden="true" className="guide-icon guide-icon-empty" key={key} />;
              const { icon: Icon, color, name } = specialtyIcons[key];
              return <span aria-label={name} className="guide-icon" key={key} style={{ color, borderColor: color }} title={name}><Icon size={16} /></span>;
            })}</td>
          </tr>)}</tbody>
        </table></div>
      </section>

      <section id="pulsanti-comuni">
        <h3>Pulsanti generali</h3>
        <p>Pulsanti validi per tutti, indipendentemente dalla specializzazione.</p>
        <div className="guide-table-wrap"><table className="guide-table">
          <thead><tr><th>Pulsante</th><th>Icona</th><th>Significato</th></tr></thead>
          <tbody>{commonButtons.map((button) => <tr key={button.label}>
            <td>{button.label}</td>
            <td><span className="guide-icon" style={{ color: button.color, borderColor: "#394548" }}><button.icon size={16} /></span></td>
            <td>{button.meaning}</td>
          </tr>)}</tbody>
        </table></div>
      </section>

      <section id="primo-accesso">
        <h3>Primo accesso e profilo</h3>
        <ul>
          <li>Accedi con Google. L&apos;account resta <strong>in attesa</strong> finché un moderatore o un admin non lo approva; nel frattempo puoi solo completare il profilo.</li>
          <li>Profilo: nome in gioco, codice amico NMS (13 caratteri alfanumerici, i trattini sono ignorati), una o più piattaforme, specializzazione, contatti Telegram/Discord opzionali.</li>
          <li>Senza profilo completo non puoi prendere missioni né ricevere assegnazioni.</li>
          <li>Non disponibili in vista semplice: Utenti, Giocatori offline, Pianeti, gestione completa delle missioni, export Excel, impostazioni dell&apos;alleanza.</li>
        </ul>
      </section>

    </section>

    <section id="stazioni">      <h2 style={{ color: "#6cb4ff" }}><Orbit aria-hidden="true" size={20} />Stazioni</h2>
      <h3 id="stazioni-funzionamento">Come funziona una stazione</h3>
      <p>Una stazione è un sistema stellare dell&apos;alleanza, identificato da un indirizzo portale e da una galassia. Da una stazione possono partire le missioni.</p>
      <ul>
        <li>Chi la inserisce ne è lo <strong>scopritore</strong>: solo lui può modificarne nome e note, spuntare le voci Ranger ed eliminarla (solo se non ha missioni collegate).</li>
        <li>La scheda mostra il pianeta con i dati di Server Pianeti (se il pianeta è registrato), il nome, la galassia, lo scopritore e le note.</li>
        <li>Lo stato del sistema è un elenco di voci da spuntare, una per specializzazione: Ranger, Esploratori e Costruttori.</li>
        <li>Le missioni collegate alla stazione ne determinano lo stato: In attesa, In missione o Missione completata.</li>
      </ul>
      <h3 id="stazioni-creazione">Creare una stazione</h3>
      <ul>
        <li>Usa «{translate("it", "stations.add_station")}» nella pagina Stazioni.</li>
        <li>Indica la galassia e l&apos;indirizzo portale.</li>
        <li>Il nome viene calcolato in base ai glifi, ma puoi modificarlo (max 80 caratteri).</li>
        <li>Note (max 1000 caratteri): se ritieni che ci siano informazioni importanti da condividere con chi ci andrà in missione.</li>
        <li>Diventi lo scopritore della stazione.</li>
        <li>Non puoi inserire una stazione per un sistema già presente.</li>
      </ul>
      <StationFormExample sample={sample} />
      <h4 id="stazioni-controlli-indirizzo-portale">Controlli sull&apos;indirizzo portale</h4>
      <p>Mentre inserisci i glifi, il messaggio sotto il campo dell&apos;indirizzo portale ti guida passo per passo.</p>
      <AddressValidationExample sample={sample} />
      <p>«{translate("it", "common.add")}» resta disattivo finché l&apos;indirizzo portale non è valido e il controllo su Server Pianeti non è concluso.</p>
      <h3 id="stazioni-lista">La lista delle stazioni</h3>
      <h4 id="stazioni-lista-tab" style={{ color: "var(--lime)" }}>Tab</h4>
      <p>In cima alla pagina Stazioni, i tab filtrano la lista; il numero accanto a ogni tab indica quante stazioni contiene. I tab senza stazioni non compaiono.</p>
      <StationTabsExample />
      <ul>
        <li><strong className="guide-tab-name">{translate("it", "stations.filter_all")}</strong>: tutte le stazioni dell&apos;alleanza.</li>
        <li><strong className="guide-tab-name">{translate("it", "stations.my_stations")}</strong>: le stazioni di cui sei scopritore.</li>
        <li><strong className="guide-tab-name">{translate("it", "common.pending_status_label")}</strong>: stazioni senza nessuna missione collegata.</li>
        <li><strong className="guide-tab-name">{translate("it", "stations.filter_in_mission")}</strong>: stazioni con almeno una missione collegata non ancora completata.</li>
        <li><strong className="guide-tab-name">{translate("it", "stations.filter_my_missions")}</strong>: stazioni con una missione assegnata a te.</li>
        <li><strong className="guide-tab-name">{translate("it", "stations.filter_mission_completed")}</strong>: stazioni con missioni collegate, tutte completate.</li>
      </ul>
      <h4 id="stazioni-lista-ranger" style={{ color: "#5fd68a" }}>Ranger</h4>
      <ul>
        <li>Vede tutte le stazioni e filtra per Tutte, Le mie stazioni, In attesa, In missione, Le mie missioni (solo se ne ha) e Missione completata; cerca per indirizzo portale, proprietario, galassia o note.</li>
        <li>«Aggiungi stazione»: indirizzo portale, galassia, nome (max 80 caratteri), note (max 1000). Solo per sé.</li>
        <li>Sulle proprie stazioni: spunta le voci Ranger, modifica nome e note, elimina (solo senza missioni collegate), crea una missione per Esploratori/Costruttori.</li>
      </ul>
      <h5>Esempi di card</h5>
      <p>I pulsanti che un Ranger può trovare sulla card di una stazione, in base a chi la possiede e alle missioni collegate.</p>
      {sample && <RangerStationExamples sample={sample} />}
      <h4 id="stazioni-lista-esploratori-costruttori"><span style={{ color: "#4d9bff" }}>Esploratori</span> e <span style={{ color: "#ffb45d" }}>Costruttori</span></h4>
      <ul>
        <li>Vedono tutte le stazioni; possono modificare ed eliminare (se senza missioni) solo quelle di cui sono proprietari, non quelle di altri.</li>
        <li>Creano una missione per la <strong>propria specializzazione</strong> da una stazione: viene assegnata a loro. Non è possibile se la specializzazione è già coperta o se esiste già un altro pianeta dello stesso sistema.</li>
        <li>Se la missione esiste già, un&apos;icona apre le missioni collegate; se è di un altro membro compare l&apos;icona «+» barrata.</li>
      </ul>
      <h5>Esempi di card</h5>
      <p>I pulsanti che un Esploratore o un Costruttore può trovare sulla card di una stazione.</p>
      {sample && <ExplorerBuilderStationExamples sample={sample} />}
    </section>

    <section id="missioni">
      <h2 style={{ color: "#72d1c4" }}><Crosshair aria-hidden="true" size={20} />Missioni</h2>
      <h3 id="missioni-funzionamento">Come funziona una missione</h3>
      <p>Una missione parte da una stazione. Stati: <strong>In attesa → In corso → Completata</strong>.</p>
      <p>Le voci spuntate fanno salire l&apos;avanzamento fino all&apos;80%; oltre, fino al 100%, lo porti tu a piacere con il cursore, ma non è necessario. «{translate("it", "missions.complete_mission")}» si attiva quando le tue voci sono tutte spuntate e puoi completare la missione anche senza arrivare al 100%.</p>
      <p>Ogni membro vede le missioni per la propria specializzazione (Ranger, Esploratori o Costruttori) che sono libere o prese in carico da lui.</p>
      <ul>
        <li>«{translate("it", "missions.claim")}» su una missione libera: diventa «In corso» e visibile sul tab «Le mie missioni».</li>
        <li>«{translate("it", "missions.start_mission")}» su una missione assegnata ma in attesa.</li>
        <li>Spunta le tue voci e usa «{translate("it", "missions.complete_mission")}».</li>
        <li>Una missione completata si può riaprire con «{translate("it", "missions.reopen_mission")}».</li>
      </ul>
      <h3 id="missioni-lista">La lista delle missioni</h3>
      <h4 id="missioni-lista-tab" style={{ color: "var(--lime)" }}>Tab</h4>
      <p>In cima alla pagina Missioni, i tab filtrano la lista; il numero accanto a ogni tab indica quante missioni contiene. I tab senza missioni non compaiono.</p>
      <MissionTabsExample />
      <ul>
        <li><strong className="guide-tab-name">{translate("it", "common.all")}</strong>: tutte le missioni per la tua specializzazione prese in carico da te o non ancora assegnate.</li>
        <li><strong className="guide-tab-name">{translate("it", "missions.status_in_progress")}</strong>: missioni già iniziate da te.</li>
        <li><strong className="guide-tab-name">{translate("it", "missions.pending_assigned")}</strong>: missioni in attesa assegnate a te, che non hai ancora iniziato.</li>
        <li><strong className="guide-tab-name">{translate("it", "missions.pending_unassigned")}</strong>: missioni in attesa per la tua specializzazione che nessuno ha ancora preso in carico.</li>
        <li><strong className="guide-tab-name">{translate("it", "missions.status_completed")}</strong>: missioni concluse da te.</li>
      </ul>
      <h4 id="missioni-lista-esploratori" style={{ color: "#4d9bff" }}>Esploratori</h4>
      <h5>Esempi di card</h5>
      <p>Le schede missione che un Esploratore può trovare, dalla presa in carico alla chiusura.</p>
      <ExplorerMissionExamples sample={sample} />
      <h4 id="missioni-lista-costruttori" style={{ color: "#ffb45d" }}>Costruttori</h4>
      <h5>Esempi di card</h5>
      <p>Le schede missione che un Costruttore può trovare, dalla presa in carico alla chiusura.</p>
      <BuilderMissionExamples sample={sample} />
      <h4 id="missioni-lista-ranger" style={{ color: "#5fd68a" }}>Ranger</h4>
      <p>Facoltativo: le voci Ranger (stazione riscattata, sistema rinominato) sono già disponibili allo scopritore del sistema sulla scheda stazione, quindi non serve una missione per spuntarle.</p>
      <h5>Esempi di card</h5>
      <p>Le schede missione che un Ranger può trovare, dalla presa in carico alla chiusura.</p>
      <RangerMissionExamples sample={sample} />
    </section>

    <section id="pianeti">
      <h2 style={{ color: "#b48cf2" }}><Eclipse aria-hidden="true" size={20} />Pianeti</h2>
      <h3 id="pianeti-funzionamento">Come funziona un pianeta</h3>
      <p>Ogni pianeta è legato a un sistema stellare e, se esiste, a una stazione associata. La sezione raccoglie i dati di Almanac e li presenta in una lista facile da filtrare.</p>
      <ul>
        <li>La scheda del pianeta mostra il nome del pianeta, il numero, il sistema, la galassia, la stazione collegata e i dati di ambiente (razza, clima, acqua, sentinelle, conflitto, ecc.).</li>
        <li>Se il pianeta è collegato a una stazione, puoi aprire la stazione direttamente oppure raggiungere la scheda del pianeta per leggere le note condivise o lanciare un&apos;aiuto.</li>
        <li>Le informazioni sono raggruppate per sistema/stazione, così puoi vedere subito tutti i pianeti legati a una stessa stazione e scorrere le loro caratteristiche.</li>
      </ul>
      <h3 id="pianeti-lista">La lista dei pianeti</h3>
      <h4 id="pianeti-ricerca-filtri" style={{ color: "var(--lime)" }}>Ricerca e filtri</h4>
      <p>La barra di ricerca trova i pianeti usando i dati indicizzati da Almanac, il nome Almanac e l&apos;indirizzo portale. Per mostrare i filtri, clicca il pulsante con l&apos;icona a cursori a destra della ricerca; cliccalo di nuovo per richiuderli.</p>
      <PlanetFiltersExample />
      <p>I filtri restringono ulteriormente i risultati. Le opzioni nei menu dipendono dai dati presenti nell&apos;archivio.</p>
      <h5>Esempio con i filtri aperti</h5>
      <PlanetFiltersExample initiallyOpen />
      <h5>Esempio con filtri impostati</h5>
      <p>Qui sono selezionati “Sì” per Dissonante e Paradiso, per mostrare come appaiono i filtri impostati. È un esempio dei controlli, non un pianeta specifico.</p>
      <PlanetFiltersExample
        initiallyOpen
        initialFilters={{ ...emptyPlanetFilterValues, dissonant: "yes", paradise: "yes" }}
      />

       <h4 id="pianeti-sistema" style={{ color: "var(--lime)" }}>Il sistema</h4>

    
      <p>La lista raggruppa i pianeti in base alla stazione associata.</p>
    
    
      <p>L&apos;intestazione mostra il nome della stazione, la galassia, l&apos;indirizzo portale e i dati del sistema. Il pulsante con l&apos;icona della stazione apre la stazione nella sezione Stazioni. Se non c&apos;è una stazione associata, il gruppo è indicato come «{translate("it", "planet.no_associated_station")}».</p>
      <PlanetStationHeadingExample planet={planetExample} />
      
     <h4 id="pianeti-lista-pianeti" style={{ color: "var(--lime)" }}>I pianeti</h4>
      <p>Ogni scheda mostra il nome Almanac o il numero del pianeta, l&apos;indirizzo portale con i glifi e i dati Almanac disponibili. Selezionando la scheda si apre il dettaglio del pianeta.</p>
      <PlanetListExample planet={planetExample} />
    </section>

    <section id="pagine">
      <h2><FileText aria-hidden="true" size={20} />Pagina per pagina</h2>
      <h3 id="pagine-stazioni">Stazioni</h3><p>Elenco delle stazioni con stato dei sistemi, note e azioni (vedi sopra per specializzazione).</p>
      <h3 id="pagine-missioni">Missioni</h3><p>Filtri per stato (Tutte, In corso, In attesa, Completate). Ogni scheda mostra pianeta, galassia, specializzazione richiesta, scopritore, assegnatario, priorità e avanzamento. Il titolo apre il dettaglio pianeta, i nomi aprono il profilo del membro.</p>
      <h3 id="pagine-dettaglio-pianeta">Dettaglio pianeta</h3><p>Dati del pianeta e, con l&apos;icona sirena, invio di una richiesta d&apos;aiuto.</p>
      <h3 id="pagine-classifica">Classifica</h3><p>Posizione dei membri (stazioni scoperte, missioni completate, voci spuntate) e totali dell&apos;alleanza. Sola lettura.</p>
      <h3 id="pagine-richieste-aiuto">Richieste d&apos;aiuto</h3><p>Elenco delle richieste di tutti con le risposte. Si inviano dalla scheda di un pianeta (max 2000 caratteri, con conferma). Tutti possono rispondere; elimini solo le tue.</p>
      <h3 id="pagine-messaggi">Messaggi</h3><p>Si scrive dal profilo di un membro approvato e non offline, solo su un pianeta o una missione (per il resto Telegram o Discord). Puoi rispondere, segnare come letto ed eliminare i messaggi di cui sei mittente o destinatario.</p>
    </section>
  </main>
  </LocaleProvider>
  </div>;
}
