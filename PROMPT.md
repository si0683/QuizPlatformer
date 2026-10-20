# Промт: Quiz Jump — платформер с образовательным квизом

> Это готовое техническое задание для нейросети. Скопируйте весь файл и отдайте его целиком.
> Документ описывает игру **в точности такой, какая она лежит в этом репозитории**. Если игра меняется, этот файл обновляется вместе с ней (см. `AGENTS.md`).
>
> Файл состоит из двух частей:
> 1. **ТЗ** — что и почему должна делать игра. Важные места и исправленные ошибки отмечены знаком ⚠️.
> 2. **Полные исходники** в конце (раздел «Исходный код») — эталонная рабочая версия.
>
> **Нейросети:** если нужна точная копия игры, создай три файла **один в один** по разделу «Исходный код» и скачай звуки по ссылкам. Если просят изменить игру, бери исходники за основу и соблюдай ТЗ.

---

## Роль и цель

Ты — опытный разработчик образовательных браузерных игр. Напиши игру «Quiz Jump» — платформер с образовательным квизом — на **HTML, CSS и чистом JavaScript (Canvas 2D)**, без библиотек, TypeScript, React и сборки. Игру показывают детям на уроке программирования: код простой, с подробными комментариями на русском, игра красивая и работает на компьютере и телефоне.

Что в игре:
- герой бежит и прыгает по платформам, собирает звёзды, прыгает врагам на голову, не падает в ямы;
- светящиеся ворота 🚪 от неба до земли открываются только верным ответом на вопрос, ворота — точка сохранения;
- в конце уровня флаг 🏁 и выбор улучшения (двойной прыжок, парение, магнит и др.), каждый 3-й уровень — босс: прыжок ему на голову = вопрос;
- кнопки ◀ ▶ ⤒ на телефоне, «время койота» и буфер прыжка для честного управления;
- 3 мира: Фэнтези, Космос, Эко-Панк; предметы: математика, русский, английский, история России; ответ кнопками или вводом.

## Лаборатория (раздел 0 в начале `script.js`)

| Поле | По умолчанию | Что делает |
|---|---|---|
| `titleTop` | `'Quiz'` | Название в меню |
| `heroEmoji` | `''` | Свой герой |
| `lives` | `3` | Жизни |
| `jumpPower` | `1` | Сила прыжка |
| `heroSpeed` | `1` | Скорость бега |
| `gravity` | `1` | Гравитация |
| `enemyAmount` | `1` | Сколько врагов |
| `gateEvery` | `22` | Ворота с вопросом каждые N клеток |
| `levelLength` | `1` | Длина уровня |
| `doubleJump` | `false` | Двойной прыжок с начала |

### Механика: платформер
- Высота мира 540, ширина под экран (480–1200), клетка `TILE = 48`, верх земли `GROUND_Y = H − 96`. Камера едет за героем (35% слева), фон-параллакс (звёзды/светлячки, луна или планета, два слоя силуэтов).
- Физика: гравитация 1900·`LAB.gravity`, прыжок 720·`jumpPower`, бег 260·`heroSpeed` с плавным разгоном. Отпустил прыжок рано — прыжок ниже. ⚠️ «Время койота» 0.1 с и буфер прыжка 0.12 с. Столкновения отдельно по X и Y.
- ⚠️ Летающие платформы над ямами — **односторонние** (`oneWay`): снизу сквозь них можно пролететь, приземлиться только сверху, высота 2.5 клетки (иначе герой бьётся головой и падает в яму).
- Генерация уровня: длина `(70 + 12·уровень)·сложность·levelLength` клеток; куски земли 7–13 клеток, ямы 2–3 клетки, иногда над ямой летающая платформа.
- ⚠️ Всё на куске земли ставится **согласованно**, через занятые клетки (`busy`):
  1. ворота — в середине куска (занимают свою клетку ± 1);
  2. ступенька 1–2 клетки высотой — на кусках от 10 клеток, не ближе 3 клеток к началу и **минимум 5 клеток земли после неё** (прыжок со ступеньки летит ~227 px и не должен кончаться в яме), не ближе 3 клеток к воротам; занимает свои клетки ± 1; над её серединой — одна звезда;
  3. `longestFreeSpan()` — самый длинный свободный отрезок куска;
  4. дуга из 5 звёзд с шагом 36 px — **ровно по центру** свободного отрезка (`addStarRow`); над летающей платформой — ровный ряд по её центру;
  5. враг патрулирует **только свободный отрезок** и не ближе 2 клеток к краям куска — не проходит сквозь ступеньки и ворота и не заставляет прыгать у самого края ямы.
- ⚠️ `placeStarsSafely()` — страховка (при правильной генерации ничего не меняет): звезду внутри блока ставит наверх, над пропастью убирает, выше прыжка опускает, ближе 30 px к другой — убирает. Проверено на 900 уровнях: страховка не сработала ни разу, наложений и недоступных звёзд нет.
- ⚠️ В конце уровня — стена высотой 8 клеток: за финиш не убежать (на уровне с боссом флаг работает только после победы, а без стены герой перепрыгивал босса и падал с края уровня).
- Ворота каждые `gateEvery` клеток в середине куска земли, **от неба до земли** (не перепрыгнуть даже двойным прыжком). Касание → вопрос. Верно → ворота открыты, +50, точка сохранения на месте ворот. Неверно → замок 🔒 на 2 с и отбрасывание.
- Упал в яму → −1 жизнь, возврат на точку сохранения, ставится на самый верхний блок под ней. Враг сбоку → −1 жизнь и отбрасывание (щит спасает), сверху → враг побеждён, отскок.
- Каждый 3-й уровень — босс перед флагом (3 сердца). Прыжок ему на голову → вопрос: верно −1 сердце, неверно — удар по герою. Флаг работает только когда босс побеждён. Флаг → очки 200·уровень, выбор улучшения (10: двойной прыжок, высокий прыжок, скорость, +1 жизнь, магнит звёзд, щит, парение, очки ×2, подсказка 50/50, вторая попытка ответа) → следующий уровень.
- ⚠️ Эмодзи-персонажи по умолчанию смотрят **влево**. Поэтому героя зеркалим, когда он идёт **вправо** (`hero.facing > 0`), врагов — когда `dir > 0`. С обратным условием герой бежал вправо, а смотрел влево.
- Телефон: кнопки ◀ ▶ ⤒ (скрыты на компьютере через `@media (hover: hover) and (pointer: fine)`).

## Общее для всех пяти игр (Quiz Shooter, Quiz Tower, Quiz Snake, Quiz Jump, Quiz Breakout)

### Миры (`THEMES`)
| id | Название | Акцент | Враги | Босс |
|---|---|---|---|---|
| fantasy | 🏰 Фэнтези — рыцари и магия | `#FFD700` (тёмно-синий фон) | 👹 💀 | 🐉 Дракон |
| space | 🚀 Космос — лазеры и НЛО | `#00FFFF` (чёрный фон) | ☄️ 🛸 | 👾 Мега-Мозг |
| eco | 🌿 Эко-Панк — защита природы | `#39FF14` (тёмно-зелёный фон) | 🗑️ 🦗 | 🧟 Токсичный Монстр |

