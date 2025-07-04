from typing import List, Optional
from ..models.client import Client
from ..utils.singleton import Singleton

class ClientManager(metaclass=Singleton):
    def __init__(self):
        self.clients: List[Client] = []

    def add_client(self, client: Client):
        self.clients.append(client)

    def get_clients(self) -> List[Client]:
        return self.clients

    def set_clients(self, clients: List[Client]):
        self.clients = clients

    def get_client_by_id(self, client_id: str) -> Optional[Client]:
        return next((c for c in self.clients if c.id == client_id), None)

    def update_client(self, client: Client):
        for i, c in enumerate(self.clients):
            if c.id == client.id:
                self.clients[i] = client
                break

    def remove_client(self, client_id: str):
        self.clients = [c for c in self.clients if c.id != client_id]
