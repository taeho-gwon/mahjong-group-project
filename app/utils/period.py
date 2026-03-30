"""Period range calculation for ranking filters.

Mirrors the frontend getPeriodRange logic
(frontend/src/pages/GroupRankingPage.tsx).
"""

from __future__ import annotations

from datetime import UTC, date, datetime, time, timedelta
from typing import Literal

PeriodType = Literal["daily", "weekly", "monthly", "all"]


def get_period_range(
    period: PeriodType,
    offset: int = 0,
    weekly_start_day: int = 0,
    monthly_start_day: int = 1,
) -> tuple[datetime, datetime] | None:
    """Return (start, end) datetimes for the given period, or None for 'all'.

    All returned datetimes are timezone-aware (UTC).

    Args:
        period: One of 'daily', 'weekly', 'monthly', 'all'.
        offset: Period offset (0 = current, -1 = previous, etc.).
        weekly_start_day: 0=Monday .. 6=Sunday (ISO weekday - 1).
        monthly_start_day: Day of month when monthly period starts (1-28).

    Returns:
        Tuple of (start_inclusive, end_exclusive) or None for 'all'.
    """
    if period == "all":
        return None

    today = date.today()

    if period == "daily":
        start = today + timedelta(days=offset)
        end = start + timedelta(days=1)

    elif period == "weekly":
        # today.weekday(): 0=Monday .. 6=Sunday (matches our convention)
        current_weekday = today.weekday()
        diff = current_weekday - weekly_start_day
        if diff < 0:
            diff += 7
        start = today - timedelta(days=diff) + timedelta(weeks=offset)
        end = start + timedelta(days=7)

    elif period == "monthly":
        year = today.year
        month = today.month
        day = today.day

        if day >= monthly_start_day:
            base_month = month
        else:
            base_month = month - 1

        # Calculate start: base_month + offset
        total_month = (year - 1) * 12 + (base_month - 1) + offset
        start_year = total_month // 12 + 1
        start_month = total_month % 12 + 1
        start = date(start_year, start_month, monthly_start_day)

        # Calculate end: base_month + offset + 1
        total_month_end = total_month + 1
        end_year = total_month_end // 12 + 1
        end_month = total_month_end % 12 + 1
        end = date(end_year, end_month, monthly_start_day)

    else:
        return None

    return (
        datetime.combine(start, time.min, tzinfo=UTC),
        datetime.combine(end, time.min, tzinfo=UTC),
    )