Герои миров: Фэнтези 🤺 🧙 🧝‍♂️, Космос 🧑‍🚀 🤖 👽, Эко-Панк 🧑‍🌾 🐼 🦉. Акцент мира пишется в CSS-переменную `--accent`.

### Квиз (раздел «Вопросы» одинаковый во всех играх)
- Предметы (`SUBJECTS`): 🧮 Математика (пул из 20 случайных примеров: сложение, вычитание без отрицательных ответов, умножение; числа растут со сложностью), 📝 Русский (28 словарных слов с пропущенной гласной: `М_ЛОКО`), 🔤 Английский (26 слов для перевода: `SPACE → Космос`), 🏛️ История России (30 вопросов: космос, основание городов, князья и цари, войны, праздники, учёные; `HISTORY`: вопрос, ответ, 3 неверных, короткие формы ответа).
- ⚠️ Проверка ответа `isRightAnswer(question, text)`: засчитывается ответ и его короткие формы (`accept`), например «Гагарин» и «Юрий Гагарин», «Пётр I» и «Пётр 1». Для вопросов-лет подсказка «Напиши год» и цифровая клавиатура.
- ⚠️ Предмет выбирается не только в «Настройках», но и **на экране сложности** (строка «Предмет», `buildSubjectQuick`), иначе его не находят и играют только с математикой. Иконка английского — 🔤 (флаг 🇬🇧 в Windows рисуется буквами «GB»).
- Длинный вопрос (> 12 символов) — класс `long` (шрифт 26 px, перенос по словам); длинные варианты (> 9 символов) — шрифт 17 px. В змейке длинный вопрос в плашке переносится, пузыри ответов не ставятся ближе 4 клеток друг к другу.
- Задания перемешиваются и идут по очереди (`questionPool`), пул пересобирается, когда кончился. 4 варианта: верный + 3 неверных (близкие числа / другие гласные / другие переводы).
- Способ ответа (`INPUT_MODES`): **Кнопки** — 4 большие кнопки (клавиши `1`–`4`); **Ввод** — поле `<input>` + Enter, ⚠️ автофокус при открытии, `inputMode = numeric` для математики. Сравнение `normalize()`: без пробелов, без регистра, Ё = Е.
- ⚠️ Пока открыт вопрос — **жёсткая пауза** (мир не двигается). Неверно — окно мигает красным, подсвечивается/пишется правильный ответ (1.1 с). Верно — зелёная вспышка (0.5 с) и награда своей игры.
- Улучшения (перки) — рогалик: 3 случайных карточки из пула, каждое можно взять один раз за игру.

### Экраны и интерфейс
- HTML-слои поверх `<canvas>`: меню (название из `LAB`, подпись «мир · предмет · способ ответа», рекорд, «Начать», «Настройки», подсказки по управлению), выбор сложности (3 карточки), вопрос, улучшения, настройки (мир, предмет, способ ответа — карточки; звук + громкость; сброс рекорда), пауза, GAME OVER (очки, рекорд, «Рестарт», «В меню»), отсчёт 3-2-1 (кроме Quiz Tower), всплывающие надписи.
- ⚠️ Верхняя панель — сетка `grid-template-columns: 1fr auto 1fr` (у змейки `1fr 1fr`, вопрос — плашкой по центру): центральный блок **точно по центру**, все блоки и кнопка паузы одной высоты и на одной линии. Через `space-between` центр уезжал (до 46 px), высоты были разные. Экраны — `position: fixed` на всё окно; всплывающие надписи переносятся (`max-width: 92%`).
- Стекло-панели `rgba(12,16,40,0.84)` + `backdrop-filter: blur`, объёмные кнопки (янтарная и бирюзовая), шрифты Russo One + Rubik через `@import` в CSS, адаптив `@media`.
- `Esc`/`P` — пауза, автопауза при скрытии вкладки, после показа экрана `blur()` активной кнопки. Пока печатают ответ — клавиши игры не работают.
- Сохранение в `localStorage` (`<игра>-settings`, `<игра>-best`) в `try/catch`.

### Звук
⚠️ Только Web Audio API (`fetch → decodeAudioData`, `createBufferSource → createGain`), `SOUND_START = { coin: 0.045 }`. Файлы в `sound/`: `jump.wav`, `coin.mp3`, `tick.wav`, `start.wav`, `crash.wav`. В CodePen (`codepen`/`cdpn.io` в адресе) звуки берутся с GitHub Pages игры.

### Файлы и CodePen
- `index.html` / `style.css` / `script.js` — строго раздельно, чистый JavaScript + Canvas 2D, графика — эмодзи и фигуры, без библиотек и сборки. Подключение с `?v=N`.
- ⚠️ `codepen/index.pen.html` — часть `index.html` между метками «Для CodePen», без `<head>`, `<link>`, `<script>`: CodePen сам подключает CSS и JS, иначе скрипт загрузится дважды (`Identifier ... has already been declared`).
- Код для детей: объекты и функции (без классов), подробные русские комментарии, нумерованные разделы, раздел 0 — «Лаборатория» `LAB` из 10 настроек (значения по умолчанию = обычная игра).

## Чек-лист

- [ ] Три отдельных файла, чистый JS без библиотек, комментарии на русском, `LAB` в начале.
- [ ] Нет ошибок в консоли; движение через `dt` (секунды, не больше 0.05).
- [ ] Вопрос ставит игру на жёсткую паузу; верный ответ даёт награду, неверный показывает правильный ответ.
- [ ] Работают оба способа ответа (кнопки и ввод с автофокусом) и все три предмета и мира.
- [ ] Настройки и рекорд сохраняются; `?v=` у CSS и JS.
- [ ] В CodePen работают `codepen/index.pen.html` + `style.css` + `script.js`, звуки грузятся с GitHub Pages.

---

## Звуковые файлы

