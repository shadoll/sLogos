#!/usr/bin/env python3
"""
SVG cleanup utility for worldmap.svg

This script performs a series of conservative, text-based transforms on
an SVG file to normalize path tags, strip unwanted attributes, add
data-iso attributes when possible, and pretty-print the result.

Usage:
  python3 scripts/cleanup_worldmap.py [--in-place]

By default the script does a dry run and prints a small preview. Use
--in-place to overwrite the file (a timestamped backup will be created).
"""

from pathlib import Path
import re
import sys
import argparse
import datetime
from xml.dom import minidom
from xml.parsers.expat import ExpatError
import xml.etree.ElementTree as ET
from xml.dom import Node
import json
import unicodedata

FILE_PATH = Path("public/data/worldmap.svg")
ISO_JSON = FILE_PATH.parent / "ISO3166-1.json"

def read_text(p: Path) -> str:
    """Read a text file using UTF-8 and return its contents as a string."""
    return p.read_text(encoding="utf-8")


def write_text(p: Path, s: str) -> None:
    """Write the given string to path using UTF-8 encoding."""
    p.write_text(s, encoding="utf-8")


def backup(p: Path) -> Path:
    """Create a timestamped backup of path and return the backup Path."""
    ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    bak = p.with_suffix(p.suffix + f".bak.{ts}")
    bak.write_text(p.read_text(encoding="utf-8"), encoding="utf-8")
    return bak


def validate_xml(s: str) -> (bool, str):
    """Validate that the provided string is well-formed XML using minidom.

    Returns (True, "OK") on success or (False, error_message) on failure.
    """
    try:
        minidom.parseString(s)
        return True, "OK"
    except ExpatError as e:
        return False, str(e)
    except Exception as e:
        return False, str(e)


def normalize_name(s: str) -> str:
    """Normalize a country name for loose matching.

    Removes diacritics, lowercases, replaces punctuation with spaces and
    collapses runs of whitespace.
    """
    if not s:
        return ""
    s = unicodedata.normalize("NFKD", s)
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    s = s.lower()
    s = s.replace("&", " and ")
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()

def extract_inner_svg(svg: str) -> str:
    """If the file contains a nested <svg>, extract and return the inner SVG block.

    This helps when the source file wraps the actual map inside an outer svg.
    """
    m = re.search(r"<svg\b", svg, flags=re.IGNORECASE)
    if not m:
        return svg
    first = m.start()
    m2 = re.search(r"<svg\b", svg[first + 1 :], flags=re.IGNORECASE)
    if not m2:
        return svg
    inner_open = first + 1 + m2.start()
    patt = re.compile(r"</?svg\b", flags=re.IGNORECASE)
    depth = 0
    for match in patt.finditer(svg, inner_open):
        token = match.group(0)
        if token.lower().startswith("<svg"):
            depth += 1
        else:
            depth -= 1
        if depth == 0:
            gt = svg.find('>', match.start())
            if gt == -1:
                return svg
            return svg[inner_open: gt + 1]
    return svg


def collapse_path_tags(svg: str) -> str:
    """Replace full <path>...</path> pairs with compact self-closing <path ... /> tags."""
    return re.sub(r"<path\b([^>]*)>\s*</path\s*>", r"<path\1 />", svg, flags=re.IGNORECASE | re.DOTALL)


def split_attributes_multiline(svg: str) -> str:
    """Format attributes of <path> and <g> tags so each attribute appears on its own indented line.

    This is purely for editor readability; it doesn't change element names or attribute values.
    """
    # attributes that can be very long and benefit from value-wrapping
    LONG_ATTRS = {"d", "points", "style"}
    MAX_WIDTH = 120

    attr_pair_re = re.compile(r'([A-Za-z_:][-A-Za-z0-9_:.]*)\s*=\s*"([^"]*)"', flags=re.DOTALL)

    def wrap_value(name: str, val: str) -> str:
        """Wrap long attribute values into newline-separated chunks inside the quotes.

        We break on spaces to avoid splitting tokens. Returns the wrapped value (no surrounding quotes).
        """
        if not val:
            return val
        if name not in LONG_ATTRS or len(val) <= MAX_WIDTH:
            return val
        parts = val.split()
        lines = []
        cur = []
        for p in parts:
            if cur and len(" ".join(cur + [p])) > MAX_WIDTH:
                lines.append(" ".join(cur))
                cur = [p]
            else:
                cur.append(p)
        if cur:
            lines.append(" ".join(cur))
        # indent wrapped lines with two spaces so they align under attribute
        return "\n    ".join(lines)

    def repl(m):
        tag = m.group(1)
        attrs = m.group(2) or ""
        closing = m.group(3) or ">"
        attrs = attrs.strip()
        if not attrs:
            return f"<{tag}{closing}"

        pieces = []
        for am in attr_pair_re.finditer(attrs):
            aname = am.group(1)
            aval = am.group(2)
            wval = wrap_value(aname, aval)
            if "\n" in wval:
                # keep newline inside quoted value; indent continuation lines
                piece = f'{aname}="{wval}"'
            else:
                piece = f'{aname}="{wval}"'
            pieces.append(piece)

        # keep any remaining raw text (rare) appended
        tail = attr_pair_re.sub("", attrs).strip()
        if tail:
            pieces.append(tail)

        lines = [f"<{tag}"]
        for p in pieces:
            # if the attribute value contains internal newlines, ensure it's indented properly
            if "\n" in p:
                # split first line and continuation
                idx = p.find('="')
                name = p[:idx]
                val = p[idx+2:-1]
                first, *rest = val.split('\n')
                lines.append(f"  {name}=\"{first}\"")
                for r in rest:
                    lines.append(f"  {r}")
            else:
                lines.append(f"  {p}")

        lines.append(closing)
        return "\n".join(lines)

    return re.sub(r"<(path|g)\b([^>]*)\s*(/?>)", repl, svg, flags=re.IGNORECASE | re.DOTALL)


