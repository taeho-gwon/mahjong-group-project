"""Unit tests for app.utils.period.get_period_range."""

from datetime import UTC, date, datetime, time
from unittest.mock import patch

from app.utils.period import KST, get_period_range


def _kst_midnight_as_utc(d: date) -> datetime:
    """Return KST midnight of the given date converted to UTC."""
    return datetime.combine(d, time.min, tzinfo=KST).astimezone(UTC)


def _mock_now(fake_date: date):
    """Return a patch that makes datetime.now(KST) return midnight KST of fake_date."""

    fake_now_kst = datetime.combine(fake_date, time.min, tzinfo=KST)

    class FakeDatetime(datetime):
        @classmethod
        def now(cls, tz=None):
            if tz is not None:
                return fake_now_kst.astimezone(tz)
            return fake_now_kst

    return patch("app.utils.period.datetime", FakeDatetime)


class TestPeriodAll:
    def test_all_returns_none(self) -> None:
        assert get_period_range("all") is None

    def test_all_with_offset_returns_none(self) -> None:
        assert get_period_range("all", offset=-3) is None


class TestPeriodDaily:
    def test_today(self) -> None:
        with _mock_now(date(2026, 3, 30)):
            result = get_period_range("daily", offset=0)
        assert result is not None
        start, end = result
        assert start == _kst_midnight_as_utc(date(2026, 3, 30))
        assert end == _kst_midnight_as_utc(date(2026, 3, 31))

    def test_yesterday(self) -> None:
        with _mock_now(date(2026, 3, 30)):
            result = get_period_range("daily", offset=-1)
        assert result is not None
        start, end = result
        assert start == _kst_midnight_as_utc(date(2026, 3, 29))
        assert end == _kst_midnight_as_utc(date(2026, 3, 30))

    def test_tomorrow(self) -> None:
        with _mock_now(date(2026, 3, 30)):
            result = get_period_range("daily", offset=1)
        assert result is not None
        start, end = result
        assert start == _kst_midnight_as_utc(date(2026, 3, 31))
        assert end == _kst_midnight_as_utc(date(2026, 4, 1))


class TestPeriodWeekly:
    def test_monday_start_on_monday(self) -> None:
        """2026-03-30 is a Monday. weekly_start_day=0 (Monday)."""
        with _mock_now(date(2026, 3, 30)):
            result = get_period_range("weekly", offset=0, weekly_start_day=0)
        assert result is not None
        start, end = result
        assert start == _kst_midnight_as_utc(date(2026, 3, 30))  # Monday
        assert end == _kst_midnight_as_utc(date(2026, 4, 6))  # Next Monday

    def test_monday_start_on_wednesday(self) -> None:
        """2026-04-01 is a Wednesday. weekly_start_day=0 (Monday)."""
        with _mock_now(date(2026, 4, 1)):
            result = get_period_range("weekly", offset=0, weekly_start_day=0)
        assert result is not None
        start, end = result
        assert start == _kst_midnight_as_utc(date(2026, 3, 30))  # Previous Monday
        assert end == _kst_midnight_as_utc(date(2026, 4, 6))

    def test_sunday_start(self) -> None:
        """2026-03-30 is Monday. weekly_start_day=6 (Sunday)."""
        with _mock_now(date(2026, 3, 30)):
            result = get_period_range("weekly", offset=0, weekly_start_day=6)
        assert result is not None
        start, end = result
        assert start == _kst_midnight_as_utc(date(2026, 3, 29))  # Previous Sunday
        assert end == _kst_midnight_as_utc(date(2026, 4, 5))

    def test_previous_week(self) -> None:
        with _mock_now(date(2026, 3, 30)):
            result = get_period_range("weekly", offset=-1, weekly_start_day=0)
        assert result is not None
        start, end = result
        assert start == _kst_midnight_as_utc(date(2026, 3, 23))
        assert end == _kst_midnight_as_utc(date(2026, 3, 30))


class TestPeriodMonthly:
    def test_start_day_1_mid_month(self) -> None:
        """Day 15 >= start_day 1, so base_month = current month."""
        with _mock_now(date(2026, 3, 15)):
            result = get_period_range("monthly", offset=0, monthly_start_day=1)
        assert result is not None
        start, end = result
        assert start == _kst_midnight_as_utc(date(2026, 3, 1))
        assert end == _kst_midnight_as_utc(date(2026, 4, 1))

    def test_start_day_15_before_start(self) -> None:
        """Day 10 < start_day 15, so base_month = previous month."""
        with _mock_now(date(2026, 3, 10)):
            result = get_period_range("monthly", offset=0, monthly_start_day=15)
        assert result is not None
        start, end = result
        assert start == _kst_midnight_as_utc(date(2026, 2, 15))
        assert end == _kst_midnight_as_utc(date(2026, 3, 15))

    def test_start_day_15_after_start(self) -> None:
        """Day 20 >= start_day 15, so base_month = current month."""
        with _mock_now(date(2026, 3, 20)):
            result = get_period_range("monthly", offset=0, monthly_start_day=15)
        assert result is not None
        start, end = result
        assert start == _kst_midnight_as_utc(date(2026, 3, 15))
        assert end == _kst_midnight_as_utc(date(2026, 4, 15))

    def test_previous_month(self) -> None:
        with _mock_now(date(2026, 3, 15)):
            result = get_period_range("monthly", offset=-1, monthly_start_day=1)
        assert result is not None
        start, end = result
        assert start == _kst_midnight_as_utc(date(2026, 2, 1))
        assert end == _kst_midnight_as_utc(date(2026, 3, 1))

    def test_year_boundary(self) -> None:
        """January with offset=-1 should go to December of previous year."""
        with _mock_now(date(2026, 1, 15)):
            result = get_period_range("monthly", offset=-1, monthly_start_day=1)
        assert result is not None
        start, end = result
        assert start == _kst_midnight_as_utc(date(2025, 12, 1))
        assert end == _kst_midnight_as_utc(date(2026, 1, 1))


class TestKstUtcBoundary:
    """Verify KST-based 'today' differs from UTC when between 00:00-09:00 KST."""

    def test_kst_late_night_same_day(self) -> None:
        """At 2026-03-30 23:30 KST (= 14:30 UTC), today should be 2026-03-30."""
        fake_kst = datetime(2026, 3, 30, 23, 30, tzinfo=KST)

        class FakeDatetime(datetime):
            @classmethod
            def now(cls, tz=None):
                if tz is not None:
                    return fake_kst.astimezone(tz)
                return fake_kst

        with patch("app.utils.period.datetime", FakeDatetime):
            result = get_period_range("daily", offset=0)
        assert result is not None
        start, end = result
        assert start == _kst_midnight_as_utc(date(2026, 3, 30))
        assert end == _kst_midnight_as_utc(date(2026, 3, 31))

    def test_kst_early_morning_next_utc_day(self) -> None:
        """At 2026-03-31 01:00 KST (= 2026-03-30 16:00 UTC).
        KST today is 03-31, but UTC date would be 03-30.
        The function should use KST, so today = 03-31."""
        fake_kst = datetime(2026, 3, 31, 1, 0, tzinfo=KST)

        class FakeDatetime(datetime):
            @classmethod
            def now(cls, tz=None):
                if tz is not None:
                    return fake_kst.astimezone(tz)
                return fake_kst

        with patch("app.utils.period.datetime", FakeDatetime):
            result = get_period_range("daily", offset=0)
        assert result is not None
        start, end = result
        assert start == _kst_midnight_as_utc(date(2026, 3, 31))
        assert end == _kst_midnight_as_utc(date(2026, 4, 1))