Положи в папку `sound/` рядом с `index.html` (или скачай из репозитория https://github.com/si0683/QuizPlatformer):

| Файл | Скачать |
|---|---|
| `jump.wav` | https://si0683.github.io/QuizPlatformer/sound/jump.wav |
| `coin.mp3` | https://si0683.github.io/QuizPlatformer/sound/coin.mp3 |
| `tick.wav` | https://si0683.github.io/QuizPlatformer/sound/tick.wav |
| `start.wav` | https://si0683.github.io/QuizPlatformer/sound/start.wav |
| `crash.wav` | https://si0683.github.io/QuizPlatformer/sound/crash.wav |

## Исходный код

<!-- SOURCES:START -->

<!-- Этот раздел создаётся скриптом tools/build.py — не редактируйте вручную -->

### `index.html`

````html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>Quiz Jump</title>
  <!-- Подключаем файл с оформлением.
       ?v=7 — номер версии: меняем его при каждом обновлении игры,
       чтобы браузер не брал старый файл из кэша -->
  <link rel="stylesheet" href="style.css?v=7">
</head>
<body>

<!-- ↓↓↓ Для CodePen копируйте в окно HTML всё, что ниже этой строки ↓↓↓
     Только эту часть! CodePen сам подключает style.css и script.js.
     Если скопировать строки <link> или <script src>, игра загрузится дважды
     и появится ошибка «Identifier ... has already been declared». -->

<!-- «Сцена» — рамка игры. Внутри холст (canvas) и все экраны поверх него -->
<div class="stage" id="stage">

  <!-- Холст: здесь JavaScript рисует уровень, героя, врагов и ворота -->
  <canvas id="gameCanvas"></canvas>

  <!-- Панель во время игры -->
  <div class="hud hidden" id="hud">
    <div class="hud-top">
      <div class="hud-left">
        <div class="hud-box">
          <span class="hud-label">Жизни</span>
          <b class="hearts" id="lives">❤️❤️❤️</b>
        </div>
        <div class="hud-box">
          <span class="hud-label" id="starLabel">⭐ Звёзды</span>
          <b id="stars">0</b>
        </div>
      </div>
      <div class="hud-box hud-center">
        <span class="hud-label">Очки</span>
        <b id="score">0</b>
      </div>
      <div class="hud-right">
        <div class="hud-box">
          <span class="hud-label">Уровень</span>
          <b id="level">1</b>
        </div>
        <button class="icon-btn" id="pauseButton" type="button" aria-label="Пауза">
          <svg viewBox="0 0 24 24" width="22" height="22"><rect x="6" y="5" width="4" height="14" rx="1.5" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1.5" fill="currentColor"/></svg>
        </button>
      </div>
    </div>
    <!-- Улучшения, которые уже взяли -->
    <div class="weapon" id="perkChips" style="bottom: 92px;"></div>
    <!-- Кнопки для телефона: влево, вправо, прыжок -->
    <div class="touch-controls">
      <div class="touch-group">
        <button class="touch-btn" id="leftButton" type="button" aria-label="Влево">◀</button>
        <button class="touch-btn" id="rightButton" type="button" aria-label="Вправо">▶</button>
      </div>
      <button class="touch-btn" id="jumpButton" type="button" aria-label="Прыжок">⤒</button>
    </div>
  </div>

  <!-- Обратный отсчёт 3 - 2 - 1 -->
  <div class="countdown hidden" id="countdown"></div>

  <!-- Всплывающая надпись -->
  <div class="toast" id="toast"></div>

  <!-- ЭКРАН 1. Стартовое меню -->
  <section class="screen" id="menuScreen">
    <div class="card">
      <h1 class="title">
        <span class="title-top">Quiz</span>
        <span class="title-bottom">Jump</span>
      </h1>
      <p class="subtitle" id="menuInfo">Прыгай, собирай звёзды и открывай ворота ответами!</p>
      <div class="best">🏆 Рекорд: <b id="menuBest">0</b></div>
      <div class="buttons">
        <button class="btn" id="startButton" type="button">Начать</button>
        <button class="btn btn-secondary" id="settingsButton" type="button">Настройки</button>
      </div>
      <div class="howto">
        <div><kbd>←</kbd> <kbd>→</kbd> или <kbd>A</kbd> <kbd>D</kbd> — бег, <kbd>Пробел</kbd> или <kbd>↑</kbd> — прыжок</div>
        <div>🚪 Ворота открываются только верным ответом</div>
        <div>Прыгни врагу на голову — он исчезнет</div>
        <div><kbd>Esc</kbd> — пауза</div>
      </div>
    </div>
  </section>

  <!-- ЭКРАН 2. Выбор сложности -->
  <section class="screen hidden" id="difficultyScreen">
    <div class="card card-wide">
      <h2 class="screen-title">Выбери предмет и сложность</h2>
      <h3 class="pick-title">Предмет</h3>
      <div class="options options-cards subject-pick" id="subjectQuick"></div>
      <h3 class="pick-title">Сложность</h3>
      <div class="choice-grid" id="difficultyChoices"></div>
    </div>
  </section>

  <!-- ЭКРАН 3. Вопрос (квиз) -->
  <section class="screen hidden" id="quizScreen">
    <div class="card quiz-card" id="quizCard">
      <div class="quiz-subject" id="quizSubject">🧮 Математика</div>
      <div class="quiz-question" id="quizQuestion">8 × 7 = ?</div>
      <div class="quiz-options" id="quizOptions"></div>
      <form class="quiz-form hidden" id="quizForm" autocomplete="off">
        <input class="quiz-input" id="quizInput" type="text" placeholder="Ответ" autocomplete="off" autocapitalize="characters" spellcheck="false">
        <button class="btn btn-small" type="submit">Ответить ⏎</button>
      </form>
      <div class="quiz-hint" id="quizHint">Верный ответ откроет ворота!</div>
    </div>
  </section>

  <!-- ЭКРАН 4. Улучшения после волны -->
  <section class="screen hidden" id="perkScreen">
    <div class="card card-wide">
      <h2 class="screen-title">Уровень пройден! Выбери улучшение</h2>
      <div class="choice-grid" id="perkChoices"></div>
    </div>
  </section>

  <!-- ЭКРАН 5. Настройки -->
  <section class="screen screen-settings hidden" id="settingsScreen">
    <div class="settings-panel">
      <div class="settings-header">
        <h2>Настройки</h2>
        <button class="icon-btn" id="settingsClose" type="button" aria-label="Закрыть">✕</button>
      </div>

      <div class="setting">
        <h3>Мир</h3>
        <div class="options options-cards" id="themeOptions"></div>
      </div>

      <div class="setting">
        <h3>Предмет</h3>
        <div class="options options-cards" id="subjectOptions"></div>
      </div>

      <div class="setting">
        <h3>Как отвечать</h3>
        <div class="options options-cards" id="inputOptions"></div>
      </div>

      <div class="setting">
        <h3>Звук</h3>
        <div class="row">
          <label class="switch">
            <input type="checkbox" id="soundToggle">
            <span class="switch-slider"></span>
          </label>
          <input class="volume" type="range" id="volumeRange" min="0" max="100" step="5" aria-label="Громкость">
        </div>
      </div>

      <div class="settings-footer">
        <button class="btn btn-ghost btn-small" id="resetBestButton" type="button">Сбросить рекорд</button>
        <button class="btn btn-small" id="settingsDone" type="button">Готово</button>
      </div>
    </div>
  </section>

  <!-- ЭКРАН 6. Пауза -->
  <section class="screen hidden" id="pauseScreen">
    <div class="card">
      <h2 class="screen-title">Пауза</h2>
      <div class="buttons">
        <button class="btn" id="resumeButton" type="button">Продолжить</button>
        <button class="btn btn-secondary" id="pauseMenuButton" type="button">В меню</button>
      </div>
    </div>
  </section>

  <!-- ЭКРАН 7. Игра окончена -->
  <section class="screen hidden" id="gameOverScreen">
    <div class="card">
      <h2 class="over-title">GAME OVER</h2>
      <div class="new-record hidden" id="newRecord">Новый рекорд!</div>
      <div class="stats">
        <div class="stat"><span>Очки</span><b id="finalScore">0</b></div>
        <div class="stat"><span>Уровни</span><b id="finalLevels">0</b></div>
        <div class="stat"><span>Ответы</span><b id="finalAnswers">0</b></div>
      </div>
      <div class="best">🏆 Рекорд: <b id="finalBest">0</b></div>
      <div class="buttons">
        <button class="btn" id="restartButton" type="button">Рестарт</button>
        <button class="btn btn-secondary" id="overMenuButton" type="button">В меню</button>
      </div>
    </div>
  </section>

</div>

<!-- ↑↑↑ Для CodePen копируйте до этой строки (строку <script> ниже — НЕ копировать) ↑↑↑ -->

<!-- Подключаем файл с логикой игры (номер версии — как у style.css) -->
<script src="script.js?v=7"></script>
</body>
</html>
````

### `style.css`

````css
/* =========================================================
   QUIZ JUMP (ПЛАТФОРМЕР) — оформление (цвета, шрифты, экраны, кнопки)
   ========================================================= */

/* Шрифты Google Fonts: Russo One — заголовки и цифры, Rubik — текст */
@import url('https://fonts.googleapis.com/css2?family=Russo+One&family=Rubik:wght@400;500;700&display=swap');

/* ---------- Цвета игры (переменные) ---------- */
/* --accent JavaScript меняет под выбранный мир */
:root {
  --bg: #070b1f;
  --panel: rgba(12, 16, 40, 0.84);
  --line: rgba(255, 255, 255, 0.14);
  --text: #eef1ff;
  --dim: #a7b0dd;
  --accent: #00ffff;
  --amber: #ffb84d;
  --amber-light: #ffd27a;
  --amber-dark: #d9821c;
  --cyan: #4fd6e8;
  --cyan-dark: #1f8a99;
  --good: #39d97a;
  --bad: #ff4d6d;
  --outline: #0d1030;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  height: 100%;
}

body {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background:
    radial-gradient(900px 600px at 20% -10%, #1c2560 0%, transparent 60%),
    radial-gradient(800px 600px at 100% 100%, #2a1450 0%, transparent 55%),
    var(--bg);
  color: var(--text);
  font-family: 'Rubik', sans-serif;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}

/* ---------- Сцена и холст ---------- */
/* Размер сцены задаёт JavaScript (функция resizeGame) */
.stage {
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 80px rgba(0, 0, 0, 0.6);
  touch-action: none; /* чтобы касание не прокручивало страницу */
}

#gameCanvas {
  display: block;
  width: 100%;
  height: 100%;
}

.hidden {
  display: none !important;
}

/* ---------- Панель во время игры (HUD) ---------- */
.hud {
  position: absolute;
  inset: 0;
  padding: 12px;
  pointer-events: none; /* касания проходят сквозь панель */
}

.hud-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.hud-box {
  display: flex;
  flex-direction: column;
  padding: 6px 12px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--panel);
  backdrop-filter: blur(8px);
}

.hud-label {
  color: var(--dim);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}

.hud-box b {
  font-family: 'Russo One', sans-serif;
  font-size: 22px;
  font-weight: 400;
  line-height: 1.15;
}

.hud-hp {
  min-width: 140px;
}

.hud-hp b {
  font-size: 14px;
}

.hud-center {
  align-items: center;
}

.hud-center b {
  color: var(--accent);
  text-shadow: 0 0 12px var(--accent);
}

.hud-right {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.bar {
  height: 10px;
  margin: 5px 0 3px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  overflow: hidden;
}

.bar-fill {
  width: 100%;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--bad), #ff9f43, var(--good));
  background-size: 300% 100%;
  transition: width 0.25s;
}

.weapon {
  position: absolute;
  left: 12px;
  bottom: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-width: calc(100% - 24px);
}

.chip {
  padding: 4px 10px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--panel);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.boss-bar {
  position: absolute;
  top: 78px;
  left: 50%;
  width: min(420px, 80%);
  transform: translateX(-50%);
  text-align: center;
  font-family: 'Russo One', sans-serif;
  font-size: 14px;
  color: var(--bad);
  text-shadow: 0 0 10px var(--bad);
}

.boss-bar .bar {
  height: 12px;
  border: 1px solid rgba(255, 77, 109, 0.6);
}

.boss-bar .bar-fill {
  background: linear-gradient(90deg, #ff2a5c, #ff7a45);
}

.icon-btn {
  pointer-events: auto;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--panel);
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  backdrop-filter: blur(8px);
}

/* ---------- Экраны ---------- */
.screen {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
  background: radial-gradient(circle at 50% 45%, rgba(7, 11, 31, 0.3), rgba(7, 11, 31, 0.75));
  animation: fadeIn 0.2s ease;
}

.card {
  width: min(400px, 100%);
  max-height: 100%;
  overflow-y: auto;
  padding: 24px 22px;
  border: 1px solid var(--line);
  border-radius: 26px;
  background: var(--panel);
  box-shadow: 0 24px 60px -20px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(10px);
  text-align: center;
  animation: rise 0.3s cubic-bezier(0.2, 0.9, 0.3, 1.2);
}

.card-wide {
  width: min(720px, 100%);
}

/* Заголовок игры с неоновым свечением в цвет мира */
.title {
  margin: 0 0 6px;
  font-family: 'Russo One', sans-serif;
  font-weight: 400;
  line-height: 0.95;
}

.title span {
  display: block;
  -webkit-text-stroke: 5px var(--outline);
  paint-order: stroke fill;
}

.title-top {
  font-size: 52px;
  color: #fff;
  text-shadow: 0 0 16px var(--accent), 0 6px 0 var(--outline);
}

.title-bottom {
  font-size: 58px;
  color: var(--accent);
  text-shadow: 0 0 24px var(--accent), 0 6px 0 var(--outline);
}

.subtitle {
  margin: 12px 0 14px;
  color: var(--dim);
  font-size: 15px;
}

.best {
  display: inline-block;
  margin-bottom: 18px;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(255, 184, 77, 0.12);
  color: var(--amber);
  font-weight: 500;
}

.screen-title {
  margin: 0 0 16px;
  font-family: 'Russo One', sans-serif;
  font-size: 28px;
  font-weight: 400;
}

.buttons {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.howto {
  display: grid;
  gap: 8px;
  margin-top: 20px;
  color: var(--dim);
  font-size: 13px;
}

kbd {
  padding: 2px 7px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-bottom: 2px solid rgba(255, 255, 255, 0.22);
  color: var(--text);
  font-family: inherit;
  font-size: 12px;
}

/* ---------- Кнопки (объёмные, «нажимаются» вниз) ---------- */
.btn {
  padding: 14px 28px;
  border: 0;
  border-radius: 16px;
  background: linear-gradient(180deg, var(--amber-light), var(--amber));
  box-shadow: 0 6px 0 var(--amber-dark), 0 12px 24px -6px rgba(0, 0, 0, 0.5);
  color: #3b2300;
  font-family: 'Russo One', sans-serif;
  font-size: 20px;
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s, filter 0.15s;
}

.btn:hover {
  filter: brightness(1.07);
}

.btn:active {
  transform: translateY(4px);
  box-shadow: 0 2px 0 var(--amber-dark);
}

.btn-secondary {
  background: linear-gradient(180deg, #7ae9f6, var(--cyan));
  box-shadow: 0 6px 0 var(--cyan-dark), 0 12px 24px -6px rgba(0, 0, 0, 0.5);
  color: #05303a;
}

.btn-secondary:active {
  box-shadow: 0 2px 0 var(--cyan-dark);
}

.btn-ghost {
  background: rgba(255, 255, 255, 0.08);
  box-shadow: none;
  color: var(--dim);
}

.btn-ghost:active {
  box-shadow: none;
}

.btn-small {
  padding: 11px 18px;
  font-size: 15px;
}

/* ---------- Карточки выбора: герои, сложность, улучшения ---------- */
.choice-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 12px;
}

.choice {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 12px;
  border: 2px solid var(--line);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text);
  font-family: inherit;
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s;
}

.choice:hover,
.choice:focus-visible {
  transform: translateY(-4px);
  border-color: var(--accent);
  box-shadow: 0 0 22px -4px var(--accent);
  outline: none;
}

.choice-icon {
  font-size: 46px;
  line-height: 1.1;
}

.choice-title {
  font-family: 'Russo One', sans-serif;
  font-size: 18px;
}

.choice-desc {
  color: var(--dim);
  font-size: 13px;
  line-height: 1.35;
}

.choice-stats {
  display: grid;
  gap: 3px;
  width: 100%;
  margin-top: 4px;
  font-size: 12px;
  text-align: left;
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-row span {
  width: 64px;
  color: var(--dim);
}

.stat-dots {
  letter-spacing: 1px;
  color: var(--accent);
}

/* ---------- Окно вопроса ---------- */
.quiz-card {
  width: min(460px, 100%);
  border-color: var(--accent);
  box-shadow: 0 0 40px -10px var(--accent), 0 24px 60px -20px rgba(0, 0, 0, 0.7);
}

.quiz-subject {
  color: var(--dim);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.quiz-question {
  margin: 14px 0 18px;
  font-family: 'Russo One', sans-serif;
  font-size: 40px;
  letter-spacing: 0.04em;
  word-break: break-word;
}

.quiz-question small {
  display: block;
  margin-top: 6px;
  color: var(--dim);
  font-family: 'Rubik', sans-serif;
  font-size: 15px;
  letter-spacing: 0;
}

.quiz-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.quiz-option {
  min-height: 64px;
  padding: 12px;
  border: 2px solid var(--line);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.07);
  color: #fff;
  font-family: 'Russo One', sans-serif;
  font-size: 24px;
  cursor: pointer;
  transition: transform 0.12s, border-color 0.12s, background 0.12s;
}

.quiz-option:hover {
  transform: translateY(-3px);
  border-color: var(--accent);
  background: rgba(255, 255, 255, 0.12);
}

.quiz-option.right {
  border-color: var(--good);
  background: rgba(57, 217, 122, 0.3);
}

.quiz-option.wrong {
  border-color: var(--bad);
  background: rgba(255, 77, 109, 0.3);
}

.quiz-form {
  display: flex;
  gap: 10px;
}

.quiz-input {
  flex: 1;
  min-width: 0;
  padding: 14px 16px;
  border: 2px solid var(--accent);
  border-radius: 16px;
  outline: none;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  font-family: 'Russo One', sans-serif;
  font-size: 24px;
  text-align: center;
  text-transform: uppercase;
}

.quiz-hint {
  margin-top: 14px;
  color: var(--dim);
  font-size: 13px;
}

/* Окно мигает красным при неверном ответе и зелёным при верном */
.quiz-card.flash-bad {
  animation: flashBad 0.6s ease;
}

.quiz-card.flash-good {
  animation: flashGood 0.5s ease;
}

/* ---------- Экран настроек ---------- */
.screen-settings {
  justify-content: flex-end;
  align-items: stretch;
  background: linear-gradient(90deg, transparent 30%, rgba(7, 11, 31, 0.6));
}

.settings-panel {
  width: min(420px, 100%);
  max-height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 18px 20px 20px;
  border: 1px solid var(--line);
  border-radius: 24px;
  background: var(--panel);
  backdrop-filter: blur(10px);
  animation: slideIn 0.3s ease;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.settings-header h2 {
  margin: 0;
  font-family: 'Russo One', sans-serif;
  font-size: 24px;
  font-weight: 400;
}

.setting {
  padding: 12px 0;
  border-bottom: 1px solid var(--line);
}

.setting h3 {
  margin: 0 0 10px;
  color: var(--dim);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.options-cards .option {
  flex: 1;
  min-width: 100px;
}

.option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 8px;
  border: 2px solid transparent;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--dim);
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s, background 0.15s;
}

.option:hover {
  transform: translateY(-2px);
}

.option.selected {
  border-color: var(--accent);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.option-icon {
  font-size: 26px;
}

.option-title {
  color: #fff;
  font-size: 14px;
  font-weight: 700;
}

.settings-footer {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding-top: 16px;
}

/* Переключатель (вкл/выкл) */
.switch {
  position: relative;
  flex-shrink: 0;
  width: 52px;
  height: 30px;
  cursor: pointer;
}

.switch input {
  position: absolute;
  opacity: 0;
}

.switch-slider {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.15);
  transition: background 0.2s;
}

.switch-slider::before {
  content: '';
  position: absolute;
  top: 4px;
  left: 4px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.2s;
}

.switch input:checked + .switch-slider {
  background: var(--amber);
}

.switch input:checked + .switch-slider::before {
  transform: translateX(22px);
}

.volume {
  flex: 1;
  accent-color: var(--amber);
}

.volume:disabled {
  opacity: 0.35;
}

/* ---------- Экран «Игра окончена» ---------- */
.over-title {
  margin: 0 0 14px;
  font-family: 'Russo One', sans-serif;
  font-size: 46px;
  font-weight: 400;
  color: var(--bad);
  -webkit-text-stroke: 4px var(--outline);
  paint-order: stroke fill;
  text-shadow: 0 0 24px var(--bad);
}

.stats {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}

.stat {
  flex: 1;
  padding: 10px 6px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.07);
}

.stat span {
  display: block;
  color: var(--dim);
  font-size: 12px;
}

.stat b {
  font-family: 'Russo One', sans-serif;
  font-size: 28px;
  font-weight: 400;
}

.new-record {
  display: inline-block;
  margin-bottom: 14px;
  padding: 6px 16px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--accent), var(--amber));
  color: #10132e;
  font-weight: 700;
  animation: pulse 1s ease-in-out infinite;
}

