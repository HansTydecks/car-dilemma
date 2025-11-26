// Level-Daten werden aus questions.json geladen
let levels = [];

const state = {
  currentIndex: 0,
  answers: {},
};

// JSON-Daten laden
async function loadQuestions() {
  try {
    const response = await fetch('questions.json');
    const data = await response.json();
    levels = data.levels;
    renderCurrentLevel();
  } catch (error) {
    console.error('Fehler beim Laden der Fragen:', error);
    questionBodyEl.innerHTML = '<p style="color: red;">Fehler beim Laden der Fragen. Bitte laden Sie die Seite neu.</p>';
  }
}

// DOM-Elemente
const metaQuestionIndexEl = document.getElementById("meta-question-index");
const scenarioImageEl = document.getElementById("scenario-image");
const scenarioCaptionEl = document.getElementById("scenario-caption");
const questionCardEl = document.getElementById("question-card");
const questionTitleEl = document.getElementById("question-title");
const questionContextEl = document.getElementById("question-context");
const questionBodyEl = document.getElementById("question-body");
const questionMessageEl = document.getElementById("question-message");
const btnPrevEl = document.getElementById("btn-prev");
const btnNextEl = document.getElementById("btn-next");
const progressBarEl = document.getElementById("progress-bar");

function getCurrentLevel() {
  return levels[state.currentIndex];
}

function updateMeta() {
  const totalDilemmas = levels.filter((l) => l.type === "dilemma").length;
  const currentLevel = getCurrentLevel();

  if (currentLevel.type === "dilemma") {
    const indexAmongDilemmas =
      levels
        .filter((l) => l.type === "dilemma")
        .findIndex((l) => l.id === currentLevel.id) + 1;
    metaQuestionIndexEl.textContent = `${indexAmongDilemmas} / ${totalDilemmas}`;
  } else if (currentLevel.type === "intro") {
    metaQuestionIndexEl.textContent = `– / ${totalDilemmas}`;
  } else if (currentLevel.type === "summary") {
    metaQuestionIndexEl.textContent = `${totalDilemmas} / ${totalDilemmas}`;
  }
}

function renderProgressBar() {
  const dilemmaLevels = levels.filter((l) => l.type === "dilemma");
  progressBarEl.innerHTML = "";

  dilemmaLevels.forEach((level, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "progress-dot";
    dot.textContent = index + 1;

    const isCurrent = getCurrentLevel().id === level.id;
    const isAnswered = !!state.answers[level.id];

    if (isCurrent) {
      dot.classList.add("progress-dot-current");
      dot.setAttribute("aria-current", "step");
    } else if (isAnswered) {
      dot.classList.add("progress-dot-answered");
    }

    dot.setAttribute("aria-label", `Zu Frage ${index + 1} wechseln`);

    dot.addEventListener("click", () => {
      const targetIndex = levels.findIndex((l) => l.id === level.id);
      if (targetIndex !== -1) {
        state.currentIndex = targetIndex;
        renderCurrentLevel();
      }
    });

    progressBarEl.appendChild(dot);
  });
}

function renderIntro(level) {
  questionTitleEl.textContent = level.title;
  questionContextEl.textContent = level.context || "";

  questionBodyEl.innerHTML = "";
  const introDiv = document.createElement("div");
  introDiv.className = "intro-text";

  level.body.forEach((pText) => {
    const p = document.createElement("p");
    p.textContent = pText;
    introDiv.appendChild(p);
  });

  const hint = document.createElement("p");
  hint.textContent =
    "Hinweis: Stellen Sie sich bei jeder Situation vor, dass Ihre Entscheidung als Vorgabe für einen Algorithmus genutzt wird.";
  hint.style.fontStyle = "italic";
  introDiv.appendChild(hint);

  questionBodyEl.appendChild(introDiv);

  if (level.imagePath) {
    scenarioImageEl.innerHTML = `<img src="${level.imagePath}" alt="${level.imageCaption || 'Szenario Bild'}" style="width: 100%; height: 100%; object-fit: contain;" />`;
  } else {
    scenarioImageEl.textContent = "Bildplatzhalter: Marktforschungslabor";
  }
  scenarioCaptionEl.textContent = level.imageCaption || "";

  questionMessageEl.textContent = "";

  btnPrevEl.disabled = true;
  btnNextEl.textContent = "Starten";
}

