from pydantic import BaseModel, model_validator


class UmaFields(BaseModel):
    uma_1st: int = 30
    uma_2nd: int = 10
    uma_3rd: int = -10
    uma_4th: int = -30

    @model_validator(mode="after")
    def validate_uma_sum(self) -> "UmaFields":
        total = self.uma_1st + self.uma_2nd + self.uma_3rd + self.uma_4th
        if total != 0:
            raise ValueError("우마 합계는 0이어야 합니다.")
        return self
