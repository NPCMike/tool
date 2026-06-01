const STORAGE_KEY = "mind-map-studio-state-v1";
const HORIZONTAL_GAP = 96;
const VERTICAL_GAP = 26;
const ROOT_CHILD_GAP = 44;
const MIN_SCALE = 0.28;
const MAX_SCALE = 2.4;

// Down (org-chart) structure spacing.
const DOWN_LEVEL_GAP = 60;
const DOWN_SIBLING_GAP = 28;

const SVG_NS = "http://www.w3.org/2000/svg";
const EXPORT_FONT = "Inter, 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
// Excalidraw-style hand-drawn rendering tuned through rough.js.
// Higher roughness/bowing = more obviously hand-drawn (closer to Excalidraw's "cartoonist").
const ROUGHNESS = 1.7;
const BOWING = 1.9;
let roughSvg = null;

const palette = [
  { fill: "#fff7cc", stroke: "#7a5d00" },
  { fill: "#e0f2fe", stroke: "#075985" },
  { fill: "#dcfce7", stroke: "#166534" },
  { fill: "#fee2e2", stroke: "#991b1b" },
  { fill: "#f3e8ff", stroke: "#6b21a8" },
  { fill: "#fef3c7", stroke: "#92400e" },
  { fill: "#e2e8f0", stroke: "#334155" },
  { fill: "#ccfbf1", stroke: "#0f766e" },
  { fill: "#fce7f3", stroke: "#9d174d" },
  { fill: "#dbeafe", stroke: "#1d4ed8" },
  { fill: "#ede9fe", stroke: "#5b21b6" },
  { fill: "#ffffff", stroke: "#334155" },
];

const markerOptions = [
  { id: "none", label: "無", glyph: "" },
  { id: "priority-1", label: "1", glyph: "1" },
  { id: "priority-2", label: "2", glyph: "2" },
  { id: "progress-half", label: "50", glyph: "50" },
  { id: "done", label: "OK", glyph: "✓" },
  { id: "star", label: "星", glyph: "★" },
];

const markerOrder = markerOptions.map((option) => option.id);

// Coordinated colour schemes applied by depth: root / level-1 branches / deeper leaves.
const THEMES = [
  {
    id: "classic",
    name: "經典",
    canvas: "#ffffff",
    root: { fill: "#dbeafe", stroke: "#1d4ed8" },
    branches: [
      { fill: "#fff7cc", stroke: "#7a5d00" },
      { fill: "#e0f2fe", stroke: "#075985" },
      { fill: "#dcfce7", stroke: "#166534" },
      { fill: "#fce7f3", stroke: "#9d174d" },
      { fill: "#f3e8ff", stroke: "#6b21a8" },
      { fill: "#ffedd5", stroke: "#9a3412" },
    ],
    leaf: { fill: "#ffffff", stroke: "#475569" },
  },
  {
    id: "ocean",
    name: "海洋",
    canvas: "#f1f9ff",
    root: { fill: "#bae6fd", stroke: "#075985" },
    branches: [
      { fill: "#cffafe", stroke: "#0e7490" },
      { fill: "#dbeafe", stroke: "#1d4ed8" },
      { fill: "#e0e7ff", stroke: "#4338ca" },
      { fill: "#ccfbf1", stroke: "#0f766e" },
      { fill: "#bfdbfe", stroke: "#1e40af" },
    ],
    leaf: { fill: "#f0f9ff", stroke: "#0369a1" },
  },
  {
    id: "forest",
    name: "森林",
    canvas: "#f3faf3",
    root: { fill: "#bbf7d0", stroke: "#166534" },
    branches: [
      { fill: "#dcfce7", stroke: "#15803d" },
      { fill: "#ecfccb", stroke: "#4d7c0f" },
      { fill: "#d1fae5", stroke: "#047857" },
      { fill: "#ccfbf1", stroke: "#0f766e" },
      { fill: "#fef9c3", stroke: "#854d0e" },
    ],
    leaf: { fill: "#f0fdf4", stroke: "#15803d" },
  },
  {
    id: "sunset",
    name: "暖陽",
    canvas: "#fff7f2",
    root: { fill: "#fed7aa", stroke: "#9a3412" },
    branches: [
      { fill: "#fee2e2", stroke: "#b91c1c" },
      { fill: "#ffedd5", stroke: "#c2410c" },
      { fill: "#fef3c7", stroke: "#a16207" },
      { fill: "#fce7f3", stroke: "#be185d" },
      { fill: "#ffe4e6", stroke: "#9f1239" },
    ],
    leaf: { fill: "#fffbeb", stroke: "#b45309" },
  },
  {
    id: "mono",
    name: "灰階",
    canvas: "#f7f7f8",
    root: { fill: "#e2e8f0", stroke: "#334155" },
    branches: [
      { fill: "#f1f5f9", stroke: "#475569" },
      { fill: "#e2e8f0", stroke: "#334155" },
      { fill: "#e5e7eb", stroke: "#374151" },
      { fill: "#f3f4f6", stroke: "#4b5563" },
    ],
    leaf: { fill: "#ffffff", stroke: "#64748b" },
  },
  {
    id: "rose",
    name: "玫瑰",
    canvas: "#fff5f7",
    root: { fill: "#fbcfe8", stroke: "#9d174d" },
    branches: [
      { fill: "#fce7f3", stroke: "#be185d" },
      { fill: "#ffe4e6", stroke: "#9f1239" },
      { fill: "#fae8ff", stroke: "#a21caf" },
      { fill: "#ede9fe", stroke: "#6d28d9" },
      { fill: "#ffd6e7", stroke: "#be123c" },
    ],
    leaf: { fill: "#fff1f2", stroke: "#9f1239" },
  },
  {
    id: "mint",
    name: "薄荷",
    canvas: "#f0fdfa",
    root: { fill: "#99f6e4", stroke: "#0f766e" },
    branches: [
      { fill: "#ccfbf1", stroke: "#0d9488" },
      { fill: "#cffafe", stroke: "#0e7490" },
      { fill: "#d1fae5", stroke: "#047857" },
      { fill: "#dcfce7", stroke: "#15803d" },
      { fill: "#e0f2fe", stroke: "#0369a1" },
    ],
    leaf: { fill: "#f0fdfa", stroke: "#0f766e" },
  },
  {
    id: "earth",
    name: "大地",
    canvas: "#faf6f0",
    root: { fill: "#e7d3b3", stroke: "#78350f" },
    branches: [
      { fill: "#fef3c7", stroke: "#92400e" },
      { fill: "#fde9c8", stroke: "#9a3412" },
      { fill: "#e7e5c8", stroke: "#4d7c0f" },
      { fill: "#f5e6d3", stroke: "#7c2d12" },
      { fill: "#ecdcc0", stroke: "#854d0e" },
    ],
    leaf: { fill: "#fdf8f0", stroke: "#78350f" },
  },
  {
    id: "indigo",
    name: "靛夜",
    canvas: "#f3f4ff",
    root: { fill: "#c7d2fe", stroke: "#3730a3" },
    branches: [
      { fill: "#e0e7ff", stroke: "#4338ca" },
      { fill: "#ede9fe", stroke: "#6d28d9" },
      { fill: "#dbeafe", stroke: "#1d4ed8" },
      { fill: "#f3e8ff", stroke: "#7c3aed" },
      { fill: "#e0e7ff", stroke: "#4f46e5" },
    ],
    leaf: { fill: "#f5f5ff", stroke: "#4338ca" },
  },
];

const sampleMap = {
  title: "workspace.mind",
  rootId: "root",
  selectedId: "root",
  lineStyle: "curve",
  viewport: { x: 0, y: 0, scale: 1 },
  relationships: [],
  topics: {
    root: {
      id: "root",
      text: "產品心智圖",
      parentId: null,
      children: ["idea", "research", "flow", "ship"],
      side: "root",
      x: 0,
      y: 0,
      width: 190,
      height: 62,
      fill: "#dbeafe",
      stroke: "#1d4ed8",
      shape: "round",
      fontSize: 22,
      collapsed: false,
      notes: "",
    },
    idea: {
      id: "idea",
      text: "核心主題",
      parentId: "root",
      children: ["idea-positioning", "idea-tone"],
      side: "left",
      x: -300,
      y: -88,
      width: 132,
      height: 46,
      fill: "#fff7cc",
      stroke: "#7a5d00",
      shape: "round",
      fontSize: 16,
      collapsed: false,
      boundary: true,
      notes: "整理使用者要達成的主要目標。",
    },
    "idea-positioning": {
      id: "idea-positioning",
      text: "像 Xmind 一樣先完整建立",
      parentId: "idea",
      children: [],
      side: "left",
      x: -596,
      y: -116,
      width: 220,
      height: 48,
      fill: "#ffffff",
      stroke: "#475569",
      shape: "round",
      fontSize: 15,
      collapsed: false,
      marker: "progress-half",
      notes: "",
    },
    "idea-tone": {
      id: "idea-tone",
      text: "再依工作流修改細節",
      parentId: "idea",
      children: [],
      side: "left",
      x: -579,
      y: -56,
      width: 186,
      height: 44,
      fill: "#ffffff",
      stroke: "#475569",
      shape: "underline",
      fontSize: 15,
      collapsed: false,
      notes: "",
    },
    research: {
      id: "research",
      text: "資料與素材",
      parentId: "root",
      children: ["research-import", "research-export"],
      side: "left",
      x: -300,
      y: 98,
      width: 134,
      height: 46,
      fill: "#dcfce7",
      stroke: "#166534",
      shape: "round",
      fontSize: 16,
      collapsed: false,
      notes: "",
    },
    "research-import": {
      id: "research-import",
      text: "JSON 匯入",
      parentId: "research",
      children: [],
      side: "left",
      x: -530,
      y: 70,
      width: 118,
      height: 42,
      fill: "#ffffff",
      stroke: "#475569",
      shape: "capsule",
      fontSize: 15,
      collapsed: false,
      notes: "",
    },
    "research-export": {
      id: "research-export",
      text: "JSON 匯出",
      parentId: "research",
      children: [],
      side: "left",
      x: -530,
      y: 126,
      width: 118,
      height: 42,
      fill: "#ffffff",
      stroke: "#475569",
      shape: "capsule",
      fontSize: 15,
      collapsed: false,
      notes: "",
    },
    flow: {
      id: "flow",
      text: "操作流程",
      parentId: "root",
      children: ["flow-edit", "flow-drag", "flow-collapse"],
      side: "right",
      x: 300,
      y: -86,
      width: 132,
      height: 46,
      fill: "#e0f2fe",
      stroke: "#075985",
      shape: "round",
      fontSize: 16,
      collapsed: false,
      notes: "",
    },
    "flow-edit": {
      id: "flow-edit",
      text: "雙擊編輯",
      parentId: "flow",
      children: [],
      side: "right",
      x: 528,
      y: -142,
      width: 116,
      height: 42,
      fill: "#ffffff",
      stroke: "#475569",
      shape: "capsule",
      fontSize: 15,
      collapsed: false,
      notes: "",
    },
    "flow-drag": {
      id: "flow-drag",
      text: "拖曳節點與畫布",
      parentId: "flow",
      children: [],
      side: "right",
      x: 558,
      y: -86,
      width: 174,
      height: 42,
      fill: "#ffffff",
      stroke: "#475569",
      shape: "round",
      fontSize: 15,
      collapsed: false,
      notes: "",
    },
    "flow-collapse": {
      id: "flow-collapse",
      text: "收合分支",
      parentId: "flow",
      children: [],
      side: "right",
      x: 528,
      y: -30,
      width: 116,
      height: 42,
      fill: "#ffffff",
      stroke: "#475569",
      shape: "underline",
      fontSize: 15,
      collapsed: false,
      notes: "",
    },
    ship: {
      id: "ship",
      text: "交付格式",
      parentId: "root",
      children: ["ship-local", "ship-history"],
      side: "right",
      x: 300,
      y: 100,
      width: 132,
      height: 46,
      fill: "#fce7f3",
      stroke: "#9d174d",
      shape: "round",
      fontSize: 16,
      collapsed: false,
      notes: "",
    },
    "ship-local": {
      id: "ship-local",
      text: "單檔可開啟",
      parentId: "ship",
      children: [],
      side: "right",
      x: 535,
      y: 72,
      width: 130,
      height: 42,
      fill: "#ffffff",
      stroke: "#475569",
      shape: "capsule",
      fontSize: 15,
      collapsed: false,
      notes: "",
    },
    "ship-history": {
      id: "ship-history",
      text: "復原 / 重做",
      parentId: "ship",
      children: [],
      side: "right",
      x: 540,
      y: 128,
      width: 142,
      height: 42,
      fill: "#ffffff",
      stroke: "#475569",
      shape: "round",
      fontSize: 15,
      collapsed: false,
      notes: "",
    },
  },
};

let state = loadState();
let historyBack = [];
let historyForward = [];
let saveTimer = 0;
let ignoreInspectorEvents = false;
let pendingInspectorSnapshot = null;
let editingTopicId = null;
let dropTargetId = null;
let pendingRelationshipFromId = null;
let initialFitDone = false;
let isSpaceDown = false;
let selectedIds = new Set();
let clipboard = null;
let searchMatches = [];
let searchActive = -1;

