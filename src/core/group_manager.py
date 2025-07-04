from typing import List, Optional
from ..models.group import Group
from ..utils.singleton import Singleton

class GroupManager(metaclass=Singleton):
    def __init__(self):
        self.groups: List[Group] = []

    def add_group(self, group: Group):
        self.groups.append(group)

    def get_groups(self) -> List[Group]:
        return self.groups

    def set_groups(self, groups: List[Group]):
        self.groups = groups

    def get_group_by_id(self, group_id: str) -> Optional[Group]:
        return next((g for g in self.groups if g.id == group_id), None)

    def update_group(self, group: Group):
        for i, g in enumerate(self.groups):
            if g.id == group.id:
                self.groups[i] = group
                break

    def remove_group(self, group_id: str):
        self.groups = [g for g in self.groups if g.id != group_id]

    def add_client_to_group(self, group_id: str, client_id: str):
        group = self.get_group_by_id(group_id)
        if group and client_id not in group.client_ids:
            group.client_ids.append(client_id)

    def remove_client_from_group(self, group_id: str, client_id: str):
        group = self.get_group_by_id(group_id)
        if group and client_id in group.client_ids:
            group.client_ids.remove(client_id)
