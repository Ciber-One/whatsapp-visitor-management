from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import io
import csv
import random
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="VisitorGuard API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat()


def parse(dt_str: str) -> datetime:
    return datetime.fromisoformat(dt_str)


def new_id() -> str:
    return str(uuid.uuid4())


def effective_pass_status(p: dict) -> str:
    """Active passes auto-expire once expiry passes."""
    status = p.get("status")
    if status == "active" and parse(p["expiry_at"]) < now_utc():
        return "expired"
    return status


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class ResidentCreate(BaseModel):
    apartment: str
    name: str
    phone: str
    status: str = "active"


class ResidentUpdate(BaseModel):
    apartment: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None


class PassCreate(BaseModel):
    resident_id: str
    visitor_name: Optional[str] = "Visitor"
    purpose: Optional[str] = "Guest"


class VerifyRequest(BaseModel):
    pin: str


class ApproveRequest(BaseModel):
    pass_id: str
    guard: str = "Gate Guard"


class SettingsModel(BaseModel):
    society_name: str
    address: str
    pin_expiry_minutes: int
    whatsapp_enabled: bool
    notify_on_entry: bool
    notify_on_expiry: bool


# ---------------------------------------------------------------------------
# Audit logging
# ---------------------------------------------------------------------------

async def add_log(action: str, pin: str, apartment: str, user: str,
                  status: str, guard_action: str = "", notes: str = "",
                  ts: Optional[datetime] = None):
    doc = {
        "id": new_id(),
        "timestamp": iso(ts or now_utc()),
        "action": action,
        "pin": pin,
        "apartment": apartment,
        "user": user,
        "status": status,
        "guard_action": guard_action,
        "notes": notes,
    }
    await db.logs.insert_one(doc)
    return doc


# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------

FIRST_NAMES = ["Arjun", "Priya", "Rohan", "Sneha", "Vikram", "Anjali", "Karan", "Meera",
               "Aditya", "Divya", "Rahul", "Pooja", "Sanjay", "Neha", "Manish", "Kavya",
               "Amit", "Riya", "Suresh", "Tara", "Nikhil", "Isha", "Deepak", "Aarti",
               "Varun", "Shruti", "Gaurav", "Nisha", "Akash", "Simran", "Vivek", "Pallavi",
               "Harsh", "Ananya", "Rajesh", "Swati", "Mohit", "Lakshmi", "Kunal", "Bhavna"]
LAST_NAMES = ["Sharma", "Patel", "Reddy", "Mehta", "Iyer", "Nair", "Gupta", "Verma",
              "Kapoor", "Joshi", "Rao", "Desai", "Malhotra", "Bose", "Kulkarni", "Chopra"]
GUARDS = ["Ramesh Yadav", "Suresh Kumar", "Mahesh Singh", "Dinesh Gupta"]
VISITORS = ["Amazon Delivery", "Swiggy Rider", "Zomato Delivery", "Guest", "Plumber",
            "Electrician", "Relative", "Cab Driver", "Courier", "Maid", "Flipkart Courier",
            "House Help", "Friend", "Family Visit", "Appliance Service"]
PURPOSES = ["Food Delivery", "Package Delivery", "Personal Guest", "Home Service",
            "Family Visit", "Cab Pickup"]