const els = {
  canvas: document.querySelector("#canvas"),
  world: document.querySelector("#world"),
  linkLayer: document.querySelector("#linkLayer"),
  topicLayer: document.querySelector("#topicLayer"),
  notesInput: document.querySelector("#notesInput"),
  linkInput: document.querySelector("#linkInput"),
  tagsInput: document.querySelector("#tagsInput"),
  fontSizeInput: document.querySelector("#fontSizeInput"),
  colorSwatches: document.querySelector("#colorSwatches"),
  markerControl: document.querySelector("#markerControl"),
  boundaryToggle: document.querySelector("#boundaryToggle"),
  shapeControl: document.querySelector("#shapeControl"),
  sideControl: document.querySelector("#sideControl"),
  lineControl: document.querySelector("#lineControl"),
  textStyleControl: document.querySelector("#textStyleControl"),
  textColorInput: document.querySelector("#textColorInput"),
  imageInput: document.querySelector("#imageInput"),
  imagePick: document.querySelector("#imagePick"),
  imageClear: document.querySelector("#imageClear"),
  structureControl: document.querySelector("#structureControl"),
  sketchControl: document.querySelector("#sketchControl"),
  themeControl: document.querySelector("#themeControl"),
  inspector: document.querySelector(".inspector"),
  exportMenu: document.querySelector("#exportMenu"),
  exportScope: document.querySelector("#exportScope"),
  contextMenu: document.querySelector("#contextMenu"),
  lightbox: document.querySelector("#lightbox"),
  searchBar: document.querySelector("#searchBar"),
  searchInput: document.querySelector("#searchInput"),
  searchCount: document.querySelector("#searchCount"),
  richToolbar: document.querySelector("#richToolbar"),
  zoomReadout: document.querySelector("#zoomReadout"),
  selectionStatus: document.querySelector("#selectionStatus"),
  autosaveStatus: document.querySelector("#autosaveStatus"),
  fileInput: document.querySelector("#fileInput"),
  mapTitle: document.querySelector("#mapTitle"),
  marquee: document.querySelector("#marquee"),
  dropIndicator: document.querySelector("#dropIndicator"),
};

init();

function init() {
  roughSvg = rough.svg(els.linkLayer);
  normalizeState(state);
  selectedIds = new Set([state.selectedId]);
  measureAllTopics();
  layoutMindMap();
  setupSwatches();
  setupMarkers();
  setupThemes();
  bindEvents();
  render();

  requestAnimationFrame(() => {
    if (!initialFitDone) {
      fitToScreen();
      initialFitDone = true;
    }
  });
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return deepClone(sampleMap);
    return normalizeImportedState(JSON.parse(raw));
  } catch {
    return deepClone(sampleMap);
  }
}

function normalizeImportedState(nextState) {
  const fallback = deepClone(sampleMap);
  if (!nextState || typeof nextState !== "object" || !nextState.topics) return fallback;
  return {
    ...fallback,
    ...nextState,
    viewport: {
      ...fallback.viewport,
      ...(nextState.viewport || {}),
    },
    topics: nextState.topics,
  };
}

function normalizeState(target) {
  target.title ||= "workspace.mind";
  target.rootId ||= "root";
  target.selectedId = target.topics[target.selectedId] ? target.selectedId : target.rootId;
  target.lineStyle = target.lineStyle === "elbow" ? "elbow" : "curve";
  target.structure = ["map", "right", "down"].includes(target.structure) ? target.structure : "map";
  target.sketch = target.sketch !== false;
  target.theme = THEMES.some((theme) => theme.id === target.theme) ? target.theme : "classic";
  target.viewport ||= { x: 0, y: 0, scale: 1 };
  target.viewport.scale = clamp(Number(target.viewport.scale) || 1, MIN_SCALE, MAX_SCALE);

  Object.values(target.topics).forEach((topic) => {
    topic.children ||= [];
    topic.text = String(topic.text || "新主題");
    topic.fill ||= "#ffffff";
    topic.stroke ||= "#475569";
    topic.shape = ["round", "capsule", "underline"].includes(topic.shape) ? topic.shape : "round";
    topic.fontSize = clamp(Number(topic.fontSize) || 15, 13, 28);
    topic.collapsed = Boolean(topic.collapsed);
    topic.boundary = Boolean(topic.boundary);
    topic.marker = markerOrder.includes(topic.marker) ? topic.marker : "none";
    topic.notes ||= "";
    topic.link = typeof topic.link === "string" ? topic.link.trim() : "";
    topic.tags = Array.isArray(topic.tags)
      ? topic.tags.map((tag) => String(tag).trim()).filter(Boolean)
      : [];
    topic.image = typeof topic.image === "string" ? topic.image : "";
    topic.imageW = Number(topic.imageW) || 0;
    topic.imageH = Number(topic.imageH) || 0;
    topic.bold = Boolean(topic.bold);
    topic.italic = Boolean(topic.italic);
    topic.textColor = typeof topic.textColor === "string" ? topic.textColor : "";
    topic.html = typeof topic.html === "string" ? topic.html : "";
    topic.x = Number(topic.x) || 0;
    topic.y = Number(topic.y) || 0;
    topic.width = Number(topic.width) || 140;
    topic.height = Number(topic.height) || 46;
  });

  target.relationships = Array.isArray(target.relationships)
    ? target.relationships
        .filter((relationship) => {
          return (
            relationship &&
            target.topics[relationship.fromId] &&
            target.topics[relationship.toId] &&
            relationship.fromId !== relationship.toId
          );
        })
        .map((relationship) => ({
          id: relationship.id || createId(),
          fromId: relationship.fromId,
          toId: relationship.toId,
          label: String(relationship.label || ""),
          stroke: relationship.stroke || "#6965db",
        }))
    : [];
}

function bindEvents() {
  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => runAction(button.dataset.action));
  });

  els.canvas.addEventListener("pointerdown", onCanvasPointerDown);
  els.canvas.addEventListener("wheel", onCanvasWheel, { passive: false });
  els.canvas.addEventListener("dblclick", onCanvasDoubleClick);
  els.topicLayer.addEventListener("dblclick", onTopicDoubleClick);
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", releaseSpace);
  window.addEventListener("resize", () => render());

  els.notesInput.addEventListener("focus", beginInspectorEdit);
  els.notesInput.addEventListener("input", () => {
    mutateSelectedDraft((topic) => {
      topic.notes = els.notesInput.value;
    });
  });
  els.notesInput.addEventListener("blur", finishInspectorEdit);

  els.linkInput.addEventListener("focus", beginInspectorEdit);
  els.linkInput.addEventListener("input", () => {
    mutateSelectedDraft((topic) => {
      topic.link = els.linkInput.value.trim();
    });
  });
  els.linkInput.addEventListener("blur", finishInspectorEdit);

  els.tagsInput.addEventListener("focus", beginInspectorEdit);
  els.tagsInput.addEventListener("input", () => {
    mutateSelectedDraft((topic) => {
      topic.tags = els.tagsInput.value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      measureTopic(topic);
      layoutMindMap();
    });
  });
  els.tagsInput.addEventListener("blur", finishInspectorEdit);

  els.textStyleControl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-style]");
    if (!button) return;
    const key = button.dataset.style; // "bold" | "italic"
    commitMutation(() => {
      const next = !selectedTopic()[key];
      targetTopics().forEach((topic) => {
        topic[key] = next;
      });
    });
  });

  els.textColorInput.addEventListener("input", () => {
    if (ignoreInspectorEvents) return;
    beginInspectorEdit();
    const color = els.textColorInput.value;
    targetTopics().forEach((topic) => {
      topic.textColor = color;
    });
    render();
  });
  els.textColorInput.addEventListener("change", finishInspectorEdit);

  els.imagePick.addEventListener("click", () => els.imageInput.click());
  els.imageInput.addEventListener("change", () => {
    const file = els.imageInput.files?.[0];
    if (file) setTopicImage(file);
    els.imageInput.value = "";
  });
  els.imageClear.addEventListener("click", () => {
    if (!selectedIds.size) return;
    commitMutation(() => {
      targetTopics().forEach((topic) => {
        topic.image = "";
        topic.imageW = 0;
        topic.imageH = 0;
        measureTopic(topic);
      });
      layoutMindMap();
    });
  });

  els.fontSizeInput.addEventListener("pointerdown", beginInspectorEdit);
  els.fontSizeInput.addEventListener("input", () => {
    if (ignoreInspectorEvents) return;
    const size = Number(els.fontSizeInput.value);
    targetTopics().forEach((topic) => {
      topic.fontSize = size;
      measureTopic(topic);
    });
    layoutMindMap();
    render();
  });
  els.fontSizeInput.addEventListener("change", finishInspectorEdit);

  els.shapeControl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-shape]");
    if (!button) return;
    commitMutation(() => {
      targetTopics().forEach((topic) => {
        topic.shape = button.dataset.shape;
        measureTopic(topic);
      });
      layoutMindMap();
    });
  });

  els.sideControl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-side]");
    if (!button) return;
    commitMutation(() => {
      targetTopics().forEach((topic) => {
        if (topic.parentId != null) setBranchSide(topic.id, button.dataset.side);
      });
      layoutMindMap({ force: true });
    });
  });

  els.lineControl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-line]");
    if (!button) return;
    commitMutation(() => {
      state.lineStyle = button.dataset.line;
    });
  });

  els.structureControl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-structure]");
    if (!button || button.dataset.structure === state.structure) return;
    commitMutation(() => {
      state.structure = button.dataset.structure;
      Object.values(state.topics).forEach((topic) => {
        topic.manual = false;
      });
      if (state.structure === "map") {
        // Returning to the balanced map: re-split each root's branches to both sides.
        getRootIds().forEach((rootId) => {
          state.topics[rootId].children.forEach((id, index) => {
            if (state.topics[id]) setBranchSide(id, index % 2 ? "left" : "right");
          });
        });
      }
      layoutMindMap({ force: true });
    });
    fitToScreen();
  });

  els.sketchControl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-sketch]");
    if (!button) return;
    const next = button.dataset.sketch === "hand";
    if (next === state.sketch) return;
    commitMutation(() => {
      state.sketch = next;
    });
  });

  els.themeControl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-theme]");
    if (!button) return;
    applyTheme(button.dataset.theme);
  });

  els.exportMenu.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-export]");
    if (!button) return;
    closeExportMenu();
    const kind = button.dataset.export;
    if (kind === "json") exportMap();
    else exportImage(kind);
  });

  els.canvas.addEventListener("contextmenu", onContextMenu);

  document.addEventListener("pointerdown", (event) => {
    if (!els.exportMenu.hidden && !event.target.closest(".export-wrap")) closeExportMenu();
    if (!els.contextMenu.hidden && !event.target.closest("#contextMenu")) closeContextMenu();
  });
  window.addEventListener("scroll", closeContextMenu, true);

  els.lightbox.addEventListener("click", closeLightbox);

  els.searchInput.addEventListener("input", () => runSearch(els.searchInput.value));
  els.searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      stepSearch(event.shiftKey ? -1 : 1);
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeSearch();
    }
  });
  els.searchBar.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-search]");
    if (!button) return;
    if (button.dataset.search === "next") stepSearch(1);
    else if (button.dataset.search === "prev") stepSearch(-1);
    else closeSearch();
  });

  // Inline rich-text toolbar: mousedown keeps the editing selection; click applies the format.
  els.richToolbar.addEventListener("mousedown", (event) => {
    if (event.target.closest("button")) event.preventDefault();
  });
  els.richToolbar.addEventListener("click", (event) => {
    const command = event.target.closest("button[data-rich]");
    const colorButton = event.target.closest("button[data-rich-color]");
    if (command) {
      document.execCommand(command.dataset.rich);
    } else if (colorButton) {
      document.execCommand("styleWithCSS", false, true);
      document.execCommand("foreColor", false, colorButton.dataset.richColor);
    }
  });

  els.colorSwatches.addEventListener("click", (event) => {
    const swatch = event.target.closest(".swatch");
    if (!swatch) return;
    const color = palette[Number(swatch.dataset.index)];
    commitMutation(() => {
      targetTopics().forEach((topic) => {
        topic.fill = color.fill;
        topic.stroke = color.stroke;
      });
    });
  });

  els.markerControl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-marker]");
    if (!button) return;
    commitMutation(() => {
      targetTopics().forEach((topic) => {
        topic.marker = button.dataset.marker;
      });
    });
  });

  els.boundaryToggle.addEventListener("change", () => {
    if (ignoreInspectorEvents) return;
    commitMutation(() => {
      const checked = els.boundaryToggle.checked;
      targetTopics().forEach((topic) => {
        topic.boundary = checked;
      });
    });
  });

  els.fileInput.addEventListener("change", onImportFile);
}