function renderDilemma(level) {
  questionTitleEl.textContent = level.title;
  questionContextEl.textContent = level.context || "";
  questionBodyEl.innerHTML = "";

  const promptP = document.createElement("p");
  promptP.textContent = level.prompt;
  promptP.className = "intro-text";
  questionBodyEl.appendChild(promptP);

  const list = document.createElement("ul");
  list.className = "options-list";

  const currentAnswer = state.answers[level.id] || null;

  level.options.forEach((opt) => {
    const li = document.createElement("li");
    li.className = "option-item";
    li.setAttribute("role", "radio");
    li.setAttribute("tabindex", "0");
    li.setAttribute("aria-checked", currentAnswer === opt.id ? "true" : "false");

    const inputWrapper = document.createElement("div");
    inputWrapper.className = "option-input-wrapper";

    const visualRadio = document.createElement("div");
    visualRadio.className = "option-radio";

    const visualIcon = document.createElement("div");
    visualIcon.className = "option-radio-icon";
    visualRadio.appendChild(visualIcon);

    inputWrapper.appendChild(visualRadio);

    const contentDiv = document.createElement("div");
    contentDiv.className = "option-content";

    const labelEl = document.createElement("div");
    labelEl.className = "option-label";
    labelEl.textContent = opt.label;

    const descEl = document.createElement("div");
    descEl.className = "option-description";
    descEl.textContent = opt.description;

    contentDiv.appendChild(labelEl);
    contentDiv.appendChild(descEl);

    // Meta-Infos Chips
    const metaDiv = document.createElement("div");
    metaDiv.className = "option-meta";

    if (opt.affectedActors && opt.affectedActors.length > 0) {
      opt.affectedActors.forEach((actor) => {
        const chip = document.createElement("span");
        chip.className = "option-chip";
        const prob =
          typeof actor.probability === "number"
            ? `, P × ${Math.round(actor.probability * 100)}%`
            : "";
        chip.textContent = `${actor.count} × ${actor.role}${prob}`;
        metaDiv.appendChild(chip);
      });
    }

    if (typeof opt.survivalChance === "number") {
      const chip = document.createElement("span");
      chip.className = "option-chip";
      chip.textContent = `geschätzte Überlebenschance: ${Math.round(
        opt.survivalChance * 100
      )}%`;
      metaDiv.appendChild(chip);
    }

    if (opt.driverRisk) {
      const chip = document.createElement("span");
      chip.className = "option-chip";
      chip.textContent = `Risiko für Insassen: ${opt.driverRisk}`;
      metaDiv.appendChild(chip);
    }

    if (metaDiv.children.length > 0) {
      contentDiv.appendChild(metaDiv);
    }

    li.appendChild(inputWrapper);
    li.appendChild(contentDiv);

    li.addEventListener("click", () => {
      selectOption(level.id, opt.id);
    });

    li.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        selectOption(level.id, opt.id);
      }
    });

    list.appendChild(li);
  });

  questionBodyEl.appendChild(list);

  if (level.imagePath) {
    scenarioImageEl.innerHTML = `<img src="${level.imagePath}" alt="${level.imageCaption || 'Szenario Bild'}" style="width: 100%; height: 100%; object-fit: contain;" />`;
  } else {
    scenarioImageEl.textContent = "Bildplatzhalter für das aktuelle Szenario";
  }
  scenarioCaptionEl.textContent = level.imageCaption || "";

  questionMessageEl.textContent = "";

  btnPrevEl.disabled = state.currentIndex === 0;
  btnNextEl.textContent = state.currentIndex < levels.length - 1 ? "Weiter" : "Zur Auswertung";
}

