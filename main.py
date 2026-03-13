from pathlib import Path
import sys


BACKEND_DIR = Path(__file__).resolve().parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    # Allow repo-root launches such as `uvicorn main:app --reload`.
    sys.path.insert(0, str(BACKEND_DIR))

from app.main import app