def add_svg_attributes(svg: str) -> str:
    """Ensure the root <svg> tag has fill, stroke and stroke-width attributes.

    This updates (or inserts) only the specified attributes on the opening
    <svg ...> tag and preserves any other existing attributes.
    """
    def repl(m):
        start, attrs, end = m.group(1), m.group(2), m.group(3)
        # remove existing occurrences of these specific attributes (only on svg)
        attrs = re.sub(r"\sfill\s*=\s*\"[^\"]*\"", "", attrs, flags=re.IGNORECASE)
        attrs = re.sub(r"\sstroke\s*=\s*\"[^\"]*\"", "", attrs, flags=re.IGNORECASE)
        attrs = re.sub(r"\sstroke-width\s*=\s*\"[^\"]*\"", "", attrs, flags=re.IGNORECASE)
        attrs = re.sub(r"\s+", " ", attrs).strip()
        mid = f" {attrs}" if attrs else ""
        # add/overwrite desired attributes
        return f"{start}{mid} fill=\"#fff\" stroke=\"#000\" stroke-width=\"0.2\"{end}"

    return re.sub(r"(<svg\b)([^>]*?)(/?>)", repl, svg, flags=re.IGNORECASE | re.DOTALL)


def collapse_newlines_after_svg(svg: str) -> str:
    """Ensure there is exactly one newline immediately after the opening <svg> tag.

    This prevents the script from accumulating blank lines between the
    opening <svg> and the first child element across multiple runs.
    """
    pattern = re.compile(r'(<svg\b[^>]*>)\s*\n+', flags=re.IGNORECASE)
    return pattern.sub(r'\1\n', svg, count=1)


def strip_whitespace_text_nodes(node):
    """Recursively remove text nodes that contain only whitespace from a DOM node.

    This reduces extra blank lines produced by minidom.toprettyxml when
    the source contains whitespace-only text nodes between elements.
    """
    for child in list(node.childNodes):
        if child.nodeType == Node.TEXT_NODE:
            if not child.data.strip():
                node.removeChild(child)
            continue
        if child.hasChildNodes():
            strip_whitespace_text_nodes(child)


def remove_defs(svg: str) -> str:
    """Remove any <defs>...</defs> blocks from the SVG (case-insensitive)."""
    return re.sub(r"<defs\b[^>]*>.*?</defs\s*>", "", svg, flags=re.IGNORECASE | re.DOTALL)


def remove_data_geo(svg: str) -> str:
    # only operate on path and g opening tags
    def repl(m):
        """Replace function used to strip data-geo* attributes from a tag match."""
        start, attrs, end = m.group(1), m.group(2), m.group(3)
        attrs2 = re.sub(r"\sdata-geo[-\w]*\s*=\s*\"[^\"]*\"", "", attrs, flags=re.IGNORECASE)
        attrs2 = re.sub(r"\s+", " ", attrs2).strip()
        return f"{start} {attrs2}{end}" if attrs2 else f"{start}{end}"
    return re.sub(r"(<(?:path|g)\b)([^>]*?)(/?>)", repl, svg, flags=re.IGNORECASE | re.DOTALL)


def remove_original_strokewidth(svg: str) -> str:
    """Remove data-originalStrokeWidth attributes from the SVG text."""
    return re.sub(r"\sdata-originalStrokeWidth\s*=\s*\"[^\"]*\"", "", svg, flags=re.IGNORECASE)


