import json
from pathlib import Path
from typing import Dict, Any

class ConfigManager:
    def __init__(self, config_path: Path):
        self.config_path = config_path
        self.config = self.load_config()

    def load_config(self) -> Dict[str, Any]:
        """Loads the configuration file."""
        if self.config_path.exists():
            with open(self.config_path, 'r') as f:
                return json.load(f)
        return {}

    def save_config(self):
        """Saves the configuration file."""
        with open(self.config_path, 'w') as f:
            json.dump(self.config, f, indent=2)

    def get(self, key: str, default: Any = None) -> Any:
        """Gets a configuration value."""
        return self.config.get(key, default)

    def set(self, key: str, value: Any):
        """Sets a configuration value."""
        self.config[key] = value
