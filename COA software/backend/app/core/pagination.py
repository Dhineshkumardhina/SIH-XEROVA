import math
from typing import Tuple, List, Dict, Any, Optional
from sqlalchemy.orm import Query
from pydantic import BaseModel

class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total: int
    pages: int

def paginate_query(
    query: Query,
    page: int = 1,
    page_size: int = 25,
    sort_by: Optional[str] = None,
    sort_order: str = "asc",
    allowed_sorts: Optional[Dict[str, Any]] = None,
    default_sort: Optional[Any] = None
) -> Tuple[List[Any], PaginationMeta]:
    # Safe bounds
    safe_page = max(1, page)
    safe_page_size = max(1, min(100, page_size))

    # Total count before paging
    total = query.count()
    pages = math.ceil(total / safe_page_size) if total > 0 else 1

    # Sorting
    if sort_by and allowed_sorts and sort_by in allowed_sorts:
        col = allowed_sorts[sort_by]
        if sort_order.lower() == "desc":
            query = query.order_by(col.desc())
        else:
            query = query.order_by(col.asc())
    elif default_sort is not None:
        query = query.order_by(default_sort)

    # Offset & limit
    items = query.offset((safe_page - 1) * safe_page_size).limit(safe_page_size).all()

    meta = PaginationMeta(
        page=safe_page,
        page_size=safe_page_size,
        total=total,
        pages=pages
    )

    return items, meta
