from config import get_settings


def current_environment() -> str:
    """Return the current application environment string.

    Sources the singleton Settings via get_settings().
    """
    return get_settings().environment


def is_production(env: str | None = None) -> bool:
    """True if the effective environment represents production.

    Args:
        env: Optional explicit environment string. When omitted, reads from
             the global Settings instance.
    """
    value = env if env is not None else current_environment()
    return str(value).strip().lower() == "production"