function renderSummary(level) {
  questionTitleEl.textContent = level.title;
  questionContextEl.textContent = level.context || "";
  questionBodyEl.innerHTML = "";

  const summaryDiv = document.createElement("div");
  summaryDiv.className = "summary-text";

  const introP = document.createElement("p");
  introP.textContent =
    "Die folgenden Aussagen beschreiben Tendenzen auf Basis Ihrer Entscheidungen in den Szenarien. Sie ersetzen keine moralische Bewertung, sondern dienen als Ausgangspunkt für die Diskussion.";
  summaryDiv.appendChild(introP);

  const tendencies = calculateTendencies();

  const list = document.createElement("ul");
  list.className = "options-list";

  tendencies.forEach((text) => {
    const li = document.createElement("li");
    li.className = "option-item";
    li.setAttribute("aria-checked", "false");

    const contentDiv = document.createElement("div");
    contentDiv.className = "option-content";

    const labelEl = document.createElement("div");
    labelEl.className = "option-label";
    labelEl.textContent = text.title;

    const descEl = document.createElement("div");
    descEl.className = "option-description";
    descEl.textContent = text.detail;

    contentDiv.appendChild(labelEl);
    contentDiv.appendChild(descEl);

    li.appendChild(contentDiv);
    list.appendChild(li);
  });

  summaryDiv.appendChild(list);

  const outroP = document.createElement("p");
  outroP.textContent =
    "Fragen für die Diskussion könnten sein: Welche Informationen müssen Algorithmen über Personen haben? Dürfen solche Daten überhaupt gesammelt werden? Wer trägt die Verantwortung für die Programmierung?";
  summaryDiv.appendChild(outroP);

  questionBodyEl.appendChild(summaryDiv);

  if (level.imagePath) {
    scenarioImageEl.innerHTML = `<img src="${level.imagePath}" alt="${level.imageCaption || 'Auswertung'}" style="width: 100%; height: 100%; object-fit: contain;" />`;
  } else {
    scenarioImageEl.textContent = "Bildplatzhalter für eine Übersicht oder ein Diagramm";
  }
  scenarioCaptionEl.textContent = level.imageCaption || "";

  questionMessageEl.textContent = "";

  btnPrevEl.disabled = false;
  btnNextEl.disabled = true;
  btnNextEl.textContent = "Ende";
}

function selectOption(levelId, optionId) {
  state.answers[levelId] = optionId;
  questionMessageEl.textContent = "";
  renderCurrentLevel();
}