/* ---------- Обратный отсчёт и всплывающая надпись ---------- */
.countdown {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
  font-family: 'Russo One', sans-serif;
  font-size: 150px;
  color: #fff;
  -webkit-text-stroke: 6px var(--outline);
  paint-order: stroke fill;
  text-shadow: 0 0 30px var(--accent), 0 8px 0 var(--outline);
}

.countdown span {
  animation: countPop 0.7s ease-out both;
}

.countdown .go {
  font-size: 90px;
  color: var(--accent);
}

.toast {
  position: absolute;
  top: 26%;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0;
  pointer-events: none;
  white-space: nowrap;
  font-family: 'Russo One', sans-serif;
  font-size: 30px;
  color: #fff;
  -webkit-text-stroke: 4px var(--outline);
  paint-order: stroke fill;
  text-shadow: 0 0 18px var(--accent);
}

.toast.show {
  animation: toast 1.6s ease both;
}

/* ---------- Анимации ---------- */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes rise {
  from { opacity: 0; transform: translateY(24px) scale(0.96); }
  to { opacity: 1; transform: none; }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(40px); }
  to { opacity: 1; transform: none; }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.07); }
}

@keyframes flashBad {
  0%, 100% { background: var(--panel); }
  20%, 60% { background: rgba(255, 77, 109, 0.75); }
  40%, 80% { background: rgba(255, 77, 109, 0.25); }
}

