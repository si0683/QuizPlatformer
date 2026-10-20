/* =========================================================
   QUIZ JUMP — платформер + образовательный квиз + улучшения
   Чистый JavaScript и Canvas, графика из эмодзи
   ---------------------------------------------------------
   Как устроен файл (читайте сверху вниз):
     0. Лаборатория: 10 настроек для экспериментов
     1. Данные: миры, предметы, сложность
     2. Вопросы: математика, русский, английский
     3. Улучшения (перки)
     4. Настройки игрока и рекорд
     5. Звуки
     6. Холст и размер игры
     7. Состояние игры и герой
     8. Строим уровень
     9. Рисование: фон, платформы, герой, частицы
    10. Окно вопроса (квиз)
    11. Экран улучшений
    12. Игровые действия
    13. Физика и обновление за один кадр
    14. Рисование одного кадра
    15. Экраны и интерфейс
    16. Экран настроек
    17. Управление
    18. Игровой цикл и запуск
   ========================================================= */


/* ---------------------------------------------------------
   0. ЛАБОРАТОРИЯ ИГРЫ 🧪
   Поменяй одно значение, и игра изменится!
   Сейчас здесь обычные значения: игра такая, как задумано.
   --------------------------------------------------------- */

const LAB = {
  // 1. Название игры в меню: верхнее и нижнее слово (до 8 букв)
  titleTop: 'Quiz',
  titleBottom: 'Jump',

  // 2. Свой герой-эмодзи, например '🐸'. Пусто '' — герой мира
  heroEmoji: '',

  // 3. Жизни: 3 — обычно, 10 — много
  lives: 3,

  // 4. Сила прыжка: 1 — обычная, 1.3 — суперпрыжок
  jumpPower: 1,

  // 5. Скорость бега: 1 — обычная, 1.5 — быстрый
  heroSpeed: 1,

  // 6. Гравитация: 1 — обычная, 0.5 — Луна
  gravity: 1,

  // 7. Сколько врагов: 1 — обычно, 0 — без врагов, 2 — вдвое больше
  enemyAmount: 1,

  // 8. Ворота с вопросом каждые N клеток: 22 — обычно, 12 — часто
  gateEvery: 22,

  // 9. Длина уровня: 1 — обычная, 0.5 — короткие уровни
  levelLength: 1,

  // 10. Двойной прыжок сразу: false — нет, true — есть с начала
  doubleJump: false
};


/* ---------------------------------------------------------
   1. ДАННЫЕ: МИРЫ, ПРЕДМЕТЫ, СЛОЖНОСТЬ
   --------------------------------------------------------- */

const THEMES = [
  {
    id: 'fantasy', icon: '🏰', label: 'Фэнтези', desc: 'Рыцари и магия',
    accent: '#FFD700',
    sky: ['#0b1030', '#1b1f5a', '#3a2a6a'],
    block: '#4b4566', blockTop: '#8a7fb0', blockLine: '#2e2a45',
    hero: '🤺', star: '⭐', starName: 'Звёзды',
    enemies: ['👹', '💀'], boss: { emoji: '🐉', name: 'Дракон' }
  },
  {
    id: 'space', icon: '🚀', label: 'Космос', desc: 'Лазеры и НЛО',
    accent: '#00FFFF',
    sky: ['#000008', '#05051a', '#0d0a2e'],
    block: '#1c2550', blockTop: '#00d5e6', blockLine: '#0d1430',
    hero: '🧑‍🚀', star: '💎', starName: 'Кристаллы',
    enemies: ['👾', '🛸'], boss: { emoji: '👾', name: 'Мега-Мозг' }
  },
  {
    id: 'eco', icon: '🌿', label: 'Эко-Панк', desc: 'Защита природы',
    accent: '#39FF14',
    sky: ['#04140c', '#0b2a18', '#123d22'],
    block: '#5a4128', blockTop: '#3fbf3a', blockLine: '#3a2a18',
    hero: '🧑‍🌾', star: '🍀', starName: 'Клевер',
    enemies: ['🗑️', '🦗'], boss: { emoji: '🧟', name: 'Токсичный Монстр' }
  }
];

const SUBJECTS = [
  { id: 'math', icon: '🧮', label: 'Математика', desc: 'Примеры' },
  { id: 'rus',  icon: '📝', label: 'Русский', desc: 'Пропущенная буква' },
  { id: 'eng',  icon: '🇬🇧', label: 'Английский', desc: 'Перевод слов' }
];

const INPUT_MODES = [
  { id: 'buttons',  icon: '👆', label: 'Кнопки', desc: '4 варианта' },
  { id: 'keyboard', icon: '⌨️', label: 'Ввод', desc: 'Напечатать ответ' }
];

// Сложность: скорость врагов, длина уровня и множитель очков
const DIFFICULTIES = [
  { id: 'easy',   icon: '🙂', label: 'Легко',     desc: 'Медленные враги, короткие уровни', enemy: 50, length: 0.8, score: 1 },
  { id: 'normal', icon: '😎', label: 'Нормально', desc: 'Больше прыжков, очки ×1.5',        enemy: 70, length: 1,   score: 1.5 },
  { id: 'hard',   icon: '😈', label: 'Сложно',    desc: 'Быстрые враги, очки ×2',           enemy: 95, length: 1.2, score: 2 }
];

function findById(list, id) {
  return list.find(item => item.id === id) || list[0];
}

function currentTheme() {
  return findById(THEMES, settings.theme);
}

function difficulty() {
  return findById(DIFFICULTIES, settings.difficulty);
}


/* ---------------------------------------------------------
   2. ВОПРОСЫ
   Для каждого предмета — пул заданий. Задания перемешиваются
   и идут по очереди, поэтому подряд не повторяются.
   --------------------------------------------------------- */

// Русский язык: слово, номер пропущенной буквы (с нуля)
const RUS_WORDS = [
  ['МОЛОКО', 1], ['СОБАКА', 1], ['КОРОВА', 1], ['ВОРОНА', 1], ['БЕРЁЗА', 1],
  ['ЗАЯЦ', 1], ['ПЕТУХ', 1], ['ЛИСИЦА', 1], ['МЕДВЕДЬ', 1], ['КАРАНДАШ', 1],
  ['ТЕТРАДЬ', 1], ['ПЕНАЛ', 1], ['ЯГОДА', 3], ['МАГАЗИН', 1], ['ГОРОД', 1],
  ['УЧЕНИК', 2], ['ДЕЖУРНЫЙ', 1], ['РЕБЯТА', 1], ['КАПУСТА', 1], ['ПОГОДА', 1],
  ['СОРОКА', 1], ['ВЕТЕР', 1], ['МОРКОВЬ', 1], ['ПАЛЬТО', 1], ['ОГУРЕЦ', 2],
  ['ХОРОШО', 1], ['ДЕВОЧКА', 1], ['ЯЗЫК', 1]
];
const VOWELS = ['А', 'О', 'Е', 'И', 'Я', 'У'];

