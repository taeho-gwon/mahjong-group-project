from datetime import datetime

from pydantic import BaseModel


class AnnouncementResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    title: str
    content: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