@keyframes flashGood {
  0%, 100% { background: var(--panel); }
  40% { background: rgba(57, 217, 122, 0.6); }
}

@keyframes countPop {
  0% { opacity: 0; transform: scale(2.2); }
  30% { opacity: 1; transform: scale(1); }
  80% { opacity: 1; transform: scale(0.95); }
  100% { opacity: 0; transform: scale(0.7); }
}

@keyframes toast {
  0% { opacity: 0; transform: translate(-50%, 20px) scale(0.8); }
  15% { opacity: 1; transform: translate(-50%, 0) scale(1.05); }
  25% { transform: translate(-50%, 0) scale(1); }
  80% { opacity: 1; }
  100% { opacity: 0; transform: translate(-50%, -20px); }
}

/* ---------- Телефоны ---------- */
@media (max-width: 640px) {
  .screen-settings {
    align-items: flex-end;
    padding: 10px;
  }

  .settings-panel {
    max-height: 80%;
  }

  .hud-hp {
    min-width: 110px;
  }

  .hud-box b {
    font-size: 18px;
  }

  .title-top { font-size: 42px; }
  .title-bottom { font-size: 46px; }
  .quiz-question { font-size: 32px; }
  .quiz-option { font-size: 20px; }
  .choice-grid { grid-template-columns: 1fr; }
  .choice { flex-direction: row; text-align: left; }
  .choice-icon { font-size: 38px; }
  .countdown { font-size: 120px; }
}

