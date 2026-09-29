"""Unit tests for virtual memory address decomposition and physical address calculation."""

import pytest
from backend.sim_engine.virtual_memory.address import (
    is_power_of_two,
    validate_address_parameters,
    decompose_virtual_address,
    compute_physical_address,
)


def test_is_power_of_two():
    """Verify power-of-two validation logic."""
    assert is_power_of_two(1) is True
    assert is_power_of_two(2) is True
    assert is_power_of_two(4) is True
    assert is_power_of_two(1024) is True
    assert is_power_of_two(4096) is True
    assert is_power_of_two(8192) is True

    assert is_power_of_two(0) is False
    assert is_power_of_two(-4) is False
    assert is_power_of_two(3) is False
    assert is_power_of_two(100) is False
    assert is_power_of_two(1000) is False


def test_validate_address_parameters():
    """Verify address parameter validation."""
    # Valid parameters: page_size=4096, virtual_pages=16, frames=3
    validate_address_parameters(4096, 16, 3)

    # Invalid page_size (not power of 2)
    with pytest.raises(ValueError, match="page_size must be a power of two"):
        validate_address_parameters(3000, 16, 3)

    # Invalid virtual_page_count (not power of 2)
    with pytest.raises(ValueError, match="virtual_page_count must be a power of two"):
        validate_address_parameters(4096, 15, 3)

    # Invalid frame count (<= 0)
    with pytest.raises(ValueError, match="frame_count must be strictly positive"):
        validate_address_parameters(4096, 16, 0)


def test_decompose_virtual_address_clean_multiples():
    """Verify address decomposition on exact page boundaries."""
    # page_size = 4096 (12 offset bits), 16 virtual pages (addresses 0 to 65535)
    v0 = decompose_virtual_address(0, 4096, 16)
    assert v0.page_number == 0
    assert v0.offset == 0
    assert v0.hex_address == "0x0"

    v4096 = decompose_virtual_address(4096, 4096, 16)
    assert v4096.page_number == 1
    assert v4096.offset == 0
    assert v4096.hex_address == "0x1000"

    v8192 = decompose_virtual_address(8192, 4096, 16)
    assert v8192.page_number == 2
    assert v8192.offset == 0


def test_decompose_virtual_address_with_offset():
    """Verify address decomposition with arbitrary offsets."""
    # Address 5000: 5000 // 4096 = 1, 5000 % 4096 = 904
    v5000 = decompose_virtual_address(5000, 4096, 16)
    assert v5000.page_number == 1
    assert v5000.offset == 904

    # Address 6735 (0x1A4F): 6735 // 4096 = 1, 6735 % 4096 = 2639 (0x0A4F)
    v6735 = decompose_virtual_address(6735, 4096, 16)
    assert v6735.page_number == 1
    assert v6735.offset == 2639


def test_decompose_virtual_address_bounds():
    """Verify out-of-bound virtual addresses raise clear errors."""
    page_size = 4096
    pages = 16
    # Virtual address space = 4096 * 16 = 65536. Valid range [0, 65535].
    with pytest.raises(ValueError, match="exceeds virtual address space bound"):
        decompose_virtual_address(65536, page_size, pages)

    with pytest.raises(ValueError, match="exceeds virtual address space bound"):
        decompose_virtual_address(70000, page_size, pages)

    with pytest.raises(ValueError, match="must be non-negative"):
        decompose_virtual_address(-1, page_size, pages)


def test_compute_physical_address():
    """Verify physical address calculation from frame number and offset."""
    # Frame 2, offset 904, page_size=4096, frames=4
    # phys = 2 * 4096 + 904 = 8192 + 904 = 9096
    p = compute_physical_address(frame_number=2, offset=904, page_size=4096, frame_count=4)
    assert p.physical_address == 9096
    assert p.frame_number == 2
    assert p.offset == 904

    # Frame 0, offset 0
    p0 = compute_physical_address(frame_number=0, offset=0, page_size=4096, frame_count=4)
    assert p0.physical_address == 0

    # Invalid frame number
    with pytest.raises(ValueError, match="out of valid bounds"):
        compute_physical_address(frame_number=4, offset=0, page_size=4096, frame_count=4)

    # Invalid offset
    with pytest.raises(ValueError, match="out of valid bounds"):
        compute_physical_address(frame_number=1, offset=4096, page_size=4096, frame_count=4)
