import os
from typing import List, Dict
from docx import Document
from PyPDF2 import PdfReader


def load_text_from_file(file_path: str) -> str:
    """Đọc nội dung text từ 1 file .txt / .docx / .pdf"""
    ext = os.path.splitext(file_path)[1].lower()
    text = ""

    try:
        if ext == ".txt":
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()

        elif ext == ".docx":
            doc = Document(file_path)
            text = "\n".join([p.text for p in doc.paragraphs])

        elif ext == ".pdf":
            reader = PdfReader(file_path)
            for page in reader.pages:
                text += page.extract_text() or ""

    except Exception as e:
        print(f"⚠️ Error reading {file_path}: {e}")

    return text.strip()


def load_all_texts(folder_path: str) -> List[str]:
    """
    Đọc toàn bộ file .txt / .docx / .pdf trong thư mục data_training
    và trả về list[str] để huấn luyện.
    """
    if not os.path.exists(folder_path):
        raise FileNotFoundError(f"❌ Folder not found: {folder_path}")

    texts = []
    for root, _, files in os.walk(folder_path):
        for filename in files:
            ext = os.path.splitext(filename)[1].lower()
            if ext not in (".txt", ".docx", ".pdf"):
                continue

            file_path = os.path.join(root, filename)
            content = load_text_from_file(file_path)

            if len(content) > 30:  # bỏ file quá ngắn
                texts.append(content)

    print(f"📚 Loaded {len(texts)} text documents from {folder_path}")
    return texts


def load_all_data_from_folder(folder: str) -> List[Dict[str, str]]:
    """
    Đọc tất cả .txt / .docx / .pdf trong folder.
    Trả về list[dict]: [{ 'text': ..., 'summary': ... }]
    """
    if not os.path.exists(folder):
        print(f"⚠️ Folder not found: {folder}")
        return []

    data = []
    for fname in os.listdir(folder):
        fpath = os.path.join(folder, fname)
        if not os.path.isfile(fpath) or not fname.lower().endswith((".txt", ".docx", ".pdf")):
            continue

        content = load_text_from_file(fpath)
        if len(content) < 50:
            continue

        data.append({
            "text": content,
            "summary": content[:400]  # summary tạm
        })

    print(f"📂 Loaded {len(data)} structured documents from {folder}")
    return data
