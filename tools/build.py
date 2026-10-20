"""Собирает служебные файлы из исходников игры.

Запускать из папки игры после ЛЮБОГО изменения index.html, style.css или script.js:

    python tools/build.py

Что делает:
1. PROMPT.md — заменяет всё между метками SOURCES:START и SOURCES:END
   актуальным кодом, чтобы исходники в промте совпадали с файлами игры.
2. codepen/index.pen.html — вырезает из index.html часть для CodePen
   (без <head>, <link> и <script src>: CodePen подключает style.css
   и script.js сам, иначе скрипт загрузится дважды).
"""
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')  # русский текст в консоли Windows

ROOT = Path(__file__).resolve().parent.parent
PROMPT = ROOT / 'PROMPT.md'
CODEPEN_HTML = ROOT / 'codepen' / 'index.pen.html'
START = '<!-- SOURCES:START -->'
END = '<!-- SOURCES:END -->'

# Метки в index.html, между которыми лежит часть для CodePen
CODEPEN_START = '↓↓↓ Для CodePen'
CODEPEN_END = '↑↑↑ Для CodePen'

# Файл и язык для подсветки в markdown
FILES = [
    ('index.html', 'html'),
    ('style.css', 'css'),
    ('script.js', 'javascript'),
]


def read(name):
    return (ROOT / name).read_text(encoding='utf-8').replace('\r\n', '\n')


def build_sources():
    parts = [START, '', '<!-- Этот раздел создаётся скриптом tools/build.py — не редактируйте вручную -->', '']
    for name, lang in FILES:
        code = read(name).rstrip('\n')
        if '````' in code:
            raise SystemExit(f'{name}: в коде есть ````, блок markdown сломается')
        parts += [f'### `{name}`', '', f'````{lang}', code, '````', '']
    parts.append(END)
    return '\n'.join(parts)


def build_prompt():
    text = PROMPT.read_text(encoding='utf-8').replace('\r\n', '\n')
    if START not in text or END not in text:
        raise SystemExit('В PROMPT.md нет меток SOURCES:START / SOURCES:END')
    before = text.split(START)[0]
    after = text.split(END, 1)[1]
    PROMPT.write_text(before + build_sources() + after, encoding='utf-8', newline='\n')
    print('PROMPT.md: исходники обновлены')


def build_codepen():
    lines = read('index.html').split('\n')
    start = next(i for i, line in enumerate(lines) if CODEPEN_START in line)
    end = next(i for i, line in enumerate(lines) if CODEPEN_END in line)
    # Начальная метка — многострочный комментарий: пропускаем его до -->
    while '-->' not in lines[start]:
        start += 1
    body = '\n'.join(lines[start + 1:end]).strip('\n')
    if '<script' in body or '<link' in body:
        raise SystemExit('Часть для CodePen не должна содержать <script> или <link>')

    header = (
        '<!-- Файл для CodePen: вставьте его ЦЕЛИКОМ в index.pen.html (или в окно HTML).\n'
        '     style.css и script.js CodePen подключит сам.\n'
        '     Файл создаётся скриптом tools/build.py из index.html — не редактируйте вручную. -->\n'
    )
    CODEPEN_HTML.parent.mkdir(exist_ok=True)
    CODEPEN_HTML.write_text(header + '\n' + body + '\n', encoding='utf-8', newline='\n')
    print('codepen/index.pen.html: обновлён')


if __name__ == '__main__':
    build_prompt()
    build_codepen()
