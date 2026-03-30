"""Unit tests for app.utils.period.get_period_range."""

from datetime import UTC, date, datetime, time
from unittest.mock import patch

from app.utils.period import get_period_range


def _utc(d: date) -> datetime:
    return datetime.combine(d, time.min, tzinfo=UTC)


class TestPeriodAll:
    def test_all_returns_none(self) -> None:
        assert get_period_range("all") is None

    def test_all_with_offset_returns_none(self) -> None:
        assert get_period_range("all", offset=-3) is None


class TestPeriodDaily:
    @patch("app.utils.period.date")
    def test_today(self, mock_date) -> None:
        mock_date.today.return_value = date(2026, 3, 30)
        mock_date.side_effect = lambda *a, **kw: date(*a, **kw)

        result = get_period_range("daily", offset=0)
        assert result is not None
        start, end = result
        assert start == _utc(date(2026, 3, 30))
        assert end == _utc(date(2026, 3, 31))

    @patch("app.utils.period.date")
    def test_yesterday(self, mock_date) -> None:
        mock_date.today.return_value = date(2026, 3, 30)
        mock_date.side_effect = lambda *a, **kw: date(*a, **kw)

        result = get_period_range("daily", offset=-1)
        assert result is not None
        start, end = result
        assert start == _utc(date(2026, 3, 29))
        assert end == _utc(date(2026, 3, 30))

    @patch("app.utils.period.date")
    def test_tomorrow(self, mock_date) -> None:
        mock_date.today.return_value = date(2026, 3, 30)
        mock_date.side_effect = lambda *a, **kw: date(*a, **kw)

        result = get_period_range("daily", offset=1)
        assert result is not None
        start, end = result
        assert start == _utc(date(2026, 3, 31))
        assert end == _utc(date(2026, 4, 1))


class TestPeriodWeekly:
    @patch("app.utils.period.date")
    def test_monday_start_on_monday(self, mock_date) -> None:
        """2026-03-30 is a Monday. weekly_start_day=0 (Monday)."""
        mock_date.today.return_value = date(2026, 3, 30)
        mock_date.side_effect = lambda *a, **kw: date(*a, **kw)

        result = get_period_range("weekly", offset=0, weekly_start_day=0)
        assert result is not None
        start, end = result
        assert start == _utc(date(2026, 3, 30))  # Monday
        assert end == _utc(date(2026, 4, 6))  # Next Monday

    @patch("app.utils.period.date")
    def test_monday_start_on_wednesday(self, mock_date) -> None:
        """2026-04-01 is a Wednesday. weekly_start_day=0 (Monday)."""
        mock_date.today.return_value = date(2026, 4, 1)
        mock_date.side_effect = lambda *a, **kw: date(*a, **kw)

        result = get_period_range("weekly", offset=0, weekly_start_day=0)
        assert result is not None
        start, end = result
        assert start == _utc(date(2026, 3, 30))  # Previous Monday
        assert end == _utc(date(2026, 4, 6))

    @patch("app.utils.period.date")
    def test_sunday_start(self, mock_date) -> None:
        """2026-03-30 is Monday. weekly_start_day=6 (Sunday)."""
        mock_date.today.return_value = date(2026, 3, 30)
        mock_date.side_effect = lambda *a, **kw: date(*a, **kw)

        result = get_period_range("weekly", offset=0, weekly_start_day=6)
        assert result is not None
        start, end = result
        assert start == _utc(date(2026, 3, 29))  # Previous Sunday
        assert end == _utc(date(2026, 4, 5))

    @patch("app.utils.period.date")
    def test_previous_week(self, mock_date) -> None:
        mock_date.today.return_value = date(2026, 3, 30)
        mock_date.side_effect = lambda *a, **kw: date(*a, **kw)

        result = get_period_range("weekly", offset=-1, weekly_start_day=0)
        assert result is not None
        start, end = result
        assert start == _utc(date(2026, 3, 23))
        assert end == _utc(date(2026, 3, 30))


class TestPeriodMonthly:
    @patch("app.utils.period.date")
    def test_start_day_1_mid_month(self, mock_date) -> None:
        """Day 15 >= start_day 1, so base_month = current month."""
        mock_date.today.return_value = date(2026, 3, 15)
        mock_date.side_effect = lambda *a, **kw: date(*a, **kw)

        result = get_period_range("monthly", offset=0, monthly_start_day=1)
        assert result is not None
        start, end = result
        assert start == _utc(date(2026, 3, 1))
        assert end == _utc(date(2026, 4, 1))

    @patch("app.utils.period.date")
    def test_start_day_15_before_start(self, mock_date) -> None:
        """Day 10 < start_day 15, so base_month = previous month."""
        mock_date.today.return_value = date(2026, 3, 10)
        mock_date.side_effect = lambda *a, **kw: date(*a, **kw)

        result = get_period_range("monthly", offset=0, monthly_start_day=15)
        assert result is not None
        start, end = result
        assert start == _utc(date(2026, 2, 15))
        assert end == _utc(date(2026, 3, 15))

    @patch("app.utils.period.date")
    def test_start_day_15_after_start(self, mock_date) -> None:
        """Day 20 >= start_day 15, so base_month = current month."""
        mock_date.today.return_value = date(2026, 3, 20)
        mock_date.side_effect = lambda *a, **kw: date(*a, **kw)

        result = get_period_range("monthly", offset=0, monthly_start_day=15)
        assert result is not None
        start, end = result
        assert start == _utc(date(2026, 3, 15))
        assert end == _utc(date(2026, 4, 15))

    @patch("app.utils.period.date")
    def test_previous_month(self, mock_date) -> None:
        mock_date.today.return_value = date(2026, 3, 15)
        mock_date.side_effect = lambda *a, **kw: date(*a, **kw)

        result = get_period_range("monthly", offset=-1, monthly_start_day=1)
        assert result is not None
        start, end = result
        assert start == _utc(date(2026, 2, 1))
        assert end == _utc(date(2026, 3, 1))

    @patch("app.utils.period.date")
    def test_year_boundary(self, mock_date) -> None:
        """January with offset=-1 should go to December of previous year."""
        mock_date.today.return_value = date(2026, 1, 15)
        mock_date.side_effect = lambda *a, **kw: date(*a, **kw)

        result = get_period_range("monthly", offset=-1, monthly_start_day=1)
        assert result is not None
        start, end = result
        assert start == _utc(date(2025, 12, 1))
        assert end == _utc(date(2026, 1, 1))
