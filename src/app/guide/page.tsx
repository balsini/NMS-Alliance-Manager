import Link from "next/link";
import { CirclePlus, Compass, Crosshair, Eclipse, FileText, Hammer, Info, LogOut, MailCheck, Orbit, Pencil, Reply, RotateCcw, Search, Siren, Trash2, UserRound, X, type LucideIcon } from "lucide-react";
import { RangerStationExamples } from "./station-examples";
import { readRandomAlmanacPlanet } from "@/lib/almanac-store";
import { auth } from "@/auth";
import { GoogleLogin } from "@/components/pages/google-login";
import { PendingApproval } from "@/components/pages/pending-approval";
import { readAccessData } from "@/lib/access-store";
import { getCurrentMember } from "@/lib/authorization";

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
  { label: "Crea missione dalla stazione", specialty: ["builder", "explorer"], icon: CirclePlus, color: "#72d1c4", meaning: "Crea una missione per il sistema per la propria specializzazione, già assegnata a se stessi." },
  { label: "Missione già in corso per la tua categoria", specialty: ["ranger", "explorer", "builder"], icon: CirclePlus, color: "#4f6f6a", crossed: true, meaning: "Al posto di «Crea missione dalla stazione» se esiste già una missione per la tua specializzazione su quel sistema." },
  { label: "Vai al pianeta", specialty: ["ranger", "explorer", "builder"], icon: Eclipse, color: "#b48cf2", meaning: "Porta al pianeta collegato." },
  { label: "Note di missione o stazione", specialty: ["ranger", "explorer", "builder"], icon: FileText, color: "#e4b478", meaning: "Mostra le note scritte su una missione o una stazione." },
  { label: "Note del pianeta", specialty: ["ranger", "explorer", "builder"], icon: Info, color: "#ff8400", meaning: "Mostra le note condivise sul pianeta." },
  { label: "Richiedi intervento Ranger", specialty: ["builder", "explorer"], icon: Compass, color: "#5fd68a", meaning: "Sulla missione completata, crea una missione per i Ranger non assegnata." },
  { label: "Richiedi intervento Esploratori", specialty: ["builder", "ranger"], icon: Search, color: "#4d9bff", meaning: "Sulla missione completata, crea una missione per gli Esploratori non assegnata." },
  { label: "Richiedi intervento Costruttori", specialty: ["ranger", "explorer"], icon: Hammer, color: "#ffb45d", meaning: "Sulla missione completata, crea una missione per i Costruttori non assegnata." },
  { label: "Richiedi aiuto", specialty: ["ranger", "explorer", "builder"], icon: Siren, color: "#f5c518", meaning: "Invia una richiesta d'aiuto per il pianeta." },
];

const specialties = [
  { name: "Ranger", icon: Compass, color: "#5fd68a", tasks: "Stazione riscattata, Sistema rinominato" },
  { name: "Esploratore", icon: Search, color: "#4d9bff", tasks: "Mappato, Pianeti classificati, Dati caricati" },
  { name: "Costruttore", icon: Hammer, color: "#ffb45d", tasks: "Edifici costruiti, Basi caricate" },
];