async def seed_db():
    count = await db.residents.count_documents({})
    if count > 0:
        return

    logger.info("Seeding database...")
    random.seed(42)

    # Settings
    await db.settings.insert_one({
        "id": "global",
        "society_name": "Greenwood Residency",
        "address": "Plot 14, Sector 21, Whitefield, Bangalore 560066",
        "pin_expiry_minutes": 60,
        "whatsapp_enabled": True,
        "notify_on_entry": True,
        "notify_on_expiry": True,
    })

    # Residents
    blocks = ["A", "B", "C", "D"]
    residents = []
    used_apts = set()
    for _ in range(48):
        while True:
            blk = random.choice(blocks)
            apt = f"{blk}-{random.randint(1,8)}0{random.randint(1,4)}"
            if apt not in used_apts:
                used_apts.add(apt)
                break
        name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
        created = now_utc() - timedelta(days=random.randint(30, 400))
        status = "active" if random.random() > 0.12 else "disabled"
        residents.append({
            "id": new_id(),
            "apartment": apt,
            "name": name,
            "phone": f"+91 9{random.randint(100000000, 999999999)}",
            "status": status,
            "created_at": iso(created),
        })
    await db.residents.insert_many(residents)
    active_residents = [r for r in residents if r["status"] == "active"]

    # Passes + logs
    passes = []
    now = now_utc()
    for i in range(140):
        res = random.choice(active_residents)
        pin = f"{random.randint(0, 9999):04d}"
        visitor = random.choice(VISITORS)
        purpose = random.choice(PURPOSES)
        guard = random.choice(GUARDS)

        roll = random.random()
        if i < 14:
            # recent active passes
            created = now - timedelta(minutes=random.randint(1, 55))
            expiry = created + timedelta(minutes=60)
            status = "active"
            entry_at = None
            verified = False
            used_guard = None
        else:
            created = now - timedelta(days=random.randint(0, 29),
                                      hours=random.randint(0, 23),
                                      minutes=random.randint(0, 59))
            expiry = created + timedelta(minutes=60)
            if roll < 0.62:
                status = "used"
                entry_at = created + timedelta(minutes=random.randint(2, 55))
                verified = True
                used_guard = guard
            elif roll < 0.90:
                status = "expired"
                entry_at = None
                verified = False
                used_guard = None
            else:
                status = "revoked"
                entry_at = None
                verified = False
                used_guard = None

        # Build audit timeline
        timeline = [
            {"label": "Pass Generated", "actor": res["name"], "timestamp": iso(created)},
            {"label": "Sent To Resident", "actor": "WhatsApp Bot",
             "timestamp": iso(created + timedelta(seconds=4))},
        ]
        if status == "used":
            shown = entry_at - timedelta(minutes=1)
            timeline.append({"label": "Shown At Gate", "actor": visitor, "timestamp": iso(shown)})
            timeline.append({"label": "Verified By Guard", "actor": used_guard, "timestamp": iso(entry_at)})
            timeline.append({"label": "Entry Approved", "actor": used_guard, "timestamp": iso(entry_at)})
        elif status == "expired":
            timeline.append({"label": "Pass Expired", "actor": "System", "timestamp": iso(expiry)})
        elif status == "revoked":
            revoked_at = created + timedelta(minutes=random.randint(5, 50))
            timeline.append({"label": "Revoked By Admin", "actor": "Admin", "timestamp": iso(revoked_at)})

        p = {
            "id": new_id(),
            "pin": pin,
            "apartment": res["apartment"],
            "resident_id": res["id"],
            "resident_name": res["name"],
            "resident_phone": res["phone"],
            "visitor_name": visitor,
            "purpose": purpose,
            "generated_by": "WhatsApp",
            "created_at": iso(created),
            "expiry_at": iso(expiry),
            "status": status,
            "entry_at": iso(entry_at) if entry_at else None,
            "guard_name": used_guard,
            "verified": verified,
            "timeline": timeline,
        }
        passes.append(p)

        # Logs
        await add_log("Pass Generated", pin, res["apartment"], res["name"],
                      "active", "", f"{purpose} - {visitor}", ts=created)
        if status == "used":
            await add_log("Entry Approved", pin, res["apartment"], used_guard,
                          "used", "Approved", f"Verified {visitor}", ts=entry_at)
        elif status == "expired":
            await add_log("Pass Expired", pin, res["apartment"], "System",
                          "expired", "", "Pass expired unused", ts=expiry)
        elif status == "revoked":
            await add_log("Pass Revoked", pin, res["apartment"], "Admin",
                          "revoked", "Revoked", "Revoked by administrator",
                          ts=created + timedelta(minutes=20))

    await db.passes.insert_many(passes)
    logger.info("Seed complete: %d residents, %d passes", len(residents), len(passes))


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