/* Если в системе включено «уменьшить движение» */
@media (prefers-reduced-motion: reduce) {
  .new-record {
    animation: none;
  }
}

/* =========================================================
   ДОПОЛНЕНИЯ ДЛЯ ПЛАТФОРМЕРА
   ========================================================= */

.hud-left,
.hud-right {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.hearts {
  font-size: 20px;
  letter-spacing: 2px;
}

/* Кнопки управления для телефона */
.touch-controls {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 14px;
  display: flex;
  justify-content: space-between;
  padding: 0 14px;
  pointer-events: none;
}

.touch-group {
  display: flex;
  gap: 12px;
}

.touch-btn {
  width: 64px;
  height: 64px;
  border: 2px solid var(--line);
  border-radius: 50%;
  background: rgba(12, 16, 40, 0.55);
  color: #fff;
  font-size: 26px;
  pointer-events: auto;
  touch-action: none;
  backdrop-filter: blur(6px);
}

.touch-btn.pressed {
  border-color: var(--accent);
  background: rgba(255, 255, 255, 0.18);
}

/* На компьютере с мышью кнопки не нужны */
@media (hover: hover) and (pointer: fine) {
  .touch-controls {
    display: none;
  }
}

@media (max-width: 700px) {
  .hud {
    padding: 6px;
  }

  .hud-box {
    padding: 3px 7px;
  }

  .hud-label {
    font-size: 8px;
  }

  .hud-box b,
  .hearts {
    font-size: 14px;
  }

  .icon-btn {
    width: 34px;
    height: 34px;
  }
}

/* =========================================================
   РОВНАЯ ВЕРХНЯЯ ПАНЕЛЬ И ЭКРАНЫ
   ========================================================= */

/* Сетка: левая и правая колонки одинаковой ширины (1fr),
   поэтому средний блок стоит точно по центру */
.hud-top {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: start;
}

.hud-top > :first-child {
  justify-self: start;
}

.hud-top > :last-child {
  justify-self: end;
}

.hud-left,
.hud-right {
  display: flex;
  gap: 8px;
  align-items: stretch;
}

/* Все блоки одной высоты, содержимое по центру */
.hud-top .hud-box {
  justify-content: center;
  min-width: 80px;
  height: 54px;
  text-align: center;
}

.hud-top .hud-label {
  line-height: 16px;
}

.hud-top .icon-btn {
  width: 54px;
  height: 54px;
}

/* Экраны (меню, вопрос, улучшения, настройки…) — на всё окно,
   даже если игровое поле на телефоне узкой полосой */
.screen {
  position: fixed;
}

/* Длинные подсказки переносятся, а не обрезаются краем экрана */
.toast {
  width: max-content;
  max-width: 92%;
  white-space: normal;
  text-align: center;
  line-height: 1.15;
}

@media (max-width: 700px) {
  .hud-top .hud-box {
    min-width: 0;
    height: 38px;
    padding: 2px 8px;
  }

  .hud-top .hud-label {
    line-height: 12px;
  }

  .hud-top .icon-btn {
    width: 38px;
    height: 38px;
  }

  .hud-left,
  .hud-right {
    gap: 4px;
  }
}

/* ---------- Предмет на экране сложности и длинные вопросы ---------- */
.pick-title {
  margin: 4px 0 10px;
  color: var(--dim);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-align: left;
  text-transform: uppercase;
}

.subject-pick {
  margin-bottom: 16px;
}

/* Предметы ровной сеткой: 4 в ряд, на телефоне 2 × 2 */
.subject-pick,
#subjectOptions {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

#subjectOptions {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (max-width: 560px) {
  .subject-pick {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* Длинный вопрос (история) — шрифт меньше, переносится по словам */
.quiz-question.long {
  font-size: 26px;
  line-height: 1.25;
  letter-spacing: 0;
}

/* Длинные варианты ответа — шрифт меньше */
.quiz-options.long .quiz-option {
  font-size: 17px;
}

@media (max-width: 640px) {
  .quiz-question.long {
    font-size: 21px;
  }

  .quiz-options.long .quiz-option {
    font-size: 15px;
  }
}
````

### `script.js`

````javascript
/* =========================================================
   QUIZ JUMP — платформер + образовательный квиз + улучшения
   Чистый JavaScript и Canvas, графика из эмодзи
   ---------------------------------------------------------
   Как устроен файл (читайте сверху вниз):
     0. Лаборатория: 10 настроек для экспериментов
     1. Данные: миры, предметы, сложность
     2. Вопросы: математика, русский, английский, история
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
  { id: 'eng',  icon: '🔤', label: 'Английский', desc: 'Перевод слов' },
  { id: 'hist', icon: '🏛️', label: 'История России', desc: 'Даты и люди' }
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

// История России: вопрос, верный ответ, три неверных варианта
// и короткие формы ответа, которые тоже засчитываются при вводе
const HISTORY = [
  ['Кто первым полетел в космос?', 'Гагарин', ['Титов', 'Леонов', 'Королёв'], ['Юрий Гагарин']],
  ['В каком году Гагарин полетел в космос?', '1961', ['1957', '1965', '1945']],
  ['Кто первым вышел в открытый космос?', 'Леонов', ['Гагарин', 'Титов', 'Терешкова'], ['Алексей Леонов']],
  ['Кто первая женщина-космонавт?', 'Терешкова', ['Савицкая', 'Кондакова', 'Кикина'], ['Валентина Терешкова']],
  ['В каком году запустили первый спутник Земли?', '1957', ['1961', '1945', '1969']],
  ['Кто был главным конструктором первых ракет?', 'Королёв', ['Гагарин', 'Туполев', 'Калашников'], ['Сергей Королёв']],
  ['Кто основал Санкт-Петербург?', 'Пётр I', ['Иван Грозный', 'Екатерина II', 'Александр I'], ['Пётр 1', 'Пётр Первый', 'Пётр']],
  ['В каком году основан Санкт-Петербург?', '1703', ['1613', '1812', '1147']],
  ['В каком году Москва впервые упомянута в летописи?', '1147', ['988', '1240', '1380']],
  ['Кто основал Москву?', 'Юрий Долгорукий', ['Иван Калита', 'Дмитрий Донской', 'Ярослав Мудрый'], ['Долгорукий']],
  ['В каком году крестили Русь?', '988', ['1147', '862', '1380']],
  ['Какой князь крестил Русь?', 'Владимир', ['Олег', 'Игорь', 'Святослав'], ['Князь Владимир']],
  ['В каком году была Куликовская битва?', '1380', ['1242', '1612', '1812']],
  ['Кто победил на Куликовом поле?', 'Дмитрий Донской', ['Александр Невский', 'Иван III', 'Пётр I'], ['Донской']],
  ['Кто победил в Ледовом побоище?', 'Александр Невский', ['Дмитрий Донской', 'Юрий Долгорукий', 'Владимир'], ['Невский']],
  ['В каком году было Ледовое побоище?', '1242', ['1240', '1380', '1480']],
  ['Кто стал первым русским царём?', 'Иван Грозный', ['Пётр I', 'Михаил Романов', 'Борис Годунов'], ['Грозный', 'Иван IV', 'Иван 4']],
  ['Кто освободил Москву в 1612 году?', 'Минин и Пожарский', ['Кутузов', 'Суворов', 'Ермак'], ['Минин', 'Пожарский']],
  ['В каком году была война с Наполеоном?', '1812', ['1612', '1914', '1941']],
  ['Кто командовал русской армией в 1812 году?', 'Кутузов', ['Суворов', 'Жуков', 'Багратион']],
  ['В каком году началась Великая Отечественная война?', '1941', ['1939', '1914', '1945']],
  ['В каком году закончилась Великая Отечественная война?', '1945', ['1941', '1943', '1918']],
  ['Какого числа празднуют День Победы?', '9 мая', ['12 июня', '4 ноября', '23 февраля']],
  ['Какого числа празднуют День России?', '12 июня', ['9 мая', '4 ноября', '1 сентября']],
  ['Кто создал таблицу химических элементов?', 'Менделеев', ['Ломоносов', 'Павлов', 'Королёв']],
  ['По чьей идее открыли Московский университет?', 'Ломоносов', ['Менделеев', 'Пушкин', 'Пётр I']],
  ['С какого царя началась династия Романовых?', 'Михаил', ['Пётр', 'Иван', 'Алексей'], ['Михаил Романов', 'Михаил Фёдорович']],
  ['Как звали последнего российского императора?', 'Николай II', ['Александр III', 'Пётр III', 'Павел I'], ['Николай 2', 'Николай Второй', 'Николай']],
  ['Какой город стал столицей при Петре I?', 'Санкт-Петербург', ['Новгород', 'Казань', 'Владимир'], ['Петербург', 'Питер', 'СПб']],
  ['Кто написал «Повесть временных лет»?', 'Нестор', ['Пимен', 'Кирилл', 'Мефодий'], ['Летописец Нестор']]
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

function makeHistoryQuestion([text, answer, wrong, accept]) {
  return {
    text: text,
    hint: /^\d+$/.test(answer) ? 'Напиши год' : '',
    answer: answer,
    accept: accept || [],                 // другие правильные формы ответа
    options: shuffle([answer, ...wrong]),
    numeric: /^\d+$/.test(answer)
  };
}

// Пул из 20+ заданий для выбранного предмета
function buildQuestionPool() {
  const subject = settings.subject;
  if (subject === 'rus') {
    questionPool = shuffle(RUS_WORDS).map(makeRusQuestion);
  } else if (subject === 'eng') {
    questionPool = shuffle(ENG_WORDS).map(makeEngQuestion);
  } else if (subject === 'hist') {
    questionPool = shuffle(HISTORY).map(makeHistoryQuestion);
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

// Верный ли ответ: совпадает с ответом или с одной из его коротких форм
function isRightAnswer(question, text) {
  const value = normalize(text);
  return [question.answer, ...(question.accept || [])].some(a => normalize(a) === value);
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
        const platform = { x: x + TILE * 0.5, y: py, w: TILE * gap, h: TILE * 0.4, oneWay: true };
        blocks.push(platform);
        // Звёзды ровным рядом по центру платформы
        addStarRow(platform.x + platform.w / 2, py - 32, gap, 0);
      }
      x += gap * TILE;
    }

    // Кусок земли
    const length = Math.round(rand(7, 13));
    const chunk = { x: x, y: GROUND_Y, w: length * TILE, h: TILE * 2 };
    blocks.push(chunk);

    // Клетки куска, где уже что-то стоит (ворота, ступенька) —
    // туда не ставим звёзды и не пускаем врагов
    const busy = new Set();

    // 1. Ворота с вопросом — в середине куска
    const tileIndex = Math.round(x / TILE);
    const gateTile = Math.round(length / 2);
    const hasGate = tileIndex + length / 2 >= nextGate && length >= 8;
    if (hasGate) {
      // Ворота от неба до земли — их не перепрыгнуть
      gates.push({ x: x + gateTile * TILE, y: 30, h: GROUND_Y - 30, open: false, lock: 0 });
      nextGate = tileIndex + LAB.gateEvery;
      for (let i = gateTile - 1; i <= gateTile + 1; i++) busy.add(i);
    }

    // 2. Ступенька — не у краёв куска и не рядом с воротами.
    //    После неё минимум 5 клеток земли: прыжок со ступеньки летит
    //    дальше обычного и не должен заканчиваться в яме
    if (length >= 10 && Math.random() < 0.5) {
      const stepTile = Math.round(rand(3, length - 7));
      if (!hasGate || Math.abs(stepTile - gateTile) >= 3) {
        const stepH = Math.random() < 0.5 ? 1 : 2;
        const top = GROUND_Y - stepH * TILE;
        blocks.push({ x: x + stepTile * TILE, y: top, w: TILE * 2, h: stepH * TILE });
        stars.push({ x: x + (stepTile + 1) * TILE, y: top - 32 }); // звезда над серединой ступеньки
        for (let i = stepTile - 1; i <= stepTile + 2; i++) busy.add(i);
      }
    }

    // 3. Свободный отрезок: самый длинный кусок без ворот и ступеньки
    const span = longestFreeSpan(length, busy);

    // 4. Дуга из 5 звёзд — ровно по центру свободного отрезка
    if (span && span.tiles >= 4 && Math.random() < 0.6) {
      addStarRow(x + span.center * TILE, GROUND_Y - 60, 5, 50);
    }

    // 5. Враг ходит только по свободному отрезку — до ступеньки не доходит,
    //    а от краёв куска держится минимум в 2 клетках, чтобы у ямы
    //    не приходилось прыгать раньше времени
    const enemyFrom = span ? Math.max(span.from, 2) : 0;
    const enemyTo = span ? Math.min(span.to, length - 3) : 0;
    if (!hasGate && span && enemyTo - enemyFrom + 1 >= 3 && Math.random() < 0.7 * LAB.enemyAmount) {
      const left = x + enemyFrom * TILE;
      const right = x + (enemyTo + 1) * TILE;
      addEnemy(left, right, theme.enemies[Math.floor(Math.random() * theme.enemies.length)], false);
      if (LAB.enemyAmount > 1 && Math.random() < 0.5) addEnemy(left, right, theme.enemies[0], false);
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
  // Стена в конце уровня: за финиш не убежать и с края не упасть
  // (на уровне с боссом флаг работает только после победы над ним)
  blocks.push({ x: levelEnd - TILE, y: GROUND_Y - TILE * 8, w: TILE, h: TILE * 8 });

  // Проверяем, что до каждой звезды можно добраться
  placeStarsSafely();

  // Герой на старте
  hero.x = TILE;
  hero.y = GROUND_Y - hero.h;
  hero.vx = 0;
  hero.vy = 0;
  hero.checkpointX = hero.x;
  game.cameraX = 0;
}

// Ряд звёзд с одинаковым шагом 36 пикселей, по центру в точке cx.
// arc > 0 — ряд выгибается дугой вверх на arc пикселей
function addStarRow(cx, y, count, arc) {
  for (let i = 0; i < count; i++) {
    const t = count > 1 ? i / (count - 1) : 0.5;
    stars.push({ x: cx + (i - (count - 1) / 2) * 36, y: y - Math.sin(t * Math.PI) * arc });
  }
}

// Самый длинный отрезок свободных клеток куска (без крайних клеток).
// Возвращает { from, to, tiles, center } в клетках от начала куска
function longestFreeSpan(length, busy) {
  let best = null;
  let from = null;
  for (let i = 1; i <= length - 1; i++) {
    const free = i <= length - 2 && !busy.has(i);
    if (free && from === null) from = i;
    if (!free && from !== null) {
      const tiles = i - from;
      if (!best || tiles > best.tiles) best = { from: from, to: i - 1, tiles: tiles, center: from + tiles / 2 };
      from = null;
    }
  }
  return best;
}

// Страховка: звезда без опоры или выше прыжка не остаётся на уровне.
// При правильной генерации эта проверка ничего не меняет
function placeStarsSafely() {
  const jumpHeight = hero.jump * hero.jump / (2 * GRAVITY); // высота прыжка
  for (const s of stars) {
    // Внутри твёрдого блока — ставим сверху на него
    const inside = blocks.find(b => !b.oneWay && s.x > b.x && s.x < b.x + b.w && s.y > b.y - 20 && s.y < b.y + b.h);
    if (inside) s.y = inside.y - 30;

    // Опора под звездой: самый верхний блок ниже неё
    const below = blocks.filter(b => s.x >= b.x && s.x <= b.x + b.w && b.y >= s.y);
    if (below.length === 0) {
      s.taken = true; // над пропастью — такую звезду не показываем
      continue;
    }
    const floor = Math.min(...below.map(b => b.y));
    const highest = floor - hero.h / 2 - jumpHeight + 20; // докуда достаёт герой
    if (s.y < highest) s.y = highest;
  }
  stars = stars.filter(s => !s.taken);

  // Убираем звёзды, которые налезают на уже оставленные
  const kept = [];
  for (const s of stars) {
    if (!kept.some(k => Math.hypot(k.x - s.x, k.y - s.y) < 30)) kept.push(s);
  }
  stars = kept;
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
    // Как и у героя: идёт вправо — зеркалим, чтобы смотрел вправо
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
  // Эмодзи-персонажи смотрят влево, поэтому зеркалим, когда герой идёт вправо
  drawEmoji(heroEmoji(), x + hero.w / 2, hero.y + hero.h / 2, 46 * squash, hero.facing > 0);
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
  // Длинный вопрос (история) — шрифт поменьше
  document.getElementById('quizQuestion').classList.toggle('long', currentQuestion.text.length > 12);
  document.getElementById('quizOptions').classList.toggle('long', currentQuestion.options.some(o => o.length > 9));
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
  const correct = isRightAnswer(currentQuestion, text);
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

// Быстрый выбор предмета прямо на экране сложности
function buildSubjectQuick() {
  const box = document.getElementById('subjectQuick');
  box.innerHTML = '';
  for (const item of SUBJECTS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'option' + (settings.subject === item.id ? ' selected' : '');
    button.innerHTML = '<span class="option-icon">' + item.icon + '</span><span class="option-title">' + item.label + '</span>';
    button.addEventListener('click', () => {
      settings.subject = item.id;
      saveSettings();
      applyTheme();
      buildSubjectQuick();
    });
    box.appendChild(button);
  }
}

function openDifficultySelect() {
  buildSubjectQuick();
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
````

<!-- SOURCES:END -->
