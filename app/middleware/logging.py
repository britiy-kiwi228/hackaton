import logging
import json
import time
from fastapi import Request

logger = logging.getLogger("uvicorn")

async def logging_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    user_id = request.headers.get("user_id")

    log_data = {
        "method": request.method,
        "path": request.url.path,
        "status_code": response.status_code,
        "process_time": process_time,
        "user_id": user_id
    }

    logger.info(json.dumps(log_data))
    return response