// Английский: слово и перевод
const ENG_WORDS = [
  ['APPLE', 'Яблоко'], ['DOG', 'Собака'], ['CAT', 'Кошка'], ['SPACE', 'Космос'],
  ['STAR', 'Звезда'], ['SUN', 'Солнце'], ['MOON', 'Луна'], ['HOUSE', 'Дом'],
  ['BOOK', 'Книга'], ['WATER', 'Вода'], ['TREE', 'Дерево'], ['BIRD', 'Птица'],
  ['FISH', 'Рыба'], ['SCHOOL', 'Школа'], ['FRIEND', 'Друг'], ['MOTHER', 'Мама'],
  ['FATHER', 'Папа'], ['GREEN', 'Зелёный'], ['RED', 'Красный'], ['BIG', 'Большой'],
  ['MILK', 'Молоко'], ['BREAD', 'Хлеб'], ['SKY', 'Небо'], ['EARTH', 'Земля'],
  ['FLOWER', 'Цветок'], ['CAR', 'Машина']
];

let questionPool = [];

function shuffle(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function randInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

// Один пример по математике. Чем сложнее игра — тем больше числа
function makeMathQuestion(level) {
  const kind = randInt(0, 2);
  let a, b, text, answer;
  if (kind === 0) {
    a = randInt(2, 10 + level * 20);
    b = randInt(2, 10 + level * 20);
    text = a + ' + ' + b + ' = ?';
    answer = a + b;
  } else if (kind === 1) {
    a = randInt(5, 15 + level * 20);
    b = randInt(1, a);           // без отрицательных ответов
    text = a + ' − ' + b + ' = ?';
    answer = a - b;
  } else {
    a = randInt(2, 5 + level * 2);
    b = randInt(2, 9);
    text = a + ' × ' + b + ' = ?';
    answer = a * b;
  }
  // Неверные варианты — близкие числа
  const wrong = new Set();
  while (wrong.size < 3) {
    const w = answer + randInt(-10, 10);
    if (w !== answer && w >= 0) wrong.add(w);
  }
  return { text: text, hint: '', answer: String(answer), options: shuffle([answer, ...wrong].map(String)), numeric: true };
}

function makeRusQuestion([word, index]) {
  const letter = word[index] === 'Ё' ? 'Е' : word[index];
  const text = word.slice(0, index) + '_' + word.slice(index + 1);
  const wrong = shuffle(VOWELS.filter(v => v !== letter)).slice(0, 3);
  return { text: text, hint: 'Какая буква пропущена?', answer: letter, options: shuffle([letter, ...wrong]) };
}

function makeEngQuestion([word, translation]) {
  const wrong = shuffle(ENG_WORDS.filter(w => w[1] !== translation)).slice(0, 3).map(w => w[1]);
  return { text: word, hint: 'Переведи на русский', answer: translation, options: shuffle([translation, ...wrong]) };
}

// Пул из 20+ заданий для выбранного предмета
function buildQuestionPool() {
  const subject = settings.subject;
  if (subject === 'rus') {
    questionPool = shuffle(RUS_WORDS).map(makeRusQuestion);
  } else if (subject === 'eng') {
    questionPool = shuffle(ENG_WORDS).map(makeEngQuestion);
  } else {
    const level = DIFFICULTIES.indexOf(findById(DIFFICULTIES, settings.difficulty));
    questionPool = [];
    for (let i = 0; i < 20; i++) questionPool.push(makeMathQuestion(level));
  }
}

function nextQuestion() {
  if (questionPool.length === 0) buildQuestionPool();
  return questionPool.pop();
}

// Сравнение ответов: без пробелов, без разницы в регистре, Ё = Е
function normalize(text) {
  return String(text).trim().toUpperCase().replace(/Ё/g, 'Е');
}


/* ---------------------------------------------------------
   3. УЛУЧШЕНИЯ (ПЕРКИ)
   После каждого уровня — выбор из трёх. Каждое — один раз за игру
   --------------------------------------------------------- */

const PERKS = [
  { id: 'double', icon: '🦘', title: 'Двойной прыжок',  desc: 'Прыжок прямо в воздухе',            apply: h => { h.doubleJump = true; } },
  { id: 'high',   icon: '⤴️', title: 'Высокий прыжок',  desc: 'Прыжок на 15% выше',                apply: h => { h.jump *= 1.15; } },
  { id: 'speed',  icon: '👟', title: 'Быстрые ноги',    desc: 'Бег на 20% быстрее',                apply: h => { h.speed *= 1.2; } },
  { id: 'heart',  icon: '❤️', title: '+1 жизнь',        desc: 'Ещё одна попытка',                  apply: h => { game.lives++; } },
  { id: 'magnet', icon: '🧲', title: 'Магнит',          desc: 'Звёзды сами летят к герою',         apply: h => { h.magnet = true; } },
  { id: 'shield', icon: '🛡️', title: 'Щит',             desc: 'Один удар врага не страшен',        apply: h => { h.shield = true; } },
  { id: 'glide',  icon: '🪂', title: 'Парение',         desc: 'Держи прыжок — падаешь медленно',   apply: h => { h.glide = true; } },
  { id: 'score',  icon: '⭐', title: 'Двойные очки',    desc: 'Очки ×2',                           apply: h => { h.scoreMult *= 2; } },
  { id: 'hint',   icon: '✂️', title: 'Подсказка 50/50', desc: 'В вопросе только 2 варианта',       apply: h => { h.hint = true; } },
  { id: 'retry',  icon: '🔁', title: 'Вторая попытка',  desc: 'Ошибся — можно ответить ещё раз',   apply: h => { h.retry = true; } }
];


/* ---------------------------------------------------------
   4. НАСТРОЙКИ ИГРОКА И РЕКОРД
   --------------------------------------------------------- */

const DEFAULT_SETTINGS = {
  theme: 'fantasy',
  subject: 'math',
  inputMode: 'buttons',
  difficulty: 'easy',
  sound: true,
  volume: 0.7
};

let settings = loadSettings();
let bestScore = loadBestScore();

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem('quizjump-settings'));
    return Object.assign({}, DEFAULT_SETTINGS, saved);
  } catch (error) {
    return Object.assign({}, DEFAULT_SETTINGS);
  }
}

function saveSettings() {
  try {
    localStorage.setItem('quizjump-settings', JSON.stringify(settings));
  } catch (error) {
    // Если браузер запретил сохранение — просто играем без него
  }
}

function loadBestScore() {
  try {
    return Number(localStorage.getItem('quizjump-best')) || 0;
  } catch (error) {
    return 0;
  }
}

function saveBestScore() {
  try {
    localStorage.setItem('quizjump-best', String(bestScore));
  } catch (error) {
    // ничего страшного
  }
}


/* ---------------------------------------------------------
   5. ЗВУКИ (Web Audio — звук играет мгновенно)
   --------------------------------------------------------- */

const isCodePen = location.hostname.includes('codepen') || location.hostname.includes('cdpn.io');
const SOUND_PATH = isCodePen ? 'https://si0683.github.io/QuizPlatformer/sound/' : 'sound/';

const SOUND_FILES = {
  jump:  'jump.wav',   // прыжок
  coin:  'coin.mp3',   // звезда, верный ответ
  tick:  'tick.wav',   // отсчёт
  start: 'start.wav',  // ворота открыты, уровень пройден
  crash: 'crash.wav'   // удар, неверный ответ
};

