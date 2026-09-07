"""Test architectural purity: verify sim_engine has zero web or UI framework dependencies."""

import os
import ast
import pytest


def test_sim_engine_has_no_web_dependencies():
    """Ensure no module in sim_engine imports fastapi, starlette, or uvicorn."""
    sim_engine_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "sim_engine")
    )

    forbidden_modules = {"fastapi", "starlette", "uvicorn", "pydantic", "flask", "django"}

    for root, _, files in os.walk(sim_engine_dir):
        for file in files:
            if file.endswith(".py"):
                filepath = os.path.join(root, file)
                with open(filepath, "r", encoding="utf-8") as f:
                    tree = ast.parse(f.read(), filename=filepath)

                for node in ast.walk(tree):
                    if isinstance(node, ast.Import):
                        for alias in node.names:
                            root_pkg = alias.name.split(".")[0]
                            assert root_pkg not in forbidden_modules, (
                                f"Architectural boundary violation in {file}: forbidden import '{alias.name}'"
                            )
                    elif isinstance(node, ast.ImportFrom):
                        if node.module:
                            root_pkg = node.module.split(".")[0]
                            assert root_pkg not in forbidden_modules, (
                                f"Architectural boundary violation in {file}: forbidden import from '{node.module}'"
                            )