function runAction(action) {
  const actions = {
    "new-map": newMap,
    undo,
    redo,
    "add-child": addChild,
    "add-sibling": addSibling,
    "toggle-collapse": toggleCollapse,
    "start-relationship": startRelationship,
    "toggle-boundary": toggleBoundary,
    "cycle-marker": cycleMarker,
    "delete-topic": deleteSelected,
    fit: fitToScreen,
    "zoom-out": () => zoomAtCenter(0.86),
    "zoom-in": () => zoomAtCenter(1.16),
    import: () => els.fileInput.click(),
    export: toggleExportMenu,
    "center-selected": centerSelected,
  };
  actions[action]?.();
}

function setupSwatches() {
  els.colorSwatches.replaceChildren(
    ...palette.map((color, index) => {
      const button = document.createElement("button");
      button.className = "swatch";
      button.type = "button";
      button.dataset.index = String(index);
      button.style.setProperty("--swatch", color.fill);
      button.title = `顏色 ${index + 1}`;
      button.setAttribute("aria-label", `顏色 ${index + 1}`);
      return button;
    }),
  );
}

function setupMarkers() {
  els.markerControl.replaceChildren(
    ...markerOptions.map((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.marker = option.id;
      button.title = option.label === "無" ? "清除標記" : `標記 ${option.label}`;
      button.setAttribute("aria-label", button.title);
      button.textContent = option.glyph || "無";
      return button;
    }),
  );
}

function setupThemes() {
  els.themeControl.replaceChildren(
    ...THEMES.map((theme) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "theme-swatch";
      button.dataset.theme = theme.id;
      button.title = theme.name;
      button.setAttribute("aria-label", `主題 ${theme.name}`);
      const colors = [theme.root.fill, ...theme.branches.slice(0, 3).map((branch) => branch.fill)];
      button.style.background = `linear-gradient(135deg, ${colors[0]} 0 28%, ${colors[1]} 28% 52%, ${colors[2]} 52% 76%, ${colors[3] || colors[2]} 76% 100%)`;
      return button;
    }),
  );
}

function render() {
  normalizeState(state);
  syncSelection();
  els.canvas.style.setProperty("--canvas", currentTheme().canvas);
  applyViewport();
  const visibleIds = getVisibleIds();
  renderLinks(visibleIds);
  renderTopics(visibleIds);
  renderInspector();
  scheduleSave();
}

function applyViewport() {
  const { x, y, scale } = state.viewport;
  els.world.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  els.zoomReadout.textContent = `${Math.round(scale * 100)}%`;
}

function renderTopics(visibleIds) {
  const visible = new Set(visibleIds);
  Array.from(els.topicLayer.children).forEach((node) => {
    if (!visible.has(node.dataset.id)) node.remove();
  });

  visibleIds.forEach((id) => {
    const topic = state.topics[id];
    let node = els.topicLayer.querySelector(`[data-id="${cssEscape(id)}"]`);
    if (!node) {
      node = createTopicNode(topic);
      els.topicLayer.appendChild(node);
    }
    updateTopicNode(node, topic);
  });
}

function createTopicNode(topic) {
  const node = document.createElement("div");
  node.className = "topic";
  node.dataset.id = topic.id;
  node.innerHTML = `
    <svg class="topic-sketch" aria-hidden="true"></svg>
    <span class="topic-marker" aria-hidden="true"></span>
    <a class="topic-link" target="_blank" rel="noopener noreferrer" hidden aria-label="開啟連結">
      <svg viewBox="0 0 24 24"><path d="M10 13a4 4 0 0 0 5.66 0l3-3a4 4 0 1 0-5.66-5.66l-1 1"></path><path d="M14 11a4 4 0 0 0-5.66 0l-3 3a4 4 0 1 0 5.66 5.66l1-1"></path></svg>
    </a>
    <span class="topic-note" hidden aria-hidden="true">
      <svg viewBox="0 0 24 24"><path d="M5 4h10l4 4v12H5z"></path><path d="M9 12h6M9 16h4"></path></svg>
    </span>
    <span class="topic-image" hidden><img alt="" /></span>
    <span class="topic-text"></span>
    <span class="topic-tags" hidden></span>
  `;
  node.addEventListener("pointerdown", onTopicPointerDown);
  node.addEventListener("click", (event) => {
    event.stopPropagation();
    if (isSpaceDown) return;
    if (pendingRelationshipFromId) handleRelationshipTarget(topic.id);
  });
  // Clicking the link badge opens the URL without selecting/dragging the node.
  const link = node.querySelector(".topic-link");
  link.addEventListener("pointerdown", (event) => event.stopPropagation());
  link.addEventListener("click", (event) => event.stopPropagation());
  return node;
}

function updateTopicNode(node, topic) {
  const selected = selectedIds.has(topic.id);
  const radius = topic.shape === "capsule" ? topic.height / 2 : topic.shape === "underline" ? 2 : 12;

  node.className = [
    "topic",
    topic.parentId == null ? "is-root" : "",
    selected ? "is-selected" : "",
    topic.id === dropTargetId ? "is-drop-target" : "",
    topic.id === pendingRelationshipFromId ? "is-relationship-source" : "",
    searchMatches.includes(topic.id) ? "is-search-match" : "",
    searchActive >= 0 && searchMatches[searchActive] === topic.id ? "is-search-active" : "",
    editingTopicId === topic.id ? "is-editing" : "is-draggable",
  ]
    .filter(Boolean)
    .join(" ");
  node.dataset.id = topic.id;
  node.dataset.shape = topic.shape;
  node.dataset.marker = topic.marker || "none";
  node.style.width = `${topic.width}px`;
  node.style.minHeight = `${topic.height}px`;
  node.style.transform = `translate(${topic.x - topic.width / 2}px, ${topic.y - topic.height / 2}px)`;
  node.style.setProperty("--topic-radius", `${radius}px`);
  node.style.borderRadius = `${radius}px`;

  const text = node.querySelector(".topic-text");
  text.style.fontSize = `${topic.fontSize}px`;
  const isRootNode = topic.parentId == null;
  const isFirstLevel = !isRootNode && state.topics[topic.parentId]?.parentId == null;
  const baseWeight = isRootNode ? 750 : isFirstLevel ? 680 : 560;
  text.style.fontWeight = topic.bold ? "800" : String(baseWeight);
  text.style.fontStyle = topic.italic ? "italic" : "normal";
  text.style.color = topic.textColor || "";
  if (editingTopicId !== topic.id) {
    if (topic.html) {
      if (text.innerHTML !== topic.html) text.innerHTML = topic.html;
    } else if (text.textContent !== topic.text) {
      text.textContent = topic.text;
    }
  }

  const sketch = node.querySelector(".topic-sketch");
  const signature = `${topic.width}x${topic.height}:${topic.shape}:${topic.fill}:${topic.stroke}:${state.sketch ? "h" : "c"}`;
  if (sketch.dataset.sig !== signature) {
    sketch.dataset.sig = signature;
    sketch.setAttribute("viewBox", `0 0 ${topic.width} ${topic.height}`);
    sketch.replaceChildren(...sketchTopic(topic));
  }

  const marker = markerOptions.find((option) => option.id === topic.marker) || markerOptions[0];
  const markerNode = node.querySelector(".topic-marker");
  markerNode.textContent = marker.glyph;
  markerNode.hidden = !marker.glyph;

  const link = node.querySelector(".topic-link");
  if (topic.link) {
    link.hidden = false;
    link.href = topic.link;
  } else {
    link.hidden = true;
    link.removeAttribute("href");
  }

  node.querySelector(".topic-note").hidden = !(topic.notes && topic.notes.trim());

  const tagsWrap = node.querySelector(".topic-tags");
  if (topic.tags && topic.tags.length) {
    tagsWrap.hidden = false;
    tagsWrap.replaceChildren(
      ...topic.tags.map((tag) => {
        const chip = document.createElement("span");
        chip.className = "topic-tag";
        chip.textContent = tag;
        return chip;
      }),
    );
  } else {
    tagsWrap.hidden = true;
    tagsWrap.replaceChildren();
  }

  const imageWrap = node.querySelector(".topic-image");
  const img = imageWrap.querySelector("img");
  if (topic.image) {
    if (img.getAttribute("src") !== topic.image) img.src = topic.image;
    img.style.height = `${topic.imageDisplayH || 100}px`;
    imageWrap.hidden = false;
  } else {
    imageWrap.hidden = true;
    if (img.getAttribute("src")) img.removeAttribute("src");
  }

  node.querySelector(".collapse-badge")?.remove();
  if (topic.children.length && topic.collapsed) {
    const badge = document.createElement("span");
    badge.className = "collapse-badge";
    badge.textContent = String(countDescendants(topic.id));
    node.appendChild(badge);
  }
}

function renderLinks(visibleIds) {
  const visible = new Set(visibleIds);
  const nodes = [];
  visibleIds.forEach((id) => {
    const topic = state.topics[id];
    if (topic.boundary) nodes.push(...sketchBoundary(id, visible));
  });
  visibleIds.forEach((id) => {
    const topic = state.topics[id];
    if (!topic.parentId || !visible.has(topic.parentId)) return;
    nodes.push(...sketchLink(state.topics[topic.parentId], topic));
  });
  state.relationships.forEach((relationship) => {
    if (!visible.has(relationship.fromId) || !visible.has(relationship.toId)) return;
    nodes.push(...sketchRelationship(relationship));
  });
  els.linkLayer.replaceChildren(...nodes);
}

function renderInspector() {
  ignoreInspectorEvents = true;
  els.mapTitle.textContent = state.title || "workspace.mind";
  setActiveSegment(els.structureControl, "structure", state.structure);
  setActiveSegment(els.sketchControl, "sketch", state.sketch ? "hand" : "clean");
  Array.from(els.themeControl.children).forEach((swatch) => {
    swatch.classList.toggle("is-active", swatch.dataset.theme === state.theme);
  });

  const topic = selectedTopic();
  const noSelection = !selectedIds.size && !pendingRelationshipFromId;
  els.notesInput.value = noSelection ? "" : topic.notes || "";
  els.linkInput.value = noSelection ? "" : topic.link || "";
  els.tagsInput.value = noSelection ? "" : (topic.tags || []).join(", ");
  els.fontSizeInput.value = String(topic.fontSize);
  els.textColorInput.value = topic.textColor || "#0f172a";
  if (pendingRelationshipFromId) {
    const source = state.topics[pendingRelationshipFromId];
    els.selectionStatus.textContent = `選擇關聯目標 / ${source?.text || "主題"}`;
  } else if (noSelection) {
    els.selectionStatus.textContent = "未選取 / 格式套用到全部主題";
  } else if (selectedIds.size > 1) {
    els.selectionStatus.textContent = `已選取 ${selectedIds.size} 個主題`;
  } else {
    els.selectionStatus.textContent = topic.parentId
      ? `${topic.text} / ${topic.children.length} 子主題`
      : `${topic.text} / 中心主題`;
  }

  setActiveSegment(els.shapeControl, "shape", topic.shape);
  setActiveSegment(els.markerControl, "marker", topic.marker || "none");
  setActiveSegment(els.sideControl, "side", topic.side === "left" ? "left" : "right");
  setActiveSegment(els.lineControl, "line", state.lineStyle);
  els.boundaryToggle.checked = Boolean(topic.boundary);

  els.textStyleControl.querySelector('[data-style="bold"]').classList.toggle("is-active", Boolean(topic.bold));
  els.textStyleControl.querySelector('[data-style="italic"]').classList.toggle("is-active", Boolean(topic.italic));
  els.imagePick.disabled = noSelection;
  els.imageClear.disabled = noSelection || !targetTopics().some((target) => target.image);

  Array.from(els.colorSwatches.children).forEach((swatch, index) => {
    const color = palette[index];
    swatch.classList.toggle("is-active", color.fill === topic.fill && color.stroke === topic.stroke);
  });

  // The per-branch side toggle only matters for the balanced map.
  els.sideControl.querySelectorAll("button").forEach((button) => {
    button.disabled = topic.id === state.rootId || state.structure !== "map";
  });
  ignoreInspectorEvents = false;
}

function setActiveSegment(container, key, value) {
  container.querySelectorAll("button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset[key] === value);
  });
}

function commitMutation(mutator, options = {}) {
  const before = serializeForHistory();
  mutator();
  normalizeState(state);
  if (JSON.stringify(before) !== JSON.stringify(serializeForHistory())) {
    historyBack.push(before);
    historyForward = [];
  }
  if (options.layout !== false) {
    measureAllTopics();
  }
  render();
}

function mutateSelectedDraft(mutator) {
  if (ignoreInspectorEvents) return;
  const topic = selectedTopic();
  mutator(topic);
  render();
}

function beginInspectorEdit() {
  if (pendingInspectorSnapshot || ignoreInspectorEvents) return;
  pendingInspectorSnapshot = serializeForHistory();
}

function finishInspectorEdit() {
  if (!pendingInspectorSnapshot) return;
  const after = serializeForHistory();
  if (JSON.stringify(pendingInspectorSnapshot) !== JSON.stringify(after)) {
    historyBack.push(pendingInspectorSnapshot);
    historyForward = [];
  }
  pendingInspectorSnapshot = null;
  render();
}