const SOUND_START = { coin: 0.045 };

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const sounds = {};

for (const name in SOUND_FILES) {
  fetch(SOUND_PATH + SOUND_FILES[name])
    .then(response => response.arrayBuffer())
    .then(data => audioContext.decodeAudioData(data))
    .then(buffer => { sounds[name] = buffer; })
    .catch(() => {});
}

function playSound(name) {
  if (!settings.sound || !sounds[name]) return;
  if (audioContext.state === 'suspended') audioContext.resume();
  const source = audioContext.createBufferSource();
  source.buffer = sounds[name];
  const volume = audioContext.createGain();
  volume.gain.value = settings.volume;
  source.connect(volume);
  volume.connect(audioContext.destination);
  source.start(0, SOUND_START[name] || 0);
}


/* ---------------------------------------------------------
   6. ХОЛСТ И РАЗМЕР ИГРЫ
   Высота мира 540 «игровых пикселей», ширина — под экран.
   Уровень длинный, камера едет за героем.
   --------------------------------------------------------- */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const stage = document.getElementById('stage');

const H = 540;
const TILE = 48;                    // размер одной клетки уровня
const GROUND_Y = H - TILE * 2;      // верх земли
let W = 900;
let scale = 1;

function resizeGame() {
  scale = window.innerHeight / H;
  W = window.innerWidth / scale;
  if (W < 480) {
    W = 480;
    scale = window.innerWidth / W;
  }
  if (W > 1200) W = 1200;
  stage.style.width = W * scale + 'px';
  stage.style.height = H * scale + 'px';
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(W * scale * ratio);
  canvas.height = Math.round(H * scale * ratio);
  ctx.setTransform(scale * ratio, 0, 0, scale * ratio, 0, 0);
}


/* ---------------------------------------------------------
   7. СОСТОЯНИЕ ИГРЫ И ГЕРОЙ
   --------------------------------------------------------- */

// Состояния: 'menu', 'choose', 'countdown', 'playing',
// 'quiz', 'perk', 'paused', 'over'
const game = {
  state: 'menu',
  score: 0,
  lives: 0,         // ставится из LAB.lives при старте
  level: 1,
  stars: 0,
  answers: 0,
  time: 0,
  cameraX: 0,
  usedPerks: []
};

const hero = {
  x: 0, y: 0,           // левый верхний угол
  w: 34, h: 44,
  vx: 0, vy: 0,
  onGround: false,
  coyote: 0,            // можно прыгнуть чуть после края платформы
  jumpBuffer: 0,        // прыжок, нажатый чуть раньше приземления
  usedDouble: false,
  facing: 1,
  hurt: 0,              // неуязвимость после удара
  checkpointX: 0,
  // Улучшения (меняются перками)
  speed: 260, jump: 720, doubleJump: LAB.doubleJump, magnet: false, shield: false,
  glide: false, scoreMult: 1, hint: false, retry: false
};

function heroEmoji() {
  return LAB.heroEmoji || currentTheme().hero;
}

function resetHeroPerks() {
  hero.speed = 260 * LAB.heroSpeed;
  hero.jump = 720 * LAB.jumpPower;
  hero.doubleJump = LAB.doubleJump;
  hero.magnet = false;
  hero.shield = false;
  hero.glide = false;
  hero.scoreMult = 1;
  hero.hint = false;
  hero.retry = false;
}

const GRAVITY = 1900 * LAB.gravity;
const keys = { left: false, right: false, jump: false };


/* ---------------------------------------------------------
   8. СТРОИМ УРОВЕНЬ
   Уровень собирается из кусков земли с ямами, ступенек,
   летающих платформ, звёзд, врагов и ворот с вопросами
   --------------------------------------------------------- */

let blocks = [];      // платформы: { x, y, w, h }
let stars = [];       // { x, y, taken }
let enemies = [];     // { x, y, left, right, dir, speed, emoji, boss, hp }
let gates = [];       // ворота: { x, y, h, open, lock }
let flag = null;      // финиш
let levelEnd = 0;
let particles = [];

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function buildLevel() {
  blocks = [];
  stars = [];
  enemies = [];
  gates = [];
  const theme = currentTheme();
  const d = difficulty();
  const tiles = Math.round((70 + game.level * 12) * d.length * LAB.levelLength);
  const isBossLevel = game.level % 3 === 0;

  let x = 0;
  let nextGate = 14;
  // Стартовая площадка
  blocks.push({ x: -TILE * 4, y: GROUND_Y, w: TILE * 12, h: TILE * 2 });
  x = TILE * 8;

  while (x < tiles * TILE) {
    // Яма (ширина растёт с уровнем, но всегда перепрыгивается)
    const gap = Math.random() < 0.6 ? Math.round(rand(2, 2.5 + Math.min(1, game.level * 0.15))) : 0;
    if (gap) {
      // Иногда над ямой летающая платформа со звёздами
      if (gap >= 2 && Math.random() < 0.5) {
        // oneWay: сквозь платформу можно пролететь снизу, а встать — сверху
        const py = GROUND_Y - TILE * 2.5;
        blocks.push({ x: x + TILE * 0.5, y: py, w: TILE * gap, h: TILE * 0.4, oneWay: true });
        for (let i = 0; i < gap; i++) stars.push({ x: x + TILE * (i + 1), y: py - 30, taken: false });
      }
      x += gap * TILE;
    }

    // Кусок земли
    const length = Math.round(rand(7, 13));
    const chunk = { x: x, y: GROUND_Y, w: length * TILE, h: TILE * 2 };
    blocks.push(chunk);

    // Будут ли на этом куске ворота с вопросом (ставим их в середину)
    const tileIndex = Math.round(x / TILE);
    const hasGate = tileIndex + length / 2 >= nextGate && length >= 8;
    const gateX = x + Math.round(length / 2) * TILE;

    // Ступенька на земле — не у краёв куска и не рядом с воротами
    if (length >= 9 && Math.random() < 0.5) {
      const stepH = Math.random() < 0.5 ? 1 : 2;
      const sx = x + TILE * Math.round(rand(3, length - 5));
      if (!hasGate || Math.abs(sx - gateX) >= TILE * 3) {
        blocks.push({ x: sx, y: GROUND_Y - stepH * TILE, w: TILE * 2, h: stepH * TILE });
        stars.push({ x: sx + TILE, y: GROUND_Y - stepH * TILE - 30, taken: false });
      }
    }

    // Звёзды дугой
    if (Math.random() < 0.6) {
      const sx = x + TILE * 2;
      for (let i = 0; i < 4; i++) stars.push({ x: sx + i * 34, y: GROUND_Y - 70 - Math.sin(i / 3 * Math.PI) * 50, taken: false });
    }

    // Ворота с вопросом
    if (hasGate) {
      // Ворота от неба до земли — их не перепрыгнуть
      gates.push({ x: gateX, y: 30, h: GROUND_Y - 30, open: false, lock: 0 });
      nextGate = tileIndex + LAB.gateEvery;
    } else if (length >= 8 && Math.random() < 0.7 * LAB.enemyAmount) {
      // Враг ходит по куску земли туда-сюда
      addEnemy(chunk.x + TILE, chunk.x + chunk.w - TILE, theme.enemies[Math.floor(Math.random() * theme.enemies.length)], false);
      if (LAB.enemyAmount > 1 && Math.random() < 0.5) addEnemy(chunk.x + TILE, chunk.x + chunk.w - TILE, theme.enemies[0], false);
    }
    x += length * TILE;
  }

  // Финишная площадка, на босс-уровне — с боссом
  const finish = { x: x + TILE * 2, y: GROUND_Y, w: TILE * 16, h: TILE * 2 };
  blocks.push({ x: x, y: GROUND_Y, w: TILE * 2, h: TILE * 2 });
  blocks.push(finish);
  if (isBossLevel) addEnemy(finish.x + TILE * 2, finish.x + TILE * 11, theme.boss.emoji, true);
  flag = { x: finish.x + TILE * 13, y: GROUND_Y - TILE * 2 };
  levelEnd = finish.x + finish.w;

  // Герой на старте
  hero.x = TILE;
  hero.y = GROUND_Y - hero.h;
  hero.vx = 0;
  hero.vy = 0;
  hero.checkpointX = hero.x;
  game.cameraX = 0;
}

