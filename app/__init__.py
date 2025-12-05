from fastapi import FastAPI, HTTPException
from app.middleware.logging import logging_middleware
from app.routers.health import router as health_router
from app.exception_handlers import http_exception_handler, validation_exception_handler
from fastapi.exceptions import RequestValidationError

app = FastAPI()

app.middleware("http")(logging_middleware)

app.include_router(health_router)

app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