function serializeForHistory() {
  return deepClone({
    title: state.title,
    rootId: state.rootId,
    selectedId: state.selectedId,
    lineStyle: state.lineStyle,
    structure: state.structure,
    sketch: state.sketch,
    theme: state.theme,
    relationships: state.relationships,
    topics: state.topics,
  });
}

function restoreFromHistory(snapshot) {
  state = {
    ...state,
    ...deepClone(snapshot),
    viewport: state.viewport,
  };
  normalizeState(state);
  selectedIds = new Set([state.selectedId]);
  render();
}

function undo() {
  if (!historyBack.length) return;
  historyForward.push(serializeForHistory());
  restoreFromHistory(historyBack.pop());
}

function redo() {
  if (!historyForward.length) return;
  historyBack.push(serializeForHistory());
  restoreFromHistory(historyForward.pop());
}

function newMap() {
  if (!window.confirm("建立新的心智圖？目前內容會保存在瀏覽器暫存與匯出檔中。")) return;
  commitMutation(() => {
    const fresh = deepClone(sampleMap);
    fresh.topics.root.text = "中心主題";
    fresh.topics.root.children = [];
    Object.keys(fresh.topics).forEach((id) => {
      if (id !== fresh.rootId) delete fresh.topics[id];
    });
    state = fresh;
  });
  fitToScreen();
}

function addChild() {
  const parent = selectedTopic();
  commitMutation(() => {
    const id = createId();
    const childCount = parent.children.length;
    const parentIsRoot = parent.parentId == null;
    const side = parentIsRoot
      ? childCount % 2 === 0
        ? "right"
        : "left"
      : parent.side === "left"
        ? "left"
        : "right";
    const color = palette[(childCount + Object.keys(state.topics).length) % palette.length];
    const child = {
      id,
      text: "新主題",
      parentId: parent.id,
      children: [],
      side,
      x: parent.x + (side === "left" ? -240 : 240),
      y: parent.y + childCount * 56,
      width: 118,
      height: 42,
      fill: parentIsRoot ? color.fill : "#ffffff",
      stroke: parentIsRoot ? color.stroke : "#475569",
      shape: parentIsRoot ? "round" : "capsule",
      fontSize: parentIsRoot ? 16 : 15,
      collapsed: false,
      notes: "",
    };
    state.topics[id] = child;
    parent.children.push(id);
    parent.collapsed = false;
    state.selectedId = id;
    layoutMindMap({ force: true });
  });
  requestAnimationFrame(() => beginInlineEdit(state.selectedId));
}

function addSibling() {
  const topic = selectedTopic();
  if (!topic.parentId) {
    addChild();
    return;
  }
  commitMutation(() => {
    const parent = state.topics[topic.parentId];
    const id = createId();
    const index = parent.children.indexOf(topic.id);
    const sibling = {
      ...deepClone(topic),
      id,
      text: "新主題",
      parentId: parent.id,
      children: [],
      x: topic.x,
      y: topic.y + 58,
      notes: "",
      collapsed: false,
    };
    state.topics[id] = sibling;
    parent.children.splice(index + 1, 0, id);
    state.selectedId = id;
    layoutMindMap({ force: true });
  });
  requestAnimationFrame(() => beginInlineEdit(state.selectedId));
}

function deleteSelected() {
  const ids = [...selectedIds].filter((id) => id !== state.rootId && state.topics[id]);
  if (!ids.length) return;
  const fallbackParent = state.topics[ids[0]].parentId || state.rootId;
  commitMutation(() => {
    const removed = new Set();
    ids.forEach((id) => {
      if (state.topics[id]) getSubtreeIds(id).forEach((descendantId) => removed.add(descendantId));
    });
    ids.forEach((id) => {
      const topic = state.topics[id];
      if (!topic) return;
      const parent = state.topics[topic.parentId];
      if (parent) parent.children = parent.children.filter((childId) => childId !== id);
      removeSubtree(id);
    });
    state.relationships = state.relationships.filter(
      (relationship) => !removed.has(relationship.fromId) && !removed.has(relationship.toId),
    );
    state.selectedId = state.topics[fallbackParent] ? fallbackParent : state.rootId;
    selectedIds = new Set([state.selectedId]);
    layoutMindMap({ force: true });
  });
}

function toggleCollapse() {
  const topic = selectedTopic();
  if (!topic.children.length) return;
  commitMutation(() => {
    topic.collapsed = !topic.collapsed;
    layoutMindMap({ force: true });
  });
}

function startRelationship() {
  pendingRelationshipFromId = state.selectedId;
  render();
}

function handleRelationshipTarget(targetId) {
  const sourceId = pendingRelationshipFromId;
  pendingRelationshipFromId = null;
  if (!sourceId || sourceId === targetId || !state.topics[sourceId] || !state.topics[targetId]) {
    selectTopic(targetId);
    return;
  }
  commitMutation(
    () => {
      toggleRelationship(sourceId, targetId);
      state.selectedId = targetId;
    },
    { layout: false },
  );
}

function toggleRelationship(fromId, toId) {
  const index = state.relationships.findIndex((relationship) => {
    return (
      (relationship.fromId === fromId && relationship.toId === toId) ||
      (relationship.fromId === toId && relationship.toId === fromId)
    );
  });
  if (index >= 0) {
    state.relationships.splice(index, 1);
    return;
  }
  state.relationships.push({
    id: createId(),
    fromId,
    toId,
    label: "",
    stroke: "#6965db",
  });
}

function toggleBoundary() {
  commitMutation(() => {
    selectedTopic().boundary = !selectedTopic().boundary;
  });
}

function cycleMarker() {
  commitMutation(() => {
    const topic = selectedTopic();
    const index = markerOrder.indexOf(topic.marker || "none");
    topic.marker = markerOrder[(index + 1) % markerOrder.length];
  });
}

function currentTheme() {
  return THEMES.find((theme) => theme.id === state.theme) || THEMES[0];
}

// Recolour every topic by depth (root / level-1 branch / deeper leaf) and set the canvas tint.
function applyTheme(themeId) {
  const theme = THEMES.find((entry) => entry.id === themeId) || THEMES[0];
  commitMutation(() => {
    state.theme = theme.id;
    getRootIds().forEach((rootId) => {
      const root = state.topics[rootId];
      root.fill = theme.root.fill;
      root.stroke = theme.root.stroke;
      root.children.forEach((childId, index) => {
        paintBranch(childId, theme.branches[index % theme.branches.length], theme, true);
      });
    });
  });
}

function paintBranch(id, branch, theme, isFirstLevel) {
  const topic = state.topics[id];
  if (!topic) return;
  const color = isFirstLevel ? branch : theme.leaf;
  topic.fill = color.fill;
  topic.stroke = color.stroke;
  topic.children.forEach((childId) => paintBranch(childId, branch, theme, false));
}

function exportMap() {
  const data = JSON.stringify(state, null, 2);
  downloadBlob(new Blob([data], { type: "application/json" }), exportFileName("json"));
}

function toggleExportMenu() {
  if (els.exportMenu.hidden) openExportMenu();
  else closeExportMenu();
}

function openExportMenu() {
  els.exportScope.textContent = selectedIds.size
    ? `匯出選取的 ${selectedIds.size} 個主題`
    : "匯出整張圖";
  els.exportMenu.hidden = false;
}

function closeExportMenu() {
  els.exportMenu.hidden = true;
}

// Export the current selection (with any collapsed descendants), or the whole map.
function exportTargetIds() {
  if (!selectedIds.size) return getVisibleIds();
  const ids = new Set();
  selectedIds.forEach((id) => getVisibleSubtreeIds(id).forEach((descendantId) => ids.add(descendantId)));
  return [...ids];
}

function exportImage(format, ids = exportTargetIds()) {
  if (!ids.length) return;
  const { svg, width, height } = buildExportSvg(ids);
  const source = `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(svg)}`;
  if (format === "svg") {
    downloadBlob(new Blob([source], { type: "image/svg+xml;charset=utf-8" }), exportFileName("svg"));
    return;
  }
  const svgUrl = URL.createObjectURL(new Blob([source], { type: "image/svg+xml;charset=utf-8" }));
  const image = new Image();
  image.onload = () => {
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);
    ctx.drawImage(image, 0, 0);
    URL.revokeObjectURL(svgUrl);
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, exportFileName("png"));
    }, "image/png");
  };
  image.onerror = () => {
    URL.revokeObjectURL(svgUrl);
    window.alert("匯出 PNG 失敗。");
  };
  image.src = svgUrl;
}

function buildExportSvg(ids) {
  const visible = new Set(ids);
  const bounds = getBoundsForIds(ids, 44);
  const width = Math.max(1, bounds.right - bounds.left);
  const height = Math.max(1, bounds.bottom - bounds.top);
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("xmlns", SVG_NS);
  svg.setAttribute("width", String(round(width)));
  svg.setAttribute("height", String(round(height)));
  svg.setAttribute("viewBox", `${round(bounds.left)} ${round(bounds.top)} ${round(width)} ${round(height)}`);

  const background = document.createElementNS(SVG_NS, "rect");
  background.setAttribute("x", String(round(bounds.left)));
  background.setAttribute("y", String(round(bounds.top)));
  background.setAttribute("width", String(round(width)));
  background.setAttribute("height", String(round(height)));
  background.setAttribute("fill", "#ffffff");
  svg.appendChild(background);

  ids.forEach((id) => {
    if (state.topics[id].boundary) sketchBoundary(id, visible).forEach((node) => svg.appendChild(node));
  });
  ids.forEach((id) => {
    const topic = state.topics[id];
    if (topic.parentId && visible.has(topic.parentId)) {
      sketchLink(state.topics[topic.parentId], topic).forEach((node) => svg.appendChild(node));
    }
  });
  state.relationships.forEach((relationship) => {
    if (visible.has(relationship.fromId) && visible.has(relationship.toId)) {
      sketchRelationship(relationship).forEach((node) => svg.appendChild(node));
    }
  });
  ids.forEach((id) => svg.appendChild(topicForExport(id)));
  return { svg, width, height };
}

function topicForExport(id) {
  const topic = state.topics[id];
  const group = document.createElementNS(SVG_NS, "g");
  group.setAttribute(
    "transform",
    `translate(${round(topic.x - topic.width / 2)}, ${round(topic.y - topic.height / 2)})`,
  );
  sketchTopic(topic).forEach((node) => group.appendChild(node));

  const imageH = topic.image ? topic.imageDisplayH || 0 : 0;
  const tagsH = topic.tags && topic.tags.length ? 22 : 0;
  const imageBottom = imageH ? 8 + imageH : 0;

  if (topic.image) {
    const contentWidth = topic.width - 32;
    const image = document.createElementNS(SVG_NS, "image");
    image.setAttribute("x", String(round((topic.width - contentWidth) / 2)));
    image.setAttribute("y", "8");
    image.setAttribute("width", String(round(contentWidth)));
    image.setAttribute("height", String(round(imageH)));
    image.setAttribute("preserveAspectRatio", "xMidYMid meet");
    image.setAttribute("href", topic.image);
    image.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", topic.image);
    group.appendChild(image);
  }

  const lines = String(topic.text).split(/\n/g);
  const lineHeight = topic.fontSize * 1.28;
  const textCenterY = (imageBottom + (topic.height - tagsH)) / 2;
  const isRootNode = topic.parentId == null;
  const isFirstLevel = !isRootNode && state.topics[topic.parentId]?.parentId == null;
  const text = document.createElementNS(SVG_NS, "text");
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("dominant-baseline", "central");
  text.setAttribute("font-family", EXPORT_FONT);
  text.setAttribute("font-size", String(topic.fontSize));
  text.setAttribute("fill", topic.textColor || "#0f172a");
  if (topic.italic) text.setAttribute("font-style", "italic");
  text.setAttribute("font-weight", topic.bold ? "800" : isRootNode ? "700" : isFirstLevel ? "650" : "550");
  lines.forEach((line, index) => {
    const tspan = document.createElementNS(SVG_NS, "tspan");
    tspan.setAttribute("x", String(round(topic.width / 2)));
    tspan.setAttribute(
      "y",
      String(round(textCenterY + (index - (lines.length - 1) / 2) * lineHeight)),
    );
    tspan.textContent = line;
    text.appendChild(tspan);
  });
  group.appendChild(text);

  if (tagsH) {
    const tagFont = 11;
    const gap = 4;
    const chipH = 18;
    const widths = topic.tags.map((tag) => Math.ceil(displayLength(tag) * tagFont * 0.62 + 16));
    const totalW = widths.reduce((sum, w) => sum + w, 0) + gap * (topic.tags.length - 1);
    let cx = topic.width / 2 - totalW / 2;
    const chipY = topic.height - tagsH - 1;
    topic.tags.forEach((tag, index) => {
      const w = widths[index];
      const chip = document.createElementNS(SVG_NS, "rect");
      chip.setAttribute("x", String(round(cx)));
      chip.setAttribute("y", String(round(chipY)));
      chip.setAttribute("width", String(round(w)));
      chip.setAttribute("height", String(chipH));
      chip.setAttribute("rx", "9");
      chip.setAttribute("fill", "rgba(15, 23, 42, 0.07)");
      group.appendChild(chip);
      const chipText = document.createElementNS(SVG_NS, "text");
      chipText.setAttribute("x", String(round(cx + w / 2)));
      chipText.setAttribute("y", String(round(chipY + chipH / 2)));
      chipText.setAttribute("text-anchor", "middle");
      chipText.setAttribute("dominant-baseline", "central");
      chipText.setAttribute("font-family", EXPORT_FONT);
      chipText.setAttribute("font-size", String(tagFont));
      chipText.setAttribute("fill", "#475569");
      chipText.textContent = tag;
      group.appendChild(chipText);
      cx += w + gap;
    });
  }

  const marker = markerOptions.find((option) => option.id === topic.marker);
  if (marker && marker.glyph) group.appendChild(markerForExport(topic, marker));
  return group;
}

