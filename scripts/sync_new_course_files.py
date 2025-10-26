#!/usr/bin/env python3
"""Compare new course resources with existing library, then categorize and copy uniques.

This script scans `new_files/` for assets whose content does not yet exist in
`files/课程Course/`. It infers the target course and category from the filename
metadata (``<title>__<course_aliases>__.<ext>``), creates folders on demand, and
copies each unique file into the right location while avoiding duplicates.
"""
from __future__ import annotations

import hashlib
import re
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

# Repository root is two levels up from this script (scripts/).
REPO_ROOT = Path(__file__).resolve().parents[1]
COURSE_ROOT = REPO_ROOT / "files" / "课程Course"
SOURCE_DIR = REPO_ROOT / "new_files"

# Chunk size for hashing / copying streams (8 MiB).
CHUNK_SIZE = 8 * 1024 * 1024


@dataclass
class FileMeta:
    path: Path
    title: str
    meta_tokens: Sequence[str]


def iter_files(root: Path) -> Iterable[Path]:
    for path in sorted(root.rglob("*")):
        if path.is_file():
            yield path


def sha256_of(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(CHUNK_SIZE), b""):
            h.update(chunk)
    return h.hexdigest()


def normalize(text: str) -> str:
    return re.sub(r"\s+", "", text).lower()


# Course alias map. `category` is optional category override when metadata short-names
# imply a more specific placement (e.g., physics lab resources always go to 实验).
COURSE_ALIASES_RAW: Dict[str, Tuple[str, Optional[str]]] = {
    "马原": ("马克思主义基本原理", None),
    "马克思主义基本原理": ("马克思主义基本原理", None),
    "大物": ("大学物理", None),
    "大学物理": ("大学物理", None),
    "大学物理实验": ("大学物理", "实验"),
    "大物实验": ("大学物理", "实验"),
    "电机实验": ("电机实验", "实验"),
    "电机": ("电机实验", "实验"),
    "航概": ("航空航天概论", None),
    "航空航天概论": ("航空航天概论", None),
    "航空航天专业导论": ("航空航天类专业导论", None),
    "航空航天类专业导论": ("航空航天类专业导论", None),
    "概率论": ("概率论与数理统计", None),
    "概率论与数理统计": ("概率论与数理统计", None),
    "工图": ("工程图学", None),
    "工程图学": ("工程图学", None),
    "工数": ("工科数学分析", None),
    "工科数学分析": ("工科数学分析", None),
    "线代": ("线性代数", None),
    "线性代数": ("线性代数", None),
    "计组": ("计算机组成原理", None),
    "计算机组成原理": ("计算机组成原理", None),
    "计软基础": ("计算机软件技术基础", None),
    "计算机软件基础": ("计算机软件技术基础", None),
    "计算机软件技术基础": ("计算机软件技术基础", None),
    "数电": ("数字电路与逻辑设计", None),
    "数字电路与逻辑设计": ("数字电路与逻辑设计", None),
    "机械原理课程设计": ("机械原理", "课设"),
    "机械原理": ("机械原理", None),
    "plc": ("PLC", None),
    "PLC": ("PLC", None),
    "DSP": ("DSP实用技术", None),
    "dsp": ("DSP实用技术", None),
    "DSP实用技术": ("DSP实用技术", None),
    "模电": ("现代电子技术基础（模拟部分）", None),
    "现代电子技术基础（模拟部分）": ("现代电子技术基础（模拟部分）", None),
    "入党积极分子": ("入党积极分子", None),
    "金工实习": ("金工实习", None),
}

COURSE_ALIASES: Dict[str, Tuple[str, Optional[str]]] = {
    normalize(key): value for key, value in COURSE_ALIASES_RAW.items()
}

# Category inference rules ordered by specificity.
CATEGORY_RULES: List[Tuple[re.Pattern[str], str]] = [
    (re.compile(r"答案|解答|解析|详解", re.IGNORECASE), "答案"),
    (re.compile(r"实验|实验报告|平台安装测试|变频器|实验指导", re.IGNORECASE), "实验"),
    (re.compile(r"课程设计|课设", re.IGNORECASE), "课设"),
    (re.compile(r"题库|练习|练习册|练习题|选择题|辨析题", re.IGNORECASE), "题库"),
    (re.compile(r"作业", re.IGNORECASE), "作业"),
    (re.compile(r"试卷|试题|期中|期末|考试|考题|A卷|B卷|AB卷", re.IGNORECASE), "试卷"),
    (re.compile(r"教材|知识点|重点|笔记|提纲|指南|复习|总结|资料|精编|提纲|课程导论", re.IGNORECASE), "资料"),
]
DEFAULT_CATEGORY = "资料"


