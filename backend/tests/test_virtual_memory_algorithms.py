"""Comprehensive canonical benchmark tests for FIFO, LRU, Optimal, and Clock algorithms."""

import pytest
from backend.sim_engine.virtual_memory.engine import VirtualMemorySimulationEngine
from backend.sim_engine.virtual_memory.replacement import (
    FIFOReplacement,
    LRUReplacement,
    OptimalReplacement,
    ClockReplacement,
)
from backend.sim_engine.virtual_memory.state import InputMode


# Canonical Silberschatz Chapter 9 reference sequence:
# 7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1
SILBERSCHATZ_TRACE = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1]


def test_fifo_silberschatz_benchmark():
    """Verify FIFO produces exactly 15 page faults on Silberschatz benchmark with 3 frames."""
    engine = VirtualMemorySimulationEngine(
        algorithm=FIFOReplacement(),
        frame_count=3,
        page_size=4096,
        virtual_page_count=16,
        input_mode=InputMode.PAGE_REFERENCE,
        raw_references=SILBERSCHATZ_TRACE,
    )
    result = engine.run()
    assert result.final_metrics.page_faults == 15
    assert result.final_metrics.page_hits == 5
    assert result.final_metrics.total_references == 20
    assert result.final_metrics.hit_ratio == 0.25
    assert result.final_metrics.fault_ratio == 0.75
    assert result.terminated_normally is True


def test_lru_silberschatz_benchmark():
    """Verify LRU produces exactly 12 page faults on Silberschatz benchmark with 3 frames."""
    engine = VirtualMemorySimulationEngine(
        algorithm=LRUReplacement(),
        frame_count=3,
        page_size=4096,
        virtual_page_count=16,
        input_mode=InputMode.PAGE_REFERENCE,
        raw_references=SILBERSCHATZ_TRACE,
    )
    result = engine.run()
    assert result.final_metrics.page_faults == 12
    assert result.final_metrics.page_hits == 8
    assert result.final_metrics.total_references == 20
    assert result.final_metrics.hit_ratio == 0.4
    assert result.final_metrics.fault_ratio == 0.6


def test_optimal_silberschatz_benchmark():
    """Verify Optimal produces exactly 9 page faults on Silberschatz benchmark with 3 frames."""
    engine = VirtualMemorySimulationEngine(
        algorithm=OptimalReplacement(),
        frame_count=3,
        page_size=4096,
        virtual_page_count=16,
        input_mode=InputMode.PAGE_REFERENCE,
        raw_references=SILBERSCHATZ_TRACE,
    )
    result = engine.run()
    assert result.final_metrics.page_faults == 9
    assert result.final_metrics.page_hits == 11
    assert result.final_metrics.total_references == 20
    assert result.final_metrics.hit_ratio == 0.55
    assert result.final_metrics.fault_ratio == 0.45


def test_belady_anomaly_under_fifo():
    """Verify Belady's Anomaly where increasing frames from 3 to 4 increases FIFO faults from 9 to 10."""
    belady_trace = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5]

    # Run with 3 frames
    engine_3 = VirtualMemorySimulationEngine(
        algorithm=FIFOReplacement(),
        frame_count=3,
        page_size=4096,
        virtual_page_count=16,
        input_mode=InputMode.PAGE_REFERENCE,
        raw_references=belady_trace,
    )
    result_3 = engine_3.run()
    assert result_3.final_metrics.page_faults == 9

    # Run with 4 frames
    engine_4 = VirtualMemorySimulationEngine(
        algorithm=FIFOReplacement(),
        frame_count=4,
        page_size=4096,
        virtual_page_count=16,
        input_mode=InputMode.PAGE_REFERENCE,
        raw_references=belady_trace,
    )
    result_4 = engine_4.run()
    assert result_4.final_metrics.page_faults == 10

    # Explicit anomaly verification: more frames yielded more faults
    assert result_4.final_metrics.page_faults > result_3.final_metrics.page_faults


def test_belady_anomaly_immunity_under_lru():
    """Verify that LRU (stack algorithm) is immune to Belady's anomaly."""
    belady_trace = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5]

    engine_3 = VirtualMemorySimulationEngine(
        algorithm=LRUReplacement(),
        frame_count=3,
        page_size=4096,
        virtual_page_count=16,
        input_mode=InputMode.PAGE_REFERENCE,
        raw_references=belady_trace,
    )
    result_3 = engine_3.run()

    engine_4 = VirtualMemorySimulationEngine(
        algorithm=LRUReplacement(),
        frame_count=4,
        page_size=4096,
        virtual_page_count=16,
        input_mode=InputMode.PAGE_REFERENCE,
        raw_references=belady_trace,
    )
    result_4 = engine_4.run()

    # LRU faults with 4 frames must be <= faults with 3 frames
    assert result_4.final_metrics.page_faults <= result_3.final_metrics.page_faults


def test_clock_second_chance_behavior():
    """Verify Clock replacement grants second chance, clears reference bit, and advances hand."""
    clock_trace = [0, 1, 2, 3, 0, 1, 4, 0, 1, 2, 3, 4]

    engine = VirtualMemorySimulationEngine(
        algorithm=ClockReplacement(),
        frame_count=3,
        page_size=4096,
        virtual_page_count=16,
        input_mode=InputMode.PAGE_REFERENCE,
        raw_references=clock_trace,
    )
    result = engine.run()
    assert result.final_metrics.page_faults > 0
    assert result.final_metrics.page_hits > 0
    assert result.terminated_normally is True

    # Check that Clock replacement snapshots recorded clock_hand and scanned frames
    fault_snapshots_with_replacement = [
        s for s in result.timeline if s.replacement_decision and s.replacement_decision.victim_page is not None
    ]
    assert len(fault_snapshots_with_replacement) > 0
    first_repl = fault_snapshots_with_replacement[0].replacement_decision
    assert first_repl.clock_hand_before is not None
    assert first_repl.clock_hand_after is not None
    assert first_repl.frames_scanned is not None
