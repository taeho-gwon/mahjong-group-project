import logging
import logging.handlers
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import router
from app.config import settings

_LOG_DIR = Path(__file__).parent.parent / "logs"
_LOG_DIR.mkdir(exist_ok=True)

_formatter = logging.Formatter(
    fmt="%(asctime)s %(levelname)s %(name)s %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
_file_handler = logging.handlers.RotatingFileHandler(
    filename=str(_LOG_DIR / "server.log"),
    maxBytes=10 * 1024 * 1024,  # 10 MB
    backupCount=5,
    encoding="utf-8",
)
_file_handler.setFormatter(_formatter)

# root logger (app 로그)
logging.getLogger().addHandler(_file_handler)
logging.getLogger().setLevel(logging.INFO)

# uvicorn 로거는 기본적으로 propagate=False 이므로 직접 추가
# uvicorn.error 는 uvicorn 으로 propagate 되므로 제외
for _name in ("uvicorn", "uvicorn.access"):
    logging.getLogger(_name).addHandler(_file_handler)

app = FastAPI(title="Mahjong Group Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")
