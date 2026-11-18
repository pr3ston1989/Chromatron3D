"""Build and review garden-terrace."""
from pathlib import Path
from runpy import run_path

if __name__ == "__main__":
    catalog = Path(__file__).resolve().parents[1] / "scenery_catalog.py"
    run_path(str(catalog))["produce"]("garden-terrace")