function addEnemy(left, right, emoji, boss) {
  const size = boss ? 90 : 42;
  enemies.push({
    x: left + Math.random() * (right - left - size), y: GROUND_Y - size,
    w: size, h: size, left: left, right: right,
    dir: Math.random() < 0.5 ? -1 : 1,
    speed: difficulty().enemy * (boss ? 0.7 : 1) * (1 + game.level * 0.04),
    emoji: emoji, boss: boss, hp: boss ? 3 : 1, hurt: 0
  });
}


/* ---------------------------------------------------------
   9. РИСОВАНИЕ: ФОН, ПЛАТФОРМЫ, ГЕРОЙ, ЧАСТИЦЫ
   --------------------------------------------------------- */

const TAU = Math.PI * 2;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function seeded(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function wrap(value, length) {
  return ((value % length) + length) % length;
}

function drawCircle(x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

function drawGlow(x, y, r, color) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function drawEmoji(emoji, x, y, size, flip) {
  ctx.font = size + 'px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (flip) {
    // Эмодзи «смотрит» в другую сторону: зеркалим по горизонтали
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(-1, 1);
    ctx.fillText(emoji, 0, 0);
    ctx.restore();
  } else {
    ctx.fillText(emoji, x, y);
  }
}

function hexToRgba(color, alpha) {
  const n = parseInt(color.slice(1), 16);
  return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + alpha + ')';
}

// Фон двигается медленнее камеры — эффект глубины (параллакс)
function drawBackground() {
  const theme = currentTheme();
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, theme.sky[0]);
  g.addColorStop(0.6, theme.sky[1]);
  g.addColorStop(1, theme.sky[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const cam = game.cameraX;

  for (let i = 0; i < 80; i++) {
    const x = wrap(seeded(i) * 2000 - cam * 0.05, 2000);
    if (x > W) continue;
    ctx.globalAlpha = 0.3 + 0.6 * Math.abs(Math.sin(game.time * 1.4 + i));
    drawCircle(x, seeded(i + 40) * H * 0.6, 0.8 + seeded(i + 3) * 1.4, theme.id === 'eco' ? '#b6ff9a' : '#ffffff');
  }
  ctx.globalAlpha = 1;

  if (theme.id === 'space') {
    drawGlow(W * 0.75 - cam * 0.02 % 400, 120, 120, 'rgba(255,120,200,0.25)');
    drawCircle(W * 0.75 - cam * 0.02 % 400, 120, 50, '#3a2a7a');
    drawCircle(W * 0.75 - cam * 0.02 % 400 - 14, 106, 32, '#4d3a9a');
  } else {
    drawGlow(W * 0.8, 90, 110, theme.id === 'eco' ? 'rgba(57,255,20,0.18)' : 'rgba(255,215,0,0.25)');
    drawCircle(W * 0.8, 90, 34, theme.id === 'eco' ? '#d9ffd0' : '#fff3c4');
  }

  // Дальний слой: башни, горы-станции или деревья
  for (const layer of [{ speed: 0.15, color: 'rgba(0,0,0,0.25)', h: 170 }, { speed: 0.35, color: 'rgba(0,0,0,0.35)', h: 110 }]) {
    ctx.fillStyle = layer.color;
    const step = 140;
    const first = Math.floor(cam * layer.speed / step) - 1;
    for (let i = first; i * step - cam * layer.speed < W + step; i++) {
      const x = i * step - cam * layer.speed;
      const h = layer.h * (0.5 + seeded(i + layer.h));
      if (theme.id === 'eco') {
        ctx.beginPath();
        ctx.moveTo(x, GROUND_Y);
        ctx.lineTo(x + step / 2, GROUND_Y - h * 1.4);
        ctx.lineTo(x + step, GROUND_Y);
        ctx.fill();
      } else {
        ctx.fillRect(x + 20, GROUND_Y - h, step - 50, h);
        if (theme.id === 'fantasy') {
          ctx.beginPath();
          ctx.moveTo(x + 14, GROUND_Y - h);
          ctx.lineTo(x + step / 2 - 5, GROUND_Y - h - 40);
          ctx.lineTo(x + step - 24, GROUND_Y - h);
          ctx.fill();
        } else {
          ctx.fillRect(x + step / 2 - 12, GROUND_Y - h - 30, 4, 30);
        }
      }
    }
  }
}

function drawBlocks() {
  const theme = currentTheme();
  for (const b of blocks) {
    const x = b.x - game.cameraX;
    if (x > W || x + b.w < 0) continue;
    ctx.fillStyle = theme.block;
    ctx.fillRect(x, b.y, b.w, b.h);
    // Швы клеток
    ctx.strokeStyle = theme.blockLine;
    ctx.lineWidth = 2;
    for (let tx = 0; tx < b.w; tx += TILE) {
      for (let ty = 0; ty < b.h; ty += TILE) ctx.strokeRect(x + tx + 1, b.y + ty + 1, Math.min(TILE, b.w - tx) - 2, Math.min(TILE, b.h - ty) - 2);
    }
    // Светлая верхняя кромка (трава, металл или золото)
    ctx.fillStyle = theme.blockTop;
    ctx.fillRect(x, b.y, b.w, 6);
    if (theme.id === 'space') {
      ctx.fillStyle = hexToRgba(theme.accent, 0.25);
      ctx.fillRect(x, b.y + 6, b.w, 4);
    }
  }
}

function drawGates() {
  const theme = currentTheme();
  for (const g of gates) {
    if (g.open) continue;
    const x = g.x - game.cameraX;
    if (x > W + 50 || x < -50) continue;
    const color = g.lock > 0 ? '#ff4d6d' : theme.accent;
    drawGlow(x + TILE / 2, g.y + g.h / 2, 90, hexToRgba(color, 0.3 + Math.sin(game.time * 4) * 0.1));
    ctx.fillStyle = hexToRgba(color, 0.25);
    ctx.fillRect(x, g.y, TILE, g.h);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 1.5, g.y + 1.5, TILE - 3, g.h - 3);
    // Световые полосы-решётка
    for (let y = g.y + 16; y < g.y + g.h; y += 22) {
      ctx.fillStyle = hexToRgba(color, 0.6);
      ctx.fillRect(x + 6, y, TILE - 12, 3);
    }
    drawEmoji(g.lock > 0 ? '🔒' : '🚪', x + TILE / 2, GROUND_Y - 40, 40);
    drawEmoji('❓', x + TILE / 2, GROUND_Y - 100, 30 + Math.sin(game.time * 5) * 2);
  }
}

function drawStars() {
  const theme = currentTheme();
  for (const s of stars) {
    if (s.taken) continue;
    const x = s.x - game.cameraX;
    if (x < -30 || x > W + 30) continue;
    drawEmoji(theme.star, x, s.y + Math.sin(game.time * 4 + s.x) * 4, 26);
  }
  if (flag) {
    const x = flag.x - game.cameraX;
    drawGlow(x, flag.y + 40, 70, hexToRgba(theme.accent, 0.35));
    drawEmoji('🏁', x, flag.y + 40, 64);
  }
}

function drawEnemies() {
  for (const e of enemies) {
    const x = e.x - game.cameraX;
    if (x < -120 || x > W + 120) continue;
    if (e.boss) drawGlow(x + e.w / 2, e.y + e.h / 2, e.w, 'rgba(255,60,90,0.35)');
    if (e.hurt > 0 && Math.floor(game.time * 20) % 2 === 0) ctx.globalAlpha = 0.4;
    drawEmoji(e.emoji, x + e.w / 2, e.y + e.h / 2, e.w * 1.05, e.dir > 0);
    ctx.globalAlpha = 1;
    if (e.boss) {
      // Сердечки босса над головой
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('❤️'.repeat(e.hp), x + e.w / 2, e.y - 14);
    }
  }
}

function drawHero() {
  const x = hero.x - game.cameraX;
  if (hero.hurt > 0 && Math.floor(game.time * 15) % 2 === 0) ctx.globalAlpha = 0.35;
  drawGlow(x + hero.w / 2, hero.y + hero.h / 2, 46, hexToRgba(currentTheme().accent, 0.3));
  const squash = hero.onGround ? 1 : 1.06;
  drawEmoji(heroEmoji(), x + hero.w / 2, hero.y + hero.h / 2, 46 * squash, hero.facing < 0);
  ctx.globalAlpha = 1;
  if (hero.shield) {
    ctx.strokeStyle = 'rgba(127,220,255,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + hero.w / 2, hero.y + hero.h / 2, 32, 0, TAU);
    ctx.stroke();
  }
}

function spawnParticles(x, y, count, color, power) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * TAU;
    const speed = (0.3 + Math.random()) * power;
    particles.push({ x: x, y: y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.4 + Math.random() * 0.5, size: 2 + Math.random() * 4, color: color });
  }
}