class CourseLibrary:
    def __init__(self, course_root: Path) -> None:
        self.course_root = course_root
        self._refresh_existing_courses()

    def _refresh_existing_courses(self) -> None:
        self.existing_courses: Dict[str, Path] = {
            normalize(child.name): child
            for child in self.course_root.iterdir()
            if child.is_dir()
        }

    def resolve_course(self, tokens: Sequence[str]) -> Tuple[str, Path, Optional[str]]:
        """Return (course_name, course_dir, alias_category_hint)."""
        alias_category: Optional[str] = None
        for token in tokens:
            token = token.strip()
            if not token:
                continue
            normalized = normalize(token)
            alias = COURSE_ALIASES.get(normalized)
            if alias:
                course_name, category_hint = alias
                course_dir = self._ensure_course_dir(course_name)
                alias_category = category_hint
                return course_name, course_dir, alias_category
            if normalized in self.existing_courses:
                course_dir = self.existing_courses[normalized]
                return course_dir.name, course_dir, None
        # No direct match; fall back to first meaningful token or default "未分类课程".
        fallback = tokens[0].strip() if tokens else "未分类课程"
        course_dir = self._ensure_course_dir(fallback)
        return course_dir.name, course_dir, None

    def _ensure_course_dir(self, course_name: str) -> Path:
        normalized = normalize(course_name)
        if normalized in self.existing_courses:
            return self.existing_courses[normalized]
        # Create new course directory when missing.
        new_dir = self.course_root / course_name
        new_dir.mkdir(parents=True, exist_ok=True)
        self.existing_courses[normalized] = new_dir
        return new_dir


def parse_metadata(path: Path) -> FileMeta:
    stem = path.stem
    if stem.endswith("__"):
        stem = stem[:-2]
    title, meta = (stem, "")
    if "__" in stem:
        title, meta = stem.split("__", 1)
    meta_tokens = [token for token in meta.split("_") if token]
    return FileMeta(path=path, title=title.strip(), meta_tokens=meta_tokens)


def resolve_category(title: str, tokens: Sequence[str], alias_hint: Optional[str]) -> str:
    if alias_hint:
        return alias_hint
    haystacks = [title] + list(tokens)
    for pattern, category in CATEGORY_RULES:
        for text in haystacks:
            if pattern.search(text):
                return category
    # Year-based heuristic: if the title references a specific year and lacks
    # explicit study-material keywords, treat it as an exam paper.
    if re.search(r"(19|20)\d{2}", title):
        if not re.search(r"答案|解答|解析|详解|知识点|笔记|提纲|指南|资料|复习|题库|练习|作业", title):
            return "试卷"
    return DEFAULT_CATEGORY


def safe_copy(src: Path, dest: Path) -> Tuple[Path, bool]:
    dest_parent = dest.parent
    dest_parent.mkdir(parents=True, exist_ok=True)
    candidate = dest
    counter = 1
    renamed = False
    while candidate.exists():
        if sha256_of(candidate) == sha256_of(src):
            # Identical content already exists at the destination filename.
            return candidate, renamed
        candidate = dest_parent / f"{dest.stem}_{counter}{dest.suffix}"
        counter += 1
        renamed = True
    shutil.copy2(src, candidate)
    return candidate, renamed


def main() -> int:
    if not COURSE_ROOT.exists():
        print(f"Course root missing: {COURSE_ROOT}")
        return 1
    if not SOURCE_DIR.exists():
        print(f"Source dir missing: {SOURCE_DIR}")
        return 1

    library = CourseLibrary(COURSE_ROOT)

    existing_hashes: Dict[str, List[Path]] = {}
    for existing in iter_files(COURSE_ROOT):
        digest = sha256_of(existing)
        existing_hashes.setdefault(digest, []).append(existing)

    total = 0
    skipped = 0
    copied = 0
    renamed_count = 0

    for src in iter_files(SOURCE_DIR):
        total += 1
        digest = sha256_of(src)
        if digest in existing_hashes:
            skipped += 1
            print(f"SKIP duplicate: {src.name}")
            continue
        meta = parse_metadata(src)
        course_name, course_dir, alias_hint = library.resolve_course(meta.meta_tokens)
        category = resolve_category(meta.title, meta.meta_tokens, alias_hint)
        dest_dir = course_dir / category
        dest_file = dest_dir / f"{meta.title}{src.suffix}"
        final_path, renamed = safe_copy(src, dest_file)
        copied += 1
        if renamed:
            renamed_count += 1
        existing_hashes.setdefault(digest, []).append(final_path)
        print(f"COPIED: {src.name} -> {final_path.relative_to(COURSE_ROOT)}")

    print("\nSummary")
    print("-------")
    print(f"Processed: {total}")
    print(f"Copied:    {copied}")
    print(f"Duplicates skipped: {skipped}")
    if renamed_count:
        print(f"Renamed due to existing names: {renamed_count}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