def uppercase_data_iso(svg: str) -> str:
    """Uppercase all data-iso attribute values for consistency."""
    return re.sub(r'data-iso\s*=\s*"([^\"]*)"', lambda m: f'data-iso="{m.group(1).strip().upper()}"', svg, flags=re.IGNORECASE)


def clear_fill_stroke(svg: str) -> str:
    """Remove inline fill, stroke, stroke-width and filter/style entries from path/g tags."""
    def repl(m):
        start, attrs, end = m.group(1), m.group(2), m.group(3)
        # remove explicit attributes
        attrs = re.sub(r"\s(?:fill|stroke|stroke-width)\s*=\s*\"[^\"]*\"", "", attrs, flags=re.IGNORECASE)
        # strip fill/stroke/filter from style
        def style_repl(mm):
            """Clean style attribute content by removing fill/stroke/filter entries."""
            style = mm.group(1)
            props = [p.strip() for p in style.split(";") if p.strip()]
            keep = [p for p in props if p.split(":", 1)[0].strip().lower() not in ("fill", "stroke", "filter", "stroke-width")]
            if not keep:
                return ""
            return f'style="{";".join(keep)}"'
        attrs = re.sub(r'style\s*=\s*"([^"]*)"', style_repl, attrs, flags=re.IGNORECASE)
        attrs = re.sub(r"\s+", " ", attrs).strip()
        return f"{start} {attrs}{end}" if attrs else f"{start}{end}"
    return re.sub(r"(<(?:path|g)\b)([^>]*?)(/?>)", repl, svg, flags=re.IGNORECASE | re.DOTALL)


def remove_empty_groups(svg: str) -> str:
    """Remove empty <g>...</g> groups from the SVG to tidy the markup."""
    return re.sub(r"<g\b([^>]*)>\s*</g>", "", svg, flags=re.IGNORECASE | re.DOTALL)


def add_data_iso(svg: str, iso_path: Path) -> str:
    """Try to infer and add data-iso attributes using an ISO JSON mapping.

    Looks at id, name, data-name attributes or inner <title> to guess a country
    name and maps it to an ISO alpha-2 code using the provided JSON.
    """
    if not iso_path.exists():
        return svg
    try:
        with iso_path.open(encoding="utf-8") as fh:
            mapping = json.load(fh)
    except Exception:
        return svg
    norm_map = { normalize_name(v): k.upper() for k, v in mapping.items() if v }

    # Prefer an XML-aware edit: parse and modify elements, then serialize.
    try:
        root = ET.fromstring(svg)
        # detect and register default namespace if present so ET doesn't
        # emit ns0 prefixes when serializing
        ns_uri = None
        if isinstance(root.tag, str) and root.tag.startswith('{'):
            ns_uri = root.tag.split('}')[0].strip('{')
        elif 'xmlns' in root.attrib:
            ns_uri = root.attrib.get('xmlns')
        if ns_uri:
            ET.register_namespace('', ns_uri)

        # iterate over all elements and handle local tag names (ignore namespace)
        for elem in root.iter():
            tag = elem.tag
            local = tag.split('}', 1)[1] if '}' in tag else tag
            if local not in ('path', 'g'):
                continue
            if 'data-iso' in elem.attrib:
                continue
            # candidate sources
            cand = elem.get('id') or elem.get('name') or elem.get('data-name')
            if not cand:
                title = None
                for child in elem:
                    ctag = child.tag
                    c_local = ctag.split('}', 1)[1] if '}' in ctag else ctag
                    if c_local == 'title' and child.text:
                        title = child.text
                        break
                cand = title
            if not cand:
                continue
            code = norm_map.get(normalize_name(cand))
            if code:
                elem.set('data-iso', code)

        # serialize back to a string; namespace registration prevents ns0 prefixes
        return ET.tostring(root, encoding='unicode')
    except Exception:
        # fallback: keep the original regex-based approach (conservative)
        # non-self-closing
        def repl_pair(m):
            start, attrs, inner = m.group(1), m.group(2), m.group(3)
            if re.search(r'data-iso\s*=\s*"[^\"]*"', attrs, flags=re.IGNORECASE):
                return m.group(0)
            cand = None
            for pat in (r'id\s*=\s*"([^\"]*)"', r'name\s*=\s*"([^\"]*)"', r'data-name\s*=\s*"([^\"]*)"'):
                mm = re.search(pat, attrs, flags=re.IGNORECASE)
                if mm:
                    cand = mm.group(1)
                    break
            if not cand:
                t = re.search(r"<title>(.*?)</title>", inner, flags=re.IGNORECASE | re.DOTALL)
                if t:
                    cand = t.group(1)
            if not cand:
                return m.group(0)
            code = norm_map.get(normalize_name(cand))
            if not code:
                return m.group(0)
            tag = start[1:]
            attrs_str = attrs.strip()
            mid = f" {attrs_str}" if attrs_str else ""
            return f"{start}{mid} data-iso=\"{code}\">{inner}</{tag}>"

        svg = re.sub(r"(<(?:path|g)\b)([^>]*?)>(.*?)</(?:path|g)\s*>", repl_pair, svg, flags=re.IGNORECASE | re.DOTALL)

        # self-closing
        def repl_self(m):
            start, attrs, tail = m.group(1), m.group(2), m.group(3)
            if re.search(r'data-iso\s*=\s*"[^\"]*"', attrs, flags=re.IGNORECASE):
                return m.group(0)
            cand = None
            for pat in (r'id\s*=\s*"([^\"]*)"', r'name\s*=\s*"([^\"]*)"', r'data-name\s*=\s*"([^\"]*)"'):
                mm = re.search(pat, attrs, flags=re.IGNORECASE)
                if mm:
                    cand = mm.group(1)
                    break
            if not cand:
                return m.group(0)
            code = norm_map.get(normalize_name(cand))
            if not code:
                return m.group(0)
            attrs_str = attrs.strip()
            mid = f" {attrs_str}" if attrs_str else ""
            return f"{start}{mid} data-iso=\"{code}\"{tail}"

        svg = re.sub(r"(<(?:path|g)\b)([^>]*?)(/>)", repl_self, svg, flags=re.IGNORECASE | re.DOTALL)
        return svg

