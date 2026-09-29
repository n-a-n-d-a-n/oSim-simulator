"""Virtual and physical address mathematical representations and decomposition."""

import math
from dataclasses import dataclass
from typing import Dict, Any


def is_power_of_two(n: int) -> bool:
    """Check if n is a strictly positive power of two."""
    return n > 0 and (n & (n - 1)) == 0


def validate_address_parameters(
    page_size: int,
    virtual_page_count: int,
    frame_count: int,
) -> None:
    """Validate that address parameters conform to power-of-two constraints and positive bounds."""
    if not is_power_of_two(page_size):
        raise ValueError(f"page_size must be a power of two, got {page_size}")
    if not is_power_of_two(virtual_page_count):
        raise ValueError(f"virtual_page_count must be a power of two, got {virtual_page_count}")
    if frame_count <= 0:
        raise ValueError(f"frame_count must be strictly positive, got {frame_count}")
    if frame_count > virtual_page_count:
        # Physical frames can be fewer than or equal to virtual pages in typical virtual memory
        pass


@dataclass(frozen=True)
class VirtualAddress:
    """Validated decomposition of a virtual byte address."""
    virtual_address: int
    page_size: int
    page_number: int
    offset: int
    hex_address: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "virtual_address": self.virtual_address,
            "page_size": self.page_size,
            "page_number": self.page_number,
            "offset": self.offset,
            "hex_address": self.hex_address,
        }


@dataclass(frozen=True)
class PhysicalAddress:
    """Translated physical byte address."""
    physical_address: int
    frame_number: int
    offset: int
    hex_address: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "physical_address": self.physical_address,
            "frame_number": self.frame_number,
            "offset": self.offset,
            "hex_address": self.hex_address,
        }


def decompose_virtual_address(
    virtual_address: int,
    page_size: int,
    virtual_page_count: int,
) -> VirtualAddress:
    """Decompose a virtual address into page number and offset.
    
    virtual_address_space_size = page_size * virtual_page_count
    Valid range: 0 <= virtual_address < virtual_address_space_size
    """
    if virtual_address < 0:
        raise ValueError(f"Virtual address must be non-negative, got {virtual_address}")
    
    virtual_address_space_size = page_size * virtual_page_count
    if virtual_address >= virtual_address_space_size:
        raise ValueError(
            f"Virtual address {virtual_address} exceeds virtual address space bound "
            f"[0, {virtual_address_space_size}) for page_size={page_size}, pages={virtual_page_count}"
        )

    page_number = virtual_address // page_size
    offset = virtual_address % page_size

    return VirtualAddress(
        virtual_address=virtual_address,
        page_size=page_size,
        page_number=page_number,
        offset=offset,
        hex_address=hex(virtual_address),
    )


def compute_physical_address(
    frame_number: int,
    offset: int,
    page_size: int,
    frame_count: int,
) -> PhysicalAddress:
    """Compute physical byte address from allocated frame and offset."""
    if frame_number < 0 or frame_number >= frame_count:
        raise ValueError(f"frame_number {frame_number} out of valid bounds [0, {frame_count})")
    if offset < 0 or offset >= page_size:
        raise ValueError(f"offset {offset} out of valid bounds [0, {page_size})")

    physical_addr_int = (frame_number * page_size) + offset
    return PhysicalAddress(
        physical_address=physical_addr_int,
        frame_number=frame_number,
        offset=offset,
        hex_address=hex(physical_addr_int),
    )