function calculateTendencies() {
  const dilemmaLevels = levels.filter((l) => l.type === "dilemma");
  const totalQuestions = dilemmaLevels.length;
  
  const counts = {
    insassenBetont: 0,
    außenstehendeBetont: 0,
    kinderGeschuetzt: 0,
    kinderGefaehrdet: 0,
    regelbrecherGefaehrdet: 0,
    lebenserwartungBetont: 0,
    menschVorTier: 0,
    unsicherheitAkzeptiert: 0,
  };

  // Sammle konkrete Entscheidungen
  const choices = [];
  
  dilemmaLevels.forEach((level) => {
    const chosenId = state.answers[level.id];
    if (!chosenId) return;
    const opt = level.options.find((o) => o.id === chosenId);
    if (!opt) return;

    choices.push({
      question: level.title,
      choice: opt.label,
      tags: opt.ethicalTags || []
    });

    const tags = opt.ethicalTags || [];

    if (tags.includes("insassen_betroffen")) counts.insassenBetont++;
    if (tags.includes("außenstehende_betroffen")) counts.außenstehendeBetont++;
    if (tags.includes("schutz_von_kindern")) counts.kinderGeschuetzt++;
    if (tags.includes("kinder_betroffen")) counts.kinderGefaehrdet++;
    if (tags.includes("regelverletzer_vs_regelbefolger")) counts.regelbrecherGefaehrdet++;
    if (tags.includes("lebenserwartung")) counts.lebenserwartungBetont++;
    if (tags.includes("mensch_vs_tier")) counts.menschVorTier++;
    if (tags.includes("unsicherheit")) counts.unsicherheitAkzeptiert++;
  });

  const results = [];

  // Haupttendenzen
  const totalInsassenVsAußenstehende = counts.insassenBetont + counts.außenstehendeBetont;
  if (totalInsassenVsAußenstehende > 0) {
    if (counts.insassenBetont > counts.außenstehendeBetont) {
      results.push({
        title: `Tendenz: Schutz der Insassen (${counts.insassenBetont}x gewählt)`,
        detail:
          `In ${counts.insassenBetont} von ${totalInsassenVsAußenstehende} relevanten Situationen haben Sie Entscheidungen getroffen, die Fahrer:in und Mitfahrende schützen. Der Algorithmus würde die Insassen priorisieren.`,
      });
    } else if (counts.außenstehendeBetont > counts.insassenBetont) {
      results.push({
        title: `Tendenz: Schutz Außenstehender (${counts.außenstehendeBetont}x gewählt)`,
        detail:
          `In ${counts.außenstehendeBetont} von ${totalInsassenVsAußenstehende} relevanten Situationen haben Sie eher Außenstehende geschützt und Risiken für Insassen akzeptiert.`,
      });
    } else {
      results.push({
        title: "Ausgeglichene Entscheidungen (Insassen vs. Außenstehende)",
        detail:
          "Sie haben gleich oft für den Schutz der Insassen wie für den Schutz Außenstehender entschieden. Dies deutet auf eine ausgewogene Abwägung hin.",
      });
    }
  }

  // Kinder
  const totalKinder = counts.kinderGeschuetzt + counts.kinderGefaehrdet;
  if (totalKinder > 0) {
    if (counts.kinderGeschuetzt > counts.kinderGefaehrdet) {
      results.push({
        title: `Tendenz: Besonderer Schutz für Kinder (${counts.kinderGeschuetzt}x gewählt)`,
        detail:
          `In ${counts.kinderGeschuetzt} von ${totalKinder} Situationen mit Kindern haben Sie diese bevorzugt geschützt. Kinder würden im Algorithmus eine höhere Priorität erhalten.`,
      });
    } else if (counts.kinderGefaehrdet > counts.kinderGeschuetzt) {
      results.push({
        title: `Tendenz: Keine Bevorzugung von Kindern`,
        detail:
          `Sie haben Kinder nicht systematisch bevorzugt. Der Algorithmus würde Altersgruppen tendenziell gleich behandeln.`,
      });
    }
  }

  // Regelverstöße
  if (counts.regelbrecherGefaehrdet > 0) {
    results.push({
      title: `Regelverstöße als Kriterium (${counts.regelbrecherGefaehrdet}x relevant)`,
      detail:
        `In mindestens ${counts.regelbrecherGefaehrdet} Situation(en) haben Sie Personen, die Verkehrsregeln verletzt haben, eher gefährdet. Regelkonformität könnte ein Entscheidungskriterium sein.`,
    });
  }

  // Wahrscheinlichkeiten und Unsicherheit
  if (counts.unsicherheitAkzeptiert > 0) {
    results.push({
      title: `Umgang mit Unsicherheit (${counts.unsicherheitAkzeptiert}x betroffen)`,
      detail:
        `Sie haben Entscheidungen trotz unsicherer Daten getroffen. Dies zeigt, dass der Algorithmus auch bei unvollständigen Informationen handeln können muss.`,
    });
  }

  // Mensch vs. Tier
  if (counts.menschVorTier > 0) {
    results.push({
      title: `Mensch vor Tier (${counts.menschVorTier}x gewählt)`,
      detail:
        `In Situationen, in denen Menschen gegen Tiere abgewogen wurden, haben Sie für den Schutz menschlichen Lebens entschieden.`,
    });
  }

  if (results.length === 0) {
    results.push({
      title: "Noch keine Entscheidungen getroffen",
      detail:
        "Sie haben noch keine Szenarien bearbeitet. Bitte gehen Sie zurück und beantworten Sie die Fragen.",
    });
  }

  return results;
}

function renderCurrentLevel() {
  const level = getCurrentLevel();
  updateMeta();

  if (level.type === "intro") {
    renderIntro(level);
  } else if (level.type === "dilemma") {
    renderDilemma(level);
  } else if (level.type === "summary") {
    renderSummary(level);
  }

  renderProgressBar();

  window.requestAnimationFrame(() => {
    questionCardEl.focus();
  });
}

function goNext() {
  const level = getCurrentLevel();

  if (level.type === "intro") {
    state.currentIndex = Math.min(state.currentIndex + 1, levels.length - 1);
    renderCurrentLevel();
    return;
  }

  if (level.type === "dilemma") {
    const answer = state.answers[level.id];
    if (!answer) {
      questionMessageEl.textContent = "Bitte wählen Sie eine Option aus, bevor Sie fortfahren.";
      return;
    }
  }

  if (state.currentIndex < levels.length - 1) {
    state.currentIndex++;
    renderCurrentLevel();
  }
}

function goPrev() {
  if (state.currentIndex === 0) return;
  state.currentIndex--;
  const level = getCurrentLevel();
  if (level.type === "summary") {
    btnNextEl.disabled = false;
  }
  renderCurrentLevel();
}

btnNextEl.addEventListener("click", goNext);
btnPrevEl.addEventListener("click", goPrev);

// Fragen laden und App starten
loadQuestions();