function markerForExport(topic, marker) {
  const group = document.createElementNS(SVG_NS, "g");
  const cx = topic.width - 6;
  const cy = -2;
  const circle = document.createElementNS(SVG_NS, "circle");
  circle.setAttribute("cx", String(round(cx)));
  circle.setAttribute("cy", String(round(cy)));
  circle.setAttribute("r", "10");
  circle.setAttribute("fill", markerColor(marker.id));
  circle.setAttribute("stroke", "#ffffff");
  circle.setAttribute("stroke-width", "2");
  group.appendChild(circle);
  const glyph = document.createElementNS(SVG_NS, "text");
  glyph.setAttribute("x", String(round(cx)));
  glyph.setAttribute("y", String(round(cy)));
  glyph.setAttribute("text-anchor", "middle");
  glyph.setAttribute("dominant-baseline", "central");
  glyph.setAttribute("font-family", EXPORT_FONT);
  glyph.setAttribute("font-size", "10");
  glyph.setAttribute("font-weight", "800");
  glyph.setAttribute("fill", "#ffffff");
  glyph.textContent = marker.glyph;
  group.appendChild(glyph);
  return group;
}

function markerColor(id) {
  if (id === "done") return "#2b8a3e";
  if (id === "star") return "#ec8b14";
  if (id === "progress-half") return "#1971c2";
  return "#6965db";
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportFileName(extension) {
  const base = (state.title || "mindmap").replace(/\.(mind|json)$/i, "") || "mindmap";
  return `${base}.${extension}`;
}

function onContextMenu(event) {
  event.preventDefault();
  closeExportMenu();
  const topicNode = event.target.closest(".topic");
  let items;
  if (topicNode) {
    const id = topicNode.dataset.id;
    if (!selectedIds.has(id)) selectTopic(id);
    const topic = state.topics[id];
    const isRoot = id === state.rootId;
    const many = selectedIds.size > 1;
    items = [
      { label: "新增子主題", shortcut: "Tab", action: addChild },
      { label: "新增同層主題", shortcut: "Enter", action: addSibling },
      { label: topic.collapsed ? "展開分支" : "收合分支", action: toggleCollapse, disabled: !topic.children.length },
      { sep: true },
      { label: "新增 / 移除關聯線", action: startRelationship },
      { label: topic.boundary ? "移除外框" : "加上外框", action: toggleBoundary },
      { sep: true },
      { label: many ? `匯出這 ${selectedIds.size} 個為 PNG` : "匯出此主題為 PNG", action: () => exportImage("png") },
      { label: many ? `匯出這 ${selectedIds.size} 個為 SVG` : "匯出此主題為 SVG", action: () => exportImage("svg") },
      { sep: true },
      { label: "刪除", shortcut: "Del", action: deleteSelected, danger: true, disabled: isRoot && !many },
    ];
  } else {
    items = [
      { label: "全選", action: selectAllTopics },
      { label: "適合畫面", action: fitToScreen },
      { sep: true },
      { label: "匯出整張圖為 PNG", action: () => exportImage("png", getVisibleIds()) },
      { label: "匯出整張圖為 SVG", action: () => exportImage("svg", getVisibleIds()) },
    ];
  }
  openContextMenu(event.clientX, event.clientY, items);
}

function openContextMenu(x, y, items) {
  const menu = els.contextMenu;
  menu.replaceChildren(
    ...items.map((item) => {
      if (item.sep) {
        const separator = document.createElement("div");
        separator.className = "menu-sep";
        return separator;
      }
      const button = document.createElement("button");
      button.type = "button";
      if (item.danger) button.className = "danger";
      button.disabled = Boolean(item.disabled);
      button.innerHTML = `<span>${escapeHtml(item.label)}</span>${
        item.shortcut ? `<span class="shortcut">${escapeHtml(item.shortcut)}</span>` : ""
      }`;
      if (!item.disabled) {
        button.addEventListener("click", () => {
          closeContextMenu();
          item.action();
        });
      }
      return button;
    }),
  );
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
  menu.hidden = false;
  // Keep the menu inside the viewport.
  const rect = menu.getBoundingClientRect();
  const maxX = window.innerWidth - rect.width - 8;
  const maxY = window.innerHeight - rect.height - 8;
  menu.style.left = `${Math.max(8, Math.min(x, maxX))}px`;
  menu.style.top = `${Math.max(8, Math.min(y, maxY))}px`;
}

function closeContextMenu() {
  els.contextMenu.hidden = true;
}

function openLightbox(src) {
  els.lightbox.querySelector("img").src = src;
  els.lightbox.hidden = false;
}

function closeLightbox() {
  els.lightbox.hidden = true;
  els.lightbox.querySelector("img").removeAttribute("src");
}

function openSearch() {
  els.searchBar.hidden = false;
  els.searchInput.focus();
  els.searchInput.select();
  runSearch(els.searchInput.value);
}

function closeSearch() {
  els.searchBar.hidden = true;
  searchMatches = [];
  searchActive = -1;
  els.canvas.focus();
  render();
}

function runSearch(query) {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    searchMatches = [];
    searchActive = -1;
    updateSearchCount();
    render();
    return;
  }
  searchMatches = allTopicIdsInOrder().filter((id) => {
    const topic = state.topics[id];
    const haystack = `${topic.text} ${(topic.tags || []).join(" ")} ${topic.notes || ""}`.toLowerCase();
    return haystack.includes(needle);
  });
  if (searchMatches.length) {
    focusMatch(0);
  } else {
    searchActive = -1;
    updateSearchCount();
    render();
  }
}

function focusMatch(index) {
  if (!searchMatches.length) return;
  searchActive = (index + searchMatches.length) % searchMatches.length;
  const id = searchMatches[searchActive];
  if (expandAncestors(id)) layoutMindMap({ force: false });
  state.selectedId = id;
  selectedIds = new Set([id]);
  updateSearchCount();
  render();
  centerSelected();
}

function stepSearch(delta) {
  if (!searchMatches.length) return;
  focusMatch(searchActive + delta);
}

function updateSearchCount() {
  els.searchCount.textContent = searchMatches.length
    ? `${searchActive + 1}/${searchMatches.length}`
    : "0/0";
}

function expandAncestors(id) {
  let changed = false;
  let parentId = state.topics[id]?.parentId;
  while (parentId) {
    const parent = state.topics[parentId];
    if (parent && parent.collapsed) {
      parent.collapsed = false;
      changed = true;
    }
    parentId = parent?.parentId;
  }
  return changed;
}

function allTopicIdsInOrder() {
  const ids = [];
  const walk = (id) => {
    const topic = state.topics[id];
    if (!topic) return;
    ids.push(id);
    topic.children.forEach(walk);
  };
  getRootIds().forEach(walk);
  return ids;
}

function selectAllTopics() {
  setSelection(new Set(getVisibleIds()));
}

// In-app copy/paste of topic subtrees (Ctrl+C / Ctrl+V).
function copySelection() {
  const tops = topLevelSelected();
  if (!tops.length) return;
  const topics = {};
  tops.forEach((id) => {
    getSubtreeIds(id).forEach((descendantId) => {
      topics[descendantId] = deepClone(state.topics[descendantId]);
    });
  });
  clipboard = { tops, topics };
}

// Selected ids whose ancestors are not themselves selected (avoids copying a subtree twice).
function topLevelSelected() {
  const selected = new Set(selectedIds);
  return [...selected].filter((id) => {
    let parentId = state.topics[id]?.parentId;
    while (parentId) {
      if (selected.has(parentId)) return false;
      parentId = state.topics[parentId]?.parentId;
    }
    return true;
  });
}

function pasteClipboard() {
  if (!clipboard || !clipboard.tops.length) return;
  commitMutation(() => {
    const idMap = {};
    Object.keys(clipboard.topics).forEach((oldId) => {
      idMap[oldId] = createId();
    });
    const offset = 48;
    const newTops = [];
    Object.entries(clipboard.topics).forEach(([oldId, topic]) => {
      const clone = deepClone(topic);
      clone.id = idMap[oldId];
      clone.children = (topic.children || []).map((childId) => idMap[childId]).filter(Boolean);
      clone.x = (topic.x || 0) + offset;
      clone.y = (topic.y || 0) + offset;
      if (clipboard.tops.includes(oldId)) {
        clone.parentId = null;
        clone.side = "root";
        clone.manual = true;
        newTops.push(clone.id);
      } else {
        clone.parentId = idMap[topic.parentId] || null;
      }
      state.topics[clone.id] = clone;
    });
    state.selectedId = newTops[0];
    selectedIds = new Set(newTops);
    measureAllTopics();
    layoutMindMap({ force: false });
  });
}

function onImportFile() {
  const file = els.fileInput.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const imported = normalizeImportedState(JSON.parse(String(reader.result)));
      commitMutation(() => {
        state = imported;
        normalizeState(state);
        measureAllTopics();
        layoutMindMap();
      });
      fitToScreen();
    } catch {
      window.alert("匯入失敗，請確認檔案是有效 JSON。");
    } finally {
      els.fileInput.value = "";
    }
  });
  reader.readAsText(file);
}

function removeSubtree(id) {
  const topic = state.topics[id];
  topic.children.forEach(removeSubtree);
  delete state.topics[id];
}

function selectedTopic() {
  return state.topics[state.selectedId] || state.topics[state.rootId];
}

// Topics a format change applies to: the selection, or ALL topics when nothing is selected.
function targetTopics() {
  const ids = selectedIds.size ? [...selectedIds] : Object.keys(state.topics);
  return ids.map((id) => state.topics[id]).filter(Boolean);
}