function updateParticles(dt) {
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 500 * dt;
    p.life -= dt;
  }
  particles = particles.filter(p => p.life > 0);
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life * 2);
    drawCircle(p.x - game.cameraX, p.y, p.size, p.color);
  }
  ctx.globalAlpha = 1;
}


/* ---------------------------------------------------------
   10. ОКНО ВОПРОСА (КВИЗ)
   onAnswer(correct) — что сделать после ответа
   --------------------------------------------------------- */

let currentQuestion = null;
let quizLocked = false;
let quizCallback = null;
let retryUsed = false;

function openQuiz(hintText, onAnswer) {
  game.state = 'quiz';
  keys.left = keys.right = keys.jump = false;
  currentQuestion = nextQuestion();
  quizLocked = false;
  retryUsed = false;
  quizCallback = onAnswer;
  const subject = findById(SUBJECTS, settings.subject);

  document.getElementById('quizSubject').textContent = subject.icon + ' ' + subject.label;
  document.getElementById('quizQuestion').innerHTML = currentQuestion.text +
    (currentQuestion.hint ? '<small>' + currentQuestion.hint + '</small>' : '');
  document.getElementById('quizHint').textContent = hintText;
  document.getElementById('quizCard').classList.remove('flash-bad', 'flash-good');

  const options = document.getElementById('quizOptions');
  const form = document.getElementById('quizForm');
  const inputEl = document.getElementById('quizInput');

  if (settings.inputMode === 'keyboard') {
    options.classList.add('hidden');
    form.classList.remove('hidden');
    inputEl.value = '';
    inputEl.inputMode = currentQuestion.numeric ? 'numeric' : 'text';
    if (hero.hint) document.getElementById('quizHint').textContent = 'Подсказка: начинается на «' + String(currentQuestion.answer)[0] + '»';
    showScreen('quiz');
    setTimeout(() => inputEl.focus(), 50);
  } else {
    form.classList.add('hidden');
    options.classList.remove('hidden');
    options.innerHTML = '';
    let list = currentQuestion.options;
    // Подсказка 50/50: только верный и один неверный вариант
    if (hero.hint) {
      const wrong = list.filter(o => normalize(o) !== normalize(currentQuestion.answer));
      list = shuffle([currentQuestion.answer, wrong[0]]);
    }
    list.forEach((text, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'quiz-option';
      button.textContent = text;
      button.title = 'Клавиша ' + (i + 1);
      button.addEventListener('click', () => answerQuiz(text, button));
      options.appendChild(button);
    });
    showScreen('quiz');
  }
}

function answerQuiz(text, button) {
  if (quizLocked || game.state !== 'quiz') return;
  const correct = normalize(text) === normalize(currentQuestion.answer);
  const card = document.getElementById('quizCard');

  // «Вторая попытка»: первая ошибка не считается
  if (!correct && hero.retry && !retryUsed) {
    retryUsed = true;
    if (button) {
      button.classList.add('wrong');
      button.disabled = true;
    }
    restartAnimation(card, 'flash-bad');
    playSound('crash');
    document.getElementById('quizHint').textContent = '🔁 Попробуй ещё раз!';
    if (!button) document.getElementById('quizInput').value = '';
    return;
  }

  quizLocked = true;
  if (button) button.classList.add(correct ? 'right' : 'wrong');
  restartAnimation(card, correct ? 'flash-good' : 'flash-bad');
  if (correct) {
    game.answers++;
    playSound('coin');
  } else {
    playSound('crash');
    for (const b of document.querySelectorAll('.quiz-option')) {
      if (normalize(b.textContent) === normalize(currentQuestion.answer)) b.classList.add('right');
    }
    document.getElementById('quizHint').textContent = 'Правильно: ' + currentQuestion.answer;
  }
  setTimeout(() => {
    game.state = 'playing';
    showScreen(null);
    if (quizCallback) quizCallback(correct);
  }, correct ? 500 : 1100);
}

document.getElementById('quizForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const value = document.getElementById('quizInput').value;
  if (value.trim()) answerQuiz(value, null);
});


/* ---------------------------------------------------------
   11. ЭКРАН УЛУЧШЕНИЙ
   --------------------------------------------------------- */

let perkOffer = [];