@api_router.get("/dashboard")
async def get_dashboard():
    residents = await db.residents.find({}, {"_id": 0}).to_list(1000)
    passes = await db.passes.find({}, {"_id": 0}).to_list(2000)
    now = now_utc()
    today = now.date()
    week_ago = now - timedelta(days=7)

    total_residents = len([r for r in residents if r["status"] == "active"])
    active_passes = len([p for p in passes if effective_pass_status(p) == "active"])
    visitors_today = len([p for p in passes
                          if p.get("entry_at") and parse(p["entry_at"]).date() == today])
    entries_week = len([p for p in passes
                        if p.get("entry_at") and parse(p["entry_at"]) >= week_ago])

    # Recent visitors (used passes by entry time)
    used = [p for p in passes if p.get("entry_at")]
    used.sort(key=lambda x: x["entry_at"], reverse=True)
    recent_visitors = [{
        "time": p["entry_at"],
        "pin": p["pin"],
        "apartment": p["apartment"],
        "status": effective_pass_status(p),
        "guard": p.get("guard_name") or "-",
        "visitor": p.get("visitor_name"),
    } for p in used[:8]]

    # Recent activity from logs
    logs = await db.logs.find({}, {"_id": 0}).sort("timestamp", -1).to_list(12)
    recent_activity = [{
        "action": l["action"],
        "pin": l["pin"],
        "apartment": l["apartment"],
        "user": l["user"],
        "timestamp": l["timestamp"],
        "status": l["status"],
    } for l in logs]

    return {
        "kpis": {
            "total_residents": total_residents,
            "active_passes": active_passes,
            "visitors_today": visitors_today,
            "entries_week": entries_week,
            "total_residents_trend": 4.2,
            "active_passes_trend": 1.0,
            "visitors_today_trend": 12.5,
            "entries_week_trend": 8.1,
        },
        "recent_visitors": recent_visitors,
        "recent_activity": recent_activity,
    }


# ---------------------------------------------------------------------------
# Residents
# ---------------------------------------------------------------------------

@api_router.get("/residents")
async def list_residents(search: str = "", status: str = "all",
                         page: int = 1, page_size: int = 8):
    query = {}
    if status != "all":
        query["status"] = status
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"apartment": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
        ]
    total = await db.residents.count_documents(query)
    skip = (page - 1) * page_size
    residents = await db.residents.find(query, {"_id": 0}).sort("apartment", 1).skip(skip).limit(page_size).to_list(page_size)
    return {"items": residents, "total": total, "page": page, "page_size": page_size}


@api_router.post("/residents")
async def create_resident(body: ResidentCreate):
    existing = await db.residents.find_one({"apartment": body.apartment})
    if existing:
        raise HTTPException(status_code=400, detail="Apartment already has a registered resident")
    doc = {
        "id": new_id(),
        "apartment": body.apartment,
        "name": body.name,
        "phone": body.phone,
        "status": body.status,
        "created_at": iso(now_utc()),
    }
    await db.residents.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.get("/residents/{rid}")
async def get_resident(rid: str):
    r = await db.residents.find_one({"id": rid}, {"_id": 0})
    if not r:
        raise HTTPException(status_code=404, detail="Resident not found")
    passes = await db.passes.find({"resident_id": rid}, {"_id": 0}).to_list(500)
    passes.sort(key=lambda x: x["created_at"], reverse=True)
    stats = {
        "total_passes": len(passes),
        "used": len([p for p in passes if effective_pass_status(p) == "used"]),
        "active": len([p for p in passes if effective_pass_status(p) == "active"]),
        "expired": len([p for p in passes if effective_pass_status(p) == "expired"]),
    }
    last_pass = passes[0] if passes else None
    return {"resident": r, "stats": stats, "last_pass": last_pass}