// Read an image file, downscale to keep localStorage small, store as a data URL on the selection.
function setTopicImage(file) {
  if (!selectedIds.size) return;
  const reader = new FileReader();
  reader.onload = () => {
    const image = new Image();
    image.onload = () => {
      const maxSide = 460;
      const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
      const w = Math.max(1, Math.round(image.naturalWidth * scale));
      const h = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(image, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
      commitMutation(() => {
        targetTopics().forEach((topic) => {
          topic.image = dataUrl;
          topic.imageW = w;
          topic.imageH = h;
          measureTopic(topic);
        });
        layoutMindMap();
      });
    };
    image.onerror = () => window.alert("圖片載入失敗。");
    image.src = String(reader.result);
  };
  reader.readAsDataURL(file);
}

function selectTopic(id) {
  if (!state.topics[id]) return;
  state.selectedId = id;
  selectedIds = new Set([id]);
  render();
}

// Keep the multi-selection set valid: never empty, always contains the primary.
function syncSelection() {
  selectedIds = new Set([...selectedIds].filter((id) => state.topics[id]));
  if (selectedIds.size && !selectedIds.has(state.selectedId)) {
    state.selectedId = selectedIds.values().next().value;
  }
}

function setSelection(ids) {
  const next = new Set([...ids].filter((id) => state.topics[id]));
  if (next.size && !next.has(state.selectedId)) {
    state.selectedId = next.values().next().value;
  }
  selectedIds = next;
  render();
}

function toggleInSelection(id) {
  if (!state.topics[id]) return;
  const next = new Set(selectedIds);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  if (!next.size) next.add(id);
  state.selectedId = next.has(id) ? id : next.values().next().value;
  selectedIds = next;
  render();
}

function setBranchSide(id, side) {
  const topic = state.topics[id];
  if (!topic || id === state.rootId) return;
  topic.side = side;
  topic.manual = false;
  topic.children.forEach((childId) => setBranchSide(childId, side));
}

function reparentTopic(id, parentId) {
  const topic = state.topics[id];
  const nextParent = state.topics[parentId];
  if (!topic || !nextParent || id === state.rootId || id === parentId) return false;
  if (getSubtreeIds(id).includes(parentId)) return false;
  if (topic.parentId === parentId) return false;

  const previousParent = state.topics[topic.parentId];
  if (previousParent) {
    previousParent.children = previousParent.children.filter((childId) => childId !== id);
  }

  topic.parentId = parentId;
  nextParent.children.push(id);
  nextParent.collapsed = false;

  const side =
    nextParent.parentId == null
      ? topic.x < nextParent.x
        ? "left"
        : "right"
      : nextParent.side === "left"
        ? "left"
        : "right";
  setBranchSide(id, side);
  topic.manual = false;
  return true;
}

// Finished single-node drag: drop onto a different-parent node re-parents it;
// dropping on a sibling or in the gap reorders it among its siblings.
function applyDrop(id, event) {
  const topic = state.topics[id];
  if (!topic || topic.parentId == null) return; // floating roots keep their free position
  const overId = getDropTargetFromPoint(event.clientX, event.clientY, getSubtreeIds(id));
  const over = overId ? state.topics[overId] : null;
  if (!(over && over.parentId !== topic.parentId && reparentTopic(id, overId))) {
    reorderSiblingsByPosition(topic.parentId);
  }
  topic.manual = false;
  layoutMindMap({ force: true });
}

function reorderSiblingsByPosition(parentId) {
  const parent = state.topics[parentId];
  if (!parent) return;
  const axis = state.structure === "down" ? "x" : "y";
  parent.children.sort((a, b) => (state.topics[a]?.[axis] ?? 0) - (state.topics[b]?.[axis] ?? 0));
}

// Show a line between siblings marking where a reordered node will land.
function updateDropIndicator(id) {
  const indicator = els.dropIndicator;
  const topic = state.topics[id];
  // Re-parent (dropTargetId set) or a free-floating root → no reorder line.
  if (!topic || topic.parentId == null || dropTargetId) {
    indicator.hidden = true;
    return;
  }
  const parent = state.topics[topic.parentId];
  const down = state.structure === "down";
  const axis = down ? "x" : "y";
  const siblings = parent.children
    .filter((childId) => childId !== id && state.topics[childId]?.side === topic.side)
    .map((childId) => state.topics[childId])
    .sort((a, b) => a[axis] - b[axis]);
  if (!siblings.length) {
    indicator.hidden = true;
    return;
  }
  const insertIndex = siblings.filter((sibling) => sibling[axis] < topic[axis]).length;
  const ref = siblings[Math.min(insertIndex, siblings.length - 1)];
  let gap;
  if (insertIndex === 0) gap = siblings[0][axis] - 30;
  else if (insertIndex >= siblings.length) gap = siblings[siblings.length - 1][axis] + 30;
  else gap = (siblings[insertIndex - 1][axis] + siblings[insertIndex][axis]) / 2;

  if (down) {
    indicator.style.transform = `translate(${round(gap - 1.5)}px, ${round(ref.y - ref.height / 2 - 6)}px)`;
    indicator.style.width = "3px";
    indicator.style.height = `${round(ref.height + 12)}px`;
  } else {
    indicator.style.transform = `translate(${round(ref.x - ref.width / 2 - 6)}px, ${round(gap - 1.5)}px)`;
    indicator.style.width = `${round(ref.width + 12)}px`;
    indicator.style.height = "3px";
  }
  indicator.hidden = false;
}

function countDescendants(id) {
  const topic = state.topics[id];
  return topic.children.reduce((total, childId) => total + 1 + countDescendants(childId), 0);
}

// Root/floating topics are those with no parent; the primary centre is state.rootId.
function getRootIds() {
  const roots = Object.values(state.topics)
    .filter((topic) => topic.parentId == null)
    .map((topic) => topic.id);
  // Keep the primary centre first so fit/centre logic stays stable.
  return [state.rootId, ...roots.filter((id) => id !== state.rootId)];
}

function getVisibleIds() {
  const ids = [];
  const walk = (id) => {
    const topic = state.topics[id];
    if (!topic) return;
    ids.push(id);
    if (!topic.collapsed) topic.children.forEach(walk);
  };
  getRootIds().forEach(walk);
  return ids;
}

function getVisibleSubtreeIds(id) {
  const topic = state.topics[id];
  if (!topic) return [];
  if (topic.collapsed) return [id];
  return [id, ...topic.children.flatMap(getVisibleSubtreeIds)];
}

function getBoundsForIds(ids, padding = 0) {
  const boxes = ids.map((id) => {
    const topic = state.topics[id];
    return {
      left: topic.x - topic.width / 2,
      right: topic.x + topic.width / 2,
      top: topic.y - topic.height / 2,
      bottom: topic.y + topic.height / 2,
    };
  });
  return {
    left: Math.min(...boxes.map((box) => box.left)) - padding,
    right: Math.max(...boxes.map((box) => box.right)) + padding,
    top: Math.min(...boxes.map((box) => box.top)) - padding,
    bottom: Math.max(...boxes.map((box) => box.bottom)) + padding,
  };
}

function measureAllTopics() {
  Object.values(state.topics).forEach(measureTopic);
}

function measureTopic(topic) {
  const isRootNode = topic.parentId == null;
  const hasImage = Boolean(topic.image) && topic.imageW > 0 && topic.imageH > 0;
  const text = topic.text || " ";
  const lines = text.split(/\n/g);
  const longest = lines.reduce((max, line) => Math.max(max, displayLength(line)), 0);
  const maxWidth = hasImage ? 280 : isRootNode ? 270 : 230;
  const minWidth = hasImage ? 180 : isRootNode ? 164 : 104;
  const charWidth = topic.fontSize * 0.62;
  const naturalWidth = Math.ceil(longest * charWidth + 36);
  topic.width = clamp(naturalWidth, minWidth, maxWidth);
  const wrappedLines = lines.reduce((total, line) => {
    const charsPerLine = Math.max(6, Math.floor((topic.width - 34) / charWidth));
    return total + Math.max(1, Math.ceil(displayLength(line) / charsPerLine));
  }, 0);
  let imageBand = 0;
  if (hasImage) {
    const contentWidth = topic.width - 32;
    topic.imageDisplayH = Math.min(150, Math.round(contentWidth * (topic.imageH / topic.imageW)));
    imageBand = topic.imageDisplayH + 8;
  } else {
    topic.imageDisplayH = 0;
  }
  const tagsBand = topic.tags && topic.tags.length ? 24 : 0;
  const textHeight = Math.ceil(wrappedLines * topic.fontSize * 1.28 + 20);
  topic.height = Math.max(isRootNode ? 58 : 40, textHeight + imageBand + tagsBand);
}

function layoutMindMap(options = {}) {
  getRootIds().forEach((rootId) => {
    const root = state.topics[rootId];
    if (!root) return;
    root.x = root.x || 0;
    root.y = root.y || 0;
    layoutTree(rootId, options.force);
  });
}

// Lay out a single root's subtree around its own position, per the chosen structure.
function layoutTree(rootId, force) {
  const root = state.topics[rootId];
  if (state.structure === "down") {
    arrangeDown(rootId, force);
    return;
  }
  if (state.structure === "right") {
    root.children.forEach((childId) => {
      if (state.topics[childId]) state.topics[childId].side = "right";
    });
    arrangeRootSide(rootId, "right", force);
    return;
  }

  // Balanced map ("發散"): split children to both sides of the centre.
  root.children.forEach((childId, index) => {
    const child = state.topics[childId];
    child.side = child.side === "left" || child.side === "right" ? child.side : index % 2 ? "left" : "right";
  });
  arrangeRootSide(rootId, "left", force);
  arrangeRootSide(rootId, "right", force);
}

// Org-chart layout: children sit below their parent, subtrees packed by width.
function arrangeDown(parentId, force) {
  const parent = state.topics[parentId];
  if (!parent || parent.collapsed || !parent.children.length) return;
  const total =
    parent.children.reduce((sum, id) => sum + subtreeWidth(id), 0) +
    DOWN_SIBLING_GAP * (parent.children.length - 1);
  let cursor = parent.x - total / 2;
  parent.children.forEach((childId) => {
    const child = state.topics[childId];
    const width = subtreeWidth(childId);
    child.side = "down";
    if (force || !child.manual) {
      child.x = cursor + width / 2;
      child.y = parent.y + parent.height / 2 + DOWN_LEVEL_GAP + child.height / 2;
      child.manual = false;
    }
    arrangeDown(childId, force);
    cursor += width + DOWN_SIBLING_GAP;
  });
}

function subtreeWidth(id) {
  const topic = state.topics[id];
  if (!topic || topic.collapsed || !topic.children.length) return topic?.width || 120;
  const childrenWidth =
    topic.children.reduce((sum, childId) => sum + subtreeWidth(childId), 0) +
    DOWN_SIBLING_GAP * (topic.children.length - 1);
  return Math.max(topic.width, childrenWidth);
}

function arrangeRootSide(rootId, side, force) {
  const root = state.topics[rootId];
  const children = root.children.filter((id) => state.topics[id]?.side === side);
  if (!children.length) return;
  const gap = ROOT_CHILD_GAP;
  const total = children.reduce((sum, id) => sum + subtreeHeight(id), 0) + gap * (children.length - 1);
  let cursor = root.y - total / 2;
  const direction = side === "left" ? -1 : 1;

  children.forEach((childId) => {
    const child = state.topics[childId];
    const height = subtreeHeight(childId);
    if (force || !child.manual) {
      child.x = root.x + direction * (root.width / 2 + HORIZONTAL_GAP + child.width / 2);
      child.y = cursor + height / 2;
      child.manual = false;
    }
    arrangeChildren(childId, side, force);
    cursor += height + gap;
  });
}

function arrangeChildren(parentId, side, force) {
  const parent = state.topics[parentId];
  if (!parent || parent.collapsed || !parent.children.length) return;
  const direction = side === "left" ? -1 : 1;
  const total =
    parent.children.reduce((sum, id) => sum + subtreeHeight(id), 0) +
    VERTICAL_GAP * (parent.children.length - 1);
  let cursor = parent.y - total / 2;

  parent.children.forEach((childId) => {
    const child = state.topics[childId];
    child.side = side;
    const height = subtreeHeight(childId);
    if (force || !child.manual) {
      child.x = parent.x + direction * (parent.width / 2 + HORIZONTAL_GAP + child.width / 2);
      child.y = cursor + height / 2;
      child.manual = false;
    }
    arrangeChildren(childId, side, force);
    cursor += height + VERTICAL_GAP;
  });
}

function subtreeHeight(id) {
  const topic = state.topics[id];
  if (!topic || topic.collapsed || !topic.children.length) return topic?.height || 44;
  const childrenHeight =
    topic.children.reduce((sum, childId) => sum + subtreeHeight(childId), 0) +
    VERTICAL_GAP * (topic.children.length - 1);
  return Math.max(topic.height, childrenHeight);
}

function sketchTopic(topic) {
  const seed = seedFor(`${topic.id}:shape`);
  if (topic.shape === "underline") {
    return [
      roughSvg.path(
        underlinePath(topic.width, topic.height),
        roughOptions({ stroke: topic.stroke, strokeWidth: 2, roughness: 1.8, seed }),
      ),
    ];
  }
  const radius = topic.shape === "capsule" ? topic.height / 2 : 12;
  return [
    roughSvg.path(
      roundedRectPath(topic.width, topic.height, radius),
      roughOptions({
        fill: topic.fill,
        fillStyle: "solid",
        stroke: topic.stroke,
        strokeWidth: 1.7,
        seed,
      }),
    ),
  ];
}

function sketchLink(parent, child) {
  let d;
  if (state.structure === "down") {
    const start = { x: parent.x, y: parent.y + parent.height / 2 - 2 };
    const end = { x: child.x, y: child.y - child.height / 2 + 2 };
    d = linkPathVertical(start, end);
  } else {
    const side = child.x >= parent.x ? 1 : -1;
    const start = { x: parent.x + side * (parent.width / 2 - 3), y: parent.y };
    const end = { x: child.x - side * (child.width / 2 - 3), y: child.y };
    d = linkPath(start, end, side);
  }
  const node = roughSvg.path(
    d,
    roughOptions({
      stroke: child.stroke || "#475569",
      strokeWidth: 2.2,
      roughness: 1.4,
      seed: seedFor(`${child.id}:link`),
    }),
  );
  node.setAttribute("class", "rough-link");
  return [node];
}

function linkPathVertical(start, end) {
  if (state.lineStyle === "elbow") {
    const midY = (start.y + end.y) / 2;
    return [
      `M ${round(start.x)} ${round(start.y)}`,
      `L ${round(start.x)} ${round(midY)}`,
      `L ${round(end.x)} ${round(midY)}`,
      `L ${round(end.x)} ${round(end.y)}`,
    ].join(" ");
  }
  const pull = Math.max(40, Math.abs(end.y - start.y) * 0.5);
  return [
    `M ${round(start.x)} ${round(start.y)}`,
    `C ${round(start.x)} ${round(start.y + pull)}`,
    `${round(end.x)} ${round(end.y - pull)}`,
    `${round(end.x)} ${round(end.y)}`,
  ].join(" ");
}

function sketchBoundary(topicId, visible) {
  const ids = getVisibleSubtreeIds(topicId).filter((id) => visible.has(id));
  if (!ids.length) return [];
  const bounds = getBoundsForIds(ids, 26);
  const radius = Math.min(26, (bounds.right - bounds.left) / 3, (bounds.bottom - bounds.top) / 3);
  const node = roughSvg.path(
    boundsRectPath(bounds, radius),
    roughOptions({
      fill: "rgba(105, 101, 219, 0.05)",
      fillStyle: "solid",
      stroke: "#6965db",
      strokeWidth: 1.6,
      strokeLineDash: [9, 7],
      roughness: 1.6,
      seed: seedFor(`${topicId}:boundary`),
    }),
  );
  node.setAttribute("class", "boundary-path");
  return [node];
}

function sketchRelationship(relationship) {
  const from = state.topics[relationship.fromId];
  const to = state.topics[relationship.toId];
  if (!from || !to) return [];
  const start = connectionAnchor(from, to);
  const end = connectionAnchor(to, from);
  const color = relationship.stroke || "#6965db";
  const seed = seedFor(relationship.id);

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.max(1, Math.hypot(dx, dy));
  const bend = clamp(distance * 0.18, 28, 90) * (hashString(relationship.id) % 2 ? 1 : -1);
  const px = (-dy / distance) * bend;
  const py = (dx / distance) * bend;
  const c1 = { x: start.x + dx * 0.35 + px, y: start.y + dy * 0.35 + py };
  const c2 = { x: start.x + dx * 0.65 + px, y: start.y + dy * 0.65 + py };
  const curve = `M ${round(start.x)} ${round(start.y)} C ${round(c1.x)} ${round(c1.y)} ${round(c2.x)} ${round(c2.y)} ${round(end.x)} ${round(end.y)}`;

  const angle = Math.atan2(end.y - c2.y, end.x - c2.x);
  const size = 12;
  const arrow = [
    `M ${round(end.x - Math.cos(angle - 0.5) * size)} ${round(end.y - Math.sin(angle - 0.5) * size)}`,
    `L ${round(end.x)} ${round(end.y)}`,
    `L ${round(end.x - Math.cos(angle + 0.5) * size)} ${round(end.y - Math.sin(angle + 0.5) * size)}`,
  ].join(" ");

  const lineNode = roughSvg.path(
    curve,
    roughOptions({ stroke: color, strokeWidth: 2, strokeLineDash: [8, 7], roughness: 1.4, seed }),
  );
  lineNode.setAttribute("class", "relationship-link");
  const arrowNode = roughSvg.path(
    arrow,
    roughOptions({ stroke: color, strokeWidth: 2, roughness: 1.1, seed: seed + 7 }),
  );
  arrowNode.setAttribute("class", "relationship-arrow");
  return [lineNode, arrowNode];
}

function connectionAnchor(source, target) {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    const side = dx >= 0 ? 1 : -1;
    return { x: source.x + side * (source.width / 2 + 5), y: source.y };
  }
  const side = dy >= 0 ? 1 : -1;
  return { x: source.x, y: source.y + side * (source.height / 2 + 5) };
}