function openPerks() {
  const free = PERKS.filter(perk => !game.usedPerks.includes(perk.id) && !(perk.id === 'double' && hero.doubleJump));
  if (free.length === 0) {
    nextLevel();
    return;
  }
  game.state = 'perk';
  perkOffer = shuffle(free).slice(0, 3);
  const box = document.getElementById('perkChoices');
  box.innerHTML = '';
  perkOffer.forEach((perk, i) => {
    box.appendChild(makeChoice(perk.icon, perk.title, perk.desc, () => pickPerk(perk), i + 1));
  });
  showScreen('perk');
}

function pickPerk(perk) {
  if (game.state !== 'perk') return;
  perk.apply(hero);
  game.usedPerks.push(perk.id);
  playSound('start');
  showToast(perk.icon + ' ' + perk.title);
  nextLevel();
}


/* ---------------------------------------------------------
   12. ИГРОВЫЕ ДЕЙСТВИЯ
   --------------------------------------------------------- */

function addScore(points) {
  game.score += Math.round(points * difficulty().score * hero.scoreMult);
}

// Герой подошёл к воротам — вопрос
function touchGate(gate) {
  if (gate.lock > 0) return;
  openQuiz('Верный ответ откроет ворота!', (correct) => {
    if (correct) {
      gate.open = true;
      hero.checkpointX = gate.x + (TILE - hero.w) / 2; // ворота — точка сохранения
      addScore(50);
      playSound('start');
      showToast('Ворота открыты! +50');
      spawnParticles(gate.x + TILE / 2, gate.y + gate.h / 2, 40, currentTheme().accent, 260);
    } else {
      gate.lock = 2; // 2 секунды замок, потом новый вопрос
      hero.vx = -380;
      hero.vy = -300;
    }
    updateHud();
  });
}

// Прыжок на голову босса — вопрос
function stompBoss(boss) {
  hero.vy = -hero.jump * 0.8;
  openQuiz('Верный ответ — удар по боссу!', (correct) => {
    if (correct) {
      boss.hp--;
      boss.hurt = 1;
      addScore(100);
      spawnParticles(boss.x + boss.w / 2, boss.y + boss.h / 2, 30, '#ff4d6d', 260);
      if (boss.hp <= 0) {
        enemies = enemies.filter(e => e !== boss);
        addScore(500);
        showToast(currentTheme().boss.name + ' побеждён! +500');
        playSound('start');
      } else {
        playSound('jump');
      }
    } else {
      boss.hurt = 0;
      hurtHero(boss);
    }
    updateHud();
  });
}

function stompEnemy(enemy) {
  enemies = enemies.filter(e => e !== enemy);
  hero.vy = -hero.jump * 0.6;
  addScore(20);
  playSound('jump');
  spawnParticles(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, 18, currentTheme().accent, 200);
}

// Удар врага: щит или минус жизнь, отбрасывание
function hurtHero(enemy) {
  if (hero.hurt > 0) return;
  hero.vx = (hero.x < enemy.x ? -1 : 1) * 380;
  hero.vy = -380;
  if (hero.shield) {
    hero.shield = false;
    hero.hurt = 1.2;
    showToast('🛡️ Щит!');
    return;
  }
  loseLife(false);
}

// Минус жизнь. fell — упал в яму, вернуть на точку сохранения
function loseLife(fell) {
  game.lives--;
  hero.hurt = 1.5;
  playSound('crash');
  spawnParticles(hero.x + hero.w / 2, Math.min(hero.y, H - 20), 24, '#ff4d6d', 240);
  if (game.lives <= 0) {
    game.lives = 0;
    gameOver();
    return;
  }
  if (fell) {
    // Возвращаемся на точку сохранения и встаём на самый верхний блок под ней
    hero.x = hero.checkpointX;
    const under = blocks.filter(b => !b.oneWay && hero.x + hero.w > b.x && hero.x < b.x + b.w);
    const top = under.length ? Math.min(...under.map(b => b.y)) : GROUND_Y;
    hero.y = top - hero.h;
    hero.vx = 0;
    hero.vy = 0;
  }
  updateHud();
}

function finishLevel() {
  addScore(200 * game.level);
  playSound('start');
  showToast('Уровень ' + game.level + ' пройден!');
  spawnParticles(flag.x, flag.y, 50, currentTheme().accent, 300);
  game.state = 'paused-level';
  setTimeout(openPerks, 700);
}

function nextLevel() {
  game.level++;
  buildLevel();
  game.state = 'playing';
  showScreen(null);
  showToast('Уровень ' + game.level + (game.level % 3 === 0 ? ': БОСС!' : ''));
  updateHud();
}

function gameOver() {
  game.state = 'over';
  const isRecord = game.score > bestScore;
  if (isRecord) {
    bestScore = game.score;
    saveBestScore();
  }
  document.getElementById('finalScore').textContent = game.score;
  document.getElementById('finalLevels').textContent = game.level - 1;
  document.getElementById('finalAnswers').textContent = game.answers;
  document.getElementById('finalBest').textContent = bestScore;
  document.getElementById('newRecord').classList.toggle('hidden', !isRecord || game.score === 0);
  setTimeout(() => showScreen('over'), 700);
}

function resetGame() {
  resetHeroPerks();
  game.score = 0;
  game.lives = LAB.lives;
  game.level = 1;
  game.stars = 0;
  game.answers = 0;
  game.usedPerks = [];
  particles = [];
  hero.hurt = 0;
  buildQuestionPool();
  buildLevel();
  updateHud();
}

function openDifficultySelect() {
  game.state = 'choose';
  const box = document.getElementById('difficultyChoices');
  box.innerHTML = '';
  DIFFICULTIES.forEach((d, i) => {
    box.appendChild(makeChoice(d.icon, d.label, d.desc, () => {
      settings.difficulty = d.id;
      saveSettings();
      startGame();
    }, i + 1));
  });
  showScreen('difficulty');
}

let countdownTimer = null;

function startGame() {
  if (audioContext.state === 'suspended') audioContext.resume();
  resetGame();
  showScreen(null);
  game.state = 'countdown';
  let number = 3;
  showCountdown(number);
  clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    number--;
    if (number > 0) {
      showCountdown(number);
    } else {
      clearInterval(countdownTimer);
      showCountdown('Вперёд!');
      game.state = 'playing';
      playSound('start');
    }
  }, 750);
}

function pauseGame() {
  if (game.state !== 'playing') return;
  game.state = 'paused';
  showScreen('pause');
}

function resumeGame() {
  if (game.state !== 'paused') return;
  game.state = 'playing';
  showScreen(null);
}

function goToMenu() {
  clearInterval(countdownTimer);
  hideCountdown();
  game.state = 'menu';
  showScreen('menu');
}


