from app.database.session import SessionLocal
from app.models.train import Train
from app.models.corridor import Corridor

def update_trains():
    db = SessionLocal()
    try:
        corridors = {c.code: c.id for c in db.query(Corridor).all()}
        cor_a = corridors.get('COR-A01') or corridors.get('COR_c7626c')
        cor_b = corridors.get('COR-B02') or cor_a
        cor_c = corridors.get('COR-C03') or cor_a
        cor_d = corridors.get('COR-D04') or cor_a

        train_updates = [
            ("12301", "Synthetic Rajdhani Superfast Express", "APPROACHING", cor_a, "NDLS", "CNB", 1, "SUPERFAST"),
            ("12302", "Synthetic Rajdhani Return Express", "AT_STATION", cor_a, "CNB", "NDLS", 1, "SUPERFAST"),
            ("12456", "Synthetic Intercity Express", "DEPARTED", cor_a, "ALJN", "NDLS", 2, "EXPRESS"),
            ("12457", "Synthetic Intercity Return Express", "APPROACHING", cor_a, "NDLS", "TDL", 2, "EXPRESS"),
            ("12007", "Synthetic Shatabdi Express", "DELAYED", cor_d, "NDLS", "PRYJ", 1, "SUPERFAST"),
            ("12008", "Synthetic Shatabdi Return Express", "APPROACHING", cor_d, "PRYJ", "NDLS", 1, "SUPERFAST"),
            ("16127", "Synthetic Guruvayur Express", "APPROACHING", cor_a, "NDLS", "DDU", 2, "EXPRESS"),
            ("16128", "Synthetic Guruvayur Return Express", "AT_STATION", cor_a, "DDU", "NDLS", 2, "EXPRESS"),
            ("22601", "Synthetic Vande Bharat Superfast", "APPROACHING", cor_a, "NDLS", "CNB", 1, "SUPERFAST"),
            ("22602", "Synthetic Vande Bharat Return", "DEPARTED", cor_a, "CNB", "NDLS", 1, "SUPERFAST"),
            ("G-5501", "Synthetic Container Freight Rake A", "APPROACHING", cor_b, "DER", "FL", 4, "GOODS"),
            ("G-5502", "Synthetic Coal Freight Rake B", "AT_STATION", cor_b, "RE", "DER", 4, "GOODS"),
            ("G-5503", "Synthetic Cement Freight Rake C", "DEPARTED", cor_b, "FL", "PNU", 4, "GOODS"),
            ("G-5504", "Synthetic Automobile Rake D", "SCHEDULED", cor_b, "PNU", "RE", 4, "GOODS"),
            ("SUB-901", "Synthetic Suburban Local 901", "APPROACHING", cor_c, "BPQ", "SC", 3, "PASSENGER"),
            ("SUB-902", "Synthetic Suburban Local 902", "AT_STATION", cor_c, "SC", "KZJ", 3, "PASSENGER"),
        ]

        for num, name, status, cor_id, orig, dest, prio, t_type in train_updates:
            tr = db.query(Train).filter_by(train_number=num).first()
            if tr:
                tr.train_name = name
                tr.status = status
                tr.corridor_id = cor_id
                tr.origin = orig
                tr.destination = dest
                tr.priority = prio
                tr.train_type = t_type
            else:
                tr = Train(
                    train_number=num,
                    train_name=name,
                    status=status,
                    corridor_id=cor_id,
                    origin=orig,
                    destination=dest,
                    priority=prio,
                    train_type=t_type
                )
                db.add(tr)
        db.commit()
        print("Train operational states updated successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    update_trains()