function seedFor(value) {
  // rough.js expects a positive integer seed for deterministic output.
  return hashString(String(value)) % 2147483647;
}

function roughOptions(extra) {
  const options = {
    roughness: ROUGHNESS,
    bowing: BOWING,
    preserveVertices: true,
    ...extra,
  };
  if (!state.sketch) {
    // "一般" mode: clean, crisp strokes (no hand-drawn jitter).
    options.roughness = 0;
    options.bowing = 0;
    options.disableMultiStroke = true;
  }
  return options;
}

function roundedRectPath(width, height, radius) {
  const inset = 2.5;
  const left = inset;
  const top = inset;
  const right = width - inset;
  const bottom = height - inset;
  const r = Math.max(0, Math.min(radius, (right - left) / 2, (bottom - top) / 2));
  return [
    `M ${round(left + r)} ${round(top)}`,
    `L ${round(right - r)} ${round(top)}`,
    `Q ${round(right)} ${round(top)} ${round(right)} ${round(top + r)}`,
    `L ${round(right)} ${round(bottom - r)}`,
    `Q ${round(right)} ${round(bottom)} ${round(right - r)} ${round(bottom)}`,
    `L ${round(left + r)} ${round(bottom)}`,
    `Q ${round(left)} ${round(bottom)} ${round(left)} ${round(bottom - r)}`,
    `L ${round(left)} ${round(top + r)}`,
    `Q ${round(left)} ${round(top)} ${round(left + r)} ${round(top)}`,
    "Z",
  ].join(" ");
}

function boundsRectPath(bounds, radius) {
  const { left, top, right, bottom } = bounds;
  const r = Math.max(0, radius);
  return [
    `M ${round(left + r)} ${round(top)}`,
    `L ${round(right - r)} ${round(top)}`,
    `Q ${round(right)} ${round(top)} ${round(right)} ${round(top + r)}`,
    `L ${round(right)} ${round(bottom - r)}`,
    `Q ${round(right)} ${round(bottom)} ${round(right - r)} ${round(bottom)}`,
    `L ${round(left + r)} ${round(bottom)}`,
    `Q ${round(left)} ${round(bottom)} ${round(left)} ${round(bottom - r)}`,
    `L ${round(left)} ${round(top + r)}`,
    `Q ${round(left)} ${round(top)} ${round(left + r)} ${round(top)}`,
    "Z",
  ].join(" ");
}

function underlinePath(width, height) {
  const y = height - 7;
  return `M ${round(6)} ${round(y)} C ${round(width * 0.3)} ${round(y + 1.5)} ${round(width * 0.62)} ${round(y - 1.5)} ${round(width - 6)} ${round(y)}`;
}

function linkPath(start, end, side) {
  if (state.lineStyle === "elbow") {
    const midX = start.x + side * Math.max(36, Math.abs(end.x - start.x) * 0.48);
    const midY = (start.y + end.y) / 2;
    return [
      `M ${round(start.x)} ${round(start.y)}`,
      `L ${round(midX)} ${round(start.y)}`,
      `L ${round(midX)} ${round(end.y)}`,
      `L ${round(end.x)} ${round(end.y)}`,
    ].join(" ");
  }
  const distance = Math.abs(end.x - start.x);
  const pull = Math.max(56, distance * 0.52);
  return [
    `M ${round(start.x)} ${round(start.y)}`,
    `C ${round(start.x + side * pull)} ${round(start.y)}`,
    `${round(end.x - side * pull)} ${round(end.y)}`,
    `${round(end.x)} ${round(end.y)}`,
  ].join(" ");
}

function onTopicPointerDown(event) {
  if (event.button !== 0 || editingTopicId) return;
  if (isSpaceDown) {
    startPan(event);
    return;
  }
  event.stopPropagation();
  els.canvas.focus();

  const node = event.currentTarget;
  const id = node.dataset.id;
  if (pendingRelationshipFromId) return;

  // Clicking (no drag) an already-multi-selected node should narrow to just it.
  const wasMultiSelected = !event.shiftKey && selectedIds.has(id) && selectedIds.size > 1;
  const onImage = Boolean(event.target.closest(".topic-image"));

  // Selection happens on pointer-down so a drag uses the right set.
  if (event.shiftKey) {
    toggleInSelection(id);
    if (!selectedIds.has(id)) return;
  } else if (!selectedIds.has(id)) {
    selectTopic(id);
  }

  const dragIds = selectedIds.size > 1 && selectedIds.has(id) ? [...selectedIds] : [id];
  const multi = dragIds.length > 1;
  const affectedIds = [...new Set(dragIds.flatMap(getSubtreeIds))];
  const start = screenToWorld(event.clientX, event.clientY);
  const startPositions = Object.fromEntries(
    affectedIds.map((topicId) => {
      const topic = state.topics[topicId];
      return [topicId, { x: topic.x, y: topic.y }];
    }),
  );
  const snapshot = serializeForHistory();
  let moved = false;

  node.setPointerCapture(event.pointerId);
  els.canvas.classList.add("is-dragging");

  const move = (moveEvent) => {
    const point = screenToWorld(moveEvent.clientX, moveEvent.clientY);
    const dx = point.x - start.x;
    const dy = point.y - start.y;
    if (Math.abs(dx) + Math.abs(dy) < 1) return;
    moved = true;
    affectedIds.forEach((topicId) => {
      const topic = state.topics[topicId];
      topic.x = startPositions[topicId].x + dx;
      topic.y = startPositions[topicId].y + dy;
    });
    if (multi) {
      dragIds.forEach((dragId) => {
        if (dragId !== state.rootId) state.topics[dragId].manual = true;
      });
      dropTargetId = null;
      els.dropIndicator.hidden = true;
    } else {
      const topic = state.topics[id];
      const parent = topic.parentId ? state.topics[topic.parentId] : null;
      topic.manual = topic.parentId != null;
      if (parent && parent.parentId == null) {
        const side = topic.x < parent.x ? "left" : "right";
        setBranchSide(id, side);
        topic.manual = true;
      }
      const overId =
        id === state.rootId ? null : getDropTargetFromPoint(moveEvent.clientX, moveEvent.clientY, affectedIds);
      const over = overId ? state.topics[overId] : null;
      // Highlight only re-parent targets (a different parent); hovering a sibling means reorder.
      dropTargetId = over && over.parentId !== topic.parentId ? overId : null;
      updateDropIndicator(id);
    }
    render();
  };

  const up = (upEvent) => {
    dropTargetId = null;
    els.dropIndicator.hidden = true;
    node.releasePointerCapture(event.pointerId);
    node.removeEventListener("pointermove", move);
    node.removeEventListener("pointerup", up);
    node.removeEventListener("pointercancel", up);
    els.canvas.classList.remove("is-dragging");
    if (moved) {
      if (!multi) applyDrop(id, upEvent);
      historyBack.push(snapshot);
      historyForward = [];
      render();
    } else if (onImage && state.topics[id]?.image) {
      openLightbox(state.topics[id].image);
    } else if (wasMultiSelected) {
      selectTopic(id);
    }
  };

  node.addEventListener("pointermove", move);
  node.addEventListener("pointerup", up);
  node.addEventListener("pointercancel", up);
}

function getDropTargetFromPoint(clientX, clientY, blockedIds) {
  const blocked = new Set(blockedIds);
  const elements = document.elementsFromPoint(clientX, clientY);
  for (const element of elements) {
    const topicNode = element.closest?.(".topic");
    const id = topicNode?.dataset.id;
    if (id && !blocked.has(id)) return id;
  }
  return null;
}

function onCanvasPointerDown(event) {
  if (event.target.closest(".topic") || event.button !== 0) return;
  els.canvas.focus();
  if (pendingRelationshipFromId) {
    pendingRelationshipFromId = null;
    render();
    return;
  }
  if (isSpaceDown) {
    startPan(event);
    return;
  }
  startMarquee(event);
}

function startPan(event) {
  const start = { x: event.clientX, y: event.clientY };
  const initial = { ...state.viewport };
  els.canvas.setPointerCapture(event.pointerId);
  els.canvas.classList.add("is-panning");

  const move = (moveEvent) => {
    state.viewport.x = initial.x + moveEvent.clientX - start.x;
    state.viewport.y = initial.y + moveEvent.clientY - start.y;
    applyViewport();
  };

  const up = () => {
    els.canvas.releasePointerCapture(event.pointerId);
    els.canvas.removeEventListener("pointermove", move);
    els.canvas.removeEventListener("pointerup", up);
    els.canvas.removeEventListener("pointercancel", up);
    els.canvas.classList.remove("is-panning");
    scheduleSave();
  };

  els.canvas.addEventListener("pointermove", move);
  els.canvas.addEventListener("pointerup", up);
  els.canvas.addEventListener("pointercancel", up);
}

function startMarquee(event) {
  const rect = els.canvas.getBoundingClientRect();
  const origin = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  const additive = event.shiftKey;
  const base = new Set(selectedIds);
  let moved = false;
  els.canvas.setPointerCapture(event.pointerId);

  const move = (moveEvent) => {
    const cx = moveEvent.clientX - rect.left;
    const cy = moveEvent.clientY - rect.top;
    const left = Math.min(origin.x, cx);
    const top = Math.min(origin.y, cy);
    const width = Math.abs(cx - origin.x);
    const height = Math.abs(cy - origin.y);
    if (!moved && width + height < 4) return;
    moved = true;
    els.marquee.hidden = false;
    els.marquee.style.left = `${left}px`;
    els.marquee.style.top = `${top}px`;
    els.marquee.style.width = `${width}px`;
    els.marquee.style.height = `${height}px`;
    const hit = topicsInRect(left, top, left + width, top + height);
    setSelection(additive ? new Set([...base, ...hit]) : new Set(hit));
  };

  const up = () => {
    els.canvas.releasePointerCapture(event.pointerId);
    els.canvas.removeEventListener("pointermove", move);
    els.canvas.removeEventListener("pointerup", up);
    els.canvas.removeEventListener("pointercancel", up);
    els.marquee.hidden = true;
    // A plain click on empty space clears the selection (Excalidraw behaviour).
    if (!moved && !additive && selectedIds.size) setSelection(new Set());
  };

  els.canvas.addEventListener("pointermove", move);
  els.canvas.addEventListener("pointerup", up);
  els.canvas.addEventListener("pointercancel", up);
}

