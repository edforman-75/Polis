import pathlib
def press_release_schema_path() -> str:
    return str(pathlib.Path(__file__).with_name("press_release.schema.json"))
