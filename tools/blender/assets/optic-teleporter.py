"""Build and review teleporter."""
from pathlib import Path
from runpy import run_path

if __name__ == "__main__":
    catalog = Path(__file__).resolve().parents[1] / "optical_catalog.py"
    run_path(str(catalog))["produce"]("teleporter")