# ---------------------- main flow ----------------------

def main(argv=None):
    """CLI entrypoint: parse arguments, run the pipeline and optionally write the file."""
    parser = argparse.ArgumentParser()
    parser.add_argument("--in-place", action="store_true")
    parser.add_argument("--file", type=Path, default=FILE_PATH)
    args = parser.parse_args(argv)

    svg_path = args.file
    if not svg_path.exists():
        print("SVG not found:", svg_path)
        return 2

    original = read_text(svg_path)

    # extract text blocks to protect them
    text_blocks = []
    def extract_text(s):
        """Extract <text>...</text> blocks and replace them with unique markers."""
        nonlocal text_blocks
        pat = re.compile(r"(<text\b[^>]*>.*?</text\s*>)", flags=re.IGNORECASE | re.DOTALL)
        def r(m):
            idx = len(text_blocks)
            text_blocks.append(m.group(1))
            return f"<!--__TEXT_BLOCK_{idx}__-->"
        return pat.sub(r, s)

    def restore_text(s):
        """Restore previously extracted <text> blocks back into the SVG string."""
        for i, b in enumerate(text_blocks):
            s = s.replace(f"<!--__TEXT_BLOCK_{i}__-->", b)
        return s

    svg = extract_text(original)

    steps = [
        (extract_inner_svg, "extract_inner_svg"),
        (add_svg_attributes, "add_svg_attributes"),
    (collapse_path_tags, "collapse_path_tags"),
        (remove_defs, "remove_defs"),
        (lambda s: add_data_iso(s, ISO_JSON), "add_data_iso"),
        (remove_data_geo, "remove_data_geo"),
        (remove_original_strokewidth, "remove_original_strokewidth"),
        (uppercase_data_iso, "uppercase_data_iso"),
        (clear_fill_stroke, "clear_fill_stroke"),
        (remove_empty_groups, "remove_empty_groups"),
        (lambda s: s, "noop_compact"),
    ]

    last_good = svg
    for func, name in steps:
        print(f"[stage] {name}")
        try:
            svg = func(svg)
        except Exception as e:
            print(f"ERROR in {name}: {e}")
            svg = last_good
            break
        ok, msg = validate_xml(svg)
        if not ok:
            print(f"Invalid XML after {name}: {msg}")
            svg = last_good
            break
        last_good = svg

    # pretty print
    print("[stage] pretty_format")
    try:
        dom = minidom.parseString(svg)
        # remove whitespace-only text nodes to avoid accumulating blank lines
        strip_whitespace_text_nodes(dom)
        pretty = dom.toprettyxml(indent="  ")
        # remove xml decl if present
        if pretty.startswith("<?xml"):
            pretty = "\n".join(pretty.splitlines()[1:]) + "\n"
        svg_out = pretty
    except Exception:
        svg_out = svg

    # restore text blocks after pretty-format so their internal formatting
    # is preserved and not mangled by the DOM pass.
    svg_out = restore_text(svg_out)

    if args.in_place:
        bak = backup(svg_path)
        write_text(svg_path, svg_out)
        print(f"Wrote {svg_path} (backup: {bak})")
    else:
        print("Dry run - changes ready. Preview (head):\n")
        print(svg_out[:2000])

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