/* ---------------------------------------------------------
   13. ФИЗИКА И ОБНОВЛЕНИЕ ЗА ОДИН КАДР
   --------------------------------------------------------- */

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function update(dt) {
  if (['quiz', 'perk', 'paused', 'paused-level'].includes(game.state)) {
    if (game.state === 'paused-level') updateParticles(dt);
    return;
  }
  game.time += dt;
  updateParticles(dt);
  if (game.state !== 'playing') return;

  updateHero(dt);
  if (game.state !== 'playing') return;
  updateEnemies(dt);
  updateGates(dt);
  updateStars(dt);

  // Камера едет за героем, чуть впереди
  const target = hero.x - W * 0.35;
  game.cameraX += (target - game.cameraX) * Math.min(1, dt * 6);
  game.cameraX = clamp(game.cameraX, -TILE * 2, levelEnd - W);

  // Финиш (на босс-уровне — только когда босс побеждён)
  if (hero.x + hero.w > flag.x - 10 && !enemies.some(e => e.boss)) finishLevel();
}

function updateHero(dt) {
  // Бег: плавный разгон и торможение
  let move = 0;
  if (keys.left) move -= 1;
  if (keys.right) move += 1;
  if (move) hero.facing = move;
  const targetVx = move * hero.speed;
  hero.vx += (targetVx - hero.vx) * Math.min(1, dt * (hero.onGround ? 14 : 6));

  // Прыжок: «буфер» и «время койота» делают управление честным
  if (hero.jumpBuffer > 0) hero.jumpBuffer -= dt;
  if (hero.coyote > 0) hero.coyote -= dt;
  if (hero.jumpBuffer > 0) {
    if (hero.onGround || hero.coyote > 0) {
      hero.vy = -hero.jump;
      hero.jumpBuffer = 0;
      hero.coyote = 0;
      hero.onGround = false;
      playSound('jump');
    } else if (hero.doubleJump && !hero.usedDouble) {
      hero.vy = -hero.jump * 0.85;
      hero.usedDouble = true;
      hero.jumpBuffer = 0;
      spawnParticles(hero.x + hero.w / 2, hero.y + hero.h, 10, '#ffffff', 120);
      playSound('jump');
    }
  }

  // Гравитация; с «Парением» — медленное падение, пока держишь прыжок
  let gravity = GRAVITY;
  if (hero.glide && keys.jump && hero.vy > 0) gravity *= 0.25;
  // Отпустил прыжок раньше — прыжок ниже
  if (!keys.jump && hero.vy < 0) gravity *= 1.8;
  hero.vy = Math.min(hero.vy + gravity * dt, 900);

  // Движение по X и столкновения со стенами
  hero.x += hero.vx * dt;
  for (const b of blocks) {
    if (b.oneWay) continue; // летающие платформы — не стены
    if (overlaps(hero, b)) {
      if (hero.vx > 0) hero.x = b.x - hero.w;
      else if (hero.vx < 0) hero.x = b.x + b.w;
      hero.vx = 0;
    }
  }
  if (hero.x < -TILE * 3) hero.x = -TILE * 3;

  // Движение по Y и приземление
  const oldBottom = hero.y + hero.h;
  hero.y += hero.vy * dt;
  const wasOnGround = hero.onGround;
  hero.onGround = false;
  for (const b of blocks) {
    // На летающую платформу можно только приземлиться сверху
    if (b.oneWay && (hero.vy < 0 || oldBottom > b.y + 1)) continue;
    if (overlaps(hero, b)) {
      if (hero.vy > 0) {
        hero.y = b.y - hero.h;
        hero.onGround = true;
        hero.usedDouble = false;
      } else if (hero.vy < 0) {
        hero.y = b.y + b.h;
      }
      hero.vy = 0;
    }
  }
  if (wasOnGround && !hero.onGround && hero.vy >= 0) hero.coyote = 0.1;

  if (hero.hurt > 0) hero.hurt -= dt;

  // Упал в яму
  if (hero.y > H + 40) loseLife(true);
}

function updateEnemies(dt) {
  for (const e of enemies) {
    if (e.hurt > 0) e.hurt -= dt;
    e.x += e.dir * e.speed * dt;
    if (e.x < e.left) { e.x = e.left; e.dir = 1; }
    if (e.x + e.w > e.right) { e.x = e.right - e.w; e.dir = -1; }

    if (!overlaps(hero, e)) continue;
    // Сверху (падаем и ноги выше середины врага) — прыжок на голову
    const fromAbove = hero.vy > 0 && hero.y + hero.h - e.y < e.h * 0.5;
    if (fromAbove && e.boss) {
      if (e.hurt <= 0) stompBoss(e);
      else hero.vy = -hero.jump * 0.6; // босс ещё мигает — просто отскок
      return;
    }
    if (fromAbove && !e.boss) {
      stompEnemy(e);
      return;
    }
    hurtHero(e);
    if (game.state !== 'playing') return;
  }
}

function updateGates(dt) {
  for (const g of gates) {
    if (g.open) continue;
    if (g.lock > 0) g.lock -= dt;
    const box = { x: g.x, y: g.y, w: TILE, h: g.h };
    if (overlaps(hero, box)) {
      // Ворота — стена: не пускают дальше
      hero.x = Math.min(hero.x, g.x - hero.w);
      if (hero.vx > 0) hero.vx = 0;
      touchGate(g);
      if (game.state !== 'playing') return;
    }
  }
}

function updateStars(dt) {
  for (const s of stars) {
    if (s.taken) continue;
    const cx = hero.x + hero.w / 2;
    const cy = hero.y + hero.h / 2;
    if (hero.magnet && Math.hypot(s.x - cx, s.y - cy) < 160) {
      s.x += (cx - s.x) * Math.min(1, dt * 8);
      s.y += (cy - s.y) * Math.min(1, dt * 8);
    }
    if (Math.hypot(s.x - cx, s.y - cy) < 30) {
      s.taken = true;
      game.stars++;
      addScore(10);
      playSound('coin');
      spawnParticles(s.x, s.y, 8, '#ffd84a', 140);
      updateHud();
    }
  }
}


/* ---------------------------------------------------------
   14. РИСОВАНИЕ ОДНОГО КАДРА
   --------------------------------------------------------- */

function draw() {
  drawBackground();
  if (game.state !== 'menu') {
    drawBlocks();
    drawGates();
    drawStars();
    drawEnemies();
    drawHero();
    drawParticles();
  }
}


/* ---------------------------------------------------------
   15. ЭКРАНЫ И ИНТЕРФЕЙС
   --------------------------------------------------------- */

const screens = {
  menu: document.getElementById('menuScreen'),
  difficulty: document.getElementById('difficultyScreen'),
  quiz: document.getElementById('quizScreen'),
  perk: document.getElementById('perkScreen'),
  settings: document.getElementById('settingsScreen'),
  pause: document.getElementById('pauseScreen'),
  over: document.getElementById('gameOverScreen')
};

function showScreen(name) {
  for (const key in screens) {
    screens[key].classList.toggle('hidden', key !== name);
  }
  const inGame = name === null || ['pause', 'quiz', 'perk'].includes(name);
  document.getElementById('hud').classList.toggle('hidden', !inGame);
  document.getElementById('menuBest').textContent = bestScore;
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
}

function isVisible(el) {
  return !el.classList.contains('hidden');
}

function makeChoice(icon, title, desc, onPick, key) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'choice';
  button.innerHTML = '<span class="choice-icon">' + icon + '</span><span><span class="choice-title">' + title + '</span>' +
    (desc ? '<br><span class="choice-desc">' + desc + '</span>' : '') + '</span>';
  button.title = 'Клавиша ' + key;
  button.addEventListener('click', onPick);
  return button;
}

