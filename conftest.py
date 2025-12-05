import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.database import Base
from main import app
from app.models import User, Skill, Team, Hackathon, Request
from app.core.security import create_access_token
from app.dependencies.auth import get_current_user
from app.core.config import settings

# Test database configuration
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:?cache=shared"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override get_session dependency
def override_get_session():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()



@pytest.fixture(scope="session")
def db_engine():
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session(db_engine):
    connection = db_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db_session):
    def override_get_current_user():
        user = db_session.query(User).first()
        return user

    app.dependency_overrides[get_current_user] = override_get_current_user

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    def override_get_current_user():
        user = db_session.query(User).first()
        return user

    app.dependency_overrides[get_current_user] = override_get_current_user

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()

@pytest.fixture
def user_factory(db_session):
    def create_user(**kwargs):
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpassword",
            "full_name": "Test User",
        }
        user_data.update(kwargs)
        user = User(**user_data)
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user
    return create_user

@pytest.fixture
def token_factory(user_factory):
    def create_token(user=None):
        if user is None:
            user = user_factory()
        token = create_access_token({"sub": str(user.id)})
        return token
    return create_token

@pytest.fixture
def auth_client(client, token_factory):
    token = token_factory()
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client