export default async function GuideRoute() {
  const accessData = await readAccessData();
  const allianceName = accessData.alliance.name;
  const allianceLogoUrl = accessData.alliance.logoUrl;
  const session = await auth();
  if (!session?.user?.email) return <GoogleLogin allianceLogoUrl={allianceLogoUrl} allianceName={allianceName} />;
  const member = await getCurrentMember({ allowPending: true, allowBlocked: true });
  if (!member) return <GoogleLogin allianceLogoUrl={allianceLogoUrl} allianceName={allianceName} />;
  if (member.membershipStatus !== "approved") return <PendingApproval member={member} />;

  const sample = await readRandomAlmanacPlanet();

  return <main className="guide-page">
    <header className="guide-header">
      <Link href="/">← Torna all&apos;app</Link>
      <h1>Guida – Vista semplice</h1>
      <p>In vista semplice tutti hanno gli stessi permessi, anche moderatori e admin: cambia solo la specializzazione scelta nel profilo.</p>
    </header>

    <section id="specializzazioni">
      <h2>Colori delle specializzazioni</h2>
      <div className="guide-table-wrap"><table className="guide-table">
        <thead><tr><th>Specializzazione</th><th>Icona</th><th>Voci da spuntare</th></tr></thead>
        <tbody>{specialties.map((specialty) => <tr key={specialty.name}>
          <td><strong style={{ color: specialty.color }}>{specialty.name}</strong></td>
          <td><span className="guide-icon" style={{ color: specialty.color, borderColor: specialty.color }}><specialty.icon size={16} /></span></td>
          <td>{specialty.tasks}</td>
        </tr>)}</tbody>
      </table></div>
    </section>

    <section id="legenda">
      <h2>Legenda dei pulsanti</h2>
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
      <h2>Pulsanti generali</h2>
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
      <h2>Primo accesso e profilo</h2>
      <ul>
        <li>Accedi con Google. L&apos;account resta <strong>in attesa</strong> finché un moderatore o un admin non lo approva; nel frattempo puoi solo completare il profilo.</li>
        <li>Profilo: nome in gioco, codice amico NMS (13 caratteri alfanumerici, i trattini sono ignorati), una o più piattaforme, specializzazione, contatti Telegram/Discord opzionali.</li>
        <li>Senza profilo completo non puoi prendere missioni né ricevere assegnazioni.</li>
        <li>Non disponibili in vista semplice: Utenti, Giocatori offline, Pianeti, gestione completa delle missioni, export Excel, impostazioni dell&apos;alleanza.</li>
      </ul>
    </section>

    <section id="missioni-funzionamento">
      <h2>Come funziona una missione</h2>
      <p>Una missione riguarda un sistema (portale a 12 glifi o codice a 8 glifi) e una galassia. Stati: <strong>In attesa → In corso → Completata</strong>.</p>
      <p>Le voci spuntate fanno salire l&apos;avanzamento fino all&apos;80%; il 100% si raggiunge con «Completa missione», attivo solo quando le tue voci sono tutte spuntate.</p>
    </section>

    <section id="ranger">
      <h2 style={{ color: "#5fd68a" }}>Ranger</h2>
      <h3>Stazioni</h3>
      <ul>
        <li>Vede tutte le stazioni e filtra per Tutte, Le mie stazioni, In attesa, In missione, Le mie missioni (solo se ne ha) e Missione completata; cerca per portale, proprietario, galassia o note.</li>
        <li>«Aggiungi stazione»: indirizzo portale, galassia, nome (max 80 caratteri), note (max 1000). Solo per sé.</li>
        <li>Sulle proprie stazioni: spunta le voci Ranger, modifica nome e note, elimina (solo senza missioni collegate), crea una missione per Esploratori/Costruttori.</li>
      </ul>
      <h4>Esempi di card</h4>
      <p>I pulsanti che un Ranger può trovare sulla card di una stazione, in base a chi la possiede e alle missioni collegate.</p>
      {sample && <RangerStationExamples sample={sample} />}
      <h3>Missioni</h3>
      <p>Vede quelle per «Tutti» o per i Ranger, può iniziare quelle assegnate a sé e spuntare le proprie voci.</p>
    </section>

    <section id="esploratore-costruttore">
      <h2><span style={{ color: "#4d9bff" }}>Esploratore</span> e <span style={{ color: "#ffb45d" }}>Costruttore</span></h2>
      <h3>Stazioni</h3>
      <ul>
        <li>Vedono tutte le stazioni ma non ne registrano né modificano di altrui.</li>
        <li>Creano una missione per la <strong>propria specializzazione</strong> da una stazione: viene assegnata a loro. Non è possibile se la specializzazione è già coperta o se esiste già un altro pianeta dello stesso sistema.</li>
        <li>Se la missione esiste già, un&apos;icona apre le missioni collegate; se è di un altro membro compare «missione associata».</li>
      </ul>
      <h3>Missioni</h3>
      <ul>
        <li>Vedono le missioni per «Tutti», per la propria specializzazione o «Esploratore + Costruttore». Se una missione ha un assegnatario, la vede solo lui.</li>
        <li>«Prendi» su una missione libera (diventa «In corso»); «Inizia» su una assegnata ma in attesa; poi spunta le voci e «Completa». Una missione completata si può riaprire.</li>
      </ul>
    </section>

    <section id="pagine">
      <h2>Pagina per pagina</h2>
      <h3>Stazioni</h3><p>Elenco delle stazioni con stato dei sistemi, note e azioni (vedi sopra per specializzazione).</p>
      <h3>Missioni</h3><p>Filtri per stato (Tutte, In corso, In attesa, Completate). Ogni scheda mostra pianeta, galassia, specializzazione richiesta, scopritore, assegnatario, priorità e avanzamento. Il titolo apre il dettaglio pianeta, i nomi aprono il profilo del membro.</p>
      <h3>Dettaglio pianeta</h3><p>Dati del pianeta e, con l&apos;icona sirena, invio di una richiesta d&apos;aiuto.</p>
      <h3>Classifica</h3><p>Posizione dei membri (stazioni scoperte, missioni completate, voci spuntate) e totali dell&apos;alleanza. Sola lettura.</p>
      <h3>Richieste d&apos;aiuto</h3><p>Elenco delle richieste di tutti con le risposte. Si inviano dalla scheda di un pianeta (max 2000 caratteri, con conferma). Tutti possono rispondere; elimini solo le tue.</p>
      <h3>Messaggi</h3><p>Si scrive dal profilo di un membro approvato e non offline, solo su un pianeta o una missione (per il resto Telegram o Discord). Puoi rispondere, segnare come letto ed eliminare i messaggi di cui sei mittente o destinatario.</p>
    </section>
  </main>;
}