@api_router.patch("/residents/{rid}")
async def update_resident(rid: str, body: ResidentUpdate):
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    res = await db.residents.update_one({"id": rid}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Resident not found")
    r = await db.residents.find_one({"id": rid}, {"_id": 0})
    return r


@api_router.post("/residents/{rid}/toggle")
async def toggle_resident(rid: str):
    r = await db.residents.find_one({"id": rid})
    if not r:
        raise HTTPException(status_code=404, detail="Resident not found")
    new_status = "disabled" if r["status"] == "active" else "active"
    await db.residents.update_one({"id": rid}, {"$set": {"status": new_status}})
    if new_status == "disabled":
        await add_log("Resident Disabled", "-", r["apartment"], "Admin", "disabled",
                      "", f"{r['name']} disabled")
    r = await db.residents.find_one({"id": rid}, {"_id": 0})
    return r


# ---------------------------------------------------------------------------
# Passes
# ---------------------------------------------------------------------------

def _in_range(created_str: str, rng: str) -> bool:
    if rng == "all":
        return True
    created = parse(created_str)
    now = now_utc()
    if rng == "today":
        return created.date() == now.date()
    if rng == "7":
        return created >= now - timedelta(days=7)
    if rng == "30":
        return created >= now - timedelta(days=30)
    return True


@api_router.get("/passes")
async def list_passes(search: str = "", status: str = "all", range: str = "all"):
    passes = await db.passes.find({}, {"_id": 0}).to_list(2000)
    result = []
    for p in passes:
        eff = effective_pass_status(p)
        if status != "all" and eff != status:
            continue
        if not _in_range(p["created_at"], range):
            continue
        if search:
            s = search.lower()
            if not (s in p["pin"].lower() or s in p["apartment"].lower()
                    or s in p["resident_name"].lower()):
                continue
        item = dict(p)
        item["status"] = eff
        result.append(item)
    result.sort(key=lambda x: x["created_at"], reverse=True)

    # summary across all passes
    all_eff = [effective_pass_status(p) for p in passes]
    today = now_utc().date()
    summary = {
        "active": all_eff.count("active"),
        "used": all_eff.count("used"),
        "expired": all_eff.count("expired"),
        "revoked": all_eff.count("revoked"),
        "today": len([p for p in passes if parse(p["created_at"]).date() == today]),
    }
    return {"items": result, "summary": summary}


@api_router.get("/passes/expiring")
async def expiring_passes():
    passes = await db.passes.find({"status": "active"}, {"_id": 0}).to_list(500)
    now = now_utc()
    one_hour = []
    six_hours = []
    today = []
    for p in passes:
        exp = parse(p["expiry_at"])
        if exp < now:
            continue
        mins = (exp - now).total_seconds() / 60
        entry = {"pin": p["pin"], "apartment": p["apartment"],
                 "resident_name": p["resident_name"], "expiry_at": p["expiry_at"]}
        if mins <= 60:
            one_hour.append(entry)
        elif mins <= 360:
            six_hours.append(entry)
        if exp.date() == now.date():
            today.append(entry)
    return {"one_hour": one_hour, "six_hours": six_hours, "today": today,
            "counts": {"one_hour": len(one_hour), "six_hours": len(six_hours), "today": len(today)}}


@api_router.get("/passes/{pid}")
async def get_pass(pid: str):
    p = await db.passes.find_one({"id": pid}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Pass not found")
    await add_log("Pass Viewed", p["pin"], p["apartment"], "Admin",
                  effective_pass_status(p), "", "Viewed pass details")
    p["status"] = effective_pass_status(p)
    return p


@api_router.post("/passes")
async def create_pass(body: PassCreate):
    res = await db.residents.find_one({"id": body.resident_id}, {"_id": 0})
    if not res:
        raise HTTPException(status_code=404, detail="Resident not found")
    settings = await db.settings.find_one({"id": "global"}, {"_id": 0})
    expiry_min = settings["pin_expiry_minutes"] if settings else 60
    created = now_utc()
    expiry = created + timedelta(minutes=expiry_min)
    pin = f"{random.randint(0, 9999):04d}"
    timeline = [
        {"label": "Pass Generated", "actor": res["name"], "timestamp": iso(created)},
        {"label": "Sent To Resident", "actor": "WhatsApp Bot",
         "timestamp": iso(created + timedelta(seconds=3))},
    ]
    doc = {
        "id": new_id(),
        "pin": pin,
        "apartment": res["apartment"],
        "resident_id": res["id"],
        "resident_name": res["name"],
        "resident_phone": res["phone"],
        "visitor_name": body.visitor_name,
        "purpose": body.purpose,
        "generated_by": "WhatsApp",
        "created_at": iso(created),
        "expiry_at": iso(expiry),
        "status": "active",
        "entry_at": None,
        "guard_name": None,
        "verified": False,
        "timeline": timeline,
    }
    await db.passes.insert_one(doc)
    await add_log("Pass Generated", pin, res["apartment"], res["name"], "active",
                  "", f"{body.purpose} - {body.visitor_name}")
    doc.pop("_id", None)
    return doc


@api_router.post("/passes/{pid}/revoke")
async def revoke_pass(pid: str):
    p = await db.passes.find_one({"id": pid})
    if not p:
        raise HTTPException(status_code=404, detail="Pass not found")
    if effective_pass_status(p) != "active":
        raise HTTPException(status_code=400, detail="Only active passes can be revoked")
    revoked_at = now_utc()
    timeline = p.get("timeline", [])
    timeline.append({"label": "Revoked By Admin", "actor": "Admin", "timestamp": iso(revoked_at)})
    await db.passes.update_one({"id": pid}, {"$set": {"status": "revoked", "timeline": timeline}})
    await add_log("Pass Revoked", p["pin"], p["apartment"], "Admin", "revoked",
                  "Revoked", "Revoked by administrator")
    p = await db.passes.find_one({"id": pid}, {"_id": 0})
    return p


# ---------------------------------------------------------------------------
# Guard verification
# ---------------------------------------------------------------------------

@api_router.post("/verify")
async def verify_pin(body: VerifyRequest):
    pin = body.pin.strip()
    p = await db.passes.find_one({"pin": pin}, {"_id": 0}, sort=[("created_at", -1)])
    if not p:
        await add_log("Verification Failed", pin, "-", "Guard", "not_found",
                      "Denied", "PIN not found")
        return {"valid": False, "reason": "Not Found",
                "message": "No visitor pass found for this PIN."}
    eff = effective_pass_status(p)
    if eff == "active":
        return {
            "valid": True,
            "pass_id": p["id"],
            "pin": p["pin"],
            "apartment": p["apartment"],
            "resident_name": p["resident_name"],
            "visitor_name": p.get("visitor_name"),
            "purpose": p.get("purpose"),
            "expiry_at": p["expiry_at"],
        }
    reason = {"used": "Used", "expired": "Expired", "revoked": "Revoked"}.get(eff, "Invalid")
    msg = {
        "used": "This pass has already been used for entry.",
        "expired": "This pass has expired and is no longer valid.",
        "revoked": "This pass was revoked by the administrator.",
    }.get(eff, "Invalid pass.")
    await add_log("Verification Failed", pin, p["apartment"], "Guard", eff,
                  "Denied", f"Pass {reason}")
    return {"valid": False, "reason": reason, "message": msg}


@api_router.post("/passes/{pid}/approve")
async def approve_entry(pid: str, body: ApproveRequest):
    p = await db.passes.find_one({"id": pid})
    if not p:
        raise HTTPException(status_code=404, detail="Pass not found")
    if effective_pass_status(p) != "active":
        raise HTTPException(status_code=400, detail="Pass is no longer active")
    entry_at = now_utc()
    timeline = p.get("timeline", [])
    timeline.append({"label": "Shown At Gate", "actor": p.get("visitor_name"), "timestamp": iso(entry_at)})
    timeline.append({"label": "Verified By Guard", "actor": body.guard, "timestamp": iso(entry_at)})
    timeline.append({"label": "Entry Approved", "actor": body.guard, "timestamp": iso(entry_at)})
    await db.passes.update_one({"id": pid}, {"$set": {
        "status": "used", "entry_at": iso(entry_at), "guard_name": body.guard,
        "verified": True, "timeline": timeline,
    }})
    await add_log("Entry Approved", p["pin"], p["apartment"], body.guard, "used",
                  "Approved", f"Verified {p.get('visitor_name')}")
    return {"ok": True, "entry_at": iso(entry_at)}


# ---------------------------------------------------------------------------
# Logs
# ---------------------------------------------------------------------------

@api_router.get("/logs")
async def list_logs(search: str = "", status: str = "all", apartment: str = "",
                    range: str = "all"):
    logs = await db.logs.find({}, {"_id": 0}).sort("timestamp", -1).to_list(3000)
    result = []
    for l in logs:
        if status != "all" and l["status"] != status:
            continue
        if apartment and apartment.lower() not in l["apartment"].lower():
            continue
        if not _in_range(l["timestamp"], range):
            continue
        if search:
            s = search.lower()
            if not (s in l["pin"].lower() or s in l["apartment"].lower()
                    or s in l["action"].lower() or s in l["user"].lower()):
                continue
        result.append(l)
    return {"items": result, "total": len(result)}


@api_router.get("/logs/export")
async def export_logs():
    logs = await db.logs.find({}, {"_id": 0}).sort("timestamp", -1).to_list(5000)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Timestamp", "PIN", "Apartment", "Action", "Status", "User", "Guard Action", "Notes"])
    for l in logs:
        writer.writerow([l["timestamp"], l["pin"], l["apartment"], l["action"],
                         l["status"], l["user"], l.get("guard_action", ""), l.get("notes", "")])
    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv",
                             headers={"Content-Disposition": "attachment; filename=visitor_logs.csv"})


# ---------------------------------------------------------------------------
# Reports
# ---------------------------------------------------------------------------

@api_router.get("/reports")
async def get_reports():
    passes = await db.passes.find({}, {"_id": 0}).to_list(2000)
    now = now_utc()

    # visitors per day (last 14 days based on entry)
    days = []
    for i in range(13, -1, -1):
        d = (now - timedelta(days=i)).date()
        cnt = len([p for p in passes if p.get("entry_at") and parse(p["entry_at"]).date() == d])
        gen = len([p for p in passes if parse(p["created_at"]).date() == d])
        days.append({"date": d.strftime("%b %d"), "visitors": cnt, "passes": gen})

    # most active apartments
    apt_counts = {}
    for p in passes:
        if p.get("entry_at"):
            apt_counts[p["apartment"]] = apt_counts.get(p["apartment"], 0) + 1
    top_apts = sorted(apt_counts.items(), key=lambda x: x[1], reverse=True)[:6]
    most_active = [{"apartment": a, "visitors": c} for a, c in top_apts]

    # pass usage breakdown
    eff = [effective_pass_status(p) for p in passes]
    usage = [
        {"name": "Used", "value": eff.count("used")},
        {"name": "Active", "value": eff.count("active")},
        {"name": "Expired", "value": eff.count("expired")},
        {"name": "Revoked", "value": eff.count("revoked")},
    ]

    total_passes = len(passes)
    total_visitors = len([p for p in passes if p.get("entry_at")])
    used_count = eff.count("used")
    expired_count = eff.count("expired")
    avg_daily = round(sum(d["visitors"] for d in days) / 14, 1)
    approval_rate = round((used_count / total_passes) * 100, 1) if total_passes else 0
    expired_rate = round((expired_count / total_passes) * 100, 1) if total_passes else 0

    return {
        "visitors_per_day": days,
        "most_active": most_active,
        "usage": usage,
        "metrics": {
            "total_visitors": total_visitors,
            "avg_daily_visitors": avg_daily,
            "approval_rate": approval_rate,
            "expired_pass_rate": expired_rate,
        },
    }


# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------

@api_router.get("/settings")
async def get_settings():
    s = await db.settings.find_one({"id": "global"}, {"_id": 0})
    if not s:
        raise HTTPException(status_code=404, detail="Settings not found")
    return s


@api_router.put("/settings")
async def update_settings(body: SettingsModel):
    await db.settings.update_one({"id": "global"}, {"$set": body.model_dump()}, upsert=True)
    s = await db.settings.find_one({"id": "global"}, {"_id": 0})
    return s


@api_router.get("/residents-min")
async def residents_min():
    """Lightweight list for pass-creation dropdown."""
    residents = await db.residents.find({"status": "active"}, {"_id": 0, "id": 1, "name": 1, "apartment": 1}).sort("apartment", 1).to_list(500)
    return residents


@api_router.get("/")
async def root():
    return {"message": "VisitorGuard API", "status": "ok"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await seed_db()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