// Hit-test topics whose centre lies inside a canvas-local pixel rectangle.
function topicsInRect(x1, y1, x2, y2) {
  const { x: vx, y: vy, scale } = state.viewport;
  return getVisibleIds().filter((id) => {
    const topic = state.topics[id];
    const sx = vx + topic.x * scale;
    const sy = vy + topic.y * scale;
    return sx >= x1 && sx <= x2 && sy >= y1 && sy <= y2;
  });
}

function onCanvasWheel(event) {
  event.preventDefault();
  // Excalidraw convention: Ctrl/Cmd + wheel zooms; plain wheel pans vertically;
  // Shift + wheel pans horizontally.
  if (event.ctrlKey || event.metaKey) {
    const factor = Math.exp(-event.deltaY * 0.0011);
    zoomAtPoint(factor, event.clientX, event.clientY);
    return;
  }
  let dx = event.deltaX;
  let dy = event.deltaY;
  if (event.shiftKey && dx === 0) {
    dx = dy;
    dy = 0;
  }
  state.viewport.x -= dx;
  state.viewport.y -= dy;
  applyViewport();
  scheduleSave();
}

function zoomAtCenter(factor) {
  const rect = els.canvas.getBoundingClientRect();
  zoomAtPoint(factor, rect.left + rect.width / 2, rect.top + rect.height / 2);
}

function zoomAtPoint(factor, clientX, clientY) {
  const rect = els.canvas.getBoundingClientRect();
  const before = screenToWorld(clientX, clientY);
  const nextScale = clamp(state.viewport.scale * factor, MIN_SCALE, MAX_SCALE);
  state.viewport.scale = nextScale;
  state.viewport.x = clientX - rect.left - before.x * nextScale;
  state.viewport.y = clientY - rect.top - before.y * nextScale;
  applyViewport();
  scheduleSave();
}

function screenToWorld(clientX, clientY) {
  const rect = els.canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left - state.viewport.x) / state.viewport.scale,
    y: (clientY - rect.top - state.viewport.y) / state.viewport.scale,
  };
}

function fitToScreen() {
  const bounds = getVisibleBounds();
  const rect = els.canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const padding = 90;
  const scale = clamp(
    Math.min((rect.width - padding) / bounds.width, (rect.height - padding) / bounds.height),
    MIN_SCALE,
    1.35,
  );
  state.viewport.scale = scale;
  state.viewport.x = rect.width / 2 - (bounds.x + bounds.width / 2) * scale;
  state.viewport.y = rect.height / 2 - (bounds.y + bounds.height / 2) * scale;
  render();
}

function centerSelected() {
  const topic = selectedTopic();
  const rect = els.canvas.getBoundingClientRect();
  state.viewport.x = rect.width / 2 - topic.x * state.viewport.scale;
  state.viewport.y = rect.height / 2 - topic.y * state.viewport.scale;
  render();
}

function getVisibleBounds() {
  const ids = getVisibleIds();
  const boxes = ids.map((id) => {
    const topic = state.topics[id];
    return {
      left: topic.x - topic.width / 2,
      right: topic.x + topic.width / 2,
      top: topic.y - topic.height / 2,
      bottom: topic.y + topic.height / 2,
    };
  });
  const left = Math.min(...boxes.map((box) => box.left));
  const right = Math.max(...boxes.map((box) => box.right));
  const top = Math.min(...boxes.map((box) => box.top));
  const bottom = Math.max(...boxes.map((box) => box.bottom));
  return {
    x: left,
    y: top,
    width: Math.max(1, right - left),
    height: Math.max(1, bottom - top),
  };
}

function onTopicDoubleClick(event) {
  const topicNode = event.target.closest(".topic");
  if (!topicNode) return;
  event.stopPropagation();
  beginInlineEdit(topicNode.dataset.id);
}

// Double-clicking empty canvas drops a new free-floating root topic there.
function onCanvasDoubleClick(event) {
  if (event.target.closest(".topic")) return;
  const point = screenToWorld(event.clientX, event.clientY);
  addFloatingTopic(point.x, point.y);
}

function addFloatingTopic(x, y) {
  const color = palette[Object.keys(state.topics).length % palette.length];
  commitMutation(() => {
    const id = createId();
    state.topics[id] = {
      id,
      text: "新主題",
      parentId: null,
      children: [],
      side: "root",
      x,
      y,
      width: 140,
      height: 46,
      fill: color.fill,
      stroke: color.stroke,
      shape: "round",
      fontSize: 18,
      collapsed: false,
      notes: "",
      manual: true,
    };
    state.selectedId = id;
    selectedIds = new Set([id]);
  });
  requestAnimationFrame(() => beginInlineEdit(state.selectedId));
}

function beginInlineEdit(id) {
  const topic = state.topics[id];
  const node = els.topicLayer.querySelector(`[data-id="${cssEscape(id)}"]`);
  const text = node?.querySelector(".topic-text");
  if (!topic || !text) return;

  const before = serializeForHistory();
  editingTopicId = id;
  selectTopic(id);
  text.contentEditable = "true";
  if (topic.html) text.innerHTML = topic.html;
  else text.textContent = topic.text;
  text.focus();
  selectAllText(text);
  showRichToolbar(node);

  const finish = (save) => {
    const plain = (text.innerText ?? text.textContent ?? "").replace(/\n+$/, "").trim() || "新主題";
    const cleanHtml = sanitizeRichHtml(text.innerHTML);
    text.contentEditable = "false";
    text.removeEventListener("blur", onBlur);
    text.removeEventListener("keydown", onEditKeyDown);
    editingTopicId = null;
    els.richToolbar.hidden = true;
    if (save) {
      topic.text = plain;
      // Keep rich markup only when it actually carries formatting.
      topic.html = /<(strong|em|u|span)\b/i.test(cleanHtml) ? cleanHtml : "";
      measureTopic(topic);
      layoutMindMap();
      const after = serializeForHistory();
      if (JSON.stringify(before) !== JSON.stringify(after)) {
        historyBack.push(before);
        historyForward = [];
      }
    }
    render();
  };

  const onBlur = () => finish(true);
  const onEditKeyDown = (event) => {
    // Stop these bubbling to the global shortcut handler (otherwise Enter would
    // also fire "add sibling" and create a stray node).
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      finish(true);
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      finish(false);
    }
  };

  text.addEventListener("blur", onBlur);
  text.addEventListener("keydown", onEditKeyDown);
}

function showRichToolbar(node) {
  const toolbar = els.richToolbar;
  toolbar.hidden = false;
  const rect = node.getBoundingClientRect();
  const box = toolbar.getBoundingClientRect();
  let left = rect.left + rect.width / 2 - box.width / 2;
  let top = rect.top - box.height - 8;
  left = Math.max(8, Math.min(left, window.innerWidth - box.width - 8));
  if (top < 8) top = rect.bottom + 8;
  toolbar.style.left = `${left}px`;
  toolbar.style.top = `${top}px`;
}

// Keep only safe inline formatting (bold / italic / underline / colour) and line breaks.
function sanitizeRichHtml(html) {
  const container = document.createElement("div");
  container.innerHTML = html;
  return serializeClean(container);
}

function serializeClean(node) {
  let out = "";
  node.childNodes.forEach((child) => {
    if (child.nodeType === 3) {
      out += escapeHtml(child.nodeValue);
      return;
    }
    if (child.nodeType !== 1) return;
    const tag = child.tagName;
    const inner = serializeClean(child);
    if (tag === "B" || tag === "STRONG") out += inner ? `<strong>${inner}</strong>` : "";
    else if (tag === "I" || tag === "EM") out += inner ? `<em>${inner}</em>` : "";
    else if (tag === "U") out += inner ? `<u>${inner}</u>` : "";
    else if (tag === "BR") out += "<br>";
    else if (tag === "DIV" || tag === "P") out += inner ? `<div>${inner}</div>` : "";
    else if (tag === "SPAN" || tag === "FONT") {
      const style = child.style || {};
      const parts = [];
      const rawColor = style.color || child.getAttribute("color") || "";
      if (/^#[0-9a-fA-F]{3,8}$|^rgb\(/.test(rawColor)) parts.push(`color: ${rawColor}`);
      const weight = style.fontWeight;
      if (weight === "bold" || weight === "bolder" || weight === "700" || weight === "800") parts.push("font-weight: 800");
      else if (weight === "normal" || weight === "400") parts.push("font-weight: normal");
      if (style.fontStyle === "italic") parts.push("font-style: italic");
      const decoration = `${style.textDecorationLine || ""} ${style.textDecoration || ""}`;
      if (decoration.includes("underline")) parts.push("text-decoration: underline");
      out += parts.length && inner ? `<span style="${parts.join("; ")}">${inner}</span>` : inner;
    } else {
      out += inner;
    }
  });
  return out;
}

function onKeyDown(event) {
  if (event.key === "Escape" && !els.lightbox.hidden) {
    closeLightbox();
    return;
  }
  if (event.key === "Escape" && !els.contextMenu.hidden) closeContextMenu();
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
    event.preventDefault();
    openSearch();
    return;
  }
  const editingInput =
    event.target instanceof HTMLInputElement ||
    event.target instanceof HTMLTextAreaElement ||
    editingTopicId;
  if (pendingRelationshipFromId && event.key === "Escape") {
    event.preventDefault();
    pendingRelationshipFromId = null;
    render();
    return;
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
    event.preventDefault();
    if (event.shiftKey) redo();
    else undo();
    return;
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
    event.preventDefault();
    redo();
    return;
  }
  if (editingInput) return;

  if (event.ctrlKey || event.metaKey) {
    const key = event.key.toLowerCase();
    if (key === "a") {
      event.preventDefault();
      selectAllTopics();
      return;
    }
    if (key === "c") {
      event.preventDefault();
      copySelection();
      return;
    }
    if (key === "v") {
      event.preventDefault();
      pasteClipboard();
      return;
    }
  }

  if (event.key === "Tab") {
    event.preventDefault();
    addChild();
  } else if (event.key === "F2") {
    event.preventDefault();
    beginInlineEdit(state.selectedId);
  } else if (event.key === "Enter") {
    event.preventDefault();
    addSibling();
  } else if (event.key === "Delete" || event.key === "Backspace") {
    event.preventDefault();
    deleteSelected();
  } else if (event.key === " ") {
    event.preventDefault();
    if (!isSpaceDown) {
      isSpaceDown = true;
      els.canvas.classList.add("is-space");
    }
  } else if (event.key.toLowerCase() === "r") {
    event.preventDefault();
    startRelationship();
  } else if (event.key.toLowerCase() === "k") {
    event.preventDefault();
    els.linkInput.focus();
    els.linkInput.select();
  } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
    event.preventDefault();
    selectAdjacent(event.key === "ArrowDown" ? 1 : -1);
  } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault();
    selectDirectional(event.key === "ArrowRight" ? "right" : "left");
  } else if (event.key === "+" || event.key === "=") {
    zoomAtCenter(1.12);
  } else if (event.key === "-") {
    zoomAtCenter(0.9);
  }
}

function onKeyUp(event) {
  if (event.key === " ") releaseSpace();
}

function releaseSpace() {
  if (!isSpaceDown) return;
  isSpaceDown = false;
  els.canvas.classList.remove("is-space");
}

function selectAdjacent(direction) {
  const ids = getVisibleIds();
  const index = ids.indexOf(state.selectedId);
  if (index === -1) return;
  const next = ids[clamp(index + direction, 0, ids.length - 1)];
  selectTopic(next);
  centerSelected();
}

function selectDirectional(direction) {
  const topic = selectedTopic();
  if (direction === "right") {
    if (!topic.collapsed && topic.children.length) {
      const child = topic.children.find((id) => state.topics[id].side === "right") || topic.children[0];
      selectTopic(child);
      centerSelected();
      return;
    }
    if (topic.side === "left" && topic.parentId) {
      selectTopic(topic.parentId);
      centerSelected();
    }
    return;
  }
  if (!topic.collapsed && topic.children.length) {
    const child = topic.children.find((id) => state.topics[id].side === "left") || topic.children[0];
    selectTopic(child);
    centerSelected();
    return;
  }
  if (topic.side === "right" && topic.parentId) {
    selectTopic(topic.parentId);
    centerSelected();
  }
}

function getSubtreeIds(id) {
  const topic = state.topics[id];
  return [id, ...topic.children.flatMap(getSubtreeIds)];
}

function scheduleSave() {
  clearTimeout(saveTimer);
  els.autosaveStatus.textContent = "儲存中";
  saveTimer = window.setTimeout(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    els.autosaveStatus.textContent = "已儲存";
  }, 180);
}

function createId() {
  if (crypto?.randomUUID) return `topic-${crypto.randomUUID().slice(0, 8)}`;
  return `topic-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function displayLength(text) {
  return Array.from(text).reduce((sum, char) => sum + (/[\u2e80-\uffff]/.test(char) ? 1.8 : 1), 0);
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function cssEscape(value) {
  if (window.CSS?.escape) return CSS.escape(value);
  return value.replace(/["\\]/g, "\\$&");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function selectAllText(element) {
  const range = document.createRange();
  range.selectNodeContents(element);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}