function updateHud() {
  document.getElementById('lives').textContent = game.lives > 6 ? '❤️×' + game.lives : '❤️'.repeat(game.lives) || '💔';
  document.getElementById('stars').textContent = game.stars;
  document.getElementById('score').textContent = game.score;
  document.getElementById('level').textContent = game.level;
  document.getElementById('perkChips').innerHTML = game.usedPerks
    .map(id => '<span class="chip">' + PERKS.find(p => p.id === id).icon + '</span>').join('');
}

function showCountdown(value) {
  const el = document.getElementById('countdown');
  el.classList.remove('hidden');
  const isText = typeof value === 'string';
  el.innerHTML = '<span class="' + (isText ? 'go' : '') + '">' + value + '</span>';
  if (!isText) playSound('tick');
  if (isText) setTimeout(hideCountdown, 600);
}

function hideCountdown() {
  document.getElementById('countdown').classList.add('hidden');
}

function showToast(text) {
  const el = document.getElementById('toast');
  el.textContent = text;
  restartAnimation(el, 'show');
}

function restartAnimation(el, className) {
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
}

function applyTheme() {
  const theme = currentTheme();
  const subject = findById(SUBJECTS, settings.subject);
  document.documentElement.style.setProperty('--accent', theme.accent);
  document.getElementById('starLabel').textContent = theme.star + ' ' + theme.starName;
  document.getElementById('menuInfo').textContent =
    theme.icon + ' ' + theme.label + ' · ' + subject.icon + ' ' + subject.label + ' · ' + findById(INPUT_MODES, settings.inputMode).label;
}


/* ---------------------------------------------------------
   16. ЭКРАН НАСТРОЕК
   --------------------------------------------------------- */

function buildOptions(containerId, items, settingName) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  for (const item of items) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'option' + (settings[settingName] === item.id ? ' selected' : '');
    button.innerHTML = '<span class="option-icon">' + item.icon + '</span><span class="option-title">' + item.label + '</span><span>' + item.desc + '</span>';
    button.addEventListener('click', () => {
      settings[settingName] = item.id;
      saveSettings();
      applyTheme();
      buildSettings();
    });
    container.appendChild(button);
  }
}

function buildSettings() {
  buildOptions('themeOptions', THEMES, 'theme');
  buildOptions('subjectOptions', SUBJECTS, 'subject');
  buildOptions('inputOptions', INPUT_MODES, 'inputMode');
  document.getElementById('soundToggle').checked = settings.sound;
  document.getElementById('volumeRange').value = Math.round(settings.volume * 100);
  document.getElementById('volumeRange').disabled = !settings.sound;
}

document.getElementById('soundToggle').addEventListener('change', (event) => {
  settings.sound = event.target.checked;
  saveSettings();
  buildSettings();
  playSound('coin');
});

document.getElementById('volumeRange').addEventListener('change', (event) => {
  settings.volume = Number(event.target.value) / 100;
  saveSettings();
  playSound('coin');
});

document.getElementById('resetBestButton').addEventListener('click', () => {
  bestScore = 0;
  saveBestScore();
  showToast('Рекорд сброшен');
});


/* ---------------------------------------------------------
   17. УПРАВЛЕНИЕ
   --------------------------------------------------------- */

function pressJump() {
  if (!keys.jump) hero.jumpBuffer = 0.12;
  keys.jump = true;
}

document.addEventListener('keydown', (event) => {
  if (document.activeElement && document.activeElement.id === 'quizInput') return;
  const code = event.code;
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(code)) event.preventDefault();

  if (code === 'ArrowLeft' || code === 'KeyA') keys.left = true;
  if (code === 'ArrowRight' || code === 'KeyD') keys.right = true;
  if (game.state === 'playing' && (code === 'Space' || code === 'ArrowUp' || code === 'KeyW')) pressJump();

  const digit = Number(event.key);
  if (digit >= 1 && digit <= 4) {
    let list = null;
    if (game.state === 'quiz') list = document.querySelectorAll('.quiz-option:not(:disabled)');
    else if (isVisible(screens.difficulty)) list = document.querySelectorAll('#difficultyChoices .choice');
    else if (game.state === 'perk') list = document.querySelectorAll('#perkChoices .choice');
    if (list && list[digit - 1]) list[digit - 1].click();
  }

  if (code === 'Space' || code === 'Enter') {
    if (isVisible(screens.menu)) openDifficultySelect();
    else if (isVisible(screens.over)) startGame();
  }
  if (code === 'Escape' || code === 'KeyP') {
    if (game.state === 'playing') pauseGame();
    else if (game.state === 'paused') resumeGame();
    else if (isVisible(screens.settings)) showScreen('menu');
  }
});

document.addEventListener('keyup', (event) => {
  const code = event.code;
  if (code === 'ArrowLeft' || code === 'KeyA') keys.left = false;
  if (code === 'ArrowRight' || code === 'KeyD') keys.right = false;
  if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') keys.jump = false;
});

// Кнопки на экране телефона: держишь — работает, отпустил — нет
function holdButton(id, onDown, onUp) {
  const button = document.getElementById(id);
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    button.classList.add('pressed');
    button.setPointerCapture(event.pointerId);
    onDown();
  });
  const release = () => {
    button.classList.remove('pressed');
    onUp();
  };
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
}

holdButton('leftButton', () => { keys.left = true; }, () => { keys.left = false; });
holdButton('rightButton', () => { keys.right = true; }, () => { keys.right = false; });
holdButton('jumpButton', () => { if (game.state === 'playing') pressJump(); }, () => { keys.jump = false; });

document.getElementById('startButton').addEventListener('click', openDifficultySelect);
document.getElementById('settingsButton').addEventListener('click', () => {
  buildSettings();
  showScreen('settings');
});
document.getElementById('settingsClose').addEventListener('click', () => showScreen('menu'));
document.getElementById('settingsDone').addEventListener('click', () => showScreen('menu'));
document.getElementById('pauseButton').addEventListener('click', pauseGame);
document.getElementById('resumeButton').addEventListener('click', resumeGame);
document.getElementById('pauseMenuButton').addEventListener('click', goToMenu);
document.getElementById('restartButton').addEventListener('click', startGame);
document.getElementById('overMenuButton').addEventListener('click', goToMenu);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauseGame();
});

window.addEventListener('resize', resizeGame);


/* ---------------------------------------------------------
   18. ИГРОВОЙ ЦИКЛ И ЗАПУСК
   --------------------------------------------------------- */

let lastTime = performance.now();

function loop(now) {
  let dt = (now - lastTime) / 1000;
  lastTime = now;
  if (dt > 0.05) dt = 0.05;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

document.querySelector('.title-top').textContent = LAB.titleTop;
document.querySelector('.title-bottom').textContent = LAB.titleBottom;
document.title = LAB.titleTop + ' ' + LAB.titleBottom;
resetHeroPerks();
resizeGame();
applyTheme();
showScreen('menu');
requestAnimationFrame(loop);
